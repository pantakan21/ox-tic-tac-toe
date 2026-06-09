import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { GameService } from './game.service';
import { BoardValidator, Board } from './board-validator';
import { HeuristicBot } from './heuristic-bot';
import { ScoreService } from '../score/score.service';
import { AiCoachService } from './ai-coach.service';
import { LeaderboardService } from '../leaderboard/leaderboard.service';
import { PrismaService } from '../prisma/prisma.service';

const WIN_BOARD: Board = ['X', 'X', 'X', 'O', 'O', null, null, null, null]; // X wins row 0
const DRAW_BOARD: Board = ['X', 'O', 'X', 'X', 'O', 'O', 'O', 'X', 'X'];   // full board, draw
const ONGOING_BOARD: Board = ['X', null, null, null, null, null, null, null, null];

const mockPrisma = {
  gameLog: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
  },
};

const mockScoreService = { applyResult: jest.fn() };
const mockLeaderboardService = { invalidateCache: jest.fn() };
const mockAiCoach = { analyze: jest.fn() };
const mockBot = { getMove: jest.fn() };

describe('GameService', () => {
  let service: GameService;
  let validator: BoardValidator;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GameService,
        BoardValidator,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: HeuristicBot, useValue: mockBot },
        { provide: ScoreService, useValue: mockScoreService },
        { provide: AiCoachService, useValue: mockAiCoach },
        { provide: LeaderboardService, useValue: mockLeaderboardService },
      ],
    }).compile();

    service = module.get<GameService>(GameService);
    validator = module.get<BoardValidator>(BoardValidator);

    mockPrisma.gameLog.create.mockResolvedValue({ id: 'log-1' });
    mockScoreService.applyResult.mockResolvedValue({ scoreDelta: 1, bonusAwarded: false, newStreak: 1 });
    mockLeaderboardService.invalidateCache.mockResolvedValue(undefined);
  });

  afterEach(() => jest.clearAllMocks());

  describe('endGame', () => {
    it('should throw BadRequestException when the game is not finished yet', async () => {
      // Business Rule #2: validate board before recording
      await expect(
        service.endGame('user-1', { board: ONGOING_BOARD, moves: [] }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should call validator.validate before recording any result', async () => {
      // Business Rule #2: server must verify board state
      const validateSpy = jest.spyOn(validator, 'validate');
      await service.endGame('user-1', { board: WIN_BOARD, moves: [] });
      expect(validateSpy).toHaveBeenCalledWith(WIN_BOARD);
    });

    it('should create a GameLog for every completed game', async () => {
      // Business Rule #3: บันทึก GameLog ทุกเกม ไว้ audit trail
      await service.endGame('user-1', { board: WIN_BOARD, moves: [] });
      expect(mockPrisma.gameLog.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ userId: 'user-1', result: 'WIN' }) }),
      );
    });

    it('should use the server-validated result, not client-supplied data', async () => {
      // Business Rule #1: คะแนนคำนวณฝั่ง server เท่านั้น
      await service.endGame('user-1', { board: WIN_BOARD, moves: [] });
      expect(mockScoreService.applyResult).toHaveBeenCalledWith('user-1', 'WIN');
    });

    it('should invalidate leaderboard cache after applying score', async () => {
      // Ensures leaderboard reflects new score immediately
      await service.endGame('user-1', { board: WIN_BOARD, moves: [] });
      const applyOrder = mockScoreService.applyResult.mock.invocationCallOrder[0];
      const invalidateOrder = mockLeaderboardService.invalidateCache.mock.invocationCallOrder[0];
      expect(invalidateOrder).toBeGreaterThan(applyOrder);
    });

    it('should return gameLogId, result, and scoreChange', async () => {
      const result = await service.endGame('user-1', { board: WIN_BOARD, moves: [] });
      expect(result).toEqual({
        gameLogId: 'log-1',
        result: 'WIN',
        scoreChange: expect.objectContaining({ scoreDelta: 1 }),
      });
    });

    it('should correctly identify a DRAW result', async () => {
      await service.endGame('user-1', { board: DRAW_BOARD, moves: [] });
      expect(mockScoreService.applyResult).toHaveBeenCalledWith('user-1', 'DRAW');
    });
  });

  describe('getCoachAnalysis', () => {
    it('should throw NotFoundException when log belongs to another user (IDOR guard)', async () => {
      // กัน IDOR — user ไม่สามารถดู log ของคนอื่นได้
      mockPrisma.gameLog.findUnique.mockResolvedValue({ id: 'log-1', userId: 'other-user', moves: [], result: 'WIN' });
      await expect(service.getCoachAnalysis('user-1', 'log-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException when log does not exist', async () => {
      mockPrisma.gameLog.findUnique.mockResolvedValue(null);
      await expect(service.getCoachAnalysis('user-1', 'nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('should call aiCoach.analyze when log belongs to the requesting user', async () => {
      mockPrisma.gameLog.findUnique.mockResolvedValue({
        id: 'log-1', userId: 'user-1', result: 'WIN',
        moves: [{ player: 'X', position: 0, boardAfter: [] }],
      });
      mockAiCoach.analyze.mockResolvedValue('feedback');
      const result = await service.getCoachAnalysis('user-1', 'log-1');
      expect(mockAiCoach.analyze).toHaveBeenCalled();
      expect(result).toBe('feedback');
    });
  });
});

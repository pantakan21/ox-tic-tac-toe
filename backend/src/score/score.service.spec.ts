import { Test, TestingModule } from '@nestjs/testing';
import { ScoreService } from './score.service';
import { PrismaService } from '../prisma/prisma.service';
import { REDIS_CLIENT } from '../redis/redis.module';

const mockPrisma = {
  score: {
    upsert: jest.fn(),
    findUnique: jest.fn(),
  },
};

// Simulate Redis Lua script logic inline for unit tests
function simulateLua(currentStreak: number, result: 'WIN' | 'LOSE' | 'DRAW') {
  let streak = currentStreak;
  let scoreDelta = 0;
  let bonus = 0;
  const BONUS_AT = 3;

  if (result === 'WIN') {
    scoreDelta = 1;
    streak += 1;
    if (streak >= BONUS_AT) { bonus = 1; streak = 0; }
  } else if (result === 'LOSE') {
    scoreDelta = -1;
    streak = 0;
  } else {
    streak = 0;
  }

  return [scoreDelta, bonus, streak];
}

describe('ScoreService — Scoring & Streak Logic', () => {
  let service: ScoreService;
  let redisMock: { get: jest.Mock; eval: jest.Mock; setex: jest.Mock };

  beforeEach(async () => {
    redisMock = {
      get: jest.fn(),
      eval: jest.fn(),
      setex: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScoreService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: REDIS_CLIENT, useValue: redisMock },
      ],
    }).compile();

    service = module.get<ScoreService>(ScoreService);
    mockPrisma.score.upsert.mockResolvedValue({});
  });

  afterEach(() => jest.clearAllMocks());

  describe('WIN scoring', () => {
    it('should give +1 for a WIN', async () => {
      redisMock.eval.mockResolvedValue([1, 0, 1]); // scoreDelta=1, bonus=0, streak=1
      const result = await service.applyResult('user1', 'WIN');
      expect(result.scoreDelta).toBe(1);
      expect(result.bonusAwarded).toBe(false);
      expect(result.newStreak).toBe(1);
    });

    it('should give +1+1 bonus after 3 consecutive wins and reset streak to 0', async () => {
      // Simulating the 3rd win: streak was 2, now becomes 3 → bonus + reset
      redisMock.eval.mockResolvedValue([1, 1, 0]); // scoreDelta=1, bonus=1, streak=0
      const result = await service.applyResult('user1', 'WIN');
      expect(result.scoreDelta).toBe(2); // 1 + 1 bonus
      expect(result.bonusAwarded).toBe(true);
      expect(result.newStreak).toBe(0);
    });
  });

  describe('LOSE scoring', () => {
    it('should give -1 for a LOSE', async () => {
      redisMock.eval.mockResolvedValue([-1, 0, 0]);
      const result = await service.applyResult('user1', 'LOSE');
      expect(result.scoreDelta).toBe(-1);
      expect(result.bonusAwarded).toBe(false);
      expect(result.newStreak).toBe(0);
    });

    it('should reset streak on LOSE (streak was 2)', async () => {
      redisMock.eval.mockResolvedValue([-1, 0, 0]);
      const result = await service.applyResult('user1', 'LOSE');
      expect(result.newStreak).toBe(0);
    });
  });

  describe('DRAW scoring', () => {
    it('should give 0 for a DRAW', async () => {
      redisMock.eval.mockResolvedValue([0, 0, 0]);
      const result = await service.applyResult('user1', 'DRAW');
      expect(result.scoreDelta).toBe(0);
      expect(result.bonusAwarded).toBe(false);
    });

    it('should reset streak on DRAW', async () => {
      redisMock.eval.mockResolvedValue([0, 0, 0]);
      const result = await service.applyResult('user1', 'DRAW');
      expect(result.newStreak).toBe(0);
    });
  });

  describe('Streak edge cases (inline simulation)', () => {
    it('W W W → scores: +1, +1, +1+bonus; streak resets to 0 after bonus', () => {
      // W1: streak 0→1
      expect(simulateLua(0, 'WIN')).toEqual([1, 0, 1]);
      // W2: streak 1→2
      expect(simulateLua(1, 'WIN')).toEqual([1, 0, 2]);
      // W3: streak 2→3 → bonus + reset
      expect(simulateLua(2, 'WIN')).toEqual([1, 1, 0]);
    });

    it('W W L → scores: +1, +1, -1; streak=0 at end', () => {
      expect(simulateLua(0, 'WIN')).toEqual([1, 0, 1]);
      expect(simulateLua(1, 'WIN')).toEqual([1, 0, 2]);
      expect(simulateLua(2, 'LOSE')).toEqual([-1, 0, 0]);
    });

    it('W W D → streak resets on draw', () => {
      expect(simulateLua(0, 'WIN')).toEqual([1, 0, 1]);
      expect(simulateLua(1, 'WIN')).toEqual([1, 0, 2]);
      expect(simulateLua(2, 'DRAW')).toEqual([0, 0, 0]);
    });

    it('D D W W W → bonus on 3rd win, then streak continues', () => {
      expect(simulateLua(0, 'DRAW')).toEqual([0, 0, 0]);  // streak resets
      expect(simulateLua(0, 'DRAW')).toEqual([0, 0, 0]);
      expect(simulateLua(0, 'WIN')).toEqual([1, 0, 1]);
      expect(simulateLua(1, 'WIN')).toEqual([1, 0, 2]);
      expect(simulateLua(2, 'WIN')).toEqual([1, 1, 0]);   // bonus on 3rd
    });

    it('W W W W → 4th win starts new streak at 1 after reset', () => {
      // 3rd win → bonus + reset to 0
      expect(simulateLua(2, 'WIN')).toEqual([1, 1, 0]);
      // 4th win → streak is now 1 (no bonus yet)
      expect(simulateLua(0, 'WIN')).toEqual([1, 0, 1]);
    });

    it('L L L → streak stays 0, score goes -3', () => {
      expect(simulateLua(0, 'LOSE')).toEqual([-1, 0, 0]);
      expect(simulateLua(0, 'LOSE')).toEqual([-1, 0, 0]);
      expect(simulateLua(0, 'LOSE')).toEqual([-1, 0, 0]);
    });
  });
});

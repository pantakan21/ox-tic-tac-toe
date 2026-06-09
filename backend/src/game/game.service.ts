import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BoardValidator, Board, Cell } from './board-validator';
import { HeuristicBot } from './heuristic-bot';
import { ScoreService } from '../score/score.service';
import { AiCoachService } from './ai-coach.service';
import { EndGameDto } from './dto/move.dto';

@Injectable()
export class GameService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly validator: BoardValidator,
    private readonly bot: HeuristicBot,
    private readonly scoreService: ScoreService,
    private readonly aiCoach: AiCoachService,
  ) {}

  getBotMove(board: Board): number {
    this.validator.validate(board);
    return this.bot.getMove(board);
  }

  async endGame(userId: string, dto: EndGameDto) {
    const board = dto.board as Board;
    this.validator.validate(board);

    const result = this.validator.getResult(board);
    if (!result) throw new BadRequestException('Game is not finished yet');

    const [gameLog] = await Promise.all([
      this.prisma.gameLog.create({
        data: { userId, result, moves: dto.moves as object[] },
      }),
    ]);

    const scoreResult = await this.scoreService.applyResult(userId, result);

    return { gameLogId: gameLog.id, result, scoreChange: scoreResult };
  }

  async getCoachAnalysis(userId: string, gameLogId: string): Promise<string> {
    const log = await this.prisma.gameLog.findUnique({ where: { id: gameLogId } });
    if (!log || log.userId !== userId) throw new NotFoundException('Game log not found');

    const moves = log.moves as Array<{ player: string; position: number; boardAfter: Cell[] }>;
    const typedMoves = moves.map((m) => ({
      player: m.player as 'X' | 'O',
      position: m.position,
      boardAfter: m.boardAfter,
    }));

    return this.aiCoach.analyze(typedMoves, log.result);
  }

  async getHistory(userId: string) {
    return this.prisma.gameLog.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: { id: true, result: true, createdAt: true },
    });
  }
}

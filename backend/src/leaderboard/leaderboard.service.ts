import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

type DifficultyFilter = 'EASY' | 'MEDIUM' | 'HARD';

@Injectable()
export class LeaderboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getTop50() {
    return this.prisma.score.findMany({
      orderBy: { totalScore: 'desc' },
      take: 50,
      include: { user: { select: { name: true, image: true } } },
    });
  }

  async getTop50ByDifficulty(difficulty: DifficultyFilter) {
    const logs = await this.prisma.gameLog.groupBy({
      by: ['userId'],
      where: { difficulty },
      _count: { result: true },
    });

    const userIds = logs.map((l) => l.userId);
    if (userIds.length === 0) return [];

    const details = await this.prisma.gameLog.findMany({
      where: { difficulty, userId: { in: userIds } },
      select: { userId: true, result: true, user: { select: { name: true, image: true } } },
    });

    const map = new Map<string, { userId: string; wins: number; losses: number; draws: number; totalScore: number; user: { name: string; image?: string | null } }>();

    for (const log of details) {
      if (!map.has(log.userId)) {
        map.set(log.userId, { userId: log.userId, wins: 0, losses: 0, draws: 0, totalScore: 0, user: log.user });
      }
      const entry = map.get(log.userId)!;
      if (log.result === 'WIN') { entry.wins++; entry.totalScore++; }
      else if (log.result === 'LOSE') { entry.losses++; entry.totalScore--; }
      else { entry.draws++; }
    }

    return [...map.values()].sort((a, b) => b.totalScore - a.totalScore).slice(0, 50);
  }
}

import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { REDIS_CLIENT } from '../redis/redis.module';
import Redis from 'ioredis';

const STREAK_KEY = (userId: string) => `streak:${userId}`;
const STREAK_BONUS_AT = 3;

@Injectable()
export class ScoreService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  /**
   * Atomically compute and persist score/streak.
   * All streak state lives in Redis; MySQL stores the totals.
   */
  async applyResult(userId: string, result: 'WIN' | 'LOSE' | 'DRAW') {
    const streakKey = STREAK_KEY(userId);

    // Lua script: atomic read-increment-reset of streak
    const luaScript = `
      local key = KEYS[1]
      local result = ARGV[1]
      local streak = tonumber(redis.call('GET', key) or '0')
      local bonus = 0
      local scoreDelta = 0

      if result == 'WIN' then
        scoreDelta = 1
        streak = streak + 1
        if streak >= ${STREAK_BONUS_AT} then
          bonus = 1
          streak = 0
        end
      elseif result == 'LOSE' then
        scoreDelta = -1
        streak = 0
      else
        streak = 0
      end

      redis.call('SET', key, streak)
      return {scoreDelta, bonus, streak}
    `;

    const [scoreDelta, bonus, newStreak] = (await this.redis.eval(
      luaScript,
      1,
      streakKey,
      result,
    )) as [number, number, number];

    const totalDelta = scoreDelta + bonus;

    await this.prisma.score.upsert({
      where: { userId },
      create: {
        userId,
        totalScore: totalDelta,
        currentStreak: newStreak,
        wins: result === 'WIN' ? 1 : 0,
        losses: result === 'LOSE' ? 1 : 0,
        draws: result === 'DRAW' ? 1 : 0,
      },
      update: {
        totalScore: { increment: totalDelta },
        currentStreak: newStreak,
        wins: result === 'WIN' ? { increment: 1 } : undefined,
        losses: result === 'LOSE' ? { increment: 1 } : undefined,
        draws: result === 'DRAW' ? { increment: 1 } : undefined,
      },
    });

    return { scoreDelta: totalDelta, bonusAwarded: bonus > 0, newStreak };
  }

  async getMyScore(userId: string) {
    return this.prisma.score.findUnique({
      where: { userId },
      include: { user: { select: { name: true, image: true } } },
    });
  }
}

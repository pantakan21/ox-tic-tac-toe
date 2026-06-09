import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { REDIS_CLIENT } from '../redis/redis.module';
import Redis from 'ioredis';

const LEADERBOARD_CACHE_KEY = 'leaderboard:top50';
const CACHE_TTL_SECONDS = 60;

@Injectable()
export class LeaderboardService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  async getTop50() {
    const cached = await this.redis.get(LEADERBOARD_CACHE_KEY);
    if (cached) return JSON.parse(cached) as unknown[];

    const data = await this.prisma.score.findMany({
      orderBy: { totalScore: 'desc' },
      take: 50,
      include: { user: { select: { name: true, image: true } } },
    });

    await this.redis.setex(LEADERBOARD_CACHE_KEY, CACHE_TTL_SECONDS, JSON.stringify(data));
    return data;
  }
}

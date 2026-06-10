import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

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
}

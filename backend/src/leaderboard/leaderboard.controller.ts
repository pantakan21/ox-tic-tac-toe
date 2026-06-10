import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiResponse, ApiTags } from '@nestjs/swagger';
import { LeaderboardService } from './leaderboard.service';

@ApiTags('leaderboard')
@Controller('leaderboard')
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  @Get()
  @ApiOperation({ summary: 'Get top 50 players, optionally filtered by difficulty' })
  @ApiQuery({ name: 'difficulty', required: false, enum: ['easy', 'medium', 'hard'] })
  @ApiResponse({ status: 200, description: 'Top 50 players by score' })
  getTop50(@Query('difficulty') difficulty?: string) {
    const map = { easy: 'EASY', medium: 'MEDIUM', hard: 'HARD' } as const;
    const d = map[difficulty as keyof typeof map];
    if (d) return this.leaderboardService.getTop50ByDifficulty(d);
    return this.leaderboardService.getTop50();
  }
}

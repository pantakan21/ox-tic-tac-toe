import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { LeaderboardService } from './leaderboard.service';

@ApiTags('leaderboard')
@Controller('leaderboard')
export class LeaderboardController {
  constructor(private readonly leaderboardService: LeaderboardService) {}

  @Get()
  @ApiOperation({ summary: 'Get top 50 players (public)' })
  @ApiResponse({ status: 200, description: 'Top 50 players by total score' })
  getTop50() {
    return this.leaderboardService.getTop50();
  }
}

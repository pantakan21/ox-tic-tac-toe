import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type { UserPayload } from '../common/decorators/current-user.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ScoreService } from './score.service';

@ApiTags('score')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('score')
export class ScoreController {
  constructor(private readonly scoreService: ScoreService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get my current score and streak' })
  @ApiResponse({ status: 200, description: 'Score data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  getMyScore(@CurrentUser() user: UserPayload) {
    return this.scoreService.getMyScore(user.sub);
  }
}

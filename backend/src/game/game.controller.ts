import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type { UserPayload } from '../common/decorators/current-user.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { GameService } from './game.service';
import { MakeMoveDto, EndGameDto, CoachRequestDto } from './dto/move.dto';

@ApiTags('game')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('game')
export class GameController {
  constructor(private readonly gameService: GameService) {}

  @Post('bot-move')
  @ApiOperation({ summary: 'Get bot next move given current board' })
  @ApiResponse({ status: 200, description: 'Bot move position (0-8)' })
  @ApiResponse({ status: 400, description: 'Invalid board state' })
  getBotMove(@Body() dto: MakeMoveDto) {
    const position = this.gameService.getBotMove(dto.board as ('X' | 'O' | null)[], dto.difficulty);
    return { position };
  }

  @Post('end')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Record game result and update score' })
  @ApiResponse({ status: 201, description: 'Game recorded, score updated' })
  @ApiResponse({ status: 400, description: 'Invalid board or game not finished' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  endGame(@Body() dto: EndGameDto, @CurrentUser() user: UserPayload) {
    return this.gameService.endGame(user.sub, dto);
  }

  @Post('coach')
  @ApiOperation({ summary: 'Request AI coach analysis for a finished game' })
  @ApiResponse({ status: 200, description: 'AI coach feedback text' })
  async getCoachAnalysis(@Body() dto: CoachRequestDto, @CurrentUser() user: UserPayload) {
    const feedback = await this.gameService.getCoachAnalysis(user.sub, dto.gameLogId);
    return { feedback };
  }

  @Get('history')
  @ApiOperation({ summary: 'Get recent game history for current user' })
  @ApiResponse({ status: 200, description: 'List of game logs' })
  getHistory(@CurrentUser() user: UserPayload) {
    return this.gameService.getHistory(user.sub);
  }
}

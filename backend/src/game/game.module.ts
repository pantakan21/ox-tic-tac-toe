import { Module } from '@nestjs/common';
import { GameController } from './game.controller';
import { GameService } from './game.service';
import { BoardValidator } from './board-validator';
import { HeuristicBot } from './heuristic-bot';
import { ScoreModule } from '../score/score.module';
import { AiCoachService } from './ai-coach.service';

@Module({
  imports: [ScoreModule],
  controllers: [GameController],
  providers: [GameService, BoardValidator, HeuristicBot, AiCoachService],
})
export class GameModule {}

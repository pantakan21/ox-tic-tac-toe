import { IsArray, IsInt, IsString, IsOptional, IsIn, Max, Min, ArrayMinSize, ArrayMaxSize } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { Difficulty } from '../heuristic-bot';

export class MakeMoveDto {
  @ApiProperty({ description: 'Current board state (9 cells: X | O | null)', example: ['X', null, null, null, null, null, null, null, null] })
  @IsArray()
  @ArrayMinSize(9)
  @ArrayMaxSize(9)
  board: (string | null)[];

  @ApiProperty({ description: 'Position to place (0-8)', example: 4 })
  @IsInt()
  @Min(0)
  @Max(8)
  position: number;

  @ApiPropertyOptional({ description: 'Bot difficulty', enum: ['easy', 'medium', 'hard'], default: 'medium' })
  @IsOptional()
  @IsIn(['easy', 'medium', 'hard'])
  difficulty?: Difficulty;
}

export class EndGameDto {
  @ApiProperty({ description: 'Final board state (9 cells)' })
  @IsArray()
  @ArrayMinSize(9)
  @ArrayMaxSize(9)
  board: (string | null)[];

  @ApiProperty({ description: 'All moves in order' })
  @IsArray()
  moves: unknown[];

  @ApiPropertyOptional({ description: 'Bot difficulty used in this game', enum: ['easy', 'medium', 'hard'], default: 'medium' })
  @IsOptional()
  @IsIn(['easy', 'medium', 'hard'])
  difficulty?: 'easy' | 'medium' | 'hard';
}

export class CoachRequestDto {
  @ApiProperty({ description: 'GameLog ID to analyze' })
  @IsString()
  gameLogId: string;
}

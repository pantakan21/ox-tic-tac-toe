import { IsArray, IsInt, IsString, Max, Min, ArrayMinSize, ArrayMaxSize } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

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
}

export class CoachRequestDto {
  @ApiProperty({ description: 'GameLog ID to analyze' })
  @IsString()
  gameLogId: string;
}

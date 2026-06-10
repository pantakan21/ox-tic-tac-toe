import { Injectable } from '@nestjs/common';
import { Board, BoardValidator } from './board-validator';

export type Difficulty = 'easy' | 'medium' | 'hard';

// Probability of making a random (non-strategic) move per difficulty
const MISTAKE_RATE: Record<Difficulty, number> = {
  easy: 0.95,
  medium: 0.6,
  hard: 0.1,
};

@Injectable()
export class HeuristicBot {
  constructor(private readonly validator: BoardValidator) {}

  getMove(board: Board, difficulty: Difficulty = 'medium'): number {
    const empty = board.map((c, i) => (c === null ? i : -1)).filter((i) => i !== -1);
    if (empty.length === 0) throw new Error('No moves available');

    if (Math.random() < MISTAKE_RATE[difficulty]) {
      return empty[Math.floor(Math.random() * empty.length)];
    }

    const win = this.findWinningMove(board, 'O');
    if (win !== -1) return win;

    const block = this.findWinningMove(board, 'X');
    if (block !== -1) return block;

    if (board[4] === null) return 4;

    const corners = [0, 2, 6, 8].filter((i) => board[i] === null);
    if (corners.length > 0) return corners[Math.floor(Math.random() * corners.length)];

    return empty[Math.floor(Math.random() * empty.length)];
  }

  private findWinningMove(board: Board, player: 'X' | 'O'): number {
    const empty = board.map((c, i) => (c === null ? i : -1)).filter((i) => i !== -1);
    for (const idx of empty) {
      const copy = [...board] as Board;
      copy[idx] = player;
      if (this.validator.checkWinner(copy, player)) return idx;
    }
    return -1;
  }
}

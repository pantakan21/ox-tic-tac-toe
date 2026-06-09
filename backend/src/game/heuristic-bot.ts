import { Injectable } from '@nestjs/common';
import { Board, BoardValidator } from './board-validator';

/**
 * Heuristic bot — smart but beatable.
 * Priority: win > block > center > corner > random
 * Introduces intentional mistakes (~20% chance) to keep the game winnable.
 */
@Injectable()
export class HeuristicBot {
  private static readonly MISTAKE_RATE = 0.8;

  constructor(private readonly validator: BoardValidator) {}

  getMove(board: Board): number {
    const empty = board.map((c, i) => (c === null ? i : -1)).filter((i) => i !== -1);
    if (empty.length === 0) throw new Error('No moves available');

    // Introduce random mistakes to keep game winnable
    if (Math.random() < HeuristicBot.MISTAKE_RATE) {
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

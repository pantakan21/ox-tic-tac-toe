import { Injectable, BadRequestException } from '@nestjs/common';

export type Cell = 'X' | 'O' | null;
export type Board = Cell[];
export type GameResult = 'WIN' | 'LOSE' | 'DRAW' | null;

const WINNING_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
  [0, 4, 8], [2, 4, 6],             // diagonals
];

@Injectable()
export class BoardValidator {
  validate(board: Board): void {
    if (board.length !== 9) throw new BadRequestException('Board must have 9 cells');

    const xCount = board.filter((c) => c === 'X').length;
    const oCount = board.filter((c) => c === 'O').length;

    // X goes first, so xCount === oCount or xCount === oCount + 1
    if (xCount - oCount < 0 || xCount - oCount > 1) {
      throw new BadRequestException('Invalid board: move count mismatch');
    }

    const xWins = this.checkWinner(board, 'X');
    const oWins = this.checkWinner(board, 'O');

    if (xWins && oWins) {
      throw new BadRequestException('Invalid board: two winners impossible');
    }
  }

  checkWinner(board: Board, player: 'X' | 'O'): boolean {
    return WINNING_LINES.some(([a, b, c]) =>
      board[a] === player && board[b] === player && board[c] === player,
    );
  }

  getWinningLine(board: Board, player: 'X' | 'O'): number[] | null {
    return WINNING_LINES.find(([a, b, c]) =>
      board[a] === player && board[b] === player && board[c] === player,
    ) ?? null;
  }

  isFull(board: Board): boolean {
    return board.every((c) => c !== null);
  }

  /** Determine result from human (X) perspective */
  getResult(board: Board): GameResult {
    if (this.checkWinner(board, 'X')) return 'WIN';
    if (this.checkWinner(board, 'O')) return 'LOSE';
    if (this.isFull(board)) return 'DRAW';
    return null;
  }
}

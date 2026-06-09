import { BadRequestException } from '@nestjs/common';
import { BoardValidator, type Board } from './board-validator';

describe('BoardValidator', () => {
  let validator: BoardValidator;

  beforeEach(() => { validator = new BoardValidator(); });

  const b = (...cells: (string | null)[]): Board => cells as Board;

  describe('validate()', () => {
    it('should accept a valid empty board', () => {
      expect(() => validator.validate(b(null,null,null,null,null,null,null,null,null))).not.toThrow();
    });

    it('should accept valid mid-game board (X=2, O=1)', () => {
      expect(() => validator.validate(b('X','O',null,'X',null,null,null,null,null))).not.toThrow();
    });

    it('should accept board where X won and empty cells remain', () => {
      // X wins top row, O has 2 moves, game stops on X win
      expect(() => validator.validate(b('X','X','X','O','O',null,null,null,null))).not.toThrow();
    });

    it('should reject board with 9 X and 0 O (invalid counts)', () => {
      expect(() => validator.validate(b('X','X','X','X','X','X','X','X','X')))
        .toThrow(BadRequestException);
    });

    it('should reject board where O has more moves than X', () => {
      expect(() => validator.validate(b('O','O',null,'X',null,null,null,null,null)))
        .toThrow(BadRequestException);
    });

    it('should reject board where X has 2+ more moves than O', () => {
      expect(() => validator.validate(b('X','X','X',null,null,null,null,null,null)))
        .toThrow(BadRequestException);
    });

    it('should reject board with wrong cell count (< 9)', () => {
      expect(() => validator.validate(['X','O'] as Board)).toThrow(BadRequestException);
    });

    it('should reject board with two winners (impossible state)', () => {
      // X wins row 0, O wins row 1 — impossible in real game
      expect(() => validator.validate(b('X','X','X','O','O','O',null,null,null)))
        .toThrow(BadRequestException);
    });
  });

  describe('checkWinner()', () => {
    it('should detect X winning top row', () => {
      expect(validator.checkWinner(b('X','X','X',null,null,null,null,null,null), 'X')).toBe(true);
    });

    it('should detect O winning diagonal', () => {
      expect(validator.checkWinner(b('O',null,null,null,'O',null,null,null,'O'), 'O')).toBe(true);
    });

    it('should return false when no winner', () => {
      expect(validator.checkWinner(b('X','O','X','O','X','O','O','X','O'), 'X')).toBe(false);
    });
  });

  describe('getResult()', () => {
    it('should return WIN when X wins', () => {
      expect(validator.getResult(b('X','X','X','O','O',null,null,null,null))).toBe('WIN');
    });

    it('should return LOSE when O wins', () => {
      expect(validator.getResult(b('O','O','O','X','X',null,null,null,null))).toBe('LOSE');
    });

    it('should return DRAW on full board with no winner', () => {
      expect(validator.getResult(b('X','O','X','O','X','O','O','X','O'))).toBe('DRAW');
    });

    it('should return null when game is not finished', () => {
      expect(validator.getResult(b('X',null,null,null,'O',null,null,null,null))).toBeNull();
    });
  });

  describe('isFull()', () => {
    it('should return true on full board', () => {
      expect(validator.isFull(b('X','O','X','O','X','O','O','X','O'))).toBe(true);
    });

    it('should return false when board has empty cells', () => {
      expect(validator.isFull(b('X',null,null,null,null,null,null,null,null))).toBe(false);
    });
  });
});

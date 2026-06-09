import { HeuristicBot } from './heuristic-bot';
import { BoardValidator, Board } from './board-validator';

describe('HeuristicBot', () => {
  let bot: HeuristicBot;
  let validator: BoardValidator;

  beforeEach(() => {
    validator = new BoardValidator();
    bot = new HeuristicBot(validator);
  });

  afterEach(() => jest.restoreAllMocks());

  describe('strategy path (no mistake)', () => {
    beforeEach(() => {
      // random >= MISTAKE_RATE(0.8) → skip random branch, enter strategy
      jest.spyOn(Math, 'random').mockReturnValue(0.99);
    });

    it('should take the winning move when O can win', () => {
      // O has [0,1], index 2 is the win
      const board: Board = ['O', 'O', null, 'X', 'X', null, null, null, null];
      expect(bot.getMove(board)).toBe(2);
    });

    it('should block X from winning (block priority)', () => {
      // X has [3,4], index 5 is the block — O has no win of its own
      const board: Board = [null, null, null, 'X', 'X', null, null, null, null];
      expect(bot.getMove(board)).toBe(5);
    });

    it('should prefer winning over blocking when both available', () => {
      // O can win at 2 (O has [0,1]); X can win at 5 (X has [3,4])
      // Win > Block → must choose 2
      const board: Board = ['O', 'O', null, 'X', 'X', null, null, null, null];
      expect(bot.getMove(board)).toBe(2);
    });

    it('should take center on a mostly empty board', () => {
      // No win/block available, center free
      const board: Board = ['X', null, null, null, null, null, null, null, null];
      expect(bot.getMove(board)).toBe(4);
    });

    it('should take a corner when center is occupied and no win/block', () => {
      // Center taken, corners [0,2,6,8] available
      const board: Board = [null, null, null, null, 'X', null, null, null, null];
      const move = bot.getMove(board);
      expect([0, 2, 6, 8]).toContain(move);
    });
  });

  describe('mistake path', () => {
    it('should return any empty cell when random < MISTAKE_RATE', () => {
      // random < 0.8 → skip strategy, pick random empty
      jest.spyOn(Math, 'random').mockReturnValue(0.0);
      const board: Board = ['X', null, null, null, 'O', null, null, null, null];
      const empty = [1, 2, 3, 5, 6, 7, 8];
      const move = bot.getMove(board);
      expect(empty).toContain(move);
    });
  });

  it('should throw when the board is full', () => {
    // Full board — no moves available
    const board: Board = ['X', 'O', 'X', 'O', 'X', 'O', 'O', 'X', 'O'];
    expect(() => bot.getMove(board)).toThrow('No moves available');
  });
});

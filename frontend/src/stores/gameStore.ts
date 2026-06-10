'use client';
import { create } from 'zustand';

export type Cell = 'X' | 'O' | null;
export type GameStatus = 'idle' | 'playing' | 'win' | 'lose' | 'draw';
export type Difficulty = 'easy' | 'medium' | 'hard';

export interface MoveRecord {
  player: 'X' | 'O';
  position: number;
  boardAfter: Cell[];
}

interface GameState {
  board: Cell[];
  status: GameStatus;
  moves: MoveRecord[];
  lastGameLogId: string | null;
  coachFeedback: string | null;
  isLoadingBot: boolean;
  isLoadingCoach: boolean;
  difficulty: Difficulty;

  setBoard: (board: Cell[]) => void;
  setStatus: (status: GameStatus) => void;
  addMove: (move: MoveRecord) => void;
  setLastGameLogId: (id: string) => void;
  setCoachFeedback: (feedback: string) => void;
  setIsLoadingBot: (loading: boolean) => void;
  setIsLoadingCoach: (loading: boolean) => void;
  setDifficulty: (difficulty: Difficulty) => void;
  resetGame: () => void;
}

const initialBoard: Cell[] = Array(9).fill(null);

export const useGameStore = create<GameState>((set) => ({
  board: initialBoard,
  status: 'idle',
  moves: [],
  lastGameLogId: null,
  coachFeedback: null,
  isLoadingBot: false,
  isLoadingCoach: false,
  difficulty: 'medium',

  setBoard: (board) => set({ board }),
  setStatus: (status) => set({ status }),
  addMove: (move) => set((s) => ({ moves: [...s.moves, move] })),
  setLastGameLogId: (id) => set({ lastGameLogId: id }),
  setCoachFeedback: (feedback) => set({ coachFeedback: feedback }),
  setIsLoadingBot: (isLoadingBot) => set({ isLoadingBot }),
  setIsLoadingCoach: (isLoadingCoach) => set({ isLoadingCoach }),
  setDifficulty: (difficulty) => set({ difficulty }),
  resetGame: () =>
    set({ board: initialBoard, status: 'idle', moves: [], lastGameLogId: null, coachFeedback: null }),
}));

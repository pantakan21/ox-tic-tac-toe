'use client';
import { create } from 'zustand';

export type Cell = 'X' | 'O' | null;
export type GameStatus = 'idle' | 'playing' | 'win' | 'lose' | 'draw';

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

  setBoard: (board: Cell[]) => void;
  setStatus: (status: GameStatus) => void;
  addMove: (move: MoveRecord) => void;
  setLastGameLogId: (id: string) => void;
  setCoachFeedback: (feedback: string) => void;
  setIsLoadingBot: (loading: boolean) => void;
  setIsLoadingCoach: (loading: boolean) => void;
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

  setBoard: (board) => set({ board }),
  setStatus: (status) => set({ status }),
  addMove: (move) => set((s) => ({ moves: [...s.moves, move] })),
  setLastGameLogId: (id) => set({ lastGameLogId: id }),
  setCoachFeedback: (feedback) => set({ coachFeedback: feedback }),
  setIsLoadingBot: (isLoadingBot) => set({ isLoadingBot }),
  setIsLoadingCoach: (isLoadingCoach) => set({ isLoadingCoach }),
  resetGame: () =>
    set({ board: initialBoard, status: 'idle', moves: [], lastGameLogId: null, coachFeedback: null }),
}));

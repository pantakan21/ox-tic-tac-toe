'use client';
import { useCallback } from 'react';
import { useGameStore, type Cell } from '@/stores/gameStore';
import { useUserStore } from '@/stores/userStore';
import { api } from '@/lib/api';

const WIN_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
];

function getWinLine(board: Cell[]): number[] | null {
  for (const line of WIN_LINES) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return line;
  }
  return null;
}

export default function GameBoard() {
  const { board, status, moves, isLoadingBot, setBoard, setStatus, addMove, setLastGameLogId, setIsLoadingBot } = useGameStore();
  const { token } = useUserStore();

  const winLine = getWinLine(board);

  const handleCellClick = useCallback(async (index: number) => {
    if (!token || board[index] || status !== 'playing' || isLoadingBot) return;

    // Human move (X)
    const newBoard = [...board] as Cell[];
    newBoard[index] = 'X';
    const humanMove = { player: 'X' as const, position: index, boardAfter: [...newBoard] };
    addMove(humanMove);
    setBoard(newBoard);

    // Check if human won
    if (getWinLine(newBoard)) {
      setStatus('win');
      const allMoves = [...moves, humanMove];
      try {
        const res = await api.endGame(newBoard, allMoves, token);
        setLastGameLogId(res.gameLogId);
      } catch {}
      return;
    }
    if (newBoard.every(Boolean)) {
      setStatus('draw');
      const allMoves = [...moves, humanMove];
      try {
        const res = await api.endGame(newBoard, allMoves, token);
        setLastGameLogId(res.gameLogId);
      } catch {}
      return;
    }

    // Bot move
    setIsLoadingBot(true);
    try {
      const [{ position }] = await Promise.all([
        api.getBotMove(newBoard, index, token),
        new Promise((r) => setTimeout(r, 600)),
      ]);
      const botBoard = [...newBoard] as Cell[];
      botBoard[position] = 'O';
      const botMove = { player: 'O' as const, position, boardAfter: [...botBoard] };
      addMove(botMove);
      setBoard(botBoard);

      const allMoves = [...moves, humanMove, botMove];
      if (getWinLine(botBoard)) {
        setStatus('lose');
        const res = await api.endGame(botBoard, allMoves, token);
        setLastGameLogId(res.gameLogId);
      } else if (botBoard.every(Boolean)) {
        setStatus('draw');
        const res = await api.endGame(botBoard, allMoves, token);
        setLastGameLogId(res.gameLogId);
      }
    } finally {
      setIsLoadingBot(false);
    }
  }, [board, status, moves, token, isLoadingBot, addMove, setBoard, setStatus, setLastGameLogId, setIsLoadingBot]);

  return (
    <div className="grid grid-cols-3 gap-2 w-72 mx-auto">
      {board.map((cell, i) => {
        const isWinCell = winLine?.includes(i);
        return (
          <button
            key={i}
            onClick={() => handleCellClick(i)}
            disabled={!!cell || status !== 'playing' || isLoadingBot}
            className={`
              h-24 w-24 text-4xl font-bold rounded-lg border-2 transition-all
              ${cell || isLoadingBot ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-slate-100'}
              ${isWinCell ? 'bg-yellow-100 border-yellow-400' : 'bg-white border-slate-200'}
              ${cell === 'X' ? 'text-blue-600' : 'text-red-500'}
            `}
          >
            {cell}
          </button>
        );
      })}
    </div>
  );
}

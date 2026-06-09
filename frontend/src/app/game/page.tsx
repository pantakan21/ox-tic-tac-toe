'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import GameBoard from '@/components/game/GameBoard';
import CoachModal from '@/components/game/CoachModal';
import { useGameStore } from '@/stores/gameStore';
import { useUserStore } from '@/stores/userStore';
import { api } from '@/lib/api';

export default function GamePage() {
  const router = useRouter();
  const { token, name, clearToken } = useUserStore();
  const { status, setStatus, resetGame } = useGameStore();
  const [showCoach, setShowCoach] = useState(false);
  const [score, setScore] = useState<{ totalScore: number; currentStreak: number } | null>(null);

  useEffect(() => {
    if (!token) { router.replace('/'); return; }
    api.getMyScore(token).then(setScore).catch(() => {});
  }, [token, router, status]);

  const startGame = () => {
    resetGame();
    setStatus('playing');
  };

  const statusMessages = {
    idle: null,
    playing: '🎮 เกมกำลังดำเนินอยู่ — คุณเล่นเป็น X',
    win: '🎉 คุณชนะ!',
    lose: '😢 คุณแพ้',
    draw: '🤝 เสมอ',
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-700 text-white p-6">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">OX Game</h1>
            <p className="text-slate-300 text-sm">สวัสดี, {name}</p>
          </div>
          <div className="text-right">
            {score && (
              <div className="text-sm">
                <p>คะแนน: <span className="font-bold text-yellow-400">{score.totalScore}</span></p>
                <p>Streak: <span className="font-bold text-green-400">{score.currentStreak}</span></p>
              </div>
            )}
            <button
              onClick={() => { clearToken(); router.replace('/'); }}
              className="text-xs text-slate-400 hover:text-white mt-1"
            >
              ออกจากระบบ
            </button>
          </div>
        </div>

        {/* Status */}
        {statusMessages[status] && (
          <div className={`text-center text-xl font-semibold mb-6 py-3 rounded-lg ${
            status === 'win' ? 'bg-green-600/30' :
            status === 'lose' ? 'bg-red-600/30' :
            status === 'draw' ? 'bg-yellow-600/30' : 'bg-slate-600/30'
          }`}>
            {statusMessages[status]}
          </div>
        )}

        {/* Board */}
        <div className="bg-white/5 rounded-2xl p-6 mb-6">
          {status === 'idle' ? (
            <div className="text-center py-8">
              <p className="text-slate-300 mb-4">พร้อมเล่นเกม Tic-tac-toe กับบอท AI?</p>
              <button
                onClick={startGame}
                className="px-8 py-3 bg-blue-600 rounded-xl text-lg font-semibold hover:bg-blue-500 transition"
              >
                เริ่มเกม
              </button>
            </div>
          ) : (
            <GameBoard />
          )}
        </div>

        {/* Post-game actions */}
        {['win', 'lose', 'draw'].includes(status) && (
          <div className="flex gap-3">
            <button
              onClick={startGame}
              className="flex-1 py-3 bg-blue-600 rounded-xl font-semibold hover:bg-blue-500"
            >
              เล่นอีกครั้ง
            </button>
            <button
              onClick={() => setShowCoach(true)}
              className="flex-1 py-3 bg-purple-600 rounded-xl font-semibold hover:bg-purple-500"
            >
              🤖 AI Coach
            </button>
            <button
              onClick={() => router.push('/leaderboard')}
              className="flex-1 py-3 bg-slate-600 rounded-xl font-semibold hover:bg-slate-500"
            >
              Leaderboard
            </button>
          </div>
        )}
      </div>

      {showCoach && <CoachModal onClose={() => setShowCoach(false)} />}
    </div>
  );
}

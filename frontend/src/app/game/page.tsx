'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import GameBoard from '@/components/game/GameBoard';
import CoachModal from '@/components/game/CoachModal';
import { useGameStore, type Difficulty } from '@/stores/gameStore';
import { useUserStore } from '@/stores/userStore';
import { api } from '@/lib/api';

export default function GamePage() {
  const router = useRouter();
  const { token, name, clearToken } = useUserStore();
  const { status, setStatus, resetGame, difficulty, setDifficulty } = useGameStore();
  const [showCoach, setShowCoach] = useState(false);
  const [score, setScore] = useState<{ totalScore: number; currentStreak: number } | null>(null);
  const [isUpdatingScore, setIsUpdatingScore] = useState(false);

  useEffect(() => {
    if (!token) { router.replace('/'); return; }
    api.getMyScore(token).then(setScore).catch(() => {});
  }, [token, router]);

  useEffect(() => {
    if (!token) return;
    if (['win', 'lose', 'draw'].includes(status)) {
      setIsUpdatingScore(true);
      setTimeout(() => {
        api.getMyScore(token).then(setScore).catch(() => {}).finally(() => setIsUpdatingScore(false));
      }, 1000);
    }
  }, [status, token]);

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
              className="text-xs text-slate-400 hover:text-white mt-1 cursor-pointer"
            >
              ออกจากระบบ
            </button>
          </div>
        </div>

        {/* Difficulty Selector */}
        {status !== 'idle' && (
          <div className="flex justify-center gap-2 mb-4">
            {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
              <button
                key={d}
                onClick={() => {
                  setDifficulty(d);
                  resetGame();
                  setStatus('playing');
                }}
                className={`px-3 py-1 rounded-full text-sm font-semibold border transition cursor-pointer ${
                  difficulty === d
                    ? d === 'easy' ? 'bg-green-600/30 border-green-500 text-green-300'
                      : d === 'medium' ? 'bg-yellow-600/30 border-yellow-500 text-yellow-300'
                      : 'bg-red-600/30 border-red-500 text-red-300'
                    : 'bg-white/5 border-white/10 text-slate-500 hover:text-slate-300 hover:border-white/30'
                }`}
              >
                {d === 'easy' ? '🟢 ง่าย' : d === 'medium' ? '🟡 ปานกลาง' : '🔴 ยาก'}
              </button>
            ))}
          </div>
        )}

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
              <div className="flex justify-center gap-2 mb-6">
                {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
                  <button
                    key={d}
                    onClick={() => setDifficulty(d)}
                    className={`px-4 py-2 rounded-lg font-semibold capitalize transition cursor-pointer border-2 ${
                      difficulty === d
                        ? d === 'easy' ? 'bg-green-600 border-green-400 text-white'
                          : d === 'medium' ? 'bg-yellow-600 border-yellow-400 text-white'
                          : 'bg-red-600 border-red-400 text-white'
                        : 'bg-white/10 border-transparent text-slate-300 hover:bg-white/20'
                    }`}
                  >
                    {d === 'easy' ? 'ง่าย' : d === 'medium' ? 'ปานกลาง' : 'ยาก'}
                  </button>
                ))}
              </div>
              <button
                onClick={startGame}
                className="px-8 py-3 bg-blue-600 rounded-xl text-lg font-semibold hover:bg-blue-500 transition cursor-pointer"
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
              disabled={isUpdatingScore}
              className="flex-1 py-3 bg-blue-600 rounded-xl font-semibold hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              เล่นอีกครั้ง
            </button>
            <button
              onClick={() => setShowCoach(true)}
              disabled={isUpdatingScore}
              className="flex-1 py-3 bg-purple-600 rounded-xl font-semibold hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              🤖 AI Coach
            </button>
            <button
              onClick={() => router.push('/leaderboard')}
              disabled={isUpdatingScore}
              className="flex-1 py-3 bg-slate-600 rounded-xl font-semibold hover:bg-slate-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isUpdatingScore ? 'กำลังอัปเดต...' : 'Leaderboard'}
            </button>
          </div>
        )}
      </div>

      {showCoach && <CoachModal onClose={() => setShowCoach(false)} />}
    </div>
  );
}

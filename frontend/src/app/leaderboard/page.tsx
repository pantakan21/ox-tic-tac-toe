import Image from 'next/image';
import Link from 'next/link';
import { api, type LeaderboardEntry } from '@/lib/api';

export const revalidate = 0;

export default async function LeaderboardPage() {
  let entries: LeaderboardEntry[] = [];
  try {
    entries = await api.getLeaderboard();
  } catch {}

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-700 text-white p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">🏆 Leaderboard</h1>
          <Link href="/game" className="text-slate-300 hover:text-white text-sm">← กลับเล่นเกม</Link>
        </div>

        <div className="bg-white/5 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-white/10 text-slate-300 text-sm">
                <th className="py-3 px-4 text-left">#</th>
                <th className="py-3 px-4 text-left">ผู้เล่น</th>
                <th className="py-3 px-4 text-right">คะแนน</th>
                <th className="py-3 px-4 text-right">W</th>
                <th className="py-3 px-4 text-right">L</th>
                <th className="py-3 px-4 text-right">D</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, i) => (
                <tr key={entry.userId} className="border-t border-white/5 hover:bg-white/5">
                  <td className="py-3 px-4 text-slate-400">
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      {entry.user.image && (
                        <Image
                          src={entry.user.image}
                          alt={entry.user.name}
                          width={28}
                          height={28}
                          className="rounded-full"
                        />
                      )}
                      <span>{entry.user.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-yellow-400">{entry.totalScore}</td>
                  <td className="py-3 px-4 text-right text-green-400">{entry.wins}</td>
                  <td className="py-3 px-4 text-right text-red-400">{entry.losses}</td>
                  <td className="py-3 px-4 text-right text-slate-400">{entry.draws}</td>
                </tr>
              ))}
              {entries.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">ยังไม่มีข้อมูล</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

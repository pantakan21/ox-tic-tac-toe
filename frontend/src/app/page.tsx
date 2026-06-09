import Link from 'next/link';

export default function HomePage() {
  const backendUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-700 flex items-center justify-center text-white">
      <div className="text-center max-w-md px-6">
        <div className="text-8xl mb-6">⭕❌</div>
        <p className="text-slate-300 text-lg mb-10">
          เล่น Tic-tac-toe กับบอท
        </p>

        <a
          href={`${backendUrl}/auth/google`}
          className="inline-block w-full py-4 bg-white text-slate-900 rounded-xl font-semibold text-lg hover:bg-slate-100 transition shadow-lg"
        >
          🔑 เข้าสู่ระบบด้วย Google
        </a>

        <div className="mt-6">
          <Link href="/leaderboard" className="text-slate-400 hover:text-white text-sm underline">
            ดู Leaderboard
          </Link>
        </div>
      </div>
    </div>
  );
}

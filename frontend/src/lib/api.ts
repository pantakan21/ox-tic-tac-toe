const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

async function request<T>(path: string, options?: RequestInit, token?: string): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error((error as { message: string }).message ?? 'Request failed');
  }
  return res.json() as Promise<T>;
}

export interface ScoreData {
  totalScore: number;
  currentStreak: number;
  wins: number;
  losses: number;
  draws: number;
  user: { name: string; image?: string };
}

export interface LeaderboardEntry {
  userId: string;
  totalScore: number;
  wins: number;
  losses: number;
  draws: number;
  user: { name: string; image?: string };
}

export interface BotMoveResponse {
  position: number;
}

export interface EndGameResponse {
  gameLogId: string;
  result: 'WIN' | 'LOSE' | 'DRAW';
  scoreChange: { scoreDelta: number; bonusAwarded: boolean; newStreak: number };
}

export const api = {
  getBotMove: (board: (string | null)[], position: number, token: string, difficulty: 'easy' | 'medium' | 'hard' = 'medium') =>
    request<BotMoveResponse>('/game/bot-move', {
      method: 'POST',
      body: JSON.stringify({ board, position, difficulty }),
    }, token),

  endGame: (board: (string | null)[], moves: unknown[], token: string, difficulty: 'easy' | 'medium' | 'hard' = 'medium') =>
    request<EndGameResponse>('/game/end', {
      method: 'POST',
      body: JSON.stringify({ board, moves, difficulty }),
    }, token),

  getCoach: (gameLogId: string, token: string) =>
    request<{ feedback: string }>('/game/coach', {
      method: 'POST',
      body: JSON.stringify({ gameLogId }),
    }, token),

  getMyScore: (token: string) =>
    request<ScoreData>('/score/me', {}, token),

  getLeaderboard: (difficulty?: 'easy' | 'medium' | 'hard') =>
    request<LeaderboardEntry[]>(`/leaderboard${difficulty ? `?difficulty=${difficulty}` : ''}`, { cache: 'no-store' }),

  getHistory: (token: string) =>
    request<{ id: string; result: string; createdAt: string }[]>('/game/history', {}, token),
};

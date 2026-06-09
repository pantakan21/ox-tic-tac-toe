# OX Game — Full-Stack Tic-tac-toe

> Full Stack Developer Test — Extreme Co., Ltd.

Human vs AI Tic-tac-toe with OAuth login, score/streak tracking, leaderboard, and post-game AI coach.

---

## Quick Start (Docker)

```bash
cp .env.example .env          # fill in GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, ANTHROPIC_API_KEY, JWT_SECRET, AUTH_SECRET
docker compose up --build
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Swagger docs: http://localhost:3001/api/docs

---

## Local Development

### Prerequisites
- Node.js 20+
- MySQL 8 running on port 3306
- Redis 7 running on port 6379

### Backend (NestJS)
```bash
cd backend
cp ../.env.example .env       # adjust DATABASE_URL / REDIS_URL
npm install
npx prisma migrate dev        # create tables
npm run start:dev
```

### Frontend (Next.js)
```bash
cd frontend
echo "NEXT_PUBLIC_API_URL=http://localhost:3001" > .env.local
npm install
npm run dev
```

---

## Environment Variables

| Variable | Used By | Description |
|---|---|---|
| `GOOGLE_CLIENT_ID` | backend, frontend | Google OAuth app |
| `GOOGLE_CLIENT_SECRET` | backend | Google OAuth secret |
| `JWT_SECRET` | backend | Sign/verify JWT tokens |
| `DATABASE_URL` | backend | MySQL connection string |
| `REDIS_URL` | backend | Redis connection string |
| `ANTHROPIC_API_KEY` | backend only | AI Coach (server-side only) |
| `NEXT_PUBLIC_API_URL` | frontend | Backend base URL |

---

## Architecture

```
[Next.js Frontend :3000]
  └─ Google OAuth login → redirect to backend /auth/google
  └─ JWT stored in Zustand (persisted localStorage)
  └─ Game UI: board, score display, AI Coach modal

[NestJS Backend :3001]
  ├─ /auth           — Google OAuth 2.0 + JWT issuance
  ├─ /game           — Board validation, heuristic bot, end-game recording
  ├─ /score          — Atomic streak/score via Redis Lua + MySQL
  ├─ /leaderboard    — Public, Redis-cached 60s
  └─ /api/docs       — Swagger UI

[MySQL]  ← Prisma ORM — Users, Scores, GameLogs
[Redis]  ← streak counters (atomic Lua), leaderboard cache, rate limiting
```

### Why Modular Monolith (not Microservices)

Scope of an OX game doesn't justify the overhead of service mesh, distributed tracing, and inter-service auth. Module boundaries are clean and ready to split:

- **Scale path:** Extract `game-service` and `score-service` as separate NestJS apps, share Prisma schema via npm workspace, communicate via message queue (e.g. BullMQ/Redis).

---

## Game Rules

- Human plays **X**, bot plays **O** (X always goes first)
- Bot uses **heuristic strategy** (win → block → center → corner → random) with a 20% mistake rate so it's beatable
- Scoring:

| Result | Score |
|---|---|
| Win | +1 |
| Lose | -1 |
| Draw | 0 |
| 3 consecutive wins | +1 bonus, streak resets |

---

## Security Highlights

- Board state validated **server-side** before recording result — client cannot self-report a win
- Streak updates are **atomic Redis Lua scripts** — no race conditions
- `ANTHROPIC_API_KEY` never leaves the backend
- All state-changing endpoints require `JwtAuthGuard`
- `/game/end` has rate limiting (10 req/min per user)
- All DTOs use `class-validator` — strict whitelist validation

---

## Testing

```bash
cd backend && npm test             # 30 unit tests
cd backend && npm run test:cov     # coverage report
```

Tests cover:
- All scoring/streak edge cases (W W W, W W L, D D W W W, etc.)
- BoardValidator (valid/invalid board states, two-winner detection)

# OX Game — Full-Stack Tic-tac-toe

> Full Stack Developer Test — Extreme Co., Ltd.

Human vs AI Tic-tac-toe with Google OAuth, score/streak tracking, leaderboard, and post-game AI coach.

---

## Quick Start

ต้องมี **Docker Desktop** และไฟล์ `backend/.env` (ได้รับแยกต่างหาก)

```bash
git clone <repo-url>
cd ox-tic-tac-toe
# วาง .env ที่ได้รับใน backend/.env
docker compose up --build
# เปิด terminal ใหม่ รันครั้งแรกเท่านั้น:
docker compose exec backend npx prisma migrate deploy
```

- เกม: http://localhost:3000
- Swagger: http://localhost:3001/api/docs

---

## Stack

| Layer | เทคโนโลยี |
|---|---|
| Frontend | Next.js 15, React, TypeScript, Zustand, Auth.js, Tailwind |
| Backend | NestJS, Prisma, MySQL 8, Redis 7 |
| AI Coach | Groq API (llama-3.3-70b-versatile) |
| Infra | Docker Compose, Jest |

---

## Architecture

```
[Next.js :3000]  ←→  [NestJS :3001]  ←→  [MySQL]
                           ↑
                        [Redis] ← streak counter (atomic Lua)
```

Modular Monolith: `auth/` `game/` `score/` `leaderboard/`

---

## Game Rules

ผู้เล่น = **X**, บอท = **O** — บอทมี mistake rate 80% เล่นชนะได้

| ผลลัพธ์ | คะแนน |
|---|---|
| ชนะ | +1 |
| แพ้ | -1 |
| เสมอ | 0 |
| ชนะ 3 ครั้งติด | +1 โบนัส, streak รีเซ็ต |

---

## การตัดสินใจออกแบบ

- **Heuristic bot แทน Minimax** — Perfect minimax ทำให้ผู้เล่นชนะไม่ได้เลย
- **Modular Monolith แทน Microservices** — Scope ไม่ justify overhead
- **Redis Lua script สำหรับ streak** — ต้องการ atomicity ป้องกัน race condition
- **JWT in-memory เท่านั้น** — ไม่ persist localStorage เพื่อความปลอดภัย
- **AI Coach server-side** — Groq API key ไม่เคยออกจาก backend

---

## Testing

```bash
cd backend && npm test        # 47 unit tests
```

---

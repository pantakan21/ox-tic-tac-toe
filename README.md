# OX Game — Full-Stack Tic-tac-toe

> Full Stack Developer Test — Extreme Co., Ltd.

Human vs AI Tic-tac-toe with Google OAuth, score/streak tracking, leaderboard, and post-game AI coach.

---

## Quick Start

ต้องมี **Docker Desktop** และไฟล์ `backend/.env` (ได้รับแยกต่างหาก)

### รัน Production (Docker ทั้งหมด)

```bash
git clone <repo-url>
cd ox-tic-tac-toe

# วาง .env ที่ได้รับใน backend/.env ก่อน แล้ว:
docker compose up --build
```

- เกม: http://localhost:3000
- Swagger: http://localhost:3001/api/docs

### รัน Development (npm)

ต้องมี **Node.js 20+** เพิ่มเติม

```bash
# 1. รัน MySQL + Redis
docker compose up -d mysql redis

# 2. Backend
cd backend && npm install
npx prisma migrate deploy
npm run start:dev

# 3. Frontend (เปิด terminal ใหม่)
cd frontend && npm install
npm run dev
```

---

## Stack

| Layer | เทคโนโลยี |
|---|---|
| Frontend | Next.js 16, React 19, TypeScript, Zustand, Tailwind |
| Backend | NestJS, Prisma, MySQL 8, Redis 7 |
| Auth | Google OAuth 2.0 (Passport) + JWT |
| AI Coach | Groq API (llama-3.3-70b-versatile) |
| Infra | Docker (MySQL/Redis), Jest |

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

## Security

- **Score** คำนวณฝั่ง server เท่านั้น + ตรวจ board state ก่อนบันทึก
- **Streak** ใช้ Redis Lua script (atomic) ป้องกัน race condition
- **AI Coach** เรียก Groq ฝั่ง server — API key ไม่ออกจาก backend
- **Rate limit** 10 req/min บน `/game/end` (NestJS ThrottlerGuard)
- **CSRF** — ไม่ต้องใช้ CSRF guard เพราะ auth ใช้ Bearer token ใน `Authorization` header (ไม่ใช้ cookie) ทำให้ CSRF attack ไม่ applicable โดย design

> **Known trade-off:** server ตรวจ board เชิงโครงสร้าง แต่ยังไม่ replay `moves`
> การปิดโกงสมบูรณ์ต้องทำ server-authoritative game state (เกินขอบเขต test นี้)

---

## Testing

```bash
cd backend && npm test        # 47 unit tests
```

---

# OX Game — Folder Structure (Frontend & Backend)

## ภาพรวม

โปรเจกต์แยกเป็น 2 service อิสระ รันคนละ process กันคนละ port (`backend` = NestJS API,
`frontend` = Next.js UI) อยู่ใน repo เดียวกัน (monorepo แบบ folder-based ไม่ใช้ workspace tool)

```
ox-tic-tac-toe/
├── backend/      ← NestJS REST API
├── frontend/     ← Next.js UI
├── docs/         ← เอกสารประกอบโปรเจกต์ (รวมไฟล์ชุดนี้)
└── docker-compose.yml   ← รัน MySQL + Redis (infra เท่านั้น)
```

---

## Backend (`backend/src/`)

จัดเป็น **feature-based module** ตาม NestJS convention — ทุก domain มีโฟลเดอร์ของตัวเอง
ไม่ใช่จัดตาม technical layer (controllers/, services/ รวมกัน)

```
backend/
├── src/
│   ├── auth/                       # Login ด้วย Google OAuth → ออก JWT
│   │   ├── strategies/
│   │   │   ├── google.strategy.ts  # Passport Google OAuth strategy
│   │   │   └── jwt.strategy.ts     # ตรวจ JWT บน request ที่ login แล้ว
│   │   ├── auth.controller.ts      # endpoint /auth/google, /auth/google/callback
│   │   ├── auth.service.ts         # find-or-create user, sign JWT
│   │   └── auth.module.ts
│   │
│   ├── game/                       # หัวใจของเกม — กฎ, บอท, AI coach
│   │   ├── board-validator.ts      # ตรวจ board state ถูกกฎไหม, หาผู้ชนะ (server-authoritative)
│   │   ├── heuristic-bot.ts        # บอท non-perfect — มี mistake rate ตาม difficulty
│   │   ├── ai-coach.service.ts     # ส่ง moves ให้ Groq LLM วิเคราะห์เป็นภาษาไทย
│   │   ├── dto/
│   │   │   └── move.dto.ts         # DTO + class-validator สำหรับ request เดินหมาก/จบเกม
│   │   ├── game.controller.ts      # endpoint /game/bot-move, /game/end, /game/history
│   │   ├── game.service.ts         # ผูก validator + bot + score + ai-coach เข้าด้วยกัน
│   │   ├── game.module.ts
│   │   ├── board-validator.spec.ts
│   │   ├── heuristic-bot.spec.ts
│   │   └── game.service.spec.ts
│   │
│   ├── score/                      # คำนวณคะแนน + streak
│   │   ├── score.controller.ts     # endpoint /score/me
│   │   ├── score.service.ts        # Lua script atomic streak ผ่าน Redis, sync MySQL
│   │   ├── score.module.ts
│   │   └── score.service.spec.ts
│   │
│   ├── leaderboard/                # หน้า leaderboard สาธารณะ
│   │   ├── leaderboard.controller.ts
│   │   ├── leaderboard.service.ts
│   │   └── leaderboard.module.ts
│   │
│   ├── prisma/                     # wrapper service เชื่อม Prisma Client
│   │   ├── prisma.service.ts
│   │   └── prisma.module.ts
│   │
│   ├── redis/                      # wrapper service เชื่อม Redis client (ioredis)
│   │   └── redis.module.ts
│   │
│   ├── common/                     # โค้ดที่ใช้ข้าม module
│   │   ├── guards/
│   │   │   └── jwt-auth.guard.ts   # guard บังคับ login ก่อนเข้า endpoint
│   │   └── decorators/
│   │       └── current-user.decorator.ts  # ดึง user payload จาก JWT มาใช้ใน controller
│   │
│   ├── app.module.ts                # root module — import ทุก feature module
│   ├── app.controller.ts / app.service.ts  # health check เริ่มต้นจาก Nest CLI
│   └── main.ts                      # bootstrap, Swagger setup, global pipe/filter
│
├── prisma/
│   ├── schema.prisma                 # data model: User, Score, GameLog + enum
│   └── migrations/                   # migration history (track ผ่าน git)
│
├── test/                             # e2e test (จาก Nest CLI scaffold)
├── Dockerfile                        # image สำหรับ deploy จริง (ยังไม่ผูกกับ docker-compose.yml)
└── .env / .env.example               # secret: DATABASE_URL, REDIS_URL, JWT_SECRET, GROQ_API_KEY ฯลฯ
```

**กฎการจัดโฟลเดอร์ที่ยึดตลอดโปรเจกต์:**
- 1 module = 1 โฟลเดอร์ มี `*.module.ts`, `*.controller.ts`, `*.service.ts` ของตัวเอง
- ไฟล์ business logic ที่ test ได้อิสระ (เช่น `board-validator.ts`, `heuristic-bot.ts`) แยกจาก `*.service.ts`
  ที่ทำหน้าที่ orchestrate เท่านั้น → ทำให้เขียน unit test เฉพาะ logic ได้ง่าย (ดู `*.spec.ts` คู่กันทุกไฟล์สำคัญ)
- `common/` เก็บเฉพาะของที่ใช้ "ข้าม module" เท่านั้น (guard, decorator) — ไม่ใส่ business logic

---

## Frontend (`frontend/src/`)

ใช้ Next.js **App Router** — โฟลเดอร์ใน `app/` คือ route จริงของเว็บ

```
frontend/
├── src/
│   ├── app/
│   │   ├── page.tsx                  # หน้าแรก (login / landing)
│   │   ├── layout.tsx                # root layout (font, provider ร่วม)
│   │   ├── globals.css
│   │   ├── auth/
│   │   │   └── callback/
│   │   │       └── page.tsx          # รับ JWT กลับจาก Google OAuth callback
│   │   ├── game/
│   │   │   └── page.tsx              # หน้าเล่นเกม (กระดาน + เลือก difficulty)
│   │   └── leaderboard/
│   │       ├── page.tsx              # หน้า leaderboard สาธารณะ
│   │       └── back-button.tsx       # client component เล็กๆ เฉพาะหน้านี้
│   │
│   ├── components/
│   │   └── game/
│   │       ├── GameBoard.tsx         # กระดาน 3x3, รับ click ผู้เล่น
│   │       └── CoachModal.tsx        # popup แสดงผลวิเคราะห์จาก AI Coach
│   │
│   ├── stores/                       # Zustand store แยกตาม feature
│   │   ├── gameStore.ts              # board, moves, difficulty, สถานะ loading ระหว่างเกม
│   │   └── userStore.ts              # user profile + JWT ที่ decode แล้ว
│   │
│   └── lib/
│       └── api.ts                    # wrapper เรียก backend API (fetch + แนบ JWT header)
│
├── public/                            # static asset (icon, svg)
├── Dockerfile                         # image สำหรับ deploy จริง (ยังไม่ผูกกับ docker-compose.yml)
└── .env.local                         # NEXT_PUBLIC_API_URL ฯลฯ
```

**กฎการจัดโฟลเดอร์ที่ยึดตลอดโปรเจกต์:**
- `app/<route>/page.tsx` = Server Component โดย default ตาม convention ของโปรเจกต์
  ไฟล์ที่ต้อง interactive (เช่น `GameBoard.tsx`, `CoachModal.tsx`, `back-button.tsx`) ขึ้น `'use client'` เฉพาะตัว
- `stores/` แยกไฟล์ตาม feature ไม่รวมเป็น store เดียว — `gameStore` คุมเฉพาะ state ของเกมที่กำลังเล่น,
  `userStore` คุมเฉพาะ identity/token
- ไม่มี global state manager อื่นซ้อน (เช่น Redux) — ตั้งใจให้ Zustand เป็น state layer เดียวของ client

---

## ความสัมพันธ์ระหว่าง Frontend ↔ Backend

| Frontend เรียก | Backend endpoint | Module ที่รับ |
|---|---|---|
| ปุ่ม Login | `/auth/google` → callback | `auth/` |
| เดินหมาก แล้วขอบอทเดินต่อ | `/game/bot-move` | `game/` |
| เกมจบ ส่ง board สุดท้าย | `/game/end` | `game/` → `score/` |
| เปิด AI Coach | `/game/coach/:gameLogId` | `game/` (เรียก `ai-coach.service.ts`) |
| ดูคะแนนตัวเอง | `/score/me` | `score/` |
| หน้า leaderboard | `/leaderboard` | `leaderboard/` |

ทุก endpoint ที่เปลี่ยนแปลงข้อมูล (`/game/end`) ต้องผ่าน `jwt-auth.guard.ts` ก่อนเสมอ
(ดูรายละเอียดเพิ่มที่ [[08-security]])

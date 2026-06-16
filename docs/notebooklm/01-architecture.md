# OX Game — System Architecture

## High-Level Architecture

```
[Browser]
   │
   ▼
[Next.js Frontend  — App Router, React, TypeScript, Zustand]
   │  REST API (HTTPS) + JWT Bearer Token
   ▼
[NestJS Backend API  — Modular Monolith]
   │
   ├──▶ [MySQL]   (ผ่าน Prisma ORM)   — User, Score, GameLog (persistent data)
   ├──▶ [Redis]                       — Streak counter (atomic, transient)
   └──▶ [Groq API (llama-3.3-70b)]    — AI Coach วิเคราะห์เกมหลังจบ

[Google OAuth 2.0] ──▶ [Passport (Google Strategy) ใน NestJS] ──▶ ออก JWT ของระบบเอง
```

## Architecture Pattern: Modular Monolith

NestJS แยก domain เป็น module ชัดเจน:
- `auth/`
- `game/`
- `score/`
- `leaderboard/`
- `common/` (guards, interceptors, pipes, filters)
- `prisma/`
- `redis/`

**เหตุผล:** scope ของเกม OX ไม่ justify overhead ของ microservices (network call ระหว่าง service)
แต่ module boundary ออกแบบให้แยกเป็น service อิสระได้ในอนาคตถ้าต้อง scale (premature optimization avoidance)

## Layer Responsibility

| Layer | Technology | หน้าที่ |
|---|---|---|
| Frontend Framework | Next.js (App Router) | Routing, SSR/Server Component default |
| UI | React + TypeScript (strict) | Component, type-safety |
| Client State | Zustand | เก็บ board state, turn, JWT ชั่วคราวฝั่ง client |
| Backend Framework | NestJS | REST API, Dependency Injection, decorator-based module |
| ORM | Prisma | Type-safe DB access, schema migration |
| Primary DB | MySQL | User, Score, GameLog (relational, ต้อง consistency) |
| Cache / Counter | Redis | Win-streak counter — atomic ผ่าน Lua script |
| Auth | Passport (Google Strategy) + JWT | OAuth 2.0 login, stateless session |
| AI | Groq API (llama-3.3-70b-versatile) | วิเคราะห์ moves หลังเกม → coach feedback ภาษาไทย |
| Docs | Swagger (NestJS decorator) | API documentation อัตโนมัติ |
| Infra | Docker Compose | รัน **MySQL + Redis** เป็น container (infra เท่านั้น) |

## Dev Workflow จริง: "Infra-in-Docker, App-Local"

- **MySQL, Redis** → รันผ่าน `docker compose up` เป็น container, expose port (3306, 6379) ออกมา
- **Frontend (Next.js), Backend (NestJS)** → รัน local ตรงๆ ด้วย `npm run dev` เชื่อมต่อไปยัง MySQL/Redis ที่ container expose ไว้

**เหตุผลที่ FE/BE ไม่รันใน container ตอน dev:**
- Hot reload เร็วกว่า ไม่ต้อง rebuild image ทุกครั้งที่แก้โค้ด
- MySQL/Redis ไม่ต้องแก้บ่อย → เอาเข้า container สะดวกกว่าต้อง install ลง machine ตรง (และได้ data volume แยกสะอาด)

**หมายเหตุ:** มี `Dockerfile` แยกอยู่ใน `frontend/` และ `backend/` เผื่อ build image สำหรับ deploy จริง
แต่ยังไม่ได้ผูกเข้า `docker-compose.yml` เป็น service `frontend`/`backend` — เป็นขั้นต่อไปที่ยังไม่ทำในรอบนี้

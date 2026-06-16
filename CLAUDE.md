# CLAUDE.md — OX Game (Full-Stack Developer Test)

> ไฟล์นี้เป็น project memory สำหรับ Claude Code
> อ่านทุกครั้งก่อนเขียนโค้ด — ห้ามเปลี่ยน stack หรือ convention โดยไม่ได้รับอนุญาต

---

## 1. Project Overview

**ชื่อโปรเจกต์:** OX Game (Tic-tac-toe) Web Application  
**วัตถุประสงค์:** Full Stack Developer Test
**เป้าหมาย:** Full Stack Developer Test — สร้างเกม Tic-tac-toe แบบ Human vs Bot

---

## 2. Functional Requirements

### Authentication
- ผู้เล่น **ต้อง login ก่อน** เล่นเกม
- ใช้ **OAuth 2.0** มาตรฐาน ผ่าน Passport (Google Strategy) ฝั่ง NestJS + JWT
- ไม่ต้องสร้าง user management เอง

### Game Rules
- ผู้เล่น (Human) vs บอท (AI)
- กติกา Tic-tac-toe ปกติ (3x3, 3 แถวชนะ)
- **บอทต้องแพ้ได้** — ห้ามใช้ perfect minimax เพราะผู้เล่นจะชนะไม่ได้เลย
- ผู้เล่น **เลือก Bot Difficulty** ก่อนเริ่มเกมได้ 3 ระดับ:

| Difficulty | พฤติกรรมบอท |
|---|---|
| Easy | สุ่มเดินเกือบทั้งหมด มีโอกาสบล็อกต่ำ ผู้เล่นชนะได้ง่าย |
| Medium | heuristic bot — บล็อกและโจมตีได้บ้าง แต่มีโอกาสพลาด |
| Hard | heuristic bot เต็มรูปแบบ — บล็อกและโจมตีเสมอ แต่ไม่ใช่ perfect minimax |

- Difficulty ส่งมาจาก client ใน request body — **server ต้องรับ `difficulty` field และปรับ bot logic ตาม**
- ค่า default คือ `Medium` ถ้าไม่ส่งมา

### Scoring System
| ผลลัพธ์ | คะแนน |
|---|---|
| ชนะบอท | +1 |
| แพ้บอท | -1 |
| เสมอ | 0 (streak รีเซ็ต) |
| ชนะ 3 ครั้งติดต่อกัน | +1 โบนัส (streak รีเซ็ตเป็น 0 หลังได้โบนัส) |

**นิยาม streak:** แพ้หรือเสมอ → streak รีเซ็ตเป็น 0 ทันที  
**ตัวอย่าง:** W W W → +1+1+1+1(bonus), streak=0 → W W L → +1+1-1, streak=0

### Leaderboard / Admin Tool
- หน้า leaderboard สาธารณะ แสดงคะแนนผู้เล่นทั้งหมด

---

## 3. Tech Stack (ห้ามเปลี่ยนโดยไม่อนุญาต)

### Frontend
- **Next.js** (App Router) + **React** — TypeScript strict
- **Zustand** — game state management (กระดาน, turn, score ชั่วคราว)
- **JWT (jwt-decode)** — เก็บ token จาก backend ใน Zustand

### Backend
- **NestJS** — REST API (แยก service จาก Next frontend)
- **Prisma** ORM — เชื่อมต่อ MySQL
- **Swagger** — API documentation (ใช้ NestJS built-in decorator)

### Database & Cache
- **MySQL** — เก็บ User, Score, GameLog
- **Redis** — เก็บ streak counter (atomic Lua script)

### Infrastructure
- **Docker Compose** — รัน MySQL + Redis ด้วย command เดียว (infra เท่านั้น)
- **Frontend/Backend** — รัน local ด้วย `npm run dev` ชี้ไปที่ MySQL/Redis ที่ expose port จาก container (มี `Dockerfile` แยกในแต่ละโฟลเดอร์เผื่อ build image สำหรับ deploy จริง แต่ยังไม่ผูกเข้า `docker-compose.yml`)
- **npm** package manager

---

## 4. Architecture

```
[Next.js Frontend]  ←→  [NestJS Backend API]  ←→  [MySQL]
      ↑                         ↑                      ↑
   JWT (Passport)           Redis                  Prisma ORM
   (OAuth 2.0)              (streak only)
```

**Pattern:** Modular Monolith ใน NestJS (feature-based modules)  
**ทำไมไม่ full microservices:** scope ของ OX game ไม่ justify overhead — แต่ module boundary ชัดพร้อม scale

---

## 5. Data Model

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  image     String?
  role      Role     @default(PLAYER)
  score     Score?
  gameLogs  GameLog[]
  createdAt DateTime @default(now())
}

model Score {
  id            String @id @default(cuid())
  userId        String @unique
  user          User   @relation(fields: [userId], references: [id])
  totalScore    Int    @default(0)
  currentStreak Int    @default(0)
  wins          Int    @default(0)
  losses        Int    @default(0)
  draws         Int    @default(0)
}

model GameLog {
  id        String     @id @default(cuid())
  userId    String
  user      User       @relation(fields: [userId], references: [id])
  result    GameResult // WIN | LOSE | DRAW
  moves     Json       // เก็บ sequence การเดิน ไว้ audit + AI coach
  createdAt DateTime   @default(now())
}

enum Role        { PLAYER ADMIN }
enum GameResult  { WIN LOSE DRAW }
```

---

## 6. Critical Business Rules (ห้ามละเมิด)

1. **คะแนน/streak คำนวณฝั่ง server เท่านั้น** — ห้ามเชื่อ request จาก client ว่า "ฉันชนะ"  
2. **Server ต้องตรวจสอบ board state** ก่อน record ผล — ป้องกันโกง  
3. **บันทึก GameLog ทุกเกม** — ไว้ audit trail และ AI coach  
4. ใช้ Redis เก็บ streak แบบ atomic (ป้องกัน race condition)

---

## 7. AI Features ในโปรดักต์

### AI Coach (หลัก — ต้องทำ)
- หลังจบเกม ส่ง `moves` sequence ให้ LLM วิเคราะห์
- แสดง feedback ภาษาไทยสั้นๆ เช่น "ตาที่ 3 พลาดโอกาสบล็อก"
- **เรียก Groq API (llama-3.3-70b-versatile) ฝั่ง server เท่านั้น** (NestJS service) ห้ามโชว์ API key ใน client

### Bot Personality (optional)
- บอทแสดงความคิดเห็นระหว่างเกมผ่าน LLM

---

## 8. Security Requirements (OWASP)

| ช่องโหว่ | มาตรการ |
|---|---|
| Broken Authentication | OAuth 2.0 + session validation ทุก request |
| Injection | Prisma parameterized query, validate DTO ทุกตัว |
| XSS | React escape by default, sanitize input |
| CSRF | NestJS CSRF guard บน state-changing endpoint |
| Score Manipulation | ตรวจ board state ฝั่ง server ก่อนบันทึกคะแนน |
| API Key Exposure | เก็บใน `.env` เท่านั้น ห้าม commit |
| Rate Limiting | NestJS Throttler (in-memory) บน `/game/end` — 10 req/min |

---

## 9. TypeScript & Code Conventions

```
# TypeScript
- strict: true — ห้ามใช้ any
- เปิด strictNullChecks, noImplicitReturns

# Naming
- ตัวแปร/function: camelCase
- Class/Component/Type/Interface: PascalCase
- Constant: UPPER_SNAKE_CASE
- File: kebab-case.ts

# Folder Structure (NestJS)
src/
  auth/
  game/
  score/
  leaderboard/
  common/        # guards, interceptors, pipes, filters
  prisma/

# NestJS Rules
- ทุก endpoint มี DTO class + class-validator decorator
- ทุก endpoint มี @ApiOperation + @ApiResponse (Swagger)
- ใช้ Repository pattern ใน service

# Frontend (Next.js)
- Server Component by default
- Client Component เฉพาะที่ต้องการ interactivity
- Zustand store แยกตาม feature (gameStore, userStore)
```

---

## 10. Definition of Done (ทุก task)

- [ ] TypeScript compile ไม่มี error
- [ ] ESLint + Prettier ผ่าน
- [ ] Unit test ครอบ business logic (โดยเฉพาะ scoring/streak edge cases)
- [ ] Swagger doc อัปเดต
- [ ] ไม่มี secret หรือ API key ใน code

---

## 11. AI Workflow Across SDLC

> โปรเจกต์นี้ใช้ AI ช่วยตลอด SDLC โดยมี human review ทุกขั้น

| เฟส | ใช้ AI ทำอะไร | Human ตรวจอะไร |
|---|---|---|
| Requirements | แตก edge cases, สร้าง acceptance criteria | ตีความ requirement ที่กำกวม |
| Design | ร่าง data model, ADR, sequence diagram | validate architecture decision |
| Implementation | scaffold boilerplate, pair-program | review security, business logic |
| Testing | generate unit test + edge cases | ตรวจ coverage ครบ scoring/streak |
| DevOps | ร่าง Dockerfile, GitHub Actions | verify secret ไม่หลุด |
| Docs | ร่าง README, API doc, comment | ตรวจความถูกต้อง |

---

## 12. Environment Variables ที่ต้องมี

```env
# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Auth
JWT_SECRET=
AUTH_SECRET=

# AI Coach (server-side only)
GROQ_API_KEY=

# Database
DATABASE_URL=mysql://ox_user:ox_password@localhost:3306/ox_game

# Redis
REDIS_URL=redis://localhost:6379

# App
PORT=3001
NEXT_PUBLIC_API_URL=http://localhost:3001
```

---

*Last updated: จากการสนทนากับ Claude — สรุปโดย AI, ตรวจสอบและอนุมัติโดย developer*

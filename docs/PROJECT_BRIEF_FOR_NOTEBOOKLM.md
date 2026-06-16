# OX Game (Tic-tac-toe) — Project Brief

> เอกสารนี้สรุปทั้งโปรเจกต์สำหรับใช้เป็น source ใน NotebookLM
> เพื่อสร้างแผนภาพ (architecture diagram, flowchart, mind map) และเตรียมตอบคำถาม interview

---

## 1. Project Summary

โปรเจกต์นี้เป็นแบบทดสอบสำหรับตำแหน่ง **Full Stack Developer**
สร้างเกม **Tic-tac-toe (OX) แบบ Human vs Bot** เป็น Web Application เต็มรูปแบบ
ครอบคลุม: Authentication, Game Logic, Scoring System, Leaderboard, และ AI Coach

**เหตุผลหลักในการเลือก Stack:** เลือกให้ตรงกับ Job Description (JD) ของตำแหน่งที่สมัคร
ซึ่งระบุให้ใช้ Next.js, React, Zustand, NestJS, Prisma, MySQL, Redis, Docker
จากนั้นตรวจสอบอีกชั้นว่า stack เหล่านี้เหมาะกับ requirement ของเกมจริงหรือไม่ (ดูหัวข้อ 4)

---

## 2. High-Level Architecture

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

**Architecture Pattern:** Modular Monolith (NestJS feature-based modules)
แยก domain เป็น module ชัดเจน: `auth/`, `game/`, `score/`, `leaderboard/`, `common/`, `prisma/`, `redis/`
เพื่อให้พร้อม "แตกเป็น microservice" ในอนาคตถ้าต้อง scale แต่ไม่ทำตั้งแต่แรกเพราะ scope เกม OX
ไม่ justify overhead ของ network call ระหว่าง service (premature optimization)

---

## 3. Tech Stack & Layer Responsibility

| Layer | Technology | หน้าที่ |
|---|---|---|
| Frontend Framework | Next.js (App Router) | Routing, SSR/Server Component default |
| UI | React + TypeScript (strict) | Component, type-safety |
| Client State | Zustand | เก็บ board state, turn, JWT ชั่วคราวฝั่ง client |
| Backend Framework | NestJS | REST API, DI, decorator-based module |
| ORM | Prisma | Type-safe DB access, schema migration |
| Primary DB | MySQL | User, Score, GameLog (relational, ต้อง consistency) |
| Cache / Counter | Redis | Win-streak counter — atomic ผ่าน Lua script |
| Auth | Passport (Google Strategy) + JWT | OAuth 2.0 login, stateless session |
| AI | Groq API (llama-3.3-70b-versatile) | วิเคราะห์ moves หลังเกม → coach feedback ภาษาไทย |
| Docs | Swagger (NestJS decorator) | API documentation อัตโนมัติ |
| Infra | Docker Compose | รัน **MySQL + Redis** เป็น container (infra เท่านั้น) |

**Dev Workflow จริง:** "Infra-in-Docker, App-Local" — MySQL/Redis รันใน container ผ่าน `docker compose up`,
ส่วน Frontend (Next.js) และ Backend (NestJS) รัน local ด้วย `npm run dev` เชื่อมต่อไปยัง port ที่ container expose ไว้
(มี `Dockerfile` แยกใน `frontend/` และ `backend/` เผื่อ deploy จริง แต่ยังไม่ผูกเข้า `docker-compose.yml` เป็น service)

---

## 4. ทำไมเลือกแต่ละ Tool (เหตุผลเชิงเทคนิคที่ซ้อนอยู่หลัง JD)

- **Next.js + NestJS แยกกัน** — frontend/backend scale อิสระจากกัน, backend เป็น REST service กลางที่ client อื่น (mobile, admin tool) เรียกใช้ได้ในอนาคต
- **Prisma** — type-safe query ป้องกัน SQL Injection โดย design (parameterized query อัตโนมัติ), migration file track ผ่าน git
- **Redis สำหรับ streak** — ต้องการ atomic increment/reset ป้องกัน race condition เวลามีหลาย request เข้ามาพร้อมกัน (เช่นเล่นเกมเร็วติดกัน) ถ้าใช้ MySQL UPDATE ตรงๆ จะมี race condition ได้ง่ายกว่า
- **Zustand** — เบากว่า Redux, เหมาะกับ state ของกระดานเกมที่เป็น local/ephemeral ไม่ต้อง persist ฝั่ง server
- **JWT (ไม่ใช้ session แบบ server-side)** — stateless, scale ง่าย, ไม่ต้องเก็บ session store เพิ่ม
- **Modular Monolith ไม่ใช่ Microservices** — scope เล็ก, แต่ออกแบบ module boundary ให้แยกได้ทีหลัง

---

## 5. Functional Requirements

### 5.1 Authentication
- ผู้เล่นต้อง login ก่อนเล่นเกม
- OAuth 2.0 ผ่าน Google (Passport Google Strategy) ฝั่ง NestJS
- หลัง login สำเร็จ ออก JWT ของระบบเอง (ไม่ใช้ Google token ตรงๆ) เพื่อควบคุม payload/expiry เอง
- ไม่มี user management แยก (ไม่ต้องสมัครสมาชิกเอง)

### 5.2 Game Rules
- Human vs Bot, กระดาน 3x3 มาตรฐาน
- **บอทต้องแพ้ได้เสมอ** — ห้ามใช้ perfect minimax เพราะจะเดิน optimal ตลอดเวลา ทำให้ผู้เล่น "ชนะไม่ได้เลย" (อย่างมากเสมอ) ซึ่งขัดกับ UX ของเกมทดสอบนี้
- เลือก Bot Difficulty ได้ 3 ระดับก่อนเริ่มเกม:

| Difficulty | พฤติกรรมบอท |
|---|---|
| Easy | สุ่มเดินเกือบทั้งหมด, บล็อกโอกาสต่ำ → ผู้เล่นชนะง่าย |
| Medium (default) | Heuristic — บล็อก/โจมตีได้บ้าง แต่มีโอกาสพลาด |
| Hard | Heuristic เต็มรูปแบบ — บล็อก/โจมตีเสมอ แต่ไม่ใช่ perfect minimax |

- `difficulty` ส่งมาจาก client ใน request body, server ปรับ bot logic ตามค่านี้, default = Medium

### 5.3 Scoring System

| ผลลัพธ์ | คะแนน |
|---|---|
| ชนะบอท | +1 |
| แพ้บอท | -1 |
| เสมอ | 0 (streak รีเซ็ตเป็น 0) |
| ชนะ 3 ครั้งติดต่อกัน | +1 โบนัส แล้ว streak รีเซ็ตเป็น 0 |

**Streak Rule:** แพ้หรือเสมอ → streak รีเซ็ตทันที
ตัวอย่าง: `W W W → +1 +1 +1 +1(bonus), streak=0 → W → W → L → +1 +1 -1, streak=0`

### 5.4 Leaderboard
- หน้าสาธารณะ แสดงคะแนนผู้เล่นทั้งหมด เรียงตาม totalScore

---

## 6. Data Model (Prisma Schema)

```
User
 ├─ id, email (unique), name, image, role (PLAYER | ADMIN)
 ├─ 1:1 → Score
 └─ 1:N → GameLog

Score
 ├─ userId (unique, FK → User)
 ├─ totalScore, currentStreak, wins, losses, draws

GameLog
 ├─ userId (FK → User)
 ├─ result (WIN | LOSE | DRAW)
 ├─ moves (JSON — sequence การเดินทั้งเกม, ใช้ audit + ป้อนให้ AI Coach วิเคราะห์)
 └─ createdAt
```

**ความสัมพันธ์:** User 1—1 Score, User 1—N GameLog

---

## 7. Critical Business Rules (Security-by-design)

1. **คะแนน/streak คำนวณฝั่ง server เท่านั้น** — ห้ามเชื่อ client ว่า "ฉันชนะ"
2. **ตรวจสอบ board state ฝั่ง server** ก่อน record ผลทุกครั้ง — ป้องกันโกง/แก้ผลเกม
3. **บันทึก GameLog ทุกเกม** — ใช้เป็น audit trail และ data ป้อน AI Coach
4. **Redis เก็บ streak แบบ atomic** (Lua script) — ป้องกัน race condition เวลามี concurrent request

---

## 8. AI Features

### AI Coach (ฟีเจอร์หลัก)
- หลังจบเกม → ส่ง `moves` sequence (ทั้งเกม ไม่ใช่แค่ผลสุดท้าย) ไปให้ LLM วิเคราะห์
- เหตุผลที่ส่ง sequence ไม่ใช่ final board: LLM ต้อง trace ทีละตาเพื่อบอกได้ว่า "ตาที่ 3 พลาดโอกาสบล็อก"
- เรียก **Groq API (llama-3.3-70b-versatile)** จากฝั่ง NestJS server เท่านั้น — ห้าม expose API key ที่ client
- แสดง feedback ภาษาไทยสั้นๆ ให้ผู้เล่นอ่านง่าย

### Bot Personality (Optional)
- บอทคอมเมนต์ระหว่างเกมผ่าน LLM (เสริม engagement)

---

## 9. Security Measures (OWASP Mapping)

| ช่องโหว่ | มาตรการที่ใช้ |
|---|---|
| Broken Authentication | OAuth 2.0 + ตรวจสอบ JWT ทุก request |
| Injection (SQL) | Prisma parameterized query + validate DTO ทุก endpoint |
| XSS | React escape by default + sanitize input เพิ่ม |
| CSRF | NestJS CSRF guard บน state-changing endpoint |
| Score Manipulation | ตรวจ board state ฝั่ง server ก่อนบันทึกคะแนนเสมอ |
| API Key Exposure | เก็บใน `.env` เท่านั้น, ไม่ commit, ไม่ expose ฝั่ง client |
| Rate Limiting | NestJS Throttler บน `/game/end` — จำกัด 10 req/min |

---

## 10. Key Request/Response Flows (สำหรับวาด Sequence Diagram)

### Flow A: Login (OAuth2)
1. ผู้เล่นกด "Login with Google" บน Next.js frontend
2. Redirect ไป Google OAuth consent screen
3. Google callback กลับมาที่ NestJS (Passport Google Strategy)
4. NestJS ตรวจสอบ profile → หา/สร้าง User ใน MySQL ผ่าน Prisma
5. NestJS ออก JWT (payload: userId, role, exp) → ส่งกลับ frontend
6. Frontend เก็บ JWT ไว้ใน Zustand store → ใช้แนบ header ทุก request ถัดไป

### Flow B: เล่นเกม 1 ตา (Move)
1. ผู้เล่นเลือก difficulty → เริ่มเกม
2. ผู้เล่นคลิกช่องบนกระดาน (client-side update ทันทีเพื่อ UX)
3. Frontend ส่ง move + board state ปัจจุบันไป NestJS (พร้อม JWT)
4. NestJS validate move ถูกกฎไหม → คำนวณ bot move ตาม difficulty (random/heuristic)
5. ส่ง board state ใหม่กลับ frontend

### Flow C: จบเกม → คำนวณคะแนน
1. ตรวจพบ win/lose/draw → frontend เรียก `/game/end` พร้อม final board + moves sequence
2. NestJS **ตรวจสอบ board state ใหม่อีกครั้งฝั่ง server** (ไม่เชื่อ client ว่าใครชนะ)
3. ดึง currentStreak จาก Redis (atomic read)
4. คำนวณคะแนน + streak ใหม่ตามกฎ (ดูหัวข้อ 5.3) → เขียนกลับ Redis แบบ atomic (Lua script)
5. บันทึก Score (MySQL ผ่าน Prisma) + บันทึก GameLog (เก็บ moves เป็น JSON)
6. ส่ง moves sequence ไปยัง Groq API → ได้ feedback ภาษาไทย
7. ส่งผลคะแนน + AI feedback กลับ frontend

### Flow D: Leaderboard
1. ผู้เล่น (หรือใครก็ได้) เปิดหน้า leaderboard
2. Frontend เรียก NestJS `/leaderboard` (public endpoint ไม่ต้อง auth)
3. NestJS query Score ทั้งหมดผ่าน Prisma เรียงตาม totalScore desc
4. ส่งกลับเป็น list แสดงผล

---

## 11. Design Decisions ที่ตั้งใจ "ไม่ทำเต็ม JD" (และเหตุผล)

JD ของตำแหน่งระบุหัวข้อกว้างกว่าที่ scope ของเกม OX ต้องใช้จริง — ตั้งใจเลือกไม่ทำบางส่วนโดยมีเหตุผลรองรับ:

| สิ่งที่ JD พูดถึง | สถานะในโปรเจกต์นี้ | เหตุผล |
|---|---|---|
| Microservices | ไม่ทำ — ใช้ Modular Monolith | Scope เกม OX เล็กเกินกว่าจะ justify network overhead ระหว่าง service, แต่ module boundary ออกแบบให้แยกได้ทีหลัง |
| WebSocket | ไม่ทำ — ใช้ REST | เกม turn-based กับบอท ไม่ต้อง realtime push, ถ้าทำ multiplayer คนจริงแข่งกันค่อยใส่ WebSocket |
| NoSQL เป็น primary DB | ไม่ทำ — ใช้ MySQL เป็นหลัก, Redis แค่ cache/counter | ข้อมูล User/Score/GameLog มีโครงสร้างชัดเจน เหมาะกับ relational DB, ใช้ Redis ตรงจุดที่ NoSQL เก่งจริง (in-memory atomic) |
| Cloud-Native เต็มรูปแบบ | Docker Compose containerize แค่ MySQL/Redis (infra), FE/BE ยังรัน local — มี `Dockerfile` เตรียมไว้แต่ยังไม่ผูกเป็น service | เป็น first step ของ containerization ฝั่ง dev workflow, การ containerize FE/BE เต็มรูปแบบ + deploy จริงบน cloud (K8s/ECS) อยู่นอก scope ของ test นี้ |

---

## 12. Definition of Done

- TypeScript compile ไม่มี error (strict mode, ห้ามใช้ `any`)
- ESLint + Prettier ผ่าน
- Unit test ครอบ business logic โดยเฉพาะ scoring/streak edge case
- Swagger doc อัปเดตตาม endpoint ล่าสุด
- ไม่มี secret หรือ API key หลุดในโค้ด

---

## 13. คำถาม Interview ที่ควรเตรียมตอบ (Self-Check)

1. ทำไมเลือก Next.js/NestJS/Prisma/Redis/Zustand — อธิบายทั้งเหตุผลจาก JD และเหตุผลเชิงเทคนิค
2. ทำไม Redis ต้องใช้ Lua script สำหรับ streak ไม่ใช่ MySQL transaction ตรงๆ
3. ทำไมบอทห้ามใช้ perfect minimax — อธิบาย game theory พื้นฐานได้
4. เดินตัวอย่าง edge case ของ scoring/streak ได้ครบทุกแบบ
5. อธิบาย OAuth2 Authorization Code Flow แบบวาดมือได้
6. ทำไม validate ผลเกมต้องทำฝั่ง server เท่านั้น ยกตัวอย่างวิธีโกงที่ป้องกันได้
7. ทำไมเลือก Modular Monolith ไม่ใช่ Microservices ทั้งที่ JD พูดถึง Microservices
8. ทำไมส่ง moves sequence ทั้งหมดให้ AI Coach ไม่ใช่แค่ final board
9. JWT เก็บที่ไหนฝั่ง client ในโปรเจกต์นี้ มี trade-off ด้าน security อะไรบ้าง

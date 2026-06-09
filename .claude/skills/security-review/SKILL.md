# Security Review Skill

รัน OWASP checklist อัตโนมัติก่อน commit — ตรวจเฉพาะ threat ที่เกี่ยวกับโปรเจกต์ OX Game

## Trigger

เมื่อ user พิมพ์ `/security-review` หรือบอกว่า "ตรวจ security" / "check OWASP"

## Behavior

ตรวจตามลำดับนี้ทุกครั้ง ห้ามข้าม:

### 1. Score Manipulation (Critical)
- Server ต้องตรวจสอบ board state ก่อน record ผลทุกครั้ง
- ห้ามเชื่อ client ว่า "ฉันชนะ" — ตรวจใน `game.service.ts` ว่ามี `validateBoard()` ก่อน `recordResult()`
- Grep: `recordResult\|saveScore\|updateScore` ใน `src/game/` และ `src/score/`

### 2. Authentication & Authorization
- ทุก endpoint ที่ไม่ใช่ leaderboard ต้องมี `@UseGuards(AuthGuard)` หรือ JWT guard
- ตรวจ `@Public()` decorator — ถ้าติดบน endpoint ที่ควร protect ให้ flag ทันที
- Grep: `@Public\|@UseGuards` ใน `src/`

### 3. API Key & Secret Exposure
- ห้าม `ANTHROPIC_API_KEY`, `DATABASE_URL`, `REDIS_URL` ปรากฏใน client-side code
- ตรวจ `src/` (NestJS) — ควร access ผ่าน `ConfigService` เท่านั้น
- ตรวจ `app/` หรือ `components/` (Next.js) — ห้ามมี `process.env.ANTHROPIC_API_KEY`
- Grep: `ANTHROPIC_API_KEY\|DATABASE_URL` ใน frontend directory

### 4. Injection (Prisma + DTO Validation)
- ทุก controller method ต้องรับ DTO ที่มี `class-validator` decorator
- ห้ามใช้ raw string ใน Prisma query (`$queryRaw` ต้องใช้ tagged template เท่านั้น)
- Grep: `\$queryRaw\|@Body\(\)` ใน `src/`

### 5. Rate Limiting
- Endpoint `/game/end` ต้องมี Redis-based rate limit
- ตรวจว่า `ThrottlerGuard` หรือ custom rate-limit guard ถูก apply
- Grep: `game/end\|ThrottlerGuard\|RateLimitGuard`

### 6. CSRF
- State-changing endpoint (POST/PUT/DELETE) ต้องมี CSRF guard
- ตรวจ `main.ts` ว่า enable CSRF middleware หรือใช้ `CsrfGuard`

### 7. Redis Streak Atomicity
- streak update ต้องใช้ Redis transaction (`MULTI/EXEC`) หรือ Lua script
- ห้ามอ่าน streak → คำนวณ → เขียนกลับแบบ non-atomic
- Grep: `currentStreak\|streak` ใน `src/score/`

## Output Format

รายงานแบบนี้ทุกครั้ง:

```
## Security Review — <date>

### ✅ PASS
- [รายการที่ผ่าน]

### ❌ FAIL (ต้องแก้ก่อน commit)
- [ไฟล์:บรรทัด] ปัญหา → วิธีแก้

### ⚠️ WARN (ควรแก้ แต่ไม่บล็อก commit)
- [รายการ]
```

ถ้ามี FAIL ให้บอก user ว่า "ห้าม commit จนกว่าจะแก้ครบ" และเสนอ fix ทันที

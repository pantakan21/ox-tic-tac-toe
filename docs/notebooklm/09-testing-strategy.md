# OX Game — Testing Strategy

## แนวคิดหลัก

ทดสอบเฉพาะ **business logic ที่เสี่ยงพังเงียบๆ และกระทบคะแนน/ความยุติธรรมของเกม** — ไม่เขียน test ครอบทุกไฟล์แบบไร้เป้าหมาย
เลือกจุดที่ CLAUDE.md ระบุไว้เป็น Critical Business Rules เป็นหลัก เพราะเป็นจุดที่ "ผิดแล้วเสียหายจริง" (โกงคะแนนได้, บอทเล่นผิดกติกา)

## ตัวเลขรวม (รันจริงด้วย `npm test`)

```
Test Suites: 5 passed, 5 total
Tests:       46 passed, 46 total
Time:        ~17s
```

| Spec file | จำนวน test case |
|---|---|
| `board-validator.spec.ts` | 17 |
| `score.service.spec.ts` | 12 |
| `game.service.spec.ts` | 9 |
| `heuristic-bot.spec.ts` | 7 |
| `app.controller.spec.ts` | 1 |
| **รวม** | **46** |

## จุดที่ Unit Test ครอบ (backend, Jest)

| ไฟล์ที่ทดสอบ | Spec file | จำนวน case | ทดสอบอะไร |
|---|---|---|---|
| `board-validator.ts` | `board-validator.spec.ts` | 17 | กฎกระดาน: นับจำนวน X/O ต้องสมเหตุสมผล, ห้ามมี 2 ผู้ชนะพร้อมกัน, ตรวจ WIN/LOSE/DRAW/ยังไม่จบ ถูกต้อง |
| `score.service.ts` | `score.service.spec.ts` | 12 | กฎ scoring/streak ทุก edge case ตาม CLAUDE.md (W W W bonus, L resets streak, D resets streak, ฯลฯ) |
| `game.service.ts` | `game.service.spec.ts` | 9 | endGame ต้อง validate board ก่อนบันทึกผลเสมอ, ใช้ผลที่ server คำนวณเองไม่เชื่อ client, สร้าง GameLog ทุกเกม, กัน IDOR (ดู log คนอื่นไม่ได้) |
| `heuristic-bot.ts` | `heuristic-bot.spec.ts` | 7 | บอทต้องเลือกชนะก่อนบล็อกเมื่อทำได้ทั้งคู่, บล็อกเมื่อจำเป็น, มี "mistake path" (สุ่มเดินผิดได้) เพื่อให้ผู้เล่นชนะได้จริง |

## Impact ของแต่ละชุด test (สิ่งที่ป้องกันได้จริง ถ้าไม่มี test เหล่านี้)

| Spec file | ถ้าโค้ดพังแล้ว "ไม่มี" test นี้ จะเกิดอะไร |
|---|---|
| `board-validator.spec.ts` (17) | ผู้เล่นปลอม board ส่งมาทาง API (เช่น ใส่ X ครบ 9 ตัวเลย) แล้วได้ WIN/คะแนนฟรีโดยไม่ต้องเล่นจริง — เป็นช่องโหว่ Score Manipulation ตรงตาม OWASP risk ที่ระบุใน [[08-security]] |
| `score.service.spec.ts` (12) | สูตร bonus ชนะ 3 ติด/รีเซ็ต streak ผิดแบบเงียบๆ เช่น ให้ bonus ผิดจังหวะ หรือไม่รีเซ็ตตอนแพ้ — กระทบ leaderboard ทั้งระบบ และเป็นบั๊กที่ QA แทบไม่เจอเพราะต้องเล่นต่อกันหลายเกมถึงจะสังเกตเห็น |
| `game.service.spec.ts` (9) | จุดที่อันตรายที่สุดถ้าพัง — เป็น single entry point ที่ผูก validate→score→log: พังแล้วอาจบันทึกผลที่ client ส่งมาตรงๆ (เชื่อ client) หรือเกิด IDOR ให้ดู GameLog ของคนอื่นได้ |
| `heuristic-bot.spec.ts` (7) | ถ้า mistake path (`Math.random() < 0.8`) พังไปโดยไม่รู้ตัว บอทจะเล่นแบบ optimal ทุกตา → ผู้เล่นชนะไม่ได้เลย ขัดกับ requirement หลักของเกมที่ระบุชัดว่า "บอทต้องแพ้ได้" |

## ทำไมเลือกทดสอบจุดเหล่านี้ (ไม่ใช่ทุกไฟล์)

| จุดที่ทดสอบ | เหตุผล |
|---|---|
| **BoardValidator** | เป็น gate กันโกงตัวแรก — ถ้า validate ผิด ผู้เล่นส่ง board ปลอมมาแล้วได้คะแนนฟรีได้ทันที (Critical Business Rule #2) |
| **HeuristicBot** | กติกาบอกว่า "บอทต้องแพ้ได้" — ถ้า mistake path พัง บอทจะกลายเป็น perfect player โดยไม่ตั้งใจ ทำให้ requirement หลักของเกมเสียไป |
| **GameService.endGame** | เป็นจุดเดียวที่เชื่อม validate → score → log เข้าด้วยกัน ถ้าพังจุดนี้ business rule ข้อ 1-3 ทั้งหมดพังตามไปด้วย |
| **ScoreService.applyResult** | สูตรคะแนน/streak มี edge case เยอะ (bonus ที่ชนะครบ 3, รีเซ็ตตอนแพ้/เสมอ) ผิดแล้ว debug ยากเพราะอาศัย state สะสมข้ามเกม |

## เทคนิคการ Mock ที่ใช้

- **Mock Prisma และ Redis ทั้งคู่** ใน `score.service.spec.ts` และ `game.service.spec.ts` — เพราะเป็น unit test ไม่ใช่ integration test ไม่ต้องต่อ DB/Redis จริง รันเร็วและ deterministic
- **`score.service.spec.ts`** มี `simulateLua()` จำลอง logic ของ Lua script แยกจาก mock — ใช้ตรวจ "สมการ" ของ streak/bonus ตรงๆ โดยไม่ต้องพึ่ง mock return value ทุกเคส ช่วยให้ edge case เพิ่มได้ไว (เช่น `W W W W`, `D D W W W`)
- **`heuristic-bot.spec.ts`** stub `Math.random` (`jest.spyOn(Math, 'random').mockReturnValue(...)`) เพื่อบังคับให้บอทเดินตาม "strategy path" หรือ "mistake path" แบบ deterministic — ถ้าไม่ stub จะ test แบบสุ่มไม่ได้ (flaky test)

## สิ่งที่ตั้งใจ "ไม่" ทำ Unit Test (และทำไม)

| ส่วนที่ไม่ทดสอบแบบ unit | เหตุผล |
|---|---|
| AI Coach (Groq API call) | เป็น external call, mock แล้วทดสอบ logic ตัวเองเท่านั้น (ดู `mockAiCoach.analyze` ใน `game.service.spec.ts`) — ไม่ test ว่า LLM ตอบถูกเพราะ non-deterministic by nature |
| Frontend component | scope ของ test รอบนี้โฟกัส business logic ฝั่ง backend ที่กระทบคะแนน/ความยุติธรรมก่อน เพราะ impact สูงสุดถ้าผิด |
| OAuth/Passport flow | เป็น integration กับ Google จริง เหมาะกับ e2e/manual test มากกว่า unit test |

## สรุปแนวคิด

> "Unit test ไม่ใช่ coverage % แต่คือการป้องกัน business rule ที่ผิดแล้วกระทบความยุติธรรมของเกมหรือคะแนนผู้เล่นโดยตรง"

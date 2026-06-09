# AI Usage Log — OX Game

> บันทึกการใช้ AI ตลอด SDLC ของโปรเจกต์นี้
> ทุก output ของ AI ผ่าน human review ก่อน commit

---

## Requirements Phase

| AI ทำอะไร | Human ตรวจอะไร |
|---|---|
| แตก edge cases ของ streak: W W W, W W L, D D W W W, W W W W | ตีความ "streak รีเซ็ตเป็น 0 หลังได้โบนัส" และ verify กับ spec |
| สร้าง acceptance criteria ครอบคลุมทุก scoring scenario | ตรวจว่าครบและไม่มี ambiguity |
| ออกแบบ data model เบื้องต้น | เพิ่ม GameResult enum และ moves: Json field |

**AI Override #1:** AI เสนอ perfect minimax bot → override เป็น heuristic bot ที่มี 20% mistake rate เพราะ perfect play ทำให้ผู้เล่นชนะไม่ได้เลย ขัดกับ game design

---

## Design Phase

| AI ทำอะไร | Human ตรวจอะไร |
|---|---|
| ร่าง architecture diagram (Next.js ↔ NestJS ↔ MySQL/Redis) | validate separation of concerns, ตรวจว่า API key ไม่หลุด client |
| เสนอ module structure: auth, game, score, leaderboard, common | ปรับ RedisModule ให้เป็น @Global() เพื่อลด boilerplate |
| ออกแบบ Redis Lua script สำหรับ atomic streak | review logic เพื่อป้องกัน race condition |

**AI Override #2:** AI เสนอ full microservices แยก game-service, score-service, user-service → override เป็น modular monolith เพราะ scope ของ OX game ไม่ justify overhead ของ distributed system แต่ module boundary ยังชัดพร้อม scale

---

## Implementation Phase

| AI ทำอะไร | Human ตรวจอะไร |
|---|---|
| Scaffold NestJS boilerplate (modules, controllers, services, DTOs) | review security: guards ครบ, DTO validation, no any |
| เขียน Redis Lua script สำหรับ streak | verify atomicity, edge case เมื่อ streak = 2 WIN |
| เขียน heuristic bot logic | verify bot ยังแพ้ได้ ทดสอบหลายเกม |
| เขียน Prisma schema ตาม data model | ตรวจ relation, enum naming, index |
| scaffold Next.js components (GameBoard, CoachModal, pages) | review UX flow, auth redirect |

**AI Override #3:** AI ใช้ Prisma 7 (latest) → downgrade เป็น Prisma 5 เพราะ Prisma 7 มี breaking changes (ต้องใช้ driver adapters, ไม่รองรับ url ใน schema) ที่เพิ่ม complexity โดยไม่จำเป็น

---

## Testing Phase

| AI ทำอะไร | Human ตรวจอะไร |
|---|---|
| Generate unit tests ครอบ scoring/streak edge cases ทั้งหมด | verify test scenarios ตรงกับ spec ใน CLAUDE.md |
| Generate BoardValidator tests ครอบ invalid board states | ตรวจ edge case: two-winner board, O > X count |

**ผล:** 30 unit tests, 100% pass

---

## DevOps Phase

| AI ทำอะไร | Human ตรวจอะไร |
|---|---|
| ร่าง Dockerfile (multi-stage build) สำหรับ backend และ frontend | ตรวจ secret ไม่หลุดใน image, healthcheck ครบ |
| ร่าง docker-compose.yml พร้อม MySQL + Redis + apps | verify port mapping, depends_on condition |

---

## Documentation Phase

| AI ทำอะไร | Human ตรวจอะไร |
|---|---|
| ร่าง README.md: setup guide, architecture, game rules, security highlights | ตรวจความถูกต้องของ command และ env vars |
| ร่าง Swagger @ApiOperation + @ApiResponse ทุก endpoint | ตรวจว่าครอบ error cases |
| เขียน CLAUDE.md เป็น project memory | ตรวจ business rules ถูกต้องก่อน commit |

---

## สรุป AI Contribution

| ด้าน | AI ช่วย % | Human override |
|---|---|---|
| Boilerplate & scaffold | ~90% | minimal |
| Business logic (scoring, bot) | ~70% | override minimax → heuristic, fix streak edge cases |
| Security (guards, validation) | ~60% | verify ทุก endpoint, เพิ่ม board validation |
| Tests | ~80% | verify coverage ครอบ spec |
| Documentation | ~85% | ตรวจความถูกต้อง |

**Key takeaway:** AI เร่ง velocity ของ scaffolding และ boilerplate ได้มาก แต่ design decisions ที่สำคัญ (bot strategy, library version, architecture pattern) ต้องการ human judgment เพื่อ fit context จริงๆ ของโปรเจกต์

# OX Game — Data Model

## Entity Structure (Prisma Schema)

```
User
 ├─ id, email (unique), name, image, role (PLAYER | ADMIN)
 ├─ 1:1 → Score
 └─ 1:N → GameLog

Score
 ├─ userId (unique, FK → User)
 ├─ totalScore
 ├─ currentStreak
 ├─ wins
 ├─ losses
 └─ draws

GameLog
 ├─ userId (FK → User)
 ├─ result (WIN | LOSE | DRAW)
 ├─ moves (JSON — sequence การเดินทั้งเกม)
 └─ createdAt
```

## ความสัมพันธ์

- User 1—1 Score (ผู้เล่นแต่ละคนมี Score record เดียว สะสมตลอดไป)
- User 1—N GameLog (ผู้เล่นเล่นได้หลายเกม แต่ละเกมบันทึกแยก)

## ทำไม `moves` เก็บเป็น JSON ทั้ง sequence (ไม่ใช่แค่ final board)

1. **Audit trail** — ตรวจสอบย้อนหลังได้ว่าเกมดำเนินไปอย่างไร ป้องกันข้อโต้แย้งเรื่องผลเกม
2. **AI Coach input** — LLM ต้อง trace ทีละตาเพื่อบอกได้ว่า "ตาที่ 3 พลาดโอกาสบล็อก" ถ้ามีแค่ final board จะวิเคราะห์แบบนี้ไม่ได้

## ทำไมแยก Score ออกจาก GameLog

- **Score** = ค่าสะสม (aggregate) ที่ query บ่อยสำหรับ leaderboard — เก็บแบบ denormalized เพื่อ query เร็ว ไม่ต้อง SUM จาก GameLog ทุกครั้ง
- **GameLog** = ประวัติดิบรายเกม (event log) — ใช้ audit และ AI coach ไม่ต้อง query บ่อยเท่า Score

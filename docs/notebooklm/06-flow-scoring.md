# OX Game — Flow: End-Game Scoring & Streak

## Sequence: จบเกม → คำนวณคะแนน

1. ตรวจพบ win/lose/draw → frontend เรียก `/game/end` พร้อม final board + moves sequence
2. NestJS **ตรวจสอบ board state ใหม่อีกครั้งฝั่ง server** (ไม่เชื่อ client ว่าใครชนะ)
3. ดึง currentStreak จาก Redis (atomic read)
4. คำนวณคะแนน + streak ใหม่ตามกฎ → เขียนกลับ Redis แบบ atomic (Lua script)
5. บันทึก Score (MySQL ผ่าน Prisma) + บันทึก GameLog (เก็บ moves เป็น JSON)
6. ส่ง moves sequence ไปยัง Groq API → ได้ feedback ภาษาไทย
7. ส่งผลคะแนน + AI feedback กลับ frontend

## Scoring Table

| ผลลัพธ์ | คะแนน |
|---|---|
| ชนะบอท | +1 |
| แพ้บอท | -1 |
| เสมอ | 0 (streak รีเซ็ตเป็น 0) |
| ชนะ 3 ครั้งติดต่อกัน | +1 โบนัส แล้ว streak รีเซ็ตเป็น 0 |

## Streak Rule

แพ้หรือเสมอ → streak รีเซ็ตเป็น 0 ทันที

**ตัวอย่าง:**
```
W  → +1   streak=1
W  → +1   streak=2
W  → +1+1(bonus)   streak=0
W  → +1   streak=1
L  → -1   streak=0
```

## ทำไมต้องใช้ Redis + Lua Script (Atomic) สำหรับ Streak

- Streak เป็น counter ที่ต้อง "read-then-write" (อ่านค่าเดิม → คำนวณ → เขียนค่าใหม่)
- ถ้าใช้ MySQL UPDATE ตรงๆ และมี 2 request เข้ามาพร้อมกัน (เช่นเล่นเกมเร็วติดกัน หรือเปิดหลาย tab) อาจเกิด **race condition**: ทั้งสอง request อ่านค่า streak เดิมพร้อมกัน แล้วเขียนทับกัน ทำให้นับ streak ผิด
- Redis + Lua script รัน "อ่าน + คำนวณ + เขียน" เป็น atomic operation เดียว (Redis รัน Lua แบบ single-threaded) ป้องกัน race condition ได้แน่นอน

## Critical Business Rules

1. คะแนน/streak คำนวณฝั่ง server เท่านั้น — ห้ามเชื่อ client ว่า "ฉันชนะ"
2. ตรวจสอบ board state ฝั่ง server ก่อน record ผลทุกครั้ง — ป้องกันโกง
3. บันทึก GameLog ทุกเกม — ใช้เป็น audit trail และป้อนให้ AI Coach
4. Redis เก็บ streak แบบ atomic เสมอ — ป้องกัน race condition

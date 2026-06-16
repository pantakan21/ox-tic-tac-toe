# OX Game — Flow: Gameplay (Move + Bot Logic)

## Sequence: เล่นเกม 1 ตา (Move)

1. ผู้เล่นเลือก difficulty → เริ่มเกม
2. ผู้เล่นคลิกช่องบนกระดาน (client-side update ทันทีเพื่อ UX)
3. Frontend ส่ง move + board state ปัจจุบันไป NestJS (พร้อม JWT)
4. NestJS validate move ถูกกฎไหม → คำนวณ bot move ตาม difficulty (random/heuristic)
5. ส่ง board state ใหม่กลับ frontend

## Game Rules

- Human vs Bot, กระดาน 3x3 มาตรฐาน, ชนะด้วย 3 แถวเรียง (แนวนอน/แนวตั้ง/แนวทแยง)
- `difficulty` ส่งมาจาก client ใน request body → server ใช้ปรับ bot logic, default = Medium ถ้าไม่ส่งมา

## Bot Difficulty Design

| Difficulty | พฤติกรรมบอท |
|---|---|
| Easy | สุ่มเดินเกือบทั้งหมด, บล็อกโอกาสต่ำ → ผู้เล่นชนะง่าย |
| Medium (default) | Heuristic — บล็อก/โจมตีได้บ้าง แต่มีโอกาสพลาด |
| Hard | Heuristic เต็มรูปแบบ — บล็อก/โจมตีเสมอ แต่ไม่ใช่ perfect minimax |

## ทำไมห้ามใช้ Perfect Minimax

Perfect minimax เดินแบบ optimal เสมอ → ผลลัพธ์ของเกม OX แบบ optimal คือ **เสมอตลอด** (ถ้าทั้งสองฝ่ายเดินถูกต้อง)
ผู้เล่นจะ "ชนะบอทไม่ได้เลย" อย่างมากที่สุดคือเสมอ — ขัดกับ UX ของเกมที่ต้องให้ผู้เล่นมีโอกาสชนะจริง
จึงต้องออกแบบบอทแบบ heuristic ที่มีจุดพลาดได้ตามระดับความยาก ไม่ใช่ algorithm ที่ optimal เกินไป

## Why Validate ฝั่ง Server เสมอ

- Client ส่ง move มา แต่ server ต้องตรวจว่า move นั้นถูกกฎ (ช่องว่างจริง, ไม่ใช่ตาที่ผ่านไปแล้ว) ก่อนยอมรับ
- ป้องกันการแก้ไข request เพื่อโกงตำแหน่งเดิน หรือยัด board state ปลอม

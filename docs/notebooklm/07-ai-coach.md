# OX Game — AI Coach Feature

## ภาพรวม

หลังจบเกม ระบบส่ง `moves` sequence (ลำดับการเดินทั้งเกม) ให้ LLM วิเคราะห์
แล้วแสดง feedback ภาษาไทยสั้นๆ ให้ผู้เล่นอ่านง่าย เช่น "ตาที่ 3 พลาดโอกาสบล็อก"

## ทำไมเรียก Groq API จากฝั่ง Server เท่านั้น

- API key (GROQ_API_KEY) ต้องไม่ expose ฝั่ง client — ถ้าเรียกตรงจาก browser จะเห็น key ใน network request ได้ทันที
- NestJS service เป็นตัวกลางเรียก Groq → client ไม่เห็น key เลย
- เก็บ key ใน `.env` เท่านั้น ห้าม commit เข้า git

## ทำไมส่ง Moves Sequence ทั้งหมด ไม่ใช่แค่ Final Board

- Final board บอกได้แค่ "ใครชนะ" แต่บอกไม่ได้ว่า "พลาดตรงไหน"
- LLM ต้อง trace ทีละตา (move-by-move) เพื่อวิเคราะห์ได้ว่าตาไหนเป็นจุดเปลี่ยนของเกม เช่น พลาดบล็อกตอนไหน หรือพลาดโอกาสชนะตอนไหน
- นี่คือเหตุผลที่ schema เก็บ `moves` เป็น JSON ใน GameLog ไม่ใช่เก็บแค่ result

## Model ที่ใช้

- **Groq API — llama-3.3-70b-versatile**
- เลือก Groq เพราะ inference เร็ว (latency ต่ำ) เหมาะกับ use case ที่ต้องการ feedback แบบ near-real-time หลังจบเกมทันที

## Bot Personality (Optional Feature)

- บอทคอมเมนต์ระหว่างเกมผ่าน LLM เพื่อเสริม engagement (เช่น พูดแซวระหว่างเดิน)
- เป็น feature เสริม ไม่ใช่ core requirement

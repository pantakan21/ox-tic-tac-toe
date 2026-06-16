# OX Game — Stack Decisions (Why This Tool)

## เหตุผลหลักในการเลือก Stack

เลือก stack ให้ตรงกับ Job Description (JD) ของตำแหน่ง Full Stack Developer ที่สมัคร
ซึ่งระบุให้ใช้ Next.js, React, Zustand, NestJS, Prisma, MySQL, Redis, Docker

จากนั้นตรวจสอบอีกชั้นว่า stack เหล่านี้เหมาะกับ requirement ของเกมจริงหรือไม่ — ไม่ใช่เลือกตามชื่อเฉยๆ

## ทำไมเลือกแต่ละ Tool (เหตุผลเชิงเทคนิค)

| Tool | เหตุผลที่เลือก |
|---|---|
| **Next.js + NestJS แยกกัน** | frontend/backend scale อิสระจากกัน, backend เป็น REST service กลางที่ client อื่น (mobile, admin tool) เรียกใช้ได้ในอนาคต |
| **Prisma** | type-safe query ป้องกัน SQL Injection โดย design (parameterized query อัตโนมัติ), migration file track ผ่าน git |
| **Redis (สำหรับ streak)** | ต้องการ atomic increment/reset ป้องกัน race condition เวลามีหลาย request เข้ามาพร้อมกัน ถ้าใช้ MySQL UPDATE ตรงๆ จะมี race condition ได้ง่ายกว่า |
| **Zustand** | เบากว่า Redux, เหมาะกับ state ของกระดานเกมที่เป็น local/ephemeral ไม่ต้อง persist ฝั่ง server |
| **JWT (ไม่ใช้ server-side session)** | stateless, scale ง่าย, ไม่ต้องเก็บ session store เพิ่ม |
| **Modular Monolith ไม่ใช่ Microservices** | scope เล็ก, แต่ออกแบบ module boundary ให้แยกได้ทีหลัง |

## สิ่งที่ JD พูดถึง แต่ตั้งใจ "ไม่ทำเต็ม" (พร้อมเหตุผล)

| สิ่งที่ JD ต้องการ | สถานะในโปรเจกต์นี้ | เหตุผล |
|---|---|---|
| Microservices | ไม่ทำ — ใช้ Modular Monolith | Scope เกม OX เล็กเกินกว่าจะ justify network overhead ระหว่าง service |
| WebSocket | ไม่ทำ — ใช้ REST | เกม turn-based กับบอท ไม่ต้อง realtime push, ถ้าทำ multiplayer คนจริงค่อยใส่ WebSocket |
| NoSQL เป็น primary DB | ไม่ทำ — MySQL เป็นหลัก, Redis แค่ cache/counter | ข้อมูล User/Score/GameLog มีโครงสร้างชัดเจน เหมาะกับ relational DB |
| Cloud-Native เต็มรูปแบบ | ทำแค่ Docker Compose | เป็น first step ของ containerization, deploy จริงบน K8s/ECS อยู่นอก scope ของ test นี้ |

## สรุปแนวคิด

> "เลือกตาม JD เป็นหลัก แต่ทุก tool ผ่านการเช็คแล้วว่าเหมาะกับ use case จริง ไม่ใช่เลือกแบบสุ่มตามชื่อ"

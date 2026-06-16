# OX Game — Security (OWASP Mapping)

## Security Measures

| ช่องโหว่ (OWASP) | มาตรการที่ใช้ |
|---|---|
| Broken Authentication | OAuth 2.0 + ตรวจสอบ JWT ทุก request |
| Injection (SQL) | Prisma parameterized query + validate DTO ทุก endpoint (class-validator) |
| XSS | React escape by default + sanitize input เพิ่ม |
| CSRF | NestJS CSRF guard บน state-changing endpoint |
| Score Manipulation | ตรวจ board state ฝั่ง server ก่อนบันทึกคะแนนเสมอ — ไม่เชื่อ client |
| API Key Exposure | เก็บใน `.env` เท่านั้น, ไม่ commit, ไม่ expose ฝั่ง client (เช่น Groq key) |
| Rate Limiting | NestJS Throttler บน `/game/end` — จำกัด 10 req/min |

## รายละเอียดเพิ่มเติมแต่ละจุด

### Broken Authentication
- ใช้ OAuth 2.0 ผ่าน Google ไม่สร้าง user/password management เอง → ลด attack surface
- ทุก request ที่ต้อง auth ต้องแนบ JWT, NestJS guard ตรวจสอบ signature + expiry ทุกครั้ง

### Injection
- Prisma generate parameterized query อัตโนมัติ ป้องกัน SQL injection โดย design (ไม่ใช่ raw string concat)
- DTO class + class-validator decorator ตรวจสอบ type/format ของ input ทุก endpoint ก่อนเข้าถึง business logic

### XSS
- React escape output โดย default (ไม่ render HTML ดิบจาก user input)
- Sanitize input เพิ่มเติมในจุดที่รับ free-text จากผู้เล่น

### CSRF
- ใช้ JWT แบบ Bearer token (ไม่ใช่ cookie-based session) → ลด CSRF risk โดยธรรมชาติ เพราะ CSRF อาศัยการที่ browser ส่ง cookie อัตโนมัติ
- ยังคงมี CSRF guard บน endpoint ที่เปลี่ยน state เผื่อกรณีใช้ cookie ในอนาคต

### Score Manipulation
- Client ส่งผลเกมมาได้ แต่ server ต้อง re-validate board state เองก่อนเชื่อ
- ป้องกันการแก้ไข request body เพื่อยัดผล "ชนะ" ปลอม

### Rate Limiting
- `/game/end` จำกัด 10 req/min ต่อผู้ใช้ ป้องกัน spam request เพื่อปั่น streak/score

# OX Game — Flow: Login (OAuth 2.0)

## Sequence

1. ผู้เล่นกด "Login with Google" บน Next.js frontend
2. Redirect ไป Google OAuth consent screen
3. Google callback กลับมาที่ NestJS (Passport Google Strategy)
4. NestJS ตรวจสอบ profile → หา/สร้าง User ใน MySQL ผ่าน Prisma
5. NestJS ออก JWT (payload: userId, role, exp) → ส่งกลับ frontend
6. Frontend เก็บ JWT ไว้ใน Zustand store → ใช้แนบ header ทุก request ถัดไป

## Why JWT ของระบบเอง (ไม่ใช้ Google token ตรงๆ)

- ควบคุม payload เองได้ (userId, role, expiry)
- ควบคุม expiry/revoke logic เอง ไม่ผูกกับ Google token lifecycle
- decouple จาก provider — ถ้าจะเพิ่ม login ผ่าน provider อื่น (Facebook, Apple) ในอนาคต โครงสร้าง JWT ฝั่งเราไม่ต้องเปลี่ยน

## Security Notes

- JWT ใช้แบบ Bearer token (ไม่ใช่ cookie) → ลด CSRF risk โดยธรรมชาติ เทียบกับ cookie-based session
- ทุก request ถัดไปต้องแนบ JWT ใน header → NestJS guard ตรวจสอบทุก endpoint ที่ต้อง auth
- ไม่มี user management เอง (สมัครสมาชิก/ตั้งรหัสผ่าน) — ลด attack surface ของ Broken Authentication

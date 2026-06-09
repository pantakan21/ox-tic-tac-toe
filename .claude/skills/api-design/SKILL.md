# API Design Skill

ออกแบบ NestJS endpoint ใหม่พร้อม DTO + Swagger decorator ครบในครั้งเดียว — ตาม convention ใน CLAUDE.md

## Trigger

เมื่อ user พิมพ์ `/api-design` หรือบอกว่า "ออกแบบ endpoint" / "สร้าง API" / "เพิ่ม route"

## สิ่งที่ต้องสร้างให้ครบทุกครั้ง

### 1. Request DTO
```typescript
// <feature>/dto/create-<resource>.dto.ts
import { IsString, IsNotEmpty, IsEnum, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class Create<Resource>Dto {
  @ApiProperty({ description: '...', example: '...' })
  @IsString()
  @IsNotEmpty()
  fieldName: string;
}
```

### 2. Response DTO (อย่าใช้ raw entity)
```typescript
// <feature>/dto/<resource>-response.dto.ts
export class <Resource>ResponseDto {
  @ApiProperty()
  id: string;
  // เฉพาะ field ที่ client ควรเห็น — ห้าม expose sensitive fields
}
```

### 3. Controller Method
```typescript
@Post()
@UseGuards(AuthGuard)           // ถ้า endpoint ต้อง auth
@ApiOperation({ summary: '...' })
@ApiResponse({ status: 201, type: <Resource>ResponseDto })
@ApiResponse({ status: 400, description: 'Validation error' })
@ApiResponse({ status: 401, description: 'Unauthorized' })
async create(
  @Body() dto: Create<Resource>Dto,
  @CurrentUser() user: UserPayload,  // ถ้าต้องการ user context
): Promise<<Resource>ResponseDto> {
  return this.service.create(dto, user.id);
}
```

### 4. Service Method Signature
```typescript
async create(dto: Create<Resource>Dto, userId: string): Promise<Resource>ResponseDto> {
  // business logic ที่นี่ — ห้ามใส่ใน controller
}
```

## Security Checklist สำหรับทุก endpoint ใหม่

- [ ] State-changing endpoint (POST/PUT/DELETE) → ต้องมี `@UseGuards(AuthGuard)`
- [ ] DTO ทุกตัวมี `class-validator` decorator ทุก property
- [ ] ไม่ return sensitive data (password hash, internal ID mapping)
- [ ] `/game/end` → ต้องมี rate limit guard เพิ่มเติม
- [ ] Server validate board state ก่อน record score เสมอ

## Game-specific Endpoints (reference)

| Method | Path | Guard | Description |
|--------|------|-------|-------------|
| POST | `/game/start` | AuthGuard | เริ่มเกมใหม่ |
| POST | `/game/move` | AuthGuard | ส่ง move ของ player |
| POST | `/game/end` | AuthGuard + RateLimit | จบเกม + คำนวณคะแนน |
| GET | `/leaderboard` | Public | ดู leaderboard |
| GET | `/score/me` | AuthGuard | ดูคะแนนตัวเอง |
| GET | `/game/history` | AuthGuard | ประวัติเกม |
| POST | `/game/coach` | AuthGuard | ขอ AI coach วิเคราะห์เกม |

## Output Format

สร้างไฟล์ตาม NestJS folder structure:
```
src/<feature>/
  dto/
    create-<resource>.dto.ts
    <resource>-response.dto.ts
  <feature>.controller.ts    (เพิ่ม method ใหม่)
  <feature>.service.ts       (เพิ่ม method ใหม่)
```

หลังสร้างแล้ว รัน `npx tsc --noEmit` เพื่อตรวจ TypeScript error ก่อนรายงาน done

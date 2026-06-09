# Test Generation Skill

Generate unit tests โดยเน้น edge cases ของ scoring/streak logic — ตาม business rules ใน CLAUDE.md

## Trigger

เมื่อ user พิมพ์ `/test-gen` หรือบอกว่า "gen test" / "สร้าง unit test" / "เพิ่ม test"

## Context ที่ต้องอ่านก่อนทุกครั้ง

1. อ่าน CLAUDE.md Section 6 (Critical Business Rules) และ Section 2 (Scoring System)
2. อ่านไฟล์ที่ user ระบุ หรือ grep `score\|streak\|game` ใน `src/` เพื่อหา service ที่เกี่ยวข้อง

## Scoring/Streak Edge Cases (บังคับครอบทุกครั้ง)

### Streak Rules
```
W W W → scores: +1, +1, +1, +1(bonus) | streak after: 0
W W L → scores: +1, +1, -1           | streak after: 0
W W D → scores: +1, +1, 0            | streak after: 0
L L L → scores: -1, -1, -1           | streak stays: 0
D D W W W → scores: 0,0,+1,+1,+1,+1(bonus) | streak after: 0
W W W W → scores: +1,+1,+1,+1(bonus),+1 | streak after: 1 (bonus resets to 0, then +1 for next win)
```

### Board Validation Rules
- เกม 3x3 = 9 ช่อง, X เดินก่อน → X เดิน 5 ครั้ง max, O เดิน 4 ครั้ง
- ถ้า board ที่ส่งมา X มากกว่า O เกิน 1 → invalid
- ถ้า board ที่ส่งมา O มากกว่า X → invalid (X เดินก่อนเสมอ)
- ถ้า board มี winner แล้วแต่ยังมีช่องว่าง → valid (เกมหยุดทันทีที่มีคนชนะ)
- ถ้า board บอกว่า X ชนะแต่ O ก็มีแนวชนะด้วย → invalid (เป็นไปไม่ได้)

## Test Structure

ใช้ Jest + NestJS testing utilities เสมอ:

```typescript
describe('ScoreService', () => {
  describe('calculateScore', () => {
    // happy path
    it('should add 1 for WIN', ...)
    it('should subtract 1 for LOSE', ...)
    it('should add 0 for DRAW', ...)
    
    // streak edge cases
    it('should give +1 bonus after 3 consecutive wins and reset streak', ...)
    it('should reset streak on LOSE', ...)
    it('should reset streak on DRAW', ...)
    it('should continue counting streak after bonus reset', ...)
    
    // race condition / atomicity
    it('should handle concurrent score updates correctly', ...)
  })
  
  describe('validateBoard', () => {
    // valid boards
    it('should accept valid mid-game board', ...)
    it('should accept board with winner and empty cells', ...)
    
    // invalid boards  
    it('should reject board where O has more moves than X', ...)
    it('should reject board where X has 2+ more moves than O', ...)
    it('should reject board with two winners', ...)
    it('should reject board with wrong cell count', ...)
  })
})
```

## Output Rules

1. สร้างไฟล์ `.spec.ts` ข้างๆ ไฟล์ที่ test เสมอ (e.g. `score.service.spec.ts`)
2. ใช้ `describe` nested ตาม method name
3. ทุก test case ต้องมี comment สั้นๆ ว่า edge case นี้ cover rule ข้อไหน
4. Mock Redis และ Prisma ใช้ `jest.mock` หรือ NestJS `createTestingModule` + mock provider
5. หลังสร้างแล้ว บอก user ว่ารัน `npm run test -- --coverage` เพื่อตรวจ coverage

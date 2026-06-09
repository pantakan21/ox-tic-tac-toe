# Test Generation Skill

Generate unit tests โดยเน้น edge cases ของ scoring/streak logic — ตาม business rules ใน CLAUDE.md

## Trigger

เมื่อ user พิมพ์ `/test-gen` หรือบอกว่า "gen test" / "สร้าง unit test" / "เพิ่ม test"

## Context ที่ต้องอ่านก่อนทุกครั้ง

1. อ่าน CLAUDE.md Section 6 (Critical Business Rules) และ Section 2 (Scoring System)
2. อ่านไฟล์ที่ user ระบุ หรือ grep `score\|streak\|game` ใน `src/` เพื่อหา service ที่เกี่ยวข้อง
3. ก่อน gen ให้ Glob หา `*.spec.ts` ที่มีอยู่แล้วก่อน — **ห้าม gen ทับ unit ที่มี test ครบแล้ว** ให้เติมเฉพาะ unit ที่ยังขาด

## Units ที่ต้องครอบ (เช็คให้ครบทุกตัว)

| Unit | ไฟล์ | โฟกัสหลัก |
|---|---|---|
| ScoreService | `score/score.service.ts` | scoring/streak edge cases |
| BoardValidator | `game/board-validator.ts` | valid/invalid board states |
| HeuristicBot | `game/heuristic-bot.ts` | bot strategy (ต้อง mock `Math.random`) |
| GameService | `game/game.service.ts` | endGame orchestration + business rules |

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

## Bot Logic Rules (HeuristicBot)

บอทมี `MISTAKE_RATE` (random) — **ต้อง mock `Math.random` เสมอ** ไม่งั้น test จะ flaky และทดสอบ strategy ไม่ได้

```typescript
// บังคับให้บอท "ไม่พลาด" → เข้า strategy path: random >= MISTAKE_RATE
jest.spyOn(Math, 'random').mockReturnValue(0.99);

// บังคับให้บอท "พลาด" → เดินสุ่ม: random < MISTAKE_RATE
jest.spyOn(Math, 'random').mockReturnValue(0.0);
```

### Strategy edge cases (mock random = 0.99 ให้ไม่พลาดก่อน)
- **Win priority:** ถ้าบอท (O) มี 2 ใน 3 แถวและช่องที่ 3 ว่าง → ต้องเลือกช่องชนะ
- **Block priority:** ถ้า X มี 2 ใน 3 แถวและบอทไม่มีโอกาสชนะเอง → ต้องบล็อก
- **Win เหนือ Block:** ถ้าทั้งบอทชนะได้และ X ก็ใกล้ชนะ → บอทต้องเลือกชนะตัวเอง ไม่ใช่บล็อก
- **Center:** board ว่าง ไม่มี win/block → เลือกช่องกลาง (index 4)
- **Corner:** center ถูกจองแล้ว ไม่มี win/block → เลือกมุม (0,2,6,8)
- **Mistake path:** mock random = 0 → เดินช่องว่างใดก็ได้ (อย่า assert ตำแหน่งเจาะจง assert แค่ว่าเป็นช่องว่าง)
- **Full board:** ไม่มีช่องว่าง → throw error

## GameService Orchestration (endGame)

ตรวจ business rules ที่ Section 6 ของ CLAUDE.md — mock ทุก dependency (prisma, validator, scoreService, leaderboardService)

- **Reject เกมที่ยังไม่จบ:** board ที่ยังไม่มีผล → `getResult` คืน null → ต้อง throw `BadRequestException`
- **Validate ก่อนบันทึก:** ต้องเรียก `validator.validate(board)` ก่อน record (Business Rule #2)
- **บันทึก GameLog ทุกเกม:** ต้องเรียก `prisma.gameLog.create` (Business Rule #3)
- **เรียก applyResult ด้วย result ที่ validate แล้ว** ไม่ใช่ค่าจาก client
- **Invalidate cache หลังคิดคะแนน:** ต้องเรียก `leaderboardService.invalidateCache()` หลัง `applyResult`
- **getCoachAnalysis:** ถ้า gameLog ไม่ใช่ของ user นั้น → throw `NotFoundException` (กัน IDOR)

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

describe('HeuristicBot', () => {
  afterEach(() => jest.restoreAllMocks()); // คืน Math.random เสมอ

  describe('strategy (no mistake)', () => {
    beforeEach(() => jest.spyOn(Math, 'random').mockReturnValue(0.99));
    it('should take the winning move when available', ...)
    it('should block the opponent winning move', ...)
    it('should prefer winning over blocking', ...)
    it('should take center on empty board', ...)
    it('should take a corner when center is occupied', ...)
  })

  describe('mistake path', () => {
    it('should return an empty cell when random < MISTAKE_RATE', ...) // assert ว่าเป็นช่องว่าง
  })

  it('should throw when board is full', ...)
})

describe('GameService', () => {
  // mock prisma, validator, bot, scoreService, aiCoach, leaderboardService

  describe('endGame', () => {
    it('should throw BadRequestException when game is not finished', ...)
    it('should validate board before recording', ...)        // Rule #2
    it('should create a GameLog for every game', ...)         // Rule #3
    it('should invalidate leaderboard cache after applying score', ...)
  })

  describe('getCoachAnalysis', () => {
    it('should throw NotFoundException when log belongs to another user', ...) // IDOR
  })
})
```

## Output Rules

1. สร้างไฟล์ `.spec.ts` ข้างๆ ไฟล์ที่ test เสมอ (e.g. `score.service.spec.ts`)
2. ใช้ `describe` nested ตาม method name
3. ทุก test case ต้องมี comment สั้นๆ ว่า edge case นี้ cover rule ข้อไหน
4. Mock Redis และ Prisma ใช้ `jest.mock` หรือ NestJS `createTestingModule` + mock provider
5. หลังสร้างแล้ว บอก user ว่ารัน `npm run test -- --coverage` เพื่อตรวจ coverage

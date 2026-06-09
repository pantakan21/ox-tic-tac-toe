import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Cell } from './board-validator';

interface Move {
  player: 'X' | 'O';
  position: number;
  boardAfter: Cell[];
}

@Injectable()
export class AiCoachService {
  private readonly logger = new Logger(AiCoachService.name);
  private readonly genAI: GoogleGenerativeAI;

  constructor(private readonly config: ConfigService) {
    this.genAI = new GoogleGenerativeAI(
      this.config.getOrThrow<string>('GEMINI_API_KEY'),
    );
  }

  async analyze(moves: Move[], result: 'WIN' | 'LOSE' | 'DRAW'): Promise<string> {
    const moveSummary = moves
      .map((m, i) => `ตาที่ ${i + 1}: ${m.player} วางที่ช่อง ${m.position} (0-8)`)
      .join('\n');

    const resultText = { WIN: 'ผู้เล่นชนะ', LOSE: 'ผู้เล่นแพ้', DRAW: 'เสมอ' }[result];

    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });

      const prompt = `คุณเป็น AI coach สำหรับเกม Tic-tac-toe วิเคราะห์เกมนี้เป็นภาษาไทย:

ผลลัพธ์: ${resultText}
ผู้เล่นคือ X บอทคือ O

ลำดับการเดิน:
${moveSummary}

กรุณาวิเคราะห์:
1. ตาที่น่าสนใจหรือพลาดโอกาสของผู้เล่น
2. คำแนะนำสำหรับการเล่นครั้งต่อไป

ตอบสั้นๆ ไม่เกิน 3-4 ประโยค`;

      const result2 = await model.generateContent(prompt);
      return result2.response.text();
    } catch (err) {
      this.logger.error('AI Coach error', err);
      return 'ไม่สามารถเชื่อมต่อ AI Coach ได้ในขณะนี้';
    }
  }
}

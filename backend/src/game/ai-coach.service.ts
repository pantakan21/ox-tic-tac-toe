import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { Cell } from './board-validator';

interface Move {
  player: 'X' | 'O';
  position: number;
  boardAfter: Cell[];
}

@Injectable()
export class AiCoachService {
  private readonly logger = new Logger(AiCoachService.name);
  private readonly client: Anthropic;

  constructor(private readonly config: ConfigService) {
    this.client = new Anthropic({
      apiKey: this.config.getOrThrow<string>('ANTHROPIC_API_KEY'),
    });
  }

  async analyze(moves: Move[], result: 'WIN' | 'LOSE' | 'DRAW'): Promise<string> {
    const moveSummary = moves
      .map((m, i) => `ตาที่ ${i + 1}: ${m.player} วางที่ช่อง ${m.position} (0-8)`)
      .join('\n');

    const resultText = { WIN: 'ผู้เล่นชนะ', LOSE: 'ผู้เล่นแพ้', DRAW: 'เสมอ' }[result];

    try {
      const message = await this.client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 512,
        messages: [
          {
            role: 'user',
            content: `คุณเป็น AI coach สำหรับเกม Tic-tac-toe วิเคราะห์เกมนี้เป็นภาษาไทย:

ผลลัพธ์: ${resultText}
ผู้เล่นคือ X บอทคือ O

ลำดับการเดิน:
${moveSummary}

กรุณาวิเคราะห์:
1. ตาที่น่าสนใจหรือพลาดโอกาสของผู้เล่น
2. คำแนะนำสำหรับการเล่นครั้งต่อไป

ตอบสั้นๆ ไม่เกิน 3-4 ประโยค`,
          },
        ],
      });

      const block = message.content[0];
      return block.type === 'text' ? block.text : 'ไม่สามารถวิเคราะห์ได้ในขณะนี้';
    } catch (err) {
      this.logger.error('AI Coach error', err);
      return 'ไม่สามารถเชื่อมต่อ AI Coach ได้ในขณะนี้';
    }
  }
}

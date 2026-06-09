import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Groq from 'groq-sdk';
import { Cell } from './board-validator';

interface Move {
  player: 'X' | 'O';
  position: number;
  boardAfter: Cell[];
}

@Injectable()
export class AiCoachService {
  private readonly logger = new Logger(AiCoachService.name);
  private readonly client: Groq;

  constructor(private readonly config: ConfigService) {
    this.client = new Groq({
      apiKey: this.config.getOrThrow<string>('GROQ_API_KEY'),
    });
  }

  async analyze(moves: Move[], result: 'WIN' | 'LOSE' | 'DRAW'): Promise<string> {
    const moveSummary = moves
      .map((m, i) => `ตาที่ ${i + 1}: ${m.player === 'X' ? 'คุณ' : 'บอท'} วางที่ช่องที่ ${m.position + 1}`)
      .join('\n');

    const resultText = { WIN: 'ผู้เล่นชนะ', LOSE: 'ผู้เล่นแพ้', DRAW: 'เสมอ' }[result];

    try {
      const completion = await this.client.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        max_tokens: 512,
        messages: [
          {
            role: 'user',
            content: `คุณคือ AI coach เกม Tic-tac-toe กระดาน 3x3 ช่องที่ 1-9 (1=บนซ้าย, 5=กลาง, 9=ล่างขวา)
ผลเกม: ${resultText}

การเดินตามลำดับ:
${moveSummary}

ตอบเป็น HTML สั้นๆ ภาษาไทยพูดคุย ไม่เป็นทางการ แบบเพื่อนช่วยดูเกมให้:
<p>ประโยคสรุปว่าเกมนี้เป็นยังไง เช่น ชนะเร็ว แพ้เพราะอะไร หรือสูสี</p>
<p>คำแนะนำ 1 อย่างสำหรับเกมหน้า เช่น ลองยึดตรงกลางก่อน หรือระวังบอทตั้ง 2 แถวพร้อมกัน</p>
ห้ามใช้ bullet, ห้ามพูดว่า "ผู้เล่น X" ให้ใช้ "คุณ" แทน ห้ามใช้ศัพท์เทคนิคเช่น fork`,
          },
        ],
      });

      return completion.choices[0]?.message?.content ?? 'ไม่สามารถวิเคราะห์ได้ในขณะนี้';
    } catch (err) {
      this.logger.error('AI Coach error', err);
      return 'ไม่สามารถเชื่อมต่อ AI Coach ได้ในขณะนี้';
    }
  }
}

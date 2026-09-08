import type { ChatMessage, ToolCaller, ToolTraceEntry } from '../types';

type Result = { reply: string; toolTrace: ToolTraceEntry[] };

export async function runGeminiConversation(apiKey: string | undefined, model: string, messages: ChatMessage[], _tools: unknown[] = [], _toolCaller?: ToolCaller): Promise<Result> {
  if (!apiKey?.trim()) return { reply: 'ยังไม่ได้ตั้งค่า GEMINI_API_KEY ให้ Worker จึงยังเรียก Gemini ไม่ได้\n\nLocal: สร้างไฟล์ .dev.vars จาก .dev.vars.example แล้วใส่ GEMINI_API_KEY จากนั้น restart npm run dev\nDeploy: รัน npx wrangler secret put GEMINI_API_KEY แล้ว deploy ใหม่', toolTrace: [] };
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ contents: messages.map((message) => ({ role: message.role === 'assistant' ? 'model' : 'user', parts: [{ text: message.content }] })) }),
  });
  if (!response.ok) return { reply: `Gemini ตอบกลับผิดพลาด (${response.status})`, toolTrace: [] };
  const data = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
  const reply = data.candidates?.[0]?.content?.parts?.map((part) => part.text ?? '').join('').trim();
  return { reply: reply || 'Gemini ไม่ได้ส่งข้อความตอบกลับ', toolTrace: [] };
}
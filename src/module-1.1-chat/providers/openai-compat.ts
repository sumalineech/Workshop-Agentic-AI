import type { ChatMessage, ToolCaller, ToolTraceEntry } from '../types';

type Result = { reply: string; toolTrace: ToolTraceEntry[] };

export async function runOpenAiCompatConversation(baseUrl: string | undefined, apiKey: string | undefined, model: string, messages: ChatMessage[], _tools: unknown[] = [], _toolCaller?: ToolCaller): Promise<Result> {
  if (!baseUrl?.trim()) return { reply: 'ยังไม่ได้ตั้งค่า OPENAI_COMPAT_BASE_URL ใน wrangler.toml', toolTrace: [] };
  if (!apiKey?.trim()) return { reply: 'ยังไม่ได้ตั้งค่า OPENAI_COMPAT_API_KEY ให้ Worker\n\nLocal: ใส่ค่าในไฟล์ .dev.vars แล้ว restart npm run dev\nDeploy: รัน npx wrangler secret put OPENAI_COMPAT_API_KEY แล้ว deploy ใหม่', toolTrace: [] };
  const response = await fetch(`${baseUrl.replace(/\/+$/, '')}/chat/completions`, {
    method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model, messages }),
  });
  if (!response.ok) return { reply: `OpenAI-compatible gateway ตอบกลับผิดพลาด (${response.status})`, toolTrace: [] };
  const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
  return { reply: data.choices?.[0]?.message?.content?.trim() || 'OpenAI-compatible ไม่ได้ส่งข้อความตอบกลับ', toolTrace: [] };
}
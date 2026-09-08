import type { Env } from '../env';
import { errorJson, json } from '../lib/http';
import { runGeminiConversation } from './providers/gemini';
import { runOpenAiCompatConversation } from './providers/openai-compat';
import type { ChatMessage, ChatProvider, ChatTurnResult, ToolCaller } from './types';

const OPENAI_BASE_URL = 'https://api.openai.com/v1';

export function resolveProvider(value: unknown, env: Env): ChatProvider {
  const provider = typeof value === 'string' ? value : env.DEFAULT_CHAT_PROVIDER;
  return provider === 'openai' || provider === 'openai-compat' ? provider : 'gemini';
}
export function defaultModelFor(provider: ChatProvider, env: Env): string {
  return provider === 'gemini' ? env.GEMINI_MODEL || 'gemini-flash-latest' : provider === 'openai' ? env.OPENAI_MODEL || 'gpt-4o-mini' : env.OPENAI_COMPAT_MODEL || 'gpt-4o-mini';
}
export function buildSystemPrompt(): string { return 'คุณคือผู้ช่วย AI ของ AI Desk ตอบเป็นภาษาไทยอย่างสุภาพ กระชับ และช่วยเหลือผู้ใช้ตามคำถาม'; }
function apiKey(provider: ChatProvider, env: Env): string | undefined { return provider === 'gemini' ? env.GEMINI_API_KEY : provider === 'openai' ? env.OPENAI_API_KEY : env.OPENAI_COMPAT_API_KEY; }
function baseUrl(provider: ChatProvider, env: Env): string | undefined { return provider === 'openai' ? OPENAI_BASE_URL : provider === 'openai-compat' ? env.OPENAI_COMPAT_BASE_URL : undefined; }
function resolveTools(): unknown[] { return []; }

export async function runChatTurn(message: string, history: ChatMessage[], provider: ChatProvider, model: string, env: Env, toolCaller?: ToolCaller): Promise<ChatTurnResult> {
  const messages: ChatMessage[] = [...history, { role: 'user', content: `${buildSystemPrompt()}\n\nผู้ใช้: ${message}` }];
  const result = provider === 'gemini' ? await runGeminiConversation(apiKey(provider, env), model, messages, resolveTools(), toolCaller) : await runOpenAiCompatConversation(baseUrl(provider, env), apiKey(provider, env), model, messages, resolveTools(), toolCaller);
  return { reply: result.reply, provider, model, toolTrace: result.toolTrace };
}

export async function handleChatRoute(request: Request, env: Env): Promise<Response> {
  if (request.method !== 'POST') return errorJson('รองรับเฉพาะ POST /api/chat', 405);
  let body: { message?: unknown; history?: unknown; provider?: unknown; model?: unknown };
  try { body = await request.json() as typeof body; } catch { return errorJson('รูปแบบ JSON ไม่ถูกต้อง', 400); }
  const message = typeof body.message === 'string' ? body.message.trim() : '';
  if (!message) return errorJson('กรุณาระบุ message', 400);
  const provider = resolveProvider(body.provider, env);
  const model = typeof body.model === 'string' && body.model.trim() ? body.model.trim() : defaultModelFor(provider, env);
  const history = Array.isArray(body.history) ? body.history.filter((item): item is ChatMessage => Boolean(item && typeof item === 'object' && ((item as ChatMessage).role === 'user' || (item as ChatMessage).role === 'assistant') && typeof (item as ChatMessage).content === 'string')) : [];
  try { return json(await runChatTurn(message, history, provider, model, env)); } catch { return errorJson('เกิดข้อผิดพลาดระหว่างเรียก provider', 502); }
}
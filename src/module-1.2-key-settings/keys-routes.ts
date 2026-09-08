import { Env } from '../env';
import { requireAdminToken } from '../lib/auth';
import { errorJson, json, methodNotAllowed } from '../lib/http';
import { ChatProvider } from '../module-1.1-chat/types';
import { clearApiKey, clearBaseUrl, getBaseUrlStatus, getKeyStatuses, setApiKey, setBaseUrl } from './keys-store';

const VALID_PROVIDERS: ChatProvider[] = ['gemini', 'openai', 'openai-compat'];

/** GET/POST/DELETE /api/settings/keys — ทุกเมธอดต้องมี header X-Admin-Token ที่ถูกต้อง (ดู lib/auth.ts) */
export async function handleKeysRoute(request: Request, env: Env): Promise<Response> {
  const authError = requireAdminToken(request, env);
  if (authError) return authError;

  if (request.method === 'GET') {
    const [keys, baseUrl] = await Promise.all([getKeyStatuses(env), getBaseUrlStatus(env)]);
    return json({ keys, baseUrl });
  }

  if (request.method === 'POST') {
    let body: { provider?: string; apiKey?: string; baseUrl?: string };
    try {
      body = await request.json();
    } catch {
      return errorJson('body ต้องเป็น JSON');
    }

    let provider: ChatProvider | undefined;
    let apiKey: string | undefined;
    let baseUrl: string | undefined;

    // ตรวจสอบทุกค่าก่อนเขียน เพื่อไม่ให้ request ที่มีบาง field ผิดรูปแบบเขียนค่าอื่นไปแล้ว
    if (body.apiKey !== undefined) {
      provider = body.provider as ChatProvider;
      if (!VALID_PROVIDERS.includes(provider)) {
        return errorJson(`provider ต้องเป็นหนึ่งใน ${VALID_PROVIDERS.join(', ')}`);
      }
      if (typeof body.apiKey !== 'string' || !body.apiKey.trim()) return errorJson('apiKey ห้ามว่าง');
      apiKey = body.apiKey.trim();
    }

    // ตั้ง base URL ของ openai-compat gateway (ไม่เกี่ยวกับ provider gemini/openai ซึ่งใช้ endpoint คงที่)
    if (body.baseUrl !== undefined) {
      if (typeof body.baseUrl !== 'string' || !body.baseUrl.trim()) return errorJson('baseUrl ห้ามว่าง');
       baseUrl = body.baseUrl.trim();
      if (!/^https?:\/\//i.test(baseUrl)) return errorJson('baseUrl ต้องขึ้นต้นด้วย http:// หรือ https://');
    }

    if (body.apiKey === undefined && body.baseUrl === undefined) {
      return errorJson('ต้องส่ง {provider, apiKey} หรือ {baseUrl} มาอย่างน้อยหนึ่งอย่าง');
    }

    if (provider && apiKey) await setApiKey(env, provider, apiKey);
    if (baseUrl) await setBaseUrl(env, baseUrl);

    return json({ ok: true, source: 'kv' });
  }

  if (request.method === 'DELETE') {
    const url = new URL(request.url);
    const provider = url.searchParams.get('provider') as ChatProvider | null;
    const field = url.searchParams.get('field');

    if (field === 'baseUrl') {
      await clearBaseUrl(env);
      return json({ ok: true, field: 'baseUrl', cleared: true });
    }

    if (!provider || !VALID_PROVIDERS.includes(provider)) {
      return errorJson(`ต้องระบุ ?provider= หนึ่งใน ${VALID_PROVIDERS.join(', ')} หรือ ?field=baseUrl`);
    }
    await clearApiKey(env, provider);
    return json({ ok: true, provider, cleared: true });
  }

  return methodNotAllowed();
}

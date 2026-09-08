/**
 * Minimal Cloudflare binding types used by Module 1.1.
 *
 * The full `@cloudflare/workers-types` package remains in devDependencies for
 * Wrangler builds. These declarations also let the editor typecheck the
 * starter module before node_modules has been installed locally.
 */
interface KVNamespace {
  get(key: string, type?: 'text'): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
  delete(key: string): Promise<void>;
}

interface Fetcher {
  fetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response>;
}
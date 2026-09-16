// Runs the Worker with no DEV_EMAIL binding: every API call must be refused,
// and an Access identity supplied by the runtime must be used when present.
import { env } from 'cloudflare:test';
import { describe, it, expect } from 'vitest';
import worker from '../src/worker.js';

describe('identity', () => {
  it('returns 401 when neither Access nor DEV_EMAIL provides an email', async () => {
    const envWithoutEmail = Object.assign({}, env, { DEV_EMAIL: undefined });
    const res = await worker.fetch(new Request('https://example.com/api/doc'), envWithoutEmail, {});
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: 'unauthenticated' });
  });

  it('uses the Access identity when the runtime provides one', async () => {
    const ctx = { access: { getIdentity: async () => ({ email: 'mom@example.com' }) } };
    const envWithoutEmail = Object.assign({}, env, { DEV_EMAIL: undefined });
    const res = await worker.fetch(new Request('https://example.com/api/doc', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ baseVersion: null, data: { a: 1 } }),
    }), envWithoutEmail, ctx);
    expect(res.status).toBe(200);
    const row = await env.DB.prepare('SELECT updated_by FROM document WHERE id = 1').first('updated_by');
    expect(row).toBe('mom@example.com');
  });
});

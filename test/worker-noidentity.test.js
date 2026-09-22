// Runs the Worker with no DEV_EMAIL binding: every API call must be refused.
// DEV_EMAIL must also be ignored outside localhost/127.0.0.1, even when it is set.
import { env } from 'cloudflare:test';
import { describe, it, expect } from 'vitest';
import worker from '../src/worker.js';

describe('identity', () => {
  it('returns 401 when there is no cookie and no DEV_EMAIL', async () => {
    const envWithoutEmail = Object.assign({}, env, { DEV_EMAIL: undefined });
    const res = await worker.fetch(new Request('http://localhost/api/doc'), envWithoutEmail, {});
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: 'unauthenticated' });
  });

  it('ignores DEV_EMAIL on a non-local hostname', async () => {
    const res = await worker.fetch(new Request('https://household.example/api/doc'), env, {});
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: 'unauthenticated' });
  });
});

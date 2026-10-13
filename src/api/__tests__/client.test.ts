import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiFetch } from '../client';

describe('apiFetch timeout', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('covers response body reading and JSON parsing', async () => {
    vi.useFakeTimers();
    let observedSignal: AbortSignal | undefined;
    const fetchMock = vi.fn((_input: RequestInfo | URL, init?: RequestInit) => {
      observedSignal = init?.signal as AbortSignal;
      return Promise.resolve({
        ok: true,
        json: () => new Promise((_resolve, reject) => {
          observedSignal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')), { once: true });
        }),
      });
    });
    vi.stubGlobal('fetch', fetchMock);

    const request = apiFetch('/large-projection', { timeout: 100 });
    await vi.waitFor(() => expect(observedSignal).toBeDefined());
    await vi.advanceTimersByTimeAsync(100);

    await expect(request).resolves.toEqual({ data: null, error: 'Request cancelled', ok: false });
    expect(observedSignal?.aborted).toBe(true);
  });
});

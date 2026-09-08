import { afterEach, describe, expect, it, vi } from 'vitest';
import { createEmptyState } from '@/domain/rules/fixtures';
import { commitRuntimeState, readRuntimeSnapshot } from '@/infrastructure/runtime-client';

const previous = createEmptyState();
const next = { ...previous, settings: { globallyPaused: true } };
const response = (state = next) => ({ ok: true, state, permissions: {}, installedRuleIds: [] });
afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe('runtime client recovery', () => {
  it('confirms the authoritative result after a response channel is lost without replaying the write', async () => {
    const sendMessage = vi
      .fn()
      .mockRejectedValueOnce(new Error('channel closed'))
      .mockResolvedValueOnce(response());
    vi.stubGlobal('browser', { runtime: { sendMessage } });
    expect((await commitRuntimeState(previous, next)).state).toEqual(next);
    expect(sendMessage.mock.calls.map(([message]) => message.operation)).toEqual(['commit', 'snapshot']);
  });
  it('does not claim success when a failed commit was rolled back', async () => {
    const sendMessage = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, error: 'save failed' })
      .mockResolvedValueOnce(response(previous));
    vi.stubGlobal('browser', { runtime: { sendMessage } });
    await expect(commitRuntimeState(previous, next)).rejects.toThrow('save failed');
  });
  it('retries only the read when startup closes the initial message channel', async () => {
    const sendMessage = vi
      .fn()
      .mockRejectedValueOnce(new Error('starting'))
      .mockResolvedValueOnce(response());
    vi.stubGlobal('browser', { runtime: { sendMessage } });
    expect((await readRuntimeSnapshot(previous)).state).toEqual(next);
    expect(sendMessage.mock.calls.map(([message]) => message.operation)).toEqual(['snapshot', 'snapshot']);
  });
  it('bounds a missing response instead of leaving the UI loading forever', async () => {
    vi.useFakeTimers();
    const sendMessage = vi.fn().mockImplementation(() => new Promise(() => {}));
    vi.stubGlobal('browser', { runtime: { sendMessage } });
    const pending = expect(readRuntimeSnapshot(previous)).rejects.toThrow('did not respond');
    await vi.advanceTimersByTimeAsync(10_000);
    await pending;
    expect(vi.getTimerCount()).toBe(0);
  });
});

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
const shared = vi.hoisted(() => ({ instance: { marker: 'canonical-webcontainer' }, reads: 0, fail: false }));
vi.mock('../app/lib/webcontainer', () => ({
  get webcontainer() {
    shared.reads++;
    return shared.fail ? Promise.reject(new Error('boot failed')) : Promise.resolve(shared.instance);
  },
}));
beforeEach(() => {
  vi.resetModules();
  vi.stubGlobal('window', {});
  shared.reads = 0;
  shared.fail = false;
});
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe('WebContainer optimizer uses the application singleton', () => {
  it('reuses one canonical instance for preboot and concurrent callers', async () => {
    const optimizer = await import('../app/lib/performance/webcontainer-optimizer');
    optimizer.prebootWebContainer();
    optimizer.prebootWebContainer();
    const instances = await Promise.all([optimizer.getWebContainer(), optimizer.getWebContainer()]);
    expect(instances).toEqual([shared.instance, shared.instance]);
    expect(shared.reads).toBe(1);
    expect(optimizer.isWebContainerReady()).toBe(true);
  });
  it('does not start a browser container on the server', async () => {
    vi.stubGlobal('window', undefined);
    const optimizer = await import('../app/lib/performance/webcontainer-optimizer');
    optimizer.prebootWebContainer();
    expect(shared.reads).toBe(0);
    expect(optimizer.isWebContainerReady()).toBe(false);
  });
  it('propagates boot errors to callers without marking the instance ready', async () => {
    shared.fail = true;
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const optimizer = await import('../app/lib/performance/webcontainer-optimizer');
    await expect(optimizer.getWebContainer()).rejects.toThrow('boot failed');
    expect(optimizer.isWebContainerReady()).toBe(false);
  });
});

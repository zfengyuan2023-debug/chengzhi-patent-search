import { describe, expect, it, vi } from "vitest";
import { MemoryCache } from "@/lib/patents/cache";

describe("MemoryCache", () => {
  it("does not call the loader again before the entry expires", async () => {
    let now = 1_000;
    const cache = new MemoryCache(() => now);
    const loader = vi.fn(async () => "battery");
    const first = await cache.getOrLoad("search", 500, loader);
    const second = await cache.getOrLoad("search", 500, loader);
    expect(first).toEqual({ value: "battery", hit: false });
    expect(second).toEqual({ value: "battery", hit: true });
    expect(loader).toHaveBeenCalledTimes(1);

    now = 1_600;
    const third = await cache.getOrLoad("search", 500, loader);
    expect(third.hit).toBe(false);
    expect(loader).toHaveBeenCalledTimes(2);
  });

  it("shares one in-flight load across callers", async () => {
    const cache = new MemoryCache();
    let release: (value: string) => void = () => undefined;
    const loader = vi.fn(
      () =>
        new Promise<string>((resolve) => {
          release = resolve;
        }),
    );
    const first = cache.getOrLoad("same", 1_000, loader);
    const second = cache.getOrLoad("same", 1_000, loader);
    expect(loader).toHaveBeenCalledTimes(1);
    release("done");
    await expect(first).resolves.toEqual({ value: "done", hit: false });
    await expect(second).resolves.toEqual({ value: "done", hit: true });
  });

  it("does not cache a failed load", async () => {
    const cache = new MemoryCache();
    const loader = vi.fn().mockRejectedValueOnce(new Error("upstream")).mockResolvedValueOnce("ok");
    await expect(cache.getOrLoad("key", 1_000, loader)).rejects.toThrow("upstream");
    await expect(cache.getOrLoad("key", 1_000, loader)).resolves.toEqual({ value: "ok", hit: false });
    expect(loader).toHaveBeenCalledTimes(2);
  });
});

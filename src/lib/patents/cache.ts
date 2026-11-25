export type CacheHit<T> = {
  value: T;
  /** True when the loader did not run for this call. */
  hit: boolean;
};

export interface CacheStore {
  get<T>(key: string): T | undefined;
  set<T>(key: string, value: T, ttlMs: number): void;
  getOrLoad<T>(key: string, ttlMs: number, loader: () => Promise<T>): Promise<CacheHit<T>>;
}

type Entry = {
  value: unknown;
  expiresAt: number;
};

/**
 * Process-local TTL cache. A self-hosted Node server shares one instance via
 * `globalThis`. Swap this class for Redis by implementing `CacheStore`.
 */
export class MemoryCache implements CacheStore {
  private entries = new Map<string, Entry>();
  private inflight = new Map<string, Promise<unknown>>();

  constructor(private now: () => number = Date.now) {}

  get<T>(key: string): T | undefined {
    const entry = this.entries.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt <= this.now()) {
      this.entries.delete(key);
      return undefined;
    }
    return entry.value as T;
  }

  set<T>(key: string, value: T, ttlMs: number): void {
    this.entries.set(key, { value, expiresAt: this.now() + ttlMs });
  }

  async getOrLoad<T>(key: string, ttlMs: number, loader: () => Promise<T>): Promise<CacheHit<T>> {
    const cached = this.get<T>(key);
    if (cached !== undefined) return { value: cached, hit: true };

    const pending = this.inflight.get(key);
    if (pending) return { value: (await pending) as T, hit: true };

    const promise = loader()
      .then((value) => {
        this.set(key, value, ttlMs);
        return value;
      })
      .finally(() => {
        if (this.inflight.get(key) === promise) this.inflight.delete(key);
      });

    this.inflight.set(key, promise);
    return { value: (await promise) as T, hit: false };
  }

  get size(): number {
    return this.entries.size;
  }
}

export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value) ?? "null";
  if (Array.isArray(value)) return `[${value.map((item) => stableStringify(item)).join(",")}]`;
  const record = value as Record<string, unknown>;
  return `{${Object.keys(record)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
    .join(",")}}`;
}

const globalCache = globalThis as typeof globalThis & { __chengzhiPatentCache?: MemoryCache };

export function getSharedCache(): MemoryCache {
  if (!globalCache.__chengzhiPatentCache) {
    globalCache.__chengzhiPatentCache = new MemoryCache();
  }
  return globalCache.__chengzhiPatentCache;
}

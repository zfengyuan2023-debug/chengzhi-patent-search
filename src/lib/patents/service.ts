import { stableStringify, type CacheStore } from "@/lib/patents/cache";
import { ProviderRequestError } from "@/lib/patents/errors";
import { MISSING_API_KEY_MESSAGE, UPSTREAM_ERROR_MESSAGE } from "@/lib/patents/messages";
import { buildCharts } from "@/lib/patents/aggregate";
import { parseSearchInput } from "@/lib/patents/parse-query";
import type { PatentProvider } from "@/lib/patents/provider";
import type {
  PatentRecord,
  ResultCharts,
  SearchInput,
  SearchPage,
  SearchQuery,
  ServiceFailure,
  ServiceResult,
} from "@/lib/patents/types";

function cacheKey(operation: string, providerId: string, query: SearchQuery): string {
  const { after, pageSize, ...filters } = query;
  const payload = operation === "summary" ? filters : { ...filters, after, pageSize };
  return `${operation}:${providerId}:${stableStringify(payload)}`;
}

export class PatentSearchService {
  constructor(
    private readonly provider: PatentProvider,
    private readonly cache: CacheStore,
    private readonly ttlMs: number,
  ) {}

  get providerId(): string {
    return this.provider.id;
  }

  get capabilities() {
    return this.provider.capabilities;
  }

  async search(input: SearchInput): Promise<ServiceResult<SearchPage>> {
    const parsed = parseSearchInput(input);
    if (!parsed.ok) return this.failure("invalid_query", parsed.message);
    if (!this.provider.isConfigured()) return this.failure("missing_api_key", MISSING_API_KEY_MESSAGE);
    return this.load("search", cacheKey("search", this.provider.id, parsed.query), () => this.provider.search(parsed.query));
  }

  async summarize(input: SearchInput): Promise<ServiceResult<ResultCharts>> {
    const parsed = parseSearchInput({ ...input, cursor: undefined, trail: undefined });
    if (!parsed.ok) return this.failure("invalid_query", parsed.message);
    if (!this.provider.isConfigured()) return this.failure("missing_api_key", MISSING_API_KEY_MESSAGE);
    const summaryQuery: SearchQuery = { ...parsed.query, after: undefined };
    const loaded = await this.load("summary", cacheKey("summary", this.provider.id, summaryQuery), () =>
      this.provider.summarize(summaryQuery),
    );
    if (!loaded.ok) return loaded;
    return {
      ok: true,
      cached: loaded.cached,
      providerId: this.provider.id,
      data: buildCharts(loaded.data.rows, loaded.data.total),
    };
  }

  async getById(id: string): Promise<ServiceResult<PatentRecord>> {
    const trimmed = id.trim();
    if (!trimmed) return this.failure("not_found", "没有找到该专利。");
    if (!this.provider.isConfigured()) return this.failure("missing_api_key", MISSING_API_KEY_MESSAGE);
    const key = `detail:${this.provider.id}:${trimmed.toUpperCase()}`;
    const loaded = await this.load(key, key, async () => {
      const record = await this.provider.getById(trimmed);
      if (!record) throw new ProviderRequestError("not_found", "没有找到该专利。");
      return record;
    });
    return loaded;
  }

  private failure(code: ServiceFailure["code"], message: string): ServiceFailure {
    return { ok: false, code, message, providerId: this.provider.id };
  }

  private async load<T>(operation: string, key: string, loader: () => Promise<T>): Promise<ServiceResult<T>> {
    try {
      const result = await this.cache.getOrLoad(key, this.ttlMs, loader);
      return { ok: true, data: result.value, cached: result.hit, providerId: this.provider.id };
    } catch (error) {
      if (error instanceof ProviderRequestError) {
        return this.failure(error.code, error.message);
      }
      console.error(`[patents] ${operation} failed`);
      return this.failure("upstream", UPSTREAM_ERROR_MESSAGE);
    }
  }
}

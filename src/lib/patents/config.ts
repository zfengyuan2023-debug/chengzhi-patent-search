import type { AppConfig, DataSourceStatus } from "@/lib/patents/types";

const DEFAULT_TTL_SECONDS = 900;
const DEFAULT_BASE_URL = "https://search.patentsview.org";

export function readConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const requested = (env.PATENT_DATA_SOURCE ?? "patentsview").trim().toLowerCase();
  const source = requested === "mock" ? "mock" : "patentsview";
  const ttlSeconds = Number(env.CACHE_TTL_SECONDS ?? DEFAULT_TTL_SECONDS);
  const cacheTtlMs =
    Number.isFinite(ttlSeconds) && ttlSeconds > 0 ? Math.floor(ttlSeconds * 1000) : DEFAULT_TTL_SECONDS * 1000;
  return {
    source,
    apiKey: (env.PATENTSVIEW_API_KEY ?? "").trim(),
    cacheTtlMs,
    baseUrl: (env.PATENTSVIEW_BASE_URL ?? DEFAULT_BASE_URL).trim().replace(/\/$/, "") || DEFAULT_BASE_URL,
  };
}

export type { AppConfig };

export function describeSource(config: AppConfig): DataSourceStatus {
  if (config.source === "mock") {
    return {
      providerId: "mock",
      providerLabel: "示例数据",
      configured: true,
      mode: "mock",
    };
  }
  if (!config.apiKey) {
    return {
      providerId: "patentsview",
      providerLabel: "USPTO PatentsView",
      configured: false,
      mode: "unconfigured",
    };
  }
  return {
    providerId: "patentsview",
    providerLabel: "USPTO PatentsView",
    configured: true,
    mode: "live",
  };
}

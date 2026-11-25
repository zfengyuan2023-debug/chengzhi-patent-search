import { getSharedCache } from "@/lib/patents/cache";
import { describeSource, readConfig } from "@/lib/patents/config";
import { MockProvider } from "@/lib/patents/providers/mock";
import { PatentsViewProvider } from "@/lib/patents/providers/patentsview";
import { PatentSearchService } from "@/lib/patents/service";
import type { AppConfig } from "@/lib/patents/types";
import type { PatentProvider } from "@/lib/patents/provider";

export function createProvider(config: AppConfig = readConfig()): PatentProvider {
  if (config.source === "mock") return new MockProvider();
  return new PatentsViewProvider({ apiKey: config.apiKey, baseUrl: config.baseUrl });
}

export function createPatentService(config: AppConfig = readConfig()): PatentSearchService {
  return new PatentSearchService(createProvider(config), getSharedCache(), config.cacheTtlMs);
}

export function getDataSourceStatus(config: AppConfig = readConfig()) {
  return describeSource(config);
}

import type {
  ProviderCapabilities,
  SearchPage,
  SearchQuery,
  SummaryPage,
  PatentRecord,
} from "@/lib/patents/types";

/**
 * Bibliographic search adapter.
 *
 * PatentsView is the only live implementation. EPO OPS should implement the
 * same interface later (family, INPADOC legal status, non-US publications)
 * without changing the pages. See `providers/epo-ops.ts` and the README.
 */
export interface PatentProvider {
  readonly id: string;
  readonly label: string;
  readonly capabilities: ProviderCapabilities;
  isConfigured(): boolean;
  search(query: SearchQuery): Promise<SearchPage>;
  /** First page of lightweight rows for charts. Ignores the list cursor. */
  summarize(query: SearchQuery): Promise<SummaryPage>;
  getById(id: string): Promise<PatentRecord | null>;
}

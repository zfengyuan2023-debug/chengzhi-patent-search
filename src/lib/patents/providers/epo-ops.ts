import { ProviderRequestError } from "@/lib/patents/errors";
import { EPO_NOT_IMPLEMENTED_MESSAGE } from "@/lib/patents/messages";
import type { PatentProvider } from "@/lib/patents/provider";
import type { PatentRecord, ProviderCapabilities, SearchPage, SearchQuery, SummaryPage } from "@/lib/patents/types";

/**
 * EPO Open Patent Services hook. Do not add live HTTP calls here until a
 * consumer key and secret exist in the environment.
 *
 * Later implementation sketch (still no network in this file):
 * 1. Read EPO_OPS_CONSUMER_KEY and EPO_OPS_CONSUMER_SECRET.
 * 2. Obtain an OAuth2 client-credentials token from
 *    https://ops.epo.org/3.2/auth/accesstoken
 * 3. Implement PatentProvider with:
 *    - bibliographic: GET /3.2/rest-services/published-data/publication/epodoc/{id}/biblio
 *    - family:        GET /3.2/rest-services/family/publication/docdb/{id}
 *    - legal status:  GET /3.2/rest-services/legal/publication/epodoc/{id}
 * 4. Register the provider in `createProvider` only when both variables are set.
 * 5. Map OPS XML or JSON into PatentRecord, set capabilities.family and
 *    capabilities.legalStatus to true, and fill legalStatus when events exist.
 *
 * This class intentionally has no fetch implementation.
 */
export class EpoOpsProvider implements PatentProvider {
  readonly id = "epo-ops";
  readonly label = "EPO OPS";
  readonly capabilities: ProviderCapabilities = {
    globalBibliographic: true,
    family: true,
    legalStatus: true,
    jurisdictions: ["EP", "WO", "US", "CN", "JP", "KR"],
  };

  isConfigured(): boolean {
    return false;
  }

  search(query: SearchQuery): Promise<SearchPage> {
    void query;
    return this.unimplemented();
  }

  summarize(query: SearchQuery): Promise<SummaryPage> {
    void query;
    return this.unimplemented();
  }

  getById(id: string): Promise<PatentRecord | null> {
    void id;
    return this.unimplemented();
  }

  private unimplemented(): Promise<never> {
    return Promise.reject(new ProviderRequestError("not_implemented", EPO_NOT_IMPLEMENTED_MESSAGE));
  }
}

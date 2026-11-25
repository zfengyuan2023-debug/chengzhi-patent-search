import { ProviderRequestError } from "@/lib/patents/errors";
import {
  MISSING_API_KEY_MESSAGE,
  RATE_LIMIT_MESSAGE,
  REJECTED_API_KEY_MESSAGE,
  UPSTREAM_ERROR_MESSAGE,
  UPSTREAM_UNREACHABLE_MESSAGE,
} from "@/lib/patents/messages";
import type { PatentProvider } from "@/lib/patents/provider";
import { normalizePatentNumber } from "@/lib/patents/parse-query";
import { buildPatentsViewRequest, type PatentsViewPurpose } from "@/lib/patents/providers/patentsview-query";
import { mapRecord, readTotal, toSummary } from "@/lib/patents/providers/patentsview-map";
import type { DocType, PatentRecord, ProviderCapabilities, SearchPage, SearchQuery, SummaryPage } from "@/lib/patents/types";

const CAPABILITIES: ProviderCapabilities = {
  globalBibliographic: false,
  family: false,
  legalStatus: false,
  jurisdictions: ["US"],
};

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export type PatentsViewOptions = {
  apiKey: string;
  baseUrl?: string;
  fetchImpl?: FetchLike;
};

export class PatentsViewProvider implements PatentProvider {
  readonly id = "patentsview";
  readonly label = "USPTO PatentsView";
  readonly capabilities = CAPABILITIES;

  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly fetchImpl: FetchLike;

  constructor(options: PatentsViewOptions) {
    this.apiKey = options.apiKey.trim();
    this.baseUrl = (options.baseUrl ?? "https://search.patentsview.org").replace(/\/$/, "");
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  isConfigured(): boolean {
    return this.apiKey.length > 0;
  }

  async search(query: SearchQuery): Promise<SearchPage> {
    const kind = query.number && query.numberKind === "publication" ? "publication" : "grant";
    return this.loadPage(query, "list", kind);
  }

  async summarize(query: SearchQuery): Promise<SummaryPage> {
    const kind = query.number && query.numberKind === "publication" ? "publication" : "grant";
    const payload = await this.request(buildPatentsViewRequest({ ...query, after: undefined }, "summary"));
    const records = this.recordsFrom(payload, kind);
    const total = readTotal(payload, records.length);
    return {
      rows: records.map(toSummary),
      total: total.total,
      totalExact: total.exact,
    };
  }

  async getById(id: string): Promise<PatentRecord | null> {
    const normalized = normalizePatentNumber(id);
    if (!normalized) return null;
    const primary = normalized.kind;
    const found = await this.lookup(normalized.id, primary);
    if (found) return found;
    if (primary === "publication") return this.lookup(normalized.id, "grant");
    return null;
  }

  private async lookup(id: string, kind: DocType): Promise<PatentRecord | null> {
    const query: SearchQuery = {
      keywordMode: "all",
      number: id,
      numberKind: kind,
      pageSize: 1,
    };
    const page = await this.loadPage(query, "detail", kind);
    return page.items[0] ?? null;
  }

  private async loadPage(query: SearchQuery, purpose: PatentsViewPurpose, kind: DocType): Promise<SearchPage> {
    const payload = await this.request(buildPatentsViewRequest(query, purpose));
    const items = this.recordsFrom(payload, kind);
    const total = readTotal(payload, items.length);
    return {
      items,
      total: total.total,
      totalExact: total.exact,
      pageSize: query.pageSize,
    };
  }

  private recordsFrom(payload: Record<string, unknown>, kind: DocType): PatentRecord[] {
    const key = kind === "publication" ? "publications" : "patents";
    const rows = Array.isArray(payload[key]) ? payload[key] : [];
    return rows
      .filter((row): row is Record<string, unknown> => Boolean(row) && typeof row === "object")
      .map((row) => mapRecord(row, kind))
      .filter((row): row is PatentRecord => row !== null);
  }

  private async request(request: ReturnType<typeof buildPatentsViewRequest>): Promise<Record<string, unknown>> {
    if (!this.isConfigured()) {
      throw new ProviderRequestError("missing_api_key", MISSING_API_KEY_MESSAGE);
    }

    let response: Response;
    try {
      response = await this.fetchImpl(`${this.baseUrl}${request.path}`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "X-Api-Key": this.apiKey,
        },
        body: JSON.stringify(request.body),
        cache: "no-store",
      });
    } catch {
      throw new ProviderRequestError("upstream", UPSTREAM_UNREACHABLE_MESSAGE);
    }

    if (response.status === 429) {
      throw new ProviderRequestError("rate_limited", RATE_LIMIT_MESSAGE, 429);
    }
    if (response.status === 403 || response.status === 401) {
      throw new ProviderRequestError("missing_api_key", REJECTED_API_KEY_MESSAGE, response.status);
    }
    if (!response.ok) {
      const reason = response.headers.get("x-status-reason");
      throw new ProviderRequestError(
        "upstream",
        reason ? `PatentsView 无法完成检索：${reason}` : `PatentsView 返回错误（HTTP ${response.status}）。`,
        response.status,
      );
    }

    const payload = (await response.json()) as unknown;
    if (!payload || typeof payload !== "object") {
      throw new ProviderRequestError("upstream", UPSTREAM_ERROR_MESSAGE);
    }
    const record = payload as Record<string, unknown>;
    if (record.error === true) {
      throw new ProviderRequestError("upstream", UPSTREAM_ERROR_MESSAGE);
    }
    return record;
  }
}

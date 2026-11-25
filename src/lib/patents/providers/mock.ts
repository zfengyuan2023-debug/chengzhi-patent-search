import { SUMMARY_SIZE } from "@/lib/patents/providers/patentsview-query";
import { MOCK_PATENTS } from "@/lib/patents/providers/mock-data";
import type { PatentProvider } from "@/lib/patents/provider";
import { toSummary } from "@/lib/patents/providers/patentsview-map";
import type { PatentRecord, ProviderCapabilities, SearchPage, SearchQuery, SummaryPage } from "@/lib/patents/types";

const CAPABILITIES: ProviderCapabilities = {
  globalBibliographic: false,
  family: false,
  legalStatus: false,
  jurisdictions: ["US"],
};

function includesAll(haystack: string, needle: string): boolean {
  const tokens = needle.toLowerCase().split(/\s+/).filter(Boolean);
  const text = haystack.toLowerCase();
  return tokens.every((token) => text.includes(token));
}

function matchesKeyword(record: PatentRecord, query: SearchQuery): boolean {
  if (!query.keyword) return true;
  const title = record.title;
  const abstract = record.abstract;
  if (query.keywordMode === "phrase") {
    const phrase = query.keyword.toLowerCase();
    return title.toLowerCase().includes(phrase) || abstract.toLowerCase().includes(phrase);
  }
  return includesAll(title, query.keyword) || includesAll(abstract, query.keyword);
}

function matchesInventor(record: PatentRecord, inventor: string | undefined): boolean {
  if (!inventor) return true;
  const parts = inventor.toLowerCase().split(/\s+/).filter(Boolean);
  return record.inventors.some((party) => {
    const name = party.name.toLowerCase();
    if (parts.length >= 2) {
      return name.includes(parts[0] ?? "") && name.includes(parts[parts.length - 1] ?? "");
    }
    return name.includes(inventor.toLowerCase());
  });
}

function matchesClass(record: PatentRecord, symbol: string | undefined): boolean {
  if (!symbol) return true;
  const compact = symbol.replace(/\s+/g, "").toUpperCase();
  const subclass = compact.slice(0, 4);
  return record.classifications.some((item) => {
    const value = item.symbol.replace(/\s+/g, "").toUpperCase();
    return value.startsWith(compact) || (subclass.length === 4 && value.startsWith(subclass));
  });
}

function matches(record: PatentRecord, query: SearchQuery): boolean {
  if (query.number && record.id !== query.number) return false;
  if (query.assignee) {
    const needle = query.assignee.toLowerCase();
    const hit = record.assignees.some((party) => party.name.toLowerCase().includes(needle));
    if (!hit) return false;
  }
  if (!matchesKeyword(record, query) || !matchesInventor(record, query.inventor) || !matchesClass(record, query.classification)) {
    return false;
  }
  return true;
}

function compare(a: PatentRecord, b: PatentRecord): number {
  const dateA = a.date ?? "";
  const dateB = b.date ?? "";
  if (dateA !== dateB) return dateA < dateB ? 1 : -1;
  if (a.id !== b.id) return a.id < b.id ? 1 : -1;
  return 0;
}

function afterCursor(record: PatentRecord, after: string[] | undefined): boolean {
  if (!after?.length) return true;
  const cursor = { date: after[0] ?? "", id: after[1] ?? "" };
  const date = record.date ?? "";
  if (date !== cursor.date) return date < cursor.date;
  return record.id < cursor.id;
}

export class MockProvider implements PatentProvider {
  readonly id = "mock";
  readonly label = "示例数据";
  readonly capabilities = CAPABILITIES;

  isConfigured(): boolean {
    return true;
  }

  async search(query: SearchQuery): Promise<SearchPage> {
    const items = this.filtered(query).filter((record) => afterCursor(record, query.after)).slice(0, query.pageSize);
    return {
      items,
      total: this.filtered(query).length,
      totalExact: true,
      pageSize: query.pageSize,
    };
  }

  async summarize(query: SearchQuery): Promise<SummaryPage> {
    const matched = this.filtered(query);
    return {
      rows: matched.slice(0, SUMMARY_SIZE).map(toSummary),
      total: matched.length,
      totalExact: true,
    };
  }

  async getById(id: string): Promise<PatentRecord | null> {
    const normalized = id.trim().toUpperCase().replace(/^US/, "").replace(/(A\d|B\d)$/, "");
    return MOCK_PATENTS.find((record) => record.id === normalized) ?? null;
  }

  private filtered(query: SearchQuery): PatentRecord[] {
    return MOCK_PATENTS.filter((record) => matches(record, query)).sort(compare);
  }
}

export type DesignRecord = {
  id: string;
  region: string;
  number: string;
  title: string;
  holder: string;
  date: string;
  classification: string;
  status: string;
  page_url?: string | null;
};

export type DesignSearchInput = {
  keyword?: string;
  number?: string;
  assignee?: string;
  inventor?: string;
  classification?: string;
  region?: string;
  page?: number;
  pageSize?: number;
};

export type DesignSearchPage = {
  items: DesignRecord[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

const DEFAULT_PAGE_SIZE = 20;

function clean(value?: string): string {
  return (value ?? "").replace(/\s+/g, " ").trim();
}

function haystack(record: DesignRecord): string {
  return [record.title, record.holder, record.number, record.id, record.classification, record.status]
    .join("\n")
    .toLowerCase();
}

function keywordParts(keyword: string): { phrase?: string; words: string[] } {
  const text = clean(keyword);
  const quoted = text.match(/^["“](.+)["”]$/);
  if (quoted?.[1]) return { phrase: quoted[1].trim().toLowerCase(), words: [] };
  return { words: text.toLowerCase().split(" ").filter(Boolean) };
}

function numberNeedle(value: string): string {
  return value.toUpperCase().replace(/[\s,./_-]/g, "");
}

export function uniqueDesigns(records: DesignRecord[]): DesignRecord[] {
  const seen = new Set<string>();
  const out: DesignRecord[] = [];
  for (const record of records) {
    if (!record?.id || seen.has(record.id)) continue;
    seen.add(record.id);
    out.push(record);
  }
  return out;
}

export function recordMatches(record: DesignRecord, input: DesignSearchInput): boolean {
  const region = clean(input.region).toUpperCase();
  if (region && region !== "ALL" && record.region !== region) return false;

  const number = clean(input.number);
  if (number) {
    const needle = numberNeedle(number);
    const hay = numberNeedle(`${record.number} ${record.id}`);
    if (!hay.includes(needle)) return false;
  }

  const assignee = clean(input.assignee).toLowerCase();
  if (assignee && !record.holder.toLowerCase().includes(assignee)) return false;

  const inventor = clean(input.inventor);
  if (inventor) {
    // Packed catalog rows do not include inventor names.
    return false;
  }

  const classification = clean(input.classification).toLowerCase();
  if (classification && !record.classification.toLowerCase().includes(classification)) return false;

  const keyword = clean(input.keyword);
  if (keyword) {
    const hay = haystack(record);
    const parts = keywordParts(keyword);
    if (parts.phrase) return hay.includes(parts.phrase);
    if (parts.words.some((word) => !hay.includes(word))) return false;
  }

  return Boolean(
    keyword || number || assignee || classification || (region && region !== "ALL"),
  );
}

export function isEmptyDesignQuery(input: DesignSearchInput): boolean {
  const region = clean(input.region).toUpperCase();
  return ![input.keyword, input.number, input.assignee, input.inventor, input.classification].some(
    (value) => clean(value),
  ) && (!region || region === "ALL");
}

export function searchDesigns(records: DesignRecord[], input: DesignSearchInput): DesignSearchPage {
  const pageSize = Math.min(50, Math.max(1, Math.floor(input.pageSize ?? DEFAULT_PAGE_SIZE)));
  const page = Math.max(1, Math.floor(input.page ?? 1));
  if (isEmptyDesignQuery(input)) {
    return { items: [], total: 0, page, pageSize, totalPages: 0 };
  }
  const matched = records.filter((record) => recordMatches(record, input));
  const total = matched.length;
  const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize;
  return {
    items: matched.slice(start, start + pageSize),
    total,
    page,
    pageSize,
    totalPages,
  };
}

export function officialDesignUrl(record: DesignRecord): string {
  if (record.page_url) return record.page_url;
  if (record.region === "EU") {
    const number = record.number.replace(/\s+/g, "");
    return `https://euipo.europa.eu/eSearch/#details/designs/${number}`;
  }
  const compact = record.number.toUpperCase().replace(/[\s,]/g, "").replace(/^US/, "");
  const id = compact.replace(/S\d?$/, "");
  return `https://patents.google.com/patent/US${id}S1/en`;
}

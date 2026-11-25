export type DocType = "grant" | "publication";

export type SearchInput = {
  keyword?: string;
  number?: string;
  assignee?: string;
  inventor?: string;
  classification?: string;
  pageSize?: number;
  cursor?: string;
  trail?: string;
};

/** Normalized query sent to a provider. Pagination cursors are sort keys, not offsets. */
export type SearchQuery = {
  keyword?: string;
  keywordMode: "all" | "phrase";
  number?: string;
  numberKind: "grant" | "publication";
  assignee?: string;
  inventor?: string;
  classification?: string;
  pageSize: number;
  after?: string[];
};

export type Party = {
  name: string;
  country?: string;
  location?: string;
  typeLabel?: string;
  sequence?: number;
};

export type Classification = {
  system: "CPC" | "IPC";
  symbol: string;
  kind?: string;
};

export type LegalStatus = {
  /** True only when this data source actually has a status value. */
  available: boolean;
  label: string;
  note: string;
};

export type PatentRecord = {
  id: string;
  number: string;
  title: string;
  abstract: string;
  snippet: string;
  date?: string;
  year?: number;
  docType: DocType;
  patentType?: string;
  patentTypeLabel: string;
  jurisdiction: string;
  kind?: string;
  withdrawn?: boolean;
  inventors: Party[];
  assignees: Party[];
  classifications: Classification[];
  applicationNumber?: string;
  filingDate?: string;
  relatedNumbers: string[];
  citedByUsPatents?: number;
  legalStatus: LegalStatus;
};

export type PatentSummary = {
  id: string;
  date?: string;
  year?: number;
  jurisdiction: string;
  assigneeCountries: string[];
  classes: string[];
};

export type SearchPage = {
  items: PatentRecord[];
  total: number;
  totalExact: boolean;
  pageSize: number;
};

export type SummaryPage = {
  rows: PatentSummary[];
  total: number;
  totalExact: boolean;
};

export type ChartBucket = {
  key: string;
  label: string;
  count: number;
};

export type ResultCharts = {
  sampleSize: number;
  total: number;
  truncated: boolean;
  countryMode: "jurisdiction" | "assignee";
  countryModeLabel: string;
  byYear: ChartBucket[];
  byCountry: ChartBucket[];
  byClass: ChartBucket[];
};

export type ProviderCapabilities = {
  /** Bibliographic coverage beyond US grants and US pre-grant publications. */
  globalBibliographic: boolean;
  /** Simple or extended patent family. */
  family: boolean;
  /** INPADOC-style legal events. */
  legalStatus: boolean;
  jurisdictions: string[];
};

export type AppConfig = {
  source: "patentsview" | "mock";
  apiKey: string;
  cacheTtlMs: number;
  baseUrl: string;
};

export type DataSourceMode = "live" | "mock" | "unconfigured";

export type DataSourceStatus = {
  providerId: string;
  providerLabel: string;
  configured: boolean;
  mode: DataSourceMode;
};

export type ServiceErrorCode =
  | "missing_api_key"
  | "invalid_query"
  | "rate_limited"
  | "upstream"
  | "not_found"
  | "not_implemented";

export type ServiceSuccess<T> = {
  ok: true;
  data: T;
  cached: boolean;
  providerId: string;
};

export type ServiceFailure = {
  ok: false;
  code: ServiceErrorCode;
  message: string;
  providerId: string;
};

export type ServiceResult<T> = ServiceSuccess<T> | ServiceFailure;

export type ParsedSearch = {
  ok: true;
  query: SearchQuery;
  trail: string[];
};

export type ParsedSearchError = {
  ok: false;
  message: string;
};

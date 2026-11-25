import { normalizeCountryCode } from "@/lib/patents/countries";
import type { Classification, DocType, LegalStatus, Party, PatentRecord, PatentSummary } from "@/lib/patents/types";

const PATENT_TYPES: Record<string, string> = {
  utility: "发明",
  design: "外观设计",
  plant: "植物",
  reissue: "再颁",
  defensive: "防御公开",
  "defensive publication": "防御公开",
  "sir": "法定发明登记",
  "statutory invention registration": "法定发明登记",
};

const ASSIGNEE_TYPES: Record<string, string> = {
  "2": "美国公司",
  "3": "非美国公司",
  "4": "美国个人",
  "5": "非美国个人",
  "6": "美国联邦政府",
  "7": "外国政府",
  "8": "美国郡政府",
  "9": "美国州政府",
};

export function snippet(text: string, max = 180): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const slice = clean.slice(0, max);
  const space = slice.lastIndexOf(" ");
  const base = space > max * 0.6 ? slice.slice(0, space) : slice;
  return `${base}…`;
}

function str(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return "";
}

function asRecords(value: unknown): Array<Record<string, unknown>> {
  if (Array.isArray(value)) {
    return value.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object");
  }
  if (value && typeof value === "object") return [value as Record<string, unknown>];
  return [];
}

function asBool(value: unknown): boolean | undefined {
  if (typeof value === "boolean") return value;
  if (value === 1 || value === "1" || value === "true") return true;
  if (value === 0 || value === "0" || value === "false") return false;
  return undefined;
}

function asNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) return Number(value);
  return undefined;
}

function personName(first: unknown, last: unknown, organization?: unknown): string {
  const org = str(organization);
  if (org) return org;
  const name = [str(first), str(last)].filter(Boolean).join(" ");
  return name || "未公开";
}

function locationOf(row: Record<string, unknown>, prefix: "assignee" | "inventor"): string | undefined {
  const parts = [str(row[`${prefix}_city`]), str(row[`${prefix}_state`]), str(row[`${prefix}_country`])].filter(Boolean);
  return parts.length ? parts.join(", ") : undefined;
}

function legalStatus(withdrawn: boolean | undefined, docType: DocType): LegalStatus {
  if (docType === "grant" && withdrawn === true) {
    return {
      available: true,
      label: "已撤回",
      note: "这是 PatentsView 的撤回标记，不是 INPADOC 法律状态。有效、期满、未缴年费等信息暂无。",
    };
  }
  const withdrawnNote =
    docType === "grant" && withdrawn === false
      ? "撤回标记为否，这不代表专利仍然有效。"
      : "当前数据源没有撤回标记。";
  return {
    available: false,
    label: "暂无",
    note: `PatentsView 不提供 INPADOC 法律状态。${withdrawnNote}`,
  };
}

function cpcSymbol(row: Record<string, unknown>): string {
  const group = str(row.cpc_group || row.cpc_group_id);
  if (group) return group.replace(/\s+/g, "");
  return str(row.cpc_subclass || row.cpc_subclass_id);
}

function ipcSymbol(row: Record<string, unknown>): string {
  const section = str(row.ipc_section);
  let klass = str(row.ipc_class);
  const sub = str(row.ipc_subclass);
  const main = str(row.ipc_main_group);
  const subgroup = str(row.ipc_subgroup);
  if (section && klass.startsWith(section)) klass = klass.slice(section.length);
  const head = `${section}${klass}${sub}`;
  if (!head) return "";
  if (main) return `${head} ${main}/${subgroup || "00"}`;
  return head;
}

function classificationsOf(raw: Record<string, unknown>): Classification[] {
  const seen = new Set<string>();
  const items: Classification[] = [];
  const push = (system: Classification["system"], symbol: string, kind?: string) => {
    const clean = symbol.replace(/\s+/g, " ").trim();
    if (!clean) return;
    const key = `${system}:${clean.replace(/\s+/g, "")}`;
    if (seen.has(key)) return;
    seen.add(key);
    items.push({ system, symbol: clean.replace(/\s+(?=\d)/, " "), kind });
  };

  const cpc = [...asRecords(raw.cpc_current), ...asRecords(raw.cpc_at_issue)].sort(
    (a, b) => (asNumber(a.cpc_sequence) ?? 0) - (asNumber(b.cpc_sequence) ?? 0),
  );
  for (const row of cpc) push("CPC", cpcSymbol(row), str(row.cpc_type) || undefined);

  const ipc = asRecords(raw.ipcr).sort((a, b) => (asNumber(a.ipc_sequence) ?? 0) - (asNumber(b.ipc_sequence) ?? 0));
  for (const row of ipc) push("IPC", ipcSymbol(row));
  return items;
}

function parties(raw: Record<string, unknown>, role: "assignee" | "inventor"): Party[] {
  const key = role === "assignee" ? "assignees" : "inventors";
  return asRecords(raw[key])
    .map((row) => {
      const sequence = asNumber(row[`${role}_sequence`]);
      const typeCode = str(row.assignee_type);
      return {
        sequence,
        name:
          role === "assignee"
            ? personName(row.assignee_individual_name_first, row.assignee_individual_name_last, row.assignee_organization)
            : personName(row.inventor_name_first, row.inventor_name_last),
        country: normalizeCountryCode(str(row[`${role}_country`])),
        location: locationOf(row, role),
        typeLabel: role === "assignee" && typeCode ? ASSIGNEE_TYPES[typeCode] : undefined,
      };
    })
    .sort((a, b) => (a.sequence ?? 999) - (b.sequence ?? 999));
}

export function displayNumber(id: string, kind?: string): string {
  if (id.startsWith("DMO")) return id;
  const suffix = kind && !id.endsWith(kind) ? kind : "";
  return `US${id}${suffix}`;
}

export function typeLabel(rawType: string, docType: DocType): string {
  const mapped = PATENT_TYPES[rawType.toLowerCase()];
  if (mapped) return mapped;
  if (rawType) return rawType;
  return docType === "publication" ? "美国申请公开" : "美国授权";
}

export function mapRecord(raw: Record<string, unknown>, docType: DocType): PatentRecord | null {
  const id = str(docType === "publication" ? raw.document_number : raw.patent_id);
  if (!id) return null;
  const title = str(docType === "publication" ? raw.publication_title : raw.patent_title) || "（无标题）";
  const abstract = str(docType === "publication" ? raw.publication_abstract : raw.patent_abstract);
  const date = str(docType === "publication" ? raw.publication_date : raw.patent_date) || undefined;
  const year =
    asNumber(docType === "publication" ? raw.publication_year : raw.patent_year) ??
    (date?.match(/^(\d{4})/) ? Number(date.slice(0, 4)) : undefined);
  const kind = str(raw.wipo_kind) || undefined;
  const withdrawn = docType === "grant" ? asBool(raw.withdrawn) : undefined;
  const patentType = str(docType === "publication" ? raw.publication_type : raw.patent_type);
  const application = asRecords(raw.application)[0];
  const crosswalk = asRecords(raw.granted_pregrant_crosswalk);
  const related = crosswalk
    .flatMap((row) => [str(row.document_number), str(row.patent_id), str(row.application_number)])
    .filter((value) => value && value !== id);

  return {
    id,
    number: displayNumber(id, kind),
    title,
    abstract,
    snippet: snippet(abstract),
    date,
    year,
    docType,
    patentType: patentType || undefined,
    patentTypeLabel: typeLabel(patentType, docType),
    jurisdiction: "US",
    kind,
    withdrawn,
    inventors: parties(raw, "inventor"),
    assignees: parties(raw, "assignee"),
    classifications: classificationsOf(raw),
    applicationNumber: str(application?.application_id) || str(crosswalk[0]?.application_number) || undefined,
    filingDate: str(application?.filing_date) || str(raw.patent_earliest_application_date) || undefined,
    relatedNumbers: [...new Set(related)],
    citedByUsPatents: asNumber(raw.patent_num_times_cited_by_us_patents),
    legalStatus: legalStatus(withdrawn, docType),
  };
}

export function toSummary(record: PatentRecord): PatentSummary {
  return {
    id: record.id,
    date: record.date,
    year: record.year,
    jurisdiction: record.jurisdiction,
    assigneeCountries: record.assignees.map((party) => party.country).filter((country): country is string => Boolean(country)),
    classes: record.classifications.map((item) => item.symbol),
  };
}

export function readTotal(payload: Record<string, unknown>, fallback: number): { total: number; exact: boolean } {
  const total = payload.total_hits;
  if (typeof total === "number" && Number.isFinite(total)) return { total, exact: true };
  return { total: fallback, exact: false };
}

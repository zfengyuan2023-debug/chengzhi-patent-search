import type { SearchQuery } from "@/lib/patents/types";

export const SUMMARY_SIZE = 100;

type Criterion = Record<string, unknown>;

export type PatentsViewPurpose = "list" | "detail" | "summary";

export type PatentsViewRequest = {
  path: "/api/v1/patent/" | "/api/v1/publication/";
  body: {
    q: Criterion;
    f: string[];
    s: Array<Record<string, "asc" | "desc">>;
    o: {
      size: number;
      after?: string[];
      exclude_withdrawn?: boolean;
      pad_patent_id?: boolean;
    };
  };
};

const GRANT_LIST_FIELDS = [
  "patent_id",
  "patent_title",
  "patent_date",
  "patent_year",
  "patent_abstract",
  "patent_type",
  "wipo_kind",
  "withdrawn",
  "assignees.assignee_organization",
  "assignees.assignee_individual_name_first",
  "assignees.assignee_individual_name_last",
  "assignees.assignee_country",
  "assignees.assignee_city",
  "assignees.assignee_state",
  "assignees.assignee_type",
  "assignees.assignee_sequence",
  "inventors.inventor_name_first",
  "inventors.inventor_name_last",
  "inventors.inventor_country",
  "inventors.inventor_city",
  "inventors.inventor_state",
  "inventors.inventor_sequence",
  "cpc_current.cpc_section",
  "cpc_current.cpc_subclass",
  "cpc_current.cpc_subclass_id",
  "cpc_current.cpc_group",
  "cpc_current.cpc_group_id",
  "cpc_current.cpc_type",
  "cpc_current.cpc_sequence",
  "ipcr.ipc_section",
  "ipcr.ipc_class",
  "ipcr.ipc_subclass",
  "ipcr.ipc_main_group",
  "ipcr.ipc_subgroup",
  "ipcr.ipc_sequence",
];

const GRANT_DETAIL_FIELDS = [
  ...GRANT_LIST_FIELDS,
  "application.application_id",
  "application.filing_date",
  "application.application_type",
  "granted_pregrant_crosswalk.document_number",
  "granted_pregrant_crosswalk.application_number",
  "patent_num_times_cited_by_us_patents",
  "patent_earliest_application_date",
];

const GRANT_SUMMARY_FIELDS = [
  "patent_id",
  "patent_date",
  "patent_year",
  "assignees.assignee_country",
  "assignees.assignee_sequence",
  "cpc_current.cpc_subclass",
  "cpc_current.cpc_group",
  "cpc_current.cpc_sequence",
  "ipcr.ipc_section",
  "ipcr.ipc_class",
  "ipcr.ipc_subclass",
  "ipcr.ipc_main_group",
];

const PUBLICATION_LIST_FIELDS = [
  "document_number",
  "publication_title",
  "publication_date",
  "publication_year",
  "publication_abstract",
  "publication_type",
  "assignees.assignee_organization",
  "assignees.assignee_individual_name_first",
  "assignees.assignee_individual_name_last",
  "assignees.assignee_country",
  "assignees.assignee_city",
  "assignees.assignee_state",
  "assignees.assignee_type",
  "assignees.assignee_sequence",
  "inventors.inventor_name_first",
  "inventors.inventor_name_last",
  "inventors.inventor_country",
  "inventors.inventor_city",
  "inventors.inventor_state",
  "inventors.inventor_sequence",
  "cpc_current.cpc_section",
  "cpc_current.cpc_subclass",
  "cpc_current.cpc_subclass_id",
  "cpc_current.cpc_group",
  "cpc_current.cpc_group_id",
  "cpc_current.cpc_type",
  "cpc_current.cpc_sequence",
  "ipcr.ipc_section",
  "ipcr.ipc_class",
  "ipcr.ipc_subclass",
  "ipcr.ipc_main_group",
  "ipcr.ipc_subgroup",
  "ipcr.ipc_sequence",
];

const PUBLICATION_DETAIL_FIELDS = [
  ...PUBLICATION_LIST_FIELDS,
  "granted_pregrant_crosswalk.patent_id",
  "granted_pregrant_crosswalk.application_number",
];

const PUBLICATION_SUMMARY_FIELDS = [
  "document_number",
  "publication_date",
  "publication_year",
  "assignees.assignee_country",
  "assignees.assignee_sequence",
  "cpc_current.cpc_subclass",
  "cpc_current.cpc_group",
  "cpc_current.cpc_sequence",
  "ipcr.ipc_section",
  "ipcr.ipc_class",
  "ipcr.ipc_subclass",
  "ipcr.ipc_main_group",
];

function text(field: string, value: string, mode: "all" | "phrase"): Criterion {
  const operator = mode === "phrase" ? "_text_phrase" : "_text_all";
  return { [operator]: { [field]: value } };
}

function keywordCriterion(query: SearchQuery, kind: "grant" | "publication"): Criterion {
  const title = kind === "grant" ? "patent_title" : "publication_title";
  const abstract = kind === "grant" ? "patent_abstract" : "publication_abstract";
  const value = query.keyword ?? "";
  return {
    _or: [text(title, value, query.keywordMode), text(abstract, value, query.keywordMode)],
  };
}

function assigneeCriterion(assignee: string): Criterion {
  return {
    _or: [
      text("assignees.assignee_organization", assignee, "all"),
      text("assignees.assignee_individual_name_last", assignee, "all"),
    ],
  };
}

function inventorCriterion(inventor: string): Criterion {
  const parts = inventor.split(" ").filter(Boolean);
  if (parts.length >= 2) {
    return {
      _and: [
        text("inventors.inventor_name_first", parts[0] ?? inventor, "all"),
        text("inventors.inventor_name_last", parts[parts.length - 1] ?? inventor, "all"),
      ],
    };
  }
  return {
    _or: [
      text("inventors.inventor_name_first", inventor, "all"),
      text("inventors.inventor_name_last", inventor, "all"),
    ],
  };
}

export function groupForms(symbol: string): string[] {
  const compact = symbol.replace(/\s+/g, "");
  const forms = new Set<string>([compact]);
  const match = compact.match(/^([A-HY]\d{2}[A-Z])(\d.*)$/);
  if (match?.[1] && match[2]) forms.add(`${match[1]} ${match[2]}`);
  return [...forms];
}

function classificationCriterion(symbol: string): Criterion {
  const clauses: Criterion[] = [];
  const subclass = symbol.slice(0, 4);
  if (/^[A-HY]\d{2}[A-Z]$/.test(subclass)) {
    clauses.push({ "cpc_current.cpc_subclass": subclass });
    clauses.push({ "cpc_current.cpc_subclass_id": subclass });
    const section = subclass.slice(0, 1);
    const digits = subclass.slice(1, 3);
    const letter = subclass.slice(3);
    clauses.push({
      _and: [
        { "ipcr.ipc_section": section },
        { "ipcr.ipc_subclass": letter },
        { _or: [{ "ipcr.ipc_class": digits }, { "ipcr.ipc_class": `${section}${digits}` }] },
      ],
    });
  }
  for (const form of groupForms(symbol)) {
    clauses.push({ _begins: { "cpc_current.cpc_group": form } });
    clauses.push({ _begins: { "cpc_current.cpc_group_id": form } });
  }
  if (clauses.length === 1) return clauses[0] ?? { _begins: { "cpc_current.cpc_group": symbol } };
  return { _or: clauses };
}

export function endpointKind(query: SearchQuery): "grant" | "publication" {
  return query.number && query.numberKind === "publication" ? "publication" : "grant";
}

export function buildCriteria(query: SearchQuery, kind: "grant" | "publication"): Criterion {
  const criteria: Criterion[] = [];
  if (query.keyword) criteria.push(keywordCriterion(query, kind));
  if (query.assignee) criteria.push(assigneeCriterion(query.assignee));
  if (query.inventor) criteria.push(inventorCriterion(query.inventor));
  if (query.classification) criteria.push(classificationCriterion(query.classification));
  if (query.number) {
    criteria.push(kind === "publication" ? { document_number: query.number } : { patent_id: query.number });
  }
  if (criteria.length === 1) return criteria[0] as Criterion;
  return { _and: criteria };
}

function fields(kind: "grant" | "publication", purpose: PatentsViewPurpose): string[] {
  if (kind === "publication") {
    if (purpose === "detail") return PUBLICATION_DETAIL_FIELDS;
    if (purpose === "summary") return PUBLICATION_SUMMARY_FIELDS;
    return PUBLICATION_LIST_FIELDS;
  }
  if (purpose === "detail") return GRANT_DETAIL_FIELDS;
  if (purpose === "summary") return GRANT_SUMMARY_FIELDS;
  return GRANT_LIST_FIELDS;
}

export function buildPatentsViewRequest(
  query: SearchQuery,
  purpose: PatentsViewPurpose,
): PatentsViewRequest {
  const kind = endpointKind(query);
  const size = purpose === "summary" ? SUMMARY_SIZE : purpose === "detail" ? 1 : query.pageSize;
  const sortField = kind === "publication" ? "publication_date" : "patent_date";
  const idField = kind === "publication" ? "document_number" : "patent_id";
  const body: PatentsViewRequest["body"] = {
    q: buildCriteria(query, kind),
    f: fields(kind, purpose),
    s: [{ [sortField]: "desc" }, { [idField]: "desc" }],
    o: {
      size,
      ...(kind === "grant" ? { exclude_withdrawn: false, pad_patent_id: false } : {}),
      ...(purpose !== "summary" && query.after?.length ? { after: query.after } : {}),
    },
  };
  return {
    path: kind === "publication" ? "/api/v1/publication/" : "/api/v1/patent/",
    body,
  };
}

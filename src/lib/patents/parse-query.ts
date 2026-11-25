import {
  CLASSIFICATION_FORMAT_MESSAGE,
  EMPTY_QUERY_MESSAGE,
  FIELD_TOO_LONG_MESSAGE,
  NUMBER_FORMAT_MESSAGE,
  NUMBER_TOO_SHORT_MESSAGE,
} from "@/lib/patents/messages";
import type { ParsedSearch, ParsedSearchError, SearchInput, SearchQuery } from "@/lib/patents/types";

export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 25;
const MAX_TEXT = 200;

const KIND_SUFFIX = /(A\d|B\d|E\d|S\d|P\d|H\d)$/;
const NUMBER_RE = /^(?:DMO|PP|RE|D|H|T)?\d{4,12}$/;
const CLASS_RE = /^[A-HY][A-Z0-9/]{0,19}$/;

export function cleanText(value: string | undefined): string | undefined {
  const text = value?.replace(/\s+/g, " ").trim();
  return text ? text : undefined;
}

export function encodeCursor(values: string[]): string {
  return Buffer.from(JSON.stringify(values), "utf8").toString("base64url");
}

export function decodeCursor(cursor: string | undefined): string[] | undefined {
  if (!cursor) return undefined;
  try {
    const parsed = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8")) as unknown;
    if (!Array.isArray(parsed) || parsed.some((item) => typeof item !== "string")) return undefined;
    return parsed;
  } catch {
    return undefined;
  }
}

export function normalizePatentNumber(raw: string): { id: string; kind: "grant" | "publication" } | null {
  let value = raw.trim().toUpperCase().replace(/[\s,./_-]/g, "");
  if (value.startsWith("US")) value = value.slice(2);
  const explicitPublication = /A[129]$/.test(value);
  value = value.replace(KIND_SUFFIX, "");
  if (!value) return null;
  if (!NUMBER_RE.test(value)) return null;
  const publication = explicitPublication || /^(?:19|20)\d{9}$/.test(value);
  return { id: value, kind: publication ? "publication" : "grant" };
}

export function normalizeClassification(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, "");
}

function keywordMode(keyword: string): { mode: "all" | "phrase"; value: string } {
  const quoted = keyword.match(/^["“](.+)["”]$/);
  if (quoted?.[1]) return { mode: "phrase", value: quoted[1].trim() };
  return { mode: "all", value: keyword };
}

export function parseSearchInput(input: SearchInput): ParsedSearch | ParsedSearchError {
  const keywordText = cleanText(input.keyword);
  const assignee = cleanText(input.assignee);
  const inventor = cleanText(input.inventor);
  const classificationText = cleanText(input.classification);
  const numberText = cleanText(input.number);

  if ([keywordText, assignee, inventor, classificationText, numberText].some((value) => (value?.length ?? 0) > MAX_TEXT)) {
    return { ok: false, message: FIELD_TOO_LONG_MESSAGE };
  }

  let number: string | undefined;
  let numberKind: SearchQuery["numberKind"] = "grant";
  if (numberText) {
    if (numberText.replace(/\s+/g, "").length < 4) {
      return { ok: false, message: NUMBER_TOO_SHORT_MESSAGE };
    }
    const normalized = normalizePatentNumber(numberText);
    if (!normalized) return { ok: false, message: NUMBER_FORMAT_MESSAGE };
    number = normalized.id;
    numberKind = normalized.kind;
  }

  let classification: string | undefined;
  if (classificationText) {
    classification = normalizeClassification(classificationText);
    if (!CLASS_RE.test(classification)) {
      return { ok: false, message: CLASSIFICATION_FORMAT_MESSAGE };
    }
  }

  let keyword: string | undefined;
  let mode: SearchQuery["keywordMode"] = "all";
  if (keywordText) {
    const parsed = keywordMode(keywordText);
    if (!parsed.value) return { ok: false, message: EMPTY_QUERY_MESSAGE };
    keyword = parsed.value;
    mode = parsed.mode;
  }

  if (!keyword && !number && !assignee && !inventor && !classification) {
    return { ok: false, message: EMPTY_QUERY_MESSAGE };
  }

  const requestedSize = input.pageSize ?? DEFAULT_PAGE_SIZE;
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, Math.floor(requestedSize) || DEFAULT_PAGE_SIZE));
  const after = decodeCursor(input.cursor);
  const trail = decodeCursor(input.trail) ?? [];

  return {
    ok: true,
    trail,
    query: {
      keyword,
      keywordMode: mode,
      number,
      numberKind: number ? numberKind : "grant",
      assignee,
      inventor,
      classification,
      pageSize,
      after,
    },
  };
}

export function inputFromSearchParams(
  params: Record<string, string | string[] | undefined>,
): SearchInput {
  const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) ?? "";
  return {
    keyword: first(params.keyword),
    number: first(params.number),
    assignee: first(params.assignee),
    inventor: first(params.inventor),
    classification: first(params.classification),
    cursor: first(params.cursor) || undefined,
    trail: first(params.trail) || undefined,
  };
}

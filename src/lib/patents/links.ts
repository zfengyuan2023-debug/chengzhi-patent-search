import { encodeCursor } from "@/lib/patents/parse-query";
import type { PatentRecord, SearchInput } from "@/lib/patents/types";

export function searchQueryString(
  input: SearchInput,
  extra?: { cursor?: string; trail?: string },
): string {
  const params = new URLSearchParams();
  const set = (key: string, value?: string) => {
    if (value && value.trim()) params.set(key, value.trim());
  };
  set("keyword", input.keyword);
  set("number", input.number);
  set("assignee", input.assignee);
  set("inventor", input.inventor);
  set("classification", input.classification);
  set("cursor", extra?.cursor);
  set("trail", extra?.trail);
  return params.toString();
}

export function searchHref(input: SearchInput, extra?: { cursor?: string; trail?: string }): string {
  const query = searchQueryString(input, extra);
  return query ? `/search?${query}` : "/search";
}

export function cursorFor(record: PatentRecord | undefined): string | undefined {
  if (!record) return undefined;
  return encodeCursor([record.date ?? "", record.id]);
}

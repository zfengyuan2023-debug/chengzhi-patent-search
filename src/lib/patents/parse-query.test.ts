import { describe, expect, it } from "vitest";
import { EMPTY_QUERY_MESSAGE, NUMBER_FORMAT_MESSAGE } from "@/lib/patents/messages";
import { decodeCursor, encodeCursor, normalizePatentNumber, parseSearchInput } from "@/lib/patents/parse-query";

describe("parseSearchInput", () => {
  it("rejects an empty form", () => {
    const result = parseSearchInput({});
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toBe(EMPTY_QUERY_MESSAGE);
  });

  it("normalizes grant numbers and strips kind codes", () => {
    expect(normalizePatentNumber("US 6,285,999 B2")).toEqual({ id: "6285999", kind: "grant" });
    expect(normalizePatentNumber("D345393")).toEqual({ id: "D345393", kind: "grant" });
    expect(normalizePatentNumber("RE45,123")).toEqual({ id: "RE45123", kind: "grant" });
    expect(normalizePatentNumber("US20200123456A1")).toEqual({ id: "20200123456", kind: "publication" });
  });

  it("rejects a number that is not a US patent or publication id", () => {
    const result = parseSearchInput({ number: "CN1234567A" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toBe(NUMBER_FORMAT_MESSAGE);
  });

  it("keeps a quoted keyword as a phrase and decodes the cursor", () => {
    const cursor = encodeCursor(["2020-01-01", "6285999"]);
    const result = parseSearchInput({
      keyword: "“solid electrolyte”",
      assignee: "  Northshore Energy ",
      inventor: "Priya Shah",
      classification: "h01m 10/0525",
      cursor,
      trail: encodeCursor([cursor]),
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.query.keyword).toBe("solid electrolyte");
    expect(result.query.keywordMode).toBe("phrase");
    expect(result.query.classification).toBe("H01M10/0525");
    expect(result.query.after).toEqual(["2020-01-01", "6285999"]);
    expect(result.trail).toEqual([cursor]);
    expect(decodeCursor("not-a-cursor")).toBeUndefined();
  });
});

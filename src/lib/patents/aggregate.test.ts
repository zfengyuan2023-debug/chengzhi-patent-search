import { describe, expect, it } from "vitest";
import { buildCharts } from "@/lib/patents/aggregate";
import { hasMoreResults, nextPageQuery, pageNumber, previousPageQuery } from "@/lib/patents/paging";
import { decodeCursor } from "@/lib/patents/parse-query";
import type { PatentSummary } from "@/lib/patents/types";

const rows: PatentSummary[] = [
  { id: "1", year: 2024, date: "2024-01-01", jurisdiction: "US", assigneeCountries: ["US"], classes: ["H01M4/04"] },
  { id: "2", year: 2024, date: "2024-02-01", jurisdiction: "US", assigneeCountries: ["JP"], classes: ["H01M10/0562"] },
  { id: "3", year: 2020, date: "2020-02-01", jurisdiction: "US", assigneeCountries: ["US"], classes: ["H02S20/30"] },
];

describe("buildCharts", () => {
  it("counts years, uses assignee country when every patent is US, and keeps the CPC subclass", () => {
    const charts = buildCharts(rows, 40);
    expect(charts.truncated).toBe(true);
    expect(charts.countryMode).toBe("assignee");
    expect(charts.countryModeLabel).toBe("申请人国家/地区");
    expect(charts.byYear.map((bucket) => [bucket.label, bucket.count])).toEqual([
      ["2024", 2],
      ["2020", 1],
    ]);
    expect(charts.byCountry.find((bucket) => bucket.key === "JP")?.label).toBe("日本");
    expect(charts.byClass.map((bucket) => bucket.key).sort()).toEqual(["H01M", "H02S"]);
  });

  it("switches the country chart to jurisdiction when more than one office is present", () => {
    const charts = buildCharts(
      [
        { ...rows[0], jurisdiction: "US" },
        { ...rows[1], jurisdiction: "EP", assigneeCountries: ["DE"] },
      ],
      2,
    );
    expect(charts.countryMode).toBe("jurisdiction");
    expect(charts.byCountry.map((bucket) => bucket.key).sort()).toEqual(["EP", "US"]);
    expect(charts.byCountry.find((bucket) => bucket.key === "EP")?.label).toBe("欧洲专利局");
  });
});

describe("hasMoreResults", () => {
  it("uses the exact total once earlier pages are counted", () => {
    expect(hasMoreResults(0, 10, 10, 25, true)).toBe(true);
    expect(hasMoreResults(2, 10, 5, 25, true)).toBe(false);
    expect(hasMoreResults(0, 10, 10, 10, false)).toBe(true);
    expect(hasMoreResults(0, 10, 0, 10, true)).toBe(false);
    expect(pageNumber(0, false)).toBe(1);
    expect(pageNumber(1, true)).toBe(3);
  });

  it("keeps a cursor trail that can walk back to the first page", () => {
    const page2 = nextPageQuery([], undefined, "cursor-1");
    expect(page2).toEqual({ cursor: "cursor-1" });
    const page3 = nextPageQuery([], page2.cursor, "cursor-2");
    expect(decodeCursor(page3.trail)).toEqual(["cursor-1"]);
    expect(previousPageQuery(decodeCursor(page3.trail) ?? [], page3.cursor)).toEqual({ cursor: "cursor-1" });
    expect(previousPageQuery([], "cursor-1")).toEqual({});
  });
});

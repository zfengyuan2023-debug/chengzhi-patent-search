import { describe, expect, it } from "vitest";
import {
  isEmptyDesignQuery,
  officialDesignUrl,
  recordMatches,
  searchDesigns,
  uniqueDesigns,
  type DesignRecord,
} from "./search";

const eu: DesignRecord = {
  id: "EU-015157835-0016",
  region: "EU",
  number: "015157835-0016",
  title: "Mugs",
  holder: "LEGAMI S.P.A. Società Benefit",
  date: "2026-11-02",
  classification: "Locarno 07.01",
  status: "Registered",
  page_url: "https://euipo.europa.eu/eSearch/#details/designs/015157835-0016",
};

const us: DesignRecord = {
  id: "US-D1146341",
  region: "US",
  number: "US D1146341 S",
  title: "Drawer organizer",
  holder: "ZHEJIANG CHENG'S PLASTIC PRODUCTS CO., LTD.",
  date: "2026-09-08",
  classification: "D7/637",
  status: "Granted",
  page_url: "https://patents.google.com/patent/USD1146341S1/en",
};

describe("design search", () => {
  it("matches EU and US titles and reports offices separately", () => {
    const page = searchDesigns([eu, us], { keyword: "mugs" });
    expect(page.total).toBe(1);
    expect(page.items[0].region).toBe("EU");
    const drawer = searchDesigns([eu, us], { keyword: "drawer organizer" });
    expect(drawer.items[0].region).toBe("US");
  });

  it("filters by region and holder", () => {
    expect(recordMatches(eu, { keyword: "mugs", region: "US" })).toBe(false);
    expect(recordMatches(us, { assignee: "ZHEJIANG", region: "US" })).toBe(true);
  });

  it("normalizes design numbers", () => {
    expect(recordMatches(us, { number: "d1146341" })).toBe(true);
    expect(recordMatches(eu, { number: "015157835-0016" })).toBe(true);
  });

  it("does not invent inventor matches", () => {
    expect(recordMatches(us, { inventor: "Smith" })).toBe(false);
    const page = searchDesigns([eu, us], { inventor: "Smith" });
    expect(page.total).toBe(0);
  });

  it("deduplicates catalog image rows", () => {
    expect(uniqueDesigns([us, { ...us, title: "dup" }, eu])).toHaveLength(2);
  });

  it("treats empty queries as empty", () => {
    expect(isEmptyDesignQuery({})).toBe(true);
    expect(isEmptyDesignQuery({ region: "ALL" })).toBe(true);
    expect(isEmptyDesignQuery({ keyword: "mug" })).toBe(false);
  });

  it("reconstructs official URLs when needed", () => {
    expect(officialDesignUrl({ ...eu, page_url: "" })).toContain("015157835-0016");
    expect(officialDesignUrl({ ...us, page_url: "" })).toContain("USD1146341");
  });
});

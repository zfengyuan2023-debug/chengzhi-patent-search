import { describe, expect, it } from "vitest";
import {
  espacenetSearchUrl,
  euipoESearchUrl,
  officialLinks,
  officialQueryTerm,
  usptoPublicSearchUrl,
  wipoDesignSearchUrl,
  wipoPrettifyUri,
} from "./links";

describe("official query term", () => {
  it("prefers keyword, then number, assignee, classification, inventor", () => {
    expect(officialQueryTerm({})).toBeNull();
    expect(officialQueryTerm({ keyword: " mug " })?.field).toBe("keyword");
    expect(officialQueryTerm({ number: "D1146341", assignee: "Tesla" })?.field).toBe("number");
    expect(officialQueryTerm({ assignee: "Tesla", classification: "07.01" })?.field).toBe(
      "assignee",
    );
  });
});

describe("WIPO Global Design Database URLs", () => {
  it("builds a bookmark-style ?q= JSON search for product indication", () => {
    const href = wipoDesignSearchUrl("mug");
    expect(href.startsWith("https://designdb.wipo.int/designdb/en/?q=")).toBe(true);
    expect(href).toContain('{"searches":[{"fi":"PROD","te":"mug"}]}');
    expect(href).not.toContain("%7B");
  });

  it("maps number, holder and Locarno fields", () => {
    expect(wipoDesignSearchUrl("DM/123456", "number")).toContain('"fi":"RN"');
    expect(wipoDesignSearchUrl("LEGAMI", "assignee")).toContain('"fi":"HOL"');
    expect(wipoDesignSearchUrl("07.01", "classification")).toContain('"fi":"LC"');
  });

  it("encodes spaces in the term the same way as WIPO prettifyURI", () => {
    const href = wipoDesignSearchUrl("coffee mug");
    expect(href).toContain("coffee%20mug");
    expect(wipoPrettifyUri(encodeURIComponent('{"te":"a"}'))).toBe('{"te":"a"}');
  });
});

describe("EUIPO eSearch plus URLs", () => {
  it("puts the keyword in the documented basic-search hash", () => {
    expect(euipoESearchUrl("mug")).toBe(
      "https://euipo.europa.eu/eSearch/#basic/1+1+1+1/100+100+100+100/mug",
    );
    expect(euipoESearchUrl("coffee mug")).toContain("coffee%20mug");
  });
});

describe("USPTO Patent Public Search URLs", () => {
  it("carries a design-limited title query", () => {
    const href = usptoPublicSearchUrl("mug", "keyword", "designs");
    expect(href).toContain("https://ppubs.uspto.gov/pubwebapp/external.html?");
    expect(href).toContain("type=queryString");
    expect(href).toContain("db=USPAT");
    const q = new URL(href).searchParams.get("q");
    expect(q).toBe("(mug.ti.) AND D$.pn.");
  });

  it("uses type=ids for document numbers", () => {
    const href = usptoPublicSearchUrl("US D1146341 S", "number", "designs");
    expect(href).toContain("type=ids");
    expect(new URL(href).searchParams.get("q")).toBe("USD1146341S");
  });

  it("does not restrict utility searches to design numbers", () => {
    const href = usptoPublicSearchUrl("battery", "keyword", "utility");
    const q = new URL(href).searchParams.get("q");
    expect(q).toBe("battery.ti.");
    expect(href).toContain("US-PGPUB");
  });
});

describe("Espacenet URLs", () => {
  it("uses the official Smart search q parameter", () => {
    expect(espacenetSearchUrl("mug")).toBe(
      "https://worldwide.espacenet.com/patent/search?q=mug",
    );
    expect(espacenetSearchUrl("Tesla", "assignee")).toContain("pa");
    expect(espacenetSearchUrl("Tesla", "assignee")).toContain("Tesla");
  });
});

describe("officialLinks", () => {
  it("labels design sources and carries the same keyword", () => {
    const links = officialLinks({ keyword: "mug" }, "designs");
    expect(links.map((item) => item.id)).toEqual([
      "wipo-designdb",
      "euipo-esearch",
      "uspto-pps-design",
    ]);
    expect(links.every((item) => item.queryCarried)).toBe(true);
    expect(links[0].href).toContain("PROD");
    expect(links[1].href).toContain("mug");
    expect(links[2].href).toContain("external.html");
  });

  it("uses landing pages when there is no query", () => {
    const links = officialLinks({}, "designs");
    expect(links.every((item) => item.queryCarried)).toBe(false);
    expect(links[0].href).toBe("https://designdb.wipo.int/designdb/en/");
  });

  it("lists invention offices and does not invent a PATENTSCOPE query URL", () => {
    const links = officialLinks({ keyword: "battery" }, "utility");
    expect(links.map((item) => item.office)).toEqual(["EPO", "USPTO", "WIPO"]);
    const patentscope = links.find((item) => item.id === "wipo-patentscope");
    expect(patentscope?.queryCarried).toBe(false);
    expect(patentscope?.href).toBe("https://patentscope.wipo.int/search/en/search.jsf");
    expect(links[0].href).toContain("espacenet.com");
    expect(links[0].queryCarried).toBe(true);
  });

  it("does not try to pre-upload an image to official sites", () => {
    const links = officialLinks({ keyword: "mug" }, "image");
    expect(links.every((item) => item.queryCarried)).toBe(false);
    expect(links[0].href).toBe("https://designdb.wipo.int/designdb/en/");
    expect(links[1].href).toBe("https://euipo.europa.eu/eSearch/");
  });
});

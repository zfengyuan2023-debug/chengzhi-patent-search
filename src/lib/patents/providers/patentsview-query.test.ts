import { describe, expect, it } from "vitest";
import type { SearchQuery } from "@/lib/patents/types";
import { buildPatentsViewRequest } from "@/lib/patents/providers/patentsview-query";

function query(partial: Partial<SearchQuery>): SearchQuery {
  return {
    keywordMode: "all",
    numberKind: "grant",
    pageSize: 10,
    ...partial,
  };
}

describe("buildPatentsViewRequest", () => {
  it("searches title and abstract with all tokens, and ANDs the assignee", () => {
    const request = buildPatentsViewRequest(
      query({ keyword: "lithium battery", assignee: "Tesla" }),
      "list",
    );
    expect(request.path).toBe("/api/v1/patent/");
    expect(request.body.q).toEqual({
      _and: [
        {
          _or: [
            { _text_all: { patent_title: "lithium battery" } },
            { _text_all: { patent_abstract: "lithium battery" } },
          ],
        },
        {
          _or: [
            { _text_all: { "assignees.assignee_organization": "Tesla" } },
            { _text_all: { "assignees.assignee_individual_name_last": "Tesla" } },
          ],
        },
      ],
    });
    expect(request.body.o).toMatchObject({ size: 10, exclude_withdrawn: false, pad_patent_id: false });
    expect(request.body.s).toEqual([{ patent_date: "desc" }, { patent_id: "desc" }]);
  });

  it("splits a two-word inventor and passes the cursor", () => {
    const request = buildPatentsViewRequest(
      query({ inventor: "Priya Shah", after: ["2020-12-15", "DMO1000006"] }),
      "list",
    );
    expect(request.body.q).toEqual({
      _and: [
        { _text_all: { "inventors.inventor_name_first": "Priya" } },
        { _text_all: { "inventors.inventor_name_last": "Shah" } },
      ],
    });
    expect(request.body.o.after).toEqual(["2020-12-15", "DMO1000006"]);
  });

  it("matches a CPC subclass and a longer group prefix", () => {
    const subclass = buildPatentsViewRequest(query({ classification: "H01M" }), "summary");
    expect(subclass.body.o.size).toBe(100);
    expect(subclass.body.o.after).toBeUndefined();
    expect(JSON.stringify(subclass.body.q)).toContain("H01M");
    expect(JSON.stringify(subclass.body.q)).toContain("ipcr.ipc_section");

    const group = buildPatentsViewRequest(query({ classification: "H01M10/0525" }), "list");
    const serialized = JSON.stringify(group.body.q);
    expect(serialized).toContain("H01M10/0525");
    expect(serialized).toContain("H01M 10/0525");
  });

  it("routes an 11-digit publication number to the publication endpoint", () => {
    const request = buildPatentsViewRequest(
      query({ number: "20200123456", numberKind: "publication", keyword: "sensor", keywordMode: "phrase" }),
      "detail",
    );
    expect(request.path).toBe("/api/v1/publication/");
    expect(request.body.q).toEqual({
      _and: [
        {
          _or: [
            { _text_phrase: { publication_title: "sensor" } },
            { _text_phrase: { publication_abstract: "sensor" } },
          ],
        },
        { document_number: "20200123456" },
      ],
    });
    expect(request.body.f).toContain("publication_abstract");
    expect(request.body.o).not.toHaveProperty("exclude_withdrawn");
  });
});

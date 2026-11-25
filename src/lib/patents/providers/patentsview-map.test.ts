import { describe, expect, it } from "vitest";
import { mapRecord, readTotal, snippet } from "@/lib/patents/providers/patentsview-map";

const RAW_GRANT = {
  patent_id: "6285999",
  patent_title: "Method for node ranking in a linked database",
  patent_date: "2001-09-04",
  patent_year: 2001,
  patent_abstract: "A method assigns importance ranks to nodes in a linked database. ".repeat(8),
  patent_type: "utility",
  wipo_kind: "B2",
  withdrawn: false,
  inventors: [
    {
      inventor_name_first: "Lawrence",
      inventor_name_last: "Page",
      inventor_city: "Stanford",
      inventor_state: "CA",
      inventor_country: "US",
      inventor_sequence: 0,
    },
  ],
  assignees: [
    {
      assignee_organization: "The Board of Trustees of the Leland Stanford Junior University",
      assignee_country: "US",
      assignee_city: "Palo Alto",
      assignee_state: "CA",
      assignee_type: "2",
      assignee_sequence: 0,
    },
  ],
  cpc_current: [
    { cpc_group: "G06F 16/951", cpc_subclass: "G06F", cpc_type: "inventional", cpc_sequence: 0 },
    { cpc_group: "G06F16/953", cpc_subclass: "G06F", cpc_sequence: 1 },
  ],
  ipcr: [{ ipc_section: "G", ipc_class: "06", ipc_subclass: "F", ipc_main_group: "17", ipc_subgroup: "30", ipc_sequence: 0 }],
  application: [{ application_id: "09004827", filing_date: "1998-01-09" }],
  granted_pregrant_crosswalk: [{ document_number: "20010000001" }],
  patent_num_times_cited_by_us_patents: 400,
};

describe("mapRecord", () => {
  it("maps nested parties, classifications, and leaves INPADOC status empty", () => {
    const record = mapRecord(RAW_GRANT, "grant");
    expect(record).not.toBeNull();
    if (!record) return;
    expect(record.number).toBe("US6285999B2");
    expect(record.jurisdiction).toBe("US");
    expect(record.patentTypeLabel).toBe("发明");
    expect(record.inventors[0]?.name).toBe("Lawrence Page");
    expect(record.assignees[0]?.name).toContain("Stanford");
    expect(record.assignees[0]?.typeLabel).toBe("美国公司");
    expect(record.classifications.map((item) => item.symbol)).toEqual(["G06F16/951", "G06F16/953", "G06F 17/30"]);
    expect(record.applicationNumber).toBe("09004827");
    expect(record.filingDate).toBe("1998-01-09");
    expect(record.relatedNumbers).toEqual(["20010000001"]);
    expect(record.citedByUsPatents).toBe(400);
    expect(record.withdrawn).toBe(false);
    expect(record.legalStatus.available).toBe(false);
    expect(record.legalStatus.label).toBe("暂无");
    expect(record.snippet.endsWith("…")).toBe(true);
    expect(record.snippet.length).toBeLessThanOrEqual(181);
  });

  it("surfaces a withdrawn grant as the only legal-status value PatentsView has", () => {
    const record = mapRecord({ ...RAW_GRANT, withdrawn: true }, "grant");
    expect(record?.legalStatus).toMatchObject({ available: true, label: "已撤回" });
  });

  it("maps a publication without inventing a legal status", () => {
    const record = mapRecord(
      {
        document_number: "20200123456",
        publication_title: "Sensor patch",
        publication_date: "2020-04-16",
        publication_abstract: "A patch.",
        publication_type: "utility",
        inventors: [{ inventor_name_first: "Ada", inventor_name_last: "Chen" }],
        assignees: [],
      },
      "publication",
    );
    expect(record?.id).toBe("20200123456");
    expect(record?.number).toBe("US20200123456");
    expect(record?.docType).toBe("publication");
    expect(record?.legalStatus.label).toBe("暂无");
    expect(record?.snippet).toBe("A patch.");
  });

  it("reads total_hits and shortens snippets on a word boundary", () => {
    expect(readTotal({ total_hits: 42 }, 1)).toEqual({ total: 42, exact: true });
    expect(readTotal({}, 3)).toEqual({ total: 3, exact: false });
    expect(snippet("one two three", 7)).toBe("one two…");
  });
});

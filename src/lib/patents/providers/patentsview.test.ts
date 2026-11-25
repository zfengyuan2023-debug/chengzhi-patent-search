import { describe, expect, it, vi } from "vitest";
import { PatentsViewProvider } from "@/lib/patents/providers/patentsview";
import type { SearchQuery } from "@/lib/patents/types";

function jsonResponse(body: unknown, status = 200, headers?: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}

const query: SearchQuery = {
  keyword: "battery",
  keywordMode: "all",
  numberKind: "grant",
  pageSize: 10,
};

describe("PatentsViewProvider", () => {
  it("sends the API key header and maps the patent array", async () => {
    const fetchImpl = vi.fn<(input: string, init?: RequestInit) => Promise<Response>>(async () =>
      jsonResponse({
        error: false,
        count: 1,
        total_hits: 80,
        patents: [
          {
            patent_id: "10000001",
            patent_title: "Battery pack",
            patent_date: "2018-06-19",
            patent_abstract: "A pack.",
            patent_type: "utility",
            withdrawn: false,
            assignees: [{ assignee_organization: "Northshore Energy", assignee_country: "US" }],
            inventors: [{ inventor_name_first: "Ada", inventor_name_last: "Chen" }],
            cpc_current: [{ cpc_subclass: "H01M" }],
          },
        ],
      }),
    );
    const provider = new PatentsViewProvider({ apiKey: "test-key", fetchImpl });
    const page = await provider.search(query);
    expect(page.total).toBe(80);
    expect(page.items[0]?.number).toBe("US10000001");
    expect(page.items[0]?.assignees[0]?.name).toBe("Northshore Energy");
    const [url, init] = fetchImpl.mock.calls[0] ?? [];
    expect(url).toBe("https://search.patentsview.org/api/v1/patent/");
    expect(init?.method).toBe("POST");
    const headers = new Headers(init?.headers);
    expect(headers.get("X-Api-Key")).toBe("test-key");
    const body = JSON.parse(String(init?.body)) as { q: unknown };
    expect(JSON.stringify(body.q)).toContain("battery");
  });

  it("does not call the network when the key is missing", async () => {
    const fetchImpl = vi.fn();
    const provider = new PatentsViewProvider({ apiKey: "  ", fetchImpl });
    await expect(provider.search(query)).rejects.toMatchObject({ code: "missing_api_key" });
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("maps rate limits and rejected keys", async () => {
    const limited = new PatentsViewProvider({
      apiKey: "test-key",
      fetchImpl: vi.fn(async () => jsonResponse({ message: "slow down" }, 429)),
    });
    await expect(limited.search(query)).rejects.toMatchObject({ code: "rate_limited" });

    const rejected = new PatentsViewProvider({
      apiKey: "test-key",
      fetchImpl: vi.fn(async () => jsonResponse({ message: "no" }, 403)),
    });
    await expect(rejected.search(query)).rejects.toMatchObject({ code: "missing_api_key" });
  });
});

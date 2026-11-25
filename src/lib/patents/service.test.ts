import { describe, expect, it, vi } from "vitest";
import { MemoryCache } from "@/lib/patents/cache";
import { EpoOpsProvider } from "@/lib/patents/providers/epo-ops";
import { MockProvider } from "@/lib/patents/providers/mock";
import { PatentSearchService } from "@/lib/patents/service";
import type { PatentProvider } from "@/lib/patents/provider";
import type { SearchPage } from "@/lib/patents/types";

describe("MockProvider", () => {
  const provider = new MockProvider();

  it("filters keyword, assignee, and classification together", async () => {
    const page = await provider.search({
      keyword: "lithium battery",
      keywordMode: "all",
      assignee: "Tesla",
      classification: "H01M",
      numberKind: "grant",
      pageSize: 10,
    });
    expect(page.total).toBe(1);
    expect(page.items[0]?.id).toBe("DMO1000009");
  });

  it("paginates by the date and id cursor", async () => {
    const first = await provider.search({ keywordMode: "all", numberKind: "grant", pageSize: 10 });
    expect(first.items).toHaveLength(10);
    expect(first.total).toBe(12);
    const last = first.items[9];
    const second = await provider.search({
      keywordMode: "all",
      numberKind: "grant",
      pageSize: 10,
      after: [last?.date ?? "", last?.id ?? ""],
    });
    expect(second.items).toHaveLength(2);
    expect(second.items.map((item) => item.id)).not.toContain(last?.id);
  });

  it("opens a withdrawn sample with an explicit status", async () => {
    const record = await provider.getById("DMO1000006");
    expect(record?.legalStatus.label).toBe("已撤回");
    expect(record?.withdrawn).toBe(true);
  });
});

describe("PatentSearchService cache", () => {
  it("serves a repeated search from cache", async () => {
    const page: SearchPage = { items: [], total: 0, totalExact: true, pageSize: 10 };
    const search = vi.fn(async () => page);
    const provider = {
      id: "fake",
      label: "fake",
      capabilities: { globalBibliographic: false, family: false, legalStatus: false, jurisdictions: ["US"] },
      isConfigured: () => true,
      search,
      summarize: vi.fn(),
      getById: vi.fn(),
    } satisfies PatentProvider;
    const service = new PatentSearchService(provider, new MemoryCache(), 60_000);
    const input = { keyword: "battery" };
    const first = await service.search(input);
    const second = await service.search(input);
    expect(first.ok && first.cached).toBe(false);
    expect(second.ok && second.cached).toBe(true);
    expect(search).toHaveBeenCalledTimes(1);
  });

  it("does not cache a missing API key and does not call the provider", async () => {
    const search = vi.fn();
    const provider = {
      id: "patentsview",
      label: "USPTO PatentsView",
      capabilities: { globalBibliographic: false, family: false, legalStatus: false, jurisdictions: ["US"] },
      isConfigured: () => false,
      search,
      summarize: vi.fn(),
      getById: vi.fn(),
    } satisfies PatentProvider;
    const service = new PatentSearchService(provider, new MemoryCache(), 60_000);
    const result = await service.search({ keyword: "battery" });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.code).toBe("missing_api_key");
    expect(search).not.toHaveBeenCalled();
  });
});

describe("EpoOpsProvider", () => {
  it("refuses to search and does not touch the network", async () => {
    const fetchImpl = vi.fn();
    vi.stubGlobal("fetch", fetchImpl);
    const provider = new EpoOpsProvider();
    await expect(provider.search({ keywordMode: "all", numberKind: "grant", pageSize: 10 })).rejects.toMatchObject({
      code: "not_implemented",
    });
    await expect(provider.getById("EP1")).rejects.toMatchObject({ code: "not_implemented" });
    expect(provider.capabilities.family).toBe(true);
    expect(provider.capabilities.legalStatus).toBe(true);
    expect(fetchImpl).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});

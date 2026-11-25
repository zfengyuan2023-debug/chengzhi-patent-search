import { Suspense } from "react";
import type { Metadata } from "next";
import { connection } from "next/server";
import Link from "next/link";
import { SearchForm } from "@/components/search-form";
import { PatentList } from "@/components/patent-list";
import { ResultChartsPanel } from "@/components/result-charts";
import { SearchSkeleton } from "@/components/skeletons";
import { Card, CardContent } from "@/components/ui/card";
import { createPatentService } from "@/lib/patents";
import { cursorFor, searchHref, searchQueryString } from "@/lib/patents/links";
import { hasMoreResults, nextPageQuery, pageNumber, previousPageQuery } from "@/lib/patents/paging";
import { EMPTY_QUERY_MESSAGE } from "@/lib/patents/messages";
import { inputFromSearchParams, parseSearchInput } from "@/lib/patents/parse-query";
import type { SearchInput } from "@/lib/patents/types";
import { DesignSearchResults } from "@/components/design-search-results";
import type { DesignSearchInput } from "@/lib/designs/search";

export const metadata: Metadata = {
  title: "检索结果",
};

type SearchParams = Record<string, string | string[] | undefined>;

export default function SearchPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:py-8">
      <Suspense fallback={<SearchSkeleton />}>
        <SearchResults searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function SearchResults({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await connection();
  const params = await searchParams;
  const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) ?? "";
  const input = inputFromSearchParams(params);
  const scope = first(params.scope) === "utility" ? "utility" : "designs";
  if (scope !== "utility") {
    const designInput: DesignSearchInput = {
      keyword: input.keyword,
      number: input.number,
      assignee: input.assignee,
      inventor: input.inventor,
      classification: input.classification,
      region: first(params.region) || "ALL",
      page: Number(first(params.page) || "1") || 1,
    };
    return <DesignSearchResults input={designInput} formValues={input} />;
  }
  const parsed = parseSearchInput(input);
  const service = createPatentService();

  if (!parsed.ok) {
    return (
      <div className="grid gap-4">
        <SearchCard values={input} />
        <Message
          title={parsed.message === EMPTY_QUERY_MESSAGE ? "检索条件不完整" : "检索条件无法识别"}
          body={parsed.message}
        />
      </div>
    );
  }

  const [result, charts] = await Promise.all([service.search(input), service.summarize(input)]);
  if (!result.ok) {
    return (
      <div className="grid gap-4">
        <SearchCard values={input} />
        <Message title="检索没有完成" body={result.message} />
      </div>
    );
  }

  const from = searchQueryString(input, {
    cursor: input.cursor,
    trail: input.trail,
  });
  const trail = parsed.trail;
  const page = pageNumber(trail.length, Boolean(input.cursor));
  const more = hasMoreResults(
    trail.length + (input.cursor ? 1 : 0),
    result.data.pageSize,
    result.data.items.length,
    result.data.total,
    result.data.totalExact,
  );
  const nextCursor = cursorFor(result.data.items.at(-1));
  const next = more && nextCursor ? nextPageQuery(trail, input.cursor, nextCursor) : null;
  const previous = previousPageQuery(trail, input.cursor);
  const totalLabel = result.data.totalExact
    ? `共 ${result.data.total.toLocaleString("zh-CN")} 条`
    : `本页 ${result.data.items.length} 条`;

  return (
    <div className="grid gap-5">
      <SearchCard values={input} />
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-xl font-semibold">检索结果</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {totalLabel}
            <span aria-hidden="true"> · </span>
            第 {page} 页
            {result.cached ? <span> · 来自服务器缓存</span> : null}
          </p>
        </div>
      </div>
      {charts.ok ? <ResultChartsPanel charts={charts.data} /> : <Message title="统计暂不可用" body={charts.message} />}
      {result.data.items.length === 0 ? (
        <Message
          title={page > 1 ? "没有更多结果" : "没有找到匹配的专利"}
          body={
            page > 1
              ? "这一页已经超出结果范围。可以返回上一页，或改用更宽的检索词。"
              : "可以缩短关键词，或只保留专利号、申请人其中一项。公开号请带上年份，例如 20200123456。"
          }
        />
      ) : (
        <div className="rounded-xl bg-card px-4 ring-1 ring-foreground/10 sm:px-5">
          <PatentList items={result.data.items} from={from} />
        </div>
      )}
      <nav className="flex items-center justify-between gap-3" aria-label="分页">
        {previous ? (
          <Link href={searchHref(input, previous)} className="text-sm font-medium text-primary hover:underline">
            上一页
          </Link>
        ) : (
          <span className="text-sm text-muted-foreground">上一页</span>
        )}
        {next ? (
          <Link href={searchHref(input, next)} className="text-sm font-medium text-primary hover:underline">
            下一页
          </Link>
        ) : (
          <span className="text-sm text-muted-foreground">下一页</span>
        )}
      </nav>
    </div>
  );
}

function SearchCard({ values }: { values: SearchInput }) {
  return (
    <Card>
      <CardContent>
        <SearchForm values={values} />
      </CardContent>
    </Card>
  );
}

function Message({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl bg-card px-4 py-5 ring-1 ring-foreground/10">
      <h2 className="text-base font-medium">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{body}</p>
    </div>
  );
}

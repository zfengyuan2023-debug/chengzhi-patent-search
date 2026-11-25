"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { SearchForm } from "@/components/search-form";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { loadDesignCatalog, type CatalogLoadProgress } from "@/lib/designs/catalog";
import { DESIGN_COVERAGE, designOfficeLabel, designRegionLabel } from "@/lib/designs/config";
import {
  isEmptyDesignQuery,
  officialDesignUrl,
  searchDesigns,
  type DesignRecord,
  type DesignSearchInput,
} from "@/lib/designs/search";
import type { SearchInput } from "@/lib/patents/types";
import { LocalCatalogBadge, OfficialSearchLinks } from "@/components/official-search-links";

function hrefFor(input: DesignSearchInput, page: number): string {
  const params = new URLSearchParams();
  const set = (key: string, value?: string | number) => {
    if (value === undefined || value === "") return;
    params.set(key, String(value));
  };
  set("keyword", input.keyword);
  set("number", input.number);
  set("assignee", input.assignee);
  set("inventor", input.inventor);
  set("classification", input.classification);
  if (input.region && input.region !== "ALL") set("region", input.region);
  set("scope", "designs");
  if (page > 1) set("page", page);
  const query = params.toString();
  return query ? `/search?${query}` : "/search";
}

export function DesignSearchResults({
  input,
  formValues,
}: {
  input: DesignSearchInput;
  formValues: SearchInput;
}) {
  const [records, setRecords] = useState<DesignRecord[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<CatalogLoadProgress | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadDesignCatalog((next) => {
      if (!cancelled) setProgress(next);
    })
      .then((rows) => {
        if (!cancelled) setRecords(rows);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "目录加载失败。");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const empty = isEmptyDesignQuery(input);
  const result = useMemo(() => (records && !empty ? searchDesigns(records, input) : null), [records, empty, input]);

  const percent =
    progress && progress.totalBytes > 0
      ? Math.min(100, Math.round((100 * progress.doneBytes) / progress.totalBytes))
      : 0;

  return (
    <div className="grid gap-5">
      <Card>
        <CardContent>
          <SearchForm values={formValues} scope="designs" region={input.region ?? "ALL"} />
        </CardContent>
      </Card>

      <OfficialSearchLinks input={input} scope="designs" />
      <CoverageNote />

      {input.inventor?.trim() ? (
        <Message
          title="外观目录暂不支持按发明人检索"
          body="当前公开目录里的欧盟与美国外观记录没有收录设计人/发明人字段。请改用关键词、外观号、权利人或分类号。"
        />
      ) : null}

      {error ? <Message title="外观目录没有加载完成" body={error} /> : null}

      {!records && !error ? (
        <div className="rounded-xl bg-card px-4 py-5 ring-1 ring-foreground/10">
          <h2 className="text-base font-medium">正在加载欧盟与美国外观题录</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            数据来自已经公开的 GitHub 外观专利目录，大约几到十几 MB（压缩后）。加载完成后会缓存在浏览器里。
          </p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-primary transition-[width]" style={{ width: `${percent}%` }} />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {progress
              ? `分片 ${progress.fileIndex} / ${progress.fileCount} · ${percent}%`
              : "正在读取目录说明…"}
          </p>
        </div>
      ) : null}

      {records && empty ? (
        <Message
          title="请填写至少一项检索条件"
          body="可以在标题、权利人或外观号中查找。下面的示例覆盖欧盟和美国外观设计，不是美国发明专利示例。"
        />
      ) : null}

      {result ? (
        <>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold">检索结果</h1>
              <LocalCatalogBadge />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              共 {result.total.toLocaleString("zh-CN")} 条
              {result.totalPages ? ` · 第 ${result.page} / ${result.totalPages} 页` : null}
              <span aria-hidden="true"> · </span>
              已加载 {records ? records.length.toLocaleString("zh-CN") : 0} 件外观设计
            </p>
          </div>
          {result.items.length === 0 ? (
            <Message
              title={result.page > 1 ? "没有更多结果" : "没有找到匹配的外观设计"}
              body="可以缩短关键词，或改用外观号、权利人、洛迦诺/美国分类号。这里检索的是欧盟与美国外观设计，不是全球发明专利。"
            />
          ) : (
            <div className="rounded-xl bg-card px-4 ring-1 ring-foreground/10 sm:px-5">
              <DesignList items={result.items} />
            </div>
          )}
          <nav className="flex items-center justify-between gap-3" aria-label="分页">
            {result.page > 1 ? (
              <Link href={hrefFor(input, result.page - 1)} className="text-sm font-medium text-primary hover:underline">
                上一页
              </Link>
            ) : (
              <span className="text-sm text-muted-foreground">上一页</span>
            )}
            {result.page < result.totalPages ? (
              <Link href={hrefFor(input, result.page + 1)} className="text-sm font-medium text-primary hover:underline">
                下一页
              </Link>
            ) : (
              <span className="text-sm text-muted-foreground">下一页</span>
            )}
          </nav>
        </>
      ) : null}
    </div>
  );
}

function CoverageNote() {
  return (
    <p className="text-xs leading-5 text-muted-foreground">
      以上列表来自本站目录，覆盖{DESIGN_COVERAGE.offices.map((item) => item.label).join("、")}，
      {DESIGN_COVERAGE.period}，不是官方实时登记簿，也不是全球所有发明专利。要用照片检索，请打开
      <Link href="/image" className="mx-1 text-primary hover:underline">
        以图搜图
      </Link>
      。
    </p>
  );
}

function DesignList({ items }: { items: DesignRecord[] }) {
  return (
    <ol className="divide-y divide-border">
      {items.map((item) => {
        const href = officialDesignUrl(item);
        return (
          <li key={item.id} className="py-5">
            <article>
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <p className="font-mono text-sm text-primary">
                  <a href={href} target="_blank" rel="noopener noreferrer" className="hover:underline">
                    {item.number}
                  </a>
                </p>
                <p className="text-xs text-muted-foreground">
                  {item.date || "日期暂无"}
                  <span aria-hidden="true"> · </span>
                  {designRegionLabel(item.region)}
                  <span aria-hidden="true"> · </span>
                  {designOfficeLabel(item.region)}
                  {item.status ? (
                    <>
                      <span aria-hidden="true"> · </span>
                      {item.status}
                    </>
                  ) : null}
                </p>
              </div>
              <h2 className="mt-1 text-base leading-snug font-medium">
                <a href={href} target="_blank" rel="noopener noreferrer" className="hover:text-primary">
                  {item.title || "题名暂无"}
                </a>
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">{item.holder || "权利人暂无"}</p>
              {item.classification ? (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <Badge variant="outline">{item.classification}</Badge>
                </div>
              ) : null}
              <p className="mt-2 text-sm leading-6 text-foreground/85">
                <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  在官方网站打开
                </a>
                <span className="text-muted-foreground">。外观图请用以图搜图查看。</span>
              </p>
            </article>
          </li>
        );
      })}
    </ol>
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

import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";
import { getDataSourceStatus } from "@/lib/patents";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-card/90 backdrop-blur">
      <div className="h-1 bg-primary" />
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-3 px-4">
        <Link href="/" className="flex min-w-0 items-center gap-2.5">
          <span className="grid size-8 shrink-0 place-items-center rounded-md bg-primary text-sm font-semibold text-primary-foreground">
            澄
          </span>
          <span className="min-w-0">
            <span className="block text-sm font-semibold tracking-tight">澄知</span>
            <span className="block truncate text-xs text-muted-foreground">专利检索</span>
          </span>
        </Link>
        <div className="flex items-center gap-2 sm:gap-3">
          <Suspense fallback={<span className="text-xs text-muted-foreground">数据源</span>}>
            <SourcePill />
          </Suspense>
          <Link href="/guide" className="text-sm text-foreground/80 hover:text-foreground">
            使用说明
          </Link>
        </div>
      </div>
    </header>
  );
}

async function SourcePill() {
  await connection();
  const status = getDataSourceStatus();
  const label =
    status.mode === "mock" ? "示例数据" : status.mode === "live" ? "PatentsView" : "未配置密钥";
  return (
    <span className="rounded-full bg-muted px-2 py-1 text-[11px] text-muted-foreground sm:text-xs">
      {label}
    </span>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-1 px-4 py-6 text-xs leading-5 text-muted-foreground sm:flex-row sm:justify-between">
        <p>澄知检索美国专利题录。数据来自 USPTO PatentsView 公开接口，不是官方产品，也不构成法律意见。</p>
        <p>
          <Link href="/guide#api-key" className="hover:text-foreground">
            免费密钥
          </Link>
          <span aria-hidden="true"> · </span>
          <Link href="/guide#limits" className="hover:text-foreground">
            数据范围
          </Link>
        </p>
      </div>
    </footer>
  );
}

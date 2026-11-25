import Link from "next/link";

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
          <Link href="/image" className="text-sm font-medium text-primary hover:text-foreground">
            以图搜图
          </Link>
          <span className="hidden rounded-full bg-muted px-2 py-1 text-[11px] text-muted-foreground sm:inline sm:text-xs">
            EUIPO + USPTO 外观
          </span>
          <Link href="/guide" className="text-sm text-foreground/80 hover:text-foreground">
            使用说明
          </Link>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-1 px-4 py-6 text-xs leading-5 text-muted-foreground sm:flex-row sm:justify-between">
        <p>澄知检索欧盟 EUIPO 与美国 USPTO 外观设计（主要为 2025 年起），并支持以图搜图。不是官方产品，也不构成法律意见。</p>
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

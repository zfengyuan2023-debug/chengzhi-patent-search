import type { ReactNode } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { getDataSourceStatus } from "@/lib/patents";

const LIVE_EXAMPLES = [
  { label: "锂电关键词", href: "/search?keyword=lithium+battery" },
  { label: "申请人 Tesla", href: "/search?assignee=Tesla" },
  { label: "分类号 H01M", href: "/search?classification=H01M" },
  { label: "专利号 6285999", href: "/search?number=6285999" },
];

const MOCK_EXAMPLES = [
  { label: "锂电关键词", href: "/search?keyword=lithium+battery" },
  { label: "申请人 Tesla", href: "/search?assignee=Tesla" },
  { label: "分类号 H01M", href: "/search?classification=H01M" },
  { label: "发明人 Priya Shah", href: "/search?inventor=Priya+Shah" },
];

export async function SourceNotice() {
  await connection();
  const status = getDataSourceStatus();
  if (status.mode === "mock") {
    return (
      <Notice tone="info" title="当前是示例数据">
        <p>
          环境变量 <code className="font-mono">PATENT_DATA_SOURCE=mock</code>{" "}
          已打开内置样例，不会请求 PatentsView。去掉该变量并配置{" "}
          <code className="font-mono">PATENTSVIEW_API_KEY</code> 后，检索真实美国专利。
        </p>
        <ExampleLinks items={MOCK_EXAMPLES} />
      </Notice>
    );
  }
  if (status.mode === "unconfigured") {
    return (
      <Notice tone="warn" title="需要免费的 PatentsView API 密钥">
        <p>
          页面可以打开，但还不能检索真实专利。请在环境变量{" "}
          <code className="font-mono">PATENTSVIEW_API_KEY</code>{" "}
          中填入免费密钥。密钥只从环境变量读取，不会写进代码。
        </p>
        <p>
          申请步骤写在项目 README 的「获取免费密钥」，应用内说明见{" "}
          <Link href="/guide#api-key" className="font-medium text-primary hover:underline">
            使用说明
          </Link>
          。不想申请时，可设置 <code className="font-mono">PATENT_DATA_SOURCE=mock</code> 先看示例检索。
        </p>
      </Notice>
    );
  }
  return (
    <Notice tone="info" title="数据源：USPTO PatentsView">
      <p>检索美国授权专利。公开号会转到申请公开。相同检索由服务器缓存，避免重复消耗大约每分钟 45 次的免费额度。</p>
      <ExampleLinks items={LIVE_EXAMPLES} />
    </Notice>
  );
}

function Notice({
  title,
  tone,
  children,
}: {
  title: string;
  tone: "info" | "warn";
  children: ReactNode;
}) {
  return (
    <aside
      className={
        tone === "warn"
          ? "rounded-xl border border-amber-700/30 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950"
          : "rounded-xl border border-border bg-muted/60 px-4 py-3 text-sm leading-6 text-foreground/85"
      }
    >
      <h2 className="font-medium">{title}</h2>
      <div className="mt-1 space-y-2">{children}</div>
    </aside>
  );
}

function ExampleLinks({ items }: { items: Array<{ label: string; href: string }> }) {
  return (
    <div className="flex flex-wrap gap-2 pt-1">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="rounded-full bg-card px-3 py-1 text-xs ring-1 ring-foreground/10 hover:bg-accent"
        >
          {item.label}
        </Link>
      ))}
    </div>
  );
}

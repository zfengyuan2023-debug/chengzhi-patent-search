import type { ReactNode } from "react";
import Link from "next/link";
import { connection } from "next/server";
import { getDataSourceStatus } from "@/lib/patents";

const DESIGN_EXAMPLES = [
  { label: "马克杯 mug", href: "/search?keyword=mug&scope=designs" },
  { label: "收纳盒 organizer", href: "/search?keyword=organizer&scope=designs" },
  { label: "仅欧盟 mug", href: "/search?keyword=mug&scope=designs&region=EU" },
  { label: "仅美国 drawer", href: "/search?keyword=drawer&scope=designs&region=US" },
];

export async function SourceNotice() {
  await connection();
  const status = getDataSourceStatus();
  return (
    <div className="grid gap-3">
      <Notice tone="info" title="默认数据：欧盟与美国外观设计">
        <p>
          关键词检索使用已公开的 GitHub 外观目录，覆盖欧盟知识产权局（EUIPO）登记外观和美国专利商标局（USPTO）外观专利，主要为
          2025 年 1 月及以后。结果会标明受理局。目录不是全球发明专利库，也不包含中国、日本、韩国等地的发明专利。
        </p>
        <ExampleLinks items={DESIGN_EXAMPLES} />
        <p>
          要用照片查找相近外观，请打开{" "}
          <Link href="/image" className="font-medium text-primary hover:underline">
            以图搜图
          </Link>
          。首次大约下载 800 MB 目录和图像模型。
        </p>
      </Notice>
      {status.mode === "mock" ? (
        <Notice tone="info" title="美国发明专利目前是示例数据">
          <p>
            若把检索范围切换到「发明专利（美国）」，当前站点使用内置样例，不会请求 PatentsView。配置免费的{" "}
            <code className="font-mono">PATENTSVIEW_API_KEY</code> 后，才能检索真实美国发明专利。PatentsView
            本身也只覆盖美国。
          </p>
        </Notice>
      ) : status.mode === "unconfigured" ? (
        <Notice tone="warn" title="美国发明专利需要免费 PatentsView 密钥">
          <p>
            外观检索不需要密钥。若要检索美国发明专利，请在环境变量{" "}
            <code className="font-mono">PATENTSVIEW_API_KEY</code> 中填入免费密钥。申请步骤见{" "}
            <Link href="/guide#api-key" className="font-medium text-primary hover:underline">
              使用说明
            </Link>
            。
          </p>
        </Notice>
      ) : (
        <Notice tone="info" title="美国发明专利：USPTO PatentsView">
          <p>切换到「发明专利（美国）」后，可检索美国授权专利与申请公开。这仍然不是全球发明专利。</p>
        </Notice>
      )}
    </div>
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

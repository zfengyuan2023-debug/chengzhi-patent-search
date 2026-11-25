import { officialLinks, type OfficialQueryInput, type OfficialScope } from "@/lib/official/links";

const COPY: Record<
  OfficialScope,
  { title: string; intro: string }
> = {
  designs: {
    title: "在官方实时登记簿中继续检索",
    intro:
      "下面这些结果来自本站目录（主要为 2025 年起的欧盟与美国外观快照），不会随官方登记簿自动更新。点击链接，可将同一检索词带到持续更新的官方网站打开。澄知只提供跳转，不抓取、不批量下载、也不自动查询这些官方数据库。",
  },
  utility: {
    title: "在官方实时专利库中继续检索",
    intro:
      "本站「发明专利（美国）」在未配置免费密钥时只能看示例。下面的链接会打开持续更新的官方检索（欧洲专利局 Espacenet、美国专利商标局、WIPO PATENTSCOPE）。澄知只提供跳转，不代替官方接口返回结果。",
  },
  image: {
    title: "在官方网站以图搜图",
    intro:
      "本页以图搜图检索的是本站已公开的欧盟与美国外观目录（主要为 2025 年起）。官方登记簿无法通过网址预先接收您的照片，请打开后在官方页面自行上传。",
  },
};

export function OfficialSearchLinks({
  input,
  scope,
}: {
  input?: OfficialQueryInput;
  scope: OfficialScope;
}) {
  const copy = COPY[scope];
  const links = officialLinks(input, scope);

  return (
    <aside className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-4">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-base font-semibold">{copy.title}</h2>
        <span className="rounded-full bg-card px-2 py-0.5 text-[11px] text-muted-foreground ring-1 ring-foreground/10">
          官方实时 · 持续更新
        </span>
      </div>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{copy.intro}</p>
      <ul className="mt-3 grid gap-3">
        {links.map((link) => (
          <li key={link.id} className="rounded-lg bg-card px-3 py-3 ring-1 ring-foreground/10">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <a
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-primary hover:underline"
              >
                {link.office} · {link.name}
              </a>
              <span className="text-[11px] text-muted-foreground">
                {link.queryCarried ? "已带上检索词" : "打开官方检索页"}
              </span>
            </div>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">覆盖：{link.coverage}</p>
            {link.note ? <p className="mt-1 text-xs leading-5 text-muted-foreground">{link.note}</p> : null}
          </li>
        ))}
      </ul>
    </aside>
  );
}

export function LocalCatalogBadge() {
  return (
    <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
      本站目录 · 2025 年起快照
    </span>
  );
}

import { Suspense, type ReactNode } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Badge } from "@/components/ui/badge";
import { DetailSkeleton } from "@/components/skeletons";
import { countryLabel } from "@/lib/patents/countries";
import { createPatentService } from "@/lib/patents";

export const metadata: Metadata = {
  title: "专利详情",
};

type DetailParams = { id: string };
type DetailSearch = Record<string, string | string[] | undefined>;

export default function PatentPage({
  params,
  searchParams,
}: {
  params: Promise<DetailParams>;
  searchParams: Promise<DetailSearch>;
}) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:py-8">
      <Suspense fallback={<DetailSkeleton />}>
        <PatentDetail params={params} searchParams={searchParams} />
      </Suspense>
    </div>
  );
}

async function PatentDetail({
  params,
  searchParams,
}: {
  params: Promise<DetailParams>;
  searchParams: Promise<DetailSearch>;
}) {
  await connection();
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const fromValue = Array.isArray(query.from) ? query.from[0] : query.from;
  const backHref = fromValue ? `/search?${fromValue}` : "/search";
  const service = createPatentService();
  const result = await service.getById(decodeURIComponent(id));

  if (!result.ok) {
    return (
      <div className="grid gap-4">
        <Link href={backHref} className="text-sm text-primary hover:underline">
          返回检索
        </Link>
        <div className="rounded-xl bg-card px-4 py-6 ring-1 ring-foreground/10">
          <h1 className="text-xl font-semibold">{result.code === "not_found" ? "没有找到该专利" : "暂时无法打开详情"}</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{result.message}</p>
        </div>
      </div>
    );
  }

  const patent = result.data;
  const capabilities = service.capabilities;

  return (
    <div className="grid gap-5">
      <Link href={backHref} className="text-sm text-primary hover:underline">
        返回检索
      </Link>
      <header className="grid gap-3">
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span className="font-mono text-primary">{patent.number}</span>
          <span aria-hidden="true">·</span>
          <span>{patent.date ?? "日期暂无"}</span>
          <span aria-hidden="true">·</span>
          <span>{countryLabel(patent.jurisdiction)}</span>
          <span aria-hidden="true">·</span>
          <span>{patent.docType === "publication" ? "申请公开" : patent.patentTypeLabel}</span>
          {result.cached ? <span> · 来自服务器缓存</span> : null}
        </div>
        <h1 className="text-2xl leading-snug font-semibold text-balance sm:text-3xl">{patent.title}</h1>
      </header>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="grid gap-4">
          <Section title="摘要">
            <p className="text-sm leading-7 whitespace-pre-wrap">{patent.abstract || "暂无摘要"}</p>
          </Section>
          <Section title="发明人">
            {patent.inventors.length === 0 ? (
              <p className="text-sm text-muted-foreground">暂无</p>
            ) : (
              <ul className="grid gap-2">
                {patent.inventors.map((person) => (
                  <li key={`${person.sequence ?? 0}-${person.name}`} className="text-sm">
                    <span className="font-medium">{person.name}</span>
                    <span className="text-muted-foreground">
                      {" "}
                      · {countryLabel(person.country)}
                      {person.location ? ` · ${person.location}` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Section>
          <Section title="申请人 / 专利权人">
            {patent.assignees.length === 0 ? (
              <p className="text-sm text-muted-foreground">暂无</p>
            ) : (
              <ul className="grid gap-2">
                {patent.assignees.map((party) => (
                  <li key={`${party.sequence ?? 0}-${party.name}`} className="text-sm">
                    <span className="font-medium">{party.name}</span>
                    <span className="text-muted-foreground">
                      {" "}
                      · {countryLabel(party.country)}
                      {party.typeLabel ? ` · ${party.typeLabel}` : ""}
                      {party.location ? ` · ${party.location}` : ""}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Section>
          <Section title="分类号">
            {patent.classifications.length === 0 ? (
              <p className="text-sm text-muted-foreground">暂无</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {patent.classifications.map((item) => (
                  <Badge key={`${item.system}-${item.symbol}`} variant="outline">
                    {item.system} {item.symbol}
                  </Badge>
                ))}
              </div>
            )}
          </Section>
          <Section title="法律状态">
            <p className="text-sm font-medium">{patent.legalStatus.label}</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">{patent.legalStatus.note}</p>
            <p className="mt-2 text-sm text-muted-foreground">
              撤回标记：{patent.withdrawn === true ? "是" : patent.withdrawn === false ? "否" : "暂无"}
            </p>
            {!capabilities.legalStatus ? (
              <p className="mt-2 text-sm leading-6 text-muted-foreground">
                INPADOC 法律事件暂无。接入 EPO OPS 后，这里可以显示授权、期满和年费事件。
              </p>
            ) : null}
          </Section>
          <Section title="专利同族">
            <p className="text-sm leading-6 text-muted-foreground">
              {capabilities.family
                ? "当前数据源声明支持同族，但本页还没有同族列表。"
                : "暂无。PatentsView 不提供专利族。接入 EPO OPS 后，可在此显示 simple family。"}
            </p>
          </Section>
        </div>
        <aside className="h-fit rounded-xl bg-card p-4 ring-1 ring-foreground/10">
          <h2 className="text-sm font-medium">著录项目</h2>
          <dl className="mt-3 grid gap-3 text-sm">
            <Fact label="文献号" value={patent.number} />
            <Fact label="日期" value={patent.date ?? "暂无"} />
            <Fact label="文献类型" value={patent.docType === "publication" ? "美国申请公开" : "美国授权专利"} />
            <Fact label="专利类型" value={patent.patentTypeLabel} />
            <Fact label="辖区" value={`${countryLabel(patent.jurisdiction)}（${patent.jurisdiction}）`} />
            <Fact label="申请号" value={patent.applicationNumber ?? "暂无"} />
            <Fact label="申请日" value={patent.filingDate ?? "暂无"} />
            <Fact label="WIPO 种类" value={patent.kind ?? "暂无"} />
            <Fact
              label="美国专利引用次数"
              value={patent.citedByUsPatents === undefined ? "暂无" : String(patent.citedByUsPatents)}
            />
            <Fact label="相关号码" value={patent.relatedNumbers.length ? patent.relatedNumbers.join("、") : "暂无"} />
          </dl>
        </aside>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl bg-card p-4 ring-1 ring-foreground/10 sm:p-5">
      <h2 className="text-sm font-medium">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="break-words">{value}</dd>
    </div>
  );
}

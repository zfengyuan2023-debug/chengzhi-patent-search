import type { ChartBucket, ResultCharts } from "@/lib/patents/types";

function BarList({ buckets }: { buckets: ChartBucket[] }) {
  const max = Math.max(...buckets.map((bucket) => bucket.count), 1);
  if (buckets.length === 0) {
    return <p className="text-sm text-muted-foreground">暂无</p>;
  }
  return (
    <ul className="space-y-2.5">
      {buckets.map((bucket) => (
        <li key={bucket.key}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-xs">
            <span className="truncate font-medium">{bucket.label}</span>
            <span className="shrink-0 tabular-nums text-muted-foreground">{bucket.count}</span>
          </div>
          <div className="h-1.5 rounded-full bg-muted">
            <div
              className="h-1.5 rounded-full bg-primary"
              style={{ width: `${Math.max(6, (bucket.count / max) * 100)}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function ResultChartsPanel({ charts }: { charts: ResultCharts }) {
  const coverage = charts.truncated
    ? `图表统计按日期排序的前 ${charts.sampleSize.toLocaleString("zh-CN")} 条，检索共 ${charts.total.toLocaleString("zh-CN")} 条。`
    : `图表覆盖本次检索的全部 ${charts.sampleSize.toLocaleString("zh-CN")} 条。`;
  const jurisdictionNote =
    charts.countryMode === "assignee" ? "专利辖区均为美国，因此国家图改为申请人国家/地区。" : "";

  return (
    <section aria-label="检索结果统计" className="grid gap-3">
      <p className="text-sm leading-6 text-muted-foreground">
        {coverage}
        {jurisdictionNote}
      </p>
      <div className="grid gap-3 lg:grid-cols-3">
        <ChartCard title="年份" buckets={charts.byYear} />
        <ChartCard title={charts.countryModeLabel} buckets={charts.byCountry} />
        <ChartCard title="分类号" note="CPC 小类，没有 CPC 时用 IPC" buckets={charts.byClass} />
      </div>
    </section>
  );
}

function ChartCard({ title, note, buckets }: { title: string; note?: string; buckets: ChartBucket[] }) {
  return (
    <article className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
      <h2 className="text-sm font-medium">{title}</h2>
      {note ? <p className="mt-1 text-xs text-muted-foreground">{note}</p> : null}
      <div className="mt-3">
        <BarList buckets={buckets} />
      </div>
    </article>
  );
}

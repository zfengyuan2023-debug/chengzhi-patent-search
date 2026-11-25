import { countryLabel } from "@/lib/patents/countries";
import type { ChartBucket, PatentSummary, ResultCharts } from "@/lib/patents/types";

const TOP_N = 8;

function count(keys: string[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const key of keys) {
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

function bucketsFrom(counts: Map<string, number>, labelOf: (key: string) => string): ChartBucket[] {
  return [...counts.entries()]
    .map(([key, value]) => ({ key, label: labelOf(key), count: value }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "zh"));
}

export function primaryClass(classes: string[]): string {
  const symbol = classes.find(Boolean)?.replace(/\s+/g, "") ?? "";
  const match = symbol.match(/^[A-HY]\d{2}[A-Z]/);
  return match?.[0] ?? (symbol.slice(0, 8) || "未分类");
}

export function yearOf(row: PatentSummary): string {
  if (row.year && row.year > 1700) return String(row.year);
  const match = row.date?.match(/^(\d{4})/);
  return match?.[1] ?? "未知";
}

export function buildCharts(rows: PatentSummary[], total: number): ResultCharts {
  const jurisdictions = new Set(rows.map((row) => row.jurisdiction).filter(Boolean));
  const countryMode = jurisdictions.size > 1 ? "jurisdiction" : "assignee";
  const countryKeys =
    countryMode === "jurisdiction"
      ? rows.map((row) => row.jurisdiction || "未知")
      : rows.map((row) => row.assigneeCountries.find(Boolean) || "未知");

  const byYear = bucketsFrom(
    count(rows.map((row) => yearOf(row))),
    (key) => key,
  ).sort((a, b) => {
    const yearA = Number(a.key);
    const yearB = Number(b.key);
    if (Number.isFinite(yearA) && Number.isFinite(yearB)) return yearB - yearA;
    if (!Number.isFinite(yearA)) return 1;
    return -1;
  });

  return {
    sampleSize: rows.length,
    total,
    truncated: total > rows.length,
    countryMode,
    countryModeLabel: countryMode === "jurisdiction" ? "专利辖区" : "申请人国家/地区",
    byYear,
    byCountry: bucketsFrom(count(countryKeys), countryLabel).slice(0, TOP_N),
    byClass: bucketsFrom(
      count(rows.map((row) => primaryClass(row.classes))),
      (key) => key,
    ).slice(0, TOP_N),
  };
}

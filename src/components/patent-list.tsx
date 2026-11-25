import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { countryLabel } from "@/lib/patents/countries";
import type { PatentRecord } from "@/lib/patents/types";

function joinNames(names: string[], empty: string): string {
  const visible = names.filter((name) => name && name !== "未公开");
  return visible.length ? visible.join("、") : empty;
}

export function PatentList({ items, from }: { items: PatentRecord[]; from: string }) {
  return (
    <ol className="divide-y divide-border">
      {items.map((item) => {
        const classes = item.classifications.slice(0, 4);
        const href = `/patent/${encodeURIComponent(item.id)}${from ? `?from=${encodeURIComponent(from)}` : ""}`;
        return (
          <li key={item.id} className="py-5">
            <article>
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <p className="font-mono text-sm text-primary">
                  <Link href={href} className="hover:underline">
                    {item.number}
                  </Link>
                </p>
                <p className="text-xs text-muted-foreground">
                  {item.date ?? "日期暂无"}
                  <span aria-hidden="true"> · </span>
                  {countryLabel(item.jurisdiction)}
                  <span aria-hidden="true"> · </span>
                  {item.docType === "publication" ? "申请公开" : item.patentTypeLabel}
                </p>
              </div>
              <h2 className="mt-1 text-base leading-snug font-medium">
                <Link href={href} className="hover:text-primary">
                  {item.title}
                </Link>
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {joinNames(
                  item.assignees.map((party) => party.name),
                  "申请人暂无",
                )}
                <span aria-hidden="true"> · </span>
                {joinNames(
                  item.inventors.map((party) => party.name),
                  "发明人暂无",
                )}
              </p>
              {classes.length ? (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {classes.map((itemClass) => (
                    <Badge key={`${itemClass.system}-${itemClass.symbol}`} variant="outline">
                      {itemClass.system} {itemClass.symbol}
                    </Badge>
                  ))}
                </div>
              ) : null}
              <p className="mt-2 text-sm leading-6 text-foreground/85">
                {item.snippet || "摘要暂无"}
              </p>
            </article>
          </li>
        );
      })}
    </ol>
  );
}

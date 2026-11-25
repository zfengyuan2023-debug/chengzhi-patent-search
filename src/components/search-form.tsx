import Link from "next/link";
import { Search } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SearchInput } from "@/lib/patents/types";
import { cn } from "cn";

const fields = [
  {
    name: "number",
    label: "专利号 / 公开号",
    placeholder: "例如 6285999 或 US20200123456A1",
  },
  {
    name: "assignee",
    label: "申请人 / 专利权人",
    placeholder: "例如 Tesla",
  },
  {
    name: "inventor",
    label: "发明人",
    placeholder: "例如 Lawrence Page",
  },
  {
    name: "classification",
    label: "IPC / CPC",
    placeholder: "例如 H01M 或 G06F16/00",
  },
] as const;

export function SearchForm({ values }: { values: SearchInput }) {
  return (
    <form action="/search" method="get" className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="keyword">关键词</Label>
        <Input
          id="keyword"
          name="keyword"
          defaultValue={values.keyword ?? ""}
          placeholder="标题或摘要中的词，例如 lithium battery"
          className="h-11 bg-card md:text-sm"
          autoComplete="off"
        />
        <p className="text-xs leading-5 text-muted-foreground">
          在标题和摘要里查找。用引号表示短语，例如 “solid electrolyte”。题名和摘要保持原文。
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map((field) => (
          <div key={field.name} className="grid gap-2">
            <Label htmlFor={field.name}>{field.label}</Label>
            <Input
              id={field.name}
              name={field.name}
              defaultValue={values[field.name] ?? ""}
              placeholder={field.placeholder}
              className="h-10 bg-card"
              autoComplete="off"
            />
          </div>
        ))}
      </div>
      <div className="flex flex-col-reverse gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-5 text-muted-foreground">至少填写一项。多项条件同时满足。</p>
        <div className="flex gap-2">
          <Link href="/" className={cn(buttonVariants({ variant: "outline" }), "h-10 px-4")}>
            清空
          </Link>
          <Button type="submit" className="h-10 px-4">
            <Search />
            检索
          </Button>
        </div>
      </div>
    </form>
  );
}

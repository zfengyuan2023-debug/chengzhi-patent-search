"use client";

import { useState } from "react";
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
    label: "专利号 / 公开号 / 外观号",
    placeholder: "例如 015157835-0016 或 D1146341",
  },
  {
    name: "assignee",
    label: "申请人 / 权利人",
    placeholder: "例如 LEGAMI 或 Tesla",
  },
  {
    name: "inventor",
    label: "发明人",
    placeholder: "仅美国发明专利可用",
  },
  {
    name: "classification",
    label: "洛迦诺 / IPC / CPC / 美国分类",
    placeholder: "例如 Locarno 07.01 或 D7 或 H01M",
  },
] as const;

export function SearchForm({
  values,
  scope = "designs",
  region = "ALL",
}: {
  values: SearchInput;
  scope?: "designs" | "utility";
  region?: string;
}) {
  const [currentScope, setCurrentScope] = useState<"designs" | "utility">(scope);

  return (
    <form action="/search" method="get" className="grid gap-4">
      <div className="grid gap-2">
        <p className="text-sm font-medium">检索范围</p>
        <div className="flex flex-wrap gap-2">
          <label
            className={cn(
              "cursor-pointer rounded-full px-3 py-1 text-sm ring-1 ring-foreground/10",
              currentScope !== "utility" ? "bg-primary text-primary-foreground" : "bg-card",
            )}
          >
            <input
              type="radio"
              name="scope"
              value="designs"
              checked={currentScope !== "utility"}
              onChange={() => setCurrentScope("designs")}
              className="sr-only"
            />
            外观设计（欧盟 + 美国）
          </label>
          <label
            className={cn(
              "cursor-pointer rounded-full px-3 py-1 text-sm ring-1 ring-foreground/10",
              currentScope === "utility" ? "bg-primary text-primary-foreground" : "bg-card",
            )}
          >
            <input
              type="radio"
              name="scope"
              value="utility"
              checked={currentScope === "utility"}
              onChange={() => setCurrentScope("utility")}
              className="sr-only"
            />
            发明专利（美国）
          </label>
        </div>
      </div>
      {currentScope !== "utility" ? (
        <div className="grid gap-2">
          <Label htmlFor="region">受理局</Label>
          <select
            id="region"
            name="region"
            defaultValue={region || "ALL"}
            className="h-10 rounded-md border border-input bg-card px-3 text-sm"
          >
            <option value="ALL">全部（欧盟 + 美国）</option>
            <option value="EU">欧盟知识产权局（EUIPO）</option>
            <option value="US">美国专利商标局（USPTO）</option>
          </select>
        </div>
      ) : null}
      <div className="grid gap-2">
        <Label htmlFor="keyword">关键词</Label>
        <Input
          id="keyword"
          name="keyword"
          defaultValue={values.keyword ?? ""}
          placeholder={
            currentScope === "utility"
              ? "标题或摘要中的词，例如 lithium battery"
              : "标题或权利人，例如 mug 或 drawer organizer"
          }
          className="h-11 bg-card md:text-sm"
          autoComplete="off"
        />
        <p className="text-xs leading-5 text-muted-foreground">
          {currentScope === "utility"
            ? "在标题和摘要里查找。用引号表示短语。题名和摘要保持原文。"
            : "在外观标题、权利人和分类号里查找。用引号表示短语。外观图请使用以图搜图。"}
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

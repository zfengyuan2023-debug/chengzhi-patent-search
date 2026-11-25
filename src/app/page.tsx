import { Suspense } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { SearchForm } from "@/components/search-form";
import { SourceNotice } from "@/components/source-notice";
import { Skeleton } from "@/components/ui/skeleton";

export default function HomePage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:py-12">
      <div className="mb-6">
        <p className="text-sm font-medium text-primary">美国专利题录</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-balance">检索授权专利与申请公开</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
          按关键词、号码、申请人、发明人或分类号查找。结果列出题名、号码、日期、权利人、辖区和摘要片段。同族与
          INPADOC 法律状态留待以后接入 EPO OPS。
        </p>
      </div>
      <Card>
        <CardContent>
          <SearchForm values={{}} />
        </CardContent>
      </Card>
      <div className="mt-4">
        <Suspense fallback={<Skeleton className="h-28 w-full" />}>
          <SourceNotice />
        </Suspense>
      </div>
    </div>
  );
}

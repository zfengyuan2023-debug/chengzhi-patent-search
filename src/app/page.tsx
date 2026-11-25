import { Suspense } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { SearchForm } from "@/components/search-form";
import { SourceNotice } from "@/components/source-notice";
import { OfficialSearchLinks } from "@/components/official-search-links";
import { Skeleton } from "@/components/ui/skeleton";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "cn";

export default function HomePage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:py-12">
      <div className="mb-6">
        <p className="text-sm font-medium text-primary">欧盟外观设计与美国外观专利</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-balance">检索外观设计，也可以用图来搜</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
          默认检索本站目录中的欧盟知识产权局（EUIPO）登记外观和美国专利商标局（USPTO）外观专利，主要为 2025 年及以后的快照。同一关键词也可跳转到 WIPO、EUIPO、USPTO 等持续更新的官方登记簿。不是全球所有发明专利，也不构成法律意见。美国发明专利可在检索范围里切换；没有免费密钥时只能看示例。
        </p>
      </div>
      <Card className="mb-4">
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold">以图搜图</h2>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              上传、拖放或粘贴产品照片，查找视觉上相近的欧盟与美国外观设计。首次需要下载约 800 MB 目录和图像模型，之后可保存在本机。
            </p>
          </div>
          <Link href="/image" className={cn(buttonVariants(), "h-10 shrink-0 px-4")}>
            打开以图搜图
          </Link>
        </CardContent>
      </Card>
      <Card>
        <CardContent>
          <SearchForm values={{}} scope="designs" />
        </CardContent>
      </Card>
      <div className="mt-4 grid gap-4">
        <OfficialSearchLinks scope="designs" />
        <Suspense fallback={<Skeleton className="h-28 w-full" />}>
          <SourceNotice />
        </Suspense>
      </div>
    </div>
  );
}

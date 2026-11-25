import type { ReactNode } from "react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "使用说明",
};

export default function GuidePage() {
  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-8 sm:py-12">
      <p className="text-sm font-medium text-primary">澄知</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-tight">使用说明</h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        本地运行、环境变量和数据限制的完整说明在项目 README。这一页是检索时能直接打开的简版。
      </p>

      <Section id="api-key" title="获取免费密钥">
        <ol className="list-decimal space-y-2 pl-5">
          <li>
            打开 PatentsView 官方接口说明：
            <a
              className="ml-1 text-primary hover:underline"
              href="https://search.patentsview.org/docs/docs/Search%20API/SearchAPIReference/"
              target="_blank"
              rel="noreferrer"
            >
              PatentSearch API Reference
            </a>
            ，找到 Request an API Key。
          </li>
          <li>按页面指引向 PatentsView Help Center 提交申请。每人一把密钥，不需要付费，也不要同时申请多把。</li>
          <li>
            在项目根目录创建 <code className="font-mono">.env.local</code>，写入{" "}
            <code className="font-mono">PATENTSVIEW_API_KEY=你的密钥</code>。不要把密钥提交到仓库。
          </li>
          <li>
            重新运行 <code className="font-mono">npm run dev</code>。免费额度大约是每分钟 45 次请求。
          </li>
        </ol>
        <p className="mt-3">
          还没有密钥时，可以设置 <code className="font-mono">PATENT_DATA_SOURCE=mock</code> 使用内置示例。测试命令{" "}
          <code className="font-mono">npm test</code> 不需要密钥。
        </p>
      </Section>

      <Section id="search" title="怎么检索">
        <p>关键词查标题和摘要。多项条件要同时满足。分类号可写小类 H01M，或更长的 CPC，例如 H01M10/0525。专利号支持去掉 US 前缀和种类码。</p>
        <p className="mt-2">11 位、以 19 或 20 开头的号码，以及带 A1 的号码，会查美国申请公开。其他号码查授权专利。</p>
      </Section>

      <Section id="limits" title="数据范围">
        <p>这一版最完整的是美国授权专利。PatentsView 没有 INPADOC 法律状态，详情页的法律状态会显示「暂无」；如果记录带有撤回标记，则显示「已撤回」。</p>
        <p className="mt-2">图表统计的是按日期排序的前 100 条，不是全库分布。专利族和全球书目需要以后的 EPO OPS 适配器，当前不会访问 EPO。</p>
        <p className="mt-2">
          <Link href="/" className="text-primary hover:underline">
            返回检索
          </Link>
        </p>
      </Section>
    </article>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="mt-8 scroll-mt-20">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="mt-2 text-sm leading-7 text-foreground/85">{children}</div>
    </section>
  );
}

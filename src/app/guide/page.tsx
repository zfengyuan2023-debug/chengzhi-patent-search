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
        澄知可以检索本站欧盟与美国外观目录，也可以用产品照片找相近外观，并把同一检索词带到持续更新的官方登记簿。这一页说明数据范围和限制。
      </p>

      <Section id="image" title="以图搜图">
        <p>
          打开{" "}
          <Link href="/image" className="text-primary hover:underline">
            以图搜图
          </Link>
          ，上传、拖放或粘贴一张产品照片。可在图上框选产品后再检索。系统使用公开的 CLIP ViT-B-32
          模型，在已公开的外观目录里按图像相似度排序。这是辅助筛选，不是法律意见，也不能达到商业专利检索软件的精度。
        </p>
        <p className="mt-2">
          目录和模型托管在已经公开的 GitHub 数据库：
          <a
            className="ml-1 text-primary hover:underline"
            href="https://zfengyuan2023-debug.github.io/patent-image-search/"
            target="_blank"
            rel="noreferrer"
          >
            patent-image-search
          </a>
          。首次大约下载 800 MB，之后可以缓存在本机。
        </p>
      </Section>

      <Section id="search" title="怎么检索">
        <p>默认检索外观设计。关键词查标题、权利人和分类号。外观号、权利人、洛迦诺或美国分类号可以组合，多项条件要同时满足。</p>
        <p className="mt-2">把检索范围切换到「发明专利（美国）」后，关键词查标题和摘要。这一路仍只覆盖美国，需要 PatentsView 免费密钥才能查真实数据。</p>
      </Section>


      <Section id="official" title="官方实时登记簿">
        <p>
          本站目录是公开的欧盟与美国外观快照，主要为 2025 年及以后，不会随官方登记簿自动更新。检索页和首页提供指向持续更新官方网站的链接：世界知识产权组织全球外观设计数据库（WIPO Global Design Database）、欧盟知识产权局 eSearch plus、美国专利商标局 Patent Public Search，以及发明专利用的欧洲专利局 Espacenet 和 WIPO PATENTSCOPE。
        </p>
        <p className="mt-2">
          这些是在官方网站打开的检索，不是澄知代为查询后显示的实时结果。WIPO 全球外观设计数据库的使用条款禁止自动查询和批量下载，因此只会生成可分享的官方检索链接，不会抓取该库。当前站点也没有配置 EPO OPS、EUIPO 或 PatentsView 的接口密钥。
        </p>
        <p className="mt-2">
          官方以图搜图无法通过网址预先上传您的照片，请在{" "}
          <Link href="/image" className="text-primary hover:underline">
            以图搜图
          </Link>
          {" "}页提供的官方入口中自行上传。WIPO PATENTSCOPE 没有已验证、能稳定带上检索词的公开网址，打开后请在官方页重新输入。
        </p>
      </Section>
      <Section id="limits" title="数据范围">
        <p>
          外观目录覆盖欧盟知识产权局（EUIPO）登记外观和美国专利商标局（USPTO）外观专利，主要为 2025 年 1
          月及以后，约 19 万件外观（检索图库约 20 万张图）。不是全球所有国家的外观，也不包含中国、日本、韩国、WIPO 等地的发明专利全文库。
        </p>
        <p className="mt-2">
          欧洲发明专利族和法律状态需要 EPO Open Patent Services 的免费消费者密钥。当前站点没有这项密钥，因此不会声称已经覆盖全球发明专利。
        </p>
        <p className="mt-2">
          <Link href="/" className="text-primary hover:underline">
            返回检索
          </Link>
          <span aria-hidden="true"> · </span>
          <Link href="/image" className="text-primary hover:underline">
            以图搜图
          </Link>
        </p>
      </Section>

      <Section id="api-key" title="美国发明专利的免费密钥">
        <p>外观检索和以图搜图不需要密钥。只有检索美国发明专利时，才需要 PatentsView 免费密钥。</p>
        <ol className="mt-2 list-decimal space-y-2 pl-5">
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
          <li>按页面指引向 PatentsView Help Center 提交申请。不需要付费。</li>
          <li>
            在环境变量中写入 <code className="font-mono">PATENTSVIEW_API_KEY</code>，不要把密钥提交到仓库。
          </li>
        </ol>
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

---
title: 澄知专利检索
emoji: 🔍
colorFrom: green
colorTo: blue
sdk: docker
app_port: 7860
pinned: false
short_description: 中文界面的美国专利题录检索，默认可示例运行
---

# 澄知专利检索

自托管的专利题录检索。界面是中文，题名和摘要保持原文。当前只接免费的 [USPTO PatentsView PatentSearch API](https://search.patentsview.org/docs/docs/Search%20API/SearchAPIReference/)。不使用付费接口、BigQuery、WIPO PATENTSCOPE API，也不抓取 Google Patents、Espacenet 或 PATENTSCOPE。

这一版最完整的是美国授权专利。全球书目、专利族和 INPADOC 法律状态留了适配器接口，但没有实现 EPO 的在线调用。

## 本地运行

需要 Node.js 20.9 或更新版本。

```bash
npm install
cp .env.example .env.local
npm run dev
```

浏览器打开 [http://127.0.0.1:43117](http://127.0.0.1:43117)。

没有密钥时页面仍能打开，并提示如何免费申请。检索真实数据前，在 `.env.local` 写入密钥后重启开发服务器。

```bash
npm test
npm run build
npm start
```

`npm test` 使用内置示例，不访问 PatentsView，也不需要密钥。

## 环境变量

| 变量 | 作用 |
| --- | --- |
| `PATENTSVIEW_API_KEY` | PatentsView 免费密钥。只从环境变量读取，不要写进代码或提交到仓库。 |
| `PATENT_DATA_SOURCE` | `patentsview` 或 `mock`。本地未设置时按 `patentsview` 运行（没有密钥会提示申请）。Docker / Spaces 镜像默认是 `mock`。 |
| `CACHE_TTL_SECONDS` | 服务器内存缓存秒数，默认 `900`。 |
| `PATENTSVIEW_BASE_URL` | 可选。默认 `https://search.patentsview.org`。 |

`.env*` 已在 `.gitignore` 中忽略，`.env.example` 除外。

## 获取免费密钥

1. 打开 [PatentSearch API Reference](https://search.patentsview.org/docs/docs/Search%20API/SearchAPIReference/) 的 **Request an API Key**。
2. 按该页说明向 PatentsView Help Center 申请。官方说明是每人一把密钥，不收费；不要同时申请多把，否则可能被取消访问。
3. 把密钥放到 `.env.local`：

```bash
PATENTSVIEW_API_KEY=你的密钥
PATENT_DATA_SOURCE=patentsview
```

4. 重新运行 `npm run dev`。

带密钥时，限额大约是每分钟 45 次。同一次检索的列表和图表会各记一次；之后在缓存有效期内重复打开同一检索或同一专利，不再请求上游。

## 能检索什么

首页可以组合这些条件，多项之间是「同时满足」：

- 关键词：标题或摘要。加引号按短语检索。
- 专利号或公开号：授权号如 `6285999`、`US6285999B2`；11 位且以 19 或 20 开头、或带 `A1` 的号码走申请公开。
- 申请人 / 专利权人
- 发明人：两个词时按名和姓，一个词时名或姓均可。
- IPC 或 CPC：例如 `H01M`、`H01M10/0525`。

结果列表有题名、号码、日期、权利人、辖区、分类号和摘要片段，可以用上一页 / 下一页。详情页有著录项目、摘要、发明人、申请人、分类号。PatentsView 不提供 INPADOC 法律状态，该栏显示「暂无」；若记录带撤回标记，则显示「已撤回」。

图表按本次检索、日期从新到旧的前 100 条统计年份、国家/地区和分类号。美国数据里专利辖区都是美国，因此国家图改为申请人国家/地区，并在图上说明。

## 缓存

`src/lib/patents/cache.ts` 里的 `CacheStore` 是缓存接口，默认实现是进程内 `MemoryCache`（带 TTL，并把同时发生的相同请求合并成一次上游调用）。自托管的 Node 进程里，这个实例放在 `globalThis` 上。

这不是 Redis。如果以后改成多进程或无服务器部署，可以实现同一个接口再换进去。本项目的目标是单机运行，不部署到付费主机。

## 免费托管到 Hugging Face Spaces

用 Docker SDK，选免费的 CPU basic 即可。不需要付费硬件，也不需要 PatentsView 密钥。不要把密钥写进 Dockerfile 或仓库。

根目录的 `Dockerfile` 会：

- 以生产模式构建 Next.js（`output: "standalone"`）
- 监听 `7860`（Spaces 默认端口）
- 在启动时把 `HOSTNAME` 设为 `0.0.0.0`，避免 Docker 注入的容器名导致进程只绑在容器内部
- 默认 `PATENT_DATA_SOURCE=mock`，没有密钥也能打开示例检索

本文件顶部的 YAML 是 Spaces 配置：`sdk: docker`，`app_port: 7860`。

1. 在 [新建 Space](https://huggingface.co/new-space) 时选择 Docker，硬件选 CPU basic。
2. 把本仓库推送到这个 Space。等镜像构建完成后再打开页面。
3. 打开后应看到示例数据横幅，检索不访问 PatentsView。

以后要查真实美国专利：在 Space 的 Settings → Secrets 添加 `PATENTSVIEW_API_KEY`（访客看不到），并在 Settings → Variables 把 `PATENT_DATA_SOURCE` 设为 `patentsview`。只放密钥、不改变量时，站点仍使用示例数据。

本机试跑镜像：

```bash
docker build -t chengzhi .
docker run --rm -p 7860:7860 chengzhi
```

浏览器打开 [http://127.0.0.1:7860](http://127.0.0.1:7860)。启用真实检索时再传入变量，密钥来自你自己的环境，而不是镜像：

```bash
docker run --rm -p 7860:7860 \
  -e PATENT_DATA_SOURCE=patentsview \
  -e PATENTSVIEW_API_KEY \
  chengzhi
```

`PATENTSVIEW_API_KEY` 不加值时，Docker 会从当前 shell 带入同名变量。

## 示例数据

```bash
PATENT_DATA_SOURCE=mock npm run dev
```

示例号码以 `DMO` 开头，著录是为界面和测试编写的，不是 USPTO 原文。页面上会标明当前是示例数据。

## 数据限制

- 关键词检索默认查美国授权专利，不查申请公开。只有号码看起来是美国公开号时，才请求 `/api/v1/publication/`。
- 没有中国、欧洲、日本等其他局的全文或书目，除非以后接上 EPO OPS。
- 法律状态不是 INPADOC。撤回标记也不能说明专利是否仍然有效。
- 图表不是全库统计，只覆盖排序后的前 100 条。
- PatentsView 的字段和更新节奏以官方文档为准。本仓库按 2025 年 PatentSearch API 的字段编写。

## 后续接入 EPO OPS

现在没有 EPO 密钥，代码里也没有对 `ops.epo.org` 的请求。`EpoOpsProvider`（`src/lib/patents/providers/epo-ops.ts`）实现了 `PatentProvider` 接口，但 `search`、`summarize`、`getById` 都会直接拒绝，并声明自己将来可以提供：

- 全球书目
- 专利族
- INPADOC 法律状态

以后要接的时候：

1. 在环境变量中提供 `EPO_OPS_CONSUMER_KEY` 和 `EPO_OPS_CONSUMER_SECRET`（OPS 的 OAuth2 client credentials）。不要把它们写进仓库。
2. 用 client credentials 向 `https://ops.epo.org/3.2/auth/accesstoken` 取令牌。
3. 在 `EpoOpsProvider` 里调用这些只读接口，并映射成现有的 `PatentRecord`：
   - 书目：`GET /3.2/rest-services/published-data/publication/epodoc/{id}/biblio`
   - 同族：`GET /3.2/rest-services/family/publication/docdb/{id}`
   - 法律状态：`GET /3.2/rest-services/legal/publication/epodoc/{id}`
4. 只有两个变量都存在时，才在 `src/lib/patents/index.ts` 的 `createProvider` 里选用它。详情页已经会读取 `capabilities.family` 和 `capabilities.legalStatus`；接上之后，同族和法律状态不再显示「暂无」。

页面和缓存不需要改接口。

## 目录

- `src/lib/patents/parse-query.ts`：检索式解析和号码规范化
- `src/lib/patents/providers/patentsview-query.ts`：PatentsView 查询 JSON
- `src/lib/patents/providers/patentsview-map.ts`：响应映射到统一著录
- `src/lib/patents/providers/patentsview.ts`：HTTP 客户端
- `src/lib/patents/providers/mock.ts`：示例数据
- `src/lib/patents/providers/epo-ops.ts`：EPO 占位
- `src/lib/patents/cache.ts`、`service.ts`：缓存和检索服务
- `src/app`：中文界面

## 许可与数据

专利题录来自 USPTO PatentsView。使用时请遵守 [PatentsView 的接口条款](https://search.patentsview.org/docs/docs/Search%20API/SearchAPIReference/)。本程序不存储你的密钥。

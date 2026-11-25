import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "以图搜图",
  description: "上传或粘贴产品照片，查找相近的欧盟与美国外观设计。",
};

export default function ImageSearchPage() {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col">
      <iframe
        src="/design-search/index.html"
        title="以图搜图：欧盟与美国外观设计"
        className="w-full flex-1 border-0"
      />
    </div>
  );
}

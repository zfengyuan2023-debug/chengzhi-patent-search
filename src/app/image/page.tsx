import type { Metadata } from "next";
import { OfficialSearchLinks } from "@/components/official-search-links";

export const metadata: Metadata = {
  title: "以图搜图",
  description: "上传或粘贴产品照片，查找相近的欧盟与美国外观设计。",
};

export default function ImageSearchPage() {
  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col">
      <div className="mx-auto w-full max-w-6xl px-4 pt-4">
        <OfficialSearchLinks scope="image" />
      </div>
      <iframe
        src="/design-search/index.html"
        title="以图搜图：欧盟与美国外观设计"
        className="mt-4 w-full flex-1 border-0"
      />
    </div>
  );
}

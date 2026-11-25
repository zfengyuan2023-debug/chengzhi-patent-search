import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto w-full max-w-xl px-4 py-16">
      <h1 className="text-2xl font-semibold">没有找到这个页面</h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">地址可能写错了。可以回到检索页重新开始。</p>
      <Link href="/" className="mt-5 inline-block text-sm font-medium text-primary hover:underline">
        返回首页
      </Link>
    </div>
  );
}

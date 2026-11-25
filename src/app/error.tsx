"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto w-full max-w-xl px-4 py-16">
      <h1 className="text-2xl font-semibold">页面出现问题</h1>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">检索没有完成。可以重试，或返回首页。</p>
      <div className="mt-5 flex gap-2">
        <Button type="button" className="h-10 px-4" onClick={() => reset()}>
          重试
        </Button>
        <Link href="/" className="inline-flex h-10 items-center px-2 text-sm text-primary hover:underline">
          返回首页
        </Link>
      </div>
    </div>
  );
}

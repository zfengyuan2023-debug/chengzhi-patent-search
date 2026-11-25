import { SearchSkeleton } from "@/components/skeletons";

export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6">
      <SearchSkeleton />
    </div>
  );
}

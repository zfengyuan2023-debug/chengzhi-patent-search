import { encodeCursor } from "@/lib/patents/parse-query";

export function previousPages(trailLength: number, hasCursor: boolean): number {
  return trailLength + (hasCursor ? 1 : 0);
}

export function pageNumber(trailLength: number, hasCursor: boolean): number {
  return previousPages(trailLength, hasCursor) + 1;
}

export function hasMoreResults(
  previousPageCount: number,
  pageSize: number,
  itemCount: number,
  total: number,
  totalExact: boolean,
): boolean {
  if (itemCount === 0) return false;
  if (!totalExact) return itemCount === pageSize;
  return previousPageCount * pageSize + itemCount < total;
}

export function nextPageQuery(
  trail: string[],
  currentCursor: string | undefined,
  nextCursor: string,
): { cursor: string; trail?: string } {
  const history = currentCursor ? [...trail, currentCursor] : [...trail];
  return {
    cursor: nextCursor,
    trail: history.length ? encodeCursor(history) : undefined,
  };
}

export function previousPageQuery(
  trail: string[],
  currentCursor: string | undefined,
): { cursor?: string; trail?: string } | null {
  if (!currentCursor) return null;
  if (trail.length === 0) return {};
  const rest = trail.slice(0, -1);
  return {
    cursor: trail[trail.length - 1],
    trail: rest.length ? encodeCursor(rest) : undefined,
  };
}

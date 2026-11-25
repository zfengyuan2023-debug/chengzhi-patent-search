import { DESIGN_CATALOG_BASE } from "@/lib/designs/config";
import { uniqueDesigns, type DesignRecord } from "@/lib/designs/search";

type CatalogHeader = {
  format?: string;
  files?: Array<{ name: string; file: string; bytes?: number }>;
};

export type CatalogLoadProgress = {
  doneBytes: number;
  totalBytes: number;
  fileIndex: number;
  fileCount: number;
};

let cached: Promise<DesignRecord[]> | null = null;

function assetUrl(rel: string): string {
  return new URL(rel, DESIGN_CATALOG_BASE).href;
}

async function readProgress(resp: Response, onChunk: (n: number) => void): Promise<string> {
  if (!resp.body || !resp.body.getReader) {
    const text = await resp.text();
    onChunk(text.length);
    return text;
  }
  const reader = resp.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const step = await reader.read();
    if (step.done) break;
    chunks.push(step.value);
    total += step.value.length;
    onChunk(step.value.length);
  }
  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.length;
  }
  return new TextDecoder("utf-8").decode(out);
}

async function fetchRecords(onProgress?: (progress: CatalogLoadProgress) => void): Promise<DesignRecord[]> {
  const headerResp = await fetch(assetUrl("catalog/header.json"), { cache: "force-cache" });
  if (!headerResp.ok) throw new Error("无法读取外观设计目录说明。");
  const header = (await headerResp.json()) as CatalogHeader;
  if (header.format !== "patent-catalog-public-v1") {
    throw new Error("外观设计目录格式无法识别。");
  }
  const files = (header.files ?? []).filter((file) => file.name.startsWith("records-"));
  if (!files.length) throw new Error("外观设计目录里没有题录分片。");
  const totalBytes = files.reduce((sum, file) => sum + (file.bytes || 0), 0);
  let doneBytes = 0;
  const rows: DesignRecord[] = [];
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const resp = await fetch(assetUrl("catalog/" + file.file), { cache: "force-cache" });
    if (!resp.ok) throw new Error(`无法下载目录分片 ${file.file}。`);
    const text = await readProgress(resp, (n) => {
      doneBytes += n;
      onProgress?.({
        doneBytes,
        totalBytes,
        fileIndex: i + 1,
        fileCount: files.length,
      });
    });
    const parsed = JSON.parse(text) as DesignRecord[];
    if (Array.isArray(parsed)) rows.push(...parsed);
  }
  return uniqueDesigns(rows);
}

export function loadDesignCatalog(onProgress?: (progress: CatalogLoadProgress) => void): Promise<DesignRecord[]> {
  if (!cached) {
    cached = fetchRecords(onProgress).catch((error) => {
      cached = null;
      throw error;
    });
  }
  return cached;
}

/** Public catalog already hosted on the user's GitHub Pages site (CORS *). */
export const DESIGN_CATALOG_BASE =
  "https://zfengyuan2023-debug.github.io/patent-image-search/";

export const DESIGN_COVERAGE = {
  offices: [
    { code: "EU", office: "EUIPO", label: "欧盟知识产权局（EUIPO）" },
    { code: "US", office: "USPTO", label: "美国专利商标局（USPTO）" },
  ],
  kind: "外观设计",
  period: "主要为 2025 年 1 月及以后登记或授权的外观",
  euRange: ["2025-01-01", "2026-11-19"],
  usRange: ["2025-01-07", "2026-11-24"],
} as const;

export function designOfficeLabel(region: string): string {
  if (region === "EU") return "欧盟知识产权局（EUIPO）";
  if (region === "US") return "美国专利商标局（USPTO）";
  return region;
}

export function designRegionLabel(region: string): string {
  if (region === "EU") return "欧盟";
  if (region === "US") return "美国";
  return region;
}

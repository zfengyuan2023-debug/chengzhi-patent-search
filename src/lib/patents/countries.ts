const NAMES: Record<string, string> = {
  US: "美国",
  CN: "中国",
  JP: "日本",
  KR: "韩国",
  DE: "德国",
  FR: "法国",
  GB: "英国",
  UK: "英国",
  TW: "中国台湾",
  HK: "中国香港",
  MO: "中国澳门",
  CA: "加拿大",
  AU: "澳大利亚",
  IN: "印度",
  SG: "新加坡",
  NL: "荷兰",
  CH: "瑞士",
  SE: "瑞典",
  FI: "芬兰",
  IT: "意大利",
  ES: "西班牙",
  IL: "以色列",
  IE: "爱尔兰",
  AT: "奥地利",
  BE: "比利时",
  DK: "丹麦",
  NO: "挪威",
  RU: "俄罗斯",
  BR: "巴西",
  MX: "墨西哥",
  NZ: "新西兰",
  ZA: "南非",
  EP: "欧洲专利局",
  EU: "欧盟",
  WO: "WIPO",
};

const ALIASES: Record<string, string> = {
  USA: "US",
  "UNITED STATES": "US",
  CHINA: "CN",
  JAPAN: "JP",
  KOREA: "KR",
  "SOUTH KOREA": "KR",
  GERMANY: "DE",
  "UNITED KINGDOM": "GB",
};

export function normalizeCountryCode(value?: string): string | undefined {
  if (!value) return undefined;
  const raw = value.trim().toUpperCase();
  if (!raw) return undefined;
  return ALIASES[raw] ?? raw;
}

export function countryLabel(value?: string): string {
  const code = normalizeCountryCode(value);
  if (!code) return "未知";
  return NAMES[code] ?? code;
}

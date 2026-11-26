/**
 * Official live-register search URLs.
 *
 * These are outbound deep links into official websites. Chengzhi does not
 * scrape, bulk-download, or automatically query WIPO (their terms forbid it),
 * and no EPO OPS / EUIPO / PatentsView credentials are configured here.
 */

export type OfficialQueryField =
  | "keyword"
  | "number"
  | "assignee"
  | "classification"
  | "inventor";

export type OfficialQueryInput = {
  keyword?: string;
  number?: string;
  assignee?: string;
  inventor?: string;
  classification?: string;
};

export type OfficialScope = "designs" | "utility" | "image";

export type OfficialLink = {
  id: string;
  office: string;
  name: string;
  coverage: string;
  href: string;
  queryCarried: boolean;
  note?: string;
  /** UI grouping. National DE/FR/IT/ES registers are separate from EUIPO. */
  group?: "international" | "national";
};

const WIPO_DESIGN_HOME = "https://designdb.wipo.int/designdb/en/";
const EUIPO_ESEARCH_HOME = "https://euipo.europa.eu/eSearch/";
const USPTO_PPS_HOME = "https://ppubs.uspto.gov/pubwebapp/";
const USPTO_PPS_EXTERNAL = "https://ppubs.uspto.gov/pubwebapp/external.html";
const ESPACENET_HOME = "https://worldwide.espacenet.com/patent/search";
const PATENTSCOPE_HOME = "https://patentscope.wipo.int/search/en/search.jsf";
const DESIGNVIEW_HOME = "https://www.tmdn.org/tmdsview-web/#/dsview";
const DPMA_DESIGN_HOME = "https://register.dpma.de/DPMAregister/gsm/experte";
const DPMA_DESIGN_AUTO = "https://register.dpma.de/DPMAregister/gsm/experte/autoRecherche/en";
const INPI_DESIGN_HOME = "https://data.inpi.fr/recherche_avancee/dessins_modeles";
const UIBM_DESIGN_HOME = "https://www.uibm.gov.it/bancadati/Advanced_search/type_url?cl=1&type=ds";
const OEPM_DESIGN_HOME = "https://consultas2.oepm.es/DisenosWeb/faces/busquedaInternet.jsp";

const FIELD_ORDER: OfficialQueryField[] = [
  "keyword",
  "number",
  "assignee",
  "classification",
  "inventor",
];

export function officialQueryTerm(
  input?: OfficialQueryInput,
): { field: OfficialQueryField; text: string } | null {
  if (!input) return null;
  for (const field of FIELD_ORDER) {
    const text = input[field]?.trim();
    if (text) return { field, text };
  }
  return null;
}

/** WIPO Global Design Database bookmarkSearch() encoding (non-simpleMode). */
export function wipoPrettifyUri(encoded: string): string {
  return encoded
    .replace(/%22/g, '"')
    .replace(/%2C/g, ",")
    .replace(/%3A/g, ":")
    .replace(/%5C/g, "\\")
    .replace(/%7B/g, "{")
    .replace(/%7D/g, "}")
    .replace(/%5B/g, "[")
    .replace(/%5D/g, "]")
    .replace(/ /g, "+");
}

function wipoField(field: OfficialQueryField): string {
  switch (field) {
    case "number":
      return "RN";
    case "assignee":
      return "HOL";
    case "classification":
      return "LC";
    case "inventor":
      return "CRE";
    default:
      return "PROD";
  }
}

export function wipoDesignSearchUrl(text: string, field: OfficialQueryField = "keyword"): string {
  const te = text.trim().replace(/"/g, "");
  if (!te) return WIPO_DESIGN_HOME;
  const payload = { searches: [{ fi: wipoField(field), te }] };
  const pretty = wipoPrettifyUri(encodeURIComponent(JSON.stringify(payload)));
  return `${WIPO_DESIGN_HOME}?q=${pretty}`;
}

export function euipoESearchUrl(text: string): string {
  const te = text.trim();
  if (!te) return EUIPO_ESEARCH_HOME;
  return `${EUIPO_ESEARCH_HOME}#basic/1+1+1+1/100+100+100+100/${encodeURIComponent(te)}`;
}

function quotePpsTerm(text: string): string {
  const cleaned = text.trim().replace(/"/g, " ").replace(/\s+/g, " ");
  if (!cleaned) return "";
  return /[^A-Za-z0-9$]/.test(cleaned) ? `"${cleaned}"` : cleaned;
}

export function normalizeUsptoId(text: string): string {
  return text.trim().replace(/[\s,]/g, "").toUpperCase();
}

export function usptoPublicSearchUrl(
  text: string,
  field: OfficialQueryField = "keyword",
  scope: "designs" | "utility" = "designs",
): string {
  const te = text.trim();
  if (!te) return USPTO_PPS_HOME;
  if (field === "number") {
    const id = normalizeUsptoId(te);
    return `${USPTO_PPS_EXTERNAL}?q=${encodeURIComponent(id)}&db=USPAT,US-PGPUB&type=ids`;
  }
  let q: string;
  const quoted = quotePpsTerm(te);
  if (field === "assignee") q = `${quoted}.as.`;
  else if (field === "inventor") q = `${quoted}.in.`;
  else if (field === "classification") q = `${quoted}.ccl.`;
  else q = `${quoted}.ti.`;
  if (scope === "designs") q = `(${q}) AND D$.pn.`;
  const db = scope === "utility" ? "USPAT,US-PGPUB" : "USPAT";
  return `${USPTO_PPS_EXTERNAL}?q=${encodeURIComponent(q)}&db=${db}&type=queryString`;
}

function escapeEspacenet(text: string): string {
  return text.trim().replace(/"/g, " ").replace(/\s+/g, " ");
}

export function espacenetSearchUrl(text: string, field: OfficialQueryField = "keyword"): string {
  const te = escapeEspacenet(text);
  if (!te) return ESPACENET_HOME;
  let q: string;
  if (field === "number") q = `pn = "${te}"`;
  else if (field === "assignee") q = `pa = "${te}"`;
  else if (field === "inventor") q = `in = "${te}"`;
  else if (field === "classification") q = `cl = "${te}"`;
  else q = te;
  return `${ESPACENET_HOME}?q=${encodeURIComponent(q)}`;
}


function quoteDpmaTerm(text: string): string {
  const cleaned = text.trim().replace(/"/g, " ").replace(/\s+/g, " ");
  if (!cleaned) return "";
  return /[^A-Za-z0-9]/.test(cleaned) ? `"${cleaned}"` : cleaned;
}

function dpmaField(field: OfficialQueryField): string {
  switch (field) {
    case "number":
      return "RN";
    case "assignee":
      return "INH";
    case "classification":
      return "WKL";
    case "inventor":
      return "ENTW";
    default:
      return "TI";
  }
}

/** Official DPMAregister expert-search deep link. The form field eingabefeld is prefilled from queryString. */
export function dpmaDesignSearchUrl(text: string, field: OfficialQueryField = "keyword"): string {
  const te = quoteDpmaTerm(text);
  if (!te) return DPMA_DESIGN_HOME;
  const query = `${dpmaField(field)}=${te}`;
  return `${DPMA_DESIGN_AUTO}?queryString=${encodeURIComponent(query)}`;
}

function nationalDesignLinks(hasQuery: boolean, text: string, field: OfficialQueryField): OfficialLink[] {
  return [
    {
      id: "designview",
      office: "EUIPO / TMDN",
      name: "DesignView",
      coverage: "参与局的国家外观 + 欧盟外观 + WIPO，含德国、法国、意大利、西班牙国家登记",
      href: DESIGNVIEW_HOME,
      queryCarried: false,
      group: "national",
      note: "已验证的公开网址无法预先填入检索词。打开后请输入相同关键词，并可按局（DE / FR / IT / ES）筛选。也可在该页做官方以图搜图。",
    },
    {
      id: "dpma-register",
      office: "DPMA",
      name: "DPMAregister（德国外观）",
      coverage: "德国专利商标局国家外观设计（Design / Geschmacksmuster）",
      href: hasQuery ? dpmaDesignSearchUrl(text, field) : DPMA_DESIGN_HOME,
      queryCarried: hasQuery,
      group: "national",
      note: hasQuery
        ? "已按官方专家检索语法带上检索词（关键词用 TI= 标题字段）。打开后如需可再点「开始检索」。"
        : "打开德国专利商标局外观专家检索。",
    },
    {
      id: "inpi-data",
      office: "INPI",
      name: "DATA INPI（法国外观）",
      coverage: "法国国家工业产权局登记的外观设计（dessins et modèles）",
      href: INPI_DESIGN_HOME,
      queryCarried: false,
      group: "national",
      note: "官方高级检索页。带关键词的公开网址（data.inpi.fr/dessins_modeles?q=）在自动访问时会遇到 Cloudflare 验证，未能核实是否保留检索词，因此不预先填写。请打开后在 DATA INPI 中输入相同检索词。",
    },
    {
      id: "uibm-bancadati",
      office: "UIBM",
      name: "UIBM 数据库（意大利外观）",
      coverage: "意大利专利商标局登记的外观设计（disegni e modelli）",
      href: UIBM_DESIGN_HOME,
      queryCarried: false,
      group: "national",
      note: "官方「按条件组合检索」外观页。未找到已验证、能带上检索词的公开网址，请打开后自行输入。",
    },
    {
      id: "oepm-disenos",
      office: "OEPM",
      name: "DISEÑOS（西班牙外观）",
      coverage: "西班牙专利商标局登记的工业外观（diseños industriales）",
      href: OEPM_DESIGN_HOME,
      queryCarried: false,
      group: "national",
      note: "官方 DISEÑOS 检索页。该页是表单检索，未找到已验证、能带上检索词的公开网址，请打开后自行输入。",
    },
  ];
}

export function officialLinks(input: OfficialQueryInput | undefined, scope: OfficialScope): OfficialLink[] {
  if (scope === "image") {
    return [
      {
        id: "wipo-design-image",
        office: "WIPO",
        name: "全球外观设计数据库（以图搜图）",
        coverage: "海牙体系及多家参与局的外观设计",
        href: WIPO_DESIGN_HOME,
        queryCarried: false,
        note: "网址无法预先上传您的照片。打开后请使用官方的图像检索并自行上传。澄知不会抓取或自动查询该库。",
      },
      {
        id: "euipo-esearch-image",
        office: "EUIPO",
        name: "eSearch plus（以图搜图）",
        coverage: "欧盟知识产权局登记外观（及商标等）",
        href: EUIPO_ESEARCH_HOME,
        queryCarried: false,
        note: "打开后请使用官方图像检索并自行上传照片。基本检索默认也可能先显示商标，请再点外观设计。",
      },
      {
        id: "designview-image",
        office: "EUIPO / TMDN",
        name: "DesignView（以图搜图）",
        coverage: "参与局的国家外观 + 欧盟外观 + WIPO，含德、法、意、西国家登记",
        href: DESIGNVIEW_HOME,
        queryCarried: false,
        group: "national",
        note: "网址无法预先上传您的照片。打开后请使用官方图像检索并自行上传。可按局筛选德国、法国、意大利、西班牙国家外观。",
      },
    ];
  }

  const term = officialQueryTerm(input);
  const text = term?.text ?? "";
  const field = term?.field ?? "keyword";
  const hasQuery = Boolean(text);

  if (scope === "utility") {
    return [
      {
        id: "epo-espacenet",
        office: "EPO",
        name: "Espacenet",
        coverage: "欧洲专利局全球专利文献（发明为主）",
        href: hasQuery ? espacenetSearchUrl(text, field) : ESPACENET_HOME,
        queryCarried: hasQuery,
        note: hasQuery ? "已带上检索词，在官方智能检索中打开。" : "打开欧洲专利局官方检索页。",
      },
      {
        id: "uspto-pps-utility",
        office: "USPTO",
        name: "Patent Public Search",
        coverage: "美国授权专利与申请公开",
        href: hasQuery ? usptoPublicSearchUrl(text, field, "utility") : USPTO_PPS_HOME,
        queryCarried: hasQuery,
        note: hasQuery ? "已带上检索词，在美国专利商标局公共检索中打开。" : "打开美国专利商标局公共检索。",
      },
      {
        id: "wipo-patentscope",
        office: "WIPO",
        name: "PATENTSCOPE",
        coverage: "世界知识产权组织专利文献",
        href: PATENTSCOPE_HOME,
        queryCarried: false,
        note: "已验证的公开网址无法稳定带上检索词（会跳回空白检索页）。请在打开后输入相同关键词。",
      },
    ];
  }

  return [
    {
      id: "wipo-designdb",
      office: "WIPO",
      name: "全球外观设计数据库",
      coverage: "海牙体系及多家参与局的外观设计，持续更新，其中包含德、法、意、西国家外观来源",
      href: hasQuery ? wipoDesignSearchUrl(text, field) : WIPO_DESIGN_HOME,
      queryCarried: hasQuery,
      note: hasQuery
        ? field === "keyword"
          ? "已按「产品指示」（Indication of product）带上关键词。澄知不会抓取或自动查询该库。"
          : "已按对应字段带上检索词。澄知不会抓取或自动查询该库。"
        : "打开 WIPO 官方外观设计检索。澄知不会抓取或自动查询该库。",
      group: "international",
    },
    {
      id: "euipo-esearch",
      office: "EUIPO",
      name: "eSearch plus",
      coverage: "欧盟知识产权局登记外观（及商标、欧盟专利相关文献入口）",
      href: hasQuery ? euipoESearchUrl(text) : EUIPO_ESEARCH_HOME,
      queryCarried: hasQuery,
      note: hasQuery
        ? "已带上检索词。官方基本检索默认也可能先显示商标，请再点 Designs / 外观设计。欧盟外观在德国、法国、意大利、西班牙同样有效，但这不是这四国的国家登记外观。"
        : "打开欧盟知识产权局 eSearch plus。欧盟外观在德、法、意、西同样有效，但这不是国家登记外观。",
      group: "international",
    },
    {
      id: "uspto-pps-design",
      office: "USPTO",
      name: "Patent Public Search（外观专利）",
      coverage: "美国外观专利（设计专利）",
      href: hasQuery ? usptoPublicSearchUrl(text, field, "designs") : USPTO_PPS_HOME,
      queryCarried: hasQuery,
      note: hasQuery
        ? field === "number"
          ? "已按文献号在美国专利商标局公共检索中打开。"
          : "已带上检索词，并限制为外观专利号（D 字头）。"
        : "打开美国专利商标局公共检索。",
      group: "international",
    },
    ...nationalDesignLinks(hasQuery, text, field),
  ];
}

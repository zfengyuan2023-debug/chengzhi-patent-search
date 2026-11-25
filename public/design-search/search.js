/* Browser-side ranking for the int8 catalog produced by tools/export_pages_index.py.
   One query vector, cosine via dequantized dots. Same record keeps its best image.
   This file does not embed a photo and does not invent rows. */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.PatentSearch = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  const ROW_FIELDS = [
    "filing_date", "verbal_element", "publications", "representative",
    "inventors", "application", "uspto_pdf", "drawings_start", "drawings_end",
    "drawingsStart", "drawingsEnd", "designers", "expiry_date", "indication",
    "official_images", "official_image_url",
  ];

  function float16(bytes, index) {
    const off = index * 2;
    const h = bytes[off] | (bytes[off + 1] << 8);
    const sign = (h & 0x8000) ? -1 : 1;
    const exp = (h >> 10) & 0x1f;
    const frac = h & 0x3ff;
    if (exp === 0) return sign * Math.pow(2, -14) * (frac / 1024);
    if (exp === 31) return frac ? NaN : sign * Infinity;
    return sign * Math.pow(2, exp - 15) * (1 + frac / 1024);
  }

  function valueAt(data, dtype, scale, index) {
    if (dtype === "float16") return float16(data, index);
    return data[index] / scale;
  }

  function isPresent(value) {
    if (value == null) return false;
    if (Array.isArray(value)) return value.length > 0;
    return String(value).trim() !== "";
  }

  function copyField(dst, src, key) {
    if (!isPresent(dst[key]) && isPresent(src[key])) dst[key] = src[key];
  }

  function rowFromRecord(rec, score) {
    const row = {
      id: rec.id,
      region: rec.region,
      number: rec.number,
      title: rec.title,
      holder: rec.holder,
      date: rec.date,
      classification: rec.classification,
      status: rec.status,
      page_url: rec.page_url,
      image_url: rec.image_url || null,
      thumb: rec.thumb || null,
      score: score,
    };
    for (let i = 0; i < ROW_FIELDS.length; i++) copyField(row, rec, ROW_FIELDS[i]);
    if (row.drawingsStart != null && row.drawings_start == null) row.drawings_start = row.drawingsStart;
    if (row.drawingsEnd != null && row.drawings_end == null) row.drawings_end = row.drawingsEnd;
    return row;
  }

  function mergeRow(dst, rec) {
    for (let i = 0; i < ROW_FIELDS.length; i++) copyField(dst, rec, ROW_FIELDS[i]);
    copyField(dst, rec, "page_url");
    copyField(dst, rec, "image_url");
    if ((!dst.official_images || !dst.official_images.length) && rec.official_images) {
      dst.official_images = rec.official_images;
    }
  }

  function searchInt8(opts) {
    const data = opts.data;
    const dim = opts.dim | 0;
    const scale = opts.scale || 1;
    const dtype = opts.dtype || "int8";
    const records = opts.records;
    const query = opts.query;
    const region = opts.region || "ALL";
    const classification = opts.classification || "";
    const withTotal = !!opts.withTotal;
    const topK = opts.topK || 24;
    if (!data || !records || !query) throw new Error("catalog and query are required");
    if (dim < 1) throw new Error("dim must be positive");
    if (dtype === "int8" && !(scale > 0)) throw new Error("scale must be positive");
    const n = records.length;
    const width = dtype === "float16" ? data.length / 2 : data.length;
    if (width !== n * dim) throw new Error("vector bytes do not match record count");
    if (query.length !== dim) throw new Error("query length does not match dim");
    const scores = new Array(n);
    for (let i = 0; i < n; i++) {
      let dot = 0;
      const base = i * dim;
      for (let d = 0; d < dim; d++) dot += valueAt(data, dtype, scale, base + d) * query[d];
      scores[i] = dot;
    }
    const order = new Array(n);
    for (let i = 0; i < n; i++) order[i] = i;
    order.sort(function (a, b) { return scores[b] - scores[a]; });
    const best = new Map();
    const seen = new Set();
    let total = 0;
    for (let k = 0; k < order.length; k++) {
      const i = order[k];
      const rec = records[i];
      if (region !== "ALL" && rec.region !== region) continue;
      if (classification && classToken(rec.classification) !== classification) continue;
      if (!rec.id) continue;
      if (seen.has(rec.id)) {
        const existing = best.get(rec.id);
        if (existing) mergeRow(existing, rec);
        continue;
      }
      seen.add(rec.id);
      total += 1;
      if (best.size >= topK) {
        if (!withTotal) break;
        continue;
      }
      best.set(rec.id, rowFromRecord(rec, scores[i]));
    }
    const rows = Array.from(best.values());
    if (withTotal) return { rows: rows, total: total };
    return rows;
  }

  function classToken(text) {
    const s = String(text || "");
    const locarno = s.match(/(\d{2}\.\d{2})/);
    if (locarno) return locarno[1];
    const us = s.match(/\bD\s*(\d{1,2})\b/i);
    if (us) return "D" + ("0" + us[1]).slice(-2);
    return "";
  }

  function escapeAttr(value) {
    return String(value == null ? "" : value).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }

  function isHttpImageUrl(url) {
    return typeof url === "string" && /^https?:\/\//i.test(url.trim());
  }

  function isHttpUrl(url) {
    return typeof url === "string" && /^https?:\/\//i.test(url.trim());
  }

  function officialViews(row) {
    const out = [];
    const seen = new Set();
    function add(url, label) {
      if (typeof url !== "string") return;
      url = url.trim();
      if (url.charAt(0) === "/" && url.charAt(1) !== "/") {
        url = "https://euipo.europa.eu" + url;
      }
      if (!isHttpImageUrl(url) || seen.has(url)) return;
      seen.add(url);
      out.push({ url: url, label: label || ("视图 " + (out.length + 1)) });
    }
    if (!row) return out;
    const list = row.official_images || row.viewUrls || row.view_urls || [];
    if (Array.isArray(list)) {
      for (let i = 0; i < list.length; i++) {
        const item = list[i];
        if (typeof item === "string") add(item, "视图 " + (i + 1));
        else if (item && typeof item === "object") {
          add(item.source || item.url || item.imageurl || item.image,
            item.label || item.view || ("视图 " + (i + 1)));
        }
      }
    }
    add(row.official_image_url);
    add(row.image_url);
    return out;
  }

  function preserveOfficialImage(row) {
    if (!row) return row;
    const views = officialViews(row);
    if (views.length) {
      if (!row.official_images || !row.official_images.length) {
        row.official_images = views.map(function (v) { return v.url; });
      }
      if (!isHttpImageUrl(row.official_image_url)) {
        row.official_image_url = views[0].url;
      }
    } else if (isHttpImageUrl(row.image_url) && !isHttpImageUrl(row.official_image_url)) {
      row.official_image_url = row.image_url.trim();
    }
    return row;
  }

  function displayImageUrl(row) {
    if (!row) return "";
    if (row.thumb_url) return row.thumb_url;
    return row.image_url || "";
  }

  function lightboxImageUrl(row) {
    if (!row) return "";
    const views = officialViews(row);
    if (views.length) return views[0].url;
    if (isHttpImageUrl(row.official_image_url)) return row.official_image_url;
    if (isHttpImageUrl(row.image_url)) return row.image_url;
    if (row.thumb_url) return row.thumb_url;
    return row.image_url || "";
  }

  function officialPageUrl(row) {
    if (!row) return "";
    if (isHttpUrl(row.page_url)) return row.page_url.trim();
    const number = String(row.number || "").trim();
    if (row.region === "EU" && /^\d+(-\d+)?$/.test(number)) {
      return "https://euipo.europa.eu/eSearch/#details/designs/" + number;
    }
    if (row.region === "US") {
      let token = "";
      if (row.id && String(row.id).indexOf("US-") === 0) token = String(row.id).slice(3);
      else token = number.replace(/^US\s+/i, "").replace(/\s+S$/i, "").replace(/ /g, "");
      if (/^D\d+$/i.test(token)) return "https://patents.google.com/patent/US" + token + "S1/en";
    }
    return "";
  }

  function rowCaption(row) {
    if (!row) return "";
    const number = isPresent(row.number) ? String(row.number).trim() : "";
    const title = isPresent(row.title) ? String(row.title).trim() : "";
    if (number && title) return number + " · " + title;
    return number || title;
  }

  function cropPixels(width, height, crop) {
    width = width | 0;
    height = height | 0;
    if (width < 1) width = 1;
    if (height < 1) height = 1;
    if (!crop || !(crop.w > 0) || !(crop.h > 0)) {
      return { sx: 0, sy: 0, sw: width, sh: height };
    }
    let sx = Math.round(Number(crop.x) * width);
    let sy = Math.round(Number(crop.y) * height);
    let sw = Math.round(Number(crop.w) * width);
    let sh = Math.round(Number(crop.h) * height);
    if (sx < 0) { sw += sx; sx = 0; }
    if (sy < 0) { sh += sy; sy = 0; }
    if (sx >= width) sx = width - 1;
    if (sy >= height) sy = height - 1;
    if (sx + sw > width) sw = width - sx;
    if (sy + sh > height) sh = height - sy;
    if (sw < 1) sw = 1;
    if (sh < 1) sh = 1;
    return { sx: sx, sy: sy, sw: sw, sh: sh };
  }

  function cropKey(crop) {
    if (!crop || !(crop.w > 0) || !(crop.h > 0)) return "";
    return [crop.x, crop.y, crop.w, crop.h].map(function (v) {
      return Number(v).toFixed(4);
    }).join(":");
  }

  function fieldHtml(label, value) {
    if (!isPresent(value)) return "";
    if (Array.isArray(value)) value = value.filter(isPresent).join("、");
    if (!isPresent(value)) return "";
    return '<div class="detail-row"><dt>' + escapeAttr(label) + "</dt><dd>" +
      escapeAttr(value) + "</dd></div>";
  }

  function officeLabel(row) {
    if (!row) return "";
    if (row.region === "EU") return "欧盟知识产权局（EUIPO）";
    if (row.region === "US") return "美国专利商标局（USPTO）";
    return row.region || "";
  }

  function filingDate(row) {
    if (!row) return "";
    if (isPresent(row.filing_date)) return row.filing_date;
    // Current EU ingest stores filing_date identical to registration date; the
    // packer omits the duplicate to save space, so mirror date for EU only.
    if (row.region === "EU" && isPresent(row.date)) return row.date;
    return "";
  }

  function imageHtml(row, extraClass, srcOverride) {
    const src = srcOverride || displayImageUrl(row);
    const alt = rowCaption(row);
    if (!src) return '<span class="no-img">无图</span>';
    return '<img class="zoomable' + (extraClass ? " " + extraClass : "") +
      '" alt="' + escapeAttr(alt) + '" title="点击查看大图" src="' +
      escapeAttr(src) + '">';
  }

  function galleryHtml(row) {
    const views = officialViews(row);
    if (views.length < 1) return "";
    const items = views.map(function (view, i) {
      return '<button type="button" class="gallery-view" data-view-url="' +
        escapeAttr(view.url) + '" title="' + escapeAttr(view.label) +
        '"><img alt="' + escapeAttr(view.label) + '" src="' +
        escapeAttr(view.url) + '"><span>' + escapeAttr(view.label) +
        "</span></button>";
    }).join("");
    return '<div class="detail-gallery" role="list">' + items + "</div>";
  }

  function graphicNote(row) {
    const views = officialViews(row);
    if (views.length) {
      return '<p class="detail-image-note">以上为官方图形表示，可点击放大并缩放查看。</p>';
    }
    if (isHttpUrl(row.uspto_pdf)) {
      return '<p class="detail-image-note">下方为官方授权文本 PDF，可在本页翻阅全部附图页。检索缩略图仅用于网格预览。</p>';
    }
    if (displayImageUrl(row)) {
      return '<p class="detail-image-note">当前目录尚未写入官方原图地址，本页只能放大站点检索用缩略图，不是官方原图。</p>';
    }
    return "";
  }

  function pdfHtml(row) {
    if (!row || !isHttpUrl(row.uspto_pdf)) return "";
    const start = row.drawings_start != null ? row.drawings_start : row.drawingsStart;
    const end = row.drawings_end != null ? row.drawings_end : row.drawingsEnd;
    const pages = isPresent(start) && isPresent(end)
      ? '<p class="detail-image-note">附图页 ' + escapeAttr(start) + "–" + escapeAttr(end) + "</p>"
      : "";
    return pages +
      '<div class="official-pdf-wrap"><iframe class="official-pdf" title="官方 PDF 附图" src="' +
      escapeAttr(row.uspto_pdf) + '#toolbar=1" loading="lazy"></iframe></div>';
  }

  function cardsHtml(results) {
    return results.map(function (r) {
      const score = typeof r.score === "number" ? r.score.toFixed(3) : "";
      const token = classToken(r.classification);
      return '<article class="card" data-id="' + escapeAttr(r.id) +
        '" role="button" tabindex="0"><div class="im">' + imageHtml(r) +
        '</div><div class="bd"><div class="meta"><span class="pill">' + escapeAttr(r.region) +
        "</span><span class=\"num\">" + escapeAttr(r.number) + "</span></div>" +
        '<div class="score">相似度 ' + escapeAttr(score) + "</div>" +
        (token ? '<div class="cls">' + escapeAttr(token) + "</div>" : "") +
        '<div class="title">' + escapeAttr(r.title) + "</div>" +
        '<div class="more">查看详情</div></div></article>';
    }).join("");
  }

  function sectionHtml(title, body) {
    if (!body) return "";
    return '<section class="detail-section"><h3>' + escapeAttr(title) + "</h3>" + body + "</section>";
  }

  function detailHtml(row) {
    if (!row) return "";
    const score = typeof row.score === "number" ? row.score.toFixed(3) : "";
    const officialHref = officialPageUrl(row);
    const official = officialHref
      ? '<a class="official" href="' + escapeAttr(officialHref) +
        '" target="_blank" rel="noopener noreferrer">在官方网站打开</a>'
      : "";
    const views = officialViews(row);
    const heroSrc = views.length ? views[0].url : "";
    const graphicBody =
      '<div class="detail-media">' +
      (heroSrc ? imageHtml(row, "official-hero", heroSrc) : imageHtml(row)) +
      "</div>" +
      galleryHtml(row) +
      pdfHtml(row) +
      graphicNote(row);

    const fileBody = '<dl class="detail-fields">' +
      fieldHtml("受理局", officeLabel(row)) +
      fieldHtml("外观号", row.number) +
      fieldHtml("申请号", row.application) +
      fieldHtml("申请日", filingDate(row)) +
      fieldHtml("注册日", row.date) +
      fieldHtml("届满日", row.expiry_date) +
      fieldHtml("公开公告", row.publications) +
      fieldHtml("法律状态", row.status) +
      fieldHtml("权利人", row.holder) +
      fieldHtml("代理人", row.representative) +
      fieldHtml("相似度", score) +
      "</dl>";

    const designBody = '<dl class="detail-fields">' +
      fieldHtml("产品名称", row.indication || row.title) +
      fieldHtml("洛迦诺 / 分类", row.classification) +
      fieldHtml("文字要素", row.verbal_element) +
      fieldHtml("设计人", row.designers) +
      fieldHtml("发明人", row.inventors) +
      "</dl>";

    return sectionHtml("图形表示", graphicBody) +
      sectionHtml("注册外观档案信息", fileBody) +
      sectionHtml("外观信息", designBody) +
      official;
  }

  function applyOfficialMetadata(row, payload) {
    if (!row || !payload) return row;
    const entity = payload.entity || payload;
    const views = officialImagesFromEntity(entity);
    if (views.length) {
      row.official_images = views;
      row.official_image_url = views[0];
    }
    if (!isPresent(row.representative)) {
      const reps = entity.representatives || [];
      const names = [];
      for (let i = 0; i < reps.length; i++) {
        if (reps[i] && reps[i].name) names.push(reps[i].name);
      }
      if (names.length) row.representative = names.join("、");
    }
    if (!isPresent(row.designers) && Array.isArray(entity.designers)) {
      const names = entity.designers.map(function (d) { return d && d.name; }).filter(isPresent);
      if (names.length) row.designers = names;
    }
    if (!isPresent(row.expiry_date) && entity.expirydate) {
      row.expiry_date = msToDate(entity.expirydate);
    }
    if (!isPresent(row.application) && entity.applicationNumber) {
      row.application = entity.applicationNumber;
    }
    if (!isPresent(row.indication) && entity.indicationproduct &&
        entity.indicationproduct.defaultValue && entity.indicationproduct.defaultValue.values) {
      row.indication = entity.indicationproduct.defaultValue.values.join(", ");
    }
    if (!isPresent(row.publications) && Array.isArray(entity.publications)) {
      row.publications = compactPublicationList(entity.publications);
    }
    if (!isPresent(row.verbal_element) && entity.verbal) row.verbal_element = entity.verbal;
    return row;
  }

  function officialImagesFromEntity(entity) {
    const views = officialViews({ official_images: (entity && entity.viewUrls) || [] });
    return views.map(function (v) { return v.url; });
  }

  function msToDate(value) {
    const n = Number(value);
    if (!isFinite(n)) return "";
    const d = new Date(n + 43200 * 1000);
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    return y + "-" + m + "-" + day;
  }

  function compactPublicationList(pubs) {
    const parts = [];
    for (let i = 0; i < (pubs || []).length; i++) {
      const p = pubs[i] || {};
      const date = msToDate(p.date || p.datebulletin);
      const bulletin = p.bulletinNumber || p.namebulletin || p.bulletin || "";
      const section = p.section || p.sectionpub || "";
      const bit = [date, bulletin, section].filter(isPresent).join(" ");
      if (bit) parts.push(bit);
    }
    return parts.join("; ");
  }

  const DESIGN_NUMBER_RE = /^\d{7,10}(-\d{4})?$/;

  function isValidEuipoNumber(number) {
    return DESIGN_NUMBER_RE.test(String(number || "").trim());
  }

  function officialDetailUrl(number) {
    number = String(number || "").trim();
    if (!isValidEuipoNumber(number)) return "";
    return "https://euipo.europa.eu/copla/design/data/withPermission/" +
      encodeURIComponent(number);
  }

  // base must end with a trailing slash, e.g. "https://host/euipo-design/".
  // A missing slash is added so the parent cannot accidentally glue the
  // path and the number together. The request is then
  // `${base}${encodeURIComponent(number)}`.
  function officialProxyUrl(base, number) {
    number = String(number || "").trim();
    if (!isValidEuipoNumber(number)) return "";
    base = String(base == null ? "" : base).trim();
    if (!base) return "";
    if (base.charAt(base.length - 1) !== "/") base += "/";
    return base + encodeURIComponent(number);
  }

  function officialDetailUrls(number, proxyBase) {
    const urls = [];
    const proxy = officialProxyUrl(proxyBase, number);
    if (proxy) urls.push(proxy);
    const direct = officialDetailUrl(number);
    if (direct) urls.push(direct);
    return urls;
  }

  return {
    searchInt8: searchInt8,
    cardsHtml: cardsHtml,
    detailHtml: detailHtml,
    float16: float16,
    classToken: classToken,
    isHttpImageUrl: isHttpImageUrl,
    preserveOfficialImage: preserveOfficialImage,
    displayImageUrl: displayImageUrl,
    lightboxImageUrl: lightboxImageUrl,
    officialViews: officialViews,
    officialPageUrl: officialPageUrl,
    officialDetailUrl: officialDetailUrl,
    officialProxyUrl: officialProxyUrl,
    officialDetailUrls: officialDetailUrls,
    isValidEuipoNumber: isValidEuipoNumber,
    DESIGN_NUMBER_RE: DESIGN_NUMBER_RE,
    applyOfficialMetadata: applyOfficialMetadata,
    rowCaption: rowCaption,
    cropPixels: cropPixels,
    cropKey: cropKey,
  };
});

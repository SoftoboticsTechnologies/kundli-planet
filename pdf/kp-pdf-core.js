/* KundliPlanet PDF - shared design system (presentation layer only).
   Page model, script-aware text engine (Latin + Devanagari + planet glyphs),
   and the reusable components both reports are built from: section pill
   header, footer, key/value and grid tables, paragraphs, status banners,
   North Indian charts, planet cards, dasha cards and score graphics.
   Nothing in this file knows about astrology rules or calculates any
   astrological value - it only lays out what it is given. */
(function (global) {
  "use strict";

  var KP = global.KPPDF = global.KPPDF || {};
  var P = null; // PDFLib namespace, bound in createDoc()

  var W = 595.28, H = 841.89;              // A4 portrait, points
  var MARGIN = 40;
  var CONTENT_TOP = 86;
  var CONTENT_BOTTOM = H - 56;
  var CW = W - MARGIN * 2;

  var ASSET = "Kundli%20planet%20assets/";
  var FONT_FILES = {
    lat400: "fonts/NotoSans-Regular.ttf",
    lat600: "fonts/NotoSans-SemiBold.ttf",
    lat700: "fonts/NotoSans-Bold.ttf",
    serif700: "fonts/NotoSerif-Bold.ttf",
    deva400: "fonts/NotoSansDevanagari-Regular.ttf",
    deva700: "fonts/NotoSansDevanagari-Bold.ttf",
    sym: "fonts/NotoSansSymbols-Planets.ttf"
  };
  var LOGO_URL = ASSET + "kundli%20planet%20ogo.png";
  var PARCHMENT_URL = ASSET + "pdf/parchment.jpg";

  // Palette derived from the reference report: saffron/orange pills, pale
  // gold table rules, warm cream rows and a warm dark-brown ink.
  var HEX = {
    orange: "#E0952A", orangeDeep: "#C4761C", gold: "#D6A441",
    goldLight: "#EFD9A8", goldLine: "#E2C088", goldPale: "#F7EBCF",
    rowA: "#FFFCF5", rowB: "#F8EEDD", card: "#FFFAF0",
    ink: "#3A2A1B", inkSoft: "#5B4735", muted: "#8B7560", white: "#FFFFFF",
    maroon: "#9A3522", green: "#3D7440", chartLine: "#6B4E33", chartFill: "#FFFBF1"
  };
  var PLANET_HEX = {
    Sun: "#C8581A", Moon: "#4F6475", Mars: "#B3261E", Mercury: "#2E7D32", Jupiter: "#A87A0A",
    Venus: "#B8326E", Saturn: "#1F4E9C", Rahu: "#3D3D3D", Ketu: "#7A4A26", Ascendant: "#8C2F1B"
  };
  var PLANET_GLYPH = {
    Moon: "☽", Mars: "♂", Mercury: "☿", Jupiter: "♃",
    Venus: "♀", Saturn: "♄", Rahu: "☊", Ketu: "☋"
  };

  // ------------------------------------------------------------------
  // Loading (libraries, fonts, images) - cached across generations
  // ------------------------------------------------------------------
  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement("script");
      s.src = src; s.async = true;
      s.onload = function () { resolve(); };
      s.onerror = function () { reject(new Error("Failed to load " + src)); };
      document.head.appendChild(s);
    });
  }
  KP.loadScript = loadScript;

  function fetchBytes(url) {
    return fetch(url).then(function (r) {
      if (!r.ok) throw new Error("fetch failed: " + url);
      return r.arrayBuffer();
    });
  }

  // Re-encodes an image through a canvas at a bounded pixel size so a 2 MB
  // source logo or photo is not embedded at full weight on every report.
  function fetchImageScaled(url, maxPx, mime, quality) {
    return fetch(url).then(function (r) {
      if (!r.ok) throw new Error("fetch failed: " + url);
      return r.blob();
    }).then(function (blob) {
      return new Promise(function (resolve, reject) {
        var src = URL.createObjectURL(blob);
        var img = new Image();
        img.onload = function () {
          var scale = Math.min(1, maxPx / Math.max(img.naturalWidth, img.naturalHeight));
          var w = Math.max(1, Math.round(img.naturalWidth * scale));
          var h = Math.max(1, Math.round(img.naturalHeight * scale));
          var c = document.createElement("canvas");
          c.width = w; c.height = h;
          var ctx = c.getContext("2d");
          if (mime === "image/jpeg") { ctx.fillStyle = "#ffffff"; ctx.fillRect(0, 0, w, h); }
          ctx.drawImage(img, 0, 0, w, h);
          URL.revokeObjectURL(src);
          c.toBlob(function (out) {
            if (!out) { reject(new Error("encode failed")); return; }
            out.arrayBuffer().then(function (buf) { resolve({ bytes: buf, width: w, height: h, mime: mime }); }, reject);
          }, mime, quality || 0.9);
        };
        img.onerror = function () { URL.revokeObjectURL(src); reject(new Error("image decode failed: " + url)); };
        img.src = src;
      });
    });
  }
  KP.fetchImageScaled = fetchImageScaled;

  var assetCache = null;
  function loadAssets() {
    if (assetCache) return assetCache;
    var keys = Object.keys(FONT_FILES);
    assetCache = Promise.all([
      Promise.all(keys.map(function (k) { return fetchBytes(ASSET + FONT_FILES[k]); })),
      fetchBytes(PARCHMENT_URL).catch(function () { return null; }),
      fetchImageScaled(LOGO_URL, 560, "image/png").catch(function () { return null; })
    ]).then(function (res) {
      var fonts = {};
      keys.forEach(function (k, i) { fonts[k] = res[0][i]; });
      return { fonts: fonts, parchment: res[1], logo: res[2] };
    }).catch(function (e) { assetCache = null; throw e; });
    return assetCache;
  }

  // ------------------------------------------------------------------
  // Small helpers
  // ------------------------------------------------------------------
  var colorCache = {};
  function col(hex) {
    if (colorCache[hex]) return colorCache[hex];
    var m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
    var c = P.rgb(parseInt(m[1], 16) / 255, parseInt(m[2], 16) / 255, parseInt(m[3], 16) / 255);
    colorCache[hex] = c;
    return c;
  }

  // Coerce any value to clean display text. Objects never reach the page
  // (guards against "[object Object]"); control/format characters are
  // stripped and Unicode is NFC-normalized.
  function clean(v) {
    if (v === null || v === undefined) return "";
    if (typeof v === "object") return "";
    var s = String(v);
    try { s = s.normalize("NFC"); } catch (e) { /* unsupported */ }
    return s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F﻿​]/g, "").replace(/ /g, " ").replace(/[ \t]+/g, " ").trim();
  }
  KP.clean = clean;

  function has(v) { return clean(v) !== ""; }
  KP.has = has;

  function roundRectPath(x, y, w, h, r, corners) {
    corners = corners || { tl: 1, tr: 1, br: 1, bl: 1 };
    r = Math.max(0, Math.min(r, w / 2, h / 2));
    var tl = corners.tl ? r : 0, tr = corners.tr ? r : 0, br = corners.br ? r : 0, bl = corners.bl ? r : 0;
    return "M " + (x + tl) + " " + y +
      " L " + (x + w - tr) + " " + y + (tr ? " A " + tr + " " + tr + " 0 0 1 " + (x + w) + " " + (y + tr) : "") +
      " L " + (x + w) + " " + (y + h - br) + (br ? " A " + br + " " + br + " 0 0 1 " + (x + w - br) + " " + (y + h) : "") +
      " L " + (x + bl) + " " + (y + h) + (bl ? " A " + bl + " " + bl + " 0 0 1 " + x + " " + (y + h - bl) : "") +
      " L " + x + " " + (y + tl) + (tl ? " A " + tl + " " + tl + " 0 0 1 " + (x + tl) + " " + y : "") + " Z";
  }

  // ------------------------------------------------------------------
  // Document
  // ------------------------------------------------------------------
  function Doc(pdf, fonts, images, lang, fs) {
    this.pdf = pdf;
    this.f = fonts;
    this.img = images;
    this.lang = lang;
    this.pages = [];      // { page, kind, title }
    this.page = null;
    this.y = CONTENT_TOP;
    this.title = "";
    this.toc = [];
    this.footerCenter = "";
    this.footerBrand = "KundliPlanet";
    this.pageOf = function (p, n) { return "Page " + p + " of " + n; };
    this.lhFactor = lang === "hi" ? 1.62 : 1.42;
    // Type scale: every text size given to the components is multiplied by
    // this (and so is the text-bound geometry), so a report can be set
    // slightly larger without touching its layout code.
    this.fs = fs || 1;
    this._sets = {
      lat: new Set(fonts.lat400.getCharacterSet()),
      deva: new Set(fonts.deva400.getCharacterSet()),
      sym: new Set(fonts.sym.getCharacterSet())
    };
    this._cpClass = {};
  }
  KP.W = W; KP.H = H; KP.MARGIN = MARGIN; KP.CW = CW;
  KP.CONTENT_TOP = CONTENT_TOP; KP.CONTENT_BOTTOM = CONTENT_BOTTOM;
  KP.HEX = HEX; KP.PLANET_HEX = PLANET_HEX;

  KP.createDoc = function (lang, opts) {
    opts = opts || {};
    P = global.PDFLib;
    return loadAssets().then(function (assets) {
      return P.PDFDocument.create().then(function (pdf) {
        pdf.registerFontkit(global.fontkit);
        var keys = Object.keys(FONT_FILES);
        return Promise.all(keys.map(function (k) { return pdf.embedFont(assets.fonts[k], { subset: true }); })).then(function (embedded) {
          var fonts = {};
          keys.forEach(function (k, i) { fonts[k] = embedded[i]; });
          var imgs = {};
          var jobs = [];
          if (assets.parchment) jobs.push(pdf.embedJpg(assets.parchment).then(function (im) { imgs.bg = im; }).catch(function () { /* plain cream fallback */ }));
          if (assets.logo) jobs.push(pdf.embedPng(assets.logo.bytes).then(function (im) { imgs.logo = im; }).catch(function () { /* no logo */ }));
          return Promise.all(jobs).then(function () { return new Doc(pdf, fonts, imgs, lang, opts.fs); });
        });
      });
    });
  };

  // Embeds an arbitrary (already fetched + scaled) image, or null on failure.
  Doc.prototype.embedImage = function (scaled) {
    if (!scaled) return Promise.resolve(null);
    var p = scaled.mime === "image/png" ? this.pdf.embedPng(scaled.bytes) : this.pdf.embedJpg(scaled.bytes);
    return p.catch(function () { return null; });
  };

  // ---------------- text engine ----------------
  function isDevaBlock(cp) {
    return (cp >= 0x0900 && cp <= 0x097F) || (cp >= 0xA8E0 && cp <= 0xA8FF) || (cp >= 0x1CD0 && cp <= 0x1CFF);
  }

  Doc.prototype._classOf = function (cp) {
    var c = this._cpClass[cp];
    if (c !== undefined) return c;
    var s = this._sets;
    if (cp === 0x20 || cp === 0x200C || cp === 0x200D) c = "n";
    else if (isDevaBlock(cp) && s.deva.has(cp)) c = "deva";
    else if (s.lat.has(cp)) c = "lat";
    else if (s.sym.has(cp)) c = "sym";
    else if (s.deva.has(cp)) c = "deva";
    else c = "x"; // no glyph anywhere: dropped rather than drawn as tofu
    this._cpClass[cp] = c;
    return c;
  };

  Doc.prototype._font = function (cls, weight, family) {
    var f = this.f;
    if (cls === "sym") return f.sym;
    if (cls === "deva") return weight >= 600 ? f.deva700 : f.deva400;
    if (family === "serif") return f.serif700;
    return weight >= 700 ? f.lat700 : weight >= 600 ? f.lat600 : f.lat400;
  };

  // Splits text into same-font runs. Spaces/joiners stick to the current run.
  Doc.prototype.runs = function (text, weight, family) {
    var out = [];
    var cur = null, curCls = null;
    for (var ch of text) {
      var cls = this._classOf(ch.codePointAt(0));
      if (cls === "x") continue;
      if (cls === "n") {
        if (cur) cur.t += ch; else { cur = { t: ch, cls: "lat" }; curCls = "lat"; out.push(cur); }
        continue;
      }
      if (cls !== curCls) { cur = { t: ch, cls: cls }; curCls = cls; out.push(cur); }
      else cur.t += ch;
    }
    for (var i = 0; i < out.length; i++) out[i].font = this._font(out[i].cls, weight || 400, family);
    return out;
  };

  Doc.prototype.width = function (text, size, weight, family) {
    return this._rawWidth(text, size * this.fs, weight, family);
  };
  Doc.prototype._rawWidth = function (text, size, weight, family) {
    text = clean(text);
    if (!text) return 0;
    var w = 0;
    var rs = this.runs(text, weight, family);
    for (var i = 0; i < rs.length; i++) w += rs[i].font.widthOfTextAtSize(rs[i].t, size);
    return w;
  };

  Doc.prototype.lh = function (size) { return size * this.fs * this.lhFactor; };

  // Draws one line of text. `y` is the baseline measured from the top of
  // the page. opts: size, weight, color, align, family, opacity, maxW (the
  // line is shrunk, never clipped, to fit maxW).
  Doc.prototype.text = function (page, text, x, y, opts) {
    opts = opts || {};
    text = clean(text);
    if (!text) return 0;
    var size = (opts.size || 9) * (opts.abs ? 1 : this.fs);
    var weight = opts.weight || 400;
    var w = this._rawWidth(text, size, weight, opts.family);
    if (opts.maxW && w > opts.maxW) {
      size = Math.max(5.5, size * opts.maxW / w);
      w = this._rawWidth(text, size, weight, opts.family);
    }
    var sx = x;
    if (opts.align === "center") sx = x - w / 2;
    else if (opts.align === "right") sx = x - w;
    var color = col(opts.color || HEX.ink);
    var rs = this.runs(text, weight, opts.family);
    for (var i = 0; i < rs.length; i++) {
      page.drawText(rs[i].t, { x: sx, y: H - y, size: size, font: rs[i].font, color: color, opacity: opts.opacity == null ? 1 : opts.opacity });
      sx += rs[i].font.widthOfTextAtSize(rs[i].t, size);
    }
    return w;
  };

  function segmentGraphemes(word) {
    if (global.Intl && Intl.Segmenter) {
      var seg = new Intl.Segmenter(undefined, { granularity: "grapheme" });
      return Array.from(seg.segment(word), function (s) { return s.segment; });
    }
    return Array.from(word);
  }

  // Greedy word wrap. Explicit "\n" starts a new line. Words longer than
  // the line are broken on grapheme boundaries (never inside a cluster).
  Doc.prototype.wrap = function (text, size, weight, maxW, family) {
    var self = this;
    var out = [];
    String(text == null ? "" : text).split(/\n/).forEach(function (para) {
      para = clean(para);
      if (!para) { out.push(""); return; }
      var words = para.split(" ");
      var line = "";
      words.forEach(function (word) {
        var cand = line ? line + " " + word : word;
        if (self.width(cand, size, weight, family) <= maxW) { line = cand; return; }
        if (line) out.push(line);
        if (self.width(word, size, weight, family) <= maxW) { line = word; return; }
        var chunk = "";
        segmentGraphemes(word).forEach(function (g) {
          if (self.width(chunk + g, size, weight, family) > maxW && chunk) { out.push(chunk); chunk = g; }
          else chunk += g;
        });
        line = chunk;
      });
      if (line) out.push(line);
    });
    while (out.length && out[out.length - 1] === "") out.pop();
    return out;
  };

  // Draws a single wrapped line justified to `w` (last lines stay ragged).
  Doc.prototype.textJustified = function (page, line, x, y, w, opts) {
    var words = line.split(" ");
    if (words.length < 2) { this.text(page, line, x, y, opts); return; }
    var self = this;
    var size = opts.size || 9, weight = opts.weight || 400;
    var ws = words.map(function (wd) { return self.width(wd, size, weight, opts.family); });
    var total = ws.reduce(function (a, b) { return a + b; }, 0);
    var gap = (w - total) / (words.length - 1);
    var natural = this.width(" ", size, weight, opts.family);
    if (gap > natural * 3.2) { this.text(page, line, x, y, opts); return; }
    var cx = x;
    words.forEach(function (wd, i) {
      self.text(page, wd, cx, y, opts);
      cx += ws[i] + gap;
    });
  };

  // ---------------- drawing primitives (top-down coordinates) ----------------
  Doc.prototype.rect = function (page, x, y, w, h, o) {
    o = o || {};
    var path = roundRectPath(x, y, w, h, o.r || 0, o.corners);
    var opts = { x: 0, y: H };
    if (o.fill) { opts.color = col(o.fill); opts.opacity = o.opacity == null ? 1 : o.opacity; }
    if (o.stroke) { opts.borderColor = col(o.stroke); opts.borderWidth = o.lw || 0.6; opts.borderOpacity = o.strokeOpacity == null ? 1 : o.strokeOpacity; }
    page.drawSvgPath(path, opts);
  };

  Doc.prototype.line = function (page, x1, y1, x2, y2, o) {
    o = o || {};
    page.drawLine({
      start: { x: x1, y: H - y1 }, end: { x: x2, y: H - y2 },
      thickness: o.lw || 0.6, color: col(o.color || HEX.goldLine), opacity: o.opacity == null ? 1 : o.opacity,
      dashArray: o.dash || undefined
    });
  };

  Doc.prototype.path = function (page, d, o) {
    o = o || {};
    var opts = { x: 0, y: H };
    if (o.fill) { opts.color = col(o.fill); opts.opacity = o.opacity == null ? 1 : o.opacity; }
    if (o.stroke) {
      opts.borderColor = col(o.stroke); opts.borderWidth = o.lw || 0.6;
      opts.borderOpacity = o.strokeOpacity == null ? 1 : o.strokeOpacity;
      if (o.cap && P.LineCapStyle) opts.borderLineCap = P.LineCapStyle.Round;
    }
    page.drawSvgPath(d, opts);
  };

  Doc.prototype.circle = function (page, cx, cy, r, o) {
    o = o || {};
    var opts = { x: cx, y: H - cy, size: r };
    if (o.fill) { opts.color = col(o.fill); opts.opacity = o.opacity == null ? 1 : o.opacity; }
    if (o.stroke) { opts.borderColor = col(o.stroke); opts.borderWidth = o.lw || 0.6; }
    page.drawCircle(opts);
  };

  Doc.prototype.image = function (page, img, x, y, w, h, o) {
    if (!img) return;
    page.drawImage(img, { x: x, y: H - y - h, width: w, height: h, opacity: (o && o.opacity != null) ? o.opacity : 1 });
  };

  // Image fitted inside a box, preserving aspect ratio (never stretched).
  Doc.prototype.imageFit = function (page, img, x, y, w, h) {
    if (!img) return null;
    var r = Math.min(w / img.width, h / img.height);
    var iw = img.width * r, ih = img.height * r;
    var ix = x + (w - iw) / 2, iy = y + (h - ih) / 2;
    this.image(page, img, ix, iy, iw, ih);
    return { x: ix, y: iy, w: iw, h: ih };
  };

  Doc.prototype.logo = function (page, x, y, size) {
    if (this.img.logo) this.imageFit(page, this.img.logo, x, y, size, size);
  };

  // Small four-point ornament used in headings and rules.
  Doc.prototype.diamond = function (page, cx, cy, r, color) {
    this.path(page, "M " + cx + " " + (cy - r) + " L " + (cx + r * 0.7) + " " + cy + " L " + cx + " " + (cy + r) + " L " + (cx - r * 0.7) + " " + cy + " Z", { fill: color || HEX.orange });
  };

  // ---------------- pages ----------------
  Doc.prototype._background = function (page) {
    page.drawRectangle({ x: 0, y: 0, width: W, height: H, color: col("#FBF5E8") });
    if (this.img.bg) page.drawImage(this.img.bg, { x: 0, y: 0, width: W, height: H });
  };

  // Section title pill centred at the top, thin gold rules either side and
  // the KundliPlanet logo at the right - the reference report's header.
  Doc.prototype._header = function (page, title) {
    var cy = 42;
    var logoSize = 34;
    var logoX = W - MARGIN - logoSize + 4;
    this.logo(page, logoX, cy - logoSize / 2, logoSize);
    var size = 11.5;
    var tw = this._rawWidth(title, size, 600);
    var maxPill = W - 2 * MARGIN - 2 * (logoSize + 26);
    var pw = Math.min(maxPill, Math.max(150, tw + 44));
    var ph = 25;
    var px = W / 2 - pw / 2;
    this.line(page, MARGIN, cy, px - 8, cy, { color: HEX.goldLine, lw: 0.8 });
    this.line(page, px + pw + 8, cy, logoX - 8, cy, { color: HEX.goldLine, lw: 0.8 });
    this.diamond(page, px - 8, cy, 2.6, HEX.gold);
    this.diamond(page, px + pw + 8, cy, 2.6, HEX.gold);
    this.rect(page, px, cy - ph / 2, pw, ph, { r: 9, fill: HEX.orange });
    this.rect(page, px + 2, cy - ph / 2 + 2, pw - 4, ph - 4, { r: 7.5, stroke: "#F6D59A", lw: 0.5 });
    this.text(page, title, W / 2, cy + size * 0.36, { size: size, weight: 600, color: HEX.white, align: "center", maxW: pw - 20, abs: true });
  };

  // Headers are painted in finalize(), once every section that shares a
  // page is known, so the pill always names what is actually on the page.
  Doc.prototype.addPage = function (kind, title) {
    var page = this.pdf.addPage([W, H]);
    this._background(page);
    this.pages.push({ page: page, kind: kind, titles: title ? [title] : [] });
    this.page = page;
    this.y = CONTENT_TOP;
    if (kind === "content") this.title = title;
    return page;
  };

  // Starts a top-level section and records it for the section index.
  // A "soft" section continues on the current page (under a chapter
  // heading) when less than half of that page has been used, instead of
  // leaving the rest of it blank; otherwise it starts on a fresh page.
  Doc.prototype.section = function (title, opts) {
    opts = opts || {};
    var cur = this.pages[this.pages.length - 1];
    var usable = CONTENT_BOTTOM - CONTENT_TOP;
    if (opts.soft && cur && cur.kind === "content" && (opts.force || this.remaining() > usable * 0.5)) {
      this.y += 10;
      this.chapter(title);
      cur.titles.push(title);
      this.title = title;
    } else {
      this.addPage("content", title);
    }
    if (opts.toc !== false) this.toc.push({ title: opts.tocTitle || title, page: this.pages.length });
    return this.page;
  };

  // Renders a section that may share the previous page. It is first laid
  // out on a fresh page to measure it; it is then moved inline (under a
  // chapter heading) only if it fits in the space left on the previous
  // page, or if both pages would still be substantially used. This avoids
  // both half-empty pages and orphaned overflow pages without padding.
  Doc.prototype.flowSection = function (title, fn, opts) {
    opts = opts || {};
    var prev = this.pages[this.pages.length - 1];
    var usable = CONTENT_BOTTOM - CONTENT_TOP;
    var chapterH = 10 + 44 * this.fs;
    var rem = prev && prev.kind === "content" ? this.remaining() - chapterH : -1;
    var saved = { y: this.y, title: this.title, page: this.page, toc: this.toc.length };
    this.section(title, { toc: opts.toc });
    var startIdx = this.pages.length - 1;
    fn();
    var used = this.pages.length - startIdx;
    var h = (used - 1) * usable + (this.y - CONTENT_TOP);
    var inline = rem > 60 && (h <= rem || (rem > usable * 0.5 && h - rem > usable * 0.3));
    if (!inline) return;
    for (var i = this.pages.length - 1; i >= startIdx; i--) { this.pdf.removePage(i); this.pages.pop(); }
    this.toc.length = saved.toc;
    this.page = saved.page; this.y = saved.y; this.title = saved.title;
    this.section(title, { soft: true, force: true, toc: opts.toc });
    fn();
  };

  // Chapter heading used when a section starts part-way down a page.
  Doc.prototype.chapter = function (text) {
    var page = this.page, y = this.y;
    this.ornamentRule(page, W / 2, y + 4, CW / 2, HEX.goldLine);
    this.text(page, text, W / 2, y + 30 * this.fs, { size: 15, weight: 700, color: HEX.orangeDeep, align: "center" });
    this.y += 44 * this.fs;
  };

  Doc.prototype.remaining = function () { return CONTENT_BOTTOM - this.y; };

  // Moves to a continuation page (same pill title) if `h` does not fit.
  Doc.prototype.ensure = function (h) {
    if (this.y + h > CONTENT_BOTTOM) { this.addPage("content", this.title); return true; }
    return false;
  };

  Doc.prototype.space = function (h) { this.y += h; };

  // Paints every content page's header pill and footer (page X of Y).
  Doc.prototype.finalize = function () {
    var total = this.pages.length;
    var self = this;
    this.pages.forEach(function (pg, i) {
      if (pg.kind !== "content") return;
      var page = pg.page;
      var titles = pg.titles.filter(function (t, k) { return pg.titles.indexOf(t) === k; });
      self._header(page, titles.length > 2 ? titles[0] + " …" : titles.join("  ·  "));
      var y = H - 36;
      self.line(page, MARGIN, y, W - MARGIN, y, { color: HEX.goldLine, lw: 0.6 });
      self.diamond(page, W / 2, y, 2.4, HEX.gold);
      self.text(page, self.footerBrand, MARGIN, y + 13, { size: 8, weight: 600, color: HEX.orangeDeep, abs: true });
      if (self.footerCenter) self.text(page, self.footerCenter, W / 2, y + 13, { size: 7.6, color: HEX.muted, align: "center", maxW: 250, abs: true });
      self.text(page, self.pageOf(i + 1, total), W - MARGIN, y + 13, { size: 8, color: HEX.muted, align: "right", abs: true });
    });
  };

  // ------------------------------------------------------------------
  // Components
  // ------------------------------------------------------------------

  // Subsection heading: orange title, ornament and a hairline to the right
  // margin. Kept together with at least `keep` points of what follows.
  Doc.prototype.heading = function (text, opts) {
    opts = opts || {};
    var size = opts.size || 12.5;
    var S = size * this.fs;
    var h = S * 1.9;
    this.ensure(h + (opts.keep == null ? 70 : opts.keep));
    var page = this.page;
    var base = this.y + S * 1.05;
    this.diamond(page, MARGIN + 3, base - S * 0.34, 3.4, HEX.orange);
    var tw = this.text(page, text, MARGIN + 12, base, { size: size, weight: 700, color: HEX.orangeDeep });
    this.line(page, MARGIN + 18 + tw, base - S * 0.32, W - MARGIN, base - S * 0.32, { color: HEX.goldLine, lw: 0.6 });
    this.y += h;
  };

  // Flowing paragraph; breaks across pages line by line.
  Doc.prototype.para = function (text, opts) {
    opts = opts || {};
    text = String(text == null ? "" : text);
    if (!clean(text.replace(/\n/g, " "))) return;
    var size = opts.size || 9.2;
    var x = opts.x == null ? MARGIN : opts.x;
    var w = opts.w || (CW - (x - MARGIN));
    var weight = opts.weight || 400;
    var lh = opts.lh || this.lh(size);
    var lines = this.wrap(text, size, weight, w, opts.family);
    var self = this;
    var paraEnds = {};
    // Mark the last line of each source paragraph so it is not justified.
    var acc = 0;
    text.split(/\n/).forEach(function (p) { acc += self.wrap(p, size, weight, w, opts.family).length || 1; paraEnds[acc - 1] = true; });
    lines.forEach(function (ln, i) {
      self.ensure(lh);
      var base = self.y + size * self.fs * 1.02;
      if (ln) {
        if (opts.justify !== false && !paraEnds[i] && i < lines.length - 1) self.textJustified(self.page, ln, x, base, w, { size: size, weight: weight, color: opts.color || HEX.inkSoft, family: opts.family });
        else self.text(self.page, ln, opts.align === "center" ? x + w / 2 : x, base, { size: size, weight: weight, color: opts.color || HEX.inkSoft, align: opts.align, family: opts.family });
      }
      self.y += lh;
    });
    this.y += opts.gap == null ? 6 : opts.gap;
  };

  // Fixed-position justified text block (for column layouts); returns height.
  Doc.prototype.measureBlock = function (w, text, opts) {
    opts = opts || {};
    var size = opts.size || 9.2;
    return this.wrap(text, size, opts.weight || 400, w).length * this.lh(size);
  };
  Doc.prototype.textBlock = function (page, x, y, w, text, opts) {
    opts = opts || {};
    var size = opts.size || 9.2;
    var lines = this.wrap(text, size, opts.weight || 400, w);
    var lh = this.lh(size);
    var self = this;
    lines.forEach(function (ln, i) {
      var base = y + size * self.fs * 1.02 + i * lh;
      var o = { size: size, weight: opts.weight || 400, color: opts.color || HEX.inkSoft };
      if (opts.justify !== false && i < lines.length - 1) self.textJustified(page, ln, x, base, w, o);
      else self.text(page, ln, x, base, o);
    });
    return lines.length * lh;
  };
  // Small column title: orange bold text over a short gold rule.
  Doc.prototype.miniTitle = function (page, x, y, w, text) {
    var k = this.fs;
    this.text(page, text, x, y + 11 * k, { size: 10.5, weight: 700, color: HEX.orangeDeep, maxW: w });
    this.line(page, x, y + 17 * k, x + Math.min(w, 60), y + 17 * k, { color: HEX.gold, lw: 1 });
    return 24 * k;
  };

  // Numbered or bulleted list; each item wraps with a hanging indent.
  Doc.prototype.list = function (items, opts) {
    opts = opts || {};
    var size = opts.size || 9.2;
    var lh = this.lh(size);
    var indent = 20;
    var self = this;
    (items || []).filter(has).forEach(function (item, i) {
      var lines = self.wrap(item, size, 400, CW - indent - 4);
      self.ensure(Math.min(lines.length, 2) * lh);
      lines.forEach(function (ln, j) {
        if (self.ensure(lh)) { /* continued on next page */ }
        var base = self.y + size * self.fs * 1.02;
        if (j === 0) {
          if (opts.numbered) self.text(self.page, (i + 1) + ".", MARGIN + 14, base, { size: size, weight: 700, color: HEX.orangeDeep, align: "right" });
          else self.diamond(self.page, MARGIN + 8, base - size * self.fs * 0.34, 2.6, HEX.orange);
        }
        self.text(self.page, ln, MARGIN + indent, base, { size: size, color: opts.color || HEX.inkSoft });
        self.y += lh;
      });
      self.y += opts.itemGap == null ? 3 : opts.itemGap;
    });
    this.y += opts.gap == null ? 4 : opts.gap;
  };

  // ---- Key/value table (reference "Basic details" style) ----
  // spec: { title, rows: [[label, value]], labelFrac, size, valueAlign }
  Doc.prototype.measureKV = function (w, spec) {
    var size = spec.size || 8.7;
    var lw = w * (spec.labelFrac || 0.44);
    var pad = 6;
    var self = this;
    var th = 23 * this.fs;
    var h = spec.title ? th : 0;
    var rows = (spec.rows || []).filter(function (r) { return has(r[1]); });
    var heights = rows.map(function (r) {
      var a = self.wrap(r[0], size, 400, lw - pad * 2).length;
      var b = self.wrap(r[1], size, 400, w - lw - pad * 2).length;
      return Math.max(19 * self.fs, Math.max(a, b) * self.lh(size) + 8);
    });
    heights.forEach(function (x) { h += x; });
    return { h: h, rows: rows, heights: heights, lw: lw, size: size, pad: pad, th: th };
  };

  Doc.prototype.drawKV = function (page, x, y, w, spec) {
    var m = this.measureKV(w, spec);
    if (!m.rows.length) return 0;
    var self = this;
    var r = 5;
    this.rect(page, x, y, w, m.h, { r: r, fill: HEX.rowA });
    var cy = y;
    if (spec.title) {
      this.rect(page, x, y, w, m.th, { r: r, corners: { tl: 1, tr: 1 }, fill: HEX.orange });
      this.text(page, spec.title, x + w / 2, y + m.th * 0.67, { size: 9.6, weight: 600, color: HEX.white, align: "center", maxW: w - 16 });
      cy += m.th;
    }
    m.rows.forEach(function (row, i) {
      var rh = m.heights[i];
      var last = i === m.rows.length - 1;
      if (i % 2 === 1) self.rect(page, x, cy, w, rh, { fill: HEX.rowB, r: last ? r : 0, corners: { bl: 1, br: 1 } });
      if (i > 0) self.line(page, x, cy, x + w, cy, { color: HEX.goldLight, lw: 0.5 });
      var la = self.wrap(row[0], m.size, 400, m.lw - m.pad * 2);
      var va = self.wrap(row[1], m.size, 400, w - m.lw - m.pad * 2);
      var lhh = self.lh(m.size);
      var ps = m.size * self.fs;
      var ly = cy + (rh - la.length * lhh) / 2 + ps * 1.02 + (lhh - ps * 1.3) / 2;
      la.forEach(function (ln, k) { self.text(page, ln, x + m.pad, ly + k * lhh, { size: m.size, color: HEX.inkSoft }); });
      var vy = cy + (rh - va.length * lhh) / 2 + ps * 1.02 + (lhh - ps * 1.3) / 2;
      var vx = spec.valueAlign === "left" ? x + m.lw + m.pad : x + m.lw + (w - m.lw) / 2;
      va.forEach(function (ln, k) { self.text(page, ln, vx, vy + k * lhh, { size: m.size, color: HEX.ink, weight: spec.valueWeight || 400, align: spec.valueAlign === "left" ? "left" : "center" }); });
      cy += rh;
    });
    this.line(page, x + m.lw, y + (spec.title ? m.th : 0), x + m.lw, y + m.h, { color: HEX.goldLight, lw: 0.5 });
    this.rect(page, x, y, w, m.h, { r: r, stroke: HEX.goldLight, lw: 0.9 });
    return m.h;
  };

  // Full-width or side-by-side key/value tables, kept on one page.
  Doc.prototype.kvColumns = function (specs, opts) {
    opts = opts || {};
    var gap = opts.gap == null ? 18 : opts.gap;
    var n = specs.length;
    var w = (CW - gap * (n - 1)) / n;
    var self = this;
    var hs = specs.map(function (s) { return s ? self.measureKV(w, s).h : 0; });
    var h = Math.max.apply(null, hs);
    if (h <= 0) return;
    this.ensure(h);
    specs.forEach(function (s, i) { if (s) self.drawKV(self.page, MARGIN + i * (w + gap), self.y, w, s); });
    this.y += h + (opts.after == null ? 14 : opts.after);
  };

  // ---- Grid table with orange header; flows across pages by row ----
  // spec: { columns: [{ label, w, align }], rows: [[cell]], size,
  //         rowFill(i) -> hex|null, rowBold(i) -> bool }
  // A cell is a string or { t, color, weight }.
  function cellText(c) { return (c && typeof c === "object") ? clean(c.t) : clean(c); }
  Doc.prototype.table = function (spec) {
    var self = this;
    var size = spec.size || 8.4;
    var hsize = spec.headSize || size;
    var x0 = spec.x == null ? MARGIN : spec.x;
    var tw = spec.w || CW;
    var totalW = spec.columns.reduce(function (a, c) { return a + (c.w || 1); }, 0);
    var widths = spec.columns.map(function (c) { return tw * (c.w || 1) / totalW; });
    var pad = spec.pad || 5;
    var lh = this.lh(size);
    // Header labels wrap between words only; a column whose longest word
    // does not fit gets a slightly smaller header size instead.
    var headSizes = spec.columns.map(function (c, i) {
      var s = hsize;
      var longest = clean(c.label).split(" ").reduce(function (a, wd) { return Math.max(a, self.width(wd, s, 600)); }, 0);
      if (longest > widths[i] - pad * 2) s = Math.max(6, s * (widths[i] - pad * 2) / longest);
      return s;
    });
    var headLines = spec.columns.map(function (c, i) { return self.wrap(c.label, headSizes[i], 600, widths[i] - pad * 2); });
    var headH = Math.max(22 * self.fs, Math.max.apply(null, headLines.map(function (l, i) { return l.length * self.lh(headSizes[i]); })) + 8);
    var rows = (spec.rows || []).map(function (row) {
      var lines = row.map(function (c, i) {
        var wt = (c && c.weight) || (spec.rowBold && spec.rowBold(row) ? 600 : 400);
        return self.wrap(cellText(c), size, wt, widths[i] - pad * 2);
      });
      var h = Math.max((spec.minRow || 19) * self.fs, Math.max.apply(null, lines.map(function (l) { return l.length || 1; })) * lh + 8);
      return { cells: row, lines: lines, h: h };
    });
    if (!rows.length) return;
    var r = 5;
    function drawHead() {
      var page = self.page, y = self.y;
      self.rect(page, x0, y, tw, headH, { r: r, corners: { tl: 1, tr: 1 }, fill: spec.headFill || HEX.orange });
      var cx = x0;
      spec.columns.forEach(function (c, i) {
        var ls = headLines[i];
        var hs = headSizes[i];
        var hl = self.lh(hs);
        var hp = hs * self.fs;
        var ty = y + (headH - ls.length * hl) / 2 + hp * 1.02 + (hl - hp * 1.3) / 2;
        ls.forEach(function (ln, k) {
          var al = c.align || "center";
          var tx = al === "left" ? cx + pad : al === "right" ? cx + widths[i] - pad : cx + widths[i] / 2;
          self.text(page, ln, tx, ty + k * hl, { size: hs, weight: 600, color: HEX.white, align: al });
        });
        cx += widths[i];
      });
      self.y += headH;
      return y;
    }
    var segTop = null;
    function closeSegment() {
      if (segTop === null) return;
      var cx = x0;
      for (var i = 0; i < widths.length - 1; i++) {
        cx += widths[i];
        self.line(self.page, cx, segTop + headH, cx, self.y, { color: HEX.goldLight, lw: 0.45 });
      }
      self.rect(self.page, x0, segTop, tw, self.y - segTop, { r: r, stroke: HEX.goldLight, lw: 0.9 });
    }
    this.ensure(headH + rows[0].h + (spec.keep || 0));
    segTop = drawHead();
    rows.forEach(function (row, idx) {
      if (self.y + row.h > CONTENT_BOTTOM) {
        closeSegment();
        self.addPage("content", self.title);
        segTop = drawHead();
      }
      var page = self.page, y = self.y;
      var fill = spec.rowFill ? spec.rowFill(idx, row.cells) : null;
      self.rect(page, x0, y, tw, row.h, { fill: fill || (idx % 2 ? HEX.rowB : HEX.rowA) });
      if (y > segTop + headH + 0.1) self.line(page, x0, y, x0 + tw, y, { color: HEX.goldLight, lw: 0.45 });
      var cx = x0;
      row.cells.forEach(function (c, i) {
        var al = spec.columns[i].align || "center";
        var ls = row.lines[i];
        var wt = (c && c.weight) || (spec.rowBold && spec.rowBold(row.cells) ? 600 : 400);
        var colr = (c && c.color) || (i === 0 && spec.firstColColor) || HEX.ink;
        var sp = size * self.fs;
        var ty = y + (row.h - ls.length * lh) / 2 + sp * 1.02 + (lh - sp * 1.3) / 2;
        ls.forEach(function (ln, k) {
          var tx = al === "left" ? cx + pad : al === "right" ? cx + widths[i] - pad : cx + widths[i] / 2;
          self.text(page, ln, tx, ty + k * lh, { size: size, weight: wt, color: colr, align: al });
        });
        cx += widths[i];
      });
      self.y += row.h;
    });
    closeSegment();
    this.y += spec.after == null ? 14 : spec.after;
  };

  // ---- Status banner (e.g. "Kaal Sarp Dosha: Not Present") ----
  // tone: "alert" | "clear" | "neutral"
  Doc.prototype.banner = function (label, value, tone, note) {
    var size = 12.5;
    var noteLines = note ? this.wrap(note, 9, 400, CW - 60) : [];
    var k = this.fs;
    var h = 40 * k + (noteLines.length ? noteLines.length * this.lh(9) + 6 : 0);
    this.ensure(h);
    var page = this.page, y = this.y;
    var accent = tone === "alert" ? HEX.maroon : tone === "clear" ? HEX.green : HEX.orangeDeep;
    this.rect(page, MARGIN, y, CW, h, { r: 6, fill: HEX.goldPale });
    this.rect(page, MARGIN, y, CW, h, { r: 6, stroke: HEX.goldLine, lw: 0.9 });
    this.rect(page, MARGIN, y, 5, h, { r: 2.5, corners: { tl: 1, bl: 1 }, fill: accent });
    var lw = this.text(page, label + ":", MARGIN + 20, y + 25 * k, { size: size, weight: 600, color: HEX.ink });
    var vw = this.width(value, size - 1.5, 700) + 22;
    this.rect(page, MARGIN + 28 + lw, y + 10.5 * k, vw, 20 * k, { r: 10 * k, fill: accent });
    this.text(page, value, MARGIN + 28 + lw + vw / 2, y + 24.8 * k, { size: size - 1.5, weight: 700, color: HEX.white, align: "center" });
    var self = this;
    noteLines.forEach(function (ln, i) { self.text(page, ln, MARGIN + 20, y + 44 * k + i * self.lh(9), { size: 9, color: HEX.inkSoft }); });
    this.y += h + 14;
  };

  // ---- Information card: titled cream panel with a gold accent ----
  Doc.prototype.measureCard = function (w, spec) {
    var size = spec.size || 9;
    var lines = this.wrap(spec.body || "", size, 400, w - 24);
    var h = 14 + (spec.title ? 18 * this.fs : 0) + lines.length * this.lh(size) + 8;
    return { h: h, lines: lines, size: size };
  };
  Doc.prototype.drawCard = function (page, x, y, w, spec, fixedH) {
    var m = this.measureCard(w, spec);
    var h = fixedH || m.h;
    this.rect(page, x, y, w, h, { r: 6, fill: HEX.card });
    this.rect(page, x, y, w, h, { r: 6, stroke: HEX.goldLight, lw: 0.9 });
    this.rect(page, x, y + 8, 3, h - 16, { r: 1.5, fill: spec.accent || HEX.orange });
    var cy = y + 12;
    if (spec.title) {
      this.text(page, spec.title, x + 13, cy + 9 * this.fs, { size: 10, weight: 700, color: HEX.orangeDeep, maxW: w - 26 });
      cy += 18 * this.fs;
    }
    var self = this;
    var lh = this.lh(m.size);
    m.lines.forEach(function (ln, i) { if (ln) self.text(page, ln, x + 13, cy + m.size * self.fs * 1.02 + i * lh, { size: m.size, color: HEX.inkSoft }); });
    return h;
  };
  // Full-width card; if it is taller than a page it degrades to a heading
  // plus flowing paragraph instead of overflowing.
  Doc.prototype.card = function (spec) {
    if (!has(spec.body)) return;
    var m = this.measureCard(CW, spec);
    if (m.h > CONTENT_BOTTOM - CONTENT_TOP - 20) {
      if (spec.title) this.heading(spec.title, { size: 11 });
      this.para(spec.body, { size: spec.size || 9 });
      return;
    }
    this.ensure(m.h);
    this.drawCard(this.page, MARGIN, this.y, CW, spec);
    this.y += m.h + 12;
  };
  // Grid of equal-height cards, `cols` per row.
  Doc.prototype.cardGrid = function (specs, cols, opts) {
    opts = opts || {};
    var gap = 12;
    var w = (CW - gap * (cols - 1)) / cols;
    var self = this;
    specs = specs.filter(function (s) { return s && has(s.body); });
    for (var i = 0; i < specs.length; i += cols) {
      var row = specs.slice(i, i + cols);
      var h = Math.max.apply(null, row.map(function (s) { return self.measureCard(w, s).h; }));
      this.ensure(h);
      row.forEach(function (s, j) { self.drawCard(self.page, MARGIN + j * (w + gap), self.y, w, s, h); });
      this.y += h + gap;
    }
    this.y += opts.after == null ? 2 : opts.after;
  };

  // ---- North Indian chart ----
  // spec: { houses: [12 x { sign: 1..12|null, planets: [{ label, deg, retro, color }], asc }],
  //         title, caption }
  var HOUSE_CENTER = [
    [0.5, 0.25], [0.25, 0.1], [0.1, 0.25], [0.25, 0.5], [0.1, 0.75], [0.25, 0.9],
    [0.5, 0.75], [0.75, 0.9], [0.9, 0.75], [0.75, 0.5], [0.9, 0.25], [0.75, 0.1]
  ];
  var SIGN_POS = [
    [0.5, 0.435], [0.25, 0.2], [0.2, 0.25], [0.435, 0.5], [0.2, 0.75], [0.25, 0.8],
    [0.5, 0.565], [0.75, 0.8], [0.8, 0.75], [0.565, 0.5], [0.8, 0.25], [0.75, 0.2]
  ];
  // Per-house layout: diamonds hold a vertical stack, the wide top/bottom
  // triangles two columns, the tall side triangles a narrow stack.
  var HOUSE_KIND = ["d", "tw", "ts", "d", "ts", "tw", "d", "tw", "ts", "d", "ts", "tw"];

  Doc.prototype.chart = function (page, x, y, s, spec) {
    var self = this;
    var titleH = spec.title ? 24 * this.fs : 0;
    if (spec.title) this.text(page, spec.title, x + s / 2, y + 11 * this.fs, { size: 10.5, weight: 700, color: HEX.ink, align: "center", maxW: s });
    var cy0 = y + titleH;
    var X = function (f) { return x + f * s; }, Y = function (f) { return cy0 + f * s; };
    // Frame: soft fill, double border with corner ornaments.
    this.rect(page, x - 5, cy0 - 5, s + 10, s + 10, { r: 7, fill: HEX.chartFill, opacity: 0.85 });
    this.rect(page, x - 5, cy0 - 5, s + 10, s + 10, { r: 7, stroke: HEX.chartLine, lw: 1.1 });
    this.rect(page, x - 2, cy0 - 2, s + 4, s + 4, { r: 5, stroke: HEX.gold, lw: 0.45 });
    [[x - 5, cy0 - 5], [x + s + 5, cy0 - 5], [x + s + 5, cy0 + s + 5], [x - 5, cy0 + s + 5]].forEach(function (p) {
      self.diamond(page, p[0], p[1], 3.2, HEX.orange);
    });
    var lc = HEX.chartLine;
    // Diagonals.
    this.line(page, X(0), Y(0), X(1), Y(1), { color: lc, lw: 0.8 });
    this.line(page, X(1), Y(0), X(0), Y(1), { color: lc, lw: 0.8 });
    // Inner diamond with gently incurved sides (traditional ornamental form).
    var bow = 0.045;
    var d = "M " + X(0.5) + " " + Y(0) +
      " Q " + X(0.75 - bow) + " " + Y(0.25 + bow) + " " + X(1) + " " + Y(0.5) +
      " Q " + X(0.75 - bow) + " " + Y(0.75 - bow) + " " + X(0.5) + " " + Y(1) +
      " Q " + X(0.25 + bow) + " " + Y(0.75 - bow) + " " + X(0) + " " + Y(0.5) +
      " Q " + X(0.25 + bow) + " " + Y(0.25 + bow) + " " + X(0.5) + " " + Y(0) + " Z";
    this.path(page, d, { stroke: lc, lw: 0.8 });
    var fs = Math.max(6.2, Math.min(s >= 320 ? 9.4 : 8.6, s * 0.037));
    var numSize = Math.max(5.8, fs - 1);
    (spec.houses || []).forEach(function (hs, i) {
      if (!hs) return;
      if (hs.sign) self.text(page, String(hs.sign), X(SIGN_POS[i][0]), Y(SIGN_POS[i][1]) + numSize * 0.35, { size: numSize, weight: 600, color: HEX.muted, align: "center" });
      var items = [];
      if (hs.asc) items.push({ label: spec.ascLabel || "Asc", color: PLANET_HEX.Ascendant });
      (hs.planets || []).forEach(function (p) { items.push(p); });
      if (!items.length) return;
      var kind = HOUSE_KIND[i];
      var cols = kind === "tw" && items.length > 2 ? 2 : 1;
      if (kind === "d" && items.length > 4) cols = 2;
      var rowsN = Math.ceil(items.length / cols);
      var lineH = fs * 1.3;
      var colW = s * (kind === "ts" ? 0.16 : kind === "tw" ? 0.17 : 0.19);
      var cx = X(HOUSE_CENTER[i][0]), cyy = Y(HOUSE_CENTER[i][1]);
      if (kind === "tw") cyy += (i === 1 || i === 11 ? -0.01 : 0.01) * s;
      var startY = cyy - (rowsN * lineH) / 2 + fs * 0.95;
      items.forEach(function (it, k) {
        var r = Math.floor(k / cols), c = k % cols;
        var px = cx + (cols === 2 ? (c === 0 ? -colW / 2 : colW / 2) : 0);
        var py = startY + r * lineH;
        var label = clean(it.label);
        var extra = (it.deg ? " " + it.deg : "") + (it.retro ? " " + (spec.retroMark || "R") : "");
        var lw = self.width(label, fs, 700);
        var ew = extra ? self.width(extra, fs * 0.74, 400) : 0;
        var maxW = cols === 2 ? colW - 2 : colW * 1.25;
        var scale = (lw + ew) > maxW ? maxW / (lw + ew) : 1;
        var lx = px - (lw + ew) * scale / 2;
        self.text(page, label, lx, py, { size: fs * scale, weight: 700, color: it.color || HEX.ink });
        if (extra) self.text(page, extra, lx + lw * scale, py - fs * 0.05, { size: fs * 0.74 * scale, color: HEX.muted });
      });
    });
    var bottom = cy0 + s + 5;
    if (spec.caption) {
      this.text(page, spec.caption, x + s / 2, bottom + 15, { size: 9, weight: 600, color: HEX.inkSoft, align: "center", maxW: s + 20 });
      bottom += 20;
    }
    return bottom - y;
  };

  Doc.prototype.chartHeight = function (s, spec) {
    return (spec.title ? 24 * this.fs : 0) + s + 5 + (spec.caption ? 20 : 0);
  };

  // ---- Planet cards (3 per row), reference-style saffron tiles ----
  // item: { key (English planet name), name, line1, line2, status }
  Doc.prototype.planetCards = function (items, opts) {
    opts = opts || {};
    var cols = 3, gap = 10;
    var w = (CW - gap * (cols - 1)) / cols;
    var k = this.fs;
    var h = opts.h || 76 * k;
    var self = this;
    for (var i = 0; i < items.length; i += cols) {
      this.ensure(h);
      items.slice(i, i + cols).forEach(function (it, j) {
        var x = MARGIN + j * (w + gap), y = self.y, page = self.page;
        var lines = [it.line1, it.line2, it.line3].filter(has);
        self.rect(page, x, y, w, h, { r: 6, fill: HEX.orange });
        self.rect(page, x + 2.5, y + 2.5, w - 5, h - 5, { r: 4.5, stroke: "#F6D59A", lw: 0.5 });
        var iconX = x + 26, iconY = y + h / 2;
        self.circle(page, iconX, iconY, 16, { fill: "#F3B75A" });
        self.circle(page, iconX, iconY, 16, { stroke: "#FBE3B5", lw: 0.7 });
        if (it.key === "Sun") {
          self.circle(page, iconX, iconY, 7.5, { stroke: HEX.white, lw: 1.5 });
          self.circle(page, iconX, iconY, 1.8, { fill: HEX.white });
        } else if (PLANET_GLYPH[it.key]) {
          self.text(page, PLANET_GLYPH[it.key], iconX, iconY + 6.2, { size: 17, color: HEX.white, align: "center" });
        } else {
          self.text(page, clean(it.name).slice(0, 2), iconX, iconY + 3.5, { size: 10, weight: 700, color: HEX.white, align: "center" });
        }
        var tx = x + 50, tw = w - 58;
        var nameSize = opts.nameSize || 10.5, lineSize = opts.lineSize || 8.4, gapL = opts.lineGap || 13;
        self.text(page, it.name, tx, y + (nameSize + 6.5) * k, { size: nameSize, weight: 700, color: HEX.white, maxW: tw });
        lines.forEach(function (ln, n) { self.text(page, ln, tx, y + (nameSize + 21.5 + n * gapL) * k, { size: lineSize, color: "#FFF6E6", maxW: tw }); });
        if (it.status) {
          var sw = Math.min(tw, self.width(it.status, 7.8, 600) + 14);
          self.rect(page, tx, y + h - 22 * k, sw, 14 * k, { r: 7 * k, fill: "#FFF4DF" });
          self.text(page, it.status, tx + sw / 2, y + h - 12 * k, { size: 7.8, weight: 600, color: HEX.maroon, align: "center", maxW: sw - 8 });
        }
      });
      this.y += h + gap;
    }
    this.y += 4;
  };

  // ---- Period cards (dasha timeline), 3 per row ----
  // item: { title, rows: [[label, value]], tag, current }
  Doc.prototype.periodCards = function (items, opts) {
    opts = opts || {};
    var cols = opts.cols || 3, gap = 12;
    var w = (CW - gap * (cols - 1)) / cols;
    var self = this;
    var rowsN = Math.max.apply(null, items.map(function (it) { return it.rows.length; }));
    var k = this.fs;
    var rowH = opts.rowH || 17, lSize = opts.labelSize || 8.2, vSize = opts.valueSize || 8.4;
    var h = 26 * k + rowsN * rowH * k + (items.some(function (it) { return it.tag; }) ? 24 * k : 6);
    for (var i = 0; i < items.length; i += cols) {
      this.ensure(h);
      items.slice(i, i + cols).forEach(function (it, j) {
        var x = MARGIN + j * (w + gap), y = self.y, page = self.page;
        self.rect(page, x, y, w, h, { r: 6, fill: it.current ? "#FFF3DA" : HEX.rowA });
        self.rect(page, x, y, w, 24 * k, { r: 6, corners: { tl: 1, tr: 1 }, fill: it.current ? HEX.orangeDeep : HEX.orange });
        self.text(page, it.title, x + w / 2, y + 16 * k, { size: 10.5, weight: 700, color: HEX.white, align: "center", maxW: w - 12 });
        it.rows.forEach(function (r, n) {
          var ry = y + (24 + rowH * 0.78 + n * rowH) * k;
          self.text(page, r[0], x + 10, ry, { size: lSize, color: HEX.muted });
          self.text(page, r[1], x + w - 10, ry, { size: vSize, weight: 600, color: HEX.ink, align: "right", maxW: w * 0.6 });
          if (n < it.rows.length - 1) self.line(page, x + 8, ry + rowH * 0.32 * k, x + w - 8, ry + rowH * 0.32 * k, { color: HEX.goldLight, lw: 0.4 });
        });
        if (it.tag) {
          var tw = self.width(it.tag, 7.8, 600) + 16;
          self.rect(page, x + w / 2 - tw / 2, y + h - 19 * k, tw, 13 * k, { r: 6.5 * k, fill: it.current ? HEX.maroon : it.tagMuted ? "#E9DCC4" : HEX.goldLight });
          self.text(page, it.tag, x + w / 2, y + h - 9.8 * k, { size: 7.8, weight: 600, color: it.current ? HEX.white : HEX.inkSoft, align: "center" });
        }
        self.rect(page, x, y, w, h, { r: 6, stroke: it.current ? HEX.orangeDeep : HEX.goldLight, lw: it.current ? 1.4 : 0.9 });
      });
      this.y += h + gap;
    }
    this.y += 2;
  };

  // ---- Score graphics ----
  function arcPath(cx, cy, r, a0, a1) {
    var x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0);
    var x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
    var large = (a1 - a0) > Math.PI ? 1 : 0;
    return "M " + x0 + " " + y0 + " A " + r + " " + r + " 0 " + large + " 1 " + x1 + " " + y1;
  }
  Doc.prototype.scoreRing = function (page, cx, cy, r, value, max, labelTop, labelBottom) {
    var frac = max > 0 ? Math.max(0, Math.min(1, value / max)) : 0;
    this.circle(page, cx, cy, r + 9, { fill: HEX.rowA });
    this.circle(page, cx, cy, r + 9, { stroke: HEX.goldLight, lw: 0.8 });
    this.path(page, arcPath(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + 2 * Math.PI - 0.0001), { stroke: "#EFE0C2", lw: 9 });
    if (frac > 0) this.path(page, arcPath(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + 2 * Math.PI * Math.min(frac, 0.9999)), { stroke: HEX.orange, lw: 9, cap: true });
    var num = String(value);
    this.text(page, num, cx, cy + 7, { size: r * 0.62, weight: 700, color: HEX.ink, align: "center" });
    this.text(page, "/ " + max, cx, cy + r * 0.52 + 6, { size: r * 0.24, weight: 600, color: HEX.muted, align: "center" });
    if (labelTop) this.text(page, labelTop, cx, cy - r * 0.42, { size: r * 0.17, weight: 600, color: HEX.orangeDeep, align: "center", maxW: r * 1.4 });
    if (labelBottom) this.text(page, labelBottom, cx, cy + r + 26, { size: 9, weight: 600, color: HEX.inkSoft, align: "center", maxW: r * 3.5 });
  };

  Doc.prototype.bar = function (page, x, y, w, h, frac, color) {
    this.rect(page, x, y, w, h, { r: h / 2, fill: "#EFE0C2" });
    frac = Math.max(0, Math.min(1, frac || 0));
    if (frac > 0) this.rect(page, x, y, Math.max(h, w * frac), h, { r: h / 2, fill: color || HEX.orange });
  };

  // ---- Stat tiles: small labelled value boxes in a row ----
  Doc.prototype.tiles = function (items, opts) {
    opts = opts || {};
    items = items.filter(function (t) { return t && has(t.value); });
    if (!items.length) return;
    var cols = opts.cols || items.length;
    var gap = 10;
    var w = (CW - gap * (cols - 1)) / cols;
    var k = this.fs;
    var h = (opts.h || 48) * k;
    var self = this;
    for (var i = 0; i < items.length; i += cols) {
      this.ensure(h);
      items.slice(i, i + cols).forEach(function (t, j) {
        var x = MARGIN + j * (w + gap), y = self.y, page = self.page;
        self.rect(page, x, y, w, h, { r: 6, fill: HEX.rowA });
        self.rect(page, x, y, w, h, { r: 6, stroke: HEX.goldLight, lw: 0.9 });
        self.rect(page, x + w / 2 - 14, y, 28, 2.4, { fill: t.accent || HEX.orange });
        self.text(page, t.label, x + w / 2, y + h * 0.36, { size: 7.8, color: HEX.muted, align: "center", maxW: w - 10 });
        self.text(page, t.value, x + w / 2, y + h * 0.74, { size: opts.valueSize || 11, weight: 700, color: t.color || HEX.ink, align: "center", maxW: w - 10 });
      });
      this.y += h + gap;
    }
    this.y += opts.after == null ? 4 : opts.after;
  };

  // ------------------------------------------------------------------
  // Cover frame shared by both reports
  // ------------------------------------------------------------------
  Doc.prototype.coverFrame = function (page) {
    var self = this;
    var o = 20, i2 = 26;
    this.rect(page, o, o, W - 2 * o, H - 2 * o, { r: 4, stroke: HEX.gold, lw: 1.6 });
    this.rect(page, i2, i2, W - 2 * i2, H - 2 * i2, { r: 3, stroke: HEX.goldLine, lw: 0.6 });
    [[o, o], [W - o, o], [W - o, H - o], [o, H - o]].forEach(function (p) {
      self.circle(page, p[0], p[1], 6.5, { fill: "#FBF5E8" });
      self.diamond(page, p[0], p[1], 6, HEX.orange);
      self.circle(page, p[0], p[1], 1.6, { fill: "#FBF5E8" });
    });
    [W / 2].forEach(function (cx) {
      self.diamond(page, cx, o, 4, HEX.gold);
      self.diamond(page, cx, H - o, 4, HEX.gold);
    });
  };

  // Ornamental rule: line - diamond - line.
  Doc.prototype.ornamentRule = function (page, cx, y, halfW, color) {
    this.line(page, cx - halfW, y, cx - 9, y, { color: color || HEX.gold, lw: 0.8 });
    this.line(page, cx + 9, y, cx + halfW, y, { color: color || HEX.gold, lw: 0.8 });
    this.diamond(page, cx, y, 4, color || HEX.orange);
    this.diamond(page, cx - 9 - 5, y, 1.8, HEX.gold);
    this.diamond(page, cx + 9 + 5, y, 1.8, HEX.gold);
  };

  Doc.prototype.save = function () { return this.pdf.save(); };

  KP.Doc = Doc;
})(window);

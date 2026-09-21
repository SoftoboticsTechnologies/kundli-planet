/* Kundli Planet - PDF report generator.
   Builds structured A4 PDFs from the already-rendered report data
   (the same `kt` / `mt` view-model objects the React templates use).
   No astrology calculation happens here and no APIs are called. */
(function (global) {
  "use strict";

  var JSPDF_URL = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
  var AUTOTABLE_URL = "https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js";
  var FONT_SCRIPT_URL = "pdf-font-devanagari.js";
  var LOGO_URL = "uploads/kundli%20planet%20ogo.png";

  var MARGIN = 16;
  var CONTENT_TOP = 26;
  var FOOTER_TOP = 281;
  var PAGE_W = 210;
  var PAGE_H = 297;
  var CONTENT_W = PAGE_W - MARGIN * 2;

  var COLOR = {
    navy: [10, 22, 51],
    gold: [212, 175, 55],
    goldDark: [199, 154, 32],
    cream: [246, 239, 226],
    creamBorder: [228, 216, 194],
    textDark: [21, 22, 43],
    textMuted: [90, 92, 110],
    textMuted2: [107, 109, 124],
    border: [234, 226, 206],
    heading: [74, 51, 18],
    kicker: [150, 116, 42],
    footerText: [122, 124, 138],
    cardBg: [255, 255, 255]
  };

  var COVER = {
    en: {
      kundliTitle: "Kundli Report", milanTitle: "Kundli Milan Report",
      brand: "Kundli Planet", tagline: "Bhagalpur, Bihar",
      name: "Name", gender: "Gender", dob: "Date of Birth", tob: "Time of Birth", place: "Birth Place",
      male: "Male", female: "Female", generated: "Generated on",
      preparing: "Preparing PDF...", download: "Download Kundli PDF", downloadMilan: "Download Kundli Milan PDF",
      genericError: "Unable to generate PDF. Please try again.",
      pageOf: function (p, n) { return "Page " + p + " of " + n; }
    },
    hi: {
      kundliTitle: "कुंडली रिपोर्ट", milanTitle: "कुंडली मिलान रिपोर्ट",
      brand: "कुंडली प्लैनेट", tagline: "भागलपुर, बिहार",
      name: "नाम", gender: "लिंग", dob: "जन्म तिथि", tob: "जन्म समय", place: "जन्म स्थान",
      male: "पुरुष", female: "स्त्री", generated: "बनाया गया",
      preparing: "पीडीएफ तैयार हो रहा है...", download: "कुंडली पीडीएफ डाउनलोड करें", downloadMilan: "कुंडली मिलान पीडीएफ डाउनलोड करें",
      genericError: "पीडीएफ बनाने में समस्या हुई। कृपया पुनः प्रयास करें।",
      pageOf: function (p, n) { return "पृष्ठ " + p + " में से " + n; }
    }
  };

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement("script");
      s.src = src;
      s.async = true;
      s.onload = function () { resolve(); };
      s.onerror = function () { reject(new Error("Failed to load " + src)); };
      document.head.appendChild(s);
    });
  }

  var jsPdfLoading = null;
  function ensureJsPDF() {
    if (global.jspdf && global.jspdf.jsPDF) return Promise.resolve(global.jspdf.jsPDF);
    if (jsPdfLoading) return jsPdfLoading;
    jsPdfLoading = loadScript(JSPDF_URL).then(function () { return loadScript(AUTOTABLE_URL); }).then(function () {
      if (!global.jspdf || !global.jspdf.jsPDF) throw new Error("jsPDF failed to load");
      return global.jspdf.jsPDF;
    }).catch(function (e) { jsPdfLoading = null; throw e; });
    return jsPdfLoading;
  }

  var fontLoading = null;
  function ensureDevanagariFont() {
    if (global.KP_PDF_FONTS && global.KP_PDF_FONTS.notoDevanagariRegular) {
      return Promise.resolve(global.KP_PDF_FONTS.notoDevanagariRegular);
    }
    if (fontLoading) return fontLoading;
    fontLoading = loadScript(FONT_SCRIPT_URL).then(function () {
      if (!global.KP_PDF_FONTS || !global.KP_PDF_FONTS.notoDevanagariRegular) throw new Error("Devanagari font failed to load");
      return global.KP_PDF_FONTS.notoDevanagariRegular;
    }).catch(function (e) { fontLoading = null; throw e; });
    return fontLoading;
  }

  function fetchAsDataUrl(url) {
    return fetch(url).then(function (res) {
      if (!res.ok) throw new Error("fetch failed: " + url);
      return res.blob();
    }).then(function (blob) {
      return new Promise(function (resolve, reject) {
        var reader = new FileReader();
        reader.onload = function () { resolve(reader.result); };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    });
  }

  function loadImageMeta(dataUrl) {
    return new Promise(function (resolve) {
      var img = new Image();
      img.onload = function () { resolve({ dataUrl: dataUrl, width: img.naturalWidth, height: img.naturalHeight }); };
      img.onerror = function () { resolve(null); };
      img.src = dataUrl;
    });
  }

  var logoLoading = null;
  function loadLogo() {
    if (logoLoading) return logoLoading;
    logoLoading = fetchAsDataUrl(LOGO_URL).then(loadImageMeta).catch(function () { return null; });
    return logoLoading;
  }

  function loadRemoteImage(url) {
    if (!url) return Promise.resolve(null);
    return fetchAsDataUrl(url).then(loadImageMeta).catch(function () { return null; });
  }

  function sanitizeFilename(name) {
    var cleaned = String(name || "")
      .replace(/[\\/:*?"<>|]+/g, "")
      .replace(/[^\p{L}\p{N}\p{M}\- ]+/gu, "")
      .trim()
      .replace(/\s+/g, "-")
      .slice(0, 60);
    return cleaned || "Report";
  }

  function hexToRgb(hex) {
    var m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex || "");
    if (!m) return COLOR.gold;
    return [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)];
  }

  function accentFromCardStyle(cardStyle) {
    var m = /border-left:\s*3px solid\s*(#[0-9a-fA-F]{6})/.exec(cardStyle || "");
    return m ? hexToRgb(m[1]) : COLOR.gold;
  }

  function parsePercentPos(posStyle) {
    var l = /left:\s*([\d.]+)%/.exec(posStyle || "");
    var t = /top:\s*([\d.]+)%/.exec(posStyle || "");
    return { left: l ? parseFloat(l[1]) : 50, top: t ? parseFloat(t[1]) : 50 };
  }

  // jsPDF has no Indic text-shaping engine: it draws glyphs in raw Unicode
  // storage order, so the pre-base vowel sign (U+093F) - which is typed
  // after its consonant but must be drawn before it - ends up on the wrong
  // side. Reorder it here before any Devanagari string is drawn.
  var DEVANAGARI_CONSONANT = "[क-हक़-य़]";
  var MATRA_I_RE = new RegExp("(" + DEVANAGARI_CONSONANT + "(?:्" + DEVANAGARI_CONSONANT + ")*)ि", "g");
  function fixDevanagariMatraOrder(text) {
    if (typeof text !== "string" || text.indexOf("ि") === -1) return text;
    return text.replace(MATRA_I_RE, "ि$1");
  }

  // ---- Builder: wraps a jsPDF doc with cursor + pagination helpers ----
  function createBuilder(jsPDF, lang) {
    var doc = new jsPDF({ unit: "mm", format: "a4", compress: true });
    var fontName = lang === "hi" ? "NotoDevanagari" : "helvetica";
    var b = {
      doc: doc,
      fontName: fontName,
      lang: lang,
      cursorY: CONTENT_TOP,
      reportTitle: "",
      registerFont: function (base64) {
        doc.addFileToVFS("NotoSansDevanagari-Regular.ttf", base64);
        doc.addFont("NotoSansDevanagari-Regular.ttf", "NotoDevanagari", "normal");
        doc.addFont("NotoSansDevanagari-Regular.ttf", "NotoDevanagari", "bold");
      },
      newPage: function () {
        doc.addPage();
        b.cursorY = CONTENT_TOP;
      },
      ensureSpace: function (h) {
        if (b.cursorY + h > FOOTER_TOP) b.newPage();
      },
      hr: function (color) {
        doc.setDrawColor.apply(doc, color || COLOR.border);
        doc.setLineWidth(0.25);
        doc.line(MARGIN, b.cursorY, PAGE_W - MARGIN, b.cursorY);
      },
      sectionTitle: function (text) {
        b.ensureSpace(16);
        doc.setFillColor.apply(doc, COLOR.gold);
        doc.rect(MARGIN, b.cursorY, 3, 7, "F");
        doc.setFont(fontName, "bold");
        doc.setFontSize(13.5);
        doc.setTextColor.apply(doc, COLOR.navy);
        doc.text(String(text || "").toUpperCase(), MARGIN + 6, b.cursorY + 5.6);
        b.cursorY += 12;
      },
      subTitle: function (text) {
        b.ensureSpace(10);
        doc.setFont(fontName, "bold");
        doc.setFontSize(11);
        doc.setTextColor.apply(doc, COLOR.heading);
        doc.text(String(text || ""), MARGIN, b.cursorY);
        b.cursorY += 6.5;
      },
      paragraph: function (text, opts) {
        opts = opts || {};
        doc.setFont(fontName, "normal");
        doc.setFontSize(opts.size || 10);
        doc.setTextColor.apply(doc, opts.color || COLOR.textMuted);
        var lines = doc.splitTextToSize(String(text || ""), opts.width || CONTENT_W);
        var lh = opts.lineHeight || 5;
        lines.forEach(function (line) {
          b.ensureSpace(lh);
          doc.text(line, MARGIN, b.cursorY);
          b.cursorY += lh;
        });
        b.cursorY += opts.gapAfter != null ? opts.gapAfter : 4;
      },
      badgeLine: function (label, value, accentColor) {
        b.ensureSpace(9);
        doc.setFillColor.apply(doc, accentColor || COLOR.gold);
        doc.circle(MARGIN + 1.4, b.cursorY - 1.4, 1.4, "F");
        doc.setFont(fontName, "bold");
        doc.setFontSize(10.5);
        doc.setTextColor.apply(doc, COLOR.navy);
        doc.text(String(label || ""), MARGIN + 6, b.cursorY);
        var labelW = doc.getTextWidth(String(label || "")) + 6;
        doc.setFont(fontName, "normal");
        doc.setTextColor.apply(doc, COLOR.textMuted);
        doc.text(String(value || ""), MARGIN + 6 + labelW + 3, b.cursorY);
        b.cursorY += 7;
      },
      keyValueTable: function (pairs) {
        if (!pairs || !pairs.length) return;
        b.ensureSpace(20);
        doc.autoTable({
          startY: b.cursorY,
          margin: { left: MARGIN, right: MARGIN, top: CONTENT_TOP, bottom: PAGE_H - FOOTER_TOP },
          theme: "grid",
          styles: { font: fontName, fontSize: 9.5, cellPadding: 3.2, textColor: COLOR.textDark, lineColor: COLOR.border, lineWidth: 0.15, overflow: "linebreak" },
          columnStyles: { 0: { fontStyle: "bold", textColor: COLOR.heading, cellWidth: 55, fillColor: COLOR.cream }, 1: { cellWidth: CONTENT_W - 55 } },
          body: pairs.map(function (p) { return [p.label, p.value]; }),
          showHead: false
        });
        b.cursorY = doc.lastAutoTable.finalY + 8;
      },
      table: function (head, rows, opts) {
        opts = opts || {};
        if (!rows || !rows.length) return;
        b.ensureSpace(20);
        doc.autoTable({
          startY: b.cursorY,
          margin: { left: MARGIN, right: MARGIN, top: CONTENT_TOP, bottom: PAGE_H - FOOTER_TOP },
          theme: "grid",
          styles: { font: fontName, fontSize: opts.fontSize || 8.6, cellPadding: 2.8, textColor: COLOR.textDark, lineColor: COLOR.border, lineWidth: 0.15, overflow: "linebreak" },
          headStyles: { font: fontName, fontStyle: "bold", fillColor: COLOR.cream, textColor: COLOR.heading, lineColor: COLOR.border, lineWidth: 0.15 },
          showHead: "everyPage",
          head: [head],
          body: rows
        });
        b.cursorY = doc.lastAutoTable.finalY + 8;
      },
      card: function (renderInner, opts) {
        opts = opts || {};
        var padding = 5;
        b.ensureSpace(opts.minHeight || 24);
        var contentX = MARGIN + padding + (opts.accent ? 2 : 0);
        var innerY = b.cursorY + padding + 2;
        var cursorAfter = renderInner(contentX, innerY, CONTENT_W - padding * 2 - (opts.accent ? 2 : 0));
        var boxBottom = cursorAfter + padding;
        doc.setDrawColor.apply(doc, COLOR.border);
        doc.setLineWidth(0.2);
        doc.roundedRect(MARGIN, b.cursorY, CONTENT_W, boxBottom - b.cursorY, 2, 2, "S");
        if (opts.accent) {
          doc.setFillColor.apply(doc, opts.accent);
          doc.rect(MARGIN, b.cursorY, 1.4, boxBottom - b.cursorY, "F");
        }
        b.cursorY = boxBottom + 6;
      },
      filledBox: function (fillColor, measureAndDraw, opts) {
        opts = opts || {};
        var padding = 6;
        var innerW = CONTENT_W - padding * 2;
        var measured = measureAndDraw.measure(innerW);
        var boxH = measured.height + padding * 2;
        b.ensureSpace(boxH);
        var by = b.cursorY;
        doc.setFillColor.apply(doc, fillColor);
        doc.roundedRect(MARGIN, by, CONTENT_W, boxH, 2, 2, "F");
        measureAndDraw.draw(MARGIN + padding, by + padding, innerW, measured);
        b.cursorY = by + boxH + 6;
      }
    };
    if (lang === "hi" && global.KP_PDF_FONTS && global.KP_PDF_FONTS.notoDevanagariRegular) {
      b.registerFont(global.KP_PDF_FONTS.notoDevanagariRegular);
      var origText = doc.text.bind(doc);
      doc.text = function (text, x, y, options) {
        var fixed = Array.isArray(text) ? text.map(fixDevanagariMatraOrder) : fixDevanagariMatraOrder(text);
        return origText(fixed, x, y, options);
      };
    }
    return b;
  }

  function drawCoverHeader(b, brandTitle, tagline, logo) {
    var doc = b.doc;
    doc.setFillColor.apply(doc, COLOR.navy);
    doc.rect(0, 0, PAGE_W, 78, "F");
    var logoSize = 26;
    var logoX = PAGE_W / 2 - logoSize / 2;
    var logoY = 14;
    if (logo && logo.dataUrl) {
      var ratio = logo.width && logo.height ? logo.width / logo.height : 1;
      var w = logoSize, h = logoSize;
      if (ratio > 1) h = logoSize / ratio; else w = logoSize * ratio;
      try { doc.addImage(logo.dataUrl, "PNG", PAGE_W / 2 - w / 2, logoY, w, h); } catch (e) { /* skip if format unsupported */ }
    }
    doc.setFont(b.fontName, "bold");
    doc.setFontSize(19);
    doc.setTextColor(243, 227, 176);
    doc.text(brandTitle, PAGE_W / 2, logoY + logoSize + 10, { align: "center" });
    doc.setFont(b.fontName, "normal");
    doc.setFontSize(9);
    doc.setTextColor(200, 200, 220);
    doc.text(tagline, PAGE_W / 2, logoY + logoSize + 17, { align: "center" });
  }

  function drawCoverDetailBlock(b, x, y, w, title, rows) {
    var doc = b.doc;
    doc.setFont(b.fontName, "bold");
    doc.setFontSize(12);
    doc.setTextColor.apply(doc, COLOR.heading);
    doc.text(title, x, y);
    var cy = y + 7;
    doc.setFillColor.apply(doc, COLOR.gold);
    doc.rect(x, cy - 4, w, 0.6, "F");
    cy += 5;
    rows.forEach(function (r) {
      if (!r.value) return;
      doc.setFont(b.fontName, "normal");
      doc.setFontSize(9.5);
      doc.setTextColor.apply(doc, COLOR.textMuted2);
      doc.text(String(r.label), x, cy);
      doc.setFont(b.fontName, "bold");
      doc.setTextColor.apply(doc, COLOR.textDark);
      var lines = doc.splitTextToSize(String(r.value), w);
      doc.text(lines, x, cy + 5);
      cy += 5 + lines.length * 5 + 3;
    });
    return cy;
  }

  function paintHeaderFooter(b, C, reportTitle) {
    var doc = b.doc;
    var total = doc.internal.getNumberOfPages();
    for (var i = 1; i <= total; i++) {
      doc.setPage(i);
      doc.setDrawColor.apply(doc, COLOR.border);
      doc.setLineWidth(0.2);
      doc.line(MARGIN, FOOTER_TOP, PAGE_W - MARGIN, FOOTER_TOP);
      doc.setFont(b.fontName, "normal");
      doc.setFontSize(8.2);
      doc.setTextColor.apply(doc, COLOR.footerText);
      doc.text(C.brand, MARGIN, FOOTER_TOP + 5);
      doc.text(C.pageOf(i, total), PAGE_W - MARGIN, FOOTER_TOP + 5, { align: "right" });
      if (i > 1) {
        doc.setDrawColor.apply(doc, COLOR.creamBorder);
        doc.line(MARGIN, 18, PAGE_W - MARGIN, 18);
        doc.setFont(b.fontName, "bold");
        doc.setFontSize(9);
        doc.setTextColor.apply(doc, COLOR.navy);
        doc.text(C.brand, MARGIN, 13);
        doc.setFont(b.fontName, "normal");
        doc.setTextColor.apply(doc, COLOR.textMuted2);
        doc.text(reportTitle, PAGE_W - MARGIN, 13, { align: "right" });
      }
    }
  }

  function drawChartDiamond(b, x, y, size, label, houses) {
    var doc = b.doc;
    doc.setFont(b.fontName, "bold");
    doc.setFontSize(10);
    doc.setTextColor.apply(doc, COLOR.navy);
    doc.text(label, x + size / 2, y, { align: "center" });
    var top = y + 5;
    doc.setDrawColor.apply(doc, COLOR.gold);
    doc.setLineWidth(0.3);
    doc.rect(x, top, size, size, "S");
    doc.line(x, top, x + size, top + size);
    doc.line(x + size, top, x, top + size);
    doc.line(x + size / 2, top, x + size, top + size / 2);
    doc.line(x + size, top + size / 2, x + size / 2, top + size);
    doc.line(x + size / 2, top + size, x, top + size / 2);
    doc.line(x, top + size / 2, x + size / 2, top);
    (houses || []).forEach(function (h) {
      var pos = parsePercentPos(h.posStyle);
      var px = x + (pos.left / 100) * size;
      var py = top + (pos.top / 100) * size;
      doc.setFont(b.fontName, "normal");
      doc.setFontSize(6.6);
      doc.setTextColor.apply(doc, COLOR.kicker);
      if (h.sign) doc.text(String(h.sign), px, py - 1.6, { align: "center" });
      doc.setFont(b.fontName, "bold");
      doc.setFontSize(7.4);
      doc.setTextColor.apply(doc, COLOR.navy);
      doc.text(String(h.planets || "—"), px, py + 2.4, { align: "center" });
    });
    return top + size;
  }

  function verdictCard(b, heading, cardData) {
    if (!cardData || !cardData.isSuccess) return;
    var accent = accentFromCardStyle(cardData.cardStyle);
    b.card(function (x, y, w) {
      var doc = b.doc;
      doc.setFont(b.fontName, "bold");
      doc.setFontSize(11);
      doc.setTextColor.apply(doc, COLOR.navy);
      doc.text(heading, x, y);
      var headW = doc.getTextWidth(heading);
      doc.setFontSize(9);
      doc.setTextColor.apply(doc, accent);
      doc.text(String(cardData.verdict || ""), x + headW + 6, y);
      doc.setFont(b.fontName, "normal");
      doc.setFontSize(9.3);
      doc.setTextColor.apply(doc, COLOR.textMuted);
      var lines = doc.splitTextToSize(String(cardData.detail || ""), w);
      doc.text(lines, x, y + 6);
      return y + 6 + lines.length * 4.6;
    }, { accent: accent, minHeight: 26 });
  }

  function buildKundliDoc(jsPDF, kt, lang, logo) {
    var C = COVER[lang] || COVER.en;
    var b = createBuilder(jsPDF, lang);
    return Promise.resolve().then(function () {
      var report = kt.report || {};
      var basic = report.basicDetails || {};
      drawCoverHeader(b, C.brand, C.tagline, logo);
      var doc = b.doc;
      doc.setFont(b.fontName, "bold");
      doc.setFontSize(24);
      doc.setTextColor.apply(doc, COLOR.navy);
      doc.text(C.kundliTitle, PAGE_W / 2, 96, { align: "center" });
      drawCoverDetailBlock(b, MARGIN, 118, CONTENT_W, basic.name || "", [
        { label: C.gender, value: basic.gender },
        { label: C.dob, value: basic.birthDate },
        { label: C.tob, value: basic.birthTime },
        { label: C.place, value: basic.birthPlace }
      ]);
      var genDate = new Intl.DateTimeFormat(lang === "hi" ? "hi-IN" : "en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(new Date());
      doc.setFont(b.fontName, "normal");
      doc.setFontSize(8.5);
      doc.setTextColor.apply(doc, COLOR.footerText);
      doc.text(C.generated + ": " + genDate, PAGE_W / 2, FOOTER_TOP - 8, { align: "center" });

      b.newPage();
      var T = kt.t || {};

      b.sectionTitle(T.basicDetailsH || "Basic Details");
      b.keyValueTable([
        { label: T.nameF, value: basic.name }, { label: T.genderF, value: basic.gender },
        { label: T.birthDateF, value: basic.birthDate }, { label: T.birthTimeF, value: basic.birthTime },
        { label: T.birthPlaceF, value: basic.birthPlace }, { label: T.ascendantF, value: basic.ascendant },
        { label: T.rashiF, value: basic.rashi }, { label: T.nakshatraF, value: basic.nakshatra }
      ]);

      var kd = report.kundliDetails || {};
      if (kt.report) {
        b.sectionTitle(T.kundliDetailsH || "Kundli Details");
        b.keyValueTable([
          { label: T.nakshatraLordF, value: kd.nakshatraLord }, { label: T.charanF, value: kd.charan },
          { label: T.yogF, value: kd.yog }, { label: T.karanF, value: kd.karan },
          { label: T.tithiF, value: kd.tithi }, { label: T.tattvaF, value: kd.tattva },
          { label: T.yunjaF, value: kd.yunja }, { label: T.payaF, value: kd.paya },
          { label: T.nameAlphabetF, value: kd.nameAlphabet }, { label: T.varnaF, value: kd.varna },
          { label: T.ganF, value: kd.gan }, { label: T.nadiF, value: kd.nadi },
          { label: T.signLordF, value: kd.signLord }, { label: T.vashyaF, value: kd.vashya },
          { label: T.yoniF, value: kd.yoni }, { label: T.ascendantLordF, value: kd.ascendantLord }
        ]);
      }

      if (kt.numerology && kt.numerology.isSuccess && kt.numerology.rows && kt.numerology.rows.length) {
        b.sectionTitle(T.favourableH || "Favourable Numerology");
        b.keyValueTable(kt.numerology.rows);
      }

      if (kt.nakshatraPrediction && kt.nakshatraPrediction.isSuccess && kt.nakshatraPrediction.categories && kt.nakshatraPrediction.categories.length) {
        b.sectionTitle(T.predictionsH || "Daily Nakshatra Prediction");
        kt.nakshatraPrediction.categories.forEach(function (c) {
          b.subTitle(c.label);
          b.paragraph(c.text);
        });
      }

      if (kt.planetRows && kt.planetRows.length) {
        b.sectionTitle(T.planetsH || "Planetary Positions");
        b.table(
          [T.colPlanet, T.colSign, T.colSignLord, T.colDegree, T.colNakshatra, T.colNakshatraLord, T.colHouse],
          kt.planetRows.map(function (pr) { return [pr.nameLine, pr.sign, pr.signLord, pr.degree, pr.nakshatra, pr.nakshatraLord, pr.house]; })
        );
      }

      if (kt.chartTypes && kt.chartTypes.length && kt.report) {
        b.sectionTitle(T.chartH || "Kundli Chart");
        var gap = 8, cols = 2, chartSize = (CONTENT_W - gap) / cols;
        for (var ci = 0; ci < kt.chartTypes.length; ci += cols) {
          var rowCharts = kt.chartTypes.slice(ci, ci + cols);
          b.ensureSpace(chartSize + 16);
          var rowY = b.cursorY, rowBottom = rowY;
          rowCharts.forEach(function (ct, col) {
            var x = MARGIN + col * (chartSize + gap);
            var bottom = drawChartDiamond(b, x, rowY, chartSize, ct.label, ct.houses);
            if (bottom > rowBottom) rowBottom = bottom;
          });
          b.cursorY = rowBottom + 12;
        }
      }

      if (kt.manglik || kt.kaalSarp || kt.sadeSati || kt.pitraDosh) {
        b.sectionTitle(T.tabDosha || "Dosha");
        verdictCard(b, T.manglikH || "Manglik Dosha", kt.manglik);
        verdictCard(b, T.kaalSarpH || "Kaal Sarp Dosha", kt.kaalSarp);
        verdictCard(b, T.sadeSatiH || "Sade Sati", kt.sadeSati);
        verdictCard(b, T.pitruH || "Pitra Dosha", kt.pitraDosh);
        if (kt.doshaSummaryText) {
          b.filledBox(COLOR.navy, {
            measure: function (w) {
              var lines = b.doc.splitTextToSize(kt.doshaSummaryText, w);
              return { lines: lines, height: 6 + lines.length * 4.6 };
            },
            draw: function (x, y, w, m) {
              var doc2 = b.doc;
              doc2.setFont(b.fontName, "bold");
              doc2.setFontSize(10.5);
              doc2.setTextColor(243, 227, 176);
              doc2.text(T.doshaSummaryH || "Dosha Summary", x, y + 3);
              doc2.setFont(b.fontName, "normal");
              doc2.setFontSize(9);
              doc2.setTextColor(244, 242, 234);
              doc2.text(m.lines, x, y + 9);
            }
          });
        }
      }

      if (kt.dasha && kt.dasha.isSuccess) {
        b.sectionTitle(T.tabDasha || "Dasha");
        b.filledBox(COLOR.navy, {
          measure: function () { return { height: 26 }; },
          draw: function (x, y, w) {
            var doc2 = b.doc;
            doc2.setFont(b.fontName, "bold");
            doc2.setFontSize(9);
            doc2.setTextColor(232, 211, 145);
            doc2.text(String(T.currentDashaLabel || "").toUpperCase(), x, y + 3);
            doc2.setFont(b.fontName, "bold");
            doc2.setFontSize(14);
            doc2.setTextColor(251, 247, 234);
            doc2.text(kt.dasha.currentMahadashaPlanet + " " + (T.mahadashaWord || ""), x, y + 11);
            doc2.setFont(b.fontName, "normal");
            doc2.setFontSize(8.5);
            doc2.setTextColor(214, 214, 226);
            doc2.text(kt.dasha.currentMahadashaRange || "", x, y + 17);
            doc2.setFont(b.fontName, "normal");
            doc2.setFontSize(9.5);
            doc2.setTextColor(232, 211, 145);
            doc2.text((kt.dasha.currentAntardashaPlanet || "") + " " + (T.antardashaWord || "") + " · " + (kt.dasha.currentAntardashaRange || ""), x, y + 24);
          }
        });
        if (kt.dasha.rows && kt.dasha.rows.length) {
          b.subTitle(T.mahadashaTableH || "Mahadasha Timeline");
          b.table([T.colPlanetDasha, T.colStart, T.colEnd], kt.dasha.rows.map(function (r) { return [r.planet, r.start, r.end]; }));
        }
      }

      if (kt.remedyCards && kt.remedyCards.length) {
        b.sectionTitle(T.tabRemedies || "Remedies");
        kt.remedyCards.forEach(function (rc) {
          b.card(function (x, y, w) {
            var doc2 = b.doc;
            doc2.setFont(b.fontName, "bold");
            doc2.setFontSize(10.5);
            doc2.setTextColor.apply(doc2, COLOR.navy);
            doc2.text(rc.title, x, y);
            doc2.setFont(b.fontName, "normal");
            doc2.setFontSize(9.3);
            doc2.setTextColor.apply(doc2, COLOR.textMuted);
            var lines = doc2.splitTextToSize(rc.body, w);
            doc2.text(lines, x, y + 6);
            return y + 6 + lines.length * 4.6;
          }, { accent: COLOR.gold, minHeight: 24 });
        });
      }

      var imagePromise = Promise.resolve();
      if (kt.gemstone && kt.gemstone.isSuccess && kt.gemstone.categories && kt.gemstone.categories.length) {
        b.sectionTitle(T.gemstoneH || "Gemstone Suggestion");
        imagePromise = kt.gemstone.categories.reduce(function (chain, gc) {
          return chain.then(function () {
            return loadRemoteImage(gc.image).then(function (img) {
              b.subTitle(gc.label);
              if (img && img.dataUrl) {
                var w = 40, h = img.width && img.height ? (40 * img.height / img.width) : 40;
                b.ensureSpace(h + 4);
                try {
                  var fmt = /png/i.test(img.dataUrl) ? "PNG" : "JPEG";
                  b.doc.addImage(img.dataUrl, fmt, MARGIN, b.cursorY, w, h);
                } catch (e) { /* skip image if embedding fails */ }
                b.cursorY += h + 4;
              }
              b.keyValueTable(gc.rows || []);
            });
          });
        }, imagePromise);
      }

      return imagePromise.then(function () {
        if (kt.rudraksha && kt.rudraksha.isSuccess) {
          b.sectionTitle(T.rudrakshaH || "Rudraksha Suggestion");
          b.subTitle(kt.rudraksha.name);
          b.paragraph(kt.rudraksha.recommend, { color: COLOR.heading, size: 10 });
          b.paragraph(kt.rudraksha.detail);
        }
        return b;
      });
    }).then(function () {
      paintHeaderFooter(b, C, C.kundliTitle);
      return b.doc;
    });
  }

  function buildMilanDoc(jsPDF, mt, lang, logo) {
    var C = COVER[lang] || COVER.en;
    var b = createBuilder(jsPDF, lang);
    return Promise.resolve().then(function () {
      var T = mt.t || {};
      var res = mt.result || {};
      drawCoverHeader(b, C.brand, C.tagline, logo);
      var doc = b.doc;
      doc.setFont(b.fontName, "bold");
      doc.setFontSize(22);
      doc.setTextColor.apply(doc, COLOR.navy);
      doc.text(C.milanTitle, PAGE_W / 2, 96, { align: "center" });
      var half = (CONTENT_W - 10) / 2;
      var boysRows = (res.p1BasicRows || []).map(function (r) { return { label: r.label, value: r.value }; });
      var girlsRows = (res.p2BasicRows || []).map(function (r) { return { label: r.label, value: r.value }; });
      drawCoverDetailBlock(b, MARGIN, 118, half, (T.boysDetails || C.male) + (mt.p1 && mt.p1.name ? " – " + mt.p1.name : ""), boysRows);
      drawCoverDetailBlock(b, MARGIN + half + 10, 118, half, (T.girlsDetails || C.female) + (mt.p2 && mt.p2.name ? " – " + mt.p2.name : ""), girlsRows);
      var genDate = new Intl.DateTimeFormat(lang === "hi" ? "hi-IN" : "en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(new Date());
      doc.setFont(b.fontName, "normal");
      doc.setFontSize(8.5);
      doc.setTextColor.apply(doc, COLOR.footerText);
      doc.text(C.generated + ": " + genDate, PAGE_W / 2, FOOTER_TOP - 8, { align: "center" });

      b.newPage();

      b.sectionTitle(T.tabBasic || "Basic Details");
      var halfW = (CONTENT_W - 10) / 2;
      b.ensureSpace(30);
      var colHeadY = b.cursorY;
      doc.setFont(b.fontName, "bold");
      doc.setFontSize(11);
      doc.setTextColor.apply(doc, COLOR.heading);
      doc.text(T.boysDetails || C.male, MARGIN, colHeadY);
      doc.text(T.girlsDetails || C.female, MARGIN + halfW + 10, colHeadY);
      var tableTop = colHeadY + 4;
      function sideBySideTable(x, rows) {
        doc.autoTable({
          startY: tableTop, margin: { left: x, right: PAGE_W - x - halfW, top: CONTENT_TOP, bottom: PAGE_H - FOOTER_TOP },
          theme: "grid", tableWidth: halfW,
          styles: { font: b.fontName, fontSize: 9, cellPadding: 3, textColor: COLOR.textDark, lineColor: COLOR.border, lineWidth: 0.15, overflow: "linebreak" },
          columnStyles: { 0: { fontStyle: "bold", textColor: COLOR.heading, cellWidth: halfW * 0.42, fillColor: COLOR.cream }, 1: { cellWidth: halfW * 0.58 } },
          body: rows.map(function (r) { return [r.label, r.value]; }), showHead: false
        });
        return doc.lastAutoTable.finalY;
      }
      var boysEndY = sideBySideTable(MARGIN, boysRows);
      var girlsEndY = sideBySideTable(MARGIN + halfW + 10, girlsRows);
      b.cursorY = Math.max(boysEndY, girlsEndY) + 8;

      if (res.basicBanner && res.basicBanner.show) {
        var accent = /1F6B34|BEE0C6/i.test(res.basicBanner.style) ? [31, 107, 52] : [138, 42, 36];
        b.card(function (x, y, w) {
          var doc2 = b.doc;
          doc2.setFont(b.fontName, "bold");
          doc2.setFontSize(11);
          doc2.setTextColor.apply(doc2, accent);
          doc2.text(res.basicBanner.title, x, y);
          doc2.setFont(b.fontName, "normal");
          doc2.setFontSize(9.3);
          doc2.setTextColor.apply(doc2, COLOR.textMuted);
          var lines = doc2.splitTextToSize(res.basicBanner.body, w);
          doc2.text(lines, x, y + 6);
          return y + 6 + lines.length * 4.6;
        }, { accent: accent, minHeight: 24 });
      }

      if (mt.dosha && mt.dosha.badges && mt.dosha.badges.length) {
        b.sectionTitle(T.tabDosha || "Dosha Matching");
        mt.dosha.badges.forEach(function (bd) { b.badgeLine(bd.label, bd.value, COLOR.gold); });
        b.cursorY += 3;
      }

      if (mt.ashtakoot && mt.ashtakoot.rows && mt.ashtakoot.rows.length) {
        b.subTitle(T.ashtakootTableH || "Ashtakoot / Guna Milan");
        var rows = mt.ashtakoot.rows.map(function (r) { return [r.attribute, r.male, r.female, r.outOf, r.received, r.area]; });
        if (mt.ashtakoot.hasTotal) rows.push([T.colTotalRow || "Total", "-", "-", mt.ashtakoot.total.outOf, mt.ashtakoot.total.received, "-"]);
        b.table([T.colAttribute, T.colMale, T.colFemale, T.colOutOf, T.colReceived, T.colAreaOfLife], rows);
      }

      if (res.doshaBanner && res.doshaBanner.show) {
        var accent2 = /1F6B34|BEE0C6/i.test(res.doshaBanner.style) ? [31, 107, 52] : [138, 42, 36];
        b.card(function (x, y, w) {
          var doc2 = b.doc;
          doc2.setFont(b.fontName, "bold");
          doc2.setFontSize(11);
          doc2.setTextColor.apply(doc2, accent2);
          doc2.text(res.doshaBanner.title, x, y);
          doc2.setFont(b.fontName, "normal");
          doc2.setFontSize(9.3);
          doc2.setTextColor.apply(doc2, COLOR.textMuted);
          var lines = doc2.splitTextToSize(res.doshaBanner.body, w);
          doc2.text(lines, x, y + 6);
          return y + 6 + lines.length * 4.6;
        }, { accent: accent2, minHeight: 24 });
      }

      if (res.p1Planets && res.p1Planets.length) {
        b.sectionTitle(T.boysPlanetH || "Male Planetary Positions");
        b.table(
          [T.colPlanets, T.colSign, T.colSignLord, T.colDegree, T.colNakshatra, T.colNakshatraLord, T.colHouse, T.colPlanetAwastha],
          res.p1Planets.map(function (pr) { return [pr.nameLine, pr.sign, pr.signLord, pr.degree, pr.nakshatra, pr.nakshatraLord, pr.house, pr.awastha]; }),
          { fontSize: 7.6 }
        );
      }
      if (res.p2Planets && res.p2Planets.length) {
        b.sectionTitle(T.girlsPlanetH || "Female Planetary Positions");
        b.table(
          [T.colPlanets, T.colSign, T.colSignLord, T.colDegree, T.colNakshatra, T.colNakshatraLord, T.colHouse, T.colPlanetAwastha],
          res.p2Planets.map(function (pr) { return [pr.nameLine, pr.sign, pr.signLord, pr.degree, pr.nakshatra, pr.nakshatraLord, pr.house, pr.awastha]; }),
          { fontSize: 7.6 }
        );
      }

      if ((res.p1ChartHouses && res.p1ChartHouses.length) || (res.p2ChartHouses && res.p2ChartHouses.length)) {
        b.sectionTitle(T.tabChart || "Kundli Chart");
        var gap = 8, chartSize = (CONTENT_W - gap) / 2;
        b.ensureSpace(chartSize + 16);
        var rowY = b.cursorY;
        var b1 = drawChartDiamond(b, MARGIN, rowY, chartSize, T.boysDetails || C.male, res.p1ChartHouses);
        var b2 = drawChartDiamond(b, MARGIN + chartSize + gap, rowY, chartSize, T.girlsDetails || C.female, res.p2ChartHouses);
        b.cursorY = Math.max(b1, b2) + 10;
      }

      [{ label: T.maleManglikH || "Male Manglik", data: res.p1Manglik }, { label: T.femaleManglikH || "Female Manglik", data: res.p2Manglik }].forEach(function (m) {
        if (!m.data) return;
        b.subTitle(m.label);
        if (m.data.basedOnAspect && m.data.basedOnAspect.length) {
          b.paragraph((T.basedOnAspectsH ? T.basedOnAspectsH + ": " : "") + m.data.basedOnAspect.join("; "), { size: 9 });
        }
        if (m.data.basedOnHouse && m.data.basedOnHouse.length) {
          b.paragraph((T.basedOnHouseH ? T.basedOnHouseH + ": " : "") + m.data.basedOnHouse.join("; "), { size: 9 });
        }
        if (m.data.effectText) b.paragraph((T.manglikEffectH ? T.manglikEffectH + ": " : "") + m.data.effectText, { size: 9.5, color: COLOR.heading });
        if (m.data.report) b.paragraph(m.data.report, { size: 9.3 });
      });

      return b;
    }).then(function () {
      paintHeaderFooter(b, C, C.milanTitle);
      return b.doc;
    });
  }

  function generateKundliPdf(kt, lang) {
    return Promise.all([ensureJsPDF(), lang === "hi" ? ensureDevanagariFont() : Promise.resolve(null), loadLogo()])
      .then(function (results) {
        var jsPDF = results[0], logo = results[2];
        return buildKundliDoc(jsPDF, kt, lang, logo).then(function (doc) {
          var name = sanitizeFilename((kt.report && kt.report.basicDetails && kt.report.basicDetails.name) || "Kundli");
          doc.save("KundliPlanet-Kundli-" + name + ".pdf");
        });
      });
  }

  function generateMilanPdf(mt, lang) {
    return Promise.all([ensureJsPDF(), lang === "hi" ? ensureDevanagariFont() : Promise.resolve(null), loadLogo()])
      .then(function (results) {
        var jsPDF = results[0], logo = results[2];
        return buildMilanDoc(jsPDF, mt, lang, logo).then(function (doc) {
          var maleName = sanitizeFilename((mt.p1 && mt.p1.name) || "Male");
          var femaleName = sanitizeFilename((mt.p2 && mt.p2.name) || "Female");
          doc.save("KundliPlanet-Kundli-Milan-" + maleName + "-" + femaleName + ".pdf");
        });
      });
  }

  global.KundliPDF = {
    generateKundliPdf: generateKundliPdf,
    generateMilanPdf: generateMilanPdf,
    labels: COVER
  };
})(window);

/* Kundli Planet - PDF report generator (entry point).
   Presentation layer only: it receives the data the Kundli / Kundli Milan
   pages have already fetched from the existing calculation APIs and turns
   it into a KundliPlanet-styled A4 report. No astrology calculation happens
   here and no astrology API is called.

   Libraries and report modules are loaded lazily on first download:
     pdf/kp-pdf-core.js    shared design system (pages, text, tables, charts)
     pdf/kp-pdf-i18n.js    labels, Hindi vocabulary, general explanations
     pdf/kp-pdf-kundli.js  Individual Kundli normalizer + renderer
     pdf/kp-pdf-milan.js   Kundli Milan normalizer + renderer
   pdf-lib + fontkit are used (instead of jsPDF) because fontkit performs
   real OpenType shaping, so Devanagari conjuncts, reph and matras render
   correctly in Hindi reports. */
(function (global) {
  "use strict";

  // Each library lists fallback mirrors, tried in order if one CDN fails.
  var LIBS = [
    ["https://cdn.jsdelivr.net/npm/regenerator-runtime@0.14.1/runtime.min.js",
      "https://unpkg.com/regenerator-runtime@0.14.1/runtime.js"],
    ["https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js",
      "https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js",
      "https://unpkg.com/pdf-lib@1.17.1/dist/pdf-lib.min.js"],
    ["https://cdn.jsdelivr.net/npm/@pdf-lib/fontkit@1.1.1/dist/fontkit.umd.min.js",
      "https://unpkg.com/@pdf-lib/fontkit@1.1.1/dist/fontkit.umd.min.js"]
  ];
  var VERSION = "6";
  var MODULES = {
    core: "pdf/kp-pdf-core.js",
    i18n: "pdf/kp-pdf-i18n.js",
    kundli: "pdf/kp-pdf-kundli.js",
    milan: "pdf/kp-pdf-milan.js",
    hindi: "pdf/kp-pdf-hindi.js"
  };

  var loaded = {};
  function loadScript(src) {
    if (loaded[src]) return loaded[src];
    loaded[src] = new Promise(function (resolve, reject) {
      var s = document.createElement("script");
      s.src = src;
      s.async = true;
      s.onload = function () { resolve(); };
      s.onerror = function () { delete loaded[src]; reject(new Error("Failed to load " + src)); };
      document.head.appendChild(s);
    });
    return loaded[src];
  }

  function loadSeq(urls) {
    return urls.reduce(function (p, u) { return p.then(function () { return loadScript(u); }); }, Promise.resolve());
  }

  function loadFirst(mirrors) {
    return mirrors.slice(1).reduce(function (p, u) {
      return p.catch(function () { return loadScript(u); });
    }, loadScript(mirrors[0]));
  }

  function ensure(report, lang) {
    var libs = (global.PDFLib && global.fontkit && global.regeneratorRuntime) ? Promise.resolve()
      : LIBS.reduce(function (p, mirrors) { return p.then(function () { return loadFirst(mirrors); }); }, Promise.resolve());
    return libs.then(function () {
      var mods = [MODULES.core, MODULES.i18n, MODULES[report]];
      if (lang === "hi") mods.push(MODULES.hindi);
      return loadSeq(mods.map(function (m) { return m + "?v=" + VERSION; }));
    }).then(function () {
      if (!global.PDFLib || !global.fontkit || !global.KPPDF) throw new Error("PDF libraries failed to load");
      return global.KPPDF;
    });
  }

  // Hindi reports: API-returned English text is shown in Hindi.
  function localized(KP, kind, model) {
    if (model.lang !== "hi") return Promise.resolve(model);
    var fn = kind === "milan" ? KP.localizeMilan : KP.localizeKundli;
    return fn ? fn(model) : Promise.resolve(model);
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

  function download(bytes, filename) {
    var blob = new Blob([bytes], { type: "application/pdf" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.rel = "noopener";
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 60000);
  }

  // kt: the Kundli page's view-model; raw: the page's `kundli` state (the
  // API responses it already holds). lang: "en" | "hi".
  function generateKundliPdf(kt, lang, raw) {
    lang = lang === "hi" ? "hi" : "en";
    return ensure("kundli", lang).then(function (KP) {
      var model = KP.normalizeKundli(kt, raw, lang);
      return localized(KP, "kundli", model).then(KP.renderKundli).then(function (bytes) {
        download(bytes, "KundliPlanet-Kundli-" + sanitizeFilename(model.person.name || "Kundli") + ".pdf");
      });
    });
  }

  // mt: the Kundli Milan page's view-model; raw: the matching report result
  // already held in page state.
  function generateMilanPdf(mt, lang, raw) {
    lang = lang === "hi" ? "hi" : "en";
    return ensure("milan", lang).then(function (KP) {
      var model = KP.normalizeMilan(mt, raw, lang);
      return localized(KP, "milan", model).then(KP.renderMilan).then(function (bytes) {
        download(bytes, "KundliPlanet-Kundli-Milan-" + sanitizeFilename(model.groom.name || "Groom") + "-" + sanitizeFilename(model.bride.name || "Bride") + ".pdf");
      });
    });
  }

  // Test hook: builds the PDF bytes without triggering a download.
  function buildPdfBytes(kind, viewModel, lang, raw) {
    lang = lang === "hi" ? "hi" : "en";
    return ensure(kind, lang).then(function (KP) {
      var model = kind === "milan" ? KP.normalizeMilan(viewModel, raw, lang) : KP.normalizeKundli(viewModel, raw, lang);
      return localized(KP, kind, model).then(kind === "milan" ? KP.renderMilan : KP.renderKundli);
    });
  }

  global.KundliPDF = {
    generateKundliPdf: generateKundliPdf,
    generateMilanPdf: generateMilanPdf,
    buildPdfBytes: buildPdfBytes
  };
})(window);

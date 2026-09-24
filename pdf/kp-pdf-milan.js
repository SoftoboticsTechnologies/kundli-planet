/* KundliPlanet PDF - Kundli Milan (horoscope compatibility) report.
   normalizeMilan() maps the Milan page's existing state (the `mt`
   view-model plus the matching report already fetched into state) to a
   render model; renderMilan() lays it out. Scores, dosha flags, Manglik
   assessments and every conclusion are shown exactly as the existing
   calculation layer returned them - this file never scores, recommends or
   re-derives anything. Groom / Person A is always on the left, Bride /
   Person B always on the right. */
(function (global) {
  "use strict";

  var KP = global.KPPDF;
  var clean = KP.clean, has = KP.has, HEX = KP.HEX, PLANET_HEX = KP.PLANET_HEX;
  var MARGIN = KP.MARGIN, CW = KP.CW, W = KP.W;
  var fmtDate = KP.fmtDate, textOf = KP.textOf, F = KP.fmt, houseLabel = KP.houseLabel, stateText = KP.planetState;
  var KOOTAS = ["varna", "vashya", "tara", "yoni", "maitri", "gan", "bhakut", "nadi"];

  // ------------------------------------------------------------------
  // Normalization
  // ------------------------------------------------------------------
  function num(v) { var n = Number(v); return v === null || v === undefined || v === "" || isNaN(n) ? null : n; }
  function fmtNum(v) { var n = num(v); return n === null ? "" : (Math.round(n * 10) / 10).toString(); }

  KP.normalizeMilan = function (mt, res, lang) {
    mt = mt || {};
    res = res || {};
    function person(p) {
      p = p || {};
      var inp = p.input || {};
      return {
        name: clean(inp.name), gender: clean(inp.gender),
        dob: F.birthDate(inp, lang), tob: F.time(inp), place: clean(inp.city),
        lat: F.coord(inp.lat, KP.cardinal(lang)[0], KP.cardinal(lang)[1]), lon: F.coord(inp.lon, KP.cardinal(lang)[2], KP.cardinal(lang)[3]), tz: F.tz(inp.tzone, lang),
        astro: p.astro || {},
        planets: p.planets || [],
        manglik: p.manglik || null,
        chart: p.chartHouses || []
      };
    }
    var ash = res.ashtakoot || {};
    var rows = {};
    (ash.rows || []).forEach(function (r) { rows[r.key] = r; });
    // The page's own overall result (same object the previous PDF used).
    var banner = null;
    var mr = mt.result || {};
    var b = (mr.doshaBanner && mr.doshaBanner.show) ? mr.doshaBanner : (mr.basicBanner && mr.basicBanner.show) ? mr.basicBanner : null;
    if (b) banner = { title: clean(b.title), body: clean(b.body), ok: /1F6B34|BEE0C6/i.test(b.style || "") };
    var concl = ash.conclusion || null;
    return {
      lang: lang,
      T: mt.t || {},
      groom: person(res.person1),
      bride: person(res.person2),
      dosha: res.dosha || {},
      koota: rows,
      total: ash.total || null,
      ashtakootReport: concl ? (textOf(concl.report) || textOf(concl.match_report)) : "",
      manglikConclusion: res.manglikConclusion ? textOf(res.manglikConclusion.report) : "",
      banner: banner
    };
  };

  // ------------------------------------------------------------------
  // Helpers
  // ------------------------------------------------------------------
  function ctx(R) {
    var lang = R.lang;
    return {
      lang: lang, L: KP.L[lang] || KP.L.en, S: KP.K[lang] || KP.K.en, M: KP.M[lang] || KP.M.en,
      t: function (x) { return KP.term(x, lang); }
    };
  }
  function rowsOf(pairs) { return pairs.filter(function (p) { return has(p[1]); }); }
  function sideTitle(c, side) {
    return side === "groom" ? c.L.groom + " (" + c.L.personA + ")" : c.L.bride + " (" + c.L.personB + ")";
  }
  function yesNo(v, c) { return v === null || v === undefined ? "" : (v ? c.L.yes : c.L.no); }
  function planetOf(p, name) { return (p.planets || []).filter(function (x) { return x.name === name; })[0] || null; }
  function scoreText(r) { return r ? fmtNum(r.received) + " / " + fmtNum(r.outOf) : ""; }
  function kootaName(c, k) { return c.M.kootaNames[k] || k; }

  // Groom and bride key/value tables side by side.
  function twin(doc, c, gRows, bRows, opts) {
    opts = opts || {};
    doc.kvColumns([
      gRows.length ? { title: opts.gTitle || sideTitle(c, "groom"), rows: gRows, size: opts.size || 8.8, labelFrac: opts.labelFrac } : null,
      bRows.length ? { title: opts.bTitle || sideTitle(c, "bride"), rows: bRows, size: opts.size || 8.8, labelFrac: opts.labelFrac } : null
    ], { after: opts.after });
  }

  // Two titled lists side by side (Groom left, Bride right), kept together.
  function twinLists(doc, c, title, gItems, bItems, emptyText) {
    var gap = 18, w = (CW - gap) / 2, size = 8.8, lh = doc.lh(size);
    function measure(items) {
      if (!items.length) return doc.wrap(emptyText || "—", size, 400, w - 20).length * lh + 6;
      return items.reduce(function (a, it) { return a + doc.wrap(it, size, 400, w - 20).length * lh + 4; }, 0);
    }
    var bodyH = Math.max(measure(gItems), measure(bItems));
    var h = 26 + bodyH + 10;
    doc.heading(title, { size: 11.5, keep: Math.min(h, 200) });
    if (h > KP.CONTENT_BOTTOM - KP.CONTENT_TOP - 40) {
      // Too long to keep side by side: fall back to one list per person.
      [["groom", gItems], ["bride", bItems]].forEach(function (pair) {
        doc.para(sideTitle(c, pair[0]), { size: 9.4, weight: 700, color: HEX.orangeDeep, gap: 3, justify: false });
        if (pair[1].length) doc.list(pair[1], { numbered: true, size: size }); else doc.para(emptyText || "—", { size: size });
      });
      return;
    }
    doc.ensure(h);
    var y0 = doc.y, page = doc.page;
    [["groom", gItems], ["bride", bItems]].forEach(function (pair, i) {
      var x = MARGIN + i * (w + gap);
      doc.rect(page, x, y0, w, h, { r: 6, fill: HEX.rowA });
      doc.rect(page, x, y0, w, 22, { r: 6, corners: { tl: 1, tr: 1 }, fill: i === 0 ? HEX.orange : HEX.orangeDeep });
      doc.text(page, sideTitle(c, pair[0]), x + w / 2, y0 + 15, { size: 9.4, weight: 600, color: HEX.white, align: "center" });
      var y = y0 + 30;
      if (!pair[1].length) {
        doc.wrap(emptyText || "—", size, 400, w - 20).forEach(function (ln, k) { doc.text(page, ln, x + 10, y + size + k * lh, { size: size, color: HEX.muted }); });
      }
      pair[1].forEach(function (it, n) {
        var lines = doc.wrap(it, size, 400, w - 26);
        doc.text(page, (n + 1) + ".", x + 16, y + size, { size: size, weight: 700, color: HEX.orangeDeep, align: "right" });
        lines.forEach(function (ln, k) { doc.text(page, ln, x + 20, y + size + k * lh, { size: size, color: HEX.inkSoft }); });
        y += lines.length * lh + 4;
      });
      doc.rect(page, x, y0, w, h, { r: 6, stroke: HEX.goldLight, lw: 0.9 });
    });
    doc.y = y0 + h + 14;
  }

  function chartFor(p, c, title) {
    var ch = p.chart;
    if (!ch || ch.length !== 12 || !ch[0].sign) return null;
    return {
      title: title, ascLabel: c.L.asc, retroMark: c.S.retroMark,
      houses: ch.map(function (h, i) {
        return {
          sign: KP.signNumber(h.sign),
          asc: i === 0,
          planets: (h.planets || []).map(function (ab) {
            var name = KP.abbrToName(ab);
            var pr = name ? planetOf(p, name) : null;
            var deg = pr && has(pr.degree) ? parseInt(pr.degree, 10) : NaN;
            return { label: KP.planetAbbr(name || ab, c.lang), color: PLANET_HEX[name] || HEX.ink, deg: isNaN(deg) ? "" : deg + "°", retro: !!(pr && pr.retrograde) };
          })
        };
      })
    };
  }

  // One Koota block: definition, groom/bride values, score bar, system observation.
  function kootaBlock(doc, R, c, key) {
    var r = R.koota[key];
    if (!r) return;
    var M = c.M, L = c.L;
    doc.heading(kootaName(c, key), { keep: 190 });
    doc.para(M.kootaDef[key], { size: 9, gap: 8 });
    doc.table({
      columns: [{ label: sideTitle(c, "groom"), w: 1.3 }, { label: sideTitle(c, "bride"), w: 1.3 }, { label: M.obtained, w: 0.8 }, { label: M.maxScore, w: 0.8 }, { label: M.areaOfLife, w: 1.6 }],
      rows: [[{ t: c.t(r.male), weight: 700 }, { t: c.t(r.female), weight: 700 }, { t: fmtNum(r.received), weight: 700, color: HEX.orangeDeep }, fmtNum(r.outOf), { t: clean(r.area), color: HEX.inkSoft }]],
      size: 9, minRow: 28, after: 8
    });
    var frac = num(r.outOf) ? num(r.received) / num(r.outOf) : 0;
    doc.ensure(20);
    doc.text(doc.page, M.score, MARGIN, doc.y + 9, { size: 8.4, weight: 600, color: HEX.muted });
    doc.bar(doc.page, MARGIN + 60, doc.y + 2, CW - 130, 9, frac);
    doc.text(doc.page, scoreText(r), MARGIN + CW, doc.y + 10, { size: 9.4, weight: 700, color: HEX.ink, align: "right" });
    doc.y += 22;
    if (has(r.observation)) doc.card({ title: L.observation + " (" + L.systemOutput + ")", body: r.observation, size: 9 });
    doc.space(8);
  }

  // ------------------------------------------------------------------
  // Pages
  // ------------------------------------------------------------------
  function pageCover(doc, R, c, ganesh) {
    var L = c.L;
    var page = doc.addPage("cover");
    doc.coverFrame(page);
    // Auspicious opening: Lord Ganesha, the invocation, then the logo.
    var top = 42;
    if (ganesh) {
      doc.imageFit(page, ganesh, W / 2 - 64, top, 128, 122);
      top += 122;
    }
    doc.text(page, L.invocation, W / 2, top + 26, { size: 15, weight: 700, color: HEX.orangeDeep, align: "center" });
    top += 38;
    doc.logo(page, W / 2 - 62, top, 124);
    top += 124;
    doc.ornamentRule(page, W / 2, top + 12, 120);
    var bandY = top + 26, bandH = 100;
    doc.rect(page, 26, bandY, W - 52, bandH, { fill: HEX.orange });
    doc.line(page, 26, bandY + 6, W - 26, bandY + 6, { color: "#F6D59A", lw: 0.6 });
    doc.line(page, 26, bandY + bandH - 6, W - 26, bandY + bandH - 6, { color: "#F6D59A", lw: 0.6 });
    doc.text(page, L.milanTitle, W / 2, bandY + 46, { size: 30, weight: 700, family: "serif", color: HEX.white, align: "center" });
    doc.text(page, L.milanSubtitle, W / 2, bandY + 74, { size: 11.5, color: "#FFF4DE", align: "center" });
    var y = bandY + bandH + 36, gap = 34, w = (W - 104 - gap) / 2;
    [["groom", R.groom], ["bride", R.bride]].forEach(function (pair, i) {
      var x = 52 + i * (w + gap), p = pair[1];
      var label = pair[0] === "groom" ? c.M.groomLabel : c.M.brideLabel;
      var sub = pair[0] === "groom" ? L.personA : L.personB;
      var lw = doc.width(label, 10, 700) + 30;
      doc.rect(page, x + w / 2 - lw / 2, y, lw, 20, { r: 10, fill: i === 0 ? HEX.orange : HEX.orangeDeep });
      doc.text(page, label, x + w / 2, y + 14, { size: 10, weight: 700, color: HEX.white, align: "center" });
      doc.text(page, sub, x + w / 2, y + 34, { size: 8.4, color: HEX.muted, align: "center" });
      doc.text(page, p.name || "—", x + w / 2, y + 62, { size: 19, weight: 700, family: "serif", color: HEX.ink, align: "center", maxW: w - 10 });
      doc.drawKV(page, x, y + 80, w, { rows: rowsOf([[L.dob, p.dob], [L.tob, p.tob], [L.place, p.place]]), size: 9.4, labelFrac: 0.42 });
    });
    // Centre ornament between the two partners.
    var cx = W / 2, cy = y + 60;
    doc.circle(page, cx, cy, 13, { fill: HEX.goldPale });
    doc.circle(page, cx, cy, 13, { stroke: HEX.gold, lw: 0.9 });
    doc.diamond(page, cx, cy, 6, HEX.orange);
    doc.text(page, L.preparedBy, W / 2, KP.H - 84, { size: 10.5, weight: 600, color: HEX.orangeDeep, align: "center" });
    doc.text(page, L.generatedOn + ": " + fmtDate(new Date(), c.lang), W / 2, KP.H - 68, { size: 8.6, color: HEX.muted, align: "center" });
  }

  function pageBirth(doc, R, c) {
    var L = c.L, M = c.M, S = c.S;
    doc.section(M.secBirth);
    var rows = function (p) {
      var a = p.astro || {};
      return rowsOf([
        [L.name, p.name], [L.gender, c.t(p.gender)], [L.dob, p.dob], [L.tob, p.tob], [L.place, p.place],
        [L.lat, p.lat], [L.lon, p.lon], [L.tz, p.tz], [L.lagna, c.t(a.ascendant)], [L.moonSign, c.t(a.sign)],
        [L.rashiLord, c.t(a.SignLord)], [L.nakshatra, c.t(a.Naksahtra)], [S.charan, clean(a.Charan)], [L.nakLord, c.t(a.NaksahtraLord)]
      ]);
    };
    twin(doc, c, rows(R.groom), rows(R.bride), { size: 8.6 });
    var g = R.groom.astro || {}, b = R.bride.astro || {};
    var attrs = [
      [S.varna, "Varna"], [S.vashya, "Vashya"], [S.yoni, "Yoni"], [S.gan, "Gan"], [S.nadi, "Nadi"], [S.tatva, "tatva"],
      [S.paya, "paya"], [S.yunja, "yunja"], [S.nameAlphabet, "name_alphabet"], [S.tithi, "Tithi"], [S.yoga, "Yog"], [S.karana, "Karan"]
    ].filter(function (a) { return has(g[a[1]]) || has(b[a[1]]); });
    if (attrs.length) {
      doc.heading(M.astroCompare, { keep: 120 });
      doc.table({
        columns: [{ label: M.attribute, w: 1.2, align: "left" }, { label: sideTitle(c, "groom"), w: 1.4 }, { label: sideTitle(c, "bride"), w: 1.4 }],
        rows: attrs.map(function (a) { return [{ t: a[0], weight: 600 }, c.t(g[a[1]]), c.t(b[a[1]])]; }), size: 8.8
      });
    }
  }

  function pageOverview(doc, R, c) {
    var L = c.L, M = c.M;
    doc.section(M.secOverview);
    doc.para(M.overviewIntro, { size: 9.2, gap: 12 });
    var t = R.total;
    var boxH = 170;
    if (t && num(t.received) !== null) {
      doc.ensure(boxH);
      var page = doc.page, y = doc.y;
      doc.rect(page, MARGIN, y, CW, boxH, { r: 8, fill: HEX.rowA });
      doc.rect(page, MARGIN, y, CW, boxH, { r: 8, stroke: HEX.goldLight, lw: 0.9 });
      doc.scoreRing(page, MARGIN + 100, y + 78, 52, fmtNum(t.received), fmtNum(t.outOf), M.gunas, null);
      doc.text(page, M.totalScore, MARGIN + 100, y + 158, { size: 9.4, weight: 700, color: HEX.inkSoft, align: "center" });
      var x = MARGIN + 210, w = CW - 230;
      var ty = y + 26;
      doc.text(page, M.siteResult, x, ty, { size: 9, weight: 600, color: HEX.muted });
      ty += 20;
      if (R.banner) {
        doc.text(page, R.banner.title, x, ty, { size: 15, weight: 700, color: R.banner.ok ? HEX.green : HEX.maroon, maxW: w });
        ty += 18;
        if (has(R.banner.body)) { ty += doc.textBlock(page, x, ty, w, R.banner.body, { size: 9.4 }); }
      } else {
        doc.text(page, M.scoreOutOf(fmtNum(t.received), fmtNum(t.outOf)), x, ty, { size: 13, weight: 700, color: HEX.ink, maxW: w });
      }
      ty += 14;
      var minReq = num(t.minRequired);
      if (minReq !== null) {
        doc.text(page, M.minRequired + ": " + fmtNum(minReq) + " / " + fmtNum(t.outOf), x, ty + 6, { size: 9.4, weight: 600, color: HEX.inkSoft });
        doc.bar(page, x, ty + 16, w, 8, num(t.received) / num(t.outOf));
        var mx = x + w * minReq / num(t.outOf);
        doc.line(page, mx, ty + 12, mx, ty + 28, { color: HEX.maroon, lw: 1.2 });
      }
      doc.y = y + boxH + 16;
    }
    var g = R.groom.astro || {}, b = R.bride.astro || {};
    doc.heading(M.comparison, { keep: 120 });
    doc.table({
      columns: [{ label: M.indicator, w: 1.2, align: "left" }, { label: sideTitle(c, "groom"), w: 1.4 }, { label: sideTitle(c, "bride"), w: 1.4 }],
      rows: [
        [L.moonSign, c.t(g.sign), c.t(b.sign)], [L.nakshatra, c.t(g.Naksahtra), c.t(b.Naksahtra)], [L.lagna, c.t(g.ascendant), c.t(b.ascendant)],
        [L.rashiLord, c.t(g.SignLord), c.t(b.SignLord)]
      ].filter(function (r) { return has(r[1]) || has(r[2]); }).map(function (r) { return [{ t: r[0], weight: 600 }, { t: r[1], weight: 700 }, { t: r[2], weight: 700 }]; }),
      size: 9, minRow: 24
    });
    var d = R.dosha, gm = R.groom.manglik, bm = R.bride.manglik;
    doc.heading(M.indicators, { keep: 70 });
    doc.tiles([
      gm ? { label: c.L.groom + " · " + M.manglikStatusSite, value: gm.isPresent ? M.isManglik : M.notManglik } : null,
      bm ? { label: c.L.bride + " · " + M.manglikStatusSite, value: bm.isPresent ? M.isManglik : M.notManglik } : null,
      { label: M.manglikMatch, value: yesNo(d.manglikMatch, c) },
      { label: M.rajju, value: yesNo(d.rajjuDosha, c) },
      { label: M.vedha, value: yesNo(d.vedhaDosha, c) }
    ].filter(Boolean), { cols: 5, h: 50, valueSize: 10.5 });
  }

  function pageAshtakoot(doc, R, c) {
    var M = c.M;
    var keys = KOOTAS.filter(function (k) { return R.koota[k]; });
    if (!keys.length) return;
    doc.section(M.secAshtakoot);
    var rowH = 50;
    keys.forEach(function (k) {
      var r = R.koota[k];
      doc.ensure(rowH);
      var page = doc.page, y = doc.y;
      doc.rect(page, MARGIN, y, CW, rowH - 8, { r: 6, fill: HEX.rowA });
      doc.rect(page, MARGIN, y, CW, rowH - 8, { r: 6, stroke: HEX.goldLight, lw: 0.8 });
      doc.rect(page, MARGIN, y + 6, 3, rowH - 20, { r: 1.5, fill: HEX.orange });
      doc.text(page, kootaName(c, k), MARGIN + 14, y + 17, { size: 10.5, weight: 700, color: HEX.orangeDeep, maxW: 150 });
      doc.text(page, clean(r.area), MARGIN + 14, y + 32, { size: 7.8, color: HEX.muted, maxW: 170 });
      doc.text(page, c.t(r.male) + "  ·  " + c.t(r.female), MARGIN + 196, y + 17, { size: 8.4, weight: 600, color: HEX.inkSoft, maxW: 150 });
      var frac = num(r.outOf) ? num(r.received) / num(r.outOf) : 0;
      doc.bar(page, MARGIN + 196, y + 25, CW - 196 - 80, 8, frac);
      doc.text(page, scoreText(r), MARGIN + CW - 14, y + 27, { size: 12, weight: 700, color: HEX.ink, align: "right" });
      doc.y += rowH;
    });
    var t = R.total;
    if (t) {
      doc.ensure(52);
      var page = doc.page, y = doc.y;
      doc.rect(page, MARGIN, y, CW, 42, { r: 6, fill: HEX.orange });
      doc.text(page, M.total, MARGIN + 16, y + 26, { size: 12, weight: 700, color: HEX.white });
      doc.bar(page, MARGIN + 196, y + 17, CW - 196 - 80, 8, num(t.outOf) ? num(t.received) / num(t.outOf) : 0, HEX.white);
      doc.text(page, fmtNum(t.received) + " / " + fmtNum(t.outOf), MARGIN + CW - 14, y + 27, { size: 14, weight: 700, color: HEX.white, align: "right" });
      doc.y += 56;
    }
  }

  function pageKootaPair(doc, R, c, title, a, b) {
    if (!R.koota[a] && !R.koota[b]) return;
    doc.section(title);
    kootaBlock(doc, R, c, a);
    kootaBlock(doc, R, c, b);
  }

  function pageComplete(doc, R, c) {
    var M = c.M, L = c.L;
    var keys = KOOTAS.filter(function (k) { return R.koota[k]; });
    if (!keys.length) return;
    doc.section(M.secComplete);
    var rows = keys.map(function (k) {
      var r = R.koota[k];
      return [{ t: kootaName(c, k), weight: 700, color: HEX.orangeDeep }, c.t(r.male), c.t(r.female), { t: fmtNum(r.received), weight: 700 }, fmtNum(r.outOf), { t: clean(r.observation) || clean(r.area), color: HEX.inkSoft }];
    });
    if (R.total) rows.push([{ t: M.total, weight: 700 }, "", "", { t: fmtNum(R.total.received), weight: 700 }, { t: fmtNum(R.total.outOf), weight: 700 }, ""]);
    doc.table({
      columns: [{ label: M.koota, w: 1.05, align: "left" }, { label: c.L.groom, w: 0.95 }, { label: c.L.bride, w: 0.95 }, { label: M.score, w: 0.6 }, { label: M.maxScore, w: 0.7 }, { label: L.observation, w: 2.6, align: "left" }],
      rows: rows, size: 8.4, minRow: 26,
      rowFill: function (i) { return R.total && i === rows.length - 1 ? "#FBE6C2" : null; }
    });
    var t = R.total;
    if (t) {
      doc.tiles([
        { label: M.totalScore, value: fmtNum(t.received) },
        { label: M.maxScore, value: fmtNum(t.outOf) },
        num(t.minRequired) !== null ? { label: M.minRequired, value: fmtNum(t.minRequired) } : null
      ].filter(Boolean), { cols: 3, h: 52, valueSize: 16, after: 8 });
    }
    if (has(R.ashtakootReport)) doc.card({ title: M.ashtakootReport, body: R.ashtakootReport, size: 9.2 });
  }

  function pagePlanets(doc, R, c, side) {
    var p = R[side], M = c.M;
    if (!p.planets.length) return;
    doc.section(side === "groom" ? M.secGroomPlanets : M.secBridePlanets);
    doc.para(sideTitle(c, side) + "  ·  " + (p.name || ""), { size: 10.5, weight: 700, color: HEX.inkSoft, gap: 8, justify: false });
    var asc = planetOf(p, "Ascendant");
    var list = p.planets.filter(function (x) { return x.name !== "Ascendant"; });
    var rows = [];
    if (asc) rows.push([{ t: c.t("Ascendant"), weight: 700, color: PLANET_HEX.Ascendant }, asc.degree, c.t(asc.sign), c.t(asc.signLord), asc.house, c.t(asc.nakshatra), asc.nakshatraPada, c.t(asc.nakshatraLord), "—"]);
    list.forEach(function (x) {
      rows.push([{ t: c.t(x.name), weight: 700, color: PLANET_HEX[x.name] || HEX.ink }, x.degree, c.t(x.sign), c.t(x.signLord), x.house, c.t(x.nakshatra), x.nakshatraPada, c.t(x.nakshatraLord), stateText(x, c) || "—"]);
    });
    doc.table({ columns: KP.planetTableColumns(c), rows: rows, size: 8.2, headSize: 8 });
    doc.heading(c.S.planetCards, { keep: 90 });
    doc.planetCards(KP.planetCardItems(list, c));
  }

  function pageChart(doc, R, c, side) {
    var p = R[side], M = c.M, L = c.L;
    var spec = chartFor(p, c, (side === "groom" ? c.L.groom : c.L.bride) + "  ·  " + c.S.lagnaChart);
    if (!spec) return;
    doc.section(side === "groom" ? M.secGroomChart : M.secBrideChart);
    var s = 300;
    var h = doc.chartHeight(s, spec);
    doc.ensure(h);
    doc.chart(doc.page, W / 2 - s / 2, doc.y, s, spec);
    doc.y += h + 18;
    var a = p.astro || {};
    var moon = planetOf(p, "Moon");
    var meta = rowsOf([
      [L.lagna, c.t(a.ascendant || (p.chart[0] && p.chart[0].sign))], [L.lagnaLord, c.t(KP.signLordOf(a.ascendant || (p.chart[0] && p.chart[0].sign)))],
      [L.moonSign, c.t(a.sign)], [L.nakshatra, c.t(a.Naksahtra)], [L.rashiLord, c.t(a.SignLord)],
      [M.moonHouse, moon ? houseLabel(moon.house, c) : ""]
    ]);
    var houses = p.chart.map(function (hh, i) {
      var names = (hh.planets || []).map(function (ab) { return c.t(KP.abbrToName(ab) || ab); });
      return [(i + 1) + "  ·  " + c.t(hh.sign), names.join(", ") || "—"];
    });
    doc.kvColumns([{ title: M.chartMeta, rows: meta, size: 8.8 }, { title: M.houseTable, rows: houses, size: 8.2, labelFrac: 0.5 }]);
  }

  function pageMoon(doc, R, c) {
    var M = c.M, L = c.L;
    doc.section(M.secMoon);
    var rows = function (p) {
      var a = p.astro || {}, m = planetOf(p, "Moon") || {};
      return rowsOf([
        [L.moonSign, c.t(a.sign || m.sign)], [M.moonDeg, m.degree], [M.moonNak, c.t(a.Naksahtra || m.nakshatra)],
        [L.pada, clean(a.Charan) || clean(m.nakshatraPada)], [L.nakLord, c.t(a.NaksahtraLord || m.nakshatraLord)],
        [L.rashiLord, c.t(a.SignLord || m.signLord)], [M.moonHouse, houseLabel(m.house, c)]
      ]);
    };
    twin(doc, c, rows(R.groom), rows(R.bride));
    var keys = ["tara", "yoni", "maitri", "gan", "bhakut", "nadi"].filter(function (k) { return R.koota[k]; });
    if (keys.length) {
      doc.heading(M.moonKootas, { keep: 120 });
      doc.table({
        columns: [{ label: M.koota, w: 1.1, align: "left" }, { label: sideTitle(c, "groom"), w: 1.2 }, { label: sideTitle(c, "bride"), w: 1.2 }, { label: M.score, w: 0.9 }, { label: M.areaOfLife, w: 1.8, align: "left" }],
        rows: keys.map(function (k) { var r = R.koota[k]; return [{ t: kootaName(c, k), weight: 700, color: HEX.orangeDeep }, c.t(r.male), c.t(r.female), { t: scoreText(r), weight: 700 }, { t: clean(r.area), color: HEX.inkSoft }]; }),
        size: 8.8, minRow: 26
      });
    }
  }

  function manglikRows(p, c) {
    var M = c.M, L = c.L, m = p.manglik, mars = planetOf(p, "Mars");
    return rowsOf([
      [M.manglikStatusSite, m ? (m.isPresent ? M.isManglik : M.notManglik) : ""],
      [M.manglikStrength, m ? c.t(m.status) : ""],
      [M.manglikPct, m && num(m.percentagePresent) !== null ? fmtNum(m.percentagePresent) + "%" : ""],
      [M.afterCancel, m && num(m.percentageAfterCancellation) !== null ? fmtNum(m.percentageAfterCancellation) + "%" : ""],
      [c.S.cancelled, m ? yesNo(m.isCancelled, c) : ""],
      [M.marsSign, mars ? c.t(mars.sign) : ""], [M.marsHouse, mars ? houseLabel(mars.house, c) : ""],
      [M.marsDegree, mars ? mars.degree : ""], [M.marsNak, mars ? c.t(mars.nakshatra) : ""]
    ]);
  }

  function pageManglik(doc, R, c) {
    var M = c.M;
    if (!R.groom.manglik && !R.bride.manglik) return;
    doc.section(M.secManglik);
    doc.para(c.S.explain.manglik, { size: 9.2, gap: 12 });
    twin(doc, c, manglikRows(R.groom, c), manglikRows(R.bride, c), { labelFrac: 0.5 });
    doc.heading(M.manglikMatch, { keep: 90 });
    doc.tiles([
      { label: M.manglikMatch, value: yesNo(R.dosha.manglikMatch, c) },
      R.groom.manglik ? { label: c.L.groom, value: R.groom.manglik.isPresent ? M.isManglik : M.notManglik } : null,
      R.bride.manglik ? { label: c.L.bride, value: R.bride.manglik.isPresent ? M.isManglik : M.notManglik } : null
    ].filter(Boolean), { cols: 3, h: 50, valueSize: 11.5, after: 6 });
    if (has(R.manglikConclusion)) doc.card({ title: M.manglikReport, body: R.manglikConclusion, size: 9.2 });
  }

  function pageManglikDetail(doc, R, c) {
    var M = c.M;
    var g = R.groom.manglik, b = R.bride.manglik;
    if (!g && !b) return;
    doc.section(M.secManglikDetail);
    var arr = function (m, k) { return m && Array.isArray(m[k]) ? m[k].map(textOf).filter(has) : []; };
    twinLists(doc, c, M.basedOnHouse, arr(g, "basedOnHouse"), arr(b, "basedOnHouse"));
    twinLists(doc, c, M.basedOnAspect, arr(g, "basedOnAspect"), arr(b, "basedOnAspect"));
    twinLists(doc, c, M.cancellation, arr(g, "cancelRules"), arr(b, "cancelRules"), M.noCancellation);
    var reports = [g && has(textOf(g.report)) ? { title: sideTitle(c, "groom") + "  ·  " + c.S.conclusion, body: textOf(g.report), size: 8.8 } : null,
      b && has(textOf(b.report)) ? { title: sideTitle(c, "bride") + "  ·  " + c.S.conclusion, body: textOf(b.report), size: 8.8 } : null].filter(Boolean);
    if (reports.length) doc.cardGrid(reports, 2);
  }

  function pageDosha(doc, R, c) {
    var M = c.M, d = R.dosha;
    doc.section(M.secDosha);
    var rows = [];
    var t = R.total;
    if (t || num(d.ashtakootPoints) !== null) {
      var pts = num(d.ashtakootPoints) !== null ? d.ashtakootPoints : (t ? t.received : null);
      rows.push([M.ashtakootPass, fmtNum(pts) + (t ? " / " + fmtNum(t.outOf) : ""), t && num(t.minRequired) !== null ? M.minRequired + ": " + fmtNum(t.minRequired) : ""]);
    }
    var gm = R.groom.manglik, bm = R.bride.manglik;
    if (d.manglikMatch !== null && d.manglikMatch !== undefined) {
      rows.push([M.manglikMatch, yesNo(d.manglikMatch, c), [gm && num(gm.percentagePresent) !== null ? c.L.groom + " " + fmtNum(gm.percentagePresent) + "%" : "", bm && num(bm.percentagePresent) !== null ? c.L.bride + " " + fmtNum(bm.percentagePresent) + "%" : ""].filter(has).join("  ·  ")]);
    }
    if (d.rajjuDosha !== null && d.rajjuDosha !== undefined) rows.push([M.rajju, yesNo(d.rajjuDosha, c), ""]);
    if (d.vedhaDosha !== null && d.vedhaDosha !== undefined) rows.push([M.vedha, yesNo(d.vedhaDosha, c), ""]);
    ["bhakut", "nadi"].forEach(function (k) {
      var r = R.koota[k];
      if (r) rows.push([kootaName(c, k) + " (" + M.koota + ")", scoreText(r), c.t(r.male) + "  ·  " + c.t(r.female)]);
    });
    if (rows.length) {
      doc.table({
        columns: [{ label: M.indicator, w: 1.4, align: "left" }, { label: M.result, w: 1 }, { label: M.details, w: 2, align: "left" }],
        rows: rows.map(function (r) { return [{ t: r[0], weight: 700 }, { t: r[1], weight: 700, color: HEX.orangeDeep }, { t: r[2] || "—", color: HEX.inkSoft }]; }),
        size: 9.2, minRow: 30
      });
    }
    if (has(d.conclusionReport)) doc.card({ title: M.doshaReport, body: textOf(d.conclusionReport), size: 9.2 });
    if (has(R.manglikConclusion)) doc.card({ title: M.manglikReport, body: R.manglikConclusion, size: 9.2 });
  }

  function pageSummary(doc, R, c) {
    var M = c.M, L = c.L, d = R.dosha;
    doc.section(M.secSummary);
    doc.tiles([
      { label: sideTitle(c, "groom"), value: R.groom.name },
      { label: sideTitle(c, "bride"), value: R.bride.name }
    ], { cols: 2, h: 52, valueSize: 13, after: 8 });
    var t = R.total;
    if (t && num(t.received) !== null) {
      var boxH = 128;
      doc.ensure(boxH);
      var page = doc.page, y = doc.y;
      doc.rect(page, MARGIN, y, CW, boxH, { r: 8, fill: HEX.rowA });
      doc.rect(page, MARGIN, y, CW, boxH, { r: 8, stroke: HEX.goldLight, lw: 0.9 });
      doc.scoreRing(page, MARGIN + 80, y + 62, 40, fmtNum(t.received), fmtNum(t.outOf), M.gunas, null);
      var x = MARGIN + 170, w = CW - 190, ty = y + 26;
      doc.text(page, M.verdict, x, ty, { size: 9, weight: 600, color: HEX.muted });
      ty += 20;
      if (R.banner) {
        doc.text(page, R.banner.title, x, ty, { size: 15, weight: 700, color: R.banner.ok ? HEX.green : HEX.maroon, maxW: w });
        ty += 16;
        if (has(R.banner.body)) doc.textBlock(page, x, ty, w, R.banner.body, { size: 9.2 });
      } else {
        doc.text(page, M.scoreOutOf(fmtNum(t.received), fmtNum(t.outOf)), x, ty, { size: 13, weight: 700, color: HEX.ink, maxW: w });
      }
      doc.y = y + boxH + 14;
    }
    var keys = KOOTAS.filter(function (k) { return R.koota[k]; });
    var kootaRows = keys.map(function (k) { return [kootaName(c, k), scoreText(R.koota[k])]; });
    var gm = R.groom.manglik, bm = R.bride.manglik;
    var flags = rowsOf([
      [c.L.groom + " · " + M.manglikStatusSite, gm ? (gm.isPresent ? M.isManglik : M.notManglik) : ""],
      [c.L.bride + " · " + M.manglikStatusSite, bm ? (bm.isPresent ? M.isManglik : M.notManglik) : ""],
      [M.manglikMatch, yesNo(d.manglikMatch, c)], [M.rajju, yesNo(d.rajjuDosha, c)], [M.vedha, yesNo(d.vedhaDosha, c)],
      [c.L.generated, fmtDate(new Date(), c.lang, true)]
    ]);
    doc.kvColumns([kootaRows.length ? { title: M.kootaSummary, rows: kootaRows, valueWeight: 600 } : null, flags.length ? { title: M.indicators, rows: flags, valueWeight: 600, labelFrac: 0.5 } : null]);
    doc.card({ title: L.disclaimerTitle, body: L.disclaimer, size: 8.4, accent: HEX.gold });
    // Closing emblem.
    var emb = 118;
    if (doc.remaining() >= emb) {
      var ey = KP.CONTENT_BOTTOM - emb;
      doc.ornamentRule(doc.page, W / 2, ey + 4, 150);
      doc.logo(doc.page, W / 2 - 34, ey + 16, 68);
      doc.text(doc.page, L.preparedBy, W / 2, ey + 100, { size: 10, weight: 700, color: HEX.orangeDeep, align: "center" });
      doc.text(doc.page, L.generatedOn + ": " + fmtDate(new Date(), c.lang, true), W / 2, ey + 114, { size: 8.4, color: HEX.muted, align: "center" });
    }
  }

  // ------------------------------------------------------------------
  // Entry
  // ------------------------------------------------------------------
  KP.renderMilan = function (R) {
    var doc;
    return KP.createDoc(R.lang).then(function (d) {
      doc = d;
      return KP.fetchImageScaled("Kundli%20planet%20assets/ganesh.png", 720, "image/png").then(function (s) { return doc.embedImage(s); }).catch(function () { return null; });
    }).then(function (ganesh) {
      var c = ctx(R), M = c.M;
      doc.pageOf = c.L.pageOf;
      doc.footerCenter = [R.groom.name, R.bride.name].filter(has).join(" & ") + "  ·  " + c.L.milanFooter;
      pageCover(doc, R, c, ganesh);
      pageBirth(doc, R, c);
      pageOverview(doc, R, c);
      pageAshtakoot(doc, R, c);
      pageKootaPair(doc, R, c, M.secVarnaVashya, "varna", "vashya");
      pageKootaPair(doc, R, c, M.secTaraYoni, "tara", "yoni");
      pageKootaPair(doc, R, c, M.secMaitriGana, "maitri", "gan");
      pageKootaPair(doc, R, c, M.secBhakootNadi, "bhakut", "nadi");
      pageComplete(doc, R, c);
      pagePlanets(doc, R, c, "groom");
      pagePlanets(doc, R, c, "bride");
      pageChart(doc, R, c, "groom");
      pageChart(doc, R, c, "bride");
      pageMoon(doc, R, c);
      pageManglik(doc, R, c);
      pageManglikDetail(doc, R, c);
      pageDosha(doc, R, c);
      pageSummary(doc, R, c);
      doc.finalize();
      doc.pdf.setTitle([R.groom.name, R.bride.name].filter(has).join(" & ") + " - Kundli Milan | KundliPlanet");
      doc.pdf.setAuthor("KundliPlanet");
      doc.pdf.setCreator("KundliPlanet");
      doc.pdf.setProducer("KundliPlanet");
      doc.pdf.setSubject("Kundli Milan - Horoscope Compatibility Report");
      try { doc.pdf.setLanguage(R.lang === "hi" ? "hi-IN" : "en-IN"); } catch (e) { /* older pdf-lib */ }
      return doc.save();
    });
  };
})(window);

/* KundliPlanet PDF - Individual Kundli (Janam Kundli) report.
   normalizeKundli() turns the page's existing state (the `kt` view-model
   plus the raw API responses already held in state) into a render model;
   renderKundli() lays that model out page by page. No astrology value is
   calculated here: every value comes from the existing calculation/API
   layer, and any section whose data is missing is simply left out. */
(function (global) {
  "use strict";

  var KP = global.KPPDF;
  var clean = KP.clean, has = KP.has, HEX = KP.HEX, PLANET_HEX = KP.PLANET_HEX;
  var MARGIN = KP.MARGIN, CW = KP.CW, W = KP.W;

  var stateText = KP.planetState, houseLabel = KP.houseLabel, planetCardItems = KP.planetCardItems;
  var textOf = KP.textOf, fmtDate = KP.fmtDate, fmtBirthDate = KP.fmt.birthDate, fmtTime = KP.fmt.time, fmtCoord = KP.fmt.coord, fmtTz = KP.fmt.tz;

  function list(v) {
    return Array.isArray(v) ? v.map(textOf).filter(has) : [];
  }


  // ------------------------------------------------------------------
  // Normalization
  // ------------------------------------------------------------------
  KP.normalizeKundli = function (kt, K, lang) {
    kt = kt || {}; K = K || {};
    var T = kt.t || {};
    var NA = T.naText;
    var v = function (x) { var s = clean(x); return (!s || s === NA || s === "--") ? "" : s; };
    var ok = function (key) { return K[key] && K[key].status === "success" && K[key].data ? K[key].data : null; };
    var rep = K.report || null;
    var basic = (rep && rep.basicDetails) || (kt.report && kt.report.basicDetails) || {};
    var det = (rep && rep.kundliDetails) || (kt.report && kt.report.kundliDetails) || {};
    var person = K.person || {};
    var E = global.KundliEngine || {};

    // Site verdicts: the page's own present/absent decision for each dosha.
    var verdict = function (card, yesText) {
      return card && card.isSuccess ? { yes: card.verdict === yesText, detail: v(card.detail) } : null;
    };

    var planets = (rep && rep.planets) || [];
    var dashaMajor = ok("majorDasha") && E.buildMajorDashaRows ? E.buildMajorDashaRows(ok("majorDasha")).filter(function (r) { return r.start && r.end; }) : [];
    var cur = ok("currentDasha");
    var parse = E.parseApiDashaDate || function () { return null; };
    var levels = cur ? ["major", "minor", "sub_minor", "sub_sub_minor", "sub_sub_sub_minor"].map(function (k) {
      var l = cur[k];
      return l && l.planet ? { planet: clean(l.planet), start: parse(l.start), end: parse(l.end) } : null;
    }) : [];

    var gemRaw = ok("gemstone");
    var gemImgs = (kt.gemstone && kt.gemstone.categories) || [];
    var gems = [];
    if (gemRaw) {
      var idx = 0;
      ["LIFE", "BENEFIC", "LUCKY"].forEach(function (k) {
        if (!gemRaw[k]) return;
        gems.push({ key: k, data: gemRaw[k], image: gemImgs[idx] ? gemImgs[idx].image : null });
        idx++;
      });
    }

    var nak = kt.nakshatraPrediction && kt.nakshatraPrediction.isSuccess ? (kt.nakshatraPrediction.categories || []) : [];
    var NP_KEYS = { npHealth: "health", npEmotions: "emotions", npProfession: "profession", npLuck: "luck", npPersonalLife: "personal_life", npTravel: "travel" };
    var nakByKey = {};
    nak.forEach(function (cat) {
      Object.keys(NP_KEYS).forEach(function (lk) { if (T[lk] && T[lk] === cat.label) nakByKey[NP_KEYS[lk]] = cat; });
    });

    return {
      lang: lang,
      T: T,
      person: {
        name: v(basic.name) || clean(person.name),
        gender: v(basic.gender) || clean(person.gender),
        dob: fmtBirthDate(person, lang) || v(basic.birthDate),
        tob: fmtTime(person) || v(basic.birthTime),
        place: clean(person.city) || v(basic.birthPlace),
        lat: fmtCoord(person.lat, KP.cardinal(lang)[0], KP.cardinal(lang)[1]),
        lon: fmtCoord(person.lon, KP.cardinal(lang)[2], KP.cardinal(lang)[3]),
        tz: fmtTz(person.tzone, lang)
      },
      basic: {
        ascendant: v(basic.ascendant), rashi: v(basic.rashi), nakshatra: v(basic.nakshatra)
      },
      det: {
        nakshatraLord: v(det.nakshatraLord), charan: v(det.charan), yog: v(det.yog), karan: v(det.karan), tithi: v(det.tithi),
        tattva: v(det.tattva), yunja: v(det.yunja), paya: v(det.paya), nameAlphabet: v(det.nameAlphabet), varna: v(det.varna),
        gan: v(det.gan), nadi: v(det.nadi), signLord: v(det.signLord), vashya: v(det.vashya), yoni: v(det.yoni), ascendantLord: v(det.ascendantLord)
      },
      planets: planets,
      ascendant: rep && rep.ascendant ? rep.ascendant : null,
      charts: rep && rep.charts ? rep.charts : null,
      verdicts: {
        manglik: verdict(kt.manglik, T.verdictPresent),
        kaalSarp: verdict(kt.kaalSarp, T.verdictPresent),
        sadeSati: verdict(kt.sadeSati, T.verdictActive),
        pitra: verdict(kt.pitraDosh, T.verdictPresent)
      },
      manglik: ok("manglik"),
      kalsarp: ok("kalsarp"),
      pitra: ok("pitraDosh"),
      sadeSati: ok("sadeSatiStatus"),
      sadeSatiRemedies: ok("sadeSatiRemedies"),
      dasha: { major: dashaMajor, levels: levels },
      gems: gems,
      rudraksha: ok("rudraksha"),
      numerology: ok("numerology"),
      nakPrediction: nak,
      nakByKey: nakByKey,
      birth: person.year ? new Date(person.year, (person.month || 1) - 1, person.day || 1, person.hour || 0, person.min || 0) : null,
      siteText: { remediesManglik: v(T.remediesManglik), remediesKaalSarp: v(T.remediesKaalSarp), remediesFooter: v(T.remediesFooter), remediesPitra: v(T.remediesPitraDosh), remediesSadeSati: v(T.remediesSadeSatiListIntro) }
    };
  };

  // ------------------------------------------------------------------
  // Shared renderer helpers
  // ------------------------------------------------------------------
  function ctx(R) {
    var lang = R.lang;
    var L = KP.L[lang] || KP.L.en, S = KP.K[lang] || KP.K.en;
    var t = function (x) { return KP.term(x, lang); };
    var byName = {};
    (R.planets || []).forEach(function (p) { byName[p.name] = p; });
    return { lang: lang, L: L, S: S, t: t, byName: byName };
  }

  function planetName(name, c) { return c.t(name); }

  function chartSpec(R, c, key, opts) {
    var ch = R.charts && R.charts[key];
    if (!ch || !ch.houses || ch.houses.length !== 12 || !ch.houses[0].sign) return null;
    return {
      title: opts.title, caption: opts.caption, ascLabel: c.L.asc, retroMark: c.S.retroMark,
      houses: ch.houses.map(function (h, i) {
        return {
          sign: KP.signNumber(h.sign),
          asc: !!opts.asc && i === 0,
          planets: (h.planets || []).map(function (ab) {
            var name = KP.abbrToName(ab);
            var p = name ? c.byName[name] : null;
            return {
              label: KP.planetAbbr(name || ab, c.lang),
              color: PLANET_HEX[name] || HEX.ink,
              deg: opts.deg && p && typeof p.degreeInSign === "number" ? Math.floor(p.degreeInSign) + "°" : "",
              retro: !!(p && p.retrograde)
            };
          })
        };
      })
    };
  }



  // Occupants and lord placement read from the Lagna chart houses.
  function houseInfo(R, c, n) {
    var ch = R.charts && R.charts.lagna;
    if (!ch || !ch.houses || !ch.houses[n - 1]) return null;
    var h = ch.houses[n - 1];
    var lord = KP.signLordOf(h.sign);
    var lordHouse = null;
    if (lord) {
      ch.houses.forEach(function (hh, i) {
        (hh.planets || []).forEach(function (ab) { if (KP.abbrToName(ab) === lord) lordHouse = i + 1; });
      });
    }
    var occ = (h.planets || []).map(function (ab) { return KP.abbrToName(ab); }).filter(Boolean);
    return { sign: h.sign, lord: lord, lordHouse: lordHouse, occupants: occ };
  }

  // Two stacked key/value tables side by side at the current cursor.
  function kvStack(doc, left, right, gap) {
    gap = gap || 18;
    var w = (CW - gap) / 2;
    var colH = function (specs) {
      return specs.filter(Boolean).reduce(function (a, s) { var h = doc.measureKV(w, s).h; return a + (h ? h + 14 : 0); }, 0);
    };
    var h = Math.max(colH(left), colH(right));
    doc.ensure(h);
    var y0 = doc.y;
    [left, right].forEach(function (specs, i) {
      var y = y0;
      specs.filter(Boolean).forEach(function (s) {
        var hh = doc.drawKV(doc.page, MARGIN + i * (w + gap), y, w, s);
        if (hh) y += hh + 14;
      });
    });
    doc.y = y0 + h;
  }

  function rowsOf(pairs) { return pairs.filter(function (p) { return has(p[1]); }); }

  // Chart on one side, explanation + details table on the other.
  function chartRow(doc, spec, side, title, body, kvSpec, s) {
    if (!spec) return;
    s = s || 250;
    var chartH = doc.chartHeight(s, spec);
    var gap = 22;
    var tw = CW - s - gap - 10;
    var textH = 24 * doc.fs + doc.measureBlock(tw, body, { size: 9 }) + 12 + (kvSpec ? doc.measureKV(tw, kvSpec).h : 0);
    var h = Math.max(chartH, textH) + 6;
    doc.ensure(h);
    var y = doc.y;
    var chartX = side === "right" ? MARGIN + CW - s - 5 : MARGIN + 5;
    var textX = side === "right" ? MARGIN : MARGIN + s + gap + 10;
    doc.chart(doc.page, chartX, y + 2, s, spec);
    var ty = y + Math.max(0, (chartH - textH) / 2 - 6);
    ty += doc.miniTitle(doc.page, textX, ty, tw, title);
    ty += doc.textBlock(doc.page, textX, ty, tw, body, { size: 9 }) + 12;
    if (kvSpec) doc.drawKV(doc.page, textX, ty, tw, kvSpec);
    doc.y = y + h + 16;
  }

  // Large centred chart followed by an explanation + details row beneath it.
  function chartBlock(doc, spec, s, title, body, kvSpec) {
    var chartH = doc.chartHeight(s, spec);
    doc.ensure(chartH + 10);
    doc.chart(doc.page, W / 2 - s / 2, doc.y, s, spec);
    doc.y += chartH + 20;
    var gap = 20, w = (CW - gap) / 2;
    var textH = 24 * doc.fs + doc.measureBlock(w, body, { size: 9 });
    var kvH = kvSpec ? doc.measureKV(w, kvSpec).h : 0;
    var h = Math.max(textH, kvH);
    doc.ensure(h);
    var y = doc.y;
    var ty = y + doc.miniTitle(doc.page, MARGIN, y, w, title);
    doc.textBlock(doc.page, MARGIN, ty, w, body, { size: 9 });
    if (kvSpec) doc.drawKV(doc.page, MARGIN + w + gap, y, w, kvSpec);
    doc.y = y + h + 14;
  }

  function namesOf(arr, c) { return arr.map(function (nm) { return planetName(nm, c); }).join(", "); }

  // ------------------------------------------------------------------
  // Pages
  // ------------------------------------------------------------------
  function pageCover(doc, R, c, ganesh) {
    var page = doc.addPage("cover");
    var L = c.L;
    doc.coverFrame(page);
    // Auspicious opening: Lord Ganesha, the invocation, then the logo.
    var y = 42;
    if (ganesh) {
      doc.imageFit(page, ganesh, W / 2 - 64, y, 128, 122);
      y += 122;
    }
    doc.text(page, L.invocation, W / 2, y + 26, { size: 15, weight: 700, color: HEX.orangeDeep, align: "center", abs: true });
    y += 38;
    doc.logo(page, W / 2 - 66, y, 132);
    y += 132;
    doc.ornamentRule(page, W / 2, y + 12, 120);
    var bandY = y + 26, bandH = 96;
    doc.rect(page, 26, bandY, W - 52, bandH, { fill: HEX.orange });
    doc.line(page, 26, bandY + 6, W - 26, bandY + 6, { color: "#F6D59A", lw: 0.6 });
    doc.line(page, 26, bandY + bandH - 6, W - 26, bandY + bandH - 6, { color: "#F6D59A", lw: 0.6 });
    doc.text(page, L.kundliTitle, W / 2, bandY + 46, { size: 30, weight: 700, family: "serif", color: HEX.white, align: "center", abs: true });
    doc.text(page, L.kundliSubtitle, W / 2, bandY + 72, { size: 11.5, color: "#FFF4DE", align: "center", abs: true });
    y = bandY + bandH + 50;
    if (has(R.person.name)) {
      doc.text(page, R.person.name, W / 2, y, { size: 23, weight: 700, family: "serif", color: HEX.ink, align: "center", maxW: W - 120, abs: true });
      y += 18;
    }
    doc.ornamentRule(page, W / 2, y, 70);
    y += 22;
    var cardW = 340;
    doc.drawKV(page, W / 2 - cardW / 2, y, cardW, {
      rows: rowsOf([
        [L.gender, c.t(R.person.gender)], [L.dob, R.person.dob], [L.tob, R.person.tob], [L.place, R.person.place]
      ]), size: 9.4, labelFrac: 0.4
    });
    doc.text(page, L.preparedBy, W / 2, KP.H - 76, { size: 10.5, weight: 600, color: HEX.orangeDeep, align: "center", abs: true });
    doc.text(page, L.generatedOn + ": " + fmtDate(new Date(), c.lang), W / 2, KP.H - 60, { size: 8.6, color: HEX.muted, align: "center", abs: true });
  }

  // Page 2: birth details, with the report's contents index filled in at
  // the end (once every section's page number is known).
  function pageBirth(doc, R, c) {
    var L = c.L, S = c.S, d = R.det, b = R.basic;
    doc.section(S.secBirthOnly);
    doc.tiles([
      { label: L.lagna, value: c.t(b.ascendant) },
      { label: L.rashi, value: c.t(b.rashi) },
      { label: L.nakshatra, value: c.t(b.nakshatra) + (has(d.charan) ? " (" + d.charan + ")" : "") }
    ], { cols: 3, h: 52, valueSize: 13, after: 12 });
    doc.kvColumns([{ title: S.birthDetails, size: 9.8, labelFrac: 0.36, valueWeight: 600, rows: rowsOf([
      [L.name, R.person.name], [L.gender, c.t(R.person.gender)], [L.dob, R.person.dob], [L.tob, R.person.tob],
      [L.place, R.person.place], [L.lat, R.person.lat], [L.lon, R.person.lon], [L.tz, R.person.tz]
    ]) }], { after: 18 });
    doc.heading(S.contents, { keep: 200 });
    return { page: doc.page, y: doc.y };
  }

  function paintContents(doc, c, slot) {
    if (!slot || !doc.toc.length) return;
    var pageWord = c.lang === "hi" ? "पृष्ठ" : "Page";
    var half = Math.ceil(doc.toc.length / 2);
    var gap = 18, w = (CW - gap) / 2;
    var mk = function (arr) { return { rows: arr.map(function (e) { return [e.title, pageWord + " " + e.page]; }), labelFrac: 0.72, size: 8.2 }; };
    var left = mk(doc.toc.slice(0, half)), right = mk(doc.toc.slice(half));
    var avail = KP.CONTENT_BOTTOM - slot.y;
    // Shrink the index slightly if a very long report would not fit.
    var hMax = Math.max(doc.measureKV(w, left).h, right.rows.length ? doc.measureKV(w, right).h : 0);
    if (hMax > avail) { left.size = right.size = 8.2 * avail / hMax * 0.98; }
    doc.drawKV(slot.page, MARGIN, slot.y, w, left);
    if (right.rows.length) doc.drawKV(slot.page, MARGIN + w + gap, slot.y, w, right);
  }

  function pagePanchang(doc, R, c) {
    var L = c.L, S = c.S, d = R.det, b = R.basic;
    doc.section(S.secPanchang);
    var sun = c.byName.Sun;
    kvStack(doc, [
      { title: S.lagnaRashi, rows: rowsOf([
        [L.lagna, c.t(b.ascendant)], [L.lagnaLord, c.t(d.ascendantLord)], [L.rashi, c.t(b.rashi)],
        [L.rashiLord, c.t(d.signLord)], [L.sunSign, sun ? c.t(sun.sign) : ""]
      ]) },
      { title: S.panchang, rows: rowsOf([
        [S.tithi, c.t(d.tithi)], [S.yoga, c.t(d.yog)], [S.karana, c.t(d.karan)], [L.nakshatra, c.t(b.nakshatra)],
        [S.charan, d.charan], [L.nakLord, c.t(d.nakshatraLord)], [S.tatva, c.t(d.tattva)]
      ]) }
    ], [
      { title: S.avakahada, rows: rowsOf([
        [S.varna, c.t(d.varna)], [S.vashya, c.t(d.vashya)], [S.yoni, c.t(d.yoni)], [S.gan, c.t(d.gan)],
        [S.nadi, c.t(d.nadi)], [S.yunja, c.t(d.yunja)], [S.paya, c.t(d.paya)], [S.nameAlphabet, d.nameAlphabet]
      ]) }
    ]);
    doc.heading(S.panchangNotesH, { keep: 120 });
    doc.kvColumns([{ rows: S.panchangNotes, labelFrac: 0.22, valueAlign: "left", size: 8.8 }]);
  }

  function planetRows(R, c) {
    var rows = [];
    var a = R.ascendant;
    if (a) rows.push([{ t: c.t("Ascendant"), color: PLANET_HEX.Ascendant, weight: 700 }, a.degree, c.t(a.sign), c.t(a.signLord), "1", c.t(a.nakshatra), a.nakshatraPada, c.t(a.nakshatraLord), "—"]);
    R.planets.forEach(function (p) {
      rows.push([
        { t: planetName(p.name, c), color: PLANET_HEX[p.name] || HEX.ink, weight: 700 },
        p.degree, c.t(p.sign), c.t(p.signLord), p.house, c.t(p.nakshatra), p.nakshatraPada, c.t(p.nakshatraLord), stateText(p, c) || "—"
      ]);
    });
    return rows;
  }

  function pagePlanets(doc, R, c) {
    if (!R.planets.length) return;
    var S = c.S;
    doc.section(S.secPlanets);
    doc.para(S.explain.planets, { size: 9.2, gap: 12 });
    doc.table({ columns: KP.planetTableColumns(c), rows: planetRows(R, c), size: 8.6, headSize: 8.4, minRow: 27 });
    doc.heading(S.stateNotesH, { keep: 150 });
    doc.kvColumns([{ rows: S.stateNotes, labelFrac: 0.24, valueAlign: "left", size: 8.8 }]);
  }

  function pageProfile(doc, R, c) {
    if (!R.planets.length) return;
    var S = c.S, L = c.L;
    doc.section(S.secProfile);
    doc.para(S.explain.profile, { size: 9.2, gap: 12 });
    doc.planetCards(R.planets.map(function (p) {
      return {
        key: p.name,
        name: planetName(p.name, c),
        line1: [c.t(p.sign), houseLabel(p.house, c)].filter(has).join("  ·  "),
        line2: has(p.degree) ? L.degree + ": " + p.degree : "",
        line3: has(p.nakshatra) ? c.t(p.nakshatra) + (has(p.nakshatraPada) ? " (" + L.pada + " " + p.nakshatraPada + ")" : "") : "",
        status: stateText(p, c)
      };
    }), { h: 132 * doc.fs, nameSize: 12.5, lineSize: 9.4, lineGap: 16 });
    var retro = R.planets.filter(function (p) { return p.retrograde; }).map(function (p) { return p.name; });
    var comb = R.planets.filter(function (p) { return p.isSet; }).map(function (p) { return p.name; });
    doc.tiles([
      { label: S.retroPlanets, value: namesOf(retro, c) || S.noneDetected },
      { label: S.combustPlanets, value: namesOf(comb, c) || S.noneDetected }
    ], { cols: 2, h: 50, valueSize: 10.5 });
  }

  function pageD1(doc, R, c) {
    var L = c.L, S = c.S;
    var d1 = chartSpec(R, c, "lagna", { title: S.lagnaChart, deg: true, asc: true });
    if (!d1) return;
    doc.section(S.secD1);
    var a = R.ascendant || {};
    var lordInfo = houseInfo(R, c, 1);
    chartBlock(doc, d1, 380, S.aboutLagna, S.explain.lagna, {
      title: S.lagnaDetails, size: 8.8, rows: rowsOf([
        [L.lagna, c.t(a.sign || R.basic.ascendant)], [S.ascDegree, a.degree], [L.nakshatra, c.t(a.nakshatra)],
        [L.pada, a.nakshatraPada], [L.lagnaLord, c.t(R.det.ascendantLord || (lordInfo && lordInfo.lord))],
        [S.lordPlacedIn, lordInfo && lordInfo.lordHouse ? houseLabel(lordInfo.lordHouse, c) : ""]
      ])
    });
  }

  function navPlacements(R) {
    var nav = R.charts && R.charts.navamsa;
    var out = {};
    if (!nav || !nav.houses) return out;
    nav.houses.forEach(function (h, i) { (h.planets || []).forEach(function (ab) { var n = KP.abbrToName(ab); if (n) out[n] = { sign: h.sign, house: i + 1 }; }); });
    return out;
  }

  function pageD9(doc, R, c) {
    var L = c.L, S = c.S;
    var d9 = chartSpec(R, c, "navamsa", { title: S.navamshaChart, asc: true });
    if (!d9) return;
    doc.section(S.secD9);
    var navLagna = R.charts.navamsa.houses[0] ? R.charts.navamsa.houses[0].sign : "";
    chartRow(doc, d9, "right", S.aboutNavamsha, S.explain.navamsha, {
      title: S.navLagna, size: 8.8,
      rows: rowsOf([[S.navLagna, c.t(navLagna)], [L.lagnaLord + S.d9Tag, c.t(KP.signLordOf(navLagna))]])
    }, 262);
    var pl = navPlacements(R);
    var rows = R.planets.map(function (p) {
      var n = pl[p.name];
      return [{ t: planetName(p.name, c), weight: 700, color: PLANET_HEX[p.name] }, c.t(p.sign), p.house, n ? c.t(n.sign) : "—", n ? String(n.house) : "—"];
    });
    doc.heading(S.d9Placements, { keep: 150 });
    doc.table({
      columns: [{ label: L.planet, w: 1.2 }, { label: L.sign + S.d1Tag, w: 1 }, { label: L.house + S.d1Tag, w: 0.8 }, { label: L.sign + S.d9Tag, w: 1 }, { label: L.house + S.d9Tag, w: 0.8 }],
      rows: rows, size: 8.6, minRow: 22
    });
  }

  function pageMoonSun(doc, R, c) {
    var L = c.L, S = c.S;
    var moon = chartSpec(R, c, "moon", { title: S.moonChart, deg: true });
    var sun = chartSpec(R, c, "sun", { title: S.sunChart, deg: true });
    if (!moon && !sun) return;
    doc.section(S.secMoon);
    var mp = c.byName.Moon || {}, sp = c.byName.Sun || {};
    chartRow(doc, moon, "right", S.moonDetails, S.explain.moon, {
      size: 8.6, rows: rowsOf([
        [L.moonSign, c.t(mp.sign)], [S.moonDegree, mp.degree], [L.nakshatra, c.t(mp.nakshatra)], [L.pada, mp.nakshatraPada],
        [L.nakLord, c.t(mp.nakshatraLord)], [L.house, houseLabel(mp.house, c)]
      ])
    }, 262);
    chartRow(doc, sun, "left", S.sunDetails, S.explain.sun, {
      size: 8.6, rows: rowsOf([
        [L.sunSign, c.t(sp.sign)], [S.sunDegree, sp.degree], [L.nakshatra, c.t(sp.nakshatra)], [L.pada, sp.nakshatraPada],
        [L.house, houseLabel(sp.house, c)], [L.state, stateText(sp, c)]
      ])
    }, 262);
  }

  function houseSpec(R, c, n) {
    var L = c.L, S = c.S;
    var hi = houseInfo(R, c, n);
    if (!hi) return null;
    return {
      title: S.houseCard(n),
      rows: rowsOf([
        [L.sign, c.t(hi.sign)], [S.lordCol, c.t(hi.lord)],
        [S.lordPlacedIn, hi.lordHouse ? houseLabel(hi.lordHouse, c) : ""],
        [S.occupantsCol, namesOf(hi.occupants, c) || "—"],
        [S.signifCol, S.houseSignif[n - 1]]
      ]),
      size: 9.6, labelFrac: 0.42
    };
  }

  function houseCards(doc, R, c, nums) {
    var specs = nums.map(function (n) { return houseSpec(R, c, n); }).filter(Boolean);
    for (var i = 0; i < specs.length; i += 2) doc.kvColumns([specs[i], specs[i + 1] || null], { after: 14 });
  }

  function pageHouses(doc, R, c, from) {
    var S = c.S;
    if (!R.charts || !R.charts.lagna) return;
    doc.section(from === 1 ? S.secHouses1 : S.secHouses2);
    doc.para(from === 1 ? S.explain.houses : S.explain.houses2, { size: 9.2, gap: 12 });
    houseCards(doc, R, c, [from, from + 1, from + 2, from + 3, from + 4, from + 5]);
  }

  function pageGroups(doc, R, c) {
    var S = c.S;
    if (!R.charts || !R.charts.lagna) return;
    doc.section(S.secGroups);
    doc.para(S.explain.groups, { size: 9.2, gap: 12 });
    var info = {};
    for (var n = 1; n <= 12; n++) info[n] = houseInfo(R, c, n);
    var rows = S.houseGroups.map(function (g) {
      var occ = [];
      g.houses.forEach(function (h) { if (info[h]) info[h].occupants.forEach(function (nm) { if (occ.indexOf(nm) === -1) occ.push(nm); }); });
      return [{ t: g.name, weight: 700 }, g.houses.join(", "), { t: namesOf(occ, c) || "—", weight: occ.length ? 600 : 400 }, { t: g.note, color: HEX.inkSoft }];
    });
    doc.table({
      columns: [{ label: S.groupCol, w: 1.3, align: "left" }, { label: S.houseCol, w: 0.85 }, { label: S.occupantsCol, w: 1.45 }, { label: S.meaningCol, w: 2.1, align: "left" }],
      rows: rows, size: 8.6, minRow: 30
    });
    var empty = [];
    for (var k = 1; k <= 12; k++) if (info[k] && !info[k].occupants.length) empty.push(k);
    doc.tiles([
      { label: S.occupiedHouses, value: String(12 - empty.length) },
      { label: S.emptyHouses, value: empty.join(", ") || S.noneDetected }
    ], { cols: 2, h: 50, valueSize: 11 });
  }

  function statusOf(m, maha, now) {
    if (maha && m.planet === maha.planet && maha.start && m.start && Math.abs(m.start - maha.start) < 86400000 * 2) return "running";
    if (m.end < now) return "done";
    if (m.start > now) return "upcoming";
    return maha ? "done" : "running";
  }

  // Proportional band of the Mahadasha periods exactly as dated by the API.
  function dashaBand(doc, R, c) {
    var rows = R.dasha.major, S = c.S;
    var maha = R.dasha.levels[0], now = new Date();
    var bh = 42;
    doc.heading(S.timelineBar, { keep: bh + 30 });
    var page = doc.page, y = doc.y;
    var t0 = rows[0].start.getTime(), t1 = rows[rows.length - 1].end.getTime();
    var x = MARGIN, lastLabelX = -99;
    rows.forEach(function (m, i) {
      var w = CW * (m.end.getTime() - m.start.getTime()) / (t1 - t0);
      var st = statusOf(m, maha, now);
      var fill = st === "running" ? HEX.orangeDeep : st === "done" ? "#E9D6B0" : (i % 2 ? "#F6E3BC" : "#F1D9A6");
      doc.rect(page, x, y, w, bh, { fill: fill });
      if (i > 0) doc.line(page, x, y, x, y + bh, { color: HEX.white, lw: 1 });
      var lab = KP.planetAbbr(m.planet, c.lang);
      if (w > doc.width(lab, 8, 700) + 6) doc.text(page, lab, x + w / 2, y + bh / 2 + 3.5, { size: 8, weight: 700, color: st === "running" ? HEX.white : HEX.ink, align: "center" });
      if (x - lastLabelX >= 32) { doc.text(page, String(m.start.getFullYear()), x, y + bh + 12, { size: 7.4, color: HEX.muted, align: i === 0 ? "left" : "center" }); lastLabelX = x; }
      x += w;
    });
    if (MARGIN + CW - lastLabelX >= 32) doc.text(page, String(rows[rows.length - 1].end.getFullYear()), MARGIN + CW, y + bh + 12, { size: 7.4, color: HEX.muted, align: "right" });
    doc.rect(page, MARGIN, y, CW, bh, { r: 3, stroke: HEX.goldLine, lw: 0.9 });
    doc.y = y + bh + 30;
  }

  var YEAR = 365.2425 * 86400000;
  function one(n) { return Math.round(n * 10) / 10; }
  function yrs(n, c) { return c.lang === "hi" ? n + " वर्ष" : n + " yrs"; }
  function ageRange(m, R, c) {
    if (!R.birth) return "";
    var a0 = Math.max(0, one((m.start - R.birth) / YEAR)), a1 = one((m.end - R.birth) / YEAR);
    return a1 > 0 ? a0 + " – " + yrs(a1, c) : "";
  }
  function statusLabel(st, S) { return st === "running" ? S.running : st === "done" ? S.completed : S.upcoming; }

  function pageDasha(doc, R, c) {
    var L = c.L, S = c.S;
    var lv = R.dasha.levels.filter(Boolean);
    if (!lv.length) return;
    doc.section(S.secDasha);
    doc.para(S.explain.dasha, { size: 9.2, gap: 12 });
    var maha = R.dasha.levels[0], antar = R.dasha.levels[1];
    doc.tiles([
      maha ? { label: S.runningMaha, value: c.t(maha.planet) + "  ·  " + fmtDate(maha.start, c.lang) + " – " + fmtDate(maha.end, c.lang) } : null,
      antar ? { label: S.runningAntar, value: c.t(antar.planet) + "  ·  " + fmtDate(antar.start, c.lang) + " – " + fmtDate(antar.end, c.lang) } : null
    ].filter(Boolean), { cols: 2, h: 54, valueSize: 10.5, after: 12 });
    doc.heading(S.currentDasha, { keep: 150 });
    var rows = [];
    R.dasha.levels.forEach(function (l, i) {
      if (!l) return;
      rows.push([{ t: S.levels[i], weight: 600 }, { t: c.t(l.planet), weight: 700, color: PLANET_HEX[l.planet] || HEX.ink }, fmtDate(l.start, c.lang, true), fmtDate(l.end, c.lang, true)]);
    });
    doc.table({ columns: [{ label: L.level, w: 1.3, align: "left" }, { label: L.planet, w: 1 }, { label: L.start, w: 1.4 }, { label: L.end, w: 1.4 }], rows: rows, size: 9, minRow: 28 });
    doc.heading(S.levelNotesH, { keep: 150 });
    doc.kvColumns([{ rows: S.levels.map(function (lvName, i) { return [lvName, S.levelNotes[i]]; }), labelFrac: 0.26, valueAlign: "left", size: 8.8 }]);
  }

  function pageDashaTimeline(doc, R, c) {
    var S = c.S, L = c.L;
    var rows = R.dasha.major;
    if (!rows.length) return;
    doc.section(S.secDashaTimeline);
    doc.para(S.explain.dashaTimeline, { size: 9.2, gap: 12 });
    dashaBand(doc, R, c);
    var maha = R.dasha.levels[0], now = new Date();
    doc.table({
      columns: [{ label: L.planet, w: 1 }, { label: L.start, w: 1.15 }, { label: L.end, w: 1.15 }, { label: L.period, w: 0.8 }, { label: S.ageCol, w: 1.05 }, { label: S.status, w: 0.9 }],
      rows: rows.map(function (m) {
        var st = statusOf(m, maha, now);
        return [{ t: c.t(m.planet), weight: 700, color: PLANET_HEX[m.planet] || HEX.ink }, fmtDate(m.start, c.lang), fmtDate(m.end, c.lang),
          yrs(one((m.end - m.start) / YEAR), c), ageRange(m, R, c) || "—",
          { t: statusLabel(st, S), weight: st === "running" ? 700 : 400, color: st === "running" ? HEX.maroon : HEX.inkSoft }];
      }),
      rowFill: function (i) { return statusOf(rows[i], maha, now) === "running" ? "#FBE6C2" : null; },
      size: 9.6, minRow: 34
    });
  }

  function pageDashaDetail(doc, R, c) {
    var S = c.S, L = c.L;
    var rows = R.dasha.major;
    if (!rows.length) return;
    doc.section(S.secDashaDetail);
    doc.para(S.explain.dashaDetail, { size: 9.2, gap: 12 });
    var maha = R.dasha.levels[0], antar = R.dasha.levels[1], now = new Date();
    doc.periodCards(rows.map(function (m) {
      var st = statusOf(m, maha, now);
      var r = [[L.start, fmtDate(m.start, c.lang)], [L.end, fmtDate(m.end, c.lang)], [L.period, yrs(one((m.end - m.start) / YEAR), c)]];
      var age = ageRange(m, R, c);
      r.push([S.ageCol, age || "—"]);
      r.push([S.runningAntar, st === "running" && antar ? c.t(antar.planet) : "—"]);
      return { title: c.t(m.planet) + " " + S.levels[0], rows: r, tag: statusLabel(st, S), tagMuted: st === "done", current: st === "running" };
    }), { cols: 3, rowH: 24, labelSize: 8.8, valueSize: 9.4 });
  }

  function remediesBlock(doc, c, items, intro, title) {
    items = (items || []).filter(has);
    if (!items.length && !has(intro)) return;
    doc.heading(title || c.S.remedies, { keep: 60 });
    if (has(intro)) doc.para(intro, { size: 9.2, gap: 6 });
    if (items.length) doc.list(items, { numbered: true });
  }

  // Splits a list whose first entry is an intro line ("... remedies - ").
  function splitIntro(items) {
    items = (items || []).filter(has);
    if (items.length && /[-:–]\s*$/.test(items[0])) return { intro: items[0].replace(/\s*[-:–]\s*$/, ""), items: items.slice(1) };
    return { intro: "", items: items };
  }

  // Groups remedy lines (verbatim) under traditional headings by keyword.
  function groupRemedies(items, S) {
    var groups = S.remedyGroups.map(function (g) { return { name: g.name, re: new RegExp(g.re, "i"), items: [] }; });
    var other = { name: S.remedyOther, items: [] };
    items.forEach(function (it) {
      var g = groups.filter(function (x) { return x.re.test(it); })[0];
      (g || other).items.push(it);
    });
    return groups.concat([other]).filter(function (g) { return g.items.length; });
  }

  function pageKaalSarp(doc, R, c) {
    var S = c.S, L = c.L;
    var ks = R.kalsarp, vd = R.verdicts.kaalSarp;
    if (!ks && !vd) return;
    doc.section(S.secKaalSarp);
    doc.para(S.explain.kaalSarp, { size: 9.2, gap: 10 });
    if (vd) doc.banner(S.secKaalSarp, vd.yes ? L.present : L.notPresent, vd.yes ? "alert" : "clear");
    if (ks) {
      var rows = rowsOf([[S.status, textOf(ks.one_line)], [S.type, textOf(ks.type)], [L.name, textOf(ks.name)]]);
      if (rows.length) doc.kvColumns([{ title: S.doshaStatus, rows: rows, labelFrac: 0.28, valueAlign: "left", size: 9 }]);
      var rep = textOf(ks.report);
      if (has(rep) && rep !== textOf(ks.one_line)) doc.card({ title: S.details, body: rep });
    }
    // Planetary basis: the Rahu-Ketu axis the assessment is made against.
    var ra = c.byName.Rahu, ke = c.byName.Ketu;
    if (ra || ke) {
      doc.heading(S.nodeAxis, { keep: 110 });
      doc.table({
        columns: [{ label: L.planet, w: 1 }, { label: L.sign, w: 1 }, { label: L.house, w: 0.7 }, { label: L.degree, w: 0.9 }, { label: L.nakshatra, w: 1.3 }, { label: L.state, w: 1.2 }],
        rows: [ra, ke].filter(Boolean).map(function (p) { return [{ t: planetName(p.name, c), weight: 700, color: PLANET_HEX[p.name] }, c.t(p.sign), p.house, p.degree, c.t(p.nakshatra), stateText(p, c) || "—"]; }),
        size: 8.8, minRow: 26
      });
    }
    if (vd && vd.yes && has(R.siteText.remediesKaalSarp)) {
      remediesBlock(doc, c, [R.siteText.remediesKaalSarp]);
      if (has(R.siteText.remediesFooter)) doc.para(R.siteText.remediesFooter, { size: 8.4, color: HEX.muted });
    }
    // Classical reference: the twelve named forms, by Rahu's house. It is
    // supplementary, so it is only drawn when it fits on this page.
    var half = Math.ceil(S.ksTypes.length / 2);
    var mk = function (arr, off) { return { rows: arr.map(function (n, i) { return [S.rahuIn(i + 1 + off), n]; }), labelFrac: 0.5, size: 8.8 }; };
    var left = mk(S.ksTypes.slice(0, half), 0), right = mk(S.ksTypes.slice(half), half);
    var need = 12.5 * doc.fs * 1.9 + doc.measureBlock(CW, S.ksTypesNote, { size: 8.6 }) + 8 + doc.measureKV((CW - 18) / 2, left).h;
    if (doc.remaining() >= need) {
      doc.heading(S.ksTypesH, { keep: 0 });
      doc.para(S.ksTypesNote, { size: 8.6, color: HEX.muted, gap: 8, justify: false });
      doc.kvColumns([left, right]);
    }
  }

  function pageManglik(doc, R, c) {
    var S = c.S, L = c.L;
    var m = R.manglik, vd = R.verdicts.manglik;
    if (!m && !vd) return;
    doc.section(S.secManglik);
    doc.para(S.explain.manglik, { size: 9.2, gap: 10 });
    if (vd) doc.banner(S.secManglik, vd.yes ? L.present : L.notPresent, vd.yes ? "alert" : "clear");
    var mars = c.byName.Mars;
    var metrics = m ? rowsOf([
      [S.manglikStatus, c.t(m.manglik_status)],
      [S.manglikPct, m.percentage_manglik_present != null ? m.percentage_manglik_present + "%" : ""],
      [S.afterCancel, m.percentage_manglik_after_cancellation != null ? m.percentage_manglik_after_cancellation + "%" : ""],
      [S.cancelled, m.is_mars_manglik_cancelled != null ? (m.is_mars_manglik_cancelled ? L.yes : L.no) : ""]
    ]) : [];
    var marsRows = mars ? rowsOf([
      [L.sign, c.t(mars.sign)], [L.house, houseLabel(mars.house, c)], [L.degree, mars.degree],
      [L.nakshatra, c.t(mars.nakshatra)], [L.pada, mars.nakshatraPada], [L.state, stateText(mars, c)]
    ]) : [];
    if (metrics.length || marsRows.length) {
      doc.kvColumns([metrics.length ? { title: S.manglikMetrics, rows: metrics } : null, marsRows.length ? { title: S.marsPlacement, rows: marsRows } : null]);
    }
    if (m) {
      var rep = textOf(m.manglik_report);
      if (has(rep)) doc.card({ title: S.conclusion, body: rep });
      var cancel = list(m.manglik_cancel_rule);
      doc.heading(S.cancellation, { size: 11.5, keep: 50 });
      if (cancel.length) doc.list(cancel, { numbered: true });
      else doc.para(S.noCancellation, { size: 9, color: HEX.muted });
    }
  }

  function pageManglikObs(doc, R, c) {
    var S = c.S;
    var m = R.manglik, vd = R.verdicts.manglik;
    var rule = (m && m.manglik_present_rule) || {};
    var byHouse = list(rule.based_on_house), byAspect = list(rule.based_on_aspect);
    var rem = vd && vd.yes && has(R.siteText.remediesManglik);
    if (!byHouse.length && !byAspect.length && !rem) return;
    doc.section(S.secManglikObs);
    if (m && has(textOf(m.manglik_report))) doc.card({ title: S.interpretation, body: textOf(m.manglik_report) });
    if (byHouse.length) { doc.heading(S.basedOnHouse, { size: 13 }); doc.list(byHouse, { numbered: true, size: 10, itemGap: 5 }); }
    if (byAspect.length) { doc.heading(S.basedOnAspect, { size: 13 }); doc.list(byAspect, { numbered: true, size: 10, itemGap: 5 }); }
    if (rem) {
      remediesBlock(doc, c, [R.siteText.remediesManglik], "", S.tradRemedies);
      if (has(R.siteText.remediesFooter)) doc.para(R.siteText.remediesFooter, { size: 8.4, color: HEX.muted });
    }
  }

  function pagePitru(doc, R, c) {
    var S = c.S, L = c.L;
    var p = R.pitra, vd = R.verdicts.pitra;
    if (!p && !vd) return;
    doc.section(S.secPitru);
    if (p && has(textOf(p.what_is_pitri_dosha))) doc.para(textOf(p.what_is_pitri_dosha), { size: 9.2, gap: 10 });
    if (vd) doc.banner(S.secPitru, vd.yes ? L.present : L.notPresent, vd.yes ? "alert" : "clear");
    if (p) {
      var concl = textOf(p.conclusion);
      if (has(concl)) doc.card({ title: S.conclusion, body: concl });
      var rules = list(p.rules_matched), eff = list(p.effects);
      if (rules.length) { doc.heading(S.rulesMatched, { size: 12 }); doc.list(rules, { numbered: true }); }
      if (eff.length) { doc.heading(S.effects, { size: 12 }); doc.list(eff, { numbered: true }); }
    }
    // Planetary basis: Sun, Rahu and Saturn, the grahas classical Pitru
    // Dosha rules are framed around.
    var basis = ["Sun", "Rahu", "Saturn"].map(function (n) { return c.byName[n]; }).filter(Boolean);
    if (basis.length) {
      doc.heading(S.pitruBasis, { size: 12, keep: 110 });
      doc.table({
        columns: [{ label: L.planet, w: 1 }, { label: L.sign, w: 1 }, { label: L.house, w: 0.7 }, { label: L.degree, w: 0.9 }, { label: L.nakshatra, w: 1.3 }, { label: L.state, w: 1.2 }],
        rows: basis.map(function (q) { return [{ t: planetName(q.name, c), weight: 700, color: PLANET_HEX[q.name] }, c.t(q.sign), q.house, q.degree, c.t(q.nakshatra), stateText(q, c) || "—"]; }),
        size: 8.8, minRow: 26
      });
    }
  }

  function pagePitruRemedies(doc, R, c) {
    var S = c.S;
    var p = R.pitra, vd = R.verdicts.pitra;
    if (!p || !vd || !vd.yes) return;
    var rem = splitIntro(list(p.remedies));
    if (!rem.items.length) return;
    doc.section(S.secPitruRem);
    doc.para(rem.intro || R.siteText.remediesPitra, { size: 9.4, gap: 8 });
    groupRemedies(rem.items, S).forEach(function (g) { doc.heading(g.name, { size: 12, keep: 50 }); doc.list(g.items, { numbered: true }); });
  }

  function pageSadeSati(doc, R, c) {
    var S = c.S, L = c.L;
    var s = R.sadeSati, vd = R.verdicts.sadeSati;
    var sat = c.byName.Saturn;
    if (!s && !vd && !sat) return;
    doc.section(S.secSadeSati);
    if (s && has(textOf(s.what_is_sadhesati))) doc.para(textOf(s.what_is_sadhesati), { size: 9.2, gap: 10 });
    if (vd) doc.banner(S.sadeSatiStatus, vd.yes ? L.active : L.notActive, vd.yes ? "alert" : "clear", s ? textOf(s.is_undergoing_sadhesati) : "");
    var cur = s ? rowsOf([
      [S.considerationDate, textOf(s.consideration_date)], [L.moonSign, c.t(s.moon_sign)],
      [S.transitSaturn, c.t(s.saturn_sign)], [S.saturnRetro, s.is_saturn_retrograde != null ? (s.is_saturn_retrograde ? L.yes : L.no) : ""]
    ]) : [];
    var natal = sat ? rowsOf([
      [L.sign, c.t(sat.sign)], [L.house, houseLabel(sat.house, c)], [L.degree, sat.degree],
      [L.nakshatra, c.t(sat.nakshatra)], [L.pada, sat.nakshatraPada], [L.nakLord, c.t(sat.nakshatraLord)], [L.state, stateText(sat, c)]
    ]) : [];
    if (cur.length || natal.length) doc.kvColumns([cur.length ? { title: S.sadeSatiStatus, rows: cur } : null, natal.length ? { title: S.natalSaturn, rows: natal } : null]);
  }

  function pageSadeSatiRemedies(doc, R, c) {
    var S = c.S;
    var vd = R.verdicts.sadeSati;
    if (!vd || !vd.yes || !R.sadeSatiRemedies) return;
    var rem = splitIntro(list(R.sadeSatiRemedies.remedies));
    if (!rem.items.length) return;
    doc.section(S.secSadeSatiRem);
    doc.para(rem.intro || R.siteText.remediesSadeSati, { size: 9.4, gap: 8 });
    groupRemedies(rem.items, S).forEach(function (g) { doc.heading(g.name, { size: 12, keep: 50 }); doc.list(g.items, { numbered: true }); });
    if (has(R.siteText.remediesFooter)) doc.para(R.siteText.remediesFooter, { size: 8.4, color: HEX.muted });
  }

  function pageNakshatra(doc, R, c) {
    var S = c.S, L = c.L, d = R.det, b = R.basic;
    if (!has(b.nakshatra)) return;
    doc.section(S.secNakshatra);
    doc.para(S.explain.nakshatra, { size: 9.2, gap: 12 });
    var moon = c.byName.Moon || {};
    doc.tiles([
      { label: L.nakshatra, value: c.t(b.nakshatra) }, { label: S.charan, value: d.charan },
      { label: L.nakLord, value: c.t(d.nakshatraLord) }, { label: S.nameAlphabet, value: d.nameAlphabet }
    ], { cols: 4, h: 52, valueSize: 12, after: 10 });
    kvStack(doc, [{ title: S.nakDetails, rows: rowsOf([
      [L.nakshatra, c.t(b.nakshatra)], [S.charan, d.charan], [L.nakLord, c.t(d.nakshatraLord)],
      [L.rashi, c.t(b.rashi)], [L.rashiLord, c.t(d.signLord)], [S.moonDegree, moon.degree], [S.nameAlphabet, d.nameAlphabet]
    ]) }], [{ title: S.avakahada, rows: rowsOf([
      [S.gan, c.t(d.gan)], [S.yoni, c.t(d.yoni)], [S.nadi, c.t(d.nadi)], [S.varna, c.t(d.varna)],
      [S.vashya, c.t(d.vashya)], [S.yunja, c.t(d.yunja)], [S.paya, c.t(d.paya)]
    ]) }]);
    predictionCards(doc, R, c, ["emotions", "travel"]);
  }

  // Daily nakshatra prediction categories (system output), shown in the
  // life-area section each belongs to.
  function predictionCards(doc, R, c, keys) {
    var cats = keys.map(function (k) { return R.nakByKey[k]; }).filter(function (x) { return x && has(x.text); });
    if (!cats.length) return;
    doc.heading(c.S.nakPrediction, { keep: 110 });
    doc.para(c.S.nakPredictionNote + " (" + fmtDate(new Date(), c.lang) + ")", { size: 8.4, color: HEX.muted, gap: 8, justify: false });
    doc.cardGrid(cats.map(function (p) { return { title: p.label, body: p.text, size: 8.8 }; }), cats.length > 1 ? 2 : 1);
  }

  function keyPlanetTable(doc, R, c, names, title) {
    var L = c.L;
    var rows = names.map(function (n) { return c.byName[n]; }).filter(Boolean).map(function (p) {
      return [{ t: planetName(p.name, c), weight: 700, color: PLANET_HEX[p.name] }, c.t(p.sign), p.house, p.degree, c.t(p.nakshatra), stateText(p, c) || "—"];
    });
    if (!rows.length) return;
    doc.heading(title || c.S.keyPlanets, { size: 12, keep: 90 });
    doc.table({ columns: [{ label: L.planet, w: 1 }, { label: L.sign, w: 1 }, { label: L.house, w: 0.6 }, { label: L.degree, w: 0.9 }, { label: L.nakshatra, w: 1.3 }, { label: L.state, w: 1.2 }], rows: rows, size: 8.6 });
  }

  // Compact house table used where several houses share a page.
  function houseTable(doc, R, c, nums, minRow) {
    var S = c.S;
    var rows = nums.map(function (n) {
      var hi = houseInfo(R, c, n);
      if (!hi) return null;
      return [{ t: S.houseCard(n), weight: 700, color: HEX.orangeDeep }, c.t(hi.sign), c.t(hi.lord), hi.lordHouse ? String(hi.lordHouse) : "—", { t: namesOf(hi.occupants, c) || "—", weight: hi.occupants.length ? 600 : 400 }, { t: S.houseSignif[n - 1], color: HEX.inkSoft }];
    }).filter(Boolean);
    doc.table({
      columns: [{ label: S.houseCol, w: 0.95, align: "left" }, { label: S.signCol, w: 0.95 }, { label: S.lordCol, w: 0.9 }, { label: S.lordInCol, w: 0.75 }, { label: S.occupantsCol, w: 1.1 }, { label: S.signifCol, w: 1.8, align: "left" }],
      rows: rows, size: 8.4, minRow: minRow || 26, after: 10
    });
  }

  function pageCareer(doc, R, c) {
    var S = c.S, L = c.L;
    if (!R.charts || !R.charts.lagna) return;
    doc.section(S.secCareer);
    doc.heading(S.careerH, { keep: 150 });
    var h10 = houseInfo(R, c, 10);
    var lord = h10 && h10.lord ? c.byName[h10.lord] : null;
    var h10spec = houseSpec(R, c, 10);
    if (h10spec) h10spec.rows = h10spec.rows.filter(function (r) { return r[0] !== S.signifCol; });
    doc.kvColumns([
      h10spec,
      lord ? { title: S.tenthLord + " · " + planetName(lord.name, c), size: 8.8, labelFrac: 0.4, rows: rowsOf([
        [L.sign, c.t(lord.sign)], [L.house, houseLabel(lord.house, c)], [L.degree, lord.degree], [L.nakshatra, c.t(lord.nakshatra)], [L.state, stateText(lord, c)]
      ]) } : null
    ], { after: 8 });
    keyPlanetTable(doc, R, c, ["Sun", "Saturn", "Mercury", "Jupiter"], S.careerPlanets);
    doc.heading(S.financeH, { keep: 150 });
    houseTable(doc, R, c, [2, 11, 6]);
    predictionCards(doc, R, c, ["profession", "luck"]);
  }

  function pageMarriage(doc, R, c) {
    var S = c.S, L = c.L;
    if (!R.charts || !R.charts.lagna) return;
    doc.section(S.secMarriage);
    doc.para(S.explain.marriage, { size: 9.2, gap: 6 });
    var nav = R.charts.navamsa;
    var hasNav = nav && nav.houses && nav.houses[0] && nav.houses[0].sign;
    var seventhLord = KP.signLordOf(R.charts.lagna.houses[6] && R.charts.lagna.houses[6].sign);
    var h7 = houseInfo(R, c, 7);
    var venus = c.byName.Venus, lord = seventhLord ? c.byName[seventhLord] : null;
    var pl = navPlacements(R);
    doc.tiles([
      venus ? { label: planetName("Venus", c) + (pl.Venus ? " (" + S.d9Short + ": " + c.t(pl.Venus.sign) + ")" : ""), value: c.t(venus.sign) + "  ·  " + houseLabel(venus.house, c) } : null,
      lord ? { label: S.seventhLord + " (" + planetName(seventhLord, c) + ")", value: c.t(lord.sign) + "  ·  " + houseLabel(lord.house, c) } : null,
      R.verdicts.manglik ? { label: S.manglikSummary, value: R.verdicts.manglik.yes ? L.present : L.notPresent, color: R.verdicts.manglik.yes ? HEX.maroon : HEX.green } : null
    ].filter(Boolean), { cols: 3, h: 46, valueSize: 10, after: 4 });
    var d9seven = hasNav ? nav.houses[6] : null;
    doc.kvColumns([
      h7 ? { title: S.houseCard(7) + S.d1Tag, size: 8.6, rows: rowsOf([
        [L.sign, c.t(h7.sign)], [S.lordCol, c.t(h7.lord)], [S.lordPlacedIn, h7.lordHouse ? houseLabel(h7.lordHouse, c) : ""],
        [S.occupantsCol, namesOf(h7.occupants, c) || "—"]]) } : null,
      d9seven && d9seven.sign ? { title: S.d9Seventh, size: 8.6, rows: rowsOf([
        [L.sign, c.t(d9seven.sign)], [S.lordCol, c.t(KP.signLordOf(d9seven.sign))],
        [S.occupantsCol, (d9seven.planets || []).map(function (ab) { return planetName(KP.abbrToName(ab) || ab, c); }).join(", ") || "—"]]) } : null
    ], { after: 4 });
  }

  function pageHealth(doc, R, c) {
    var S = c.S;
    if (!R.charts || !R.charts.lagna) return;
    // Shares the Marriage page (continuing onto the next only on overflow).
    doc.section(S.secHealth, { soft: true, force: true });
    doc.para(S.explain.health, { size: 9, gap: 6 });
    houseTable(doc, R, c, [1, 6, 8, 12], 23);
    predictionCards(doc, R, c, ["personal_life", "health"]);
    doc.para(S.explain.healthNote, { size: 8.2, color: HEX.maroon, gap: 4, justify: false });
  }

  function pageGems(doc, R, c, gemImages) {
    var S = c.S;
    if (!R.gems.length) return;
    doc.section(S.secGems);
    doc.para(S.gemIntro, { size: 9.2, gap: 12 });
    var cols = R.gems.length, gap = 12;
    var w = (CW - gap * (cols - 1)) / cols;
    var labels = { LIFE: R.T.gemstoneLifeH, BENEFIC: R.T.gemstoneBeneficH, LUCKY: R.T.gemstoneLuckyH };
    var T = R.T;
    var specs = R.gems.map(function (g) {
      var d = g.data;
      return {
        title: labels[g.key] || g.key,
        rows: rowsOf([
          [T.gemstoneName || "Gemstone", c.t(d.name)], [T.gemstoneSemiGem || "Semi Gemstone", c.t(d.semi_gem)], [T.gemstoneFinger || "Finger", c.t(d.wear_finger)],
          [T.gemstoneWeight || "Weight", clean(d.weight_caret)], [T.gemstoneMetal || "Metal", c.t(d.wear_metal)], [T.gemstoneDay || "Day", c.t(d.wear_day)],
          [T.gemstoneDeity || "Deity", c.t(d.gem_deity)]
        ]),
        size: 8.4, labelFrac: 0.46
      };
    });
    var imgH = 104;
    var kvH = Math.max.apply(null, specs.map(function (s) { return doc.measureKV(w, s).h; }));
    var h = imgH + 16 + kvH;
    doc.ensure(h);
    var y = doc.y;
    specs.forEach(function (s, i) {
      var x = MARGIN + i * (w + gap);
      doc.rect(doc.page, x, y, w, imgH, { r: 6, fill: HEX.rowA });
      doc.rect(doc.page, x, y, w, imgH, { r: 6, stroke: HEX.goldLight, lw: 0.9 });
      var img = gemImages[i];
      if (img) doc.imageFit(doc.page, img, x + 10, y + 8, w - 20, imgH - 36);
      doc.text(doc.page, c.t(R.gems[i].data.name), x + w / 2, y + imgH - 11, { size: 11, weight: 700, color: HEX.orangeDeep, align: "center", maxW: w - 12 });
      doc.drawKV(doc.page, x, y + imgH + 10, w, s);
    });
    doc.y = y + h + 14;
  }

  function pageRemedies(doc, R, c) {
    var S = c.S, L = c.L;
    var r = R.rudraksha;
    if (!r || !(has(r.name) || has(r.recommend) || has(r.detail))) return;
    doc.flowSection(S.secRemedies, function () {
      doc.kvColumns([{ title: S.rudraksha, rows: rowsOf([[L.name, clean(r.name)], [S.recommendation, textOf(r.recommend)]]), labelFrac: 0.26, valueAlign: "left", size: 9 }], { after: 10 });
      if (has(textOf(r.detail))) doc.card({ title: clean(r.name), body: textOf(r.detail), size: 8.8 });
    });
  }

  function pageNumerology(doc, R, c) {
    var S = c.S, T = R.T;
    var n = R.numerology;
    if (!n) return;
    doc.flowSection(S.secNumerology, function () {
      doc.tiles([
        { label: T.numerologyRadical || S.radical, value: clean(n.radical_number) },
        { label: T.numerologyDestiny || S.destiny, value: clean(n.destiny_number) },
        { label: T.numerologyName || S.nameNumber, value: clean(n.name_number) }
      ], { cols: 3, h: 50, valueSize: 18, after: 8 });
      var left = rowsOf([
        [T.numerologyRuler, c.t(n.radical_ruler)], [T.numerologyFriendly, clean(n.friendly_num)], [T.numerologyNeutral, clean(n.neutral_num)],
        [T.numerologyEvil, clean(n.evil_num)], [T.numerologyDay, c.t(n.fav_day)]
      ]);
      var right = rowsOf([
        [T.numerologyColor, c.t(n.fav_color)], [T.numerologyMetal, c.t(n.fav_metal)], [T.numerologyStone, c.t(n.fav_stone)],
        [T.numerologySubstone, c.t(n.fav_substone)]
      ]);
      doc.kvColumns([{ title: S.numbers, rows: left }, { title: S.favourable, rows: right }], { after: 10 });
      if (has(n.fav_mantra) || has(n.fav_god)) {
        doc.kvColumns([{ title: S.mantraH, rows: rowsOf([[T.numerologyMantra || "Mantra", clean(n.fav_mantra)], [T.numerologyGod || "Deity", c.t(n.fav_god)]]), labelFrac: 0.3, valueAlign: "left", size: 9 }], { after: 8 });
      }
    });
  }

  // Compact closing summary: key indicators, report details and the note.
  function pageSummary(doc, R, c) {
    var S = c.S, L = c.L, b = R.basic, v = R.verdicts;
    doc.flowSection(S.secSummary, function () {
      var maha = R.dasha.levels[0], antar = R.dasha.levels[1];
      var life = R.gems.filter(function (g) { return g.key === "LIFE"; })[0];
      doc.kvColumns([
        { title: S.doshaResults, valueWeight: 600, size: 8.6, rows: rowsOf([
          [S.secManglik, v.manglik ? (v.manglik.yes ? L.present : L.notPresent) : ""],
          [S.secKaalSarp, v.kaalSarp ? (v.kaalSarp.yes ? L.present : L.notPresent) : ""],
          [S.secPitru, v.pitra ? (v.pitra.yes ? L.present : L.notPresent) : ""],
          [S.sadeSatiStatus, v.sadeSati ? (v.sadeSati.yes ? L.active : L.notActive) : ""]
        ]) },
        { title: S.currentPeriod, size: 8.6, rows: rowsOf([
          [S.runningMaha, maha ? c.t(maha.planet) + " (" + fmtDate(maha.end, c.lang) + ")" : ""],
          [S.runningAntar, antar ? c.t(antar.planet) + " (" + fmtDate(antar.end, c.lang) + ")" : ""],
          [S.lifeStone, life ? c.t(life.data.name) : ""],
          [S.rudraksha, R.rudraksha ? clean(R.rudraksha.name) : ""]
        ]) }
      ], { after: 6 });
      doc.kvColumns([
        { title: S.keyIndicators, size: 8.6, rows: rowsOf([
          [L.lagna, c.t(b.ascendant)], [L.moonSign, c.t(b.rashi)], [L.nakshatra, c.t(b.nakshatra)]
        ]) },
        { title: S.secClosing, size: 8.6, rows: rowsOf([
          [L.preparedFor, R.person.name], [L.reportType, L.kundliTitle],
          [L.generated, fmtDate(new Date(), c.lang, true)]
        ]) }
      ], { after: 6 });
      doc.card({ title: L.disclaimerTitle, body: L.disclaimer, size: 8.2, accent: HEX.gold });
    }, { toc: false });
  }

  // ------------------------------------------------------------------
  // Entry
  // ------------------------------------------------------------------
  var GANESH_URL = "Kundli%20planet%20assets/ganesh.png";

  KP.renderKundli = function (R) {
    return KP.createDoc(R.lang, { fs: 1.12 }).then(function (doc) {
      var c = ctx(R);
      doc.pageOf = c.L.pageOf;
      doc.footerCenter = [R.person.name, c.L.kundliFooter].filter(has).join("  ·  ");
      // Images are fetched up-front so page layout stays synchronous.
      var imgJobs = R.gems.map(function (g) {
        if (!g.image) return Promise.resolve(null);
        return KP.fetchImageScaled(g.image, 360, "image/jpeg", 0.88).then(function (s) { return doc.embedImage(s); }).catch(function () { return null; });
      });
      var ganeshJob = KP.fetchImageScaled(GANESH_URL, 720, "image/png").then(function (s) { return doc.embedImage(s); }).catch(function () { return null; });
      return Promise.all([Promise.all(imgJobs), ganeshJob]).then(function (res) {
        var gemImages = res[0], ganesh = res[1];
        pageCover(doc, R, c, ganesh);
        var contentsSlot = pageBirth(doc, R, c);
        pagePanchang(doc, R, c);
        pagePlanets(doc, R, c);
        pageProfile(doc, R, c);
        pageD1(doc, R, c);
        pageD9(doc, R, c);
        pageMoonSun(doc, R, c);
        pageHouses(doc, R, c, 1);
        pageHouses(doc, R, c, 7);
        pageGroups(doc, R, c);
        pageDasha(doc, R, c);
        pageDashaTimeline(doc, R, c);
        pageDashaDetail(doc, R, c);
        pageKaalSarp(doc, R, c);
        pageManglik(doc, R, c);
        pageManglikObs(doc, R, c);
        pagePitru(doc, R, c);
        pagePitruRemedies(doc, R, c);
        pageSadeSati(doc, R, c);
        pageSadeSatiRemedies(doc, R, c);
        pageNakshatra(doc, R, c);
        pageCareer(doc, R, c);
        pageMarriage(doc, R, c);
        pageHealth(doc, R, c);
        pageGems(doc, R, c, gemImages);
        pageRemedies(doc, R, c);
        pageNumerology(doc, R, c);
        pageSummary(doc, R, c);
        paintContents(doc, c, contentsSlot);
        doc.finalize();
        doc.pdf.setTitle((R.person.name ? R.person.name + " - " : "") + "Kundli Report | KundliPlanet");
        doc.pdf.setAuthor("KundliPlanet");
        doc.pdf.setCreator("KundliPlanet");
        doc.pdf.setProducer("KundliPlanet");
        doc.pdf.setSubject("Janam Kundli Report");
        try { doc.pdf.setLanguage(R.lang === "hi" ? "hi-IN" : "en-IN"); } catch (e) { /* older pdf-lib */ }
        return doc.save();
      });
    });
  };
})(window);

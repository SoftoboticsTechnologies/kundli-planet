/* KundliPlanet PDF - labels, localized astrology vocabulary and short
   general explanations (en / hi).
   The vocabulary map only changes the LANGUAGE a value is shown in (e.g.
   "Libra" -> "तुला" in a Hindi report); it never changes the value itself.
   Unknown values are shown exactly as the calculation layer returned them.
   The explanation texts are general definitions of each section - they
   are not predictions and contain no chart-specific claims. */
(function (global) {
  "use strict";

  var KP = global.KPPDF = global.KPPDF || {};

  // ------------------------------------------------------------------
  // Hindi vocabulary for values returned by the calculation layer
  // ------------------------------------------------------------------
  var TERMS = {
    // signs
    aries: "मेष", taurus: "वृषभ", gemini: "मिथुन", cancer: "कर्क", leo: "सिंह", virgo: "कन्या",
    libra: "तुला", scorpio: "वृश्चिक", sagittarius: "धनु", capricorn: "मकर", aquarius: "कुंभ", pisces: "मीन",
    // planets
    sun: "सूर्य", moon: "चंद्र", mars: "मंगल", mercury: "बुध", jupiter: "बृहस्पति", venus: "शुक्र",
    saturn: "शनि", rahu: "राहु", ketu: "केतु", ascendant: "लग्न",
    // nakshatras (common spellings)
    ashwini: "अश्विनी", aswini: "अश्विनी", bharani: "भरणी", krittika: "कृत्तिका", kritika: "कृत्तिका",
    rohini: "रोहिणी", mrigashira: "मृगशिरा", mrigashirsha: "मृगशिरा", mrigshira: "मृगशिरा", mrigsira: "मृगशिरा",
    ardra: "आर्द्रा", aardra: "आर्द्रा", punarvasu: "पुनर्वसु", pushya: "पुष्य", pushyami: "पुष्य",
    ashlesha: "आश्लेषा", aslesha: "आश्लेषा", magha: "मघा", makha: "मघा",
    purvaphalguni: "पूर्वा फाल्गुनी", poorvaphalguni: "पूर्वा फाल्गुनी", purvaphalgun: "पूर्वा फाल्गुनी",
    uttaraphalguni: "उत्तरा फाल्गुनी", uttraphalguni: "उत्तरा फाल्गुनी", uttarphalguni: "उत्तरा फाल्गुनी",
    hasta: "हस्त", hast: "हस्त", chitra: "चित्रा", swati: "स्वाती", svati: "स्वाती",
    vishakha: "विशाखा", visakha: "विशाखा", anuradha: "अनुराधा", jyeshtha: "ज्येष्ठा", jyeshta: "ज्येष्ठा", jyestha: "ज्येष्ठा",
    mula: "मूल", moola: "मूल", mool: "मूल",
    purvaashadha: "पूर्वाषाढ़ा", poorvaashadha: "पूर्वाषाढ़ा", purvashadha: "पूर्वाषाढ़ा", poorvashadha: "पूर्वाषाढ़ा",
    uttaraashadha: "उत्तराषाढ़ा", uttarashadha: "उत्तराषाढ़ा", uttrashadha: "उत्तराषाढ़ा", uttraashadha: "उत्तराषाढ़ा",
    shravana: "श्रवण", shravan: "श्रवण", sravana: "श्रवण", dhanishta: "धनिष्ठा", dhanishtha: "धनिष्ठा",
    shatabhisha: "शतभिषा", shatabhishak: "शतभिषा", satabhisha: "शतभिषा",
    purvabhadrapada: "पूर्वा भाद्रपद", poorvabhadrapada: "पूर्वा भाद्रपद", purvabhadrapad: "पूर्वा भाद्रपद", poorvabhadrapad: "पूर्वा भाद्रपद",
    uttarabhadrapada: "उत्तरा भाद्रपद", uttarabhadrapad: "उत्तरा भाद्रपद", uttrabhadrapada: "उत्तरा भाद्रपद", uttrabhadrapad: "उत्तरा भाद्रपद",
    revati: "रेवती",
    // varna / vashya / yoni / gan / nadi
    brahmin: "ब्राह्मण", vipra: "विप्र", kshatriya: "क्षत्रिय", vaishya: "वैश्य", shudra: "शूद्र",
    chatushpad: "चतुष्पद", chatushpada: "चतुष्पद", manav: "मानव", nara: "नर", jalchar: "जलचर", vanchar: "वनचर", keet: "कीट",
    ashwa: "अश्व", gaj: "गज", gaja: "गज", mesh: "मेष", sarp: "सर्प", sarpa: "सर्प", shwan: "श्वान", swan: "श्वान",
    marjaar: "मार्जार", marjar: "मार्जार", mooshak: "मूषक", mushak: "मूषक", gau: "गौ", mahish: "महिष", mahisha: "महिष",
    vyaghra: "व्याघ्र", vyaghr: "व्याघ्र", mriga: "मृग", mrig: "मृग", vanar: "वानर", nakul: "नकुल", simha: "सिंह",
    dev: "देव", deva: "देव", manushya: "मनुष्य", manushy: "मनुष्य", rakshasa: "राक्षस", rakshas: "राक्षस",
    adi: "आदि", aadi: "आदि", madhya: "मध्य", ant: "अंत्य", antya: "अंत्य",
    // tattva / paya / yunja
    fire: "अग्नि", earth: "पृथ्वी", air: "वायु", water: "जल",
    gold: "स्वर्ण", silver: "रजत", copper: "ताम्र", iron: "लौह",
    poorva: "पूर्व", purva: "पूर्व",
    // planet avastha
    bala: "बाल", baal: "बाल", kumara: "कुमार", kumar: "कुमार", yuva: "युवा", vridha: "वृद्ध", vriddha: "वृद्ध", mrita: "मृत", mrit: "मृत",
    // tithi words
    shukla: "शुक्ल", krishna: "कृष्ण", pratipada: "प्रतिपदा", pratipad: "प्रतिपदा", dwitiya: "द्वितीया", dvitiya: "द्वितीया",
    tritiya: "तृतीया", chaturthi: "चतुर्थी", panchami: "पंचमी", shashthi: "षष्ठी", shashti: "षष्ठी", shasthi: "षष्ठी", sashti: "षष्ठी",
    saptami: "सप्तमी", ashtami: "अष्टमी", navami: "नवमी", dashami: "दशमी", dashmi: "दशमी", ekadashi: "एकादशी", ekadasi: "एकादशी",
    dwadashi: "द्वादशी", dwadasi: "द्वादशी", trayodashi: "त्रयोदशी", triyodashi: "त्रयोदशी", chaturdashi: "चतुर्दशी",
    purnima: "पूर्णिमा", poornima: "पूर्णिमा", amavasya: "अमावस्या", amavasa: "अमावस्या",
    // yoga
    vishkumbha: "विष्कुंभ", vishkambha: "विष्कुंभ", preeti: "प्रीति", priti: "प्रीति", ayushman: "आयुष्मान", saubhagya: "सौभाग्य",
    shobhana: "शोभन", shobhan: "शोभन", atiganda: "अतिगंड", sukarma: "सुकर्मा", dhriti: "धृति", shool: "शूल", shula: "शूल",
    ganda: "गंड", vriddhi: "वृद्धि", dhruva: "ध्रुव", dhruv: "ध्रुव", vyaghata: "व्याघात", harshana: "हर्षण", harshan: "हर्षण",
    vajra: "वज्र", siddhi: "सिद्धि", vyatipata: "व्यतीपात", vyatipat: "व्यतीपात", variyan: "वरीयान", variyana: "वरीयान",
    parigha: "परिघ", shiva: "शिव", siddha: "सिद्ध", sadhya: "साध्य", shubha: "शुभ", brahma: "ब्रह्म", indra: "इंद्र", aindra: "इंद्र",
    vaidhriti: "वैधृति", vaidhruti: "वैधृति",
    // karana
    bava: "बव", balava: "बालव", baalav: "बालव", kaulava: "कौलव", kaulav: "कौलव", taitil: "तैतिल", taitila: "तैतिल", taitula: "तैतिल",
    gara: "गर", garaja: "गर", vanija: "वणिज", vanij: "वणिज", vishti: "विष्टि", bhadra: "भद्रा", shakuni: "शकुनि",
    chatushpadkaran: "चतुष्पद", naga: "नाग", nag: "नाग", kimstughna: "किंस्तुघ्न", kinstughna: "किंस्तुघ्न",
    // weekdays
    sunday: "रविवार", monday: "सोमवार", tuesday: "मंगलवार", wednesday: "बुधवार", thursday: "गुरुवार", friday: "शुक्रवार", saturday: "शनिवार",
    // gemstones & wearing
    diamond: "हीरा", bluesapphire: "नीलम", emerald: "पन्ना", ruby: "माणिक्य", pearl: "मोती", redcoral: "मूंगा", coral: "मूंगा",
    yellowsapphire: "पुखराज", hessonite: "गोमेद", catseye: "लहसुनिया", opal: "ओपल", zircon: "जिरकॉन", amethyst: "जमुनिया",
    onyx: "ओनिक्स", whitesapphire: "सफेद पुखराज", moonstone: "चंद्रकांत मणि", garnet: "गार्नेट", turquoise: "फिरोजा",
    index: "तर्जनी", middle: "मध्यमा", ring: "अनामिका", little: "कनिष्ठा",
    white: "सफेद", red: "लाल", yellow: "पीला", green: "हरा", blue: "नीला", black: "काला", orange: "नारंगी", pink: "गुलाबी", brown: "भूरा", grey: "स्लेटी", gray: "स्लेटी", cream: "क्रीम",
    devi: "देवी", ganesha: "गणेश", ganesh: "गणेश", hanuman: "हनुमान", vishnu: "विष्णु", lakshmi: "लक्ष्मी",
    platinum: "प्लैटिनम", panchdhatu: "पंचधातु", ashtadhatu: "अष्टधातु",
    // manglik strength labels
    ineffective: "अप्रभावी", lesseffective: "कम प्रभावी", effective: "प्रभावी", higheffective: "अत्यधिक प्रभावी", highlyeffective: "अत्यधिक प्रभावी",
    male: "पुरुष", female: "स्त्री"
  };

  function key(s) { return String(s).toLowerCase().replace(/[^a-z]/g, ""); }
  KP.addTerms = function (o) { Object.keys(o).forEach(function (k) { TERMS[k] = o[k]; }); };

  // API text sometimes carries HTML (<p>, <br>, entities); render it as
  // plain paragraphs separated by "\n".
  KP.stripHtml = function (v) {
    if (typeof v !== "string") return v;
    var s = v.replace(/<\s*br\s*\/?>/gi, "\n").replace(/<\/\s*p\s*>/gi, "\n").replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, "\"").replace(/&#39;|&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">");
    return s.split(/\n/).map(function (l) { return l.replace(/[ \t]+/g, " ").trim(); }).filter(Boolean).join("\n");
  };

  // Returns the Hindi form of a known value; otherwise the value unchanged.
  function term(v, lang) {
    var s = KP.clean(v);
    if (!s || lang !== "hi") return s;
    var k = key(s);
    if (k && TERMS[k]) return TERMS[k];
    // Lists such as "Thursday, Tuesday, Friday" or "Opal/Zircon".
    if (/[,/]/.test(s)) {
      var parts = s.split(/\s*([,/])\s*/);
      var ok = true;
      var out = parts.map(function (p) {
        if (p === "," ) return ", ";
        if (p === "/") return " / ";
        var t = TERMS[key(p)];
        if (!t && /[a-z]/i.test(p)) ok = false;
        return t || p;
      });
      if (ok) return out.join("");
    }
    // Multi-word values such as "Krishna Panchami".
    var words = s.split(/\s+/);
    if (words.length > 1 && words.every(function (w) { return TERMS[key(w)]; })) {
      return words.map(function (w) { return TERMS[key(w)]; }).join(" ");
    }
    return s;
  }
  KP.term = term;

  // Short planet labels used inside charts.
  var ABBR = {
    en: { Sun: "Su", Moon: "Mo", Mars: "Ma", Mercury: "Me", Jupiter: "Ju", Venus: "Ve", Saturn: "Sa", Rahu: "Ra", Ketu: "Ke", Ascendant: "Asc" },
    hi: { Sun: "सूर्य", Moon: "चंद्र", Mars: "मंगल", Mercury: "बुध", Jupiter: "गुरु", Venus: "शुक्र", Saturn: "शनि", Rahu: "राहु", Ketu: "केतु", Ascendant: "लग्न" }
  };
  var ABBR_TO_NAME = { Su: "Sun", Mo: "Moon", Ma: "Mars", Me: "Mercury", Ju: "Jupiter", Ve: "Venus", Sa: "Saturn", Ra: "Rahu", Ke: "Ketu", As: "Ascendant", Asc: "Ascendant" };
  KP.planetAbbr = function (name, lang) { return (ABBR[lang] || ABBR.en)[name] || name; };
  KP.abbrToName = function (abbr) { return ABBR_TO_NAME[KP.clean(abbr)] || null; };

  var SIGNS = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];
  // Classical sign rulership (fixed definitions, identical in every chart).
  var SIGN_LORD = ["Mars", "Venus", "Mercury", "Moon", "Sun", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Saturn", "Jupiter"];
  KP.SIGNS = SIGNS;
  KP.signNumber = function (name) {
    var s = KP.clean(name);
    if (!s) return null;
    var k = key(s);
    for (var i = 0; i < 12; i++) if (key(SIGNS[i]) === k || key(SIGNS[i]).slice(0, 3) === k) return i + 1;
    return null;
  };
  KP.signLordOf = function (signName) {
    var n = KP.signNumber(signName);
    return n ? SIGN_LORD[n - 1] : null;
  };

  KP.ordinal = function (n, lang) {
    n = Number(n);
    if (!n) return "";
    if (lang === "hi") return n + "वां भाव";
    var s = ["th", "st", "nd", "rd"], v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]) + " house";
  };

  // ------------------------------------------------------------------
  // Labels
  // ------------------------------------------------------------------
  KP.L = {
    en: {
      brand: "KundliPlanet",
      pageOf: function (p, n) { return "Page " + p + " of " + n; },
      invocation: "|| Shri Ganeshaya Namah ||",
      kundliTitle: "KUNDLI REPORT", kundliSubtitle: "Janam Kundli · Vedic Birth Chart Report",
      milanTitle: "KUNDLI MILAN", milanSubtitle: "Horoscope Compatibility Report",
      generatedOn: "Generated on", preparedBy: "Prepared by KundliPlanet",
      contents: "Contents", contentsSub: "Sections in this report",
      name: "Name", gender: "Gender", dob: "Date of Birth", tob: "Time of Birth", place: "Birth Place",
      lat: "Latitude", lon: "Longitude", tz: "Timezone",
      male: "Male", female: "Female",
      groom: "Groom", bride: "Bride", personA: "Person A", personB: "Person B",
      yes: "Yes", no: "No", present: "Present", notPresent: "Not Present", active: "Active", notActive: "Not Active",
      planet: "Planet", degree: "Degree", sign: "Sign", signLord: "Sign Lord", house: "House", nakshatra: "Nakshatra",
      nakLord: "Nakshatra Lord", pada: "Pada", state: "State", retro: "Retrograde", combust: "Combust", direct: "Direct",
      lagna: "Lagna (Ascendant)", lagnaLord: "Lagna Lord", rashi: "Rashi (Moon Sign)", rashiLord: "Rashi Lord", sunSign: "Sun Sign",
      moonSign: "Moon Sign", asc: "Asc",
      start: "Start", end: "End", level: "Level", period: "Period",
      disclaimerTitle: "Important Note",
      disclaimer: "This report is prepared from the birth details provided and the calculations of KundliPlanet's astrology system. Vedic astrology is a traditional system of guidance and self-reflection; it is not a substitute for professional medical, legal, financial or psychological advice.",
      systemOutput: "System result", observation: "Observation",
      closingThanks: "Thank You", closingLine: "May the stars guide you on your path.",
      reportType: "Report Type", preparedFor: "Prepared for", generated: "Generated", language: "Language", langName: "English",
      totalPages: "Pages", reportId: "Report", kundliFooter: "Janam Kundli Report", milanFooter: "Kundli Milan Report"
    },
    hi: {
      brand: "KundliPlanet",
      pageOf: function (p, n) { return "पृष्ठ " + p + " / " + n; },
      invocation: "|| श्री गणेशाय नमः ||",
      kundliTitle: "कुंडली रिपोर्ट", kundliSubtitle: "जन्म कुंडली · वैदिक जन्म पत्रिका",
      milanTitle: "कुंडली मिलान", milanSubtitle: "वैवाहिक अनुकूलता रिपोर्ट",
      generatedOn: "निर्माण तिथि", preparedBy: "KundliPlanet द्वारा तैयार",
      contents: "विषय सूची", contentsSub: "इस रिपोर्ट के खंड",
      name: "नाम", gender: "लिंग", dob: "जन्म तिथि", tob: "जन्म समय", place: "जन्म स्थान",
      lat: "अक्षांश", lon: "देशांतर", tz: "समय क्षेत्र",
      male: "पुरुष", female: "स्त्री",
      groom: "वर", bride: "वधू", personA: "व्यक्ति 1", personB: "व्यक्ति 2",
      yes: "हाँ", no: "नहीं", present: "उपस्थित", notPresent: "अनुपस्थित", active: "सक्रिय", notActive: "सक्रिय नहीं",
      planet: "ग्रह", degree: "अंश", sign: "राशि", signLord: "राशि स्वामी", house: "भाव", nakshatra: "नक्षत्र",
      nakLord: "नक्षत्र स्वामी", pada: "पाद", state: "अवस्था", retro: "वक्री", combust: "अस्त", direct: "मार्गी",
      lagna: "लग्न", lagnaLord: "लग्न स्वामी", rashi: "राशि (चंद्र राशि)", rashiLord: "राशि स्वामी", sunSign: "सूर्य राशि",
      moonSign: "चंद्र राशि", asc: "लग्न",
      start: "आरंभ", end: "समाप्ति", level: "स्तर", period: "अवधि",
      disclaimerTitle: "महत्वपूर्ण सूचना",
      disclaimer: "यह रिपोर्ट दिए गए जन्म विवरण और KundliPlanet की ज्योतिष गणना प्रणाली के आधार पर तैयार की गई है। वैदिक ज्योतिष मार्गदर्शन और आत्म-चिंतन की एक पारंपरिक पद्धति है; यह चिकित्सीय, कानूनी, वित्तीय या मनोवैज्ञानिक परामर्श का विकल्प नहीं है।",
      systemOutput: "प्रणाली परिणाम", observation: "निरीक्षण",
      closingThanks: "धन्यवाद", closingLine: "ग्रह-नक्षत्र आपका मार्ग प्रशस्त करें।",
      reportType: "रिपोर्ट प्रकार", preparedFor: "किसके लिए", generated: "निर्माण", language: "भाषा", langName: "हिंदी",
      totalPages: "पृष्ठ", reportId: "रिपोर्ट", kundliFooter: "जन्म कुंडली रिपोर्ट", milanFooter: "कुंडली मिलान रिपोर्ट"
    }
  };

  // ------------------------------------------------------------------
  // Individual Kundli labels + general explanations
  // ------------------------------------------------------------------
  KP.K = {
    en: {
      ksTypesH: "Classical Forms of Kaal Sarp (reference)",
      ksTypesNote: "For reference only: classical texts name twelve forms of Kaal Sarp Yoga by the house Rahu occupies. The result above is the system's assessment of this chart.",
      ksTypes: ["Anant", "Kulik", "Vasuki", "Shankhpal", "Padma", "Mahapadma", "Takshak", "Karkotak", "Shankhachud", "Ghatak", "Vishdhar", "Sheshnag"],
      rahuIn: function (n) { return "Rahu in house " + n; },
      secBirthOnly: "Birth Details", secPanchang: "Lagna, Rashi & Panchang", secProfile: "Planetary Profile",
      secD1: "Lagna Chart (D1)", secD9: "Navamsha Chart (D9)", secHouses1: "Bhava Analysis · Houses 1–6", secHouses2: "Bhava Analysis · Houses 7–12",
      secGroups: "Bhava Groups", secDashaDetail: "Mahadasha Detailed Sequence", secManglikObs: "Manglik Dosha · Observations & Remedies",
      secPitruRem: "Pitru Dosha · Remedies", secSadeSatiRem: "Sade Sati · Remedies",
      contents: "Report Contents", panchangNotesH: "About the Panchang Elements",
      panchangNotes: [
        ["Tithi", "The lunar day, set by the angular distance between the Moon and the Sun (30 tithis in a lunar month)."],
        ["Nakshatra", "The lunar mansion occupied by the Moon at birth, one of 27 equal divisions of the zodiac."],
        ["Yoga", "One of 27 combinations formed from the combined longitudes of the Sun and the Moon."],
        ["Karana", "Half of a tithi; 11 karanas repeat through the lunar month."],
        ["Avakahada", "Traditional birth attributes (varna, vashya, yoni, gana, nadi and others) derived from the birth nakshatra and Moon sign, also used in Kundli Milan."]
      ],
      stateNotesH: "Understanding Planetary States",
      stateNotes: [
        ["Bala", "Infant state — the planet is traditionally said to give partial results."],
        ["Kumara", "Youthful state — results grow steadily."],
        ["Yuva", "Adult state — the planet is traditionally considered at full strength."],
        ["Vridha", "Old state — results are traditionally said to be reduced."],
        ["Mrita", "Dormant state — the planet's results are traditionally said to be weak."],
        ["Retrograde", "The planet appears to move backwards from Earth; its themes are traditionally revisited or internalised."],
        ["Combust", "The planet is very close to the Sun; its significations are traditionally said to be overshadowed."]
      ],
      retroPlanets: "Retrograde Planets", combustPlanets: "Combust Planets",
      occupiedHouses: "Houses Occupied", emptyHouses: "Empty Houses",
      levelNotesH: "The Five Dasha Levels",
      levelNotes: [
        "Major period, lasting years — the broad theme of a phase of life.",
        "Sub-period within the Mahadasha, lasting months to years.",
        "Sub-sub-period, lasting weeks to months.",
        "Finer period, lasting days to weeks.",
        "Finest period, lasting hours to days."
      ],
      nodeAxis: "Rahu–Ketu Axis (planetary basis)", noCancellation: "No cancellation rule was returned by the system.",
      interpretation: "Interpretation (system)", tradRemedies: "Traditional Remedies", pitruBasis: "Relevant Planetary Placements",
      remedyGroups: [
        { name: "Rudraksha", re: "rudraksha" },
        { name: "Donation & Fasting", re: "donat|fast|charit|feed" },
        { name: "Hanuman Worship", re: "hanuman" },
        { name: "Shani (Saturn) Practices", re: "shani|saturn|yantra" }
      ],
      remedyOther: "General Practices",
      careerH: "Career & Profession", financeH: "Finance & Gains", tenthLord: "10th Lord", careerPlanets: "Career-related Planets",
      mantraH: "Mantra & Worship",
      d1Tag: " (D1)", d9Tag: " (D9)", d9Short: "D9", retroMark: "R",
      seventhLord: "7th Lord", seventhLordShort: "7th lord", houseGroupsH: "House Groups", groupCol: "Group", meaningCol: "Traditional Meaning", ageCol: "Age",
      houseGroups: [
        { name: "Kendra (Angular)", houses: [1, 4, 7, 10], note: "Pillars of the chart: self, home, partnership, career" },
        { name: "Trikona (Trine)", houses: [1, 5, 9], note: "Houses of dharma, merit and fortune" },
        { name: "Dusthana / Trika", houses: [6, 8, 12], note: "Houses of obstacles, change and expenditure" },
        { name: "Upachaya (Growth)", houses: [3, 6, 10, 11], note: "Houses that improve with time and effort" },
        { name: "Panaphara (Succedent)", houses: [2, 5, 8, 11], note: "Houses that sustain and accumulate" },
        { name: "Apoklima (Cadent)", houses: [3, 6, 9, 12], note: "Houses of learning, adjustment and transition" },
        { name: "Maraka", houses: [2, 7], note: "Houses traditionally examined for longevity timing" },
        { name: "Dharma Trikona", houses: [1, 5, 9], note: "Purpose, righteousness and higher learning" },
        { name: "Artha Trikona", houses: [2, 6, 10], note: "Wealth, livelihood and material security" },
        { name: "Kama Trikona", houses: [3, 7, 11], note: "Desires, relationships and aspirations" },
        { name: "Moksha Trikona", houses: [4, 8, 12], note: "Inner life, transformation and liberation" }
      ],
      secBirth: "Birth Details & Panchang", secPlanets: "Planetary Positions", secLagna: "Lagna Chart & Navamsha",
      secMoon: "Moon & Sun Charts", secHouses: "Bhava (House) Placements", secDasha: "Vimshottari Dasha",
      secDashaTimeline: "Mahadasha Timeline", secKaalSarp: "Kaal Sarp Dosha", secManglik: "Manglik Dosha",
      secPitru: "Pitru Dosha", secSadeSati: "Sade Sati & Saturn", secNakshatra: "Nakshatra Analysis",
      secCareer: "Career & Finance", secMarriage: "Marriage & Relationships", secHealth: "Health & General Life",
      secGems: "Gemstone Suggestions", secRemedies: "Rudraksha & Remedies", secNumerology: "Numerology",
      secSummary: "KundliPlanet Summary", secClosing: "Report Details",
      birthDetails: "Birth Details", panchang: "Panchang at Birth", lagnaRashi: "Lagna & Rashi", avakahada: "Avakahada Details",
      tithi: "Tithi", yoga: "Yoga", karana: "Karana", charan: "Charan (Pada)", tatva: "Element (Tattva)",
      varna: "Varna", vashya: "Vashya", yoni: "Yoni", gan: "Gana", nadi: "Nadi", yunja: "Yunja", paya: "Paya", nameAlphabet: "Name Alphabet",
      planetTable: "Planetary Positions (Lagna chart)", planetCards: "Planet Overview",
      lagnaChart: "Lagna Chart (D1)", navamshaChart: "Navamsha Chart (D9)", moonChart: "Moon Chart (Chandra Kundli)", sunChart: "Sun Chart (Surya Kundli)",
      aboutLagna: "About the Lagna", aboutNavamsha: "About the Navamsha", lagnaDetails: "Lagna Details", navLagna: "Navamsha Lagna",
      lordPlacedIn: "Lord placed in", ascDegree: "Lagna Degree",
      moonDetails: "Moon Details", sunDetails: "Sun Details", moonDegree: "Moon Degree", sunDegree: "Sun Degree",
      houseCol: "House", signCol: "Sign", lordCol: "Lord", lordInCol: "Lord in House", occupantsCol: "Planets", signifCol: "Traditional Significations",
      currentDasha: "Current Dasha Periods", runningMaha: "Running Mahadasha", runningAntar: "Running Antardasha",
      levels: ["Mahadasha", "Antardasha", "Pratyantar Dasha", "Sookshma Dasha", "Prana Dasha"],
      mahaSequence: "Mahadasha Sequence", timelineBar: "Life Span of Mahadashas",
      completed: "Completed", running: "Running", upcoming: "Upcoming",
      doshaStatus: "Result", status: "Status", type: "Type", details: "Details",
      whatIs: "What is", remedies: "Remedies",
      manglikMetrics: "Manglik Assessment", marsPlacement: "Mars Placement", basedOnHouse: "Based on House Placement",
      basedOnAspect: "Based on Aspects", cancellation: "Cancellation Rules", manglikStatus: "Strength (system)",
      manglikPct: "Manglik Percentage", afterCancel: "After Cancellation", cancelled: "Cancelled",
      rulesMatched: "Rules Matched", effects: "Effects", conclusion: "Conclusion",
      sadeSatiStatus: "Sade Sati Status", considerationDate: "Checked on", transitSaturn: "Saturn Sign (transit)",
      saturnRetro: "Saturn Retrograde", natalSaturn: "Natal Saturn",
      nakDetails: "Birth Nakshatra", nakPrediction: "Daily Nakshatra Prediction", nakPredictionNote: "Daily prediction returned by the connected system for the date of report generation.",
      keyPlanets: "Key Planets", houseCard: function (n) { return n + " House"; },
      d9Placements: "Navamsha (D9) Placements", d9Seventh: "7th House in D9", inD9: "in D9",
      manglikSummary: "Manglik Status",
      gemIntro: "Gemstone suggestions exactly as returned by the connected calculation system. Traditionally, a gemstone is worn only after its suitability is confirmed by a qualified astrologer.",
      rudraksha: "Rudraksha Suggestion", recommendation: "Recommendation", existingRemedies: "Suggested Remedies",
      favourable: "Favourable Details", numbers: "Core Numbers", radical: "Radical Number", destiny: "Destiny Number", nameNumber: "Name Number",
      summaryIntro: "A one-page overview of the key indicators in this report.",
      keyIndicators: "Key Indicators", doshaResults: "Dosha Results", currentPeriod: "Current Period",
      reportSections: "Sections Included",
      lifeStone: "Life Stone", noneDetected: "None detected",
      explain: {
        lagna: "The Lagna (Ascendant) is the zodiac sign rising on the eastern horizon at the moment of birth. It forms the first house of the birth chart, and every other house is counted from it, which is why the Lagna chart (D1) is the foundation for reading the whole horoscope.",
        navamsha: "The Navamsha (D9) divides each sign into nine equal parts of 3°20′. It is traditionally studied alongside the birth chart, especially for marriage and partnerships and for judging the inner strength of the planets.",
        moon: "The Moon chart (Chandra Kundli) takes the Moon's sign as the first house. Vedic astrologers read it alongside the Lagna chart for the mind and emotional life, and transits such as Sade Sati are counted from the Moon.",
        sun: "The Sun chart (Surya Kundli) takes the Sun's sign as the first house. It is traditionally consulted for vitality, authority and one's sense of purpose.",
        houses: "Each of the twelve houses (bhavas) of the birth chart governs particular areas of life. For every house below you will find the sign it holds, the ruling planet of that sign, the house in which that ruler sits, the planets occupying the house and its traditional significations.",
        houses2: "The second half of the zodiac wheel: houses seven to twelve cover partnership, longevity, fortune, career, gains and expenditure. The same details are listed for each house.",
        groups: "Classical Vedic astrology groups the twelve houses by their nature. The table shows each traditional group, the houses it contains and the planets this chart places in them.",
        planets: "The positions below are exactly as returned by the connected calculation system for the moment of birth, including each planet's nakshatra, pada and current state.",
        profile: "A card for each of the nine grahas, showing its sign, house, degree, nakshatra and state as recorded in this birth chart.",
        dashaDetail: "Each Mahadasha of this chart as an individual card, with its dates, length and the age range it covers. The running period also shows the current Antardasha.",
        dashaTimeline: "The full sequence of Mahadasha periods for this chart, with the start and end dates returned by the connected system. The running period is highlighted.",
        dasha: "Vimshottari Dasha is the 120-year planetary period system of Vedic astrology, reckoned from the Moon's nakshatra at birth. Each Mahadasha is divided into Antardasha, Pratyantar, Sookshma and Prana periods.",
        kaalSarp: "Kaal Sarp Dosha is traditionally said to form when all seven classical planets lie on one side of the Rahu–Ketu axis in the birth chart. The result below is the connected system's assessment of this chart.",
        manglik: "Manglik (Mangal) Dosha is traditionally assessed from the placement and aspects of Mars — and in some traditions other malefic planets — relative to key houses of the birth chart. Its strength and any cancellation below are exactly as assessed by the connected system.",
        nakshatra: "The birth nakshatra (Janma Nakshatra) is the lunar mansion occupied by the Moon at birth. It is the starting point of the Vimshottari Dasha, and the traditional attributes below are derived from it.",
        career: "Career and finance are traditionally studied from the 10th house (profession and status), the 2nd house (accumulated wealth), the 11th house (gains) and the 6th house (service and daily work). Their placements in this chart are listed below.",
        marriage: "Marriage and relationships are traditionally studied from the 7th house and its lord, from Venus and Jupiter, and from the Navamsha (D9) chart. Their placements in this chart are listed below.",
        health: "Traditional astrology looks at the 1st house (body and vitality), the 6th house (illness and recovery), the 8th house (longevity) and the 12th house (rest and expenditure). These are traditional indications only.",
        healthNote: "Astrological indications are traditional in nature and are not a medical diagnosis. For any health concern, please consult a qualified medical professional."
      },
      houseSignif: [
        "Self, body, personality", "Wealth, family, speech", "Courage, siblings, efforts", "Home, mother, comforts",
        "Children, intellect, creativity", "Health, service, obstacles", "Marriage, partnership", "Longevity, transformation",
        "Fortune, dharma, father", "Career, status, karma", "Gains, income, friends", "Expenses, losses, liberation"
      ]
    },
    hi: {
      ksTypesH: "कालसर्प के शास्त्रीय प्रकार (संदर्भ)",
      ksTypesNote: "केवल संदर्भ हेतु: शास्त्रों में राहु की भाव-स्थिति के अनुसार कालसर्प योग के बारह प्रकार बताए गए हैं। ऊपर दिया गया परिणाम इस कुंडली के लिए प्रणाली का मूल्यांकन है।",
      ksTypes: ["अनंत", "कुलिक", "वासुकी", "शंखपाल", "पद्म", "महापद्म", "तक्षक", "कर्कोटक", "शंखचूड़", "घातक", "विषधर", "शेषनाग"],
      rahuIn: function (n) { return "राहु " + n + "वें भाव में"; },
      secBirthOnly: "जन्म विवरण", secPanchang: "लग्न, राशि एवं पंचांग", secProfile: "ग्रह परिचय",
      secD1: "लग्न कुंडली", secD9: "नवांश कुंडली", secHouses1: "भाव विश्लेषण · भाव 1–6", secHouses2: "भाव विश्लेषण · भाव 7–12",
      secGroups: "भाव समूह", secDashaDetail: "महादशा विस्तृत क्रम", secManglikObs: "मांगलिक दोष · निरीक्षण एवं उपाय",
      secPitruRem: "पितृ दोष · उपाय", secSadeSatiRem: "साढ़े साती · उपाय",
      contents: "विषय सूची", panchangNotesH: "पंचांग तत्वों के बारे में",
      panchangNotes: [
        ["तिथि", "चंद्र दिवस, जो चंद्रमा और सूर्य के बीच की कोणीय दूरी से निर्धारित होता है (एक चंद्र मास में 30 तिथियां)।"],
        ["नक्षत्र", "जन्म के समय चंद्रमा जिस नक्षत्र में हो; राशिचक्र के 27 समान भागों में से एक।"],
        ["योग", "सूर्य और चंद्रमा के संयुक्त अंशों से बनने वाले 27 योगों में से एक।"],
        ["करण", "तिथि का आधा भाग; चंद्र मास में 11 करण क्रम से आते हैं।"],
        ["अवकहड़ा", "जन्म नक्षत्र और चंद्र राशि से प्राप्त पारंपरिक गुण (वर्ण, वश्य, योनि, गण, नाड़ी आदि), जो कुंडली मिलान में भी प्रयुक्त होते हैं।"]
      ],
      stateNotesH: "ग्रह अवस्थाओं को समझें",
      stateNotes: [
        ["बाल", "बाल अवस्था — परंपरा अनुसार ग्रह आंशिक फल देता है।"],
        ["कुमार", "कुमार अवस्था — फल क्रमशः बढ़ते हैं।"],
        ["युवा", "युवा अवस्था — परंपरा अनुसार ग्रह पूर्ण बल में माना जाता है।"],
        ["वृद्ध", "वृद्ध अवस्था — परंपरा अनुसार फल कम हो जाते हैं।"],
        ["मृत", "मृत अवस्था — परंपरा अनुसार ग्रह के फल क्षीण माने जाते हैं।"],
        ["वक्री", "पृथ्वी से ग्रह पीछे चलता प्रतीत होता है; परंपरा अनुसार उसके विषय दोहराए या आत्मसात किए जाते हैं।"],
        ["अस्त", "ग्रह सूर्य के अत्यंत निकट है; परंपरा अनुसार उसके कारकत्व दब जाते हैं।"]
      ],
      retroPlanets: "वक्री ग्रह", combustPlanets: "अस्त ग्रह",
      occupiedHouses: "ग्रहयुक्त भाव", emptyHouses: "रिक्त भाव",
      levelNotesH: "दशा के पांच स्तर",
      levelNotes: [
        "मुख्य अवधि, वर्षों तक — जीवन के एक चरण का व्यापक विषय।",
        "महादशा के भीतर की उप-अवधि, महीनों से वर्षों तक।",
        "उप-उप-अवधि, सप्ताहों से महीनों तक।",
        "सूक्ष्म अवधि, दिनों से सप्ताहों तक।",
        "सबसे सूक्ष्म अवधि, घंटों से दिनों तक।"
      ],
      nodeAxis: "राहु–केतु अक्ष (ग्रह आधार)", noCancellation: "प्रणाली द्वारा कोई परिहार नियम नहीं लौटाया गया।",
      interpretation: "व्याख्या (प्रणाली)", tradRemedies: "पारंपरिक उपाय", pitruBasis: "संबंधित ग्रह स्थिति",
      remedyGroups: [
        { name: "रुद्राक्ष", re: "rudraksha|रुद्राक्ष" },
        { name: "दान एवं व्रत", re: "donat|fast|charit|feed|दान|व्रत|उपवास" },
        { name: "हनुमान उपासना", re: "hanuman|हनुमान" },
        { name: "शनि उपाय", re: "shani|saturn|yantra|शनि|यंत्र" }
      ],
      remedyOther: "सामान्य उपाय",
      careerH: "करियर एवं व्यवसाय", financeH: "धन एवं लाभ", tenthLord: "दशमेश", careerPlanets: "करियर से जुड़े ग्रह",
      mantraH: "मंत्र एवं उपासना",
      d1Tag: " (लग्न)", d9Tag: " (नवांश)", d9Short: "नवांश", retroMark: "व",
      seventhLord: "सप्तमेश", seventhLordShort: "सप्तमेश", houseGroupsH: "भाव समूह", groupCol: "समूह", meaningCol: "पारंपरिक अर्थ", ageCol: "आयु",
      houseGroups: [
        { name: "केंद्र", houses: [1, 4, 7, 10], note: "कुंडली के स्तंभ: स्वयं, घर, साझेदारी, करियर" },
        { name: "त्रिकोण", houses: [1, 5, 9], note: "धर्म, पुण्य और भाग्य के भाव" },
        { name: "दुःस्थान (त्रिक)", houses: [6, 8, 12], note: "बाधा, परिवर्तन और व्यय के भाव" },
        { name: "उपचय", houses: [3, 6, 10, 11], note: "समय और प्रयास से उन्नति देने वाले भाव" },
        { name: "पणफर", houses: [2, 5, 8, 11], note: "संचय और स्थायित्व के भाव" },
        { name: "आपोक्लिम", houses: [3, 6, 9, 12], note: "सीख, समायोजन और परिवर्तन के भाव" },
        { name: "मारक", houses: [2, 7], note: "परंपरा में आयु-निर्णय के लिए देखे जाने वाले भाव" },
        { name: "धर्म त्रिकोण", houses: [1, 5, 9], note: "उद्देश्य, धर्म और उच्च शिक्षा" },
        { name: "अर्थ त्रिकोण", houses: [2, 6, 10], note: "धन, आजीविका और भौतिक सुरक्षा" },
        { name: "काम त्रिकोण", houses: [3, 7, 11], note: "इच्छाएं, संबंध और आकांक्षाएं" },
        { name: "मोक्ष त्रिकोण", houses: [4, 8, 12], note: "आंतरिक जीवन, परिवर्तन और मोक्ष" }
      ],
      secBirth: "जन्म विवरण एवं पंचांग", secPlanets: "ग्रह स्थिति", secLagna: "लग्न कुंडली एवं नवांश",
      secMoon: "चंद्र एवं सूर्य कुंडली", secHouses: "भाव स्थिति", secDasha: "विंशोत्तरी दशा",
      secDashaTimeline: "महादशा क्रम", secKaalSarp: "कालसर्प दोष", secManglik: "मांगलिक दोष",
      secPitru: "पितृ दोष", secSadeSati: "साढ़े साती एवं शनि", secNakshatra: "नक्षत्र विश्लेषण",
      secCareer: "करियर एवं धन", secMarriage: "विवाह एवं संबंध", secHealth: "स्वास्थ्य एवं सामान्य जीवन",
      secGems: "रत्न सुझाव", secRemedies: "रुद्राक्ष एवं उपाय", secNumerology: "अंक ज्योतिष",
      secSummary: "KundliPlanet सारांश", secClosing: "रिपोर्ट विवरण",
      birthDetails: "जन्म विवरण", panchang: "जन्म के समय पंचांग", lagnaRashi: "लग्न एवं राशि", avakahada: "अवकहड़ा विवरण",
      tithi: "तिथि", yoga: "योग", karana: "करण", charan: "चरण (पाद)", tatva: "तत्व",
      varna: "वर्ण", vashya: "वश्य", yoni: "योनि", gan: "गण", nadi: "नाड़ी", yunja: "युंजा", paya: "पाया", nameAlphabet: "नाम अक्षर",
      planetTable: "ग्रह स्थिति (लग्न कुंडली)", planetCards: "ग्रह परिचय",
      lagnaChart: "लग्न कुंडली", navamshaChart: "नवांश कुंडली", moonChart: "चंद्र कुंडली", sunChart: "सूर्य कुंडली",
      aboutLagna: "लग्न के बारे में", aboutNavamsha: "नवांश के बारे में", lagnaDetails: "लग्न विवरण", navLagna: "नवांश लग्न",
      lordPlacedIn: "स्वामी की स्थिति", ascDegree: "लग्न अंश",
      moonDetails: "चंद्र विवरण", sunDetails: "सूर्य विवरण", moonDegree: "चंद्र अंश", sunDegree: "सूर्य अंश",
      houseCol: "भाव", signCol: "राशि", lordCol: "स्वामी", lordInCol: "स्वामी का भाव", occupantsCol: "ग्रह", signifCol: "पारंपरिक कारकत्व",
      currentDasha: "वर्तमान दशा अवधि", runningMaha: "चालू महादशा", runningAntar: "चालू अंतर्दशा",
      levels: ["महादशा", "अंतर्दशा", "प्रत्यंतर दशा", "सूक्ष्म दशा", "प्राण दशा"],
      mahaSequence: "महादशा क्रम", timelineBar: "महादशाओं की जीवन-अवधि",
      completed: "पूर्ण", running: "चालू", upcoming: "आगामी",
      doshaStatus: "परिणाम", status: "स्थिति", type: "प्रकार", details: "विवरण",
      whatIs: "क्या है", remedies: "उपाय",
      manglikMetrics: "मांगलिक मूल्यांकन", marsPlacement: "मंगल की स्थिति", basedOnHouse: "भाव स्थिति के आधार पर",
      basedOnAspect: "दृष्टि के आधार पर", cancellation: "परिहार नियम", manglikStatus: "प्रबलता (प्रणाली)",
      manglikPct: "मांगलिक प्रतिशत", afterCancel: "परिहार के बाद", cancelled: "परिहार",
      rulesMatched: "लागू नियम", effects: "प्रभाव", conclusion: "निष्कर्ष",
      sadeSatiStatus: "साढ़े साती स्थिति", considerationDate: "जांच तिथि", transitSaturn: "शनि राशि (गोचर)",
      saturnRetro: "शनि वक्री", natalSaturn: "जन्म कुंडली में शनि",
      nakDetails: "जन्म नक्षत्र", nakPrediction: "दैनिक नक्षत्र भविष्यफल", nakPredictionNote: "रिपोर्ट निर्माण की तिथि के लिए जुड़ी प्रणाली द्वारा दिया गया दैनिक भविष्यफल।",
      keyPlanets: "प्रमुख ग्रह", houseCard: function (n) { return n + "वां भाव"; },
      d9Placements: "नवांश स्थिति", d9Seventh: "नवांश में सप्तम भाव", inD9: "नवांश में",
      manglikSummary: "मांगलिक स्थिति",
      gemIntro: "रत्न सुझाव ठीक वैसे ही दिए गए हैं जैसे जुड़ी गणना प्रणाली ने लौटाए हैं। परंपरागत रूप से कोई भी रत्न योग्य ज्योतिषी से उपयुक्तता की पुष्टि के बाद ही धारण किया जाता है।",
      rudraksha: "रुद्राक्ष सुझाव", recommendation: "सुझाव", existingRemedies: "सुझाए गए उपाय",
      favourable: "शुभ विवरण", numbers: "मुख्य अंक", radical: "मूलांक", destiny: "भाग्यांक", nameNumber: "नामांक",
      summaryIntro: "इस रिपोर्ट के प्रमुख संकेतकों का एक पृष्ठ में सार।",
      keyIndicators: "प्रमुख संकेतक", doshaResults: "दोष परिणाम", currentPeriod: "वर्तमान अवधि",
      reportSections: "रिपोर्ट के खंड",
      lifeStone: "जीवन रत्न", noneDetected: "कोई नहीं",
      explain: {
        lagna: "लग्न वह राशि है जो जन्म के क्षण पूर्वी क्षितिज पर उदित हो रही होती है। यही जन्म कुंडली का प्रथम भाव बनती है और शेष सभी भाव इसी से गिने जाते हैं, इसलिए लग्न कुंडली पूरी कुंडली के अध्ययन की नींव है।",
        navamsha: "नवांश कुंडली प्रत्येक राशि को 3°20′ के नौ समान भागों में बांटता है। परंपरागत रूप से इसे जन्म कुंडली के साथ, विशेषकर विवाह और साझेदारी तथा ग्रहों के आंतरिक बल के लिए देखा जाता है।",
        moon: "चंद्र कुंडली में चंद्रमा की राशि को प्रथम भाव माना जाता है। वैदिक ज्योतिष में मन और भावनात्मक जीवन के लिए इसे लग्न कुंडली के साथ देखा जाता है, और साढ़े साती जैसे गोचर चंद्रमा से ही गिने जाते हैं।",
        sun: "सूर्य कुंडली में सूर्य की राशि को प्रथम भाव माना जाता है। परंपरागत रूप से इसे ऊर्जा, अधिकार और जीवन-उद्देश्य के लिए देखा जाता है।",
        houses: "जन्म कुंडली के बारह भाव जीवन के अलग-अलग क्षेत्रों से जुड़े हैं। नीचे प्रत्येक भाव की राशि, उस राशि का स्वामी ग्रह, वह स्वामी किस भाव में है, भाव में स्थित ग्रह और उसके पारंपरिक कारकत्व दिए गए हैं।",
        houses2: "राशिचक्र का दूसरा भाग: सप्तम से द्वादश भाव साझेदारी, आयु, भाग्य, करियर, लाभ और व्यय से जुड़े हैं। प्रत्येक भाव के लिए वही विवरण दिए गए हैं।",
        groups: "शास्त्रीय वैदिक ज्योतिष बारह भावों को उनकी प्रकृति के अनुसार समूहों में बांटता है। तालिका में प्रत्येक पारंपरिक समूह, उसके भाव और इस कुंडली में उनमें स्थित ग्रह दिए गए हैं।",
        planets: "नीचे दी गई ग्रह स्थितियां जन्म के क्षण के लिए जुड़ी गणना प्रणाली से ठीक वैसी ही हैं, जिनमें प्रत्येक ग्रह का नक्षत्र, पाद और अवस्था शामिल है।",
        profile: "नौ ग्रहों में से प्रत्येक का परिचय कार्ड, जिसमें इस कुंडली में उसकी राशि, भाव, अंश, नक्षत्र और अवस्था दी गई है।",
        dashaDetail: "इस कुंडली की प्रत्येक महादशा एक अलग कार्ड में, उसकी तिथियों, अवधि और आयु-सीमा के साथ। चालू महादशा में वर्तमान अंतर्दशा भी दी गई है।",
        dashaTimeline: "इस कुंडली की संपूर्ण महादशा श्रृंखला, जुड़ी प्रणाली द्वारा दी गई आरंभ व समाप्ति तिथियों के साथ। चालू अवधि को विशेष रूप से दर्शाया गया है।",
        dasha: "विंशोत्तरी दशा वैदिक ज्योतिष की 120 वर्ष की ग्रह-दशा पद्धति है, जिसकी गणना जन्म के समय चंद्रमा के नक्षत्र से होती है। प्रत्येक महादशा अंतर्दशा, प्रत्यंतर, सूक्ष्म और प्राण दशा में विभाजित होती है।",
        kaalSarp: "परंपरा के अनुसार कालसर्प दोष तब बनता है जब सातों ग्रह जन्म कुंडली में राहु-केतु अक्ष के एक ही ओर स्थित हों। नीचे दिया गया परिणाम इस कुंडली के लिए जुड़ी प्रणाली का मूल्यांकन है।",
        manglik: "मांगलिक (मंगल) दोष का मूल्यांकन परंपरागत रूप से कुंडली के प्रमुख भावों के सापेक्ष मंगल — और कुछ परंपराओं में अन्य पाप ग्रहों — की स्थिति व दृष्टि से किया जाता है। नीचे दी गई प्रबलता और परिहार ठीक वैसे ही हैं जैसे जुड़ी प्रणाली ने आंके हैं।",
        nakshatra: "जन्म नक्षत्र वह नक्षत्र है जिसमें जन्म के समय चंद्रमा स्थित होता है। विंशोत्तरी दशा इसी से आरंभ होती है और नीचे दिए पारंपरिक गुण इसी से प्राप्त होते हैं।",
        career: "करियर और धन का अध्ययन परंपरागत रूप से दशम भाव (व्यवसाय व प्रतिष्ठा), द्वितीय भाव (संचित धन), एकादश भाव (लाभ) और षष्ठ भाव (सेवा व दैनिक कार्य) से किया जाता है। इस कुंडली में इनकी स्थिति नीचे दी गई है।",
        marriage: "विवाह और संबंधों का अध्ययन परंपरागत रूप से सप्तम भाव और उसके स्वामी, शुक्र और गुरु, तथा नवांश कुंडली से किया जाता है। इस कुंडली में इनकी स्थिति नीचे दी गई है।",
        health: "पारंपरिक ज्योतिष में प्रथम भाव (शरीर व ऊर्जा), षष्ठ भाव (रोग व स्वास्थ्य-लाभ), अष्टम भाव (आयु) और द्वादश भाव (विश्राम व व्यय) देखे जाते हैं। ये केवल पारंपरिक संकेत हैं।",
        healthNote: "ज्योतिषीय संकेत पारंपरिक प्रकृति के हैं और चिकित्सीय निदान नहीं हैं। किसी भी स्वास्थ्य समस्या के लिए योग्य चिकित्सक से परामर्श करें।"
      },
      houseSignif: [
        "स्वयं, शरीर, व्यक्तित्व", "धन, परिवार, वाणी", "साहस, भाई-बहन, पराक्रम", "घर, माता, सुख",
        "संतान, बुद्धि, रचनात्मकता", "स्वास्थ्य, सेवा, बाधाएं", "विवाह, साझेदारी", "आयु, परिवर्तन",
        "भाग्य, धर्म, पिता", "करियर, प्रतिष्ठा, कर्म", "लाभ, आय, मित्र", "व्यय, हानि, मोक्ष"
      ]
    }
  };

  // ------------------------------------------------------------------
  // Kundli Milan labels + general explanations
  // ------------------------------------------------------------------
  KP.M = {
    en: {
      secBirth: "Birth Details of Both", secOverview: "Compatibility Overview", secAshtakoot: "Ashtakoot Overview",
      secVarnaVashya: "Varna & Vashya Koota", secTaraYoni: "Tara & Yoni Koota", secMaitriGana: "Graha Maitri & Gana Koota",
      secBhakootNadi: "Bhakoot & Nadi Koota", secComplete: "Complete 36-Point Analysis",
      secGroomPlanets: "Groom's Planetary Details", secBridePlanets: "Bride's Planetary Details",
      secGroomChart: "Groom's Lagna Chart (D1)", secBrideChart: "Bride's Lagna Chart (D1)",
      secMoon: "Moon & Rashi Comparison", secManglik: "Manglik Comparison", secManglikDetail: "Manglik Detailed Analysis",
      secDosha: "Dosha & Compatibility Summary", secSummary: "Kundli Milan Summary",
      astroCompare: "Avakahada Comparison", attribute: "Attribute",
      totalScore: "Ashtakoot Score", maxScore: "Maximum", minRequired: "Minimum Required", gunas: "Gunas",
      scoreOutOf: function (r, m) { return r + " out of " + m + " gunas matched"; },
      comparison: "Chart Comparison", indicators: "Compatibility Indicators",
      koota: "Koota", score: "Score", obtained: "Obtained", areaOfLife: "Area of Life", total: "Total",
      rajju: "Rajju Dosha", vedha: "Vedha Dosha", manglikMatch: "Manglik Match", ashtakootPass: "Ashtakoot",
      passes: "Meets minimum", below: "Below minimum",
      siteResult: "Ashtakoot Result", ashtakootReport: "Ashtakoot Report (system)", doshaReport: "Dosha Analysis Report (system)",
      manglikReport: "Manglik Compatibility Report (system)",
      kootaNames: { varna: "Varna", vashya: "Vashya", tara: "Tara (Dina)", yoni: "Yoni", maitri: "Graha Maitri", gan: "Gana", bhakut: "Bhakoot", nadi: "Nadi" },
      kootaDef: {
        varna: "Varna Koota compares the spiritual temperament (varna) of the two Moon signs and reflects natural refinement and approach to work. Maximum 1 point.",
        vashya: "Vashya Koota compares the vashya groups of the two Moon signs and reflects natural attraction and mutual influence. Maximum 2 points.",
        tara: "Tara (Dina) Koota counts the nakshatras from one partner to the other and reflects comfort, well-being and prosperity. Maximum 3 points.",
        yoni: "Yoni Koota compares the animal symbols (yoni) of the two birth nakshatras and reflects physical and intimate compatibility. Maximum 4 points.",
        maitri: "Graha Maitri Koota compares the friendship between the lords of the two Moon signs and reflects mental affinity. Maximum 5 points.",
        gan: "Gana Koota compares the temperament class (Deva, Manushya or Rakshasa) of the two birth nakshatras. Maximum 6 points.",
        bhakut: "Bhakoot Koota examines the relative positions of the two Moon signs and reflects family welfare and prosperity. Maximum 7 points.",
        nadi: "Nadi Koota compares the nadi (Adi, Madhya or Antya) of the two birth nakshatras and is traditionally linked to health and progeny. Maximum 8 points."
      },
      overviewIntro: "Ashtakoot Milan compares eight aspects (kootas) of the groom's and bride's Moon-based charts, together worth 36 points (gunas). The results on these pages are exactly as calculated by the connected system.",
      moonNak: "Moon Nakshatra", moonDeg: "Moon Degree", moonHouse: "Moon House", moonKootas: "Moon-based Kootas",
      manglikStatusSite: "Manglik", manglikStrength: "Strength (system)", manglikPct: "Manglik Percentage", afterCancel: "After Cancellation",
      marsSign: "Mars Sign", marsHouse: "Mars House", marsDegree: "Mars Degree", marsNak: "Mars Nakshatra",
      basedOnHouse: "Based on House Placement", basedOnAspect: "Based on Aspects", cancellation: "Cancellation Rules",
      noCancellation: "No cancellation rule was returned.", isManglik: "Manglik", notManglik: "Not Manglik",
      chartMeta: "Chart Details", houseTable: "House Placements", planets: "Planets",
      indicator: "Indicator", result: "Result", details: "Details",
      verdict: "Overall Result", kootaSummary: "Koota Summary",
      groomLabel: "GROOM", brideLabel: "BRIDE"
    },
    hi: {
      secBirth: "दोनों का जन्म विवरण", secOverview: "अनुकूलता अवलोकन", secAshtakoot: "अष्टकूट अवलोकन",
      secVarnaVashya: "वर्ण एवं वश्य कूट", secTaraYoni: "तारा एवं योनि कूट", secMaitriGana: "ग्रह मैत्री एवं गण कूट",
      secBhakootNadi: "भकूट एवं नाड़ी कूट", secComplete: "संपूर्ण 36 गुण विश्लेषण",
      secGroomPlanets: "वर के ग्रह विवरण", secBridePlanets: "वधू के ग्रह विवरण",
      secGroomChart: "वर की लग्न कुंडली", secBrideChart: "वधू की लग्न कुंडली",
      secMoon: "चंद्र एवं राशि तुलना", secManglik: "मांगलिक तुलना", secManglikDetail: "मांगलिक विस्तृत विश्लेषण",
      secDosha: "दोष एवं अनुकूलता सारांश", secSummary: "कुंडली मिलान सारांश",
      astroCompare: "अवकहड़ा तुलना", attribute: "गुण",
      totalScore: "अष्टकूट अंक", maxScore: "अधिकतम", minRequired: "न्यूनतम आवश्यक", gunas: "गुण",
      scoreOutOf: function (r, m) { return m + " में से " + r + " गुण मिले"; },
      comparison: "कुंडली तुलना", indicators: "अनुकूलता संकेतक",
      koota: "कूट", score: "अंक", obtained: "प्राप्त", areaOfLife: "जीवन क्षेत्र", total: "योग",
      rajju: "रज्जु दोष", vedha: "वेध दोष", manglikMatch: "मांगलिक मिलान", ashtakootPass: "अष्टकूट",
      passes: "न्यूनतम पूर्ण", below: "न्यूनतम से कम",
      siteResult: "अष्टकूट परिणाम", ashtakootReport: "अष्टकूट रिपोर्ट (प्रणाली)", doshaReport: "दोष विश्लेषण रिपोर्ट (प्रणाली)",
      manglikReport: "मांगलिक अनुकूलता रिपोर्ट (प्रणाली)",
      kootaNames: { varna: "वर्ण", vashya: "वश्य", tara: "तारा (दिन)", yoni: "योनि", maitri: "ग्रह मैत्री", gan: "गण", bhakut: "भकूट", nadi: "नाड़ी" },
      kootaDef: {
        varna: "वर्ण कूट दोनों चंद्र राशियों के वर्ण (आध्यात्मिक स्वभाव) की तुलना करता है और स्वभाव की परिष्कृति व कार्य-दृष्टि को दर्शाता है। अधिकतम 1 अंक।",
        vashya: "वश्य कूट दोनों चंद्र राशियों के वश्य वर्ग की तुलना करता है और स्वाभाविक आकर्षण व पारस्परिक प्रभाव को दर्शाता है। अधिकतम 2 अंक।",
        tara: "तारा (दिन) कूट एक साथी के नक्षत्र से दूसरे तक की गणना करता है और सुख, कल्याण व समृद्धि को दर्शाता है। अधिकतम 3 अंक।",
        yoni: "योनि कूट दोनों जन्म नक्षत्रों के पशु प्रतीक (योनि) की तुलना करता है और शारीरिक व अंतरंग अनुकूलता को दर्शाता है। अधिकतम 4 अंक।",
        maitri: "ग्रह मैत्री कूट दोनों चंद्र राशियों के स्वामियों की मित्रता की तुलना करता है और मानसिक सामंजस्य को दर्शाता है। अधिकतम 5 अंक।",
        gan: "गण कूट दोनों जन्म नक्षत्रों के गण (देव, मनुष्य या राक्षस) की तुलना करता है। अधिकतम 6 अंक।",
        bhakut: "भकूट कूट दोनों चंद्र राशियों की परस्पर स्थिति देखता है और पारिवारिक सुख व समृद्धि को दर्शाता है। अधिकतम 7 अंक।",
        nadi: "नाड़ी कूट दोनों जन्म नक्षत्रों की नाड़ी (आदि, मध्य या अंत्य) की तुलना करता है और परंपरागत रूप से स्वास्थ्य व संतान से जुड़ा है। अधिकतम 8 अंक।"
      },
      overviewIntro: "अष्टकूट मिलान वर और वधू की चंद्र-आधारित कुंडलियों के आठ पहलुओं (कूटों) की तुलना करता है, जिनका कुल मान 36 अंक (गुण) है। इन पृष्ठों के परिणाम ठीक वैसे ही हैं जैसे जुड़ी प्रणाली ने गणना की है।",
      moonNak: "चंद्र नक्षत्र", moonDeg: "चंद्र अंश", moonHouse: "चंद्र भाव", moonKootas: "चंद्र-आधारित कूट",
      manglikStatusSite: "मांगलिक", manglikStrength: "प्रबलता (प्रणाली)", manglikPct: "मांगलिक प्रतिशत", afterCancel: "परिहार के बाद",
      marsSign: "मंगल राशि", marsHouse: "मंगल भाव", marsDegree: "मंगल अंश", marsNak: "मंगल नक्षत्र",
      basedOnHouse: "भाव स्थिति के आधार पर", basedOnAspect: "दृष्टि के आधार पर", cancellation: "परिहार नियम",
      noCancellation: "कोई परिहार नियम नहीं लौटाया गया।", isManglik: "मांगलिक", notManglik: "मांगलिक नहीं",
      chartMeta: "कुंडली विवरण", houseTable: "भाव स्थिति", planets: "ग्रह",
      indicator: "संकेतक", result: "परिणाम", details: "विवरण",
      verdict: "समग्र परिणाम", kootaSummary: "कूट सारांश",
      groomLabel: "वर", brideLabel: "वधू"
    }
  };

  // ------------------------------------------------------------------
  // Display formatting shared by both reports (no astrology logic)
  // ------------------------------------------------------------------
  var clean = KP.clean, has = KP.has;
  // Pulls readable text out of API fields that are sometimes nested objects
  // (same field precedence the Kundli page itself uses).
  function textOf(v) {
    if (typeof v === "string") return KP.stripHtml(clean(v));
    if (typeof v === "number") return String(v);
    if (v && typeof v === "object") {
      var keys = ["report", "one_line", "match_report", "text", "description", "summary", "message", "detail", "conclusion"];
      for (var i = 0; i < keys.length; i++) if (typeof v[keys[i]] === "string" && clean(v[keys[i]])) return KP.stripHtml(clean(v[keys[i]]));
    }
    return "";
  }
  KP.textOf = textOf;

  function fmtDate(d, lang, withTime) {
    if (!(d instanceof Date) || isNaN(d.getTime())) return "";
    var o = { day: "2-digit", month: "short", year: "numeric" };
    if (withTime) { o.hour = "2-digit"; o.minute = "2-digit"; o.hour12 = false; }
    try { return new Intl.DateTimeFormat(lang === "hi" ? "hi-IN" : "en-GB", o).format(d); } catch (e) { return d.toDateString(); }
  }
  KP.fmtDate = fmtDate;

  function fmtBirthDate(p, lang) {
    if (!p || !p.year) return "";
    var d = new Date(p.year, (p.month || 1) - 1, p.day || 1);
    try { return new Intl.DateTimeFormat(lang === "hi" ? "hi-IN" : "en-GB", { day: "2-digit", month: "long", year: "numeric" }).format(d); } catch (e) { return ""; }
  }
  function pad2(n) { return String(n).padStart(2, "0"); }
  function fmtTime(p) { return p && p.hour != null ? pad2(p.hour) + ":" + pad2(p.min || 0) : ""; }
  function fmtCoord(v, pos, neg) {
    var n = Number(v);
    if (v === null || v === undefined || v === "" || isNaN(n)) return "";
    return Math.abs(n).toFixed(4) + "° " + (n >= 0 ? pos : neg);
  }
  function fmtTz(v, lang) {
    var n = Number(v);
    if (v === null || v === undefined || v === "" || isNaN(n)) return "";
    var sign = n >= 0 ? "+" : "-";
    var a = Math.abs(n), h = Math.floor(a), m = Math.round((a - h) * 60);
    return (lang === "hi" ? "जीएमटी " : "GMT ") + sign + pad2(h) + ":" + pad2(m);
  }
  // Cardinal letters per language: [N, S, E, W].
  KP.cardinal = function (lang) { return lang === "hi" ? ["उ", "द", "पू", "प"] : ["N", "S", "E", "W"]; };
  KP.fmt = { birthDate: fmtBirthDate, time: fmtTime, coord: fmtCoord, tz: fmtTz };

  KP.planetState = function (p, c) {
    if (!p) return "";
    return [p.awastha ? c.t(p.awastha) : "", p.retrograde ? c.L.retro : "", p.isSet ? c.L.combust : ""].filter(has).join(", ");
  };

  KP.houseLabel = function (n, c) { return n ? (c.lang === "hi" ? n + "वां भाव" : c.L.house + " " + n) : ""; };

  KP.planetTableColumns = function (c) {
    var L = c.L;
    return [
      { label: L.planet, w: 1.15 }, { label: L.degree, w: 0.9 }, { label: L.sign, w: 1.0 }, { label: L.signLord, w: 1.0 },
      { label: L.house, w: 0.72 }, { label: L.nakshatra, w: 1.45 }, { label: L.pada, w: 0.55 }, { label: L.nakLord, w: 1.0 }, { label: L.state, w: 1.5 }
    ];
  };

  KP.planetCardItems = function (planets, c) {
    return planets.map(function (p) {
      return {
        key: p.name,
        name: c.t(p.name),
        line1: [c.t(p.sign), KP.houseLabel(p.house, c)].filter(has).join("  ·  "),
        line2: has(p.nakshatra) ? c.t(p.nakshatra) + (has(p.nakshatraPada) ? " (" + c.L.pada + " " + p.nakshatraPada + ")" : "") : "",
        status: KP.planetState(p, c)
      };
    });
  };
})(window);

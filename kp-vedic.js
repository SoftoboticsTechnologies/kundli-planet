/*
 * Kundli Planet — Vedic design layer (shared across every page).
 * Plain global-scope script, loaded with `defer` after support.js.
 *
 * Provides:
 *  - window.KP.data   traditional reference data (rashis, grahas, nakshatras,
 *                      gemstones, Vimshottari dasha years). Correspondences
 *                      only; no calculations are faked here.
 *  - window.KP.art    SVG illustrations (ZodiacWheel, KundliChart, twin charts,
 *                      moon phases, Lo Shu grid, yantra, navagraha mandala...)
 *  - window.KP.icon   small line icons
 *  - the shared header (mega menus), mobile drawer, bottom tool bar and footer
 *  - contextual cosmic treatment for inner-page heroes and article banners
 *  - [data-kp-art] / [data-kp-icon] slots, .kp-reveal entrances, scrollers
 *  - BreadcrumbList / Article structured data from the rendered page
 *
 * Page templates keep their own language toggle and consult dialog; the shared
 * header forwards to them (hidden [data-langbtn] / [data-consultbtn]) or, on
 * the homepage, dispatches `kp:lang` / `kp:consult` window events.
 */
(function (global) {
  "use strict";
  var doc = document, root = doc.documentElement;
  root.classList.add("kp-js");

  var T = "︎"; // text presentation selector: keeps ♈ ♂ ♀ etc. from rendering as emoji
  var WA = "919097190900";
  var PHONE = "9097190900";
  var EMAIL = "rashiring24@gmail.com";

  // ------------------------------------------------------------------ data
  var SIGNS = [
    { en: "Aries", hi: "मेष", tr: "Mesh", g: "♈", d: "Mar 21 – Apr 19", dh: "21 मार्च – 19 अप्रैल", lord: "mars", el: 0, en_s: "aries", hi_s: "mesh" },
    { en: "Taurus", hi: "वृषभ", tr: "Vrishabh", g: "♉", d: "Apr 20 – May 20", dh: "20 अप्रैल – 20 मई", lord: "venus", el: 1, en_s: "taurus", hi_s: "vrishabh" },
    { en: "Gemini", hi: "मिथुन", tr: "Mithun", g: "♊", d: "May 21 – Jun 20", dh: "21 मई – 20 जून", lord: "mercury", el: 2, en_s: "gemini", hi_s: "mithun" },
    { en: "Cancer", hi: "कर्क", tr: "Kark", g: "♋", d: "Jun 21 – Jul 22", dh: "21 जून – 22 जुलाई", lord: "moon", el: 3, en_s: "cancer", hi_s: "kark" },
    { en: "Leo", hi: "सिंह", tr: "Singh", g: "♌", d: "Jul 23 – Aug 22", dh: "23 जुलाई – 22 अगस्त", lord: "sun", el: 0, en_s: "leo", hi_s: "singh" },
    { en: "Virgo", hi: "कन्या", tr: "Kanya", g: "♍", d: "Aug 23 – Sep 22", dh: "23 अगस्त – 22 सितंबर", lord: "mercury", el: 1, en_s: "virgo", hi_s: "kanya" },
    { en: "Libra", hi: "तुला", tr: "Tula", g: "♎", d: "Sep 23 – Oct 22", dh: "23 सितंबर – 22 अक्टूबर", lord: "venus", el: 2, en_s: "libra", hi_s: "tula" },
    { en: "Scorpio", hi: "वृश्चिक", tr: "Vrishchik", g: "♏", d: "Oct 23 – Nov 21", dh: "23 अक्टूबर – 21 नवंबर", lord: "mars", el: 3, en_s: "scorpio", hi_s: "vrishchik" },
    { en: "Sagittarius", hi: "धनु", tr: "Dhanu", g: "♐", d: "Nov 22 – Dec 21", dh: "22 नवंबर – 21 दिसंबर", lord: "jupiter", el: 0, en_s: "sagittarius", hi_s: "dhanu" },
    { en: "Capricorn", hi: "मकर", tr: "Makar", g: "♑", d: "Dec 22 – Jan 19", dh: "22 दिसंबर – 19 जनवरी", lord: "saturn", el: 1, en_s: "capricorn", hi_s: "makar" },
    { en: "Aquarius", hi: "कुंभ", tr: "Kumbh", g: "♒", d: "Jan 20 – Feb 18", dh: "20 जनवरी – 18 फरवरी", lord: "saturn", el: 2, en_s: "aquarius", hi_s: "kumbh" },
    { en: "Pisces", hi: "मीन", tr: "Meen", g: "♓", d: "Feb 19 – Mar 20", dh: "19 फरवरी – 20 मार्च", lord: "jupiter", el: 3, en_s: "pisces", hi_s: "meen" }
  ];
  var ELEMENTS = [
    { en: "Fire", hi: "अग्नि" }, { en: "Earth", hi: "पृथ्वी" }, { en: "Air", hi: "वायु" }, { en: "Water", hi: "जल" }
  ];
  // Navagraha: classical correspondences as used across the site's gemstone pages.
  var PLANETS = [
    { k: "sun", en: "Sun", sa: "Surya", hi: "सूर्य", g: "☉", ab: "Su", gem: "Ruby", gemHi: "माणिक्य", day: "Sunday", dayHi: "रविवार", metal: "Gold or copper", metalHi: "स्वर्ण या ताम्र",
      q: "Soul, vitality, father, authority", qHi: "आत्मा, ऊर्जा, पिता, अधिकार",
      s: "The atmakaraka. Its strength colours confidence, health and standing.", sh: "आत्मकारक ग्रह। इसका बल आत्मविश्वास, स्वास्थ्य और प्रतिष्ठा को प्रभावित करता है।",
      orb: "radial-gradient(circle at 34% 30%,#FFE9A6,#F29B1D 52%,#A8480A)" },
    { k: "moon", en: "Moon", sa: "Chandra", hi: "चंद्र", g: "☽", ab: "Mo", gem: "Pearl", gemHi: "मोती", day: "Monday", dayHi: "सोमवार", metal: "Silver", metalHi: "चाँदी",
      q: "Mind, emotions, mother, nourishment", qHi: "मन, भावनाएँ, माता, पोषण",
      s: "Rules the mind. The Moon sign (rashi) and nakshatra are read from it.", sh: "मन का कारक। जन्म राशि और नक्षत्र चंद्रमा से ही देखे जाते हैं।",
      orb: "radial-gradient(circle at 34% 30%,#FFFFFF,#D9DEE8 55%,#8792A8)" },
    { k: "mars", en: "Mars", sa: "Mangal", hi: "मंगल", g: "♂", ab: "Ma", gem: "Red Coral", gemHi: "मूंगा", day: "Tuesday", dayHi: "मंगलवार", metal: "Gold or copper", metalHi: "स्वर्ण या ताम्र",
      q: "Courage, energy, siblings, land", qHi: "साहस, ऊर्जा, भाई-बहन, भूमि",
      s: "The planet of drive. Its house placement is the basis of Mangal Dosha.", sh: "पराक्रम का ग्रह। इसकी भाव स्थिति से मंगल दोष देखा जाता है।",
      orb: "radial-gradient(circle at 34% 30%,#FFA489,#D0391B 55%,#6E1406)" },
    { k: "mercury", en: "Mercury", sa: "Budh", hi: "बुध", g: "☿", ab: "Me", gem: "Emerald", gemHi: "पन्ना", day: "Wednesday", dayHi: "बुधवार", metal: "Gold or silver", metalHi: "स्वर्ण या चाँदी",
      q: "Intellect, speech, trade, learning", qHi: "बुद्धि, वाणी, व्यापार, शिक्षा",
      s: "Governs communication and analysis; the prince among grahas.", sh: "संवाद और विश्लेषण का ग्रह; ग्रहों में राजकुमार।",
      orb: "radial-gradient(circle at 34% 30%,#A8F2CB,#1E9E62 55%,#0A4A2D)" },
    { k: "jupiter", en: "Jupiter", sa: "Guru", hi: "गुरु", g: "♃", ab: "Ju", gem: "Yellow Sapphire", gemHi: "पुखराज", day: "Thursday", dayHi: "गुरुवार", metal: "Gold", metalHi: "स्वर्ण",
      q: "Wisdom, dharma, teachers, children", qHi: "ज्ञान, धर्म, गुरु, संतान",
      s: "The great benefic. Its aspect is traditionally seen as protective.", sh: "सबसे शुभ ग्रह। इसकी दृष्टि परंपरा में रक्षक मानी जाती है।",
      orb: "radial-gradient(circle at 34% 30%,#FFEDB3,#E3A71E 55%,#80540A)" },
    { k: "venus", en: "Venus", sa: "Shukra", hi: "शुक्र", g: "♀", ab: "Ve", gem: "Diamond", gemHi: "हीरा", day: "Friday", dayHi: "शुक्रवार", metal: "Silver, platinum or gold", metalHi: "चाँदी, प्लैटिनम या स्वर्ण",
      q: "Love, marriage, arts, comfort", qHi: "प्रेम, विवाह, कला, सुख",
      s: "Karaka of relationships; central to marriage and compatibility readings.", sh: "संबंधों का कारक; विवाह और मिलान में इसका विशेष स्थान है।",
      orb: "radial-gradient(circle at 34% 30%,#FFFFFF,#F2D6E4 55%,#A8839B)" },
    { k: "saturn", en: "Saturn", sa: "Shani", hi: "शनि", g: "♄", ab: "Sa", gem: "Blue Sapphire", gemHi: "नीलम", day: "Saturday", dayHi: "शनिवार", metal: "Silver or panchdhatu", metalHi: "चाँदी या पंचधातु",
      q: "Discipline, karma, service, endurance", qHi: "अनुशासन, कर्म, सेवा, धैर्य",
      s: "The slow teacher. Sade Sati is read from its transit over the Moon.", sh: "धीमा पर धैर्य सिखाने वाला ग्रह। चंद्र पर इसके गोचर से साढ़ेसाती देखी जाती है।",
      orb: "radial-gradient(circle at 34% 30%,#A9C2FF,#2B4CB8 55%,#0E1A52)" },
    { k: "rahu", en: "Rahu", sa: "Rahu", hi: "राहु", g: "☊", ab: "Ra", gem: "Hessonite", gemHi: "गोमेद", day: "Saturday", dayHi: "शनिवार", metal: "Silver or panchdhatu", metalHi: "चाँदी या पंचधातु",
      q: "Ambition, the foreign, the unconventional", qHi: "महत्वाकांक्षा, विदेश, अपरंपरागत",
      s: "The Moon's north node, a shadow graha that magnifies what it touches.", sh: "चंद्रमा का उत्तर पात, एक छाया ग्रह जो जिस भाव को छूता है उसे बढ़ाता है।",
      orb: "radial-gradient(circle at 34% 30%,#C4B4E4,#4B3A78 55%,#1A1232)" },
    { k: "ketu", en: "Ketu", sa: "Ketu", hi: "केतु", g: "☋", ab: "Ke", gem: "Cat's Eye", gemHi: "लहसुनिया", day: "Tuesday", dayHi: "मंगलवार", metal: "Silver or panchdhatu", metalHi: "चाँदी या पंचधातु",
      q: "Detachment, insight, spirituality", qHi: "वैराग्य, अंतर्दृष्टि, आध्यात्म",
      s: "The south node. Traditionally linked with past karma and moksha.", sh: "दक्षिण पात। परंपरा में पूर्व कर्म और मोक्ष से जोड़ा जाता है।",
      orb: "radial-gradient(circle at 34% 30%,#EDD3AE,#8C6A45 55%,#3A2716)" }
  ];
  var PMAP = {}; PLANETS.forEach(function (p) { PMAP[p.k] = p; });
  // 27 nakshatras: lord follows the Vimshottari order, deity and symbol per the classical lists.
  var NAK = [
    ["Ashwini", "अश्विनी", "ketu", "Ashwini Kumaras", "अश्विनी कुमार", "Horse's head", "अश्व का मुख", 0],
    ["Bharani", "भरणी", "venus", "Yama", "यम", "Yoni", "योनि", 1],
    ["Krittika", "कृत्तिका", "sun", "Agni", "अग्नि", "Razor, flame", "छुरा, अग्निशिखा", 2],
    ["Rohini", "रोहिणी", "moon", "Brahma", "ब्रह्मा", "Chariot", "रथ", 1],
    ["Mrigashira", "मृगशिरा", "mars", "Soma", "सोम", "Deer's head", "मृग का मुख", 0],
    ["Ardra", "आर्द्रा", "rahu", "Rudra", "रुद्र", "Teardrop", "अश्रु-बिंदु", 1],
    ["Punarvasu", "पुनर्वसु", "jupiter", "Aditi", "अदिति", "Bow and quiver", "धनुष और तरकश", 0],
    ["Pushya", "पुष्य", "saturn", "Brihaspati", "बृहस्पति", "Cow's udder", "गाय का थन", 0],
    ["Ashlesha", "आश्लेषा", "mercury", "Nagas", "नाग", "Coiled serpent", "कुंडली मारे सर्प", 2],
    ["Magha", "मघा", "ketu", "Pitris", "पितर", "Royal throne", "राजसिंहासन", 2],
    ["Purva Phalguni", "पूर्वा फाल्गुनी", "venus", "Bhaga", "भग", "Front legs of a bed", "पलंग के अगले पाए", 1],
    ["Uttara Phalguni", "उत्तरा फाल्गुनी", "sun", "Aryaman", "अर्यमा", "Back legs of a bed", "पलंग के पिछले पाए", 1],
    ["Hasta", "हस्त", "moon", "Savitr", "सविता", "Hand", "हाथ", 0],
    ["Chitra", "चित्रा", "mars", "Vishwakarma", "विश्वकर्मा", "Bright jewel", "चमकता रत्न", 2],
    ["Swati", "स्वाति", "rahu", "Vayu", "वायु", "Young sprout", "अंकुर", 0],
    ["Vishakha", "विशाखा", "jupiter", "Indra and Agni", "इंद्र और अग्नि", "Triumphal arch", "तोरण द्वार", 2],
    ["Anuradha", "अनुराधा", "saturn", "Mitra", "मित्र", "Lotus", "कमल", 0],
    ["Jyeshtha", "ज्येष्ठा", "mercury", "Indra", "इंद्र", "Earring", "कुंडल", 2],
    ["Mula", "मूल", "ketu", "Nirriti", "निऋति", "Bunch of roots", "जड़ों का गुच्छा", 2],
    ["Purva Ashadha", "पूर्वाषाढ़ा", "venus", "Apas", "अपः (जल)", "Winnowing fan", "सूप", 1],
    ["Uttara Ashadha", "उत्तराषाढ़ा", "sun", "Vishvedevas", "विश्वेदेव", "Elephant tusk", "हाथी दांत", 1],
    ["Shravana", "श्रवण", "moon", "Vishnu", "विष्णु", "Ear", "कान", 0],
    ["Dhanishta", "धनिष्ठा", "mars", "Eight Vasus", "अष्ट वसु", "Drum", "मृदंग", 2],
    ["Shatabhisha", "शतभिषा", "rahu", "Varuna", "वरुण", "Empty circle", "रिक्त वृत्त", 2],
    ["Purva Bhadrapada", "पूर्वा भाद्रपद", "jupiter", "Aja Ekapada", "अज एकपाद", "Front legs of a cot", "खाट के अगले पाए", 1],
    ["Uttara Bhadrapada", "उत्तरा भाद्रपद", "saturn", "Ahir Budhnya", "अहिर्बुध्न्य", "Back legs of a cot", "खाट के पिछले पाए", 1],
    ["Revati", "रेवती", "mercury", "Pushan", "पूषा", "Fish", "मछली", 0]
  ].map(function (n, i) {
    var start = i * 800; // minutes of arc: 13°20' = 800'
    return { n: i + 1, en: n[0], hi: n[1], lord: n[2], deity: n[3], deityHi: n[4], sym: n[5], symHi: n[6], gana: n[7],
      from: Math.floor(start / 1800), to: Math.floor((start + 799) / 1800) };
  });
  var GANA = [{ en: "Deva", hi: "देव" }, { en: "Manushya", hi: "मनुष्य" }, { en: "Rakshasa", hi: "राक्षस" }];
  var DASHA = [["ketu", 7], ["venus", 20], ["sun", 6], ["moon", 10], ["mars", 7], ["rahu", 18], ["jupiter", 16], ["saturn", 19], ["mercury", 17]];
  var GEMS = [
    { k: "sun", en: "Ruby", hi: "माणिक्य", tr: "Manikya", img: "Kundli%20planet%20assets/ruby.jpg", finger: "Ring finger", fingerHi: "अनामिका", en_s: "ruby", hi_s: "manikya",
      mantra: "Om Hraam Hreem Hraum Sah Suryaya Namah", mantraHi: "ॐ ह्रां ह्रीं ह्रौं सः सूर्याय नमः", b: "Traditionally associated with confidence, clarity and standing.", bh: "परंपरा में आत्मविश्वास, स्पष्टता और प्रतिष्ठा से जोड़ा जाता है।" },
    { k: "moon", en: "Pearl", hi: "मोती", tr: "Moti", img: "Kundli%20planet%20assets/pearl.jpg", finger: "Little finger", fingerHi: "कनिष्ठा", en_s: "pearl", hi_s: "moti",
      mantra: "Om Shraam Shreem Shraum Sah Chandramase Namah", mantraHi: "ॐ श्रां श्रीं श्रौं सः चन्द्रमसे नमः", b: "Traditionally associated with calm, emotional steadiness and care.", bh: "परंपरा में मन की शांति और भावनात्मक स्थिरता से जोड़ा जाता है।" },
    { k: "mars", en: "Red Coral", hi: "मूंगा", tr: "Moonga", img: "Kundli%20planet%20assets/red-coral.jpg", finger: "Ring finger", fingerHi: "अनामिका", en_s: "red-coral", hi_s: "moonga",
      mantra: "Om Kraam Kreem Kraum Sah Bhaumaya Namah", mantraHi: "ॐ क्रां क्रीं क्रौं सः भौमाय नमः", b: "Traditionally associated with courage, drive and resolve.", bh: "परंपरा में साहस, ऊर्जा और दृढ़ता से जोड़ा जाता है।" },
    { k: "mercury", en: "Emerald", hi: "पन्ना", tr: "Panna", img: "Kundli%20planet%20assets/emerald.svg", finger: "Little finger", fingerHi: "कनिष्ठा", en_s: "emerald", hi_s: "panna",
      mantra: "Om Braam Breem Braum Sah Budhaya Namah", mantraHi: "ॐ ब्रां ब्रीं ब्रौं सः बुधाय नमः", b: "Traditionally associated with expression, learning and trade.", bh: "परंपरा में वाणी, अध्ययन और व्यापार से जोड़ा जाता है।" },
    { k: "jupiter", en: "Yellow Sapphire", hi: "पुखराज", tr: "Pukhraj", img: "Kundli%20planet%20assets/yellow-sapphire.svg", finger: "Index finger", fingerHi: "तर्जनी", en_s: "yellow-sapphire", hi_s: "pukhraj",
      mantra: "Om Graam Greem Graum Sah Gurave Namah", mantraHi: "ॐ ग्रां ग्रीं ग्रौं सः गुरवे नमः", b: "Traditionally associated with guidance, wisdom and growth.", bh: "परंपरा में मार्गदर्शन, ज्ञान और उन्नति से जोड़ा जाता है।" },
    { k: "venus", en: "Diamond", hi: "हीरा", tr: "Heera", img: "Kundli%20planet%20assets/diamond.svg", finger: "Middle or ring finger", fingerHi: "मध्यमा या अनामिका", en_s: "diamond", hi_s: "heera",
      mantra: "Om Draam Dreem Draum Sah Shukraya Namah", mantraHi: "ॐ द्रां द्रीं द्रौं सः शुक्राय नमः", b: "Traditionally associated with grace, comfort and relationships.", bh: "परंपरा में सौम्यता, सुख और संबंधों से जोड़ा जाता है।" },
    { k: "saturn", en: "Blue Sapphire", hi: "नीलम", tr: "Neelam", img: "Kundli%20planet%20assets/blue-sapphire.jpg", finger: "Middle finger", fingerHi: "मध्यमा", en_s: "blue-sapphire", hi_s: "neelam",
      mantra: "Om Praam Preem Praum Sah Shanaischaraya Namah", mantraHi: "ॐ प्रां प्रीं प्रौं सः शनैश्चराय नमः", b: "Worn only after careful chart study; linked with discipline and focus.", bh: "केवल कुंडली के सावधान अध्ययन के बाद; अनुशासन और एकाग्रता से जुड़ा।" },
    { k: "rahu", en: "Hessonite", hi: "गोमेद", tr: "Gomed", img: "Kundli%20planet%20assets/hessonite.jpg", finger: "Middle finger", fingerHi: "मध्यमा", en_s: "hessonite", hi_s: "gomed",
      mantra: "Om Bhraam Bhreem Bhraum Sah Rahave Namah", mantraHi: "ॐ भ्रां भ्रीं भ्रौं सः राहवे नमः", b: "Traditionally associated with focus and steadiness of effort.", bh: "परंपरा में एकाग्रता और प्रयास की स्थिरता से जोड़ा जाता है।" },
    { k: "ketu", en: "Cat's Eye", hi: "लहसुनिया", tr: "Lehsunia", img: "Kundli%20planet%20assets/cats-eye.jpg", finger: "Middle or little finger", fingerHi: "मध्यमा या कनिष्ठा", en_s: "cats-eye", hi_s: "lehsunia",
      mantra: "Om Sraam Sreem Sraum Sah Ketave Namah", mantraHi: "ॐ स्रां स्रीं स्रौं सः केतवे नमः", b: "Traditionally read for intuition, caution and inner steadiness.", bh: "परंपरा में अंतर्ज्ञान, सावधानी और आंतरिक स्थिरता से जोड़ा जाता है।" }
  ];
  var ABBR = { Su: "sun", Mo: "moon", Ma: "mars", Me: "mercury", Ju: "jupiter", Ve: "venus", Sa: "saturn", Ra: "rahu", Ke: "ketu" };
  function signIndexOf(name) {
    if (!name) return -1;
    var s = String(name).trim().toLowerCase();
    for (var i = 0; i < 12; i++) {
      if (SIGNS[i].en.toLowerCase() === s || SIGNS[i].tr.toLowerCase() === s || SIGNS[i].hi === name || SIGNS[i].en.slice(0, 3).toLowerCase() === s) return i;
    }
    return -1;
  }
  function planetKeyOf(name) {
    if (!name) return null;
    var s = String(name).trim().toLowerCase();
    for (var i = 0; i < PLANETS.length; i++) {
      var p = PLANETS[i];
      if (p.k === s || p.en.toLowerCase() === s || p.sa.toLowerCase() === s || p.hi === name || p.ab.toLowerCase() === s) return p.k;
    }
    return null;
  }

  // --------------------------------------------------------------- helpers
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function f1(n) { return Math.round(n * 10) / 10; }
  function pol(cx, cy, r, deg) { var a = (deg - 90) * Math.PI / 180; return [f1(cx + r * Math.cos(a)), f1(cy + r * Math.sin(a))]; }
  function seeded(seed) { var x = seed * 9301 + 49297; return function () { x = (x * 9301 + 49297) % 233280; return x / 233280; }; }
  var uid = 0;
  function nextId(p) { uid += 1; return (p || "kp") + uid; }

  // ---------------------------------------------------------------- icons
  var IC = {
    kundli: '<rect x="3" y="3" width="18" height="18" rx="1.5"/><path d="M3 3l18 18M21 3L3 21M12 3l9 9-9 9-9-9z"/>',
    milan: '<circle cx="8.7" cy="12.5" r="5.2"/><circle cx="15.3" cy="12.5" r="5.2"/><path d="M12 4.2l.7-1.4.7 1.4"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8"/>',
    wheel: '<circle cx="12" cy="12" r="9.5"/><circle cx="12" cy="12" r="5"/><path d="M12 2.5v4.5M12 17v4.5M2.5 12H7M17 12h4.5M5.3 5.3l3.2 3.2M15.5 15.5l3.2 3.2M5.3 18.7l3.2-3.2M15.5 8.5l3.2-3.2"/>',
    panchang: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/><path d="M13.8 12.6a3.1 3.1 0 1 0 0 5.8 3.6 3.6 0 0 1 0-5.8z"/>',
    moon: '<path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5z"/>',
    grid: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/>',
    gem: '<path d="M6 3.5h12l4 5.5-10 12L2 9z"/><path d="M2 9h20M9.2 3.5 7.5 9 12 21l4.5-12-1.7-5.5"/>',
    diya: '<path d="M12 2.8c1.6 2 2.3 3.4 2.3 4.6a2.3 2.3 0 0 1-4.6 0c0-1.2.7-2.6 2.3-4.6z"/><path d="M3 12.5h18c0 4-4 7.2-9 7.2s-9-3.2-9-7.2z"/><path d="M8 21.3h8"/>',
    mantra: '<path d="M4 10v4M8 7v10M12 4v16M16 7v10M20 10v4"/>',
    yantra: '<rect x="3" y="3" width="18" height="18"/><circle cx="12" cy="12" r="6.3"/><path d="M12 6.8l4.6 8H7.4zM12 17.2l-4.6-8h9.2z"/>',
    rudraksha: '<circle cx="12" cy="12" r="3.6"/><circle cx="12" cy="12" r="8.6" stroke-dasharray="1.6 2.4"/><path d="M12 8.4v7.2M8.4 12h7.2"/>',
    kalash: '<path d="M8 8.5h8l1 1.6c2 1.4 3 3.3 3 5.4a6.5 6.5 0 0 1-6.5 6.5h-3A6.5 6.5 0 0 1 4 15.5c0-2.1 1-4 3-5.4z"/><path d="M8.8 8.5c0-2 1.4-3 3.2-3s3.2 1 3.2 3M12 5.5V2.5"/>',
    fast: '<circle cx="12" cy="12" r="9"/><path d="M7.5 13.5c2.4-4.2 5.7-5.4 8.5-5.4-.4 3.1-2.2 6.3-6.3 7.7M7.5 13.5 6 16.8"/>',
    donation: '<path d="M2.5 15h4l4.2 3h6.1a2 2 0 0 0 0-4h-4.3"/><path d="M6.5 15l3-3h4.1"/><circle cx="16.5" cy="6.5" r="3"/>',
    temple: '<path d="M12 2l1.6 3h-3.2zM7.5 9h9L15 5H9zM5 9h14v2.2H5zM6.3 11.2V20M17.7 11.2V20M10 20v-5h4v5M3 20.5h18"/>',
    book: '<path d="M3 5.5C5.5 4 8.5 4 12 6c3.5-2 6.5-2 9-.5V19c-2.5-1.5-5.5-1.5-9 .5-3.5-2-6.5-2-9-.5z"/><path d="M12 6v13.5"/>',
    dots: '<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>',
    consult: '<path d="M4 4.5h16v11.5H9.5L4 20.5z"/><path d="M12 6.8l1 2 2.2.3-1.6 1.5.4 2.2-2-1-2 1 .4-2.2L8.8 9.1l2.2-.3z"/>',
    planet: '<circle cx="12" cy="12" r="5"/><ellipse cx="12" cy="12" rx="10.5" ry="3.6" transform="rotate(-22 12 12)"/>',
    star: '<path d="M12 3l2.6 5.6 6.1.7-4.6 4.1 1.3 6-5.4-3.1-5.4 3.1 1.3-6-4.6-4.1 6.1-.7z"/>',
    dasha: '<path d="M2.5 12h19"/><circle cx="6" cy="12" r="2.2"/><circle cx="12" cy="12" r="2.2"/><circle cx="18" cy="12" r="2.2"/><path d="M6 5v4.5M12 4v5.5M18 6v3.5"/>',
    mars: '<circle cx="10" cy="14" r="6"/><path d="M14.3 9.7 20.5 3.5M15.5 3.5h5v5"/>',
    saturn: '<path d="M6 3.5h6M9 3.5v9.5c0-2.2 1.8-3.6 3.8-3.6S16.5 10.8 16.5 13c0 2.6-2 3.8-2 6 0 1 .6 1.5 1.5 1.5"/>',
    clock: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4.2l2.8 2.5M9 2.5h6"/>',
    heart: '<path d="M12 20s-7.5-4.6-9-9.5C2 6.9 4.3 4.5 7 4.5c2 0 3.4 1.2 5 3 1.6-1.8 3-3 5-3 2.7 0 5 2.4 4 6-1.5 4.9-9 9.5-9 9.5z"/>',
    briefcase: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18"/>',
    coins: '<ellipse cx="9" cy="7" rx="6" ry="2.5"/><path d="M3 7v4c0 1.4 2.7 2.5 6 2.5 1.2 0 2.3-.1 3.2-.4"/><ellipse cx="15" cy="14" rx="6" ry="2.5"/><path d="M9 14v3c0 1.4 2.7 2.5 6 2.5s6-1.1 6-2.5v-3"/>',
    family: '<circle cx="8" cy="7" r="3"/><circle cx="17" cy="9" r="2.3"/><path d="M2.5 20c0-3.3 2.5-6 5.5-6s5.5 2.7 5.5 6M13.5 20c0-2.6 1.6-4.6 3.5-4.6s3.5 2 3.5 4.6"/>',
    cap: '<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11v5c3 2 9 2 12 0v-5M22 9v6"/>',
    shop: '<path d="M3 9l1.5-5h15L21 9"/><path d="M4.5 11.5V20h15v-8.5"/><path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0"/><path d="M10 20v-5h4v5"/>',
    compass: '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>',
    home: '<path d="M3 11l9-7 9 7"/><path d="M5 9.5V20h14V9.5"/><path d="M10 20v-6h4v6"/>',
    car: '<path d="M4.5 15.5l1.4-5A2 2 0 0 1 7.8 9h8.4a2 2 0 0 1 1.9 1.5l1.4 5"/><rect x="3" y="15.5" width="18" height="4" rx="1.2"/><path d="M6.5 21.5v-2M17.5 21.5v-2"/>',
    building: '<rect x="5" y="3" width="14" height="18"/><path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2M11 21v-3h2v3"/>',
    baby: '<circle cx="12" cy="8" r="4"/><path d="M5 21c0-4 3.1-7 7-7s7 3 7 7"/><path d="M10.5 8h.01M13.5 8h.01"/>',
    bowl: '<path d="M3 11.5h18a9 9 0 0 1-18 0z"/><path d="M8 8c0-1.5 1-2 1-3.5M12 8c0-1.5 1-2 1-3.5M16 8c0-1.5 1-2 1-3.5"/>',
    thread: '<path d="M6 3c3.5 4.5 9 13 12 18"/><path d="M9.5 3c3 4 8 11.5 11 14.5"/><circle cx="6.5" cy="17.5" r="2.5"/>',
    shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
    file: '<path d="M6 3h8l5 5v13H6z"/><path d="M14 3v5h5M9 13h7M9 17h5"/>',
    download: '<path d="M12 3v12M7 10l5 5 5-5M4 20h16"/>',
    lang: '<path d="M3 5h8M7 3v2c0 4-2 7-4 8M5 9c1 2 3 3.5 5.5 4"/><path d="M13 21l4-10 4 10M14.5 17.5h5"/>',
    om: '<path d="M4.5 9.5c1.5-2.3 5-2 5 .5 0 1.6-1.4 2.4-3 2.4 2.3 0 3.8 1.2 3.8 3.4 0 2.3-2 3.7-4.3 3.7-1.5 0-2.7-.6-3.5-1.6"/><path d="M11 15.5c.6-2.4 2.6-3.8 4.5-3.8 2.3 0 4 1.8 4 4.2 0 2.3-1.7 3.8-3.6 3.8"/><path d="M15 5.5c1.4-.8 3.2-.6 4 .6M17.5 3.2h.01"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M20.5 20.5 16 16"/>',
    phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.8 2.1z"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3.5 6.5 8.5 7 8.5-7"/>',
    pin: '<path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h10"/>',
    close: '<path d="M6 6l12 12M18 6 6 18"/>',
    chev: '<path d="m6 9 6 6 6-6"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    arrowL: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
    spark: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>',
    hand: '<path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V11M11 10V4a1.5 1.5 0 0 1 3 0v7M14 10.5V5.5a1.5 1.5 0 0 1 3 0v8c0 4.4-2.7 7.5-6.5 7.5-2.6 0-4.3-1.3-5.6-3.6L3.4 14a1.5 1.5 0 0 1 2.5-1.6L8 15"/>',
    cards: '<rect x="3" y="6" width="11" height="15" rx="1.5" transform="rotate(-8 8.5 13.5)"/><rect x="10" y="3.5" width="11" height="15" rx="1.5" transform="rotate(8 15.5 11)"/>',
    lotus: '<path d="M12 20c-4.5 0-8-2.4-9-6 3 .2 5.4 1.2 7 3M12 20c4.5 0 8-2.4 9-6-3 .2-5.4 1.2-7 3M12 20c-2.4-2.2-3.5-5.2-3.2-9 1.4.8 2.5 1.9 3.2 3.2.7-1.3 1.8-2.4 3.2-3.2.3 3.8-.8 6.8-3.2 9zM12 14.2V5c-1.3 1.3-2 3-2 4.8"/>'
  };
  IC.wa = null; // WhatsApp is a filled glyph, handled separately
  var WA_PATH = "M17.5 14.4c-.3-.2-1.8-.9-2.1-1s-.5-.2-.7.1-.8 1-.9 1.2-.3.2-.6.1a8.6 8.6 0 0 1-2.5-1.6 9.4 9.4 0 0 1-1.7-2.2c-.2-.3 0-.5.1-.6l.5-.6.3-.5a.6.6 0 0 0 0-.6L8.9 6.4c-.2-.6-.5-.5-.7-.5h-.6a1.2 1.2 0 0 0-.8.4 3.4 3.4 0 0 0-1.1 2.6 6 6 0 0 0 1.3 3.2 13.6 13.6 0 0 0 5.2 4.6c2.2.9 2.6.8 3.1.7a2.9 2.9 0 0 0 1.9-1.4 2.4 2.4 0 0 0 .2-1.3c-.1-.2-.3-.2-.6-.3zM12 2a10 10 0 0 0-8.5 15.2L2 22.5l5.4-1.4A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3.2.8.9-3.1-.2-.3A8.2 8.2 0 1 1 12 20.2z";
  function icon(name, cls) {
    var inner = name === "wa"
      ? '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false"><path d="' + WA_PATH + '"/></svg>'
      : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + (IC[name] || IC.star) + "</svg>";
    return '<span class="kp-icon' + (cls ? " " + cls : "") + '">' + inner + "</span>";
  }

  // ------------------------------------------------------------------ art
  var GOLD = "#D4AF37", GOLD2 = "#F0D27A", CREAM = "#F3E3B0";
  function svgOpen(vb, label, extra) {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + vb + '"' + (label ? ' role="img" aria-label="' + esc(label) + '"' : ' aria-hidden="true"') + (extra || "") + ">";
  }
  function starsLayer(w, h, count, seed, x0, y0) {
    var r = seeded(seed || 7), s = "";
    for (var i = 0; i < count; i++) {
      var x = f1((x0 || 0) + r() * w), y = f1((y0 || 0) + r() * h), rad = f1(0.5 + r() * 1.3);
      s += '<circle cx="' + x + '" cy="' + y + '" r="' + rad + '" fill="' + (r() > 0.7 ? CREAM : "#fff") + '" opacity="' + f1(0.25 + r() * 0.6) + '"' + (i % 4 === 0 ? ' class="kp-twinkle' + (i % 3 ? " d2" : "") + '"' : "") + "/>";
    }
    return s;
  }
  // North-Indian chart geometry (fractions of the square side).
  var H_POS = [[.5, .23], [.25, .1], [.1, .25], [.23, .5], [.1, .75], [.25, .9], [.5, .77], [.75, .9], [.9, .75], [.77, .5], [.9, .25], [.75, .1]];
  var H_NUM = [[.5, .43], [.25, .2], [.2, .25], [.43, .5], [.2, .75], [.25, .8], [.5, .57], [.75, .8], [.8, .75], [.57, .5], [.8, .25], [.75, .2]];
  var SAMPLE_HOUSES = [["Ju"], [], ["Ra"], ["Mo"], [], ["Sa"], [], ["Su", "Me"], ["Ke", "Ve"], [], ["Ma"], []];
  function chartLines(x, y, s, stroke, sw) {
    var m = s / 2;
    return '<g fill="none" stroke="' + stroke + '" stroke-width="' + sw + '" stroke-linejoin="round">' +
      '<rect x="' + x + '" y="' + y + '" width="' + s + '" height="' + s + '"/>' +
      '<path d="M' + x + " " + y + "L" + (x + s) + " " + (y + s) + "M" + (x + s) + " " + y + "L" + x + " " + (y + s) + '"/>' +
      '<path d="M' + (x + m) + " " + y + "L" + (x + s) + " " + (y + m) + "L" + (x + m) + " " + (y + s) + "L" + x + " " + (y + m) + 'Z"/></g>';
  }
  function chartText(x, y, s, houses, lagnaSign, o) {
    var out = "", fsP = s * 0.062, fsN = s * 0.045;
    for (var h = 0; h < 12; h++) {
      var sign = lagnaSign ? ((lagnaSign - 1 + h) % 12) + 1 : null;
      var n = H_NUM[h], p = H_POS[h];
      if (sign) out += '<text x="' + f1(x + n[0] * s) + '" y="' + f1(y + n[1] * s + fsN * .35) + '" font-size="' + f1(fsN) + '" fill="' + o.num + '" text-anchor="middle" font-family="Outfit,sans-serif">' + sign + "</text>";
      var pl = houses && houses[h] ? houses[h] : [];
      // Crowded houses (3+ grahas) are laid out two per row at a smaller size.
      var crowd = pl.length > 2, fs = crowd ? fsP * .82 : fsP, rows = crowd ? Math.ceil(pl.length / 2) : pl.length;
      pl.forEach(function (ab, j) {
        var hl = o.highlight && o.highlight.indexOf(ab) > -1;
        var row = crowd ? Math.floor(j / 2) : j, dx = crowd ? ((j % 2 ? 1 : -1) * fs * .72 * (pl.length - j === 1 && j % 2 === 0 ? 0 : 1)) : 0;
        var yy = y + p[1] * s + (row - (rows - 1) / 2) * fs * 1.15 + fs * .35;
        out += '<text x="' + f1(x + p[0] * s + dx) + '" y="' + f1(yy) + '" font-size="' + f1(fs) + '" fill="' + (hl ? o.hl : o.pl) + '" font-weight="' + (hl ? 700 : 600) + '" text-anchor="middle" font-family="Outfit,sans-serif">' + esc(ab) + "</text>";
      });
    }
    if (o.lagnaLabel) out += '<text x="' + f1(x + s / 2) + '" y="' + f1(y + s * .33) + '" font-size="' + f1(fsN * .9) + '" fill="' + o.num + '" text-anchor="middle" letter-spacing="1.5" font-family="Outfit,sans-serif">' + esc(o.lagnaLabel) + "</text>";
    return out;
  }
  var art = {};
  art.kundliChart = function (o) {
    o = o || {};
    var dark = o.theme === "dark";
    var houses = o.houses || SAMPLE_HOUSES, lagna = o.lagna || 1;
    var st = dark ? GOLD : "#9B7018";
    var s = svgOpen("0 0 300 300", o.label || "North Indian kundli chart");
    var kid = nextId("kc");
    s += '<defs><linearGradient id="' + kid + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + (dark ? "#16245A" : "#FFFDF6") + '"/><stop offset="1" stop-color="' + (dark ? "#0B1434" : "#F6EAD0") + '"/></linearGradient></defs>';
    s += '<rect x="6" y="6" width="288" height="288" rx="6" fill="url(#' + kid + ')" stroke="' + st + '" stroke-width="1.2"/>';
    s += '<rect x="14" y="14" width="272" height="272" fill="none" stroke="' + st + '" stroke-opacity=".35" stroke-width=".8"/>';
    s += chartLines(22, 22, 256, st, 1.1);
    if (o.axis) s += '<path d="M' + f1(22 + H_POS[2][0] * 256) + " " + f1(22 + H_POS[2][1] * 256) + "L" + f1(22 + H_POS[8][0] * 256) + " " + f1(22 + H_POS[8][1] * 256) + '" stroke="#E0763A" stroke-width="2" stroke-dasharray="5 4" opacity=".9"/>';
    s += chartText(22, 22, 256, houses, lagna, { num: dark ? "rgba(243,227,176,.6)" : "#9B7A3A", pl: dark ? "#FBF7EA" : "#122246", hl: "#E0563A", highlight: o.highlight, lagnaLabel: o.lagnaLabel });
    s += "</svg>";
    return s;
  };
  art.zodiacWheel = function (o) {
    o = o || {};
    var hero = !!o.hero, pad = hero ? 46 : 0;
    var s = svgOpen((-pad) + " " + (-pad) + " " + (400 + pad * 2) + " " + (400 + pad * 2), o.label || "Zodiac wheel with the twelve rashis");
    var gid = nextId("zw");
    s += '<defs><radialGradient id="' + gid + 'c" cx="50%" cy="45%" r="60%"><stop offset="0" stop-color="#1D2C66"/><stop offset=".7" stop-color="#0D1740"/><stop offset="1" stop-color="#080F2C"/></radialGradient>' +
      '<linearGradient id="' + gid + 'g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F6DE8D"/><stop offset=".5" stop-color="#D4AF37"/><stop offset="1" stop-color="#A67C18"/></linearGradient></defs>';
    if (hero) {
      s += '<g class="kp-spin-rev" style="transform-box:view-box;transform-origin:200px 200px"><circle cx="200" cy="200" r="228" fill="none" stroke="' + GOLD + '" stroke-opacity=".28" stroke-dasharray="2 7"/>';
      [["☉", 20, "#F2A93B"], ["♃", 150, "#E3B24A"], ["♄", 262, "#8FA8F0"]].forEach(function (pl) {
        var p = pol(200, 200, 228, pl[1]);
        s += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="15" fill="#0B1434" stroke="' + pl[2] + '" stroke-width="1.2"/><text x="' + p[0] + '" y="' + (p[1] + 5.5) + '" font-size="15" text-anchor="middle" fill="' + pl[2] + '" font-family="Segoe UI Symbol,Noto Sans Symbols 2,DejaVu Sans,sans-serif">' + pl[0] + T + "</text>";
      });
      s += "</g>";
      s += starsLayer(480, 480, 26, 11, -40, -40);
    }
    s += '<circle cx="200" cy="200" r="198" fill="' + (o.bg === false ? "none" : "url(#" + gid + "c)") + '" stroke="url(#' + gid + 'g)" stroke-width="1.6"/>';
    s += '<g class="kp-spin" style="transform-box:view-box;transform-origin:200px 200px">';
    s += '<circle cx="200" cy="200" r="166" fill="none" stroke="' + GOLD + '" stroke-opacity=".7" stroke-width="1"/>';
    for (var i = 0; i < 12; i++) {
      var a = i * 30, p1 = pol(200, 200, 166, a), p2 = pol(200, 200, 198, a);
      s += '<line x1="' + p1[0] + '" y1="' + p1[1] + '" x2="' + p2[0] + '" y2="' + p2[1] + '" stroke="' + GOLD + '" stroke-opacity=".6" stroke-width="1"/>';
      var gp = pol(200, 200, 182, a + 15);
      var on = o.highlight === i;
      if (on) {
        var q1 = pol(200, 200, 166, a), q2 = pol(200, 200, 198, a), q3 = pol(200, 200, 198, a + 30), q4 = pol(200, 200, 166, a + 30);
        s += '<path d="M' + q1 + "L" + q2 + "A198 198 0 0 1 " + q3 + "L" + q4 + "A166 166 0 0 0 " + q1 + 'Z" fill="' + GOLD + '" fill-opacity=".28"/>';
      }
      s += '<text x="' + gp[0] + '" y="' + f1(gp[1] + 6) + '" font-size="17" text-anchor="middle" fill="' + (on ? "#FFF3C4" : GOLD2) + '" transform="rotate(' + (a + 15) + " " + gp[0] + " " + gp[1] + ')" font-family="Segoe UI Symbol,Noto Sans Symbols 2,DejaVu Sans,sans-serif">' + SIGNS[i].g + T + "</text>";
    }
    for (var t = 0; t < 72; t++) {
      var big = t % 6 === 0, q = pol(200, 200, 160, t * 5), r2 = pol(200, 200, big ? 152 : 156, t * 5);
      s += '<line x1="' + q[0] + '" y1="' + q[1] + '" x2="' + r2[0] + '" y2="' + r2[1] + '" stroke="' + GOLD + '" stroke-opacity="' + (big ? .7 : .38) + '" stroke-width=".8"/>';
    }
    s += "</g>";
    // 27 nakshatra beads
    s += '<g class="kp-spin-rev" style="transform-box:view-box;transform-origin:200px 200px">';
    for (var n = 0; n < 27; n++) {
      var np = pol(200, 200, 145, n * (360 / 27));
      s += '<circle cx="' + np[0] + '" cy="' + np[1] + '" r="' + (n % 9 === 0 ? 2.4 : 1.5) + '" fill="' + CREAM + '" opacity="' + (n % 9 === 0 ? .95 : .55) + '"/>';
    }
    s += "</g>";
    s += '<circle cx="200" cy="200" r="137" fill="none" stroke="' + GOLD + '" stroke-opacity=".45" stroke-width=".8"/>';
    var center = o.center || "chart";
    if (center === "chart") {
      s += chartLines(107, 107, 186, GOLD, 1.1);
      s += chartText(107, 107, 186, o.houses || SAMPLE_HOUSES, o.lagna || 1, { num: "rgba(243,227,176,.55)", pl: "#FBF7EA", hl: "#FF9B7A", highlight: o.highlight_pl, lagnaLabel: o.lagnaLabel });
    } else if (center === "glyph") {
      var sg = SIGNS[o.sign || 0];
      s += '<circle cx="200" cy="200" r="98" fill="#0B1434" stroke="' + GOLD + '" stroke-opacity=".5"/>';
      s += '<text x="200" y="232" font-size="96" text-anchor="middle" fill="url(#' + gid + 'g)" font-family="Segoe UI Symbol,Noto Sans Symbols 2,DejaVu Sans,sans-serif">' + sg.g + T + "</text>";
    } else if (center === "star") {
      s += '<g class="kp-spin" style="transform-box:view-box;transform-origin:200px 200px" fill="none" stroke="' + GOLD + '" stroke-opacity=".75">';
      for (var k = 0; k < 27; k++) { var e1 = pol(200, 200, 118, k * 13.333), e2 = pol(200, 200, 118, k * 13.333 + 106.66); s += '<line x1="' + e1[0] + '" y1="' + e1[1] + '" x2="' + e2[0] + '" y2="' + e2[1] + '" stroke-width=".6"/>'; }
      s += "</g>";
      s += '<circle cx="200" cy="200" r="40" fill="#0B1434" stroke="' + GOLD + '"/><path d="M200 172l7 17 18 1.6-13.6 11.6 4.2 17.8L200 210.5l-15.6 9.5 4.2-17.8L175 190.6l18-1.6z" fill="url(#' + gid + 'g)"/>';
    } else if (center === "sun") {
      s += '<g class="kp-spin" style="transform-box:view-box;transform-origin:200px 200px">';
      for (var rr = 0; rr < 24; rr++) { var a1 = pol(200, 200, 58, rr * 15), a2 = pol(200, 200, rr % 2 ? 84 : 100, rr * 15); s += '<line x1="' + a1[0] + '" y1="' + a1[1] + '" x2="' + a2[0] + '" y2="' + a2[1] + '" stroke="' + GOLD2 + '" stroke-width="1.4" stroke-linecap="round" opacity=".8"/>'; }
      s += '</g><circle cx="200" cy="200" r="50" fill="url(#' + gid + 'g)"/>';
    }
    s += "</svg>";
    return s;
  };
  art.twinCharts = function (o) {
    o = o || {};
    var s = svgOpen("0 0 640 320", o.label || "Two birth charts matched for Kundli Milan");
    var gid = nextId("tc");
    s += '<defs><linearGradient id="' + gid + '" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#F6DE8D" stop-opacity=".1"/><stop offset=".5" stop-color="#F6DE8D"/><stop offset="1" stop-color="#F6DE8D" stop-opacity=".1"/></linearGradient></defs>';
    s += starsLayer(640, 320, 30, 23);
    var charts = [[24, 50, [["Mo"], [], ["Ju"], [], ["Ve"], [], ["Sa"], [], [], ["Su", "Me"], [], ["Ma"]], 4], [376, 50, [[], ["Ma"], [], ["Su"], [], ["Mo", "Ju"], [], [], ["Sa"], [], ["Ve", "Me"], []], 8]];
    charts.forEach(function (c, idx) {
      s += '<g transform="translate(' + c[0] + " " + c[1] + ')"><rect x="-6" y="-6" width="252" height="252" rx="8" fill="#0D1740" stroke="' + GOLD + '" stroke-opacity=".6"/>' + chartLines(6, 6, 228, GOLD, 1) +
        chartText(6, 6, 228, c[2], c[3], { num: "rgba(243,227,176,.5)", pl: "#FBF7EA", hl: "#FFB39E" }) + "</g>";
      s += '<text x="' + (c[0] + 120) + '" y="30" font-size="12" text-anchor="middle" fill="' + CREAM + '" letter-spacing="3" font-family="Outfit,sans-serif">' + esc((o.labels || ["BOY", "GIRL"])[idx]) + "</text>";
    });
    [-60, -24, 24, 60].forEach(function (dy, i) {
      s += '<path d="M270 ' + (175 + dy) + " C 320 " + (175 + dy * 1.8) + ", 320 " + (175 + dy * 1.8) + ", 370 " + (175 + dy) + '" fill="none" stroke="url(#' + gid + ')" stroke-width="1.2" stroke-dasharray="3 5" class="kp-twinkle' + (i % 2 ? " d2" : "") + '"/>';
    });
    s += '<circle cx="320" cy="175" r="44" fill="#1B1238" stroke="' + GOLD + '" stroke-width="1.4"/><circle cx="320" cy="175" r="52" fill="none" stroke="' + GOLD + '" stroke-opacity=".35" stroke-dasharray="2 5" class="kp-spin" style="transform-box:fill-box;transform-origin:center"/>';
    s += '<path d="M320 196s-19-11.5-22.5-23.5c-2.4-8.5 3.4-14.5 10.2-14.5 5 0 8.4 3 12.3 7.4 3.9-4.4 7.3-7.4 12.3-7.4 6.8 0 12.6 6 10.2 14.5C338.9 184.5 320 196 320 196z" fill="#E0563A" opacity=".92"/>';
    s += "</svg>";
    return s;
  };
  function moonPath(cx, cy, r, phase) {
    var k = Math.cos(phase * 2 * Math.PI), waxing = phase < 0.5, rx = f1(Math.abs(k) * r);
    var limb = waxing ? 1 : 0, term = waxing ? (k > 0 ? 0 : 1) : (k > 0 ? 1 : 0);
    return "M" + cx + " " + (cy - r) + "A" + r + " " + r + " 0 0 " + limb + " " + cx + " " + (cy + r) + "A" + rx + " " + r + " 0 0 " + term + " " + cx + " " + (cy - r) + "Z";
  }
  art.moonPhases = function (o) {
    o = o || {};
    var s = svgOpen("0 0 320 320", o.label || "Sun and the phases of the Moon");
    var gid = nextId("mp");
    s += '<defs><radialGradient id="' + gid + '"><stop offset="0" stop-color="#FFF1BF"/><stop offset=".55" stop-color="#F2B640"/><stop offset="1" stop-color="#C77A12"/></radialGradient></defs>';
    s += starsLayer(320, 320, 22, 5);
    s += '<circle cx="160" cy="160" r="130" fill="none" stroke="' + GOLD + '" stroke-opacity=".35" stroke-dasharray="2 6"/>';
    s += '<circle cx="160" cy="160" r="104" fill="none" stroke="' + GOLD + '" stroke-opacity=".2"/>';
    s += '<g class="kp-spin">';
    for (var i = 0; i < 8; i++) {
      var p = pol(160, 160, 130, i * 45), ph = i / 8;
      s += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="15" fill="#1A2350" stroke="' + GOLD + '" stroke-opacity=".5"/>';
      if (i !== 0) s += '<path d="' + moonPath(p[0], p[1], 15, ph) + '" fill="#F5EEDC"/>';
    }
    s += "</g>";
    s += '<g class="kp-spin-rev">';
    for (var r = 0; r < 16; r++) { var a1 = pol(160, 160, 50, r * 22.5), a2 = pol(160, 160, r % 2 ? 66 : 78, r * 22.5); s += '<line x1="' + a1[0] + '" y1="' + a1[1] + '" x2="' + a2[0] + '" y2="' + a2[1] + '" stroke="' + GOLD2 + '" stroke-width="2" stroke-linecap="round"/>'; }
    s += '</g><circle cx="160" cy="160" r="42" fill="url(#' + gid + ')"/>';
    if (o.phase != null) {
      s += '<circle cx="160" cy="160" r="24" fill="#1A2350"/>';
      if (o.phase > 0.02 && o.phase < 0.98) s += '<path d="' + moonPath(160, 160, 24, o.phase) + '" fill="#FBF5E4"/>';
    }
    s += "</svg>";
    return s;
  };
  art.loShu = function (o) {
    o = o || {};
    var hl = (o.hl || "").split(",").map(Number).filter(Boolean);
    var nums = [4, 9, 2, 3, 5, 7, 8, 1, 6];
    var s = svgOpen("0 0 320 320", o.label || "Lo Shu number grid");
    var gid = nextId("ls");
    s += '<defs><linearGradient id="' + gid + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F6DE8D"/><stop offset="1" stop-color="#C79A20"/></linearGradient></defs>';
    s += '<g class="kp-spin"><circle cx="160" cy="160" r="150" fill="none" stroke="' + GOLD + '" stroke-opacity=".35" stroke-dasharray="1 5"/>';
    for (var d = 1; d <= 9; d++) { var p = pol(160, 160, 150, d * 40); s += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="11" fill="#0D1740" stroke="' + GOLD + '" stroke-opacity=".6"/><text x="' + p[0] + '" y="' + (p[1] + 4) + '" font-size="11" text-anchor="middle" fill="' + CREAM + '" font-family="Outfit,sans-serif">' + d + "</text>"; }
    s += "</g>";
    s += '<circle cx="160" cy="160" r="128" fill="#0D1740" stroke="' + GOLD + '" stroke-opacity=".6"/>';
    s += '<rect x="85" y="85" width="150" height="150" fill="none" stroke="' + GOLD + '" stroke-width="1.2"/><path d="M135 85v150M185 85v150M85 135h150M85 185h150" stroke="' + GOLD + '" stroke-opacity=".7"/>';
    s += '<path d="M85 85L235 235M235 85L85 235" stroke="' + GOLD + '" stroke-opacity=".18"/>';
    nums.forEach(function (n, i) {
      var x = 110 + (i % 3) * 50, y = 110 + Math.floor(i / 3) * 50, on = hl.indexOf(n) > -1;
      if (on) s += '<circle cx="' + x + '" cy="' + y + '" r="20" fill="' + GOLD + '" fill-opacity=".22" stroke="' + GOLD2 + '"/>';
      s += '<text x="' + x + '" y="' + (y + 11) + '" font-size="30" text-anchor="middle" fill="' + (on ? "#FFF3C4" : "url(#" + gid + ")") + '" font-family="Cormorant Garamond,Georgia,serif" font-weight="600">' + n + "</text>";
    });
    s += "</svg>";
    return s;
  };
  art.navagraha = function (o) {
    o = o || {};
    // Traditional temple arrangement, north at the top: Ketu Guru Budh / Shani Surya Shukra / Rahu Mangal Chandra
    var order = ["ketu", "jupiter", "mercury", "saturn", "sun", "venus", "rahu", "mars", "moon"];
    var hi = o.lang === "hi";
    var s = svgOpen("0 0 330 330", o.label || "Navagraha mandala");
    s += '<rect x="5" y="5" width="320" height="320" rx="14" fill="#0D1740" stroke="' + GOLD + '" stroke-opacity=".7"/>';
    s += '<rect x="15" y="15" width="300" height="300" rx="8" fill="none" stroke="' + GOLD + '" stroke-opacity=".3" stroke-dasharray="2 4"/>';
    s += '<path d="M115 15v300M215 15v300M15 115h300M15 215h300" stroke="' + GOLD + '" stroke-opacity=".35"/>';
    order.forEach(function (k, i) {
      var p = PMAP[k], x = 65 + (i % 3) * 100, y = 65 + Math.floor(i / 3) * 100, gid = nextId("ng");
      var c = p.orb.match(/#[0-9A-F]{6}/gi) || ["#fff", "#999", "#333"];
      s += '<defs><radialGradient id="' + gid + '" cx="35%" cy="30%"><stop offset="0" stop-color="' + c[0] + '"/><stop offset=".55" stop-color="' + c[1] + '"/><stop offset="1" stop-color="' + c[2] + '"/></radialGradient></defs>';
      if (k === "sun") s += '<circle cx="' + x + '" cy="' + y + '" r="34" fill="none" stroke="' + GOLD2 + '" stroke-opacity=".5" stroke-dasharray="3 4" class="kp-spin"/>';
      s += '<circle cx="' + x + '" cy="' + (y - 8) + '" r="' + (k === "sun" ? 24 : 19) + '" fill="url(#' + gid + ')"/>';
      if (k === "saturn") s += '<ellipse cx="' + x + '" cy="' + (y - 8) + '" rx="29" ry="7" fill="none" stroke="#C9D6FF" stroke-opacity=".8" transform="rotate(-18 ' + x + " " + (y - 8) + ')"/>';
      s += '<text x="' + x + '" y="' + (y - 2) + '" font-size="17" text-anchor="middle" fill="#fff" font-family="Segoe UI Symbol,Noto Sans Symbols 2,DejaVu Sans,sans-serif" opacity=".92">' + p.g + T + "</text>";
      s += '<text x="' + x + '" y="' + (y + 32) + '" font-size="12" text-anchor="middle" fill="' + CREAM + '" font-family="' + (hi ? "Mukta," : "") + 'Outfit,sans-serif" letter-spacing=".5">' + esc(hi ? p.hi : p.sa) + "</text>";
    });
    s += "</svg>";
    return s;
  };
  art.yantra = function (o) {
    o = o || {};
    var s = svgOpen("0 0 320 320", o.label || "Yantra");
    var gid = nextId("yt");
    s += '<defs><linearGradient id="' + gid + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F6DE8D"/><stop offset="1" stop-color="#B8891C"/></linearGradient></defs>';
    var g = 'stroke="url(#' + gid + ')" fill="none"';
    // bhupura with four gates
    s += '<path ' + g + ' stroke-width="1.6" d="M20 20H135V38H185V20H300V135H282V185H300V300H185V282H135V300H20V185H38V135H20Z"/>';
    s += '<path ' + g + ' stroke-width=".8" stroke-opacity=".6" d="M30 30H125V48H195V30H290V125H272V195H290V290H195V272H125V290H30V195H48V125H30Z"/>';
    s += '<circle cx="160" cy="160" r="118" ' + g + ' stroke-opacity=".5"/><circle cx="160" cy="160" r="110" ' + g + ' stroke-opacity=".8"/>';
    s += '<g class="kp-spin">';
    for (var i = 0; i < 16; i++) {
      var a = i * 22.5, p0 = pol(160, 160, 84, a - 11.25), p1 = pol(160, 160, 108, a), p2 = pol(160, 160, 84, a + 11.25);
      s += '<path d="M' + p0 + "Q" + p1 + " " + p2 + '" ' + g + ' stroke-width="1"/>';
    }
    s += "</g>";
    s += '<circle cx="160" cy="160" r="84" ' + g + ' stroke-width="1"/>';
    for (var j = 0; j < 8; j++) {
      var b = j * 45, q0 = pol(160, 160, 64, b - 22.5), q1 = pol(160, 160, 84, b), q2 = pol(160, 160, 64, b + 22.5);
      s += '<path d="M' + q0 + "Q" + q1 + " " + q2 + '" ' + g + ' stroke-width="1"/>';
    }
    s += '<circle cx="160" cy="160" r="64" ' + g + '/>';
    var tri = function (r, up, dy) { var t = []; for (var k = 0; k < 3; k++) t.push(pol(160, 160 + dy, r, (up ? 0 : 180) + k * 120)); return '<path d="M' + t.join("L") + 'Z" ' + g + ' stroke-width="1.1"/>'; };
    s += tri(58, true, 4) + tri(58, false, -4) + tri(40, true, -6) + tri(40, false, 6) + tri(22, true, 2);
    s += '<circle cx="160" cy="161" r="3.4" fill="#E0563A"/>';
    s += "</svg>";
    return s;
  };
  art.mandala = function (o) {
    o = o || {};
    var col = o.color || GOLD;
    var s = svgOpen("0 0 400 400", null);
    s += '<g fill="none" stroke="' + col + '" stroke-width="1">';
    [196, 188, 150, 110, 60, 28].forEach(function (r) { s += '<circle cx="200" cy="200" r="' + r + '"/>'; });
    for (var i = 0; i < 24; i++) { var a = i * 15, p0 = pol(200, 200, 150, a - 7.5), p1 = pol(200, 200, 188, a), p2 = pol(200, 200, 150, a + 7.5); s += '<path d="M' + p0 + "Q" + p1 + " " + p2 + '"/>'; }
    for (var j = 0; j < 12; j++) { var b = j * 30, q0 = pol(200, 200, 110, b - 15), q1 = pol(200, 200, 150, b), q2 = pol(200, 200, 110, b + 15); s += '<path d="M' + q0 + "Q" + q1 + " " + q2 + '"/>'; }
    for (var k = 0; k < 8; k++) { var c = k * 45, r0 = pol(200, 200, 60, c - 22.5), r1 = pol(200, 200, 110, c), r2 = pol(200, 200, 60, c + 22.5); s += '<path d="M' + r0 + "Q" + r1 + " " + r2 + '"/>'; }
    s += "</g></svg>";
    return s;
  };
  art.compass = function (o) {
    o = o || {};
    var dirs = o.lang === "hi" ? ["उ", "ई", "पू", "आ", "द", "नै", "प", "वा"] : ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    var s = svgOpen("0 0 320 320", o.label || "Vastu directions");
    s += starsLayer(320, 320, 14, 3);
    s += '<circle cx="160" cy="160" r="140" fill="#0D1740" stroke="' + GOLD + '" stroke-opacity=".7"/>';
    s += '<rect x="80" y="80" width="160" height="160" fill="none" stroke="' + GOLD + '" stroke-opacity=".6"/><path d="M133 80v160M187 80v160M80 133h160M80 187h160" stroke="' + GOLD + '" stroke-opacity=".3"/>';
    s += '<g class="kp-spin" style="animation-duration:240s">';
    for (var i = 0; i < 8; i++) {
      var a = i * 45, p = pol(160, 160, 118, a), long = i % 2 === 0, t1 = pol(160, 160, long ? 104 : 96, a), b1 = pol(160, 160, 16, a - 90), b2 = pol(160, 160, 16, a + 90);
      s += '<path d="M' + t1 + "L" + b1 + "L160 160L" + b2 + 'Z" fill="' + (long ? GOLD : "#8C7A45") + '" fill-opacity="' + (long ? .75 : .5) + '"/>';
      s += '<text x="' + p[0] + '" y="' + (p[1] + 4.5) + '" font-size="13" text-anchor="middle" fill="' + CREAM + '" font-family="Mukta,Outfit,sans-serif">' + dirs[i] + "</text>";
    }
    s += '</g><circle cx="160" cy="160" r="9" fill="#E0563A"/>';
    s += "</svg>";
    return s;
  };
  art.gemFacet = function (o) {
    o = o || {};
    var c = o.color || "#C4102B";
    var s = svgOpen("0 0 320 320", o.label || "Faceted gemstone");
    var gid = nextId("gf");
    s += '<defs><linearGradient id="' + gid + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".85"/><stop offset=".35" stop-color="' + c + '"/><stop offset="1" stop-color="#1A0610"/></linearGradient></defs>';
    s += starsLayer(320, 320, 18, 9);
    s += '<circle cx="160" cy="160" r="140" fill="none" stroke="' + GOLD + '" stroke-opacity=".4" stroke-dasharray="2 6" class="kp-spin"/>';
    s += '<g class="kp-float"><path d="M90 120h140l40 45-110 105L50 165z" fill="url(#' + gid + ')" stroke="' + CREAM + '" stroke-opacity=".6"/>';
    s += '<path d="M50 165h220M90 120l30 45 40-45 40 45 30-45M120 165l40 105 40-105" fill="none" stroke="#fff" stroke-opacity=".45"/></g>';
    s += "</svg>";
    return s;
  };
  art.festival = function (o) {
    o = o || {};
    var m = o.motif || "diya";
    var pal = { diya: ["#3A1A0A", "#6E2A0C", "#F2A93B"], colors: ["#3A0F4A", "#7A1F62", "#FF6FA8"], trishul: ["#0C1B45", "#23306E", "#9FC2FF"], kite: ["#0B2B4A", "#1B5A7A", "#FFC857"], lotus: ["#3A0A18", "#7A1230", "#FF9B7A"], bow: ["#2A1606", "#6E3A0D", "#F6C35B"], sun: ["#3A1F05", "#8A4A0C", "#FFD27A"] }[m] || ["#1B1238", "#2A1B52", "#F0D27A"];
    var gid = nextId("fe");
    var s = svgOpen("0 0 400 225", o.label || null, ' preserveAspectRatio="xMidYMid slice"');
    s += '<defs><radialGradient id="' + gid + '" cx="65%" cy="40%" r="80%"><stop offset="0" stop-color="' + pal[1] + '"/><stop offset="1" stop-color="' + pal[0] + '"/></radialGradient></defs>';
    s += '<rect width="400" height="225" fill="url(#' + gid + ')"/>';
    s += '<g opacity=".22" transform="translate(190 -70) scale(.9)">' + art.mandala({ color: pal[2] }).replace(/^<svg[^>]*>|<\/svg>$/g, "") + "</g>";
    s += starsLayer(400, 225, 18, (o.seed || 1) * 13);
    var c = pal[2];
    if (m === "diya" || m === "sun") {
      if (m === "sun") {
        for (var r = 0; r < 16; r++) { var a1 = pol(280, 100, 40, r * 22.5), a2 = pol(280, 100, 62, r * 22.5); s += '<line x1="' + a1[0] + '" y1="' + a1[1] + '" x2="' + a2[0] + '" y2="' + a2[1] + '" stroke="' + c + '" stroke-width="3" stroke-linecap="round"/>'; }
        s += '<circle cx="280" cy="100" r="34" fill="' + c + '"/>';
      } else {
        s += '<ellipse cx="280" cy="150" rx="70" ry="10" fill="#000" opacity=".25"/><path d="M215 128h130c0 22-29 36-65 36s-65-14-65-36z" fill="#C8742A" stroke="' + c + '"/>';
        s += '<path d="M280 62c14 18 20 30 20 41a20 20 0 0 1-40 0c0-11 6-23 20-41z" fill="' + c + '" class="kp-twinkle"/><path d="M280 84c6 8 9 13 9 18a9 9 0 0 1-18 0c0-5 3-10 9-18z" fill="#FFF3C4"/>';
        s += '<circle cx="280" cy="98" r="58" fill="' + c + '" opacity=".14"/>';
      }
    } else if (m === "colors") {
      [["#FF6FA8", 250, 90, 46], ["#FFD23F", 310, 130, 36], ["#3DDC97", 228, 150, 30], ["#6FA8FF", 330, 70, 24], ["#FF8A3D", 290, 170, 20]].forEach(function (b) { s += '<circle cx="' + b[1] + '" cy="' + b[2] + '" r="' + b[3] + '" fill="' + b[0] + '" opacity=".75"/>'; });
    } else if (m === "trishul") {
      s += '<path d="M290 40c-26 6-42 26-42 50 0 26 20 46 46 50-16-10-26-28-26-48 0-22 10-42 22-52z" fill="#F4F0E4" opacity=".9"/>';
      s += '<path d="M330 60v130M330 60c-4 12-14 18-24 18M330 60c4 12 14 18 24 18M306 78v18M354 78v18" stroke="' + c + '" stroke-width="4" fill="none" stroke-linecap="round"/>';
    } else if (m === "kite") {
      s += '<path d="M300 40l45 55-45 65-45-65z" fill="' + c + '" opacity=".9"/><path d="M300 40v120M255 95h90" stroke="#0B2B4A" stroke-width="2"/><path d="M300 160c-10 20 10 30 0 50" stroke="' + c + '" stroke-width="2" fill="none"/>';
      s += '<path d="M230 70l26 32-26 38-26-38z" fill="#FF6F61" opacity=".8"/>';
    } else if (m === "lotus") {
      s += '<g transform="translate(290 140)" fill="' + c + '" stroke="#FFE3D6" stroke-width="1">';
      [-60, -30, 0, 30, 60].forEach(function (a) { s += '<path d="M0 0C-14-24-14-52 0-72C14-52 14-24 0 0z" transform="rotate(' + a + ')" opacity="' + (a === 0 ? 1 : .8) + '"/>'; });
      s += "</g>";
    } else if (m === "bow") {
      s += '<path d="M260 40c40 30 40 110 0 140" stroke="' + c + '" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M260 40v140" stroke="#F4F0E4" stroke-width="1.5"/><path d="M230 110h110M330 100l12 10-12 10" stroke="#F4F0E4" stroke-width="3" fill="none" stroke-linecap="round"/>';
    }
    s += "</svg>";
    return s;
  };
  art.thumb = function (o) {
    o = o || {};
    var kind = o.kind || "kundli";
    var gid = nextId("th");
    var s = svgOpen("0 0 400 225", o.label || null, ' preserveAspectRatio="xMidYMid slice"');
    s += '<defs><radialGradient id="' + gid + '" cx="75%" cy="30%" r="90%"><stop offset="0" stop-color="#26357A"/><stop offset=".55" stop-color="#101A48"/><stop offset="1" stop-color="#070D26"/></radialGradient></defs>';
    s += '<rect width="400" height="225" fill="url(#' + gid + ')"/>' + starsLayer(400, 225, 26, (o.seed || 3) * 7);
    var inner = "", tx = 190, ty = -20, sc = .66;
    if (kind === "kundli") inner = art.kundliChart({ theme: "dark" });
    else if (kind === "horoscope") { inner = art.zodiacWheel({ center: "sun", bg: false }); tx = 170; ty = -60; sc = .72; }
    else if (kind === "numerology") inner = art.loShu({});
    else if (kind === "gem") inner = art.gemFacet({ color: o.color || "#1E9E62" });
    else if (kind === "vastu") inner = art.compass({ lang: o.lang });
    else if (kind === "remedy") inner = art.yantra({});
    else if (kind === "planets") inner = art.navagraha({ lang: o.lang });
    else if (kind === "panchang") inner = art.moonPhases({});
    else if (kind === "marriage") { inner = art.twinCharts({}); tx = 60; ty = 20; sc = .45; }
    else if (kind === "nakshatra") { inner = art.zodiacWheel({ center: "star", bg: false }); tx = 170; ty = -60; sc = .72; }
    else inner = art.mandala({});
    var vb = (inner.match(/viewBox="([^"]+)"/) || [])[1] || "0 0 300 300";
    var parts = vb.split(" ").map(Number);
    var target = 300 / Math.max(parts[2], parts[3]);
    s += '<g transform="translate(' + tx + " " + ty + ") scale(" + f1(sc * target * 100) / 100 + ") translate(" + (-parts[0]) + " " + (-parts[1]) + ')">' + stillArt(inner).replace(/^<svg[^>]*>|<\/svg>$/g, "").replace(/ class="kp-float"/g, "") + "</g>";
    s += "</svg>";
    return s;
  };
  art.constellation = function (o) {
    o = o || {};
    var r = seeded((o.n || 1) * 31), pts = [], k = 3 + Math.floor(r() * 3);
    for (var i = 0; i < k; i++) pts.push([f1(8 + (i / (k - 1)) * 62 + (r() - .5) * 8), f1(8 + r() * 24)]);
    var s = svgOpen("0 0 78 40", null);
    s += '<path d="M' + pts.join("L") + '" fill="none" stroke="' + GOLD + '" stroke-opacity=".55" stroke-width=".8"/>';
    pts.forEach(function (p, j) { s += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="' + (j === 0 ? 2.4 : 1.6) + '" fill="' + CREAM + '"' + (j === 0 ? ' class="kp-twinkle"' : "") + "/>"; });
    return s + "</svg>";
  };
  art.band = function () {
    var s = svgOpen("0 0 1200 200", null, ' preserveAspectRatio="none"');
    var r = seeded(99), pts = [];
    for (var i = 0; i < 27; i++) pts.push([f1(i * 44.4 + 20), f1(60 + Math.sin(i * .9) * 34 + (r() - .5) * 26)]);
    s += '<path d="M' + pts.join("L") + '" fill="none" stroke="' + GOLD + '" stroke-opacity=".35" stroke-width="1"/>';
    pts.forEach(function (p, j) { s += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="' + (j % 3 === 0 ? 2.6 : 1.6) + '" fill="' + CREAM + '"' + (j % 4 === 0 ? ' class="kp-twinkle"' : "") + "/>"; });
    return s + "</svg>";
  };
  art.guna = function (o) {
    o = o || {};
    var v = Math.max(0, Math.min(36, Number(o.v) || 0)), c = 2 * Math.PI * 42, dash = f1(c * v / 36);
    return '<svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,.1)" stroke-width="8"/><circle cx="50" cy="50" r="42" fill="none" stroke="' + GOLD + '" stroke-width="8" stroke-linecap="round" stroke-dasharray="' + dash + " " + f1(c) + '"/></svg>';
  };

  // Rotations use SVG's own animateTransform with an explicit centre. CSS
  // transform-origin on SVG groups is resolved differently across browsers
  // (and against a padded viewBox), which made the rings drift apart.
  var REDUCED = !!(global.matchMedia && global.matchMedia("(prefers-reduced-motion: reduce)").matches);
  function rotAnim(cx, cy, dur, rev) {
    if (REDUCED) return "";
    var a = rev ? 360 : 0, b = rev ? 0 : 360;
    return '<animateTransform attributeName="transform" type="rotate" from="' + a + " " + cx + " " + cy + '" to="' + b + " " + cx + " " + cy + '" dur="' + dur + 's" repeatCount="indefinite"/>';
  }
  function spinify(svg) {
    var vb = (svg.match(/viewBox="([^"]+)"/) || [])[1];
    if (!vb) return svg;
    var p = vb.split(/\s+/).map(Number), cx = f1(p[0] + p[2] / 2), cy = f1(p[1] + p[3] / 2);
    var durOf = function (style, rev) { var m = /animation-duration:(\d+)s/.exec(style || ""); return m ? m[1] : (rev ? 120 : 180); };
    // groups rotate about the drawing's centre
    svg = svg.replace(/<g([^>]*?) class="kp-spin(-rev)?"(?: style="([^"]*)")?([^>]*)>/g, function (m, pre, rev, style, post) {
      return "<g" + pre + post + ">" + rotAnim(cx, cy, durOf(style, !!rev), !!rev);
    });
    // a single ring rotates about its own centre
    svg = svg.replace(/<circle([^>]*?) class="kp-spin(-rev)?"(?: style="([^"]*)")?([^>]*?)\/>/g, function (m, pre, rev, style, post) {
      var attrs = pre + post, x = (/ cx="([-\d.]+)"/.exec(attrs) || [])[1] || cx, y = (/ cy="([-\d.]+)"/.exec(attrs) || [])[1] || cy;
      return "<circle" + attrs + ">" + rotAnim(x, y, durOf(style, !!rev), !!rev) + "</circle>";
    });
    return svg;
  }
  Object.keys(art).forEach(function (k) {
    var fn = art[k];
    art[k] = function (o) { return spinify(fn(o)); };
  });
  function stillArt(svg) { return String(svg).replace(/<animateTransform[^>]*\/>/g, ""); }

  function renderArt(name, opts) {
    var fn = art[name];
    if (!fn) return "";
    try { return fn(opts || {}); } catch (e) { console.error("KP art failed:", name, e); return ""; }
  }

  // ------------------------------------------------------------ page info
  var file = "";
  try { file = decodeURIComponent(location.pathname.split("/").pop() || ""); } catch (e) { file = ""; }
  var baseName = file.replace(/\.dc\.html$/i, "").replace(/\.html$/i, "").replace(/ HI$/, "");
  if (!baseName || baseName === "index") baseName = "Kundli Planet Home";
  var hiFile = / HI\.dc\.html$/i.test(file) || file === "" || /^index\.html$/i.test(file);
  var CAT_OF = {
    "Kundli Planet Home": "home", "Kundli": "kundli", "Lagna": "kundli", "Rashi": "kundli", "Nakshatra": "nakshatra", "Vedic Astrology": "graha",
    "Kundli Milan": "milan", "Marriage Consultation": "milan", "Mangal Dosha": "dosha", "Kaal Sarp Dosha": "dosha-ks",
    "Panchang": "panchang", "Vrat": "panchang", "Festivals": "festival", "Diwali": "festival", "Holi": "festival", "Navratri": "festival",
    "Mahashivratri": "festival", "Ganesh Chaturthi": "festival", "Makar Sankranti": "festival",
    "Numerology": "numerology", "Baby Names": "numerology", "Gemstones": "gem",
    "Astrology Remedies": "remedy", "Mantra": "remedy", "Yantra": "remedy", "Rudraksha": "remedy", "Puja": "remedy",
    "Career Consultation": "consult", "Contact Us": "consult", "About Us": "about",
    "Tarot": "tarot", "Palmistry": "palm", "Vastu": "vastu", "Blog": "blog", "Horoscope": "horoscope"
  };
  var cat = CAT_OF[baseName] || "";
  var signIdx = -1;
  SIGNS.forEach(function (s, i) { if (s.en === baseName) signIdx = i; });
  if (signIdx > -1) cat = "sign";
  if (!cat && /^Horoscope /.test(baseName)) cat = "horoscope";
  if (!cat && /^Article /.test(baseName)) cat = "article";
  var GEM_PAGES = { "Ruby": 1, "Pearl": 1, "Red Coral": 1, "Emerald": 1, "Yellow Sapphire": 1, "Diamond": 1, "Blue Sapphire": 1, "Hessonite": 1, "Cats Eye": 1 };
  if (!cat && GEM_PAGES[baseName]) cat = "gemstone";
  var FEST_MOTIF = { "Diwali": "diya", "Holi": "colors", "Navratri": "lotus", "Mahashivratri": "trishul", "Ganesh Chaturthi": "lotus", "Makar Sankranti": "kite", "Festivals": "diya" };
  var ARTICLE_KIND = { "Article Gemstone Kundli": "gem", "Article Lagna First": "kundli", "Article Daily Horoscope": "horoscope", "Article Life Path Number": "numerology", "Article Main Door Vastu": "vastu", "Article Rudraksha Mukhi": "remedy" };
  var NAV_OF_CAT = { kundli: "kundli", nakshatra: "kundli", graha: "kundli", dosha: "kundli", "dosha-ks": "kundli", milan: "milan", panchang: "panchang", festival: "panchang",
    numerology: "numerology", gem: "gems", gemstone: "gems", remedy: "remedies", horoscope: "horoscope", sign: "horoscope", blog: "articles", article: "articles",
    tarot: "more", palm: "more", vastu: "more", about: "more", consult: "more" };

  function lang() {
    var l = (root.getAttribute("lang") || "").slice(0, 2);
    if (l === "hi" || l === "en") return l;
    return hiFile ? "hi" : "en";
  }

  // -------------------------------------------------------- navigation IA
  function P(en, hi) { return { en: en, hi: hi }; }
  var R = {
    home: P("/en", "/hi"),
    kundli: P("/en/kundli", "/hi/kundli"), kundliTool: P("/en/kundli#kundli-tool", "/hi/kundli#kundli-tool"),
    lagna: P("/en/kundli/lagna", "/hi/kundli/lagna"), rashi: P("/en/kundli/rashi", "/hi/kundli/rashi"), nakshatra: P("/en/kundli/nakshatra", "/hi/kundli/nakshatra"),
    mangal: P("/en/kundli/mangal-dosha", "/hi/kundli/mangal-dosh"), kaalsarp: P("/en/kundli/kaal-sarp-dosha", "/hi/kundli/kaal-sarp-dosh"),
    vedic: P("/en/vedic-astrology", "/hi/vaidik-jyotish"),
    horoscope: P("/en/horoscope", "/hi/rashifal"),
    milan: P("/en/kundli-milan", "/hi/kundli-milan"), milanTool: P("/en/kundli-milan#milan-tool", "/hi/kundli-milan#milan-tool"),
    marriage: P("/en/consultation/marriage", "/hi/paramarsh/vivah"), career: P("/en/consultation/career", "/hi/paramarsh/career"),
    panchang: P("/en/panchang", "/hi/panchang"), festivals: P("/en/festivals", "/hi/tyohar"), vrat: P("/en/astrology-remedies/vrat", "/hi/jyotish-upay/vrat"),
    numerology: P("/en/numerology", "/hi/ank-jyotish"), gems: P("/en/gemstones", "/hi/ratna"),
    remedies: P("/en/astrology-remedies", "/hi/jyotish-upay"), mantra: P("/en/astrology-remedies/mantra", "/hi/jyotish-upay/mantra"),
    yantra: P("/en/astrology-remedies/yantra", "/hi/jyotish-upay/yantra"), rudraksha: P("/en/astrology-remedies/rudraksha", "/hi/jyotish-upay/rudraksha"),
    puja: P("/en/astrology-remedies/puja", "/hi/jyotish-upay/puja"),
    blog: P("/en/blog", "/hi/blog"), vastu: P("/en/vastu", "/hi/vastu"), tarot: P("/en/tarot", "/hi/tarot"), palmistry: P("/en/palmistry", "/hi/hastrekha"),
    baby: P("/en/baby-names", "/hi/shishu-naam"), about: P("/en/about", "/hi/hamare-bare-mein"), contact: P("/en/contact", "/hi/sampark"),
    faq: P("/en/faq", "/hi/prashn"), search: P("/en/search", "/hi/khoj"),
    privacy: P("/en/privacy-policy", "/hi/gopniyata-niti"), terms: P("/en/terms", "/hi/niyam-sharten"), disclaimer: P("/en/disclaimer", "/hi/asweekaran")
  };
  var HORO_PERIODS = [["today", "aaj", "Daily Horoscope", "दैनिक राशिफल", "sun"], ["tomorrow", "kal", "Tomorrow", "कल का राशिफल", "moon"], ["weekly", "saptahik", "Weekly Horoscope", "साप्ताहिक राशिफल", "panchang"],
    ["monthly", "masik", "Monthly Horoscope", "मासिक राशिफल", "panchang"], ["yearly", "varshik", "Yearly Horoscope", "वार्षिक राशिफल", "wheel"]];
  var HORO_TOPICS = [["love", "prem", "Love Horoscope", "प्रेम राशिफल", "heart"], ["career", "career", "Career Horoscope", "करियर राशिफल", "briefcase"], ["marriage", "vivah", "Marriage", "विवाह", "milan"],
    ["finance", "dhan", "Finance", "धन", "coins"], ["health", "swasthya", "Health", "स्वास्थ्य", "lotus"], ["business", "vyapar", "Business", "व्यापार", "shop"]];
  function it(t, th, r, ic, d, dh) { return { t: t, th: th, r: r, ic: ic, d: d, dh: dh }; }
  function NAV() {
    return [
      { key: "kundli", en: "Kundli", hi: "कुंडली", r: R.kundli, ic: "kundli", cols: 2, feature: { art: "kundliChart", t: "Generate Kundli", th: "कुंडली बनाएँ", d: "Lagna, Navamsa, planets, dasha and doshas from your birth details.", dh: "जन्म विवरण से लग्न, नवांश, ग्रह, दशा और दोष।", r: R.kundliTool },
        groups: [
          { t: "Generate", th: "बनाएँ", items: [
            it("Generate Kundli", "कुंडली बनाएँ", R.kundliTool, "kundli", "Birth chart from date, time and place", "जन्म तिथि, समय और स्थान से"),
            it("Planet Positions", "ग्रह स्थिति", R.kundliTool, "planet", "Sign, degree, nakshatra and house", "राशि, अंश, नक्षत्र और भाव"),
            it("Lagna, Moon & Navamsa", "लग्न, चंद्र व नवांश", R.kundliTool, "wheel", "Divisional charts D1 and D9", "D1 और D9 वर्ग कुंडली"),
            it("Vimshottari Dasha", "विंशोत्तरी दशा", R.kundliTool, "dasha", "Current Mahadasha and Antardasha", "वर्तमान महादशा और अंतर्दशा"),
            it("Kundli PDF", "कुंडली PDF", R.kundliTool, "download", "Download your full report", "पूरी रिपोर्ट डाउनलोड करें") ] },
          { t: "Understand", th: "समझें", items: [
            it("Lagna", "लग्न", R.lagna, "sun"), it("Rashi", "राशि", R.rashi, "wheel"), it("Nakshatra", "नक्षत्र", R.nakshatra, "star"),
            it("Mangal Dosha", "मंगल दोष", R.mangal, "mars"), it("Kaal Sarp Dosha", "कालसर्प दोष", R.kaalsarp, "planet"), it("Vedic Astrology", "वैदिक ज्योतिष", R.vedic, "book") ], compact: true }
        ] },
      { key: "horoscope", en: "Horoscope", hi: "राशिफल", r: R.horoscope, ic: "sun", cols: 2, signs: true,
        groups: [
          { t: "By period", th: "अवधि", items: HORO_PERIODS.map(function (h) { return it(h[2], h[3], P("/en/horoscope/" + h[0], "/hi/rashifal/" + h[1]), h[4]); }), compact: true },
          { t: "By topic", th: "विषय", items: HORO_TOPICS.map(function (h) { return it(h[2], h[3], P("/en/horoscope/" + h[0], "/hi/rashifal/" + h[1]), h[4]); }), compact: true }
        ] },
      { key: "milan", en: "Kundli Milan", hi: "कुंडली मिलान", r: R.milan, ic: "milan", cols: 1, feature: { art: "twinCharts", t: "36 Guna Milan", th: "36 गुण मिलान", d: "Boy's and girl's birth details, matched through the Ashtakoot system.", dh: "वर और वधू के जन्म विवरण, अष्टकूट पद्धति से मिलान।", r: R.milanTool },
        groups: [{ t: "Match", th: "मिलान", items: [
          it("Kundli Matching", "कुंडली मिलान", R.milanTool, "milan", "Enter both birth details", "दोनों के जन्म विवरण दर्ज करें"),
          it("Guna Milan (Ashtakoot)", "गुण मिलान (अष्टकूट)", R.milanTool, "grid", "Eight koots, 36 points", "आठ कूट, 36 गुण"),
          it("Manglik Matching", "मांगलिक मिलान", R.mangal, "mars", "Mangal Dosha in both charts", "दोनों कुंडलियों में मंगल दोष"),
          it("Marriage Consultation", "विवाह परामर्श", R.marriage, "consult", "Talk it through with us", "हमसे विस्तार से बात करें") ] }] },
      { key: "panchang", en: "Panchang", hi: "पंचांग", r: R.panchang, ic: "panchang", cols: 1, feature: { art: "moonPhases", t: "Today's Panchang", th: "आज का पंचांग", d: "Tithi, nakshatra, yoga, karana, Rahu Kaal and Abhijit Muhurat.", dh: "तिथि, नक्षत्र, योग, करण, राहु काल और अभिजीत मुहूर्त।", r: R.panchang },
        groups: [{ t: "Daily", th: "दैनिक", items: [
          it("Today's Panchang", "आज का पंचांग", R.panchang, "panchang", "Tithi, vaar, nakshatra, yoga, karana", "तिथि, वार, नक्षत्र, योग, करण"),
          it("Rahu Kaal & Muhurat", "राहु काल व मुहूर्त", R.panchang, "clock", "Timings for the day", "दिन के शुभ-अशुभ समय"),
          it("Festivals", "त्यौहार", R.festivals, "diya", "Hindu festival calendar", "हिंदू त्यौहार कैलेंडर"),
          it("Vrat", "व्रत", R.vrat, "fast", "Fasting days by graha", "ग्रह अनुसार व्रत"),
          it("Nakshatra", "नक्षत्र", R.nakshatra, "star", "The 27 lunar mansions", "27 नक्षत्र") ] }] },
      { key: "numerology", en: "Numerology", hi: "अंक ज्योतिष", r: R.numerology, ic: "grid" },
      { key: "gems", en: "Gemstones", hi: "रत्न", r: R.gems, ic: "gem", gems: true },
      { key: "remedies", en: "Remedies", hi: "उपाय", r: R.remedies, ic: "diya", cols: 1, small: true,
        groups: [{ t: "Traditional remedies", th: "पारंपरिक उपाय", items: [
          it("Mantra", "मंत्र", R.mantra, "mantra"), it("Yantra", "यंत्र", R.yantra, "yantra"), it("Rudraksha", "रुद्राक्ष", R.rudraksha, "rudraksha"),
          it("Puja", "पूजा", R.puja, "kalash"), it("Vrat", "व्रत", R.vrat, "fast"), it("Gemstones", "रत्न", R.gems, "gem"), it("All remedies", "सभी उपाय", R.remedies, "om") ], compact: true }] },
      { key: "articles", en: "Articles", hi: "लेख", r: R.blog, ic: "book" },
      { key: "more", en: "More", hi: "और", r: null, ic: "dots", cols: 1, small: true, right: true,
        groups: [{ t: "Explore", th: "और देखें", items: [
          it("Vastu", "वास्तु", R.vastu, "compass"), it("Tarot", "टैरो", R.tarot, "cards"), it("Palmistry", "हस्तरेखा", R.palmistry, "hand"),
          it("Baby Names", "शिशु नाम", R.baby, "baby"), it("About Us", "हमारे बारे में", R.about, "om"), it("Contact Us", "संपर्क करें", R.contact, "phone") ], compact: true }] }
    ];
  }

  // ------------------------------------------------------------- header
  function L(o, l) { return l === "hi" ? (o.th || o.hi) : (o.t || o.en); }
  function href(r, l) { return r ? r[l] : "#"; }
  function renderMegaItem(i, l, compact) {
    return '<li><a href="' + href(i.r, l) + '">' + icon(i.ic) + '<span><span class="kp-mi-t">' + esc(L(i, l)) + "</span>" +
      (!compact && (i.d || i.dh) ? '<span class="kp-mi-d">' + esc(l === "hi" ? i.dh : i.d) + "</span>" : "") + "</span></a></li>";
  }
  function renderMega(n, l) {
    var h = "";
    var cols = n.cols || 1;
    if (n.gems) {
      h += '<div class="kp-mega-grid" style="--cols:1"><div><p class="kp-mega-h">' + (l === "hi" ? "नवरत्न" : "Navaratna") + '</p><ul class="kp-mega-list" style="grid-template-columns:1fr 1fr;display:grid">';
      GEMS.forEach(function (g) { var p = PMAP[g.k]; h += '<li><a href="' + (l === "hi" ? "/hi/ratna/" + g.hi_s : "/en/gemstones/" + g.en_s) + '"><span class="kp-icon kp-glyph" style="font-size:15px">' + p.g + T + '</span><span><span class="kp-mi-t">' + esc(l === "hi" ? g.hi : g.en) + '</span><span class="kp-mi-d">' + esc(l === "hi" ? p.hi : p.en + " · " + g.tr) + "</span></span></a></li>"; });
      h += '</ul><p style="margin:12px 0 0"><a class="kp-btn-gold" style="padding:9px 16px;font-size:12.5px" href="' + href(R.gems, l) + '">' + (l === "hi" ? "सभी रत्न देखें" : "Explore all gemstones") + "</a></p></div></div>";
      return '<div class="kp-mega" style="min-width:520px">' + h + "</div>";
    }
    var gridCols = cols + (n.signs ? 1 : 0);
    h += '<div class="kp-mega-grid' + (n.feature ? " has-feature" : "") + '" style="--cols:' + gridCols + '">';
    n.groups.forEach(function (g) {
      h += '<div><p class="kp-mega-h">' + esc(L(g, l)) + '</p><ul class="kp-mega-list' + (g.compact ? " is-compact" : "") + '">' + g.items.map(function (i) { return renderMegaItem(i, l, g.compact); }).join("") + "</ul></div>";
    });
    if (n.signs) {
      h += '<div><p class="kp-mega-h">' + (l === "hi" ? "बारह राशियाँ" : "The twelve rashis") + '</p><div class="kp-mega-signs">';
      SIGNS.forEach(function (s) { h += '<a href="' + (l === "hi" ? "/hi/rashifal/" + s.hi_s : "/en/horoscope/" + s.en_s) + '"><span class="kp-glyph">' + s.g + T + "</span>" + esc(l === "hi" ? s.hi : s.en) + "</a>"; });
      h += "</div></div>";
    }
    if (n.feature) {
      var f = n.feature;
      h += '<a class="kp-mega-feature" href="' + href(f.r, l) + '"><span class="kp-art">' + renderArt(f.art, { theme: "dark", labels: l === "hi" ? ["वर", "वधू"] : ["BOY", "GIRL"] }) + "</span><strong>" + esc(L(f, l)) + "</strong><p>" + esc(l === "hi" ? f.dh : f.d) + '</p><span class="kp-btn-gold" style="padding:9px 14px;font-size:12.5px">' + (l === "hi" ? "अभी शुरू करें" : "Start now") + " →</span></a>";
    }
    h += "</div>";
    var minW = n.small ? "" : (gridCols + (n.feature ? 1 : 0) >= 3 ? ' style="min-width:760px"' : ' style="min-width:560px"');
    return '<div class="kp-mega' + (n.small ? " kp-mega-sm" : "") + (n.right ? " kp-mega-right" : "") + '"' + minW + ">" + h + "</div>";
  }
  function renderHeader(l) {
    var nav = NAV(), active = NAV_OF_CAT[cat] || "";
    var hi = l === "hi";
    var h = '<div class="kp-topbar"><div class="kp-topbar-in"><span class="kp-topbar-tag"><b>✦</b> ' + (hi ? "वैदिक ज्योतिष • कुंडली • राशिफल • पंचांग" : "Vedic Astrology • Kundli • Horoscope • Panchang") + "</span>" +
      '<div class="kp-topbar-links">' +
      '<a href="tel:+91' + PHONE + '">' + icon("phone") + PHONE + "</a>" +
      '<a href="https://wa.me/' + WA + '" target="_blank" rel="noopener">' + icon("wa") + "WhatsApp</a>" +
      '<a href="' + href(R.search, l) + '" aria-label="' + (hi ? "साइट पर खोजें" : "Search the site") + '">' + icon("search") + (hi ? "खोजें" : "Search") + "</a>" +
      "</div></div></div>";
    h += '<div class="kp-mainbar"><div class="kp-mainbar-in">' +
      '<a class="kp-brand" href="' + href(R.home, l) + '" aria-label="' + (hi ? "कुंडली प्लैनेट मुखपृष्ठ" : "Kundli Planet home") + '"><img src="Kundli%20planet%20assets/kundli%20planet%20ogo.png" alt="" width="52" height="52"><span class="kp-brand-txt"><span class="kp-brand-name">' + (hi ? "कुंडली प्लैनेट" : "Kundli Planet") + '</span><span class="kp-brand-sub">' + (hi ? "वैदिक ज्योतिष · भागलपुर" : "Vedic Astrology · Bhagalpur") + "</span></span></a>" +
      '<nav class="kp-nav" aria-label="' + (hi ? "मुख्य" : "Primary") + '">';
    nav.forEach(function (n) {
      var hasMenu = !!(n.groups || n.gems);
      h += '<div class="kp-nav-item' + (active === n.key ? " is-active" : "") + (n.small ? " is-small" : "") + '">';
      if (n.r) h += '<a class="kp-nav-link" href="' + href(n.r, l) + '"' + (hasMenu ? ' aria-haspopup="true"' : "") + ">" + esc(L(n, l)) + (hasMenu ? icon("chev", "kp-chev") : "") + "</a>";
      else h += '<button type="button" class="kp-nav-link" style="background:none;border:0;font-family:inherit;cursor:pointer" aria-haspopup="true" aria-expanded="false" data-kp-menu>' + esc(L(n, l)) + icon("chev", "kp-chev") + "</button>";
      if (hasMenu) h += renderMega(n, l);
      h += "</div>";
    });
    h += "</nav>" +
      '<div class="kp-actions">' +
      '<button type="button" class="kp-m-lang" data-kp-lang aria-label="' + (hi ? "Switch to English" : "हिंदी में देखें") + '">' + icon("lang") + '<span class="' + (hi ? "" : "kp-lang-on") + '">EN</span><span class="kp-lang-sep">/</span><span class="' + (hi ? "kp-lang-on" : "") + '">हिंदी</span></button>' +
      '<button type="button" class="kp-btn-gold" data-kp-consult>' + icon("consult") + (hi ? "ज्योतिषी से परामर्श" : "Consult Astrologer") + "</button>" +
      '<button type="button" class="kp-iconbtn kp-burger" data-kp-drawer aria-label="' + (hi ? "मेन्यू खोलें" : "Open menu") + '" aria-expanded="false">' + icon("menu") + "</button>" +
      "</div></div></div>";
    return h;
  }
  function renderDrawer(l) {
    var hi = l === "hi", nav = NAV();
    var quick = [
      [R.kundliTool, "kundli", "Generate Kundli", "कुंडली बनाएँ", "Birth chart & report", "जन्म कुंडली व रिपोर्ट"],
      [R.milanTool, "milan", "Kundli Milan", "कुंडली मिलान", "36 guna matching", "36 गुण मिलान"],
      [P("/en/horoscope/today", "/hi/rashifal/aaj"), "sun", "Today's Horoscope", "आज का राशिफल", "All 12 rashis", "सभी 12 राशियाँ"],
      [R.panchang, "panchang", "Panchang", "पंचांग", "Tithi & Rahu Kaal", "तिथि व राहु काल"]
    ];
    var h = '<div class="kp-drawer-head"><a class="kp-brand" href="' + href(R.home, l) + '"><img src="Kundli%20planet%20assets/kundli%20planet%20ogo.png" alt="" width="38" height="38"><span class="kp-brand-txt"><span class="kp-brand-name">' + (hi ? "कुंडली प्लैनेट" : "Kundli Planet") + '</span></span></a><button type="button" class="kp-iconbtn" data-kp-drawer-close aria-label="' + (hi ? "मेन्यू बंद करें" : "Close menu") + '">' + icon("close") + "</button></div>";
    h += '<div class="kp-drawer-body"><div class="kp-drawer-quick">';
    quick.forEach(function (q) { h += '<a href="' + href(q[0], l) + '">' + icon(q[1]) + "<b>" + esc(hi ? q[3] : q[2]) + '</b><span class="kp-dq-d">' + esc(hi ? q[5] : q[4]) + "</span></a>"; });
    h += "</div>";
    nav.forEach(function (n) {
      // "More" has no page of its own; on mobile its links sit directly in the list.
      if (n.key === "more") {
        n.groups.forEach(function (g) { g.items.forEach(function (i) { h += '<a class="kp-drawer-link" href="' + href(i.r, l) + '">' + icon(i.ic) + esc(L(i, l)) + "</a>"; }); });
        return;
      }
      if (n.groups || n.gems) {
        var items = [];
        if (n.gems) GEMS.forEach(function (g) { items.push({ t: g.en, th: g.hi, r: P("/en/gemstones/" + g.en_s, "/hi/ratna/" + g.hi_s) }); });
        else n.groups.forEach(function (g) { g.items.forEach(function (i) { if (!items.some(function (x) { return L(x, l) === L(i, l); })) items.push(i); }); });
        if (n.signs) SIGNS.forEach(function (s) { items.push({ t: s.en, th: s.hi, r: P("/en/horoscope/" + s.en_s, "/hi/rashifal/" + s.hi_s) }); });
        if (n.r) items.unshift({ t: "Overview", th: "मुख्य पृष्ठ", r: n.r });
        h += '<details class="kp-acc"><summary>' + icon(n.ic) + esc(L(n, l)) + icon("chev", "kp-chev") + '</summary><div class="kp-acc-list">' +
          items.map(function (i) { return '<a href="' + href(i.r, l) + '">' + esc(L(i, l)) + "</a>"; }).join("") + "</div></details>";
      } else {
        h += '<a class="kp-drawer-link" href="' + href(n.r, l) + '">' + icon(n.ic) + esc(L(n, l)) + "</a>";
      }
    });
    h += '<a class="kp-drawer-link" href="' + href(R.search, l) + '">' + icon("search") + (hi ? "खोजें" : "Search") + "</a>";
    h += "</div>";
    h += '<div class="kp-drawer-foot"><button type="button" class="kp-btn-gold" data-kp-consult>' + icon("consult") + (hi ? "ज्योतिषी से परामर्श लें" : "Consult a Vedic Astrologer") + "</button>" +
      '<div class="kp-drawer-row"><a class="kp-btn-wa" href="https://wa.me/' + WA + '" target="_blank" rel="noopener">' + icon("wa") + "WhatsApp</a>" +
      '<button type="button" class="kp-btn-gold" style="background:rgba(255,255,255,.06);color:#F3E3B0 !important;box-shadow:none;border:1px solid rgba(212,175,55,.4)" data-kp-lang>' + icon("lang") + (hi ? "English" : "हिंदी") + "</button></div></div>";
    return h;
  }
  function renderBottomBar(l) {
    var hi = l === "hi", active = NAV_OF_CAT[cat] || "";
    var b = function (r, ic, en, hn, key) { return '<a href="' + href(r, l) + '"' + (active === key ? ' class="is-active" aria-current="page"' : "") + ">" + icon(ic) + "<span>" + esc(hi ? hn : en) + "</span></a>"; };
    return b(R.horoscope, "sun", "Rashifal", "राशिफल", "horoscope") +
      b(R.milanTool, "milan", "Milan", "मिलान", "milan") +
      '<a class="kp-bb-main" href="' + href(R.kundliTool, l) + '"><span class="kp-bb-orb">' + icon("kundli") + '</span><span class="kp-bb-l">' + (hi ? "कुंडली" : "Kundli") + "</span></a>" +
      b(R.panchang, "panchang", "Panchang", "पंचांग", "panchang") +
      '<button type="button" data-kp-consult>' + icon("consult") + "<span>" + (hi ? "परामर्श" : "Consult") + "</span></button>";
  }
  function renderFooter(l) {
    var hi = l === "hi";
    var col = function (t, th, links) {
      return "<div><h3>" + esc(hi ? th : t) + "</h3><ul>" + links.map(function (x) { return '<li><a href="' + href(x[0], l) + '">' + esc(hi ? x[2] : x[1]) + "</a></li>"; }).join("") + "</ul></div>";
    };
    var h = '<span class="kp-footer-orn">' + art.mandala({}) + "</span>";
    h += '<div class="kp-footer-cta"><div><h2>' + (hi ? "अपनी कुंडली से शुरुआत करें" : "Begin with your Kundli") + "</h2><p>" + (hi ? "जन्म तिथि, समय और स्थान दर्ज करें, बाकी हम समझाएँगे।" : "Enter your date, time and place of birth. We will explain the rest.") + '</p></div><div class="kp-row">' +
      '<a class="kp-btn-gold" style="padding:13px 22px;font-size:14.5px" href="' + href(R.kundliTool, l) + '">' + icon("kundli") + (hi ? "कुंडली बनाएँ" : "Generate Kundli") + "</a>" +
      '<a class="kp-btn-wa" href="https://wa.me/' + WA + '" target="_blank" rel="noopener">' + icon("wa") + (hi ? "व्हाट्सएप पर बात करें" : "Chat on WhatsApp") + "</a></div></div>";
    h += '<div class="kp-footer-in"><div class="kp-footer-brand"><a class="kp-brand" href="' + href(R.home, l) + '"><img src="Kundli%20planet%20assets/kundli%20planet%20ogo.png" alt="Kundli Planet logo" width="52" height="52" loading="lazy"><span class="kp-brand-txt"><span class="kp-brand-name">' + (hi ? "कुंडली प्लैनेट" : "Kundli Planet") + '</span><span class="kp-brand-sub">' + (hi ? "वैदिक ज्योतिष · भागलपुर" : "Vedic Astrology · Bhagalpur") + "</span></span></a>" +
      "<p>" + (hi ? "कुंडली, राशिफल, कुंडली मिलान, पंचांग, अंक ज्योतिष और रत्न परामर्श, पारंपरिक वैदिक पद्धति से, सरल भाषा में।" : "Kundli, horoscope, Kundli Milan, Panchang, numerology and gemstone guidance, read in the traditional Vedic way and explained in plain language.") + "</p>" +
      '<div class="kp-footer-contact"><div>' + icon("pin") + "<address>" + (hi ? "मोहद्दीनगर, दुर्गा मंदिर के पास<br>भागलपुर, बिहार" : "Mohaddinagar, near Durga Mandir<br>Bhagalpur, Bihar") + "</address></div>" +
      '<a href="tel:+91' + PHONE + '">' + icon("phone") + "+91 " + PHONE + "</a>" +
      '<a href="mailto:' + EMAIL + '">' + icon("mail") + EMAIL + "</a></div>" +
      '<div class="kp-footer-social"><a class="kp-btn-wa" href="https://wa.me/' + WA + '" target="_blank" rel="noopener">' + icon("wa") + "WhatsApp</a>" +
      '<a href="https://share.google/1QMajgoQwRt85JKtd" target="_blank" rel="noopener">' + icon("pin") + (hi ? "गूगल प्रोफ़ाइल" : "Google Profile") + "</a></div></div>";
    h += col("Astrology", "ज्योतिष", [[R.kundli, "Kundli", "कुंडली"], [R.horoscope, "Horoscope", "राशिफल"], [R.milan, "Kundli Milan", "कुंडली मिलान"], [R.panchang, "Panchang", "पंचांग"], [R.numerology, "Numerology", "अंक ज्योतिष"], [R.gems, "Gemstones", "रत्न"]]);
    h += col("Tools", "साधन", [[R.kundliTool, "Generate Kundli", "कुंडली बनाएँ"], [R.mangal, "Mangal Dosha", "मंगल दोष"], [R.kaalsarp, "Kaal Sarp Dosha", "कालसर्प दोष"], [R.kundliTool, "Sade Sati", "साढ़ेसाती"], [R.nakshatra, "Nakshatra", "नक्षत्र"], [R.kundliTool, "Dasha", "दशा"], [R.panchang, "Muhurat", "मुहूर्त"]]);
    h += col("Resources", "संसाधन", [[R.blog, "Articles", "लेख"], [R.vedic, "Astrology Guide", "ज्योतिष मार्गदर्शिका"], [R.remedies, "Remedies", "उपाय"], [R.festivals, "Festivals", "त्यौहार"], [R.faq, "FAQs", "सामान्य प्रश्न"], [R.baby, "Baby Names", "शिशु नाम"]]);
    h += col("Company", "कंपनी", [[R.about, "About", "हमारे बारे में"], [R.contact, "Contact", "संपर्क"], [R.career, "Consultation", "परामर्श"], [R.privacy, "Privacy Policy", "गोपनीयता नीति"], [R.terms, "Terms", "नियम एवं शर्तें"], [R.disclaimer, "Disclaimer", "अस्वीकरण"]]);
    h += "</div>";
    h += '<div class="kp-footer-bottom"><span>© ' + new Date().getFullYear() + (hi ? " कुंडली प्लैनेट, भागलपुर, बिहार। सर्वाधिकार सुरक्षित।" : " Kundli Planet, Bhagalpur, Bihar. All rights reserved.") + "</span><span>" +
      (hi ? "ज्योतिष सामग्री पारंपरिक व्याख्या है, प्रमाणित तथ्य या गारंटी नहीं।" : "Astrology content is traditional interpretation, not guaranteed fact or prediction.") + "</span></div>";
    return h;
  }

  // -------------------------------------------------------- page actions
  function toggleLang() {
    var b = doc.querySelector("header:not(.kp-header) [data-langbtn]") || doc.querySelector("[data-langbtn]");
    closeDrawer();
    if (b) { b.click(); return; }
    var ev = new CustomEvent("kp:lang", { cancelable: true });
    if (global.dispatchEvent(ev) && !ev.defaultPrevented) {
      root.setAttribute("lang", lang() === "hi" ? "en" : "hi");
    }
  }
  function openConsult() {
    closeDrawer();
    var b = doc.querySelector("header:not(.kp-header) [data-consultbtn]") || doc.querySelector("[data-consultbtn]");
    if (b) { b.click(); return; }
    var ev = new CustomEvent("kp:consult", { cancelable: true });
    global.dispatchEvent(ev);
    if (!ev.defaultPrevented) global.open("https://wa.me/" + WA, "_blank", "noopener");
  }
  var lastFocus = null;
  function openDrawer() {
    lastFocus = doc.activeElement;
    root.classList.add("kp-drawer-open");
    var d = doc.querySelector(".kp-drawer");
    if (d) { d.removeAttribute("inert"); d.setAttribute("aria-hidden", "false"); var c = d.querySelector("[data-kp-drawer-close]"); if (c) c.focus(); }
    var burger = doc.querySelector("[data-kp-drawer]"); if (burger) burger.setAttribute("aria-expanded", "true");
  }
  function closeDrawer() {
    if (!root.classList.contains("kp-drawer-open")) return;
    root.classList.remove("kp-drawer-open");
    var d = doc.querySelector(".kp-drawer");
    if (d) { d.setAttribute("aria-hidden", "true"); d.setAttribute("inert", ""); }
    var burger = doc.querySelector("[data-kp-drawer]"); if (burger) burger.setAttribute("aria-expanded", "false");
    if (lastFocus && lastFocus.focus) try { lastFocus.focus(); } catch (e) { /* ignore */ }
  }

  // --------------------------------------------------------------- mount
  var els = {};
  var renderedLang = null;
  function mountShell() {
    var body = doc.body;
    if (!body) return;
    if (!els.header) {
      els.header = doc.createElement("header");
      els.header.className = "kp-header";
      body.insertBefore(els.header, body.firstChild);
      els.back = doc.createElement("div");
      els.back.className = "kp-drawer-back";
      els.back.setAttribute("data-kp-drawer-close", "");
      els.drawer = doc.createElement("div");
      els.drawer.className = "kp-drawer";
      els.drawer.setAttribute("role", "dialog");
      els.drawer.setAttribute("aria-modal", "true");
      els.drawer.setAttribute("aria-hidden", "true");
      els.drawer.setAttribute("inert", "");
      els.bottom = doc.createElement("nav");
      els.bottom.className = "kp-bottombar";
      els.footer = doc.createElement("footer");
      els.footer.className = "kp-footer";
      body.appendChild(els.back);
      body.appendChild(els.drawer);
      body.appendChild(els.bottom);
      body.appendChild(els.footer);
      if (cat) body.setAttribute("data-kp-cat", cat);
      if (cat === "home") body.classList.add("kp-home-page");
      setWatermark();
    }
    var l = lang();
    if (renderedLang !== l) {
      renderedLang = l;
      els.header.innerHTML = renderHeader(l);
      els.drawer.innerHTML = renderDrawer(l);
      els.drawer.setAttribute("aria-label", l === "hi" ? "मेन्यू" : "Menu");
      els.bottom.innerHTML = renderBottomBar(l);
      els.bottom.setAttribute("aria-label", l === "hi" ? "त्वरित साधन" : "Quick tools");
      els.footer.innerHTML = renderFooter(l);
    }
    placeFooter();
  }
  // Raw <x-dc> markup is a template the runtime has not rendered yet; it is
  // parsed later, so it must never be modified.
  function live(el) { return !!el && !(el.closest && el.closest("x-dc")); }
  function liveQuery(sel) { var list = doc.querySelectorAll(sel); for (var i = 0; i < list.length; i++) if (live(list[i])) return list[i]; return null; }
  // Keep the shared footer directly after the page's own content root.
  function placeFooter() {
    var main = liveQuery("main");
    if (!main || !els.footer) return;
    var host = main;
    while (host.parentElement && host.parentElement !== doc.body) host = host.parentElement;
    if (host.parentElement === doc.body && host.nextElementSibling !== els.footer) doc.body.insertBefore(els.footer, host.nextSibling);
  }
  function setWatermark() {
    var svg = "";
    if (cat === "milan") svg = art.twinCharts({});
    else if (cat === "panchang" || cat === "festival") svg = art.moonPhases({});
    else if (cat === "numerology") svg = art.loShu({});
    else if (cat === "remedy") svg = art.yantra({});
    else if (cat === "graha" || cat === "blog") svg = art.navagraha({});
    else if (cat && cat !== "home") svg = art.zodiacWheel({ bg: false, center: cat === "sign" ? "glyph" : "chart", sign: signIdx });
    if (!svg) return;
    svg = stillArt(svg).replace(/ class="[^"]*"/g, "").replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" ').replace(/xmlns="http:\/\/www.w3.org\/2000\/svg" xmlns="http:\/\/www.w3.org\/2000\/svg"/, 'xmlns="http://www.w3.org/2000/svg"');
    doc.body.style.setProperty("--kp-watermark", 'url("data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg) + '")');
  }

  // ------------------------------------------------------- inner pages
  function heroArt() {
    var l = lang();
    switch (cat) {
      case "kundli": return art.zodiacWheel({ lagnaLabel: l === "hi" ? "लग्न" : "LAGNA" });
      case "nakshatra": return art.zodiacWheel({ center: "star" });
      case "graha": case "blog": return art.navagraha({ lang: l });
      case "milan": return art.twinCharts({ labels: l === "hi" ? ["वर", "वधू"] : ["BOY", "GIRL"] });
      case "dosha": return art.kundliChart({ theme: "dark", highlight: ["Ma"], houses: [[], [], [], [], [], [], ["Ma"], [], [], ["Su"], [], ["Mo"]] });
      case "dosha-ks": return art.kundliChart({ theme: "dark", axis: true, houses: [[], [], ["Ra"], ["Mo"], ["Ju"], ["Sa"], ["Su", "Me"], [], ["Ke"], [], [], []], highlight: ["Ra", "Ke"] });
      case "horoscope": return art.zodiacWheel({ center: "sun" });
      case "sign": return art.zodiacWheel({ center: "glyph", sign: signIdx, highlight: signIdx });
      case "panchang": return art.moonPhases({});
      case "festival": return art.festival({ motif: FEST_MOTIF[baseName] || "diya" });
      case "numerology": return art.loShu({});
      case "gem": return art.gemFacet({ color: "#1E42C4" });
      case "remedy": return art.yantra({});
      case "vastu": return art.compass({ lang: l });
      case "consult": case "about": return art.zodiacWheel({});
      case "tarot": case "palm": return art.mandala({});
      default: return "";
    }
  }
  // The runtime writes inline styles back in normalised form ("rgb(…)",
  // "position: fixed"), so page elements are recognised from el.style and
  // tagged with classes rather than matched with [style*=…] selectors.
  var TAGS = [
    ["kp-src-hero", function (s, el) { return el.tagName === "DIV" && /rgb\((246, 239, 226|244, 238, 230)\) 0%/.test(s.background || s.backgroundImage); }],
    ["kp-src-card", function (s, el) { return el.tagName === "A" && /rgb\(234, 226, 206\)/.test(s.border || s.borderColor); }],
    ["kp-src-night", function (s) { return /^rgb\(10, 22, 51\)$/.test(s.backgroundColor) && !s.backgroundImage.replace("none", ""); }],
    ["kp-src-btn", function (s, el) { return /^(A|BUTTON)$/.test(el.tagName) && /^rgb\((107, 74, 28|107, 58, 40|10, 22, 51)\)$/.test(s.backgroundColor); }],
    ["kp-src-btnline", function (s, el) { return /^(A|BUTTON)$/.test(el.tagName) && /1px solid rgb\((107, 74, 28|107, 58, 40|10, 22, 51)\)/.test(s.border); }],
    ["kp-src-banner", function (s, el) { return el.tagName === "DIV" && /repeating-linear-gradient/.test(s.background || s.backgroundImage) && !!el.closest("article"); }],
    ["kp-src-float-wa", function (s, el) { return el.tagName === "A" && s.position === "fixed" && /wa\.me/.test(el.getAttribute("href") || ""); }],
    ["kp-src-float-top", function (s, el) { return el.tagName === "BUTTON" && s.position === "fixed" && s.bottom === "92px"; }]
  ];
  function tagInline() {
    var host = liveQuery("main");
    if (!host) return;
    var scope = host.parentElement || host;
    scope.querySelectorAll("[style]").forEach(function (el) {
      if (el.closest(".kp-home")) return;
      var st = el.getAttribute("style");
      if (el.__kpStyle === st) return;
      el.__kpStyle = st;
      TAGS.forEach(function (t) { el.classList.toggle(t[0], !!t[1](el.style, el)); });
    });
  }
  function enhanceInner() {
    tagInline();
    var box = liveQuery("main section > div.kp-src-hero");
    if (box && !box.classList.contains("kp-cosmic-hero")) {
      box.classList.add("kp-cosmic-hero");
      var bg = doc.createElement("div");
      bg.className = "kp-hero-bg";
      bg.setAttribute("aria-hidden", "true");
      bg.innerHTML = '<div class="kp-stars"></div><div class="kp-stars kp-stars-b"></div><div class="kp-hero-mandala">' + art.mandala({}) + "</div>";
      box.appendChild(bg);
    }
    if (box) {
      var cell = box.children[1];
      if (cell && !cell.querySelector(".kp-hero-art")) {
        var svg = heroArt();
        if (svg) {
          cell.classList.add("kp-hero-art-cell");
          var wrap = doc.createElement("div");
          wrap.className = "kp-hero-art" + (cat === "festival" ? " is-wide" : "");
          wrap.innerHTML = '<div class="kp-art">' + svg + "</div>";
          cell.appendChild(wrap);
        }
      }
    }
    if (cat === "article") {
      var banner = liveQuery("main article > div.kp-src-banner");
      if (banner && !banner.classList.contains("kp-article-banner")) {
        banner.classList.add("kp-article-banner");
        var a = doc.createElement("div");
        a.className = "kp-art";
        a.innerHTML = art.thumb({ kind: ARTICLE_KIND[baseName] || "kundli", lang: lang(), label: (doc.querySelector("main h1") || {}).textContent || "" });
        banner.appendChild(a);
      }
    }
  }

  // --------------------------------------------------------------- slots
  function fillSlots(scope) {
    var r = scope && scope.querySelectorAll ? scope : doc;
    r.querySelectorAll("[data-kp-art]").forEach(function (el) {
      if (!live(el)) return;
      var sig = el.getAttribute("data-kp-art") + "|" + (el.getAttribute("data-kp-opts") || "");
      if (el.__kpSig === sig && el.firstChild) return;
      el.__kpSig = sig;
      var opts = {};
      try { opts = JSON.parse(el.getAttribute("data-kp-opts") || "{}"); } catch (e) { opts = {}; }
      if (!el.classList.contains("kp-art")) el.classList.add("kp-art");
      el.innerHTML = renderArt(el.getAttribute("data-kp-art"), opts);
    });
    r.querySelectorAll("[data-kp-icon]").forEach(function (el) {
      if (!live(el)) return;
      var name = el.getAttribute("data-kp-icon");
      if (el.__kpIcon === name && el.firstChild) return;
      el.__kpIcon = name;
      el.innerHTML = icon(name).replace(/^<span class="kp-icon">|<\/span>$/g, "");
      if (!el.classList.contains("kp-icon")) el.classList.add("kp-icon");
    });
  }
  var io = null;
  function watchReveal() {
    var list = Array.prototype.filter.call(doc.querySelectorAll(".kp-reveal:not(.is-in)"), live);
    if (!list.length) return;
    if (!("IntersectionObserver" in global)) { list.forEach(function (el) { el.classList.add("is-in"); }); return; }
    if (!io) io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.06 });
    list.forEach(function (el) { if (!el.__kpObs) { el.__kpObs = true; io.observe(el); } });
  }

  // ------------------------------------------------------ structured data
  function setJsonLd(id, data) {
    var el = doc.getElementById(id);
    if (!el) { el = doc.createElement("script"); el.type = "application/ld+json"; el.id = id; doc.head.appendChild(el); }
    var txt = JSON.stringify(data);
    if (el.textContent !== txt) el.textContent = txt;
  }
  function structuredData() {
    var crumb = liveQuery('main nav[aria-label="Breadcrumb"]');
    if (crumb) {
      var items = [], pos = 1;
      crumb.querySelectorAll("a, span").forEach(function (n) {
        var name = (n.textContent || "").trim();
        if (!name || n.querySelector("a, span") || (n.tagName === "SPAN" && n.closest("a"))) return;
        var entry = { "@type": "ListItem", position: pos++, name: name };
        if (n.tagName === "A" && n.href && !/#/.test(n.getAttribute("href") || "")) entry.item = n.href;
        items.push(entry);
      });
      if (items.length > 1) setJsonLd("kp-ld-breadcrumb", { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: items });
    }
    if (cat === "article") {
      var h1 = liveQuery("main h1");
      if (h1 && h1.textContent.trim()) {
        setJsonLd("kp-ld-article", { "@context": "https://schema.org", "@type": "Article", headline: h1.textContent.trim(), inLanguage: lang() === "hi" ? "hi-IN" : "en-IN",
          author: { "@type": "Organization", name: "Kundli Planet" }, publisher: { "@type": "Organization", name: "Kundli Planet", logo: { "@type": "ImageObject", url: new URL("Kundli%20planet%20assets/kundli%20planet%20ogo.png", location.href).href } },
          mainEntityOfPage: location.href });
      }
    }
  }

  // ------------------------------------------------------------ run loop
  var queued = false;
  function tick() {
    queued = false;
    mountShell();
    enhanceInner();
    fillSlots(doc);
    watchReveal();
    structuredData();
  }
  // setTimeout rather than requestAnimationFrame: rAF never fires in background tabs.
  function queue() { if (!queued) { queued = true; setTimeout(tick, 24); } }

  doc.addEventListener("click", function (e) {
    var t = e.target instanceof Element ? e.target : null;
    if (!t) return;
    if (t.closest("[data-kp-lang]")) { e.preventDefault(); toggleLang(); return; }
    if (t.closest("[data-kp-consult]")) { e.preventDefault(); openConsult(); return; }
    if (t.closest("[data-kp-drawer]")) { e.preventDefault(); openDrawer(); return; }
    if (t.closest("[data-kp-drawer-close]")) { e.preventDefault(); closeDrawer(); return; }
    var menuBtn = t.closest("[data-kp-menu]");
    if (menuBtn) {
      var item = menuBtn.closest(".kp-nav-item");
      var open = !item.classList.contains("is-open");
      doc.querySelectorAll(".kp-nav-item.is-open").forEach(function (x) { x.classList.remove("is-open"); });
      if (open) item.classList.add("is-open");
      menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
      return;
    }
    if (!t.closest(".kp-nav-item")) doc.querySelectorAll(".kp-nav-item.is-open").forEach(function (x) { x.classList.remove("is-open"); });
    var sc = t.closest("[data-kp-scroll]");
    if (sc) {
      var target = doc.getElementById(sc.getAttribute("data-kp-scroll"));
      if (target) target.scrollBy({ left: Number(sc.getAttribute("data-dir") || 1) * Math.max(240, target.clientWidth * 0.8), behavior: "smooth" });
      return;
    }
    if (t.closest(".kp-drawer a[href]")) closeDrawer();
  }, true);
  doc.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      closeDrawer();
      doc.querySelectorAll(".kp-nav-item.is-open").forEach(function (x) { x.classList.remove("is-open"); });
      var a = doc.activeElement;
      if (a && a.closest && a.closest(".kp-mega")) { var link = a.closest(".kp-nav-item").querySelector(".kp-nav-link"); if (link) link.focus(); }
    }
  });
  global.addEventListener("resize", function () { if (global.innerWidth >= 1180) closeDrawer(); }, { passive: true });

  var mo = new MutationObserver(function (records) {
    for (var i = 0; i < records.length; i++) {
      var r = records[i];
      if (r.type === "attributes" && r.target === root) { queue(); return; }
      if (r.type === "attributes" || r.addedNodes.length) {
        var n = r.target;
        if (n && n.closest && n.closest(".kp-header,.kp-drawer,.kp-bottombar,.kp-footer")) continue;
        queue(); return;
      }
    }
  });
  function start() {
    tick();
    mo.observe(root, { attributes: true, attributeFilter: ["lang", "data-kp-art", "data-kp-opts", "data-kp-icon"], childList: true, subtree: true });
  }
  if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", start); else start();

  // ---------------------------------------------------------------- export
  global.KP = {
    data: { SIGNS: SIGNS, ELEMENTS: ELEMENTS, PLANETS: PLANETS, PMAP: PMAP, NAK: NAK, GANA: GANA, DASHA: DASHA, GEMS: GEMS, ABBR: ABBR },
    signIndexOf: signIndexOf, planetKeyOf: planetKeyOf,
    art: art, renderArt: renderArt, icon: icon, lang: lang,
    openConsult: openConsult, toggleLang: toggleLang,
    GLANCE_KEY: "kp.glance.v1",
    readGlance: function () { try { var v = JSON.parse(localStorage.getItem("kp.glance.v1") || "null"); return v && v.v === 1 ? v : null; } catch (e) { return null; } },
    saveGlance: function (patch) {
      try {
        var cur = global.KP.readGlance() || { v: 1 };
        var next = Object.assign({}, cur, patch, { v: 1, ts: Date.now() });
        localStorage.setItem("kp.glance.v1", JSON.stringify(next));
        return next;
      } catch (e) { return null; }
    },
    clearGlance: function () { try { localStorage.removeItem("kp.glance.v1"); } catch (e) { /* ignore */ } }
  };
})(window);

/* KundliPlanet PDF - Hindi localization of API-returned text.
   The astrology API answers only in English. For Hindi reports every text
   it returns is shown in Hindi here: fixed sentences through a curated
   dictionary, templated sentences (house / planet / sign / score vary)
   through patterns, mantras and name syllables in Devanagari. Only the
   LANGUAGE changes - the meaning, values and verdicts are those the API
   returned. A sentence not covered here falls back to the site's existing
   translateToHindi(); if that fails, the original text is kept. */
(function (global) {
  "use strict";

  var KP = global.KPPDF;
  var clean = KP.clean, has = KP.has;

  function norm(s) {
    return clean(s).replace(/[‘’]/g, "'").replace(/[“”]/g, "\"").replace(/\s+([.,!?;:)])/g, "$1").replace(/\(\s+/g, "(").replace(/\s+/g, " ").trim();
  }

  // ------------------------------------------------------------------
  // Additional vocabulary (API spellings seen in live responses)
  // ------------------------------------------------------------------
  KP.addTerms({
    bharni: "भरणी", shatbhisha: "शतभिषा", shoodra: "शूद्र", chatuspad: "चतुष्पद", keetak: "कीट", maanav: "मानव",
    parigh: "परिघ", shubh: "शुभ", variyaan: "वरीयान", vyaghat: "व्याघात", vyatipaat: "व्यतीपात",
    mesha: "मेष", singh: "सिंह", swaan: "श्वान", vaanar: "वानर", vyaaghra: "व्याघ्र", parbhaag: "परभाग",
    brickred: "ईंट जैसा लाल", bhairav: "भैरव", narsinghbhagawan: "नरसिंह भगवान", shreelaxminarayan: "श्री लक्ष्मी नारायण",
    surya: "सूर्य", lead: "सीसा", gomed: "गोमेद", bluetourmaline: "नीला टूमलाइन", blackhakik: "काला हकीक",
    redtourmaline: "लाल टूमलाइन", goldenhakik: "सुनहरा हकीक", peridot: "पेरिडॉट", sangmoongi: "संगमूंगी",
    topaz: "पुखराज (टोपाज़)", yellowtourmaline: "पीला टूमलाइन", redagate: "लाल अकीक", ringorlittle: "अनामिका या कनिष्ठा",
    no: "नहीं", anant: "अनंत", ghatak: "घातक", ghaatak: "घातक", karkotak: "कर्कोटक", kulik: "कुलिक", mahapadma: "महापद्म",
    padma: "पद्म", shankhchoor: "शंखचूड़", shankhchur: "शंखचूड़", shankhpal: "शंखपाल", sheshnaag: "शेषनाग", sheshnag: "शेषनाग",
    takshak: "तक्षक", vasuki: "वासुकी", vishdhar: "विषधर",
    fullascending: "पूर्ण आरोही", fulldescending: "पूर्ण अवरोही", partialascending: "आंशिक आरोही", partialdescending: "आंशिक अवरोही",
    agate: "अकीक", tourmaline: "टूमलाइन", sapphire: "नीलम", tiger: "टाइगर", moonga: "मूंगा", panna: "पन्ना", neelam: "नीलम",
    pukhraj: "पुखराज", heera: "हीरा", moti: "मोती", manik: "माणिक्य", lehsunia: "लहसुनिया"
  });
  // Tithi values such as "Shukla-Ashtami".
  var baseTerm = KP.term;
  KP.term = function (v, lang) {
    var out = baseTerm(v, lang);
    if (lang === "hi" && /[A-Za-z]/.test(out) && /-/.test(out)) {
      var parts = String(v).split("-").map(function (p) { return baseTerm(p, lang); });
      if (parts.every(function (p) { return !/[A-Za-z]/.test(p); })) return parts.join(" ");
    }
    return out;
  };

  // ------------------------------------------------------------------
  // Mantras, name syllables and place names
  // ------------------------------------------------------------------
  var MANTRA = {
    "om hring suryay namah": "ॐ ह्रीं सूर्याय नमः", "om som somay namah": "ॐ सों सोमाय नमः",
    "om ang angaarakaay namah": "ॐ अं अंगारकाय नमः", "om bung budhaay namah": "ॐ बुं बुधाय नमः",
    "om hring gurave namah": "ॐ ह्रीं गुरवे नमः", "om shum shukray namah": "ॐ शुं शुक्राय नमः",
    "om shang shanaishcharay namah": "ॐ शं शनैश्चराय नमः", "om rang rahave namah": "ॐ रां राहवे नमः",
    "om keng ketave namah": "ॐ कें केतवे नमः", "om namah shivaya": "ॐ नमः शिवाय"
  };
  KP.hiMantra = function (s) {
    var k = norm(s).replace(/\|/g, "").toLowerCase().replace(/\s+/g, " ").trim();
    return MANTRA[k] ? "|| " + MANTRA[k] + " ||" : null;
  };

  // Romanized name syllables ("Chha", "Bhee", "Saa") -> Devanagari.
  var CONS = [["chh", "छ"], ["kh", "ख"], ["gh", "घ"], ["ch", "च"], ["jh", "झ"], ["th", "थ"], ["dh", "ध"], ["ph", "फ"], ["bh", "भ"], ["sh", "श"],
    ["k", "क"], ["g", "ग"], ["j", "ज"], ["t", "त"], ["d", "द"], ["n", "न"], ["p", "प"], ["f", "फ"], ["b", "ब"], ["m", "म"],
    ["y", "य"], ["r", "र"], ["l", "ल"], ["v", "व"], ["w", "व"], ["s", "स"], ["h", "ह"]];
  var VOW = [["aa", "ा", "आ"], ["ee", "ी", "ई"], ["oo", "ू", "ऊ"], ["ai", "ै", "ऐ"], ["au", "ौ", "औ"], ["ea", "े", "ए"],
    ["a", "", "अ"], ["i", "ि", "इ"], ["u", "ु", "उ"], ["e", "े", "ए"], ["o", "ो", "ओ"]];
  function translitSyllable(s) {
    var w = s.toLowerCase(), out = "";
    while (w) {
      var c = CONS.filter(function (x) { return w.indexOf(x[0]) === 0; })[0];
      if (c) w = w.slice(c[0].length);
      var v = VOW.filter(function (x) { return w.indexOf(x[0]) === 0; })[0];
      if (v) w = w.slice(v[0].length);
      if (!c && !v) return null;
      out += c ? c[1] + (v ? v[1] : "्") : v[2];
    }
    return out.replace(/्$/, "");
  }
  KP.hiSyllable = function (s) {
    var t = clean(s);
    if (!t || !/^[A-Za-z ]+$/.test(t)) return t;
    var r = t.split(/\s+/).map(translitSyllable);
    return r.every(Boolean) ? r.join(" ") : t;
  };

  var PLACES = {
    bhagalpur: "भागलपुर", delhi: "दिल्ली", newdelhi: "नई दिल्ली", mumbai: "मुंबई", bombay: "मुंबई", kolkata: "कोलकाता", calcutta: "कोलकाता",
    chennai: "चेन्नई", madras: "चेन्नई", bengaluru: "बेंगलुरु", bangalore: "बेंगलुरु", hyderabad: "हैदराबाद", ahmedabad: "अहमदाबाद",
    pune: "पुणे", jaipur: "जयपुर", lucknow: "लखनऊ", kanpur: "कानपुर", nagpur: "नागपुर", indore: "इंदौर", bhopal: "भोपाल", patna: "पटना",
    vadodara: "वडोदरा", surat: "सूरत", ludhiana: "लुधियाना", agra: "आगरा", nashik: "नासिक", faridabad: "फरीदाबाद", meerut: "मेरठ",
    rajkot: "राजकोट", varanasi: "वाराणसी", banaras: "वाराणसी", srinagar: "श्रीनगर", amritsar: "अमृतसर", allahabad: "प्रयागराज",
    prayagraj: "प्रयागराज", ranchi: "रांची", jamshedpur: "जमशेदपुर", dhanbad: "धनबाद", gaya: "गया", muzaffarpur: "मुजफ्फरपुर",
    darbhanga: "दरभंगा", purnia: "पूर्णिया", begusarai: "बेगूसराय", bhagalpurbihar: "भागलपुर", munger: "मुंगेर", arrah: "आरा", chapra: "छपरा",
    howrah: "हावड़ा", gwalior: "ग्वालियर", jabalpur: "जबलपुर", raipur: "रायपुर", kota: "कोटा", jodhpur: "जोधपुर", udaipur: "उदयपुर",
    ajmer: "अजमेर", bikaner: "बीकानेर", chandigarh: "चंडीगढ़", dehradun: "देहरादून", haridwar: "हरिद्वार", rishikesh: "ऋषिकेश",
    gorakhpur: "गोरखपुर", bareilly: "बरेली", aligarh: "अलीगढ़", moradabad: "मुरादाबाद", ghaziabad: "गाज़ियाबाद", noida: "नोएडा",
    gurgaon: "गुरुग्राम", gurugram: "गुरुग्राम", mathura: "मथुरा", ayodhya: "अयोध्या", jhansi: "झांसी", ujjain: "उज्जैन", guwahati: "गुवाहाटी",
    bhubaneswar: "भुवनेश्वर", cuttack: "कटक", visakhapatnam: "विशाखापत्तनम", vijayawada: "विजयवाड़ा", coimbatore: "कोयंबटूर",
    madurai: "मदुरै", kochi: "कोच्चि", thiruvananthapuram: "तिरुवनंतपुरम", mysore: "मैसूर", mysuru: "मैसूरु", mangalore: "मंगलौर",
    goa: "गोवा", panaji: "पणजी", shimla: "शिमला", jammu: "जम्मू", siliguri: "सिलीगुड़ी", durgapur: "दुर्गापुर", asansol: "आसनसोल",
    kathmandu: "काठमांडू", india: "भारत", bihar: "बिहार", uttarpradesh: "उत्तर प्रदेश", maharashtra: "महाराष्ट्र", rajasthan: "राजस्थान",
    gujarat: "गुजरात", jharkhand: "झारखंड", westbengal: "पश्चिम बंगाल", madhyapradesh: "मध्य प्रदेश", punjab: "पंजाब", haryana: "हरियाणा"
  };
  KP.hiPlace = function (s) {
    var t = clean(s);
    if (!t || !/[A-Za-z]/.test(t)) return t;
    return t.split(/\s*,\s*/).map(function (part) {
      var k = part.toLowerCase().replace(/[^a-z]/g, "");
      return PLACES[k] || part;
    }).join(", ");
  };

  // ------------------------------------------------------------------
  // Fixed sentences (normalized English -> Hindi)
  // ------------------------------------------------------------------
  var ORD = ["प्रथम", "द्वितीय", "तृतीय", "चतुर्थ", "पंचम", "षष्ठ", "सप्तम", "अष्टम", "नवम", "दशम", "एकादश", "द्वादश"];
  var ORD_EN = { first: 1, second: 2, third: 3, fourth: 4, fifth: 5, sixth: 6, seventh: 7, eighth: 8, ninth: 9, tenth: 10, eleventh: 11, twelfth: 12, twefth: 12, twelth: 12 };
  function house(w) { var n = ORD_EN[String(w).toLowerCase()]; return n ? ORD[n - 1] + " भाव" : null; }
  function pl(w) { var t = KP.term(w, "hi"); return /[A-Za-z]/.test(t) ? null : t; }

  var S = {};
  function add(en, hi) { S[norm(en)] = hi; }
  var FIXED = [
    // Manglik reports
    ["Manglik Dosha is present and strong enough to matter. You are Manglik and should be cautious.", "मांगलिक दोष उपस्थित है और इतना प्रबल है कि इसका प्रभाव पड़ता है। आप मांगलिक हैं और आपको सावधान रहना चाहिए।"],
    ["Manglik Dosha is present, but it is mild. Simple Manglik remedies can reduce its effect further.", "मांगलिक दोष उपस्थित है, परंतु यह हल्का है। सरल मांगलिक उपायों से इसका प्रभाव और कम किया जा सकता है।"],
    ["Manglik Dosha is present, but it is very weak and has little to no impact. So, you are not considered Manglik.", "मांगलिक दोष उपस्थित है, परंतु यह अत्यंत क्षीण है और इसका प्रभाव नगण्य है। अतः आपको मांगलिक नहीं माना जाता।"],
    ["Manglik Dosha is very strong and has a major impact. You are Manglik.", "मांगलिक दोष अत्यंत प्रबल है और इसका प्रभाव बड़ा है। आप मांगलिक हैं।"],
    ["There is no Manglik Dosha effect in your horoscope, so you are not Manglik.", "आपकी कुंडली में मांगलिक दोष का कोई प्रभाव नहीं है, इसलिए आप मांगलिक नहीं हैं।"],
    // Kaal Sarp one-liners
    ["Kalsarpa dosha is not detected in your horoscope.", "आपकी कुंडली में कालसर्प दोष नहीं पाया गया।"],
    ["You have ascending kalsarpa dosha direction, which is treated as powerful.", "आपकी कुंडली में कालसर्प दोष की दिशा आरोही है, जिसे प्रबल माना जाता है।"],
    ["You have descending kalsarpa dosha direction, which is not very powerful.", "आपकी कुंडली में कालसर्प दोष की दिशा अवरोही है, जो बहुत प्रबल नहीं मानी जाती।"],
    ["The KalSarpa Dosha is having full effect in your horoscope.", "आपकी कुंडली में कालसर्प दोष का पूर्ण प्रभाव है।"],
    ["The KalSarpa Dosha is having partial effect in your horoscope.", "आपकी कुंडली में कालसर्प दोष का आंशिक प्रभाव है।"],
    // Pitru dosha
    ["Congratulations !! Your horoscope is free from Pitra Dosha.", "बधाई हो! आपकी कुंडली पितृ दोष से मुक्त है।"],
    ["Congratulations!! Your horoscope is free from Pitra Dosha.", "बधाई हो! आपकी कुंडली पितृ दोष से मुक्त है।"],
    ["You should not worry as there are remedies for Pitra Dosha which you can perform and be relieved from this dosha.", "आपको चिंता करने की आवश्यकता नहीं है, क्योंकि पितृ दोष के उपाय हैं जिन्हें करके आप इस दोष से मुक्ति पा सकते हैं।"],
    ["Pitra Dosha is a Karmic Debt of the ancestors and reflected in the horoscope in the form of planetary combinations. It can also happen due to the neglect of ancestors and not providing them their proper due in the form of shraddh or charity or spiritual upliftments.", "पितृ दोष पूर्वजों का कर्म-ऋण है, जो कुंडली में ग्रह योगों के रूप में दिखाई देता है। यह पूर्वजों की उपेक्षा करने और श्राद्ध, दान या आध्यात्मिक उन्नति के रूप में उन्हें उनका उचित भाग न देने के कारण भी हो सकता है।"],
    ["Following are the effects of Pitri Dosha -", "पितृ दोष के प्रभाव निम्नलिखित हैं -"],
    ["Inherited diseases and prolong illness is one of the ill effects of pitra dosha", "वंशानुगत रोग और लंबी बीमारी पितृ दोष के दुष्प्रभावों में से एक है।"],
    ["It also leads to delay in marriage and having unsuccessful marriages.", "इससे विवाह में देरी और असफल विवाह भी होते हैं।"],
    ["It can cause delay or obstructions in education with or may land one into never ending debts.", "इससे शिक्षा में देरी या बाधाएं आ सकती हैं, या व्यक्ति कभी न समाप्त होने वाले ऋण में फंस सकता है।"],
    ["Pitra Dosh can also cause accidents or unwanted incidents in the family.", "पितृ दोष परिवार में दुर्घटनाओं या अवांछित घटनाओं का कारण भी बन सकता है।"],
    ["Pitra Dosha leads to unfavorable environment in the family.", "पितृ दोष से परिवार में प्रतिकूल वातावरण बनता है।"],
    ["Auspicious Puja, Vrat for destroying the effects of past sinful deeds or Pitra Dosha.", "पूर्व पाप कर्मों या पितृ दोष के प्रभाव को नष्ट करने के लिए शुभ पूजा और व्रत करें।"],
    ["Charity on Akshaya Tritiya.", "अक्षय तृतीया पर दान करें।"],
    ["Conduct Mantra Jap, Puja, Charity in Adhik or Purushottam Maas.", "अधिक मास या पुरुषोत्तम मास में मंत्र जाप, पूजा और दान करें।"],
    ["Donate food items on every \"Amavasya\" and \"Poornima\" in some temple or other religious places.", "प्रत्येक \"अमावस्या\" और \"पूर्णिमा\" पर किसी मंदिर या अन्य धार्मिक स्थान पर खाद्य पदार्थों का दान करें।"],
    ["Following are the remedies to be performed for Pitra Dosha", "पितृ दोष के लिए किए जाने वाले उपाय निम्नलिखित हैं"],
    ["Giving water to the Banyan tree is also a remedial measure for pitra dosha.", "बरगद के पेड़ को जल देना भी पितृ दोष का एक उपाय है।"],
    ["Offer food to Brahmins on every \"Amavasya\".", "प्रत्येक \"अमावस्या\" पर ब्राह्मणों को भोजन कराएं।"],
    ["Perform Puja, Vrat on Falharini Kalika Jyeshtha Amvasya.", "फलहारिणी कालिका ज्येष्ठ अमावस्या पर पूजा और व्रत करें।"],
    ["Perform Trapandi Shraad to get rid of Pitra dosha.", "पितृ दोष से मुक्ति के लिए त्रिपिंडी श्राद्ध करें।"],
    ["Pitra dosha nivaran puja should be performed to pacify that malefic planet in Pitra paksha.", "उस पाप ग्रह को शांत करने के लिए पितृ पक्ष में पितृ दोष निवारण पूजा करनी चाहिए।"],
    ["Worship Lord Shiva regularly to have peace to you and your ancestors.", "आपको और आपके पूर्वजों को शांति मिले, इसके लिए नियमित रूप से भगवान शिव की पूजा करें।"],
    ["Conjuction of Moon and Rahu and/or Rahu and Saturn causes Pitri Dosha.", "चंद्र और राहु और/या राहु और शनि की युति पितृ दोष का कारण बनती है।"],
    ["Conjunction of Rahu and Sun and/or Sun and Ketu in sixth, eighth or twefth houses.", "षष्ठ, अष्टम या द्वादश भाव में राहु और सूर्य और/या सूर्य और केतु की युति।"],
    ["Jupiter is in Leo sign in birth chart and fifth house lord is with Sun.", "जन्म कुंडली में बृहस्पति सिंह राशि में है और पंचमेश सूर्य के साथ है।"],
    ["Rahu or Ketu is in eleventh house and/or Rahu or Ketu with Moon in fourth or ninth house causes Pitri Dosha.", "राहु या केतु का एकादश भाव में होना और/या चतुर्थ या नवम भाव में राहु या केतु का चंद्र के साथ होना पितृ दोष का कारण बनता है।"],
    ["Scorpio ascendant rising.", "वृश्चिक लग्न का उदय।"],
    ["Seventh house is occupied by Rahu and Saturn.", "सप्तम भाव में राहु और शनि स्थित हैं।"],
    // Sade Sati
    ["No, currently you are not undergoing Sadhesati.", "नहीं, वर्तमान में आप पर साढ़े साती नहीं चल रही है।"],
    ["Yes, currently you are undergoing Sadhesati.", "हाँ, वर्तमान में आप पर साढ़े साती चल रही है।"],
    ["Sadhe Sati refers to the seven-and-a-half year period in which Saturn moves through three signs, the moon sign, one before the moon and the one after it. Sadhe Sati starts when Saturn (Shani) enters the 12th sign from the birth Moon sign and ends when Saturn leaves 2nd sign from the birth Moon sign. Since Saturn approximately takes around two and half years to transit a sign which is called Shani's dhaiya it takes around seven and half year to transit three signs and that is why it is known as Sadhe Sati. Generally Sade-Sati comes thrice in a horoscope in the life time - first in childhood, second in youth & third in old-age. First Sade-Sati has effect on education & parents. Second Sade-Sati has effect on profession, finance & family. The last one affects health more than anything else.",
      "साढ़े साती वह साढ़े सात वर्ष की अवधि है जिसमें शनि तीन राशियों से गुजरता है - चंद्र राशि, उससे पहले की राशि और उसके बाद की राशि। साढ़े साती तब आरंभ होती है जब शनि जन्म चंद्र राशि से 12वीं राशि में प्रवेश करता है और तब समाप्त होती है जब शनि जन्म चंद्र राशि से दूसरी राशि को छोड़ता है। शनि को एक राशि पार करने में लगभग ढाई वर्ष लगते हैं, जिसे शनि की ढैया कहा जाता है; इस प्रकार तीन राशियां पार करने में लगभग साढ़े सात वर्ष लगते हैं, इसलिए इसे साढ़े साती कहते हैं। सामान्यतः जीवन में साढ़े साती तीन बार आती है - पहली बचपन में, दूसरी युवावस्था में और तीसरी वृद्धावस्था में। पहली साढ़े साती शिक्षा और माता-पिता पर प्रभाव डालती है। दूसरी साढ़े साती व्यवसाय, धन और परिवार पर प्रभाव डालती है। अंतिम साढ़े साती सबसे अधिक स्वास्थ्य को प्रभावित करती है।"],
    ["Following are the remedies for Sadhe Sati -", "साढ़े साती के उपाय निम्नलिखित हैं -"],
    ["Donate urad (a type of pulse), oil, sapphire, black sesame seeds, black buffalo, iron, money and black clothes as per your financial situation to poor and needy people.", "अपनी आर्थिक स्थिति के अनुसार गरीबों और जरूरतमंदों को उड़द, तेल, नीलम, काले तिल, काली भैंस, लोहा, धन और काले वस्त्र दान करें।"],
    ["Give respect to your subordinate, servant, poor and lower class people.", "अपने अधीनस्थों, सेवकों, गरीबों और निम्न वर्ग के लोगों का सम्मान करें।"],
    ["It is good and beneficial to fast on Saturdays starting from sunrise to ending at sunset when Sadhe Sati is in effect.", "साढ़े साती के प्रभाव में शनिवार को सूर्योदय से सूर्यास्त तक व्रत रखना शुभ और लाभकारी है।"],
    ["Recite Shri Hanuman Chalisa.", "श्री हनुमान चालीसा का पाठ करें।"],
    ["Serve and respect your parents and elderly people.", "अपने माता-पिता और बुजुर्गों की सेवा और सम्मान करें।"],
    ["Shani Yantra is used to pacify an afflicted Shani and get blessings of Lord Shani. When Saturn is malefic in a horoscope due to wrong placement, Sadhe Sati or Small Affliction, use of Shani Yantra is very Beneficial.", "पीड़ित शनि को शांत करने और भगवान शनि का आशीर्वाद पाने के लिए शनि यंत्र का उपयोग किया जाता है। जब कुंडली में शनि गलत स्थिति, साढ़े साती या ढैया के कारण अशुभ हो, तब शनि यंत्र का उपयोग अत्यंत लाभकारी होता है।"],
    ["Wearing of seven faced Rudraksha tends to mitigate the ill effects of Sadhe Sati.", "सात मुखी रुद्राक्ष धारण करने से साढ़े साती के दुष्प्रभाव कम होते हैं।"],
    // Ashtakoot descriptions and observations
    ["Constructive Ability / Constructivism / Society and Couple", "रचनात्मक क्षमता / समाज और दंपति"],
    ["Temperament", "स्वभाव"], ["Friendship", "मित्रता"], ["Progeny / Excess", "संतान / वंश"],
    ["Comfort - Prosperity - Health", "सुख - समृद्धि - स्वास्थ्य"], ["Natural Refinement / Work", "स्वाभाविक परिष्कार / कार्य"],
    ["Innate Giving / Attraction towards each other", "सहज समर्पण / परस्पर आकर्षण"], ["Intimate Physical", "शारीरिक अंतरंगता"],
    ["Family and finances thrive — you build an extraordinary life together.", "परिवार और आर्थिक स्थिति फलती-फूलती है — आप साथ मिलकर एक असाधारण जीवन बनाते हैं।"],
    ["Family and financial life need protection — seek astrological guidance together.", "पारिवारिक और आर्थिक जीवन को सुरक्षा की आवश्यकता है — साथ मिलकर ज्योतिषीय मार्गदर्शन लें।"],
    ["Different temperaments — accepting each other as-is prevents daily conflicts.", "स्वभाव भिन्न हैं — एक-दूसरे को जैसे हैं वैसे स्वीकार करने से रोज़ के मतभेद टलते हैं।"],
    ["Opposite natures — deep acceptance of differences is your strongest tool.", "विपरीत स्वभाव — मतभेदों को गहराई से स्वीकार करना ही आपकी सबसे बड़ी शक्ति है।"],
    ["Same energy, same pace — daily life together feels effortless and peaceful.", "एक जैसी ऊर्जा, एक जैसी गति — साथ का दैनिक जीवन सहज और शांत लगता है।"],
    ["Very similar natures — minor differences rarely cause any real disruption.", "बहुत मिलते-जुलते स्वभाव — छोटे मतभेद शायद ही कोई वास्तविक बाधा बनते हैं।"],
    ["Best friends at heart — you just get each other without needing to explain.", "दिल से सबसे अच्छे मित्र — आप बिना कहे एक-दूसरे को समझ लेते हैं।"],
    ["Communication needs real work — misunderstandings can quietly damage this bond.", "संवाद पर वास्तविक प्रयास आवश्यक है — गलतफहमियां चुपचाप इस रिश्ते को नुकसान पहुंचा सकती हैं।"],
    ["Good understanding overall — real conversations will keep this bond strong.", "कुल मिलाकर अच्छी समझ — सच्चा संवाद इस रिश्ते को मजबूत रखेगा।"],
    ["Mental friction is likely — patience and empathy are non-negotiable here.", "मानसिक टकराव की संभावना है — यहां धैर्य और सहानुभूति अनिवार्य हैं।"],
    ["Strong mental bond — disagreements resolve easily because friendship comes first.", "मजबूत मानसिक जुड़ाव — मित्रता सर्वोपरि होने से मतभेद आसानी से सुलझ जाते हैं।"],
    ["Thinking differently is common — listening deeply will bridge the mental gap.", "अलग सोच होना सामान्य है — ध्यान से सुनना मानसिक दूरी को पाट देगा।"],
    ["Children's health and your longevity look exceptionally strong and blessed.", "संतान का स्वास्थ्य और आपकी दीर्घायु असाधारण रूप से प्रबल और शुभ दिखती है।"],
    ["Children's health needs attention — consult a Jyotishi for timely remedies.", "संतान के स्वास्थ्य पर ध्यान देने की आवश्यकता है — समय पर उपाय के लिए ज्योतिषी से परामर्श लें।"],
    ["Health and wealth flourish together — life feels abundant and deeply comfortable.", "स्वास्थ्य और धन साथ-साथ फलते-फूलते हैं — जीवन समृद्ध और अत्यंत सुखद लगता है।"],
    ["Watch health and finances together — stability needs conscious shared effort.", "स्वास्थ्य और आर्थिक स्थिति पर साथ मिलकर ध्यान दें — स्थिरता के लिए सजग साझा प्रयास आवश्यक है।"],
    ["Different life goals may cause friction — mutual respect at work is essential.", "जीवन के अलग लक्ष्य टकराव पैदा कर सकते हैं — कार्य में परस्पर सम्मान आवश्यक है।"],
    ["Your goals and ambitions align beautifully — career growth comes naturally together.", "आपके लक्ष्य और महत्वाकांक्षाएं सुंदर रूप से मेल खाते हैं — करियर में उन्नति साथ-साथ स्वाभाविक रूप से होती है।"],
    ["Deep natural pull — you genuinely want to give and care for each other.", "गहरा स्वाभाविक आकर्षण — आप सच्चे मन से एक-दूसरे की देखभाल करना चाहते हैं।"],
    ["Emotional closeness needs effort — don't let distance quietly grow between you.", "भावनात्मक निकटता के लिए प्रयास आवश्यक है — अपने बीच चुपचाप दूरी न बढ़ने दें।"],
    ["Good attraction exists, though one may feel more invested at times.", "अच्छा आकर्षण है, हालांकि कभी-कभी एक साथी अधिक समर्पित महसूस कर सकता है।"],
    ["Love needs active choice here — affection won't flow without daily effort.", "यहां प्रेम के लिए सजग चुनाव आवश्यक है — रोज़ के प्रयास के बिना स्नेह नहीं बहेगा।"],
    ["Intimacy needs open communication — closeness grows with trust and patience.", "अंतरंगता के लिए खुला संवाद आवश्यक है — विश्वास और धैर्य से निकटता बढ़ती है।"],
    ["Physical connect needs nurturing — emotional depth will carry you through.", "शारीरिक जुड़ाव को पोषण की आवश्यकता है — भावनात्मक गहराई आपको आगे ले जाएगी।"],
    ["Rare physical harmony — deep intimacy comes naturally and stays strong.", "दुर्लभ शारीरिक सामंजस्य — गहरी अंतरंगता स्वाभाविक रूप से आती है और प्रबल रहती है।"],
    ["Strong physical bond — warmth and passion are very much on your side.", "मजबूत शारीरिक जुड़ाव — स्नेह और उत्साह पूरी तरह आपके पक्ष में हैं।"],
    // Ashtakoot conclusion fragments
    ["Please consider all other things mentioned in kundali.", "कृपया कुंडली में उल्लिखित अन्य सभी बातों पर भी विचार करें।"],
    ["This is a quite a low score.", "यह काफी कम अंक है।"],
    ["However, it is seen from your horoscopes that the Moon signs of both the boy and the girl share a friendly relation, which indicates better harmony and coordination between the two.", "फिर भी आपकी कुंडलियों से यह दिखता है कि लड़के और लड़की दोनों की चंद्र राशियों में मित्रता का संबंध है, जो दोनों के बीच बेहतर सामंजस्य और तालमेल दर्शाता है।"],
    ["Hence, this can be said to be a positive match as per kundali.", "अतः कुंडली के अनुसार इसे एक सकारात्मक मिलान कहा जा सकता है।"],
    ["This is a reasonably good score.", "यह काफी अच्छा अंक है।"],
    ["Moreover,your rashi lords are friendly with each other thereby signifying mental compatibility and mutual affection between the two.", "इसके अतिरिक्त आपके राशि स्वामी आपस में मित्र हैं, जो दोनों के बीच मानसिक अनुकूलता और परस्पर स्नेह को दर्शाता है।"],
    ["Moreover, your rashi lords are friendly with each other thereby signifying mental compatibility and mutual affection between the two.", "इसके अतिरिक्त आपके राशि स्वामी आपस में मित्र हैं, जो दोनों के बीच मानसिक अनुकूलता और परस्पर स्नेह को दर्शाता है।"],
    ["Hence, this is a favourable Ashtakoota match.", "अतः यह एक अनुकूल अष्टकूट मिलान है।"],
    ["This is quite good score.", "यह काफी अच्छा अंक है।"],
    // Dosha match reports
    ["All factors are conducive for the match. The couple can go ahead with this alliance only after performing the remedies for Rajju Dosha as suggested by the astrologer.", "मिलान के लिए सभी कारक अनुकूल हैं। ज्योतिषी द्वारा सुझाए गए रज्जु दोष के उपाय करने के बाद ही यह जोड़ा इस संबंध में आगे बढ़ सकता है।"],
    ["Based on the above analysis, both Manglik dosha and Rajju Dosha are present. This clearly indicates problems in marital life and can even cause separation. Hence, we do not recommend this match.", "उपरोक्त विश्लेषण के आधार पर मांगलिक दोष और रज्जु दोष दोनों उपस्थित हैं। यह स्पष्ट रूप से वैवाहिक जीवन में समस्याओं को दर्शाता है और अलगाव का कारण भी बन सकता है। अतः हम इस मिलान की अनुशंसा नहीं करते।"],
    ["Mangal Dosha exists; however, on basis of analysis of other factors, we recommend you can go ahead with the marriage after following the suggested remedies for Mangal Dosha Nivaran before marriage.", "मंगल दोष उपस्थित है; फिर भी अन्य कारकों के विश्लेषण के आधार पर हमारी अनुशंसा है कि विवाह से पहले मंगल दोष निवारण के सुझाए गए उपाय करने के बाद आप विवाह में आगे बढ़ सकते हैं।"],
    ["Marriage between the prospective bride and groom is highly recommended. The couple would have a long-lasting relationship, which would be filled with happiness and affluence.", "वर-वधू के बीच विवाह की दृढ़ अनुशंसा की जाती है। इस जोड़े का संबंध दीर्घकालिक होगा, जो खुशियों और समृद्धि से भरा होगा।"],
    ["On the basis of the above analysis, both Manglik dosha and Vedha Dosha are present. This clearly indicates problems & misfortunes in marital life. Hence this is not a desirable match.", "उपरोक्त विश्लेषण के आधार पर मांगलिक दोष और वेध दोष दोनों उपस्थित हैं। यह स्पष्ट रूप से वैवाहिक जीवन में समस्याओं और दुर्भाग्य को दर्शाता है। अतः यह वांछनीय मिलान नहीं है।"],
    ["The couple not only lacks compatibility, the presence of Rajju Dosha also threatens the strength and longevity of their married life. This match is not recommended.", "इस जोड़े में न केवल अनुकूलता की कमी है, बल्कि रज्जु दोष की उपस्थिति उनके वैवाहिक जीवन की मजबूती और दीर्घता के लिए भी खतरा है। इस मिलान की अनुशंसा नहीं की जाती।"],
    ["The couple's compatibility score is very low because of low Ashtakoota points and presence of Vedha Dosha that can become the cause for many unexpected sorrows in marriage. Hence, it is advisable not to go ahead with the match.", "कम अष्टकूट अंकों और वेध दोष की उपस्थिति के कारण इस जोड़े का अनुकूलता अंक बहुत कम है, जो विवाह में कई अप्रत्याशित दुखों का कारण बन सकता है। अतः इस मिलान में आगे न बढ़ने की सलाह दी जाती है।"],
    ["The matrimony will not be smooth. Many troubles and clashes are foreseen in this match. Hence, the marriage between the pair is not recommended at all.", "वैवाहिक जीवन सहज नहीं रहेगा। इस मिलान में कई परेशानियां और टकराव दिखाई देते हैं। अतः इस जोड़े के विवाह की बिल्कुल अनुशंसा नहीं की जाती।"],
    ["The overall analysis indicates many tribulations and adverse consequences – at the physical, mental and material levels. Hence, it is advisable not to go ahead with the match.", "समग्र विश्लेषण शारीरिक, मानसिक और भौतिक स्तर पर अनेक कष्टों और प्रतिकूल परिणामों को दर्शाता है। अतः इस मिलान में आगे न बढ़ने की सलाह दी जाती है।"],
    ["Though the Ashtakoota matching points are quite less, the remaining factors are indicating positive results. Hence, you are advised to consult an astrologer before going ahead with this alliance.", "यद्यपि अष्टकूट मिलान के अंक काफी कम हैं, फिर भी शेष कारक सकारात्मक परिणाम दर्शा रहे हैं। अतः इस संबंध में आगे बढ़ने से पहले ज्योतिषी से परामर्श लेने की सलाह दी जाती है।"],
    // Manglik compatibility conclusions
    ["Both the boy and the girl have Mangal Dosha. Due to this, the Mangal Dosha is cancelled and shall not affect either the groom or the bride. This would be considered as a good match.", "लड़के और लड़की दोनों में मंगल दोष है। इस कारण मंगल दोष निरस्त हो जाता है और इसका प्रभाव न वर पर पड़ेगा न वधू पर। इसे एक अच्छा मिलान माना जाएगा।"],
    ["The boy is Manglik. The girl is, however, not Manglik. This mismatch can result in quarrels, differences in thinking, unnecessary tensions, etc. Hence, this match is not recommended on basis of Manglik considerations.", "लड़का मांगलिक है, परंतु लड़की मांगलिक नहीं है। यह असमानता झगड़ों, विचारों में मतभेद, अनावश्यक तनाव आदि का कारण बन सकती है। अतः मांगलिक विचार के आधार पर इस मिलान की अनुशंसा नहीं की जाती।"],
    ["The boy is not Manglik. The girl is, however, Manglik. This difference can result in disagreements, squabbling, separation, etc. Hence, this match is not recommended.", "लड़का मांगलिक नहीं है, परंतु लड़की मांगलिक है। यह अंतर असहमति, कलह, अलगाव आदि का कारण बन सकता है। अतः इस मिलान की अनुशंसा नहीं की जाती।"],
    ["The boy is not a Manglik; nor is the girl a Manglik. Mangal Dosha being absent in either horoscopes, there shall be no ill effect on their marriage. This match is recommended.", "न लड़का मांगलिक है और न ही लड़की। दोनों कुंडलियों में मंगल दोष न होने से उनके विवाह पर कोई दुष्प्रभाव नहीं पड़ेगा। इस मिलान की अनुशंसा की जाती है।"],
    // Rudraksha names and recommendations
    ["Eight Faced Rudraksha (Aath Mukhi)", "आठ मुखी रुद्राक्ष"], ["Eleven Faced Rudraksha (Egyarah Mukhi)", "ग्यारह मुखी रुद्राक्ष"],
    ["Five Faced + Fourteen Faced Rudraksha (Paanch + Chaudah Mukhi)", "पांच मुखी + चौदह मुखी रुद्राक्ष"],
    ["Four faced + Two Faced Rudraksha (Chaar Mukhi + Do Mukhi)", "चार मुखी + दो मुखी रुद्राक्ष"], ["Gauri Shankar Rudraksha", "गौरी शंकर रुद्राक्ष"],
    ["Nine Faced Rudraksha (Nau Mukhi)", "नौ मुखी रुद्राक्ष"], ["One Faced Rudraksha (EK MUKHI)", "एक मुखी रुद्राक्ष"],
    ["Seven Faced Rudraksha (Saat Mukhi)", "सात मुखी रुद्राक्ष"], ["Six Faced + Ganesha Rudraksha (Chhah Mukhi + Ganesh)", "छह मुखी + गणेश रुद्राक्ष"],
    ["Ten Faced Rudraksha (Das Mukhi)", "दस मुखी रुद्राक्ष"], ["Three + Twelve Faced Rudraksha (Teen + Baarah Mukhi)", "तीन + बारह मुखी रुद्राक्ष"],
    ["Two + Thirteen Faced Rudraksha (Do + Terah Mukhi)", "दो + तेरह मुखी रुद्राक्ष"],
    ["You are recommended to wear EIGHT FACED Rudraksha.", "आपको आठ मुखी रुद्राक्ष धारण करने की सलाह दी जाती है।"],
    ["You are recommended to wear ELEVEN FACED Rudraksha.", "आपको ग्यारह मुखी रुद्राक्ष धारण करने की सलाह दी जाती है।"],
    ["You are recommended to wear GAURI SHANKAR Rudraksha.", "आपको गौरी शंकर रुद्राक्ष धारण करने की सलाह दी जाती है।"],
    ["You are recommended to wear NINE FACED Rudraksha.", "आपको नौ मुखी रुद्राक्ष धारण करने की सलाह दी जाती है।"],
    ["You are recommended to wear ONE FACED Rudraksha", "आपको एक मुखी रुद्राक्ष धारण करने की सलाह दी जाती है।"],
    ["You are recommended to wear SEVEN FACED Rudraksha.", "आपको सात मुखी रुद्राक्ष धारण करने की सलाह दी जाती है।"],
    ["You are recommended to wear TEN FACED Rudraksha.", "आपको दस मुखी रुद्राक्ष धारण करने की सलाह दी जाती है।"],
    ["You are recommended to wear a combination FIVE and FOURTEEN FACED Rudraksha.", "आपको पांच और चौदह मुखी रुद्राक्ष का संयोजन धारण करने की सलाह दी जाती है।"],
    ["You are recommended to wear a combination FOUR and TWO FACED Rudraksha.", "आपको चार और दो मुखी रुद्राक्ष का संयोजन धारण करने की सलाह दी जाती है।"],
    ["You are recommended to wear a combination SIX FACED and GANESHA Rudraksha.", "आपको छह मुखी और गणेश रुद्राक्ष का संयोजन धारण करने की सलाह दी जाती है।"],
    ["You are recommended to wear a combination of THREE and TWELVE FACED Rudraksha.", "आपको तीन और बारह मुखी रुद्राक्ष का संयोजन धारण करने की सलाह दी जाती है।"],
    ["You are recommended to wear a combination of TWO and THIRTEEN FACED Rudraksha.", "आपको दो और तेरह मुखी रुद्राक्ष का संयोजन धारण करने की सलाह दी जाती है।"],
    // Rudraksha detail sentences
    ["A real blessing that bestows the boon of awareness.", "यह सजगता का वरदान देने वाला सच्चा आशीर्वाद है।"],
    ["Among all the planets, Saturn enjoys the encomium of being a master-yogi.", "सभी ग्रहों में शनि को महायोगी होने का गौरव प्राप्त है।"],
    ["Astrologically they are said to cure the malefic effects of the Sun.", "ज्योतिष के अनुसार ये सूर्य के अशुभ प्रभावों को दूर करते हैं।"],
    ["By wearing Seven Faced Rudraksha man can progress in business and service and spends his life happily.", "सात मुखी रुद्राक्ष धारण करने से व्यक्ति व्यापार और नौकरी में उन्नति करता है और सुखपूर्वक जीवन बिताता है।"],
    ["Effect of eight-face rudraksha is it prevents its user from accident and always helps to win battle against enemy.", "आठ मुखी रुद्राक्ष का प्रभाव यह है कि यह धारक को दुर्घटना से बचाता है और शत्रु पर विजय पाने में सदैव सहायक होता है।"],
    ["Effect of wearing two-face rudraksha brings peace in family and it helps to develop good relationship between two individuals.", "दो मुखी रुद्राक्ष धारण करने से परिवार में शांति आती है और दो व्यक्तियों के बीच अच्छे संबंध बनाने में सहायता मिलती है।"],
    ["Eleven-face rudraksha is symbol of Ekadus Maha Rudra.", "ग्यारह मुखी रुद्राक्ष एकादश महारुद्र का प्रतीक है।"],
    ["Extremely useful for relationship.", "संबंधों के लिए अत्यंत उपयोगी है।"],
    ["Five face rudraksha is symbol of Panchmukhi Shiva i.e. lord Pashupatinath.", "पांच मुखी रुद्राक्ष पंचमुखी शिव अर्थात भगवान पशुपतिनाथ का प्रतीक है।"],
    ["For females, grants long life to the husband & helps in getting desired progeny.", "स्त्रियों के लिए यह पति को दीर्घायु देता है और मनचाही संतान प्राप्ति में सहायक है।"],
    ["Fourteen-face rudraksha is symbol of Hanuman.", "चौदह मुखी रुद्राक्ष हनुमान जी का प्रतीक है।"],
    ["Ganesh Rudraksha bears a Trunk like elevation as is seen on the face of Lord Ganesha, the son of Lord Shiva.", "गणेश रुद्राक्ष पर भगवान शिव के पुत्र भगवान गणेश के मुख की तरह सूंड जैसा उभार होता है।"],
    ["Ganesh Rudraksha provides the wearer perfection in every sphere in life and the grace of Lord Ganesha is received by him.", "गणेश रुद्राक्ष धारक को जीवन के हर क्षेत्र में पूर्णता देता है और उसे भगवान गणेश की कृपा प्राप्त होती है।"],
    ["Ganesha, the elephant-headed God of success and overcoming obstacles, is also associated with wisdom, learning, prudence, and power.", "सफलता और विघ्नों को दूर करने वाले गजमुख भगवान गणेश ज्ञान, विद्या, विवेक और शक्ति से भी जुड़े हैं।"],
    ["He gives 'Riddhi-Siddhi'.", "वे 'ऋद्धि-सिद्धि' प्रदान करते हैं।"],
    ["He is the first to be worshipped in the beginning of any auspicious occasion.", "किसी भी शुभ अवसर के आरंभ में सबसे पहले उनकी पूजा की जाती है।"],
    ["Helps in ruling and creating a powerful aura round oneself.", "नेतृत्व करने और अपने चारों ओर प्रभावशाली आभा बनाने में सहायक है।"],
    ["His opponents are finished i.e. the mental status of its opponents is changed.", "उसके विरोधी समाप्त हो जाते हैं अर्थात विरोधियों की मानसिकता बदल जाती है।"],
    ["Honor is increased in political areas.", "राजनीतिक क्षेत्रों में सम्मान बढ़ता है।"],
    ["It also promotes logical and structural thinking.", "यह तार्किक और व्यवस्थित सोच को भी बढ़ावा देता है।"],
    ["It broadens mind and helps to provide knowledge of spiritual and philosophical subjects.", "यह मन को विशाल बनाता है और आध्यात्मिक व दार्शनिक विषयों का ज्ञान देने में सहायक है।"],
    ["It can be wear at neck or on right arm.", "इसे गले में या दाहिनी भुजा पर धारण किया जा सकता है।"],
    ["It controls the malefic effects of Moon and diseases of the left eye, kidney, intestines etc.", "यह चंद्र के अशुभ प्रभावों तथा बाईं आंख, गुर्दे, आंतों आदि के रोगों को नियंत्रित करता है।"],
    ["It creates a feeling of security and removes complexes.", "यह सुरक्षा की भावना जगाता है और हीन भावनाओं को दूर करता है।"],
    ["It gives the wearer all kinds of attainments - Riddhies and Siddhies and leads him to Shivloka.", "यह धारक को सभी प्रकार की उपलब्धियां - ऋद्धियां और सिद्धियां देता है और उसे शिवलोक की ओर ले जाता है।"],
    ["It help to increase mental power, intelligence, knowledge and concentration.", "यह मानसिक शक्ति, बुद्धि, ज्ञान और एकाग्रता बढ़ाने में सहायक है।"],
    ["It helps in cultivating patience, controlling unnecessary anger and a feeling of non-fear.", "यह धैर्य विकसित करने, अनावश्यक क्रोध पर नियंत्रण और निर्भयता की भावना में सहायक है।"],
    ["It helps in curing the malefic effects of Jupiter.", "यह बृहस्पति के अशुभ प्रभावों को दूर करने में सहायक है।"],
    ["It helps in stabilizing the mind, making a person purposeful, making a person to complete a task before moving onto the next one.", "यह मन को स्थिर करने, व्यक्ति को उद्देश्यपूर्ण बनाने और अगला कार्य आरंभ करने से पहले पिछला कार्य पूरा करने में सहायक है।"],
    ["It helps the wearer to overcome difficult times and ensures that the wearer and the family of the wearer are protected.", "यह धारक को कठिन समय से उबरने में सहायता करता है और धारक तथा उसके परिवार की रक्षा सुनिश्चित करता है।"],
    ["It increases self-power.", "यह आत्मबल बढ़ाता है।"],
    ["It increases wit and intelligence.", "यह वाक्-चातुर्य और बुद्धि बढ़ाता है।"],
    ["It is also helpful in curing long standing diseases.", "यह पुराने रोगों को दूर करने में भी सहायक है।"],
    ["It is also worship as lord Vishnu (Preserver).", "इसकी पूजा पालनकर्ता भगवान विष्णु के रूप में भी की जाती है।"],
    ["It is also worship as symbol of Bhubaneswor.", "इसकी पूजा भुवनेश्वर के प्रतीक के रूप में भी की जाती है।"],
    ["It is an extremely blessed bead and provides protection against many evils and perils.", "यह अत्यंत शुभ मनका है और अनेक बुराइयों व संकटों से रक्षा करता है।"],
    ["It is believed that Rudra always became happy and satisfies with the user of eleven-face rudraksha.", "माना जाता है कि ग्यारह मुखी रुद्राक्ष धारण करने वाले से रुद्र सदैव प्रसन्न और संतुष्ट रहते हैं।"],
    ["It is believed that eight face rudraksha always help people to earn goodwill from eight direction.", "माना जाता है कि आठ मुखी रुद्राक्ष आठों दिशाओं से सद्भावना अर्जित करने में सदैव सहायक होता है।"],
    ["It is bless with the mantra \" Om namah shivaya\".", "यह \"ॐ नमः शिवाय\" मंत्र से अभिमंत्रित है।"],
    ["It is bless with the mantra \"Om namah shivaya\".", "यह \"ॐ नमः शिवाय\" मंत्र से अभिमंत्रित है।"],
    ["It is bless with the power of Hanuman.", "इसमें हनुमान जी की शक्ति का आशीर्वाद है।"],
    ["It is called Ganesh Rudraksha.", "इसे गणेश रुद्राक्ष कहा जाता है।"],
    ["It is helpful for achieving wealth.", "यह धन प्राप्ति में सहायक है।"],
    ["It is helpful in diseases like, harassment by spirits, trauma causing dreams, Skin diseases, Stress and anxiety.", "यह ऊपरी बाधा, डरावने स्वप्न, त्वचा रोग, तनाव और चिंता जैसी समस्याओं में सहायक है।"],
    ["It is said that owner of one face rudraksha enjoy all kinds of worldly pleasures.", "कहा जाता है कि एक मुखी रुद्राक्ष का स्वामी सभी प्रकार के सांसारिक सुखों का आनंद लेता है।"],
    ["It is superior among all.", "यह सभी में श्रेष्ठ है।"],
    ["It is the bead of Good luck, academic excellence.", "यह सौभाग्य और शैक्षिक उत्कृष्टता का मनका है।"],
    ["It is useful for concentration of peace of mind and spiritual awaking.", "यह मानसिक शांति, एकाग्रता और आध्यात्मिक जागृति के लिए उपयोगी है।"],
    ["It is useful for pacifying nine planets.", "यह नवग्रहों को शांत करने में उपयोगी है।"],
    ["It is very auspicious valuable and rare it is enough if one can see it once.", "यह अत्यंत शुभ, मूल्यवान और दुर्लभ है; इसके एक बार दर्शन ही पर्याप्त माने जाते हैं।"],
    ["It is very dear to Maa Shakti and worn by the devotee of Devi.", "यह मां शक्ति को अत्यंत प्रिय है और देवी के भक्त इसे धारण करते हैं।"],
    ["It provides the worshipper perfection in every sphere in life.", "यह उपासक को जीवन के हर क्षेत्र में पूर्णता देता है।"],
    ["It renders Bhukti and Mukti both.", "यह भुक्ति और मुक्ति दोनों प्रदान करता है।"],
    ["It should be worn by people wanting to attain influential and powerful positions.", "प्रभावशाली और शक्तिशाली पद पाने के इच्छुक लोगों को इसे धारण करना चाहिए।"],
    ["Its ruling planet is Ketu.", "इसका स्वामी ग्रह केतु है।"],
    ["Its ruling planet is Mercury and symbolizes Brahma.", "इसका स्वामी ग्रह बुध है और यह ब्रह्मा का प्रतीक है।"],
    ["Its usefulness in overcoming impotency, cold, obstructions.", "यह नपुंसकता, सर्दी-जुकाम और बाधाओं को दूर करने में उपयोगी है।"],
    ["Ketu inflicts the diseases of lung, fever, eye-pain, bowel pain, skin disease, body pain etc.", "केतु फेफड़ों के रोग, ज्वर, आंखों का दर्द, पेट दर्द, त्वचा रोग, शरीर दर्द आदि देता है।"],
    ["Malefic effects of the Sun are controlled.", "सूर्य के अशुभ प्रभाव नियंत्रित होते हैं।"],
    ["Nine Faced Rudraksha is the form of Goddess Durga (Shakti).", "नौ मुखी रुद्राक्ष देवी दुर्गा (शक्ति) का स्वरूप है।"],
    ["One Mukhi Rudraksha is said to be the incarnation of lord Shiva.", "एक मुखी रुद्राक्ष को भगवान शिव का अवतार कहा जाता है।"],
    ["Saturn rules this 7 faced bead.", "इस सात मुखी मनके का स्वामी शनि है।"],
    ["Ten-face rudraksha is symbol of Dashavatar.", "दस मुखी रुद्राक्ष दशावतार का प्रतीक है।"],
    ["The Gauri Shankar Rudraksha is probably one that expands one's consciousness to a 360 degrees!", "गौरी शंकर रुद्राक्ष संभवतः वह रुद्राक्ष है जो व्यक्ति की चेतना को 360 अंश तक विस्तृत कर देता है!"],
    ["The bead is said to increase charisma and charm.", "कहा जाता है कि यह मनका आकर्षण और प्रभाव बढ़ाता है।"],
    ["The domain of Saturn and the aura surrounding it gets evangelised.", "शनि का क्षेत्र और उसके आसपास की आभा पवित्र हो जाती है।"],
    ["The malefic effects of the Moon are controlled by it.", "इससे चंद्र के अशुभ प्रभाव नियंत्रित होते हैं।"],
    ["The one-faced Rudraksha is itself Lord Shiva and it is the rarest and the most important among all the varities of Rudrakshas.", "एक मुखी रुद्राक्ष स्वयं भगवान शिव है और यह सभी प्रकार के रुद्राक्षों में सबसे दुर्लभ और सबसे महत्वपूर्ण है।"],
    ["The power of Brahma exists in its whole effectiveness and Divinity.", "इसमें ब्रह्मा की शक्ति अपनी पूर्ण प्रभावशीलता और दिव्यता के साथ विद्यमान है।"],
    ["The ruling planet is Jupiter.", "इसका स्वामी ग्रह बृहस्पति है।"],
    ["The ruling planet is the Sun or Aditya.", "इसका स्वामी ग्रह सूर्य या आदित्य है।"],
    ["The ruling planet of two Mukhi Rudraksha is Moon.", "दो मुखी रुद्राक्ष का स्वामी ग्रह चंद्र है।"],
    ["The wearer of this Rudraksha begins to break loose of Saturn's influences.", "इस रुद्राक्ष का धारक शनि के प्रभावों से मुक्त होने लगता है।"],
    ["There is no ruling planet for this bead.", "इस मनके का कोई स्वामी ग्रह नहीं है।"],
    ["These mukhis have the power to cure physical ailments like Head ache, ear ailments, Bowel problems, Bone weakness etc and also spiritual ailments such as lack of Confidence, Charisma, Personal power, leadership qualities and Prosperity.", "इन मुखियों में सिरदर्द, कान के रोग, पेट की समस्याएं, हड्डियों की कमजोरी आदि शारीरिक रोगों के साथ-साथ आत्मविश्वास, आकर्षण, व्यक्तिगत शक्ति, नेतृत्व क्षमता और समृद्धि की कमी जैसी आध्यात्मिक कमियों को दूर करने की शक्ति होती है।"],
    ["This Rudraksha nullifies the malefic effects of Mercury and pleases Goddess Saraswati.", "यह रुद्राक्ष बुध के अशुभ प्रभावों को निष्प्रभावी करता है और देवी सरस्वती को प्रसन्न करता है।"],
    ["This bead cures the malefic effects of Rahu.", "यह मनका राहु के अशुभ प्रभावों को दूर करता है।"],
    ["This bead is best for spiritual awakening when worn on the throat region (above collar T bone) or when meditated with this bead above the sahasara (crown of head).", "कंठ क्षेत्र (हंसली की हड्डी के ऊपर) पर धारण करने या सहस्रार (सिर के शीर्ष) के ऊपर रखकर ध्यान करने पर यह मनका आध्यात्मिक जागृति के लिए सर्वोत्तम है।"],
    ["This is a kind of Rudraksha which bears Trunk like elevation as is seen on the face of Lord Ganesh.", "यह एक प्रकार का रुद्राक्ष है जिस पर भगवान गणेश के मुख की तरह सूंड जैसा उभार होता है।"],
    ["This mukhi also governs logical and concrete and structural thinking", "यह मुखी तार्किक, ठोस और व्यवस्थित सोच को भी नियंत्रित करता है।"],
    ["This mukhi is beneficial to sublimate the ill effects of Ketu.", "यह मुखी केतु के दुष्प्रभावों को शांत करने में लाभकारी है।"],
    ["This removes the obstacles from the path of its wearer and ensures professional success.", "यह धारक के मार्ग की बाधाएं दूर करता है और व्यावसायिक सफलता सुनिश्चित करता है।"],
    ["This symbolises lord Vishnu too.", "यह भगवान विष्णु का भी प्रतीक है।"],
    ["Twelve face rudraksha is symbol of Aditya.", "बारह मुखी रुद्राक्ष आदित्य का प्रतीक है।"],
    ["Two beads connected naturally represents the unified form of Shiva and Parvati.", "प्राकृतिक रूप से जुड़े दो मनके शिव और पार्वती के एकीकृत रूप का प्रतिनिधित्व करते हैं।"],
    ["Two face rudraksha is symbol of Shiva -Parvati.", "दो मुखी रुद्राक्ष शिव-पार्वती का प्रतीक है।"],
    ["Wearing it destroys all the sins done by the ten human organs.", "इसे धारण करने से दसों इंद्रियों द्वारा किए गए सभी पाप नष्ट हो जाते हैं।"],
    ["Wearing of this bead expands the universe of conciousness and promotes unity and harmony of the wearer with everyone around him/her.", "इस मनके को धारण करने से चेतना का विस्तार होता है और धारक का अपने आसपास के सभी लोगों के साथ एकता और सामंजस्य बढ़ता है।"],
    ["When placed in home, it brings unity and harmony among the members.", "घर में रखने पर यह सदस्यों के बीच एकता और सामंजस्य लाता है।"],
    // Kaal Sarp report sentences
    ["Due to Kaal Sarp Yog of this type the native should not work in army.", "इस प्रकार के कालसर्प योग के कारण जातक को सेना में कार्य नहीं करना चाहिए।"],
    ["Due to Kaal Sarp Yog the native is unable to keep control on his tongue that may falter sometimes.", "कालसर्प योग के कारण जातक अपनी वाणी पर नियंत्रण नहीं रख पाता, जिससे कभी-कभी चूक हो सकती है।"],
    ["Due to Kaal Sarp Yog the native remains disheartened and depressed.", "कालसर्प योग के कारण जातक हताश और उदास रहता है।"],
    ["Due to Kaal Sarp Yog the native suffers from diseases many times that cause anxiety.", "कालसर्प योग के कारण जातक कई बार रोगों से पीड़ित होता है, जिससे चिंता होती है।"],
    ["Due to Kaal Sarp Yog the native suffers from diseases many times that cause loss of money and the native may suffer but things improve later on.", "कालसर्प योग के कारण जातक कई बार रोगों से पीड़ित होता है, जिससे धन हानि होती है और कष्ट हो सकता है, परंतु बाद में स्थिति सुधर जाती है।"],
    ["Due to Kaal Sarp Yog the native suffers from diseases many times that cause loss of money and the native may suffer due to an accident.", "कालसर्प योग के कारण जातक कई बार रोगों से पीड़ित होता है, जिससे धन हानि होती है, और किसी दुर्घटना के कारण भी कष्ट हो सकता है।"],
    ["Due to Kaal Sarp Yog the native suffers from diseases many times that cause loss of money and the native may suffer due to debts.", "कालसर्प योग के कारण जातक कई बार रोगों से पीड़ित होता है, जिससे धन हानि होती है, और ऋण के कारण भी कष्ट हो सकता है।"],
    ["Due to Kaal Sarp Yog the native suffers from diseases many times that cause loss of money.", "कालसर्प योग के कारण जातक कई बार रोगों से पीड़ित होता है, जिससे धन हानि होती है।"],
    ["Due to Kaal Sarp Yog the native suffers from diseases many times.", "कालसर्प योग के कारण जातक कई बार रोगों से पीड़ित होता है।"],
    ["Due to Kaal Sarp Yog the native suffers from diseases or injury that cause loss of money and the native may suffer due to debts.", "कालसर्प योग के कारण जातक रोगों या चोट से पीड़ित होता है, जिससे धन हानि होती है, और ऋण के कारण भी कष्ट हो सकता है।"],
    ["Due to Kaal Sarp Yog the native suffers from sexual diseases many times that cause loss of money and the native may suffer due to debts.", "कालसर्प योग के कारण जातक कई बार गुप्त रोगों से पीड़ित होता है, जिससे धन हानि होती है, और ऋण के कारण भी कष्ट हो सकता है।"],
    ["Due to Kaal Sarp Yog the native suffers from state and has differences with government officials.", "कालसर्प योग के कारण जातक को शासन से कष्ट होता है और सरकारी अधिकारियों से मतभेद रहते हैं।"],
    ["Due to Kaal Sarp Yoga the native remains engulfed in problems of property or variable assets.", "कालसर्प योग के कारण जातक संपत्ति या चल-अचल संपत्ति की समस्याओं में उलझा रहता है।"],
    ["Due to the influence of Kaal Sarp Yog the native indulges in low acts.", "कालसर्प योग के प्रभाव से जातक निम्न कार्यों में लिप्त हो सकता है।"],
    ["Due to this reason the married life though normal could be painful and disturbed.", "इस कारण वैवाहिक जीवन सामान्य होते हुए भी कष्टप्रद और अशांत हो सकता है।"],
    ["Due to this reason the native does not believe in gods and generally is non-religious.", "इस कारण जातक देवताओं में विश्वास नहीं रखता और सामान्यतः अधार्मिक होता है।"],
    ["Due to this reason the native generally lives away from his native place and wanders from one place to another but later on stability is there.", "इस कारण जातक सामान्यतः अपने जन्मस्थान से दूर रहता है और एक स्थान से दूसरे स्थान पर भटकता है, परंतु बाद में स्थिरता आती है।"],
    ["Due to this reason the native generally lives away from his native place.", "इस कारण जातक सामान्यतः अपने जन्मस्थान से दूर रहता है।"],
    ["Due to this reason the native lives away from his parents since birth.", "इस कारण जातक जन्म से ही अपने माता-पिता से दूर रहता है।"],
    ["Due to this reason the native may have conflicts with partners in business or there may be loss in partnership.", "इस कारण व्यापार में साझेदारों से विवाद हो सकता है या साझेदारी में हानि हो सकती है।"],
    ["Due to this reason the native normally suffers loss in his ancestral property.", "इस कारण जातक को सामान्यतः पैतृक संपत्ति में हानि होती है।"],
    ["Due to this reason the native remains worried about continuation of family tree(vansh).", "इस कारण जातक वंश की निरंतरता को लेकर चिंतित रहता है।"],
    ["Due to this reason there are hurdles in life and native has to struggle for moving ahead.", "इस कारण जीवन में बाधाएं आती हैं और जातक को आगे बढ़ने के लिए संघर्ष करना पड़ता है।"],
    ["Due to this reason there may be hurdles in obtaining good education.", "इस कारण अच्छी शिक्षा प्राप्त करने में बाधाएं आ सकती हैं।"],
    ["Due to this the financial position of the native remains weak as his expenses may be more.", "इस कारण जातक की आर्थिक स्थिति कमजोर रहती है, क्योंकि उसके खर्च अधिक हो सकते हैं।"],
    ["Due to this there are hurdles in life and native has to struggle for moving ahead.", "इस कारण जीवन में बाधाएं आती हैं और जातक को आगे बढ़ने के लिए संघर्ष करना पड़ता है।"],
    ["Either he gives it away in charity or it gets destroyed.", "या तो वह उसे दान कर देता है या वह नष्ट हो जाती है।"],
    ["He is blessed by children late in life or the native may live away from children.", "उसे संतान सुख देर से मिलता है या वह संतान से दूर रह सकता है।"],
    ["He is full of spirit of charity but others try to take advantage of it.", "उसमें दान की भावना भरपूर होती है, परंतु दूसरे इसका लाभ उठाने का प्रयास करते हैं।"],
    ["He is good in legal matters and is successful in politics.", "वह कानूनी मामलों में अच्छा होता है और राजनीति में सफल होता है।"],
    ["He may suffer due to adverse attitude of government officials.", "सरकारी अधिकारियों के प्रतिकूल रवैये के कारण उसे कष्ट हो सकता है।"],
    ["His confidence may be lacking.", "उसमें आत्मविश्वास की कमी हो सकती है।"],
    ["His esteem could be low and he may be lazy for some period.", "उसका मान-सम्मान कम हो सकता है और वह कुछ समय तक आलसी रह सकता है।"],
    ["His near relatives do not regard him in high esteem.", "उसके निकट संबंधी उसे अधिक सम्मान नहीं देते।"],
    ["His status and esteem is normal.", "उसकी प्रतिष्ठा और मान-सम्मान सामान्य रहता है।"],
    ["However by hard work financial position become all right.", "फिर भी परिश्रम से आर्थिक स्थिति ठीक हो जाती है।"],
    ["However later on, all hurdles get removed.", "फिर भी बाद में सभी बाधाएं दूर हो जाती हैं।"],
    ["However the native also gets a miraculous time in life when he gets acclaim.", "फिर भी जातक के जीवन में एक चमत्कारिक समय भी आता है जब उसे प्रशंसा मिलती है।"],
    ["However the native also gets a miraculous time in life.", "फिर भी जातक के जीवन में एक चमत्कारिक समय भी आता है।"],
    ["However things are all right later on.", "फिर भी बाद में सब ठीक हो जाता है।"],
    ["If at all it reaches completion it is very late.", "यदि पूरा होता भी है तो बहुत देर से।"],
    ["If at all the native is able to accumulate some wealth; others usurp it.", "यदि जातक कुछ धन संचित कर भी ले, तो दूसरे उसे हड़प लेते हैं।"],
    ["If in business, there are losses continuously.", "यदि व्यापार में हो, तो लगातार हानि होती है।"],
    ["In spite of all these drawbacks the native achieves success ultimately.", "इन सभी कमियों के बावजूद जातक अंततः सफलता प्राप्त करता है।"],
    ["In spite of hard work the native does not get good results in his business or job.", "कड़ी मेहनत के बावजूद जातक को व्यापार या नौकरी में अच्छे परिणाम नहीं मिलते।"],
    ["Native has to struggle for moving ahead.", "जातक को आगे बढ़ने के लिए संघर्ष करना पड़ता है।"],
    ["On many occasions there is fall of prestige or there is lack of esteem.", "कई अवसरों पर प्रतिष्ठा में गिरावट या मान-सम्मान की कमी होती है।"],
    ["Particularly the work of bankers suffers.", "विशेषकर बैंकिंग से जुड़े कार्य प्रभावित होते हैं।"],
    ["Sometimes disinterest develops in life.", "कभी-कभी जीवन में अरुचि उत्पन्न हो जाती है।"],
    ["Still the native gets success in politcs.", "फिर भी जातक को राजनीति में सफलता मिलती है।"],
    ["THe may be imprisoned.", "उसे कारावास भी हो सकता है।"],
    ["The character of the native remains dubious.", "जातक का चरित्र संदिग्ध रहता है।"],
    ["The children may be cruel or disobedient.", "संतान कठोर या आज्ञा न मानने वाली हो सकती है।"],
    ["The children of the native may remain ill causing anxiety and loss to him.", "जातक की संतान बीमार रह सकती है, जिससे उसे चिंता और हानि होती है।"],
    ["The desired work does not get completed.", "मनचाहा कार्य पूरा नहीं होता।"],
    ["The education of the native remains ordinary.", "जातक की शिक्षा साधारण रहती है।"],
    ["The enemies of the native hatch conspiracies against him and try to cause harm but they are not much successful.", "जातक के शत्रु उसके विरुद्ध षड्यंत्र रचते हैं और हानि पहुंचाने का प्रयास करते हैं, परंतु वे अधिक सफल नहीं होते।"],
    ["The enemies of the native hatch conspiracies against him and try to cause harm but they are not successful.", "जातक के शत्रु उसके विरुद्ध षड्यंत्र रचते हैं और हानि पहुंचाने का प्रयास करते हैं, परंतु वे सफल नहीं होते।"],
    ["The enemies of the native hatch conspiracies against him and try to cause harm.", "जातक के शत्रु उसके विरुद्ध षड्यंत्र रचते हैं और हानि पहुंचाने का प्रयास करते हैं।"],
    ["The evil spirits or ghosts may disturb the native.", "ऊपरी बाधाएं जातक को परेशान कर सकती हैं।"],
    ["The family life remains disturbed; peace and happiness remain absent on many occasions.", "पारिवारिक जीवन अशांत रहता है; कई अवसरों पर शांति और सुख का अभाव रहता है।"],
    ["The family life remains disturbed; peace and happiness remain absent.", "पारिवारिक जीवन अशांत रहता है; शांति और सुख का अभाव रहता है।"],
    ["The family members cause loss of esteem to native and happiness remains away from home.", "परिवार के सदस्य जातक के मान-सम्मान की हानि का कारण बनते हैं और घर से सुख दूर रहता है।"],
    ["The father of the native may die at native's early age.", "जातक की कम आयु में ही उसके पिता का निधन हो सकता है।"],
    ["The financial position of the native remains normal.", "जातक की आर्थिक स्थिति सामान्य रहती है।"],
    ["The financial position of the native remains weak as his expenses may be more.", "जातक की आर्थिक स्थिति कमजोर रहती है, क्योंकि उसके खर्च अधिक हो सकते हैं।"],
    ["The financial position remains little fragile.", "आर्थिक स्थिति कुछ कमजोर रहती है।"],
    ["The friends of the native try to deceive him again and again.", "जातक के मित्र बार-बार उसे धोखा देने का प्रयास करते हैं।"],
    ["The happiness from children may be less.", "संतान से सुख कम मिल सकता है।"],
    ["The health of native may suffer.", "जातक का स्वास्थ्य प्रभावित हो सकता है।"],
    ["The influence of Moon makes the mind of native disturbed and restless.", "चंद्र के प्रभाव से जातक का मन अशांत और बेचैन रहता है।"],
    ["The life may be mysterious.", "जीवन रहस्यमय हो सकता है।"],
    ["The married life is normal but painful and disturbed.", "वैवाहिक जीवन सामान्य होते हुए भी कष्टप्रद और अशांत रहता है।"],
    ["The married life is painful and disturbed.", "वैवाहिक जीवन कष्टप्रद और अशांत रहता है।"],
    ["The married life though normal could be painful and disturbed.", "वैवाहिक जीवन सामान्य होते हुए भी कष्टप्रद और अशांत हो सकता है।"],
    ["The memory may be weak.", "स्मरण शक्ति कमजोर हो सकती है।"],
    ["The money lent to others may not come back.", "दूसरों को उधार दिया गया धन वापस नहीं आ सकता।"],
    ["The native changes his work again and again therefore there are losses.", "जातक बार-बार अपना कार्य बदलता है, इसलिए हानि होती है।"],
    ["The native could suffer due to suspension in job.", "नौकरी में निलंबन के कारण जातक को कष्ट हो सकता है।"],
    ["The native develops contacts with many persons of opposite sex and may have to face humiliation.", "जातक के विपरीत लिंग के अनेक लोगों से संबंध बनते हैं और उसे अपमान का सामना करना पड़ सकता है।"],
    ["The native does many jobs at one time but normally none gets completed.", "जातक एक साथ कई कार्य करता है, परंतु सामान्यतः कोई भी पूरा नहीं होता।"],
    ["The native does not get the bliss of parents.", "जातक को माता-पिता का सुख नहीं मिलता।"],
    ["The native does not have the happiness of servants and vehicles and may suffer through them.", "जातक को सेवकों और वाहनों का सुख नहीं मिलता और उनके कारण कष्ट हो सकता है।"],
    ["The native does not take much interest in worship, recitations, alms or other religious activities.", "जातक पूजा, पाठ, दान या अन्य धार्मिक कार्यों में अधिक रुचि नहीं लेता।"],
    ["The native faces many problems in arguments, legal cases and conflicts; defeat is not ruled out.", "जातक को वाद-विवाद, कानूनी मामलों और संघर्षों में अनेक समस्याओं का सामना करना पड़ता है; पराजय की संभावना से इनकार नहीं किया जा सकता।"],
    ["The native gets renown at the fag end of his life or after his death.", "जातक को जीवन के अंतिम चरण में या मृत्यु के बाद ख्याति मिलती है।"],
    ["The native gets success in business or job.", "जातक को व्यापार या नौकरी में सफलता मिलती है।"],
    ["The native gets success in business.", "जातक को व्यापार में सफलता मिलती है।"],
    ["The native has acrimony with uncles and cousins as well as with his elder brothers.", "जातक का चाचा-ताऊ, चचेरे भाई-बहनों और बड़े भाइयों से मनमुटाव रहता है।"],
    ["The native has to work hard for build up of character and for moving ahead.", "जातक को चरित्र निर्माण और आगे बढ़ने के लिए कड़ी मेहनत करनी पड़ती है।"],
    ["The native is devoid of bliss of children or there is some lack of pleasure from them.", "जातक संतान सुख से वंचित रहता है या उनसे सुख में कुछ कमी रहती है।"],
    ["The native may also suffer deceit in secret affairs.", "गुप्त संबंधों में जातक को धोखा भी मिल सकता है।"],
    ["The native may be devoid of bliss of father/mother.", "जातक पिता/माता के सुख से वंचित हो सकता है।"],
    ["The native may be ill from time to time.", "जातक समय-समय पर बीमार हो सकता है।"],
    ["The native may have conflicts with partners in business or there may be loss in partnership.", "व्यापार में साझेदारों से विवाद हो सकता है या साझेदारी में हानि हो सकती है।"],
    ["The native may not get the bliss of parents.", "जातक को माता-पिता का सुख नहीं मिल सकता।"],
    ["The native may receive punishment from law.", "जातक को कानून से दंड मिल सकता है।"],
    ["The native may sign in a hurry on important legal documents thus incurring huge loss.", "जातक जल्दबाजी में महत्वपूर्ण कानूनी दस्तावेजों पर हस्ताक्षर कर सकता है, जिससे भारी हानि होती है।"],
    ["The native may suffer due to defamation.", "मानहानि के कारण जातक को कष्ट हो सकता है।"],
    ["The native may suffer from sexual disorders.", "जातक गुप्त रोगों से पीड़ित हो सकता है।"],
    ["The native may suffer hardships during his stay at a foreign country.", "विदेश में रहने के दौरान जातक को कठिनाइयों का सामना करना पड़ सकता है।"],
    ["The native normally does not get benefit of his ancestral property.", "जातक को सामान्यतः पैतृक संपत्ति का लाभ नहीं मिलता।"],
    ["The native receives defame from his own family or community.", "जातक को अपने ही परिवार या समाज से बदनामी मिलती है।"],
    ["The native remains irritated.", "जातक चिड़चिड़ा रहता है।"],
    ["The native remains mentally disturbed from time to time.", "जातक समय-समय पर मानसिक रूप से अशांत रहता है।"],
    ["The native remains unsuccessful in his love affairs or he may not be blessed with a desired spouse.", "जातक प्रेम संबंधों में असफल रहता है या उसे मनचाहा जीवनसाथी नहीं मिल पाता।"],
    ["The native sees bad dreams from time to time such as snakes, fearful scenes, hanging etc.", "जातक को समय-समय पर सांप, भयावह दृश्य, फांसी आदि जैसे बुरे स्वप्न आते हैं।"],
    ["The native sees profit in all directions but like a mirage it remain away.", "जातक को हर दिशा में लाभ दिखाई देता है, परंतु मृगतृष्णा की तरह वह दूर ही रहता है।"],
    ["The native suffers due to deceit by maternal uncles or by brother in law.", "मामा या साले/बहनोई के धोखे के कारण जातक को कष्ट होता है।"],
    ["The native suffers due to the separation from grandfather/grandmother (paternal or maternal) or he may lose money due to them despite hopes of benefits.", "जातक को दादा/दादी या नाना/नानी से वियोग का कष्ट होता है, या लाभ की आशा के बावजूद उनके कारण धन हानि हो सकती है।"],
    ["The native suffers due to the separation from grandfather/grandmother (paternal or maternal).", "जातक को दादा/दादी या नाना/नानी से वियोग का कष्ट होता है।"],
    ["The native suffers from diseases many times that cause loss of money and the native may suffer due to debts.", "जातक कई बार रोगों से पीड़ित होता है, जिससे धन हानि होती है, और ऋण के कारण भी कष्ट हो सकता है।"],
    ["The native suffers losses due to indulgence in quarrels.", "झगड़ों में उलझने के कारण जातक को हानि होती है।"],
    ["The native travels a lot but success is not there.", "जातक बहुत यात्राएं करता है, परंतु सफलता नहीं मिलती।"],
    ["The native tries his hand in trades of different kinds but success remains away.", "जातक विभिन्न प्रकार के व्यवसायों में हाथ आजमाता है, परंतु सफलता दूर रहती है।"],
    ["The native usually dies in mysterious circumstances.", "जातक की मृत्यु प्रायः रहस्यमय परिस्थितियों में होती है।"],
    ["The native's way of working is peculiar.", "जातक की कार्यशैली विचित्र होती है।"],
    ["The own relatives try to cause harm from time to time.", "अपने ही संबंधी समय-समय पर हानि पहुंचाने का प्रयास करते हैं।"],
    ["The position of the native is like a king sometimes or like a pauper sometimes.", "जातक की स्थिति कभी राजा जैसी तो कभी रंक जैसी होती है।"],
    ["The second half of life may be full of struggles or the native may remain worried about old age and he may think of leading a secluded life.", "जीवन का उत्तरार्ध संघर्षों से भरा हो सकता है या जातक वृद्धावस्था को लेकर चिंतित रह सकता है और एकांत जीवन जीने का विचार कर सकता है।"],
    ["The second half of life may be full of struggles or the native may remain worried about old age.", "जीवन का उत्तरार्ध संघर्षों से भरा हो सकता है या जातक वृद्धावस्था को लेकर चिंतित रह सकता है।"],
    ["The success may come after great efforts.", "सफलता बड़े प्रयासों के बाद मिल सकती है।"],
    ["The termination is not ruled out.", "नौकरी छूटने की संभावना से इनकार नहीं किया जा सकता।"],
    ["The worries and mental unrest do not leave the native due to one reason or other.", "किसी न किसी कारण से चिंताएं और मानसिक अशांति जातक का पीछा नहीं छोड़तीं।"],
    ["There are hurdles in life and native has to struggle for moving ahead but the native usually gets a chance to serve in government.", "जीवन में बाधाएं आती हैं और जातक को आगे बढ़ने के लिए संघर्ष करना पड़ता है, परंतु उसे प्रायः सरकारी सेवा का अवसर मिलता है।"],
    ["There are hurdles in life and native has to struggle for moving ahead.", "जीवन में बाधाएं आती हैं और जातक को आगे बढ़ने के लिए संघर्ष करना पड़ता है।"],
    ["There could be a separation.", "अलगाव हो सकता है।"],
    ["There may be debts.", "ऋण हो सकता है।"],
    ["There may be hurdles in getting a senior position but native is able to remove these barriers by virtue of his intelligence.", "उच्च पद प्राप्त करने में बाधाएं आ सकती हैं, परंतु जातक अपनी बुद्धि के बल पर इन बाधाओं को दूर कर लेता है।"],
    ["There may be hurdles in obtaining good education but later on things are all right.", "अच्छी शिक्षा प्राप्त करने में बाधाएं आ सकती हैं, परंतु बाद में सब ठीक हो जाता है।"],
    ["There may be hurdles in obtaining good education.", "अच्छी शिक्षा प्राप्त करने में बाधाएं आ सकती हैं।"],
    ["There may be hurdles in your job and you may suffer due to demotion.", "आपकी नौकरी में बाधाएं आ सकती हैं और पदावनति के कारण कष्ट हो सकता है।"],
    ["There may be some loss due to lawsuits.", "मुकदमों के कारण कुछ हानि हो सकती है।"],
    ["This causes losses.", "इससे हानि होती है।"],
    ["This yog is more influential as Rahu/Ketu are situated with Sun/Moon.", "यह योग अधिक प्रभावशाली है, क्योंकि राहु/केतु सूर्य/चंद्र के साथ स्थित हैं।"],
    ["You should try to maintain good rapport with your spouse with a spirit of compromise; only then family life may be successful.", "आपको समझौते की भावना से अपने जीवनसाथी के साथ अच्छा तालमेल बनाए रखने का प्रयास करना चाहिए; तभी पारिवारिक जीवन सफल हो सकता है।"]
  ];
  FIXED.forEach(function (p) { add(p[0], p[1]); });

  // ------------------------------------------------------------------
  // Templated sentences
  // ------------------------------------------------------------------
  var H = "(\\w+)";
  var PATTERNS = [
    [new RegExp("^Planet " + H + " is situated in " + H + " house in your birth chart\\.?$", "i"), function (m) { return ok(pl(m[1]), house(m[2])) && "आपकी जन्म कुंडली में " + pl(m[1]) + " ग्रह " + house(m[2]) + " में स्थित है।"; }],
    [new RegExp("^Planet " + H + " is in " + H + " house in your horoscope\\.?$", "i"), function (m) { return ok(pl(m[1]), house(m[2])) && "आपकी कुंडली में " + pl(m[1]) + " ग्रह " + house(m[2]) + " में है।"; }],
    [new RegExp("^" + H + " house is occupied by planet " + H + " in your birth chart\\.?$", "i"), function (m) { return ok(house(m[1]), pl(m[2])) && "आपकी जन्म कुंडली में " + house(m[1]) + " में " + pl(m[2]) + " ग्रह स्थित है।"; }],
    [new RegExp("^" + H + " house of your birth chart is aspected by " + H + "\\.?$", "i"), function (m) { return ok(house(m[1]), pl(m[2])) && "आपकी जन्म कुंडली के " + house(m[1]) + " पर " + pl(m[2]) + " की दृष्टि है।"; }],
    [new RegExp("^Your " + H + " house in birth chart is aspected by planet " + H + "\\.?$", "i"), function (m) { return ok(house(m[1]), pl(m[2])) && "आपकी जन्म कुंडली के " + house(m[1]) + " पर " + pl(m[2]) + " ग्रह की दृष्टि है।"; }],
    [new RegExp("^" + H + " is aspecting " + H + " house of your birth chart\\.?$", "i"), function (m) { return ok(pl(m[1]), house(m[2])) && pl(m[1]) + " की दृष्टि आपकी जन्म कुंडली के " + house(m[2]) + " पर है।"; }],
    [new RegExp("^Mars mangalik dosha is get cancelled because Mars is situated in " + H + " house(?: house)? with their own sign " + H + "( in navmansha chart)?\\.?$", "i"), function (m) {
      return ok(house(m[1]), pl(m[2])) && (m[3] ? "नवांश कुंडली में " : "") + "मंगल के " + house(m[1]) + " में स्वराशि " + pl(m[2]) + " में स्थित होने के कारण मांगलिक दोष का परिहार हो जाता है।";
    }],
    [new RegExp("^Mars mangalik dosha is get cancelled because Mars is situated in " + H + " house(?: house)? with ketu (?:in )?" + H + " nakshatra\\.?$", "i"), function (m) {
      return ok(house(m[1]), pl(m[2])) && "मंगल के " + house(m[1]) + " में केतु के साथ " + pl(m[2]) + " नक्षत्र में स्थित होने के कारण मांगलिक दोष का परिहार हो जाता है।";
    }],
    [new RegExp("^Mars mangalik dosha is get cancelled because Mars is situated in " + H + " house(?: house)? with " + H + "\\.?$", "i"), function (m) {
      return ok(house(m[1]), pl(m[2])) && "मंगल के " + house(m[1]) + " में " + pl(m[2]) + " राशि में स्थित होने के कारण मांगलिक दोष का परिहार हो जाता है।";
    }],
    [/^In your horoscope the (\w+) Kaal Sarp Yog is present\.?$/i, function (m) { var n = KP.term(m[1], "hi"); return !/[A-Za-z]/.test(n) && "आपकी कुंडली में " + n + " कालसर्प योग उपस्थित है।"; }],
    [/^Ashtakoota matching is only ([\d.]+) points out of ([\d.]+) points\.?$/i, function (m) { return "अष्टकूट मिलान " + m[2] + " में से केवल " + m[1] + " गुण है।"; }],
    [/^The match has scored ([\d.]+) points outs? of ([\d.]+) points\.?$/i, function (m) { return "इस मिलान में " + m[2] + " में से " + m[1] + " गुण प्राप्त हुए हैं।"; }],
    [/^Your horoscope is having Pitra Dosha as it is satisfying (\d+) rules? laid down for Pitra Dosha\.?$/i, function (m) { return "आपकी कुंडली में पितृ दोष है, क्योंकि यह पितृ दोष के लिए निर्धारित " + m[1] + " नियमों को पूरा करती है।"; }]
  ];
  function ok() { for (var i = 0; i < arguments.length; i++) if (!arguments[i]) return false; return true; }

  function translateSentence(s) {
    var k = norm(s);
    if (!k) return "";
    if (S[k]) return S[k];
    if (S[k + "."]) return S[k + "."];
    for (var i = 0; i < PATTERNS.length; i++) {
      var m = PATTERNS[i][0].exec(k);
      if (m) { var r = PATTERNS[i][1](m); if (r) return r; }
    }
    return null;
  }

  // Sentence split without look-behind (older browsers): a sentence ends at
  // . ! ? followed by optional spaces and an upper-case letter or quote.
  function splitSentences(p) {
    var out = [], cur = "";
    for (var i = 0; i < p.length; i++) {
      cur += p[i];
      if (".!?".indexOf(p[i]) !== -1) {
        var j = i + 1;
        while (p[j] === " ") j++;
        if (j < p.length && /[A-Z"]/.test(p[j]) && !/\b(?:i\.e|e\.g)\.$/i.test(cur)) { out.push(cur.trim()); cur = ""; i = j - 1; }
      }
    }
    if (cur.trim()) out.push(cur.trim());
    return out;
  }

  // Translates a text (paragraphs separated by "\n"). Returns the Hindi text
  // and the list of sentences that could not be translated locally.
  function translateText(text) {
    var missing = [];
    var t = KP.stripHtml(text);
    if (!t || !/[A-Za-z]/.test(t)) return { text: t, missing: missing };
    var whole = translateSentence(t);
    if (whole) return { text: whole, missing: missing };
    var paras = t.split(/\n+/).map(function (para) {
      var w = translateSentence(para);
      if (w) return w;
      return splitSentences(para).map(function (s) {
        var h = translateSentence(s);
        if (h) return h;
        missing.push(s);
        return "\u0000" + s + "\u0000";
      }).join(" ");
    });
    return { text: paras.join("\n"), missing: missing };
  }

  // Machine-translation fallback through the site's existing helper, used
  // only for sentences the dictionary does not cover; bounded by a timeout.
  function fallback(sentences) {
    var E = global.KundliEngine;
    var map = {};
    if (!sentences.length || !E || !E.translateToHindi) return Promise.resolve(map);
    var uniq = sentences.filter(function (s, i) { return sentences.indexOf(s) === i; });
    var work = Promise.all(uniq.map(function (s) {
      return E.translateToHindi(s).then(function (h) { if (h && h !== s && !/[A-Za-z]{4,}/.test(h)) map[s] = h; }, function () { /* keep English */ });
    })).then(function () { return map; });
    var timeout = new Promise(function (resolve) { setTimeout(function () { resolve(map); }, 9000); });
    return Promise.race([work, timeout]);
  }

  // Walks a set of accessors, translating each text in place (on a copy).
  function localize(targets) {
    var pending = [];
    var jobs = [];
    targets.forEach(function (tg) {
      var v = tg.get();
      if (v === null || v === undefined) return;
      if (Array.isArray(v)) {
        var arr = v.map(function (x) {
          var r = translateText(KP.textOf(x));
          pending = pending.concat(r.missing);
          return r;
        });
        jobs.push({ set: tg.set, list: arr });
      } else {
        var r = translateText(KP.textOf(v));
        pending = pending.concat(r.missing);
        jobs.push({ set: tg.set, one: r });
      }
    });
    return fallback(pending).then(function (map) {
      var fill = function (r) {
        return r.text.replace(/\u0000([^\u0000]*)\u0000/g, function (all, s) { return map[s] || s; });
      };
      jobs.forEach(function (j) { j.set(j.list ? j.list.map(fill) : fill(j.one)); });
    });
  }

  function acc(obj, key) {
    return { get: function () { return obj ? obj[key] : null; }, set: function (v) { if (obj) obj[key] = v; } };
  }
  function copy(o) { return o ? JSON.parse(JSON.stringify(o)) : o; }

  // ------------------------------------------------------------------
  // Model localization (Hindi reports only)
  // ------------------------------------------------------------------
  KP.localizeKundli = function (R) {
    if (R.lang !== "hi") return Promise.resolve(R);
    ["manglik", "kalsarp", "pitra", "sadeSati", "sadeSatiRemedies", "rudraksha", "numerology"].forEach(function (k) { R[k] = copy(R[k]); });
    var t = [];
    var m = R.manglik;
    if (m) {
      t.push(acc(m, "manglik_report"), acc(m, "manglik_cancel_rule"));
      if (m.manglik_present_rule) t.push(acc(m.manglik_present_rule, "based_on_house"), acc(m.manglik_present_rule, "based_on_aspect"));
    }
    var k = R.kalsarp;
    if (k) {
      t.push(acc(k, "one_line"));
      if (k.report && typeof k.report === "object") t.push(acc(k.report, "report")); else t.push(acc(k, "report"));
      ["name", "type"].forEach(function (f) { if (has(k[f])) k[f] = KP.term(k[f], "hi"); });
    }
    var p = R.pitra;
    if (p) t.push(acc(p, "what_is_pitri_dosha"), acc(p, "conclusion"), acc(p, "rules_matched"), acc(p, "effects"), acc(p, "remedies"));
    if (R.sadeSati) t.push(acc(R.sadeSati, "what_is_sadhesati"), acc(R.sadeSati, "is_undergoing_sadhesati"));
    if (R.sadeSatiRemedies) t.push(acc(R.sadeSatiRemedies, "remedies"), acc(R.sadeSatiRemedies, "what_is_sadhesati"));
    if (R.rudraksha) t.push(acc(R.rudraksha, "name"), acc(R.rudraksha, "recommend"), acc(R.rudraksha, "detail"));
    if (R.numerology && has(R.numerology.fav_mantra)) R.numerology.fav_mantra = KP.hiMantra(R.numerology.fav_mantra) || R.numerology.fav_mantra;
    if (R.det) R.det = Object.assign({}, R.det, { nameAlphabet: KP.hiSyllable(R.det.nameAlphabet) });
    R.person = Object.assign({}, R.person, { place: KP.hiPlace(R.person.place) });
    return localize(t).then(function () { return R; });
  };

  KP.localizeMilan = function (R) {
    if (R.lang !== "hi") return Promise.resolve(R);
    var t = [];
    Object.keys(R.koota || {}).forEach(function (key) {
      R.koota[key] = Object.assign({}, R.koota[key]);
      t.push(acc(R.koota[key], "area"), acc(R.koota[key], "observation"));
    });
    t.push(acc(R, "ashtakootReport"), acc(R, "manglikConclusion"));
    R.dosha = Object.assign({}, R.dosha);
    t.push(acc(R.dosha, "conclusionReport"));
    ["groom", "bride"].forEach(function (side) {
      var pp = R[side] = Object.assign({}, R[side]);
      pp.place = KP.hiPlace(pp.place);
      if (pp.astro) pp.astro = Object.assign({}, pp.astro, { name_alphabet: KP.hiSyllable(pp.astro.name_alphabet) });
      if (pp.manglik) {
        pp.manglik = copy(pp.manglik);
        t.push(acc(pp.manglik, "basedOnHouse"), acc(pp.manglik, "basedOnAspect"), acc(pp.manglik, "cancelRules"), acc(pp.manglik, "report"));
      }
    });
    return localize(t).then(function () { return R; });
  };

  // Exposed for testing coverage.
  KP.hiTranslateText = function (text) { return translateText(text); };
})(window);

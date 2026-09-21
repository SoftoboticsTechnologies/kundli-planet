/*
 * Kundli Planet — Kundli & Kundli Milan data engine.
 * Plain global-scope script (no bundler/module system on this site — see support.js).
 * Exposes window.KundliEngine. All astrology values shown to users must originate
 * from these API calls; never invent planetary/dosha/dasha/prediction data here.
 */
(function (global) {
  "use strict";

  var API_CONFIG = {
    // Live worldwide place search (name -> lat/lon/state/country), backed by
    // GeoNames. Free tier is non-commercial use only (fair-use ~10k calls/day,
    // attribution required) — see https://open-meteo.com/en/pricing before
    // relying on this in a commercial deployment.
    geocodingUrl: "https://geocoding-api.open-meteo.com/v1/search",
    timezoneUrl: "https://cmsch.astroyogi.com/api/VedicPanchang/GetTimezoneDST",
    kundliUrl: "https://cmsch.astroyogi.com/api/VedicPanchang/GetAstroDetail",
    kundliMatchingUrl: "https://cmsch.astroyogi.com/api/VedicPanchang/GetKundliMatching",
    numerologyUrl: "https://cmsch.astroyogi.com/api/VedicPanchang/GetNumeroTable",
    nakshatraPredictionUrl: "https://cmsch.astroyogi.com/api/VedicPanchang/GetDailyNakshatraPredictionDetail",
    planetaryUrl: "https://cmsch.astroyogi.com/api/VedicPanchang/GetPlanetryDetail",
    manglikUrl: "https://cmsch.astroyogi.com/api/VedicPanchang/GetManglik",
    kalsarpaUrl: "https://cmsch.astroyogi.com/api/VedicPanchang/GetKalsarpaDetails",
    pitraDoshUrl: "https://cmsch.astroyogi.com/api/VedicPanchang/GetPitraDoshReport",
    sadeSatiStatusUrl: "https://cmsch.astroyogi.com/api/VedicPanchang/GetSadhesatiCurrentStatus",
    sadeSatiRemediesUrl: "https://cmsch.astroyogi.com/api/VedicPanchang/GetSadhesatiRemedies",
    majorDashaUrl: "https://cmsch.astroyogi.com/api/VedicPanchang/GetMajorVdasha",
    currentDashaUrl: "https://cmsch.astroyogi.com/api/VedicPanchang/GetCurrentDasha",
    gemstoneUrl: "https://cmsch.astroyogi.com/api/VedicPanchang/GetBasicGemSuggestion",
    rudrakshaUrl: "https://cmsch.astroyogi.com/api/VedicPanchang/GetRudrakshaSuggestion"
  };

  // Maps the flat fields actually returned by GetNumeroTable to a localized
  // label key in KT_STRINGS. "name" and "date" are left out since the report
  // already shows the person's name/birth date elsewhere, and this endpoint's
  // own "name" field is not populated by the API regardless of what's sent.
  var NUMEROLOGY_FIELD_MAP = [
    { key: "destiny_number", labelKey: "numerologyDestiny" },
    { key: "radical_number", labelKey: "numerologyRadical" },
    { key: "name_number", labelKey: "numerologyName" },
    { key: "evil_num", labelKey: "numerologyEvil" },
    { key: "fav_color", labelKey: "numerologyColor" },
    { key: "fav_day", labelKey: "numerologyDay" },
    { key: "fav_god", labelKey: "numerologyGod" },
    { key: "fav_mantra", labelKey: "numerologyMantra" },
    { key: "fav_metal", labelKey: "numerologyMetal" },
    { key: "fav_stone", labelKey: "numerologyStone" },
    { key: "fav_substone", labelKey: "numerologySubstone" },
    { key: "friendly_num", labelKey: "numerologyFriendly" },
    { key: "neutral_num", labelKey: "numerologyNeutral" },
    { key: "radical_ruler", labelKey: "numerologyRuler" }
  ];

  // Maps the prediction categories actually returned by
  // GetDailyNakshatraPredictionDetail (inside Data.prediction) to a
  // localized label key. Only categories present in the response are ever
  // rendered by buildNakshatraPredictionCategories.
  var NAKSHATRA_PREDICTION_FIELD_MAP = [
    { key: "health", labelKey: "npHealth" },
    { key: "emotions", labelKey: "npEmotions" },
    { key: "profession", labelKey: "npProfession" },
    { key: "luck", labelKey: "npLuck" },
    { key: "personal_life", labelKey: "npPersonalLife" },
    { key: "travel", labelKey: "npTravel" }
  ];

  // Maps the flat fields actually returned by GetBasicGemSuggestion for each
  // of its three categories (LIFE/BENEFIC/LUCKY) to a localized label key.
  var GEMSTONE_FIELD_MAP = [
    { key: "name", labelKey: "gemstoneName" },
    { key: "semi_gem", labelKey: "gemstoneSemiGem" },
    { key: "wear_finger", labelKey: "gemstoneFinger" },
    { key: "weight_caret", labelKey: "gemstoneWeight" },
    { key: "wear_metal", labelKey: "gemstoneMetal" },
    { key: "wear_day", labelKey: "gemstoneDay" },
    { key: "gem_deity", labelKey: "gemstoneDeity" }
  ];
  var GEMSTONE_CATEGORIES = [
    { key: "LIFE", labelKey: "gemstoneLifeH" },
    { key: "BENEFIC", labelKey: "gemstoneBeneficH" },
    { key: "LUCKY", labelKey: "gemstoneLuckyH" }
  ];

  // Reference photo per traditional gemstone (English + Hindi/Sanskrit
  // aliases), reused from the dedicated Gemstones pages so every suggested
  // stone can show its own image even when the API gives no gem_image.
  var GEM_IMAGE_MAP = {
    "ruby": "uploads/ruby.jpg",
    "manik": "uploads/ruby.jpg",
    "manikya": "uploads/ruby.jpg",
    "pearl": "uploads/pearl.jpg",
    "moti": "uploads/pearl.jpg",
    "red coral": "uploads/red-coral.jpg",
    "coral": "uploads/red-coral.jpg",
    "moonga": "uploads/red-coral.jpg",
    "munga": "uploads/red-coral.jpg",
    "emerald": "https://www.rashi-ratan.com/products/amT-Panna%20(Eemerald)/image-1.jpg",
    "panna": "https://www.rashi-ratan.com/products/amT-Panna%20(Eemerald)/image-1.jpg",
    "yellow sapphire": "https://www.haridwarrudraksha.com/cdn/shop/files/a_272.jpg?v=1767007883",
    "pukhraj": "https://www.haridwarrudraksha.com/cdn/shop/files/a_272.jpg?v=1767007883",
    "diamond": "https://blog.brilliance.com/wp-content/uploads/2017/06/perfect-diamond-isolated-on-shiny-background.jpg",
    "heera": "https://blog.brilliance.com/wp-content/uploads/2017/06/perfect-diamond-isolated-on-shiny-background.jpg",
    "blue sapphire": "uploads/blue-sapphire.jpg",
    "neelam": "uploads/blue-sapphire.jpg",
    "hessonite": "uploads/hessonite.jpg",
    "gomed": "uploads/hessonite.jpg",
    "gomedh": "uploads/hessonite.jpg",
    "cat's eye": "uploads/cats-eye.jpg",
    "cats eye": "uploads/cats-eye.jpg",
    "lehsunia": "uploads/cats-eye.jpg",
    "lahsunia": "uploads/cats-eye.jpg",
    "vaidurya": "uploads/cats-eye.jpg"
  };

  function resolveGemImage(name) {
    if (!name) return null;
    var key = String(name).toLowerCase().trim().replace(/[‘’']/g, "'").replace(/\s+/g, " ");
    if (GEM_IMAGE_MAP[key]) return GEM_IMAGE_MAP[key];
    for (var k in GEM_IMAGE_MAP) {
      if (key.indexOf(k) !== -1) return GEM_IMAGE_MAP[k];
    }
    return null;
  }

  var SIGNS = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];

  // Bilingual UI strings for the Kundli / Kundli Milan tool, shared by the
  // English and Hindi variants of both pages so the tool follows the page's
  // own language toggle instead of being stuck in one language.
  var KT_STRINGS = {
    en: {
      naText: "Data not available",
      kicker: "Free Kundli Generator", title: "Generate Your Kundli",
      subtitle: "Enter exact birth details. Location, timezone and the chart are calculated automatically from what you provide.",
      nameLabel: "Full Name", namePlaceholder: "e.g. Aarav Sharma",
      genderLabel: "Gender", genderMale: "Male", genderFemale: "Female",
      dobLabel: "Date of Birth", tobLabel: "Time of Birth",
      placeLabel: "Birth Place", placePlaceholder: "Start typing a city...",
      noCity: "No matching city found.",
      submit: "Generate Kundli", loading: "Generating your Kundli...",
      errorGeneric: "We couldn't generate your Kundli right now. Please check your birth details and try again.",
      errName: "Please enter the full name.", errGender: "Please select a gender.",
      errDob: "Please choose a date of birth.", errTob: "Please choose a time of birth.",
      errPlace: "Please select a birth place from the suggestions.",
      reportKicker: "Kundli Report", generateAnother: "Generate Another Kundli", reportCrumb: "Report",
      tabBasic: "Basic Details", tabPredictions: "Kundli Predictions", tabPlanets: "Position of Planet",
      tabChart: "Chart", tabDosha: "Dosha", tabDasha: "Dasha", tabRemedies: "Remedies",
      basicDetailsH: "Basic Details", nameF: "Name", genderF: "Gender", birthDateF: "Birth Date",
      birthTimeF: "Birth Time", birthPlaceF: "Birth Place", ascendantF: "Ascendant / Lagna",
      rashiF: "Rashi / Moon Sign", nakshatraF: "Nakshatra",
      kundliDetailsH: "Kundli Details", nakshatraLordF: "Nakshatra Lord", charanF: "Charan / Pada",
      yogF: "Yog", karanF: "Karan", tithiF: "Tithi", tattvaF: "Tattva", yunjaF: "Yunja", payaF: "Paya",
      nameAlphabetF: "Name Alphabet", varnaF: "Varna", ganF: "Gan", nadiF: "Nadi", signLordF: "Sign Lord",
      vashyaF: "Vashya", yoniF: "Yoni", ascendantLordF: "Ascendant Lord",
      favourableH: "Favourable / Numerology",
      numerologyLoading: "Calculating your numerology details...",
      numerologyError: "Numerology details are temporarily unavailable. Please try again later.",
      numerologyDestiny: "Destiny Number", numerologyRadical: "Radical Number", numerologyName: "Name Number",
      numerologyEvil: "Evil Number(s)", numerologyColor: "Lucky Colour", numerologyDay: "Lucky Day(s)",
      numerologyGod: "Favourable God", numerologyMantra: "Favourable Mantra", numerologyMetal: "Lucky Metal",
      numerologyStone: "Lucky Stone", numerologySubstone: "Lucky Sub-stone", numerologyFriendly: "Friendly Numbers",
      numerologyNeutral: "Neutral Numbers", numerologyRuler: "Ruling Planet",
      nakshatraPredictionH: "Daily Nakshatra Prediction",
      nakshatraPredictionSub: "Your personalized daily prediction based on your Nakshatra",
      nakshatraPredictionLoading: "Loading your personalized Nakshatra prediction...",
      nakshatraPredictionError: "Daily Nakshatra prediction is temporarily unavailable. Please try again later.",
      nakshatraPredictionEmpty: "No Nakshatra prediction is available for these birth details at the moment.",
      npHealth: "Health", npEmotions: "Emotions", npProfession: "Career / Profession",
      npLuck: "Luck", npPersonalLife: "Personal Life", npTravel: "Travel",
      manglikLoading: "Checking Manglik Dosha...", manglikError: "Manglik Dosha details are temporarily unavailable. Please try again later.",
      kaalSarpLoading: "Checking Kaal Sarp Dosha...", kaalSarpError: "Kaal Sarp Dosha details are temporarily unavailable. Please try again later.",
      pitraDoshLoading: "Checking Pitra Dosha...", pitraDoshError: "Pitra Dosha details are temporarily unavailable. Please try again later.",
      sadeSatiLoading: "Checking Sade Sati status...", sadeSatiError: "Sade Sati status is temporarily unavailable. Please try again later.",
      dashaLoading: "Loading your Dasha periods...", dashaError: "Dasha details are temporarily unavailable. Please try again later.",
      remediesPitraDosh: "Following are the remedies for Pitra Dosha:",
      remediesSadeSatiListIntro: "Recommended remedies for Sade Sati:",
      gemstoneH: "Gemstone Suggestion", gemstoneLoading: "Loading gemstone suggestions...",
      gemstoneError: "Gemstone suggestions are temporarily unavailable. Please try again later.",
      gemstoneEmpty: "No gemstone suggestion is available for these birth details at the moment.",
      gemstoneLifeH: "Life Stone", gemstoneBeneficH: "Benefic Stone", gemstoneLuckyH: "Lucky Stone",
      gemstoneName: "Gemstone", gemstoneSemiGem: "Semi Gemstone", gemstoneFinger: "Finger",
      gemstoneWeight: "Weight (Carat)", gemstoneMetal: "Metal", gemstoneDay: "Day to Wear", gemstoneDeity: "Ruling Deity",
      rudrakshaH: "Rudraksha Suggestion", rudrakshaLoading: "Loading Rudraksha suggestion...",
      rudrakshaError: "Rudraksha suggestion is temporarily unavailable. Please try again later.",
      rudrakshaEmpty: "No Rudraksha suggestion is available for these birth details at the moment.",
      predictionsH: "Kundli Predictions",
      predictionsBody: "Prediction text (health, career, marriage, finance and so on) is not returned by the connected astrology data source for this chart, so nothing is generated here to avoid showing invented content.",
      planetsH: "Position of Planets", colPlanet: "Planet", colSign: "Sign", colSignLord: "Sign Lord",
      colDegree: "Degree", colNakshatra: "Nakshatra", colNakshatraLord: "Nakshatra Lord", colHouse: "House",
      chartH: "Charts (North Indian Style)",
      chartLagna: "Lagna", chartMoon: "Moon", chartSun: "Sun", chartNavamsa: "Navamsha",
      chartNote1: "House 1 is fixed at the top. Signs are placed anti-clockwise; planets are shown in the house computed for this chart.",
      chartNote2: "Lagna, Moon, Sun and Navamsha (D9) charts are computed from the real planetary degrees returned by the connected data source. Chalit and other cusp-based charts need precise house-cusp data this source does not provide, so they are not shown.",
      doshaH: "Dosha",
      doshaBody: "Manglik, Kaal Sarp, Sade Sati and Pitru Dosha results are not returned by the connected astrology data source, so no verdict is shown here rather than one calculated independently or guessed.",
      manglikH: "Manglik Dosha", kaalSarpH: "Kaal Sarp Dosha", sadeSatiH: "Sade Sati", pitruH: "Pitru Dosha",
      verdictPresent: "Present", verdictNotPresent: "Not Present", verdictActive: "Active", verdictNotActive: "Not Active",
      doshaSummaryH: "Dosha Summary",
      dashaH: "Dasha",
      dashaBody: "Vimshottari Dasha periods (Mahadasha, Antardasha and below) are not returned by the connected astrology data source.",
      currentDashaLabel: "Current Vimshottari Dasha", mahadashaWord: "Mahadasha", antardashaWord: "Antardasha",
      mahadashaTableH: "Full Vimshottari Mahadasha Sequence", colPlanetDasha: "Planet", colStart: "Start Date", colEnd: "End Date",
      dashaNote: "Mahadasha and Antardasha periods and the full sequence below are returned directly by the connected astrology data source.",
      remediesH: "Remedies",
      remediesBody: "Remedy recommendations (gemstone, rudraksha, mantra, yantra) depend on the dosha and dasha analysis above, which the connected data source does not provide.",
      remediesManglik: "Classical texts commonly suggest reciting the Hanuman Chalisa, worship of Hanuman or Mars-related deities on Tuesdays, and in some traditions wearing Red Coral after a qualified astrologer confirms Mars's strength.",
      remediesKaalSarp: "Classical texts commonly suggest Rahu-Ketu shanti puja, chanting the Maha Mrityunjaya mantra, and worship at a Naga temple, particularly on Nag Panchami.",
      remediesNoneText: "None of the doshas checked above (Manglik, Kaal Sarp, Sade Sati) are currently indicated for this chart, so no specific remedy is suggested here.",
      remediesFooter: "Remedies are traditional practice, not a guaranteed remedy in a medical or legal sense.",
      requestReading: "Request a full reading"
    },
    hi: {
      naText: "जानकारी उपलब्ध नहीं है",
      kicker: "मुफ़्त कुंडली जनरेटर", title: "अपनी कुंडली बनाएं",
      subtitle: "सटीक जन्म विवरण दर्ज करें। स्थान, समय क्षेत्र और कुंडली आपके द्वारा दी गई जानकारी से स्वतः गणना की जाती है।",
      nameLabel: "पूरा नाम", namePlaceholder: "उदाहरण: आरव शर्मा",
      genderLabel: "लिंग", genderMale: "पुरुष", genderFemale: "महिला",
      dobLabel: "जन्म तिथि", tobLabel: "जन्म समय",
      placeLabel: "जन्म स्थान", placePlaceholder: "शहर का नाम टाइप करें...",
      noCity: "कोई मिलता-जुलता शहर नहीं मिला।",
      submit: "कुंडली बनाएं", loading: "आपकी कुंडली बनाई जा रही है...",
      errorGeneric: "अभी आपकी कुंडली नहीं बन पाई। कृपया जन्म विवरण जांचें और फिर से प्रयास करें।",
      errName: "कृपया पूरा नाम दर्ज करें।", errGender: "कृपया लिंग चुनें।",
      errDob: "कृपया जन्म तिथि चुनें।", errTob: "कृपया जन्म समय चुनें।",
      errPlace: "कृपया सुझावों में से जन्म स्थान चुनें।",
      reportKicker: "कुंडली रिपोर्ट", generateAnother: "एक और कुंडली बनाएं", reportCrumb: "रिपोर्ट",
      tabBasic: "मूल विवरण", tabPredictions: "कुंडली भविष्यवाणियां", tabPlanets: "ग्रहों की स्थिति",
      tabChart: "चार्ट", tabDosha: "दोष", tabDasha: "दशा", tabRemedies: "उपाय",
      basicDetailsH: "मूल विवरण", nameF: "नाम", genderF: "लिंग", birthDateF: "जन्म तिथि",
      birthTimeF: "जन्म समय", birthPlaceF: "जन्म स्थान", ascendantF: "लग्न",
      rashiF: "राशि / चंद्र राशि", nakshatraF: "नक्षत्र",
      kundliDetailsH: "कुंडली विवरण", nakshatraLordF: "नक्षत्र स्वामी", charanF: "चरण / पाद",
      yogF: "योग", karanF: "करण", tithiF: "तिथि", tattvaF: "तत्व", yunjaF: "युंजा", payaF: "पाया",
      nameAlphabetF: "नाम अक्षर", varnaF: "वर्ण", ganF: "गण", nadiF: "नाड़ी", signLordF: "राशि स्वामी",
      vashyaF: "वश्य", yoniF: "योनि", ascendantLordF: "लग्न स्वामी",
      favourableH: "शुभ / अंक ज्योतिष",
      numerologyLoading: "आपके अंक ज्योतिष विवरण की गणना की जा रही है...",
      numerologyError: "अंक ज्योतिष विवरण फ़िलहाल उपलब्ध नहीं है। कृपया बाद में पुनः प्रयास करें।",
      numerologyDestiny: "भाग्यांक", numerologyRadical: "मूलांक", numerologyName: "नाम अंक",
      numerologyEvil: "अशुभ अंक", numerologyColor: "शुभ रंग", numerologyDay: "शुभ दिन",
      numerologyGod: "आराध्य देव", numerologyMantra: "शुभ मंत्र", numerologyMetal: "शुभ धातु",
      numerologyStone: "शुभ रत्न", numerologySubstone: "उप-रत्न", numerologyFriendly: "मित्र अंक",
      numerologyNeutral: "सम अंक", numerologyRuler: "स्वामी ग्रह",
      nakshatraPredictionH: "दैनिक नक्षत्र भविष्यफल",
      nakshatraPredictionSub: "आपके नक्षत्र पर आधारित व्यक्तिगत दैनिक भविष्यफल",
      nakshatraPredictionLoading: "आपका व्यक्तिगत नक्षत्र भविष्यफल लोड हो रहा है...",
      nakshatraPredictionError: "दैनिक नक्षत्र भविष्यफल फ़िलहाल उपलब्ध नहीं है। कृपया बाद में पुनः प्रयास करें।",
      nakshatraPredictionEmpty: "इन जन्म विवरणों के लिए फ़िलहाल कोई नक्षत्र भविष्यफल उपलब्ध नहीं है।",
      npHealth: "स्वास्थ्य", npEmotions: "भावनाएं", npProfession: "करियर / पेशा",
      npLuck: "भाग्य", npPersonalLife: "व्यक्तिगत जीवन", npTravel: "यात्रा",
      manglikLoading: "मांगलिक दोष की जांच की जा रही है...", manglikError: "मांगलिक दोष विवरण फ़िलहाल उपलब्ध नहीं है। कृपया बाद में पुनः प्रयास करें।",
      kaalSarpLoading: "कालसर्प दोष की जांच की जा रही है...", kaalSarpError: "कालसर्प दोष विवरण फ़िलहाल उपलब्ध नहीं है। कृपया बाद में पुनः प्रयास करें।",
      pitraDoshLoading: "पितृ दोष की जांच की जा रही है...", pitraDoshError: "पितृ दोष विवरण फ़िलहाल उपलब्ध नहीं है। कृपया बाद में पुनः प्रयास करें।",
      sadeSatiLoading: "साढ़े साती की स्थिति जांची जा रही है...", sadeSatiError: "साढ़े साती की स्थिति फ़िलहाल उपलब्ध नहीं है। कृपया बाद में पुनः प्रयास करें।",
      dashaLoading: "आपकी दशा अवधि लोड हो रही है...", dashaError: "दशा विवरण फ़िलहाल उपलब्ध नहीं है। कृपया बाद में पुनः प्रयास करें।",
      remediesPitraDosh: "पितृ दोष के लिए निम्न उपाय हैं:",
      remediesSadeSatiListIntro: "साढ़े साती के लिए अनुशंसित उपाय:",
      gemstoneH: "रत्न सुझाव", gemstoneLoading: "रत्न सुझाव लोड हो रहे हैं...",
      gemstoneError: "रत्न सुझाव फ़िलहाल उपलब्ध नहीं हैं। कृपया बाद में पुनः प्रयास करें।",
      gemstoneEmpty: "इन जन्म विवरणों के लिए फ़िलहाल कोई रत्न सुझाव उपलब्ध नहीं है।",
      gemstoneLifeH: "जीवन रत्न", gemstoneBeneficH: "शुभ रत्न", gemstoneLuckyH: "भाग्य रत्न",
      gemstoneName: "रत्न", gemstoneSemiGem: "उप-रत्न", gemstoneFinger: "उंगली",
      gemstoneWeight: "वजन (कैरेट)", gemstoneMetal: "धातु", gemstoneDay: "धारण दिवस", gemstoneDeity: "स्वामी देवता",
      rudrakshaH: "रुद्राक्ष सुझाव", rudrakshaLoading: "रुद्राक्ष सुझाव लोड हो रहा है...",
      rudrakshaError: "रुद्राक्ष सुझाव फ़िलहाल उपलब्ध नहीं है। कृपया बाद में पुनः प्रयास करें।",
      rudrakshaEmpty: "इन जन्म विवरणों के लिए फ़िलहाल कोई रुद्राक्ष सुझाव उपलब्ध नहीं है।",
      predictionsH: "कुंडली भविष्यवाणियां",
      predictionsBody: "इस कुंडली के लिए स्वास्थ्य, करियर, विवाह, वित्त जैसी भविष्यवाणियां जुड़े हुए ज्योतिष डेटा स्रोत से प्राप्त नहीं होतीं, इसलिए यहां कोई गढ़ी हुई जानकारी नहीं दिखाई गई है।",
      planetsH: "ग्रहों की स्थिति", colPlanet: "ग्रह", colSign: "राशि", colSignLord: "राशि स्वामी",
      colDegree: "अंश", colNakshatra: "नक्षत्र", colNakshatraLord: "नक्षत्र स्वामी", colHouse: "भाव",
      chartH: "कुंडली चार्ट (उत्तर भारतीय शैली)",
      chartLagna: "लग्न", chartMoon: "चंद्र", chartSun: "सूर्य", chartNavamsa: "नवांश",
      chartNote1: "भाव 1 सबसे ऊपर स्थिर है। राशियां वामावर्त क्रम में रखी गई हैं, ग्रह इस चार्ट के लिए गणना किए गए भाव में दिखाए गए हैं।",
      chartNote2: "लग्न, चंद्र, सूर्य और नवांश (D9) चार्ट जुड़े हुए डेटा स्रोत से मिली वास्तविक ग्रह डिग्री से गणना किए गए हैं। चलित और अन्य भाव-सीमा आधारित चार्ट के लिए सटीक भाव-सीमा डेटा चाहिए जो यह स्रोत नहीं देता, इसलिए वे नहीं दिखाए गए।",
      doshaH: "दोष",
      doshaBody: "मांगलिक, कालसर्प, साढ़े साती और पितृ दोष के परिणाम जुड़े हुए ज्योतिष डेटा स्रोत से प्राप्त नहीं होते, इसलिए यहां स्वतंत्र रूप से गणना या अनुमानित निर्णय नहीं दिखाया गया है।",
      manglikH: "मांगलिक दोष", kaalSarpH: "कालसर्प दोष", sadeSatiH: "साढ़े साती", pitruH: "पितृ दोष",
      verdictPresent: "उपस्थित", verdictNotPresent: "अनुपस्थित", verdictActive: "सक्रिय", verdictNotActive: "सक्रिय नहीं",
      doshaSummaryH: "दोष सारांश",
      dashaH: "दशा",
      dashaBody: "विंशोत्तरी दशा अवधि (महादशा, अंतर्दशा आदि) जुड़े हुए ज्योतिष डेटा स्रोत से प्राप्त नहीं होती।",
      currentDashaLabel: "वर्तमान विंशोत्तरी दशा", mahadashaWord: "महादशा", antardashaWord: "अंतर्दशा",
      mahadashaTableH: "पूर्ण विंशोत्तरी महादशा क्रम", colPlanetDasha: "ग्रह", colStart: "आरंभ तिथि", colEnd: "समाप्ति तिथि",
      dashaNote: "महादशा और अंतर्दशा अवधि तथा नीचे दिया गया पूर्ण क्रम सीधे जुड़े हुए ज्योतिष डेटा स्रोत से प्राप्त होता है।",
      remediesH: "उपाय",
      remediesBody: "उपाय सुझाव (रत्न, रुद्राक्ष, मंत्र, यंत्र) ऊपर दिए दोष और दशा विश्लेषण पर निर्भर करते हैं, जो जुड़ा हुआ डेटा स्रोत उपलब्ध नहीं कराता।",
      remediesManglik: "शास्त्रों में सामान्यतः मंगलवार को हनुमान चालीसा पाठ, हनुमान या मंगल संबंधी देवताओं की पूजा, और किसी योग्य ज्योतिषी द्वारा मंगल की स्थिति की पुष्टि के बाद कुछ परंपराओं में मूंगा धारण करने का सुझाव दिया जाता है।",
      remediesKaalSarp: "शास्त्रों में सामान्यतः राहु-केतु शांति पूजा, महामृत्युंजय मंत्र जाप, और विशेषकर नाग पंचमी पर नाग मंदिर में पूजा का सुझाव दिया जाता है।",
      remediesNoneText: "ऊपर जांचे गए दोषों (मांगलिक, कालसर्प, साढ़े साती) में से कोई भी इस कुंडली में वर्तमान में इंगित नहीं होता, इसलिए यहां कोई विशेष उपाय सुझाया नहीं गया है।",
      remediesFooter: "उपाय पारंपरिक अभ्यास हैं, चिकित्सीय या कानूनी अर्थ में गारंटीशुदा समाधान नहीं।",
      requestReading: "पूर्ण विश्लेषण का अनुरोध करें"
    }
  };

  var MT_STRINGS = {
    en: {
      kicker: "Free Kundli Milan", title: "Enter Both Birth Details",
      subtitle: "Location, timezone and each chart are calculated automatically from what you enter below.",
      person1: "Person 1", person2: "Person 2",
      nameLabel: "Full Name", namePlaceholder: "",
      genderLabel: "Gender", genderMale: "Male", genderFemale: "Female",
      dobLabel: "Date of Birth", tobLabel: "Time of Birth",
      placeLabel: "Birth Place", placePlaceholder: "Start typing a city...",
      submit: "Check Kundli Milan", loading: "Calculating Kundli Matching...",
      errorGeneric: "We couldn't calculate the Kundli matching right now. Please check both birth details and try again.",
      errName: "Please enter the full name", errGender: "Please select a gender",
      errDob: "Please choose a date of birth", errTob: "Please choose a time of birth",
      errPlace: "Please select a birth place from the suggestions",
      matchAnother: "Match Another Pair", resultCrumb: "Result",
      summaryH: "Kundli Matching Summary",
      gunaH: "Guna Milan (36-Point Ashtakoot Score)",
      gunaBody: "The connected astrology data source does not currently expose a scoring endpoint for varna, vashya, tara, yoni, graha maitri, gana, bhakoot and nadi koots, so no total or per-koot score is shown here rather than one calculated or invented independently.",
      requestMilan: "Request a full Kundli Milan reading",
      comparisonH: "Planetary Position Comparison",
      comparisonSub: "Real chart data for both people, calculated from what you entered.",
      colPlanet: "Planet", colSign: "Sign", colNakshatra: "Nakshatra", colHouse: "House",
      doshaCompareH: "Manglik, Nadi Dosha & Bhakoot Dosha",
      doshaCompareBody: "These comparisons are not returned by the connected data source, so nothing is shown here rather than guessed.",
      requestReading: "Request a full reading"
    },
    hi: {
      kicker: "मुफ़्त कुंडली मिलान", title: "दोनों के जन्म विवरण दर्ज करें",
      subtitle: "नीचे दी गई जानकारी से स्थान, समय क्षेत्र और प्रत्येक कुंडली स्वतः गणना की जाती है।",
      person1: "व्यक्ति 1", person2: "व्यक्ति 2",
      nameLabel: "पूरा नाम", namePlaceholder: "",
      genderLabel: "लिंग", genderMale: "पुरुष", genderFemale: "महिला",
      dobLabel: "जन्म तिथि", tobLabel: "जन्म समय",
      placeLabel: "जन्म स्थान", placePlaceholder: "शहर का नाम टाइप करें...",
      submit: "कुंडली मिलान देखें", loading: "कुंडली मिलान गणना हो रही है...",
      errorGeneric: "अभी कुंडली मिलान नहीं हो पाया। कृपया दोनों के जन्म विवरण जांचें और फिर से प्रयास करें।",
      errName: "कृपया पूरा नाम दर्ज करें", errGender: "कृपया लिंग चुनें",
      errDob: "कृपया जन्म तिथि चुनें", errTob: "कृपया जन्म समय चुनें",
      errPlace: "कृपया सुझावों में से जन्म स्थान चुनें",
      matchAnother: "दूसरी जोड़ी मिलाएं", resultCrumb: "परिणाम",
      summaryH: "कुंडली मिलान सारांश",
      gunaH: "गुण मिलान (36 अंकों की अष्टकूट प्रणाली)",
      gunaBody: "जुड़ा हुआ ज्योतिष डेटा स्रोत फ़िलहाल वर्ण, वश्य, तारा, योनि, ग्रह मैत्री, गण, भकूट और नाड़ी कूट के लिए स्कोरिंग उपलब्ध नहीं कराता, इसलिए यहां कोई कुल या कूट-वार अंक नहीं दिखाया गया है।",
      requestMilan: "पूर्ण कुंडली मिलान का अनुरोध करें",
      comparisonH: "ग्रह स्थिति तुलना",
      comparisonSub: "आपके द्वारा दी गई जानकारी से गणना किया गया दोनों का वास्तविक कुंडली डेटा।",
      colPlanet: "ग्रह", colSign: "राशि", colNakshatra: "नक्षत्र", colHouse: "भाव",
      doshaCompareH: "मांगलिक, नाड़ी दोष और भकूट दोष",
      doshaCompareBody: "यह तुलना जुड़े हुए डेटा स्रोत से प्राप्त नहीं होती, इसलिए यहां अनुमान लगाकर कुछ नहीं दिखाया गया है।",
      requestReading: "पूर्ण विश्लेषण का अनुरोध करें"
    }
  };

  var PLANET_SYMBOLS = {
    Sun: "☉", Moon: "☽", Mars: "♂", Mercury: "☿", Jupiter: "♃",
    Venus: "♀", Saturn: "♄", Rahu: "☊", Ketu: "☋", Ascendant: "Asc"
  };

  var PLANET_ABBR = {
    Sun: "Su", Moon: "Mo", Mars: "Ma", Mercury: "Me", Jupiter: "Ju",
    Venus: "Ve", Saturn: "Sa", Rahu: "Ra", Ketu: "Ke", Ascendant: "Asc"
  };

  // async function searchBirthPlaces(query) -> live worldwide place search
  // via Open-Meteo's GeoNames-backed geocoding API (name, partial/case-
  // insensitive match -> lat/lon/state/country). Replaces the old approach
  // of pre-loading a bundled India-only place list.
  function searchBirthPlaces(query) {
    var q = String(query || "").trim();
    if (q.length < 2) return Promise.resolve([]);
    var url = API_CONFIG.geocodingUrl + "?" + new URLSearchParams({ name: q, count: 15, language: "en", format: "json" }).toString();
    return fetch(url).then(function (r) {
      if (!r.ok) throw new Error("geocoding HTTP " + r.status);
      return r.json();
    }).then(function (json) {
      var results = (json && json.results) || [];
      return results.map(function (r) {
        return {
          Area: r.name,
          State: r.admin1 || "",
          CountryCode: r.country_code || "",
          Country: r.country || "",
          Lat: r.latitude,
          Long: r.longitude
        };
      });
    }).catch(function (err) {
      console.error("KundliEngine: place search failed", err);
      return [];
    });
  }

  // async function getLocationDetails(place) - place is the raw dataset row already chosen
  function getLocationDetails(place) {
    if (!place) return Promise.reject(new Error("NO_PLACE"));
    return Promise.resolve({
      city: place.Area,
      state: place.State || "",
      country: place.CountryCode || "",
      lat: place.Lat,
      lon: place.Long
    });
  }

  // async function getTimezone(latitude, longitude)
  function getTimezone(latitude, longitude) {
    var url = API_CONFIG.timezoneUrl + "?" + new URLSearchParams({ latitude: latitude, longitude: longitude }).toString();
    return fetch(url)
      .then(function (r) {
        if (!r.ok) throw new Error("timezone HTTP " + r.status);
        return r.json();
      })
      .then(function (json) {
        var d = json && (json.Data || json.data || json);
        var tz = d && (d.TimezoneOffset != null ? d.TimezoneOffset : d.timezone != null ? d.timezone : d.Timezone != null ? d.Timezone : d.dst != null ? d.dst : d.DST);
        var n = Number(tz);
        if (isNaN(n)) throw new Error("TIMEZONE_PARSE_FAILED");
        return n;
      })
      .catch(function (err) {
        console.error("KundliEngine: timezone lookup failed", err);
        throw new Error("TIMEZONE_LOOKUP_FAILED");
      });
  }

  function buildPersonParams(person) {
    return {
      name: person.name, gender: person.gender, day: person.day, month: person.month, year: person.year,
      hour: person.hour, min: person.min, lat: person.lat, lon: person.lon, tzone: person.tzone, city: person.city
    };
  }

  function fetchAstroDetail(person) {
    var url = API_CONFIG.kundliUrl + "?" + new URLSearchParams(buildPersonParams(person)).toString();
    return fetch(url).then(function (r) {
      if (!r.ok) throw new Error("kundli HTTP " + r.status);
      return r.json();
    }).then(function (json) {
      if (!json || json.Status !== "success" || !json.Data) throw new Error("KUNDLI_BAD_RESPONSE");
      return json.Data;
    });
  }

  // The matching endpoint computes an independent ephemeris for each of the two
  // supplied birth records. Used only by fetchKundliMilan for a genuine
  // two-person comparison — single-person planetary data now comes from the
  // dedicated fetchPlanetaryDetail below.
  function fetchPlanetsFor(person) {
    var params = {};
    var pp = buildPersonParams(person);
    Object.keys(pp).forEach(function (k) { params["m_" + k] = pp[k]; params["f_" + k] = pp[k]; });
    var url = API_CONFIG.kundliMatchingUrl + "?" + new URLSearchParams(params).toString();
    return fetch(url).then(function (r) {
      if (!r.ok) throw new Error("planets HTTP " + r.status);
      return r.json();
    }).then(function (json) {
      if (!json || json.Status !== "success" || !json.Data) throw new Error("PLANETS_BAD_RESPONSE");
      return json.Data.male_planet_details || [];
    });
  }

  // GetPlanetryDetail returns planet names in upper case (e.g. "SUN") plus
  // western planets (Uranus/Neptune/Pluto) this site's chart/house/Manglik/
  // Kaal-Sarp model does not use. Normalize casing and keep only the 9
  // classical grahas + Ascendant, same set the site has always displayed.
  var PLANET_NAME_NORMALIZE = {
    SUN: "Sun", MOON: "Moon", MARS: "Mars", MERCURY: "Mercury", JUPITER: "Jupiter",
    VENUS: "Venus", SATURN: "Saturn", RAHU: "Rahu", KETU: "Ketu", ASCENDANT: "Ascendant"
  };
  function fetchPlanetaryDetail(person) {
    var url = API_CONFIG.planetaryUrl + "?" + new URLSearchParams(buildPersonParams(person)).toString();
    return fetch(url).then(function (r) {
      if (!r.ok) throw new Error("planetary HTTP " + r.status);
      return r.json();
    }).then(function (json) {
      if (!json || json.Status !== "success" || !json.Data) throw new Error("PLANETARY_BAD_RESPONSE");
      var raw = json.Data.Planetry || [];
      return raw
        .map(function (p) {
          var normName = PLANET_NAME_NORMALIZE[String(p.name || "").toUpperCase()];
          return normName ? Object.assign({}, p, { name: normName }) : null;
        })
        .filter(Boolean);
    }).catch(function (err) {
      console.error("KundliEngine: fetchPlanetaryDetail failed", err);
      throw new Error("PLANETARY_FETCH_FAILED");
    });
  }

  // async function fetchKundli(personData) -> real, normalized report
  function fetchKundli(personData) {
    return Promise.all([fetchAstroDetail(personData), fetchPlanetaryDetail(personData)])
      .then(function (results) {
        return normalizeKundliResponse({ basic: results[0], planets: results[1], person: personData });
      })
      .catch(function (err) {
        console.error("KundliEngine: fetchKundli failed", err);
        throw new Error("KUNDLI_FETCH_FAILED");
      });
  }

  function val(v, fallback) {
    if (v === null || v === undefined || v === "" || v === "--") return fallback === undefined ? null : fallback;
    return v;
  }

  function degToDM(normDegree) {
    if (normDegree === null || normDegree === undefined || isNaN(normDegree)) return null;
    var d = Math.floor(normDegree);
    var m = Math.round((normDegree - d) * 60);
    if (m === 60) { m = 0; d += 1; }
    return d + "° " + m + "'";
  }

  function signIndex(signName) {
    var i = SIGNS.indexOf(signName);
    return i === -1 ? null : i;
  }

  // Houses relative to any reference sign (Lagna, Moon or Sun), derived
  // purely from each planet's real zodiac sign — not from the API's
  // Lagna-only "house" field, so the same logic works for every chart type.
  function buildHouses(planets, refSignIdx) {
    var houses = [];
    for (var h = 1; h <= 12; h++) {
      var houseSignIdx = refSignIdx === null ? null : (refSignIdx + (h - 1)) % 12;
      houses.push({
        number: h,
        sign: houseSignIdx === null ? null : SIGNS[houseSignIdx],
        signAbbr: houseSignIdx === null ? "" : SIGNS[houseSignIdx].slice(0, 3),
        planets: planets.filter(function (p) {
          return p.signIdx !== null && refSignIdx !== null && ((p.signIdx - refSignIdx + 12) % 12) + 1 === h;
        }).map(function (p) { return PLANET_ABBR[p.name] || p.name.slice(0, 2); })
      });
    }
    return houses;
  }

  // Standard D9 (Navamsha) sign formula: navamsaSign = (rashiIndex*9 + pada) mod 12,
  // pada = which of the 9 equal 3°20' slices of the sign the planet's degree falls in.
  function navamsaSignIndex(signIdx, degreeInSign) {
    if (signIdx === null || degreeInSign === null || degreeInSign === undefined) return null;
    var pada = Math.floor(degreeInSign / (30 / 9));
    if (pada > 8) pada = 8;
    return (signIdx * 9 + pada) % 12;
  }

  // function normalizeKundliResponse(apiResponse) -> internal normalized structure
  function normalizeKundliResponse(apiResponse) {
    var basic = apiResponse.basic || {};
    var rawPlanets = apiResponse.planets || [];
    var person = apiResponse.person || {};

    var ascendantEntry = null;
    var planets = [];
    rawPlanets.forEach(function (p) {
      if (p.name === "Ascendant") { ascendantEntry = p; return; }
      var sIdx = signIndex(p.sign);
      planets.push({
        name: p.name,
        symbol: PLANET_SYMBOLS[p.name] || p.name.slice(0, 2),
        retrograde: String(p.isRetro) === "true",
        sign: val(p.sign),
        signIdx: sIdx,
        signLord: val(p.signLord),
        degree: degToDM(p.normDegree),
        rawDegree: typeof p.fullDegree === "number" ? p.fullDegree : null,
        degreeInSign: typeof p.normDegree === "number" ? p.normDegree : null,
        nakshatra: val(p.nakshatra),
        nakshatraLord: val(p.nakshatraLord),
        nakshatraPada: val(p.nakshatra_pad),
        house: val(p.house)
      });
    });

    var ascendantSign = ascendantEntry ? ascendantEntry.sign : val(basic.ascendant);
    var ascIdx = signIndex(ascendantSign);
    var lagnaHouses = buildHouses(planets, ascIdx);

    var moonPlanet = planets.filter(function (p) { return p.name === "Moon"; })[0] || null;
    var sunPlanet = planets.filter(function (p) { return p.name === "Sun"; })[0] || null;
    var moonHouses = moonPlanet ? buildHouses(planets, moonPlanet.signIdx) : [];
    var sunHouses = sunPlanet ? buildHouses(planets, sunPlanet.signIdx) : [];

    var navPlanets = planets.map(function (p) {
      return Object.assign({}, p, { signIdx: navamsaSignIndex(p.signIdx, p.degreeInSign) });
    });
    var ascNavIdx = ascendantEntry ? navamsaSignIndex(signIndex(ascendantEntry.sign), ascendantEntry.normDegree) : null;
    var navamshaHouses = buildHouses(navPlanets, ascNavIdx);

    return {
      basicDetails: {
        name: val(person.name),
        gender: val(person.gender),
        birthDate: person.day && person.month && person.year ? (String(person.day).padStart(2, "0") + "/" + String(person.month).padStart(2, "0") + "/" + person.year) : null,
        birthTime: person.hour !== undefined ? (String(person.hour).padStart(2, "0") + ":" + String(person.min).padStart(2, "0")) : null,
        birthPlace: val(person.city),
        nakshatra: val(basic.Naksahtra),
        ascendant: val(ascendantSign || basic.ascendant),
        rashi: val(basic.sign)
      },
      kundliDetails: {
        nakshatraLord: val(basic.NaksahtraLord),
        charan: val(basic.Charan),
        yog: val(basic.Yog),
        karan: val(basic.Karan),
        tithi: val(basic.Tithi),
        tattva: val(basic.tatva),
        yunja: val(basic.yunja),
        paya: val(basic.paya),
        nameAlphabet: val(basic.name_alphabet),
        varna: val(basic.Varna),
        gan: val(basic.Gan),
        nadi: val(basic.Nadi),
        signLord: val(basic.SignLord),
        vashya: val(basic.Vashya),
        yoni: val(basic.Yoni),
        ascendantLord: val(basic.ascendant_lord)
      },
      favourable: {},
      predictions: [],
      planets: planets,
      ascendantSign: ascendantSign,
      charts: {
        lagna: { houses: lagnaHouses },
        moon: { houses: moonHouses },
        sun: { houses: sunHouses },
        navamsa: { houses: navamshaHouses }
      },
      moonSign: moonPlanet ? moonPlanet.sign : null
    };
  }

  // async function fetchNumerology(personData) -> raw Data object from GetNumeroTable
  function fetchNumerology(personData) {
    var url = API_CONFIG.numerologyUrl + "?" + new URLSearchParams(buildPersonParams(personData)).toString();
    return fetch(url).then(function (r) {
      if (!r.ok) throw new Error("numerology HTTP " + r.status);
      return r.json();
    }).then(function (json) {
      if (!json || json.Status !== "success" || !json.Data) throw new Error("NUMEROLOGY_BAD_RESPONSE");
      return json.Data;
    }).catch(function (err) {
      console.error("KundliEngine: fetchNumerology failed", err);
      throw new Error("NUMEROLOGY_FETCH_FAILED");
    });
  }

  // function buildNumerologyRows(data, T) -> [{label, value}] for every known
  // field actually present in the API response; unrecognized/missing fields
  // are neither invented nor rendered.
  function buildNumerologyRows(data, T) {
    if (!data) return [];
    return NUMEROLOGY_FIELD_MAP.filter(function (f) {
      var v = data[f.key];
      return v !== null && v !== undefined && v !== "";
    }).map(function (f) {
      return { label: T[f.labelKey], value: String(data[f.key]) };
    });
  }

  // async function fetchNakshatraPrediction(personData) -> raw Data object
  // from GetDailyNakshatraPredictionDetail
  function fetchNakshatraPrediction(personData) {
    var url = API_CONFIG.nakshatraPredictionUrl + "?" + new URLSearchParams(buildPersonParams(personData)).toString();
    return fetch(url).then(function (r) {
      if (!r.ok) throw new Error("nakshatra prediction HTTP " + r.status);
      return r.json();
    }).then(function (json) {
      if (!json || json.Status !== "success" || !json.Data) throw new Error("NAKSHATRA_PREDICTION_BAD_RESPONSE");
      return json.Data;
    }).catch(function (err) {
      console.error("KundliEngine: fetchNakshatraPrediction failed", err);
      throw new Error("NAKSHATRA_PREDICTION_FETCH_FAILED");
    });
  }

  // The AstroYogi prediction endpoint has no language parameter and always
  // returns English text. For the Hindi UI, that English text is translated
  // client-side via MyMemory's free translation API — the underlying
  // prediction content still comes only from the real API response above;
  // this only changes the language it is displayed in.
  var TRANSLATE_CACHE = {};
  function translateToHindi(text) {
    var key = String(text || "").trim();
    if (!key) return Promise.resolve(text);
    if (TRANSLATE_CACHE[key]) return TRANSLATE_CACHE[key];
    // MyMemory's anonymous tier caps each request around 500 chars, so long
    // predictions are split on sentence boundaries and translated in chunks.
    var chunks = [];
    var sentences = key.split(/(?<=[.!?])\s+/);
    var current = "";
    sentences.forEach(function (s) {
      if (current && (current + " " + s).length > 450) { chunks.push(current); current = s; }
      else { current = current ? current + " " + s : s; }
    });
    if (current) chunks.push(current);
    var promise = Promise.all(chunks.map(function (chunk) {
      var url = "https://api.mymemory.translated.net/get?" + new URLSearchParams({ q: chunk, langpair: "en|hi" }).toString();
      return fetch(url).then(function (r) {
        if (!r.ok) throw new Error("translate HTTP " + r.status);
        return r.json();
      }).then(function (json) {
        var translated = json && json.responseData && json.responseData.translatedText;
        return translated ? String(translated) : chunk;
      }).catch(function (err) {
        console.error("KundliEngine: translateToHindi chunk failed", err);
        return chunk;
      });
    })).then(function (translatedChunks) { return translatedChunks.join(" "); });
    TRANSLATE_CACHE[key] = promise;
    return promise;
  }

  // function translateCategoriesToHindi([{label, text}]) -> Promise<[{label, text}]>
  // Labels are already localized by buildNakshatraPredictionCategories; only
  // the API-sourced text is translated.
  function translateCategoriesToHindi(categories) {
    return Promise.all((categories || []).map(function (c) {
      return translateToHindi(c.text).then(function (translated) { return { label: c.label, text: translated }; });
    }));
  }

  // function buildNakshatraPredictionCategories(data, T) -> [{label, text}]
  // for every prediction category actually present in Data.prediction;
  // unrecognized/missing categories are neither invented nor rendered.
  function buildNakshatraPredictionCategories(data, T) {
    var pred = data && data.prediction;
    if (!pred) return [];
    return NAKSHATRA_PREDICTION_FIELD_MAP.filter(function (f) {
      var v = pred[f.key];
      return v !== null && v !== undefined && String(v).trim() !== "";
    }).map(function (f) {
      return { label: T[f.labelKey], text: String(pred[f.key]).trim() };
    });
  }

  // Shared fetch pattern for the simple "birth params in, Data object out"
  // Astroyogi endpoints below — identical error handling to fetchNumerology/
  // fetchNakshatraPrediction, just parameterized by URL and an error label.
  function fetchSimpleEndpoint(url, person, errLabel) {
    var fullUrl = url + "?" + new URLSearchParams(buildPersonParams(person)).toString();
    return fetch(fullUrl).then(function (r) {
      if (!r.ok) throw new Error(errLabel + " HTTP " + r.status);
      return r.json();
    }).then(function (json) {
      if (!json || json.Status !== "success" || !json.Data) throw new Error(errLabel + "_BAD_RESPONSE");
      return json.Data;
    }).catch(function (err) {
      console.error("KundliEngine: " + errLabel + " failed", err);
      throw new Error(errLabel + "_FETCH_FAILED");
    });
  }

  function fetchManglik(person) { return fetchSimpleEndpoint(API_CONFIG.manglikUrl, person, "MANGLIK"); }
  function fetchKalsarpa(person) { return fetchSimpleEndpoint(API_CONFIG.kalsarpaUrl, person, "KALSARPA"); }
  function fetchPitraDosh(person) { return fetchSimpleEndpoint(API_CONFIG.pitraDoshUrl, person, "PITRA_DOSH"); }
  function fetchSadeSatiStatus(person) { return fetchSimpleEndpoint(API_CONFIG.sadeSatiStatusUrl, person, "SADE_SATI_STATUS"); }
  function fetchSadeSatiRemedies(person) { return fetchSimpleEndpoint(API_CONFIG.sadeSatiRemediesUrl, person, "SADE_SATI_REMEDIES"); }
  function fetchMajorDasha(person) { return fetchSimpleEndpoint(API_CONFIG.majorDashaUrl, person, "MAJOR_DASHA"); }
  function fetchCurrentDasha(person) { return fetchSimpleEndpoint(API_CONFIG.currentDashaUrl, person, "CURRENT_DASHA"); }
  function fetchGemstoneSuggestion(person) { return fetchSimpleEndpoint(API_CONFIG.gemstoneUrl, person, "GEMSTONE"); }
  function fetchRudrakshaSuggestion(person) { return fetchSimpleEndpoint(API_CONFIG.rudrakshaUrl, person, "RUDRAKSHA"); }

  // GetMajorVdasha / GetCurrentDasha return dates as "D-M-YYYY  H:M" (no
  // leading zeros, irregular spacing) — not safely parseable by `new Date()`.
  function parseApiDashaDate(str) {
    if (!str) return null;
    var parts = String(str).trim().split(/\s+/);
    var dateParts = (parts[0] || "").split("-").map(Number);
    if (dateParts.length < 3 || dateParts.some(isNaN)) return null;
    var timeParts = (parts[1] || "0:0").split(":").map(Number);
    return new Date(dateParts[2], dateParts[1] - 1, dateParts[0], timeParts[0] || 0, timeParts[1] || 0);
  }

  // function buildMajorDashaRows(data) -> [{planet, start: Date, end: Date}]
  // from GetMajorVdasha's Data.Details, in the real sequence order returned.
  function buildMajorDashaRows(data) {
    var details = (data && data.Details) || [];
    return details.map(function (d) {
      return { planet: d.planet, start: parseApiDashaDate(d.start), end: parseApiDashaDate(d.end) };
    });
  }

  // function buildCurrentDashaLevels(data) -> {major, minor} each
  // {planet, start: Date, end: Date} or null if that level wasn't returned.
  function buildCurrentDashaLevels(data) {
    if (!data) return null;
    var toLevel = function (lvl) {
      return lvl && lvl.planet ? { planet: lvl.planet, start: parseApiDashaDate(lvl.start), end: parseApiDashaDate(lvl.end) } : null;
    };
    return { major: toLevel(data.major), minor: toLevel(data.minor) };
  }

  // function buildGemstoneCategories(data, T) -> [{label, image, rows}] for
  // every category (LIFE/BENEFIC/LUCKY) GetBasicGemSuggestion actually
  // returned, each row list containing only fields actually present.
  function buildGemstoneCategories(data, T) {
    if (!data) return [];
    return GEMSTONE_CATEGORIES.filter(function (c) { return !!data[c.key]; }).map(function (c) {
      var d = data[c.key];
      var rows = GEMSTONE_FIELD_MAP.filter(function (f) {
        var v = d[f.key];
        return v !== null && v !== undefined && String(v).trim() !== "";
      }).map(function (f) {
        return { label: T[f.labelKey], value: String(d[f.key]).trim() };
      });
      return { label: T[c.labelKey], image: resolveGemImage(d.name) || d.gem_image || null, rows: rows };
    });
  }

  // async function fetchKundliMilan(person1, person2)
  // NOTE: No dedicated Ashtakoot/Guna-Milan scoring endpoint was found publicly
  // exposed alongside GetTimezoneDST / GetAstroDetail. GetKundliMatching exists
  // and returns each person's *real* planetary positions, so we use it for a
  // genuine side-by-side chart comparison — but we do NOT compute or display a
  // 36-point guna score ourselves, since that would mean building a second,
  // unverified astrology engine and presenting an unofficial number as if the
  // API produced it. gunaScoreAvailable stays false until a real scoring
  // endpoint is confirmed and wired in here.
  function fetchKundliMilan(person1, person2) {
    var params = {};
    var p1 = buildPersonParams(person1), p2 = buildPersonParams(person2);
    Object.keys(p1).forEach(function (k) { params["m_" + k] = p1[k]; });
    Object.keys(p2).forEach(function (k) { params["f_" + k] = p2[k]; });
    var url = API_CONFIG.kundliMatchingUrl + "?" + new URLSearchParams(params).toString();
    return fetch(url).then(function (r) {
      if (!r.ok) throw new Error("matching HTTP " + r.status);
      return r.json();
    }).then(function (json) {
      if (!json || json.Status !== "success" || !json.Data) throw new Error("MATCHING_BAD_RESPONSE");
      var normPerson1 = normalizeKundliResponse({ basic: {}, planets: json.Data.male_planet_details || [], person: person1 });
      var normPerson2 = normalizeKundliResponse({ basic: {}, planets: json.Data.female_planet_details || [], person: person2 });
      return {
        person1: normPerson1,
        person2: normPerson2,
        gunaScoreAvailable: false,
        gunaScore: null,
        maxGunaScore: 36,
        koots: [],
        manglik: null,
        nadiDosha: null,
        bhakootDosha: null
      };
    }).catch(function (err) {
      console.error("KundliEngine: fetchKundliMilan failed", err);
      throw new Error("MILAN_FETCH_FAILED");
    });
  }

  global.KundliEngine = {
    API_CONFIG: API_CONFIG,
    SIGNS: SIGNS,
    KT_STRINGS: KT_STRINGS,
    MT_STRINGS: MT_STRINGS,
    searchBirthPlaces: searchBirthPlaces,
    getLocationDetails: getLocationDetails,
    getTimezone: getTimezone,
    fetchKundli: fetchKundli,
    fetchKundliMilan: fetchKundliMilan,
    fetchNumerology: fetchNumerology,
    buildNumerologyRows: buildNumerologyRows,
    fetchNakshatraPrediction: fetchNakshatraPrediction,
    buildNakshatraPredictionCategories: buildNakshatraPredictionCategories,
    translateToHindi: translateToHindi,
    translateCategoriesToHindi: translateCategoriesToHindi,
    fetchManglik: fetchManglik,
    fetchKalsarpa: fetchKalsarpa,
    fetchPitraDosh: fetchPitraDosh,
    fetchSadeSatiStatus: fetchSadeSatiStatus,
    fetchSadeSatiRemedies: fetchSadeSatiRemedies,
    fetchMajorDasha: fetchMajorDasha,
    fetchCurrentDasha: fetchCurrentDasha,
    fetchGemstoneSuggestion: fetchGemstoneSuggestion,
    fetchRudrakshaSuggestion: fetchRudrakshaSuggestion,
    buildMajorDashaRows: buildMajorDashaRows,
    buildCurrentDashaLevels: buildCurrentDashaLevels,
    buildGemstoneCategories: buildGemstoneCategories,
    normalizeKundliResponse: normalizeKundliResponse
  };
})(window);

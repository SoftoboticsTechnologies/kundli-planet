/*
 * Kundli Planet — Kundli & Kundli Milan data engine.
 * Plain global-scope script (no bundler/module system on this site — see support.js).
 * Exposes window.KundliEngine. All astrology values shown to users must originate
 * from these API calls; never invent planetary/dosha/dasha/prediction data here.
 */
(function (global) {
  "use strict";

  var API_CONFIG = {
    locationUrl: "https://www.astroyogi.com/assets/static-data/location/tagp.json",
    timezoneUrl: "https://cmsch.astroyogi.com/api/VedicPanchang/GetTimezoneDST",
    kundliUrl: "https://cmsch.astroyogi.com/api/VedicPanchang/GetAstroDetail",
    kundliMatchingUrl: "https://cmsch.astroyogi.com/api/VedicPanchang/GetKundliMatching"
  };

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
      favourableBody: "The connected astrology data source does not currently return numerology or lucky-number information (destiny number, lucky colour, lucky stone etc). Nothing is shown here rather than guessed.",
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
      manglikYes: "Mars is placed in house {h} from the Lagna, one of the classical Manglik houses (1st, 2nd, 4th, 7th, 8th or 12th).",
      manglikNo: "Mars is in house {h} from the Lagna, which is not one of the classical Manglik houses (1st, 2nd, 4th, 7th, 8th or 12th).",
      kaalSarpYes: "All other classical planets fall on one side of the Rahu-Ketu axis. Rahu sits in house {h}, giving the classically named ‘{type}’ pattern.",
      kaalSarpNo: "The classical planets are not all confined to one side of the Rahu-Ketu axis, so Kaal Sarp Dosha is not present in this chart.",
      sadeSatiPhaseRising: "rising phase, 12th from the Moon", sadeSatiPhasePeak: "peak phase, over the Moon sign", sadeSatiPhaseSetting: "setting phase, 2nd from the Moon",
      sadeSatiYes: "Transiting Saturn is currently positioned to trigger Sade Sati — {phase}.",
      sadeSatiNo: "Transiting Saturn is not currently in the 12th, 1st or 2nd sign from the natal Moon, so Sade Sati is not active right now.",
      pitruBody: "Pitru Dosha has no single, universally agreed testable rule in classical texts (unlike Manglik or Kaal Sarp), so it is not evaluated automatically here rather than applying one specific school's opinion as if it were definitive.",
      doshaSummaryH: "Dosha Summary",
      dashaH: "Dasha",
      dashaBody: "Vimshottari Dasha periods (Mahadasha, Antardasha and below) are not returned by the connected astrology data source.",
      currentDashaLabel: "Current Vimshottari Dasha", mahadashaWord: "Mahadasha", antardashaWord: "Antardasha",
      mahadashaTableH: "Full Vimshottari Mahadasha Sequence", colPlanetDasha: "Planet", colStart: "Start Date", colEnd: "End Date",
      dashaNote: "Computed from the Moon's real birth position using the standard Vimshottari formula (nakshatra-based starting lord and balance). Antardasha is shown only for the period currently active.",
      remediesH: "Remedies",
      remediesBody: "Remedy recommendations (gemstone, rudraksha, mantra, yantra) depend on the dosha and dasha analysis above, which the connected data source does not provide.",
      remediesManglik: "Classical texts commonly suggest reciting the Hanuman Chalisa, worship of Hanuman or Mars-related deities on Tuesdays, and in some traditions wearing Red Coral after a qualified astrologer confirms Mars's strength.",
      remediesKaalSarp: "Classical texts commonly suggest Rahu-Ketu shanti puja, chanting the Maha Mrityunjaya mantra, and worship at a Naga temple, particularly on Nag Panchami.",
      remediesSadeSati: "Classical texts commonly suggest Shani mantra japa, donating black sesame, mustard oil or iron on Saturdays, and Hanuman worship, which is traditionally considered protective during Sade Sati.",
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
      favourableBody: "जुड़ा हुआ ज्योतिष डेटा स्रोत फ़िलहाल अंक ज्योतिष या शुभ अंक संबंधी जानकारी (भाग्यांक, शुभ रंग, शुभ रत्न आदि) नहीं देता, इसलिए यहां अनुमान लगाकर कुछ नहीं दिखाया गया है।",
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
      manglikYes: "मंगल लग्न से भाव {h} में स्थित है, जो शास्त्रीय मांगलिक भावों (1, 2, 4, 7, 8, 12) में से एक है।",
      manglikNo: "मंगल लग्न से भाव {h} में स्थित है, जो शास्त्रीय मांगलिक भावों (1, 2, 4, 7, 8, 12) में से नहीं है।",
      kaalSarpYes: "शेष सभी शास्त्रीय ग्रह राहु-केतु अक्ष के एक ओर स्थित हैं। राहु भाव {h} में है, जिससे यह शास्त्रीय ‘{type}’ प्रकार बनता है।",
      kaalSarpNo: "शास्त्रीय ग्रह राहु-केतु अक्ष के एक ही ओर सीमित नहीं हैं, इसलिए इस कुंडली में कालसर्प दोष उपस्थित नहीं है।",
      sadeSatiPhaseRising: "उदय चरण, चंद्रमा से 12वीं राशि", sadeSatiPhasePeak: "शिखर चरण, चंद्र राशि पर", sadeSatiPhaseSetting: "अस्त चरण, चंद्रमा से दूसरी राशि",
      sadeSatiYes: "गोचर शनि वर्तमान में साढ़े साती को सक्रिय करने की स्थिति में है — {phase}।",
      sadeSatiNo: "गोचर शनि वर्तमान में जन्म चंद्र राशि से 12वीं, 1ली या 2री राशि में नहीं है, इसलिए साढ़े साती अभी सक्रिय नहीं है।",
      pitruBody: "पितृ दोष के लिए शास्त्रों में मांगलिक या कालसर्प जैसा कोई एक सर्वमान्य, जांचने योग्य नियम नहीं है, इसलिए इसे यहां स्वचालित रूप से नहीं आंका गया, ताकि किसी एक मत को निश्चित निर्णय की तरह प्रस्तुत न किया जाए।",
      doshaSummaryH: "दोष सारांश",
      dashaH: "दशा",
      dashaBody: "विंशोत्तरी दशा अवधि (महादशा, अंतर्दशा आदि) जुड़े हुए ज्योतिष डेटा स्रोत से प्राप्त नहीं होती।",
      currentDashaLabel: "वर्तमान विंशोत्तरी दशा", mahadashaWord: "महादशा", antardashaWord: "अंतर्दशा",
      mahadashaTableH: "पूर्ण विंशोत्तरी महादशा क्रम", colPlanetDasha: "ग्रह", colStart: "आरंभ तिथि", colEnd: "समाप्ति तिथि",
      dashaNote: "चंद्रमा की वास्तविक जन्म स्थिति से मानक विंशोत्तरी सूत्र (नक्षत्र आधारित प्रारंभिक स्वामी और शेष अवधि) द्वारा गणना की गई। अंतर्दशा केवल वर्तमान में सक्रिय अवधि के लिए दिखाई गई है।",
      remediesH: "उपाय",
      remediesBody: "उपाय सुझाव (रत्न, रुद्राक्ष, मंत्र, यंत्र) ऊपर दिए दोष और दशा विश्लेषण पर निर्भर करते हैं, जो जुड़ा हुआ डेटा स्रोत उपलब्ध नहीं कराता।",
      remediesManglik: "शास्त्रों में सामान्यतः मंगलवार को हनुमान चालीसा पाठ, हनुमान या मंगल संबंधी देवताओं की पूजा, और किसी योग्य ज्योतिषी द्वारा मंगल की स्थिति की पुष्टि के बाद कुछ परंपराओं में मूंगा धारण करने का सुझाव दिया जाता है।",
      remediesKaalSarp: "शास्त्रों में सामान्यतः राहु-केतु शांति पूजा, महामृत्युंजय मंत्र जाप, और विशेषकर नाग पंचमी पर नाग मंदिर में पूजा का सुझाव दिया जाता है।",
      remediesSadeSati: "शास्त्रों में सामान्यतः शनि मंत्र जाप, शनिवार को काले तिल, सरसों तेल या लोहे का दान, और हनुमान पूजा का सुझाव दिया जाता है, जिसे परंपरागत रूप से साढ़े साती में सुरक्षात्मक माना जाता है।",
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

  // ---- Location dataset: fetched once, cached in memory ----
  var _locationCache = null;
  var _locationPromise = null;

  function loadLocations() {
    if (_locationCache) return Promise.resolve(_locationCache);
    if (_locationPromise) return _locationPromise;
    _locationPromise = fetch(API_CONFIG.locationUrl)
      .then(function (r) {
        if (!r.ok) throw new Error("location dataset HTTP " + r.status);
        return r.json();
      })
      .then(function (data) {
        _locationCache = Array.isArray(data) ? data : [];
        return _locationCache;
      })
      .catch(function (err) {
        _locationPromise = null;
        console.error("KundliEngine: failed to load location dataset", err);
        throw new Error("LOCATION_LOAD_FAILED");
      });
    return _locationPromise;
  }

  // async function searchBirthPlaces(query)
  function searchBirthPlaces(query) {
    var q = String(query || "").trim().toLowerCase();
    if (q.length < 2) return Promise.resolve([]);
    return loadLocations().then(function (list) {
      var scored = [];
      for (var i = 0; i < list.length; i++) {
        var row = list[i];
        var area = (row.Area || "").toLowerCase();
        var idx = area.indexOf(q);
        if (idx === -1) continue;
        var score = idx === 0 ? 0 : (area.charAt(idx - 1) === " " ? 1 : 2);
        scored.push({ row: row, score: score, len: area.length });
      }
      scored.sort(function (a, b) { return a.score - b.score || a.len - b.len; });
      return scored.slice(0, 20).map(function (s) { return s.row; });
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
  // supplied birth records. Passing the same person twice yields that one
  // person's real planetary positions — used for the single-person chart/table.
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

  // Used only to read today's real transiting Saturn sign for the Sade Sati
  // check. Coordinates/timezone barely affect a planet's zodiac SIGN (as
  // opposed to its house), so the birth person's own location is reused
  // rather than asking for a second location.
  function fetchCurrentSaturnSign(referencePerson) {
    var now = new Date();
    var todayPerson = {
      name: "Transit", gender: "Male",
      day: now.getDate(), month: now.getMonth() + 1, year: now.getFullYear(),
      hour: now.getHours(), min: now.getMinutes(),
      lat: referencePerson.lat, lon: referencePerson.lon, tzone: referencePerson.tzone, city: referencePerson.city
    };
    return fetchPlanetsFor(todayPerson).then(function (planets) {
      var saturn = planets.filter(function (p) { return p.name === "Saturn"; })[0];
      return saturn ? signIndex(saturn.sign) : null;
    }).catch(function (err) {
      console.error("KundliEngine: current transit lookup failed", err);
      return null;
    });
  }

  // async function fetchKundli(personData) -> real, normalized report
  function fetchKundli(personData) {
    return Promise.all([fetchAstroDetail(personData), fetchPlanetsFor(personData), fetchCurrentSaturnSign(personData)])
      .then(function (results) {
        return normalizeKundliResponse({ basic: results[0], planets: results[1], person: personData, currentSaturnSignIdx: results[2] });
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

  var NAKSHATRA_SPAN = 360 / 27;
  var DASHA_SEQUENCE = ["Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury"];
  var DASHA_YEARS = { Ketu: 7, Venus: 20, Sun: 6, Moon: 10, Mars: 7, Rahu: 18, Jupiter: 16, Saturn: 19, Mercury: 17 };
  var YEAR_MS = 365.25 * 24 * 60 * 60 * 1000;

  function addYears(date, years) { return new Date(date.getTime() + years * YEAR_MS); }

  // Standard Vimshottari Mahadasha/Antardasha computation from the Moon's real
  // sidereal longitude at birth (fullDegree) — a fixed, published formula, not
  // an invented result. Antardasha is only computed for the currently active
  // Mahadasha to keep the output focused on "where this person is right now".
  function computeVimshottariDasha(moonFullDegree, birthDate) {
    if (moonFullDegree === null || moonFullDegree === undefined || !birthDate) return null;
    var nakIndex = Math.floor(moonFullDegree / NAKSHATRA_SPAN) % 27;
    var lordIndex = nakIndex % 9;
    var fractionElapsed = (moonFullDegree % NAKSHATRA_SPAN) / NAKSHATRA_SPAN;
    var balanceYears = (1 - fractionElapsed) * DASHA_YEARS[DASHA_SEQUENCE[lordIndex]];

    var mahadashas = [];
    var cursor = new Date(birthDate.getTime());
    for (var i = 0; i < 9; i++) {
      var planet = DASHA_SEQUENCE[(lordIndex + i) % 9];
      var years = i === 0 ? balanceYears : DASHA_YEARS[planet];
      var start = new Date(cursor.getTime());
      var end = addYears(cursor, years);
      mahadashas.push({ planet: planet, start: start, end: end });
      cursor = end;
    }

    var now = new Date();
    var current = mahadashas.filter(function (m) { return now >= m.start && now < m.end; })[0] || mahadashas[mahadashas.length - 1];
    var antardashas = [];
    if (current) {
      var totalYears = DASHA_YEARS[current.planet];
      var startLordIdx = DASHA_SEQUENCE.indexOf(current.planet);
      var aCursor = new Date(current.start.getTime());
      for (var j = 0; j < 9; j++) {
        var aPlanet = DASHA_SEQUENCE[(startLordIdx + j) % 9];
        var aYears = totalYears * (DASHA_YEARS[aPlanet] / 120);
        var aStart = new Date(aCursor.getTime());
        var aEnd = addYears(aCursor, aYears);
        antardashas.push({ planet: aPlanet, start: aStart, end: aEnd });
        aCursor = aEnd;
      }
    }
    var currentAntardasha = antardashas.filter(function (a) { return now >= a.start && now < a.end; })[0] || antardashas[antardashas.length - 1];

    return {
      mahadashas: mahadashas,
      currentMahadasha: current,
      antardashas: antardashas,
      currentAntardasha: currentAntardasha
    };
  }

  // Manglik: classical rule is Mars placed in house 1, 2, 4, 7, 8 or 12
  // counted from the Lagna, and separately from the Moon — the same rule
  // already published on this site's own Mangal Dosha page.
  var MANGLIK_HOUSES = [1, 2, 4, 7, 8, 12];
  function computeManglik(lagnaHouses, moonHouses) {
    var findMarsHouse = function (houses) {
      var h = houses.filter(function (h) { return h.planets.indexOf("Ma") !== -1; })[0];
      return h ? h.number : null;
    };
    var fromLagna = findMarsHouse(lagnaHouses);
    var fromMoon = findMarsHouse(moonHouses);
    return {
      fromLagnaHouse: fromLagna,
      fromMoonHouse: fromMoon,
      isManglikFromLagna: fromLagna !== null && MANGLIK_HOUSES.indexOf(fromLagna) !== -1,
      isManglikFromMoon: fromMoon !== null && MANGLIK_HOUSES.indexOf(fromMoon) !== -1
    };
  }

  var KAAL_SARP_TYPES = ["Anant", "Kulik", "Vasuki", "Shankhpal", "Padma", "Mahapadma", "Takshak", "Karkotak", "Shankhachur", "Ghatak", "Vishdhar", "Sheshnag"];
  // Kaal Sarp: present when every classical planet (Sun..Saturn) sits on one
  // side of the Rahu-Ketu axis — the same rule published on this site's own
  // Kaal Sarp Dosha page.
  function computeKaalSarp(planets, lagnaHouses) {
    var rahu = planets.filter(function (p) { return p.name === "Rahu"; })[0];
    var ketu = planets.filter(function (p) { return p.name === "Ketu"; })[0];
    var others = planets.filter(function (p) { return ["Rahu", "Ketu"].indexOf(p.name) === -1; });
    if (!rahu || !ketu || others.some(function (p) { return p.rawDegree === null; })) {
      return { checked: false };
    }
    var rahuDeg = rahu.rawDegree, ketuDeg = ketu.rawDegree;
    var inArc = function (deg, from, to) {
      if (from < to) return deg > from && deg < to;
      return deg > from || deg < to;
    };
    var allOneSide = others.every(function (p) { return inArc(p.rawDegree, rahuDeg, ketuDeg); });
    var allOtherSide = others.every(function (p) { return inArc(p.rawDegree, ketuDeg, rahuDeg); });
    var present = allOneSide || allOtherSide;
    var rahuHouseEntry = lagnaHouses.filter(function (h) { return h.planets.indexOf("Ra") !== -1; })[0];
    var rahuHouse = rahuHouseEntry ? rahuHouseEntry.number : null;
    return {
      checked: true,
      present: present,
      rahuHouse: rahuHouse,
      typeName: present && rahuHouse ? KAAL_SARP_TYPES[rahuHouse - 1] : null
    };
  }

  // Sade Sati: classical rule is transiting Saturn in the 12th, 1st or 2nd
  // sign from the natal Moon sign — the standard published definition.
  function computeSadeSati(moonSignIdx, currentSaturnSignIdx) {
    if (moonSignIdx === null || currentSaturnSignIdx === null || currentSaturnSignIdx === undefined) return { checked: false };
    var diff = (currentSaturnSignIdx - moonSignIdx + 12) % 12;
    var active = diff === 11 || diff === 0 || diff === 1;
    var phaseKey = diff === 11 ? "rising" : diff === 0 ? "peak" : diff === 1 ? "setting" : null;
    return { checked: true, active: active, phaseKey: phaseKey };
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

    var birthDate = (person.year && person.month && person.day)
      ? new Date(person.year, person.month - 1, person.day, person.hour || 0, person.min || 0)
      : null;
    var dasha = moonPlanet ? computeVimshottariDasha(moonPlanet.rawDegree, birthDate) : null;

    var manglik = computeManglik(lagnaHouses, moonHouses);
    var kaalSarp = computeKaalSarp(planets, lagnaHouses);
    var sadeSati = computeSadeSati(moonPlanet ? moonPlanet.signIdx : null, apiResponse.currentSaturnSignIdx);

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
      doshas: { manglik: manglik, kaalSarp: kaalSarp, sadeSati: sadeSati },
      dasha: dasha,
      remedies: []
    };
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
    normalizeKundliResponse: normalizeKundliResponse
  };
})(window);

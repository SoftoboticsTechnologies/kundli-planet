/*
 * Kundli Planet — supplementary third-party astrology API integrations.
 * Plain global-scope script (no bundler/module system on this site — see support.js).
 * Exposes window.AstroAPIs. Separate from kundli-engine.js (AstroYogi-backed
 * birth-chart/numerology engine used by Kundli.dc.html) — these are the
 * lighter public feeds used for the Panchang, Festivals and Horoscope pages.
 */
(function (global) {
  "use strict";

  var ASTRO_APIS = {
    panchang: {
      baseUrl: "https://nityapanchangam.com/api/panchangam.php",
      method: "GET",
      requiresApiKey: false
    },
    festivals: {
      baseUrl: "https://indian-festival-api.vercel.app/api/festivals",
      method: "GET",
      requiresApiKey: false
    },
    zodiac: {
      baseUrl: "https://api.cosmyday.com/content/daily",
      method: "GET",
      requiresApiKey: false
    },
    natal: {
      baseUrl: "https://api.cosmyday.com/natal",
      method: "POST",
      requiresApiKey: false
    },
    numerology: {
      baseUrl: "https://api.freeastroapi.com/api/v1/numerology/profile",
      method: "POST",
      requiresApiKey: true,
      apiKey: "" // set via AstroAPIs.setNumerologyApiKey(key) before calling fetchNumerology
    }
  };

  function setNumerologyApiKey(key) {
    ASTRO_APIS.numerology.apiKey = key || "";
  }

  function toQuery(params) {
    var qs = new URLSearchParams();
    Object.keys(params || {}).forEach(function (k) {
      if (params[k] !== undefined && params[k] !== null && params[k] !== "") qs.set(k, params[k]);
    });
    var s = qs.toString();
    return s ? "?" + s : "";
  }

  // date: "YYYY-MM-DD", lat/lng: numbers
  function fetchPanchang(date, lat, lng) {
    var url = ASTRO_APIS.panchang.baseUrl + toQuery({ date: date, lat: lat, lng: lng });
    return fetch(url).then(function (r) {
      if (!r.ok) throw new Error("panchang HTTP " + r.status);
      return r.json();
    }).catch(function (err) {
      console.error("AstroAPIs: fetchPanchang failed", err);
      throw new Error("PANCHANG_FETCH_FAILED");
    });
  }

  // opts: { month, date, state }, religion is fixed to "hindu"
  function fetchFestivals(opts) {
    opts = opts || {};
    var url = ASTRO_APIS.festivals.baseUrl + toQuery({
      religion: "hindu", month: opts.month, date: opts.date, state: opts.state
    });
    return fetch(url).then(function (r) {
      if (!r.ok) throw new Error("festivals HTTP " + r.status);
      return r.json();
    }).catch(function (err) {
      console.error("AstroAPIs: fetchFestivals failed", err);
      throw new Error("FESTIVALS_FETCH_FAILED");
    });
  }

  // sign: e.g. "aries"
  function fetchDailyZodiac(sign) {
    var url = ASTRO_APIS.zodiac.baseUrl + toQuery({ sign: sign });
    return fetch(url).then(function (r) {
      if (!r.ok) throw new Error("zodiac HTTP " + r.status);
      return r.json();
    }).catch(function (err) {
      console.error("AstroAPIs: fetchDailyZodiac failed", err);
      throw new Error("ZODIAC_FETCH_FAILED");
    });
  }

  // payload: { date, time, lat, lng, ... } per cosmyday natal API
  function fetchNatal(payload) {
    return fetch(ASTRO_APIS.natal.baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload || {})
    }).then(function (r) {
      if (!r.ok) throw new Error("natal HTTP " + r.status);
      return r.json();
    }).catch(function (err) {
      console.error("AstroAPIs: fetchNatal failed", err);
      throw new Error("NATAL_FETCH_FAILED");
    });
  }

  // payload: { name, date, ... } per freeastroapi numerology profile endpoint
  function fetchNumerology(payload) {
    if (!ASTRO_APIS.numerology.apiKey) return Promise.reject(new Error("NUMEROLOGY_API_KEY_MISSING"));
    return fetch(ASTRO_APIS.numerology.baseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-api-key": ASTRO_APIS.numerology.apiKey },
      body: JSON.stringify(payload || {})
    }).then(function (r) {
      if (!r.ok) throw new Error("numerology HTTP " + r.status);
      return r.json();
    }).catch(function (err) {
      console.error("AstroAPIs: fetchNumerology failed", err);
      throw new Error("NUMEROLOGY_FETCH_FAILED");
    });
  }

  global.AstroAPIs = {
    CONFIG: ASTRO_APIS,
    setNumerologyApiKey: setNumerologyApiKey,
    fetchPanchang: fetchPanchang,
    fetchFestivals: fetchFestivals,
    fetchDailyZodiac: fetchDailyZodiac,
    fetchNatal: fetchNatal,
    fetchNumerology: fetchNumerology
  };
})(window);

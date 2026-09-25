/* Kundli Planet - consultation form submission.
   Plain global-scope script (no bundler on this site - see support.js).
   Exposes window.KPContactForm.

   Sends the consultation form to the Softobotics Contact Form API, which
   emails it to the inbox registered for this site's domain. The API only
   accepts registered domains (checked from the browser's Origin header), so
   kundliplanet.in must be listed in its domains.ts; submissions from
   127.0.0.1 / localhost are rejected with "Domain ... is not allowed". */
(function (global) {
  "use strict";

  var ENDPOINT = "https://k5iewetbri.execute-api.ap-south-1.amazonaws.com/prod/contact";

  var LABELS = {
    en: {
      send: "Send by Email", sending: "Sending...",
      sent: "Thank you! Your message has been sent. Our team will contact you soon.",
      needName: "Please enter your name.",
      needContact: "Please enter your phone number or email so we can reach you.",
      badEmail: "Please enter a valid email address.",
      badPhone: "Please enter a valid phone number.",
      failed: "Could not send your message. Please try again, or send it on WhatsApp."
    },
    hi: {
      send: "ईमेल से भेजें", sending: "भेजा जा रहा है...",
      sent: "धन्यवाद! आपका संदेश भेज दिया गया है। हमारी टीम जल्द ही आपसे संपर्क करेगी।",
      needName: "कृपया अपना नाम लिखें।",
      needContact: "कृपया अपना फ़ोन नंबर या ईमेल लिखें ताकि हम आपसे संपर्क कर सकें।",
      badEmail: "कृपया सही ईमेल पता लिखें।",
      badPhone: "कृपया सही फ़ोन नंबर लिखें।",
      failed: "आपका संदेश नहीं भेजा जा सका। कृपया पुनः प्रयास करें, या व्हाट्सएप पर भेजें।"
    }
  };

  function trim(v) { return String(v == null ? "" : v).trim(); }

  // Returns a LABELS key describing the first problem, or "" when valid.
  function validate(form) {
    var name = trim(form.name), phone = trim(form.phone), email = trim(form.email);
    if (!name) return "needName";
    if (!phone && !email) return "needContact";
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return "badEmail";
    if (phone && phone.replace(/\D/g, "").length < 10) return "badPhone";
    return "";
  }

  // Posts the submission. Each field becomes one line in the email; "email"
  // becomes the reply-to address. Resolves on success, rejects otherwise.
  function send(data) {
    var body = {
      name: trim(data.name),
      phoneNumber: trim(data.phone),
      email: trim(data.email),
      subject: trim(data.subject),
      message: trim(data.message),
      language: data.lang === "hi" ? "Hindi" : "English",
      page: document.title,
      pageUrl: global.location.href
    };
    if (!body.email) delete body.email;
    return fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    }).then(function (res) {
      return res.json().catch(function () { return {}; }).then(function (out) {
        if (!res.ok || out.success === false) {
          throw new Error((out.errors && out.errors.join("; ")) || ("Contact form failed (HTTP " + res.status + ")"));
        }
        return out;
      });
    });
  }

  // View values for the form's send button and status message.
  // status: "idle" | "sending" | "sent" | "error"; error: a LABELS key.
  function view(lang, status, error) {
    var L = lang === "hi" ? LABELS.hi : LABELS.en;
    var busy = status === "sending";
    var msg = status === "sent" ? L.sent : status === "error" ? (L[error] || L.failed) : "";
    var ok = status === "sent";
    return {
      sendLabel: busy ? L.sending : L.send,
      sendBusy: busy,
      sendOpacity: busy ? "0.7" : "1",
      sendHasMsg: Boolean(msg),
      sendMsg: msg,
      sendMsgBg: ok ? "#EAF6EC" : "#FBEAE9",
      sendMsgColor: ok ? "#1E6B34" : "#8A2A24",
      sendMsgBorder: ok ? "#C5E6CC" : "#F0C9C6"
    };
  }

  global.KPContactForm = { endpoint: ENDPOINT, validate: validate, send: send, view: view };
})(window);

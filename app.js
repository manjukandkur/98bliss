/* 98 Bliss Visitors - phone app loader.
 * The screens are the same gate.html / owner.html as the Google version; only the start and the server calls differ:
 * the start data ("boot") and every call go to the Apps Script as plain JSON posts (no Google page, so no
 * "Sorry, unable to open the file" with two Google accounts, and no grey Google bar). */
(function () {
  var API = window.APP_API;
  function api(fn, k, args, p) {
    return fetch(API, { method: "POST", credentials: "omit", redirect: "follow",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({ fn: fn, k: k, p: p || "", args: args || [] }) })
      .then(function (r) { if (!r.ok) throw new Error("Network problem (" + r.status + ") - check the internet and try again"); return r.json(); })
      .then(function (j) { if (!j.ok) throw new Error(j.error || "Something went wrong"); return j.result; })
      .catch(function (e) { throw new Error(e && e.message === "Failed to fetch" ? "No connection - check the internet and try again" : (e && e.message) || String(e)); });
  }
  window.appCall = function (fn, args) { return api(fn, window.BOOT.k, args); };
  function stop(msg) {
    document.body.innerHTML = '<div style="font:17px -apple-system,Segoe UI,Roboto,Arial;padding:28px;color:#0f172a"><h2 style="margin:0 0 10px">98 Bliss</h2><p>' +
      msg + '</p><button onclick="location.reload()" style="margin-top:12px;padding:12px 18px;font-size:16px;border-radius:10px;border:0;background:#1d4ed8;color:#fff">Try again</button></div>';
  }
  var q = new URLSearchParams(location.search);
  var k = q.get("k") || "";
  try { if (k) localStorage.setItem("bliss98_k", k); else k = localStorage.getItem("bliss98_k") || ""; } catch (e) {}
  if (!k) { document.addEventListener("DOMContentLoaded", function () { stop("Open the 98 Bliss link the owner sent you (it ends in ?k=…)."); }); return; }
  var base = location.href.replace(/[?#].*$/, "").replace(/[^/]*$/, "");
  var here = /owner\.html$/.test(location.pathname) ? "owner" : "gate";
  // 1 Oct 2026 "slight lag": switching between the gate and office tabs waited for Google every time. The start data is kept
  // on the phone per link + screen, so the screen draws at once and Google is asked in the background. (Every server call
  // still checks the link itself, so a switched-off link stops working at its next action.)
  var want = q.get("p") || (here === "owner" ? "owner" : "");
  var ckFor = function (pg, w) { return "bliss98_boot_" + k.slice(-12) + "_" + pg + "_" + (w === "owner" ? "owner" : ""); };
  var ck = ckFor(here, want);
  var cached = null;
  try { cached = JSON.parse(localStorage.getItem(ck) || "null"); } catch (e) {}
  var fresh = api("boot", k, [], want).then(function (b) { try { localStorage.setItem(ck, JSON.stringify(b)); } catch (e) {} return b; });
  if (cached && cached.page) {
    fresh.then(function (b) { if (b.page !== cached.page || b.role !== cached.role) location.reload(); },
      function (e) { if (/not valid|switched off/i.test(e && e.message)) { try { localStorage.removeItem(ck); } catch (x) {} location.reload(); } });
    fresh = Promise.resolve(cached);
  }
  try { var pf = document.createElement("link"); pf.rel = "prefetch"; pf.href = here === "owner" ? "index.html" : "owner.html"; document.head.appendChild(pf); } catch (e) {}
  fresh.then(function (b) {
    if (b.page !== here) { location.replace(base + (b.page === "owner" ? "owner.html" : "") + "?k=" + encodeURIComponent(k) + (b.page === "owner" ? "&p=owner" : "") + location.hash); return; }
    b.url = base; // links inside the screens ("Owner page", "Gate") stay inside the app
    window.BOOT = b;
    var run = function () {
      var s = document.createElement("script");
      s.text = document.getElementById("main").text;
      document.body.appendChild(s);
    };
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run); else run();
    // warm the OTHER screen's start data too, so the first switch to it is also instant
    if (b.full) setTimeout(function () {
      var w = here === "owner" ? "gate" : "owner";
      api("boot", k, [], w).then(function (x) {
        try { (w === "owner" ? [ckFor("gate", "owner"), ckFor("owner", "owner")] : [ckFor("gate", "")]).forEach(function (c) { localStorage.setItem(c, JSON.stringify(x)); }); } catch (e) {}
      }, function () {});
    }, 1500);
  }).catch(function (e) {
    var go = function () { stop(e.message); };
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", go); else go();
  });
})();

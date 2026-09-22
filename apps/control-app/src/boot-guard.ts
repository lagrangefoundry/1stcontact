/**
 * The boot guard (REQ-149) — a builder that cannot start says so IN THE PAGE.
 *
 * WHAT IT IS FOR. Three unrelated faults produced one indistinguishable symptom:
 * a blank white page.
 *
 *   - an asset in the import graph 404s (`dist-assets` not built, or built
 *     stale) — the module graph never loads;
 *   - `/api/sites` refuses — `main.js` awaits it at TOP LEVEL, so the module
 *     rejects and nothing mounts;
 *   - `mountBuilder` throws.
 *
 * In every case the document itself arrives 200, so the browser shows a page
 * that loaded perfectly and does nothing, with the reason reachable only by
 * opening devtools. An operator's first experience of a fresh store was a blank
 * screen and no way to tell which of the three had happened.
 *
 * IT IS A STRING, AND IT IS INLINE. Serving it as a file would make the
 * diagnostic depend on the assets binding — the very thing most likely to be
 * broken when it is needed. Inline in the chrome document, it runs off the same
 * bytes that already arrived.
 *
 * IT IS ES5 AND HAS NO IMPORTS, deliberately. This is the code that runs when
 * the modern module path has already failed; anything it needed to load, or any
 * syntax an older engine choked on, would be one more way for it to fail
 * silently and leave the operator exactly where they started.
 *
 * IT NEVER TOUCHES THE BUILDER, IN EITHER DIRECTION ([[BUG-135]]). The original
 * promise was half a promise: every write re-checked that `#app` was empty, so a
 * builder that mounted FIRST was never overwritten — and nothing at all covered
 * the builder mounting SECOND, which is the case that actually occurs in
 * production. The panel went inside `#app` as an unclassed first child, ahead of
 * everything the shell laid out, and the chat composer rendered with no input at
 * all. Three things close it:
 *
 *   - the guard renders into its OWN fixed-position element on `document.body`,
 *     never into `#app`, so whatever it shows cannot participate in the
 *     builder's layout however wrong it is;
 *   - it watches `#app` after it has spoken and RETRACTS when the builder
 *     arrives, so the promise holds in both directions;
 *   - and it no longer treats a clock as evidence — see below.
 *
 * A DEADLINE IS NOT EVIDENCE OF FAILURE ([[BUG-135]]). Four seconds was enough on
 * localhost and is not enough through Cloudflare Access with the composer's
 * cross-origin engine on the mount path, so a slow-but-healthy production
 * builder was reported as broken — worse than silence, because it sends the
 * reader looking for a fault that is not there. The guard now says "did not
 * start" only when it has caught an actual fault (a failed load, a rejected
 * top-level await, a throw); slowness with no fault in evidence reads as
 * slowness. Raising the deadline is part of that change and not the change: the
 * larger number buys margin, the split between the two messages is what makes
 * the sentence true.
 *
 * IT SAYS WHICH KIND OF SLOW, because `main.js` tells it. A module graph that
 * never ran and one that ran and is waiting on the server are indistinguishable
 * from inside the guard, so `main.js` records its progress in an attribute
 * (`BOOT_PHASE_ATTR`) and the guard reads it. The attribute is written as a
 * literal there rather than imported — `main.js` is browser source that nothing
 * bundles — and a UAT pins the two spellings together.
 *
 * ITS MATCHERS SAY `tenant` AND ITS SENTENCES SAY *business* ([[REQ-180]] §3),
 * and the mismatch is deliberate rather than a half-finished rename. `hintFor`
 * matches against `UnknownTenantError`'s own text — a string the STORE owns,
 * internal vocabulary, which must keep matching what is actually thrown or the
 * hint silently stops appearing. What it renders is read by a person, and
 * `tenant` never reaches one. The remaining `TENANT_ID` hint is exempt for the
 * opposite reason: it names a configuration variable the operator types, and §3
 * declines to buy a migration to rename one.
 */

/**
 * How long before the guard says anything at all.
 *
 * This is a "you are still waiting" threshold, not a verdict, so it can stay
 * short: the note it produces claims nothing the guard cannot see.
 */
export const BOOT_NOTICE_MS = 4000

/**
 * How long before a fault the guard has CAUGHT is reported as a failed boot.
 *
 * It gates a fault rather than replacing one, because an error event is not on
 * its own proof of a dead page — a stylesheet that 404s fires one and the
 * builder mounts fine. Waiting means the common non-fatal case has mounted and
 * been seen to mount before anything is said about it.
 */
export const BOOT_DEADLINE_MS = 12000

/** How often the guard re-checks `#app` once it has something on screen. */
export const BOOT_WATCH_MS = 250

/** The element the builder mounts into. Must match `chrome.ts`. */
export const APP_ID = 'app'

/** The guard's own element. Never inside `#app` — that is the whole of BUG-135. */
export const GUARD_ID = 'boot-guard'

/**
 * Where `main.js` records how far its own boot has got, and the two values it
 * writes. On `documentElement` rather than a global so it is visible in the
 * element inspector of a browser whose console the operator has not opened.
 */
export const BOOT_PHASE_ATTR = 'data-builder-boot'
/** The module body is running: every import resolved, the server has not answered. */
export const BOOT_PHASE_LOADING = 'loading'
/** The answers are in hand and the builder is drawing. */
export const BOOT_PHASE_MOUNTING = 'mounting'

/**
 * The guard, as source. Exported rather than written straight into `chrome.ts`
 * so a UAT can run it against a real DOM instead of asserting the presence of a
 * string nobody has executed.
 */
export const BOOT_GUARD = `(function () {
  var APP = ${JSON.stringify(APP_ID)};
  var GUARD = ${JSON.stringify(GUARD_ID)};
  var PHASE = ${JSON.stringify(BOOT_PHASE_ATTR)};
  var NOTICE = ${BOOT_NOTICE_MS};
  var DEADLINE = ${BOOT_DEADLINE_MS};
  var WATCH = ${BOOT_WATCH_MS};

  var failure = null;
  var expired = false;   // the deadline has passed
  var asking = false;    // the API probe is in flight
  var retracted = false; // the builder arrived; the guard is finished
  var shown = '';        // what is on screen, so a re-render that changes nothing does nothing
  var watching = null;   // the handle of the #app watch, once there is something to withdraw

  function note(what) {
    if (failure || !what) { return; }
    failure = String(what);
    // A fault that arrives AFTER the deadline is still a fault. The original
    // guard looked once and never again, so a module that 404ed at eight
    // seconds was never reported at all.
    if (expired) { speak(); }
  }

  // Capture phase, because a failed script/stylesheet fires its error event on
  // the ELEMENT and those do not bubble. This is the one that catches a 404ed
  // module — the most common cause and the one with the least visible symptom.
  window.addEventListener('error', function (e) {
    var t = e.target;
    if (t && t !== window && (t.src || t.href)) { note('could not load ' + (t.src || t.href)); }
    else { note(e.message); }
  }, true);

  // A top-level await that rejects surfaces here and nowhere else.
  window.addEventListener('unhandledrejection', function (e) {
    var r = e.reason;
    note((r && r.message) || r);
  });

  function mounted() {
    var el = document.getElementById(APP);
    return !el || el.childElementCount > 0;
  }

  function escape(text) {
    return String(text == null ? '' : text)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function hintFor(reason, api) {
    // Named causes only. A generic "check the console" would be the same
    // non-answer the blank page already gave.
    if (/could not load/.test(reason || '')) {
      return 'An asset the builder imports is missing. Run <code>1c assets</code>, then restart the builder — the assets manifest is read at startup.';
    }
    if (/no tenant/i.test(api || '')) {
      return 'The store has no business registered yet. Run <code>bin/copy-from-cloud &lt;business&gt;</code> to bring a site down, which registers one.';
    }
    if (/TENANT_ID/.test(api || '')) {
      return 'TENANT_ID is not configured for this deployment. See apps/control-app/wrangler.toml.';
    }
    return null;
  }

  // Fixed, on document.body, with nothing of the page's own layout to disturb.
  var PILL_STYLE = 'position:fixed;left:1rem;bottom:1rem;z-index:2147483647;' +
    'max-width:30rem;font:13px/1.5 ui-monospace,SFMono-Regular,Menlo,monospace;' +
    'background:#111;color:#f4f4f5;padding:.6rem .85rem;border-radius:.4rem;' +
    'box-shadow:0 2px 12px rgba(0,0,0,.3)';
  // 'top/right/bottom/left' rather than the 'inset' shorthand, for the same
  // reason this file is ES5: the guard runs where other things have failed.
  var PANEL_STYLE = 'position:fixed;top:0;right:0;bottom:0;left:0;z-index:2147483647;' +
    'overflow:auto;background:#fff;color:#111';

  function element() {
    var el = document.getElementById(GUARD);
    if (!el) {
      el = document.createElement('div');
      el.id = GUARD;
      document.body.appendChild(el);
      watch();
    }
    return el;
  }

  function put(style, html) {
    if (retracted || mounted()) { return; }
    if (html === shown) { return; }
    var el = element();
    el.setAttribute('style', style);
    el.innerHTML = html;
    shown = html;
  }

  function retract() {
    retracted = true;
    var el = document.getElementById(GUARD);
    if (el && el.parentNode) { el.parentNode.removeChild(el); }
    if (watching) { window.clearInterval(watching); watching = null; }
  }

  function watch() {
    if (watching) { return; }
    // A poll, not a MutationObserver: this is the code that runs when the modern
    // path has already failed, and one property read every quarter second is the
    // smallest mechanism that cannot itself become the reason nothing happens.
    // It doubles as the refresh for the waiting note, whose sentence changes as
    // 'main.js' gets further.
    watching = window.setInterval(function () {
      if (mounted()) { retract(); return; }
      if (!failure) { waiting(); }
    }, WATCH);
  }

  function waiting() {
    var phase = document.documentElement.getAttribute(PHASE);
    var what =
      phase === ${JSON.stringify(BOOT_PHASE_MOUNTING)}
        ? 'It has its data and is drawing.'
        : phase === ${JSON.stringify(BOOT_PHASE_LOADING)}
          ? 'Its code has loaded; it is waiting on the server.'
          : 'Its code is still loading.';
    put(PILL_STYLE,
      '<strong>Still loading the builder…</strong> ' + what +
      '<br><span style="opacity:.7">Nothing has failed — this note goes away by itself.</span>');
  }

  function failed(reason, api) {
    var hint = hintFor(reason, api);
    put(PANEL_STYLE,
      '<div style="font:14px/1.6 ui-monospace,SFMono-Regular,Menlo,monospace;padding:2rem;max-width:60rem">' +
      '<h1 style="font-size:1.05rem;margin:0 0 1rem">The builder did not start.</h1>' +
      (reason ? '<p style="margin:0 0 .75rem"><strong>What failed:</strong> ' + escape(reason) + '</p>' : '') +
      (api ? '<p style="margin:0 0 .75rem"><strong>GET /api/sites:</strong> ' + escape(api) + '</p>' : '') +
      (hint ? '<p style="margin:0 0 .75rem;padding:.75rem;background:#f4f4f5;border-left:3px solid #999">' + hint + '</p>' : '') +
      '<p style="margin:0;color:#666">The document loaded; its client did not. Full detail is in the browser console.</p>' +
      '</div>');
  }

  // The API is asked ONLY once a fault is in evidence, so a healthy load costs
  // nothing and the answer describes the failure rather than a state that has
  // since moved on.
  function probe(done) {
    try {
      window.fetch('/api/sites', { headers: { accept: 'application/json' } }).then(
        function (r) {
          return r.text().then(function (body) { return r.status + ' ' + body.slice(0, 300); });
        },
        function (err) { return 'unreachable (' + ((err && err.message) || err) + ')'; }
      ).then(done, function () { done(null); });
    } catch (err) { done(null); }
  }

  function speak() {
    if (retracted || mounted()) { return; }
    // No fault caught means no fault to report. Slow is slow, and saying so is
    // the whole of BUG-135: a clock is not evidence.
    if (!failure) { waiting(); return; }
    if (asking) { return; }
    asking = true;
    probe(function (api) { failed(failure, api); });
  }

  window.setTimeout(function () {
    if (retracted || mounted()) { return; }
    waiting();
  }, NOTICE);

  window.setTimeout(function () {
    expired = true;
    speak();
  }, DEADLINE);
})();`

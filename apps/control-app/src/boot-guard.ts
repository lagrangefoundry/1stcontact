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
 * IT NEVER HIDES A WORKING BUILDER. Every path checks that `#app` is still empty
 * immediately before writing, so a slow-but-successful mount is never replaced
 * by an error panel it raced.
 */

/** How long to let the module graph mount before concluding it will not. */
export const BOOT_DEADLINE_MS = 4000

/** The element the builder mounts into. Must match `chrome.ts`. */
export const APP_ID = 'app'

/**
 * The guard, as source. Exported rather than written straight into `chrome.ts`
 * so a UAT can run it against a real DOM instead of asserting the presence of a
 * string nobody has executed.
 */
export const BOOT_GUARD = `(function () {
  var APP = ${JSON.stringify(APP_ID)};
  var DEADLINE = ${BOOT_DEADLINE_MS};
  var failure = null;

  function note(what) { if (!failure && what) { failure = String(what); } }

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

  function stillEmpty() {
    var el = document.getElementById(APP);
    return !!el && el.childElementCount === 0;
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
      return 'The store has no tenant yet. Run <code>bin/publish &lt;slug&gt;</code> to import a site, which registers it.';
    }
    if (/TENANT_ID/.test(api || '')) {
      return 'TENANT_ID is not configured for this deployment. See apps/control-app/wrangler.toml.';
    }
    return null;
  }

  function render(reason, api) {
    if (!stillEmpty()) { return; }
    var hint = hintFor(reason, api);
    document.getElementById(APP).innerHTML =
      '<div style="font:14px/1.6 ui-monospace,SFMono-Regular,Menlo,monospace;padding:2rem;max-width:60rem;color:#111">' +
      '<h1 style="font-size:1.05rem;margin:0 0 1rem">The builder did not start.</h1>' +
      (reason ? '<p style="margin:0 0 .75rem"><strong>What failed:</strong> ' + escape(reason) + '</p>' : '') +
      (api ? '<p style="margin:0 0 .75rem"><strong>GET /api/sites:</strong> ' + escape(api) + '</p>' : '') +
      (hint ? '<p style="margin:0 0 .75rem;padding:.75rem;background:#f4f4f5;border-left:3px solid #999">' + hint + '</p>' : '') +
      '<p style="margin:0;color:#666">The document loaded; its client did not. Full detail is in the browser console.</p>' +
      '</div>';
  }

  // The API is asked ONLY once the page is already known to be broken, so a
  // healthy load costs nothing and the answer describes the failure rather than
  // a state that has since moved on.
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

  window.setTimeout(function () {
    if (!stillEmpty()) { return; }
    probe(function (api) { render(failure, api); });
  }, DEADLINE);
})();`

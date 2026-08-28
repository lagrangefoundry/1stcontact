/**
 * REQ-154 — the page-scope scripts a {@link BrowserDriver} runs, as strings,
 * shared by every driver implementation.
 *
 * WHY THEY LIVE HERE RATHER THAN IN A DRIVER. These are not driver mechanics;
 * they are the *capture preconditions* DOC-13 depends on — the page has been
 * scrolled so lazy content exists, entrance animations have landed, and every
 * visible run is painting its real face rather than a fallback. A second driver
 * that re-implemented them would drift, and the drift would not surface as a
 * failure: the capture would still succeed and would simply measure the wrong
 * page. Sharing the exact source is what keeps a cloud capture and a laptop
 * capture the same capture.
 *
 * STRINGS, NOT FUNCTIONS, because the two drivers evaluate through different
 * libraries whose `evaluate` overloads do not agree on a function type. Every
 * script here is a self-contained *expression* — an IIFE where it needs
 * statements — so `evaluate(script)` works uniformly. They are written in ES5-ish
 * page JS on purpose: they run in whatever browser is on the other end, not in
 * this bundle.
 */

/**
 * BUG-16 — the pre-extraction web-font barrier.
 *
 * The early `document.fonts.ready` await a driver performs right after `goto`
 * runs *before* {@link SETTLE_SCROLL} scrolls and reveals below-fold content, so
 * a face first needed by a revealed run starts loading only afterwards and is
 * still a fallback (FOUT) at measure time — corrupting both `font-family` and
 * the glyph-derived box metrics of that run. This barrier runs right *before*
 * extraction/screenshot: it force-loads the exact face of every visible text run
 * (family + real weight + style + the run's own text, so a subsetted webfont
 * fetches the subset it actually paints), then awaits `document.fonts.ready`.
 * Bounded throughout — a face that genuinely 404s/times out cannot hang the
 * capture; it stays unresolved and is honestly reported `fontLoaded:false`.
 */
export const FONT_BARRIER = `(async () => {
  if (!(document.fonts && document.fonts.ready)) return true;
  var generic = /^(serif|sans-serif|monospace|cursive|fantasy|system-ui|ui-|inherit|initial|unset|-apple-system|blinkmacsystemfont)/i;
  function primaryFamily(ff) { return (ff || '').split(',')[0].trim().replace(/^['"]|['"]$/g, ''); }
  function bounded(p, ms) {
    return Promise.race([
      Promise.resolve(p).catch(function () {}),
      new Promise(function (res) { setTimeout(res, ms); }),
    ]);
  }
  if (document.fonts.load && document.body) {
    var seen = {}, loads = [];
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null), n;
    while ((n = walker.nextNode())) {
      var text = (n.nodeValue || '').replace(/\\s+/g, ' ').trim();
      if (!text) continue;
      var el = n.parentElement;
      if (!el) continue;
      var s = getComputedStyle(el);
      if (s.display === 'none' || s.visibility === 'hidden') continue;
      var fam = primaryFamily(s.fontFamily);
      if (!fam || generic.test(fam)) continue;
      var style = s.fontStyle && s.fontStyle !== 'normal' ? s.fontStyle + ' ' : '';
      var weight = parseInt(s.fontWeight, 10) || 400;
      var shorthand = style + weight + ' ' + s.fontSize + ' "' + fam + '"';
      var key = shorthand + '::' + text;
      if (seen[key]) continue;
      seen[key] = 1;
      try { loads.push(document.fonts.load(shorthand, text)); } catch (e) {}
    }
    await bounded(Promise.allSettled(loads), 4000);
  }
  await bounded(document.fonts.ready, 2000);
  return true;
})()`

/** The early, cheap font await a driver performs immediately after `goto`. */
export const FONTS_READY =
  'document.fonts && document.fonts.ready ? document.fonts.ready.then(function(){return true}) : true'

/**
 * REQ-36 — land any triggered entrance animation on its final frame instantly,
 * and reveal Elementor's `.elementor-invisible` pre-animation state, so a
 * `fadeIn` block shows its content instead of `opacity: 0`. Injected as a style
 * tag rather than evaluated, so it applies to elements revealed later too.
 */
export const SETTLE_CSS =
  '*,*::before,*::after{animation-delay:0s!important;animation-duration:0s!important;transition-delay:0s!important;transition-duration:0s!important;}.elementor-invisible{visibility:visible!important;opacity:1!important;}'

/**
 * REQ-36 — scroll the full height in viewport steps to trip lazy-load / entrance
 * IntersectionObservers, return to the top, and promote any residual lazy image
 * to eager. Without it, below-fold images and animated text are captured blank
 * and the reference screenshot silently omits real content.
 */
export const SETTLE_SCROLL = `(async () => {
  var sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  var step = window.innerHeight || 800;
  for (var y = 0; y < document.body.scrollHeight; y += step) {
    window.scrollTo(0, y);
    await sleep(120);
  }
  window.scrollTo(0, 0);
  var imgs = Array.prototype.slice.call(document.images);
  for (var i = 0; i < imgs.length; i++) {
    var img = imgs[i];
    img.loading = 'eager';
    var ds = img.getAttribute('data-src');
    if (ds && !img.currentSrc) img.src = ds;
  }
  return true;
})()`

/**
 * Wait for every image to finish decoding — the lazy ones were only requested
 * moments ago, during {@link SETTLE_SCROLL}.
 */
export const IMAGES_DECODED = `Promise.all(
  Array.prototype.slice.call(document.images).map(function (img) {
    return img.complete
      ? Promise.resolve()
      : new Promise(function (res) {
          img.addEventListener('load', function () { res(); }, { once: true });
          img.addEventListener('error', function () { res(); }, { once: true });
        });
  })
).then(function () { return true; })`

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
 *
 * REQ-377 — and make every scroll the settle performs INSTANT. A page that
 * declares `html{scroll-behavior:smooth}` turns each `scrollTo` into an animation
 * that returns before it has moved, so the stepped scroll never reached the
 * positions it was stepping through and the return to the top was still in
 * flight when the page was measured (see {@link SCROLL_TO_TOP}).
 */
export const SETTLE_CSS =
  'html,body{scroll-behavior:auto!important;}*,*::before,*::after{animation-delay:0s!important;animation-duration:0s!important;transition-delay:0s!important;transition-duration:0s!important;}.elementor-invisible{visibility:visible!important;opacity:1!important;}'

/**
 * REQ-377 — put the page back at scroll 0, and WAIT until it is there.
 *
 * Every box the extractor records is `r.top + window.scrollY`: right for an
 * in-flow box at any scroll, and wrong for a `position: sticky` / `fixed` one
 * at any scroll but 0, which is stuck to the viewport and so travels with the
 * scroll. Under `html{scroll-behavior:smooth}` a bare `scrollTo(0, 0)`
 * STARTS AN ANIMATION AND RETURNS, and nothing after it waited: on
 * hearingzone510.com the sticky header was recorded at fifteen different y values
 * across fifteen page loads of one bundle (1336.6 in `capture.json`, 12.6 to
 * 401.7 across the projections), because each read caught the animation at a
 * different point.
 *
 * So the return is `behavior: 'instant'` (which overrides the page's smooth
 * scrolling for this one call, as {@link SETTLE_CSS}'s
 * `scroll-behavior:auto` does for every other), and then a bounded poll for
 * `scrollY === 0` — a page script can still be animating its own scroll, and
 * the poll is what makes "at rest" a fact rather than a hope. Resolves to the
 * `scrollY` it ended at, so a page that refuses to go home is visible to the
 * caller instead of silently measured.
 */
export const SCROLL_TO_TOP = `(async () => {
  var home = function () {
    try { window.scrollTo({ top: 0, left: 0, behavior: 'instant' }); } catch (e) { window.scrollTo(0, 0); }
  };
  var at = function () { return (window.scrollY || window.pageYOffset || 0) + (window.scrollX || window.pageXOffset || 0); };
  home();
  for (var i = 0; i < 40 && at() !== 0; i++) {
    await new Promise(function (r) { setTimeout(r, 50); });
    home();
  }
  return window.scrollY || window.pageYOffset || 0;
})()`

/**
 * REQ-36 — scroll the full height in viewport steps to trip lazy-load / entrance
 * IntersectionObservers, return to the top, and promote any residual lazy image
 * to eager. REQ-377 — the return is {@link SCROLL_TO_TOP}, which waits for it.
 * Without it, below-fold images and animated text are captured blank
 * and the reference screenshot silently omits real content.
 */
export const SETTLE_SCROLL = `(async () => {
  var sleep = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };
  var step = window.innerHeight || 800;
  for (var y = 0; y < document.body.scrollHeight; y += step) {
    window.scrollTo(0, y);
    await sleep(120);
  }
  // REQ-377 -- home, and wait until the page is actually there (see SCROLL_TO_TOP).
  await ${SCROLL_TO_TOP};
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

/**
 * REQ-370 — land a scroll-reveal pre-state the scroll did not clear.
 *
 * {@link SETTLE_CSS} names Elementor's pre-animation class, and every other
 * builder spells its own: Zyro hides a revealed image with
 * `.transition--root-hidden [data-animation-role=image]{opacity:0;transform:translateY(20%)}`,
 * cleared only once its observer marks it active AND loaded — which the stepped
 * scroll did not leave it in. Three photographs on hearingzone510.com were
 * therefore missing from the reference screenshot AND from the oracle: zero
 * pixels, zero deltas, nothing anywhere but an unreferenced mirrored asset.
 *
 * REQ-371 — and not only images. Zyro's text, forms and footers slide in the same
 * way (`.transition--slide:not([data-animation-state=active]){opacity:0;
 * transform:translateY(20%)}`), and on bluelotusintegralhealing.com 19 of 29
 * wrappers were never activated: two of six sections — a contact form, a
 * mailing-list form, the copyright line, the logo — captured empty.
 *
 * So the rule is the pre-state's SIGNATURE rather than a class name: an element
 * that is fully transparent AND displaced by a transform — "hidden, and waiting to
 * slide in" — holding something to see: copy, a decoded image, or a control, with
 * a real box. Opacity alone is not enough: a fading carousel parks its inactive
 * slides at `opacity: 0` with no transform, and revealing them would stack every
 * slide on the active one. A carousel ancestor is skipped outright for the same
 * reason, and so is an element also made unreachable (`visibility: hidden`,
 * `pointer-events: none`) — a closed dropdown, not a reveal.
 *
 * Each element it lands is marked `data-1c-revealed`, so what the settle changed
 * stays visible in the rendered DOM. Returns how many it landed.
 */
export const REVEAL_MEDIA = `(() => {
  var carousel = /(^|[\\s_-])(carousel|slider|swiper|slick|splide|glide|flickity)([\\s_-]|$)/i;
  var area = function (el) { var r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
  var holdsContent = function (el) {
    if ((el.textContent || '').trim() && area(el)) return true;
    var imgs = el.tagName === 'IMG' ? [el] : Array.prototype.slice.call(el.getElementsByTagName('img'));
    for (var i = 0; i < imgs.length; i++) {
      if (imgs[i].complete && (imgs[i].naturalWidth > 0 || imgs[i].currentSrc) && area(imgs[i])) return true;
    }
    var controls = el.querySelectorAll('input,textarea,select,button,svg,video,iframe');
    for (var j = 0; j < controls.length; j++) if (area(controls[j])) return true;
    return false;
  };
  var inCarousel = function (el) {
    for (; el && el !== document.body; el = el.parentElement) {
      if (carousel.test(el.getAttribute('class') || '') || el.getAttribute('aria-roledescription') === 'carousel') return true;
    }
    return false;
  };
  var landed = 0;
  var all = Array.prototype.slice.call(document.body.getElementsByTagName('*'));
  for (var k = 0; k < all.length; k++) {
    var el = all[k];
    var s = getComputedStyle(el);
    if (!(parseFloat(s.opacity) === 0 && s.transform && s.transform !== 'none')) continue;
    // A closed menu or dropdown parks the same way but is also made unreachable;
    // a reveal wrapper is not.
    if (s.visibility === 'hidden' || s.pointerEvents === 'none') continue;
    if (inCarousel(el) || !holdsContent(el)) continue;
    el.style.setProperty('opacity', '1', 'important');
    el.style.setProperty('transform', 'none', 'important');
    el.setAttribute('data-1c-revealed', '');
    landed++;
  }
  return landed;
})()`

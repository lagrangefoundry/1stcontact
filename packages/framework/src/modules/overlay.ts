/**
 * Header-over-hero compositing (REQ-25, DOC-7 framework).
 *
 * A `header` instance with variant `overlay` is not rendered as its own band.
 * Instead the render pipeline floats it across the top of the *immediately
 * following* module's band, so the header (top chrome / wordmark) and the next
 * section (e.g. a hero `bg-image`) share one continuous background band rather
 * than stacking as two separate bands.
 *
 *   fc-overlay-band                 (positioning context)
 *   ├─ fc-overlay-band__chrome      (the transparent header, absolute, z 3)
 *   └─ <the following module's band> (supplies the shared image / background)
 *
 * The header renders transparent (its `overlay` variant fills nothing and drops
 * its border), so the band behind it shows through continuously. Legibility over
 * the shared image reuses the REQ-14 overlay mechanism carried by that band — no
 * instance-supplied CSS reaches the page; the only rules here are the static,
 * per-site-identical structural block in {@link OVERLAY_BAND_CSS}.
 */

/** Structural CSS for the overlay band. Static; identical for every site. */
export const OVERLAY_BAND_CSS = `/* header-over-hero overlay band (REQ-25) */
.fc-overlay-band { position: relative; }
/* The chrome spans the full band (REQ-52) so it is the positioning context for a
   header whose wordmark carries a free position — a wordmark at top: N% then maps
   to N% of the shared band, the same coordinate space as the hero's own objects.
   The header bar itself still renders at the band top (normal block flow inside
   the chrome), so every existing overlay site is visually unchanged. The chrome
   is pointer-transparent (it now covers the whole band); its interactive
   descendants re-enable pointer events so nav/links still work and the hero
   content below stays clickable. */
.fc-overlay-band__chrome {
  position: absolute;
  inset: 0;
  z-index: 3;
  pointer-events: none;
}
.fc-overlay-band__chrome a,
.fc-overlay-band__chrome button {
  pointer-events: auto;
}`

/**
 * Composite an `overlay` header's rendered HTML over the following module's
 * band. The chrome is absolutely positioned across the top of the band, so it
 * takes no vertical space — the following section's `spacingTop` reserves the
 * room its content needs to clear the chrome. Reading order keeps the header
 * first in the DOM.
 */
export function composeOverlayHeader(headerHtml: string, bandHtml: string): string {
  return `<div class="fc-overlay-band"><div class="fc-overlay-band__chrome">${headerHtml}</div>${bandHtml}</div>`
}

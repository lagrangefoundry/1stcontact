import type { Background } from '@1stcontact/site-schema'

/**
 * Section-background rendering (REQ-14, DOC-7 framework, DOC-13 §4).
 *
 * A background is structured data on a module instance; the framework — never
 * the instance — turns it into scoped CSS. A background wraps a module's markup
 * in three stacked layers so text stays legible over busy imagery:
 *
 *   fc-bg-section
 *   ├─ fc-bg-section__layer    (color | image | gradient, z 0)
 *   ├─ fc-bg-section__overlay  (optional tint,            z 1)
 *   └─ fc-bg-section__content  (the module's markup,      z 2)
 *
 * The layer and overlay styles are per-instance (they differ by color / asset /
 * gradient), so they are emitted as framework-computed inline `style`
 * attributes — not raw instance-supplied CSS. The structural rules that stack
 * the layers are static and live in {@link SECTION_CSS}, folded into the
 * per-site stylesheet exactly like module component CSS.
 */

/** Structural CSS for the background wrapper. Static; identical for every site. */
export const SECTION_CSS = `/* section background (REQ-14) */
.fc-bg-section { position: relative; }
.fc-bg-section__layer {
  position: absolute;
  inset: 0;
  z-index: 0;
  background-position: center;
  background-repeat: no-repeat;
}
.fc-bg-section__overlay { position: absolute; inset: 0; z-index: 1; }
.fc-bg-section__content { position: relative; z-index: 2; }`

/** Escape a string for safe use inside a double-quoted HTML attribute. */
function escapeAttr(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;')
}

/** URL-encode the quote characters that would break a `url('…')` token. */
function safeUrl(src: string): string {
  return src.replace(/'/g, '%27').replace(/"/g, '%22')
}

/** The `style` declaration for the background layer, by background type. */
function layerStyle(bg: Background): string {
  switch (bg.type) {
    case 'color':
      return `background-color: ${bg.value};`
    case 'image': {
      const fit = bg.fit ?? 'cover'
      return `background-image: url('${safeUrl(bg.asset.src)}'); background-size: ${fit};`
    }
    case 'gradient':
      return `background-image: ${bg.gradient};`
  }
}

/** The background layer plus optional overlay layer, as HTML. */
export function renderBackgroundLayers(bg: Background): string {
  const layer = `<div class="fc-bg-section__layer" style="${escapeAttr(layerStyle(bg))}"></div>`
  if (!bg.overlay) return layer
  const overlayStyle = `background-color: ${bg.overlay.color}; opacity: ${bg.overlay.opacity};`
  const overlay = `<div class="fc-bg-section__overlay" style="${escapeAttr(overlayStyle)}"></div>`
  return `${layer}${overlay}`
}

/**
 * Wrap a module's rendered HTML in a background section. Returns the HTML
 * unchanged when the instance has no background, so modules without one render
 * exactly as before and the background is scoped to its own section only.
 */
export function wrapWithBackground(moduleHtml: string, bg: Background | undefined): string {
  if (!bg) return moduleHtml
  return `<div class="fc-bg-section">${renderBackgroundLayers(bg)}<div class="fc-bg-section__content">${moduleHtml}</div></div>`
}

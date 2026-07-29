/**
 * L1 renderer (REQ-82 / REQ-79) — the *one* emitter that turns an L1 document
 * into HTML + CSS. Being the only path from an L1 tree to markup is what makes
 * the substrate **safe by construction**: every value is re-checked here and
 * emitted through a typed sink (escaped text, hex-only colours, a URL-scheme
 * allowlist, sanitised font-family, numeric lengths). No instance string ever
 * becomes raw CSS or HTML.
 *
 * Geometry keyframes compile to media-queried CSS: a per-segment `interpolate`
 * flag emits a fluid `calc()` between two captured widths; `snap` holds the
 * lower keyframe's value until the next breakpoint. Text height is natural (the
 * glyph box); only box/image leaves pin a height.
 */
import { isSafeUrl } from '@1stcontact/site-schema'
import type {
  L1AxisSizing,
  L1Border,
  L1Document,
  L1Geometry,
  L1Gradient,
  L1Mask,
  L1Node,
  L1Resources,
  L1Shadow,
  L1Sizing,
  L1Transform,
} from '@1stcontact/site-schema'

const HEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/

/** HTML-escape text and attribute values. */
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/** A colour is emitted only if it is a valid hex literal, else dropped. */
function cssColor(v: string | undefined): string | null {
  return v && HEX.test(v) ? v : null
}

/** A finite number → `${n}px`, else null. Numbers cannot carry an injection. */
function px(v: number | undefined): string | null {
  return v !== undefined && Number.isFinite(v) ? `${v}px` : null
}

/**
 * Sanitise a font-family value to a CSS-safe token list. Conservatively keeps
 * only real font-name characters (letters, digits, spaces, hyphens) per token —
 * everything else (`;{}<>():@"\\`, at-rules, comments) is stripped, so the value
 * is always inert data and can never carry CSS syntax out of the declaration. A
 * token containing whitespace is quoted.
 */
function cssFontFamily(v: string | undefined): string | null {
  if (!v) return null
  const tokens = v
    .split(',')
    .map((t) => t.replace(/[^A-Za-z0-9 -]/g, '').trim().replace(/\s+/g, ' '))
    .filter(Boolean)
    .map((t) => (/\s/.test(t) ? `"${t}"` : t))
  return tokens.length ? tokens.join(', ') : null
}

/**
 * Characters a URL may contain inside a CSS `url("…")` token. A strict
 * allowlist of the RFC-3986 unreserved / reserved set **minus** the delimiters
 * that could close the token or the surrounding rule (`"`, `'`, `\`, `(`, `)`,
 * `<`, `>`, whitespace and every control character). Anything else must arrive
 * percent-encoded.
 */
const CSS_URL_ALLOWED = /^[A-Za-z0-9\-._~:/?#[\]@!$&*+,;=%]+$/

/**
 * The **sole** CSS `url()` sink. Returns the complete, quoted `url("…")` token,
 * or null when the value is not provably inert.
 *
 * `escapeHtml` must never be used here: it neutralises `<`, `>` and quotes but
 * leaves newlines untouched, and a newline terminates a CSS string — the next
 * `}` then closes the rule and the remainder becomes live CSS (DOC-2 §2). This
 * checks the scheme allowlist (`isSafeUrl`) *and* an independent character
 * allowlist, so the renderer stays safe even if the validator is bypassed
 * (defence in depth — Layer 2 does not trust Layer 1).
 */
function cssUrl(src: string | undefined): string | null {
  if (!src) return null
  const v = src.trim()
  if (!isSafeUrl(v) || !CSS_URL_ALLOWED.test(v)) return null
  return `url("${v}")`
}

// ── REQ-90 document-level resource table → @font-face rules ────────────────────

/** A single font-family *name* (not a list) sanitised for `@font-face`. */
function fontFaceName(v: string): string | null {
  const clean = v.replace(/[^A-Za-z0-9 -]/g, '').trim().replace(/\s+/g, ' ')
  return clean || null
}

/** The CSS `format()` hint for a served font, derived from its extension. */
function fontFormat(src: string): string | null {
  const ext = src.split(/[?#]/)[0].split('.').pop()?.toLowerCase()
  switch (ext) {
    case 'woff2':
      return 'woff2'
    case 'woff':
      return 'woff'
    case 'ttf':
      return 'truetype'
    case 'otf':
      return 'opentype'
    default:
      return null
  }
}

/**
 * REQ-90 — compile the document resource table into `@font-face` rules that bind
 * each `fontFamily` handle to its served substance (a `.woff2`/`.ttf` asset).
 * The family is name-sanitised (inert data, never CSS syntax) and the URL goes
 * through {@link cssUrl} — the one CSS `url()` sink — so it cannot break out of
 * the string, the declaration, or the rule. `font-display: swap` keeps text
 * visible while the face loads.
 */
function fontFaceRules(resources: L1Resources | undefined): string[] {
  const out: string[] = []
  for (const f of resources?.fonts ?? []) {
    const name = fontFaceName(f.family)
    const url = cssUrl(f.src)
    if (!name || !url) continue
    const fmt = fontFormat(f.src)
    const decls = [
      `font-family: "${name}"`,
      `src: ${url}${fmt ? ` format("${fmt}")` : ''}`,
    ]
    if (f.weight !== undefined && Number.isFinite(f.weight)) decls.push(`font-weight: ${Math.round(f.weight)}`)
    if (f.style) decls.push(`font-style: ${f.style}`)
    decls.push('font-display: swap')
    out.push(`@font-face { ${decls.join('; ')} }`)
  }
  return out
}

// ── REQ-91 structured-effect emitters ─────────────────────────────────────────
//
// Each turns a typed structured axis (gradient / shadow / border / mask /
// transform) into CSS re-derived from numeric/enum/hex fields. Numbers cannot
// carry an injection; colours pass `cssColor`; enums are closed sets checked
// here. No instance string is ever concatenated into CSS verbatim.

/** A finite number → `${n}deg`, else null. */
function deg(v: number | undefined): string | null {
  return v !== undefined && Number.isFinite(v) ? `${v}deg` : null
}

/**
 * Fold an opacity (0..1) into a hex colour → `#rrggbbaa`. The colour's own alpha
 * (if `#rrggbbaa`) is dropped and replaced. Returns null for a non-hex colour.
 */
function withAlpha(color: string, opacity: number | undefined): string | null {
  const c = cssColor(color)
  if (!c) return null
  // Expand #rgb → #rrggbb, strip any existing alpha to the 6-digit base.
  let base = c.slice(1)
  if (base.length === 3) base = base.split('').map((ch) => ch + ch).join('')
  base = base.slice(0, 6)
  const o = opacity === undefined ? 1 : Math.max(0, Math.min(1, opacity))
  const a = Math.round(o * 255)
    .toString(16)
    .padStart(2, '0')
  return `#${base}${a}`
}

/** A linear gradient → `linear-gradient(<angle>, <stop>, …)`, or null if unpaintable. */
function gradientCss(g: L1Gradient): string | null {
  const stops = g.stops
    .map((s) => {
      const c = cssColor(s.color)
      if (!c) return null
      if (s.position !== undefined && Number.isFinite(s.position)) {
        const p = Math.max(0, Math.min(100, s.position))
        return `${c} ${p}%`
      }
      return c
    })
    .filter((s): s is string => s !== null)
  if (stops.length < 2) return null
  const angle = deg(g.angleDeg)
  return `linear-gradient(${angle ? `${angle}, ` : ''}${stops.join(', ')})`
}

/** A drop shadow → `[inset] <x>px <y>px <blur>px <spread>px <color>`, or null. */
function shadowCss(s: L1Shadow): string | null {
  const c = cssColor(s.color)
  if (!c) return null
  const x = px(s.offsetXPx)
  const y = px(s.offsetYPx)
  if (!x || !y) return null
  const parts: string[] = []
  if (s.inset) parts.push('inset')
  parts.push(x, y)
  // Blur is required when a spread is present (CSS positional syntax).
  const blur = px(s.blurPx)
  const spread = px(s.spreadPx)
  if (blur || spread) parts.push(blur ?? '0px')
  if (spread) parts.push(spread)
  parts.push(c)
  return parts.join(' ')
}

/** A box border → `<w>px <style> <color>`, or null if unpaintable. */
function borderCss(b: L1Border): string | null {
  const c = cssColor(b.color)
  if (!c) return null
  const w = px(b.widthPx)
  if (!w) return null
  const style = b.style ?? 'solid'
  return `${w} ${style} ${c}`
}

/** A 2D transform → `rotate(<deg>) scale(<n>)`, or null when it is the identity. */
function transformCss(t: L1Transform): string | null {
  const parts: string[] = []
  const r = deg(t.rotateDeg)
  if (r && t.rotateDeg !== 0) parts.push(`rotate(${r})`)
  if (t.scale !== undefined && Number.isFinite(t.scale) && t.scale !== 1) {
    parts.push(`scale(${t.scale})`)
  }
  return parts.length ? parts.join(' ') : null
}

/**
 * A typed mask/clip edge → safe CSS declarations. A circular/elliptical crop uses
 * `clip-path`; a feathered edge uses a `mask-image` gradient. Every value is a
 * keyword or a number — nothing from the instance reaches CSS as a raw string.
 */
function maskDecls(m: L1Mask): string[] {
  switch (m.shape) {
    case 'circle':
      return ['clip-path: circle(50%)']
    case 'ellipse':
      return ['clip-path: ellipse(50% 50%)']
    case 'featherRadial': {
      const inner = m.featherPx !== undefined ? `calc(100% - ${Math.max(0, m.featherPx)}px)` : '60%'
      const g = `radial-gradient(closest-side, #000 ${inner}, transparent 100%)`
      return [`-webkit-mask-image: ${g}`, `mask-image: ${g}`]
    }
    case 'featherTop':
    case 'featherBottom': {
      const f = m.featherPx !== undefined ? Math.max(0, m.featherPx) : 48
      const dir = m.shape === 'featherTop' ? 'to bottom' : 'to top'
      const g = `linear-gradient(${dir}, transparent 0, #000 ${f}px)`
      return [`-webkit-mask-image: ${g}`, `mask-image: ${g}`]
    }
  }
}

const JUSTIFY: Record<string, string> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  between: 'space-between',
  around: 'space-around',
}
const ALIGN: Record<string, string> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  stretch: 'stretch',
}

function sizingCss(axis: 'width' | 'height', s: L1Sizing | undefined): string[] {
  if (!s) return []
  const out: string[] = []
  if (s.mode === 'fixed' && s.px !== undefined) out.push(`${axis}: ${s.px}px`)
  else if (s.mode === 'fluid') out.push(`${axis}: 100%`)
  else if (s.mode === 'hug') out.push(`${axis}: fit-content`)
  if (s.minPx !== undefined) out.push(`min-${axis}: ${s.minPx}px`)
  if (s.maxPx !== undefined) out.push(`max-${axis}: ${s.maxPx}px`)
  return out
}

function axisSizingCss(sizing: L1AxisSizing | undefined): string[] {
  if (!sizing) return []
  return [...sizingCss('width', sizing.width), ...sizingCss('height', sizing.height)]
}

/** One CSS block for a selector. */
interface Rule {
  media?: string
  selector: string
  decls: string[]
}

/** Static position declarations for a keyframe. */
function frameDecls(kf: L1Geometry['keyframes'][number]): string[] {
  const d = [`left: ${kf.x}px`, `top: ${kf.y}px`, `width: ${kf.width}px`]
  if (kf.height !== undefined) d.push(`height: ${kf.height}px`)
  return d
}

/**
 * A linearly-interpolated `calc()` between two keyframe values, driven by
 * `100vw`. At `100vw === w1` it equals `v1`; at `w2` it equals `v2`.
 */
function lerpCalc(v1: number, w1: number, v2: number, w2: number): string {
  const dv = v2 - v1
  const dw = w2 - w1
  if (dw === 0) return `${v1}px`
  // v1 + dv * (100vw - w1) / dw
  return `calc(${v1}px + (${dv} * (100vw - ${w1}px) / ${dw}))`
}

/** Compile a geometry track for `selector` into absolute-position rules. */
function geometryRules(selector: string, geo: L1Geometry): Rule[] {
  const frames = geo.keyframes
  const rules: Rule[] = []
  // Base: the smallest-width keyframe held statically (covers below-ladder widths).
  rules.push({ selector, decls: ['position: absolute', ...frameDecls(frames[0])] })
  if (frames.length === 1) return rules

  for (let i = 0; i < frames.length - 1; i++) {
    const a = frames[i]
    const b = frames[i + 1]
    const seg = geo.segments?.[i] ?? 'interpolate'
    if (seg === 'snap') {
      // Hold the lower keyframe until the next breakpoint.
      rules.push({ media: `(min-width: ${a.at}px)`, selector, decls: frameDecls(a) })
    } else {
      const decls = [
        `left: ${lerpCalc(a.x, a.at, b.x, b.at)}`,
        `top: ${lerpCalc(a.y, a.at, b.y, b.at)}`,
        `width: ${lerpCalc(a.width, a.at, b.width, b.at)}`,
      ]
      if (a.height !== undefined && b.height !== undefined) {
        decls.push(`height: ${lerpCalc(a.height, a.at, b.height, b.at)}`)
      }
      rules.push({ media: `(min-width: ${a.at}px)`, selector, decls })
    }
  }
  // Final keyframe held statically above the last breakpoint.
  const last = frames[frames.length - 1]
  rules.push({ media: `(min-width: ${last.at}px)`, selector, decls: frameDecls(last) })
  return rules
}

interface RenderState {
  n: number
  rules: Rule[]
  /** Class-name namespace so mounted fragments/instances never collide (REQ-85). */
  prefix?: string
}

function emitNode(node: L1Node, state: RenderState): string {
  const cls = `${state.prefix ? `${state.prefix}-` : ''}l1-${state.n++}`
  const selector = `.${cls}`
  const base: string[] = []

  if (node.geometry) {
    state.rules.push(...geometryRules(selector, node.geometry))
  }
  if (node.visibility) {
    const { fromPx, untilPx } = node.visibility
    if (fromPx !== undefined) {
      state.rules.push({
        media: `(max-width: ${fromPx - 1}px)`,
        selector,
        decls: ['display: none'],
      })
    }
    if (untilPx !== undefined) {
      state.rules.push({ media: `(min-width: ${untilPx}px)`, selector, decls: ['display: none'] })
    }
  }

  let html: string
  switch (node.kind) {
    case 'text': {
      const a = node.axes ?? {}
      const c = cssColor(a.color)
      if (c) base.push(`color: ${c}`)
      const ff = cssFontFamily(a.fontFamily)
      if (ff) base.push(`font-family: ${ff}`)
      if (px(a.fontSizePx)) base.push(`font-size: ${px(a.fontSizePx)}`)
      if (a.fontWeight !== undefined) base.push(`font-weight: ${Math.round(a.fontWeight)}`)
      if (px(a.lineHeightPx)) base.push(`line-height: ${px(a.lineHeightPx)}`)
      if (px(a.letterSpacingPx)) base.push(`letter-spacing: ${px(a.letterSpacingPx)}`)
      if (a.textAlign) base.push(`text-align: ${a.textAlign}`)
      if (a.textTransform) base.push(`text-transform: ${a.textTransform}`)
      if (a.fontStyle) base.push(`font-style: ${a.fontStyle}`)
      // REQ-91 text pixel-movers.
      if (a.textDecoration && a.textDecoration !== 'none') {
        base.push(`text-decoration-line: ${a.textDecoration}`)
      }
      if (a.fontVariantCaps && a.fontVariantCaps !== 'normal') {
        base.push(`font-variant-caps: ${a.fontVariantCaps}`)
      }
      if (a.textShadow) {
        const sh = shadowCss(a.textShadow)
        if (sh) base.push(`text-shadow: ${sh}`)
      }
      if (a.listMarker && a.listMarker !== 'none') {
        base.push('display: list-item', 'list-style-position: inside', `list-style-type: ${a.listMarker}`)
      }
      // A text-fill gradient paints the glyphs via background-clip:text; it
      // overrides the flat colour (pushed later so it wins in the declaration list).
      if (a.gradientFill) {
        const g = gradientCss(a.gradientFill)
        if (g) {
          base.push(
            `background-image: ${g}`,
            '-webkit-background-clip: text',
            'background-clip: text',
            '-webkit-text-fill-color: transparent',
            'color: transparent',
          )
        }
      }
      base.push('margin: 0')
      html = `<p class="${cls}">${escapeHtml(node.text)}</p>`
      break
    }
    case 'image': {
      const a = node.axes ?? {}
      if (a.objectFit) base.push(`object-fit: ${a.objectFit}`)
      if (px(a.borderRadiusPx)) base.push(`border-radius: ${px(a.borderRadiusPx)}`)
      if (a.opacity !== undefined) base.push(`opacity: ${a.opacity}`)
      // REQ-91 image pixel-movers.
      if (a.border) {
        const b = borderCss(a.border)
        if (b) base.push(`border: ${b}`)
      }
      if (a.boxShadow) {
        const sh = shadowCss(a.boxShadow)
        if (sh) base.push(`box-shadow: ${sh}`)
      }
      if (a.blendMode && a.blendMode !== 'normal') base.push(`mix-blend-mode: ${a.blendMode}`)
      base.push(...axisSizingCss(node.sizing))
      base.push('display: block')
      const src = isSafeUrl(node.src) ? node.src : ''
      html = `<img class="${cls}" src="${escapeHtml(src)}" alt="${escapeHtml(node.alt)}" />`
      break
    }
    case 'slot': {
      // Phase-D seam: an inert, labelled placeholder in B1.
      html = `<div class="${cls}" data-l1-slot="${escapeHtml(node.name)}"${
        node.behavior ? ` data-l1-behavior="${escapeHtml(node.behavior)}"` : ''
      }></div>`
      break
    }
    case 'box': {
      const a = node.axes ?? {}
      const fill = cssColor(a.surfaceFill)
      if (fill) base.push(`background-color: ${fill}`)
      if (px(a.borderRadiusPx)) base.push(`border-radius: ${px(a.borderRadiusPx)}`)
      if (a.opacity !== undefined) base.push(`opacity: ${a.opacity}`)
      // REQ-91 surface pixel-movers. Background layers paint top→bottom: a scrim
      // overlay sits above a gradient/image (which sit above the solid fill).
      const bgLayers: string[] = []
      if (a.overlay) {
        const c8 = withAlpha(a.overlay.color, a.overlay.opacity)
        if (c8) bgLayers.push(`linear-gradient(${c8}, ${c8})`)
      }
      if (a.surfaceGradient) {
        const g = gradientCss(a.surfaceGradient)
        if (g) bgLayers.push(g)
      }
      const bgUrl = cssUrl(a.backgroundImageUrl)
      if (bgUrl) bgLayers.push(bgUrl)
      if (bgLayers.length) base.push(`background-image: ${bgLayers.join(', ')}`)
      if (a.border) {
        const b = borderCss(a.border)
        if (b) base.push(`border: ${b}`)
      }
      if (a.boxShadow) {
        const sh = shadowCss(a.boxShadow)
        if (sh) base.push(`box-shadow: ${sh}`)
      }
      if (px(a.backdropBlurPx)) {
        base.push(`-webkit-backdrop-filter: blur(${px(a.backdropBlurPx)})`, `backdrop-filter: blur(${px(a.backdropBlurPx)})`)
      }
      if (a.blendMode && a.blendMode !== 'normal') base.push(`mix-blend-mode: ${a.blendMode}`)
      base.push(...axisSizingCss(node.sizing))
      if (!node.geometry) base.push('position: relative')
      const inner = (node.children ?? []).map((child) => emitNode(child, state)).join('')
      html = `<div class="${cls}">${inner}</div>`
      break
    }
    case 'container': {
      if (node.layout === 'grid') {
        base.push('display: grid', `grid-template-columns: repeat(${node.columns ?? 1}, 1fr)`)
      } else {
        base.push('display: flex', `flex-direction: ${node.layout === 'row' ? 'row' : 'column'}`)
      }
      if (node.gapPx !== undefined) base.push(`gap: ${node.gapPx}px`)
      if (node.distribution) base.push(`justify-content: ${JUSTIFY[node.distribution]}`)
      if (node.align) base.push(`align-items: ${ALIGN[node.align]}`)
      base.push(...axisSizingCss(node.sizing))
      if (!node.geometry) base.push('position: relative')
      const inner = node.children.map((child) => emitNode(child, state)).join('')
      html = `<div class="${cls}">${inner}</div>`
      break
    }
  }

  // REQ-91 node-level transform / mask — applicable to any node kind.
  if (node.transform) {
    const t = transformCss(node.transform)
    if (t) base.push(`transform: ${t}`)
  }
  if (node.mask) base.push(...maskDecls(node.mask))

  if (base.length) state.rules.push({ selector, decls: base })
  return html
}

function serializeRules(rules: Rule[]): string {
  // Group by media so cascade order is deterministic: base rules first, then
  // media blocks in source order (ascending min-width breakpoints override).
  const bare: Rule[] = rules.filter((r) => !r.media)
  const mediaOrder: string[] = []
  const byMedia = new Map<string, Rule[]>()
  for (const r of rules) {
    if (!r.media) continue
    if (!byMedia.has(r.media)) {
      byMedia.set(r.media, [])
      mediaOrder.push(r.media)
    }
    byMedia.get(r.media)!.push(r)
  }
  const block = (r: Rule) => `${r.selector} { ${r.decls.join('; ')} }`
  const out: string[] = bare.map(block)
  for (const m of mediaOrder) {
    out.push(`@media ${m} {\n${byMedia.get(m)!.map((r) => '  ' + block(r)).join('\n')}\n}`)
  }
  return out.join('\n')
}

export interface L1RenderResult {
  html: string
  css: string
}

/** Render an L1 document to `{ html, css }`. Pure; deterministic. */
export function renderL1Document(doc: L1Document): L1RenderResult {
  const state: RenderState = { n: 0, rules: [] }
  const body = emitNode(doc.root, state)
  const reset = [
    '*, *::before, *::after { box-sizing: border-box }',
    'html, body { margin: 0; padding: 0 }',
  ]
  const bg = cssColor(doc.background)
  if (bg) reset.push(`body { background-color: ${bg} }`)
  // REQ-90 — @font-face rules first so every family handle is bound before any
  // rule references it (no serif fallback while the CSS is parsed top-down).
  const faces = fontFaceRules(doc.resources)
  const css = [reset.join('\n'), ...faces, serializeRules(state.rules)].join('\n')
  return { html: body, css }
}

export interface L1FragmentResult {
  /** One HTML string per input subtree, in order. */
  htmls: string[]
  /** Combined CSS for all subtrees (selectors unique across the fragment). */
  css: string
}

/**
 * Render an array of L1 subtrees sharing one selector namespace (REQ-85) — the
 * seam a **behavior module** uses to mount its named presentation slots. Every
 * subtree's classes are drawn from one counter and carry `prefix` (`<prefix>-l1-N`),
 * so multiple mounted fragments — and multiple behavior instances on a page —
 * never collide. The document reset is deliberately *not* emitted (the host page
 * already owns it). Pure; deterministic given `(nodes, prefix)`.
 */
export function renderL1Fragment(nodes: L1Node[], prefix = 'fc'): L1FragmentResult {
  const state: RenderState = { n: 0, rules: [], prefix }
  const htmls = nodes.map((node) => emitNode(node, state))
  return { htmls, css: serializeRules(state.rules) }
}

/** Render an L1 document to a complete, standalone HTML page. */
export function renderL1Page(doc: L1Document, title = 'L1'): string {
  const { html, css } = renderL1Document(doc)
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(title)}</title>
<style>
${css}
</style>
</head>
<body>
${html}
</body>
</html>`
}

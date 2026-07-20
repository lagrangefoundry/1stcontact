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
  L1Document,
  L1Geometry,
  L1Node,
  L1Sizing,
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
}

function emitNode(node: L1Node, state: RenderState): string {
  const cls = `l1-${state.n++}`
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
      base.push('margin: 0')
      html = `<p class="${cls}">${escapeHtml(node.text)}</p>`
      break
    }
    case 'image': {
      const a = node.axes ?? {}
      if (a.objectFit) base.push(`object-fit: ${a.objectFit}`)
      if (px(a.borderRadiusPx)) base.push(`border-radius: ${px(a.borderRadiusPx)}`)
      if (a.opacity !== undefined) base.push(`opacity: ${a.opacity}`)
      base.push(...axisSizingCss(node.sizing))
      base.push('display: block')
      const src = isSafeUrl(node.src) ? node.src : ''
      html = `<img class="${cls}" src="${escapeHtml(src)}" alt="${escapeHtml(node.alt)}" />`
      break
    }
    case 'slot': {
      // Phase-D seam: an inert, labelled placeholder in B1.
      html = `<div class="${cls}" data-l1-slot="${escapeHtml(node.name)}"${
        node.capability ? ` data-l1-capability="${escapeHtml(node.capability)}"` : ''
      }></div>`
      break
    }
    case 'box': {
      const a = node.axes ?? {}
      const fill = cssColor(a.surfaceFill)
      if (fill) base.push(`background-color: ${fill}`)
      if (px(a.borderRadiusPx)) base.push(`border-radius: ${px(a.borderRadiusPx)}`)
      if (a.opacity !== undefined) base.push(`opacity: ${a.opacity}`)
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
  const css = [reset.join('\n'), serializeRules(state.rules)].join('\n')
  return { html: body, css }
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

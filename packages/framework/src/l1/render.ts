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
import { isSafeUrl, type L1Link } from '@1stcontact/site-schema'
import type {
  L1AxisSizing,
  L1Border,
  L1Column,
  L1ColumnAnchor,
  L1ColumnTerm,
  L1Container,
  L1Document,
  L1FocusRing,
  L1FocusState,
  L1Geometry,
  L1Gradient,
  L1HoverState,
  L1Interaction,
  L1LayoutMode,
  L1Mask,
  L1Motion,
  L1Node,
  L1Resources,
  L1Reveal,
  L1ScalarTrack,
  L1Shadow,
  L1Sizing,
  L1SurfaceAxes,
  L1Transform,
  L1ViewportResponse,
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

/**
 * REQ-98 — the shared surface/paint axis group → CSS. One emitter for **every**
 * node kind that renders a box (`box`, `container`, `text`, `image`, `slot`,
 * `control`), because which kinds could paint used to be arbitrary: a painted,
 * internally-laid-out element needed a `box` wrapped around a `container`, and
 * each new kind re-derived its own slice of these declarations by hand.
 *
 * Background layers paint top→bottom: a scrim overlay sits above a gradient /
 * image, which sit above the solid fill.
 *
 * `fill: false` suppresses only the solid `background-color` — a text run
 * painting its glyphs with a `gradientFill` repurposes the background layers via
 * `background-clip: text`, so its own chip fill would be clipped to the glyphs
 * rather than painted behind them.
 */
function surfaceDecls(a: L1SurfaceAxes, opts: { fill?: boolean } = {}): string[] {
  const out: string[] = []
  if (opts.fill !== false) {
    const fill = cssColor(a.surfaceFill)
    if (fill) out.push(`background-color: ${fill}`)
  }
  if (px(a.borderRadiusPx)) out.push(`border-radius: ${px(a.borderRadiusPx)}`)
  if (a.opacity !== undefined) out.push(`opacity: ${a.opacity}`)
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
  if (bgLayers.length) out.push(`background-image: ${bgLayers.join(', ')}`)
  // BUG-13 — a section/band background image fills its box (cover, centered, no
  // tiling) — the faithful default for a hero/section backdrop. Only when a real
  // image URL is present; a solid/gradient/scrim layer needs no sizing.
  if (bgUrl) {
    out.push('background-size: cover', 'background-position: center', 'background-repeat: no-repeat')
  }
  if (a.border) {
    const b = borderCss(a.border)
    if (b) out.push(`border: ${b}`)
  }
  // BUG-14 — a coloured left-accent border (card rule). Emitted after `border`
  // so an explicit `border-left` wins; re-derived from numeric/enum/hex fields.
  if (a.borderLeft) {
    const b = borderCss(a.borderLeft)
    if (b) out.push(`border-left: ${b}`)
  }
  if (a.boxShadow) {
    const sh = shadowCss(a.boxShadow)
    if (sh) out.push(`box-shadow: ${sh}`)
  }
  if (px(a.backdropBlurPx)) {
    out.push(
      `-webkit-backdrop-filter: blur(${px(a.backdropBlurPx)})`,
      `backdrop-filter: blur(${px(a.backdropBlurPx)})`,
    )
  }
  if (a.blendMode && a.blendMode !== 'normal') out.push(`mix-blend-mode: ${a.blendMode}`)
  return out
}

// ── REQ-99 interaction state: the sole pseudo-class sink ─────────────────────
//
// A pseudo-class is a *selector*, and nothing in an L1 document may name one:
// the instance declares `interaction.hover` / `interaction.focus` as typed value
// bags, and only this emitter knows those compile to `:hover` / `:focus-visible`.
// So the substrate gains interaction feedback without gaining a way to smuggle a
// selector — the same construction that keeps colours hex-only and text escaped.

/** The default focus indicator every interactive node gets when it authors none. */
const DEFAULT_FOCUS_RING: L1FocusRing = { widthPx: 2, color: '#000000', offsetPx: 2 }

/**
 * A focus ring → `outline` + `outline-offset`. The default ring paints
 * `currentColor` rather than a fixed hue so it inherits whatever colour the node
 * was authored with, and therefore stays visible on a light or a dark surface
 * without the substrate guessing at a palette.
 */
function focusRingDecls(ring: L1FocusRing | undefined): string[] {
  const style = ring?.style ?? 'solid'
  const w = px(ring?.widthPx ?? DEFAULT_FOCUS_RING.widthPx) ?? '2px'
  const color = ring ? cssColor(ring.color) : 'currentColor'
  const offset = px(ring?.offsetPx ?? DEFAULT_FOCUS_RING.offsetPx) ?? '2px'
  return [`outline: ${w} ${style} ${color ?? 'currentColor'}`, `outline-offset: ${offset}`]
}

/**
 * A state's motion composed with the node's own base transform → one `transform`
 * value. CSS `transform` REPLACES rather than accumulates, so a hover that only
 * wants to nudge would silently discard an authored rotation if the two were not
 * merged here.
 */
function motionTransformCss(motion: L1Motion, base: L1Transform | undefined): string | null {
  const parts: string[] = []
  const x = motion.offsetXPx ?? 0
  const y = motion.offsetYPx ?? 0
  if (x !== 0 || y !== 0) parts.push(`translate(${num(x)}px, ${num(y)}px)`)
  const rotate = motion.rotateDeg ?? base?.rotateDeg
  if (rotate !== undefined && Number.isFinite(rotate) && rotate !== 0) parts.push(`rotate(${num(rotate)}deg)`)
  const scale = motion.scale ?? base?.scale
  if (scale !== undefined && Number.isFinite(scale) && scale !== 1) parts.push(`scale(${num(scale)})`)
  return parts.length ? parts.join(' ') : null
}

/** One interaction state (paint delta + motion) → CSS declarations. */
function stateDecls(state: L1HoverState | L1FocusState, base: L1Transform | undefined): string[] {
  const out: string[] = [...surfaceDecls(state)]
  const c = cssColor(state.color)
  if (c) out.push(`color: ${c}`)
  if (state.textDecoration) out.push(`text-decoration-line: ${state.textDecoration}`)
  if (state.motion) {
    const t = motionTransformCss(state.motion, base)
    if (t) out.push(`transform: ${t}`)
  }
  return out
}

/** The CSS property a declaration sets (`background-color: #fff` → `background-color`). */
function declProp(decl: string): string {
  return decl.slice(0, decl.indexOf(':')).trim()
}

/**
 * REQ-99 — compile a node's interaction states into rules.
 *
 * `interactive` marks a node the user can actually focus (a `control`): it gets
 * the default ring when it authored none, so an author cannot ship a control with
 * no focus indicator. The schema gives no way to express "no ring", and this is
 * the other half of that obligation — taste may restyle the indicator, never
 * remove it (DOC-16 §4 sets the quality bar; this is the floor beneath it).
 *
 * The transition is emitted on the BASE rule, so it governs the leave as well as
 * the enter, and only over the properties the states actually change — derived
 * from the emitted declarations rather than a blanket `all`, which would animate
 * geometry the keyframe track owns. Under `prefers-reduced-motion: reduce` the
 * transition is dropped and any state motion collapses back to the base
 * transform: a user who asked for no movement gets the paint change alone.
 */
function interactionRules(
  selector: string,
  interaction: L1Interaction,
  baseTransform: L1Transform | undefined,
  interactive: boolean,
): { rules: Rule[]; transitions: TransitionSpec[] } {
  const rules: Rule[] = []
  const props = new Set<string>()
  let anyMotion = false

  if (interactive && !interaction.focus?.ring) {
    // The floor: a focusable node with no authored ring still gets one.
    rules.push({ selector: `${selector}:focus-visible`, decls: focusRingDecls(undefined) })
  }

  if (interaction.hover) {
    const decls = stateDecls(interaction.hover, baseTransform)
    if (decls.length) {
      rules.push({ selector: `${selector}:hover`, decls })
      decls.forEach((d) => props.add(declProp(d)))
    }
    if (interaction.hover.motion) anyMotion = true
  }

  if (interaction.focus) {
    const decls = stateDecls(interaction.focus, baseTransform)
    // The paint delta transitions; the ring does NOT. A focus indicator that
    // fades in is an indicator that is briefly absent, which is the one thing it
    // may never be — so the ring is appended after the property set is taken.
    decls.forEach((d) => props.add(declProp(d)))
    if (interaction.focus.ring) decls.push(...focusRingDecls(interaction.focus.ring))
    if (decls.length) {
      rules.push({ selector: `${selector}:focus-visible`, decls })
    }
    if (interaction.focus.motion) anyMotion = true
  }

  const transitions: TransitionSpec[] = []
  const duration = interaction.transition?.durationMs
  if (duration !== undefined && Number.isFinite(duration) && props.size) {
    for (const prop of props) {
      transitions.push({
        prop,
        durationMs: duration,
        easing: interaction.transition?.easing ?? 'ease',
        delayMs: 0,
      })
    }
  }
  if (anyMotion) {
    const settled = baseTransform ? transformCss(baseTransform) : null
    const decls = [`transform: ${settled ?? 'none'}`]
    if (interaction.hover?.motion) rules.push({ media: REDUCED_MOTION, selector: `${selector}:hover`, decls })
    if (interaction.focus?.motion) {
      rules.push({ media: REDUCED_MOTION, selector: `${selector}:focus-visible`, decls })
    }
  }
  return { rules, transitions }
}

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)'

// ── REQ-100 scroll reveal: the sole entrance-motion sink ──────────────────────
//
// The construction mirrors REQ-99's: an L1 document names a *typed value bag*
// and only this emitter knows it compiles to a class, a pseudo-class-free
// pre-state rule, and one shared IntersectionObserver. No document can name a
// selector, a keyframe, or a script — so the substrate gains entrance motion
// without gaining a way to smuggle any of the three.
//
// Three properties make the mechanism safe rather than merely pretty:
//
//   1. **It fails visible.** The pre-state rule is gated on a `data-l1-motion`
//      marker that only the script sets. No JS, no IntersectionObserver, a
//      thrown error, or a reduced-motion preference → the marker is absent, the
//      rule never matches, and the page renders fully settled. Hiding content in
//      CSS and revealing it in JS would invert that, which is how a scroll
//      library turns a broken script into a blank page.
//   2. **Settling needs no second rule.** The pre-state is written under
//      `:not(.l1-in)`, so adding the class simply stops it matching and the
//      node's own authored opacity/geometry resume. A reveal therefore never
//      restates the design and cannot drift from it.
//   3. **It composes with `interaction`.** Entrance uses the independent
//      `translate` property while a hover's motion uses `transform`; the two
//      compose natively instead of overwriting each other, and their transitions
//      are merged into one declaration set by {@link transitionDecls} rather
//      than the second silently replacing the first.

/** The class an author cannot write: the observer's handle on a revealing node. */
const REVEAL_CLASS = 'l1-rv'
/** The class the observer adds once a node has entered. */
const REVEALED_CLASS = 'l1-in'
/** Set by the script only when motion is actually going to run (see §1 above). */
const MOTION_MARKER = 'html[data-l1-motion]'
/**
 * The observer's root inset: `top right bottom left`.
 *
 * Bottom is SHRUNK so a node reveals shortly after clearing the fold rather than
 * the instant it grazes it. Top is EXPANDED past any real document height, so a
 * node the reader has scrolled beyond is still intersecting and settles instead
 * of staying dark — see {@link L1_REVEAL_SCRIPT} for why this cannot be a test
 * inside the callback.
 */
const REVEAL_ROOT_MARGIN = '200000px 0px -8% 0px'

/** One property's share of a merged `transition` declaration. */
interface TransitionSpec {
  prop: string
  durationMs: number
  easing: string
  delayMs: number
}

/**
 * Merge every transitioning property — interaction states and scroll entrance
 * alike — into ONE set of `transition-*` longhands.
 *
 * A rule may carry only one `transition-property`, so emitting the two features
 * independently would mean whichever ran second silently cancelled the first: a
 * revealing button would lose its hover feedback, with nothing to show for it in
 * either feature's own tests. The list form keeps both, each with its own
 * duration and delay.
 */
function transitionDecls(specs: TransitionSpec[]): string[] {
  if (!specs.length) return []
  // A single value is broadcast across every property in the list, so the list
  // form is emitted only where the timings genuinely differ. Collapsing keeps the
  // common case (one feature, uniform timing) reading as it always has, and keeps
  // the list — which exists for the interaction+reveal overlap — legible when it
  // does appear.
  const uniform = <T,>(pick: (s: TransitionSpec) => T): T | null => {
    const first = pick(specs[0])
    return specs.every((s) => pick(s) === first) ? first : null
  }
  const dur = uniform((s) => s.durationMs)
  const ease = uniform((s) => s.easing)
  const delay = uniform((s) => s.delayMs)

  const out = [
    `transition-property: ${specs.map((s) => s.prop).join(', ')}`,
    `transition-duration: ${
      dur !== null ? `${num(dur)}ms` : specs.map((s) => `${num(s.durationMs)}ms`).join(', ')
    }`,
    `transition-timing-function: ${ease !== null ? ease : specs.map((s) => s.easing).join(', ')}`,
  ]
  // An all-zero delay is the CSS initial value; emitting it would be noise.
  if (delay !== 0) {
    out.push(
      `transition-delay: ${
        delay !== null ? `${num(delay)}ms` : specs.map((s) => `${num(s.delayMs)}ms`).join(', ')
      }`,
    )
  }
  return out
}

/**
 * REQ-100 — compile a node's scroll entrance into its pre-state rules.
 *
 * `staggerDelayMs` is the node's share of its parent container's stagger; it
 * ADDS to any `delayMs` the node authored, so a per-node delay tunes a stagger
 * rather than fighting it.
 *
 * `settledOpacity` is the opacity the node actually paints at — its authored
 * value, not 1 — so the reduced-motion fallback restores the design rather than
 * brightening a deliberately-dimmed node.
 */
function revealRules(
  selector: string,
  reveal: L1Reveal,
  staggerDelayMs: number,
  settledOpacity: number,
): { rules: Rule[]; transitions: TransitionSpec[] } {
  const pre = `${MOTION_MARKER} ${selector}:not(.${REVEALED_CLASS})`
  const from = reveal.fromOpacity ?? 0
  const y = reveal.yPx ?? 0

  const decls = [`opacity: ${num(from)}`]
  if (y !== 0) decls.push(`translate: 0 ${num(y)}px`)
  const rules: Rule[] = [{ selector: pre, decls }]

  // Belt and braces on the reduced-motion obligation: the script already
  // declines to set the marker, and this makes the pre-state inert even if some
  // other path sets it. A user who asked for no motion gets the settled page.
  rules.push({
    media: REDUCED_MOTION,
    selector: pre,
    decls: [`opacity: ${num(settledOpacity)}`, 'translate: none'],
  })

  const durationMs = reveal.durationMs ?? 600
  const easing = reveal.easing ?? 'ease-out'
  const delayMs = (reveal.delayMs ?? 0) + staggerDelayMs
  const transitions: TransitionSpec[] = [{ prop: 'opacity', durationMs, easing, delayMs }]
  if (y !== 0) transitions.push({ prop: 'translate', durationMs, easing, delayMs })
  return { rules, transitions }
}

/**
 * The one renderer-owned script that drives every reveal on the page — vetted
 * once, identical for every site, carrying no instance data of any kind.
 *
 * It returns *before* setting the marker whenever motion must not run (no
 * IntersectionObserver, or a reduced-motion preference), which is what makes the
 * CSS pre-state fail visible rather than fail blank. Emitted inline at the top
 * of the body so the marker lands before the content below it paints; a deferred
 * script would show the settled page first and then yank it back to the
 * pre-state.
 *
 * The `rootMargin` is what makes a node the reader has already gone PAST settle
 * too. Its bottom is SHRUNK (-8%) so a node reveals a little after its top edge
 * clears the fold rather than the instant it grazes it; its top is EXPANDED by a
 * span no document scrolls further than, so the root reaches back over
 * everything above the viewport and anything skipped over is still *intersecting*
 * — by an End keypress, an anchor link, or a reload restoring a mid-page scroll
 * position. Observed on the xgd.dev page itself: jumping to the foot left every
 * band in between laid out, occupying space, and invisible.
 *
 * It has to be the margin rather than a `boundingClientRect.bottom < 0` test in
 * the callback, because a node that goes from below the viewport to above it in
 * one jump never *changes* intersection ratio — it is 0 throughout — so the
 * observer delivers no entry for it at all and no callback clause can run. (Real
 * browser, xgd.dev, jump to foot: 7 entries delivered, none with a negative
 * bottom, 16 bands left dark.) Widening the root turns the same nodes into
 * genuine intersections, which the observer does report.
 */
export const L1_REVEAL_SCRIPT = `(function(){
var d=document.documentElement;
if(!('IntersectionObserver' in window))return;
try{if(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches)return}catch(e){return}
d.setAttribute('data-l1-motion','');
function run(){
var io=new IntersectionObserver(function(es){
for(var i=0;i<es.length;i++){var e=es[i];
if(e.isIntersecting){e.target.classList.add('${REVEALED_CLASS}');io.unobserve(e.target)}}
},{rootMargin:'${REVEAL_ROOT_MARGIN}'});
var ns=document.getElementsByClassName('${REVEAL_CLASS}');
for(var i=0;i<ns.length;i++)io.observe(ns[i]);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run);else run();
})();`

// ── REQ-96 control leaves: the module's element, painted by L1 ────────────────

/** The tags a behavior module may declare as a control leaf. */
export type L1ControlTag = 'input' | 'textarea' | 'button' | 'select' | 'span'

/**
 * A module-declared leaf element, as handed to the emitter. The module owns the
 * tag and the **attribute bundle** (`type` / `name` / `required` / `for`↔`id`
 * wiring, the behavioural `data-*` hooks); L1 owns the class, geometry and every
 * paint axis. `text` is the element's own content where the tag admits one (a
 * button's label, a textarea's value) — controls that are void elements ignore it.
 */
export interface L1ControlElement {
  tag: L1ControlTag
  attrs?: Readonly<Record<string, string | number | boolean | undefined>>
  text?: string
}

/** Tags with no closing tag — their content, if any, is dropped. */
const VOID_CONTROL_TAGS = new Set<L1ControlTag>(['input'])

/**
 * Attribute names a control may never carry, whoever declared it. `class` and
 * `style` are L1's (letting a module set either would hand presentation back to
 * the module, which is the whole point of REQ-96), and an `on*` handler is a
 * script sink. Defence in depth: the modules are framework code, but the sole
 * emitter is where the guarantee is *constructed*, not assumed.
 */
function isSafeAttrName(name: string): boolean {
  if (!/^[a-zA-Z][a-zA-Z0-9-]*$/.test(name)) return false
  const lower = name.toLowerCase()
  return lower !== 'class' && lower !== 'style' && !lower.startsWith('on')
}

/** A module-declared control element → HTML, with L1's class and escaped attrs. */
function controlHtml(el: L1ControlElement, cls: string): string {
  const attrs: string[] = [`class="${cls}"`]
  for (const [name, value] of Object.entries(el.attrs ?? {})) {
    if (value === undefined || value === false || !isSafeAttrName(name)) continue
    if (value === true) attrs.push(name)
    else attrs.push(`${name}="${escapeHtml(String(value))}"`)
  }
  const open = `<${el.tag} ${attrs.join(' ')}`
  if (VOID_CONTROL_TAGS.has(el.tag)) return `${open} />`
  return `${open}>${escapeHtml(el.text ?? '')}</${el.tag}>`
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

/** A number formatted for CSS with no exponent notation and no trailing noise. */
function num(n: number): string {
  return String(Math.round(n * 1e4) / 1e4)
}

/**
 * REQ-88 — the centred column's *extent* as a CSS length expression:
 * `min(maxWidthPx, min(containerPx, 100vw) - 2 * insetPx)`.
 */
function columnExtentCss(col: L1Column): string {
  const inner = `(min(${num(col.containerPx)}px, 100vw) - ${num(col.insetPx * 2)}px)`
  return col.maxWidthPx === undefined ? inner : `min(${num(col.maxWidthPx)}px, ${inner})`
}

/** REQ-88 — the column's *origin*: `max(0, (100vw - containerPx) / 2) + insetPx`. */
function columnOriginCss(col: L1Column): string {
  return `max(0px, (100vw - ${num(col.containerPx)}px) / 2) + ${num(col.insetPx)}px`
}

/**
 * REQ-88 — `left` / `width` for a column-anchored node, as closed-form CSS. These
 * are *static* declarations: the column function is exact at every viewport width,
 * so unlike a keyframe track it needs no media queries and no extrapolation.
 */
function anchorDecls(anchor: L1ColumnAnchor, col: L1Column): string[] {
  const extent = columnExtentCss(col)
  const decls: string[] = []

  /**
   * `px + fraction * extent`, capped — as a CSS length expression.
   *
   * `needsCalc` is not an optimisation: `lead` is a compound expression
   * (`max(…) + 24px`), so a sum containing it is only legal inside `calc()`.
   * Emitting it bare produces an invalid declaration that the browser DROPS,
   * which for `left` silently resolves to 0 and slams the node to the page edge.
   */
  const termCss = (term: L1ColumnTerm, lead?: string): string => {
    const parts: string[] = lead ? [lead] : []
    const px = term.px ?? 0
    const fraction = term.fraction ?? 0
    if (px !== 0) parts.push(`${num(px)}px`)
    if (fraction !== 0) parts.push(fraction === 1 ? extent : `${num(fraction)} * ${extent}`)
    if (parts.length === 0) parts.push('0px')
    const needsCalc = parts.length > 1 || Boolean(lead)
    const sum = needsCalc ? `calc(${parts.join(' + ')})` : parts[0]
    return term.maxPx === undefined ? sum : `min(${num(term.maxPx)}px, ${sum})`
  }

  // A tracked constant is emitted per-breakpoint by the caller (it needs media
  // rules); the static declaration is only for a term whose constant is constant.
  if (anchor.x && !anchor.x.pxTrack) decls.push(`left: ${termCss(anchor.x, columnOriginCss(col))}`)
  if (anchor.width && !anchor.width.pxTrack) decls.push(`width: ${termCss(anchor.width)}`)
  return decls
}

/**
 * REQ-88 — `left`/`width` rules for an anchored axis whose constant is a per-width
 * track: the column function stays closed-form and only the small inside-the-column
 * offset is keyframed, so wherever that offset is locally constant (the whole
 * desktop range) the node tracks the column exactly.
 */
function anchorTrackRules(
  selector: string,
  prop: 'left' | 'width',
  term: L1ColumnTerm,
  col: L1Column,
): Rule[] {
  const track = term.pxTrack!
  const f = track.keyframes
  const lead = prop === 'left' ? `${columnOriginCss(col)} + ` : ''
  const fraction = term.fraction ?? 0
  const tail = fraction === 0 ? '' : ` + ${fraction === 1 ? columnExtentCss(col) : `${num(fraction)} * ${columnExtentCss(col)}`}`
  const wrap = (value: string): string => {
    const expr = `calc(${lead}${value}${tail})`
    return term.maxPx === undefined ? expr : `min(${num(term.maxPx)}px, ${expr})`
  }
  const rules: Rule[] = [{ selector, decls: [`${prop}: ${wrap(`${f[0].value}px`)}`] }]
  for (let i = 0; i < f.length - 1; i++) {
    const a = f[i]
    const b = f[i + 1]
    const seg = track.segments?.[i] ?? 'interpolate'
    const value = seg === 'snap' ? `${a.value}px` : lerpCalc(a.value, a.at, b.value, b.at)
    rules.push({ media: `(min-width: ${a.at}px)`, selector, decls: [`${prop}: ${wrap(value)}`] })
  }
  const last = f[f.length - 1]
  rules.push({ media: `(min-width: ${last.at}px)`, selector, decls: [`${prop}: ${wrap(`${last.value}px`)}`] })
  return rules
}

/**
 * REQ-88 — a value plus its viewport-height response, measured from the height the
 * keyframe was captured at: `base + factor * (100vh - atHeight)`. `factor: 1` with
 * `base === atHeight` collapses to plain `100vh` — the `min-h-screen` hero.
 */
function viewportResponsive(base: string, factor: number, atHeight: number): string {
  if (factor === 0) return base
  const shift = factor === 1 ? `(100vh - ${num(atHeight)}px)` : `${num(factor)} * (100vh - ${num(atHeight)}px)`
  return `calc(${base} + ${shift})`
}

/**
 * Compile a geometry track for `selector` into absolute-position rules.
 *
 * REQ-88 — an axis governed by a viewport function (a column anchor for `x`/
 * `width`, `100vh` for `height`) is emitted once, statically, and *suppressed*
 * from the keyframe rules below: the two would otherwise fight, with whichever
 * media query happened to sort last winning. The keyframes remain in the document
 * as the captured record of what the function evaluates to at the sampled widths.
 */
function geometryRules(selector: string, geo: L1Geometry, column?: L1Column): Rule[] {
  const frames = geo.keyframes
  const rules: Rule[] = []
  // REQ-88 — suppression is PER AXIS: a node may take its left edge from the
  // column while its width stays keyframed (see `l1ColumnAnchorSchema`).
  const anchor = column ? geo.anchor : undefined
  const anchoredX = Boolean(anchor?.x)
  const anchoredWidth = Boolean(anchor?.width)
  const yF = geo.viewportResponse?.yFactor ?? 0
  const hF = geo.viewportResponse?.heightFactor ?? 0

  /** Held (non-interpolated) declarations for one keyframe. */
  const decls = (kf: L1Geometry['keyframes'][number]): string[] => {
    const h = kf.atHeight
    const d: string[] = [`top: ${h ? viewportResponsive(`${kf.y}px`, yF, h) : `${kf.y}px`}`]
    if (!anchoredX) d.push(`left: ${kf.x}px`)
    if (!anchoredWidth) d.push(`width: ${kf.width}px`)
    if (kf.height !== undefined) {
      d.push(`height: ${h ? viewportResponsive(`${kf.height}px`, hF, h) : `${kf.height}px`}`)
    }
    return d
  }

  const staticDecls: string[] = ['position: absolute']
  if (anchor) staticDecls.push(...anchorDecls(anchor, column!))
  if (anchor?.x?.pxTrack) rules.push(...anchorTrackRules(selector, 'left', anchor.x, column!))
  if (anchor?.width?.pxTrack) rules.push(...anchorTrackRules(selector, 'width', anchor.width, column!))

  // Base: the smallest-width keyframe held statically (covers below-ladder widths).
  rules.push({ selector, decls: [...staticDecls, ...decls(frames[0])] })
  if (frames.length === 1) return rules

  for (let i = 0; i < frames.length - 1; i++) {
    const a = frames[i]
    const b = frames[i + 1]
    const seg = geo.segments?.[i] ?? 'interpolate'
    if (seg === 'snap') {
      // Hold the lower keyframe until the next breakpoint.
      rules.push({ media: `(min-width: ${a.at}px)`, selector, decls: decls(a) })
    } else {
      // Both the value and the height it was captured at interpolate across the
      // segment, so the response stays anchored to the right origin in between.
      const atH =
        a.atHeight !== undefined && b.atHeight !== undefined
          ? lerpCalc(a.atHeight, a.at, b.atHeight, b.at)
          : undefined
      const respond = (base: string, factor: number): string => {
        if (factor === 0 || atH === undefined) return base
        const shift = factor === 1 ? `(100vh - ${atH})` : `${num(factor)} * (100vh - ${atH})`
        return `calc(${base} + ${shift})`
      }
      const d = [`top: ${respond(lerpCalc(a.y, a.at, b.y, b.at), yF)}`]
      if (!anchoredX) d.push(`left: ${lerpCalc(a.x, a.at, b.x, b.at)}`)
      if (!anchoredWidth) d.push(`width: ${lerpCalc(a.width, a.at, b.width, b.at)}`)
      if (a.height !== undefined && b.height !== undefined) {
        d.push(`height: ${respond(lerpCalc(a.height, a.at, b.height, b.at), hF)}`)
      }
      rules.push({ media: `(min-width: ${a.at}px)`, selector, decls: d })
    }
  }
  // Final keyframe held statically above the last breakpoint.
  const last = frames[frames.length - 1]
  rules.push({ media: `(min-width: ${last.at}px)`, selector, decls: decls(last) })
  return rules
}

/**
 * BUG-18 — compile a responsive scalar-axis track (font-size / line-height /
 * letter-spacing) into media-queried CSS, exactly as {@link geometryRules} does
 * for position: a base rule at the smallest-width keyframe, then per-breakpoint
 * overrides — a fluid `calc()` for an `interpolate` segment, the held value for a
 * `snap`. Every value is a finite number → `${n}px`, so nothing from the instance
 * reaches CSS as a raw string. All three axes are px lengths, so one emitter serves.
 */
function scalarAxisRules(selector: string, prop: string, track: L1ScalarTrack): Rule[] {
  const f = track.keyframes
  const rules: Rule[] = [{ selector, decls: [`${prop}: ${f[0].value}px`] }]
  if (f.length === 1) return rules
  for (let i = 0; i < f.length - 1; i++) {
    const a = f[i]
    const b = f[i + 1]
    const seg = track.segments?.[i] ?? 'interpolate'
    const value = seg === 'snap' ? `${a.value}px` : lerpCalc(a.value, a.at, b.value, b.at)
    rules.push({ media: `(min-width: ${a.at}px)`, selector, decls: [`${prop}: ${value}`] })
  }
  const last = f[f.length - 1]
  rules.push({ media: `(min-width: ${last.at}px)`, selector, decls: [`${prop}: ${last.value}px`] })
  return rules
}

/**
 * REQ-104 — the CSS for ONE layout mode, emitted whole.
 *
 * Whole rather than as a delta because a `@media` override has to be able to
 * *replace* the mode below it: a grid that becomes a row must reset `display`, and
 * a wrapping row that becomes a stack must reset `flex-wrap` (a column flex
 * container that inherited `wrap` from the base rule breaks the moment anything
 * constrains its height). Restating the mode at each breakpoint means every rule
 * in the cascade is self-sufficient and no combination can leak across.
 *
 * `flex-wrap` is emitted only when the node actually declares `wrap`, so the
 * emission for an untouched container is unchanged to the byte.
 */
function layoutDecls(mode: L1LayoutMode, node: L1Container): string[] {
  if (mode === 'grid') {
    return ['display: grid', `grid-template-columns: repeat(${node.columns ?? 1}, 1fr)`]
  }
  const decls = ['display: flex', `flex-direction: ${mode === 'row' ? 'row' : 'column'}`]
  if (node.wrap !== undefined) {
    decls.push(`flex-wrap: ${node.wrap && mode === 'row' ? 'wrap' : 'nowrap'}`)
  }
  return decls
}

interface RenderState {
  n: number
  rules: Rule[]
  /** Class-name namespace so mounted fragments/instances never collide (REQ-85). */
  prefix?: string
  /** REQ-88 — the document's centred column, resolved for `geometry.anchor`. */
  column?: L1Column
  /** REQ-88 — the ladder's smallest width; below it the base rule is in force. */
  minWidth?: number
  /** REQ-93 — pre-rendered behavior-module HTML, keyed by the slot name it binds to. */
  mounts?: Readonly<Record<string, string>>
  /** REQ-96 — the mounted behavior's declared leaf elements, keyed by control name. */
  controls?: Readonly<Record<string, L1ControlElement>>
  /** REQ-100 — set once any node reveals, so a motionless page ships no script. */
  hasReveal?: boolean
}

function emitNode(node: L1Node, state: RenderState, staggerDelayMs = 0): string {
  const name = `${state.prefix ? `${state.prefix}-` : ''}l1-${state.n++}`
  const selector = `.${name}`
  // REQ-100 — a revealing node carries a second, fixed class purely as the
  // observer's handle. Splitting the *attribute value* from the *selector name*
  // here means every node kind's markup picks it up without any of them
  // re-litigating how a class attribute is built.
  const cls = node.reveal ? `${name} ${REVEAL_CLASS}` : name

  // REQ-106 — a node's own `id` becomes a real DOM id, so `href="#how"` has
  // something to land on. Uniqueness is the envelope validator's job (a duplicate
  // breaks both anchor navigation and the `for`<->`id` association the `control`
  // contract depends on), which is why this can be emitted unconditionally here.
  const idAttr = node.id ? ` id="${escapeHtml(node.id)}"` : ''

  // REQ-106 — the navigation role. The renderer RETAGS the node's own element as
  // an `<a>` rather than wrapping it, so the class, every paint axis and the
  // REQ-99 focus ring all stay on the element the author actually styled.
  // Wrapping would move focus to an outer element and silently cost a linked node
  // its focus indicator. `image` is the one exception — a void element cannot be
  // an anchor, so it wraps.
  //
  // `href` clears the same `isSafeUrl` allowlist as `image.src` and
  // `backgroundImageUrl`: an unsafe href degrades to the plain element, never a
  // live `javascript:` link. `_blank` always carries its `rel`; the opener
  // reference is a security hole, not a preference.
  const nodeLink: L1Link | undefined = (node as { link?: L1Link }).link
  const href = nodeLink && isSafeUrl(nodeLink.href) ? nodeLink.href : undefined
  const linkAttrs = href
    ? ` href="${escapeHtml(href)}"` +
      (nodeLink?.newTab ? ' target="_blank" rel="noopener noreferrer"' : '') +
      (nodeLink?.ariaLabel ? ` aria-label="${escapeHtml(nodeLink.ariaLabel)}"` : '')
    : ''
  /** The element name to emit — the anchor when linked, else the node's own. */
  const tag = (own: string): string => (href ? 'a' : own)
  const base: string[] = []

  if (node.geometry) {
    state.rules.push(...geometryRules(selector, node.geometry, state.column))
  }
  /**
   * The text-axis bag → CSS, shared by the `text` run and the REQ-96 `control`
   * leaf. A control is a styled, surface-painting text leaf (a placeholder, a
   * button label), so it takes exactly the same axes — factoring this is what
   * makes "L1 paints the control" literally the same code path as "L1 paints a
   * run", rather than a parallel half-implementation.
   */
  const emitTextAxes = (
    a: NonNullable<Extract<L1Node, { kind: 'text' }>['axes']>,
    r: Extract<L1Node, { kind: 'text' }>['responsive'],
  ): void => {
      const c = cssColor(a.color)
      if (c) base.push(`color: ${c}`)
      const ff = cssFontFamily(a.fontFamily)
      if (ff) base.push(`font-family: ${ff}`)
      const fontSize = px(a.fontSizePx)
      if (!r?.fontSizePx && fontSize) base.push(`font-size: ${fontSize}`)
      if (a.fontWeight !== undefined) base.push(`font-weight: ${Math.round(a.fontWeight)}`)
      const lineHeight = px(a.lineHeightPx)
      if (!r?.lineHeightPx && lineHeight) base.push(`line-height: ${lineHeight}`)
      const letterSpacing = px(a.letterSpacingPx)
      if (!r?.letterSpacingPx && letterSpacing) base.push(`letter-spacing: ${letterSpacing}`)
      if (r?.fontSizePx) state.rules.push(...scalarAxisRules(selector, 'font-size', r.fontSizePx))
      if (r?.lineHeightPx) state.rules.push(...scalarAxisRules(selector, 'line-height', r.lineHeightPx))
      if (r?.letterSpacingPx) state.rules.push(...scalarAxisRules(selector, 'letter-spacing', r.letterSpacingPx))
      if (a.textAlign) base.push(`text-align: ${a.textAlign}`)
      // REQ-88 — a run the reference kept on one line must not become breakable
      // just because the fold gave it a fixed-width box (see `axes.nowrapFromPx`).
      // At or below the ladder's floor the pin is unconditional; above it, it
      // starts at the width from which the reference stopped wrapping.
      if (a.nowrapFromPx !== undefined) {
        if (a.nowrapFromPx <= (state.minWidth ?? 0)) base.push('white-space: nowrap')
        else {
          state.rules.push({
            media: `(min-width: ${a.nowrapFromPx}px)`,
            selector,
            decls: ['white-space: nowrap'],
          })
        }
      }
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
      // BUG-20 / REQ-98 — a chip/badge run paints its OWN surface (a
      // `rounded-full` pill), through the same shared emitter as every other
      // kind. Emitted before `gradientFill` so a text-fill gradient (which
      // repurposes background-image + background-clip:text for the glyphs) still
      // wins; a run never carries both a chip fill and a glyph gradient.
      base.push(...surfaceDecls(a, { fill: !a.gradientFill }))
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
  }

  let html: string
  switch (node.kind) {
    case 'text': {
      // BUG-18 — a responsive track owns its axis (per-width media rules below);
      // the static base decl is emitted only for an axis with no track.
      emitTextAxes(node.axes ?? {}, node.responsive)
      // REQ-97 — the run's own measure. A paragraph caps its line length here
      // rather than borrowing a wrapper container's `max-width`.
      base.push(...axisSizingCss(node.sizing))
      base.push('margin: 0')
      // REQ-106 — a retagged run needs the block behaviour `<p>` had, and must not
      // inherit UA link chrome. Unshifted so any authored colour/decoration wins.
      if (href) base.unshift('display: block', 'text-decoration: none', 'color: inherit')
      html = `<${tag('p')} class="${cls}"${idAttr}${linkAttrs}>${escapeHtml(node.text)}</${tag('p')}>`
      break
    }
    case 'control': {
      // REQ-96 — L1 wraps the module: the mounted behavior declared this element
      // (its tag + attribute bundle — `type`/`name`/`required`/label wiring), and
      // L1 supplies the class, geometry and paint. The module ships no CSS for it.
      //
      // An unbound name emits nothing. That is the isolation-correct degradation:
      // a bare `<input>` with no module behind it would paint UA chrome into the
      // page and collect a field nothing submits.
      const el = state.controls?.[node.control]
      if (!el) {
        html = ''
        break
      }
      emitTextAxes(node.axes ?? {}, node.responsive)
      base.push(...axisSizingCss(node.sizing))
      // The zero-look baseline. A form control arrives with UA chrome (border,
      // fill, padding, its own font) that would paint *through* an L1 subtree
      // that simply declined to set those axes — so the sole emitter neutralises
      // it here, once, rather than every module carrying a reset stylesheet.
      // Pushed BEFORE the axes so any axis the instance did author still wins.
      base.unshift(
        '-webkit-appearance: none',
        'appearance: none',
        'margin: 0',
        'padding: 0',
        'border: 0',
        'background: transparent',
        'font: inherit',
        'color: inherit',
      )
      // A placeholder is painted by a UA pseudo-element that does NOT inherit
      // `color`, so an L1 subtree that set a field's text colour would still get
      // the browser's grey inside the box. Re-point it at the element's own
      // colour — the reference's placeholder-labelled field then paints from L1
      // like every other run.
      if (el.tag === 'input' || el.tag === 'textarea') {
        state.rules.push({ selector: `${selector}::placeholder`, decls: ['color: inherit', 'opacity: 1'] })
      }
      html = controlHtml(el, cls)
      break
    }
    case 'image': {
      const a = node.axes ?? {}
      if (a.objectFit) base.push(`object-fit: ${a.objectFit}`)
      base.push(...surfaceDecls(a))
      base.push(...axisSizingCss(node.sizing))
      base.push('display: block')
      const src = isSafeUrl(node.src) ? node.src : ''
      const img = `<img class="${cls}"${idAttr} src="${escapeHtml(src)}" alt="${escapeHtml(node.alt)}" />`
      html = href ? `<a${linkAttrs} style="display:contents">${img}</a>` : img
      break
    }
    case 'slot': {
      // REQ-93 — the mount point for a behavior module bound to this seam. When a
      // caller supplies the module's already-rendered fragment it becomes the
      // slot's content (the page validator has already proved the binding
      // resolves); with no mount it stays the inert, labelled placeholder.
      //
      // The fragment is framework-rendered markup, not instance data, so it is
      // inserted verbatim — every instance value inside it already passed the
      // module's own escaping/URL sinks on the way in.
      base.push(...surfaceDecls(node.axes ?? {}))
      const mounted = state.mounts?.[node.name] ?? ''
      html = `<div class="${cls}"${idAttr} data-l1-slot="${escapeHtml(node.name)}"${
        node.behavior ? ` data-l1-behavior="${escapeHtml(node.behavior)}"` : ''
      }>${mounted}</div>`
      break
    }
    case 'box': {
      base.push(...surfaceDecls(node.axes ?? {}))
      base.push(...axisSizingCss(node.sizing))
      if (!node.geometry) base.push('position: relative')
      const inner = (node.children ?? []).map((child) => emitNode(child, state)).join('')
      if (href) base.unshift('text-decoration: none', 'color: inherit')
      html = `<${tag('div')} class="${cls}"${idAttr}${linkAttrs}>${inner}</${tag('div')}>`
      break
    }
    case 'container': {
      // REQ-104 — layout is a per-width axis. With a track, the first keyframe is
      // the base rule and each later one is a `min-width` override; with none, the
      // static `layout` is the base and nothing else is emitted, so a document that
      // declares no responsive layout renders byte-identically to before.
      const track = node.responsiveLayout
      base.push(...layoutDecls(track ? track.keyframes[0].value : node.layout, node))
      for (const kf of track?.keyframes.slice(1) ?? []) {
        state.rules.push({
          media: `(min-width: ${kf.at}px)`,
          selector,
          decls: layoutDecls(kf.value, node),
        })
      }
      if (node.gapPx !== undefined) base.push(`gap: ${node.gapPx}px`)
      if (node.distribution) base.push(`justify-content: ${JUSTIFY[node.distribution]}`)
      if (node.align) base.push(`align-items: ${ALIGN[node.align]}`)
      // REQ-98 — a container paints AND lays out, so a painted, internally-laid-out
      // element is ONE node rather than a `box` wrapped around a `container`.
      base.push(...surfaceDecls(node.axes ?? {}))
      base.push(...axisSizingCss(node.sizing))
      if (!node.geometry) base.push('position: relative')
      // REQ-100 — a container's stagger is handed DOWN to each revealing child as
      // its share of the interval. Only children that actually reveal advance the
      // counter, so a decorative spacer between two cards does not silently buy
      // itself a slot and desynchronise everything after it.
      let revealIndex = 0
      const inner = node.children
        .map((child) => {
          const share = node.staggerMs && child.reveal ? revealIndex++ * node.staggerMs : 0
          return emitNode(child, state, share)
        })
        .join('')
      if (href) base.unshift('text-decoration: none', 'color: inherit')
      html = `<${tag('div')} class="${cls}"${idAttr}${linkAttrs}>${inner}</${tag('div')}>`
      break
    }
  }

  // REQ-91 node-level transform / mask — applicable to any node kind.
  if (node.transform) {
    const t = transformCss(node.transform)
    if (t) base.push(`transform: ${t}`)
  }
  if (node.mask) base.push(...maskDecls(node.mask))
  // BUG-17 node-level padding — a per-side inset. Emitted as longhands (only the
  // present sides) so a partial padding never resets the others. `box-sizing:
  // border-box` (the document reset) means this insets content inside the pinned
  // keyframe box rather than inflating geometry.
  //
  // REQ-88 — a side with a per-width track is owned by that track (media rules
  // below); the static longhand is emitted only for a side that does not vary,
  // exactly as BUG-18 does for the numeric type axes.
  const padTracks = node.responsivePadding
  if (node.padding) {
    const { topPx, rightPx, bottomPx, leftPx } = node.padding
    if (!padTracks?.topPx && px(topPx)) base.push(`padding-top: ${px(topPx)}`)
    if (!padTracks?.rightPx && px(rightPx)) base.push(`padding-right: ${px(rightPx)}`)
    if (!padTracks?.bottomPx && px(bottomPx)) base.push(`padding-bottom: ${px(bottomPx)}`)
    if (!padTracks?.leftPx && px(leftPx)) base.push(`padding-left: ${px(leftPx)}`)
  }
  if (padTracks?.topPx) state.rules.push(...scalarAxisRules(selector, 'padding-top', padTracks.topPx))
  if (padTracks?.rightPx) state.rules.push(...scalarAxisRules(selector, 'padding-right', padTracks.rightPx))
  if (padTracks?.bottomPx) state.rules.push(...scalarAxisRules(selector, 'padding-bottom', padTracks.bottomPx))
  if (padTracks?.leftPx) state.rules.push(...scalarAxisRules(selector, 'padding-left', padTracks.leftPx))

  // REQ-99 — interaction states. A `control` is the one kind the user can focus,
  // so it is the kind that carries the default-ring obligation; every other kind
  // gets exactly the states it authored.
  const interactive = node.kind === 'control' && Boolean(state.controls?.[node.control])
  const transitions: TransitionSpec[] = []
  if (node.interaction) {
    const { rules, transitions: t } = interactionRules(
      selector,
      node.interaction,
      node.transform,
      interactive,
    )
    state.rules.push(...rules)
    transitions.push(...t)
  } else if (interactive) {
    // A control that declared no interaction at all still gets the floor: the
    // emitter neutralises the UA's own chrome (`appearance: none`), so leaving
    // this out is what would actually strip a focus indicator.
    state.rules.push({ selector: `${selector}:focus-visible`, decls: focusRingDecls(undefined) })
  }

  // REQ-100 — scroll entrance. Emitted after `interaction` so both features'
  // transitions reach `transitionDecls` together (see its doc comment: two
  // independent emissions would leave only the last one standing).
  if (node.reveal) {
    const settledOpacity = node.kind === 'slot' ? 1 : (node.axes?.opacity ?? 1)
    const { rules, transitions: t } = revealRules(
      selector,
      node.reveal,
      staggerDelayMs,
      settledOpacity,
    )
    state.rules.push(...rules)
    transitions.push(...t)
    state.hasReveal = true
  }

  if (transitions.length) {
    base.push(...transitionDecls(transitions))
    // One blanket kill-switch covers every transitioning property on the node:
    // a single `transition-duration` value applies to the whole list.
    state.rules.push({ media: REDUCED_MOTION, selector, decls: ['transition-duration: 0ms'] })
  }

  // Visibility is emitted LAST (REQ-104) so that within any one media block it is
  // the final word on `display`. It shares that property with the layout track,
  // and a node that is both hidden at a width and laid out at it must resolve to
  // hidden — a container whose `responsiveLayout` re-declared `display: flex`
  // after a `display: none` would simply reappear.
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

  if (base.length) state.rules.push({ selector, decls: base })
  return html
}

/**
 * The `min-width` a media condition opens at, for ordering. A condition without
 * one (`max-width`, `prefers-reduced-motion`) sorts last: a max-width block is
 * disjoint from every min-width block above it so its position cannot matter, and
 * the reduced-motion kill-switch must survive whatever the width blocks set.
 */
function mediaMinWidth(media: string): number {
  const m = /\(min-width:\s*(\d+(?:\.\d+)?)px\)/.exec(media)
  return m ? Number(m[1]) : Infinity
}

function serializeRules(rules: Rule[]): string {
  // Group by media so cascade order is deterministic: base rules first, then media
  // blocks by ASCENDING breakpoint (REQ-104).
  //
  // Source order was not enough. Blocks were ordered by first appearance across
  // the whole document, so one node emitting `(min-width: 768px)` before another
  // node emitted `(min-width: 520px)` put 520 *after* 768 in the stylesheet — and
  // then, for any node declaring both, the 520 rule won at 1280px. Harmless while
  // every node keyframed at the same captured ladder; a live bug the moment two
  // authored breakpoints interleave, which is exactly what a responsive layout
  // track invites. Sorting by breakpoint makes the cascade a property of the
  // stylesheet rather than of the order nodes happened to be walked in.
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
  mediaOrder.sort((a, b) => mediaMinWidth(a) - mediaMinWidth(b))
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
  /**
   * REQ-100 — the renderer-owned reveal script, present only when the document
   * actually reveals something. Already inlined at the head of `html`; exposed
   * separately so a CSP-bound consumer can hash or nonce it rather than having
   * to find it in the markup.
   */
  js?: string
}

/** Options for {@link renderL1Document}. */
export interface L1RenderOptions {
  /**
   * REQ-93 — behavior-module fragments to mount, keyed by the L1 `slot` name each
   * is bound to. A slot with no entry renders as the inert placeholder. Rendering
   * a module needs an async Astro container, which the pure L1 emitter must not
   * own — so the caller renders first and hands the finished HTML in here.
   */
  mounts?: Readonly<Record<string, string>>
}

/** Render an L1 document to `{ html, css }`. Pure; deterministic. */
export function renderL1Document(doc: L1Document, opts: L1RenderOptions = {}): L1RenderResult {
  const state: RenderState = {
    n: 0,
    rules: [],
    column: doc.column,
    minWidth: Math.min(...doc.widths),
    mounts: opts.mounts,
  }
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
  // REQ-100 — the reveal script rides at the TOP of the body, so its
  // `data-l1-motion` marker is set before the content beneath it paints. A page
  // that reveals nothing ships no script at all.
  if (!state.hasReveal) return { html: body, css }
  return { html: `<script>${L1_REVEAL_SCRIPT}</script>\n${body}`, css, js: L1_REVEAL_SCRIPT }
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
export function renderL1Fragment(
  nodes: L1Node[],
  prefix = 'fc',
  controls?: Readonly<Record<string, L1ControlElement>>,
): L1FragmentResult {
  const state: RenderState = { n: 0, rules: [], prefix, controls }
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

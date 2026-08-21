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
import {
  isSafeUrl,
  mapL1PaletteRefs,
  resolveL1Palette,
  resolveSiteLocale,
  L1_EDIT_HOT_CLASS,
  L1_EDIT_MARKER_ATTR,
  L1_EDIT_PATH_ATTR,
  L1_EDIT_SEGMENT_ATTR,
  type L1Color,
  type L1Link,
  type L1Palette,
  type L1SegmentKind,
  type SiteLocaleInput,
} from '@1stcontact/site-schema'
import type {
  L1AxisSizing,
  L1Border,
  L1Column,
  L1ColumnAnchor,
  L1ColumnTerm,
  L1Container,
  L1Document,
  L1Filter,
  L1FocusRing,
  L1FocusState,
  L1Geometry,
  L1Gradient,
  L1GradientOrigin,
  L1HoverState,
  L1Interaction,
  L1LayoutMode,
  L1Mask,
  L1Motion,
  L1Node,
  L1Pattern,
  L1PointerAccent,
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

/**
 * A colour is emitted only if it is a valid hex literal, else dropped.
 *
 * REQ-114 — a colour axis is `hex | PaletteRef`, and {@link renderL1Document}
 * resolves every reference at its entry, so by the time a value reaches this
 * sink it is always a literal. An unresolved reference arriving here therefore
 * means a consumer bypassed resolution; it is dropped rather than emitted,
 * keeping the sink fail-closed the way every other value check here is.
 */
function cssColor(v: L1Color | undefined): string | null {
  return typeof v === 'string' && HEX.test(v) ? v : null
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
 * REQ-109 — root-relative → document-relative. A rendered snapshot must be
 * **relocatable**: the same bytes have to resolve whether they are served from a
 * host root or from `…/site/<slug>/draft/<sha>/`. A root-absolute `/assets/x.svg`
 * resolves against the apex and 404s under any path prefix, and `<base href>` is
 * no answer because it does not reach `url()` inside CSS — which is exactly where
 * the fonts and background images live.
 *
 * Dropping the leading slash is only correct because every page sits FLAT at the
 * snapshot root; `renderSite` asserts that invariant rather than let a nested page
 * emit a silently-wrong relative URL.
 *
 * The `//` guard is load-bearing, not decorative: `//evil.com/x` is a
 * protocol-relative absolute URL, and stripping its first slash would turn a
 * remote host into a local path. Everything that is not exactly one leading slash
 * — absolute URLs, `#anchor`, already-relative values — passes through untouched.
 *
 * Applied only AFTER the safety checks at each sink, so the security envelope is
 * unchanged: this rewrites the shape of an already-vetted value, it never admits
 * one.
 */
function relativizeUrl(v: string): string {
  if (!v.startsWith('/') || v.startsWith('//')) return v
  const rest = v.slice(1)
  /**
   * BUG-30 — dropping the slash is only a change of SHAPE while the remainder
   * still reads as a relative *path* reference. RFC-3986 gives it a different
   * meaning in exactly two cases, and both are diagnosed by the same question:
   * is the first path segment non-empty and colon-free?
   *
   *   - **Empty first segment** (`/`, `/#how`, `/?q=1`). With no path the
   *     reference resolves against the current DOCUMENT rather than its
   *     directory, so `/#how` — "the `how` anchor on the site root" — becomes
   *     "…on whatever page this is". Identical on a single-page site, which is
   *     why it survived until a second page existed.
   *   - **A colon in the first segment** (`/javascript:x`, `/a:b/c`). A leading
   *     `scheme:` is parsed as a scheme, so the strip would promote a path into
   *     a URL scheme. `isSafeUrl` clears `/javascript:…` precisely *because* the
   *     leading slash makes it relative; removing the slash behind its back
   *     would hand back the live `javascript:` URL it just refused.
   *
   * An explicit `./` fixes both: it forces a path segment, so the reference
   * resolves against the snapshot DIRECTORY — which is what the root-relative
   * URL meant — and can no longer be read as a scheme. Still document-relative,
   * so relocatability is untouched.
   */
  const firstSegment = rest.split(/[/?#]/, 1)[0]
  return firstSegment === '' || firstSegment.includes(':') ? `./${rest}` : rest
}

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
  return `url("${relativizeUrl(v)}")`
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
function withAlpha(color: L1Color, opacity: number | undefined): string | null {
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

/** REQ-103 — a typed radial origin → the CSS position keywords it names. */
const RADIAL_ORIGIN_CSS: Record<L1GradientOrigin, string> = {
  center: 'center',
  top: 'top',
  bottom: 'bottom',
  left: 'left',
  right: 'right',
  'top-left': 'left top',
  'top-right': 'right top',
  'bottom-left': 'left bottom',
  'bottom-right': 'right bottom',
}

/**
 * A gradient → `linear-gradient(…)` or (REQ-103) `radial-gradient(…)`, or null if
 * unpaintable. Both branches re-derive every token from a number, a hex colour or
 * a closed enum — the instance contributes no CSS syntax.
 */
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
  if (g.kind === 'radial') {
    // `<extent> at <origin>` — both keywords, both from closed enums. Omitted
    // when absent so the browser's own defaults (farthest-corner at center) win.
    const shape = [g.extent, g.origin ? `at ${RADIAL_ORIGIN_CSS[g.origin]}` : null]
      .filter((p): p is string => Boolean(p))
      .join(' ')
    return `radial-gradient(${shape ? `${shape}, ` : ''}${stops.join(', ')})`
  }
  const angle = deg(g.angleDeg)
  return `linear-gradient(${angle ? `${angle}, ` : ''}${stops.join(', ')})`
}

/** One `background-*` layer: the image plus its positional sizing triple. */
interface BgLayer {
  image: string
  size: string
  position: string
  repeat: string
}

/** A background layer that takes the CSS defaults for the sizing triple. */
function plainLayer(image: string): BgLayer {
  return { image, size: 'auto', position: '0% 0%', repeat: 'repeat' }
}

/**
 * REQ-103 — a typed pattern → the repeating background layers that draw it.
 *
 * A `grid` is two layers (one set of rules per axis) because a single CSS
 * gradient runs along one axis only; `dots` and `lines` are one each. Every
 * number is clamped into the envelope's range before it reaches a declaration,
 * and the colour passes `cssColor`, so a pattern cannot express anything but a
 * texture — it is the same "name the intent, not the declaration" contract the
 * rest of the surface group keeps.
 */
function patternLayers(p: L1Pattern): BgLayer[] {
  const c = cssColor(p.color)
  if (!c) return []
  const spacing = Math.max(1, p.spacingPx)
  // A tile is at most solid: a rule wider than its own period is a fill, not a
  // pattern, so the thickness saturates at the spacing rather than overflowing
  // into the neighbouring tile.
  const thickness = Math.min(spacing, Math.max(0, p.thicknessPx ?? (p.shape === 'dots' ? 2 : 1)))
  const tile = `${spacing}px ${spacing}px`
  switch (p.shape) {
    case 'dots': {
      // A hard-edged disc centred in each tile — `thicknessPx` is its diameter.
      const r = thickness / 2
      return [
        {
          image: `radial-gradient(circle at center, ${c} ${r}px, transparent ${r}px)`,
          size: tile,
          position: '0% 0%',
          repeat: 'repeat',
        },
      ]
    }
    case 'grid':
      // One hairline along each axis, drawn at the leading edge of every tile.
      return [
        {
          image: `linear-gradient(to bottom, ${c} ${thickness}px, transparent ${thickness}px)`,
          size: tile,
          position: '0% 0%',
          repeat: 'repeat',
        },
        {
          image: `linear-gradient(to right, ${c} ${thickness}px, transparent ${thickness}px)`,
          size: tile,
          position: '0% 0%',
          repeat: 'repeat',
        },
      ]
    case 'lines': {
      // A repeating gradient carries its own period, so this layer needs no tile
      // size — which is also what lets it tilt without the tile shearing.
      const angle = deg(p.angleDeg) ?? '0deg'
      return [
        plainLayer(
          `repeating-linear-gradient(${angle}, ${c} 0, ${c} ${thickness}px, transparent ${thickness}px, transparent ${spacing}px)`,
        ),
      ]
    }
  }
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
 * REQ-136 — a leaning quadrilateral, as `polygon()` points.
 *
 * `slantPct` is how far the TOP edge leans, as a share of the width; the bottom
 * edge leans the opposite way by the same amount, so the shape stays a
 * parallelogram (equal, opposite offsets) rather than becoming a trapezium. A
 * negative lean is the mirror image, which is why the two branches differ by
 * which pair of corners is inset rather than by a sign somewhere in the middle.
 */
function parallelogramPoints(slantPct: number): string {
  const s = Math.min(45, Math.max(-45, slantPct))
  const a = Math.abs(s)
  return s >= 0
    ? `${num(a)}% 0%, 100% 0%, ${num(100 - a)}% 100%, 0% 100%`
    : `0% 0%, ${num(100 - a)}% 0%, 100% 100%, ${num(a)}% 100%`
}

/** How many vertices a blob outline has — a renderer constant (see {@link L1Mask}). */
const BLOB_POINTS = 24

/**
 * REQ-136 — an organic "splat" outline, as `polygon()` points.
 *
 * The radius at each of {@link BLOB_POINTS} evenly-spaced angles is perturbed by
 * a **seeded** hash, so the same `(roughness, seed)` always produces the same
 * outline: a shape that differed between two renders of one document would break
 * the round-trip identity the substrate is gated on (DOC-23 §7), and would make
 * the picture visibly twitch on every editor save.
 *
 * The perturbation is deliberately smoothed across neighbouring vertices — the
 * raw hash alone gives a spiky star rather than a blob, because 24 independent
 * radii have no correlation between adjacent points. Averaging each radius with
 * its neighbours is the cheapest thing that reads as organic.
 *
 * The polygon is expressed in PERCENTAGES, so one blob fits whatever box it is
 * clipping without the renderer needing to know the box's size.
 */
function blobPoints(roughness: number, seed: number): string {
  const amount = Math.min(1, Math.max(0, roughness)) * 0.34
  // A cheap integer hash → [0, 1). Deterministic in (seed, i) and nothing else.
  const noise = (i: number): number => {
    const h = Math.sin((seed + 1) * 127.1 + i * 311.7) * 43758.5453
    return h - Math.floor(h)
  }
  const raw = Array.from({ length: BLOB_POINTS }, (_, i) => noise(i) * 2 - 1)
  const points: string[] = []
  for (let i = 0; i < BLOB_POINTS; i += 1) {
    const smooth =
      (raw[(i - 1 + BLOB_POINTS) % BLOB_POINTS] + 2 * raw[i] + raw[(i + 1) % BLOB_POINTS]) / 4
    const r = 50 * (1 - amount * (1 - smooth) * 0.5)
    const angle = (i / BLOB_POINTS) * Math.PI * 2
    points.push(`${num(50 + r * Math.cos(angle))}% ${num(50 + r * Math.sin(angle))}%`)
  }
  return points.join(', ')
}

/**
 * REQ-136 — the typed colour-adjustment stack → one `filter` declaration.
 *
 * EMISSION ORDER IS FIXED here rather than taken from the object's key order,
 * and that is load-bearing: CSS filter functions compose in sequence, so
 * `grayscale(1) saturate(2)` and `saturate(2) grayscale(1)` paint differently.
 * Key order in a JSON object is an accident of how a file was written or a diff
 * was applied, and letting it decide the pixels would make the same axes render
 * two ways.
 *
 * An absent field is the function's identity, so it is skipped — which is also
 * why a value AT the identity emits nothing: `saturate(1)` is a declaration that
 * costs a composite layer and changes no pixel.
 */
function filterDecls(f: L1Filter): string[] {
  const parts: string[] = []
  const scale = (name: string, v: number | undefined): void => {
    if (v !== undefined && v >= 0 && v !== 1) parts.push(`${name}(${num(v)})`)
  }
  const amount = (name: string, v: number | undefined): void => {
    if (v !== undefined && v > 0) parts.push(`${name}(${num(Math.min(1, v))})`)
  }
  amount('grayscale', f.grayscale)
  amount('sepia', f.sepia)
  amount('invert', f.invert)
  scale('saturate', f.saturate)
  scale('brightness', f.brightness)
  scale('contrast', f.contrast)
  if (f.hueRotateDeg !== undefined && f.hueRotateDeg !== 0) {
    parts.push(`hue-rotate(${num(f.hueRotateDeg)}deg)`)
  }
  if (f.blurPx !== undefined && f.blurPx > 0) parts.push(`blur(${num(f.blurPx)}px)`)
  return parts.length ? [`filter: ${parts.join(' ')}`] : []
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
    case 'parallelogram':
      return [`clip-path: polygon(${parallelogramPoints(m.slantPct ?? 12)})`]
    case 'blob':
      return [`clip-path: polygon(${blobPoints(m.roughness ?? 0.5, m.seed ?? 0)})`]
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
  // REQ-103 — the layer order, top-most first: a scrim covers everything; a
  // texture reads *over* the wash and the backdrop it textures; a gradient washes
  // the image; the image sits on the solid fill. So a dot-grid over a radial glow
  // over a dark fill — the ordinary dark-theme stack — is what the axes say.
  const bgLayers: BgLayer[] = []
  if (a.overlay) {
    const c8 = withAlpha(a.overlay.color, a.overlay.opacity)
    if (c8) bgLayers.push(plainLayer(`linear-gradient(${c8}, ${c8})`))
  }
  if (a.pattern) bgLayers.push(...patternLayers(a.pattern))
  if (a.surfaceGradient) {
    const g = gradientCss(a.surfaceGradient)
    if (g) bgLayers.push(plainLayer(g))
  }
  const bgUrl = cssUrl(a.backgroundImageUrl)
  if (bgUrl) {
    // BUG-13 — a section/band background image fills its box (cover, centered, no
    // tiling) — the faithful default for a hero/section backdrop.
    bgLayers.push({ image: bgUrl, size: 'cover', position: 'center', repeat: 'no-repeat' })
  }
  if (bgLayers.length) out.push(`background-image: ${bgLayers.map((l) => l.image).join(', ')}`)
  // The sizing triple is *positional* — one value per layer, in layer order — so a
  // tiled pattern and a `cover` backdrop can coexist on one box. A surface with no
  // pattern has at most one layer that cares, so it keeps emitting the single
  // value BUG-13 set (and a surface with no layer that cares emits nothing).
  if (a.pattern && bgLayers.length) {
    out.push(
      `background-size: ${bgLayers.map((l) => l.size).join(', ')}`,
      `background-position: ${bgLayers.map((l) => l.position).join(', ')}`,
      `background-repeat: ${bgLayers.map((l) => l.repeat).join(', ')}`,
    )
  } else if (bgUrl) {
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
  // REQ-136 — the node's own paint, colour-adjusted. AFTER `backdrop-filter` so
  // the pair reads in the order they composite (what is behind, then what is
  // here) and a reader of the emitted rule can tell them apart; they are separate
  // properties, so the order carries no cascade meaning.
  if (a.filter) out.push(...filterDecls(a.filter))
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

// ── REQ-108 pointer accent: the texture, redrawn under the reader's hand ──────
//
// The construction is REQ-100's, one step further. A document names a *typed
// value bag* (`pointerAccent`) and only this emitter knows it compiles to a
// pseudo-element, a mask built from N radial lobes, and one shared pointer
// listener. No document can name a selector, a mask string, or a script.
//
// Four properties make it safe rather than merely pretty:
//
//   1. **It fails visible, and it fails STILL.** The overlay rule is gated on a
//      `data-l1-pointer` marker that only the script sets, and on the *first real
//      pointermove* at that — not on load. No JS, a touch device, a
//      reduced-motion preference, or a headless capture (which never moves a
//      pointer) → the marker is absent, the rule never matches, and the band
//      paints its plain texture. This is also what keeps the L1 round-trip honest:
//      the captured page is the unaccented page.
//   2. **The accent cannot drift from the texture.** It is not a second design —
//      it is the node's own {@link L1Pattern} re-emitted through
//      {@link patternLayers} with one colour substituted, or the node's own
//      background asset used as its own mask at the identical `cover / center`
//      geometry. Change the grid's spacing and the accent follows, because it is
//      the same call.
//   3. **The script carries no instance data.** Every number from the axis — the
//      reach, the lobe radii, the angular offsets, the feather — is baked into the
//      CSS here. The script supplies only N lagging cursor trackers, so it never
//      learns a radius, a colour, or how many lobes a mask happens to use.
//   4. **It composes rather than covers.** The overlay sits at `z-index: -1` so it
//      paints above the node's own background and *below* its content — a teal
//      grid line never lands on top of a headline. That ordering is only reliable
//      inside a stacking context, which is why an accented node also takes
//      `isolation: isolate` — behind the same marker, so §1 has no exception;
//      without it a negative-z pseudo-element escapes to an ancestor and hides
//      behind the band's own fill.

/** The class an author cannot write: the pointer listener's handle on a node. */
const POINTER_CLASS = 'l1-pt'
/** Set by the script only on a real pointer's first move (see §1 above). */
const POINTER_MARKER = 'html[data-l1-pointer]'
/**
 * How many lobes make up the region's outline.
 *
 * A renderer constant, deliberately NOT an axis: how many bumps read as "rough"
 * is a property of the mechanism, and exposing it would let a document reach into
 * the mask's construction (and, at a large enough count, into the compositor's
 * budget). Seven is enough for an outline with no evident symmetry, and it is
 * coprime with the 3× radial variation in {@link pointerLobes} so no two lobes
 * share a reach.
 */
const POINTER_LOBES = 7
/** Inherited from `<html>`: 1 once a pointer is in the page, 0 when it leaves. */
const POINTER_OPACITY_VAR = '--l1-pto'
/**
 * How far a lobe's radius may jitter while the pointer is at full speed, as a
 * fraction of that radius.
 *
 * This is the dial that makes the edge *boil*: at 0.3 a lobe swings ±30% of its
 * reach frame to frame, so grid lines sitting near the boundary drop in and out of
 * the accent colour as the hand moves. Small values read as a soft breathing edge
 * and lose the effect entirely on a sparse grid, where whole seconds can pass with
 * no line near enough to the boundary to flicker.
 */
const POINTER_FLICKER = 0.3
/**
 * The pointer speed (px per frame) at which flicker reaches full amplitude.
 *
 * Below it the jitter scales down, and it is zero for a still pointer — which is
 * what reconciles "random" with "stable while the mouse is still". ~26px/frame is
 * an ordinary brisk mouse movement at 60Hz, so the effect is at full boil during
 * normal use rather than only during a flick.
 */
const POINTER_FLICKER_SPEED = 26
/** The fade when the pointer leaves the window — not the tracking, which is JS. */
const POINTER_FADE_MS = 220

/**
 * How many times an asset-drawn texture is composited into its own mask.
 *
 * A mask takes a texture's ALPHA, so an accent drawn through one can never paint
 * heavier than the texture did — and the hero's grid is stroked at 0.24, which put
 * the first cut of this axis ~25 levels away from the cream it sat on: measurable,
 * and invisible. An accent that can only ever equal the line it replaces cannot be
 * seen on a faint line, so the mask layer is repeated and the copies ADD
 * (`1-(1-a)^n`), saturating a faint texture toward a full-strength accent while
 * leaving an already-solid one exactly where it was.
 *
 * A renderer constant rather than an axis, for the same reason {@link POINTER_LOBES}
 * is: it is a property of the mechanism (how hard the accent asserts itself over a
 * faint texture), not a design decision, and dressing "how many mask passes" up as
 * an author-facing strength dial would be naming the implementation.
 *
 * Chosen by looking: at 4 passes the hero's 0.24 grid reaches ~0.68 — clearly a
 * teal line rather than a tinted one — without the region reading as a wash.
 */
const POINTER_TEXTURE_PASSES = 4

/** One lobe of the region: its offset from the cursor, its radius, its hard core. */
interface PointerLobe {
  dx: number
  dy: number
  radius: number
  /** Where the mask is still fully opaque — the feather runs from here to `radius`. */
  inner: number
  /** Which of the script's lagging trackers this lobe rides. */
  tracker: number
  /** Whether the script's per-lobe flicker scales it (the core never flickers). */
  flickers: boolean
}

/**
 * REQ-108 — the region's *resting* outline: a stable core plus protruding bumps.
 *
 * This is the shape the region settles to, and it is produced by construction
 * rather than by chance: fixed angles, fixed radii, so a still pointer sits in the
 * same region every time and the rendered stylesheet stays deterministic. The
 * flicker that makes the edge feel alive is the script's (see
 * {@link L1_POINTER_SCRIPT}), applied on top of these numbers as a per-lobe scale
 * — so *movement* is random while *rest* is not.
 *
 * **Why a core and bumps rather than N overlapping discs.** The first two cuts
 * unioned N near-concentric circles, and a union of discs whose centres all sit
 * well inside the region and whose radii are all a similar large fraction of it
 * is a circle — no amount of harmonic variation in the radii rescues it, because
 * the boundary is always the outermost of several overlapping arcs of nearly the
 * same curvature. Rendered on a dense grid it read as a disc with a dent, which is
 * what "way too much like a circle" describes.
 *
 * So the shape is built the other way round: ONE core disc, deliberately well
 * inside the region, and N small bumps pushed OUT toward the boundary at varied
 * distances and radii. Where a bump sits, the outline bulges to `reach_i`; between
 * bumps it falls back to the core. With the numbers below the boundary swings
 * between ~0.7R and R rather than ~0.86R and R, and — because it is falling back
 * to a smaller circle rather than to another big arc — the bays read as bays.
 *
 * Three harmonics (2θ, 3θ, 5θ, none a divisor of the bump count) drive the reach,
 * a fourth skews the angular spacing so the bumps do not sit at even intervals,
 * and a fifth varies each bump's own size. Nothing repeats around the circle.
 *
 * `roughness: 0` collapses the core to the full radius and every bump to a disc
 * tangent to it from the inside — so the union is exactly a plain circle of
 * `radiusPx`. The dial's floor is a neat circle and its ceiling is an amoeba.
 */
function pointerLobes(accent: L1PointerAccent): PointerLobe[] {
  const R = accent.radiusPx
  const rough = accent.roughness ?? 0.5
  const soft = accent.softnessPx ?? R / 6
  const feather = (radius: number): number => Math.max(0, radius - soft)

  // The core: what the outline falls back to between bumps, and what keeps the
  // middle solid. It rides tracker 0 (the quickest) and never flickers — a pulsing
  // middle would read as the whole region breathing rather than its edge boiling.
  const core = R * (1 - 0.45 * rough)
  const lobes: PointerLobe[] = [
    { dx: 0, dy: 0, radius: core, inner: feather(core), tracker: 0, flickers: false },
  ]

  for (let i = 0; i < POINTER_LOBES; i++) {
    const even = (i / POINTER_LOBES) * Math.PI * 2
    const t = even + 0.34 * rough * Math.sin(3 * even + 0.8)
    // Amplitudes sum to 1, so `wobble` spans [-1, 1] and the reach spans
    // [R(1-0.35·rough), R]: a rougher outline eats INWARD. The axis names the
    // region's outer bound, so no bump may grow past what the author asked for.
    const wobble =
      0.46 * Math.cos(3 * t + 1.7) + 0.32 * Math.cos(5 * t + 0.4) + 0.22 * Math.cos(2 * t + 2.6)
    const reach = R * (1 - 0.35 * rough * (0.5 + 0.5 * wobble))
    // Each bump has its own size, so they read as different features rather than
    // one feature repeated. Small enough to protrude, large enough that its base
    // always overlaps the core — otherwise a bump would float free of the region.
    const radius = R * 0.28 * (0.7 + 0.6 * (0.5 + 0.5 * Math.sin(5 * t + 1.1)))
    const d = reach - radius
    lobes.push({
      dx: d * Math.cos(t),
      dy: d * Math.sin(t),
      radius,
      inner: feather(radius),
      tracker: i,
      flickers: true,
    })
  }
  return lobes
}

/**
 * One lobe centre coordinate: the script's tracker plus this lobe's fixed offset.
 *
 * The fallback is far outside any box, so a marker set without the trackers ever
 * having been written (nothing does that, but the rule should not depend on it)
 * masks to nothing rather than blooming at the origin.
 */
function pointerTerm(varName: string, offset: number): string {
  const o = Math.round(offset * 1e4) / 1e4
  const fallback = `var(${varName}, -9999px)`
  if (o === 0) return fallback
  return `calc(${fallback} ${o < 0 ? '-' : '+'} ${num(Math.abs(o))}px)`
}

/**
 * One lobe's gradient stop, scaled by the script's per-lobe jitter.
 *
 * The length stays in the CSS and only a unitless MULTIPLIER crosses into the
 * script, which is what keeps {@link L1_POINTER_SCRIPT} free of instance data
 * while still letting it flicker the edge: it never learns the radius it is
 * scaling. Defaults to 1, so a lobe the script has not touched — no JS, or the
 * frame before the first jitter — is exactly the resting geometry.
 */
function pointerScaled(i: number, length: number): string {
  return `calc(var(--l1-pt${i}s, 1) * ${num(length)}px)`
}

/**
 * REQ-108 — a node's pointer accent → the overlay rules that paint it.
 *
 * Returns nothing at all when the node paints no texture: the axis accents *a
 * texture*, and on a node with neither a pattern nor a background image there is
 * nothing to redraw, so the honest emission is silence rather than a bloom of flat
 * colour following the mouse.
 */
function pointerAccentRules(selector: string, a: L1SurfaceAxes): Rule[] {
  const accent = a.pointerAccent
  if (!accent) return []
  const color = cssColor(accent.color)
  if (!color) return []

  // The region, as layers of one colour — `#000` when it is masking (only its alpha
  // is read) or the accent colour when it is painting. Layers UNION either way,
  // because both a background stack and a mask stack composite `source-over` by
  // default, so the region is the shape the lobes cover TOGETHER. That default is
  // also why no `mask-composite` is emitted anywhere: the one construction that
  // needed `intersect` is the one this function no longer uses.
  const region = (c: string): BgLayer[] =>
    pointerLobes(accent).map((l) => {
      // The core takes its lengths straight; only a bump is scaled by the script's
      // flicker, so the middle stays put while the edge boils.
      const inner = l.flickers ? pointerScaled(l.tracker, l.inner) : `${num(l.inner)}px`
      const outer = l.flickers ? pointerScaled(l.tracker, l.radius) : `${num(l.radius)}px`
      return {
        image:
          `radial-gradient(circle at ${pointerTerm(`--l1-pt${l.tracker}x`, l.dx)} ` +
          `${pointerTerm(`--l1-pt${l.tracker}y`, l.dy)}, ${c} ${inner}, transparent ${outer})`,
        size: 'auto',
        position: '0 0',
        repeat: 'no-repeat',
      }
    })

  const decls = [
    "content: ''",
    'position: absolute',
    'inset: 0',
    // §4 — above the node's own background, below its content.
    'z-index: -1',
    // Decoration must never eat a click, a hover or a text selection.
    'pointer-events: none',
    // A rounded band would otherwise show square accent corners.
    'border-radius: inherit',
    `opacity: var(${POINTER_OPACITY_VAR}, 0)`,
    `transition: opacity ${POINTER_FADE_MS}ms ease-out`,
  ]

  // The texture and the region take OPPOSITE sides of the compositing pair, chosen
  // by which side the texture can occupy: a pattern is drawn by gradients, so it
  // must be the paint and the region masks it; an asset carries only alpha the
  // renderer cannot recolour, so it must be the mask and the region paints. Each
  // arrangement is a union-only stack, which is why neither needs `mask-composite`.
  let paint: BgLayer[]
  let mask: BgLayer[]
  if (a.pattern) {
    // §2 — the SAME emitter as the base texture, with one colour substituted.
    paint = patternLayers({ ...a.pattern, color: accent.color })
    if (!paint.length) return []
    mask = region('#000')
  } else {
    // The asset branch — the hero's perspective grid, which no orthogonal tile can
    // express. The asset is strokes on transparency, so its ALPHA is the grid: mask
    // with it and the accent lands on exactly those strokes, recolouring them with
    // no second asset and no colour baked into a file. The region cannot also be a
    // mask layer here (a union of lobes intersected with the asset is not a
    // union-only stack), so it becomes the paint instead — which is the same result
    // by the other route, and leaves the asset free to repeat and gain weight.
    const url = cssUrl(a.backgroundImageUrl)
    if (!url) return []
    paint = region(color)
    // BUG-13's geometry, restated verbatim, so the teal strokes land on the brown
    // ones at every viewport rather than sliding off them.
    mask = Array.from({ length: POINTER_TEXTURE_PASSES }, () => ({
      image: url,
      size: 'cover',
      position: 'center',
      repeat: 'no-repeat',
    }))
  }

  decls.push(
    `background-image: ${paint.map((l) => l.image).join(', ')}`,
    `background-size: ${paint.map((l) => l.size).join(', ')}`,
    `background-position: ${paint.map((l) => l.position).join(', ')}`,
    `background-repeat: ${paint.map((l) => l.repeat).join(', ')}`,
  )
  // The prefixed longhands first, so a browser that understands both takes the
  // standard ones (older Safari and Chrome know only the prefixed forms).
  for (const prefix of ['-webkit-', '']) {
    decls.push(
      `${prefix}mask-image: ${mask.map((m) => m.image).join(', ')}`,
      `${prefix}mask-size: ${mask.map((m) => m.size).join(', ')}`,
      `${prefix}mask-position: ${mask.map((m) => m.position).join(', ')}`,
      `${prefix}mask-repeat: ${mask.map((m) => m.repeat).join(', ')}`,
    )
  }

  const overlay = `${POINTER_MARKER} ${selector}::after`
  return [
    // §4 — the node must be a stacking context, or the negative-z overlay escapes to
    // an ancestor and paints BEHIND this node's own background. `isolation` rather
    // than `z-index: 0` because it creates the context without entering the sibling
    // z-order, so a band that gains an accent cannot start painting over the one
    // above it.
    //
    // Gated on the marker like every other declaration the axis adds, which makes
    // the fail-visible invariant TOTAL: "nothing this axis emits applies before a
    // pointer moves", with no exception to carve out of the test. Measured
    // unconditionally it moved nothing on a resting band (0 pixels, reveals
    // settled) — but a stacking context is the kind of thing that can change how a
    // band rasterises, and not creating one until it is needed costs nothing.
    { selector: `${POINTER_MARKER} ${selector}`, decls: ['isolation: isolate'] },
    { selector: overlay, decls },
    // Belt and braces on the reduced-motion obligation, exactly as the reveal does
    // it: the script already declines to set the marker, and this makes the overlay
    // inert even if some other path sets it. A cursor-tracking region is motion.
    { media: REDUCED_MOTION, selector: overlay, decls: ['display: none'] },
  ]
}

/**
 * The one renderer-owned script that drives every pointer accent on the page —
 * vetted once, identical for every site, carrying no instance data of any kind
 * (§3 above): it knows how many trackers to run and how hard each one lags, and
 * nothing else. Reach, roughness, feather and colour never reach it.
 *
 * It returns *before* setting the marker whenever the effect must not run — no
 * pointer events, no rAF, a reduced-motion preference, or an input that is not a
 * fine hovering pointer (a touchscreen has no cursor to follow, and a
 * finger-triggered bloom under an element the reader just tapped is noise). And it
 * sets the marker on the first real `pointermove` rather than on load, so a page
 * nobody has moved a pointer over — every capture, every crawler — is the plain
 * page.
 *
 * The trackers are what make the region deform. Each eases toward the cursor by
 * its own fraction, so while the pointer moves they string out behind it and the
 * lobes they carry pull the outline apart; when it stops they all converge on the
 * same point and the outline settles to the fixed shape {@link pointerLobes}
 * describes.
 *
 * The *flicker* is the second half, and it is genuinely random: each lobe's radius
 * is scaled by a value that chases a fresh random target every frame, so the edge
 * boils and lines at the boundary drop in and out of the accent colour. Its
 * amplitude is proportional to POINTER SPEED — the region flickers hardest while
 * the hand is moving and stops dead when it isn't, which is why "random" and
 * "stable while still" are not in tension. Randomness lives here rather than in
 * the emitted CSS deliberately: the stylesheet stays deterministic, so two renders
 * are byte-identical and a capture reproduces.
 *
 * The scales SNAP to exactly 1 once the jitter has decayed, rather than easing
 * asymptotically toward it. A region that drifted by a thousandth of a pixel
 * forever would keep the rAF loop alive and keep repainting a still page.
 *
 * Two pieces of state, not one, and the distinction matters: `on` is the ONE-TIME
 * arming of the marker (§1 — it can never be taken back, because the CSS gate is
 * what makes the page fail visible), while `dim` is the REVERSIBLE visibility that
 * the leave/blur handlers toggle. Folding the opacity restore into the `on` branch
 * — where it began — meant it ran exactly once ever: switch to another window and
 * back, and the accent was faded out with nothing left to turn it on again.
 *
 * The rAF loop runs only while some tracker is short of the cursor or some lobe is
 * off its resting scale, and stops when neither is true — so a still pointer costs
 * nothing per frame. "Stable while the mouse is still" is met by *not running*
 * rather than by damping.
 *
 * Every rect is read before any property is written, so a frame never interleaves
 * layout reads with style writes.
 */
export const L1_POINTER_SCRIPT = `(function(){
var d=document.documentElement;
if(!('PointerEvent' in window)||!('requestAnimationFrame' in window)||!window.matchMedia)return;
try{
if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
if(!window.matchMedia('(hover: hover) and (pointer: fine)').matches)return;
}catch(e){return}
var N=${POINTER_LOBES},LAG=[0.5,0.36,0.28,0.22,0.17,0.13,0.1];
var JIT=${POINTER_FLICKER},SPD=${POINTER_FLICKER_SPEED};
var px=0,py=0,tx=null,ty=null,sc=null,raf=0,on=false,dim=true,spd=0,lx=0,ly=0;
function frame(){
raf=0;
var i,j,busy=false;
var mx=px-lx,my=py-ly;lx=px;ly=py;
spd+=(Math.sqrt(mx*mx+my*my)-spd)*0.3;
var amp=spd<0.5?0:Math.min(1,spd/SPD);
for(i=0;i<N;i++){
var ex=px-tx[i],ey=py-ty[i];
if(ex*ex+ey*ey>0.04)busy=true;
tx[i]+=ex*LAG[i];ty[i]+=ey*LAG[i];
var tg=1+(Math.random()*2-1)*JIT*amp;
sc[i]+=(tg-sc[i])*0.45;
if(amp===0&&Math.abs(sc[i]-1)<0.004)sc[i]=1;
if(sc[i]!==1)busy=true;
}
var ns=document.getElementsByClassName('${POINTER_CLASS}'),rects=[];
for(j=0;j<ns.length;j++)rects.push(ns[j].getBoundingClientRect());
for(j=0;j<ns.length;j++){
var r=rects[j],s=ns[j].style;
for(i=0;i<N;i++){
s.setProperty('--l1-pt'+i+'x',(tx[i]-r.left)+'px');
s.setProperty('--l1-pt'+i+'y',(ty[i]-r.top)+'px');
s.setProperty('--l1-pt'+i+'s',sc[i]);
}}
if(busy)raf=requestAnimationFrame(frame);
}
function move(e){
if(e.pointerType&&e.pointerType!=='mouse'&&e.pointerType!=='pen')return;
px=e.clientX;py=e.clientY;
if(!tx){tx=[];ty=[];sc=[];lx=px;ly=py;for(var i=0;i<N;i++){tx.push(px);ty.push(py);sc.push(1)}}
if(!on){on=true;d.setAttribute('data-l1-pointer','')}
if(dim){dim=false;d.style.setProperty('${POINTER_OPACITY_VAR}','1')}
if(!raf)raf=requestAnimationFrame(frame);
}
function fade(){if(!dim){dim=true;d.style.setProperty('${POINTER_OPACITY_VAR}','0')}}
document.addEventListener('pointermove',move,{passive:true});
document.addEventListener('pointerleave',fade);
window.addEventListener('blur',fade);
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
function anchorDecls(
  anchor: L1ColumnAnchor,
  col: L1Column,
  widthProp: 'width' | 'min-width' = 'width',
): string[] {
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
  if (anchor.width && !anchor.width.pxTrack) decls.push(`${widthProp}: ${termCss(anchor.width)}`)
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
  prop: 'left' | 'width' | 'min-width',
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
function geometryRules(
  selector: string,
  geo: L1Geometry,
  column?: L1Column,
  nowrapFromPx?: number,
): Rule[] {
  const frames = geo.keyframes
  const rules: Rule[] = []
  // REQ-88 — suppression is PER AXIS: a node may take its left edge from the
  // column while its width stays keyframed (see `l1ColumnAnchorSchema`).
  const anchor = column ? geo.anchor : undefined
  const anchoredX = Boolean(anchor?.x)
  const anchoredWidth = Boolean(anchor?.width)
  const yF = geo.viewportResponse?.yFactor ?? 0
  const hF = geo.viewportResponse?.heightFactor ?? 0

  /**
   * REQ-117 — the captured width of a run that cannot wrap is a FLOOR, not a cap.
   *
   * The fold pins `width` to what the reference text measured. That is exactly
   * right while the text is the reference text, and silently destructive the
   * moment anyone edits it: a longer string overflows the box, and where the
   * run is painted by a gradient clipped to its glyphs (`background-clip: text`
   * with a transparent `color` — the common treatment for a display heading)
   * the overflow falls outside the background's painting area and is drawn with
   * NOTHING. Not clipped, not ellipsised, not spilling — absent. The editor
   * reports a successful save and the page shows the old words.
   *
   * `min-width` keeps the captured geometry as the floor while letting the box
   * grow with its content, so the paint area grows with it.
   *
   * This applies ONLY where `white-space: nowrap` is in force. For a wrapping
   * run the fixed width is load-bearing — it is what decides the line breaks —
   * and relaxing it to a floor would let an absolutely-positioned run stretch
   * to its shrink-to-fit width and reflow every line. So the swap is keyed to
   * the breakpoint at which the reference stopped wrapping (`nowrapFromPx`):
   * at or above it the width cannot affect breaking, below it still can.
   */
  const relaxed = (atPx: number): boolean => nowrapFromPx !== undefined && atPx >= nowrapFromPx

  /**
   * The width declaration(s) for one rung.
   *
   * `width: auto` is not decoration — it is what keeps the ladder working. The
   * rungs are cumulative overrides of the SAME property: the rule at 320px stays
   * in force at 1280px and is simply overridden by the rules above it. Renaming
   * the upper rungs to `min-width` stops them overriding anything, which leaves
   * the lowest rung's *interpolation* live far outside the segment it was fitted
   * to — `calc(-836.545px + 314.545vw)` is 343px at 375px wide and 3190px at
   * 1280px. Resetting `width` to `auto` on the same rung restores the override
   * and hands sizing to shrink-to-fit, with the captured value as the floor.
   */
  const widthDecls = (atPx: number, value: string): string[] =>
    relaxed(atPx) ? [`width: auto`, `min-width: ${value}`] : [`width: ${value}`]

  /** Held (non-interpolated) declarations for one keyframe. */
  const decls = (kf: L1Geometry['keyframes'][number]): string[] => {
    const h = kf.atHeight
    const d: string[] = [`top: ${h ? viewportResponsive(`${kf.y}px`, yF, h) : `${kf.y}px`}`]
    if (!anchoredX) d.push(`left: ${kf.x}px`)
    if (!anchoredWidth) d.push(...widthDecls(kf.at, `${kf.width}px`))
    if (kf.height !== undefined) {
      d.push(`height: ${h ? viewportResponsive(`${kf.height}px`, hF, h) : `${kf.height}px`}`)
    }
    return d
  }

  // The anchored-width declarations carry no media query of their own, so they
  // may only relax to a floor when the run cannot wrap ANYWHERE on the ladder —
  // otherwise the floor would also apply below the wrap threshold.
  // An anchored width owns the axis alone (keyframe widths are suppressed), so
  // there is no earlier `width` to reset — the prop is all that is needed.
  const anchorWidthProp: 'width' | 'min-width' = relaxed(frames[0].at) ? 'min-width' : 'width'
  const staticDecls: string[] = ['position: absolute']
  if (anchor) staticDecls.push(...anchorDecls(anchor, column!, anchorWidthProp))
  if (anchor?.x?.pxTrack) rules.push(...anchorTrackRules(selector, 'left', anchor.x, column!))
  if (anchor?.width?.pxTrack) {
    rules.push(...anchorTrackRules(selector, anchorWidthProp, anchor.width, column!))
  }

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
      if (!anchoredWidth) d.push(...widthDecls(a.at, lerpCalc(a.width, a.at, b.width, b.at)))
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

// ── REQ-116 the edit render ──────────────────────────────────────────────────
//
// A third render channel (DOC-28 §5): the same document and the same emitter,
// rendered so the page deliberately does NOT work — no link target, no behaviour
// or motion script — and every editable region is addressable.
//
// The address is a **render-scoped structural path**. The emitter is already
// walking the tree, so it stamps the child indices it walked; a client would
// otherwise have to rebuild that mapping from the rendered DOM and keep it
// valid. It is indexed from the render's root node LIST — `[doc.root]` for a
// document, the subtree array for a fragment — so one resolution rule covers
// both: index the list, then `children` at each later step.
//
// Nothing is persisted and nothing in the definition changes. The path only has
// to stay valid for the lifetime of the one render the client is displaying,
// because every edit re-renders and regenerates it — which is why the usual
// objection (reordering siblings breaks a structural path) does not apply here.
//
// L1's own `id` is deliberately NOT reused for this: REQ-106 made it the real
// DOM id, so it is optional, sparse, and user-visible in URLs.
//
// REQ-117 — the attribute names and the segment vocabulary are the *contract*,
// not the rendering of it, so they are defined once in `@1stcontact/site-schema`
// alongside the resolution rule that reads them. Re-exported here because this
// is where the stamp is written and where consumers already look for it.
export {
  L1_EDIT_MARKER_ATTR,
  L1_EDIT_PAGE_ATTR,
  L1_EDIT_PATH_ATTR,
  L1_EDIT_SEGMENT_ATTR,
  L1_EDIT_HOT_CLASS,
  type L1SegmentKind,
} from '@1stcontact/site-schema'

/**
 * The edit channel's own stylesheet — one faint outline per segment, drawn by
 * the renderer because the renderer is what knows which boxes are segments.
 *
 * `outline` rather than `border`: it is painted outside the layout, so the edit
 * render's geometry stays the draft render's geometry and a segment cannot shift
 * merely by becoming outlined.
 *
 * REQ-117 adds the hover treatment. The rule is here, with the outline it
 * strengthens; which segment is hot is the client's to decide, and it says so by
 * putting {@link L1_EDIT_HOT_CLASS} on the element. The "small movement" DOC-28
 * §7.1 asks for is the outline lifting OFF the box — a change of `outline-offset`
 * and nothing else. Moving the element itself would reflow the page under the
 * pointer and, worse, make the edit render's geometry differ from the draft's the
 * moment a user hovers.
 */
export const L1_EDIT_CSS = [
  `[${L1_EDIT_SEGMENT_ATTR}] { outline: 1px solid rgba(99, 102, 241, 0.35); outline-offset: -1px; transition: outline-color 120ms, outline-width 120ms, outline-offset 120ms }`,
  `[${L1_EDIT_SEGMENT_ATTR}].${L1_EDIT_HOT_CLASS} { outline: 2px solid rgba(99, 102, 241, 0.9); outline-offset: 3px }`,
].join('\n')

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
  /** REQ-108 — set once any node accents, so a page with no accent ships no script. */
  hasPointerAccent?: boolean
  /** REQ-116 — render the edit channel: addresses stamped, the page inert. */
  edit?: boolean
}

/**
 * The hex a palette reference stands in for while {@link l1PaintsSurface} asks
 * whether an axis paints. Any valid hex would do — it is compared against
 * nothing and emitted nowhere.
 */
const PAINT_PROBE_HEX = '#000000'

/**
 * True when this node paints something — which is exactly when a `box` or a
 * `container` is a segment (see {@link segmentKind}).
 *
 * Exported for REQ-140's **escalation**: the text modal offers a route to "the
 * panel behind this text", and finding that panel means walking a run's
 * ancestors for the nearest one the editor can actually open. That question has
 * one right answer — the one the emitter used when it decided what to stamp —
 * and a caller re-deriving it from its own list of paint axes would drift the
 * first time an axis is added to `surfaceDecls`. So the rule stays stated once,
 * here, and the escalation asks it rather than guessing.
 *
 * THE QUESTION IS ABOUT THE AXIS, NOT THE CSS IT COMPILES TO TODAY (REQ-135).
 * On the published path the palette is folded before render, so a colour axis
 * holds a hex by the time it reaches {@link surfaceDecls}. On the EDITOR read
 * path it is not: a panel painted `{ ref: 'ink' }` still holds the reference,
 * `cssColor` accepts hex only, and asking `surfaceDecls` its bare question would
 * answer that a panel painted from the palette paints nothing. That breaks the
 * new capability's own round trip — the escalation row exists to set that fill,
 * so the one gesture it enables would delete the row, and `segmentKind` below
 * would stop stamping an address on a panel whose only paint is a reference.
 *
 * So the axes are asked with every reference standing in for the hex it will
 * resolve to. The stand-in is never rendered: this function answers yes/no and
 * discards the declarations. `mapL1PaletteRefs` is REQ-133's ONE structural
 * walk, so this reaches a reference wherever one is legal — a fill, an overlay
 * colour, a gradient stop — rather than special-casing `surfaceFill` and
 * drifting again the next time a colour axis is added.
 */
export function l1PaintsSurface(node: L1Node): boolean {
  if (node.kind !== 'box' && node.kind !== 'container') return false
  const axes = mapL1PaletteRefs(node.axes ?? {}, () => PAINT_PROBE_HEX) as L1SurfaceAxes
  return surfaceDecls(axes).length > 0
}

/**
 * Which editable region, if any, this node IS (DOC-28 §6.2). Segmentation is
 * **derived from the tree**, never declared on it: no schema change, no author
 * burden, and no page silently uneditable because an annotation was forgotten.
 *
 * Returning `null` is load-bearing — a node with nothing to edit carries no
 * address and gets no outline, so the outlines themselves are the user's map of
 * what the editor can do.
 */
function segmentKind(node: L1Node, state: RenderState): L1SegmentKind | null {
  switch (node.kind) {
    case 'text':
      return 'copy'
    case 'image':
      return 'image'
    case 'slot':
      // A seam with a behavior mounted in it is the module segment; the instance
      // itself stays addressed by the `data-fc-module` hook already stamped on
      // its root (CHAT-9 M1). An UNMOUNTED slot is the inert placeholder — it
      // renders nothing and has nothing to edit.
      return state.mounts?.[node.name] ? 'module' : null
    case 'box':
    case 'container':
      // "Carries paint" is answered by asking the paint emitter, not by keeping a
      // second list of axis names in step with it by hand. A box is a container
      // segment exactly when it would emit a surface declaration — so every axis
      // added to `surfaceDecls` in future is covered without touching this.
      return l1PaintsSurface(node) ? 'container' : null
    default:
      // `control` — a leaf whose element, attributes and behaviour belong to the
      // mounted module (REQ-96). It holds no copy to edit and no asset to swap,
      // so phase 1 offers no control for it and it is not outlined.
      return null
  }
}

function emitNode(
  node: L1Node,
  state: RenderState,
  /** REQ-116 — the child indices walked to reach this node from the render root. */
  path: readonly number[],
  staggerDelayMs = 0,
): string {
  const name = `${state.prefix ? `${state.prefix}-` : ''}l1-${state.n++}`
  const selector = `.${name}`
  // REQ-108 — the accent overlay. Resolved here, before the class attribute, so
  // the marker class is added only when the accent actually paints: the emitter
  // returns nothing for a node whose axis names no texture to redraw, and a class
  // on such a node would make the script write custom properties every frame for
  // an overlay that does not exist.
  //
  // REQ-116 — the edit render draws none of it. The accent is a pointer-driven
  // decoration whose script the edit channel does not emit, so its overlay would
  // sit at its `--l1-pto` default of 0 forever: identical pixels, minus a
  // pseudo-element and a stack of gradients per node.
  const accentRules = state.edit
    ? []
    : pointerAccentRules(selector, (node.axes ?? {}) as L1SurfaceAxes)

  // REQ-100 — a revealing node carries a second, fixed class purely as the
  // observer's handle; REQ-108's accent adds a third the same way. Splitting the
  // *attribute value* from the *selector name* here means every node kind's markup
  // picks them up without any of them re-litigating how a class attribute is built.
  //
  // REQ-116 — the edit render emits neither. The reveal handle exists only for
  // the observer to find, and the edit channel ships no observer; leaving it on
  // would advertise a motion the page cannot perform.
  const marks = [name]
  if (node.reveal && !state.edit) marks.push(REVEAL_CLASS)
  if (accentRules.length) marks.push(POINTER_CLASS)
  const cls = marks.join(' ')

  // REQ-106 — a node's own `id` becomes a real DOM id, so `href="#how"` has
  // something to land on. Uniqueness is the envelope validator's job (a duplicate
  // breaks both anchor navigation and the `for`<->`id` association the `control`
  // contract depends on), which is why this can be emitted unconditionally here.
  const idAttr = node.id ? ` id="${escapeHtml(node.id)}"` : ''

  // REQ-116 — the edit bridge: this node's segment kind and its render-scoped
  // address, stamped together and only on a node the editor offers a control
  // for. Both are absent from the published and draft-preview renders.
  const segment = state.edit ? segmentKind(node, state) : null
  const editAttrs = segment
    ? ` ${L1_EDIT_PATH_ATTR}="${path.join('.')}" ${L1_EDIT_SEGMENT_ATTR}="${segment}"`
    : ''

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
  const href =
    nodeLink && isSafeUrl(nodeLink.href) ? relativizeUrl(nodeLink.href.trim()) : undefined
  //
  // REQ-116 — in the edit render a link has no target: clicking it opens its copy
  // editor, it does not navigate. The `<a>` ELEMENT is kept (only the navigable
  // attributes are dropped) so the edit render differs from the draft render by
  // the missing target and nothing else — same tag, same class, same declarations,
  // same box. An `<a>` without `href` is not a link: it is unfocusable,
  // unnavigable, and picks up none of the UA's link chrome.
  const linkAttrs =
    href && !state.edit
      ? ` href="${escapeHtml(href)}"` +
        (nodeLink?.newTab ? ' target="_blank" rel="noopener noreferrer"' : '') +
        (nodeLink?.ariaLabel ? ` aria-label="${escapeHtml(nodeLink.ariaLabel)}"` : '')
      : ''
  /** The element name to emit — the anchor when linked, else the node's own. */
  const tag = (own: string): string => (href ? 'a' : own)
  const base: string[] = []

  if (node.geometry) {
    // REQ-117 — only a run that cannot wrap hands its width over as a floor
    // (see `geometryRules`). A `control` is a text leaf on the same axes, so it
    // qualifies on the same terms; a box's width is structure and never does.
    const nowrapFromPx =
      node.kind === 'text' || node.kind === 'control' ? node.axes?.nowrapFromPx : undefined
    state.rules.push(...geometryRules(selector, node.geometry, state.column, nowrapFromPx))
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
      html = `<${tag('p')} class="${cls}"${idAttr}${editAttrs}${linkAttrs}>${escapeHtml(node.text)}</${tag('p')}>`
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
      // REQ-136 — which part of the picture the box shows. Emitted next to
      // `object-fit` because the pair is one idea: `cover` says the box is a
      // window, and this says where the window looks. Absent means the browser's
      // centre, which is why nothing is emitted for an unset axis.
      if (a.objectPosition) {
        base.push(`object-position: ${num(a.objectPosition.xPct)}% ${num(a.objectPosition.yPct)}%`)
      }
      base.push(...surfaceDecls(a))
      base.push(...axisSizingCss(node.sizing))
      base.push('display: block')
      const src = isSafeUrl(node.src) ? relativizeUrl(node.src.trim()) : ''
      const img = `<img class="${cls}"${idAttr}${editAttrs} src="${escapeHtml(src)}" alt="${escapeHtml(node.alt)}" />`
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
      // REQ-105 — the seam's own measure. A mounted module is constrained by the
      // slot it mounts into, so a max-width no longer costs a wrapper container
      // that carries nothing but the number.
      base.push(...axisSizingCss(node.sizing))
      const mounted = state.mounts?.[node.name] ?? ''
      html = `<div class="${cls}"${idAttr}${editAttrs} data-l1-slot="${escapeHtml(node.name)}"${
        node.behavior ? ` data-l1-behavior="${escapeHtml(node.behavior)}"` : ''
      }>${mounted}</div>`
      break
    }
    case 'box': {
      base.push(...surfaceDecls(node.axes ?? {}))
      base.push(...axisSizingCss(node.sizing))
      if (!node.geometry) base.push('position: relative')
      const inner = (node.children ?? [])
        .map((child, i) => emitNode(child, state, [...path, i]))
        .join('')
      if (href) base.unshift('text-decoration: none', 'color: inherit')
      html = `<${tag('div')} class="${cls}"${idAttr}${editAttrs}${linkAttrs}>${inner}</${tag('div')}>`
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
        .map((child, i) => {
          const share = node.staggerMs && child.reveal ? revealIndex++ * node.staggerMs : 0
          return emitNode(child, state, [...path, i], share)
        })
        .join('')
      if (href) base.unshift('text-decoration: none', 'color: inherit')
      html = `<${tag('div')} class="${cls}"${idAttr}${editAttrs}${linkAttrs}>${inner}</${tag('div')}>`
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
  //
  // REQ-116 — the edit render emits no reveal at all, which is what puts the
  // content in its SETTLED state rather than its initial one. Dropping only the
  // observer script would be the trap: the pre-state rule would still hold at
  // `opacity: 0`, so a page that fades its copy in on scroll would render that
  // copy invisible — and a segment nobody can see is a segment nobody can click.
  if (node.reveal && !state.edit) {
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

  // REQ-108 — the accent overlay's own rules (resolved at the top of the emitter).
  // Its opacity fade is the pseudo-element's, not the node's, so it stays out of
  // `transitions` and cannot collide with a hover or an entrance on the node.
  if (accentRules.length) {
    state.rules.push(...accentRules)
    state.hasPointerAccent = true
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
   * The renderer-owned scripts the document actually needs — REQ-100's reveal
   * observer, REQ-108's pointer accent — concatenated in emission order, and
   * absent entirely when it needs none. Already inlined at the head of `html`;
   * exposed separately so a CSP-bound consumer can hash or nonce it rather than
   * having to find it in the markup.
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
  /**
   * REQ-114 — the site palette any colour reference in `doc` resolves against
   * (DOC-23 §5). Omit it for a literal-only document, which is every document the
   * capture→L1 fold produces.
   *
   * Resolution happens once, here at the entry, rather than at each of the dozen
   * colour sinks: the emitter then sees exactly the document it would have seen
   * had the colours been written as literals, which is what makes converting a
   * site's literals to references **pixel-identical by construction**. An
   * unresolvable reference throws — there is no render-time fallback.
   */
  palette?: L1Palette
  /**
   * REQ-116 — render the **edit** channel (DOC-28 §5): the same document, with
   * every editable region stamped with its segment kind and render-scoped
   * address, and the page deliberately non-functional — links carry no target,
   * no motion is emitted, and content therefore renders in its settled state.
   *
   * It is a render MODE, not a new artifact: never published, never
   * content-addressed, and never entered in `history.json` (DOC-12 §11).
   */
  edit?: boolean
}

/** Render an L1 document to `{ html, css }`. Pure; deterministic. */
export function renderL1Document(input: L1Document, opts: L1RenderOptions = {}): L1RenderResult {
  const doc = resolveL1Palette(input, opts.palette)
  const state: RenderState = {
    n: 0,
    rules: [],
    column: doc.column,
    minWidth: Math.min(...doc.widths),
    mounts: opts.mounts,
    edit: opts.edit,
  }
  // The document's root node list is the single `doc.root`, so its address is
  // `0` — the same "index the list, then walk `children`" rule a fragment uses.
  const body = emitNode(doc.root, state, [0])
  const reset = [
    '*, *::before, *::after { box-sizing: border-box }',
    'html, body { margin: 0; padding: 0 }',
  ]
  const bg = cssColor(doc.background)
  if (bg) reset.push(`body { background-color: ${bg} }`)
  // REQ-114 — the page's inherited text colour. Its former home was the
  // `--color-text` theme token, which went with the legacy palette; a page-level
  // colour is a property of the L1 document, not of a token surface.
  const fg = cssColor(doc.textColor)
  if (fg) reset.push(`body { color: ${fg} }`)
  // REQ-90 — @font-face rules first so every family handle is bound before any
  // rule references it (no serif fallback while the CSS is parsed top-down).
  const faces = fontFaceRules(doc.resources)
  const css = [reset.join('\n'), ...faces, serializeRules(state.rules)].join('\n')
  // REQ-100 — the reveal script rides at the TOP of the body, so its
  // `data-l1-motion` marker is set before the content beneath it paints. A page
  // that reveals nothing ships no script at all, and REQ-108's accent script is
  // present on the same terms: only when a node actually carries the axis.
  const scripts: string[] = []
  if (state.hasReveal) scripts.push(L1_REVEAL_SCRIPT)
  if (state.hasPointerAccent) scripts.push(L1_POINTER_SCRIPT)
  if (!scripts.length) return { html: body, css }
  const js = scripts.join('\n')
  return { html: `<script>${js}</script>\n${body}`, css, js }
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
  opts: { palette?: L1Palette; edit?: boolean } = {},
): L1FragmentResult {
  const state: RenderState = { n: 0, rules: [], prefix, controls, edit: opts.edit }
  // REQ-116 — a fragment's addresses are rooted at the SUBTREE ARRAY, so they are
  // relative to the mounted instance rather than to the document. The client
  // reads which instance and which seam off the enclosing `data-fc-module` /
  // `data-l1-slot`, so copy inside a behavior module's slot is addressable
  // without the module having to know anything about the page it sits on.
  const htmls = resolveL1Palette(nodes, opts.palette).map((node, i) => emitNode(node, state, [i]))
  return { htmls, css: serializeRules(state.rules) }
}

/**
 * Render an L1 document to a complete, standalone HTML page.
 *
 * REQ-151 — `lang` and `dir` come from the site's locale identity, not from a
 * literal. `locale` is the site's four raw fields; the resolution (country →
 * locale/currency/timezone, and locale → direction) is `resolveSiteLocale`,
 * which is also what the generator's page renderer calls. That shared call is
 * the whole of AC-4: the two paths cannot drift apart because neither owns the
 * rule. Absent, a site is `US`/`en-US` — the value this literal used to be.
 */
export function renderL1Page(
  doc: L1Document,
  title = 'L1',
  locale: SiteLocaleInput = {},
): string {
  const { html, css } = renderL1Document(doc)
  const resolved = resolveSiteLocale(locale)
  return `<!doctype html>
<html lang="${escapeHtml(resolved.locale)}" dir="${resolved.dir}">
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

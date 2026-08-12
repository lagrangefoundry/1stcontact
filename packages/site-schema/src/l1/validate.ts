/**
 * L1 envelope validator (REQ-82 / REQ-79 D3) — the safety envelope as a
 * *property of L1*, not a CI bolt-on.
 *
 * Two layers:
 *   1. **Shape + type** — the Zod schema ({@link l1DocumentSchema}): typed axes,
 *      closed enums, `.strict()` objects (no freeform CSS/HTML/JS keys), hex-only
 *      colours, finite numbers.
 *   2. **Envelope** — this file: numeric value ranges, a URL-scheme allowlist,
 *      geometry-track well-formedness, and depth / node-count caps.
 *
 * Robustness by construction: an out-of-range or oversize document is rejected
 * here *before* it can reach the renderer, so the only emitter never receives a
 * value that could hang or break a browser.
 */
import { l1DocumentSchema } from './schema'
import { collectL1PaletteRefs } from './palette'
import type { L1Palette } from './palette'
import { projectIssues } from '../issues'
import type { L1Document, L1Geometry, L1Node, L1ScalarTrack } from './types'
import type { Result, ValidationError } from '../validate'

/** Envelope bounds — the numeric ranges + structural caps L1 admits. */
export const L1_ENVELOPE = {
  /** Max element tree depth (root = depth 1). */
  maxDepth: 32,
  /** Max total node count in a document. */
  maxNodes: 2000,
  /** Font size must render legibly and not blow out layout. */
  fontSizePx: { min: 1, max: 400 },
  /** CSS font-weight range. */
  fontWeight: { min: 1, max: 1000 },
  /** Absolute geometry coordinate/extent bounds (band coordinates, px). */
  geometryPx: { min: -100_000, max: 100_000 },
  /** Line-height / letter-spacing / radius / gap sane ceilings. */
  lengthPx: { min: -10_000, max: 100_000 },
  /** Shadow / border / blur / mask lengths (REQ-91) — non-negative blur, bounded offsets. */
  effectPx: { min: -10_000, max: 10_000 },
  /** Uniform transform scale (REQ-91) — a sane bound so a huge scale can't blow out layout. */
  transformScale: { min: 0.01, max: 100 },
  /** Transform rotation (REQ-91) — an angle, not a length: ±10 full turns. */
  rotateDeg: { min: -3600, max: 3600 },
  /** BUG-17 — per-side box-model padding (px); non-negative, bounded so it can't blow out layout. */
  paddingPx: { min: 0, max: 10_000 },
  /** REQ-99 — interaction transition duration; bounded so a state change can't stall for minutes. */
  transitionMs: { min: 0, max: 10_000 },
  /** REQ-99 — focus-ring width; the floor is 1 so a ring can never be authored away. */
  focusRingPx: { min: 1, max: 100 },
  /**
   * REQ-103 — a pattern's tile period. The floor is what makes this an envelope
   * rule rather than taste: a sub-pixel spacing tiles a full-bleed band millions
   * of times and is a way to hang a compositor, so the smallest period L1 admits
   * is one device pixel. The ceiling keeps a "texture" from becoming one rule in
   * the middle of a section, which is a border wearing the wrong axis.
   */
  patternSpacingPx: { min: 1, max: 1000 },
  /** REQ-103 — a pattern's line width / dot diameter, bounded like any effect length. */
  patternThicknessPx: { min: 0, max: 1000 },
  /**
   * REQ-108 — how far a pointer accent reaches from the cursor. The floor keeps a
   * region from being a sub-pixel artefact no reader can see (a mask that costs a
   * repaint per frame and paints nothing); the ceiling keeps "an accent under the
   * hand" from becoming a full-bleed recolour that follows the mouse, which is a
   * different design and a compositor cost the author did not choose.
   */
  pointerAccentRadiusPx: { min: 8, max: 1000 },
  /**
   * REQ-136 — the multiplier a colour-adjustment function may carry
   * (`saturate` / `brightness` / `contrast`). The schema already says
   * non-negative; the envelope says how far from 1 a document may go. The ceiling
   * is what keeps "adjust the picture" from becoming a white rectangle
   * (`brightness(400)`), which is not an adjustment but a way to delete content
   * the page still pays to download. `grayscale` / `sepia` / `invert` need no
   * rule — the schema pins them to 0..1, which is the whole of their range.
   */
  filterAmount: { min: 0, max: 4 },
} as const

/**
 * Characters a URL may never carry *raw*, because the value is later emitted
 * into an HTML attribute **and** into a CSS `url("…")` string. A newline (or any
 * control character) terminates a CSS string, after which a `}` closes the rule
 * and everything following becomes live CSS — the classic declaration break-out.
 * Quotes, backslash, parentheses and angle brackets close or re-open the
 * surrounding token in one context or the other. A legitimate served asset or
 * http(s) URL never needs any of them raw: percent-encoding carries them.
 */
const URL_FORBIDDEN_CHARS = /[\u0000-\u0020\u007f-\u009f"'\\()<>]/

/**
 * URL scheme allowlist for image `src`. Relative and root-relative URLs pass;
 * absolute URLs must be http(s). Everything else — `javascript:`, `data:`,
 * `vbscript:`, `file:` — is rejected. Mirrors the framework content-safety
 * boundary, re-implemented here to keep site-schema dependency-free.
 *
 * Beyond the scheme, the value must be free of {@link URL_FORBIDDEN_CHARS} so it
 * cannot break out of the HTML attribute or CSS string it is emitted into
 * (DOC-2 §2 — no instance string ever becomes raw CSS or HTML).
 */
export function isSafeUrl(url: string): boolean {
  const trimmed = url.trim()
  if (trimmed === '') return false
  if (URL_FORBIDDEN_CHARS.test(trimmed)) return false
  // A scheme is `word:` at the very start (before any / ? #). No scheme → relative.
  const scheme = /^([a-zA-Z][a-zA-Z0-9+.-]*):/.exec(trimmed)
  if (!scheme) return !/^\s*javascript:/i.test(trimmed) // defensive; relative is safe
  return /^https?$/i.test(scheme[1])
}

function inRange(n: number, lo: number, hi: number): boolean {
  return Number.isFinite(n) && n >= lo && n <= hi
}

function checkGeometry(
  geo: L1Geometry,
  widths: readonly number[],
  path: string,
  errors: ValidationError[],
): void {
  const { keyframes, segments } = geo
  let prevAt = -Infinity
  keyframes.forEach((kf, i) => {
    if (kf.at <= prevAt) {
      errors.push({
        path: `${path}/keyframes/${i}/at`,
        message: `keyframes must be sorted strictly ascending by 'at' (got ${kf.at} after ${prevAt})`,
      })
    }
    prevAt = kf.at
    if (!widths.includes(kf.at)) {
      errors.push({
        path: `${path}/keyframes/${i}/at`,
        message: `keyframe width ${kf.at} is not one of the document widths [${widths.join(', ')}]`,
      })
    }
    for (const [k, v] of Object.entries({ x: kf.x, y: kf.y, width: kf.width, height: kf.height })) {
      if (v !== undefined && !inRange(v, L1_ENVELOPE.geometryPx.min, L1_ENVELOPE.geometryPx.max)) {
        errors.push({
          path: `${path}/keyframes/${i}/${k}`,
          message: `geometry ${k}=${v} out of range [${L1_ENVELOPE.geometryPx.min}, ${L1_ENVELOPE.geometryPx.max}]`,
        })
      }
    }
  })
  if (segments && segments.length !== keyframes.length - 1) {
    errors.push({
      path: `${path}/segments`,
      message: `segments length ${segments.length} must equal keyframes.length - 1 (${keyframes.length - 1})`,
    })
  }
  // REQ-88 — the viewport-relative extents are closed-form CSS lengths, so they
  // take the same px envelope as the keyframe coordinates they replace. A column
  // fraction is a unitless multiplier and gets its own bound: a node may sit a
  // column-width or two outside the column, never thousands.
  // A height response is meaningless without the origin it is measured from, and
  // applying it against a missing `atHeight` would silently treat 0 as the capture
  // height — turning `100vh` into `y + 100vh`. Require the pair.
  if (geo.viewportResponse) {
    keyframes.forEach((kf, i) => {
      if (kf.atHeight === undefined) {
        errors.push({
          path: `${path}/keyframes/${i}/atHeight`,
          message: 'geometry.viewportResponse requires every keyframe to carry `atHeight`',
        })
      }
    })
  }
  if (geo.anchor) {
    if (!geo.anchor.x && !geo.anchor.width) {
      errors.push({ path: `${path}/anchor`, message: 'geometry.anchor must govern at least one of `x` / `width`' })
    }
    for (const axis of ['x', 'width'] as const) {
      const term = geo.anchor[axis]
      if (!term) continue
      for (const k of ['px', 'maxPx'] as const) {
        const v = term[k]
        if (v !== undefined && !inRange(v, L1_ENVELOPE.geometryPx.min, L1_ENVELOPE.geometryPx.max)) {
          errors.push({ path: `${path}/anchor/${axis}/${k}`, message: `${k}=${v} out of range` })
        }
      }
      if (term.fraction !== undefined && !inRange(term.fraction, -10, 10)) {
        errors.push({ path: `${path}/anchor/${axis}/fraction`, message: `fraction=${term.fraction} out of range [-10, 10]` })
      }
    }
  }
}

/**
 * BUG-18 — well-formedness for a responsive scalar-axis track, mirroring
 * {@link checkGeometry}: keyframe `at` values are captured widths, strictly
 * ascending, each `value` sits in the axis's numeric range, and the optional
 * segment flags are exactly one shorter than the keyframes.
 */
function checkScalarTrack(
  track: L1ScalarTrack,
  widths: readonly number[],
  range: { min: number; max: number },
  path: string,
  errors: ValidationError[],
): void {
  const { keyframes, segments } = track
  let prevAt = -Infinity
  keyframes.forEach((kf, i) => {
    if (kf.at <= prevAt) {
      errors.push({
        path: `${path}/keyframes/${i}/at`,
        message: `keyframes must be sorted strictly ascending by 'at' (got ${kf.at} after ${prevAt})`,
      })
    }
    prevAt = kf.at
    if (!widths.includes(kf.at)) {
      errors.push({
        path: `${path}/keyframes/${i}/at`,
        message: `keyframe width ${kf.at} is not one of the document widths [${widths.join(', ')}]`,
      })
    }
    if (!inRange(kf.value, range.min, range.max)) {
      errors.push({
        path: `${path}/keyframes/${i}/value`,
        message: `value=${kf.value} out of range [${range.min}, ${range.max}]`,
      })
    }
  })
  if (segments && segments.length !== keyframes.length - 1) {
    errors.push({
      path: `${path}/segments`,
      message: `segments length ${segments.length} must equal keyframes.length - 1 (${keyframes.length - 1})`,
    })
  }
}

/** Bound a single length against the effect range; push an error if out of range. */
function checkEffectLen(
  v: number | undefined,
  path: string,
  errors: ValidationError[],
): void {
  if (v !== undefined && !inRange(v, L1_ENVELOPE.effectPx.min, L1_ENVELOPE.effectPx.max)) {
    errors.push({
      path,
      message: `${v} out of range [${L1_ENVELOPE.effectPx.min}, ${L1_ENVELOPE.effectPx.max}]`,
    })
  }
}

/**
 * REQ-91 — robustness bounds for the structured effect axes (shadow/border/blur/
 * mask/transform lengths + scale) and the security scheme-check for a box
 * background image URL. Schema already enforces finite numbers, hex colours, and
 * closed enums; this is the envelope's numeric-range + URL-allowlist layer.
 */
function checkEffects(node: L1Node, path: string, errors: ValidationError[]): void {
  if (node.transform) {
    const r = node.transform.rotateDeg
    if (r !== undefined && !inRange(r, L1_ENVELOPE.rotateDeg.min, L1_ENVELOPE.rotateDeg.max)) {
      errors.push({
        path: `${path}/transform/rotateDeg`,
        message: `rotateDeg ${r} out of range [${L1_ENVELOPE.rotateDeg.min}, ${L1_ENVELOPE.rotateDeg.max}]`,
      })
    }
    const s = node.transform.scale
    if (
      s !== undefined &&
      !inRange(s, L1_ENVELOPE.transformScale.min, L1_ENVELOPE.transformScale.max)
    ) {
      errors.push({
        path: `${path}/transform/scale`,
        message: `scale ${s} out of range [${L1_ENVELOPE.transformScale.min}, ${L1_ENVELOPE.transformScale.max}]`,
      })
    }
  }
  if (node.mask) checkEffectLen(node.mask.featherPx, `${path}/mask/featherPx`, errors)

  // BUG-17 — per-side padding must sit in the non-negative padding range.
  if (node.padding) {
    for (const side of ['topPx', 'rightPx', 'bottomPx', 'leftPx'] as const) {
      const v = node.padding[side]
      if (v !== undefined && !inRange(v, L1_ENVELOPE.paddingPx.min, L1_ENVELOPE.paddingPx.max)) {
        errors.push({
          path: `${path}/padding/${side}`,
          message: `padding ${side}=${v} out of range [${L1_ENVELOPE.paddingPx.min}, ${L1_ENVELOPE.paddingPx.max}]`,
        })
      }
    }
  }

  // REQ-98 — the shared surface group is bounded ONCE, for every kind that can
  // paint. Previously each kind's slice was checked by hand, so the envelope
  // inherited the same arbitrariness as the schema: `borderLeft`'s width was
  // never bounded on any kind, and a background image URL was scheme-checked
  // only on a `box`. One group, one check, no kind left out.
  //
  // REQ-99 — and it is called for an *interaction state* too, because a hover
  // delta restates the same axes: a state that could carry an unbounded shadow
  // or an unchecked background URL would be a hole in the envelope that opens
  // only on pointer-over, i.e. exactly where nothing would notice it.
  if (node.axes) checkSurface(node.axes, `${path}/axes`, errors)
  // REQ-96 — a `control` leaf carries the same text-axis bag as a `text` run
  // (it is a styled, surface-painting leaf), so it takes the same bounds.
  if ((node.kind === 'text' || node.kind === 'control') && node.axes) {
    checkShadow(node.axes.textShadow, `${path}/axes/textShadow`, errors)
  }

  if (node.interaction) checkInteraction(node.interaction, `${path}/interaction`, errors)

  // REQ-100 — the scroll-entrance axis takes the same duration ceiling as an
  // interaction transition: both are "how long a node spends not yet settled",
  // and an unbounded one is content the reader waits on indefinitely. The delay
  // is bounded for the same reason — a stagger share adds to it, so an
  // unbounded delay is an unbounded time-to-content.
  if (node.reveal) {
    for (const field of ['durationMs', 'delayMs'] as const) {
      const v = node.reveal[field]
      if (v !== undefined && !inRange(v, L1_ENVELOPE.transitionMs.min, L1_ENVELOPE.transitionMs.max)) {
        errors.push({
          path: `${path}/reveal/${field}`,
          message: `${field}=${v} out of range [${L1_ENVELOPE.transitionMs.min}, ${L1_ENVELOPE.transitionMs.max}]`,
        })
      }
    }
    checkEffectLen(node.reveal.yPx, `${path}/reveal/yPx`, errors)
  }
  if (node.kind === 'container' && node.staggerMs !== undefined) {
    if (!inRange(node.staggerMs, L1_ENVELOPE.transitionMs.min, L1_ENVELOPE.transitionMs.max)) {
      errors.push({
        path: `${path}/staggerMs`,
        message: `staggerMs=${node.staggerMs} out of range [${L1_ENVELOPE.transitionMs.min}, ${L1_ENVELOPE.transitionMs.max}]`,
      })
    }
  }
}

/** Bound a structured shadow's four lengths. */
function checkShadow(
  s: { offsetXPx: number; offsetYPx: number; blurPx?: number; spreadPx?: number } | undefined,
  path: string,
  errors: ValidationError[],
): void {
  if (!s) return
  checkEffectLen(s.offsetXPx, `${path}/offsetXPx`, errors)
  checkEffectLen(s.offsetYPx, `${path}/offsetYPx`, errors)
  checkEffectLen(s.blurPx, `${path}/blurPx`, errors)
  checkEffectLen(s.spreadPx, `${path}/spreadPx`, errors)
}

/**
 * REQ-98 — numeric bounds + the URL allowlist for the shared surface/paint group,
 * wherever it appears: a node's `axes`, or a REQ-99 interaction-state delta.
 */
function checkSurface(
  axes: {
    borderRadiusPx?: number
    boxShadow?: { offsetXPx: number; offsetYPx: number; blurPx?: number; spreadPx?: number }
    border?: { widthPx: number }
    borderLeft?: { widthPx: number }
    backdropBlurPx?: number
    backgroundImageUrl?: string
    pattern?: { spacingPx: number; thicknessPx?: number; angleDeg?: number }
    pointerAccent?: { radiusPx: number; softnessPx?: number }
    filter?: {
      saturate?: number
      brightness?: number
      contrast?: number
      hueRotateDeg?: number
      blurPx?: number
    }
  },
  path: string,
  errors: ValidationError[],
): void {
  if (
    axes.borderRadiusPx !== undefined &&
    !inRange(axes.borderRadiusPx, L1_ENVELOPE.lengthPx.min, L1_ENVELOPE.lengthPx.max)
  ) {
    errors.push({
      path: `${path}/borderRadiusPx`,
      message: `borderRadiusPx=${axes.borderRadiusPx} out of range`,
    })
  }
  checkShadow(axes.boxShadow, `${path}/boxShadow`, errors)
  if (axes.border) checkEffectLen(axes.border.widthPx, `${path}/border/widthPx`, errors)
  if (axes.borderLeft) checkEffectLen(axes.borderLeft.widthPx, `${path}/borderLeft/widthPx`, errors)
  checkEffectLen(axes.backdropBlurPx, `${path}/backdropBlurPx`, errors)
  if (axes.backgroundImageUrl !== undefined && !isSafeUrl(axes.backgroundImageUrl)) {
    errors.push({
      path: `${path}/backgroundImageUrl`,
      message: `backgroundImageUrl '${axes.backgroundImageUrl}' is not an allowed URL (http/https or relative only)`,
    })
  }
  // REQ-103 — the texture axis takes the same treatment as every other numeric
  // pixel-mover: the schema pins its shape and its hex colour, the envelope pins
  // how large a value it may hold. Bounded here (in the shared surface check) so
  // an interaction state's pattern delta is bounded by the same rule as the base.
  if (axes.pattern) {
    const { spacingPx, thicknessPx, angleDeg } = axes.pattern
    const spacing = L1_ENVELOPE.patternSpacingPx
    if (!inRange(spacingPx, spacing.min, spacing.max)) {
      errors.push({
        path: `${path}/pattern/spacingPx`,
        message: `spacingPx=${spacingPx} out of range [${spacing.min}, ${spacing.max}]`,
      })
    }
    const thickness = L1_ENVELOPE.patternThicknessPx
    if (thicknessPx !== undefined && !inRange(thicknessPx, thickness.min, thickness.max)) {
      errors.push({
        path: `${path}/pattern/thicknessPx`,
        message: `thicknessPx=${thicknessPx} out of range [${thickness.min}, ${thickness.max}]`,
      })
    }
    checkEffectLen(angleDeg, `${path}/pattern/angleDeg`, errors)
  }
  // REQ-108 — the pointer accent's reach and feather are lengths, bounded here for
  // the same reason the pattern's are: the schema says a positive number, the
  // envelope says how large a number a document may hold. `roughness` needs no
  // rule — the schema already pins it to 0..1, which is the whole of its range.
  if (axes.pointerAccent) {
    const { radiusPx, softnessPx } = axes.pointerAccent
    const reach = L1_ENVELOPE.pointerAccentRadiusPx
    if (!inRange(radiusPx, reach.min, reach.max)) {
      errors.push({
        path: `${path}/pointerAccent/radiusPx`,
        message: `radiusPx=${radiusPx} out of range [${reach.min}, ${reach.max}]`,
      })
    }
    checkEffectLen(softnessPx, `${path}/pointerAccent/softnessPx`, errors)
  }
  // REQ-136 — the colour-adjustment stack. Bounded HERE, in the shared surface
  // check, so an interaction state's filter delta is bounded by the same rule as
  // the base — the hole REQ-99 named for shadows and background URLs applies
  // identically to an adjustment that only fires on pointer-over.
  if (axes.filter) {
    const { min, max } = L1_ENVELOPE.filterAmount
    for (const name of ['saturate', 'brightness', 'contrast'] as const) {
      const v = axes.filter[name]
      if (v !== undefined && !inRange(v, min, max)) {
        errors.push({
          path: `${path}/filter/${name}`,
          message: `${name}=${v} out of range [${min}, ${max}]`,
        })
      }
    }
    // An angle, bounded like every other rotation the substrate admits.
    const hue = axes.filter.hueRotateDeg
    if (hue !== undefined && !inRange(hue, L1_ENVELOPE.rotateDeg.min, L1_ENVELOPE.rotateDeg.max)) {
      errors.push({
        path: `${path}/filter/hueRotateDeg`,
        message: `hueRotateDeg=${hue} out of range [${L1_ENVELOPE.rotateDeg.min}, ${L1_ENVELOPE.rotateDeg.max}]`,
      })
    }
    checkEffectLen(axes.filter.blurPx, `${path}/filter/blurPx`, errors)
  }
}

/**
 * REQ-99 — the interaction envelope: state paint deltas take the same surface
 * bounds as the base node, motion takes the transform bounds, and the transition
 * duration and focus-ring width are bounded so no state can stall a page or
 * shrink an indicator toward invisibility.
 */
function checkInteraction(
  interaction: NonNullable<L1Node['interaction']>,
  path: string,
  errors: ValidationError[],
): void {
  const d = interaction.transition?.durationMs
  if (d !== undefined && !inRange(d, L1_ENVELOPE.transitionMs.min, L1_ENVELOPE.transitionMs.max)) {
    errors.push({
      path: `${path}/transition/durationMs`,
      message: `durationMs=${d} out of range [${L1_ENVELOPE.transitionMs.min}, ${L1_ENVELOPE.transitionMs.max}]`,
    })
  }
  for (const state of ['hover', 'focus'] as const) {
    const s = interaction[state]
    if (!s) continue
    checkSurface(s, `${path}/${state}`, errors)
    const m = s.motion
    if (m) {
      checkEffectLen(m.offsetXPx, `${path}/${state}/motion/offsetXPx`, errors)
      checkEffectLen(m.offsetYPx, `${path}/${state}/motion/offsetYPx`, errors)
      checkEffectLen(m.rotateDeg, `${path}/${state}/motion/rotateDeg`, errors)
      if (
        m.scale !== undefined &&
        !inRange(m.scale, L1_ENVELOPE.transformScale.min, L1_ENVELOPE.transformScale.max)
      ) {
        errors.push({
          path: `${path}/${state}/motion/scale`,
          message: `scale ${m.scale} out of range [${L1_ENVELOPE.transformScale.min}, ${L1_ENVELOPE.transformScale.max}]`,
        })
      }
    }
  }
  const ring = interaction.focus?.ring
  if (ring) {
    if (!inRange(ring.widthPx, L1_ENVELOPE.focusRingPx.min, L1_ENVELOPE.focusRingPx.max)) {
      errors.push({
        path: `${path}/focus/ring/widthPx`,
        message: `focus ring widthPx=${ring.widthPx} out of range [${L1_ENVELOPE.focusRingPx.min}, ${L1_ENVELOPE.focusRingPx.max}] — a focus indicator may not be authored away`,
      })
    }
    checkEffectLen(ring.offsetPx, `${path}/focus/ring/offsetPx`, errors)
  }
}

function walk(
  node: L1Node,
  widths: readonly number[],
  path: string,
  depth: number,
  counter: { n: number },
  errors: ValidationError[],
): void {
  counter.n += 1
  if (depth > L1_ENVELOPE.maxDepth) {
    errors.push({ path, message: `tree depth ${depth} exceeds cap ${L1_ENVELOPE.maxDepth}` })
    return
  }

  if (node.geometry) checkGeometry(node.geometry, widths, `${path}/geometry`, errors)

  if ((node.kind === 'text' || node.kind === 'control') && node.axes) {
    const { fontSizePx, fontWeight, lineHeightPx, letterSpacingPx } = node.axes
    if (fontSizePx !== undefined && !inRange(fontSizePx, L1_ENVELOPE.fontSizePx.min, L1_ENVELOPE.fontSizePx.max)) {
      errors.push({
        path: `${path}/axes/fontSizePx`,
        message: `fontSizePx=${fontSizePx} out of range [${L1_ENVELOPE.fontSizePx.min}, ${L1_ENVELOPE.fontSizePx.max}]`,
      })
    }
    if (fontWeight !== undefined && !inRange(fontWeight, L1_ENVELOPE.fontWeight.min, L1_ENVELOPE.fontWeight.max)) {
      errors.push({
        path: `${path}/axes/fontWeight`,
        message: `fontWeight=${fontWeight} out of range [${L1_ENVELOPE.fontWeight.min}, ${L1_ENVELOPE.fontWeight.max}]`,
      })
    }
    // REQ-98 — `borderRadiusPx` is part of the shared surface group and is
    // bounded there, for every kind, rather than only on a text run.
    for (const [k, v] of Object.entries({ lineHeightPx, letterSpacingPx })) {
      if (v !== undefined && !inRange(v, L1_ENVELOPE.lengthPx.min, L1_ENVELOPE.lengthPx.max)) {
        errors.push({ path: `${path}/axes/${k}`, message: `${k}=${v} out of range` })
      }
    }
  }

  // BUG-18 — responsive scalar-axis tracks: each keyframe value bounded by its
  // axis range (font-size in the legible range; line-height / letter-spacing in
  // the length range), keyframes at captured widths, ascending.
  if ((node.kind === 'text' || node.kind === 'control') && node.responsive) {
    const r = node.responsive
    if (r.fontSizePx) checkScalarTrack(r.fontSizePx, widths, L1_ENVELOPE.fontSizePx, `${path}/responsive/fontSizePx`, errors)
    if (r.lineHeightPx) checkScalarTrack(r.lineHeightPx, widths, L1_ENVELOPE.lengthPx, `${path}/responsive/lineHeightPx`, errors)
    if (r.letterSpacingPx) checkScalarTrack(r.letterSpacingPx, widths, L1_ENVELOPE.lengthPx, `${path}/responsive/letterSpacingPx`, errors)
  }

  // REQ-88 — per-width padding tracks take the same bounds as the static sides.
  if (node.responsivePadding) {
    const tracks = node.responsivePadding
    for (const side of ['topPx', 'rightPx', 'bottomPx', 'leftPx'] as const) {
      const track = tracks[side]
      if (track) checkScalarTrack(track, widths, L1_ENVELOPE.paddingPx, `${path}/responsivePadding/${side}`, errors)
    }
  }

  // REQ-104 — the per-width layout track. `at` is a free breakpoint (not a
  // captured sample), so unlike a geometry / scalar track it is NOT checked
  // against `widths`; what IS checked is that the breakpoints ascend and that the
  // static `layout` still names the widest keyframe's mode. Letting the two
  // disagree would leave every non-responsive consumer of `layout` — the analytic
  // evaluator's fallback, the folder, any future tool — reading a mode the page
  // never renders at any width, which is worse than not declaring one at all.
  if (node.kind === 'container' && node.responsiveLayout) {
    const kfs = node.responsiveLayout.keyframes
    let prevAt = -Infinity
    kfs.forEach((kf, i) => {
      if (kf.at <= prevAt) {
        errors.push({
          path: `${path}/responsiveLayout/keyframes/${i}/at`,
          message: `keyframes must be sorted strictly ascending by 'at' (got ${kf.at} after ${prevAt})`,
        })
      }
      prevAt = kf.at
    })
    const widest = kfs[kfs.length - 1].value
    if (node.layout !== widest) {
      errors.push({
        path: `${path}/layout`,
        message: `layout='${node.layout}' disagrees with the widest responsiveLayout keyframe ('${widest}') — \`layout\` is the representative widest value`,
      })
    }
  }

  // REQ-106 — a link's href clears the same allowlist as every other URL sink.
  // The renderer degrades an unsafe href to the plain element, but failing here
  // as well means the author is told rather than quietly shipping a dead button.
  const link = (node as { link?: { href: string } }).link
  if (link !== undefined && !isSafeUrl(link.href)) {
    errors.push({
      path: `${path}/link/href`,
      message: `link href '${link.href}' is not an allowed URL (http/https, relative, or #anchor only)`,
    })
  }
  if (node.kind === 'image' && !isSafeUrl(node.src)) {
    errors.push({
      path: `${path}/src`,
      message: `image src '${node.src}' is not an allowed URL (http/https or relative only)`,
    })
  }

  checkEffects(node, path, errors)

  const children = node.kind === 'container' || node.kind === 'box' ? node.children ?? [] : []
  children.forEach((child, i) => walk(child, widths, `${path}/children/${i}`, depth + 1, counter, errors))
}

/** Options for {@link validateL1}. */
export interface ValidateL1Options {
  /**
   * REQ-114 — the palette every colour reference in the document must resolve
   * against. Omitting it does not relax the rule: a document carrying a
   * reference with no palette in scope is rejected, because the alternative is a
   * render-time fallback and DOC-23 §6 has none.
   */
  palette?: L1Palette
}

/**
 * REQ-114 — every palette reference in `input` must name an entry (and, when it
 * carries one, a step) the palette actually declares. This is the *whole* of the
 * "no render-time fallback" guarantee: {@link resolveL1Color} throws on a miss,
 * so the only thing standing between a dangling reference and a crashed render
 * is this check running first.
 */
export function checkPaletteRefs(
  input: unknown,
  palette: L1Palette | undefined,
  basePath: string,
  errors: ValidationError[],
): void {
  for (const { path, ref } of collectL1PaletteRefs(input)) {
    const entry = palette?.[ref.ref]
    if (!entry) {
      errors.push({
        path: `${basePath}${path}/ref`,
        message: palette
          ? `palette reference '${ref.ref}' is not declared by the palette [${Object.keys(palette).join(', ')}]`
          : `palette reference '${ref.ref}' cannot resolve: the site declares no palette`,
      })
      continue
    }
    if (ref.step !== undefined && entry.steps?.[ref.step] === undefined) {
      errors.push({
        path: `${basePath}${path}/step`,
        message: `palette entry '${ref.ref}' has no step '${ref.step}' (declares [${Object.keys(
          entry.steps ?? {},
        ).join(', ')}])`,
      })
    }
  }
}

/**
 * Validate an L1 document against the schema **and** the envelope. Returns the
 * typed document on success, or the full list of machine-readable errors — so an
 * AI caller can self-correct — on failure.
 */
export function validateL1(
  input: unknown,
  options: ValidateL1Options = {},
): Result<L1Document, ValidationError[]> {
  const parsed = l1DocumentSchema.safeParse(input)
  if (!parsed.success) {
    // The node vocabulary is a `kind`-tagged union, so a shape failure inside a
    // node would otherwise collapse to a bare `/root — Invalid input`. Localise
    // it to the branch the author meant, so the report names the offending field
    // (REQ-107 / DOC-8 §6 — the message is what an AI author self-corrects from).
    return { ok: false, errors: projectIssues(parsed.error.issues) }
  }

  const doc = parsed.data
  const errors: ValidationError[] = []

  // REQ-114 — colour references resolve, or the document does not validate.
  checkPaletteRefs(doc, options.palette, '', errors)

  // Widths must be strictly ascending and unique (the ladder is an ordered set).
  for (let i = 1; i < doc.widths.length; i++) {
    if (doc.widths[i] <= doc.widths[i - 1]) {
      errors.push({
        path: `/widths/${i}`,
        message: `widths must be strictly ascending (got ${doc.widths[i]} after ${doc.widths[i - 1]})`,
      })
    }
  }

  // REQ-90 — the document-level resource table: each font-face `src` must clear
  // the same URL-scheme allowlist as an image (served asset / http(s) only — no
  // `data:`/`javascript:` smuggling a face through the sole `@font-face` sink),
  // and a declared weight must sit in the CSS font-weight range.
  ;(doc.resources?.fonts ?? []).forEach((font, i) => {
    if (!isSafeUrl(font.src)) {
      errors.push({
        path: `/resources/fonts/${i}/src`,
        message: `font src '${font.src}' is not an allowed URL (http/https or relative only)`,
      })
    }
    if (
      font.weight !== undefined &&
      !inRange(font.weight, L1_ENVELOPE.fontWeight.min, L1_ENVELOPE.fontWeight.max)
    ) {
      errors.push({
        path: `/resources/fonts/${i}/weight`,
        message: `font weight=${font.weight} out of range [${L1_ENVELOPE.fontWeight.min}, ${L1_ENVELOPE.fontWeight.max}]`,
      })
    }
  })

  // REQ-88 — a column anchor is meaningless without the column it refers to, and
  // silently falling back to the keyframes would hide the dangling reference
  // behind geometry that merely looks plausible. Reject it instead.
  if (!doc.column) {
    const dangling: string[] = []
    const scan = (node: L1Node, path: string): void => {
      if (node.geometry?.anchor) dangling.push(path)
      const kids = node.kind === 'container' || node.kind === 'box' ? node.children ?? [] : []
      kids.forEach((c, i) => scan(c, `${path}/children/${i}`))
    }
    scan(doc.root, '/root')
    for (const path of dangling) {
      errors.push({
        path: `${path}/geometry/anchor`,
        message: 'geometry.anchor requires the document to declare a `column`',
      })
    }
  }

  // REQ-106 — ids became real DOM ids when links landed, so they must be unique.
  // A duplicate breaks `#anchor` navigation (the browser takes the first match)
  // and, worse, the `for`<->`id` association the REQ-96 `control` contract relies
  // on for its accessible names. Cheap to check, silent and confusing when missed.
  const seenIds = new Map<string, string>()
  const scanIds = (node: L1Node, path: string): void => {
    if (node.id !== undefined) {
      const first = seenIds.get(node.id)
      if (first !== undefined) {
        errors.push({
          path: `${path}/id`,
          message: `duplicate node id '${node.id}' (first declared at ${first}) — a DOM id must be unique`,
        })
      } else {
        seenIds.set(node.id, path)
      }
    }
    const kids = node.kind === 'container' || node.kind === 'box' ? node.children ?? [] : []
    kids.forEach((c, i) => scanIds(c, `${path}/children/${i}`))
  }
  scanIds(doc.root, '/root')

  const counter = { n: 0 }
  walk(doc.root, doc.widths, '/root', 1, counter, errors)
  if (counter.n > L1_ENVELOPE.maxNodes) {
    errors.push({ path: '/root', message: `node count ${counter.n} exceeds cap ${L1_ENVELOPE.maxNodes}` })
  }

  return errors.length === 0 ? { ok: true, value: doc } : { ok: false, errors }
}

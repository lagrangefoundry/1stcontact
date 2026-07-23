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
import type { L1Document, L1Geometry, L1Node } from './types'
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

  const shadow = (s: { offsetXPx: number; offsetYPx: number; blurPx?: number; spreadPx?: number } | undefined, p: string) => {
    if (!s) return
    checkEffectLen(s.offsetXPx, `${p}/offsetXPx`, errors)
    checkEffectLen(s.offsetYPx, `${p}/offsetYPx`, errors)
    checkEffectLen(s.blurPx, `${p}/blurPx`, errors)
    checkEffectLen(s.spreadPx, `${p}/spreadPx`, errors)
  }

  if (node.kind === 'text' && node.axes) {
    shadow(node.axes.textShadow, `${path}/axes/textShadow`)
  }
  if ((node.kind === 'box' || node.kind === 'image') && node.axes) {
    shadow(node.axes.boxShadow, `${path}/axes/boxShadow`)
    if (node.axes.border) checkEffectLen(node.axes.border.widthPx, `${path}/axes/border/widthPx`, errors)
  }
  if (node.kind === 'box' && node.axes) {
    checkEffectLen(node.axes.backdropBlurPx, `${path}/axes/backdropBlurPx`, errors)
    if (node.axes.backgroundImageUrl !== undefined && !isSafeUrl(node.axes.backgroundImageUrl)) {
      errors.push({
        path: `${path}/axes/backgroundImageUrl`,
        message: `backgroundImageUrl '${node.axes.backgroundImageUrl}' is not an allowed URL (http/https or relative only)`,
      })
    }
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

  if (node.kind === 'text' && node.axes) {
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
    for (const [k, v] of Object.entries({ lineHeightPx, letterSpacingPx })) {
      if (v !== undefined && !inRange(v, L1_ENVELOPE.lengthPx.min, L1_ENVELOPE.lengthPx.max)) {
        errors.push({ path: `${path}/axes/${k}`, message: `${k}=${v} out of range` })
      }
    }
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

/**
 * Validate an L1 document against the schema **and** the envelope. Returns the
 * typed document on success, or the full list of machine-readable errors — so an
 * AI caller can self-correct — on failure.
 */
export function validateL1(input: unknown): Result<L1Document, ValidationError[]> {
  const parsed = l1DocumentSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.issues.map((issue) => ({
        path: '/' + issue.path.map((seg) => String(seg)).join('/'),
        message: issue.message,
      })),
    }
  }

  const doc = parsed.data
  const errors: ValidationError[] = []

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

  const counter = { n: 0 }
  walk(doc.root, doc.widths, '/root', 1, counter, errors)
  if (counter.n > L1_ENVELOPE.maxNodes) {
    errors.push({ path: '/root', message: `node count ${counter.n} exceeds cap ${L1_ENVELOPE.maxNodes}` })
  }

  return errors.length === 0 ? { ok: true, value: doc } : { ok: false, errors }
}

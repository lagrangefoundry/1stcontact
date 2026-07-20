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
} as const

/**
 * URL scheme allowlist for image `src`. Relative and root-relative URLs pass;
 * absolute URLs must be http(s). Everything else — `javascript:`, `data:`,
 * `vbscript:`, `file:` — is rejected. Mirrors the framework content-safety
 * boundary, re-implemented here to keep site-schema dependency-free.
 */
export function isSafeUrl(url: string): boolean {
  const trimmed = url.trim()
  if (trimmed === '') return false
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

  const counter = { n: 0 }
  walk(doc.root, doc.widths, '/root', 1, counter, errors)
  if (counter.n > L1_ENVELOPE.maxNodes) {
    errors.push({ path: '/root', message: `node count ${counter.n} exceeds cap ${L1_ENVELOPE.maxNodes}` })
  }

  return errors.length === 0 ? { ok: true, value: doc } : { ok: false, errors }
}

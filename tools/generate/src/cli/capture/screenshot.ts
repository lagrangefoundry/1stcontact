/**
 * REQ-154 — the screenshot primitive, with no host in it.
 *
 * WHY THIS FILE EXISTS. `1c shot` ([[DOC-13]] §6, the AI's *eyes*) was one
 * module that did three things: render a slug, serve it over loopback, and
 * screenshot the served page. Two of those need `node:fs` and `node:http`, so
 * the third — the only part a Worker needs — could not run in workerd at all.
 * The split is along that line and nothing else: this module navigates and
 * screenshots, and `shot.ts` remains the Node shell that renders, serves and
 * writes the PNG to disk.
 *
 * Nothing here knows which driver it holds. That is the seam working as
 * intended: a laptop passes Playwright's factory, a Worker passes one from a
 * leased Browser Rendering session, and this file cannot tell.
 */
import { drivePage } from './interact'
import type { PageStep } from './interact'
import type { BrowserDriverFactory, Viewport } from './types'

/**
 * Named viewport presets (DOC-8 §3.4). Width is the deterministic dimension;
 * full-page height grows with content.
 */
export type ViewportName = 'mobile' | 'tablet' | 'desktop'

export const VIEWPORTS: Record<ViewportName, Viewport> = {
  mobile: { width: 375, height: 667 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1280, height: 800 },
}

/** Resolve a preset name to a viewport, refusing an unknown one by name. */
export function resolveViewport(name: ViewportName = 'desktop'): Viewport {
  const viewport = VIEWPORTS[name]
  if (!viewport) throw new Error(`Unknown viewport '${name}'. Use mobile|tablet|desktop.`)
  return viewport
}

/**
 * Drive a fresh driver: navigate, full-page screenshot at `viewport`, release.
 *
 * `navigate` is called with NO viewport, and the width is applied at screenshot
 * time. That is what `1c shot` has always done and is preserved verbatim rather
 * than tidied: loading at the driver's default width and resizing afterwards is
 * observably different from laying the page out at the target width from the
 * start, so "fixing" it here would silently change every existing shot.
 *
 * The `finally` is the contract, not hygiene. On the Playwright side a stranded
 * driver holds a local process; on the Browser Rendering side it holds a metered
 * session that counts against the account's concurrency cap until the platform's
 * idle reaper takes it. Both are released here whether the navigation succeeded,
 * threw, or timed out.
 */
export async function screenshotUrl(
  url: string,
  viewport: Viewport,
  factory: BrowserDriverFactory,
  steps: readonly PageStep[] = [],
): Promise<Uint8Array> {
  const driver = await factory()
  try {
    // REQ-216 — a DRIVEN shot loads at the width it is going to be driven at,
    // and an undriven one keeps the load-wide-then-resize behaviour above
    // verbatim. This is not a mode: it is the precondition driving has and
    // shooting does not. A hamburger that only exists below 768px cannot be
    // clicked on a page laid out at 1280, so a step named at `mobile` would
    // refuse — correctly, and uselessly. Nothing about an undriven shot moves.
    await driver.navigate(url, steps.length ? viewport : undefined)
    if (steps.length) await drivePage(driver, steps)
    return await driver.screenshot(viewport)
  } finally {
    await driver.close()
  }
}

// ── REQ-218 — a stored picture, put in front of the same browser ─────────────

/**
 * The longest edge a stored picture is laid out at before it is photographed.
 *
 * NOT THE MODEL'S CAP — that is `MAX_IMAGE_EDGE` in `fidelity-core.ts` and it
 * still applies afterwards, unchanged, exactly as it does to a page shot. This
 * one protects the BROWSER: a viewport is a real allocation, and a 12000px
 * photograph laid out at its natural size is a frame buffer nobody asked for.
 * Four thousand leaves every picture well above what the model will be shown and
 * well below what hurts, and the scaling is the browser's own — which is better
 * resampling than anything in this repo.
 */
export const MAX_RASTER_EDGE = 4096

/**
 * A stored picture that could not be decoded — a format the browser will not
 * read, or bytes that are not an image at all.
 *
 * A NAMED FAILURE RATHER THAN A BLANK PICTURE. An `<img>` whose source does not
 * decode paints nothing, and a screenshot of that is a white rectangle: a model
 * handed one would report confidently on a picture it never saw. So the decode
 * is asked about explicitly and its failure is this.
 */
export class ImageNotRenderableError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ImageNotRenderableError'
  }
}

/** Base64 without `Buffer`, which is Node's and does not exist in workerd. */
function toBase64(bytes: Uint8Array): string {
  let binary = ''
  // Chunked: `String.fromCharCode(...bytes)` overflows the argument limit on an
  // array of any size, and a photograph is an array of some size.
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  return btoa(binary)
}

/**
 * The document a stored picture is photographed in: the picture, and nothing.
 *
 * WHY A `data:` URL IS RIGHT HERE AND WRONG FOR A CAPTURE. `OriginResolver`'s
 * header records that a capture must render against a real origin with a real
 * `baseURI`, because a captured page's asset URLs are relative and a `data:`
 * document has nothing for them to be relative to. This document has no relative
 * URL in it at all — one inlined image and a stylesheet — so the objection does
 * not reach it, and what it buys is that both namespaces reach the browser by
 * one path. A Library item's bytes are in a private bucket behind Access; there
 * is no URL this browser could fetch them from, and inventing one would mean
 * handing an unauthenticated client a way into the client's confidential
 * material. It carries the bytes instead.
 */
function wrapperDocument(bytes: Uint8Array, mediaType: string): string {
  const doc =
    '<!doctype html><meta charset="utf-8">' +
    '<style>html,body{margin:0;padding:0;background:#fff}' +
    `img{display:block;max-width:${MAX_RASTER_EDGE}px;max-height:${MAX_RASTER_EDGE}px}</style>` +
    `<img id="stored" src="data:${mediaType};base64,${toBase64(bytes)}">`
  return `data:text/html;base64,${toBase64(new TextEncoder().encode(doc))}`
}

/**
 * Ask the page whether the picture decoded, and how big it ended up.
 *
 * `decode()` RATHER THAN `complete`, because `navigate` waits for network idle
 * and a `data:` URL makes no request — so there is nothing for idleness to mean
 * and the image may still be decoding when the page is "loaded". `decode()`
 * resolves when the pixels exist and rejects when they never will, which is the
 * exact question, and both drivers' `evaluate` awaits a returned promise.
 */
const DECODE_SCRIPT =
  '(async () => {' +
  "  const img = document.getElementById('stored');" +
  '  try { await img.decode() } catch { return { ok: false } }' +
  '  return { ok: img.naturalWidth > 0, width: img.width, height: img.height,' +
  '           naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight }' +
  '})()'

/** What a stored picture became once a browser had read it. */
export interface Rasterized {
  /** PNG bytes — the same currency every other picture in this graph is in. */
  bytes: Uint8Array
  width: number
  height: number
  /** The picture's own dimensions, before any lay-out reduction. */
  naturalWidth: number
  naturalHeight: number
}

/**
 * A stored picture's pixels, via the one decoder this product already has.
 *
 * WHY THE BROWSER AND NOT A CODEC. `png.ts` decodes PNG and says so: REQ-156
 * replaced the native codec deliberately, and every other picture in this graph
 * is PNG because a browser made it. A stored picture is whatever a phone camera
 * or a generator produced — JPEG, WebP, GIF, or an SVG this assistant drew — and
 * adding a decoder per format is a dependency and a maintenance bill per format.
 * The browser decodes all of them, is already a hard requirement of this whole
 * surface, and is already leased per picture. So a stored picture is photographed
 * exactly as a page is, and comes back in the currency everything downstream
 * already speaks: the reduction, the diff and the value gates all keep working
 * with no knowledge that a sixth kind exists.
 *
 * THE TRADE IT MAKES, STATED. A drawing is rendered outside the site's own page,
 * so its text resolves in the browser's default face rather than in the face the
 * site serves. That is a real difference for a wordmark, it is why the picture
 * says so, and it is why `measure_drawing` — which renders inside the draft for
 * exactly this reason — remains the way to read a drawing's geometry.
 */
export async function rasterizeImage(
  bytes: Uint8Array,
  mediaType: string,
  factory: BrowserDriverFactory,
  what = 'that picture',
): Promise<Rasterized> {
  const driver = await factory()
  try {
    await driver.navigate(wrapperDocument(bytes, mediaType))
    const size = await driver.query<{
      ok: boolean
      width?: number
      height?: number
      naturalWidth?: number
      naturalHeight?: number
    }>(DECODE_SCRIPT)
    if (!size.ok || !size.width || !size.height) {
      throw new ImageNotRenderableError(
        `${what} is stored as ${mediaType} and the browser would not decode it, so there ` +
          `is no picture to show you. Nothing you can do about the bytes; say so and ` +
          `work from what the Library says about it instead.`,
      )
    }
    return {
      bytes: await driver.screenshot({ width: size.width, height: size.height }),
      width: size.width,
      height: size.height,
      naturalWidth: size.naturalWidth ?? size.width,
      naturalHeight: size.naturalHeight ?? size.height,
    }
  } finally {
    // The same contract `screenshotUrl` states: a stranded driver holds a local
    // process or a metered session, and this releases it on every path.
    await driver.close()
  }
}

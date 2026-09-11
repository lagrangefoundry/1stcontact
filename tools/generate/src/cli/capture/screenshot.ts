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
 * The shell a stored picture is photographed in: one empty `<img>`, and nothing.
 *
 * CONSTANT LENGTH IS THE WHOLE POINT, and it is the fix for BUG-80. This used to
 * be one document with the picture's bytes base64'd inside it and the document
 * base64'd again — roughly `(4/3)²` the size of the picture, in a URL. Chromium
 * refuses to navigate to a URL longer than `url::kMaxURLChars` (2 MiB), so any
 * stored picture over about 1.1 MB could not be photographed at all; an ordinary
 * phone JPEG was over the limit, not an edge case. Worse, Playwright's navigation
 * error message is `"<code> at <url>"`, so the refusal handed the whole 22 MB URL
 * back as an error — which is a tool result the model then has to carry, and in
 * the observed case ended the conversation permanently.
 *
 * Nothing about the picture appears in this URL, so neither failure mode has an
 * input any more. The bytes arrive afterwards, by {@link INJECT_CHUNK_CHARS} and {@link decodeScript}.
 *
 * WHY A `data:` URL IS STILL RIGHT HERE AND WRONG FOR A CAPTURE. `OriginResolver`'s
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
const SHELL_DOCUMENT =
  '<!doctype html><meta charset="utf-8">' +
  '<style>html,body{margin:0;padding:0;background:#fff}' +
  `img{display:block;max-width:${MAX_RASTER_EDGE}px;max-height:${MAX_RASTER_EDGE}px}</style>` +
  '<img id="stored">'

/** The one URL this path ever navigates to — fixed, and a few hundred bytes. */
function shellUrl(): string {
  return `data:text/html;base64,${toBase64(new TextEncoder().encode(SHELL_DOCUMENT))}`
}

/**
 * How much base64 one injected chunk carries.
 *
 * A BOUND ON THE FAILURE, NOT A TUNING KNOB. The evaluation channel has no URL
 * limit, so a picture of any size could be handed over in one call — but a driver
 * that rejects an evaluation commonly echoes the script it was given, and an
 * unbounded script is the same prompt bomb in a different costume. Chunking caps
 * what any single message can be, so the sanitiser below has a bounded worst case
 * to work on rather than an unbounded one. Half a megabyte is comfortably inside
 * what a CDP message carries and keeps a 12 MB photograph to a few dozen calls.
 */
export const INJECT_CHUNK_CHARS = 512 * 1024

/**
 * The largest stored picture that will be put in front of a browser at all.
 *
 * NOT THE OLD ~1.1 MB CEILING — that was an accident of URL length and is gone.
 * This is far above any real photograph and exists only so that an absurd input
 * cannot become an unbounded number of round trips. It is checked before a driver
 * is leased, so the refusal costs nothing.
 */
export const MAX_STORED_PICTURE_BYTES = 64 * 1024 * 1024

/** The longest error text this path will ever hand back. */
export const MAX_DRIVER_ERROR_CHARS = 400

/**
 * A driver's own words, with anything it might have been carrying taken out.
 *
 * THE RULE IS THE BOUND, NOT THE PATTERN. Stripping `data:` URLs and long base64
 * runs is what catches the two shapes already observed, but the truncation is
 * what makes the guarantee hold for a failure nobody has seen yet: whatever a
 * driver puts in a message, at most {@link MAX_DRIVER_ERROR_CHARS} of it reaches
 * the model. A tool result must never be able to end a conversation.
 */
export function safeDriverMessage(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err)
  const stripped = raw
    .replace(/data:[^\s'"`)]*/g, 'data:…')
    .replace(/[A-Za-z0-9+/=]{120,}/g, '…')
    .replace(/\s+/g, ' ')
    .trim()
  return stripped.length > MAX_DRIVER_ERROR_CHARS
    ? `${stripped.slice(0, MAX_DRIVER_ERROR_CHARS)}…`
    : stripped
}

/**
 * A stored media type, made safe to interpolate into a `src`.
 *
 * IT IS A FIELD SOMEBODY WROTE DOWN. `material.ts` repairs it from the filename
 * when it is silent, which is the tell: it is data, not a value this code chose,
 * and data goes into a document only after everything that is not a media type
 * has been taken out of it. Falls back to `application/octet-stream`, which the
 * browser will refuse to decode — and a refused decode is already a named,
 * honest failure here.
 */
export function safeMediaType(mediaType: string): string {
  return /^[A-Za-z0-9!#$&^_.+-]+\/[A-Za-z0-9!#$&^_.+-]+$/.test(mediaType)
    ? mediaType
    : 'application/octet-stream'
}

/** Append one chunk of base64 to the page's buffer. */
function chunkScript(chunk: string): string {
  return `(function(){(window.__pic=window.__pic||[]).push("${chunk}");return window.__pic.length})()`
}

/**
 * Assemble the buffer, set the `src`, and answer the decode question.
 *
 * `decode()` RATHER THAN `complete`, because `navigate` waits for network idle
 * and a `data:` URL makes no request — so there is nothing for idleness to mean
 * and the image may still be decoding when the page is "loaded". `decode()`
 * resolves when the pixels exist and rejects when they never will, which is the
 * exact question, and both drivers' `evaluate` awaits a returned promise.
 */
function decodeScript(mediaType: string): string {
  return (
    '(async () => {' +
    "  const img = document.getElementById('stored');" +
    `  img.src = 'data:${safeMediaType(mediaType)};base64,' + (window.__pic || []).join('');` +
    '  window.__pic = null;' +
    '  try { await img.decode() } catch { return { ok: false } }' +
    '  return { ok: img.naturalWidth > 0, width: img.width, height: img.height,' +
    '           naturalWidth: img.naturalWidth, naturalHeight: img.naturalHeight }' +
    '})()'
  )
}

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

interface DecodeReport {
  ok: boolean
  width?: number
  height?: number
  naturalWidth?: number
  naturalHeight?: number
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
 * HOW THE BYTES GET THERE (BUG-80). Navigate to a fixed shell, push the base64
 * over the evaluation channel in bounded chunks, then assemble and decode. The
 * URL is constant, so the picture's size cannot reach it; every message is
 * bounded, so a driver that echoes one back in an error cannot be unbounded; and
 * every driver interaction is wrapped, so what escapes is a sentence rather than
 * a payload.
 *
 * NO RESIZING HAPPENS HERE, and none is needed: `MAX_RASTER_EDGE` bounds what the
 * browser lays the picture out at, and `MAX_IMAGE_EDGE` in `fidelity-core.ts`
 * downsamples what the model is shown. A separate "make a smaller copy" verb
 * would be a second way to do what every picture already goes through.
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
  // BEFORE A BROWSER IS LEASED, so an absurd input costs nothing. This is not
  // the URL ceiling that used to live here by accident; it is far above any real
  // photograph, and it is the only size this path refuses.
  if (bytes.length > MAX_STORED_PICTURE_BYTES) {
    throw new ImageNotRenderableError(
      `${what} is ${Math.round(bytes.length / 1_000_000)} MB, which is past the ` +
        `${Math.round(MAX_STORED_PICTURE_BYTES / 1_000_000)} MB most this can put in front of a ` +
        `browser, so there is no picture to show you. Say so, and work from what the Library ` +
        `says about it instead.`,
    )
  }

  const base64 = toBase64(bytes)
  const driver = await factory()
  try {
    let size: DecodeReport
    try {
      await driver.navigate(shellUrl())
      for (let i = 0; i < base64.length; i += INJECT_CHUNK_CHARS) {
        await driver.query(chunkScript(base64.slice(i, i + INJECT_CHUNK_CHARS)))
      }
      size = await driver.query<DecodeReport>(decodeScript(mediaType))
    } catch (err) {
      // THE BUG-80 GUARANTEE. Whatever the driver was holding — the document, the
      // script, a URL — stops here. What continues is a bounded sentence naming
      // the picture and the driver's own code.
      throw new ImageNotRenderableError(
        `${what} could not be put in front of the browser: ${safeDriverMessage(err)}. ` +
          `There is no picture to show you; say so and work from what the Library says ` +
          `about it instead.`,
      )
    }

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

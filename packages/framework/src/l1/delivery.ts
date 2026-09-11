/**
 * The delivery width ladder (REQ-222) — the arithmetic the publish path and the
 * renderer must agree on, in one place.
 *
 * WHY IT IS ITS OWN MODULE RATHER THAN PART OF EITHER. Two parties decide the
 * same thing here and must not decide it twice: `publish` renders the bytes at
 * these widths, and `render.ts` writes those widths into a `srcset` the browser
 * chooses from. A `srcset` naming a width nobody rendered is a 404 on the one
 * request the page cannot recover from, and a rendition nobody names is bytes
 * paid for and never served. Both are silent. So the ladder is computed once,
 * by {@link deliveryWidthsFor}, and the manifest is the record of what actually
 * landed rather than a second opinion about what should have.
 *
 * THE DOCUMENT IS NOT INVOLVED. Nothing here is part of an L1 node, a page or a
 * `site.json`: a delivery rendition is a property of the publish that rendered
 * the document, not of the document. The manifest is a render *input*, supplied
 * by publish and by nothing else, which is what keeps the draft and edit
 * channels free of a ladder without a flag anyone has to remember to unset.
 */

/**
 * The conventional widths a picture is offered at.
 *
 * CONVENTIONAL, AND THAT IS THE ENTIRE JUSTIFICATION. These are the steps the
 * web has settled on for responsive images; there is no measurement behind them
 * and inventing one per site would be a knob nobody asked for. What matters is
 * that the ladder is dense enough that the browser's choice is close to the box
 * it is filling, and coarse enough that a publish is not paying for renditions
 * that differ by a handful of pixels.
 *
 * ASCENDING, and {@link deliveryWidthsFor} depends on it.
 */
export const DELIVERY_WIDTHS: readonly number[] = [320, 640, 960, 1280, 1600, 1920]

/**
 * The rungs to RENDER for a picture whose own width is `sourceWidth`.
 *
 * STRICTLY BELOW THE SOURCE, so nothing is ever upscaled — a client's 600px logo
 * does not gain a fictional 2048px rendition that is the same picture with more
 * bytes and no more detail. The source itself is the top rung of the *manifest*
 * (see {@link ImageDelivery.renditions}); it is not in this list because it
 * already exists and rendering it again would be paying a transform to produce
 * bytes we were handed.
 *
 * A PICTURE BELOW THE SMALLEST STEP GETS NOTHING. There is no rung under it to
 * offer, and a one-entry `srcset` naming the original is a longer way to write
 * the `src` that is already there.
 */
export function deliveryWidthsFor(sourceWidth: number): number[] {
  if (!Number.isFinite(sourceWidth) || sourceWidth <= 0) return []
  return DELIVERY_WIDTHS.filter((w) => w < sourceWidth)
}

/** One rendered width of one picture. */
export interface ImageRendition {
  /**
   * Where the bytes are, relative to the snapshot root (`assets/d/<…>-640.jpg`).
   *
   * RELATIVE, like every other emitted asset URL (REQ-109): a published snapshot
   * is relocatable under any path prefix, and a `srcset` full of root-relative
   * URLs would be the one thing in the tree that is not.
   */
  src: string
  /** The rendition's real pixel width — what the `w` descriptor states. */
  width: number
}

/** Everything the renderer needs to describe one picture's delivery. */
export interface ImageDelivery {
  /** The source's own pixel width. */
  width: number
  /** The source's own pixel height. */
  height: number
  /**
   * Every width this picture can be served at, ascending, **including the
   * original as the last entry**. Never empty when present; a picture with
   * nothing to offer has no manifest entry at all rather than a lone rung.
   */
  renditions: readonly ImageRendition[]
}

/**
 * What a publish rendered, keyed by the asset's store name (`hero.jpg`).
 *
 * BY NAME AND NOT BY URL, because the publish side holds names — it walks the
 * snapshot's assets, not the document — and the renderer holds URLs. One of them
 * has to convert, and it is the renderer, through {@link deliveryAssetName},
 * because it is the side that already normalises a `src` for emission.
 */
export type ImageDeliveryManifest = Readonly<Record<string, ImageDelivery>>

/**
 * The asset name a rendered `src` refers to, or null when it refers to
 * something else.
 *
 * THE THREE SPELLINGS ARE ALL REAL. A page holds `/assets/hero.jpg` (what
 * `assetHandle` writes), an authored document may hold `assets/hero.jpg`, and a
 * relativised one may hold `./assets/hero.jpg`. They name the same bytes, so
 * they resolve to the same manifest key or the ladder would apply to a picture
 * depending on how its reference happened to be spelled.
 *
 * NULL FOR EVERYTHING ELSE, and that is the common case rather than an error: an
 * absolute URL to another origin, a data URI, or an asset in a subdirectory is a
 * picture this publish did not render a ladder for, and it is emitted exactly as
 * it is today.
 */
export function deliveryAssetName(src: string): string | null {
  const trimmed = src.trim()
  const local = trimmed.startsWith('./')
    ? trimmed.slice(2)
    : trimmed.startsWith('/') && !trimmed.startsWith('//')
      ? trimmed.slice(1)
      : trimmed
  if (!local.startsWith('assets/')) return null
  const name = local.slice('assets/'.length)
  // A name is a key under `assets/`, never a path (the site store says so). A
  // remaining separator means this reference is not to a site asset at all, and
  // a query or fragment means it is not to the bytes we measured.
  if (name === '' || /[/\\?#]/.test(name)) return null
  return name
}

/**
 * The extensions that get a ladder, and the two deliberate absences.
 *
 * SVG IS RESOLUTION-INDEPENDENT, so a width ladder for one is a contradiction:
 * every rung would be the same file rasterised, which is strictly worse than the
 * vector the browser already scales for free.
 *
 * GIF IS ANIMATED. A transform flattens it to its first frame, and a client
 * whose animation stopped working after a publish has been handed a bug in
 * exchange for bytes they did not ask to save.
 */
const LADDERED_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.avif'])

/** Whether an asset's name is a picture kind this ladder applies to. */
export function isLadderedAsset(name: string): boolean {
  const dot = name.lastIndexOf('.')
  return dot > 0 && LADDERED_EXTENSIONS.has(name.slice(dot).toLowerCase())
}

/**
 * A rendition's path within the snapshot, content-addressed.
 *
 * THE `d/` SEGMENT IS LOAD-BEARING PROSE. It marks these bytes as derived, so a
 * listing of a published revision does not read as though the client uploaded
 * six copies of their photograph. It also keeps the derived names out of the
 * flat namespace a real asset occupies, which is what stops a rendition from
 * ever colliding with something someone actually put there.
 *
 * THE NAME IS THE ADDRESS. `<sha>-<width>` over the SOURCE bytes and the width
 * rendered at: identical inputs produce an identical name, which is what makes
 * the cache a lookup rather than a bookkeeping problem, and what makes these
 * bytes safe to treat as immutable.
 */
export function renditionPath(sha: string, width: number, extension: string): string {
  return `assets/d/${sha}-${width}${extension}`
}

/** The lowercased extension of an asset name (`hero.JPG` → `.jpg`), or ''. */
export function extensionOfAsset(name: string): string {
  const dot = name.lastIndexOf('.')
  return dot > 0 ? name.slice(dot).toLowerCase() : ''
}

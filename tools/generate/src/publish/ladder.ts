import {
  deliveryWidthsFor,
  extensionOfAsset,
  isLadderedAsset,
  renditionPath,
  type ImageDelivery,
  type ImageDeliveryManifest,
  type ImageRendition,
} from '@1stcontact/framework/worker'
import { contentTypeOf } from '../store/content-type'
import type { StoredAsset } from '../store/site-store'

/**
 * The delivery width ladder, built at publish (REQ-222).
 *
 * WHERE THIS SITS. `publish.ts` sequences a publish over the {@link SiteStore}
 * port and knows nothing about HTTP or bindings; this is the same shape for
 * images. The POLICY — which widths, what a rendition is called, what the
 * manifest records — lives here, once, in worker-safe TypeScript. The one thing
 * that genuinely needs a platform is decoding and resizing a picture, and that is
 * {@link ImageSizer}, which the Worker supplies by adapting the renderer
 * [[REQ-219]] already composed. Caching is deliberately NOT here: that renderer
 * is already wrapped in a rendition cache addressed by the original, the recipe
 * and the size asked for, which is exactly the address this ladder would have
 * invented.
 *
 * WHY NOT A VERB ON THE SITE STORE. Because a store holds bytes and this decides
 * what bytes should exist. Putting it behind `SiteStore` would oblige the
 * filesystem adapter to grow an image pipeline in order to be a store, and the
 * CLI publishes without one deliberately — see {@link ImageLadder}.
 *
 * NOTHING HERE IS UPSCALED, and that rule is enforced on this side rather than
 * left to the transform. A platform transform's fit mode decides what happens
 * when the requested width exceeds the source's, and the answer differs between
 * a local emulation and the real binding — so the ladder simply never asks for a
 * width the source does not have (`deliveryWidthsFor`), and the two agree by
 * construction instead of by configuration.
 */

/**
 * How much of the source digest a rendition's name carries.
 *
 * SIXTY-FOUR BITS. These names address derived bytes within one tenant, and a
 * collision would mean serving one client's picture where another belongs. At 64
 * bits that needs on the order of four billion distinct pictures in one tenant
 * before it is even worth thinking about, and the name stays short enough to
 * read in a bucket listing. It is not a security boundary: the bucket prefix is
 * — [[REQ-219]]'s cache is tenant-prefixed for exactly that reason, and these
 * names never leave a revision's own `out/`.
 */
const RENDITION_SHA_LENGTH = 16

/** The SHA-256 of some bytes, hex, truncated to a rendition name's share. */
async function renditionSha(bytes: Uint8Array): Promise<string> {
  // `bytes.buffer` is NOT used: a Uint8Array may be a VIEW onto a larger buffer,
  // and hashing the whole buffer would give a digest for bytes this asset does
  // not contain — identical content would then hash differently depending on how
  // it was read, which defeats the entire point of a content address.
  const digest = await crypto.subtle.digest('SHA-256', bytes.slice())
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, RENDITION_SHA_LENGTH)
}

/** A picture's intrinsic dimensions. */
export interface ImageSize {
  width: number
  height: number
}

/**
 * What the ladder needs of an image renderer — two verbs, and no opinions.
 *
 * NEITHER VERB DECIDES ANYTHING: `measure` reports what a picture IS, `resize`
 * produces a width this module already decided to ask for. That is what keeps a
 * fake in a test honest — there is no policy inside it to get right differently
 * from the real one.
 *
 * A SIZER AND NOT A RENDERER, because [[REQ-219]] already has a renderer and
 * this is deliberately not a second one. That renderer applies an editorial
 * recipe and takes a delivery width alongside it; `apps/control-app`'s adapter
 * is what turns it into this. The narrower port is what keeps the ladder from
 * knowing that recipes exist at all.
 *
 * NULL IS "I COULD NOT", NEVER A THROW. A picture the renderer cannot decode is
 * an ordinary thing to meet in a client's asset library, and it must cost that
 * picture its ladder and nothing else. A publish that failed because one upload
 * was a `.png` that is not a PNG would be a site nobody can publish, diagnosable
 * only by deleting assets one at a time. The adapter is where the editing path's
 * refusals become this.
 */
export interface ImageSizer {
  /** The picture's own pixel dimensions, or null if these bytes are not one. */
  measure(bytes: Uint8Array, contentType: string): Promise<ImageSize | null>
  /** The picture at `width`, same format, or null if it could not be rendered. */
  resize(bytes: Uint8Array, contentType: string, width: number): Promise<Uint8Array | null>
}

/** What a ladder build produced. */
export interface LadderBuild {
  /** What the renderer writes into each `<img>`. */
  manifest: ImageDeliveryManifest
  /**
   * The derived bytes, by path within the revision's `out/`.
   *
   * They go to `out/` and NOT to `source/`: a checkout restores what the site
   * IS, and a delivery rendition is not part of that. So a revision serves its
   * ladder and a checkout never grows six copies of a photograph.
   */
  derived: Map<string, Uint8Array>
}

/**
 * What `publishSite` asks for a ladder through.
 *
 * OPTIONAL BY DESIGN, AND ITS ABSENCE IS NOT A DEGRADED PUBLISH — it is the
 * publish this repository has always performed. `1c publish` runs against an
 * operator's disk with no Images binding anywhere near it, and refusing to
 * publish there because delivery sizes could not be built would take away
 * something that works in exchange for something that was never promised. The
 * ladder is additive: with it the pages carry `srcset`, without it they are
 * byte-identical to today's.
 */
export interface ImageLadder {
  build(assets: readonly StoredAsset[]): Promise<LadderBuild>
}

/** Nothing rendered: the manifest is empty and every `<img>` is emitted as it is. */
export const EMPTY_LADDER: LadderBuild = { manifest: {}, derived: new Map() }

/**
 * Build the ladder for a snapshot's assets.
 *
 * THE ORDER WITHIN ONE PICTURE IS: measure, decide, then render only what is
 * missing. Measuring first is what caps the ladder at the source; deciding
 * before rendering is what lets the sizer's own cache answer without this module
 * knowing it has one; and a rung that fails to render drops out of the manifest
 * rather than out of the publish, so one awkward picture costs its own ladder and
 * nobody else's.
 *
 * THE MANIFEST IS A RECORD OF WHAT LANDED. An entry is written only from
 * renditions that are in `derived`, because a
 * `srcset` candidate the bucket does not hold is a 404 on the one request the
 * page cannot recover from — and the browser will have chosen it precisely
 * because it was the best fit.
 *
 * THE ORIGINAL IS THE TOP RUNG. It is already in `assets/`, it is already the
 * `src`, and naming it in the `srcset` is what lets a wide viewport take the
 * full picture through the same mechanism as every other width — for no
 * transform at all.
 */
export async function buildImageLadder(
  assets: readonly StoredAsset[],
  sizer: ImageSizer,
): Promise<LadderBuild> {
  const manifest: Record<string, ImageDelivery> = {}
  const derived = new Map<string, Uint8Array>()

  for (const asset of assets) {
    // SVG is resolution-independent and GIF is animated; both are served as they
    // are, and anything else unknown is left alone rather than guessed at.
    if (!isLadderedAsset(asset.name)) continue
    const contentType = contentTypeOf(asset.name)
    const size = await sizer.measure(asset.bytes, contentType)
    if (size === null) continue

    const widths = deliveryWidthsFor(size.width)
    if (widths.length === 0) continue

    const extension = extensionOfAsset(asset.name)
    const sha = await renditionSha(asset.bytes)
    const renditions: ImageRendition[] = []

    for (const width of widths) {
      const bytes = await sizer.resize(asset.bytes, contentType, width)
      // A rung that would not render is dropped and the rest of the ladder
      // stands: fewer choices for the browser, never a broken candidate.
      if (bytes === null) continue
      derived.set(renditionPath(sha, width, extension), bytes)
      renditions.push({ src: renditionPath(sha, width, extension), width })
    }

    if (renditions.length === 0) continue
    // The source itself, last and widest — the bytes `src` already names.
    renditions.push({ src: `assets/${asset.name}`, width: size.width })
    manifest[asset.name] = { width: size.width, height: size.height, renditions }
  }

  return { manifest, derived }
}

/** An {@link ImageLadder} over a sizer. */
export function imageLadder(sizer: ImageSizer): ImageLadder {
  return { build: (assets) => buildImageLadder(assets, sizer) }
}

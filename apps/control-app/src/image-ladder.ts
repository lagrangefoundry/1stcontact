import { derivedPrefix } from '../../../tools/generate/src/store/revision-model'
import {
  imageLadder,
  type ImageLadder,
  type ImageRenderer,
  type ImageSize,
  type RenditionCache,
} from '../../../tools/generate/src/publish/ladder'

/**
 * The delivery width ladder, over this deployment's actual platform ([[REQ-222]]).
 *
 * THE POLICY IS NOT HERE. Which widths a picture gets, what a rendition is
 * called, when a transform is skipped and what the manifest records all live in
 * `publish/ladder.ts`, in worker-safe TypeScript that a node test can drive with
 * fakes. This file is the two things that genuinely need a platform — a decoder
 * and a bucket — and nothing else. A rule that lived here would be a rule only
 * reachable through a real binding, which is how it would come to differ from
 * what the renderer writes into a `srcset`.
 *
 * WHY THE IMAGES BINDING RATHER THAN BROWSER RENDERING. `[browser]` is already
 * bound and already paid for ([[REQ-154]]), and was rejected upstream ([[EPIC-1]]
 * §6): it is far heavier per publish, and it cannot decode HEIC, so it would have
 * solved this and left the upload path needing a second answer anyway.
 */

/** The output formats the Images binding will encode, by source content type. */
const ENCODABLE: Record<string, 'image/jpeg' | 'image/png' | 'image/webp' | 'image/avif'> = {
  'image/jpeg': 'image/jpeg',
  'image/png': 'image/png',
  'image/webp': 'image/webp',
  'image/avif': 'image/avif',
}

/**
 * The source content type, as the format to encode a rendition in.
 *
 * SAME FORMAT IN AND OUT. This is a WIDTH ladder: a JPEG's rungs are JPEGs. A
 * better codec for the same picture is a real and separate question — it needs
 * `<picture>` and typed `<source>`s, because a static publish cannot vary on the
 * `Accept` header — and answering both here would mean a change nobody could
 * review as one thing.
 */
function encodeAs(contentType: string): 'image/jpeg' | 'image/png' | 'image/webp' | 'image/avif' | null {
  return ENCODABLE[contentType.split(';')[0].trim().toLowerCase()] ?? null
}

/** Bytes as a stream, which is what every verb on the binding takes. */
function streamOf(bytes: Uint8Array): ReadableStream<Uint8Array> {
  // Through a `Response` rather than a hand-built `ReadableStream`: it is the
  // runtime's own conversion, so there is no queuing strategy here to get subtly
  // wrong for a multi-megabyte photograph.
  const body = new Response(bytes as unknown as BodyInit).body
  if (body === null) throw new Error('image bytes produced no stream')
  return body as ReadableStream<Uint8Array>
}

/**
 * {@link ImageRenderer} over `env.IMAGES`.
 *
 * EVERY FAILURE IS `null`, INCLUDING THE THROWN ONES. The binding raises an
 * `ImagesError` for input it cannot decode (code 9412) and for a format it will
 * not encode, and both of those are ordinary things to meet in a client's asset
 * library — a `.png` that is not a PNG, a picture the platform has stopped
 * supporting. The ladder's contract is that either means "this picture gets no
 * rendition", never "this publish fails": a site nobody can publish, diagnosable
 * only by deleting assets one at a time, is a far worse outcome than a
 * photograph that is served at its full width the way it was last week.
 */
export function imagesRenderer(images: ImagesBinding): ImageRenderer {
  return {
    async measure(bytes: Uint8Array, _contentType: string): Promise<ImageSize | null> {
      try {
        const info = await images.info(streamOf(bytes))
        // The SVG arm of the response carries no dimensions at all, which is the
        // binding agreeing with the ladder: a vector has no pixel width to cap at.
        if (!('width' in info) || !('height' in info)) return null
        return { width: info.width, height: info.height }
      } catch {
        return null
      }
    },

    async resize(bytes: Uint8Array, contentType: string, width: number): Promise<Uint8Array | null> {
      const format = encodeAs(contentType)
      if (format === null) return null
      try {
        const result = await images
          .input(streamOf(bytes))
          // `scale-down` NEVER ENLARGES, and saying so here costs nothing even
          // though `deliveryWidthsFor` has already guaranteed the width is below
          // the source's. Belt and braces in the one direction that matters: an
          // upscaled rendition is more bytes for the same picture, which is the
          // exact harm this ticket exists to remove, and a local emulation of
          // this binding does not necessarily default the same way.
          .transform({ width, fit: 'scale-down' })
          .output({ format })
        return new Uint8Array(await new Response(result.image()).arrayBuffer())
      } catch {
        return null
      }
    },
  }
}

/**
 * {@link RenditionCache} over the sites bucket, under this tenant's own prefix.
 *
 * OUTSIDE THE SERVED ROOT — see `DERIVED_ROOT`. `public-site` resolves published
 * revisions and only those, so nothing here is addressable by a URL however it
 * is crafted; these bytes reach the public internet only as the copy a publish
 * writes into a revision's `out/`.
 *
 * A FAILED `put` IS SWALLOWED, and that is deliberate: the cache is an
 * optimisation, and the rendition it failed to record is already in hand and
 * already on its way into the revision. Failing the publish to preserve a cache
 * entry would be the tail wagging the dog.
 */
export function r2RenditionCache(bucket: R2Bucket, tenantId: string): RenditionCache {
  const prefix = derivedPrefix(tenantId)
  return {
    async get(key: string): Promise<Uint8Array | null> {
      try {
        const object = await bucket.get(`${prefix}/${key}`)
        return object ? new Uint8Array(await object.arrayBuffer()) : null
      } catch {
        return null
      }
    },
    async put(key: string, bytes: Uint8Array, contentType: string): Promise<void> {
      try {
        await bucket.put(`${prefix}/${key}`, bytes as unknown as ArrayBuffer, {
          httpMetadata: { contentType },
        })
      } catch {
        // See above: a cache that could not record is a slower next publish.
      }
    },
  }
}

/**
 * The ladder this deployment can build, or **null** where it cannot.
 *
 * NULL IS NOT A DEGRADED PUBLISH. With no Images binding the publish that
 * happens is exactly the publish this repository has always performed — the same
 * revision, the same bytes, pages whose `<img>` carries a `src` and nothing else.
 * That is the same publish `1c publish` performs against an operator's disk, on
 * purpose, and it is why an absent binding is not the loud failure `env.AI` and
 * `env.BROWSER` are: those absences take away a capability that has no fallback,
 * and this one takes away an optimisation that does.
 */
export function ladderFor(
  env: { IMAGES?: ImagesBinding; SITES?: R2Bucket },
  scope: { businessId: string },
): ImageLadder | null {
  if (!env.IMAGES) return null
  // THE CACHE IS SCOPED TO THE BUSINESS THIS REQUEST RESOLVED TO, never to a
  // value from the request itself. It is the same barrier `storeFor` applies,
  // stated on a key: a content address shared across businesses would tell one
  // of them which pictures another holds.
  const cache = env.SITES ? r2RenditionCache(env.SITES, scope.businessId) : undefined
  return imageLadder(imagesRenderer(env.IMAGES), cache)
}

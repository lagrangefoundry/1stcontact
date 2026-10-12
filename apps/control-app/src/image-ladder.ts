import { isLadderedAsset } from '../../../packages/framework/src/l1/delivery'
import { imageRendererFor, UnrenderableImageError, type ImageEditEnv } from './image-edit'
import {
  capSource,
  imageLadder,
  type ImageLadder,
  type ImageSizer,
  type ImageSize,
} from '../../../tools/generate/src/publish/ladder'
import { contentTypeOf } from '../../../tools/generate/src/store/content-type'
import type { TenantSiteStore } from '../../../tools/generate/src/store/d1r2-store'
import type { SiteWrite } from '../../../tools/generate/src/store/site-store'

/**
 * The delivery width ladder, over this deployment's actual platform ([[REQ-222]]).
 *
 * IT RIDES [[REQ-219]]'s RENDERER RATHER THAN THE BINDING. That renderer is
 * already the one composition root that names `env.IMAGES`, already measures a
 * picture before doing anything to it, already takes a delivery `width` as an
 * argument that is deliberately NOT part of a recipe, and is already wrapped in
 * a rendition cache addressed by the original, the recipe and the size asked
 * for. Every one of those is something this ladder needs, and a second renderer
 * beside it would be a second opinion about which formats are renderable, a
 * second cache with its own keyspace, and a second place to discover that a
 * deployment's binding cannot transform. So there is one renderer, and this file
 * is the narrow adapter between its verbs and the ladder's.
 *
 * WHAT THE ADAPTER ACTUALLY CHANGES IS THE FAILURE CONTRACT, and that is the
 * whole of why it exists. The editing path RAISES for a picture it cannot render
 * — the assistant asked to crop something, and the honest answer is that it
 * cannot be cropped. A publish must not: a `.png` that is not a PNG is an
 * ordinary thing to meet in a client's asset library, and a site nobody can
 * publish, diagnosable only by deleting assets one at a time, is far worse than
 * a photograph served at its full width the way it was last week. So every
 * refusal becomes `null`, which the ladder reads as "this picture gets no
 * rendition".
 *
 * THE RECIPE IS EMPTY, AND THAT IS NOT A SHORTCUT. A site asset is bytes that
 * promotion already produced by applying the recipe ([[REQ-219]]); re-applying
 * one here would be applying it twice. What a publish adds is sizing, and
 * nothing else.
 */

/** An {@link ImageSizer} over the one renderer, with publish's failure contract. */
function ladderSizer(renderer: NonNullable<ReturnType<typeof imageRendererFor>>): ImageSizer {
  return {
    async measure(bytes: Uint8Array, contentType: string): Promise<ImageSize | null> {
      try {
        return await renderer.measure(bytes, contentType)
      } catch (err) {
        // A picture that cannot be measured cannot be capped at its own width,
        // and capping is what stops the ladder upscaling. So it gets no ladder.
        if (err instanceof UnrenderableImageError) return null
        throw err
      }
    },
    async resize(
      bytes: Uint8Array,
      contentType: string,
      width: number,
      type?: string,
    ): Promise<Uint8Array | null> {
      try {
        // The empty recipe: this is the sizing pass and nothing else. `render`
        // applies `scale-down`, so a width at or above the source is a no-op
        // rather than an enlargement — belt and braces over the cap the ladder
        // has already applied.
        //
        // `type` RIDES THE SAME OPTIONS BAG AS `width` AND FOR THE SAME REASON:
        // a delivery format is not an editorial operation, so it travels beside
        // the recipe rather than inside it. There is no `convert` in the
        // vocabulary and there must not be — a codec is not a question the client
        // is asked, and one the assistant could name is one it would start
        // hand-picking against this ladder.
        const rendered = await renderer.render(bytes, contentType, [], { width, ...(type ? { type } : {}) })
        return rendered.bytes
      } catch (err) {
        // One rung that would not render drops out and the rest of the ladder
        // stands: fewer choices for the browser, never a broken candidate.
        if (err instanceof UnrenderableImageError) return null
        throw err
      }
    },
    // THE PREDICATE IS FORWARDED ONLY WHERE THE RENDERER HAS ONE, and the
    // conditional spread is what carries "this deployment holds nothing" through
    // as an ABSENT verb rather than as a `false` from a method that exists. The
    // ladder reads absence as "nothing is free", which is the truth for an
    // uncached deployment; a present `held` that always answered false would be
    // the same behaviour stated less honestly, and would go on being wrong if a
    // cache appeared later.
    ...(renderer.held
      ? {
          held: async (bytes: Uint8Array, contentType: string, width: number, type?: string) => {
            try {
              return await renderer.held!(bytes, contentType, [], { width, ...(type ? { type } : {}) })
            } catch (err) {
              // A picture that cannot be asked about is counted as work. It is
              // about to be counted as a failed rung anyway, and a denominator
              // that is one too large costs a bar that finishes slightly early.
              if (err instanceof UnrenderableImageError) return false
              throw err
            }
          },
        }
      : {}),
  }
}

/**
 * The ladder this deployment can build, or **null** where it cannot.
 *
 * NULL IS NOT A DEGRADED PUBLISH. With no Images binding — or one that cannot
 * transform — the publish that happens is exactly the publish this repository
 * has always performed: the same revision, the same bytes, pages whose `<img>`
 * carries a `src` and nothing else. That is the same publish `1c publish`
 * performs against an operator's disk, on purpose, and it is why an absent
 * binding is not the loud failure `env.AI` and `env.BROWSER` are: those absences
 * take away a capability that has no fallback, and this one takes away an
 * optimisation that does.
 *
 * THE CACHE COMES WITH THE RENDERER, scoped to the business this request
 * resolved to and never to a value from the request itself. That is what makes a
 * republish free — publishes are frequent and image edits are rare, so the
 * overwhelmingly common publish is one where every picture is byte-identical to
 * last time, and keyed by content that publish performs reads and no transforms.
 */
export function ladderFor(
  env: ImageEditEnv,
  scope: { businessId: string },
): ImageLadder | null {
  const renderer = imageRendererFor(env, scope.businessId)
  if (renderer === null) return null
  return imageLadder(ladderSizer(renderer))
}

/**
 * Pictures capped at the door — every write of picture bytes onto a site
 * ([[BUG-206]]).
 *
 * WHY HERE AND NOT AT EACH CALLER. A picture reaches a site by several roads — a
 * Library promotion, the assistant placing one, `/api/import` copying a whole
 * site up — and every one of them ends in `SiteStore.write({ assets })`. A
 * camera photograph straight off a phone is an ordinary thing to arrive by any of
 * them, so the cap is applied where they meet rather than remembered at each.
 *
 * WHAT IS STORED IS THE CAPPED COPY, in the picture's own format, scaled to fit
 * `MAX_SOURCE_EDGE` with its aspect kept. The client's experience is that
 * their photograph simply works. The untouched original is not lost: it is still
 * wherever it came from — the Library material a promotion read, or the
 * operator's own disk for an import — so keeping a second copy on the site would
 * buy nothing a later, larger delivery width could not get from there.
 *
 * EVERYTHING ELSE PASSES THROUGH BYTE-IDENTICAL. A picture at or under the cap,
 * a vector, an animation, a document, a picture the renderer cannot read — none
 * is re-encoded, because a re-encode that changes nothing still changes the file.
 *
 * A CAP THAT FAILS STORES THE ORIGINAL, and that is not a silent loss: the ladder
 * caps again at publish ([[BUG-206]]) and names the picture there if it still
 * cannot. Refusing an upload or an import because the image service was busy
 * for a moment would cost the client their work for the sake of a size the
 * publish can still fix.
 *
 * ONE PICTURE AT A TIME, so what this holds beyond the write it was handed is
 * one capped copy — never the site.
 */
export function cappedSiteStore(store: TenantSiteStore, sizer: ImageSizer): TenantSiteStore {
  return {
    ...store,
    async write(site: string, change: SiteWrite): Promise<void> {
      if (!change.assets || change.assets.length === 0) return store.write(site, change)
      const assets = []
      for (const asset of change.assets) {
        assets.push({ ...asset, bytes: await cappedPicture(sizer, asset.name, asset.bytes) })
      }
      return store.write(site, { ...change, assets })
    },
  }
}

/** One asset's bytes as the door stores them — see {@link cappedSiteStore}. */
async function cappedPicture(sizer: ImageSizer, name: string, bytes: Uint8Array): Promise<Uint8Array> {
  if (!isLadderedAsset(name)) return bytes
  const contentType = contentTypeOf(name)
  try {
    const size = await sizer.measure(bytes, contentType)
    if (size === null) return bytes
    return (await capSource(sizer, bytes, contentType, size))?.bytes ?? bytes
  } catch (err) {
    console.warn(`[BUG-206] ${name} could not be capped at the door; stored as it is.`, err)
    return bytes
  }
}

/**
 * The site store with its door, for this deployment ([[BUG-206]]).
 *
 * THE STORE ITSELF WHERE THERE IS NO RENDERER, which is the same reading every
 * other image capability here takes of an absent binding: a deployment that
 * cannot transform stores what it is given, exactly as it always has.
 */
export function withPictureDoor(
  store: TenantSiteStore,
  env: ImageEditEnv,
  scope: { businessId: string },
): TenantSiteStore {
  const renderer = imageRendererFor(env, scope.businessId)
  return renderer === null ? store : cappedSiteStore(store, ladderSizer(renderer))
}

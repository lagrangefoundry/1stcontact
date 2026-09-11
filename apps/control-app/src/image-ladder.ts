import { imageRendererFor, UnrenderableImageError, type ImageEditEnv } from './image-edit'
import {
  imageLadder,
  type ImageLadder,
  type ImageSizer,
  type ImageSize,
} from '../../../tools/generate/src/publish/ladder'

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
    async resize(bytes: Uint8Array, contentType: string, width: number): Promise<Uint8Array | null> {
      try {
        // The empty recipe: this is the sizing pass and nothing else. `render`
        // applies `scale-down`, so a width at or above the source is a no-op
        // rather than an enlargement — belt and braces over the cap the ladder
        // has already applied.
        const rendered = await renderer.render(bytes, contentType, [], { width })
        return rendered.bytes
      } catch (err) {
        // One rung that would not render drops out and the rest of the ladder
        // stands: fewer choices for the browser, never a broken candidate.
        if (err instanceof UnrenderableImageError) return null
        throw err
      }
    },
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

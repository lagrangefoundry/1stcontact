/**
 * REQ-219 — **one renderer**: the Cloudflare Images binding, and where the
 * recipe it applies is kept.
 *
 * This is the composition root for image editing, the same shape `shot.ts` is
 * for Browser Rendering: everything the surface and the library reach is behind
 * a port in `tools/generate`, and this file is the one place that names a
 * binding. The vocabulary, the validation and the compiler are in
 * `image-recipe.ts` and know nothing about Cloudflare.
 *
 * WHY THE IMAGES BINDING AND NOT THE BROWSER. `[browser]` is already bound and
 * already paid for ([[REQ-154]]), and a headless Chromium could crop a picture
 * on a canvas. It is heavier per publish, and it cannot decode HEIC — so it
 * would have solved this and left the upload path ([[REQ-221]]) needing a second
 * answer. The transform pipeline maps almost one-to-one onto the vocabulary, so
 * a recipe is a transform chain rather than a canvas program.
 *
 * ALMOST. Three specifics the mapping does not make obvious, all of them in
 * `image-recipe.ts`: a crop is `trim` in pixels and therefore needs the real
 * dimensions; a rotation is a quarter turn; and each operation has to be its own
 * step, because within one step the platform applies trim before resize before
 * rotate and a collapsed recipe would silently reorder itself.
 *
 * RENDITIONS ARE CONTENT-ADDRESSED AND DELIBERATELY NOT WHERE THE BLOBS ARE.
 * See {@link r2Renditions} — this is the one storage decision here worth reading
 * before changing anything.
 */
import {
  compileRecipe,
  parseRecipe,
  type Dimensions,
  type EditOp,
  type ImageRenderer,
  type RecipeStore,
  type RenderedImage,
} from '../../../tools/generate/src/cli/image-recipe'
import type { TenantSiteStore } from '../../../tools/generate/src/store/d1r2-store'
import type { ImagesLike } from './heic'
import { republishMaterial } from './material'
import type { TicketStore } from './tickets'

/**
 * The output formats this renderer will write.
 *
 * KEYED BY WHAT CAME IN, so a PNG stays a PNG and keeps its transparency and a
 * JPEG stays a JPEG. Re-encoding a client's logo into a format they did not
 * choose is the kind of quiet change that is noticed a month later on a printed
 * brochure.
 *
 * GIF AND SVG ARE ABSENT AND THAT IS THE REFUSAL. An SVG has no fixed size in
 * pixels, so a recipe written in fractions of it has nothing to be a fraction
 * of; a GIF may be animated, and every transform here would flatten it to one
 * frame without saying so. Both are refused at {@link imagesRenderer}'s
 * `measure`, which is before anything is written — so the assistant is told, and
 * a drawing is redrawn rather than cropped.
 */
const OUTPUT_FORMATS: Record<string, 'image/jpeg' | 'image/png' | 'image/webp' | 'image/avif'> = {
  'image/jpeg': 'image/jpeg',
  'image/jpg': 'image/jpeg',
  'image/png': 'image/png',
  'image/webp': 'image/webp',
  'image/avif': 'image/avif',
}

/** Raised when a picture is not one a recipe can be written against. */
export class UnrenderableImageError extends Error {
  readonly name = 'UnrenderableImageError'
  constructor(message: string) {
    super(message)
  }
}

/**
 * Bytes as the binding wants them.
 *
 * Through a `Blob` rather than a hand-rolled `ReadableStream`, because that is
 * one platform call in both runtimes and a stream built by hand is one more
 * thing to get the backpressure of wrong.
 *
 * The cast is the standard-library one this repository already makes wherever
 * bytes meet a platform sink: `BlobPart` is declared over `ArrayBuffer` and a
 * `Uint8Array` is declared over `ArrayBufferLike`, which admits a
 * `SharedArrayBuffer` the runtime will never hand us. Slicing to satisfy it
 * would copy the whole picture.
 */
function streamOf(bytes: Uint8Array): ReadableStream<Uint8Array> {
  return new Blob([bytes as unknown as ArrayBuffer]).stream() as ReadableStream<Uint8Array>
}

/** The binding, as the {@link ImageRenderer} port. */
export function imagesRenderer(images: ImagesBinding): ImageRenderer {
  async function measure(bytes: Uint8Array, mediaType: string): Promise<Dimensions> {
    const format = OUTPUT_FORMATS[mediaType.toLowerCase()]
    if (!format) {
      throw new UnrenderableImageError(
        `a ${mediaType} is stored as itself rather than edited — there is no recipe for it.`,
      )
    }
    const info = await images.info(streamOf(bytes))
    // THE UNION'S OTHER ARM IS AN SVG, which reports a format and no size at
    // all. Reached through a content type that claimed to be a raster, which is
    // a mislabelled upload rather than a bug — so it refuses in the same
    // sentence as everything else that cannot be measured.
    if (!('width' in info) || !('height' in info)) {
      throw new UnrenderableImageError(
        `that picture reports no size in pixels, so a crop written in fractions of it has ` +
          `nothing to be a fraction of.`,
      )
    }
    return { width: info.width, height: info.height }
  }

  return {
    measure,
    async render(bytes, mediaType, recipe, opts): Promise<RenderedImage> {
      const source = await measure(bytes, mediaType)
      const format = OUTPUT_FORMATS[mediaType.toLowerCase()]!
      const compiled = compileRecipe(recipe, source)

      // A DELIVERY WIDTH IS NOT AN OPERATION and never joins the recipe.
      // Editorial versions are what the picture *is*; delivery renditions are
      // the same picture at several widths, and conflating them is how a Library
      // ends up holding five copies of everything. `scale-down` so a width
      // larger than the picture is a no-op rather than an enlargement.
      const deliver = opts?.width !== undefined && opts.width < compiled.width
      const scale = deliver ? opts!.width! / compiled.width : 1

      // NOTHING IS RENDERED FOR AN UNEDITED PICTURE. Every picture in the
      // Library is in that state today; none of them should start paying a
      // transform for a recipe they have not got.
      if (compiled.transforms.length === 0 && !deliver) {
        return { bytes, mediaType, width: source.width, height: source.height }
      }

      let chain = images.input(streamOf(bytes))
      for (const transform of compiled.transforms) chain = chain.transform(transform)
      if (deliver) chain = chain.transform({ width: opts!.width!, fit: 'scale-down' })
      const out = await chain.output({ format })
      const rendered = new Uint8Array(await new Response(out.image()).arrayBuffer())
      return {
        bytes: rendered,
        mediaType: out.contentType(),
        // COMPUTED RATHER THAN RE-MEASURED, which is one fewer pass over the
        // bytes for an answer the compiler already has. It is the platform's
        // arithmetic; the local renderer used in tests pads a two-sided resize
        // where the platform fits within, so those are the numbers to trust and
        // a suite that needs the other measures the bytes itself.
        width: Math.max(1, Math.round(compiled.width * scale)),
        height: Math.max(1, Math.round(compiled.height * scale)),
      }
    },
  }
}

/** Somewhere to keep bytes nobody has to be able to find by name. */
export interface RenditionCache {
  get(key: string): Promise<RenderedImage | null>
  put(key: string, rendition: RenderedImage): Promise<void>
}

/** Hex of the SHA-256 of some bytes. */
async function sha256(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', bytes as unknown as BufferSource)
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Renditions in R2, addressed by what produced them.
 *
 * **ON THE ORIGINAL, THE RECIPE AND THE SIZE ASKED FOR**, so nothing is
 * recomputed that has not changed. Publishes are frequent and image edits are
 * rare, so an unchanged picture costs zero transforms on republish.
 *
 * **NOT IN THE TICKETING COMPONENT'S KEYSPACE, AND THIS IS THE PART TO READ
 * BEFORE MOVING IT.** That store's orphan sweep lists every key under
 * `t/<tenant>/` and deletes whatever no attachment record names, after an hour.
 * A rendition is by construction a key no record names — so writing one there
 * would be putting a cache into a collector's input, and the failure would be a
 * picture that went blank an hour after it was cropped, on a schedule nobody
 * would connect to the crop. Its own prefix, on the same bucket, reached
 * directly.
 *
 * **TENANT-PREFIXED, even though the address is already a content hash.** A
 * global content address is an existence oracle across the tenant barrier — *"is
 * anyone else holding these exact bytes"* — which is the same objection the blob
 * store records against a global one, and it costs a path segment to close.
 *
 * The material store is sometimes described as the precedent for this and it is
 * not: it content-addressed blobs once and withdrew it deliberately, because a
 * blob shared between two records cannot be moved to the trash without breaking
 * whichever sibling still names it. Derived bytes are the case where the
 * objection does not apply, precisely because nothing names them.
 */
export function r2Renditions(bucket: R2Bucket, tenantId: string): RenditionCache {
  const prefix = `rendition/${tenantId}/`
  return {
    async get(key: string): Promise<RenderedImage | null> {
      const object = await bucket.get(prefix + key)
      if (!object) return null
      const bytes = new Uint8Array(await object.arrayBuffer())
      const meta = (object.customMetadata ?? {}) as Record<string, string>
      return {
        bytes,
        mediaType: object.httpMetadata?.contentType ?? 'application/octet-stream',
        width: Number(meta.width ?? 0),
        height: Number(meta.height ?? 0),
      }
    },
    async put(key: string, rendition: RenderedImage): Promise<void> {
      await bucket.put(prefix + key, rendition.bytes as unknown as ArrayBuffer, {
        httpMetadata: { contentType: rendition.mediaType },
        // THE DIMENSIONS TRAVEL WITH THE BYTES so a cache hit answers the same
        // shape a miss does. Recomputing them on read would mean either a second
        // decode or a compile against dimensions the caller may not have.
        customMetadata: { width: String(rendition.width), height: String(rendition.height) },
      })
    },
  }
}

/**
 * A renderer that does not recompute what it has already rendered.
 *
 * A DECORATOR AND NOT A BRANCH INSIDE THE RENDERER, so the binding adapter stays
 * the one thing that knows about transforms and this stays the one thing that
 * knows about storage. A deployment with no bucket composes the renderer alone
 * and every call is a real transform, which is slower and identical.
 *
 * `measure` IS NOT CACHED. It is an `info` call over bytes the caller is already
 * holding, it answers in a single pass, and caching it would mean a second
 * keyspace to invalidate for something nobody is waiting on.
 */
export function cachedRenderer(renderer: ImageRenderer, cache: RenditionCache): ImageRenderer {
  return {
    measure: renderer.measure,
    async render(bytes, mediaType, recipe, opts): Promise<RenderedImage> {
      const source = await sha256(bytes)
      // THE RECIPE AS IT IS, NOT NORMALISED. Two recipes that differ only in key
      // order are the same picture and would miss each other here — which costs
      // one transform and is correct, where a normalisation that was subtly
      // wrong would serve one recipe's bytes for another's.
      const key = await sha256(
        new TextEncoder().encode(`${source}\n${JSON.stringify(recipe)}\n${opts?.width ?? ''}`),
      )
      const hit = await cache.get(key)
      if (hit) return hit
      const rendered = await renderer.render(bytes, mediaType, recipe, opts)
      await cache.put(key, rendered)
      return rendered
    },
  }
}

/**
 * The Library's recipes: a field on the material record.
 *
 * **A FIELD AND NOT A TABLE.** The record is already the thing that answers
 * *what is this picture* — its description, its rights, where it has been placed
 * — and the recipe is one more answer to that question. A table would be a join
 * for every Library row that draws a thumbnail.
 *
 * **ABSENCE IS THE EMPTY RECIPE**, the same reading `placed_on` takes, so every
 * picture that predates this needs no migration and no consumer has to treat
 * "never edited" as a third state distinct from "edited to nothing".
 */
export function materialRecipes(store: TicketStore): RecipeStore {
  return {
    async read(uid: string): Promise<EditOp[]> {
      const { ticket } = await store.get({ uid })
      return parseRecipe(ticket.fields.edits)
    },
    async write(uid: string, recipe: readonly EditOp[]): Promise<void> {
      await store.update({ uid, patch: { fields: { edits: [...recipe] } } })
    },
  }
}

/**
 * The Library's recipes, with the step that carries a change to the site
 * ([[REQ-229]]).
 *
 * **A DECORATOR, AND NOT A BRANCH INSIDE `materialRecipes`**, on the pattern
 * {@link cachedRenderer} sets: that function stays the one thing that knows a
 * recipe is a field on a record, and this stays the one thing that knows a
 * material's bytes may also be sitting on a site. A deployment with no site
 * store composes the bare port and every write is a record write, which is
 * slower to notice and otherwise identical.
 *
 * **IT EXISTS SO `edit_image` AND THE CLIENT'S MODAL PROPAGATE ALIKE.** The two
 * are producers of one fact — the recipe on the record — and [[REQ-228]] has
 * just put the catalogue in the assistant's hands. A propagation that fired for
 * the modal and not for the tool would re-open, on the surface the product leads
 * with, exactly the gap [[REQ-229]] closes.
 *
 * **A PROPAGATION THAT FAILS DOES NOT UNDO THE EDIT.** {@link republishMaterial}
 * answers per placement rather than throwing, and the port has nowhere to put an
 * answer — so what a stale record costs here is a site left holding the previous
 * bytes, reported in the draft's change journal by the replacement that did land
 * and silent about the one that did not. The modal's route returns the whole
 * report, because it has an envelope to put it in.
 */
export function republishingRecipes(
  recipes: RecipeStore,
  deps: { tickets: TicketStore; sites: TenantSiteStore; renderer: ImageRenderer },
): RecipeStore {
  return {
    read: recipes.read,
    async write(uid: string, recipe: readonly EditOp[]): Promise<void> {
      await recipes.write(uid, recipe)
      await republishMaterial(deps.tickets, deps.sites, uid, { renderer: deps.renderer })
    },
  }
}

/** What this deployment needs to be able to change a picture. */
export interface ImageEditEnv {
  /**
   * The Cloudflare Images binding (`[images]` in wrangler.toml).
   *
   * TYPED AS THE NARROW SHAPE THE HEIC PATH NAMED ([[REQ-221]]), not as the
   * platform's whole `ImagesBinding`, because there is ONE binding and one
   * declaration of it on the router's env. That path names the two calls it
   * makes so a UAT can hand it a double without implementing an image service,
   * and widening the field to satisfy this module would take that away from a
   * path that has nothing to do with recipes. {@link imageRendererFor} narrows
   * instead — see there.
   *
   * OPTIONAL, AND ABSENT IS ORDINARY — the same shape a missing browser and a
   * missing image credential already have. No binding means no editing tool: the
   * surface is `null`, the manual never mentions it, and the model cannot
   * propose a capability the session has not got.
   */
  IMAGES?: ImagesLike
  /** The material bucket, which also holds the renditions under its own prefix. */
  BLOBS?: R2Bucket
}

/**
 * Whether this object is the whole binding rather than the HEIC path's slice of
 * it.
 *
 * ASKED AT RUNTIME, ONCE, AT THE COMPOSITION ROOT. `info` is the call the
 * renderer cannot do without — a recipe written in fractions needs the picture's
 * real pixels before a single operation can be compiled — so its presence is
 * exactly the question *"can this deployment apply a recipe"*, and asking it is
 * honest where a cast would merely assert it. A double that implements only the
 * conversion half genuinely cannot render, and saying so beats failing later
 * inside a transform chain.
 */
function canRender(images: ImagesLike): images is ImagesLike & ImagesBinding {
  return typeof (images as Partial<ImagesBinding>).info === 'function'
}

/**
 * The renderer for this deployment, or `null` where it has no binding.
 *
 * Cached where there is a bucket to cache in, uncached where there is not —
 * which is a difference in cost and not in behaviour.
 *
 * `null` ALSO FOR A BINDING THAT CANNOT TRANSFORM, and that is the same state
 * rather than a second one: no renderer means the surface is not composed and
 * every picture is its own original, which is what a deployment without the
 * binding already meant.
 */
export function imageRendererFor(env: ImageEditEnv, tenantId: string): ImageRenderer | null {
  if (!env.IMAGES || !canRender(env.IMAGES)) return null
  const renderer = imagesRenderer(env.IMAGES)
  return env.BLOBS ? cachedRenderer(renderer, r2Renditions(env.BLOBS, tenantId)) : renderer
}

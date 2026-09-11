/**
 * REQ-157 — the picture vocabulary: one way to name any image, resolved once.
 *
 * WHY THE CLI'S FLAGS COULD NOT BECOME A TOOL SURFACE. Every fidelity verb grew
 * its own way of naming an image, because each was written for a person typing
 * it: `--ref <bundleDir|refPng>`, `--actual <png>`, `--source draft|published`,
 * `--size`, `--url`, `--port`. That is fine at a prompt, where the operator
 * knows which verb they are running and reads its `--help`. It is useless as a
 * tool surface, where a model must be able to say "this picture" once and have
 * every operation understand it — and where "compare anything to anything"
 * is a claim about the *arguments*, not about the comparison.
 *
 * So there is ONE {@link PictureSource}, it names all six kinds of picture, and
 * {@link resolvePicture} is the only thing that turns one into pixels.
 * `screenshot` takes one; `compare` takes two, in any combination. That is what
 * makes draft-against-reference, draft-against-revision and
 * revision-against-revision the same operation rather than three.
 *
 * REQ-218 ADDED THE SIXTH KIND AND PROVED THE CLAIM THE FIFTH ONLY MADE. Five of
 * them are a PAGE, which is how the assistant came to be able to see every page
 * in the product and no picture in it — not one it generated, not one the client
 * uploaded, not an SVG it drew itself. `image` is a picture in the store,
 * addressable however it is referenced (see `image-library.ts`), and the whole
 * of what it cost `compare`, `check_fidelity` and the reduction cap is nothing:
 * this function normalises it to a screenshot, so every verb downstream gained
 * it without being told.
 *
 * IT RESOLVES TO BYTES, NEVER TO A PATH. A resolver that handed back a filename
 * would be the filesystem leaking through the same seam `SiteStore` and
 * `ReferenceStore` were drawn to close, and the Worker could not use it —
 * which is the whole reason the four tickets under this one exist.
 */
import type { ReferenceStore } from '../store/reference-store'
import { ladderMember, SCREENSHOT_MEMBER } from '../store/reference-store'
import type { BrowserDriverFactory, Viewport } from './capture/types'
import { PageStepSyntaxError, parsePageSteps } from './capture/interact'
import type { PageStep } from './capture/interact'
import {
  rasterizeImage,
  resolveViewport,
  screenshotUrl,
  VIEWPORTS,
} from './capture/screenshot'
import { pngDimensions, sniffImageFormat } from './png'
import { resolveStoredImage } from './image-library'
import type { ImageLibrary, StoredImage } from './image-library'
import type { ViewportName } from './capture/screenshot'
import { revisionChannel } from './preview'
import type { PreviewChannel } from './preview'
import { assertPublicUrl } from './capture/egress-guard'

/** The six kinds of picture, as the surface declares them. */
export type PictureKind = 'reference' | 'draft' | 'edit' | 'revision' | 'url' | 'image'

/**
 * One picture, named.
 *
 * A FLAT OBJECT WITH A `kind` DISCRIMINANT rather than a union of shapes,
 * because this is what the model fills in and the declaration format validates:
 * `keys` gives every field a type, a description and — for `kind` and `viewport`
 * — an enum, and projects the whole thing into the tool's JSON schema. A model
 * is therefore *shown* which fields exist before it guesses.
 *
 * Which fields are REQUIRED depends on `kind`, and that is a cross-field rule no
 * per-key declaration can express. {@link resolvePicture} enforces it and says
 * what was missing, which costs one turn in the worst case and is the same
 * bargain every optional-by-declaration parameter makes.
 */
export interface PictureSource {
  kind: PictureKind
  /** `reference`: the bundle's name in the store. */
  bundle?: string
  /** `draft` / `edit` / `revision`: the path within the site, default `/`. */
  page?: string
  /** `revision`: which published revision. */
  revision?: number
  /** `url`: the address to fetch. Public http(s) only — see `egress-guard.ts`. */
  url?: string
  /**
   * REQ-218 — `image`: which stored picture, however it is referenced.
   *
   * The site filename, the `/assets/…` handle a page holds, the bare name a
   * drawing was written under, the Library record or the Library title — one
   * rule, in `image-library.ts`, because a client asking about "the logo" does
   * not know which of the two stores holds it and neither does the assistant.
   */
  image?: string
  /**
   * REQ-218 — `image`: the picture before any edit, rather than as it stands.
   *
   * *"What did the crop take away"* is a real question, and it is the only one
   * the current state cannot answer. Until the recipe exists ([[REQ-219]]) every
   * picture is its own original and both answers are the same bytes.
   */
  original?: boolean
  /** Which viewport preset to render or read at. Default `desktop`. */
  viewport?: ViewportName
  /**
   * REQ-216 — what to do to the page before the shutter opens, in order.
   *
   * Each entry is one short phrase — `click "Sign in"`, `fill "Email" with
   * "someone@example.com"` — read by `capture/interact.ts`. `draft` only: see
   * {@link drivableSteps} for why the other four kinds refuse.
   */
  after?: string[]
}

/** A resolved picture: the bytes, and what they are of. */
export interface ResolvedPicture {
  bytes: Uint8Array
  /** A one-line name for the picture, for the model and for the journal. */
  label: string
  viewport: Viewport
  /**
   * REQ-216 — what this channel does NOT do, when that is worth saying.
   *
   * THE CHEAPER HALF OF THE SAME TICKET, and the one that would have ended the
   * exchange that prompted it before it started. A picture of the edit channel
   * looks like a picture of the page and is not one: the behaviour scripts are
   * absent by [[REQ-116]], so a panel shows its settled state and nothing on it
   * can be opened. Without a caption the model has to *infer* which page it is
   * looking at, and inferring is what it got wrong — it invented a "preview
   * mode" rather than reading a label, because there was no label. It is a
   * sentence, it costs nothing, and it converts the failure from "the model
   * invents a mechanism" into "the model reads the caption".
   */
  note?: string
}

/** Raised when a picture source names something that is not there. */
export class PictureNotFoundError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PictureNotFoundError'
  }
}

/** Raised when a picture source's fields do not go together. */
export class PictureSourceError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PictureSourceError'
  }
}

/**
 * REQ-218 — raised when this deployment cannot answer a kind of picture at all.
 *
 * A SEPARATE CLASS FROM {@link PictureSourceError} because it is a different
 * message to a different reader. A source error is the caller's to fix by asking
 * differently; this one is nobody's to fix from inside a conversation, and the
 * only useful response is to say so and carry on — which is exactly what the
 * surface's `ENVIRONMENT` refusal already means for a deployment with no browser.
 */
export class PictureEnvironmentError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PictureEnvironmentError'
  }
}

/** The sentence a deployment with no image store answers every picture ask with. */
export const NO_IMAGE_STORE =
  'this deployment holds no pictures it can show you — there is no image store wired ' +
  'to it. Nothing you can do about it; say so and carry on with what you can do.'

/** Everything resolution needs, injected — so nothing here knows its runtime. */
export interface PictureDeps {
  /** The site every draft/edit/revision picture is of. Never model-supplied. */
  slug: string
  /** Where captured references live. */
  references: ReferenceStore
  /** A browser, already held to whatever egress policy the host applies. */
  driverFactory: BrowserDriverFactory
  /**
   * This deployment's own origin, for the preview channels.
   *
   * The browser navigates a real absolute URL and the request is fulfilled in
   * process — see `previewOriginResolver`. It is a parameter because only the
   * host knows its own address, and getting it wrong means screenshotting an
   * Access challenge rather than a page.
   */
  origin: string
  /**
   * REQ-218 — the stored pictures this deployment holds, across both namespaces.
   *
   * OPTIONAL, AND ITS ABSENCE IS AN ORDINARY DEPLOYMENT rather than a
   * misconfiguration — the same rule `adoptCapture` is registered under. The
   * builder in the cloud holds a site store and a ticket store and therefore
   * both namespaces; the local `1c` holds a site store and no tickets, so it has
   * the site's assets and no Library. Each answers for what it has and says so
   * about the rest, which is the honest shape and not a degraded one.
   */
  images?: ImageLibrary
}

/** The field `kind` requires, so a refusal can name it. (Not `require` — that
 *  name is taken by a global in every runtime this has to compile for.) */
function needed<T>(value: T | undefined, kind: PictureKind, field: string): T {
  if (value === undefined || value === null || value === '') {
    throw new PictureSourceError(
      `a picture of kind '${kind}' needs '${field}'; it was not supplied.`,
    )
  }
  return value
}

/** `/` when nothing was said, and always leading-slashed. */
function pagePath(page: string | undefined): string {
  const rel = page ?? '/'
  return rel.startsWith('/') ? rel : `/${rel}`
}

/** The preview URL for one of our own channels. */
function previewUrl(deps: PictureDeps, channel: PreviewChannel, page: string | undefined): string {
  const base = new URL(deps.origin)
  return new URL(
    `/preview/${encodeURIComponent(deps.slug)}/${channel}${pagePath(page)}`,
    base,
  ).toString()
}

/**
 * A captured reference's screenshot at `viewport`.
 *
 * The ladder member is preferred and the full-page shot is the fallback,
 * matching what `1c diff --size` resolves — a bundle captured before the
 * viewport ladder existed still has a desktop shot, and reading it is better
 * than refusing a comparison the operator can plainly see is possible. The
 * label says which one it was, so a comparison against a fallback is never
 * mistaken for one against the right width.
 */
async function referenceShot(
  deps: PictureDeps,
  source: PictureSource,
  viewport: Viewport,
  viewportName: ViewportName,
): Promise<ResolvedPicture> {
  const name = needed(source.bundle, 'reference', 'bundle')
  const bundle = deps.references.bundle(name)
  const ladder = await bundle.read(ladderMember(viewport.width))
  if (ladder) {
    return { bytes: ladder, label: `reference ${name} at ${viewportName}`, viewport }
  }
  const full = await bundle.read(SCREENSHOT_MEMBER)
  if (full) {
    return {
      bytes: full,
      label: `reference ${name} (full-page shot; no ${viewportName} ladder member)`,
      viewport,
    }
  }
  throw new PictureNotFoundError(
    `reference '${name}' holds no screenshot. List the references to see what has been captured.`,
  )
}

/**
 * REQ-216 — the caption an `edit` picture carries.
 *
 * Written once, here, because the fact it states is a fact about the CHANNEL
 * and not about any one operation on it: every verb that resolves a picture
 * gets the same sentence, and there is no second place for it to drift from.
 */
export const EDIT_CHANNEL_NOTE =
  'This is the edit channel, which ships no behaviour: panels, carousels and ' +
  'disclosures show their settled state, and nothing on it opens, advances or ' +
  'submits. Take the same page as a `draft` picture to see what a visitor gets.'

/**
 * The steps this picture may be driven with, refusing by kind before a browser
 * is leased.
 *
 * DRAFT ONLY, and each of the other five refuses for its own reason rather than
 * by a blanket rule. `edit` ships no behaviour at all ([[REQ-116]]), so a step
 * against it would be asking a page to do something it structurally cannot —
 * and driving that channel is [[REQ-215]]'s problem, not this one. `reference`
 * is a recording; there is no page to drive. `revision` and `url` are live
 * pages belonging to the published site and to strangers respectively, and a
 * click there is a real side effect on somebody else's system — a submitted
 * enquiry, a real request — which is not what "show me what this looks like"
 * should ever be able to cause. `image` ([[REQ-218]]) is a picture rather than
 * a page: there is no control on it, and changing what it shows is `edit_image`
 * deliberately and not a gesture smuggled in front of a shutter.
 */
function drivableSteps(source: PictureSource): PageStep[] {
  const after = source.after ?? []
  if (after.length === 0) return []
  if (source.kind !== 'draft') {
    throw new PictureSourceError(
      `only a 'draft' picture can be driven, and this one is '${source.kind}'. ` +
        (source.kind === 'edit'
          ? `The edit channel ships no behaviour, so there is nothing there to open or advance. `
          : source.kind === 'reference'
            ? `A reference is a recording of a page, not a page. `
            : source.kind === 'image'
              ? `A stored picture is a picture and not a page, so there is nothing on it to click or fill; ` +
                `changing what it shows is 'edit_image'. `
              : `Driving a published revision or somebody else's address would act on a live system. `) +
        `Ask for the same thing as a 'draft' picture.`,
    )
  }
  try {
    return parsePageSteps(after)
  } catch (error) {
    if (error instanceof PageStepSyntaxError) throw new PictureSourceError(error.message)
    throw error
  }
}

/**
 * REQ-218 — the caption a drawing carries, and the one thing it gives up.
 *
 * A drawing is photographed in a bare document rather than inside the site's own
 * page, so the `@font-face` rules the site serves are not in scope and its text
 * resolves in the browser's default face. On a wordmark that is a visible
 * difference and exactly the kind of thing a model would otherwise report as a
 * finding about the drawing. Written here for the same reason
 * {@link EDIT_CHANNEL_NOTE} is: it is a fact about how the picture was made, not
 * about any one operation on it.
 */
export const DRAWING_RASTER_NOTE =
  'This is a drawing, photographed outside the site\'s own page, so its text is ' +
  'in the browser\'s default face rather than the one the site serves. Use ' +
  '`measure_drawing` to read where anything in it actually is.'

/**
 * Which stored picture `image` names, refusing by name when it is not one.
 *
 * THE REFUSAL IS THE INTERESTING HALF. "Not found" hands back the listing to
 * look at, because a name that matched nothing is a name the caller invented.
 * "Found several" hands back the candidates AND their unambiguous names, because
 * the caller is one call from being right and the worst available outcome is a
 * picture returned as though it were the one that was asked for.
 */
async function storedImage(library: ImageLibrary, source: PictureSource): Promise<StoredImage> {
  const name = needed(source.image, 'image', 'image')
  const images = await library.list()
  const { match, candidates } = resolveStoredImage(name, images)
  if (match) return match
  if (candidates.length > 1) {
    throw new PictureSourceError(
      `'${name}' names ${candidates.length} pictures: ` +
        candidates.map((c) => `'${c.name}'`).join(', ') +
        `. Ask for one of those names, each of which means exactly one picture.`,
    )
  }
  // POINTED AT THE LISTINGS THAT EXIST. There is deliberately no operation that
  // enumerates the Library — a picture's handle arrives in the result of
  // whatever made it, which is the case this whole capability is for — so the
  // refusal names the two listings a caller actually has and the one place a
  // Library handle comes from, rather than a verb that is not there.
  throw new PictureNotFoundError(
    `no stored picture called '${name}'.` +
      (images.length === 0
        ? ` This deployment holds none yet.`
        : ` Name it by the handle you were given when it was made, by the name it appears ` +
          `under in the Library, or by anything list_assets shows.`),
  )
}

/**
 * A stored picture's pixels, in the currency everything downstream speaks.
 *
 * PNG PASSES STRAIGHT THROUGH and everything else is photographed. That is not
 * two code paths so much as the absence of one: PNG is already what every other
 * kind of picture resolves to, so re-rendering it would cost a browser lease,
 * flatten its transparency onto white and give back bytes no better than the
 * ones we had. Anything else — a phone's JPEG, a generator's WebP, a drawing's
 * SVG — has no decoder in this product by design ([[REQ-156]]), and the browser
 * is the decoder we already own.
 *
 * SNIFFED RATHER THAN TRUSTED. The stored content type is a field somebody wrote
 * down, and `material.ts` repairs it from the filename when it is silent — so it
 * is a good enough hint to hand a browser and not good enough to branch on. The
 * leading bytes are the thing itself.
 */
async function storedPicture(
  deps: PictureDeps,
  source: PictureSource,
): Promise<ResolvedPicture> {
  const library = deps.images
  if (!library) throw new PictureEnvironmentError(NO_IMAGE_STORE)
  const image = await storedImage(library, source)
  const original = source.original === true
  const bytes = await library.read(image, { original })
  const title = image.title && image.title !== image.name ? ` (${image.title})` : ''
  // `original` is named in the label whenever it was asked for, even though it
  // is the same picture today. A transcript that says which was asked for stays
  // readable once the recipe makes the two differ.
  const label =
    `${image.where} image ${image.name}${title}` + (original ? ', as originally stored' : '')

  const format = sniffImageFormat(bytes)
  if (format === 'PNG') return { bytes, label, viewport: pngDimensions(bytes, label) }

  const shot = await rasterizeImage(bytes, image.mediaType, deps.driverFactory, `'${image.name}'`)
  return {
    bytes: shot.bytes,
    label,
    viewport: { width: shot.width, height: shot.height },
    ...(format === 'SVG' ? { note: DRAWING_RASTER_NOTE } : {}),
  }
}

/**
 * Turn a picture source into pixels.
 *
 * THE ONE PLACE. Every operation on the fidelity surface calls this and none
 * resolves anything itself, which is what makes the vocabulary true rather than
 * documented: a sixth kind of picture is added here and every verb gets it.
 */
export async function resolvePicture(
  source: PictureSource,
  deps: PictureDeps,
): Promise<ResolvedPicture> {
  const viewportName = source.viewport ?? 'desktop'
  const viewport = resolveViewport(viewportName)
  // Read once, before the switch, so a driven ask against a kind that cannot be
  // driven refuses by name whichever kind it was — and before any browser is
  // leased for it.
  const steps = drivableSteps(source)

  switch (source.kind) {
    case 'reference':
      return referenceShot(deps, source, viewport, viewportName)

    case 'draft':
    case 'edit': {
      const url = previewUrl(deps, source.kind, source.page)
      const after = steps.length ? `, after ${steps.map((s) => `\`${s.source}\``).join(' then ')}` : ''
      return {
        bytes: await screenshotUrl(url, viewport, deps.driverFactory, steps),
        label: `${deps.slug} ${source.kind}${pagePath(source.page)} at ${viewportName}${after}`,
        viewport,
        ...(source.kind === 'edit' ? { note: EDIT_CHANNEL_NOTE } : {}),
      }
    }

    case 'revision': {
      const id = needed(source.revision, 'revision', 'revision')
      const url = previewUrl(deps, revisionChannel(id), source.page)
      return {
        bytes: await screenshotUrl(url, viewport, deps.driverFactory),
        label: `${deps.slug} revision ${id}${pagePath(source.page)} at ${viewportName}`,
        viewport,
      }
    }

    case 'url': {
      // Checked here as well as at the driver's request seam, so an obviously
      // bad ask is refused without leasing a browser. The seam is the control;
      // this is the better error message.
      const url = assertPublicUrl(needed(source.url, 'url', 'url')).toString()
      return {
        bytes: await screenshotUrl(url, viewport, deps.driverFactory),
        label: `${url} at ${viewportName}`,
        viewport,
      }
    }

    // REQ-218 — THE ONE KIND WITH NO VIEWPORT, and the reason it takes none: a
    // page is laid out at a width somebody chose and can be right at one and
    // wrong at another, whereas a picture is already the size it is. So
    // `viewport` is not read here, and what is reported back is the picture's
    // own dimensions — which is what `compare` then crops against.
    case 'image':
      return storedPicture(deps, source)

    default:
      throw new PictureSourceError(
        `'${String(source.kind)}' is not a kind of picture. Use one of: ` +
          `reference, draft, edit, revision, url, image.`,
      )
  }
}

/** The URL a picture source is rendered at, for the verbs that read a live page
 *  rather than a screenshot of one. Reference pictures have no URL. */
export function pictureUrl(source: PictureSource, deps: PictureDeps): string | null {
  switch (source.kind) {
    case 'draft':
    case 'edit':
      return previewUrl(deps, source.kind, source.page)
    case 'revision':
      return previewUrl(deps, revisionChannel(needed(source.revision, 'revision', 'revision')), source.page)
    case 'url':
      return assertPublicUrl(needed(source.url, 'url', 'url')).toString()
    default:
      return null
  }
}

/**
 * REQ-216 — the same steps `resolvePicture` would drive, for the verbs that read
 * a LIVE page rather than a screenshot of one.
 *
 * Exported rather than duplicated for the reason this whole module exists: a
 * value manifest taken of the closed page while the picture beside it shows the
 * open one would be two answers about two different states, presented as one
 * reading of one page.
 */
export function pictureSteps(source: PictureSource): PageStep[] {
  return drivableSteps(source)
}

/** Re-exported so the surface's viewport enum is derived, never re-typed. */
export const VIEWPORT_NAMES = Object.keys(VIEWPORTS) as ViewportName[]

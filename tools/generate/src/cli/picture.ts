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
 * So there is ONE {@link PictureSource}, it names all five kinds of picture, and
 * {@link resolvePicture} is the only thing that turns one into pixels.
 * `screenshot` takes one; `compare` takes two, in any combination. That is what
 * makes draft-against-reference, draft-against-revision and
 * revision-against-revision the same operation rather than three.
 *
 * IT RESOLVES TO BYTES, NEVER TO A PATH. A resolver that handed back a filename
 * would be the filesystem leaking through the same seam `SiteStore` and
 * `ReferenceStore` were drawn to close, and the Worker could not use it —
 * which is the whole reason the four tickets under this one exist.
 */
import type { ReferenceStore } from '../store/reference-store'
import { ladderMember, SCREENSHOT_MEMBER } from '../store/reference-store'
import type { BrowserDriverFactory, Viewport } from './capture/types'
import { resolveViewport, screenshotUrl, VIEWPORTS } from './capture/screenshot'
import type { ViewportName } from './capture/screenshot'
import { revisionChannel } from './preview'
import type { PreviewChannel } from './preview'
import { assertPublicUrl } from './capture/egress-guard'

/** The five kinds of picture, as the surface declares them. */
export type PictureKind = 'reference' | 'draft' | 'edit' | 'revision' | 'url'

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
  /** Which viewport preset to render or read at. Default `desktop`. */
  viewport?: ViewportName
}

/** A resolved picture: the bytes, and what they are of. */
export interface ResolvedPicture {
  bytes: Uint8Array
  /** A one-line name for the picture, for the model and for the journal. */
  label: string
  viewport: Viewport
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

  switch (source.kind) {
    case 'reference':
      return referenceShot(deps, source, viewport, viewportName)

    case 'draft':
    case 'edit': {
      const url = previewUrl(deps, source.kind, source.page)
      return {
        bytes: await screenshotUrl(url, viewport, deps.driverFactory),
        label: `${deps.slug} ${source.kind}${pagePath(source.page)} at ${viewportName}`,
        viewport,
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

    default:
      throw new PictureSourceError(
        `'${String(source.kind)}' is not a kind of picture. Use one of: ` +
          `reference, draft, edit, revision, url.`,
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

/** Re-exported so the surface's viewport enum is derived, never re-typed. */
export const VIEWPORT_NAMES = Object.keys(VIEWPORTS) as ViewportName[]

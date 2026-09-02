import { renderSiteFiles, type RenderedSite } from '../render/render'
import { assembleSite, type LoadResult } from '../store/assemble'
import type { SiteStore } from '../store/site-store'
import { MIME } from '../store/content-type'
import { InvalidDefinitionError } from './errors'
import type { OriginFile, OriginResolver } from './capture/types'

/**
 * Request-time renders of the draft and edit channels (REQ-119 / DOC-28 §12 T5).
 *
 * WHAT CHANGED. Until now the builder served `/preview/<slug>/draft|edit/…`
 * straight off `storage/dist/…` — bytes an earlier `1c render` had written — and
 * every save re-materialised both whole channels to disk before the iframe
 * reloaded. Rendering on request removes that step and the staleness rule that
 * came with it: there is no artifact to be stale, because a response is produced
 * from the definition that exists when the request arrives.
 *
 * NOT A SECOND RENDERER. Everything here reads {@link renderSiteFiles} — the one
 * render (`render/render.ts`), of which `1c render` is a writer and this is a
 * reader. A response is a lookup into the same map `1c render` would have
 * written to disk, so byte-identity between the two paths is not a property
 * maintained by care; there is only one place where a byte is decided.
 *
 * PUBLISHED IS UNTOUCHED. `published` still renders at publish time and is
 * served off disk here and by `public-site` from R2. This is the draft-side
 * loop only.
 *
 * ONE SEAM, NOT TWO (REQ-142). This module used to declare its own `DraftStore`
 * — a read-only interface with an `fsDraftStore` implementation — while
 * `edit.ts` wrote through `node:fs` directly. So the seam DOC-12 §7 describes
 * existed for reads and not for writes, and the read half had a shape the write
 * half could never have adopted: its `asset()` returned an ABSOLUTE FILESYSTEM
 * PATH, which is not a narrow interface with one convenience on it but the
 * filesystem itself, reachable through the port. Both halves are now the one
 * {@link SiteStore}, and assets move as bytes.
 */

/**
 * A published revision, addressed by id — REQ-157's fifth picture source.
 *
 * WHY A CHANNEL RATHER THAN A NEW ROUTE. Everything that shoots a page already
 * takes a channel: the origin resolver matches one out of the path, the render
 * cache is keyed by one, and `shotPreview` builds its URL from one. A revision
 * is another thing to render at a URL, so making it a channel means the browser,
 * the resolver and the cache all serve it without learning a second shape.
 */
export type RevisionChannel = `rev-${number}`

/**
 * The channels rendered on request.
 *
 * `draft` and `edit` render the working copy; `rev-<id>` renders a frozen
 * revision. What is still not here is `published` as a bare word — it never
 * named one thing (it meant "whichever revision is live", which changes under
 * the caller), and an id always does.
 */
export type PreviewChannel = 'draft' | 'edit' | RevisionChannel

/** The channel that names revision `id`. */
export function revisionChannel(id: number): RevisionChannel {
  return `rev-${id}`
}

/** The revision a channel names, or null when it names the draft side. */
export function revisionIdOf(channel: string): number | null {
  const match = /^rev-(\d+)$/.exec(channel)
  return match ? Number(match[1]) : null
}

export type { DraftSnapshot } from '../store/site-store'

/**
 * What a preview URL resolves to.
 *
 * `bytes` rather than a filename (REQ-142): an asset is whatever the store hands
 * back, and a store with no filesystem has no name to hand over. The dev origin
 * therefore buffers an asset instead of streaming it, which is the one behaviour
 * this trade costs — acceptable where it lands, because this path serves an
 * operator's own draft assets to their own browser.
 */
export type PreviewFile =
  | { kind: 'text'; contentType: string; body: string }
  | { kind: 'bytes'; contentType: string; body: Uint8Array }

/** The extension of `name`, `.` included, or `''` — `path.extname` without `path`. */
function extname(name: string): string {
  const base = name.slice(name.lastIndexOf('/') + 1)
  const dot = base.lastIndexOf('.')
  return dot <= 0 ? '' : base.slice(dot)
}

/** Collapse `.`/`..` segments in a POSIX-style relative path. */
function normalizeRel(name: string): string {
  const out: string[] = []
  for (const seg of name.split('/')) {
    if (seg === '' || seg === '.') continue
    if (seg === '..') {
      if (out.length === 0) return '..'
      out.pop()
    } else {
      out.push(seg)
    }
  }
  return out.join('/')
}

/**
 * Resolves one preview URL to one artifact, rendering the channel on demand.
 *
 * The render is memoised per `(slug, channel)` and invalidated by the store's
 * stamp, so a page view costs one render rather than one per file it pulls, and
 * a stale entry cannot be served: the stamp is checked before the cache is read,
 * not on a timer.
 */
export class PreviewRenderer {
  private readonly cache = new Map<string, { stamp: string; rendered: RenderedSite }>()

  /**
   * REQ-148 — there are no render seams to inject any more. This class used to
   * take an Astro container and a module resolver, because a behavior-module page
   * needed a transform a Worker could not run; behavior components are plain
   * functions now, so both hosts render every page — L1 or behavior — through the
   * same {@link renderSiteFiles}.
   */
  constructor(private readonly store: SiteStore) {}

  /**
   * The artifact `rel` names inside `slug`'s `channel`, or `null` for a request
   * that names no site, no page and no asset.
   *
   * `rel` is the path AFTER `/preview/<slug>/<channel>`, so `/`, `/about` and
   * `/theme.css` are all valid. Resolution mirrors the static server it
   * replaces (`serve.ts`): a directory request means `index.html`, and an
   * extensionless path falls back to the sibling `.html` so preview URLs match
   * the ones production serves (REQ-113).
   */
  async file(slug: string, channel: PreviewChannel, rel: string): Promise<PreviewFile | null> {
    const snapshot = await this.source(slug, channel)
    if (snapshot === null) return null
    // An invalid draft is the AUTHOR'S error and must surface as such. Before
    // request-time rendering it could not: a broken edit left the last good
    // render on disk, so the iframe kept showing a page that no longer
    // described the definition, indefinitely and with nothing to signal it.
    if (!snapshot.result.ok) throw new InvalidDefinitionError(slug, snapshot.result.errors)

    let name = decodeURIComponent(rel).replace(/^\/+/, '')
    if (name === '' || name.endsWith('/')) name += 'index.html'
    name = normalizeRel(name)
    if (name === '..' || name.startsWith('../')) return null

    if (name.startsWith('assets/')) {
      const body = await snapshot.asset(name.slice('assets/'.length))
      if (body === null) return null
      return {
        kind: 'bytes',
        contentType: MIME[extname(name)] ?? 'application/octet-stream',
        body,
      }
    }

    const rendered = await this.render(slug, channel, snapshot)
    // The exact name first, then the extensionless fallback — ordered, so a real
    // artifact always wins and nothing that resolves today starts resolving
    // somewhere else.
    const key = rendered.files.has(name)
      ? name
      : extname(name) === '' && rendered.files.has(`${name}.html`)
        ? `${name}.html`
        : null
    if (key === null) return null
    return {
      kind: 'text',
      contentType: MIME[extname(key)] ?? 'application/octet-stream',
      body: rendered.files.get(key)!,
    }
  }

  /**
   * The definition a channel renders, and where its assets come from.
   *
   * THE ASSET LOOKUP TRAVELS WITH THE DEFINITION, and that is the whole reason
   * this is one object rather than two calls. A revision is immutable, so
   * revision 3's page must be served with revision 3's `logo.svg` — reading the
   * asset off the draft would produce a picture of a page that never existed,
   * and it would do so silently, which for a tool whose output is evidence is
   * the worst available failure.
   */
  private async source(slug: string, channel: PreviewChannel): Promise<PreviewSource | null> {
    const id = revisionIdOf(channel)
    if (id === null) {
      const draft = await this.store.loadDraft(slug)
      if (draft === null) return null
      return {
        result: draft.result,
        stamp: draft.stamp,
        asset: (name) => this.store.readAsset(slug, name),
      }
    }

    const snapshot = await this.store.readRevision(slug, id)
    if (snapshot === null) return null
    const assets = new Map(snapshot.assets.map((a) => [a.name, a.bytes]))
    return {
      result: assembleSite({
        slug,
        // Descriptive only — nothing at request time reads it, and a revision
        // has no directory on any adapter.
        sourceDir: `revision:${slug}/${id}`,
        base: snapshot.siteJson ?? {},
        pages: snapshot.pages.map((stored) => stored.page),
        assetFiles: [...assets.keys()].sort(),
      }),
      // A revision cannot change, so its stamp is its id — which makes the
      // render cache permanent for it rather than merely warm.
      stamp: `revision:${id}`,
      asset: (name) => Promise.resolve(assets.get(name) ?? null),
    }
  }

  private async render(
    slug: string,
    channel: PreviewChannel,
    snapshot: PreviewSource,
  ): Promise<RenderedSite> {
    const key = `${slug}\0${channel}`
    const hit = this.cache.get(key)
    if (hit && hit.stamp === snapshot.stamp) return hit.rendered
    if (!snapshot.result.ok) throw new InvalidDefinitionError(slug, snapshot.result.errors)
    const rendered = await renderSiteFiles(snapshot.result.value, {
      edit: channel === 'edit',
    })
    this.cache.set(key, { stamp: snapshot.stamp, rendered })
    return rendered
  }
}

/** A definition to render, its cache stamp, and its own asset lookup. */
interface PreviewSource {
  result: LoadResult
  stamp: string
  asset(name: string): Promise<Uint8Array | null>
}

/**
 * REQ-154 — the preview channels as an {@link OriginResolver}, so a browser can
 * be handed our own output instead of fetching it.
 *
 * THE PROBLEM. The builder is served from a host Cloudflare Access guards
 * ([[REQ-147]]). A browser the Worker launches is a new, unauthenticated client:
 * it is challenged, and it faithfully screenshots the challenge page. Nothing
 * errors — the picture is simply wrong, which is the worst shape a failure can
 * take for a tool whose entire job is to be believed.
 *
 * WHY THIS AND NOT A CREDENTIAL. A service token would work, and would put a
 * long-lived Access credential in the Worker for the sole purpose of letting it
 * talk to itself — a secret to rotate, leak and revoke, standing in for a
 * round-trip that did not need to happen. Fulfilling the request in-process
 * removes the trip and the credential together. An Access *bypass* on an
 * internal path was the third candidate and is a hole in the exact wall REQ-147
 * built. See [[DOC-13]] §6.1 for the full record.
 *
 * WHY NOT `setContent()` / a `data:` URL. Because the page would have no real
 * origin: relative `/assets/` references would not resolve, which is precisely
 * the blank-screenshot bug DOC-13 §6 records. Here the browser still navigates
 * a real absolute URL with a real `baseURI`; only the transport is short-circuited.
 *
 * SCOPE. This resolver owns `/preview/<slug>/<draft|edit>/…` and nothing else on
 * its host — every other path resolves to `null`, which the driver answers 404,
 * so no request from that browser can reach the gated origin by any route. A
 * `published` shot is not served here on purpose: published bytes live on
 * public-site's own host, which no Access policy covers, so the browser simply
 * fetches them.
 */
export function previewOriginResolver(renderer: PreviewRenderer, host: string): OriginResolver {
  return {
    host,
    async file(pathname: string): Promise<OriginFile | null> {
      const match = /^\/preview\/([^/]+)\/([^/]+)(\/.*)?$/.exec(pathname)
      if (!match) return null
      const slug = decodeURIComponent(match[1])
      const channel = decodeURIComponent(match[2])
      // `rev-<id>` joins the two draft-side channels here (REQ-157). It is
      // served the same way and for the same reason: a revision rendered in
      // process cannot be answered by an Access challenge, and shooting one
      // against a public URL would only work after it had been published live.
      if (channel !== 'draft' && channel !== 'edit' && revisionIdOf(channel) === null) return null
      const file = await renderer.file(slug, channel as PreviewChannel, match[3] ?? '/')
      if (file === null) return null
      return { status: 200, contentType: file.contentType, body: file.body }
    },
  }
}

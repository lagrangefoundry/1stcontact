import { renderSiteFiles, type RenderedSite, type RenderSiteOptions } from '../render/render'
import type { DraftSnapshot, SiteStore } from '../store/site-store'
import { MIME } from '../store/content-type'
import { InvalidDefinitionError } from './errors'

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

/** The channels rendered on request. `published` is a build artifact and is not one. */
export type PreviewChannel = 'draft' | 'edit'

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
   * `renderOpts` carries what a behavior-module page needs and a pure-L1 page does
   * not: an Astro container and a module resolver (REQ-145). Both are INJECTED
   * rather than imported, because naming either from a module a Worker bundles
   * pulls Astro and the `.astro` registry into that bundle — a bundler resolves
   * a static specifier whether or not the branch ever runs.
   *
   * A Node caller passes them (`render/write.ts` exports both). The Worker
   * passes neither and renders L1, which is every site here but one; a page that
   * mounts a behavior then fails with a message naming REQ-148 rather than
   * rendering half of itself.
   */
  constructor(
    private readonly store: SiteStore,
    private readonly renderOpts: Pick<RenderSiteOptions, 'createContainer' | 'resolveModule'> = {},
  ) {}

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
    const snapshot = await this.store.loadDraft(slug)
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
      const body = await this.store.readAsset(slug, name.slice('assets/'.length))
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

  private async render(
    slug: string,
    channel: PreviewChannel,
    snapshot: DraftSnapshot,
  ): Promise<RenderedSite> {
    const key = `${slug}\0${channel}`
    const hit = this.cache.get(key)
    if (hit && hit.stamp === snapshot.stamp) return hit.rendered
    if (!snapshot.result.ok) throw new InvalidDefinitionError(slug, snapshot.result.errors)
    const rendered = await renderSiteFiles(snapshot.result.value, {
      ...this.renderOpts,
      edit: channel === 'edit',
    })
    this.cache.set(key, { stamp: snapshot.stamp, rendered })
    return rendered
  }
}

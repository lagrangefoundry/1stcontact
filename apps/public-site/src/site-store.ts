import type { Channel } from './routes'

/**
 * The seam between "which bytes does this URL name" and "where do those bytes
 * live" (REQ-111).
 *
 * Phase 1 answers from the per-site deploy manifest in R2. Phase 2 answers from
 * D1 (`sites` / `revisions` / `pages` — REQ-7) by replacing the implementation
 * and nothing else: no other part of the Worker knows where the truth lives.
 */
export interface SiteStore {
  /**
   * The R2 key prefix a snapshot's rendered output lives under, or `null` when
   * the site, the channel, or the named snapshot does not exist.
   *
   * `ref` is the snapshot id for `draft`; ignored for `published`, which always
   * resolves whatever the manifest currently calls live.
   */
  resolve(slug: string, channel: Channel, ref?: string): Promise<string | null>
  /** The revision id currently served as the site's published output, or `null`. */
  live(slug: string): Promise<number | null>
}

/** A published revision as recorded in the deploy manifest. */
interface ManifestRevision {
  id: number
  sha: string
}

/** A shareable draft snapshot, addressed by its content id. */
interface ManifestPreview {
  sha: string
}

interface SiteManifest {
  slug: string
  live: number | null
  revisions: ManifestRevision[]
  previews: ManifestPreview[]
}

/** The manifest object key for `slug`. Mirrors `tools/generate/src/deploy/manifest.ts`. */
export function manifestKey(slug: string): string {
  return `sites/${slug}/manifest.json`
}

/** Zero-pad a revision id to its canonical 4-digit prefix (`1` → `0001`). */
export function padRevision(id: number): string {
  return String(id).padStart(4, '0')
}

/** The R2 subset this store needs — narrow enough to fake in a UAT. */
export interface SiteBucket {
  get(key: string): Promise<{ text(): Promise<string> } | null>
}

/**
 * {@link SiteStore} backed by `sites/<slug>/manifest.json` in R2.
 *
 * The manifest — not the bucket's key space — is the index of what is servable.
 * A snapshot whose upload was interrupted, or one `1c deploy --prune` has
 * unlinked but not yet swept, is therefore unreachable rather than quietly
 * still live.
 *
 * That also fixes where untrusted input stops: **no URL component ever reaches
 * an R2 key unless the manifest vouched for it.** A draft id from the path is
 * looked *up* in `previews` and the prefix is then built from the manifest's own
 * value; the published prefix is built from `manifest.live`, which the URL
 * cannot influence at all.
 *
 * One instance per request: the manifest is memoised for the life of the
 * instance, which collapses a request's several reads into one and keeps a
 * single response internally consistent, without ever serving a stale manifest
 * to the next request.
 */
export class R2SiteStore implements SiteStore {
  private readonly cache = new Map<string, Promise<SiteManifest | null>>()

  constructor(private readonly bucket: SiteBucket) {}

  async resolve(slug: string, channel: Channel, ref?: string): Promise<string | null> {
    const manifest = await this.manifest(slug)
    if (manifest === null) return null

    if (channel === 'draft') {
      if (ref === undefined) return null
      const preview = manifest.previews.find((p) => p.sha === ref)
      if (preview === undefined) return null
      return `sites/${slug}/preview/${preview.sha}/out`
    }

    if (manifest.live === null) return null
    return `sites/${slug}/rev/${padRevision(manifest.live)}/out`
  }

  async live(slug: string): Promise<number | null> {
    const manifest = await this.manifest(slug)
    return manifest?.live ?? null
  }

  private manifest(slug: string): Promise<SiteManifest | null> {
    const cached = this.cache.get(slug)
    if (cached) return cached
    const pending = this.read(slug)
    this.cache.set(slug, pending)
    return pending
  }

  private async read(slug: string): Promise<SiteManifest | null> {
    const object = await this.bucket.get(manifestKey(slug))
    if (object === null) return null
    let parsed: Partial<SiteManifest>
    try {
      parsed = JSON.parse(await object.text()) as Partial<SiteManifest>
    } catch {
      // A corrupt manifest is indistinguishable from an absent one to a visitor,
      // and pretending otherwise would only give a stack trace to a stranger.
      return null
    }
    return {
      slug: parsed.slug ?? slug,
      live: parsed.live ?? null,
      revisions: parsed.revisions ?? [],
      previews: parsed.previews ?? [],
    }
  }
}

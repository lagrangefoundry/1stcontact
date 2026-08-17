import type { SiteStore, StoredAsset, StoredPage } from '../store/site-store'

/**
 * Copying a local site up to the cloud store (REQ-145).
 *
 * WHY IT GOES OVER HTTP AND NOT STRAIGHT INTO D1. The store's D1/R2 adapter
 * takes workerd *bindings* — a `D1Database` and an `R2Bucket` — and Node has
 * neither. The alternatives were to drive `wrangler d1 execute` and `wrangler r2
 * object put` from a shell script, which means hand-escaping SQL around
 * arbitrary site JSON, or to re-implement the store against Cloudflare's HTTP
 * API, which is a third adapter to keep in step with two.
 *
 * Instead the WORKER writes, through the very bindings and the very store it
 * serves from, and this side only reads and posts. So an import lands by exactly
 * the code path an edit lands by; there is no second writer that could disagree
 * about what a site is made of, and the same command works against `wrangler
 * dev`'s local D1 and against production by changing one URL.
 *
 * IT IS NOT `1c publish`. That mints a revision from a draft and is a different
 * operation entirely (and, in the cloud, is REQ-149). This copies a draft from
 * one store to another — the local half of `importSite`, which is already
 * port-to-port and is what runs on the far side.
 */

/** One site's whole draft, as it crosses the wire. */
export interface SitePayload {
  slug: string
  /** `site.json`, or null when the site holds none. */
  siteJson: Record<string, unknown> | null
  pages: { name: string; page: Record<string, unknown> }[]
  /** Asset bytes, base64 — JSON has no byte type and an asset is usually an image. */
  assets: { name: string; base64: string }[]
}

export interface PushResult {
  slug: string
  pages: string[]
  assets: string[]
  /** What the far side reported writing, so a mismatch is visible here. */
  landed: { pages: number; assets: number; siteJson: boolean }
}

function toBase64(bytes: Uint8Array): string {
  let binary = ''
  // Chunked: `String.fromCharCode(...bytes)` blows the argument limit on a file
  // of any size, and an asset is a file of some size.
  const CHUNK = 0x8000
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK))
  }
  return btoa(binary)
}

export function fromBase64(text: string): Uint8Array {
  const binary = atob(text)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i)
  return bytes
}

/** Read one site's whole draft out of `store`. */
export async function readSitePayload(store: SiteStore, slug: string): Promise<SitePayload> {
  if (!(await store.hasDraft(slug))) {
    throw new Error(`No draft for '${slug}' in the local store.`)
  }
  const pages: StoredPage[] = await store.readPages(slug)
  const names = await store.listAssets(slug)
  const assets: { name: string; base64: string }[] = []
  for (const name of names) {
    const bytes = await store.readAsset(slug, name)
    // A name the listing produced but the store cannot read is a corrupt store,
    // not an empty asset — importing it as zero bytes would land a broken image
    // that looks deliberate.
    if (bytes === null) throw new Error(`Asset '${name}' is listed for '${slug}' but unreadable.`)
    assets.push({ name, base64: toBase64(bytes) })
  }
  return {
    slug,
    siteJson: await store.readSiteJson(slug),
    pages: pages.map((p) => ({ name: p.name, page: p.page })),
    assets,
  }
}

/** Turn a received payload back into the one {@link SiteWrite} the store takes. */
export function payloadToWrite(payload: SitePayload): {
  siteJson?: Record<string, unknown>
  pages: StoredPage[]
  assets: StoredAsset[]
} {
  const write: { siteJson?: Record<string, unknown>; pages: StoredPage[]; assets: StoredAsset[] } = {
    pages: payload.pages.map((p) => ({ name: p.name, page: p.page })),
    assets: payload.assets.map((a) => ({ name: a.name, bytes: fromBase64(a.base64) })),
  }
  if (payload.siteJson !== null) write.siteJson = payload.siteJson
  return write
}

export interface PushOptions {
  /** Where the builder Worker is, e.g. `http://localhost:8788`. */
  origin: string
  /** An `cf-access-jwt-assertion` value, for a deployment behind Access. */
  accessToken?: string
  fetch?: typeof fetch
}

/** Read `slug` from `store` and post it to `origin`'s import route. */
export async function pushSite(
  store: SiteStore,
  slug: string,
  opts: PushOptions,
): Promise<PushResult> {
  const payload = await readSitePayload(store, slug)
  const doFetch = opts.fetch ?? globalThis.fetch
  const headers: Record<string, string> = { 'content-type': 'application/json' }
  if (opts.accessToken) headers['cf-access-jwt-assertion'] = opts.accessToken

  const res = await doFetch(new URL('/api/import', opts.origin).toString(), {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  })
  const body = (await res.text()).trim()
  if (!res.ok) {
    throw new Error(
      `Import of '${slug}' was refused with ${res.status}: ${body || '(no body)'}\n` +
        (res.status === 401 || res.status === 403
          ? 'The target is behind Cloudflare Access — pass --token with a service-token JWT.'
          : ''),
    )
  }
  const landed = JSON.parse(body) as PushResult['landed']
  return {
    slug,
    pages: payload.pages.map((p) => p.name),
    assets: payload.assets.map((a) => a.name),
    landed,
  }
}

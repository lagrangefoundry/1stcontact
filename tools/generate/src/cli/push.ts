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

/**
 * A Cloudflare Access service token, as Access itself issues it.
 *
 * THE PAIR IS THE CREDENTIAL, and that is not an implementation detail worth
 * hiding. This used to send a `cf-access-jwt-assertion` header, which could
 * never have worked against a deployed target: that is the header Access SETS
 * on the request it forwards to the origin, carrying the identity it has
 * already verified. It is not an inbound credential, and a request arriving
 * with one is refused at the edge exactly like a request arriving with none.
 *
 * What the edge does accept from automation is this pair, which it exchanges
 * for the JWT it then forwards. So the client's job is to present id and
 * secret; the assertion header is the far side's business and is never written
 * here.
 */
export interface AccessServiceToken {
  /** `CF-Access-Client-Id` — the public half, ends in `.access`. */
  clientId: string
  /** `CF-Access-Client-Secret` — a real credential. Never logged. */
  clientSecret: string
}

export interface PushOptions {
  /** Where the builder Worker is, e.g. `http://localhost:8788`. */
  origin: string
  /** Service-token credentials, for a deployment behind Access. */
  access?: AccessServiceToken
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
  if (opts.access) {
    headers['CF-Access-Client-Id'] = opts.access.clientId
    headers['CF-Access-Client-Secret'] = opts.access.clientSecret
  }

  const res = await doFetch(new URL('/api/import', opts.origin).toString(), {
    method: 'POST',
    headers,
    // `manual`, and this is the difference between a legible failure and a
    // baffling one. Access answers an unauthenticated request with a 302 to its
    // login page. Followed, that redirect returns 200 with an HTML document —
    // so `res.ok` is TRUE, the refusal branch below never runs, and the operator
    // sees `JSON.parse` choke on `<!DOCTYPE html>`. Left unfollowed the 302
    // arrives as itself and can be reported as what it is.
    redirect: 'manual',
    body: JSON.stringify(payload),
  })
  const body = (await res.text()).trim()
  if (!res.ok) {
    // ANY redirect belongs with 401/403: it is Access declining, in a redirect's
    // clothing. Status 0 is here too — that is what an unfollowed redirect reads
    // as under a `fetch` that returns an opaque response for one, so the two
    // shapes of "we were bounced to a login page" report identically.
    const bounced = res.status === 0 || (res.status >= 300 && res.status < 400)
    const refusedByAccess = bounced || res.status === 401 || res.status === 403
    throw new Error(
      `Import of '${slug}' was refused with ` +
        `${bounced ? `${res.status || 'a redirect'} to a login page` : res.status}: ` +
        `${body || '(no body)'}\n` +
        (refusedByAccess
          ? 'The target is behind Cloudflare Access. Set CF_ACCESS_CLIENT_ID and ' +
            'CF_ACCESS_CLIENT_SECRET to a service token, or pass --client-id and ' +
            '--client-secret. Run bin/access-token to provision one.'
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

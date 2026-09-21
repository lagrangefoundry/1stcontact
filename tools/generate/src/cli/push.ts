import { assertNotCaptureMirrored } from '../store/asset-rights'
import type { ReferenceStore } from '../store/reference-store'
import type { SiteStore, StoredAsset, StoredPage } from '../store/site-store'

/**
 * The site-payload transport: one site's draft, read out of a store and posted
 * into another store's import route (REQ-145).
 *
 * THIS IS A TRANSPORT, NOT A COMMAND (REQ-290). It began as the local half of a
 * CLI verb that read the git-tracked authoring tier and posted it up; REQ-290
 * retired both the verb and the tier. Nothing here
 * went with it, because nothing here was ever about that tier: every function
 * below takes a {@link SiteStore} port and cannot tell which implementation it
 * was handed. What survives is the wire shape (`SitePayload`), the two ends
 * that convert to and from it, and the refusals — and REQ-289's copy pair,
 * along with the Worker's own `/api/import` and `/api/export`, are built on
 * exactly those.
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
  /**
   * What the site is called in the store it came from — whatever that store's
   * own naming is.
   *
   * IT NAMES THE SOURCE AND ADDRESSES NOTHING ([[REQ-236]]). It used to be the
   * far side's target too, because the cloud store addressed a site by a slug.
   * It cannot be: a D1 site is named by a key the store mints, and this side has
   * never seen one. So `/api/import` resolves its own target — the receiving
   * business's site, created when it holds none — and what this field is still
   * for is the sentence a refusal has to say back to the operator, which has to
   * name the site they typed rather than one they have never seen.
   *
   * AND ON AN EXPORT IT IS THE STORE'S OWN KEY ([[REQ-289]]). `GET /api/export`
   * answers with this same payload, so it has to put something here; what it
   * puts is what the site is called where it was read, which in D1 is a minted
   * key. That is the same statement this field has always made, in the
   * vocabulary of whichever side produced it — and it still addresses nothing
   * on the side it is going to.
   */
  slug: string
  /** `site.json`, or null when the site holds none. */
  siteJson: Record<string, unknown> | null
  pages: { name: string; page: Record<string, unknown> }[]
  /** Asset bytes, base64 — JSON has no byte type and an asset is usually an image. */
  assets: { name: string; base64: string }[]
  /**
   * Replace the target even when it holds changes made in the builder (BUG-51).
   *
   * ABSENT MEANS NO, and the refusal it unlocks is the whole point. An import
   * replaces `site.json` and every page it carries, so pushing a freshly
   * scaffolded site over one somebody built in the builder destroys the built
   * one — which is exactly how BUG-51's demo site was lost, to a push script
   * whose own documentation called re-running it "the ordinary way to use it".
   * The far side refuses that case now; this is how a caller says it meant it.
   *
   * IT TRAVELS IN THE PAYLOAD rather than as a query parameter or a header,
   * because it is part of what the caller is asking for, not part of how the
   * request is addressed or authenticated. One body carries the whole request.
   */
  force?: boolean
}

export interface PushResult {
  slug: string
  pages: string[]
  assets: string[]
  /**
   * What the far side reported writing, so a mismatch is visible here.
   *
   * `site` IS THE DESTINATION'S OWN NAME FOR WHAT LANDED ([[REQ-236]]) — the key
   * its store minted, which is also the site's public address. It is reported
   * rather than inferred because this side cannot compute it: the payload's
   * `slug` names a local directory and the two vocabularies no longer meet.
   */
  landed: { site?: string; pages: number; assets: number; siteJson: boolean }
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

/**
 * Read one site's whole draft out of `store` — nothing refused, nothing gated.
 *
 * THE READ AND THE RIGHTS GATE ARE SEPARATE FUNCTIONS ([[REQ-289]]), because
 * there are now two readers and only one of them is a writer's first step.
 * `/api/export` reads a store the caller already owns and hands the bytes back
 * to the caller they came from, which publishes nothing and has nothing to
 * gate; {@link readSitePayload} below reads in order to POST somewhere else,
 * which is the act BUG-84's gate exists to refuse. One reader means the export
 * payload and the import payload cannot drift apart — they are the same
 * {@link SitePayload}, produced by the same lines.
 *
 * THE RAW BYTES COME BACK BESIDE THE BASE64 so the gate above can read them
 * without decoding what this function just encoded — a second pass over the
 * largest thing in the payload to learn something that was in hand a line
 * earlier.
 *
 * `site` IS WHATEVER THE STORE CALLS THE SITE — a directory name in the
 * file-backed tier, a minted key in D1. The port says so and this function does
 * not look.
 */
export async function readSiteDraft(
  store: SiteStore,
  site: string,
): Promise<{ payload: SitePayload; raw: { name: string; bytes: Uint8Array }[] }> {
  if (!(await store.hasDraft(site))) {
    throw new Error(`No draft for '${site}' in the local store.`)
  }
  const pages: StoredPage[] = await store.readPages(site)
  const names = await store.listAssets(site)
  const assets: { name: string; base64: string }[] = []
  const raw: { name: string; bytes: Uint8Array }[] = []
  for (const name of names) {
    const bytes = await store.readAsset(site, name)
    // A name the listing produced but the store cannot read is a corrupt store,
    // not an empty asset — importing it as zero bytes would land a broken image
    // that looks deliberate.
    if (bytes === null) throw new Error(`Asset '${name}' is listed for '${site}' but unreadable.`)
    raw.push({ name, bytes })
    assets.push({ name, base64: toBase64(bytes) })
  }
  return {
    payload: {
      slug: site,
      siteJson: await store.readSiteJson(site),
      pages: pages.map((p) => ({ name: p.name, page: p.page })),
      assets,
    },
    raw,
  }
}

/**
 * Read one site's whole draft out of `store` — and refuse one it may not send.
 *
 * THE RIGHTS GATE LIVES HERE RATHER THAN IN {@link pushSite} (BUG-84) because
 * this is where the raw bytes are, and it lives here rather than in
 * {@link readSiteDraft} because reading is not sending ([[REQ-289]]).
 *
 * WHAT IT REFUSES: an asset whose bytes are byte-for-byte a subresource we
 * mirrored from a captured page. `1c repro` copies a bundle's mirrored
 * subresources into `storage/sandbox/<slug>/draft/assets/` so the reproduction
 * renders from its own media, and everything in that directory is a site asset
 * to this function — which is how a third party's photograph reached a client
 * site with no rights record and no gate. See `asset-rights.ts`.
 */
export async function readSitePayload(
  store: SiteStore,
  references: ReferenceStore,
  slug: string,
): Promise<SitePayload> {
  const { payload, raw } = await readSiteDraft(store, slug)
  // BEFORE THE PAYLOAD IS HANDED BACK, so a refused draft is never posted and no
  // partial state is reachable. The far side enforces the same rule against the
  // TENANT's bundles; this side is the only one that sees a capture taken on
  // this laptop, which is the case that actually happened.
  await assertNotCaptureMirrored(raw, references)
  return payload
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

/**
 * Which MACHINE a request is addressed to — not which role it plays in a
 * transfer ([[BUG-134]]).
 *
 * `source`/`destination` SWAP WITH DIRECTION AND THESE DO NOT. A copy reads one
 * end and writes the other, and which of them is the laptop depends on which
 * way the bytes are going; but an operator does not configure a role, they
 * configure a machine. So the credential an end wants is named for the end, and
 * a refusal that said "the source end" would make the reader work out which
 * machine that was this time.
 */
export type AccessEnd = 'local' | 'cloud'

/** Every name one end's credential goes by, in the one place they are written. */
export interface AccessNaming {
  /** How the end reads inside a sentence. */
  subject: string
  envId: string
  envSecret: string
  flagId: string
  flagSecret: string
  /** Where a pair THIS end accepts comes from. */
  provision: string
}

/**
 * The two ends' credentials, as one table rather than five string literals.
 *
 * WHY A TABLE. These names appear in `serviceToken`'s refusal, in `getJson`'s,
 * in {@link postSitePayload}'s, in the two `bin/copy-*` help texts and in `1c`
 * help — and [[BUG-134]] is what one of those naming the wrong credential
 * costs. The operator was told to set the pair that was already correct, for
 * the end that was not refusing, and following that advice made it worse. Six
 * copies of a name is six chances for that; one table is none.
 *
 * THE CLOUD ROW IS UNCHANGED, deliberately. `CF_ACCESS_CLIENT_ID` /
 * `CF_ACCESS_CLIENT_SECRET` are the real Cloudflare credential and mean exactly
 * what they always did; the fix adds a second row, it does not rename the first.
 */
export const ACCESS_NAMING: Record<AccessEnd, AccessNaming> = {
  cloud: {
    subject: 'The CLOUD end',
    envId: 'CF_ACCESS_CLIENT_ID',
    envSecret: 'CF_ACCESS_CLIENT_SECRET',
    flagId: '--client-id',
    flagSecret: '--client-secret',
    provision: 'Run bin/access-token to provision one.',
  },
  local: {
    subject: 'The LOCAL end',
    envId: 'LOCAL_ACCESS_CLIENT_ID',
    envSecret: 'LOCAL_ACCESS_CLIENT_SECRET',
    flagId: '--local-client-id',
    flagSecret: '--local-client-secret',
    // THE SIMULATOR PRINTS THE CLOUD NAMES (`bin/access-sim --print-token`
    // emits `CF_ACCESS_CLIENT_*`), so this sentence says which pair to put its
    // values in. Left at "run --print-token", an `eval` of that output would
    // set the OTHER end's credential to the simulator's — which is BUG-134
    // wearing the opposite jacket.
    provision:
      'Run ./bin/access-sim --print-token and put its two values in ' +
      'LOCAL_ACCESS_CLIENT_ID / LOCAL_ACCESS_CLIENT_SECRET — it prints them under ' +
      'the CLOUD names, which are the other end.',
  },
}

/**
 * The one sentence that tells an operator which credential a refusing end wants.
 *
 * IT NAMES THE END FIRST. A copy has two of them and the operator has two
 * pairs; the sentence that named neither is what turned [[BUG-134]]'s one-line
 * fix into a diagnosis.
 */
export function accessAdvice(end: AccessEnd): string {
  const n = ACCESS_NAMING[end]
  return (
    `${n.subject} is behind Cloudflare Access. Set ${n.envId} and ${n.envSecret} ` +
    `to a service token, or pass ${n.flagId} and ${n.flagSecret}. ${n.provision}`
  )
}

export interface PushOptions {
  /** Where the builder Worker is, e.g. `http://localhost:8788`. */
  origin: string
  /**
   * The operator's capture bundles — the evidence this side's rights gate reads
   * (BUG-84).
   *
   * REQUIRED, NOT OPTIONAL, AND THAT IS THE POINT. An optional store is a gate a
   * caller can forget, and a forgotten gate looks exactly like a clean push. A
   * caller with no bundles passes a store that lists none, which costs one empty
   * listing and says so out loud.
   *
   * IT IS THE OPERATOR'S OWN TREE AND NOT THE TENANT'S. The far side checks the
   * tenant's cloud bundles and this side checks the laptop's, because a capture
   * taken by `1c capture` never reaches R2 and a bundle captured in the cloud
   * never reaches this disk. Neither half sees the other's evidence, which is
   * why both halves exist.
   */
  references: ReferenceStore
  /** Service-token credentials, for a deployment behind Access. */
  access?: AccessServiceToken
  /** Overwrite a target that holds builder changes. See {@link SitePayload.force}. */
  force?: boolean
  fetch?: typeof fetch
}

/**
 * POST one payload at an import route, and report its refusals as refusals.
 *
 * LIFTED OUT OF {@link pushSite} ([[REQ-289]]) because there are two callers:
 * {@link pushSite}, which reads a store directly and posts, and
 * `1c copy-to-cloud` / `1c copy-from-cloud`, which read one builder's
 * `/api/export` and post to another builder's `/api/import`. The refusals that
 * matter — Access bouncing an unauthenticated request to a login page, and
 * BUG-51's 409 over builder-authored changes — must read identically whichever
 * command met them, and the way to guarantee that is one function.
 *
 * `url` AND NOT AN ORIGIN, because the copy commands address the destination
 * business explicitly with `/b/<businessId>/api/import`. An origin plus an
 * assumed path would put that prefix somewhere else.
 *
 * `subject` IS WHAT THE CALLER NAMED. {@link pushSite} is given a site name in
 * its store's own terms and says that back; a copy was given a business name and
 * says that. A shared function that named one of them for both would report a
 * site key the operator has never seen.
 *
 * `end` IS WHICH MACHINE `url` ADDRESSES, AND IT IS A PARAMETER ([[BUG-134]]).
 * This function's Access advice used to name `CF_ACCESS_CLIENT_*`
 * unconditionally, which is right for a push to the cloud and wrong for
 * `copy-from-cloud`, whose destination is the laptop. The text could not be
 * fixed in place because both callers share it, so the end has to reach the
 * sentence instead of being assumed by it.
 */
export async function postSitePayload(
  payload: SitePayload,
  opts: {
    url: string
    subject: string
    end: AccessEnd
    access?: AccessServiceToken
    fetch?: typeof fetch
  },
): Promise<PushResult['landed']> {
  return postPayload<PushResult['landed']>(payload, opts)
}

/**
 * The same POST, over any payload an import route takes ([[REQ-294]]).
 *
 * THE SITE PAYLOAD WAS NEVER WHAT THIS FUNCTION WAS ABOUT. Every line of it is
 * about the WIRE — the headers, the unfollowed redirect, and the three refusals
 * that have to read identically whichever command met them. `--chats` posts a
 * conversation history at `/api/chats/import` and owes the operator exactly the
 * same three sentences, so it gets the same function rather than a second copy
 * of it that could drift on any one of them.
 *
 * {@link postSitePayload} REMAINS, AS ITS SITE-TYPED FACE. The site pair's own
 * callers say what they mean by naming it, and the type they get back is the
 * import's landed report rather than `unknown`.
 */
export async function postPayload<T>(
  payload: unknown,
  opts: {
    url: string
    subject: string
    end: AccessEnd
    access?: AccessServiceToken
    fetch?: typeof fetch
  },
): Promise<T> {
  const doFetch = opts.fetch ?? globalThis.fetch
  const headers: Record<string, string> = { 'content-type': 'application/json' }
  if (opts.access) {
    headers['CF-Access-Client-Id'] = opts.access.clientId
    headers['CF-Access-Client-Secret'] = opts.access.clientSecret
  }

  const res = await doFetch(opts.url, {
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
    // 409 IS NOT AN ERROR TO DIAGNOSE, it is a question to answer (BUG-51). The
    // far side has already said what it is protecting and how much of it there
    // is; all this side owes is the flag that says yes. Lumping it in with the
    // Access advice above would answer a question the operator did not ask and
    // leave the one they did unanswered.
    const conflicted = res.status === 409
    throw new Error(
      `${opts.subject} was refused with ` +
        `${bounced ? `${res.status || 'a redirect'} to a login page` : res.status}: ` +
        `${body || '(no body)'}\n` +
        (conflicted
          ? 'Pass --force to replace it anyway. Nothing was written.'
          : refusedByAccess
            ? accessAdvice(opts.end)
            : ''),
    )
  }
  return JSON.parse(body) as T
}

/** Read `slug` from `store` and post it to `origin`'s import route. */
export async function pushSite(
  store: SiteStore,
  slug: string,
  opts: PushOptions,
): Promise<PushResult> {
  const payload = await readSitePayload(store, opts.references, slug)
  // Set only when asked, so an ordinary push sends a body with no `force` key at
  // all rather than one that says `false`. The wire then shows what was meant.
  if (opts.force === true) payload.force = true
  const landed = await postSitePayload(payload, {
    url: new URL('/api/import', opts.origin).toString(),
    subject: `Import of '${slug}'`,
    // THIS TRANSPORT HAS ONE END AND IT IS THE CLOUD. `--origin` can aim it at
    // a local Worker, but the credential it reads is `CF_ACCESS_CLIENT_*` and
    // the advice it owes on a refusal is the cloud row. The copy pair is the
    // caller with two ends; this one names its single end and moves on.
    end: 'cloud',
    ...(opts.access ? { access: opts.access } : {}),
    ...(opts.fetch ? { fetch: opts.fetch } : {}),
  })
  return {
    slug,
    pages: payload.pages.map((p) => p.name),
    assets: payload.assets.map((a) => a.name),
    landed,
  }
}

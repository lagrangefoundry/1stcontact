import {
  editAssetList,
  editCopyGet,
  editCopySet,
  editPaletteAdd,
  editPaletteGet,
  editPaletteRename,
  editPaletteRm,
  editPaletteSet,
} from '../../../tools/generate/src/cli/edit'
import { CommandError, InvalidDefinitionError } from '../../../tools/generate/src/cli/errors'
import { PreviewRenderer, type PreviewChannel } from '../../../tools/generate/src/cli/preview'
import { payloadToWrite, type SitePayload } from '../../../tools/generate/src/cli/push'
import { publishSite, revisionHistory } from '../../../tools/generate/src/publish/publish'
import { liveRevisionOf } from '../../../tools/generate/src/store/revision-model'
import { SlugClaimedError } from '../../../tools/generate/src/store/d1r2-store'
import { publicSiteUrl } from './public-url'
import { UnknownTenantError } from '../../../tools/generate/src/store/d1r2-store'
import type { TenantSiteStore } from '../../../tools/generate/src/store/d1r2-store'
import {
  openSession,
  streamPrompt,
  tailSession,
  UnknownSessionError,
} from '../../../tools/generate/src/cli/ai/host-core'
import { sessionTextDescriber, workerHost, type WorkerHost } from './ai'
import { chromeHtml } from './chrome'
import { redactor } from './redact'
import { storeFor, TenantNotConfiguredError, type StoreEnv } from './store'
import { splitBusinessPrefix, type Scope } from './scope'
import { ticketStoreFor, type TicketStore, type TicketStoreEnv } from './tickets'
import { projectKnowledgeFor } from './knowledge'
import { systemKnowledge } from './system-knowledge'
import { sessionKnowledgeFor } from './session-knowledge'
import { anthropicImageDescriber, type DescribeImage, type DescribeText } from './describe'
import { FetchRefusedError } from './fetch-guard'
import {
  ingestFetch,
  ingestUpload,
  listMaterial,
  materialFile,
  MaterialRejectedError,
  NotMaterialError,
  NotRepublishableError,
  promoteToSiteAsset,
  readMaterial,
  reviseDescription,
  type IndexMaterial,
  type MaterialRole,
} from './material'

/**
 * The builder's route table, in workerd (REQ-145 phases 2 and 3).
 *
 * This is `handleBuilderRequest` — the same routes, over the same functions,
 * against the same {@link SiteStore} port. What changed is the transport
 * (`Request`/`Response` rather than `node:http`) and the adapter underneath the
 * port (D1 + R2 rather than the filesystem). Nothing here reimplements an edit:
 * every write goes through the `edit*` functions the `1c` CLI dispatches to, so
 * the builder remains a second *producer* of structured edits and never a second
 * write path. Validation, atomicity and the journal all stay where they live.
 *
 * THREE ROUTES ARE GONE, not moved. `/builder/*`, `/webui/*` and `/framework/*.js`
 * are build artifacts now (`1c assets`), served by the assets binding. Nothing
 * below type-strips, transpiles or resolves a package at request time.
 *
 * They are reached by FALLING THROUGH to `env.ASSETS`, at the end, rather than by
 * letting the assets binding answer ahead of the Worker. That ordering is a
 * security control (`wrangler.toml`): the Access gate lives in `fetch`, so bytes
 * served before `fetch` are bytes served to anyone. Falling through here means
 * an asset is delivered only to a caller the gate has already verified.
 *
 * PUBLISH ANSWERS FOR REAL NOW ([[REQ-149]]). It was the last 501: the port had
 * no notion of a revision, so the capability genuinely did not exist here. The
 * port has five revision verbs and `publish.ts` sequences them, so this route is
 * a transport over the same function `1c publish` calls — which is why the Node
 * transport no longer intercepts the path on its way past.
 *
 * `/api/ai/*` was the other such route, deferred to lagrange-framework REQ-103
 * because the library loaded itself from an out-of-repo artifact store by file
 * URL. REQ-103 landed the `/workers` packaging and [[REQ-146]] wired it in, so
 * those routes now answer for real.
 */

/** The channels a preview URL may name. `published` is served from R2 by public-site. */
const PREVIEW_CHANNELS: PreviewChannel[] = ['draft', 'edit']

/**
 * One {@link PreviewRenderer} per STORE, so the render cache survives across
 * requests. A cache entry can never go stale: the renderer re-checks the
 * definition's stamp before reading it, which is a store read either way — the
 * cache saves the *render*, not the lookup that proves it current.
 *
 * Keyed by the store OBJECT, not by its tenant id. The Worker has one store per
 * tenant per isolate, so the two are equivalent there — but the Node transport
 * opens a store per workspace, all of them the same notional tenant, and a
 * tenant-keyed cache handed the first workspace's renderer to every later one.
 * A `WeakMap` also lets a finished workspace's renderer be collected with it.
 */
const PREVIEWS = new WeakMap<TenantSiteStore, PreviewRenderer>()

/**
 * The chat host, ONE PER BUSINESS PER ISOLATE (REQ-146, scoped by [[REQ-168]]).
 *
 * Every other route builds its store per request, because `forTenant` performs
 * the tenant check and a cached handle would carry a check made against a row
 * that may since have been deactivated. The chat routes cannot do that: the AI
 * host keys its `SessionManager` cache by the store's OBJECT IDENTITY, so a new
 * store per request is a new manager per request — the conversation would reset
 * on every turn and the junction would be empty every time.
 *
 * IT WAS ONE PER ISOLATE, FULL STOP, AND THAT BECAME A LEAK. A single module
 * `let` held a site store, a ticket store and an opened project KB, all bound to
 * whichever tenant made the FIRST chat request in that isolate. With one
 * configured tenant that was harmless. With the scope coming from the caller's
 * identity it is a cross-business leak: a second caller sharing the isolate takes
 * their turn against the first caller's store, transcripts and KB vectors. Under
 * [[DOC-40]] §2 it does not even take two people — one operator switching between
 * two of their own businesses straddles the same isolate, so it is reachable in
 * ordinary single-user use.
 *
 * KEYED BY SCOPE, which keeps the property the paragraph above needs and
 * partitions it. Reuse stays per-isolate WITHIN a business and cannot cross one.
 * Nothing upstream changes: `host-core.ts` already keys its manager cache by the
 * store's object identity, so it partitions for free as soon as the store does.
 *
 * The map is not bounded, and does not need to be: isolates are short-lived and
 * it dies with them. What is given up is unchanged — re-checking a deactivation
 * mid-isolate, on these two routes only — and `resolveScope` now checks
 * `tenants.status` per request ahead of this, which is what makes that
 * acceptable rather than merely stated.
 */
const CHATS = new Map<string, Promise<WorkerHost>>()

function chatHost(env: RouterEnv, scope: Scope, deps: RouterDeps): Promise<WorkerHost> {
  let host = CHATS.get(scope.businessId)
  if (!host) {
    host = (async () => {
      const tenantId = scope.businessId
      const store = await (deps.store ?? storeFor)(env, scope)
      // THE TICKET STORE IS THE TRANSCRIPT'S HOME NOW ([[REQ-160]]), so it is
      // held for the isolate's life exactly as the site store above is, and for
      // the same reason: `TicketSessionArchive` caches the chat ticket's uid and
      // its transcript comment's uid per archive, and both lookups behind that
      // cache are full store scans (upstream BUG-29). A store per request would
      // be an archive per request, so every turn would pay the scan that only a
      // session's first turn should.
      const tickets = await (deps.tickets ?? ticketStoreFor)(env, scope)
      // Opened HERE and not inside `workerHost`, for the reason the store above
      // is: this is the one place per isolate where the expensive things are
      // built, and the KB is one of them — `KnowledgeRuntime.open` decodes the
      // whole bundled index into vectors. Doing it per request would decode it
      // per turn, for an artefact that cannot change while the isolate lives.
      //
      // TWO KNOWLEDGE BASES, ONE SESSION ([[REQ-160]]). `deps.knowledge` stays
      // exactly what it was — the SYSTEM half, injectable so a UAT can plant a
      // corpus whose content it chose — and `sessionKnowledgeFor` opens the
      // tenant's beside it. Composing here rather than widening that seam keeps
      // the injection point about the one KB a test has any business replacing:
      // the project corpus is the tenant's real D1 store either way.
      const system = await (deps.knowledge ?? systemKnowledge)(env)
      const knowledge = await sessionKnowledgeFor(env, scope, { system, tickets })
      return workerHost(env, store, tenantId, tickets, knowledge)
    })()
    // EVICTED IF IT FAILS TO BUILD. A rejected promise left in the map would
    // poison that business for the isolate's life: a missing binding repaired a
    // second later would keep answering with the first failure, and only for the
    // business unlucky enough to have asked first. The single `let` had the same
    // flaw and could hide it, because one failure looked like a dead isolate
    // rather than like one dead tenant.
    host.catch(() => CHATS.delete(scope.businessId))
    CHATS.set(scope.businessId, host)
  }
  return host
}

/** Drop every cached chat host. For tests that rebuild bindings per case. */
export function resetChatHost(): void {
  CHATS.clear()
}

/**
 * The renderer for a store, memoised per store (see {@link PREVIEWS}).
 *
 * EXPORTED for REQ-154. A screenshot of `/preview/<slug>/draft/` is fulfilled
 * from this renderer rather than fetched, so it must be the SAME renderer the
 * route uses — a second instance would render the draft a second time and could
 * answer from a different stamp than the one the operator is looking at.
 */
export function previewRenderer(store: TenantSiteStore): PreviewRenderer {
  let renderer = PREVIEWS.get(store)
  if (!renderer) {
    renderer = new PreviewRenderer(store)
    PREVIEWS.set(store, renderer)
  }
  return renderer
}

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  })
}

function text(status: number, body: string): Response {
  return new Response(body, {
    status,
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  })
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

async function readJsonBody(request: Request): Promise<Record<string, unknown>> {
  const body = await request.text()
  if (body.trim() === '') return {}
  return JSON.parse(body) as Record<string, unknown>
}

export interface RouterEnv extends StoreEnv, TicketStoreEnv {
  /** The build artifacts (`1c assets`), served only to an already-verified caller. */
  ASSETS: Fetcher
  /**
   * The Anthropic key, as a `wrangler secret` (REQ-146).
   *
   * A SECRET AND NOT A VAR: a var is readable in the dashboard and echoed by
   * `wrangler deploy`, and this one is a bearer credential for a paid API. It is
   * pushed by `bin/deploy.d/secrets/10-anthropic-api-key`, which carries the NAME
   * and never the value.
   *
   * Optional, and absent must stay an ordinary state rather than a boot failure:
   * a builder with no key still opens the conversation and still shows its
   * history, and says why it cannot take a turn.
   */
  ANTHROPIC_API_KEY?: string
  /**
   * Browser Rendering ([[REQ-154]]), for `shot.ts` — the assistant's eyes.
   *
   * OPTIONAL, and absent must stay an ordinary state rather than a boot failure,
   * for the same reason the key above is: a builder that cannot take a picture
   * still edits, renders and publishes, and should say what it cannot do rather
   * than refuse to start. `bindingLauncher` raises a named error naming the
   * missing binding.
   */
  BROWSER?: Fetcher
  /**
   * Workers AI ([[REQ-159]]) — the embedder behind the project knowledge base.
   *
   * On the router's env because [[REQ-163]]'s ingestion routes index what they
   * create: an unindexed document is INVISIBLE ([[DOC-39]] §4), not merely stale,
   * so the upload path needs the same binding the KB does. Optional here for the
   * same reason it is optional there — a deployment without it still stores and
   * still lists material, and says loudly that nothing can find it.
   */
  AI?: { run(model: string, input: unknown): Promise<unknown> }
}

/**
 * What the route table needs from its host, so that ONE route table can serve
 * two transports (REQ-145).
 *
 * The Worker supplies none and gets the default: a D1/R2 store from its
 * bindings. `1c builder`'s Node transport supplies a filesystem-backed store, so
 * the test suite and the operator's local loop drive the SAME routing, edits and
 * render as production rather than a second implementation that agrees with it
 * today.
 *
 * REQ-148 — the render is no longer one of these. It used to be: a behavior
 * module was an Astro component, so rendering one was a capability of the HOST,
 * injected here, and the Worker simply lacked it. Behavior components are plain
 * functions now, so both transports render every page through the same code and
 * there is nothing left to inject.
 */
export interface RouterDeps {
  /** The store this request reads and writes through. */
  store?: (env: RouterEnv, scope: Scope) => Promise<TenantSiteStore>
  /** The ticket store the ingestion routes write material into ([[REQ-163]]). */
  tickets?: (env: RouterEnv, scope: Scope) => Promise<TicketStore>
  /**
   * The system knowledge base the chat session searches ([[REQ-158]]).
   *
   * Injectable for the same reason `index` below is: the built-in one is the
   * corpus `1c kb build` produced for THIS checkout, which is a release artefact
   * a test cannot depend on and must not assert against. A UAT hands in a corpus
   * it planted itself, so "the assistant answered from the document and named
   * it" is a claim about a document whose content the test chose.
   */
  knowledge?: (env: RouterEnv) => Promise<unknown>
  /**
   * Step 5's indexer, and the whole reason it is injectable.
   *
   * Wired below to the project KB's `onMaterialWritten`. A UAT substitutes a
   * counter to prove the pipeline calls it EXACTLY ONCE per created material —
   * a claim that would otherwise need an embedder, an R2 index and a real
   * Workers AI binding to make.
   */
  index?: (env: RouterEnv, scope: Scope) => Promise<IndexMaterial | null>
  /** The vision seam, so ingestion UATs describe an image without a network. */
  describeImage?: DescribeImage
  /** The digest seam, so a document is described without a network (REQ-173). */
  describeText?: DescribeText
  /** The fetch the guard drives, so redirect re-validation is provable offline. */
  fetch?: typeof fetch
}

/**
 * FRESHNESS, SET ONCE, FOR EVERY RESPONSE THIS ROUTE TABLE CAN PRODUCE.
 *
 * The builder rewrites its own bytes underneath the browser — a save changes the
 * very channel the frame is displaying — so a single cacheable response leaves
 * an operator looking at a stale page that appears to be working. Stamping on
 * the way out covers the chrome document, every JSON envelope, every rendered
 * preview, every build artifact and every 400/404/500/501 alike.
 *
 * IT LIVES HERE, NOT IN THE WORKER'S `fetch`. It was in `fetch` first, and the
 * Node transport — which calls `route()` directly — therefore served the chrome
 * document with no directive at all. That is the same hole the Node origin's
 * `json()` helper once opened, rediscovered one layer up: a per-HOST
 * restatement is as forgettable as a per-route one. One wrapper, at the only
 * point every host shares.
 */
const NO_STORE = 'no-store, must-revalidate'

/**
 * The Worker's own secrets, for {@link redactor} (REQ-146, AC4).
 *
 * Listed rather than swept out of `env`, because `env` also carries bindings and
 * ordinary vars — `TENANT_ID` is a short, common word, and scrubbing it out of
 * error messages would destroy diagnostics to protect nothing. What belongs here
 * is only what is a CREDENTIAL, and today that is one key.
 */
function secretsOf(env: RouterEnv): Array<string | undefined> {
  return [env.ANTHROPIC_API_KEY]
}

/**
 * Step 5, wired to the project knowledge base ([[REQ-163]] / [[REQ-159]]).
 *
 * `onMaterialWritten` is the right call rather than a bare `refreshIndex`: an
 * upload is a REQUEST FOR ATTENTION ([[DOC-39]] §4.2). The client is not adding a
 * document to be thorough; they want to talk about it now. So the index refresh
 * is awaited — the material is searchable the instant the upload returns — and
 * the awareness-map rebuild is deferred behind it, which is the decomposition
 * that leaves the assistant never blocked and never blind.
 *
 * `null` WHEN THE BINDING IS ABSENT, and the caller says so loudly rather than
 * treating it as a degradation. `projectKnowledgeFor` raises rather than
 * degrading when `AI` is missing, which is right for the KB's own routes and
 * wrong here: an upload that 500s because nothing can embed it would lose the
 * client's file to a problem the operator has to fix.
 */
async function defaultIndexer(env: RouterEnv, scope: Scope): Promise<IndexMaterial | null> {
  if (!env.AI) return null
  const knowledge = await projectKnowledgeFor(env, scope)
  return async () => knowledge.onMaterialWritten()
}

/**
 * The image describer, or nothing.
 *
 * Absent is an ordinary state, exactly as it is for the chat routes: a
 * deployment with no key still stores every file the client hands it, and says
 * in each body that nothing has looked at it yet.
 */
function defaultDescriber(env: RouterEnv): DescribeImage | undefined {
  return env.ANTHROPIC_API_KEY ? anthropicImageDescriber(env.ANTHROPIC_API_KEY) : undefined
}

/**
 * The document describer, or nothing (REQ-173).
 *
 * Its absence is no longer an ordinary state the way the image describer's was:
 * {@link aiConfigured} refuses the upload before this is reached, so nothing
 * should ever ingest a document with no digest on a real deployment. It stays
 * optional because `describe.ts` must not throw on a caller that got past the
 * gate — losing a client's file to a missing key would be the worse failure by
 * the same margin [[DOC-38]] §10 measures everywhere else in this pipeline.
 */
function defaultTextDescriber(env: RouterEnv): DescribeText | undefined {
  return env.ANTHROPIC_API_KEY ? sessionTextDescriber(env.ANTHROPIC_API_KEY) : undefined
}

/**
 * Can this deployment reach a model at all? (REQ-173)
 *
 * NOTHING IN THIS PRODUCT WORKS WITHOUT A KEY. The assistant cannot take a turn,
 * an image cannot be looked at, and since REQ-173 a document cannot be described
 * either. The builder used to discover that one surface at a time — a frozen chat
 * panel here, a body reading *"no describer is configured"* there — which asks an
 * operator to infer a deployment-wide fact from a scattering of local symptoms.
 * So it is one question, asked once, answered at {@link AI_STATUS_PATH}, and the
 * routes that genuinely need a model refuse rather than half-succeed.
 *
 * AN INJECTED DESCRIBER COUNTS AS CONFIGURED, and that is not a test affordance
 * smuggled into production logic. The question this predicate asks is *"can a
 * description be written here"*, and a host that handed in a describer has
 * answered it — the key is merely how the Worker's own default obtains one.
 */
function aiConfigured(env: RouterEnv, deps: RouterDeps): boolean {
  return Boolean(env.ANTHROPIC_API_KEY || deps.describeImage || deps.describeText)
}

/** Where the builder asks whether this deployment can do anything (REQ-173). */
export const AI_STATUS_PATH = '/api/status'

/**
 * What the builder is told when it cannot work — one sentence, and an action.
 *
 * ADDRESSED TO WHOEVER CAN FIX IT. The client cannot set a `wrangler secret`, so
 * this does not ask them to; it says what is not working and names the thing that
 * is missing, which is what an operator reading a client's screenshot needs.
 */
export const NO_API_KEY_MESSAGE =
  'This builder has no Anthropic API key, so nothing that needs the assistant ' +
  'can run — no conversation, and no describing the material you upload. Set ' +
  'ANTHROPIC_API_KEY on the deployment and reload.'

/**
 * Say, loudly, that an upload landed where nothing can find it.
 *
 * ONCE PER AFFECTED UPLOAD, naming the uid and the binding. [[DOC-39]] §4's
 * point is that the failure is INVISIBILITY rather than staleness: the request
 * succeeded, the Library shows the file, and search will never return it. A
 * silent skip would make that indistinguishable from a working deployment.
 * [[REQ-159]] should promote this to a construction-time requirement in the
 * manner of `ticketStoreFor`'s refusals; until then, a log is what there is.
 */
function warnUnindexed(uid: string): void {
  console.warn(
    `[REQ-163] material ${uid} was stored but NOT indexed: no AI binding is ` +
      'configured, so the project knowledge base cannot embed it and nothing ' +
      'will find it by search. Declare [ai] in apps/control-app/wrangler.toml, ' +
      'under [env.production.ai] as well — a named environment inherits neither.',
  )
}

/**
 * What an ingestion answers with.
 *
 * THE DESCRIPTION STATUS AND `indexed` ARE IN THE ENVELOPE, not just in the log.
 * The Library has to be able to show *"stored, but nothing has read it"* without
 * a second request, and a client watching an upload succeed deserves to be told
 * when what they uploaded cannot yet be found.
 */
function materialEnvelope(ingested: {
  ticket: { uid: string; title: string; fields: Record<string, unknown> }
  attachment: { uid: string; fields: Record<string, unknown> }
  description: { status: string }
  indexed: boolean
  text?: { uid: string } | null
}): Record<string, unknown> {
  return {
    uid: ingested.ticket.uid,
    title: ingested.ticket.title,
    kind: ingested.ticket.fields.kind,
    rights: ingested.ticket.fields.rights,
    republishable: ingested.ticket.fields.republishable,
    exportable: ingested.ticket.fields.exportable,
    origin: ingested.ticket.fields.origin,
    // WHAT THE CLIENT SAID IT WAS FOR ([[REQ-161]]). Echoed rather than left to
    // be re-derived from `republishable`, because the two come apart the moment
    // captures land ([[DOC-38]] 3a is reference material AND republishable), and
    // the Library filters on this one.
    role: ingested.ticket.fields.role,
    source_url: ingested.ticket.fields.source_url,
    description_status: ingested.description.status,
    description_model: ingested.ticket.fields.description_model,
    attachment: {
      uid: ingested.attachment.uid,
      sha256: ingested.attachment.fields.sha256,
      size: ingested.attachment.fields.size,
      content_type: ingested.attachment.fields.content_type,
    },
    indexed: ingested.indexed,
    // WHERE THE DOCUMENT'S OWN TEXT WENT (REQ-173). Echoed because the body no
    // longer carries it: a caller that wants the verbatim text now has to know
    // there is a comment to ask for, and the uid is the honest way to say so.
    text_comment: ingested.text ? ingested.text.uid : null,
  }
}

/**
 * "Site asset" means the bytes are actually on the site ([[REQ-161]]).
 *
 * THE ROLE IS NOT A LABEL. The overlay's first area promises the file will be
 * something visitors see, and a ticket in a store is not that — until the bytes
 * are in the site's asset library the client has dropped their logo into a
 * filing cabinet. So the upload route completes the promise, immediately, which
 * is also what makes a dropped logo pickable in the same second rather than
 * after some later step nobody has specified.
 *
 * THROUGH THE GATE, NEVER AROUND IT. `promoteToSiteAsset` refuses anything whose
 * ticket is not `republishable`, and `classify` writes that bit from the role —
 * so the second area is mechanically incapable of reaching a published site,
 * rather than merely not routed there. That is [[DOC-38]] §5's invariant getting
 * its first real caller, which is the whole reason [[REQ-163]] shipped the
 * refusal before anything could call it.
 *
 * A FAILURE HERE DOES NOT LOSE THE UPLOAD. The material is stored, described and
 * indexed by the time this runs; a site store that refuses the write (an unknown
 * slug, a store that is not there) must not turn that into a 500 that tells the
 * client their file did not arrive. It is reported in the envelope instead —
 * named, not swallowed, so the overlay can say what did and did not happen.
 *
 * WHICH IS WHY PLACEMENT IS RECORDED INSIDE `promoteToSiteAsset` AND NOT HERE
 * (BUG-47). Because this path fails softly, a `placed_on` written on the way in
 * would mark every soft failure as a success — the material is kept, so the row
 * would survive carrying a placement that never happened. The record is written
 * after the asset write returns, so the only rows that claim a site are the ones
 * whose bytes reached it.
 *
 * AND SCRUBBED ON THE WAY OUT, exactly as the route table's own failures are.
 * This is a 200 carrying a message from a caught exception, which is the one
 * shape that looks like it escapes REQ-146's guarantee — the envelope leaves the
 * Worker whatever the status code on it says, so the scrubber has to travel with
 * it rather than being applied only where an error status is set.
 */
async function placeOnSite(
  ingested: { ticket: { uid: string; fields: Record<string, unknown> } },
  slug: string | undefined,
  openTickets: () => Promise<TicketStore>,
  openStore: () => Promise<TenantSiteStore>,
  scrub: (message: string) => string,
): Promise<Record<string, unknown>> {
  if (ingested.ticket.fields.role !== 'site' || !slug) return { site_asset: null }
  const name = String(ingested.ticket.fields.filename ?? '')
  try {
    const placed = await promoteToSiteAsset(await openTickets(), await openStore(), {
      uid: ingested.ticket.uid,
      slug,
      name,
    })
    return { site_asset: placed.name }
  } catch (err) {
    return {
      site_asset: null,
      site_asset_error: scrub(err instanceof Error ? err.message : String(err)),
    }
  }
}

function uncacheable(response: Response): Response {
  const headers = new Headers(response.headers)
  headers.set('cache-control', NO_STORE)
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}

/**
 * The runtime's promise to keep this isolate alive past the response (BUG-46).
 *
 * A FOURTH PARAMETER AND NOT A {@link RouterDeps} FIELD, because it is not a
 * dependency this route table chooses — it is per-request state the runtime
 * hands the fetch handler, exactly like `request` and `env`, and it is a
 * different object on every invocation.
 *
 * OPTIONAL, because `route()` has hosts that have no such thing: the Node
 * transport in `builder.ts` calls it directly, and a Node process does not end
 * when a response does, so there is nothing there to extend. Every use below is
 * therefore a graceful degradation rather than a requirement — absent, the work
 * still runs, it just runs with only the client's attention holding it open,
 * which is the behaviour that predates this and is correct off-Worker.
 */
export interface RouteContext {
  waitUntil(promise: Promise<unknown>): void
}

/**
 * THE SCOPE IS AN ARGUMENT, NOT SOMETHING THIS FILE DERIVES ([[REQ-168]]).
 *
 * It arrives already authorised: `index.ts` resolves it from the caller's
 * admission before any route is examined, in the same place and for the same
 * reason the Access gate and `admit` sit there. A route table that resolved its
 * own scope would be a second authorisation path beside the one in `fetch`, and
 * the interesting question about two authorisation paths is only ever when they
 * begin to disagree.
 *
 * REQUIRED, AND AHEAD OF `deps`. Both are deliberate. An optional scope would
 * need a default, and the only available default is the deployment's own
 * business — which is precisely the value this ticket exists to stop routes
 * reading. Putting it ahead of `deps` makes every existing call site a compile
 * error rather than letting one slide through on a positional argument that
 * still type-checks.
 */
export async function route(
  request: Request,
  env: RouterEnv,
  scope: Scope,
  deps: RouterDeps = {},
  ctx?: RouteContext,
): Promise<Response> {
  return uncacheable(await routeUncached(request, env, scope, deps, ctx))
}

async function routeUncached(
  request: Request,
  env: RouterEnv,
  scope: Scope,
  deps: RouterDeps = {},
  ctx?: RouteContext,
): Promise<Response> {
  const url = new URL(request.url)
  // THE BUSINESS PREFIX IS STRIPPED ONCE, HERE, and the route table below is
  // untouched by it. Every route matches on `p`, so one rewrite at the top scopes
  // all of them — including `/preview/<slug>/<channel>/…`, whose relative
  // sub-resources inherit the prefix from the document that referenced them,
  // which is the property `scope.ts` chose a path over a query string for.
  //
  // The id is DISCARDED here rather than re-read: `index.ts` already resolved and
  // authorised it. Reading it a second time would be a second answer to "which
  // business", and the whole point of the resolver is that there is one.
  const p = splitBusinessPrefix(url.pathname).path
  const method = request.method

  // ONE SCRUBBER FOR THE WHOLE TABLE (REQ-146 AC4). It was built per catch block,
  // which is three declarations of the same thing and, more to the point, three
  // places for the next route to forget one. Hoisting it makes "every `error:`
  // value out of this table is `scrub(...)`" a rule with a single subject —
  // which is the rule the boundary UAT actually checks for.
  const scrub = redactor(secretsOf(env))

  if (p === '/' || p === '/index.html') {
    return new Response(chromeHtml(), {
      status: 200,
      headers: { 'content-type': 'text/html; charset=utf-8' },
    })
  }

    /**
   * POST /api/import — one whole site, copied up from a local store (REQ-145).
   *
   * THE WORKER IS THE WRITER, deliberately. `bin/publish` runs in Node, which
   * has no D1 binding and no R2 binding; the alternatives were shelling out to
   * `wrangler d1 execute` with site JSON hand-escaped into SQL, or a third
   * store adapter over Cloudflare's HTTP API. Posting the payload here means
   * an import lands through exactly the store an edit lands through.
   *
   * ONE WRITE, so an import either lands whole or not at all. Against this
   * adapter that is one `db.batch()`. A half-landed import would be worse than
   * a failed one: the site would exist, would validate as far as it went, and
   * would be missing pages nobody had a record of.
   *
   * IDEMPOTENT by construction — `createDraft` is a no-op for a site that
   * exists and the write replaces each page and asset by name — so re-running
   * `bin/publish` after an edit is the ordinary way to use it.
   */
  if (p === '/api/import' && method === 'POST') {
    try {
      const payload = (await readJsonBody(request)) as unknown as SitePayload
      if (!payload || typeof payload.slug !== 'string' || payload.slug === '') {
        return json(400, { error: 'slug is required' })
      }
      if (!Array.isArray(payload.pages) || !Array.isArray(payload.assets)) {
        return json(400, { error: 'pages and assets must be arrays' })
      }
      // The SAME opener every other route uses (BUG-36). This route had its own
      // for a while, because `forTenant` refuses an unknown tenant — which on a
      // fresh database is every request, including the one that would populate
      // it. But that made the import the only way a deployment's tenant ever got
      // registered, so a builder nobody had published to could not be read at
      // all. `storeFor` registers the configured tenant itself now, and there is
      // one opener again.
      const store = await (deps.store ?? storeFor)(env, scope)
      await store.createDraft(payload.slug)
      const write = payloadToWrite(payload)
      await store.write(payload.slug, write)
      return json(200, {
        pages: write.pages.length,
        assets: write.assets.length,
        siteJson: write.siteJson !== undefined,
      })
    } catch (err) {
      // Applied here too, though this route never touches a credential: a path
      // that scrubs and a path that does not is an invitation to add a third
      // that does not, and the cost when there is nothing to scrub is nil.
      if (err instanceof CommandError) {
        return json(400, { error: scrub(err.message), ...err.toEnvelope() })
      }
      const message = err instanceof Error ? err.message : String(err)
      return json(500, { error: scrub(message) })
    }
  }

  /**
   * THE STORE IS OPENED LAZILY, and that is a bug fix rather than a
   * micro-optimisation (REQ-149).
   *
   * It used to be opened HERE, unconditionally, before any route matched — so
   * every request built a tenant-scoped handle, including the ones that fall
   * through to the assets binding at the bottom. `forTenant` refuses an unknown
   * tenant, which is correct, so on a store with no tenant row every
   * `/builder/*` and `/webui/*` request answered 503. Those are BUILD ARTIFACTS:
   * they have nothing to do with a tenant and must not depend on one.
   *
   * The visible symptom was a blank builder. `/` is answered above, before the
   * store, so the document arrived 200 while every module in its import graph
   * died — a page that loaded successfully and did nothing, with the reason
   * reachable only in devtools.
   *
   * WHY NOT MOVE THE FALL-THROUGH UP INSTEAD. Because the fall-through is last
   * on purpose: an asset must never shadow a route. Deferring the store keeps
   * that ordering exactly as it was and removes the dependency, which is the
   * part that was actually wrong.
   *
   * Memoised per request, so a route that reads it twice still performs one
   * tenant check — the same handle the eager version produced, obtained at the
   * first moment something genuinely needs it.
   */
  let opening: Promise<TenantSiteStore> | null = null
  const openStore = (): Promise<TenantSiteStore> => {
    opening ??= (deps.store ?? storeFor)(env, scope)
    return opening
  }
  // `actor: 'client'` — REQ-131. A write arriving on these routes is the
  // operator's own hand in the builder, and the journal says so, which is the
  // difference between the assistant reading "you changed this" and reading
  // "something changed".
  const edit = async () => ({ store: await openStore(), actor: 'client' as const })

  // Memoised per request for the same reason the site store is: a route that
  // opens it twice would perform two tenant-registry checks to obtain the same
  // handle.
  let tickets: Promise<TicketStore> | null = null
  const openTickets = (): Promise<TicketStore> => {
    tickets ??= (deps.tickets ?? ticketStoreFor)(env, scope)
    return tickets
  }

  /**
   * What ingestion needs from this deployment — the indexer and the describer.
   *
   * BOTH ARE OPTIONAL AND THE TWO ABSENCES ARE NOT ALIKE, which is why they are
   * reported differently:
   *
   *   - NO DESCRIBER is an ordinary, visible state. The material is stored, its
   *     body says nothing has looked at it, and `description_status` makes the
   *     backlog a query. Nothing is lost that a later pass cannot recover.
   *   - NO INDEXER IS NOT. [[DOC-39]] §4 is explicit that an unindexed document
   *     is **invisible** — search cannot return what it has not embedded — so an
   *     unwired hook is a silent failure of the worst kind: every upload
   *     succeeds, the Library fills up, and the assistant can find none of it.
   *     So it is LOGGED LOUDLY, once per affected upload, naming the binding.
   *
   * [[REQ-159]] is landed, so the hook has a real implementation to reach —
   * `onMaterialWritten` refreshes the vector index inline and defers the
   * awareness-map rebuild behind it. The seam survives anyway, because the claim
   * a UAT needs to make ("called exactly once per created material") should not
   * require an embedder, an R2 index and a Workers AI binding to make.
   */
  const ingestDeps = async () => ({
    index: deps.index ? await deps.index(env, scope) : await defaultIndexer(env, scope),
    describeImage: deps.describeImage ?? defaultDescriber(env),
    describeText: deps.describeText ?? defaultTextDescriber(env),
  })

  try {
    /**
     * GET /api/status — can this deployment do anything at all? (REQ-173)
     *
     * ABOVE THE STORE AND ABOVE THE TENANT CHECK, deliberately, and the same
     * reasoning the lazy store above records applies with more force here: this
     * is the question the builder asks BEFORE it decides whether to offer the
     * operator anything, so answering it must not depend on the parts of the
     * deployment that may themselves be unconfigured.
     *
     * IT REPORTS A CAPABILITY, NOT A SECRET. The key's presence is the answer;
     * the key never appears in it, and `redactor` guards the rest of the table
     * for the case where one leaks into a message.
     */
    if (p === AI_STATUS_PATH && method === 'GET') {
      const ready = aiConfigured(env, deps)
      return json(200, { ai: ready, message: ready ? null : NO_API_KEY_MESSAGE })
    }

    if (p === '/api/sites' && method === 'GET') {
      // `latest` is the live revision — the highest id in the log, derived and
      // never stored (REQ-149). It read `null` for every site while the store
      // held no revisions; saying so was better than implying one, and now there
      // is something true to say.
      const store = await openStore()
      const slugs = await store.slugs()
      return json(
        200,
        await Promise.all(
          slugs.map(async (slug) => ({
            slug,
            latest: liveRevisionOf(await store.revisions(slug)),
          })),
        ),
      )
    }

    /**
     * POST /api/publish — freeze the draft as a revision and render it (REQ-149).
     *
     * A TRANSPORT, exactly like every other route here. `publishSite` is the one
     * implementation and `1c publish` calls the same function against the
     * filesystem store; nothing about what a publish IS is decided in this file.
     *
     * THE TWO NON-500 FAILURES ARE NAMED, and BOTH ARE MAPPED IN THE CATCH AT
     * THE BOTTOM rather than here. An invalid draft is an
     * `InvalidDefinitionError` carrying the path-pointed validation errors the
     * toolbar shows; a slug another account already publishes under is a 409,
     * because it is neither a malformed request nor this server breaking — it is
     * a name that is taken. Catching either locally would mean building an
     * `error:` value outside the one place that scrubs them (REQ-146 AC4), and
     * the next such route would inherit the omission.
     */
    if (p === '/api/publish' && method === 'POST') {
      const body = await readJsonBody(request)
      if (typeof body.slug !== 'string' || body.slug === '') {
        return json(400, { error: 'slug is required' })
      }
      const result = await publishSite(await openStore(), body.slug, {
        message: typeof body.message === 'string' ? body.message : undefined,
      })
      return json(200, {
        id: result.id,
        changes: result.changes,
        published: result.published,
        url: publicSiteUrl(body.slug),
      })
    }

    if (p === '/api/revisions' && method === 'GET') {
      const slug = url.searchParams.get('slug')
      if (!slug) return json(400, { error: 'slug is required' })
      return json(200, await revisionHistory(await openStore(), slug))
    }

    if (p === '/api/assets' && method === 'GET') {
      const slug = url.searchParams.get('slug')
      if (!slug) return json(400, { error: 'slug is required' })
      return json(200, (await editAssetList(slug, await edit())).data)
    }

    /**
     * The Library's read surface ([[REQ-161]]) — the list, one item, its bytes.
     *
     * THREE ROUTES AND NOT ONE, and the split is the payload rather than taste.
     * A material's body is its extracted text, so a brand book is tens of
     * kilobytes of it; a list that carried bodies would ship the client's entire
     * corpus to draw a column of filenames. So the list is rows, the item adds
     * the body, and the bytes are their own response with their own content type.
     *
     * TENANT-WIDE, and the `slug` the Library also holds is never sent here.
     * [[DOC-38]] §7.7 lets one blob back two sites and [[DOC-10]] §4.1 makes
     * shared knowledge across a client's sites deliberate — so "used on this
     * site" is a badge the client filters by, decided in the browser from
     * `placed_on` on the row, and never a boundary this route enforces.
     */
    if (p === '/api/material' && method === 'GET') {
      return json(200, { material: await listMaterial(await openTickets()) })
    }

    if (p === '/api/material/item' && method === 'GET') {
      const uid = url.searchParams.get('uid')
      if (!uid) return json(400, { error: 'uid is required' })
      return json(200, await readMaterial(await openTickets(), uid))
    }

    /**
     * The bytes, so the detail pane can SHOW the thing rather than name it.
     *
     * Served from the private bucket through the tenant-bound blob handle, which
     * is why this is a route on the builder origin and not a URL into `SITES`:
     * the public Worker has no binding on the material bucket, deliberately
     * ([[DOC-38]] §7.1), and giving it one to save a hop is the disclosure that
     * boundary exists to prevent.
     */
    if (p === '/api/material/file' && method === 'GET') {
      const uid = url.searchParams.get('uid')
      if (!uid) return json(400, { error: 'uid is required' })
      // `member` NAMES ONE FILE INSIDE A CAPTURE ([[REQ-166]]). Absent is the
      // ordinary single-file material and behaves exactly as it always did, so
      // every existing caller is unaffected; present, it addresses one of a
      // bundle's 11–99 members without materialising the rest of it.
      const member = url.searchParams.get('member') ?? undefined
      const file = await materialFile(await openTickets(), uid, member)
      return new Response(file.bytes as unknown as BodyInit, {
        status: 200,
        headers: {
          'content-type': file.contentType,
          // INLINE, with the original name. The pane renders images and audio
          // directly and offers everything else as a download; a bare
          // `attachment` would make the preview a download prompt instead.
          'content-disposition': `inline; filename="${file.filename.replace(/["\\]/g, '')}"`,
        },
      })
    }

    /**
     * The client corrects what we said their material is ([[REQ-161]]).
     *
     * The body IS the description ([[DOC-38]] §6), so this is a ticket write —
     * but it re-indexes, which is the half that makes the ticket's acceptance
     * true. A correction that changed the body and not the index would leave the
     * Library showing the client's words while search kept answering with ours.
     */
    if (p === '/api/material/description' && method === 'POST') {
      const body = await readJsonBody(request)
      if (typeof body.uid !== 'string' || body.uid === '') {
        return json(400, { error: 'uid is required' })
      }
      if (typeof body.body !== 'string') {
        return json(400, { error: 'body is required' })
      }
      const revised = await reviseDescription(
        await openTickets(),
        { uid: body.uid, body: body.body },
        (await ingestDeps()).index,
      )
      if (!revised.indexed) warnUnindexed(body.uid)
      return json(200, revised.row)
    }

    /**
     * The two ingestion entry points ([[REQ-163]], [[DOC-38]] §10).
     *
     * THEY BELONG HERE AND NOT TO [[REQ-161]], and the line is worth stating
     * because the two tickets meet exactly at it: these are PIPELINE ENTRY
     * POINTS — the only way a byte enters the system — while listing material,
     * showing it, and the drag-and-drop overlay that will POST to them are
     * SURFACES over what already exists. So the contract below is public from
     * the start: the Library is written against it rather than alongside it.
     *
     * `multipart/form-data` for the upload, because that is what a dropped file
     * is in a browser and what `FormData` produces without ceremony. JSON for
     * the fetch, because its whole input is one address.
     */
    if (p === '/api/material' && method === 'POST') {
      // REFUSED BEFORE THE BYTES ARE READ (REQ-173). Storing a document nothing
      // can describe used to be the degraded-but-honest path, and it was the
      // right one while a body was the extracted text: the material was still
      // findable by its own words. It is not right now. The body is a digest, so
      // a deployment with no describer produces material with no description at
      // all — and the Library would fill up with rows saying why, one per upload,
      // for a fact that is true of the whole deployment and is stated once at the
      // top of the screen instead.
      if (!aiConfigured(env, deps)) return json(503, { error: scrub(NO_API_KEY_MESSAGE) })
      const form = await request.formData()
      // CAST BECAUSE `@cloudflare/workers-types` DECLARES `get` TOO NARROWLY —
      // `get(name): string | null`, with no `File` in the union, even though the
      // runtime returns one for a file part and the same file's declaration is a
      // class two hundred lines up in that very file. Without the cast the
      // `instanceof` below does not compile, and narrowing structurally instead
      // would leave the value `never`.
      const file = form.get('file') as unknown as File | string | null
      if (!(file instanceof File)) {
        return json(400, { error: 'a file is required, sent as multipart form field `file`' })
      }
      const slug = form.get('slug')
      const siteSlug = typeof slug === 'string' && slug !== '' ? slug : undefined
      /**
       * WHICH DROP AREA THE CLIENT CHOSE ([[REQ-161]]).
       *
       * VALIDATED AND NOT COERCED. A misspelled role must be a refusal, because
       * the two silent alternatives are both wrong in a way nobody would notice:
       * falling back to `site` publishes something the client marked private,
       * and falling back to `reference` quietly withholds a hero photograph they
       * meant to put on their site.
       *
       * ABSENT IS STILL ALLOWED, and that is deliberate. This route is the
       * pipeline's entry point as well as the overlay's target, so a caller that
       * predates the question — [[REQ-163]]'s own path — lands on [[DOC-38]]
       * §10.1's provenance answer exactly as it did. The guarantee that a human
       * chose belongs to the overlay, which has no drop target that is not one of
       * the two areas; it is not something a route can assert on its behalf.
       */
      const rawRole = form.get('role')
      if (rawRole != null && rawRole !== 'site' && rawRole !== 'reference') {
        return json(400, { error: "role must be 'site' or 'reference'" })
      }
      const role = (rawRole ?? undefined) as MaterialRole | undefined
      const ingested = await ingestUpload(
        await openTickets(),
        {
          bytes: new Uint8Array(await file.arrayBuffer()),
          filename: file.name,
          // The browser's own observation about the bytes, with a fallback
          // rather than a refusal — a type we cannot read still gets stored and
          // still says so, which is the trade the pipeline makes throughout.
          contentType: file.type || 'application/octet-stream',
          role,
        },
        await ingestDeps(),
      )
      if (!ingested.indexed) warnUnindexed(ingested.ticket.uid)
      return json(200, {
        ...materialEnvelope(ingested),
        ...(await placeOnSite(
          ingested,
          siteSlug,
          openTickets,
          openStore,
          scrub,
        )),
      })
    }

    if (p === '/api/material/fetch' && method === 'POST') {
      // The same gate as the upload route, for the same reason: both entry points
      // converge on `ingest`, so a guard on one of them is not a guard.
      if (!aiConfigured(env, deps)) return json(503, { error: scrub(NO_API_KEY_MESSAGE) })
      const body = await readJsonBody(request)
      if (typeof body.url !== 'string' || body.url === '') {
        return json(400, { error: 'url is required' })
      }
      // NO SLUG (BUG-47). What we fetch on a client's behalf is always
      // `reference` and never `republishable`, so it can never be promoted onto
      // a site — a slug here could only ever have recorded which site happened
      // to be open, which is the fact the Library was misreading as placement.
      const ingested = await ingestFetch(await openTickets(), body.url, {
        ...(await ingestDeps()),
        fetch: deps.fetch,
      })
      if (!ingested.indexed) warnUnindexed(ingested.ticket.uid)
      return json(200, materialEnvelope(ingested))
    }

    /**
     * The palette popup's calls (REQ-133 / DOC-28 §8).
     *
     * Thin transports over the same `editPalette*` functions `1c palette`
     * dispatches to. That is what makes the guards real: the delete refusal and
     * the rename collision check run inside those functions against the stored
     * definition, so a stale tab posting a count it read five minutes ago cannot
     * talk the store into an orphaned reference.
     */
    if (p === '/api/palette') {
      if (method === 'GET') {
      const slug = url.searchParams.get('slug')
      if (!slug) return json(400, { error: 'slug is required' })
      return json(200, (await editPaletteGet(slug, await edit())).data)
      }

      if (method === 'POST') {
      const body = await readJsonBody(request)
      const { slug, op, name, value, to } = body
      if (typeof slug !== 'string' || typeof op !== 'string') {
          return json(400, { error: 'slug and op are required' })
      }
      // The op vocabulary is CLOSED and checked here, so an unknown verb is a
      // 400 rather than an exception rendered as a 500 — the client is a
      // second producer of edits, and a malformed one deserves to be told so.
      if (op !== 'set' && op !== 'add' && op !== 'rm' && op !== 'rename') {
          return json(400, { error: `unknown palette op '${op}'` })
      }
      if (typeof name !== 'string') return json(400, { error: 'name is required' })
      const scope = await edit()
      const out =
          op === 'set'
            ? await editPaletteSet(slug, name, value, scope)
            : op === 'add'
              ? await editPaletteAdd(slug, name, value, scope)
              : op === 'rm'
                ? await editPaletteRm(slug, name, scope)
                : await editPaletteRename(slug, name, String(to ?? ''), scope)
      // The census travels back with every write, so the popup redraws from
      // what the store now holds rather than from its own guess at it — a
      // rename changes one name and no count, a delete changes the list, and
      // the client needs neither to know which.
      const census = (await editPaletteGet(slug, scope)).data as Record<string, unknown>
      return json(200, { ...(out.data as Record<string, unknown>), ...census })
      }
    }

    /**
     * The assistant's two calls (REQ-122 / REQ-127), now in workerd (REQ-146).
     *
     * THIN, exactly as the Node origin's were. Both are transports over
     * `host-core.ts` — the same session model, the same tool loop, the same
     * `edit.ts` write path every other route uses. Nothing here decides anything
     * about a conversation.
     *
     * A SITE BECOMES A SESSION IN ONE PLACE, and it is not here: `openSession`
     * takes the slug and hands back an id, and every turn afterwards carries
     * only that id. `/api/ai/prompt` never sees a slug, which is what stops a
     * late answer landing in a window that has since switched sites.
     */
    if (p === '/api/ai/session' && method === 'POST') {
      const body = await readJsonBody(request)
      const slug = body.slug
      if (typeof slug !== 'string' || slug === '') {
        return json(400, { error: 'slug is required' })
      }
      const host = await chatHost(env, scope, deps)
      const session = await openSession(slug, {}, host.deps)
      // Opening can run a tool-free turn's worth of policy — nothing to audit
      // yet in practice, but flushed for the same reason the prompt route
      // does it: the buffer is per host, and leaving records in it would
      // attribute them to whatever turn drained next.
      await host.flush(session.sessionId)
      return json(200, session)
    }

    if (p === '/api/ai/prompt' && method === 'POST') {
      const body = await readJsonBody(request)
      const { sessionId, text } = body
      if (typeof sessionId !== 'string' || sessionId === '') {
        return json(400, { error: 'sessionId is required' })
      }
      if (typeof text !== 'string') {
        return json(400, { error: 'text is required' })
      }
      const host = await chatHost(env, scope, deps)
      return streamTurn(host, sessionId, text, scrub, ctx)
    }

    /**
     * POST /api/ai/reattach — rejoin a turn already in flight (BUG-46).
     *
     * THE THIRD CALL THIS SURFACE HAS, and the first that is a pure READ of a
     * conversation. `/api/ai/session` says what to paint, `/api/ai/prompt`
     * starts a turn, and neither lets a page that loaded DURING a turn catch up:
     * the transcript is a still frame, correct as of the fold, of something
     * still being written. Without this the operator watches a reply frozen
     * mid-sentence and reloads again — which is the loop that cost them a turn
     * to begin with.
     *
     * IT TAKES THE CURSOR `/api/ai/session` HANDED OUT, and that pairing is the
     * point. The tail resumes at exactly the offset the transcript was folded
     * at, so painted-then-tailed reads as one reply with no gap and nothing
     * shown twice (DOC-21 §11). A cursor invented anywhere else is a cursor for
     * a different fold.
     *
     * NO `ctx.waitUntil`, unlike the prompt route, and the asymmetry is the
     * whole distinction between the two. Tailing produces nothing durable —
     * there is no `turn_end` to append, no `sync` to drain, no audit to flush —
     * so a client that walks away leaves nothing behind that needs finishing.
     * The turn it was watching is driven by whoever started it and is entirely
     * unaffected either way.
     */
    if (p === '/api/ai/reattach' && method === 'POST') {
      const body = await readJsonBody(request)
      const { sessionId, cursor } = body
      if (typeof sessionId !== 'string' || sessionId === '') {
        return json(400, { error: 'sessionId is required' })
      }
      // A MISSING CURSOR IS NOT ZERO. Defaulting it would silently replay the
      // whole conversation into a panel that has already painted it, which is
      // the exact duplication the cursor exists to prevent — and it would look
      // like the feature working.
      if (typeof cursor !== 'number' || !Number.isFinite(cursor) || cursor < 0) {
        return json(400, { error: 'cursor is required' })
      }
      const host = await chatHost(env, scope, deps)
      return streamTail(host, sessionId, cursor, scrub)
    }

    /**
     * The copy modal's two calls (REQ-117 / DOC-28 §4).
     *
     * Both are thin transports over `editCopyGet` / `editCopySet` — the same
     * functions `1c copy get|set` dispatches to, not a parallel implementation.
     * The editor is a second producer of structured edits, not a second write
     * path, and nothing here can bypass validation because nothing here does any
     * of that work itself.
     */
    if (p === '/api/copy') {
      const scoped = async (read: (k: string) => string | undefined) => ({
      ...(await edit()),
      module: read('module'),
      slot: read('slot'),
      })

      if (method === 'GET') {
      const q = url.searchParams
      const get = (k: string): string | undefined => {
          const v = q.get(k)
          return v !== null && v !== '' ? v : undefined
      }
      const [slug, page, addr] = [q.get('slug'), q.get('page'), q.get('path')]
      if (!slug || !page || !addr) {
          return json(400, { error: 'slug, page and path are required' })
      }
      return json(200, (await editCopyGet(slug, page, addr, await scoped(get))).data)
      }

      if (method === 'POST') {
      const body = await readJsonBody(request)
      const get = (k: string): string | undefined => {
          const v = body[k]
          return typeof v === 'string' && v !== '' ? v : undefined
      }
      const [slug, page, addr] = [body.slug, body.page, body.path]
      if (typeof slug !== 'string' || typeof page !== 'string' || typeof addr !== 'string') {
          return json(400, { error: 'slug, page and path are required' })
      }
      const values = body.values
      if (values === null || typeof values !== 'object' || Array.isArray(values)) {
          return json(400, { error: 'values must be an object of field → string' })
      }
      // `editCopySet` throws on an invalid edit before writing anything, so a
      // failure here leaves the draft exactly as the user left it — the iframe
      // they are looking at is still accurate, which is what makes surfacing
      // the error safe. No re-render follows (REQ-119): the next fetch of
      // either channel renders the definition this write just produced.
      const out = await editCopySet(
          slug,
          page,
          addr,
          values as Record<string, unknown>,
          await scoped(get),
      )
      return json(200, out.data)
      }
    }

    /**
     * /preview/<slug>/<channel>/<...> — a rendered channel (REQ-119).
     *
     * `draft` and `edit` render ON REQUEST from the stored definition, now in
     * workerd. `published` is not here: it is the immutable artifact a publish
     * produced, it lives in R2, and `public-site` serves it. Re-deriving it from
     * today's draft would make the published channel show unpublished work.
     *
     * SO `published` REDIRECTS rather than being served (REQ-149 D4). One serving
     * path for published bytes, as DOC-12 §7 assigns it. Proxying instead would
     * duplicate the resolve-and-serve logic that seam exists to own, and the cost
     * of the redirect — a never-published site shows public-site's 404 rather
     * than a builder-shaped message — lands on a URL the toolbar never produces.
     */
    const preview = p.match(/^\/preview\/([^/]+)\/([^/]+)(\/.*)?$/)
    if (preview) {
      const slug = decodeURIComponent(preview[1])
      const channel = decodeURIComponent(preview[2])
      if (channel === 'published') {
      return Response.redirect(publicSiteUrl(slug, preview[3] ?? '/'), 302)
      }
      if (!PREVIEW_CHANNELS.includes(channel as PreviewChannel)) {
      return text(404, 'Unknown channel')
      }
      return servePreview(await openStore(), slug, channel as PreviewChannel, preview[3] ?? '/')
    }

    // Not a route: the build artifacts, or a genuine 404 from the binding that
    // holds them. Last, so no asset can shadow a route.
    return env.ASSETS.fetch(request)
  } catch (err) {
    // A CommandError is the EXPECTED answer to a bad edit — the validator
    // refusing a change map, an address that resolves to nothing. It is the
    // user's mistake, not the server's, so it carries its own code/path/hint
    // envelope out to the modal at 400. Reporting it as 500 would tell the
    // client "the builder broke" for a rejected heading, and would throw away
    // the message naming which field was wrong and why.
    // Scrubbed on the way out, not at the throw site: the message that carries a
    // credential is the one nobody wrote — see `redact.ts`.
    // A STORE THAT COULD NOT BE OPENED IS A CONFIGURATION FAILURE, not a bad
    // request, and `index.ts` renders it as 503 in prose an operator can act on.
    // It reaches this handler at all only because REQ-149 deferred the store's
    // construction into this `try` — before that it threw past `route()`
    // entirely. Rethrowing keeps the status exactly where it was: without it,
    // moving WHEN the store opens would silently downgrade "this deployment is
    // misconfigured" to "the server broke on your request".
    if (err instanceof TenantNotConfiguredError || err instanceof UnknownTenantError) throw err

    if (err instanceof CommandError) {
      return json(400, { error: scrub(err.message), ...err.toEnvelope() })
    }
    // A draft that does not validate is the AUTHOR'S error, like a rejected
    // change map — 400, carrying the path-pointed errors so the toolbar can say
    // which field is wrong rather than "publish failed". It is deliberately not
    // folded into `CommandError`: this one carries a LIST of errors, and
    // flattening it to a single code/path/hint would throw away the part the
    // author needs.
    if (err instanceof InvalidDefinitionError) {
      return json(400, {
        error: scrub(err.message),
        code: 'INVALID_DEFINITION',
        errors: err.errors.map((e) => ({ path: e.path, message: scrub(e.message) })),
      })
    }
    // A published address another account already owns (REQ-149 D2). 409 rather
    // than 400 or 500: the request is well-formed and the server is fine — the
    // name is taken, and the only thing that resolves it is choosing another.
    if (err instanceof SlugClaimedError) {
      return json(409, { error: scrub(err.message) })
    }
    // [[REQ-163]] — three refusals a client can act on, and each carries the
    // status that says WHOSE problem it is.
    //
    // A file over the ceiling, or one nothing can store, is 413/400: the request
    // is wrong and the message says how ([[DOC-38]] §14 asks for "a clear
    // rejection rather than an out-of-memory", and a clear rejection is one the
    // person who dragged the file can act on). An address the guard refuses is
    // 400 for the same reason — it is not a server failure and it is not a
    // permission the caller could be granted.
    //
    // Promotion of a non-republishable source is 403 and NOT 400, because the
    // request is perfectly well formed: it is forbidden. That distinction is the
    // whole of [[DOC-38]] §5 — the most damaging single action available in the
    // system is refused as a matter of RIGHTS, not of syntax.
    if (err instanceof MaterialRejectedError) {
      return json(err.message.includes('the limit is') ? 413 : 400, { error: scrub(err.message) })
    }
    if (err instanceof FetchRefusedError) {
      return json(400, { error: scrub(err.message), url: err.url })
    }
    if (err instanceof NotRepublishableError) {
      return json(403, { error: scrub(err.message), uid: err.uid })
    }
    // 404 AND NOT 403 ([[REQ-161]]). The uid names nothing this surface reaches:
    // either it does not exist or it is a ticket of another kind. The two are
    // answered identically on purpose — distinguishing them would turn the
    // Library's read routes into an oracle for which uids exist in the tenant.
    if (err instanceof NotMaterialError) {
      return json(404, { error: scrub(err.message), uid: err.uid })
    }
    const message = err instanceof Error ? err.message : String(err)
    return json(500, { error: scrub(message) })
  }
}

/**
 * One turn, as the `data: {json}` frames the chat panel consumes.
 *
 * THE FRAMING IS THE CLIENT'S, not a standard SSE library's: `api.js` splits on
 * a blank line and parses what follows `data:`. Restating it here rather than
 * reaching for `text/event-stream` niceties keeps the two halves obviously the
 * same shape.
 *
 * THE AUDIT IS FLUSHED IN A `finally`, INSIDE THE STREAM. That placement is the
 * whole of AC3 and is not incidental:
 *
 *   - it is inside the stream, so it happens while the response is still open
 *     and the isolate is still alive. A Worker may be torn down the moment the
 *     response completes;
 *   - it is in a `finally`, so an abandoned or failed turn still records what it
 *     managed to do. An audit that only survives success is not an audit.
 *
 * AND THE `finally` IS NOW HELD OPEN BY `ctx.waitUntil` (BUG-46). This comment
 * used to say `ctx.waitUntil` was not reachable from here, which was true of
 * the code and not of the runtime — nothing had threaded the `ExecutionContext`
 * this far. It cost an operator a turn. A reload aborts the SSE, the next
 * `controller.enqueue` throws on the cancelled stream, that runs the generator's
 * `finally` — where the library appends `turn_end` and awaits `sync()` — and
 * that drain is a multi-round-trip D1 sequence starting AFTER the client has
 * gone, with nothing left holding the request open. The turn's tool calls had
 * already committed; only the transcript died. Registering the stream's
 * completion means the drain and this audit flush both outlive the client that
 * walked away, which is what makes a COMPLETED turn durable under a reload race.
 *
 * It does not make an in-flight turn durable — that is the junction's business,
 * and in this Worker the junction is RAM (`ai.ts`), so an isolate evicted
 * mid-turn still loses it. Rendering from the junction is what narrows the
 * window; only a Durable Object would close it.
 *
 * AN ERROR MID-TURN BECOMES A FRAME, not a torn connection. The status line went
 * out with the first byte, so there is no status code left to change — the panel
 * has to be told in the channel it is already reading, and a dropped socket
 * would render as a turn that simply stopped.
 */
function streamTurn(
  host: WorkerHost,
  sessionId: string,
  text: string,
  scrub: (text: string) => string,
  ctx?: RouteContext,
): Response {
  const encoder = new TextEncoder()
  const frame = (event: unknown): Uint8Array =>
    encoder.encode(`data: ${JSON.stringify(event)}\n\n`)

  // WHAT `waitUntil` IS GIVEN, and why it is a promise of its own rather than
  // whatever `start` returns. The runtime needs one promise that settles when
  // the WORK is done, and it must never reject: a rejected `waitUntil` is an
  // invocation error, and every failure worth reporting here has already been
  // sent to the client as a frame or deliberately swallowed below.
  let settle = (): void => {}
  const drained = new Promise<void>((resolve) => {
    settle = resolve
  })
  ctx?.waitUntil(drained)

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      // ENQUEUEING ONTO A STREAM THE CLIENT MAY HAVE ABANDONED THROWS, and that
      // throw is load-bearing on the happy path — it is how an aborted SSE stops
      // the turn, and the library records the result as `aborted` rather than
      // discarding it. So it is caught where it must not propagate (the error
      // path, and the close below) and left to propagate where it must (the
      // loop). What changed in BUG-46 is only who is holding the isolate open
      // while the resulting drain runs.
      const tell = (event: unknown): void => {
        try {
          controller.enqueue(frame(event))
        } catch {
          // The reader is gone. Nothing to say and nobody to say it to.
        }
      }
      try {
        for await (const event of streamPrompt(sessionId, text, {}, host.deps)) {
          controller.enqueue(frame(event))
        }
      } catch (err) {
        const message =
          err instanceof UnknownSessionError
            ? 'That conversation is no longer open — reload the builder to start it again.'
            : err instanceof Error
              ? err.message
              : String(err)
        // The backend is the one component here that holds the credential, so
        // this is the error path most likely to carry it — AC4.
        tell({ kind: 'text', content: `\n\n_${scrub(message)}_` })
        tell({ kind: 'done' })
      } finally {
        // Durable before the response ends. A failure to write the audit must
        // not also fail the turn the operator already had — the records are
        // gone either way, and taking the answer with them helps nobody.
        try {
          await host.flush(sessionId)
        } catch {
          // Deliberately swallowed; see above.
        }
        try {
          controller.close()
        } catch {
          // Already cancelled by the client; closing it again is not an error
          // worth failing the drain over.
        }
        // LAST, unconditionally. Everything above has either finished or been
        // swallowed, so this is the moment the isolate is genuinely free to go.
        settle()
      }
    },
  })

  return new Response(stream, {
    status: 200,
    headers: {
      'content-type': 'text/event-stream; charset=utf-8',
      // The turn is generated as it goes; a proxy holding it back would turn a
      // streaming answer into a long silence and then a wall of text.
      'x-content-type-options': 'nosniff',
    },
  })
}

/**
 * The tail from `cursor`, as the SAME `data: {json}` frames {@link streamTurn}
 * sends (BUG-46).
 *
 * SAME FRAMING BECAUSE IT IS THE SAME CONVERSATION. `host-core.ts` projects the
 * junction's records into the library's stream vocabulary, so what arrives here
 * is already what a live turn yields — which is what lets the pane's existing
 * SSE reader consume a reattach with no idea it is one. A second frame shape
 * would be a second parser to keep in step for no gain.
 *
 * A SHORTER `finally` THAN THE PROMPT ROUTE'S, and deliberately so: there is no
 * audit to flush and no drain to protect, because a subscriber writes nothing.
 * Closing the controller is the whole of it.
 */
function streamTail(
  host: WorkerHost,
  sessionId: string,
  cursor: number,
  scrub: (text: string) => string,
): Response {
  const encoder = new TextEncoder()
  const frame = (event: unknown): Uint8Array =>
    encoder.encode(`data: ${JSON.stringify(event)}\n\n`)

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const event of tailSession(sessionId, cursor, {}, host.deps)) {
          controller.enqueue(frame(event))
        }
      } catch (err) {
        const message =
          err instanceof UnknownSessionError
            ? 'That conversation is no longer open — reload the builder to start it again.'
            : err instanceof Error
              ? err.message
              : String(err)
        try {
          // Scrubbed on the same grounds the prompt route scrubs (AC4): this is
          // a different route but the same secrets and the same operator.
          controller.enqueue(frame({ kind: 'text', content: `\n\n_${scrub(message)}_` }))
          controller.enqueue(frame({ kind: 'done' }))
        } catch {
          // The reader is gone; a reattach nobody is reading needs no epilogue.
        }
      } finally {
        try {
          controller.close()
        } catch {
          // Already cancelled by the client.
        }
      }
    },
  })

  return new Response(stream, {
    status: 200,
    headers: {
      'content-type': 'text/event-stream; charset=utf-8',
      'x-content-type-options': 'nosniff',
    },
  })
}

/** Render `rel` out of a draft-side channel and answer with it. */
async function servePreview(
  store: TenantSiteStore,
  slug: string,
  channel: PreviewChannel,
  rel: string,
): Promise<Response> {
  let file
  try {
    file = await previewRenderer(store).file(slug, channel, rel)
  } catch (err) {
    // A definition that no longer validates is the one failure this route can
    // hit that the OPERATOR can fix, and it is visible the moment it happens
    // rather than hidden behind the last good render. It answers in the iframe,
    // as a page, because that is where they are looking — a JSON envelope would
    // render as a wall of escaped text.
    if (!(err instanceof InvalidDefinitionError)) throw err
    const body = `<!doctype html><meta charset="utf-8"><title>Invalid draft</title>
<body style="font:14px/1.6 ui-monospace,monospace;padding:2rem;color:#b00">
<h1 style="font-size:1rem">This draft does not validate</h1>
<pre>${escapeHtml(err.errors.map((e) => `${e.path}: ${e.message}`).join('\n'))}</pre>
</body>`
    return new Response(body, {
      status: 500,
      headers: { 'content-type': 'text/html; charset=utf-8' },
    })
  }

  if (!file) return text(404, 'Not found')
  // Text or bytes, one response. An asset arrives as bytes rather than as a
  // filename to stream: the store owns where they live, and a store with no
  // filesystem has no name to hand over.
  // Cast because this module is typechecked under two libs: the Worker's, where
  // a Uint8Array is a BodyInit, and tools/generate's, where the DOM's narrower
  // union does not name it. The runtime accepts both.
  const body = (file.kind === 'text' ? file.body : file.body) as unknown as BodyInit
  return new Response(body, {
    status: 200,
    headers: { 'content-type': file.contentType },
  })
}

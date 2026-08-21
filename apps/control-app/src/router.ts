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
  UnknownSessionError,
} from '../../../tools/generate/src/cli/ai/host-core'
import { workerHost, type WorkerHost } from './ai'
import { chromeHtml } from './chrome'
import { redactor } from './redact'
import { storeFor, storeForImport, TenantNotConfiguredError, type StoreEnv } from './store'

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
 * The chat host, ONE PER ISOLATE, and deliberately not per request (REQ-146).
 *
 * Every other route builds its store per request, because `forTenant` performs
 * the tenant check and a cached handle would carry a check made against a row
 * that may since have been deactivated. The chat routes cannot do that: the AI
 * host keys its `SessionManager` cache by the store's OBJECT IDENTITY, so a new
 * store per request is a new manager per request — the conversation would reset
 * on every turn and the junction would be empty every time.
 *
 * So the chat host holds its own store for the life of the isolate. The tenant
 * is still checked, once, when it is built; what is given up is re-checking a
 * deactivation mid-isolate, on these two routes only. That is the right way
 * round here and the wrong way round everywhere else, which is why it is stated
 * rather than shared.
 */
let CHAT: Promise<WorkerHost> | null = null

function chatHost(env: RouterEnv, deps: RouterDeps): Promise<WorkerHost> {
  if (!CHAT) {
    CHAT = (async () => {
      const tenantId = (env.TENANT_ID ?? '').trim()
      const store = await (deps.store ?? storeFor)(env)
      return workerHost(env, store, tenantId)
    })()
  }
  return CHAT
}

/** Drop the cached chat host. For tests that rebuild bindings per case. */
export function resetChatHost(): void {
  CHAT = null
}

function previewRenderer(store: TenantSiteStore): PreviewRenderer {
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

export interface RouterEnv extends StoreEnv {
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
  store?: (env: RouterEnv) => Promise<TenantSiteStore>
  /** The store an import writes through — it may register the configured tenant. */
  importStore?: (env: RouterEnv) => Promise<TenantSiteStore>
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

function uncacheable(response: Response): Response {
  const headers = new Headers(response.headers)
  headers.set('cache-control', NO_STORE)
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}

export async function route(
  request: Request,
  env: RouterEnv,
  deps: RouterDeps = {},
): Promise<Response> {
  return uncacheable(await routeUncached(request, env, deps))
}

async function routeUncached(
  request: Request,
  env: RouterEnv,
  deps: RouterDeps = {},
): Promise<Response> {
  const url = new URL(request.url)
  const p = url.pathname
  const method = request.method

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
      // This route runs BEFORE `storeFor` below, and uses its own handle,
      // because `forTenant` refuses an unknown tenant — which on a fresh
      // database is every request, including the one that would populate it.
      // `storeForImport` registers the configured tenant and no other.
      const importStore = await (deps.importStore ?? storeForImport)(env)
      await importStore.createDraft(payload.slug)
      const write = payloadToWrite(payload)
      await importStore.write(payload.slug, write)
      return json(200, {
        pages: write.pages.length,
        assets: write.assets.length,
        siteJson: write.siteJson !== undefined,
      })
    } catch (err) {
      // Applied here too, though this route never touches a credential: a path
      // that scrubs and a path that does not is an invitation to add a third
      // that does not, and the cost when there is nothing to scrub is nil.
      const scrub = redactor(secretsOf(env))
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
    opening ??= (deps.store ?? storeFor)(env)
    return opening
  }
  // `actor: 'client'` — REQ-131. A write arriving on these routes is the
  // operator's own hand in the builder, and the journal says so, which is the
  // difference between the assistant reading "you changed this" and reading
  // "something changed".
  const edit = async () => ({ store: await openStore(), actor: 'client' as const })

  try {
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
      const host = await chatHost(env, deps)
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
      const host = await chatHost(env, deps)
      return streamTurn(host, sessionId, text, redactor(secretsOf(env)))
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

    const scrub = redactor(secretsOf(env))
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
 *     response completes, and `ctx.waitUntil` is not reachable from here;
 *   - it is in a `finally`, so an abandoned or failed turn still records what it
 *     managed to do. An audit that only survives success is not an audit.
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
): Response {
  const encoder = new TextEncoder()
  const frame = (event: unknown): Uint8Array =>
    encoder.encode(`data: ${JSON.stringify(event)}\n\n`)

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
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
        controller.enqueue(frame({ kind: 'text', content: `\n\n_${scrub(message)}_` }))
        controller.enqueue(frame({ kind: 'done' }))
      } finally {
        // Durable before the response ends. A failure to write the audit must
        // not also fail the turn the operator already had — the records are
        // gone either way, and taking the answer with them helps nobody.
        try {
          await host.flush(sessionId)
        } catch {
          // Deliberately swallowed; see above.
        }
        controller.close()
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

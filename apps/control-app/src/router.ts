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
import type { RenderSiteOptions } from '../../../tools/generate/src/render/render'
import { payloadToWrite, type SitePayload } from '../../../tools/generate/src/cli/push'
import type { TenantSiteStore } from '../../../tools/generate/src/store/d1r2-store'
import {
  openSession,
  streamPrompt,
  UnknownSessionError,
} from '../../../tools/generate/src/cli/ai/host-core'
import { workerHost, type WorkerHost } from './ai'
import { chromeHtml } from './chrome'
import { redactor } from './redact'
import { storeFor, storeForImport, type StoreEnv } from './store'

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
 * PUBLISH ANSWERS 501, deliberately and by name: it needs revision storage the
 * port does not have ([[REQ-149]]). A 404 would read as a routing bug and send
 * someone looking for the handler that was lost; a 501 naming the ticket says
 * what is true — the route exists, the capability does not yet.
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

function previewRenderer(
  store: TenantSiteStore,
  render: RouterDeps['render'],
): PreviewRenderer {
  let renderer = PREVIEWS.get(store)
  if (!renderer) {
    renderer = new PreviewRenderer(store, render)
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

/** A capability this Worker does not have yet, named by the ticket that lands it. */
function notImplemented(what: string, ticket: string): Response {
  return json(501, {
    error: `${what} is not available in the Worker yet — ${ticket}.`,
    ticket,
  })
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
 * The Worker supplies neither and gets the defaults: a D1/R2 store from its
 * bindings, and no render seam, which is what confines it to L1 (REQ-148).
 * `1c builder`'s Node transport supplies both — a filesystem-backed store and
 * the Astro container — so the test suite and the operator's local loop drive
 * the SAME routing, edits and render as production rather than a second
 * implementation that agrees with it today.
 */
export interface RouterDeps {
  /** The store this request reads and writes through. */
  store?: (env: RouterEnv) => Promise<TenantSiteStore>
  /** The store an import writes through — it may register the configured tenant. */
  importStore?: (env: RouterEnv) => Promise<TenantSiteStore>
  /**
   * The Astro container and module resolver, for a host that can supply them.
   * Absent means a page mounting a behavior fails by name — see REQ-148.
   */
  render?: Pick<RenderSiteOptions, 'createContainer' | 'resolveModule'>
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

  // Still deferred, and answered before the store is constructed: it does not
  // need one, and a store failure here would misreport why it is refused.
  // Publishing needs revision storage the port does not have — REQ-149.
  if (p === '/api/publish') {
    return notImplemented('Publishing', 'REQ-149')
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

  const store = await (deps.store ?? storeFor)(env)
  // `actor: 'client'` — REQ-131. A write arriving on these routes is the
  // operator's own hand in the builder, and the journal says so, which is the
  // difference between the assistant reading "you changed this" and reading
  // "something changed".
  const edit = { store, actor: 'client' as const }

  try {
    if (p === '/api/sites' && method === 'GET') {
      // `latest` is null for every site: this store holds no revisions, and
      // saying so is better than implying one. `publish` mints them and is
      // REQ-149; until then the site selector shows an unpublished site, which
      // is what it is.
      const slugs = await store.slugs()
      return json(200, slugs.map((slug) => ({ slug, latest: null })))
    }

    if (p === '/api/assets' && method === 'GET') {
      const slug = url.searchParams.get('slug')
      if (!slug) return json(400, { error: 'slug is required' })
      return json(200, (await editAssetList(slug, edit)).data)
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
      return json(200, (await editPaletteGet(slug, edit)).data)
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
      const out =
          op === 'set'
            ? await editPaletteSet(slug, name, value, edit)
            : op === 'add'
              ? await editPaletteAdd(slug, name, value, edit)
              : op === 'rm'
                ? await editPaletteRm(slug, name, edit)
                : await editPaletteRename(slug, name, String(to ?? ''), edit)
      // The census travels back with every write, so the popup redraws from
      // what the store now holds rather than from its own guess at it — a
      // rename changes one name and no count, a delete changes the list, and
      // the client needs neither to know which.
      const census = (await editPaletteGet(slug, edit)).data as Record<string, unknown>
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
      const scoped = (read: (k: string) => string | undefined) => ({
      ...edit,
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
      return json(200, (await editCopyGet(slug, page, addr, scoped(get))).data)
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
          scoped(get),
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
     */
    const preview = p.match(/^\/preview\/([^/]+)\/([^/]+)(\/.*)?$/)
    if (preview) {
      const slug = decodeURIComponent(preview[1])
      const channel = decodeURIComponent(preview[2])
      if (channel === 'published') {
      return notImplemented('The published channel', 'REQ-149')
      }
      if (!PREVIEW_CHANNELS.includes(channel as PreviewChannel)) {
      return text(404, 'Unknown channel')
      }
      return servePreview(store, slug, channel as PreviewChannel, preview[3] ?? '/', deps.render)
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
    const scrub = redactor(secretsOf(env))
    if (err instanceof CommandError) {
      return json(400, { error: scrub(err.message), ...err.toEnvelope() })
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
  render: RouterDeps['render'],
): Promise<Response> {
  let file
  try {
    file = await previewRenderer(store, render).file(slug, channel, rel)
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

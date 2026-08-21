import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { route, type RouterDeps, type RouterEnv } from '../../../../apps/control-app/src/router'
import type { SiteStore, StoreContext } from '../store'
import { fsSiteStore } from '../store'
import type { TenantSiteStore } from '../store/d1r2-store'
import { aiStatus, openSession, streamPrompt, UnknownSessionError } from './ai/host'
import { cmdList, ctxOf, type GlobalOptions } from './commands'
import { resolveStaticFile } from './serve'
import { MIME } from '../store/content-type'

/**
 * The builder's **Node transport** (REQ-145).
 *
 * WHAT THIS FILE USED TO BE. A 730-line origin with its own route table, its own
 * static file server, and a request-time TypeScript transpiler — the whole
 * builder, in Node, because a Worker could reach none of what it needed. All of
 * that is gone: the routes are `apps/control-app/src/router.ts`, the static
 * files are build artifacts (`1c assets`), and the store is D1 + R2.
 *
 * WHY IT STILL EXISTS AT ALL, and why that is not a second code path. What is
 * left is a **transport**: `node:http` in, `Request`/`Response` out, straight
 * into the same `route()` the deployed Worker calls. There is one route table,
 * one set of edit functions, one render. `CLAUDE.md` forbids two
 * implementations; this is one implementation with two front doors, and the
 * difference is checkable — nothing below decides what a route does.
 *
 * It buys two things that would otherwise cost a great deal. The suite drives
 * the builder over real HTTP from thirty-six test files, most of them about
 * features that merely need an origin (the copy modal, the image picker, the
 * palette popup); and this transport can supply an Astro container, so those
 * tests keep covering behavior-module pages that the Worker cannot render until
 * [[REQ-148]].
 *
 * `1c builder` NO LONGER STARTS THIS. It starts `wrangler dev`, which is the
 * real thing — same routes, same store, same runtime as production. See
 * `cli/index.ts`.
 *
 * ONE ROUTE LIVES HERE AND NOWHERE ELSE: `/api/ai/*`, which needs a library that
 * loads itself from an out-of-repo artifact store by file URL
 * (lagrange-framework REQ-103). It is not a duplicate — the Worker has no
 * implementation of it — and it moves to the router the moment that ticket lands.
 *
 * `/api/publish` AND THE `published` CHANNEL USED TO BE HERE TOO, intercepted on
 * the way past and answered from the filesystem revision store. [[REQ-149]] put
 * revisions on the port, so the router's own handlers serve both — and the
 * interceptions are DELETED rather than kept as a local fast path. They were the
 * one place where this transport and the deployed Worker disagreed about what a
 * route does, which is exactly the thing this file exists not to be.
 */

export interface BuilderOptions extends GlobalOptions {
  port?: number
}

export interface BuilderHandle {
  server: http.Server
  url: string
  port: number
  close: () => Promise<void>
}

/**
 * The filesystem store, presented as the tenant-scoped handle the router takes.
 *
 * The router asks for a {@link TenantSiteStore} because that is what the cloud
 * adapter hands back; the filesystem has no tenants, so the local operator IS
 * the tenant and the extra verbs are answered from the directory tree. Nothing
 * here reimplements a read or a write — every one is `fsSiteStore`'s.
 */
function localTenantStore(ctx: StoreContext, store: SiteStore): TenantSiteStore {
  return Object.assign(Object.create(Object.getPrototypeOf(store) as object) as object, store, {
    tenantId: 'local',
    slugs: async () => cmdList({ cwd: ctx.cwd, sandbox: ctx.root === 'sandbox' }).map((s) => s.slug),
    createDraft: async () => {
      // `1c new` creates a site; this handle is opened over one that exists.
      throw new Error('The local builder transport does not create sites — use `1c new`.')
    },
    forget: async () => {
      throw new Error('The local builder transport does not delete sites — use the filesystem.')
    },
  }) as TenantSiteStore
}

const STORES = new Map<string, SiteStore>()

export function builderStore(ctx: StoreContext): SiteStore {
  const key = `${ctx.cwd} ${ctx.root}`
  let store = STORES.get(key)
  if (!store) {
    store = fsSiteStore(ctx)
    STORES.set(key, store)
  }
  return store
}

const TENANT_STORES = new Map<string, TenantSiteStore>()

/** What this transport supplies that the Worker does not: a filesystem and Astro. */
function depsFor(ctx: StoreContext): RouterDeps {
  // Memoised per workspace: the router caches a `PreviewRenderer` against the
  // store OBJECT, so handing back a new one per request would rebuild the render
  // cache on every fetch.
  const key = `${ctx.cwd} ${ctx.root}`
  const store = async () => {
    let handle = TENANT_STORES.get(key)
    if (!handle) {
      handle = localTenantStore(ctx, builderStore(ctx))
      TENANT_STORES.set(key, handle)
    }
    return handle
  }
  return {
    store,
    importStore: store,
  }
}

/**
 * The env the router reads. There are no Cloudflare bindings in Node, and the
 * ones the router would use are replaced by {@link depsFor} — so these are the
 * unreachable stubs, not a local implementation of D1.
 */
function envFor(ctx: StoreContext): RouterEnv {
  const unavailable = (what: string) => () => {
    throw new Error(`${what} is not available in the local builder transport.`)
  }
  return {
    DB: new Proxy({}, { get: unavailable('D1') }) as D1Database,
    SITES: new Proxy({}, { get: unavailable('R2') }) as R2Bucket,
    TENANT_ID: 'local',
    ASSETS: assetsFetcher(ctx),
  }
}

/**
 * The assets binding, backed by the directory `1c assets` writes.
 *
 * THE SAME BYTES, delivered differently. Cloudflare's binding serves
 * `dist-assets/`; this reads the same directory off disk. Nothing is rebuilt,
 * re-derived or type-stripped here — that would be the second implementation
 * this file exists to avoid — so what a test sees is what the deployed Worker
 * serves.
 *
 * A MISSING BUILD SAYS SO. Without it every `/builder/*` and `/webui/*` request
 * would 404, and a builder whose client never loads looks like a routing bug
 * rather than a missing step. The 503 names the command.
 */
function assetsFetcher(ctx: StoreContext): Fetcher {
  const dir = assetsDirOf(ctx)
  return {
    fetch: async (input: Request | string) => {
      const url = new URL(typeof input === 'string' ? input : input.url)
      if (!fs.existsSync(dir)) {
        return new Response(
          `The control-app assets have not been built. Run \`1c assets\` (expected ${dir}).`,
          { status: 503, headers: { 'content-type': 'text/plain; charset=utf-8' } },
        )
      }
      const file = await resolveStaticFile(dir, url.pathname)
      if (file === 'forbidden') return new Response('Forbidden', { status: 403 })
      if (!file) return new Response('Not found', { status: 404 })
      return new Response(fs.readFileSync(file), {
        status: 200,
        headers: { 'content-type': MIME[path.extname(file)] ?? 'application/octet-stream' },
      })
    },
  } as unknown as Fetcher
}

/**
 * Where `1c assets` wrote the build output.
 *
 * The assets ship with the CODE, not with the site store — and `ctx.cwd` is the
 * store root, which is a temp directory under test and an arbitrary directory in
 * use. So the store copy is preferred (a repo checkout, where it is the live
 * build) and this module's own location is the fallback, exactly as the old
 * origin resolved its browser source.
 */
const HERE = path.dirname(fileURLToPath(import.meta.url))

function assetsDirOf(ctx: StoreContext): string {
  const inCwd = path.join(ctx.cwd, 'apps', 'control-app', 'dist-assets')
  if (fs.existsSync(inCwd)) return inCwd
  return path.resolve(HERE, '../../../../apps/control-app/dist-assets')
}

/** Collect a `node:http` request into the `Request` the router takes. */
async function toRequest(req: http.IncomingMessage): Promise<Request> {
  const url = new URL(req.url ?? '/', `http://localhost`)
  const method = req.method ?? 'GET'
  const headers = new Headers()
  for (const [k, v] of Object.entries(req.headers)) {
    if (typeof v === 'string') headers.set(k, v)
    else if (Array.isArray(v)) headers.set(k, v.join(', '))
  }
  let body: string | undefined
  if (method !== 'GET' && method !== 'HEAD') {
    const chunks: Buffer[] = []
    for await (const chunk of req) chunks.push(chunk as Buffer)
    body = Buffer.concat(chunks).toString('utf8')
  }
  return new Request(url, { method, headers, body })
}

/** Write a `Response` back out over `node:http`. */
async function send(res: http.ServerResponse, response: Response): Promise<void> {
  const headers: Record<string, string> = {}
  response.headers.forEach((value, key) => {
    headers[key] = value
  })
  const buffer = Buffer.from(await response.arrayBuffer())
  res.writeHead(response.status, { ...headers, 'content-length': buffer.length }).end(buffer)
}

function json(res: http.ServerResponse, status: number, body: unknown): void {
  const payload = JSON.stringify(body)
  res
    .writeHead(status, {
      'content-type': 'application/json; charset=utf-8',
      'content-length': Buffer.byteLength(payload),
    })
    .end(payload)
}

async function readJsonBody(req: http.IncomingMessage): Promise<Record<string, unknown>> {
  const chunks: Buffer[] = []
  for await (const chunk of req) chunks.push(chunk as Buffer)
  if (chunks.length === 0) return {}
  return JSON.parse(Buffer.concat(chunks).toString('utf8')) as Record<string, unknown>
}

/**
 * Project one assistant turn into server-sent events (REQ-122).
 *
 * The library's stream events are forwarded VERBATIM, because that is exactly
 * the shape the chat panel consumes. A failure mid-turn is delivered IN the
 * stream rather than as a status code — the headers are long gone by the time a
 * model call can fail, and a stream that simply stops leaves the panel spinning
 * on a turn that will never arrive. Which is why the headers are written LAZILY
 * (REQ-127): a turn naming a session this origin never issued fails BEFORE any
 * event exists, and deserves a status code rather than an apology rendered into
 * a chat window as though the assistant had tried.
 */
async function streamTurn(
  res: http.ServerResponse,
  sessionId: string,
  text: string,
  opts: BuilderOptions,
): Promise<void> {
  let started = false
  const start = (): void => {
    if (started) return
    started = true
    res.writeHead(200, {
      'content-type': 'text/event-stream; charset=utf-8',
      connection: 'keep-alive',
    })
  }
  const emit = (payload: unknown): void => {
    start()
    res.write(`data: ${JSON.stringify(payload)}\n\n`)
  }
  try {
    for await (const event of streamPrompt(sessionId, text, opts)) {
      emit({ kind: event.kind, content: event.content, meta: event.meta })
    }
  } catch (err) {
    if (!started && err instanceof UnknownSessionError) {
      json(res, 404, { error: err.message })
      return
    }
    emit({
      kind: 'text',
      content: `\n\n_${err instanceof Error ? err.message : String(err)}_`,
    })
    emit({ kind: 'done' })
  }
  start()
  res.end()
}

/**
 * Handle one builder request. Exported so a test can drive the routing table
 * without binding a port.
 */
export async function handleBuilderRequest(
  ctx: StoreContext,
  opts: BuilderOptions,
  req: http.IncomingMessage,
  res: http.ServerResponse,
): Promise<void> {
  const url = new URL(req.url ?? '/', 'http://localhost')
  const p = url.pathname

  /**
   * FRESHNESS, SET ONCE, BEFORE ANY ROUTING — for this transport's OWN routes.
   *
   * The router stamps everything it answers (`router.ts`), and {@link send}
   * carries that through verbatim. The chat routes below never reach the router,
   * so without this they would be the one uncacheable-by-intent origin serving
   * cacheable bytes — the same hole, in the same shape, one layer along.
   * `setHeader` before routing means every `writeHead` here merges it.
   */
  res.setHeader('cache-control', 'no-store, must-revalidate')

  // ── the one capability the Worker does not have ──────────────────────────
  // Not a duplicate of a router route: the deployed Worker has no local model
  // host, so there is nothing here for it to disagree with.
  try {
    if (p === '/api/ai/roles' && req.method === 'GET') {
      json(res, 200, await aiStatus(opts))
      return
    }

    if (p === '/api/ai/session' && req.method === 'POST') {
      const body = await readJsonBody(req)
      if (typeof body.slug !== 'string') {
        json(res, 400, { error: 'slug is required' })
        return
      }
      // 200 even when the assistant cannot run: the answer carries the stored
      // transcript AND the reason, which are independent. Refusing the whole
      // response for a missing API key would throw away the conversation too.
      json(res, 200, await openSession(body.slug, opts))
      return
    }

    if (p === '/api/ai/prompt' && req.method === 'POST') {
      const body = await readJsonBody(req)
      if (typeof body.sessionId !== 'string' || typeof body.text !== 'string') {
        // Named individually, not as a constant pair: a refusal that always says
        // both tells the caller a turn was malformed but not which value it left
        // out — and the request this most often is (a site named instead of a
        // conversation) is exactly the one that needs to hear `sessionId`.
        const missing: string[] = []
        if (typeof body.sessionId !== 'string') missing.push('sessionId')
        if (typeof body.text !== 'string') missing.push('text')
        const verb = missing.length === 1 ? 'is' : 'are'
        json(res, 400, { error: `${missing.join(' and ')} ${verb} required` })
        return
      }
      await streamTurn(res, body.sessionId, body.text, opts)
      return
    }

  } catch (err) {
    json(res, 500, { error: err instanceof Error ? err.message : String(err) })
    return
  }

  // ── everything else: the one route table ─────────────────────────────────
  await send(res, await route(await toRequest(req), envFor(ctx), depsFor(ctx)))
}

/** Start the builder's Node transport. Resolves once it is listening. */
export function startBuilder(opts: BuilderOptions = {}): Promise<BuilderHandle> {
  const ctx = ctxOf(opts)
  const server = http.createServer((req, res) => {
    void handleBuilderRequest(ctx, opts, req, res)
  })

  return new Promise((resolve) => {
    server.listen(opts.port ?? 0, () => {
      const addr = server.address()
      const port = typeof addr === 'object' && addr ? addr.port : (opts.port ?? 0)
      resolve({
        server,
        port,
        url: `http://localhost:${port}/`,
        close: () => new Promise((done) => server.close(() => done())),
      })
    })
  })
}

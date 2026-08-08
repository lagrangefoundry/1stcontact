import fs from 'node:fs'
import http from 'node:http'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { RenderChannel, StoreContext } from '../store'
import { distDir } from '../store'
import { aiStatus, openSession, streamPrompt } from './ai/host'
import { cmdList, cmdPublish, ctxOf, InvalidDefinitionError, type GlobalOptions } from './commands'
import { editAssetList, editCopyGet, editCopySet } from './edit'
import { CommandError } from './errors'
import { fsDraftStore, PreviewRenderer, type PreviewChannel } from './preview'
import { NO_STORE, resolveStaticFile, sendFile } from './serve'
import { WEBUI_PACKAGES, WEBUI_SCOPE, webuiExports, webuiPackageDir } from './webui'

/**
 * The builder's dev origin (REQ-115 / DOC-28 §12 T1).
 *
 * WHY NODE AND NOT THE WORKER. Everything the builder needs is bound to the
 * operator's machine: the `storage/sites/` listing behind the site selector,
 * `publish`, the draft definitions themselves, and the Vite/Astro transform the
 * render path runs through (`bin/1c.mjs`). A Worker has none of those. Moving
 * the render into workerd therefore needs the store to be reachable from
 * workerd, which is DOC-12 §7's *phase 2* — explicitly not this ticket. So the
 * origin stays Node and `control-app` fronts it.
 *
 * REQ-119 / DOC-28 §12 T5 has nonetheless landed the part that was actually
 * load-bearing: `draft` and `edit` are rendered **at request time** from the
 * definition (see `preview.ts`), through the one render `1c render` also uses.
 * No pre-rendered artifact is required, and a save no longer re-materialises two
 * whole channels to disk. What remains of T5 is only the runtime relocation.
 *
 * Everything is served same-origin from this one server, so the preview iframe
 * is never cross-origin and "open in new tab" resolves to the identical URL.
 */

const HERE = path.dirname(fileURLToPath(import.meta.url))

export interface BuilderOptions extends GlobalOptions {
  port?: number
  /** Where the builder's own browser source lives. Defaults to the repo copy. */
  clientDir?: string
}

export interface BuilderHandle {
  server: http.Server
  url: string
  port: number
  close: () => Promise<void>
}

/** The builder's browser source, resolved from `cwd` so a test can point elsewhere. */
function clientDirOf(ctx: StoreContext, opts: BuilderOptions): string {
  if (opts.clientDir) return opts.clientDir
  const inRepo = path.join(ctx.cwd, 'apps', 'control-app', 'src', 'builder')
  if (fs.existsSync(inRepo)) return inRepo
  // Fall back to this file's own location when run from a packaged install.
  return path.resolve(HERE, '../../../../apps/control-app/src/builder')
}

/**
 * The chrome document.
 *
 * The import map is DERIVED from each component's own `exports` map rather than
 * hardcoding `src/index.js`, so upstream is free to move its files without
 * silently breaking us — a missing export surfaces as a build-time throw here
 * instead of a 404 in the browser.
 */
export function chromeHtml(): string {
  const imports: Record<string, string> = {}
  const styles: string[] = []
  for (const name of WEBUI_PACKAGES) {
    const exp = webuiExports(name)
    for (const [subpath, target] of Object.entries(exp)) {
      const url = `/webui/${name}/${target.replace(/^\.\//, '')}`
      // Composed from the single scope declaration, never restated: a second
      // copy here is what let the last rename go half-completed.
      if (subpath === '.') imports[`${WEBUI_SCOPE}/${name}`] = url
      else if (target.endsWith('.css')) styles.push(url)
      else imports[`${WEBUI_SCOPE}/${name}/${subpath.replace(/^\.\//, '')}`] = url
    }
  }
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>1st Contact builder</title>
${styles.map((href) => `<link rel="stylesheet" href="${href}">`).join('\n')}
<link rel="stylesheet" href="/builder/builder.css">
<script type="importmap">${JSON.stringify({ imports })}</script>
</head>
<body>
<div id="app"></div>
<script type="module" src="/builder/main.js"></script>
</body>
</html>
`
}

/**
 * Locate a file that ships with the CODE, not with the site store.
 *
 * `ctx.cwd` is the store root — the thing holding `storage/sites/…` — and it is
 * a temp directory under test and an arbitrary directory in use. Source that
 * ships with the tool is only found there when the two happen to coincide, so
 * this prefers the store copy (a repo checkout, where it is the live file) and
 * otherwise falls back to this module's own location, exactly as
 * {@link clientDirOf} does for the builder's browser source.
 */
function repoFile(ctx: StoreContext, rel: string): string {
  const inCwd = path.join(ctx.cwd, rel)
  if (fs.existsSync(inCwd)) return inCwd
  return path.resolve(HERE, '../../../..', rel)
}

/**
 * Strip the types off one module and point its package import at the sibling
 * this origin serves. `transpileModule` is per-file and does no checking, which
 * is what makes it safe to do per request — correctness is the typechecker's
 * job, and it has already run over these files in CI.
 */
function transpileForBrowser(absPath: string): string {
  // Required lazily: `typescript` is a devDependency, and a packaged install
  // that never opens the builder should not fail to load this module over it.
  const require = createRequire(import.meta.url)
  const ts = require('typescript') as typeof import('typescript')
  const out = ts.transpileModule(fs.readFileSync(absPath, 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
  })
  return out.outputText.replace(
    /(['"])@1stcontact\/site-schema\1/g,
    "'/framework/site-schema-edit.js'",
  )
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

async function readJsonBody(req: http.IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = []
  for await (const chunk of req) chunks.push(chunk as Buffer)
  if (chunks.length === 0) return {}
  return JSON.parse(Buffer.concat(chunks).toString('utf8'))
}

const CHANNELS: RenderChannel[] = ['draft', 'published', 'edit']

/**
 * Project one assistant turn into server-sent events (REQ-122).
 *
 * The library's stream events (`text` / `tool_activity` / `done`) are forwarded
 * VERBATIM, because that is exactly the shape the chat panel consumes. Anything
 * this transport reshaped would be a second vocabulary to keep in step with the
 * component's, for no gain.
 *
 * A failure mid-turn is delivered IN the stream rather than as a status code:
 * the headers are long gone by the time a model call can fail, and a stream that
 * simply stops leaves the panel spinning on a turn that will never arrive. So the
 * error is written as prose the operator can read, followed by the terminal
 * `done` that releases the composer.
 */
async function streamTurn(
  res: http.ServerResponse,
  slug: string,
  text: string,
  opts: BuilderOptions,
): Promise<void> {
  res.writeHead(200, {
    'content-type': 'text/event-stream; charset=utf-8',
    connection: 'keep-alive',
  })
  const send = (payload: unknown): void => {
    res.write(`data: ${JSON.stringify(payload)}\n\n`)
  }
  try {
    for await (const event of streamPrompt(slug, text, opts)) {
      send({ kind: event.kind, content: event.content, meta: event.meta })
    }
  } catch (err) {
    send({
      kind: 'text',
      content: `\n\n_${err instanceof Error ? err.message : String(err)}_`,
    })
    send({ kind: 'done' })
  }
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
   * FRESHNESS, SET ONCE, FOR EVERY RESPONSE THIS HANDLER CAN PRODUCE.
   *
   * This origin rewrites its own bytes underneath the browser — a save
   * re-renders the very channel the frame is displaying — so a single cacheable
   * response leaves an operator looking at a stale page that appears to be
   * working. `setHeader` before any routing means the directive is merged into
   * every `writeHead` below (`writeHead`'s own fields still win, and none of
   * them names `cache-control`): the served trees, the hand-written document,
   * every JSON envelope, and every 400/403/404/500.
   *
   * It is set HERE rather than restated per route because a per-route
   * restatement is precisely how the last hole opened: `json()` was written
   * with its own two headers and never carried the directive, so `/api/sites` —
   * the response that populates the site selector — was cacheable, and a newly
   * created site could stay invisible behind a workspace that looked correct.
   * A route added tomorrow inherits the directive instead of needing to
   * remember it.
   */
  res.setHeader('cache-control', NO_STORE)

  try {
    if (p === '/' || p === '/index.html') {
      const html = chromeHtml()
      res
        .writeHead(200, {
          'content-type': 'text/html; charset=utf-8',
          'content-length': Buffer.byteLength(html),
          // No `cache-control` here: the handler set it for every response
          // before routing. This document used to restate it, which read as
          // "the shell is the special case" and left the reader believing the
          // rest of the origin was covered when the JSON routes were not.
        })
        .end(html)
      return
    }

    if (p === '/api/sites' && req.method === 'GET') {
      json(res, 200, cmdList(opts))
      return
    }

    if (p === '/api/publish' && req.method === 'POST') {
      const body = (await readJsonBody(req)) as { slug?: string; message?: string }
      if (!body.slug) {
        json(res, 400, { error: 'slug is required' })
        return
      }
      const result = await cmdPublish(body.slug, { ...opts, message: body.message })
      json(res, 200, { id: result.id, changes: result.changes })
      return
    }

    /**
     * The assistant (REQ-122).
     *
     * Three routes, mirroring the reference host contract in the AI component's
     * own showcase (`components/ai/py/showcase/ai_host.py`) rather than inventing
     * a shape: what is available, open a conversation, run a turn.
     *
     * `/api/ai/prompt` takes the SLUG and not a session id. The id is derived
     * from the slug (`sessionIdFor`), so carrying one over the wire would add a
     * value the client could send stale — it would have to sequence "open, then
     * send" correctly across every site switch, and get it wrong exactly once.
     * Naming the site instead makes a turn self-sufficient.
     */
    if (p === '/api/ai/roles' && req.method === 'GET') {
      json(res, 200, await aiStatus(opts))
      return
    }

    if (p === '/api/ai/session' && req.method === 'POST') {
      const body = (await readJsonBody(req)) as { slug?: string }
      if (!body.slug) {
        json(res, 400, { error: 'slug is required' })
        return
      }
      // 200 even when the assistant cannot run: the answer carries the stored
      // transcript AND the reason, which are independent. Refusing the whole
      // response for a missing API key would throw away the conversation as
      // well, leaving the panel with nothing to show and nothing to explain.
      json(res, 200, await openSession(body.slug, opts))
      return
    }

    if (p === '/api/ai/prompt' && req.method === 'POST') {
      const body = (await readJsonBody(req)) as { slug?: string; text?: string }
      if (!body.slug || typeof body.text !== 'string') {
        json(res, 400, { error: 'slug and text are required' })
        return
      }
      await streamTurn(res, body.slug, body.text, opts)
      return
    }

    /**
     * The site's assets (REQ-118 AC-7).
     *
     * The image modal does NOT need this: `editCopyGet` already embeds the
     * choices in the `src` descriptor, so a picker costs zero extra round trips
     * and cannot render options that disagree with what the write path will
     * accept. The route exists because the listing is genuinely independent of
     * the modal — DOC-28 §9.2's asset browser mode is the same store surfaced
     * as a tab, and it reaches it here rather than growing its own.
     */
    if (p === '/api/assets' && req.method === 'GET') {
      const slug = url.searchParams.get('slug')
      if (!slug) {
        json(res, 400, { error: 'slug is required' })
        return
      }
      json(res, 200, editAssetList(slug, opts).data)
      return
    }

    /**
     * The modal's two calls (REQ-117 / DOC-28 §4).
     *
     * Both are thin transports over `editCopyGet` / `editCopySet` — the SAME
     * functions `1c copy get|set` dispatch to, not a parallel implementation.
     * That is the whole point of the loop: the editor is a second *producer* of
     * structured edits, not a second write path. Validation, atomicity and the
     * re-render all stay where they already live, and nothing here can bypass
     * them because nothing here does any of that work itself.
     */
    if (p === '/api/copy') {
      const scope = (q: URLSearchParams | Record<string, unknown>) => {
        const read = (k: string): string | undefined => {
          const v = q instanceof URLSearchParams ? q.get(k) : q[k]
          return typeof v === 'string' && v !== '' ? v : undefined
        }
        return { ...opts, module: read('module'), slot: read('slot') }
      }

      if (req.method === 'GET') {
        const q = url.searchParams
        const [slug, page, addr] = [q.get('slug'), q.get('page'), q.get('path')]
        if (!slug || !page || !addr) {
          json(res, 400, { error: 'slug, page and path are required' })
          return
        }
        json(res, 200, editCopyGet(slug, page, addr, scope(q)).data)
        return
      }

      if (req.method === 'POST') {
        const body = (await readJsonBody(req)) as Record<string, unknown>
        const [slug, page, addr] = [body.slug, body.page, body.path]
        if (typeof slug !== 'string' || typeof page !== 'string' || typeof addr !== 'string') {
          json(res, 400, { error: 'slug, page and path are required' })
          return
        }
        const values = body.values
        if (values === null || typeof values !== 'object' || Array.isArray(values)) {
          json(res, 400, { error: 'values must be an object of field → string' })
          return
        }
        // Write first, re-render second, and only report success once BOTH have
        // happened. `editCopySet` throws on an invalid edit before writing a
        // byte, so a failure here leaves the draft and the rendered bytes
        // exactly as the user left them — the iframe they are looking at is
        // still accurate, which is what makes "surface the error" safe.
        const out = editCopySet(slug, page, addr, values as Record<string, unknown>, scope(body))
        // REQ-119 — and nothing else. The save used to re-render BOTH channels
        // to disk here, because whichever one it skipped would go on serving the
        // page as it used to be, with nothing to signal the staleness. Rendering
        // on request retires the whole question: the next fetch of either
        // channel renders the definition this write just produced, so there is
        // no artifact left for a save to have to keep in step.
        json(res, 200, out.data)
        return
      }
    }

    /**
     * /preview/<slug>/<channel>/<...> — a rendered channel.
     *
     * `draft` and `edit` are rendered ON REQUEST from the draft definition
     * (REQ-119). `published` is not: it is the immutable artifact `publish`
     * produced from a locked revision, and re-deriving it from today's draft
     * would make the published channel show unpublished work — so it is still
     * served off disk, from exactly the bytes `public-site` will serve.
     */
    const preview = p.match(/^\/preview\/([^/]+)\/([^/]+)(\/.*)?$/)
    if (preview) {
      const slug = decodeURIComponent(preview[1])
      const channel = decodeURIComponent(preview[2]) as RenderChannel
      if (!CHANNELS.includes(channel)) {
        res.writeHead(404, { 'content-type': 'text/plain' }).end('Unknown channel')
        return
      }
      const rel = preview[3] ?? '/'
      if (channel === 'published') {
        await serveTree(res, distDir(ctx, slug, channel), rel)
        return
      }
      await servePreview(ctx, res, slug, channel, rel)
      return
    }

    /**
     * The edit bridge, as browser JS (REQ-117).
     *
     * The bridge is TypeScript in `packages/framework`, and it must STAY the one
     * implementation: it reads the same stamp the renderer writes, and a second
     * hand-written copy in `apps/control-app` would be free to drift from the
     * markup — the exact coupling `edit-client.ts` says it exists to prevent. So
     * the source is served, type-stripped, rather than reimplemented.
     *
     * Type-stripping is enough here, and bundling is not needed, because BOTH
     * files' only runtime import is each other: `l1/edit.ts` imports nothing at
     * runtime (its one import is `import type`), and `edit-client.ts` imports
     * only `@1stcontact/site-schema`, rewritten below to the sibling URL. Two
     * files, one rewrite — if that ever stops being true this route should
     * become a real build step rather than growing a resolver.
     */
    const fw = p.match(/^\/framework\/(edit-client|site-schema-edit)\.js$/)
    if (fw) {
      const js = transpileForBrowser(
        repoFile(
          ctx,
          fw[1] === 'edit-client'
            ? 'packages/framework/src/l1/edit-client.ts'
            : 'packages/site-schema/src/l1/edit.ts',
        ),
      )
      res
        .writeHead(200, {
          'content-type': 'text/javascript; charset=utf-8',
          // Read off disk every time, and served uncacheable by the directive
          // the handler already set — this is a dev origin, and a cached bridge
          // after an edit to the source is a confusing way to lose an
          // afternoon. (It carried its own bare `no-store` before, a
          // near-miss of the directive every other response uses.)
          'content-length': Buffer.byteLength(js),
        })
        .end(js)
      return
    }

    // /webui/<package>/<...> — the installed component, served as-is. Nothing is
    // copied into this repo; this is the same bytes Node resolves (see webui.ts).
    const webui = p.match(/^\/webui\/([^/]+)(\/.*)?$/)
    if (webui) {
      const name = decodeURIComponent(webui[1])
      if (!(WEBUI_PACKAGES as readonly string[]).includes(name)) {
        res.writeHead(404, { 'content-type': 'text/plain' }).end('Unknown component')
        return
      }
      await serveTree(res, webuiPackageDir(name), webui[2] ?? '/')
      return
    }

    if (p.startsWith('/builder/')) {
      await serveTree(res, clientDirOf(ctx, opts), p.slice('/builder'.length))
      return
    }

    res.writeHead(404, { 'content-type': 'text/plain' }).end('Not found')
  } catch (err) {
    // A CommandError is the EXPECTED answer to a bad edit — the validator
    // refusing a change map, an address that resolves to nothing. It is the
    // user's mistake, not the server's, so it carries its own code/path/hint
    // envelope out to the modal at 400. Reporting it as 500 would tell the
    // client "the builder broke" for a rejected heading, and would throw away
    // the message that says which field was wrong and why.
    if (err instanceof CommandError) {
      json(res, 400, { error: err.message, ...err.toEnvelope() })
      return
    }
    const message = err instanceof Error ? err.message : String(err)
    json(res, 500, { error: message })
  }
}

/**
 * One {@link PreviewRenderer} per store, so the render cache survives across
 * requests instead of being rebuilt per call. Keyed by the store the context
 * names rather than held on the server, because {@link handleBuilderRequest} is
 * exported and callable without one. A cache entry can never go stale: the
 * renderer re-checks the definition's stamp before reading it.
 */
const PREVIEWS = new Map<string, PreviewRenderer>()

function previewRenderer(ctx: StoreContext): PreviewRenderer {
  const key = `${ctx.cwd} ${ctx.root}`
  let renderer = PREVIEWS.get(key)
  if (!renderer) {
    renderer = new PreviewRenderer(fsDraftStore(ctx))
    PREVIEWS.set(key, renderer)
  }
  return renderer
}

/** Render `rel` out of a draft-side channel and answer with it (REQ-119). */
async function servePreview(
  ctx: StoreContext,
  res: http.ServerResponse,
  slug: string,
  channel: PreviewChannel,
  rel: string,
): Promise<void> {
  let file
  try {
    file = await previewRenderer(ctx).file(slug, channel, rel)
  } catch (err) {
    // A definition that no longer validates is the one failure this route can
    // hit that the OPERATOR can fix, and it is now visible the moment it
    // happens rather than hidden behind the last good render. It answers in the
    // iframe, as a page, because that is where they are looking — a JSON
    // envelope would render as a wall of escaped text.
    if (!(err instanceof InvalidDefinitionError)) throw err
    const body = `<!doctype html><meta charset="utf-8"><title>Invalid draft</title>
<body style="font:14px/1.6 ui-monospace,monospace;padding:2rem;color:#b00">
<h1 style="font-size:1rem">This draft does not validate</h1>
<pre>${escapeHtml(err.errors.map((e) => `${e.path}: ${e.message}`).join('\n'))}</pre>
</body>`
    res
      .writeHead(500, {
        'content-type': 'text/html; charset=utf-8',
        'content-length': Buffer.byteLength(body),
        'cache-control': 'no-store, must-revalidate',
      })
      .end(body)
    return
  }

  if (!file) {
    res.writeHead(404, { 'content-type': 'text/plain' }).end('Not found')
    return
  }
  if (file.kind === 'file') {
    sendFile(res, file.file)
    return
  }
  res
    .writeHead(200, {
      'content-type': file.contentType,
      'content-length': Buffer.byteLength(file.body),
      // `no-store` for the same reason every other byte on this origin is: the
      // definition underneath changes while the iframe is pointed at it, and a
      // reload that answered from cache would show the edit as having silently
      // failed.
      'cache-control': 'no-store, must-revalidate',
    })
    .end(file.body)
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

async function serveTree(
  res: http.ServerResponse,
  rootDir: string,
  rel: string,
): Promise<void> {
  const file = await resolveStaticFile(rootDir, rel)
  if (file === 'forbidden') {
    res.writeHead(403, { 'content-type': 'text/plain' }).end('Forbidden')
    return
  }
  if (!file) {
    res.writeHead(404, { 'content-type': 'text/plain' }).end('Not found')
    return
  }
  sendFile(res, file)
}

/** Start the builder origin. Resolves once it is listening. */
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

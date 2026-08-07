import fs from 'node:fs'
import http from 'node:http'
import { createRequire } from 'node:module'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { RenderChannel, StoreContext } from '../store'
import { distDir } from '../store'
import { cmdList, cmdPublish, cmdRender, ctxOf, type GlobalOptions } from './commands'
import { editAssetList, editCopyGet, editCopySet } from './edit'
import { CommandError } from './errors'
import { resolveStaticFile, sendFile } from './serve'
import { WEBUI_PACKAGES, webuiExports, webuiPackageDir } from './webui'

/**
 * The builder's dev origin (REQ-115 / DOC-28 §12 T1).
 *
 * WHY NODE AND NOT THE WORKER. Everything the builder needs beyond its own
 * chrome is filesystem-bound: the rendered draft under `storage/dist/…`, the
 * `storage/sites/` listing behind the site selector, and `publish`. A Worker has
 * no filesystem, and both bundler routes that could inline the bytes (an
 * `[assets]` binding, and `Text` module rules) make `unstable_dev` hang, so
 * taking either would cost us the ability to test `control-app` at all. So the
 * origin is Node and `control-app` fronts it — which is precisely the "T1 static
 * serving" that DOC-28 §12 T5 replaces with request-time renders inside the
 * Worker. T5 deletes the proxy; nothing above it changes.
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
      if (subpath === '.') imports[`@gendevlabs/${name}`] = url
      else if (target.endsWith('.css')) styles.push(url)
      else imports[`@gendevlabs/${name}/${subpath.replace(/^\.\//, '')}`] = url
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

/** Every response this origin returns carries it; see `sendFile` for why. */
const NO_STORE = 'no-store, must-revalidate'

/**
 * The one place a JSON response leaves this origin — so `no-store` is stated
 * once here rather than at each route, and a route added later inherits it.
 *
 * These answers are as perishable as the served bytes: `/api/copy` GET is the
 * field values the modal is about to display, and `/api/sites` is the selector's
 * listing. Without a directive AND without a validator they carry the worst
 * combination available (heuristic freshness permitted, nothing to revalidate
 * with) — a modal opening on values a save already replaced.
 */
function json(res: http.ServerResponse, status: number, body: unknown): void {
  const payload = JSON.stringify(body)
  res
    .writeHead(status, {
      'content-type': 'application/json; charset=utf-8',
      'content-length': Buffer.byteLength(payload),
      'cache-control': NO_STORE,
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

  try {
    if (p === '/' || p === '/index.html') {
      const html = chromeHtml()
      res
        .writeHead(200, {
          'content-type': 'text/html; charset=utf-8',
          'content-length': Buffer.byteLength(html),
          // The shell is hand-written and travels neither `sendFile` nor
          // `json`, so it states the directive itself. A hole in exactly one
          // response is worse than none, because the symptom it produces (a tab
          // that keeps running yesterday's chrome while every asset around it
          // is current) looks like anything except caching.
          'cache-control': NO_STORE,
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
        // BOTH channels, because an edit changes the page — not one rendering of
        // it. Re-rendering only `edit` left View showing whatever the last
        // manual `1c render` produced, so an edit made in the builder was
        // invisible in the mode the user switches to in order to see the page
        // as a visitor would. Nothing signalled the staleness: View looked like
        // a working page, just an old one, and it stayed old indefinitely.
        //
        // The cost is one extra render per save on a dev origin. Rendering the
        // channel lazily on request would buy that back, but it is machinery
        // with its own staleness rule, and DOC-28 §12 T5 deletes this whole
        // static-serving path in favour of request-time renders — so the cheap
        // correct thing now is to keep the two channels in step.
        await cmdRender(slug, { ...opts, edit: true })
        await cmdRender(slug, { ...opts, edit: false })
        json(res, 200, out.data)
        return
      }
    }

    // /preview/<slug>/<channel>/<...>  — a rendered channel, straight off disk.
    const preview = p.match(/^\/preview\/([^/]+)\/([^/]+)(\/.*)?$/)
    if (preview) {
      const slug = decodeURIComponent(preview[1])
      const channel = decodeURIComponent(preview[2]) as RenderChannel
      if (!CHANNELS.includes(channel)) {
        res
          .writeHead(404, { 'content-type': 'text/plain', 'cache-control': NO_STORE })
          .end('Unknown channel')
        return
      }
      await serveTree(res, distDir(ctx, slug, channel), preview[3] ?? '/')
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
          'content-length': Buffer.byteLength(js),
          // Read off disk every time: this is a dev origin, and a cached bridge
          // after an edit to the source is a confusing way to lose an afternoon.
          'cache-control': NO_STORE,
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
        res
          .writeHead(404, { 'content-type': 'text/plain', 'cache-control': NO_STORE })
          .end('Unknown component')
        return
      }
      await serveTree(res, webuiPackageDir(name), webui[2] ?? '/')
      return
    }

    if (p.startsWith('/builder/')) {
      await serveTree(res, clientDirOf(ctx, opts), p.slice('/builder'.length))
      return
    }

    res.writeHead(404, { 'content-type': 'text/plain', 'cache-control': NO_STORE }).end('Not found')
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

async function serveTree(
  res: http.ServerResponse,
  rootDir: string,
  rel: string,
): Promise<void> {
  const file = await resolveStaticFile(rootDir, rel)
  if (file === 'forbidden') {
    res.writeHead(403, { 'content-type': 'text/plain', 'cache-control': NO_STORE }).end('Forbidden')
    return
  }
  if (!file) {
    res.writeHead(404, { 'content-type': 'text/plain', 'cache-control': NO_STORE }).end('Not found')
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

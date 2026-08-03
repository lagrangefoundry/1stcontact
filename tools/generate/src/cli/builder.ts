import fs from 'node:fs'
import http from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { RenderChannel, StoreContext } from '../store'
import { distDir } from '../store'
import { cmdList, cmdPublish, ctxOf, type GlobalOptions } from './commands'
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

    // /preview/<slug>/<channel>/<...>  — a rendered channel, straight off disk.
    const preview = p.match(/^\/preview\/([^/]+)\/([^/]+)(\/.*)?$/)
    if (preview) {
      const slug = decodeURIComponent(preview[1])
      const channel = decodeURIComponent(preview[2]) as RenderChannel
      if (!CHANNELS.includes(channel)) {
        res.writeHead(404, { 'content-type': 'text/plain' }).end('Unknown channel')
        return
      }
      await serveTree(res, distDir(ctx, slug, channel), preview[3] ?? '/')
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

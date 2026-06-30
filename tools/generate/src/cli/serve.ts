import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import http from 'node:http'
import path from 'node:path'
import type { RenderChannel, Root, StoreContext } from '../store'
import { distDir } from '../store'
import type { GlobalOptions } from './commands'

/** Minimal MIME map for the static-preview server. */
const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
}

export interface ServeOptions extends GlobalOptions {
  source?: RenderChannel
  port?: number
}

export interface ServeHandle {
  server: http.Server
  url: string
  rootDir: string
}

/**
 * Serve a site's rendered output as static files for browser viewing. Resolves
 * once the server is listening; the caller keeps the process alive. A bare
 * directory request resolves to `index.html`.
 */
export function startServe(slug: string, opts: ServeOptions = {}): Promise<ServeHandle> {
  const root: Root = opts.sandbox ? 'sandbox' : 'sites'
  const ctx: StoreContext = { cwd: opts.cwd ?? process.cwd(), root }
  const channel = opts.source ?? 'published'
  const rootDir = distDir(ctx, slug, channel)

  const server = http.createServer((req, res) => {
    void serveRequest(rootDir, req, res)
  })

  return new Promise((resolve) => {
    server.listen(opts.port ?? 0, () => {
      const addr = server.address()
      const port = typeof addr === 'object' && addr ? addr.port : opts.port
      resolve({ server, url: `http://localhost:${port}/`, rootDir })
    })
  })
}

async function serveRequest(
  rootDir: string,
  req: http.IncomingMessage,
  res: http.ServerResponse,
): Promise<void> {
  try {
    const url = new URL(req.url ?? '/', 'http://localhost')
    let rel = decodeURIComponent(url.pathname)
    if (rel.endsWith('/')) rel += 'index.html'
    // Resolve and confine to rootDir (no path traversal).
    const abs = path.join(rootDir, path.normalize(rel))
    if (!abs.startsWith(rootDir)) {
      res.writeHead(403).end('Forbidden')
      return
    }
    const info = await stat(abs).catch(() => null)
    const file = info?.isDirectory() ? path.join(abs, 'index.html') : abs
    const finalInfo = info?.isDirectory() ? await stat(file).catch(() => null) : info
    if (!finalInfo) {
      res.writeHead(404, { 'content-type': 'text/plain' }).end('Not found')
      return
    }
    res.writeHead(200, { 'content-type': MIME[path.extname(file)] ?? 'application/octet-stream' })
    createReadStream(file).pipe(res)
  } catch {
    res.writeHead(500, { 'content-type': 'text/plain' }).end('Internal error')
  }
}

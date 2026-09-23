/**
 * The static-preview **capture fixture** (REQ-177).
 *
 * THIS IS NOT A HOSTING PATH, and there is no longer a command that starts it
 * as one. `1c serve` used to exist and was removed: it was a second, divergent
 * way to look at a site next to the real one, and an operator reading the CLI's
 * own help could reasonably conclude that a `node:http` origin was a supported
 * way to run a site. It is not. **The only supported way to serve a site is a
 * Worker** — `wrangler dev` locally (`pnpm dev`, `1c builder`), `bin/deploy` in
 * the cloud. Both go through the routes, store and runtime production uses.
 *
 * WHY IT STILL EXISTS. `startServe` is a library function, not a host. It binds
 * an ephemeral loopback port inside a single test or CLI run and closes it
 * again, so that a headless browser has an origin to point at: `1c shot`,
 * `1c aligned-crops` and the module conformance harness all render to disk and
 * then drive Playwright at the directory. The bytes under test there are static
 * render output, not Worker behaviour, so moving the loop to workerd would cost
 * speed and buy no fidelity.
 *
 * `resolveStaticFile` — shared with the builder's Node transport
 * (`builder.ts`) and the reproduction console, so that the confinement,
 * directory-index and extensionless rules cannot be present on one served tree
 * and missing on another — now lives in `static-file.ts` (REQ-254). It moved
 * because it needs a path and a directory and nothing else, while this module
 * needs the node-only store barrel; keeping them together made a caller that
 * wanted only the first pay for the second. No re-export is left behind: the
 * two callers name the new module directly, so there is one import path to it
 * rather than two.
 */
import http from 'node:http'
import { platformFontTarget } from '@1stcontact/site-schema'
import { readStagedPlatformFont } from '../fonts/mirror'
import { contentTypeOf } from '../store/content-type'
import { resolveStaticFile, sendFile } from './static-file'
import type { RenderChannel, Root, StoreContext } from '../store'
import { distDir } from '../store'
import type { GlobalOptions } from './commands'

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
 * Bind an ephemeral loopback origin over a site's rendered output, so that a
 * headless browser has somewhere to point. Test and capture infrastructure
 * only — never a way to host a site (see the file header). Resolves once the
 * server is listening; the caller closes it. A bare directory request resolves
 * to `index.html`, and an extensionless path falls back to the sibling `.html`
 * file (REQ-113) so captured URLs match production.
 */
export function startServe(slug: string, opts: ServeOptions = {}): Promise<ServeHandle> {
  const root: Root = opts.sandbox ? 'sandbox' : 'sites'
  const ctx: StoreContext = { cwd: opts.cwd ?? process.cwd(), root }
  const channel = opts.source ?? 'published'
  const rootDir = distDir(ctx, slug, channel)

  const server = http.createServer((req, res) => {
    void serveRequest(rootDir, ctx.cwd, req, res)
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
  cwd: string,
  req: http.IncomingMessage,
  res: http.ServerResponse,
): Promise<void> {
  try {
    const url = new URL(req.url ?? '/', 'http://localhost')
    /**
     * `_fonts/…` AT THIS TREE'S OWN ROOT ([[REQ-312]], `COMMENT-3711`).
     *
     * A page's font `src` names no host, so the rendered bytes ask for the face
     * relative to wherever they are being served — and this origin is one of the
     * roots that serves them. Without this a capture is taken in a fallback face
     * while the page says otherwise, which makes the fidelity surface lie about
     * the one axis it is most often asked to judge.
     *
     * OUT OF THE STAGED MIRROR AND NOT OUT OF `rootDir`. The bytes are shared
     * platform ones and are deliberately not copied into any site's output; an
     * unpopulated mirror has none, and the request 404s exactly as it would
     * against an unpublished one.
     */
    const font = platformFontTarget(url.pathname.replace(/^\/+/, ''))
    if (font) {
      const bytes = readStagedPlatformFont(cwd, font)
      if (!bytes) {
        res.writeHead(404, { 'content-type': 'text/plain' }).end('Not found')
        return
      }
      res.writeHead(200, { 'content-type': contentTypeOf(font) }).end(Buffer.from(bytes))
      return
    }
    const file = await resolveStaticFile(rootDir, url.pathname)
    if (file === 'forbidden') {
      res.writeHead(403).end('Forbidden')
      return
    }
    if (!file) {
      res.writeHead(404, { 'content-type': 'text/plain' }).end('Not found')
      return
    }
    sendFile(res, file)
  } catch {
    res.writeHead(500, { 'content-type': 'text/plain' }).end('Internal error')
  }
}

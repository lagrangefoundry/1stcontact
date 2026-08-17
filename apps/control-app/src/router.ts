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
import type { TenantSiteStore } from '../../../tools/generate/src/store/d1r2-store'
import { chromeHtml } from './chrome'
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
 * TWO ROUTES ANSWER 501, deliberately and by name. The chat panel needs a
 * library that loads itself from an out-of-repo artifact store by file URL
 * (lagrange-framework REQ-103), and publish needs revision storage the port does
 * not have ([[REQ-149]]). A 404 would read as a routing bug and send someone
 * looking for the handler that was lost; a 501 naming the ticket says what is
 * true — the route exists, the capability does not yet.
 */

/** The channels a preview URL may name. `published` is served from R2 by public-site. */
const PREVIEW_CHANNELS: PreviewChannel[] = ['draft', 'edit']

/**
 * One {@link PreviewRenderer} per isolate, so the render cache survives across
 * requests. A cache entry can never go stale: the renderer re-checks the
 * definition's stamp before reading it, which is a store read either way — the
 * cache saves the *render*, not the lookup that proves it current.
 */
const PREVIEWS = new Map<string, PreviewRenderer>()

function previewRenderer(store: TenantSiteStore): PreviewRenderer {
  let renderer = PREVIEWS.get(store.tenantId)
  if (!renderer) {
    renderer = new PreviewRenderer(store)
    PREVIEWS.set(store.tenantId, renderer)
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
}

export async function route(request: Request, env: RouterEnv): Promise<Response> {
  const url = new URL(request.url)
  const p = url.pathname
  const method = request.method

  if (p === '/' || p === '/index.html') {
    return new Response(chromeHtml(), {
      status: 200,
      headers: { 'content-type': 'text/html; charset=utf-8' },
    })
  }

  // Deferred capabilities, answered before the store is constructed: neither
  // needs one, and a store failure here would misreport why they are refused.
  if (p.startsWith('/api/ai/')) {
    return notImplemented('The builder assistant', 'lagrange-framework REQ-103')
  }
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
      const importStore = await storeForImport(env)
      await importStore.createDraft(payload.slug)
      const write = payloadToWrite(payload)
      await importStore.write(payload.slug, write)
      return json(200, {
          pages: write.pages.length,
          assets: write.assets.length,
          siteJson: write.siteJson !== undefined,
      })
    } catch (err) {
      if (err instanceof CommandError) {
      return json(400, { error: err.message, ...err.toEnvelope() })
      }
      const message = err instanceof Error ? err.message : String(err)
      return json(500, { error: message })
    }
  }

  const store = await storeFor(env)
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
      return servePreview(store, slug, channel as PreviewChannel, preview[3] ?? '/')
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
    if (err instanceof CommandError) {
      return json(400, { error: err.message, ...err.toEnvelope() })
    }
    const message = err instanceof Error ? err.message : String(err)
    return json(500, { error: message })
  }
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
  const body: BodyInit = file.kind === 'text' ? file.body : (file.body as Uint8Array)
  return new Response(body, {
    status: 200,
    headers: { 'content-type': file.contentType },
  })
}

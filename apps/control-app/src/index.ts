/**
 * `app.1stcontact.io` — the control app.
 *
 * Today it is a single same-origin front over the builder's Node dev origin
 * (REQ-115 / DOC-28 §12 T1). Everything the builder needs beyond its own chrome
 * is filesystem-bound — the rendered channels, the `storage/sites/` listing, and
 * `publish` — and a Worker has no filesystem, so the origin runs in Node and
 * this Worker proxies to it. Serving both through one host is what makes the
 * preview iframe same-origin and lets "open in new tab" resolve to the identical
 * URL the iframe loads.
 *
 * This proxy is deliberately temporary. DOC-28 §12 T5 moves draft and edit
 * renders into this Worker at request time via the Astro Cloudflare adapter, and
 * deletes it. It is last on purpose: it changes WHERE the render runs, not what
 * it produces, so everything above it is built and proven first.
 */

export interface Env {
  /** Origin of the builder dev server, e.g. `http://localhost:8787`. */
  BUILDER_ORIGIN?: string
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin = env.BUILDER_ORIGIN
    if (!origin) {
      return new Response(
        'BUILDER_ORIGIN is not configured. Start the builder origin with `1c builder` ' +
          'and point BUILDER_ORIGIN at it.',
        { status: 503, headers: { 'content-type': 'text/plain; charset=utf-8' } },
      )
    }

    const incoming = new URL(request.url)
    const target = new URL(incoming.pathname + incoming.search, origin)

    // Forwarded verbatim: the origin owns routing, status codes and content
    // types. A proxy that reinterpreted them would be a second routing table to
    // keep in step with the one T5 is about to delete.
    const upstream = new Request(target, request)
    try {
      return await fetch(upstream)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      return new Response(`Builder origin unreachable at ${origin}: ${message}`, {
        status: 502,
        headers: { 'content-type': 'text/plain; charset=utf-8' },
      })
    }
  },
} satisfies ExportedHandler<Env>

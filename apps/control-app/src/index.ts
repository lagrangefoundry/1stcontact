/**
 * `app.1stcontact.io` — the control app.
 *
 * A single same-origin front over the builder's Node origin (REQ-115 / DOC-28
 * §12 T1). Serving both through one host is what makes the preview iframe
 * same-origin and lets "open in new tab" resolve to the identical URL the iframe
 * loads.
 *
 * WHAT REQ-119 CHANGED, AND WHAT IT DID NOT. The draft and edit channels are now
 * rendered at REQUEST TIME rather than served off `storage/dist/…`, through the
 * one render `1c render` writes with (`tools/generate/src/cli/preview.ts`). No
 * pre-rendered artifact is required and a save no longer materialises two whole
 * channels to disk — the substance of DOC-28 §12 T5.
 *
 * The render still executes in Node, not here. It reads the definition from the
 * operator's file-backed store and runs through the Vite/Astro transform that
 * compiles the framework's behavior modules; workerd has neither. Relocating it
 * therefore needs the store reachable from a Worker, which is DOC-12 §7's phase
 * 2 (D1 + R2) and explicitly outside REQ-119's scope. When that lands, this
 * Worker gains a store binding and mounts the same preview handler; the proxy
 * goes then, and nothing above it changes either time.
 */

import { guardAccess, type AccessEnv } from './access'

export interface Env extends AccessEnv {
  /** Origin of the builder dev server, e.g. `http://localhost:8787`. */
  BUILDER_ORIGIN?: string
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // FIRST, before anything is read or proxied. The builder is private
    // (REQ-147): Access challenges at the edge, and this refuses anything that
    // reached the Worker without having been challenged — the door a policy on
    // `app.1stcontact.io` alone does not cover. See src/access.ts.
    const refused = await guardAccess(request, env)
    if (refused) return refused

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

import { guardAccess, type AccessEnv } from './access'
import { route, type RouterEnv } from './router'

/**
 * `app.1stcontact.io` — the control app, and the builder itself (REQ-145).
 *
 * WHAT THIS WORKER USED TO BE. A pure proxy: it forwarded every request to a
 * Node origin (`1c builder`, a 700-line `node:http` server) and owned no
 * routing. The origin held the routes because it held the things a Worker could
 * not reach — the site definitions on the operator's disk, the webui components
 * in an out-of-repo package store, and a Vite/Astro transform for the render.
 *
 * All three are gone. The definitions live in D1 and R2 (REQ-143), the browser
 * assets are a build artifact served by the assets binding (`1c assets`), and
 * the render is `renderL1Document` — pure string templating with no Astro
 * involvement for a site made of L1, which is every site here but one. So the
 * origin is this Worker, and `1c builder` starts `wrangler dev` rather than a
 * second implementation of the same routes.
 *
 * THE ORDER BELOW IS THE SECURITY PROPERTY. Access is checked FIRST, before a
 * store handle exists and before a path is examined, so there is no route — not
 * a new one, not a mistyped one — that can be reached without a verified
 * identity. See `access.ts` for why the Worker verifies at all when Access
 * already enforces at the edge.
 */

export interface Env extends AccessEnv, RouterEnv {
  /**
   * LOCAL DEVELOPMENT ONLY, and only when Access is unconfigured.
   *
   * `wrangler dev` serves on `127.0.0.1`, which no Access policy fronts, so the
   * gate — which fails closed, correctly — would refuse every request an
   * operator made to their own builder. This var is the honest way to say "this
   * is the loopback dev server", and it is deliberately shaped so that it cannot
   * open a deployed Worker:
   *
   *   1. it only applies when ACCESS_TEAM_DOMAIN / ACCESS_AUD are BOTH empty, so
   *      a configured deployment ignores it entirely;
   *   2. it is declared under top-level [vars] — which `wrangler dev` reads and
   *      `wrangler deploy --env production` does NOT, because a named
   *      environment inherits no vars — and is absent from
   *      [env.production.vars];
   *   3. a UAT asserts (2), so restoring it there fails the build rather than
   *      the audit.
   *
   * Opening production therefore takes two independent mistakes, which is the
   * same standard REQ-147 set for `workers_dev`.
   */
  ACCESS_DEV_OPEN?: string
}

/**
 * True when this is the loopback dev server and Access has nothing to check.
 * Both halves are required; either alone denies.
 */
function isUnconfiguredLocalDev(env: Env): boolean {
  const configured =
    (env.ACCESS_TEAM_DOMAIN ?? '').trim() !== '' || (env.ACCESS_AUD ?? '').trim() !== ''
  return !configured && (env.ACCESS_DEV_OPEN ?? '').trim() === '1'
}

/**
 * FRESHNESS, SET ONCE, FOR EVERY RESPONSE THIS WORKER CAN PRODUCE.
 *
 * The builder rewrites its own bytes underneath the browser — a save changes the
 * very channel the frame is displaying — so a single cacheable response leaves
 * an operator looking at a stale page that appears to be working. Stamping here,
 * on the way out, means the directive covers the chrome document, every JSON
 * envelope, every rendered preview and every 400/404/500/501 alike.
 *
 * It is one wrapper rather than a header per route because a per-route
 * restatement is precisely how the last hole opened: the Node origin's `json()`
 * helper was written with its own two headers and never carried the directive,
 * so `/api/sites` — the response that populates the site selector — was
 * cacheable, and a newly created site could stay invisible behind a workspace
 * that looked correct. A route added tomorrow inherits this instead of needing
 * to remember it.
 */
const NO_STORE = 'no-store, must-revalidate'

function uncacheable(response: Response): Response {
  const headers = new Headers(response.headers)
  headers.set('cache-control', NO_STORE)
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers })
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (!isUnconfiguredLocalDev(env)) {
      const refused = await guardAccess(request, env)
      if (refused) return refused
    }

    try {
      return uncacheable(await route(request, env))
    } catch (err) {
      // Anything reaching here escaped the router's own handler — a store that
      // could not be constructed, most likely a missing binding or an unknown
      // tenant. It is a configuration failure rather than a bad request, and it
      // says so in prose an operator can act on.
      const message = err instanceof Error ? err.message : String(err)
      return uncacheable(
        new Response(message, {
          status: 503,
          headers: { 'content-type': 'text/plain; charset=utf-8' },
        }),
      )
    }
  },
} satisfies ExportedHandler<Env>

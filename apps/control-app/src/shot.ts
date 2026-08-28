/**
 * REQ-154 — the assistant's eyes, in the cloud ([[DOC-13]] §6, §8).
 *
 * This is the composition root for Browser Rendering: the one file in the repo
 * that names `@cloudflare/puppeteer`. Everything it drives lives behind the
 * `BrowserDriver` seam in `tools/generate` and knows nothing about Cloudflare —
 * the same shape as `RouterDeps` ([[REQ-145]]) and `HostDeps` ([[REQ-146]]).
 * Nothing here detects its environment; a Worker passes this launcher and a
 * laptop passes Playwright's.
 *
 * NO ROUTE ANSWERS THIS YET, on purpose. A browser session is metered and the
 * account has a concurrency cap, so exposing one over HTTP is a decision about
 * rate limiting and authorisation rather than a wiring step, and it belongs to
 * the ticket that gives the assistant the surface ([[REQ-157]]). What lands here
 * is the capability and its proof.
 */
import { launch } from '@cloudflare/puppeteer'
import {
  withBrowserSession,
  type BrowserLauncher,
  type PuppeteerBrowser,
} from '../../../tools/generate/src/cli/capture/cf-driver'
import {
  resolveViewport,
  screenshotUrl,
  type ViewportName,
} from '../../../tools/generate/src/cli/capture/screenshot'
import { PreviewRenderer, previewOriginResolver } from '../../../tools/generate/src/cli/preview'
import type { PreviewChannel } from '../../../tools/generate/src/cli/preview'

/** The Browser Rendering binding (`[browser]` in wrangler.toml). */
export interface ShotEnv {
  BROWSER?: Fetcher
}

/**
 * Injected seams, exactly two, and both for the same reason the router's are:
 * so a test drives the real code rather than a copy of it.
 */
export interface ShotDeps {
  /** Acquire a browser (default: the Browser Rendering binding). */
  launch?: BrowserLauncher
  /** Ceiling on the leased session, ms. */
  timeoutMs?: number
}

/** Raised when the Worker has no `[browser]` binding. Named so a caller can say
 *  "this deployment cannot take pictures" rather than "undefined is not an object". */
export class BrowserNotConfiguredError extends Error {
  constructor() {
    super('No BROWSER binding: this deployment has no Browser Rendering configured.')
    this.name = 'BrowserNotConfiguredError'
  }
}

/** The production launcher: one Browser Rendering session from the binding. */
export function bindingLauncher(env: ShotEnv): BrowserLauncher {
  return async () => {
    const binding = env.BROWSER
    if (!binding) throw new BrowserNotConfiguredError()
    return (await launch(binding as never)) as unknown as PuppeteerBrowser
  }
}

/** Screenshot any URL at a named viewport, from inside the Worker. */
export async function shotUrl(
  env: ShotEnv,
  url: string,
  viewport: ViewportName = 'desktop',
  deps: ShotDeps = {},
): Promise<Uint8Array> {
  const size = resolveViewport(viewport)
  return withBrowserSession(
    deps.launch ?? bindingLauncher(env),
    async (session) => screenshotUrl(url, size, session.driverFactory()),
    { timeoutMs: deps.timeoutMs },
  )
}

export interface PreviewShotOptions {
  /** The site to shoot. */
  slug: string
  /** Which draft-side channel (default `draft`). */
  channel?: PreviewChannel
  /** Path within the channel (default `/`). */
  path?: string
  /** Named viewport preset (default `desktop`). */
  viewport?: ViewportName
  /** This deployment's own origin, e.g. `https://app.1stcontact.io`. */
  origin: string
}

/**
 * Screenshot one of **our own** preview channels — the case Access breaks and
 * the reason this ticket exists.
 *
 * The browser navigates the real absolute preview URL, so the page has a real
 * origin and its relative asset references resolve exactly as they do in a
 * browser pointed at the deployed builder. Every request to that host is then
 * answered in-process from the same {@link PreviewRenderer} the `/preview/*`
 * route uses, so the request never leaves the browser, never reaches Access, and
 * cannot come back as a challenge page. See `previewOriginResolver`.
 */
export async function shotPreview(
  env: ShotEnv,
  renderer: PreviewRenderer,
  opts: PreviewShotOptions,
  deps: ShotDeps = {},
): Promise<Uint8Array> {
  const size = resolveViewport(opts.viewport ?? 'desktop')
  const channel = opts.channel ?? 'draft'
  const rel = opts.path ?? '/'
  const base = new URL(opts.origin)
  const url = new URL(
    `/preview/${encodeURIComponent(opts.slug)}/${channel}${rel.startsWith('/') ? rel : `/${rel}`}`,
    base,
  ).toString()
  const resolver = previewOriginResolver(renderer, base.host)
  return withBrowserSession(
    deps.launch ?? bindingLauncher(env),
    async (session) => screenshotUrl(url, size, session.driverFactory({ origin: resolver })),
    { timeoutMs: deps.timeoutMs },
  )
}

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
 * NO ROUTE ANSWERS THIS, and that is now the settled answer rather than a
 * deferral ([[REQ-206]]). A browser session is metered and the account has a
 * concurrency cap, so exposing one over HTTP was a decision about rate limiting
 * and authorisation rather than a wiring step, and it belonged to the ticket
 * that gives the assistant the surface. That ticket added no route: the browser
 * is reachable only from inside a turn of a conversation that has already been
 * admitted and already scoped to one business, and the rate limit it needed is
 * {@link browserBudget} below.
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
import { leasedDriverFactory } from '../../../tools/generate/src/cli/capture/cf-driver'
import type { ReferenceStore } from '../../../tools/generate/src/store/reference-store'
import type { FidelityDeps } from '../../../tools/generate/src/cli/ai/fidelity-core'

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
  /**
   * The session's browser budget ([[REQ-206]]), honoured by {@link fidelityDeps}
   * alone — {@link shotUrl} and {@link shotPreview} are single, operator-driven
   * acquisitions with nothing to run away.
   *
   * Absent, `fidelityDeps` mints one of its own per session, which is the
   * production path; a caller passes one to CHOOSE the ceiling or to observe
   * what a session spent.
   */
  budget?: BrowserBudget
}

/**
 * How many live-page looks one conversation may spend ([[REQ-206]]).
 *
 * WHY THERE IS A CEILING AT ALL. A Browser Rendering session is metered and the
 * account has a concurrency cap and an acquisition rate limit. A responsive
 * ladder is eight navigations, so a conversation that captures repeatedly turns
 * a chat into a bill, and a stranded session degrades into an outage that reads
 * to the client as a hang. The exposure is SPEND, not safety: authorisation is
 * already answered by the fact that no route reaches this — the surface is
 * inside an admitted, business-scoped turn.
 *
 * WHY FORTY. A capture spends eight; a look spends one. Forty is five captures,
 * or two captures and twenty-four looks — comfortably more than a consultation
 * that is working and comfortably less than one that is looping. It is a
 * constant rather than a var deliberately: a per-deployment override is a knob
 * whose only reachable effect is to make one deployment cost more than another
 * for reasons nobody would find later.
 */
export const SESSION_BROWSER_BUDGET = 40

/**
 * The refusal a spent budget produces.
 *
 * IN THE SURFACE'S OWN SHAPE — it names what ran out and what is still possible,
 * which is what every other refusal on that surface does. It refuses ONE
 * operation: every other tool keeps working and the conversation continues,
 * because a client must never lose their consultant because it looked at their
 * page too often.
 *
 * THE PREFIX IS A CODE, like `REFUSED:` in `fidelity-core.ts`, and it is
 * deliberately NOT one of the codes the declaration carries. The declaration is
 * shared with the `1c` CLI, whose Playwright is neither metered nor capped —
 * writing a budget into the overview would teach a laptop session about a
 * ceiling it does not have. What the shared overview already says is true of
 * both hosts and is the statement made before anything is spent: *looking is not
 * free and it is not instant; take the picture you need, not the set you might
 * need*. This is that sentence coming due.
 */
export class BrowserBudgetSpentError extends Error {
  readonly name = 'BrowserBudgetSpentError'
  constructor(readonly limit: number) {
    super(
      `BUDGET: this conversation has spent its ${limit} live-page looks, so no more ` +
        `pages can be loaded in a browser for it. This is a boundary, not a hiccup: ` +
        `do not retry it and do not try the same page another way. Everything already ` +
        `captured is still there — listing the references, describing one, taking a ` +
        `picture of one and comparing two of them all still work, and so does every ` +
        `way of changing the site. Say what you can no longer do, and carry on.`,
    )
  }
}

/** A session's ration of browser acquisitions. */
export interface BrowserBudget {
  /** The ceiling this budget was minted with. */
  readonly limit: number
  /** How many acquisitions have been spent. */
  spent(): number
  /**
   * Wrap a launcher so every acquisition spends one, and the one past the
   * ceiling raises {@link BrowserBudgetSpentError} instead of leasing.
   */
  meter(launch: BrowserLauncher): BrowserLauncher
}

/**
 * Mint a budget for one session.
 *
 * IT COUNTS ACQUISITIONS, not operations, and that is what makes the ticket's
 * rule fall out rather than having to be restated per verb: an operation that
 * reads something already captured or already rendered never asks for a browser,
 * so it never spends. `list_references`, `describe_reference`, a picture of a
 * `reference` and a `compare` of two of them are all free, for the same reason
 * and without any of them knowing there is a budget.
 *
 * IN MEMORY, AND ITS SCOPE IS STATED RATHER THAN IMPLIED. `HostDeps.fidelity` is
 * called once per session manager, which `host-core.ts` memoises per store and
 * slug, so one budget serves one conversation for as long as the isolate holding
 * it lives — and an evicted isolate mints a fresh one. That makes this a BURST
 * bound rather than a lifetime one, which is the shape the risk actually has: a
 * model looping on `screenshot` does it inside one turn, in one isolate. A
 * lifetime bound would need a durable count — the `chat` ticket's own fields, or
 * the audit records already written per turn — and would buy a read-modify-write
 * per acquisition to bound something no observed failure mode reaches.
 */
export function browserBudget(limit: number = SESSION_BROWSER_BUDGET): BrowserBudget {
  let used = 0
  return {
    limit,
    spent: () => used,
    meter:
      (launch) =>
      async () => {
        // COUNTED BEFORE THE LEASE, not after: a launch that throws still cost
        // an acquisition against the account's rate limit, and a budget that
        // only counted successes would let a failing loop spend forever.
        if (used >= limit) throw new BrowserBudgetSpentError(limit)
        used += 1
        return launch()
      },
  }
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

/**
 * REQ-157 — everything the fidelity surface needs, assembled for one site.
 *
 * THE ROUTE THIS FILE SAID WAS COMING, and the answer is that there is not one.
 * Its own header records that REQ-154 deliberately exposed no HTTP route,
 * because a metered session with an account-level concurrency cap is an
 * authorisation and rate-limiting question rather than a wiring step, and that
 * question belonged to the ticket that gives the assistant the surface. This is
 * that ticket. The capability is reached through the tool surface — already
 * authenticated, already granted per role, already audited per call, and already
 * refusable by the policy the Toolbox applies before an operation runs — which
 * is a better answer than a route with a bearer token in front of it.
 *
 * AND THE RATE LIMIT IS HERE ([[REQ-206]]). Authorisation is answered by the
 * paragraph above; spend is not, so both factories below are built over a
 * launcher metered by this session's {@link BrowserBudget}. One budget per
 * session, because this function is called once per session manager — see
 * {@link browserBudget} for what that scope is and is not.
 *
 * TWO DRIVER FACTORIES, and the difference is the whole security story. The
 * plain one serves our own preview channels: its requests are fulfilled in
 * process from {@link PreviewRenderer}, so they never leave the browser, never
 * reach Access, and cannot come back as a challenge page. The guarded one is for
 * `capture_site`, which fetches an address a MODEL chose, and it is held to the
 * egress policy on every request the page makes — not just the one that was
 * typed. See `egress-guard.ts` for why that distinction is the control.
 */
export function fidelityDeps(
  env: ShotEnv,
  renderer: PreviewRenderer,
  references: ReferenceStore,
  origin: string,
  slug: string,
  deps: ShotDeps = {},
  /**
   * What turns a finished bundle into a findable `reference` ([[REQ-166]]).
   *
   * A PARAMETER, AND OPTIONAL, because it needs the ticket store and this
   * function is handed the *reference* store. Passing the tickets in here would
   * make every caller that only wants pictures construct a corpus it never
   * touches; passing the already-bound adoption instead keeps the two stores
   * from meeting in a signature. `router.ts` binds it to
   * {@link adoptCapture} over the request's own ticket store.
   *
   * Omitted, a capture still stores perfectly and `capture_site` says the bundle
   * was not written up — see `fidelity-core.ts`.
   */
  adoptCapture?: (bundle: string) => Promise<{ uid: string; created: boolean }>,
): FidelityDeps {
  // Named `launcher`, not `launch`: this module's top-level `launch` is
  // `@cloudflare/puppeteer`'s, and shadowing it here would read as a call to it.
  //
  // METERED ONCE, ABOVE BOTH FACTORIES ([[REQ-206]]), so the ration is the
  // session's and not each verb's: a capture's eight navigations and a
  // screenshot's one come out of the same forty. Wrapping here rather than in
  // each factory is also what stops `guardedDriver` — which is built fresh per
  // capture, because its guard is — from getting a fresh allowance with it.
  const budget = deps.budget ?? browserBudget()
  const launcher = budget.meter(deps.launch ?? bindingLauncher(env))
  const resolver = previewOriginResolver(renderer, new URL(origin).host)
  return {
    slug,
    references,
    origin,
    driverFactory: leasedDriverFactory(launcher, { origin: resolver }),
    // No origin resolver on this one, deliberately: a capture is of somebody
    // else's site, and handing it our own resolver would let a captured page
    // that happened to name our host be answered out of our own store.
    guardedDriver: (guard) => leasedDriverFactory(launcher, { guard }),
    // Spread rather than set to `undefined`: `FidelityDeps` declares the key
    // optional, and an explicit `undefined` would satisfy the type while making
    // `deps.adoptCapture ? …` read false in a way that looks like a bug.
    ...(adoptCapture ? { adoptCapture } : {}),
  }
}

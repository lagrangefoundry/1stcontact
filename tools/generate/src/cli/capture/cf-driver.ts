/**
 * REQ-154 — the Cloudflare Browser Rendering implementation of the
 * {@link BrowserDriver} seam ([[DOC-13]] §2.2, §8).
 *
 * The second implementation of an interface that already existed. Nothing above
 * the seam changes: `1c shot`, the capture pipeline, the conformance harness and
 * the fidelity gate all take a {@link BrowserDriverFactory} already, so a Worker
 * hands them one built here and a laptop hands them Playwright's.
 *
 * NO `@cloudflare/puppeteer` IMPORT LIVES IN THIS FILE, and that is deliberate
 * rather than tidy. The library is a Worker-only dependency reached through a
 * binding; importing it here would put it in every bundle that touches capture,
 * including the CLI's. Instead this module names the narrow structural surface it
 * actually uses ({@link PuppeteerBrowser} and friends) and the *host* supplies
 * the real library — the same shape as `RouterDeps` ([[REQ-145]]) and `HostDeps`
 * ([[REQ-146]]). A test supplies a fake, and it is a legitimate fake: the browser
 * is a genuine external boundary reached over a wire protocol, not a component we
 * own.
 *
 * ONE BROWSER, MANY DRIVERS. A Browser Rendering session is metered and the
 * account has a concurrency cap and an acquisition rate limit, so the Playwright
 * driver's habit of launching a whole browser per navigation — eight of them for
 * a single responsive ladder — is not merely wasteful here, it is unaffordable.
 * {@link withBrowserSession} leases ONE browser for a run; each driver takes a
 * fresh browser *context* from it and destroys that context on `close()`.
 *
 * A CONTEXT, NOT A BARE PAGE, because the context is the real reset boundary: it
 * has its own cookie jar, cache and storage, and closing it destroys all three.
 * That reproduces today's semantics exactly — each viewport in the ladder starts
 * cold, as it does when each viewport gets its own browser — while collapsing
 * eight acquisitions into one. Deliberately NOT a shared warm cache across the
 * ladder: a consent or A/B cookie set at 320px would pin every wider viewport to
 * that variant, which is a capture-fidelity change wearing a performance costume.
 *
 * ONE NAVIGATION PER DRIVER, as everywhere else. `responses()` and
 * `diagnostics()` accumulate into instance fields, so a driver reused across two
 * navigations would merge the first page's network log into the second's — and
 * `diagnostics().requestedUrls` is what the security conformance dimension checks
 * egress against, so the corruption would land as a false verdict rather than as
 * a crash. Reuse lives strictly *below* the driver.
 */
import { FONT_BARRIER, FONTS_READY, IMAGES_DECODED, SETTLE_CSS, SETTLE_SCROLL } from './page-scripts'
import type {
  BrowserDriver,
  BrowserDriverFactory,
  CapturedResponse,
  OriginResolver,
  PageDiagnostics,
  Viewport,
} from './types'

const DEFAULT_VIEWPORT: Viewport = { width: 1280, height: 800 }

/** Default ceiling on a leased session, in ms. Long enough for a ladder, short
 *  enough that a wedged run cannot hold a billed session until the idle reaper. */
const DEFAULT_SESSION_TIMEOUT_MS = 120_000

// ── the puppeteer-shaped surface, named rather than imported ─────────────────

/** One intercepted request, as puppeteer presents it. */
export interface PuppeteerRequest {
  url(): string
  respond(response: { status: number; contentType: string; body: string | Uint8Array }): Promise<void>
  continue(): Promise<void>
}

/** One response the page received, as puppeteer presents it. */
export interface PuppeteerResponse {
  url(): string
  status(): number
  headers(): Record<string, string>
  buffer(): Promise<Uint8Array>
}

/** A console message, as puppeteer presents it. */
export interface PuppeteerConsoleMessage {
  type(): string
  text(): string
}

export interface PuppeteerPage {
  setViewport(viewport: Viewport): Promise<void>
  emulateMediaFeatures(features: Array<{ name: string; value: string }>): Promise<void>
  setRequestInterception(enabled: boolean): Promise<void>
  on(event: string, handler: (arg: never) => void): unknown
  goto(url: string, options?: { waitUntil?: string; timeout?: number }): Promise<unknown>
  evaluate(script: string): Promise<unknown>
  addStyleTag(options: { content: string }): Promise<unknown>
  waitForNetworkIdle(options?: { idleTime?: number; timeout?: number }): Promise<void>
  screenshot(options: { fullPage: boolean; type: 'png' }): Promise<Uint8Array | string>
  content(): Promise<string>
}

export interface PuppeteerContext {
  newPage(): Promise<PuppeteerPage>
  close(): Promise<void>
}

export interface PuppeteerBrowser {
  createBrowserContext(): Promise<PuppeteerContext>
  close(): Promise<void>
}

/** What the host injects: `(endpoint) => puppeteer.launch(endpoint)`. */
export type BrowserLauncher = () => Promise<PuppeteerBrowser>

// ── the driver ───────────────────────────────────────────────────────────────

/** Per-driver knobs. Everything else is fixed by the seam's contract. */
export interface CfDriverOptions {
  /**
   * A host served in-process rather than over the network (see
   * {@link OriginResolver}). Omitted, every request goes to the network and
   * screenshotting our own gated preview would capture an Access challenge.
   */
  origin?: OriginResolver
  /** Navigation timeout in ms (default 30s). */
  navigationTimeoutMs?: number
}

class CfBrowserDriver implements BrowserDriver {
  private context: PuppeteerContext | null = null
  private page: PuppeteerPage | null = null
  /** Keyed by URL so a fulfilled request and its response event record once. */
  private readonly cached = new Map<string, CapturedResponse>()
  private readonly diag: PageDiagnostics = {
    consoleErrors: [],
    pageErrors: [],
    failedRequests: [],
    requestedUrls: [],
  }

  constructor(
    private readonly browser: PuppeteerBrowser,
    private readonly opts: CfDriverOptions,
  ) {}

  async navigate(url: string, viewport?: Viewport): Promise<void> {
    this.context = await this.browser.createBrowserContext()
    const page = await this.context.newPage()
    this.page = page

    await page.setViewport(viewport ?? DEFAULT_VIEWPORT)
    // REQ-48 (item 1) — freeze-determinism precondition. Motion is
    // time-dependent, so an unfrozen page projects a different frame every run
    // and the whole gate is flaky. `prefers-reduced-motion: reduce` collapses
    // animations to their resting state; the *declaration* of motion is still
    // captured from computed styles.
    await page
      .emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }])
      .catch(() => undefined)

    // Page-health signals (REQ-39): armed BEFORE `goto` so load-time console
    // errors, uncaught exceptions and failed subresources are all observed.
    page.on('console', ((msg: PuppeteerConsoleMessage) => {
      if (msg.type() === 'error') this.diag.consoleErrors.push(msg.text())
    }) as never)
    page.on('pageerror', ((err: { message?: string }) => {
      this.diag.pageErrors.push(err?.message ?? String(err))
    }) as never)
    page.on('requestfailed', ((req: PuppeteerRequest) => {
      this.diag.failedRequests.push(req.url())
    }) as never)
    page.on('response', ((resp: PuppeteerResponse) => {
      void this.recordResponse(resp)
    }) as never)

    // ONE `request` listener, and it does two jobs, because with interception
    // armed exactly one listener may resolve each request. It records the full
    // egress surface (REQ-40) — a cross-origin request that fails never becomes
    // a response, so egress cannot be derived from `responses()` — and then
    // decides between in-process fulfilment and the network.
    await page.setRequestInterception(true)
    page.on('request', ((req: PuppeteerRequest) => {
      this.diag.requestedUrls.push(req.url())
      void this.handleRequest(req)
    }) as never)

    const timeout = this.opts.navigationTimeoutMs ?? 30_000
    await page.goto(url, { waitUntil: 'networkidle0', timeout })

    // REQ-48 (item 7) — network idle can settle before the browser swaps from a
    // fallback face to the intended @font-face, so computed styles read now
    // would record fallback metrics (FOUT). Best-effort: an engine without the
    // FontFaceSet API must not block the capture.
    await page.evaluate(FONTS_READY).catch(() => undefined)
    await this.settlePage()
    // BUG-16 — re-establish the barrier AFTER settle: the scroll can trigger
    // font loads the early await never saw.
    await page.evaluate(FONT_BARRIER).catch(() => undefined)
  }

  /**
   * REQ-36 — settle below-fold lazy/animated content so the next
   * {@link screenshot} / {@link query} sees the whole page. The same four steps
   * the Playwright driver runs, over the same shared scripts. Best-effort
   * throughout: a page without these patterns is unaffected, and any step that
   * rejects must not fail the capture — the screenshot is still worth taking.
   */
  private async settlePage(): Promise<void> {
    const page = this.requirePage()
    await page.addStyleTag({ content: SETTLE_CSS }).catch(() => undefined)
    await page.evaluate(SETTLE_SCROLL).catch(() => undefined)
    await page.evaluate(IMAGES_DECODED).catch(() => undefined)
    await page.waitForNetworkIdle().catch(() => undefined)
  }

  /**
   * Fulfil in-process or let it go to the network, per {@link OriginResolver}'s
   * per-host rule. A resolver error is answered 500 rather than continued: a
   * silent fall-through would send the request to the gated origin, which is the
   * one outcome this whole mechanism exists to make impossible.
   */
  private async handleRequest(req: PuppeteerRequest): Promise<void> {
    const origin = this.opts.origin
    if (!origin) return void (await req.continue().catch(() => undefined))
    let target: URL
    try {
      target = new URL(req.url())
    } catch {
      return void (await req.continue().catch(() => undefined))
    }
    if (target.host !== origin.host) return void (await req.continue().catch(() => undefined))
    try {
      const file = await origin.file(target.pathname)
      const answer = file ?? { status: 404, contentType: 'text/plain; charset=utf-8', body: 'Not found' }
      this.cached.set(req.url(), {
        url: req.url(),
        status: answer.status,
        contentType: answer.contentType,
        body: typeof answer.body === 'string' ? new TextEncoder().encode(answer.body) : answer.body,
      })
      await req.respond(answer)
    } catch (err) {
      await req
        .respond({
          status: 500,
          contentType: 'text/plain; charset=utf-8',
          body: `origin resolver failed: ${err instanceof Error ? err.message : String(err)}`,
        })
        .catch(() => undefined)
    }
  }

  /** Cache a network-served response, unless this URL was already fulfilled. */
  private async recordResponse(resp: PuppeteerResponse): Promise<void> {
    const url = resp.url()
    if (this.cached.has(url)) return
    try {
      const body = await resp.buffer()
      this.cached.set(url, {
        url,
        status: resp.status(),
        contentType: resp.headers()['content-type'] ?? null,
        body: new Uint8Array(body),
      })
    } catch {
      // Redirects / 204s / already-freed bodies carry nothing to mirror.
    }
  }

  async screenshot(viewport?: Viewport): Promise<Uint8Array> {
    const page = this.requirePage()
    if (viewport) await page.setViewport(viewport)
    const shot = await page.screenshot({ fullPage: true, type: 'png' })
    return typeof shot === 'string' ? base64ToBytes(shot) : new Uint8Array(shot)
  }

  async query<T = unknown>(script: string): Promise<T> {
    return (await this.requirePage().evaluate(script)) as T
  }

  responses(): CapturedResponse[] {
    return [...this.cached.values()]
  }

  diagnostics(): PageDiagnostics {
    return this.diag
  }

  async content(): Promise<string> {
    return this.requirePage().content()
  }

  /**
   * Destroy this driver's context — cookies, cache and storage with it. The
   * BROWSER is not closed: it belongs to the lease, and closing it here would
   * take out every other viewport in the ladder.
   *
   * `actuate` / `canActuate` are deliberately absent. They are optional
   * capability negotiation, not a legacy fallback: a driver that cannot force a
   * pseudo-state omits them, and the multi-state loop restricts itself to
   * `'rest'` and SAYS SO — which is honest, where a silent no-op would emit an
   * unactuated frame labelled `hover` and read as a false clean.
   */
  async close(): Promise<void> {
    const context = this.context
    this.context = null
    this.page = null
    await context?.close()
  }

  private requirePage(): PuppeteerPage {
    if (!this.page) throw new Error('BrowserDriver.navigate() must be called before use.')
    return this.page
  }
}

/** A base64 screenshot (older puppeteer encodings) back to bytes. */
function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i += 1) out[i] = bin.charCodeAt(i)
  return out
}

// ── the lease ────────────────────────────────────────────────────────────────

/** A leased browser: hand out driver factories, all sharing the one session. */
export interface BrowserSession {
  /** A {@link BrowserDriverFactory} whose drivers take contexts from this lease. */
  driverFactory(opts?: CfDriverOptions): BrowserDriverFactory
}

export interface BrowserSessionOptions {
  /** Ceiling on the whole lease in ms (default 120s). */
  timeoutMs?: number
}

/**
 * Lease one Browser Rendering session for the duration of `fn`, and release it
 * on **every** exit — success, throw, and timeout.
 *
 * WHY THE TIMEOUT IS PART OF THE LEASE rather than the caller's business. A
 * session that is never closed is not a leak that shows up as a leak: it counts
 * against the account's concurrency cap until the platform's idle reaper takes
 * it, so a handful of wedged runs degrade into an outage that looks like a hang.
 * Bounding the lease here means the failure mode of a hung page is a failed
 * screenshot, which is legible, rather than a shrinking pool, which is not.
 *
 * The race deliberately does not try to cancel `fn`. It cannot — a pending
 * `goto` has no abort — and it does not need to: closing the browser is what
 * frees the resource, and that happens in the `finally` either way.
 */
export async function withBrowserSession<T>(
  launch: BrowserLauncher,
  fn: (session: BrowserSession) => Promise<T>,
  opts: BrowserSessionOptions = {},
): Promise<T> {
  const browser = await launch()
  const session: BrowserSession = {
    driverFactory: (driverOpts: CfDriverOptions = {}) => async () =>
      new CfBrowserDriver(browser, driverOpts),
  }
  const timeoutMs = opts.timeoutMs ?? DEFAULT_SESSION_TIMEOUT_MS
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([
      fn(session),
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new BrowserSessionTimeoutError(timeoutMs)),
          timeoutMs,
        )
      }),
    ])
  } finally {
    if (timer !== undefined) clearTimeout(timer)
    // The one line the whole lease exists for. `.catch` because a browser that
    // already died must not turn a real failure into a confusing second one.
    await browser.close().catch(() => undefined)
  }
}

/** Raised when a lease outlives its ceiling. Named so a caller can tell it from
 *  a page error — the session is gone either way, but the causes differ. */
export class BrowserSessionTimeoutError extends Error {
  constructor(public readonly timeoutMs: number) {
    super(`Browser session exceeded ${timeoutMs}ms and was released.`)
    this.name = 'BrowserSessionTimeoutError'
  }
}

/**
 * Local Playwright implementation of the {@link BrowserDriver} seam (DOC-13
 * §2.2). It navigates the *live* URL, caches every response seen during
 * navigation, and answers computed-signal queries against the rendered DOM.
 * A Cloudflare Browser Rendering driver is a later drop-in swap behind the same
 * interface — nothing above this file changes.
 */
import type { Browser, Page, Response } from 'playwright'
import type {
  BrowserDriver,
  BrowserDriverFactory,
  CapturedResponse,
  InteractionState,
  PageDiagnostics,
  RenderEngine,
  Viewport,
} from './types'

const DEFAULT_VIEWPORT: Viewport = { width: 1280, height: 800 }

/**
 * REQ-48 (item 6) — the rendering engines the fidelity gate can shoot across
 * (Blink / WebKit / Gecko). Defined on the pure type surface ({@link
 * ./types}); re-exported here so existing importers keep their path. Cross-engine
 * diffs are layout-box equivalence (the px-tolerant geometry compare), never
 * pixel-equality — anti-aliasing and font hinting differ per engine.
 */
export type { RenderEngine } from './types'

/** The subset of a CDP `DOM.Node` the pseudo-state walk reads (REQ-48 item 1). */
interface CdpNode {
  nodeId: number
  nodeType: number
  children?: CdpNode[]
  contentDocument?: CdpNode
}

class PlaywrightDriver implements BrowserDriver {
  private browser: Browser | null = null
  private page: Page | null = null
  private readonly cached: CapturedResponse[] = []
  private readonly diag: PageDiagnostics = {
    consoleErrors: [],
    pageErrors: [],
    failedRequests: [],
    requestedUrls: [],
  }

  constructor(private readonly engine: RenderEngine = 'chromium') {}

  async navigate(url: string, viewport?: Viewport): Promise<void> {
    const playwright = await import('playwright')
    this.browser = await playwright[this.engine].launch()
    // REQ-48 (item 1) — freeze-determinism precondition. Motion (entrance
    // animations, hover transitions, parallax) is time-dependent, so an
    // unfrozen page projects a different frame every run and the whole gate is
    // flaky. Emulating `prefers-reduced-motion: reduce` collapses animations to
    // their resting state so the projection is deterministic; the *declaration*
    // of motion is still captured from computed styles (item 1 motion field).
    const context = await this.browser.newContext({
      viewport: viewport ?? DEFAULT_VIEWPORT,
      reducedMotion: 'reduce',
    })
    this.page = await context.newPage()

    // Cache every response as it arrives; bodies are read after load settles.
    const pending: Response[] = []
    this.page.on('response', (resp) => pending.push(resp))

    // Page-health signals (REQ-39): listeners must be armed *before* goto so
    // load-time console errors, uncaught exceptions and failed subresource
    // requests are all observed. `console` type 'error' also captures the
    // "Uncaught (in promise)" line Chromium logs for unhandled rejections.
    this.page.on('console', (msg) => {
      if (msg.type() === 'error') this.diag.consoleErrors.push(msg.text())
    })
    this.page.on('pageerror', (err) => this.diag.pageErrors.push(err.message))
    this.page.on('requestfailed', (req) => this.diag.failedRequests.push(req.url()))
    // Every request, before it resolves — the full egress surface (REQ-40). A
    // failed cross-origin request never becomes a response, so egress cannot be
    // derived from `responses()`; it must be observed at request time.
    this.page.on('request', (req) => this.diag.requestedUrls.push(req.url()))

    await this.page.goto(url, { waitUntil: 'networkidle' })

    // REQ-48 (item 7) — web-font load precondition. `networkidle` can settle
    // before the browser swaps from a fallback face to the intended @font-face,
    // so computed styles read now would record fallback metrics (FOUT) and every
    // downstream delta would be contaminated. Waiting on `document.fonts.ready`
    // guarantees each declared face has resolved (or failed) first. Best-effort:
    // an engine without the FontFaceSet API must not block the capture.
    await this.page
      .evaluate('document.fonts && document.fonts.ready ? document.fonts.ready.then(function(){return true}) : true')
      .catch(() => undefined)

    // REQ-36 — reveal below-fold lazy/animated content before any screenshot or
    // query. `reducedMotion` (above) freezes *motion* but not the *triggers*:
    // Elementor lazy images and `fadeIn` blocks stay unrequested / `.elementor-
    // invisible` (opacity 0) until their IntersectionObserver fires on scroll,
    // and the page is never scrolled — so below-fold images and animated text
    // were captured blank, the reference screenshot then silently omitted real
    // content, and no pixel gate could flag the gap. Runs before the response
    // drain so lazy subresources mirror into the offline bundle too.
    await this.settlePage()

    for (const resp of pending) {
      try {
        const body = await resp.body()
        this.cached.push({
          url: resp.url(),
          status: resp.status(),
          contentType: resp.headers()['content-type'] ?? null,
          body: new Uint8Array(body),
        })
      } catch {
        // Redirects / 204s / already-freed bodies carry nothing to mirror.
      }
    }
  }

  /**
   * REQ-36 — settle below-fold lazy/animated content so the next
   * {@link screenshot} / {@link query} sees the whole page. Collapses entrance-
   * animation timing to ~0 and reveals Elementor's pre-animation hidden state,
   * scrolls the full height in viewport steps to trip lazy-load + animation
   * IntersectionObservers, promotes any residual lazy images to eager, then
   * awaits image decode + network idle. Best-effort throughout: a page without
   * these patterns is unaffected, and any step that rejects must not fail the
   * capture (the screenshot is still worth taking).
   */
  private async settlePage(): Promise<void> {
    const page = this.requirePage()
    // Land any triggered entrance animation on its final frame instantly, and
    // reveal Elementor's `.elementor-invisible` pre-animation state, so a
    // `fadeIn` block shows its content instead of opacity 0.
    await page
      .addStyleTag({
        content:
          '*,*::before,*::after{animation-delay:0s!important;animation-duration:0s!important;transition-delay:0s!important;transition-duration:0s!important;}.elementor-invisible{visibility:visible!important;opacity:1!important;}',
      })
      .catch(() => undefined)
    // Scroll the full height in viewport steps to trip lazy-load / entrance
    // observers, return to the top, and promote any residual lazy images.
    await page
      .evaluate(async () => {
        const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms))
        const step = window.innerHeight || 800
        for (let y = 0; y < document.body.scrollHeight; y += step) {
          window.scrollTo(0, y)
          await sleep(120)
        }
        window.scrollTo(0, 0)
        for (const img of Array.from(document.images)) {
          img.loading = 'eager'
          const ds = img.getAttribute('data-src')
          if (ds && !img.currentSrc) img.src = ds
        }
      })
      .catch(() => undefined)
    // Wait for every image to finish decoding — lazy ones were only requested
    // just now, during the scroll.
    await page
      .evaluate(
        () =>
          Promise.all(
            Array.from(document.images).map((img) =>
              img.complete
                ? Promise.resolve()
                : new Promise<void>((res) => {
                    img.addEventListener('load', () => res(), { once: true })
                    img.addEventListener('error', () => res(), { once: true })
                  }),
            ),
          ).then(() => undefined),
      )
      .catch(() => undefined)
    // Let the newly-triggered subresource requests settle.
    await page.waitForLoadState('networkidle').catch(() => undefined)
  }

  async screenshot(viewport?: Viewport): Promise<Uint8Array> {
    const page = this.requirePage()
    if (viewport) await page.setViewportSize(viewport)
    const buf = await page.screenshot({ fullPage: true, type: 'png' })
    return new Uint8Array(buf)
  }

  /**
   * REQ-48 (item 1) — actuate an interaction pseudo-state on the *whole* rendered
   * DOM via CDP `CSS.forcePseudoState`, so the next {@link query}/{@link
   * screenshot} reads the hover / focus / active frame. `'rest'` forces the empty
   * set, clearing any prior state. Chromium-only (CDP is a Blink protocol); WebKit
   * and Gecko launch through Playwright's Chromium-shaped CDP shim for the other
   * capture signals but do not expose `forcePseudoState`, so on those engines this
   * is a no-op and the loop keeps them to `'rest'` (it checks
   * {@link PlaywrightDriver.canActuate}).
   *
   * The `reducedMotion: 'reduce'` context (set in {@link navigate}) collapses each
   * transition to its end-state instantly, so the forced frame is deterministic —
   * there is no animation mid-point to race.
   */
  async actuate(state: InteractionState): Promise<void> {
    const page = this.requirePage()
    const client = await page.context().newCDPSession(page)
    try {
      await client.send('DOM.enable')
      await client.send('CSS.enable')
      const forced = state === 'rest' ? [] : [state]
      const { root } = (await client.send('DOM.getDocument', { depth: -1, pierce: true })) as {
        root: CdpNode
      }
      const ids: number[] = []
      const stack: CdpNode[] = [root]
      while (stack.length) {
        const node = stack.pop()!
        if (node.nodeType === 1) ids.push(node.nodeId) // element nodes only
        if (node.children) stack.push(...node.children)
        if (node.contentDocument) stack.push(node.contentDocument)
      }
      for (const nodeId of ids) {
        // A node may have been detached between snapshot and force — tolerate it
        // per-node rather than aborting the whole actuation.
        await client.send('CSS.forcePseudoState', { nodeId, forcedPseudoClasses: forced }).catch(() => undefined)
      }
    } finally {
      await client.detach().catch(() => undefined)
    }
  }

  /** Whether {@link actuate} does real work here (CDP `forcePseudoState` is Blink-only). */
  canActuate(): boolean {
    return this.engine === 'chromium'
  }

  async query<T = unknown>(script: string): Promise<T> {
    return (await this.requirePage().evaluate(script)) as T
  }

  responses(): CapturedResponse[] {
    return this.cached
  }

  diagnostics(): PageDiagnostics {
    return this.diag
  }

  async content(): Promise<string> {
    return this.requirePage().content()
  }

  async close(): Promise<void> {
    await this.browser?.close()
    this.browser = null
    this.page = null
  }

  private requirePage(): Page {
    if (!this.page) throw new Error('BrowserDriver.navigate() must be called before use.')
    return this.page
  }
}

/** The production driver factory: a fresh local Playwright/Chromium driver. */
export const createPlaywrightDriver: BrowserDriverFactory = async () => new PlaywrightDriver()

/**
 * REQ-48 (item 6) — a driver factory bound to a specific engine, so the same
 * capture pipeline can shoot Blink, WebKit and Gecko behind the one seam. The
 * WebKit/Gecko binaries are provisioned separately (`playwright install webkit
 * firefox`); {@link engineAvailable} lets a caller skip an absent engine cleanly.
 */
export function createEngineDriver(engine: RenderEngine): BrowserDriverFactory {
  return async () => new PlaywrightDriver(engine)
}

/**
 * Whether a real browser of the given engine can launch here. Lets fidelity UATs
 * skip cleanly on a runner missing that engine instead of hard-failing (CI
 * provisions engines via `playwright install --with-deps <engine>`). Resolves
 * `playwright` from this package, which declares it.
 */
export async function engineAvailable(engine: RenderEngine = 'chromium'): Promise<boolean> {
  try {
    const playwright = await import('playwright')
    const browser = await playwright[engine].launch()
    await browser.close()
    return true
  } catch {
    return false
  }
}

/** Back-compat alias — whether a real Chromium can launch here. */
export const chromiumAvailable = (): Promise<boolean> => engineAvailable('chromium')

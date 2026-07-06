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
  PageDiagnostics,
  Viewport,
} from './types'

const DEFAULT_VIEWPORT: Viewport = { width: 1280, height: 800 }

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

  async navigate(url: string, viewport?: Viewport): Promise<void> {
    const { chromium } = await import('playwright')
    this.browser = await chromium.launch()
    const context = await this.browser.newContext({ viewport: viewport ?? DEFAULT_VIEWPORT })
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

  async screenshot(viewport?: Viewport): Promise<Uint8Array> {
    const page = this.requirePage()
    if (viewport) await page.setViewportSize(viewport)
    const buf = await page.screenshot({ fullPage: true, type: 'png' })
    return new Uint8Array(buf)
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
 * Whether a real Chromium can launch here. Lets fidelity UATs skip cleanly on a
 * browser-less runner instead of hard-failing (CI provisions Chromium via
 * `playwright install --with-deps chromium`). Resolves `playwright` from this
 * package, which declares it.
 */
export async function chromiumAvailable(): Promise<boolean> {
  try {
    const { chromium } = await import('playwright')
    const browser = await chromium.launch()
    await browser.close()
    return true
  } catch {
    return false
  }
}

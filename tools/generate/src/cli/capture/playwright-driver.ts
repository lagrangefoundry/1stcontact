/**
 * Local Playwright implementation of the {@link BrowserDriver} seam (DOC-13
 * §2.2). It navigates the *live* URL, caches every response seen during
 * navigation, and answers computed-signal queries against the rendered DOM.
 * A Cloudflare Browser Rendering driver is a later drop-in swap behind the same
 * interface — nothing above this file changes.
 */
import type { Browser, Page, Response } from 'playwright'
import type { BrowserDriver, BrowserDriverFactory, CapturedResponse, Viewport } from './types'

const DEFAULT_VIEWPORT: Viewport = { width: 1280, height: 800 }

class PlaywrightDriver implements BrowserDriver {
  private browser: Browser | null = null
  private page: Page | null = null
  private readonly cached: CapturedResponse[] = []

  async navigate(url: string): Promise<void> {
    const { chromium } = await import('playwright')
    this.browser = await chromium.launch()
    const context = await this.browser.newContext({ viewport: DEFAULT_VIEWPORT })
    this.page = await context.newPage()

    // Cache every response as it arrives; bodies are read after load settles.
    const pending: Response[] = []
    this.page.on('response', (resp) => pending.push(resp))

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

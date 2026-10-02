/**
 * REQ-154 — a puppeteer-shaped browser, at the boundary and nowhere inside it.
 *
 * WHY THIS IS A LEGITIMATE FAKE. The rule is "mock only true external
 * boundaries, never a component we own". A Browser Rendering session is a third
 * party reached over a wire protocol — the far side of the last seam — and there
 * is no version of these tests in which real Chromium is the thing under test.
 * What IS under test is everything between the seam and us: the interception
 * decision, the per-host ownership rule, the response cache, the context
 * lifecycle and the lease. All of that is real code here.
 *
 * SO THIS FAKE DRIVES THE DRIVER RATHER THAN ANSWERING IT. `goto` does what a
 * browser does: it emits the navigation request through the driver's own
 * interception handler, takes whatever the handler fulfils as the document,
 * parses that document for subresources exactly as a browser would, and emits a
 * request for each one resolved against the page's real `baseURI`. A fake that
 * merely returned bytes would prove nothing about the mechanism this ticket is
 * for.
 */
import type {
  PuppeteerBrowser,
  PuppeteerContext,
  PuppeteerPage,
} from '../../tools/generate/src/cli/capture/cf-driver'
import type { Viewport } from '../../tools/generate/src/cli/capture/types'

/** What the fake observed, for a test to assert against. */
export interface BrowserLog {
  /** Every URL the page asked for, in order. */
  requested: string[]
  /** URLs the driver fulfilled in-process, with the bytes it handed over. */
  fulfilled: Array<{ url: string; status: number; contentType: string; body: string }>
  /** URLs the driver let go to the network. */
  continued: string[]
  /** How many browser contexts were created and closed. */
  contextsOpened: number
  contextsClosed: number
  /** Whether the BROWSER itself was released. The lease's whole job. */
  browserClosed: boolean
  /** Viewports applied, in order (navigate then screenshot). */
  viewports: Viewport[]
  /** Page scripts evaluated, in order. */
  evaluated: string[]
}

export interface FakeBrowserOptions {
  /** Extra URLs the "browser" requests during load, beyond parsed subresources. */
  extraRequests?: string[]
  /** Make `goto` hang forever, to exercise the lease's timeout. */
  hang?: boolean
  /** Make `goto` throw, to exercise release-on-failure. */
  failOnGoto?: boolean
  /**
   * The bytes `screenshot()` hands back ([[REQ-206]]).
   *
   * DEFAULTS TO THE SIGNATURE ALONE, which is what every caller before this
   * wanted: they sniff the type and nothing decodes the pixels. A caller that
   * drives the fidelity surface DOES — `screenshot` decodes, downsamples and
   * re-encodes before the model ever sees the picture — so it passes a real PNG
   * rather than having this file grow an encoder it would then be the second
   * definition of.
   */
  png?: Uint8Array
  /**
   * What the far side of the wire serves, by URL ([[BUG-172]]).
   *
   * A request the driver lets go to the network is, by default, answered with
   * nothing — which is all a test of in-process fulfilment needs. A URL named
   * here is answered with this body and reported back through the page's
   * `response` event, as a browser does, so the driver's response cache sees
   * real sizes. The navigated URL's body becomes the document.
   */
  network?: Record<string, { body: string | Uint8Array; contentType?: string }>
}

/** Eight bytes of a real PNG signature + IHDR, so a caller can sniff the type. */
const PNG_HEAD = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

function pngBytes(): Uint8Array {
  const out = new Uint8Array(PNG_HEAD.length + 8)
  out.set(PNG_HEAD, 0)
  return out
}

/** The subresource URLs a browser would issue for this document, absolutised. */
function subresourcesOf(html: string, base: string): string[] {
  const urls: string[] = []
  const attr = /(?:href|src)\s*=\s*["']([^"']+)["']/gi
  let m: RegExpExecArray | null
  while ((m = attr.exec(html)) !== null) {
    const raw = m[1]
    if (raw.startsWith('#') || raw.startsWith('data:') || raw.startsWith('mailto:')) continue
    try {
      urls.push(new URL(raw, base).toString())
    } catch {
      // A malformed reference is one a browser would drop too.
    }
  }
  return [...new Set(urls)]
}

class FakePage implements PuppeteerPage {
  private handlers = new Map<string, Array<(arg: never) => void>>()
  private intercepting = false
  private document = ''
  private pageUrl = 'about:blank'

  constructor(
    private readonly log: BrowserLog,
    private readonly opts: FakeBrowserOptions,
  ) {}

  async setViewport(viewport: Viewport): Promise<void> {
    this.log.viewports.push({ ...viewport })
  }

  async emulateMediaFeatures(): Promise<void> {}

  async setRequestInterception(enabled: boolean): Promise<void> {
    this.intercepting = enabled
  }

  on(event: string, handler: (arg: never) => void): unknown {
    const list = this.handlers.get(event) ?? []
    list.push(handler)
    this.handlers.set(event, list)
    return this
  }

  async goto(url: string): Promise<unknown> {
    if (this.opts.failOnGoto) throw new Error('net::ERR_CONNECTION_REFUSED')
    if (this.opts.hang) return new Promise(() => {})
    if (!this.intercepting) throw new Error('fake browser: interception was never armed')
    this.pageUrl = url
    this.document = (await this.issue(url, 'document')) ?? ''
    for (const sub of [...subresourcesOf(this.document, url), ...(this.opts.extraRequests ?? [])]) {
      await this.issue(sub)
    }
    return {}
  }

  /**
   * One request, through the driver's own handler. Resolves to the body the
   * driver fulfilled with, or — when it sent the request to the network — the
   * text {@link FakeBrowserOptions.network} serves there, else `null`.
   */
  private async issue(url: string, resourceType = 'other'): Promise<string | null> {
    const handlers = this.handlers.get('request') ?? []
    if (handlers.length === 0) throw new Error('fake browser: no request handler registered')
    if (handlers.length > 1) {
      // With interception armed, exactly one listener may resolve a request.
      throw new Error('fake browser: more than one request handler would double-resolve')
    }
    let resolved = false
    let settle: (body: string | null) => void = () => {}
    // CDP pauses the request until the client answers, so the fake does too —
    // a fixed number of microtask yields would race the resolver's real D1 read.
    const settled = new Promise<string | null>((res) => {
      settle = res
    })
    const request = {
      url: () => url,
      // What a browser labels every request with. Only the navigation is a
      // document; with no frame exposed, the driver reads it as the main one.
      resourceType: () => resourceType,
      respond: async (r: { status: number; contentType: string; body: string | Uint8Array }) => {
        if (resolved) throw new Error(`fake browser: ${url} resolved twice`)
        resolved = true
        const body = typeof r.body === 'string' ? r.body : new TextDecoder().decode(r.body)
        this.log.fulfilled.push({ url, status: r.status, contentType: r.contentType, body })
        settle(body)
      },
      continue: async () => {
        if (resolved) throw new Error(`fake browser: ${url} resolved twice`)
        resolved = true
        this.log.continued.push(url)
        const served = this.opts.network?.[url]
        if (!served) return settle(null)
        const bytes =
          typeof served.body === 'string' ? new TextEncoder().encode(served.body) : served.body
        const response = {
          url: () => url,
          status: () => 200,
          headers: () => ({ 'content-type': served.contentType ?? 'application/octet-stream' }),
          buffer: async () => bytes,
        }
        for (const h of this.handlers.get('response') ?? []) h(response as never)
        settle(typeof served.body === 'string' ? served.body : null)
      },
    }
    this.log.requested.push(url)
    handlers[0](request as never)
    const timeout = new Promise<never>((_, rej) =>
      setTimeout(() => rej(new Error(`fake browser: ${url} was never resolved by the driver`)), 5000),
    )
    return Promise.race([settled, timeout])
  }

  async evaluate(script: string): Promise<unknown> {
    this.log.evaluated.push(script)
    return true
  }

  async addStyleTag(): Promise<unknown> {
    return {}
  }

  async waitForNetworkIdle(): Promise<void> {}

  async screenshot(): Promise<Uint8Array> {
    return this.opts.png ?? pngBytes()
  }

  async content(): Promise<string> {
    return this.document
  }

  /** The URL the page settled on — the real origin the driver navigated. */
  url(): string {
    return this.pageUrl
  }
}

class FakeContext implements PuppeteerContext {
  constructor(
    private readonly log: BrowserLog,
    private readonly opts: FakeBrowserOptions,
  ) {}

  async newPage(): Promise<PuppeteerPage> {
    return new FakePage(this.log, this.opts)
  }

  async close(): Promise<void> {
    this.log.contextsClosed += 1
  }
}

class FakeBrowser implements PuppeteerBrowser {
  constructor(
    private readonly log: BrowserLog,
    private readonly opts: FakeBrowserOptions,
  ) {}

  async createBrowserContext(): Promise<PuppeteerContext> {
    this.log.contextsOpened += 1
    return new FakeContext(this.log, this.opts)
  }

  async close(): Promise<void> {
    this.log.browserClosed = true
  }
}

/** A launcher and the log it writes into. One browser per launch, as in production. */
export function fakeBrowser(opts: FakeBrowserOptions = {}): {
  launch: () => Promise<PuppeteerBrowser>
  log: BrowserLog
  launches: () => number
} {
  const log: BrowserLog = {
    requested: [],
    fulfilled: [],
    continued: [],
    contextsOpened: 0,
    contextsClosed: 0,
    browserClosed: false,
    viewports: [],
    evaluated: [],
  }
  let launches = 0
  return {
    log,
    launches: () => launches,
    launch: async () => {
      launches += 1
      return new FakeBrowser(log, opts)
    },
  }
}

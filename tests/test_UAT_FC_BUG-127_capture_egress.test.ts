import { describe, expect, it } from 'vitest'
import { fidelityOperations } from '../tools/generate/src/cli/ai/fidelity-core'
import type { FidelityDeps } from '../tools/generate/src/cli/ai/fidelity-core'
import { classifyUrl, egressGuard } from '../tools/generate/src/cli/capture/egress-guard'
import type { EgressGuard } from '../tools/generate/src/cli/capture/egress-guard'
import { memoryReferenceStore } from '../tools/generate/src/store/memory-reference-store'
import { VIEWPORTS } from '../tools/generate/src/cli/capture/screenshot'
import type {
  BrowserDriver,
  CapturedResponse,
  Viewport,
} from '../tools/generate/src/cli/capture/types'
import { signalsFor } from './support/fake-capture-driver'

/**
 * BUG-127 — **capture works against real websites, and a capture that failed
 * says so.**
 *
 * WHAT WENT WRONG. The egress guard's redirect cap counted *distinct origins
 * seen over a whole capture* while its comment claimed it counted navigation
 * documents. Five origins is fewer than any real page uses — a host, a CDN, two
 * font hosts, an image host, a tag manager — so `stripe.com`, `pentagram.com`
 * and every other comp a client names tripped it. Worse, tripping latched: one
 * `capture_site` runs four navigation passes over one guard, so after the trip
 * every later pass had its MAIN DOCUMENT answered `403 refused by egress policy`
 * and the browser rendered that sentence as the page. `capture_site` then
 * reported the same success shape it reports for a good capture, so the bundle
 * was adopted and the failure surfaced only at screenshot time, as a black
 * rectangle, with the page-load budget already spent.
 *
 * WHAT IS REAL HERE. The guard is the production guard, the operation is the
 * production `capture_site` over a real `ReferenceStore`, and the whole capture
 * pipeline — four passes, bundle write, fold, hints — runs for real. ONE thing
 * is a double: the browser, which is the seam the `BrowserDriver` design exists
 * to have injected, and it is doubled in the one way that matters here — it asks
 * the real guard about every request, labelling each one the way the two
 * production drivers label theirs.
 *
 * WHY THE BROWSER CANNOT BE REAL IN THESE TESTS. The guard refuses loopback and
 * private address space, which is what a test HTTP server is. A guarded capture
 * of a local fixture is refused by construction and would assert the opposite of
 * what is under test.
 */

const ORIGIN = 'https://app.example.test'
/** A 1×1 PNG. The pixels are not what these tests are about. */
const PNG = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])

/** What a page pulls and how it arrived — the facts a URL does not carry. */
interface PageScript {
  /** Redirect hops the main document arrived after. */
  redirectDepth?: number
  /** Subresource URLs the page requests, on every navigation pass. */
  subresources?: string[]
  /** Bytes the page's responses delivered, per navigation pass. */
  bytes?: number
}

/**
 * A browser that asks the real guard about every request, and answers a refused
 * document with the refusal page rather than by throwing.
 *
 * THE 403 IS THE WHOLE POINT. Production fulfils a refused request with `403
 * refused by egress policy`, which the browser renders — so a refused navigation
 * does not fail, it *succeeds and returns the wrong page*. A double that threw
 * instead would hand the pipeline an error to retry and the bug under test could
 * not occur.
 */
class GuardedFakeDriver implements BrowserDriver {
  static refusedPages: string[] = []
  private refused = false
  constructor(
    private readonly guard: EgressGuard,
    private readonly script: PageScript,
  ) {}

  async navigate(url: string, _viewport?: Viewport): Promise<void> {
    const allowed = this.guard.allow(url, {
      kind: 'document',
      redirectDepth: this.script.redirectDepth ?? 0,
    })
    this.refused = !allowed
    if (!allowed) {
      GuardedFakeDriver.refusedPages.push(url)
      return
    }
    for (const sub of this.script.subresources ?? []) {
      this.guard.allow(sub, { kind: 'subresource' })
    }
    if (this.script.bytes) this.guard.record(this.script.bytes)
  }

  async screenshot(_viewport?: Viewport): Promise<Uint8Array> {
    return PNG
  }
  async query<T>(_script: string): Promise<T> {
    return signalsFor(VIEWPORTS.desktop.width) as T
  }
  responses(): CapturedResponse[] {
    return []
  }
  diagnostics() {
    return { consoleErrors: [], pageErrors: [], failedRequests: [], requestedUrls: [] }
  }
  async content(): Promise<string> {
    return this.refused
      ? '<html><body>refused by egress policy</body></html>'
      : '<html><body><h1>Pricing</h1></body></html>'
  }
  async close(): Promise<void> {}
}

/** The surface's dependencies, with the browser doubled and nothing else. */
function deps(script: PageScript): FidelityDeps & { adopted: string[] } {
  const adopted: string[] = []
  return {
    slug: 'studio',
    origin: ORIGIN,
    references: memoryReferenceStore(),
    driverFactory: async () => new GuardedFakeDriver(egressGuard(), script),
    guardedDriver: (guard) => async () => new GuardedFakeDriver(guard, script),
    adoptCapture: async (bundle: string) => {
      adopted.push(bundle)
      return { uid: `reference-${adopted.length}`, created: true }
    },
    adopted,
  }
}

/** Twelve third-party origins — fewer than a real marketing page, more than five. */
const THIRD_PARTY = [
  'https://cdn.example.test/app.js',
  'https://fonts.googleapis.test/css2?family=Inter',
  'https://fonts.gstatic.test/s/inter/v13/font.woff2',
  'https://images.example.test/hero.jpg',
  'https://www.googletagmanager.test/gtm.js',
  'https://static.hotjar.test/c/hotjar.js',
  'https://js.stripe.test/v3',
  'https://cdn.segment.test/analytics.js',
  'https://player.vimeo.test/video/1',
  'https://widget.intercom.test/frame.js',
  'https://assets.typekit.test/kit.css',
  'https://analytics.example.test/beacon.gif',
]

describe('BUG-127 — the egress guard stops refusing the ordinary web', () => {
  it('test_UAT_FC_BUG_127_a_page_with_many_third_party_origins_captures', async () => {
    // THE REPORTED FAILURE, AT THE OPERATION. Twelve origins is what a comp
    // looks like; five was the cap, and counting origins is what made this the
    // refusal of every real site rather than the detection of a loop.
    GuardedFakeDriver.refusedPages = []
    const d = deps({ subresources: THIRD_PARTY })
    const ops = fidelityOperations(d)

    const result = (await ops.capture_site({ url: 'https://stripe.test/' })) as {
      bundle: string
      refusals: unknown[]
      reference: { adopted: boolean }
    }

    expect(result.bundle).toBeTruthy()
    expect(result.refusals).toEqual([])
    expect(result.reference.adopted).toBe(true)
    // Not one page of the four-pass capture was answered with the refusal text.
    expect(GuardedFakeDriver.refusedPages).toEqual([])
    expect(d.adopted).toHaveLength(1)
  })

  it('test_UAT_FC_BUG_127_a_redirect_loop_is_refused_as_a_redirect_loop', async () => {
    // The cap still exists and still catches what it is for — hops along ONE
    // navigation chain — and the sentence it produces now describes that rather
    // than calling a font host a redirect.
    const d = deps({ redirectDepth: 6 })
    const ops = fidelityOperations(d)

    await expect(ops.capture_site({ url: 'https://loop.test/' })).rejects.toThrow(
      /REFUSED.*redirect loop/s,
    )
    // And no bundle was adopted off the back of it.
    expect(d.adopted).toEqual([])
  })

  it('test_UAT_FC_BUG_127_a_cap_on_one_pass_does_not_refuse_the_next_page', async () => {
    // ONE CAPTURE IS FOUR NAVIGATION PASSES over one guard. A refusal used to
    // latch, so a cap reached partway through pass one refused the main document
    // of passes two, three and four — which is why the *screenshots* came back
    // unviewable rather than merely incomplete.
    const guard = egressGuard({ maxRedirects: 2 })

    expect(guard.allow('https://a.test/', { kind: 'document', redirectDepth: 3 })).toBe(false)
    expect(guard.refusals.map((r) => r.reason)).toEqual(['redirect-cap'])
    // The next pass starts its own chain at zero and is allowed.
    expect(guard.allow('https://a.test/', { kind: 'document', redirectDepth: 0 })).toBe(true)
    // And nothing about a per-request refusal spends the capture's budget.
    expect(guard.tripped).toBe(false)

    // Forty subresources across forty origins are forty chains of depth zero.
    for (let i = 0; i < 40; i++) {
      expect(guard.allow(`https://host${i}.test/asset.png`, { kind: 'subresource' })).toBe(true)
    }
    expect(guard.refusals).toHaveLength(1)
  })

  it('test_UAT_FC_BUG_127_a_refused_document_fails_rather_than_adopting', async () => {
    // The byte cap IS a whole-capture budget, so it latches — and a later pass
    // whose page is refused therefore still happens. What must not happen is
    // what used to: reporting that as a success and adopting the refusal text as
    // a reference. `MAX_RESPONSE_BYTES` is 32MB; one pass delivering 40MB spends
    // the capture's whole allowance.
    GuardedFakeDriver.refusedPages = []
    const d = deps({ bytes: 40 * 1024 * 1024 })
    const ops = fidelityOperations(d)

    await expect(ops.capture_site({ url: 'https://heavy.test/' })).rejects.toThrow(
      /REFUSED.*page itself was refused/s,
    )
    // The capture really did lose a page — this is not a pre-flight refusal.
    expect(GuardedFakeDriver.refusedPages.length).toBeGreaterThan(0)
    // And the bundle of refusal text was never made findable.
    expect(d.adopted).toEqual([])
  })

  it('test_UAT_FC_BUG_127_a_refused_subresource_is_reported_not_fatal', async () => {
    // The other half of the verdict: a hole in a page is a hole, not a failure.
    // A beacon pointed at link-local space is refused on every pass, the capture
    // still stands, and the refusals are reported so a later fidelity verdict is
    // not quietly computed against a page missing a third of its images.
    const d = deps({
      subresources: ['http://169.254.169.254/beacon.gif', 'https://cdn.example.test/app.js'],
    })
    const ops = fidelityOperations(d)

    const result = (await ops.capture_site({ url: 'https://partial.test/' })) as {
      bundle: string
      refusals: { url: string; reason: string }[]
      reference: { adopted: boolean }
    }

    expect(result.bundle).toBeTruthy()
    expect(result.reference.adopted).toBe(true)
    expect(result.refusals.length).toBeGreaterThan(0)
    expect(result.refusals.every((r) => r.reason === 'private-address')).toBe(true)
  })

  it('test_UAT_FC_BUG_127_the_address_rules_are_unchanged', async () => {
    // THE SSRF CONTROL IS UNTOUCHED, asserted here rather than only next door so
    // that a future relaxation of the caps above cannot quietly relax this too.
    for (const bad of [
      'http://169.254.169.254/latest/meta-data/',
      'http://127.0.0.1:8787/',
      'http://localhost/',
      'https://db.internal/',
      'https://printer.local/',
      'file:///etc/passwd',
      'data:text/html,<script>',
      'https://user:pw@example.test/',
    ]) {
      expect(classifyUrl(bad), bad).not.toBeNull()
    }
    expect(classifyUrl('https://example.test/fine')).toBeNull()

    // On the typed URL, before a browser is leased…
    const d = deps({})
    const ops = fidelityOperations(d)
    await expect(ops.capture_site({ url: 'http://169.254.169.254/' })).rejects.toThrow(
      /REFUSED.*169\.254\.169\.254/s,
    )
    expect(d.adopted).toEqual([])

    // …and on every subresource, where the typed-URL check cannot reach.
    const guard = egressGuard()
    expect(guard.allow('http://169.254.169.254/token', { kind: 'subresource' })).toBe(false)
    expect(guard.refusals.map((r) => r.reason)).toEqual(['private-address'])
  })
})

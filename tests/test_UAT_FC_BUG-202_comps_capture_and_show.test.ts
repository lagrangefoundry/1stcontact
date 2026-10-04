import { afterEach, describe, expect, it, vi } from 'vitest'
import { validateL1 } from '../packages/site-schema/src/index'
import { foldToL1 } from '../tools/generate/src'
import { fidelityOperations } from '../tools/generate/src/cli/ai/fidelity-core'
import { planOperations, seedPlan, type CompDeps, type CompRecord, type Plan } from '../tools/generate/src/cli/ai/plan-core'
import { egressGuard } from '../tools/generate/src/cli/capture/egress-guard'
import { HINTS_SCRIPT } from '../tools/generate/src/cli/capture/hints'
import type { RawSignals } from '../tools/generate/src/cli/capture/extract'
import type { MultiStateCapture, StateProjection, ValueElement } from '../tools/generate/src/cli/capture'
import type { BrowserDriver, CapturedResponse, Viewport } from '../tools/generate/src/cli/capture/types'
import { memoryReferenceStore } from '../tools/generate/src/store/memory-reference-store'
import { CANNED_HINTS, run } from './support/fake-capture-driver'
import primingDocument from '../tools/generate/src/cli/ai/priming.json'

/**
 * [[BUG-202]] — a competitor's site reaches the comp board even when its page
 * misbehaves, and every comp reaches the conversation as a tile that opens the
 * real site.
 *
 * The browser is the one double (a genuine external boundary, as REQ-155's
 * capture UATs establish); the pipeline, the fold, the bundle writer, the
 * operation and the plan are all real. The navigation half — a page whose network
 * never goes idle — needs a real browser and lives in
 * `test_UAT_FC_BUG-202_a_busy_page_is_captured.test.ts`.
 */

const PNG = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])

/**
 * A browser whose page folds into a document the L1 envelope refuses: more
 * nodes than `maxNodes` allows. No fold can repair that, so it stands for every
 * fold failure the next one finds.
 */
class UnfoldableDriver implements BrowserDriver {
  private viewport: Viewport = { width: 1280, height: 800 }
  async navigate(_url: string, viewport?: Viewport): Promise<void> {
    if (viewport) this.viewport = viewport
  }
  async screenshot(): Promise<Uint8Array> {
    return PNG
  }
  async query<T>(script: string): Promise<T> {
    if (script === HINTS_SCRIPT) return CANNED_HINTS as T
    const { width, height } = this.viewport
    const content = Array.from({ length: 2100 }, (_, i) =>
      run({ text: `Item ${i}`, role: 'body', fontSizePx: 14, box: { x: 20, y: 40 + i * 20, width: 200, height: 18 } }),
    )
    const signals: RawSignals = {
      viewport: { width, height },
      bands: [
        {
          box: { x: 0, y: 0, width, height: 40 + 2100 * 20 },
          backgroundColor: '#ffffff',
          backgroundImage: 'none',
          colorScheme: 'light',
          fontFamily: 'Inter',
          textAlign: 'left',
          paddingTopPx: 40,
          paddingBottomPx: 40,
          overlay: null,
          content,
          items: [],
          fields: [],
        },
      ],
      colorUsage: [{ hex: '#111827', usage: 'text', freq: 1 }],
      fontFaces: [],
      typeScale: [14],
      spacingScalePx: [20],
      containerMaxWidthPx: null,
      images: [],
      title: 'Expert Plumbing',
    }
    return signals as T
  }
  responses(): CapturedResponse[] {
    return []
  }
  diagnostics() {
    return { consoleErrors: [], pageErrors: [], failedRequests: [], requestedUrls: [] }
  }
  async content(): Promise<string> {
    return '<html><body>Expert Plumbing</body></html>'
  }
  async close(): Promise<void> {}
}

/**
 * A browser that cannot load the page at all, as rosenthalplumbing.com did: each
 * navigation spends the whole 30 s timeout (on a faked clock) and then fails.
 */
class TimeoutDriver extends UnfoldableDriver {
  static navigations = 0
  async navigate(): Promise<void> {
    TimeoutDriver.navigations++
    vi.setSystemTime(Date.now() + 30_000)
    throw new Error('Navigation timeout of 30000 ms exceeded')
  }
}

afterEach(() => {
  vi.useRealTimers()
})

function captureDeps(driver: () => BrowserDriver) {
  const references = memoryReferenceStore()
  return {
    references,
    deps: {
      slug: 'charlie',
      origin: 'https://app.example.test',
      references,
      driverFactory: async () => driver(),
      guardedDriver: () => async () => driver(),
      adoptCapture: async () => ({ uid: 'reference-1', created: true }),
    },
  }
}

describe('BUG-202 — a capture survives its own fold', () => {
  it('test_UAT_FC_BUG-202_a_page_whose_fold_fails_still_lands_as_a_comp_with_screenshots_and_a_warning', async () => {
    const { references, deps } = captureDeps(() => new UnfoldableDriver())
    const result = (await fidelityOperations(deps).capture_site({ url: 'https://expertplumbingca.test/' })) as {
      bundle: string
      reference: { adopted: boolean; uid: string | null }
      fold_warning?: string
    }

    // The capture is a capture: it was adopted, so it can go on the board.
    expect(result.reference).toMatchObject({ adopted: true, uid: 'reference-1' })
    // What a comp is shown by is all there.
    const bundle = references.bundle(result.bundle)
    const members = await bundle.list()
    expect(members).toContain('capture.json')
    expect(members).toContain('screenshot.full.png')
    expect(members).toContain('screenshot-1280.png')
    expect(members).toContain('screenshot-375.png')
    // The fold's failure is said, and recorded beside the bundle — not as an l1.json.
    expect(result.fold_warning).toMatch(/foldToL1/)
    expect(members).not.toContain('l1.json')
    const recorded = JSON.parse(new TextDecoder().decode((await bundle.read('fold-warning.json'))!))
    expect(recorded.warning).toBe(result.fold_warning)
  })

  it('test_UAT_FC_BUG-202_an_out_of_range_viewport_response_folds_validly', () => {
    // A box below a min-h-screen hero that a scroll-driven animation carries far
    // further than the viewport grew: 15× the height delta at the 1280 probe.
    const LADDER_H: Record<number, number> = { 320: 800, 375: 800, 768: 1024, 1024: 768, 1280: 800, 1440: 900 }
    const el = (text: string, y: number, width = 400, extra: Partial<ValueElement> = {}): ValueElement =>
      ({
        role: 'body',
        color: '#111111',
        fontFamily: 'Inter, sans-serif',
        fontSizePx: 18,
        fontWeight: 400,
        lineHeightPx: 29,
        text,
        box: { x: 24, y, width, height: 21 },
        renderedTextBox: { x: 24, y, width, height: 21 },
        ...extra,
      }) as ValueElement
    const at = (width: number, height: number) => ({
      engine: 'chromium',
      viewport: { width, height },
      state: 'rest',
      manifest: {
        source: `t:${width}x${height}`,
        viewport: { width, height },
        elements: [
          el('Hero title', 79),
          el('Animated badge', 1000 + (height - 800) * 15),
          el('hero band', 300, width, { surfaceFill: '#030717' }),
        ],
        sections: [{ box: { x: 0, y: 0, width, height } }],
      },
    })
    const projections = [
      ...Object.entries(LADDER_H).map(([w, h]) => at(Number(w), h)),
      at(1280, 1000),
    ] as unknown as StateProjection[]
    const ms: MultiStateCapture = { url: 'http://fixture.test/', notes: [], projections }

    const doc = foldToL1(ms)
    expect(validateL1(doc).ok).toBe(true)
    const factors: number[] = []
    const walk = (n: Record<string, unknown>): void => {
      const kfs = (n.geometry as { keyframes?: Array<{ viewportResponse?: Record<string, number> }> } | undefined)
        ?.keyframes
      for (const kf of kfs ?? []) for (const f of Object.values(kf.viewportResponse ?? {})) factors.push(f)
      for (const c of (n.children as Record<string, unknown>[] | undefined) ?? []) walk(c)
    }
    walk(doc.root as unknown as Record<string, unknown>)
    for (const f of factors) expect(Math.abs(f)).toBeLessThanOrEqual(10)
  })
})

describe('BUG-202 — a capture that cannot load says so quickly, and still links the site', () => {
  it('test_UAT_FC_BUG-202_a_failed_capture_answers_a_tile_that_links_the_real_site', async () => {
    TimeoutDriver.navigations = 0
    vi.useFakeTimers({ toFake: ['Date'] })
    const { deps } = captureDeps(() => new TimeoutDriver())
    const failure = await fidelityOperations(deps)
      .capture_site({ url: 'https://rosenthalplumbing.test/' })
      .then(() => null, (err: Error) => err.message)

    expect(failure).toMatch(/Navigation timeout/)
    // Retries have a budget in time: a navigation that spent the whole timeout
    // spent it, and two more attempts only tripled the wait. (Nor does a timeout
    // earn an alternate spelling of the host — BUG-67.)
    expect(TimeoutDriver.navigations).toBe(1)
    // The tile: no snapshot, said so, and a link that opens the real site.
    expect(failure).toContain("couldn't take a snapshot")
    expect(failure).toContain('[Open the real site ↗](https://rosenthalplumbing.test/)')
    expect(failure).not.toMatch(/!\[/)
  })

  it('test_UAT_FC_BUG-202_an_inline_data_url_is_not_a_refusal', () => {
    const guard = egressGuard()
    expect(guard.allow('data:image/png;base64,AAAA', { kind: 'subresource' })).toBe(true)
    expect(guard.allow('blob:https://site.test/1234', { kind: 'subresource' })).toBe(true)
    expect(guard.refusals).toHaveLength(0)
    // Fetchable-but-forbidden is still refused, and a page is never inline.
    expect(guard.allow('ftp://files.site.test/x', { kind: 'subresource' })).toBe(false)
    expect(guard.allow('data:text/html,hi', { kind: 'document' })).toBe(false)
  })
})

describe('BUG-202 — every comp reaches the conversation as a tile', () => {
  const comp: CompRecord = {
    reference: 'reference-1',
    title: 'Duncan Plumbing [Bay Area](x)',
    url: 'https://www.duncanplumbing.test/',
    likes: [],
    dislikes: [],
  }

  function planDeps(snapshot: string | null) {
    let stored: Plan = seedPlan('site-1')
    const comps: CompDeps = {
      get: async (reference) => (reference === comp.reference ? comp : null),
      note: async () => comp,
      snapshot: async () => snapshot,
    }
    return {
      read: async () => stored,
      write: async (change: (p: Plan) => Plan) => (stored = change(stored)),
      comps,
    }
  }

  it('test_UAT_FC_BUG-202_adding_a_comp_answers_a_tile_with_its_thumbnail_and_a_link_to_the_live_site', async () => {
    const thumb = '/b/biz-1/api/material/file?uid=reference-1&member=screenshot-1280.png'
    const out = (await planOperations(planDeps(thumb)).add_comp({ reference: comp.reference })) as {
      comp: { reference: string }
      display: string
    }
    expect(out.comp.reference).toBe('reference-1')
    expect(out.display).toMatch(/exactly as written/)
    expect(out.display).toContain(`](${thumb})`)
    expect(out.display).toContain('duncanplumbing.test')
    expect(out.display).toContain('[Open the real site ↗](https://www.duncanplumbing.test/)')
    // A stranger's title is text: its brackets cannot become a link of their own.
    expect(out.display).toContain('Duncan Plumbing \\[Bay Area\\]\\(x\\)')
    expect(out.display).not.toContain("couldn't take a snapshot")
  })

  it('test_UAT_FC_BUG-202_a_comp_with_no_snapshot_answers_the_link_without_a_thumbnail', async () => {
    const out = (await planOperations(planDeps(null)).add_comp({ reference: comp.reference })) as { display: string }
    expect(out.display).not.toMatch(/!\[/)
    expect(out.display).toContain("couldn't take a snapshot")
    expect(out.display).toContain('[Open the real site ↗](https://www.duncanplumbing.test/)')
  })
})

describe('BUG-202 — the consultant searches as well as asks', () => {
  type Section = { name?: string; text?: string[] }
  const comps = (key: 'priming' | 'priming_without_corpus'): string =>
    ((primingDocument[key] as Section[]).find((s) => s.name === 'comps')?.text ?? []).join('\n')

  it('test_UAT_FC_BUG-202_the_priming_searches_in_the_same_turn_it_asks_and_shows_each_tile', () => {
    for (const key of ['priming', 'priming_without_corpus'] as const) {
      const text = comps(key)
      expect(text).toMatch(/In the same turn, search the web yourself/)
      expect(text).toMatch(/client's sites add\s+to your search, they never replace it/)
      expect(text).toMatch(/Show each tile in your reply and invite the client to open\s+the real site/)
      expect(text).toMatch(/could not capture still comes back with a tile/)
    }
  })
})

import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { createServer, type Server } from 'node:http'
import { readFileSync, mkdtempSync, rmSync, statSync } from 'node:fs'
import type { AddressInfo } from 'node:net'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromiumAvailable, cmdCapturePage, flattenCapture, type Capture } from '../tools/generate/src/cli'
import { foldToL1 } from '../tools/generate/src'
import type { MultiStateCapture, StateProjection, ValueElement } from '../tools/generate/src/cli/capture'

/**
 * UATs for REQ-88 — the SURFACE a run sits on is resolved geometrically, not by
 * walking `parentElement`.
 *
 * The ancestor walk is a proxy for "what is painted behind this text" that only
 * holds when the painting box is a DOM ancestor. An L1 reproduction paints bands
 * and cards as absolutely-positioned SIBLINGS, so the walk skipped every card and
 * reported the body backstop: the values-diff scored ~60 phantom `surfaceFill` /
 * `borderLeft` defects on a page whose pixels were already correct, drowning the
 * real ones. Resolving by geometric containment (tightest box first) answers the
 * same question truthfully for BOTH DOM shapes.
 */

const FIXTURES = fileURLToPath(new URL('./fixtures/capture', import.meta.url))
const browserOk = await chromiumAvailable()
const itB = it.runIf(browserOk)

const tmpDirs: string[] = []
afterAll(() => {
  for (const d of tmpDirs) rmSync(d, { recursive: true, force: true })
})

async function serveDir(dir: string): Promise<{ origin: string; close: () => Promise<void> }> {
  const server: Server = createServer((req, res) => {
    const rel = decodeURIComponent((req.url ?? '/').split('?')[0]).replace(/^\/+/, '')
    const file = path.join(dir, rel || 'index.html')
    try {
      if (!statSync(file).isFile()) throw new Error('not a file')
      const type = file.endsWith('.css') ? 'text/css' : file.endsWith('.html') ? 'text/html' : 'application/octet-stream'
      res.writeHead(200, { 'content-type': type })
      res.end(readFileSync(file))
    } catch {
      res.writeHead(404).end('not found')
    }
  })
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', r))
  const { port } = server.address() as AddressInfo
  return {
    origin: `http://127.0.0.1:${port}`,
    close: () => new Promise<void>((r) => server.close(() => r())),
  }
}

describe('REQ-88 surface attribution — geometric, not ancestor-only (real Chromium)', () => {
  let server: { origin: string; close: () => Promise<void> }
  let capture: Capture

  beforeAll(async () => {
    // Probe the browser before binding a socket — a serveDir-first hook hard-fails
    // rather than skipping where 127.0.0.1 cannot be bound, taking the file down.
    if (browserOk) {
      server = await serveDir(FIXTURES)
      const cwd = mkdtempSync(path.join(tmpdir(), 'req88-surf-'))
      tmpDirs.push(cwd)
      const res = await cmdCapturePage(`${server.origin}/req88-sibling-surface.html`, { cwd })
      capture = res.capture
    }
  }, 120000)

  afterAll(async () => {
    await server?.close()
  })

  itB('test_UAT_FC_REQ-88_sibling_painted_surface_is_the_runs_fill', () => {
    const manifest = flattenCapture(capture)
    const run = manifest.elements.find((e) => e.text.includes('Sibling painted surface'))
    expect(run, 'sibling-painted run present').toBeDefined()
    // The white backing box is a SIBLING, so the old parentElement walk returned
    // the body backstop (#e8dfd3) — the exact phantom that made 37 correct runs
    // read as defects.
    expect(run?.surfaceFill).toBe('#ffffff')
    expect(run?.surfaceFill).not.toBe('#e8dfd3')
  })

  itB('test_UAT_FC_REQ-88_sibling_painted_accent_bar_is_found', () => {
    const manifest = flattenCapture(capture)
    const run = manifest.elements.find((e) => e.text.includes('Sibling painted surface'))
    expect(run, 'sibling-painted run present').toBeDefined()
    // Reported `none` before: the bar is on the sibling backing box, not an ancestor.
    expect(run?.borderLeft?.widthPx).toBe(4)
    expect(run?.borderLeft?.color).toBe('#ffb900')
  })

  itB('test_UAT_FC_REQ-88_nested_card_resolves_unchanged', () => {
    const manifest = flattenCapture(capture)
    const run = manifest.elements.find((e) => e.text.includes('Nested painted surface'))
    expect(run, 'nested run present').toBeDefined()
    // The reference side of every diff is conventionally nested. Geometric
    // containment must give the SAME answer there, or the fix would silently
    // re-baseline every captured reference.
    expect(run?.surfaceFill).toBe('#d9ccba')
    expect(run?.borderLeft?.widthPx).toBe(4)
    expect(run?.borderLeft?.color).toBe('#00d492')
  })

  itB('test_UAT_FC_REQ-88_tightest_surface_wins_over_the_band_behind_it', () => {
    const manifest = flattenCapture(capture)
    const sibling = manifest.elements.find((e) => e.text.includes('Sibling painted surface'))
    const nested = manifest.elements.find((e) => e.text.includes('Nested painted surface'))
    // Both runs sit over the same page backstop; each must report its OWN card,
    // not the shared body fill — i.e. the chain is ordered tightest-box-first.
    expect(sibling?.surfaceFill).not.toBe(nested?.surfaceFill)
    expect([sibling?.surfaceFill, nested?.surfaceFill]).not.toContain('#e8dfd3')
  })
})

// ── Band tiling stops at the captured section edge ────────────────────────────

const LADDER = [320, 375, 768, 1024, 1280, 1440]
const DARK = '#030717'
const CREAM = '#e8dfd3'

function runEl(text: string, box: ValueElement['box'], over: Partial<ValueElement> = {}): ValueElement {
  return { text, role: 'text', color: '#111111', fontFamily: 'Arial', fontSizePx: 18, fontWeight: 400, box, ...over }
}

/** A dark hero section ending at y=800, then a cream section whose first text
 *  does not start until y=896 — the 96px of section padding the hero must not eat. */
function heroThenPaddedSection(): MultiStateCapture {
  const projections: StateProjection[] = LADDER.map((width) => ({
    engine: 'chromium',
    viewport: { width, height: 1200 },
    state: 'rest',
    manifest: {
      source: `t:${width}`,
      elements: [
        runEl('Intentional Software', { x: 40, y: 300, width: width - 80, height: 40 }, { surfaceFill: DARK }),
        runEl('A Different Approach', { x: 40, y: 896, width: width - 80, height: 40 }, { surfaceFill: CREAM }),
      ],
      sections: [
        { index: 0, box: { x: 0, y: 0, width, height: 800 } },
        { index: 1, box: { x: 0, y: 800, width, height: 600 } },
      ] as unknown as StateProjection['manifest']['sections'],
      viewport: { width, height: 1200 },
    } as StateProjection['manifest'],
  }))
  return { url: 'http://fixture.test/', notes: [], projections }
}

describe('REQ-88 band tiling stops at the captured section edge', () => {
  it('test_UAT_FC_REQ-88_band_does_not_tile_past_its_section_into_the_next', () => {
    const doc = foldToL1(heroThenPaddedSection())
    const kids = (doc.root.kind === 'box' ? (doc.root.children ?? []) : []) as Array<{
      kind: string
      id?: string
      axes?: Record<string, unknown>
      geometry?: { keyframes: Array<{ at: number; y: number; height: number }> }
    }>
    const hero = kids.find((n) => (n.id ?? '').startsWith('section-band-') && n.axes?.surfaceFill === DARK)
    expect(hero, 'dark hero band folded').toBeTruthy()
    const k = hero!.geometry!.keyframes.find((f) => f.at === 1280)!
    // Tiling to the NEXT BAND'S FIRST RUN would end the dark band at 896 and paint
    // 96px of the cream section near-black — the visible navy strip under the hero.
    expect(k.y + k.height).toBe(800)
    expect(k.y + k.height).not.toBe(896)
  })

  it('test_UAT_FC_REQ-88_band_still_tiles_past_its_own_content_within_a_section', () => {
    // The clamp may only stop a band at a REAL section edge. Within one section a
    // band must still tile past its own last run, or a card sitting low on the band
    // would fall off the painted surface (the BUG-14 behaviour this must preserve).
    const doc = foldToL1(heroThenPaddedSection())
    const kids = (doc.root.kind === 'box' ? (doc.root.children ?? []) : []) as Array<{
      kind: string
      id?: string
      axes?: Record<string, unknown>
      geometry?: { keyframes: Array<{ at: number; y: number; height: number }> }
    }>
    const hero = kids.find((n) => (n.id ?? '').startsWith('section-band-') && n.axes?.surfaceFill === DARK)
    const k = hero!.geometry!.keyframes.find((f) => f.at === 1280)!
    // The hero's own text ends at y=340; the band still covers its whole section.
    expect(k.y + k.height).toBeGreaterThan(340)
  })

  it('test_UAT_FC_REQ-88_band_top_snaps_up_to_the_edge_that_opens_its_section', () => {
    // The cream section opens at y=800 but its first run is at 896. Taking the run
    // as the band top leaves a 96px sliver of the page showing above the band —
    // the cream strip above gigabytealchemy's navy footer.
    const doc = foldToL1(heroThenPaddedSection())
    const kids = (doc.root.kind === 'box' ? (doc.root.children ?? []) : []) as Array<{
      kind: string
      id?: string
      axes?: Record<string, unknown>
      geometry?: { keyframes: Array<{ at: number; y: number; height: number }> }
    }>
    const cream = kids.find((n) => (n.id ?? '').startsWith('section-band-') && n.axes?.surfaceFill === CREAM)
    expect(cream, 'cream band folded').toBeTruthy()
    const k = cream!.geometry!.keyframes.find((f) => f.at === 1280)!
    expect(k.y).toBe(800)
    expect(k.y).not.toBe(896)
  })

  it('test_UAT_FC_REQ-88_band_top_snap_never_crosses_the_band_above_it', () => {
    // The snap must take the edge CLOSEST above the band's first run, not the
    // smallest qualifying one — otherwise a band climbs over every section between
    // them (the footer band swallowed the whole contact section and painted it navy).
    const doc = foldToL1(heroThenPaddedSection())
    const kids = (doc.root.kind === 'box' ? (doc.root.children ?? []) : []) as Array<{
      kind: string
      id?: string
      axes?: Record<string, unknown>
      geometry?: { keyframes: Array<{ at: number; y: number; height: number }> }
    }>
    const dark = kids.find((n) => (n.id ?? '').startsWith('section-band-') && n.axes?.surfaceFill === DARK)!
    const cream = kids.find((n) => (n.id ?? '').startsWith('section-band-') && n.axes?.surfaceFill === CREAM)!
    const dk = dark.geometry!.keyframes.find((f) => f.at === 1280)!
    const ck = cream.geometry!.keyframes.find((f) => f.at === 1280)!
    // The cream band starts at or after the dark band ends — no overlap, no swallow.
    expect(ck.y).toBeGreaterThanOrEqual(dk.y + dk.height)
  })
})

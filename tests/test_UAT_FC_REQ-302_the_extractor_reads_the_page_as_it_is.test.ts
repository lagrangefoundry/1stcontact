/**
 * REQ-302 issues 4, 3, 5 and 2 — read off a real page by the real extractor.
 *
 * The three persisted fixes and the ordering fix all live inside
 * `EXTRACT_SCRIPT`, which is a string evaluated in a browser. The only
 * measurement that can say whether they work is a real Chromium reading a real
 * page, so these UATs drive `EXTRACT_SCRIPT` and `cmdCapturePage` against
 * fixtures built to the shapes the defects were measured on.
 *
 * ## Issue 4 — one veil reported on two different axes
 *
 * A hero photo darkened by a 30% navy veil. Authored as a sibling
 * `<div class="veil" style="background: rgba(3,7,23,.3)">`, the veil
 * composited into `surfaceFill`. The SAME veil authored as a flat gradient
 * layer on the box itself — `linear-gradient(#0307174d, #0307174d)`, which is
 * what an L1 render emits for it — landed on `surfaceGradient` instead and left
 * `surfaceFill` reporting the page backstop underneath.
 *
 * So the two sides of a comparison described the same pixels two different
 * ways, and neither was true: 8 of one round's 20 individual value deltas,
 * across all four hero runs, with both sides painting identically. The band
 * records agreed the whole time (`overlay {color:#030717, opacity:0.3}` on
 * both, `sectionPairing` overlap 1.0, zero section deltas), which is what
 * located the fault in the RUN-scope surface projection rather than in the page.
 *
 * The fix is at the source: a "gradient" whose every stop resolves to the same
 * colour is not a gradient, it is a flat fill painted as a layer, so it
 * composites in `surfaceFillOf` exactly as a `background-color` does — alpha
 * included — and stops being reported as a gradient. How the page authored the
 * veil stops being something the instrument can see.
 *
 * ## Issue 3 — a11yRole read off the text node's own element
 *
 * `hrefOf` and `headingLevelOf` walk up to the nearest semantic ancestor;
 * `a11yRoleOf` did not walk at all. A gradient-text treatment has to wrap the
 * words in a presentational `<span>` inside the `<a>`/`<h1>`, so the run's
 * owning element was the span and the bundle recorded `generic` beside the
 * `href` the neighbouring field had found on the `<a>`. Two HIGH deltas of 3100
 * each, pointing at the side that was right — an L1 render has no such span.
 *
 * ## Issue 5 — three padding sides and text-align measured, then dropped
 *
 * The browser measured all four; `toContentRun` kept `paddingLeftPx`.
 *
 * ## Issue 2 — repeated rows re-appended instead of put back
 *
 * `itemGroup` lifts a band's repeated rows out of the content walk, and both
 * projections re-appended them after ALL of the band's content — so a card
 * whose bullet list was the band's one detected group had its bullets emitted
 * after a LATER card's copy.
 */
import { describe, expect, it } from 'vitest'
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  CAPTURE_SCHEMA,
  EXTRACT_SCRIPT,
  chromiumAvailable,
  cmdCapturePage,
  createPlaywrightDriver,
  flattenCapture,
  staleCaptureAxes,
  type Capture,
  type RawRun,
  type RawSignals,
} from '../tools/generate/src/cli/capture'
import { fsReferenceStore } from '../tools/generate/src/store/fs-reference-store'

const FIXTURES = fileURLToPath(new URL('./fixtures/capture', import.meta.url))

async function serveDir(dir: string): Promise<{ origin: string; close: () => Promise<void> }> {
  const server: Server = createServer((req, res) => {
    const rel = decodeURIComponent((req.url ?? '/').split('?')[0]).replace(/^\/+/, '')
    const file = path.join(dir, rel || 'index.html')
    if (!file.startsWith(dir) || !existsSync(file)) {
      res.statusCode = 404
      res.end()
      return
    }
    res.setHeader('content-type', path.extname(file) === '.html' ? 'text/html; charset=utf-8' : 'application/octet-stream')
    res.end(readFileSync(file))
  })
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const { port } = server.address() as AddressInfo
  return {
    origin: `http://127.0.0.1:${port}`,
    close: () => new Promise<void>((resolve) => server.close(() => resolve())),
  }
}

/** The fixture read by the live extractor — raw band records, before projection. */
async function rawSignals(page: string): Promise<RawSignals> {
  const server = await serveDir(FIXTURES)
  const driver = await createPlaywrightDriver()
  try {
    await driver.navigate(`${server.origin}/${page}`)
    return await driver.query<RawSignals>(EXTRACT_SCRIPT)
  } finally {
    await driver.close()
    await server.close()
  }
}

/** The fixture captured the way `1c capture page` captures a reference. */
async function captureFixture(page: string): Promise<Capture> {
  const server = await serveDir(FIXTURES)
  const cwd = mkdtempSync(path.join(tmpdir(), 'req302-'))
  try {
    const { capture } = await cmdCapturePage(`${server.origin}/${page}`, fsReferenceStore(cwd))
    return capture
  } finally {
    await server.close()
    rmSync(cwd, { recursive: true, force: true })
  }
}

const browserOk = await chromiumAvailable()
const itB = it.runIf(browserOk)

// Driven once each and shared — a real Chromium run is the expensive part.
const siblingScrim = browserOk ? await rawSignals('req302-scrim-sibling.html') : undefined
const gradientScrim = browserOk ? await rawSignals('req302-scrim-gradient.html') : undefined
const semantics = browserOk ? await rawSignals('req302-semantics.html') : undefined
const semanticsBundle = browserOk ? await captureFixture('req302-semantics.html') : undefined
const itemOrder = browserOk ? await captureFixture('req302-item-order.html') : undefined

/** Every run of a raw extraction, band content and lifted item rows alike. */
const runsOf = (s: RawSignals): RawRun[] => s.bands.flatMap((b) => [...b.content, ...b.items.flat()])
/** The run whose text starts with `prefix`. */
const runNamed = (s: RawSignals, prefix: string): RawRun => {
  const r = runsOf(s).find((x) => x.text.startsWith(prefix))
  if (!r) throw new Error(`no run starting ${JSON.stringify(prefix)}`)
  return r
}

describe('REQ-302 — a veil is one value on one axis, however the page authored it', () => {
  itB('test_UAT_FC_REQ-302_the_same_veil_reads_the_same_whether_a_sibling_or_a_flat_gradient', () => {
    // THE FAILURE, both authorings side by side. The two fixtures paint the
    // identical veil over the identical hero — one as a sibling's translucent
    // `background-color`, one as the flat gradient layer an L1 render emits —
    // and the instrument used to describe them differently.
    const a = runNamed(siblingScrim!, 'Intentional Software')
    const b = runNamed(gradientScrim!, 'Intentional Software')

    // They now agree on the axis AND on the value. This is the whole fix:
    // there is no longer an instrument-visible difference between the two
    // ways of authoring the same veil.
    expect(b.surfaceFill).toBe(a.surfaceFill)
    expect(b.surfaceGradient ?? null).toEqual(a.surfaceGradient ?? null)

    // ...and the flat layer is NOT reported as a gradient. A gradient whose
    // stops are all one colour is a flat fill; reporting it on the gradient
    // axis as well is what made one veil two deltas on two axes.
    expect(b.surfaceGradient ?? null).toBeNull()
  })

  itB('test_UAT_FC_REQ-302_the_veils_alpha_survives_into_the_run_surface', () => {
    // The other half of issue 4, and the one that says the value is TRUE
    // rather than merely consistent. A 30% #030717 veil over the #e8dfd3 page
    // composites to #a39e9b; reporting the veil as opaque #030717 (the old
    // reference-side answer) or the backstop #e8dfd3 (the old reproduction
    // -side answer) both throw the alpha away, in opposite directions.
    const veil = [0x03, 0x07, 0x17]
    const under = [0xe8, 0xdf, 0xd3]
    const expected = veil.map((v, i) => Math.round(0.3 * v + 0.7 * under[i]))

    for (const [name, s] of [['sibling', siblingScrim!], ['gradient', gradientScrim!]] as const) {
      const fill = runNamed(s, 'Intentional Software').surfaceFill
      expect(fill, `${name} records a surface`).toBeTruthy()
      const got = [1, 3, 5].map((i) => parseInt(fill!.slice(i, i + 2), 16))
      got.forEach((c, i) => expect(Math.abs(c - expected[i]), `${name} channel ${i}`).toBeLessThanOrEqual(1))
      // Neither of the two wrong answers.
      expect(fill!.toLowerCase(), `${name} is not the opaque veil`).not.toBe('#030717')
      expect(fill!.toLowerCase(), `${name} is not the backstop`).not.toBe('#e8dfd3')
    }
  })

  itB('test_UAT_FC_REQ-302_a_real_gradient_is_still_reported_as_a_gradient', () => {
    // The discrimination. Collapsing EVERY gradient into a fill would pass the
    // tests above and destroy a genuine ramp, so a multi-colour gradient — the
    // wordmark's `background-clip: text` treatment — must survive untouched.
    const wordmark = runNamed(semantics!, 'Gigabyte Alchemy')
    expect(wordmark.gradientCss, 'the wordmark still carries its own ramp').toBeTruthy()
    expect(wordmark.gradientCss!).toContain('gradient')
  })
})

describe('REQ-302 — a run records the semantics of the element it belongs to', () => {
  itB('test_UAT_FC_REQ-302_a_wrapped_link_and_heading_record_their_real_role', () => {
    // THE FAILURE. Both of these words are wrapped in a presentational <span>
    // — the wordmark by its gradient-text treatment, the h1 by a colour accent
    // — so the run's owning element is the span in both cases.
    const wordmark = runNamed(semantics!, 'Gigabyte Alchemy')
    expect(wordmark.href).toBe('/')
    expect(wordmark.a11yRole, 'a run with an href is in a link').toBe('link')

    const heading = runNamed(semantics!, 'Intentional Software')
    expect(heading.headingLevel).toBe(1)
    expect(heading.a11yRole, 'a run with a heading level is in a heading').toBe('heading')

    // The invariant behind both, stated as the contradiction the schema probe
    // looks for: nothing may carry a navigation target or a heading level and
    // still claim to be generic.
    for (const r of runsOf(semantics!)) {
      if (r.href || typeof r.headingLevel === 'number') {
        expect(r.a11yRole, `${JSON.stringify(r.text.slice(0, 24))}`).not.toBe('generic')
      }
    }
  })

  itB('test_UAT_FC_REQ-302_an_unwrapped_element_is_unaffected_and_a_plain_run_stays_generic', () => {
    // The control, in both directions. Walking up must not CHANGE an element
    // that already owned its text — and must not invent semantics for a run
    // that genuinely has none, which "always return the nearest role" would.
    expect(runNamed(semantics!, 'Plain Heading Owns Its Text').a11yRole).toBe('heading')
    const plain = runNamed(semantics!, 'A padded, centred paragraph')
    expect(plain.a11yRole).toBe('generic')
    expect(plain.href ?? null).toBeNull()
  })
})

describe('REQ-302 — the bundle keeps the four axes the browser measured', () => {
  itB('test_UAT_FC_REQ-302_all_four_padding_sides_and_the_alignment_reach_a_real_bundle', () => {
    // End to end on a real page: the fixture's paragraph is padded
    // `11px 13px 17px 19px` and centred — four distinct values, so a
    // projection that copied one side into all four could not pass.
    const bundle = semanticsBundle!
    const run = bundle.sections
      .flatMap((s) => [...s.content, ...s.items.flatMap((i) => i.content)])
      .find((r) => r.text.startsWith('A padded, centred paragraph'))
    expect(run, 'the padded run is in the bundle').toBeDefined()
    expect(run!.paddingTopPx).toBe(11)
    expect(run!.paddingRightPx).toBe(13)
    expect(run!.paddingBottomPx).toBe(17)
    expect(run!.paddingLeftPx).toBe(19)
    expect(run!.textAlign).toBe('center')

    // ...and they reach the manifest the comparator reads, which is the end of
    // the path that was broken.
    const el = flattenCapture(bundle).elements.find((e) => (e.text ?? '').startsWith('A padded, centred'))
    expect((el as unknown as { paddingTopPx?: number }).paddingTopPx).toBe(11)
    expect((el as unknown as { textAlign?: string }).textAlign).toBe('center')
  })

  itB('test_UAT_FC_REQ-302_a_bundle_taken_now_is_current_and_needs_no_re_capture', () => {
    // Both persisted fixes are only real once a bundle carries them, so a
    // bundle written by THIS extractor must be stamped current and must have
    // nothing the staleness probe can name against it.
    expect(semanticsBundle!.captureSchema).toBe(CAPTURE_SCHEMA)
    expect(staleCaptureAxes(semanticsBundle!)).toEqual([])
  })
})

describe('REQ-302 — a lifted item row is recorded where the DOM had it', () => {
  itB('test_UAT_FC_REQ-302_a_cards_bullets_are_anchored_before_the_next_cards_copy', () => {
    // THE FAILURE, on the shape it was measured on. Two cards of different
    // classes, so the CARD row is not a uniform group and the item-group walk
    // descends into the FIRST card's <ul> — which puts the lifted rows in the
    // MIDDLE of the band's content rather than at its end.
    const [section] = itemOrder!.sections
    const content = section.content.map((r) => r.text)
    const items = section.items.map((i) => i.content.map((r) => r.text))

    // Card A's two bullets were lifted; the SECOND card's bullets were not
    // (only one group is detected), so they stayed in the content.
    expect(items.length).toBe(2)
    expect(items.flat().join(' ')).toContain('Alpha bullet of the first card')
    expect(content.join(' ')).toContain('Gamma bullet of the second card')

    // THE ANCHOR: both rows belong immediately after card A's copy — index 2,
    // before 'Second Card Heading' — not at the end, which is where appending
    // put them.
    expect(section.itemsAt).toEqual([2, 2])
    expect(content[2]).toBe('Second Card Heading')
    expect(section.itemsAt![0]).toBeLessThan(content.length)
  })

  itB('test_UAT_FC_REQ-302_the_projected_order_is_the_order_the_page_paints_in', () => {
    // What the anchor is FOR. The projection the comparator and the fold both
    // read must come out in reading order — and reading order is asserted
    // against the boxes, not against an expected array, so a fixture whose
    // own geometry disagreed could not pass.
    const els = flattenCapture(itemOrder!).elements.filter((e) => e.box && (e.text ?? '').length > 1)
    const texts = els.map((e) => e.text ?? '')

    // Card A's bullets come before card B's heading — the inversion that cost
    // the `structural-failure` verdict, stated directly.
    const alpha = texts.findIndex((t) => t.startsWith('Alpha bullet'))
    const beta = texts.findIndex((t) => t.startsWith('Beta bullet'))
    const cardB = texts.findIndex((t) => t.startsWith('Second Card Heading'))
    expect(alpha).toBeGreaterThanOrEqual(0)
    expect(cardB).toBeGreaterThanOrEqual(0)
    expect(alpha, 'card A bullets precede card B').toBeLessThan(cardB)
    expect(beta).toBeLessThan(cardB)

    // ...and the whole band is top-to-bottom, which is the general property
    // every downstream consumer depends on.
    const ys = els.map((e) => e.box!.y)
    expect(ys).toEqual([...ys].sort((a, b) => a - b))
  })
})

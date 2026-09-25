/**
 * BUG-113 — `1c repro` served the absolute base while the gate certified the
 * recovered document.
 *
 * `gate-core.ts` built two documents and graded the wrong one: fidelity on the
 * absolute base, the envelope probes on `promoteToFlow(base).doc` — a
 * structure-recovered overlay that nothing ever writes to disk. Meanwhile
 * `repro.ts` imported `promoteToFlow` and never called it. So the probes reported
 * zero layout findings at every width for a flowed document nobody serves, while
 * the browser painted a pinned one nobody had checked.
 *
 * The invariant these UATs pin is the ticket's: **whatever document is served is
 * the document the gate's verdict is about. No probe may grade an artifact that
 * is not written to disk.** Promotion was measured before being declined — it
 * clears the envelope by dropping each promoted member's geometry, missing the
 * oracle by 1426px at 1440 on `gigabytealchemy.ai` — so the base is served, and
 * what that costs and what the alternative would have cost are both reported as
 * numbers.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mkdirSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import {
  chooseRecovery,
  evaluateLayout,
  foldToL1,
  measuredTextHeights,
  mountBehaviours,
  sampleFidelityProbe,
} from '../tools/generate/src/l1'
import type { FoldedForm } from '../tools/generate/src/l1'
import type { L1Document, L1Node } from '../packages/site-schema/src/index'
import { cmdRepro, cmdL1Gate } from '../tools/generate/src/cli/repro'
import { writeForms, writeL1, writeMultiState } from '../tools/generate/src/cli/capture/bundle'
import { loadSite } from '../tools/generate/src/store'
import { fsReferenceBundle } from '../tools/generate/src/store/fs-reference-store'
import type {
  MultiStateCapture,
  StateProjection,
  ValueElement,
} from '../tools/generate/src/cli/capture'

const LADDER = [320, 375, 768, 1024, 1280, 1440]

// ── fixtures ─────────────────────────────────────────────────────────────────

function textEl(
  text: string,
  box: ValueElement['box'],
  over: Partial<ValueElement> = {},
): ValueElement {
  return {
    text,
    role: 'body',
    color: '#111827',
    fontFamily: 'Inter',
    fontSizePx: 20,
    fontWeight: 400,
    lineHeightPx: 30,
    box,
    ...over,
  }
}

/** A captured text-free control, named by the a11y tree (the fold's form seam). */
function control(accessibleName: string, box: ValueElement['box']): ValueElement {
  return {
    text: '',
    role: 'field',
    color: '',
    fontFamily: '',
    fontSizePx: 0,
    fontWeight: 0,
    textless: true,
    a11yRole: 'textbox',
    nameSource: 'placeholder',
    accessibleName,
    box,
  }
}

function captureOf(elementsAt: (width: number) => ValueElement[]): MultiStateCapture {
  const projections: StateProjection[] = LADDER.map((width) => ({
    engine: 'chromium',
    viewport: { width, height: 900 },
    state: 'rest',
    manifest: {
      source: `bug113@${width}`,
      elements: elementsAt(width),
      sections: [],
      viewport: { width, height: 900 },
    },
  }))
  return { url: 'http://fixture.test/', notes: [], projections }
}

/**
 * The headline the estimate gets wrong. 20 characters at 40px in a 200px column
 * is two lines to a 0.5em-advance model (80px tall) and one line to the browser
 * that actually shaped it (the 40px the oracle records) — so the run below it,
 * clear by 10px in reality, reads as a collision to the estimate alone.
 */
const OVERESTIMATED = 'Intentional Software'
function overEstimatedHeadline(): ValueElement[] {
  return [
    textEl(OVERESTIMATED, { x: 20, y: 100, width: 200, height: 40 }, { fontSizePx: 40, lineHeightPx: 40 }),
    textEl('Below it', { x: 20, y: 150, width: 200, height: 30 }),
  ]
}

/**
 * A page that REFLOWS at 768: below it the form stacks under the prose, above it
 * the prose narrows and the form moves into a second column. Every captured width
 * is clear; only a document that interpolates ACROSS the window puts the control
 * on top of the prose, which is the 700px defect the operator saw in a browser.
 */
function reflowingCapture(): MultiStateCapture {
  return captureOf((w) =>
    w < 768
      ? [
          ...overEstimatedHeadline(),
          textEl('Join our mailing list for updates on our work.', {
            x: 20,
            y: 400,
            width: w - 40,
            height: 60,
          }),
          control('Your email', { x: 20, y: 500, width: w - 40, height: 50 }),
        ]
      : [
          ...overEstimatedHeadline(),
          textEl('Join our mailing list for updates on our work.', {
            x: 20,
            y: 380,
            width: 360,
            height: 120,
          }),
          control('Your email', { x: 420, y: 360, width: 300, height: 50 }),
        ],
  )
}

/** A control that sits ON the prose at every captured width — visible only mounted. */
function collidingFormCapture(): MultiStateCapture {
  return captureOf((w) => [
    textEl('Get in touch', { x: 20, y: 100, width: w - 40, height: 100 }),
    control('Your email', { x: 20, y: 140, width: 240, height: 50 }),
  ])
}

let cwd: string
beforeEach(() => {
  cwd = mkdtempSync(path.join(tmpdir(), 'bug113-'))
})
afterEach(() => {
  rmSync(cwd, { recursive: true, force: true })
})

/** A bundle carrying the three members `1c repro` reads: l1 + forms + oracle. */
async function bundleOf(capture: MultiStateCapture): Promise<{ dir: string; forms: FoldedForm[] }> {
  const dir = path.join(cwd, 'bundle')
  mkdirSync(dir, { recursive: true })
  const forms: FoldedForm[] = []
  const doc = foldToL1(capture, { forms })
  const bundle = fsReferenceBundle(dir)
  await writeL1(bundle, doc)
  await writeForms(bundle, forms)
  await writeMultiState(bundle, capture)
  return { dir, forms }
}

/** Overlap findings only — a clip is a different envelope question. */
function overlaps(doc: L1Document, width: number, oracle: MultiStateCapture): string[] {
  return evaluateLayout(doc, width, { measured: measuredTextHeights(oracle) })
    .findings.filter((f) => f.kind === 'overlap')
    .map((f) => f.detail)
}

describe('BUG-113 — the gate grades the document that is served', () => {
  it('test_UAT_FC_BUG-113_repro_writes_a_document_with_no_overlap_at_captured_widths', async () => {
    const capture = reflowingCapture()
    const { dir } = await bundleOf(capture)
    const result = await cmdRepro('repro', { cwd, ref: dir })

    // The command's own account of what it wrote: clear at every captured width,
    // and clear at the off-sample widths between them.
    // BUG-143 — viewport height is an evaluator axis now, so the report carries
    // one entry per (captured width, sampled height). The claim is unchanged —
    // every captured width is graded, and none of them has a finding — and is
    // asserted over the set of widths rather than the list of entries.
    expect(result.served).toBeDefined()
    expect([...new Set(result.served?.byWidth.map((w) => w.width))]).toEqual(LADDER)
    expect(result.served?.byWidth.filter((w) => w.findings > 0)).toEqual([])
    expect(result.served?.offSample.filter((w) => w.findings > 0)).toEqual([])

    // And the same read off the artifact on disk rather than off the report: the
    // page body written to `pages/home.json`, with each behaviour's controls
    // mounted at its seam, which is what a browser is handed.
    const loaded = loadSite({ cwd, root: 'sites' }, 'repro', 'draft')
    if (!loaded.ok) throw new Error('draft did not load')
    const page = loaded.value.site.pages.find((p) => p.slug === 'home')
    if (!page?.l1) throw new Error('written page carries no L1 document')
    const served = mountBehaviours(page.l1, result.forms)
    for (const width of LADDER) expect([width, overlaps(served, width, capture)]).toEqual([width, []])
  })

  it('test_UAT_FC_BUG-113_envelope_probes_grade_the_mounted_composition', async () => {
    // The controls are half the page. A collision between a mounted control and
    // the prose above it exists only once the two are composed — and the probes
    // read the body alone, so this was invisible to the gate by construction.
    const capture = collidingFormCapture()
    const { dir, forms } = await bundleOf(capture)
    const base = foldToL1(capture)
    expect(forms.length).toBeGreaterThan(0)

    // The body on its own is silent: a `slot` is an inert seam, so nothing in it
    // can collide with anything.
    expect(overlaps(base, 1280, capture)).toEqual([])
    // Composed, the collision is reported.
    expect(overlaps(mountBehaviours(base, forms), 1280, capture).length).toBeGreaterThan(0)

    // And the gate says so, about the page rather than about an overlay.
    const report = await cmdL1Gate(fsReferenceBundle(dir))
    expect(report.offSample.pass).toBe(false)
  })

  it('test_UAT_FC_BUG-113_recovery_is_priced_and_the_price_decides', async () => {
    const capture = reflowingCapture()
    const { dir } = await bundleOf(capture)
    const result = await cmdRepro('repro', { cwd, ref: dir })

    // BUG-113's invariant is that the choice between the absolute base and the
    // flow recovery is MADE, stated as numbers, and made in ONE place so the page
    // that is written and the page that is graded are the same page. What it is
    // NOT is a constant. The recovery BUG-113 priced cleared the envelope by
    // dropping each promoted member's geometry — 1426px of miss against the
    // oracle on the reference — so the price decided for the base every time, and
    // the ticket recorded that decision. REQ-278 gave the recovery its geometry
    // back; the price now decides on the merits, and this fixture is one where
    // the recovery wins.
    const loaded = loadSite({ cwd, root: 'sites' }, 'repro', 'draft')
    if (!loaded.ok) throw new Error('draft did not load')
    const written = loaded.value.site.pages.find((p) => p.slug === 'home')?.l1
    if (!written) throw new Error('written page carries no L1 document')

    const measured = measuredTextHeights(capture)
    const choice = chooseRecovery(foldToL1(capture), capture, { measured })
    expect(choice.promoted.length).toBeGreaterThan(0)
    expect(choice.served).toBe(true)

    // ONE definition of the choice: what `1c repro` wrote is what `chooseRecovery`
    // picked, node for node — not a second implementation that happens to agree.
    expect(JSON.stringify(written)).toBe(JSON.stringify(choice.doc))
    expect(result.served?.document).toBe('recovery')

    // GEOMETRY IS KEPT, NOT DROPPED. Every node the recovery flowed still carries
    // its track; what changed is the frame the track is read in. That is the
    // difference this fixture exists to hold: a recovery that drops geometry has
    // strictly fewer tracks than the base, and this one has exactly as many.
    const tracks = (doc: L1Document): number => {
      let n = 0
      const walk = (node: L1Node): void => {
        if (node.geometry) n += 1
        const kids = node.kind === 'container' ? node.children : ((node as { children?: L1Node[] }).children ?? [])
        kids.forEach(walk)
      }
      walk(doc.root)
      return n
    }
    const base = foldToL1(capture)
    expect(tracks(written)).toBeGreaterThanOrEqual(tracks(base))
    const flowed = (doc: L1Document): number => {
      let n = 0
      const walk = (node: L1Node): void => {
        if (node.geometry?.place === 'flow') n += 1
        const kids = node.kind === 'container' ? node.children : ((node as { children?: L1Node[] }).children ?? [])
        kids.forEach(walk)
      }
      walk(doc.root)
      return n
    }
    expect(flowed(base)).toBe(0)
    expect(flowed(written)).toBeGreaterThan(0)

    // The trade is stated as a number by both verbs, so serving the recovery is
    // an informed choice rather than an implicit one — and here the number that
    // decided it is zero: the recovery costs no fidelity at all.
    expect(result.served?.recovery.promoted).toBeGreaterThan(0)
    expect(result.served?.recovery.fidelityMaxDeltaPx).toBeLessThanOrEqual(
      result.served?.fidelityMaxDeltaPx ?? 0,
    )
    const report = await cmdL1Gate(fsReferenceBundle(dir))
    expect(report.recovery.served).toBe(true)
    expect(report.recovery.fidelityResiduals).toBe(0)
    expect(report.recovery.recoveredFindings).toBeLessThan(report.recovery.servedFindings)
  })

  it('test_UAT_FC_BUG-113_measured_height_replaces_the_estimate_at_a_captured_width', async () => {
    const capture = reflowingCapture()
    const doc = foldToL1(capture)

    // Estimated, the headline is two lines tall and lands on the run below it.
    const estimated = evaluateLayout(doc, 320).findings.filter((f) => f.kind === 'overlap')
    expect(estimated.some((f) => f.detail.includes(OVERESTIMATED))).toBe(true)

    // Measured, it is the 40px the browser gave it, and the collision was the
    // model arguing with itself.
    const measured = measuredTextHeights(capture)
    const leaf = evaluateLayout(doc, 320, { measured }).leaves.find(
      (l) => l.kind === 'text' && l.text === OVERESTIMATED,
    )
    expect(leaf?.box.height).toBe(40)
    expect(overlaps(doc, 320, capture).some((d) => d.includes(OVERESTIMATED))).toBe(false)
  })

  it('test_UAT_FC_BUG-113_reflow_window_holds_every_node_at_no_fidelity_cost', async () => {
    const capture = reflowingCapture()
    const { forms } = await bundleOf(capture)
    const doc = foldToL1(capture)

    // The 375→768 window carries a reflow, so every track holds across it — not
    // only the one node whose own numbers said `snap`.
    const window = LADDER.indexOf(375)
    const segments: string[] = []
    const walk = (node: L1Node): void => {
      const geo = node.geometry
      if (geo?.segments && geo.keyframes[window]?.at === 375) segments.push(geo.segments[window])
      const kids = node.kind === 'container' ? node.children : ((node as { children?: L1Node[] }).children ?? [])
      kids.forEach(walk)
    }
    walk(doc.root)
    expect(segments.length).toBeGreaterThan(1)
    expect([...new Set(segments)]).toEqual(['snap'])

    // Holding costs no fidelity: at a captured width `snap` and `interpolate`
    // both resolve to that width's own keyframe.
    const fidelity = sampleFidelityProbe(doc, capture, { measured: measuredTextHeights(capture) })
    expect(fidelity.pass).toBe(true)
    expect(fidelity.residuals).toEqual([])

    // And it is what keeps the mounted control off the prose between the two
    // captured widths: the same document interpolating collides at 500px.
    const served = mountBehaviours(doc, forms)
    expect(overlaps(served, 500, capture)).toEqual([])
    const sliding = JSON.parse(JSON.stringify(served)) as L1Document
    const unhold = (node: L1Node): void => {
      if (node.geometry?.segments) node.geometry.segments = node.geometry.segments.map(() => 'interpolate')
      const kids = node.kind === 'container' ? node.children : ((node as { children?: L1Node[] }).children ?? [])
      kids.forEach(unhold)
    }
    unhold(sliding.root)
    expect(overlaps(sliding, 500, capture).length).toBeGreaterThan(0)
  })

  it('test_UAT_FC_BUG-113_gate_grades_the_retained_artifact_and_reports_a_stale_fold', async () => {
    // The gate used to re-fold `multistate.json` and grade THAT, while `1c repro`
    // serves the bundle's retained `l1.json`. The two agree only until the folder
    // changes — and this ticket's own per-window reflow hold changed it, so every
    // bundle captured before it retains a document the gate would never have
    // looked at. Same defect as the one this ticket closes, one level out.
    const capture = reflowingCapture()
    const { dir, forms } = await bundleOf(capture)
    const bundle = fsReferenceBundle(dir)

    // A current bundle: what is retained IS what the oracle folds to, so there is
    // nothing to report and the verdict is about both at once.
    const current = await cmdL1Gate(bundle)
    expect(current.staleFold).toBeNull()
    expect(current.offSample.pass).toBe(true)

    // Now retain a document the current folder would not produce — an older fold,
    // standing in for the pre-hold one: every track slides through the widths
    // between samples instead of holding across them.
    const staleForms: FoldedForm[] = []
    const stale = JSON.parse(JSON.stringify(foldToL1(capture, { forms: staleForms }))) as L1Document
    const unhold = (node: L1Node): void => {
      if (node.geometry?.segments) node.geometry.segments = node.geometry.segments.map(() => 'interpolate')
      const kids = node.kind === 'container' ? node.children : ((node as { children?: L1Node[] }).children ?? [])
      kids.forEach(unhold)
    }
    unhold(stale.root)
    // REQ-278 — and a defect the recovery cannot absorb, so the verdict has to
    // come from the RETAINED document to report it at all. A recovery that keeps
    // the captured geometry repairs fragility (a page that breaks between sampled
    // widths, or when the copy grows); it cannot repair a document that already
    // paints one run on top of another at a width the reference was measured at,
    // because reproducing that position faithfully is the whole contract. So the
    // stale artifact is given exactly that: its second run moved onto its first.
    // Re-folding would produce neither the interpolation slide nor this collision.
    const staleKids = (stale.root as { children: L1Node[] }).children
    const first = staleKids[0].geometry!
    const second = staleKids[1].geometry!
    second.keyframes = second.keyframes.map((kf, i) => ({ ...kf, y: first.keyframes[i].y + 5 }))
    // The controls are half the page, and their presentation is retained beside
    // the body in `forms.json` — so an older fold means an older BOTH.
    const staleMounts = JSON.parse(JSON.stringify(staleForms)) as FoldedForm[]
    staleMounts.forEach((f) => unhold(f.form))
    await writeL1(bundle, stale)
    await writeForms(bundle, staleMounts)

    const report = await cmdL1Gate(bundle)

    // The verdict is about the RETAINED document — the one `1c repro` will serve.
    // Re-folding would have reported this page clean, which is precisely the
    // false PASS this ticket exists to stop. The retained document collides at a
    // CAPTURED width, so the collision reaches the verdict itself and no recovery
    // can talk it away.
    expect(overlaps(mountBehaviours(stale, staleMounts), 500, capture).length).toBeGreaterThan(0)
    expect(report.onSample.pass).toBe(false)
    expect(current.onSample.pass).toBe(true)

    // And the divergence is named, with the remedy, rather than silently absorbed.
    expect(report.staleFold).toContain('1c refold')

    // Staleness is a fact about the bundle, not a quality judgement: it says the
    // subject of the verdict would change, not that the subject is bad. So the
    // document that IS retained is still the one every probe read — and both
    // verbs read the same one, so what `1c repro` measures about the page it just
    // wrote is what the gate reports about the page it just graded.
    const servedNow = await cmdRepro('repro-stale', { cwd, ref: dir })
    expect(servedNow.served?.byWidth.filter((w) => w.findings > 0).length).toBeGreaterThan(0)
    expect(servedNow.served?.document).toBe(report.recovery.served ? 'recovery' : 'base')
    expect(servedNow.served?.recovery.promoted).toBe(report.recovery.promoted.length)
  })
})

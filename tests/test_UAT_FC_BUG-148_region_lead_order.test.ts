import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  isBandPaint,
  regionNodeLeads,
  resolveRegionNodes,
  type NodeSource,
  type RegionBox,
} from '../tools/generate/src/cli/perceptual-core'
import { buildDigest } from '../tools/repro-console/src/digest'

/**
 * UATs for BUG-148 — **the top lead is the run that is the subject, not the
 * band standing behind it, and both sides offer a band the same way.**
 *
 * The instrument measured the right thing and reported the lead that said least
 * about it. On the round that filed this ticket, nine of twelve regions led with
 * `section (100% of region)` — true, and carrying no information — while the
 * 32px subheading that IS the region sat at index 1. The +4px horizontal shift
 * of 23 runs that scored 100% of the ranked region score was named by none of
 * the twelve one-line summaries the round's digest prints.
 *
 * Two defects, and the second depends on the first:
 *
 *  1. `instrument-blind` — ranking on `ofRegion` with `ofNode` as a tie-break
 *     let a 1257px band beat the run standing on it, because the tie-break was
 *     unreachable: a region's bbox is snapped to the `blockPx` grid and a
 *     manifest box is not, so a run that is exactly the region still scores
 *     `ofRegion` 0.89 against the band's 1 and loses on the first comparator.
 *  2. `instrument-asymmetric` — the reproduction's manifest carries whole-band
 *     `generic` aggregates and the reference's does not, so only one side could
 *     answer a region with a band as an `element`.
 *
 * The evidence is the real round's own two manifests and twelve region boxes,
 * carried as a fixture (`bug148-gigabytealchemy-iteration-7.json`) because the
 * artifact directory it came from is scratch and is not in the repo. Everything
 * here is pure arithmetic over the real exported entry points — the ranking is a
 * function of the manifests alone, so no browser and no screenshot is needed to
 * prove it.
 */

// ── fixtures ─────────────────────────────────────────────────────────────────

const box = (x: number, y: number, width: number, height: number) => ({ x, y, width, height })
const region = (x: number, y: number, w: number, h: number): RegionBox => ({ x, y, w, h })

/** The round that filed the ticket: both manifests, and the twelve region boxes it ranked. */
const ROUND = JSON.parse(
  readFileSync(
    path.join(__dirname, 'fixtures/repro-console/bug148-gigabytealchemy-iteration-7.json'),
    'utf8',
  ),
) as {
  imageWidth: number
  blockPx: number
  regions: { id: number; bbox: RegionBox }[]
  ref: NodeSource
  actual: NodeSource
}

/** Region 1 of that round, and the two records that competed for its lead. */
const SUBHEADING_TEXT = 'XGD (Extreme Generative Development)'

describe('BUG-148 — the lead a region opens with is the one that says most about it', () => {
  it('puts the run that is the region above the band it stands on, at a fractional offset', () => {
    // The exact shape from the round: a 1257px section band, and a 32px
    // subheading that IS the region but sits at the browser's `.25` while the
    // region's bbox is snapped to the 16px block grid. The band therefore
    // contains the region entirely (`ofRegion` 1) and the run does not (0.89) —
    // which is what made the documented `ofNode` tie-break unreachable.
    const source: NodeSource = {
      viewport: { width: 1280, height: 4376 },
      elements: [{ text: SUBHEADING_TEXT, role: 'subheading', box: box(124, 2515.25, 448.44, 32) }],
      sections: [{ index: 4, box: box(0, 1882, 1280, 1257.25) }],
    }
    const leads = regionNodeLeads(region(128, 2512, 448, 32), source, 1)

    // Both are still offered — the band is not suppressed, it is ranked.
    expect(leads.map((l) => l.kind)).toEqual(['element', 'section'])
    expect(leads[0]).toMatchObject({ kind: 'element', text: SUBHEADING_TEXT, role: 'subheading' })

    // And the reason is legible in the record itself: the run explains 89% of
    // the region and the region is 89% of the run; the band explains all of the
    // region and the region is 1% of the band.
    expect(leads[0].overlap.ofRegion).toBeCloseTo(0.89, 2)
    expect(leads[0].overlap.ofNode).toBeCloseTo(0.89, 2)
    expect(leads[1].overlap).toEqual({ ofRegion: 1, ofNode: 0.01 })
  })

  it('still leads with the band where there is genuinely no element to beat it', () => {
    // The intent the old tie-break was reaching for, and which the product
    // ranking has to keep: a wrong fill or a missing hero produces a large
    // region with no run anywhere near it, and "we have no idea" is worse than
    // naming the band.
    const backdrop: NodeSource = {
      viewport: { width: 1280, height: 900 },
      elements: [{ text: 'a caption in the corner', role: 'body', box: box(1180, 1080, 96, 18) }],
      sections: [{ index: 0, box: box(0, 700, 1280, 400) }],
    }
    const leads = regionNodeLeads(region(200, 800, 400, 100), backdrop, 1)

    expect(leads[0]).toMatchObject({ kind: 'section', index: 0, role: 'section' })
    // Not because the caption was dropped — it never touched the region at all.
    expect(leads).toHaveLength(1)

    // A run that only clips the region does not displace the band either: it
    // explains a tenth of the disagreement and the region is a fifth of it
    // (0.02), against the band's whole region at a thirteenth of itself (0.08).
    // Both are on the list; the band is the better answer and leads.
    const clipped = regionNodeLeads(
      region(200, 800, 400, 100),
      { ...backdrop, elements: [{ text: 'edge', role: 'body', box: box(100, 760, 300, 60) }] },
      1,
    )
    expect(clipped.map((l) => l.kind)).toEqual(['section', 'element'])
    expect(clipped[1]).toMatchObject({ kind: 'element', text: 'edge' })
  })

  it('offers a band as a section on both sides, never as an element on one', () => {
    // BUG-142's containment nesting gave the reproduction a real full-bleed box
    // per band, carrying that band's concatenated text and flagged `textless`.
    // The reference capture has only the section record. Handed both lists
    // unfiltered, the two sides answered the same region with different kinds
    // and read as though they disagreed about what is there.
    const band = { x: 0, y: 1882, width: 1280, height: 1257 }
    const bandPaint = {
      text: "What We're BuildingFrom personal reflection tools to developer platforms",
      role: 'generic',
      a11yRole: 'generic',
      textless: true,
      box: band,
    }
    const run = { text: SUBHEADING_TEXT, role: 'subheading', box: box(124, 2515.25, 448.44, 32) }
    const bbox = region(128, 2512, 448, 32)

    const annotated = resolveRegionNodes(
      [{ bbox }],
      {
        ref: { viewport: { width: 1280, height: 4376 }, elements: [run], sections: [{ index: 4, box: band }] },
        actual: {
          viewport: { width: 1280, height: 4376 },
          elements: [run, bandPaint],
          sections: [{ index: 4, box: band }],
        },
      },
      1280,
    )

    // Like lists: the aggregate is gone from `elements` on the side that has it,
    // and the band is still reachable — as the section record, on both sides.
    const kinds = (side: 'ref' | 'actual') => annotated[0].nodes[side].map((l) => l.kind)
    expect(kinds('ref')).toEqual(['element', 'section'])
    expect(kinds('actual')).toEqual(['element', 'section'])
    expect(annotated[0].nodes.actual.map((l) => l.role)).not.toContain('generic')

    // The predicate is tight: a layer with its own geometry sitting on the band
    // is an object in its own right and is still offered. Only a box that is
    // full-bleed AND coincides with a band's own box is that band's paint.
    expect(isBandPaint(bandPaint, [{ box: band }], 1280)).toBe(true)
    expect(isBandPaint({ ...bandPaint, box: box(0, 1882, 1280, 600) }, [{ box: band }], 1280)).toBe(false)
    expect(isBandPaint({ ...bandPaint, box: box(120, 1882, 1040, 1257) }, [{ box: band }], 1280)).toBe(false)
    // A textless full-bleed box with no band behind it is a hero photograph.
    expect(isBandPaint(bandPaint, [], 1280)).toBe(false)
    // And a band-sized element that carries its own text is content, not paint.
    expect(isBandPaint({ ...bandPaint, textless: false }, [{ box: band }], 1280)).toBe(false)
  })

  it('names the subject of all twelve regions of the round that filed the ticket', () => {
    const annotated = resolveRegionNodes(ROUND.regions, ROUND, ROUND.imageWidth)
    expect(annotated).toHaveLength(12)

    for (const r of annotated) {
      for (const side of ['ref', 'actual'] as const) {
        const top = r.nodes[side][0]
        // The measure the ticket reported the defect with: the top lead had
        // `ofNode` ≤ 0.02 on nine of twelve reference-side regions, so the line
        // the digest printed for them was true and said nothing.
        expect(top.overlap.ofNode).toBeGreaterThan(0.02)
        // Every region here lands on a text run, so every region names one.
        expect(top.kind).toBe('element')
        expect(top.text).toBeTruthy()
      }
      // The two sides agree about what is under the region — which they did all
      // along; only the instrument said otherwise.
      expect(r.nodes.ref[0].kind).toBe(r.nodes.actual[0].kind)
      expect(r.nodes.ref[0].text).toBe(r.nodes.actual[0].text)
      // No side answers with a whole-band aggregate.
      expect(r.nodes[('ref' as const)].every((l) => l.role !== 'generic')).toBe(true)
      expect(r.nodes.actual.every((l) => l.role !== 'generic')).toBe(true)
    }

    // The ticket's worked example, in full: region 1 is the subheading, and the
    // band that used to lead it is still there, one place down.
    const first = annotated[0]
    expect(first.bbox).toEqual({ x: 128, y: 2512, w: 448, h: 32 })
    expect(first.nodes.ref[0]).toMatchObject({ kind: 'element', text: SUBHEADING_TEXT })
    expect(first.nodes.ref.some((l) => l.kind === 'section' && l.overlap.ofRegion === 1)).toBe(true)
  })

  it('prints the run in the digest line the round actually reads', () => {
    // The harm was never in `regions.json` — it was in the one line per region
    // that the console's `evidence-digest.md` prints from it, which is where a
    // diagnosing round looks before it opens anything.
    const annotated = resolveRegionNodes(ROUND.regions, ROUND, ROUND.imageWidth)
    const digest = buildDigest({
      n: 7,
      gate: {},
      valuesDiff: {},
      regions: {
        meanDiff: 0.69,
        pctOverThreshold: 0.31,
        rankedBy: 'score',
        regions: annotated.map((r) => ({ ...r, score: 3366.21, meanDiff: 88.58 })),
      },
      capture: {},
      manifest: {},
      page: {},
    })

    expect(digest).toContain(`ref: “${SUBHEADING_TEXT}”`)
    // The phrase that nine of twelve regions used to open with, and which is
    // what "the digest named none of the twelve" looked like in practice.
    expect(digest).not.toContain('ref: section (100% of region)')
  })
})

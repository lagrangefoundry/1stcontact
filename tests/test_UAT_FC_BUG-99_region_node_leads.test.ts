import { describe, expect, it } from 'vitest'
import {
  nodeScaleFor,
  regionNodeLeads,
  resolveRegionNodes,
  type NodeSource,
  type RegionBox,
} from '../tools/generate/src/cli/perceptual-core'
import { regionCaption } from '../tools/repro-console/src/console'
import { buildDigest } from '../tools/repro-console/src/digest'

/**
 * UATs for BUG-99 — **a ranked pixel region names the nodes under it.**
 *
 * THE TICKET AS FILED IS HALF FALSE, and that shapes this suite. It claimed the
 * region record carries "no geometry, only crop image paths", quoting a
 * `regions.json` whose entries had exactly `{id, crops}`. That file was the
 * console test's FAKE `1c gate` — a stub carrying only the keys the path under
 * test read — not engine output. The real `PerceptualDiffReport` has carried
 * `bbox`, `score`, `meanDiff` and `area` per region, score-ranked, since REQ-38.
 *
 * What was genuinely missing is the ticket's third item: the binding from a
 * region to the nodes under it. Without it the only way to learn *what* a region
 * covers is to open its crop and look — the reconstruction-from-a-picture
 * [[DOC-19]] forbids — so the evidence format was forcing the exact failure the
 * runbook exists to prevent.
 *
 * Every UAT here is pure arithmetic over the real exported entry points. No
 * browser, no screenshot, no filesystem: the resolver is a geometric join over
 * two value manifests, which is precisely why it lives in the workerd-safe core.
 */

// ── fixtures ─────────────────────────────────────────────────────────────────

const box = (x: number, y: number, width: number, height: number) => ({ x, y, width, height })
const region = (x: number, y: number, w: number, h: number): RegionBox => ({ x, y, w, h })

/** A manifest shaped exactly as `flattenCapture` / `flattenSignals` produce one. */
function manifest(
  elements: NodeSource['elements'],
  extra: Partial<NodeSource> = {},
): NodeSource {
  return { viewport: { width: 1280, height: 900 }, elements, sections: [], ...extra }
}

const HEADLINE = { text: 'Gigabyte Alchemy', role: 'heading', box: box(88, 83, 686, 90) }
const STRAP = { text: 'Intentional Software', role: 'body', box: box(88, 320, 321, 40) }
const HERO_IMAGE = { role: 'img', src: 'https://example.test/hero.png', box: box(0, 0, 1280, 600) }

describe('BUG-99 — a region names the nodes under it', () => {
  it('resolves the elements whose boxes intersect the region, best-first', () => {
    // A region sitting squarely over the headline and clipping the strapline.
    const leads = regionNodeLeads(region(88, 83, 686, 300), manifest([HEADLINE, STRAP, HERO_IMAGE]), 1)

    // Every intersecting element is a lead; nothing else is.
    expect([...leads].map((l) => l.text ?? l.src).sort()).toEqual([
      'Gigabyte Alchemy',
      'Intentional Software',
      'https://example.test/hero.png',
    ])

    // BUG-148 — the order is `ofRegion × ofNode` descending: how much of the
    // disagreement the node explains, times how specifically it explains it.
    // The headline is swallowed whole and fills a third of the region (0.30);
    // the hero fills the region but the region is barely a quarter of it
    // (0.27); the strapline is a sliver of both (0.06). Ranking on `ofRegion`
    // alone — as this suite originally asserted — puts a node the region is a
    // rounding error of at the top, which is the defect BUG-148 records.
    const explains = leads.map((l) => l.overlap.ofRegion * l.overlap.ofNode)
    expect([...explains].sort((a, b) => b - a)).toEqual(explains)
    expect(leads.map((l) => l.text ?? l.src)).toEqual([
      'Gigabyte Alchemy',
      'https://example.test/hero.png',
      'Intentional Software',
    ])

    // And the LEAD IS A FACT, not a pointer: it carries the text to quote, the
    // role, and its own box, so a reader can go to the manifest record without
    // opening a PNG. `index` is that record's position in `elements`.
    expect(leads.find((l) => l.text === 'Gigabyte Alchemy')).toMatchObject({
      kind: 'element',
      index: 0,
      role: 'heading',
      box: { x: 88, y: 83, w: 686, h: 90 },
    })

    // `ofNode` is the second fraction, and it is a different question: the
    // headline is swallowed whole (a node that moved), the hero merely clipped
    // (a corner of something much larger).
    expect(leads.find((l) => l.text === 'Gigabyte Alchemy')!.overlap.ofNode).toBe(1)
    expect(leads.find((l) => l.src)!.overlap.ofNode).toBeLessThan(0.5)
  })

  it('leaves a region with nothing under it with no leads, rather than guessing', () => {
    expect(regionNodeLeads(region(0, 5000, 100, 100), manifest([HEADLINE]), 1)).toEqual([])
    // A region and a node that merely touch at an edge do not intersect.
    expect(regionNodeLeads(region(774, 83, 100, 90), manifest([HEADLINE]), 1)).toEqual([])
  })

  it('names a section band when a region lands on a background with no text run', () => {
    // The case that makes sections worth carrying: a wrong fill or a missing
    // hero image produces a large region with no element anywhere near it, which
    // would otherwise resolve to nothing at all and read as "we have no idea".
    const source = manifest([HEADLINE], { sections: [{ index: 0, box: box(0, 700, 1280, 400) }] })
    const leads = regionNodeLeads(region(200, 800, 400, 100), source, 1)

    expect(leads).toHaveLength(1)
    expect(leads[0]).toMatchObject({ kind: 'section', index: 0, role: 'section' })
    // The whole region is inside the band, but the band is far larger than it.
    expect(leads[0].overlap.ofRegion).toBe(1)
    expect(leads[0].overlap.ofNode).toBeLessThan(0.1)
  })

  it('resolves both sides, so a one-sided region says which side is missing it', () => {
    // THE ASYMMETRY IS THE SIGNAL. The reference has a headline here; the
    // reproduction has nothing. That is something we failed to draw, and it is
    // readable from the record without opening the crop.
    const annotated = resolveRegionNodes(
      [{ bbox: region(88, 83, 686, 90) }],
      { ref: manifest([HEADLINE]), actual: manifest([STRAP]) },
      1280,
    )

    expect(annotated).toHaveLength(1)
    expect(annotated[0].nodes.ref.map((l) => l.text)).toEqual(['Gigabyte Alchemy'])
    expect(annotated[0].nodes.actual).toEqual([])
    // The input is not mutated — the bbox survives alongside the annotation.
    expect(annotated[0].bbox).toEqual(region(88, 83, 686, 90))
  })

  it('scales a manifest projected at a different width into the image space', () => {
    // The diff crops both rasters to a COMMON rectangle before comparing, so the
    // image space is not guaranteed to be the manifest's. The scale is derived
    // from the manifest's own viewport rather than assumed, because a silent
    // mis-registration would put every lead under the wrong region — worse than
    // no lead at all.
    const half = manifest([HEADLINE], { viewport: { width: 640, height: 450 } })
    expect(nodeScaleFor(half, 1280)).toBe(2)

    const leads = regionNodeLeads(region(176, 166, 1372, 180), half, nodeScaleFor(half, 1280))
    expect(leads).toHaveLength(1)
    expect(leads[0].box).toEqual({ x: 176, y: 166, w: 1372, h: 180 })
    expect(leads[0].overlap.ofNode).toBe(1)

    // A manifest with no viewport, or an image of unknown width, is left alone
    // rather than scaled by a number nobody can justify.
    expect(nodeScaleFor(manifest([HEADLINE], { viewport: undefined }), 1280)).toBe(1)
    expect(nodeScaleFor(half, 0)).toBe(1)
  })

  it('discards slivers below the overlap floor, and caps the leads per side', () => {
    const many = Array.from({ length: 20 }, (_, i) => ({ text: `run ${i}`, role: 'body', box: box(0, i * 10, 400, 10) }))
    const leads = regionNodeLeads(region(0, 0, 400, 200), manifest(many), 1)
    // Capped, not truncated arbitrarily: what survives is the best by overlap.
    expect(leads).toHaveLength(6)
    expect(leads.every((l) => l.overlap.ofRegion >= 0.02)).toBe(true)

    // A one-pixel clip of a huge element is noise, and is dropped.
    const grazed = regionNodeLeads(region(0, 0, 1000, 1000), manifest([{ text: 'edge', box: box(999, 999, 400, 400) }]), 1)
    expect(grazed).toEqual([])
  })

  it('carries no leads at all when no manifest is supplied', () => {
    // `1c diff` is routinely pointed at a pair of loose PNGs with no manifest
    // anywhere. Node resolution is optional input for exactly that reason: a
    // required one would have made the cheapest use of the command impossible.
    expect(regionNodeLeads(region(0, 0, 100, 100), undefined, 1)).toEqual([])
    const annotated = resolveRegionNodes([{ bbox: region(0, 0, 100, 100) }], {}, 1280)
    expect(annotated[0].nodes).toEqual({ ref: [], actual: [] })
  })

  it('puts the leads in the digest, beside the geometry it already prints', () => {
    // The digest exists so a round does not spend reads counting. A region whose
    // sides name different things is exactly that kind of fact — worth having
    // without opening the file — so it is printed on the same line as the
    // geometry it belongs to.
    const digest = buildDigest({
      n: 1,
      gate: {},
      valuesDiff: {},
      regions: {
        meanDiff: 0.69,
        pctOverThreshold: 0.31,
        rankedBy: 'score',
        regions: [
          {
            id: 1,
            bbox: { x: 448, y: 96, w: 272, h: 64 },
            score: 2194,
            meanDiff: 48.7,
            nodes: {
              ref: [{ kind: 'element', index: 4, text: 'Book a table', overlap: { ofRegion: 0.82, ofNode: 1 } }],
              actual: [],
            },
          },
        ],
      },
      capture: {},
      manifest: {},
      page: {},
    })

    expect(digest).toContain('#1 (448, 96) 272×64')
    expect(digest).toContain('ranked by `score`, highest first')
    expect(digest).toContain('under it — ref: “Book a table” (82% of region) · ours: _nothing_')
  })

  it('renders a region caption a reader can quote, and omits it when there is nothing to say', () => {
    // The console's diff page is where a diagnosing round actually looks. Three
    // unlabelled images say *that* something differs; the caption says where,
    // how hard, and what each side has under it.
    const caption = regionCaption({
      id: 1,
      bbox: { x: 96, y: 240, w: 320, h: 64 },
      score: 246.4,
      meanDiff: 30.8,
      nodes: { ref: [{ text: 'Example Domain', overlap: { ofRegion: 0.75 } }], actual: [] },
    })
    expect(caption).toBe('96,240 320×64 · score 246.4 · mean 30.8 · ref: “Example Domain” (75%) · ours: nothing')

    // A report written before the leads existed still renders: the caption is
    // absent rather than the page refusing.
    expect(regionCaption({ id: 1 })).toBeUndefined()
  })
})

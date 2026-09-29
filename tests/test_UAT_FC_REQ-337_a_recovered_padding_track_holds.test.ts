/**
 * REQ-337 — a track the RECOVERY invents inherits the document's reflow windows.
 *
 * The defect these UATs pin: `foldToL1` decides the reflow windows as the last
 * thing it does (`holdAcrossReflowWindows`, BUG-113), and then `promoteToFlow`
 * runs AFTER it and invents a brand new responsive track —
 * `responsivePadding.bottomPx`, written by `withContentInset` so a panel whose
 * height now comes from its content still reaches the next section's edge. A
 * track born downstream of that decision carries no `segments` at all, and the
 * schema's documented default for an absent flag is `interpolate`.
 *
 * So the padding slid through a window the box around it was holding. On
 * `gigabytealchemy.ai` it was 12 of 12 padding tracks, every one owned by a node
 * whose own `geometry.segments` reads `snap` across 375→768, and the served CSS
 * said it out loud — in a single media block, `width: 327px` as a literal beside
 * `padding-bottom: calc(216px + (-60 * (100vw - 375px) / 393))`. Twelve of that
 * block's 102 rules mentioned `100vw` and all twelve were a `padding-bottom`,
 * which made them the only thing on the whole page that moved between those two
 * captured widths: up to 201.67px of false height on the hero, pushing
 * everything below it down by the same amount.
 *
 * Why no existing measure caught it: at a captured width `snap` and
 * `interpolate` resolve to that width's own keyframe BY CONSTRUCTION, and every
 * reference screenshot and every perceptual diff is taken at a rung. Only a
 * width strictly between two rungs can see it.
 *
 * The fix is the class and not the site: the hold is re-run over the recovery's
 * output, so it is not `bottomPx` that is special but "a track that did not
 * exist when the windows were decided". The UATs below therefore assert the
 * INVARIANT — every track on a node agrees with every other across each window —
 * rather than the one field.
 *
 * Real components throughout, at the entry points the defect lives at:
 * `promoteToFlow` (the recovery that writes the track), `validateL1` and
 * `renderL1Document` (the CSS a browser is actually handed). The document is
 * authored rather than folded for the reason BUG-142 and REQ-278 author theirs:
 * the recovery is demand-driven, so a document that demands it is the only way
 * to reach that path.
 */
import { describe, expect, it } from 'vitest'
import { promoteToFlow } from '../tools/generate/src/l1'
import { renderL1Document } from '../packages/framework/src/l1/render'
import { validateL1 } from '../packages/site-schema/src/index'
import type { L1Document, L1Node } from '../packages/site-schema/src/index'

/** Four rungs, so there are three windows and the middle one can be the reflow. */
const LADDER = [320, 375, 768, 1024]
/** The window that reflows: `LADDER[1]` → `LADDER[2]`, i.e. 375 → 768. */
const SNAPPED = 1
const SEGMENTS = ['interpolate', 'snap', 'interpolate'] as const

const CARD_FILL = '#f8f5f2'
const LINE_H = 25

/**
 * A panel that re-tiles: full-bleed and two lines tall below 768, a half-width
 * column and one line tall at and above it.
 *
 * The x jump across 375→768 is 376px, well past `segmentKind`'s quarter-viewport
 * reflow threshold, so `snap` on that window is what a fold would really write
 * here — it is not a flag invented for the test. The panel keeps a generous
 * declared height at every rung while its content halves, which is precisely
 * what gives `withContentInset` a bottom inset that CHANGES across the snapped
 * window. A padding track whose value were the same either side of the window
 * would render identically held or fluid and could prove nothing.
 */
const CARD_FRAMES = [
  { at: 320, x: 24, y: 40, width: 272, height: 240 },
  { at: 375, x: 24, y: 40, width: 327, height: 240 },
  { at: 768, x: 400, y: 40, width: 344, height: 160 },
  { at: 1024, x: 520, y: 40, width: 480, height: 160 },
]

/** The heights the browser gave the run — two lines narrow, one line wide. */
const RUN_HEIGHT: Record<number, number> = { 320: LINE_H * 2, 375: LINE_H * 2, 768: LINE_H, 1024: LINE_H }

const COPY = 'A line of copy that wraps on a narrow rung and does not on a wide one'

/**
 * A fold-synthesized card holding exactly one run.
 *
 * One child, and a `card-` id, is the lone-child admission in `promoteToFlow`'s
 * `rewrite` (REQ-324): a backing surface that owns a single run is flowed even
 * though no pair of siblings can collide. That is the shortest real path to
 * `withContentInset`, and it is the same path the 12 tracks on the reference
 * took.
 */
function authoredPage(): L1Document {
  const run: L1Node = {
    kind: 'text',
    text: COPY,
    axes: { fontSizePx: 18, lineHeightPx: LINE_H, color: '#111111', fontFamily: 'Arial', fontWeight: 400 },
    geometry: {
      keyframes: CARD_FRAMES.map((f) => ({
        at: f.at,
        x: 16,
        y: 16,
        width: f.width - 32,
        height: RUN_HEIGHT[f.at],
      })),
      segments: [...SEGMENTS],
    },
  }
  const card: L1Node = {
    kind: 'container',
    id: 'card-0',
    layout: 'stack',
    axes: { surfaceFill: CARD_FILL },
    geometry: { keyframes: CARD_FRAMES, segments: [...SEGMENTS] },
    children: [run],
  }
  /**
   * A caption beside the card whose TYPE track was never held.
   *
   * Two jobs. It is a second instance of the class that is not `bottomPx` —
   * a scalar axis sliding its size through a window whose geometry is holding is
   * the same disagreement one axis down, and the fix has to reach it too or it
   * is a fix for one field. And it is the node that makes the aliasing hazard
   * reachable: `rewrite` returns a leaf BY REFERENCE out of the document it was
   * handed, so a hold applied in place would reach back into the base.
   *
   * A document out of `foldToL1` never carries an unheld track (the fold holds
   * as the last thing it does), but `promoteToFlow` is also handed authored and
   * edited documents, which do.
   */
  const caption: L1Node = {
    kind: 'text',
    text: 'Figure 1',
    axes: { fontSizePx: 24, lineHeightPx: LINE_H, color: '#111111', fontFamily: 'Arial', fontWeight: 400 },
    geometry: {
      keyframes: LADDER.map((at, i) => ({ at, x: CARD_FRAMES[i].x, y: 320, width: 200, height: LINE_H })),
      segments: [...SEGMENTS],
    },
    responsive: { fontSizePx: { keyframes: LADDER.map((at) => ({ at, value: at / 20 })) } },
  }
  return {
    widths: [...LADDER],
    root: {
      kind: 'box',
      geometry: {
        keyframes: LADDER.map((at) => ({ at, x: 0, y: 0, width: at, height: 400 })),
        segments: [...SEGMENTS],
      },
      children: [card, caption],
    },
  }
}

// ── reading the document back ────────────────────────────────────────────────

const kidsOf = (n: L1Node): readonly L1Node[] =>
  n.kind === 'container' ? n.children : n.kind === 'box' ? (n.children ?? []) : []

function nodesOf(doc: L1Document): L1Node[] {
  const out: L1Node[] = []
  const walk = (n: L1Node): void => {
    out.push(n)
    kidsOf(n).forEach(walk)
  }
  walk(doc.root)
  return out
}

const cardOf = (doc: L1Document): L1Node => nodesOf(doc).find((n) => n.id === 'card-0')!

type Track = { keyframes: Array<{ at: number }>; segments?: string[] }

/**
 * Every responsive track a node carries, by the name it is reachable under.
 *
 * Mirrors the walk the hold itself does — one level into object-valued node
 * properties — because that is exactly the reach the invariant is claimed over:
 * `geometry`, `responsive.fontSizePx`, `responsivePadding.bottomPx`.
 */
function tracksOf(node: L1Node): Array<{ name: string; track: Track }> {
  const out: Array<{ name: string; track: Track }> = []
  const consider = (name: string, value: unknown): void => {
    if (!value || typeof value !== 'object') return
    const candidate = value as Partial<Track>
    if (Array.isArray(candidate.keyframes) && candidate.keyframes.length > 1) {
      out.push({ name, track: candidate as Track })
    }
  }
  for (const [key, value] of Object.entries(node as unknown as Record<string, unknown>)) {
    consider(key, value)
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      for (const [inner, nested] of Object.entries(value as Record<string, unknown>)) {
        consider(`${key}.${inner}`, nested)
      }
    }
  }
  return out
}

/**
 * The body of every `@media (min-width: N)` block of a rendered sheet.
 *
 * Brace-matched rather than pattern-matched: a media block CONTAINS rules, so
 * the first `}` after the opener is an inner rule's and not the block's.
 */
function mediaBlock(css: string, minWidth: number): string[] {
  const out: string[] = []
  const opener = new RegExp(`@media \\(min-width:\\s*${minWidth}px\\)\\s*\\{`, 'g')
  for (const m of css.matchAll(opener)) {
    let depth = 1
    const from = m.index + m[0].length
    let i = from
    for (; i < css.length && depth > 0; i++) {
      if (css[i] === '{') depth++
      else if (css[i] === '}') depth--
    }
    out.push(css.slice(from, i - 1))
  }
  return out
}

describe('REQ-337 — the recovery holds the tracks it invents', () => {
  it('test_UAT_FC_REQ-337_a_recovered_padding_track_inherits_the_reflow_window', () => {
    const { doc } = promoteToFlow(authoredPage())
    const card = cardOf(doc)

    // The premise of the whole ticket: the recovery DID invent the track. If
    // `withContentInset` stopped writing one, everything below would pass by
    // vacuity rather than by holding.
    const padding = (card as { responsivePadding?: { bottomPx?: Track } }).responsivePadding?.bottomPx
    expect(padding, 'the recovery hands the flowed panel a bottom inset').toBeDefined()

    // And a track whose value actually MOVES across the snapped window — the
    // only case in which held and fluid are distinguishable at all.
    const at = (w: number): number =>
      (padding!.keyframes as Array<{ at: number; value: number }>).find((k) => k.at === w)!.value
    expect(
      Math.abs(at(LADDER[SNAPPED + 1]) - at(LADDER[SNAPPED])),
      'the inset changes across the reflow window, so the two kinds differ',
    ).toBeGreaterThan(1)

    // The fix. Before it the track carried no `segments` at all and the
    // renderer's documented default — `interpolate` — took over.
    expect(padding!.segments, 'the invented track carries segment flags').toBeDefined()
    expect(
      padding!.segments![SNAPPED],
      'and holds across the window its own box is holding, rather than sliding through it',
    ).toBe('snap')
    expect(
      padding!.segments,
      'the whole track agrees with the geometry beside it, window for window',
    ).toEqual(card.geometry!.segments)

    // And the class, not the field: a TYPE track that arrived unheld is held by
    // the same pass. Nothing about `bottomPx` is special — only about a track
    // that was not there when the windows were decided.
    const caption = nodesOf(doc).find((n) => n.kind === 'text' && n.text === 'Figure 1')!
    const type = (caption as { responsive?: { fontSizePx?: Track } }).responsive?.fontSizePx
    expect(type?.segments?.[SNAPPED], 'the type track holds across the reflow window too').toBe('snap')
  })

  it('test_UAT_FC_REQ-337_every_track_on_a_node_agrees_across_every_window', () => {
    // The invariant the ticket asks for, stated over the whole served document
    // rather than over the one field that broke it: for every node and every
    // window, all of that node's tracks agree on whether the page reflows there.
    // Twelve of twelve is not a slip — it is an invariant nothing was checking.
    const { doc } = promoteToFlow(authoredPage())

    const disagreements: string[] = []
    for (const node of nodesOf(doc)) {
      const tracks = tracksOf(node)
      if (tracks.length < 2) continue
      for (let i = 0; i < LADDER.length - 1; i++) {
        const kinds = new Map<string, string>()
        for (const { name, track } of tracks) {
          // Only tracks that actually span this window have an opinion on it.
          if (track.keyframes[i]?.at !== LADDER[i]) continue
          kinds.set(name, track.segments?.[i] ?? 'interpolate')
        }
        const distinct = new Set(kinds.values())
        if (distinct.size > 1) {
          disagreements.push(
            `${node.id ?? node.kind} @ ${LADDER[i]}→${LADDER[i + 1]}: ${JSON.stringify([...kinds])}`,
          )
        }
      }
    }
    expect(disagreements, 'no track interpolates through a window another track on its node snaps').toEqual([])
  })

  it('test_UAT_FC_REQ-337_the_served_css_holds_the_padding_it_holds_the_width', () => {
    // The consequence, read out of the CSS a browser is handed — the same place
    // the ticket read the defect, and not out of a probe. Between two rungs of a
    // snapped window an interpolating `calc()` is the ONLY thing that can move,
    // so its absence there is the whole fix, visible.
    const { doc } = promoteToFlow(authoredPage())
    expect(validateL1(doc).ok, 'the held document still validates').toBe(true)

    const { css } = renderL1Document(doc)
    const held = mediaBlock(css, LADDER[SNAPPED]).join('\n')
    expect(held, 'the snapped window has a media block of its own').not.toEqual('')

    // Every `padding-bottom` VALUE the block declares. Read as values and not as
    // whole declarations because a declaration inside a media block is nested in
    // its rule (`.l1-1 { padding-bottom: … }`), so a line-oriented filter matches
    // nothing and passes by vacuity whatever the sheet says.
    const values = [...held.matchAll(/padding-bottom:\s*([^;}]+)/g)].map((m) => m[1].trim())
    expect(values.length, 'the block declares the inset at all').toBeGreaterThan(0)

    // Pre-fix this read `calc(174px + (-55 * (100vw - 375px) / 393))`, the exact
    // shape the ticket quoted off the reference's own served page.
    expect(
      values.filter((v) => v.includes('100vw')),
      'no padding interpolates across the window the layout is holding',
    ).toEqual([])
    expect(
      values.every((v) => /^[\d.]+px$/.test(v)),
      `every declared inset is a bare literal, as the width beside it is — got ${values.join(' | ')}`,
    ).toBe(true)
  })

  it('test_UAT_FC_REQ-337_the_recovery_does_not_hold_the_base_it_is_scored_against', () => {
    // A technical consequence of fixing the class rather than the one call site:
    // the hold MUTATES IN PLACE, and `promoteToFlow`'s rewrite returns every node
    // it did not have to touch by reference out of the document it was handed.
    // That document is the base `chooseRecovery` scores this result against, so a
    // hold applied to it in passing would have the challenger quietly editing its
    // own control. The recovery works on a clone.
    const base = authoredPage()
    const before = structuredClone(base)
    promoteToFlow(base)
    expect(base, 'the recovery leaves the document it was given untouched').toEqual(before)
  })
})

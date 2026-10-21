/**
 * REQ-420 — vertical rhythm: the space between neighbours in a stack of text.
 *
 * THE PROXIMITY PRINCIPLE. A heading belongs to the text below it, so the space
 * above a heading is clearly larger than the space below it. A container that
 * can only space its children evenly (`gapPx`) cannot say that, and every page
 * built from it gets headings that float halfway between two paragraphs.
 *
 * So spacing is carried by the elements, in RHYTHM UNITS — multiples of the
 * site's base unit (`site.rhythm`). Each element asks for space above and below
 * itself: its own value, else its text style's, else its level's default from
 * {@link L1_RHYTHM_DEFAULTS}. Between two neighbours the space is the larger of
 * the first one's `spaceBelow` and the second one's `spaceAbove` — collapsing,
 * as in typesetting — and the first child's space above and the last child's
 * space below are dropped, so the container's padding governs its edges.
 *
 * Lives in site-schema rather than in either consumer because BOTH have to agree
 * on it, exactly as {@link resolveLayoutMode} does: the renderer emits these
 * spaces as margins and the analytic evaluator (`tools/generate/src/l1/probes.ts`)
 * advances its cursor by them. Two copies of the arithmetic is the drift that
 * makes the analytic gate report phantom findings.
 */
import type { L1Node, L1Rhythm, L1ScalarTrack, L1Spacing, L1TextStyles } from './types'

/**
 * The default space, in rhythm units, an element takes above and below itself
 * when neither it nor its style says. ONE PLACE: change a value here and every
 * page that has not chosen its own changes with it.
 *
 * Headings ask for two to four times as much above as below, which is what
 * attaches each to the text after it. A paragraph asks for one unit below and
 * nothing above, so paragraphs sit one unit apart and a heading's own space above
 * wins against the paragraph before it. Anything else in a rhythm stack — a
 * picture, a group, a form control — takes one unit each side.
 */
export const L1_RHYTHM_DEFAULTS = {
  heading: {
    1: { above: 3, below: 0.75 },
    2: { above: 2.5, below: 0.5 },
    3: { above: 2, below: 0.5 },
    4: { above: 1.5, below: 0.5 },
    5: { above: 1.5, below: 0.5 },
    6: { above: 1.5, below: 0.5 },
  },
  text: { above: 0, below: 1 },
  block: { above: 1, below: 1 },
} as const

/**
 * The attribute on a keep-with-next group's wrapper. The wrapper is the one
 * element the renderer emits that is not a node, so anything reading the page's
 * structure by position — the n-th element child of the root is node `0.n` —
 * looks through an element carrying it to the nodes inside.
 */
export const L1_KEEP_ATTR = 'data-l1-keep'

/** The unit, in px, when a site declares none and its default style sets no line height. */
export const L1_RHYTHM_FALLBACK_UNIT_PX = 24

/** One element's space, in rhythm units. */
export interface L1Space {
  above: number
  below: number
}

/** A rhythm unit: a single px value, and a per-width track when it varies. */
export interface L1RhythmUnit {
  unitPx: number
  track?: L1ScalarTrack
}

type Container = Extract<L1Node, { kind: 'container' }>

const hasGeometry = (node: L1Node): boolean => node.geometry !== undefined

/**
 * How `node` spaces its children. Its own `spacing` when it says; otherwise
 * `gap` when it has a `gapPx` — every document written before rhythm existed
 * keeps rendering exactly as it did — and `rhythm` for a plain stack of text:
 * a `stack` at every width that holds at least one text run and no child placed
 * by geometry (a reproduction's pinned or offset children carry their own
 * measured spacing, which rhythm must not add to).
 */
export function l1SpacingOf(node: Container): L1Spacing {
  if (node.spacing !== undefined) return node.spacing
  if (node.gapPx !== undefined) return 'gap'
  if (node.layout !== 'stack' || node.responsiveLayout !== undefined) return 'gap'
  if (node.children.some(hasGeometry)) return 'gap'
  return node.children.some((c) => c.kind === 'text') ? 'rhythm' : 'gap'
}

/** The heading level of a text run, or `undefined` for anything else. */
function headingLevel(node: L1Node): number | undefined {
  return node.kind === 'text' ? node.heading?.level : undefined
}

/**
 * The space `node` asks for, in rhythm units: its own `spaceAbove`/`spaceBelow`
 * (a run's style has already been resolved into them), else its default.
 *
 * An unpainted, unpadded rhythm container passes its first and last children's
 * space through, so a heading wrapped in a plain group still asks for a heading's
 * space above.
 */
export function l1SpaceOf(node: L1Node): L1Space {
  const fallback = defaultSpace(node)
  return { above: node.spaceAbove ?? fallback.above, below: node.spaceBelow ?? fallback.below }
}

function defaultSpace(node: L1Node): L1Space {
  const level = headingLevel(node)
  if (level !== undefined) return L1_RHYTHM_DEFAULTS.heading[level as 1 | 2 | 3 | 4 | 5 | 6]
  if (node.kind === 'text') return L1_RHYTHM_DEFAULTS.text
  if (node.kind === 'container' && transparent(node)) {
    const members = memberIndices(node)
    if (members.length > 0) {
      return {
        above: l1SpaceOf(node.children[members[0]]).above,
        below: l1SpaceOf(node.children[members[members.length - 1]]).below,
      }
    }
  }
  return L1_RHYTHM_DEFAULTS.block
}

/** A rhythm container that paints nothing and insets nothing, so its edges are its children's. */
function transparent(node: Container): boolean {
  if (l1SpacingOf(node) !== 'rhythm') return false
  if (node.axes !== undefined && Object.keys(node.axes).length > 0) return false
  return node.padding === undefined && node.responsivePadding === undefined
}

/**
 * The children rhythm spaces: every child in the flow. A child placed by its own
 * geometry carries its measured position, and a modal panel paints in a covering
 * shell of its own, so neither is anybody's neighbour.
 */
function memberIndices(node: Container): number[] {
  return node.children.flatMap((c, i) => (hasGeometry(c) || ('dialog' in c && c.dialog !== undefined) ? [] : [i]))
}

/**
 * Keep-with-next: a run of children rendered as one unit. A heading (or a run of
 * headings — an eyebrow and a title) together with the child after it, so a
 * reflow can never end a column, or a line of a wrapping row, on a heading whose
 * text has gone to the next one — and so assistive technology reads the heading
 * and its text as one group.
 */
export interface L1RhythmGroup {
  /** First and last child index, inclusive. */
  start: number
  end: number
  /** The index of the group's first heading — the group's label. */
  heading: number
}

/** What a rhythm container's children get: each member's lead, and the groups. */
export interface L1RhythmPlan {
  /**
   * The space before each member child, in rhythm units, by child index: the
   * larger of the previous member's `spaceBelow` and its own `spaceAbove`, and 0
   * for the first member. A child with no entry is not a member — it is placed
   * by its own geometry and rhythm leaves it alone.
   */
  leads: Map<number, number>
  groups: L1RhythmGroup[]
}

/** The rhythm plan for `node`, or `null` when it spaces its children by `gap`. */
export function l1RhythmPlan(node: Container): L1RhythmPlan | null {
  if (l1SpacingOf(node) !== 'rhythm') return null
  const members = memberIndices(node)
  const leads = new Map<number, number>()
  members.forEach((index, k) => {
    if (k === 0) {
      leads.set(index, 0)
      return
    }
    const before = l1SpaceOf(node.children[members[k - 1]]).below
    leads.set(index, Math.max(before, l1SpaceOf(node.children[index]).above))
  })
  const groups: L1RhythmGroup[] = []
  for (let i = 0; i < node.children.length; i++) {
    if (headingLevel(node.children[i]) === undefined || !leads.has(i)) continue
    let end = i
    while (end + 1 < node.children.length && leads.has(end + 1) && headingLevel(node.children[end + 1]) !== undefined) end++
    if (end + 1 >= node.children.length || !leads.has(end + 1)) {
      i = end
      continue
    }
    groups.push({ start: i, end: end + 1, heading: i })
    i = end + 1
  }
  return { leads, groups }
}

/**
 * The site's rhythm unit: what it declares, else its default text style's line
 * height (the unit "is" one line of body text), else
 * {@link L1_RHYTHM_FALLBACK_UNIT_PX}.
 */
export function l1RhythmUnit(site: {
  rhythm?: L1Rhythm
  textStyles?: L1TextStyles
  textDefault?: string
}): L1RhythmUnit {
  if (site.rhythm) {
    const track = site.rhythm.responsive?.unitPx
    return track ? { unitPx: site.rhythm.unitPx, track } : { unitPx: site.rhythm.unitPx }
  }
  const body = site.textDefault !== undefined ? site.textStyles?.[site.textDefault] : undefined
  const bounded = (px: number): number => Math.min(200, Math.max(1, px))
  const track = body?.responsive?.lineHeightPx
  if (track) {
    return {
      unitPx: bounded(track.keyframes[track.keyframes.length - 1].value),
      track: { ...track, keyframes: track.keyframes.map((k) => ({ ...k, value: bounded(k.value) })) },
    }
  }
  if (body?.lineHeightPx !== undefined && body.lineHeightPx > 0) return { unitPx: bounded(body.lineHeightPx) }
  return { unitPx: L1_RHYTHM_FALLBACK_UNIT_PX }
}

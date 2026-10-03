/**
 * REQ-350 — structuring an existing page without re-capturing it.
 *
 * A page folded before 2026-09-25 is a flat list of siblings: its sections
 * survive only as empty backing boxes with their copy painted over them, so
 * "attach these fields to their section" cannot be said and every repair is
 * coordinate arithmetic. Deciding WHAT forms a section is a judgement about
 * meaning, and it stays with the author. The arithmetic of making it one is
 * done here.
 *
 * {@link groupL1} wraps a set of siblings in a new container and rebases their
 * coordinates onto it, with the same {@link rebaseInto} the fold nests captured
 * content with. The render is unchanged by construction rather than by
 * measurement: every member keeps its own absolute placement and only the frame
 * it is read in moves, so no text height has to be known and it runs anywhere,
 * a Worker included.
 */
import {
  formatL1Path,
  validateL1,
  type L1Document,
  type L1Geometry,
  type L1Keyframe,
  type L1Node,
  type ValidateL1Options,
} from '@1stcontact/site-schema'
import {
  evaluateLayout,
  measuredTextHeights,
  offSampleWidths,
  oracleBoxes,
  promoteToFlow,
  InvalidRecoveryError,
  type EvalBox,
  type OracleSource,
} from './probes'
import { frameAt, rebaseInto, surfaceBorderInset } from './rebase'

/** Why a structure change was refused, in the terms the edit surface reports. */
export interface StructureRefusal {
  ok: false
  code: 'NOT_FOUND' | 'SCHEMA_INVALID'
  message: string
  hint?: string
}

export interface GroupResult {
  ok: true
  doc: L1Document
  /** The new container's address. */
  path: number[]
}

export interface GroupOptions {
  /** An `id` for the new container — what an author calls the section. */
  id?: string
  /** The site's palette and text styles, so a page that refers to them still validates. */
  site?: ValidateL1Options
}

const refuse = (code: StructureRefusal['code'], message: string, hint?: string): StructureRefusal => ({
  ok: false,
  code,
  message,
  hint,
})

/** The node at `path` in a page document, whose only root is `doc.root` (address `0`). */
function nodeAt(doc: L1Document, path: readonly number[]): L1Node | undefined {
  if (path[0] !== 0) return undefined
  let node: L1Node = doc.root
  for (const i of path.slice(1)) {
    const children = childrenOf(node)
    if (!children || !children[i]) return undefined
    node = children[i]
  }
  return node
}

function childrenOf(node: L1Node): L1Node[] | undefined {
  if (node.kind === 'container') return node.children
  if (node.kind === 'box') return node.children
  return undefined
}

function geometryOf(node: L1Node): L1Geometry | undefined {
  return 'geometry' in node ? node.geometry : undefined
}

/** The same node with `children` replaced. Only boxes and containers hold children. */
function withChildren(node: L1Node, children: L1Node[]): L1Node {
  return { ...node, children } as L1Node
}

/** Replace the node at `path` inside `doc`, returning a new document. */
function replaceAt(doc: L1Document, path: readonly number[], next: L1Node): L1Document {
  const rebuild = (node: L1Node, rest: readonly number[]): L1Node => {
    if (rest.length === 0) return next
    const children = childrenOf(node)!.slice()
    children[rest[0]] = rebuild(children[rest[0]], rest.slice(1))
    return withChildren(node, children)
  }
  return { ...doc, root: rebuild(doc.root, path.slice(1)) }
}

/**
 * The vertical track the new container is placed on.
 *
 * Exact where it can be: when every member is keyframed at the same widths with
 * the same segment flags, the container's top is the members' topmost edge at
 * each of those widths and interpolates the way they do — so `container + member`
 * is the member's own track at every viewport width, not just the sampled ones,
 * because a sum of two tracks that bend at the same widths bends at those widths.
 *
 * Where the members disagree about their own ladders there is no such track, and
 * a constant top is the one frame every member can be rebased into exactly: it is
 * the members' highest point across the whole ladder.
 */
function containerTops(members: readonly L1Geometry[]): { ats: number[]; tops: number[]; segments?: L1Geometry['segments'] } {
  const ats = members[0].keyframes.map((k) => k.at)
  const segs = JSON.stringify(members[0].segments ?? [])
  const shared = members.every(
    (g) =>
      g.keyframes.length === ats.length &&
      g.keyframes.every((k, i) => k.at === ats[i]) &&
      JSON.stringify(g.segments ?? []) === segs,
  )
  if (shared) {
    return {
      ats,
      tops: ats.map((_, i) => Math.min(...members.map((g) => g.keyframes[i].y))),
      segments: members[0].segments,
    }
  }
  const top = Math.min(...members.flatMap((g) => g.keyframes.map((k) => k.y)))
  return { ats: [ats[0]], tops: [top] }
}

/** Every box painted under `path` (the node itself and all its descendants), at one width. */
function paintedBoxes(boxes: Map<string, EvalBox>, path: string): EvalBox[] {
  const out: EvalBox[] = []
  for (const [p, box] of boxes) {
    if ((p === path || p.startsWith(`${path}.`)) && box.width > 0 && box.height > 0) out.push(box)
  }
  return out
}

const overlaps = (a: EvalBox, b: EvalBox): boolean =>
  a.x < b.x + b.width - 0.5 && b.x < a.x + a.width - 0.5 && a.y < b.y + b.height - 0.5 && b.y < a.y + a.height - 0.5

/**
 * Wrap the siblings at `paths` in a new container, in document order, at the
 * position of the first of them.
 *
 * The container spans its parent's full width at x = 0 — so a member anchored
 * to the page's content column still reads that column the same way — and its
 * top follows the members' ({@link containerTops}). Members are rebased onto it
 * by {@link rebaseInto}; nothing else about them changes.
 *
 * Refused, with nothing changed, when:
 *  - the addresses are not siblings of one parent, or name the page itself;
 *  - a member is placed in flow (its position depends on its neighbours, which
 *    the regrouping changes) or has no geometry to rebase;
 *  - the regrouping would change what paints over what. Siblings paint in
 *    document order, so lifting a later member above a non-member that sat
 *    between two members, where the two overlap, would change the picture.
 */
export function groupL1(
  doc: L1Document,
  paths: ReadonlyArray<readonly number[]>,
  options: GroupOptions = {},
): GroupResult | StructureRefusal {
  if (paths.length === 0) return refuse('SCHEMA_INVALID', 'Name at least one element to group.')
  const parentPath = paths[0].slice(0, -1)
  if (parentPath.length === 0) {
    return refuse('SCHEMA_INVALID', 'The page itself cannot be grouped.', 'Name elements inside the page, e.g. 0.3.')
  }
  const sameParent = paths.every(
    (p) => p.length === parentPath.length + 1 && p.slice(0, -1).every((v, i) => v === parentPath[i]),
  )
  if (!sameParent) {
    return refuse(
      'SCHEMA_INVALID',
      'Only elements that share one parent can be grouped.',
      'Every address must differ only in its last number, e.g. 0.3, 0.4 and 0.7.',
    )
  }
  const parent = nodeAt(doc, parentPath)
  const siblings = parent ? childrenOf(parent) : undefined
  if (!parent || !siblings) {
    return refuse('NOT_FOUND', `Address '${formatL1Path(parentPath)}' resolves to no element that holds others.`)
  }
  const indices = [...new Set(paths.map((p) => p[p.length - 1]))].sort((a, b) => a - b)
  const members: L1Node[] = []
  const memberGeos: L1Geometry[] = []
  for (const i of indices) {
    const member = siblings[i]
    const address = formatL1Path([...parentPath, i])
    if (!member) return refuse('NOT_FOUND', `Address '${address}' resolves to no element.`)
    const geo = geometryOf(member)
    if (!geo) {
      return refuse('SCHEMA_INVALID', `The element at ${address} has no placement of its own to carry into a group.`)
    }
    if (geo.place === 'flow') {
      return refuse(
        'SCHEMA_INVALID',
        `The element at ${address} is placed in flow, so where it sits depends on its neighbours.`,
        'Group elements that are placed by their own coordinates; flow is applied to a group afterwards.',
      )
    }
    members.push(member)
    memberGeos.push(geo)
  }

  // ── paint order ────────────────────────────────────────────────────────────
  const first = indices[0]
  const between = siblings
    .map((_, i) => i)
    .filter((i) => i > first && i < indices[indices.length - 1] && !indices.includes(i))
  if (between.length > 0) {
    const widths = [...new Set([...doc.widths, ...offSampleWidths(doc)])].sort((a, b) => a - b)
    for (const w of widths) {
      const boxes = evaluateLayout(doc, w).boxes
      for (const s of between) {
        const sBoxes = paintedBoxes(boxes, formatL1Path([...parentPath, s]))
        for (const m of indices.filter((i) => i > s)) {
          const mBoxes = paintedBoxes(boxes, formatL1Path([...parentPath, m]))
          if (sBoxes.some((a) => mBoxes.some((b) => overlaps(a, b)))) {
            return refuse(
              'SCHEMA_INVALID',
              `Grouping would paint ${formatL1Path([...parentPath, s])} over ${formatL1Path([...parentPath, m])} at ${w}px, where today it is underneath.`,
              `Include ${formatL1Path([...parentPath, s])} in the group, or group the elements on either side of it separately.`,
            )
          }
        }
      }
    }
  }

  // ── the container ──────────────────────────────────────────────────────────
  const parentGeo = geometryOf(parent)
  const inset = surfaceBorderInset('axes' in parent ? parent.axes : undefined)
  const { ats, tops, segments } = containerTops(memberGeos)
  const keyframes: L1Keyframe[] = ats.map((at, i) => {
    // The parent's content width at this width: the viewport for the page
    // itself, the parent's own extent inside its border otherwise.
    const width = parentGeo ? Math.max(0, frameAt(parentGeo, at).width - inset.left - inset.right) : at
    return { at, x: 0, y: tops[i], width }
  })
  const geometry: L1Geometry = { keyframes, ...(segments ? { segments } : {}) }
  const container: L1Node = {
    kind: 'container',
    ...(options.id ? { id: options.id } : {}),
    layout: 'stack',
    geometry,
    children: members.map((m) => rebaseInto(m, geometry, undefined)),
  } as L1Node

  const nextChildren: L1Node[] = []
  siblings.forEach((child, i) => {
    if (i === first) nextChildren.push(container)
    else if (!indices.includes(i)) nextChildren.push(child)
  })
  const next = replaceAt(doc, parentPath, withChildren(parent, nextChildren))
  const checked = validateL1(next, options.site)
  if (!checked.ok) {
    return refuse('SCHEMA_INVALID', `The grouped page would not validate: ${checked.errors[0]?.message ?? 'unknown error'}.`)
  }
  return { ok: true, doc: checked.value, path: [...parentPath, first] }
}

export interface FlowResult {
  ok: true
  doc: L1Document
}

/**
 * Switch one container's contents to `flow` (REQ-350 geometry item 4, decision
 * D1): each child keeps its captured place, now expressed as a gap below the
 * child before it, so making any of them taller pushes the rest down.
 *
 * THE ARITHMETIC IS THE RECOVERY'S. {@link promoteToFlow} already turns pinned
 * siblings into leading offsets — bands, rows that stack at narrow widths,
 * backing fills left behind as backgrounds — and here it is pointed at one node
 * by address rather than at the regions a collision probe found. The one input
 * it cannot compute is each run's height, so it is given the heights a browser
 * measured on the page as it stands (`measured`).
 *
 * Refused when the address is not a container or nothing in it can join a flow.
 */
export function flowL1(
  doc: L1Document,
  path: readonly number[],
  measured: OracleSource,
  options: { site?: ValidateL1Options } = {},
): FlowResult | StructureRefusal {
  const node = nodeAt(doc, path)
  const address = formatL1Path(path)
  if (!node) return refuse('NOT_FOUND', `Address '${address}' resolves to no element.`)
  const children = childrenOf(node)
  if (!children || children.length === 0) {
    return refuse('SCHEMA_INVALID', `The element at ${address} holds nothing to stack.`, 'Name a group, a section or the page (0).')
  }
  const pinned = children.filter((c) => {
    const geo = geometryOf(c)
    return geo !== undefined && geo.place !== 'flow'
  })
  if (pinned.length === 0) {
    return refuse('SCHEMA_INVALID', `Everything in ${address} is already stacked in flow.`)
  }
  try {
    const { doc: next } = promoteToFlow(doc, {
      only: address,
      measured: measuredTextHeights(measured),
      site: options.site,
    })
    return { ok: true, doc: next }
  } catch (err) {
    // BUG-180 — an invalid result is a refused edit, not a crash.
    if (err instanceof InvalidRecoveryError) return refuse('SCHEMA_INVALID', err.message)
    throw err
  }
}

/** Where one run moved between two measurements of the same page. */
export interface LayoutDrift {
  text: string
  width: number
  dx: number
  dy: number
  dw: number
  dh: number
}

/**
 * The first run that is not where it was, between two browser readings of the
 * same page — or `null` when every run is within half a pixel at every width.
 *
 * Paired the way the fidelity probe pairs: by kind, text and occurrence, so a
 * repeated label is compared with its own counterpart. A run present in one
 * reading and not the other is a drift too, reported at a distance of Infinity.
 */
export function layoutDrift(before: OracleSource, after: OracleSource, tolerancePx = 0.5): LayoutDrift | null {
  const keyed = (oracle: OracleSource) => {
    const out = new Map<string, { text: string; width: number; box: EvalBox }>()
    const seen = new Map<string, number>()
    for (const row of oracleBoxes(oracle)) {
      const base = `${row.width}|${row.kind}|${row.text}`
      const n = seen.get(base) ?? 0
      seen.set(base, n + 1)
      out.set(`${base}#${n}`, row)
    }
    return out
  }
  const a = keyed(before)
  const b = keyed(after)
  for (const [key, row] of a) {
    const moved = b.get(key)
    if (!moved) return { text: row.text, width: row.width, dx: Infinity, dy: Infinity, dw: Infinity, dh: Infinity }
    const d = {
      dx: moved.box.x - row.box.x,
      dy: moved.box.y - row.box.y,
      dw: moved.box.width - row.box.width,
      dh: moved.box.height - row.box.height,
    }
    if (Object.values(d).some((v) => Math.abs(v) > tolerancePx)) return { text: row.text, width: row.width, ...d }
  }
  for (const [key, row] of b) {
    if (!a.has(key)) return { text: row.text, width: row.width, dx: Infinity, dy: Infinity, dw: Infinity, dh: Infinity }
  }
  return null
}

/**
 * `1c type assign <slug>` — the repeatable retrofit that turns a site's type
 * literals into named text styles and container-level type (REQ-350), the way
 * `1c colors --assign` turns colour literals into palette references.
 *
 * EXACT MATCHES ONLY. Two runs share a style when every one of the five type
 * axes they set is identical — the same family, the same size or the same
 * per-width size track, and so on. Nothing that differs by a pixel is merged:
 * a difference the source made may be deliberate, and the round trip catches a
 * render change but not a wrong intent. A slightly large set of styles is a fine
 * outcome; a wrong one is not.
 *
 * In order:
 *  1. Every run's type is grouped by exact value. A group used by headings of
 *     one level is `heading-<level>`, the most used other group is `body`, and
 *     the rest are named by size (`text-14`), each made unique with a letter.
 *  2. A container whose runs ALL use one style sets it for what it contains, and
 *     the runs stop naming it — outermost such container first.
 *  3. A site that already has a default style keeps it exactly, and a run that
 *     leaves an axis unset goes on inheriting it. A site with none gets `body` —
 *     only when every run on the site sets every axis `body` sets, since a run
 *     that relied on the browser's own line height would otherwise start
 *     inheriting one.
 *  4. The result is resolved and every run's type compared with what it was. A
 *     single difference refuses the whole write: the retrofit is a change of
 *     description, never of what is painted.
 *
 * Re-runnable: every use of a style already present (the default aside) is
 * resolved back to literals first, so a second run recomputes from the page as
 * it paints. The styles themselves are kept — the retrofit adds beside them and
 * never deletes one somebody defined.
 *
 * REQ-420 — and the page's VERTICAL RHYTHM is read off its layout and kept: the
 * styles it creates for headings and body carry the space the reference put
 * above and below them, and a site with no declared unit gets the one it was
 * measured in. A reproduction is pinned geometry, so this changes nothing it
 * paints; it is what lets the page keep the reference's spacing when it is later
 * restyled into rhythm stacks. Read only on a site with no rhythm container at
 * all, which is what keeps the retrofit a change of description: there, a
 * style's spacing moves no pixel.
 */
import {
  L1_TYPE_AXES,
  l1Children,
  l1RhythmPlan,
  resolveL1TextStyles,
  withL1Children,
  type L1Document,
  type L1Node,
  type L1Rhythm,
  type L1ScalarTrack,
  type L1TextStyle,
  type L1TextStyles,
} from '@1stcontact/site-schema'

import { readRhythm, rhythmBlocksOfDocument } from '../l1/read-rhythm'

const TRACKED = ['fontSizePx', 'lineHeightPx', 'letterSpacingPx'] as const

/**
 * REQ-420 — the styles with their rhythm space taken off. What the retrofit
 * resolves to literals is TYPE; a style's space must stay on the style, or every
 * run naming it would come out pinned to that space as its own override.
 */
function withoutSpace(styles: L1TextStyles): L1TextStyles {
  return Object.fromEntries(
    Object.entries(styles).map(([name, { spaceAbove: _a, spaceBelow: _b, ...type }]) => [name, type]),
  )
}

/** REQ-420 — does any page space a container by rhythm? */
function anyRhythm(pages: readonly Record<string, unknown>[]): boolean {
  let found = false
  const walk = (v: unknown): void => {
    if (found || !v || typeof v !== 'object') return
    if (Array.isArray(v)) return v.forEach(walk)
    const n = v as L1Node
    if (n.kind === 'container' && l1RhythmPlan(n)) found = true
    for (const item of Object.values(v)) walk(item)
  }
  pages.forEach(walk)
  return found
}

type Run = Extract<L1Node, { kind: 'text' } | { kind: 'control' }>

/** A run's type as a style would carry it: only the axes it sets, a track where it has one. */
function typeOf(run: Run): L1TextStyle {
  const axes = (run.axes ?? {}) as Record<string, unknown>
  const responsive = (run.responsive ?? {}) as Record<string, L1ScalarTrack | undefined>
  const out: Record<string, unknown> = {}
  const tracks: Record<string, L1ScalarTrack> = {}
  for (const axis of L1_TYPE_AXES) {
    const track = (TRACKED as readonly string[]).includes(axis) ? responsive[axis] : undefined
    if (track) tracks[axis] = track
    else if (axes[axis] !== undefined) out[axis] = axes[axis]
  }
  if (Object.keys(tracks).length > 0) out.responsive = tracks
  return out as L1TextStyle
}

/** A stable key for exact equality — keys sorted at every level. */
function keyOf(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(keyOf).join(',')}]`
  if (v && typeof v === 'object') {
    return `{${Object.keys(v)
      .sort()
      .map((k) => `${k}:${keyOf((v as Record<string, unknown>)[k])}`)
      .join(',')}}`
  }
  return JSON.stringify(v)
}

const kidsOf = (n: L1Node): L1Node[] => l1Children(n)

const isRun = (n: L1Node): n is Run => n.kind === 'text' || n.kind === 'control'

function forEachRun(node: L1Node, fn: (run: Run) => void): void {
  if (isRun(node)) fn(node)
  for (const k of kidsOf(node)) forEachRun(k, fn)
}

/** The run with its five type axes (and their tracks) taken off, naming `style` instead when given. */
function strip(run: Run, style: string | undefined): Run {
  const axes = { ...((run.axes ?? {}) as Record<string, unknown>) }
  for (const axis of L1_TYPE_AXES) delete axes[axis]
  delete axes.textStyle
  if (style !== undefined) axes.textStyle = style
  const responsive = { ...((run.responsive ?? {}) as Record<string, unknown>) }
  for (const axis of TRACKED) delete responsive[axis]
  const out = { ...run } as Record<string, unknown>
  if (Object.keys(axes).length) out.axes = axes
  else delete out.axes
  if (Object.keys(responsive).length) out.responsive = responsive
  else delete out.responsive
  return out as Run
}

export interface TypeAssignment {
  textStyles: L1TextStyles
  textDefault?: string
  pages: Record<string, unknown>[]
  /** How many runs now name a style (directly or through a container), and how many containers set one. */
  report: { runs: number; containers: number; styles: number }
  /** REQ-420 — the unit the page's rhythm was measured in, when the site declared none. */
  rhythm?: L1Rhythm
}

/**
 * Compute the assignment for a whole site — `base` is `site.json`, `pages` every
 * page. Pure; throws if the result would not reproduce every run's type exactly.
 */
export function assignTextStyles(base: Record<string, unknown>, pages: Record<string, unknown>[]): TypeAssignment {
  const existing = (base.textStyles as L1TextStyles | undefined) ?? {}
  const typeOnly = withoutSpace(existing)
  const kept = typeof base.textDefault === 'string' && existing[base.textDefault] ? base.textDefault : undefined
  // Start from the page as it paints — every named style and container value
  // resolved to the run — except the default, which a kept default goes on
  // supplying exactly where it supplied it.
  const literal = pages.map((page) => {
    const p = page as { l1?: unknown; modules?: Array<{ slots?: unknown }> }
    return {
      ...page,
      ...(p.l1
        ? { l1: resolveL1TextStyles(p.l1, typeOnly, kept ? undefined : (base.textDefault as string | undefined)) }
        : {}),
      ...(Array.isArray(p.modules)
        ? {
            modules: p.modules.map((m) =>
              m.slots
                ? { ...m, slots: resolveL1TextStyles(m.slots, typeOnly, kept ? undefined : (base.textDefault as string | undefined)) }
                : m,
            ),
          }
        : {}),
    } as Record<string, unknown>
  })
  const roots = (page: Record<string, unknown>): L1Node[] => {
    const l1 = page.l1 as { root?: L1Node } | undefined
    return l1?.root ? [l1.root] : []
  }
  const slotRuns = (page: Record<string, unknown>): Run[] => {
    const out: Run[] = []
    const walk = (v: unknown): void => {
      if (Array.isArray(v)) return v.forEach(walk)
      if (!v || typeof v !== 'object') return
      const n = v as L1Node
      if (isRun(n)) out.push(n)
      for (const item of Object.values(v)) walk(item)
    }
    for (const m of ((page.modules as Array<{ slots?: unknown }>) ?? [])) walk(m.slots)
    return out
  }

  // 1. Group every page run by its exact type.
  const groups = new Map<string, { style: L1TextStyle; uses: number; headings: Map<number, number> }>()
  for (const page of literal) {
    for (const root of roots(page)) {
      forEachRun(root, (run) => {
        const style = typeOf(run)
        if (Object.keys(style).length === 0) return
        const key = keyOf(style)
        const g = groups.get(key) ?? { style, uses: 0, headings: new Map() }
        g.uses++
        const level = run.kind === 'text' ? run.heading?.level : undefined
        if (level !== undefined) g.headings.set(level, (g.headings.get(level) ?? 0) + 1)
        groups.set(key, g)
      })
    }
  }
  const ordered = [...groups.entries()].sort((a, b) => b[1].uses - a[1].uses)
  // Every style the site already has keeps its name and what it sets: the
  // retrofit adds beside them and never deletes something somebody defined.
  const taken = new Set<string>(Object.keys(existing))
  const unique = (name: string): string => {
    if (!taken.has(name)) return (taken.add(name), name)
    for (const suffix of 'bcdefghijklmnopqrstuvwxyz') {
      const n = `${name}-${suffix}`
      if (!taken.has(n)) return (taken.add(n), n)
    }
    throw new Error(`type assign: ran out of names for ${name}`)
  }
  const nameOf = new Map<string, string>()
  /** REQ-420 — the heading level each created `heading-<level>` style is for. */
  const levelOf = new Map<string, number>()
  let body: string | undefined
  for (const [key, g] of ordered) {
    const heading = [...g.headings.entries()].sort((a, b) => b[1] - a[1])[0]
    if (heading && heading[1] * 2 > g.uses) {
      const name = unique(`heading-${heading[0]}`)
      nameOf.set(key, name)
      levelOf.set(name, heading[0])
    }
    else if (body === undefined && !taken.has('body')) nameOf.set(key, (body = unique('body')))
  }
  for (const [key, g] of ordered) {
    if (nameOf.has(key)) continue
    const size = g.style.fontSizePx ?? g.style.responsive?.fontSizePx?.keyframes.at(-1)?.value
    nameOf.set(key, unique(size !== undefined ? `text-${Math.round(size)}` : 'text'))
  }
  const textStyles: L1TextStyles = {}
  for (const [key, g] of ordered) textStyles[nameOf.get(key)!] = g.style
  for (const [name, style] of Object.entries(existing)) textStyles[name] = style

  // REQ-420 — the rhythm the pages were laid out with, onto the styles just made.
  let rhythm: L1Rhythm | undefined
  if (!anyRhythm(pages)) {
    const docs = literal.flatMap((page) => {
      const l1 = page.l1 as L1Document | undefined
      return l1?.root && Array.isArray(l1.widths) ? [l1] : []
    })
    const read = readRhythm(docs.map((doc) => rhythmBlocksOfDocument(doc, Math.max(...doc.widths))))
    if (read) {
      for (const [name, level] of levelOf) {
        const space = read.headings[level]
        if (space && Object.keys(space).length) textStyles[name] = { ...textStyles[name], ...space }
      }
      // Body spacing goes on the style most body text was given — `body` when the
      // retrofit made one, else the most used of the others it made — never on a
      // style somebody already defined.
      const prose = body ?? ordered.map(([key]) => nameOf.get(key)!).find((n) => !levelOf.has(n) && !(n in existing))
      if (prose !== undefined && Object.keys(read.body).length) textStyles[prose] = { ...textStyles[prose], ...read.body }
      if (base.rhythm === undefined) rhythm = { unitPx: Math.min(200, Math.max(1, read.unitPx)) }
    }
  }

  // 3 (decided first, because it changes what a run must name). Every run on the
  // site — slots included, since a slot inherits the default too — must set
  // every axis `body` sets, or the default would add a value somewhere.
  const bodyAxes = body ? Object.keys(textStyles[body]).flatMap((k) => (k === 'responsive' ? Object.keys(textStyles[body!].responsive!) : [k])) : []
  const setsAll = (run: Run): boolean => {
    const t = typeOf(run)
    return bodyAxes.every((a) => (t as Record<string, unknown>)[a] !== undefined || (t.responsive as Record<string, unknown> | undefined)?.[a] !== undefined)
  }
  let everyRunSetsBody = !kept && body !== undefined
  for (const page of literal) {
    for (const root of roots(page)) forEachRun(root, (run) => void (everyRunSetsBody &&= setsAll(run)))
    for (const run of slotRuns(page)) everyRunSetsBody &&= setsAll(run)
  }
  const textDefault = kept ?? (everyRunSetsBody ? body : undefined)

  // 1 (applied) + 2. Rewrite each page tree: runs name their style (or nothing,
  // for the default), and a container whose runs all share one style sets it.
  let runs = 0
  let containers = 0
  const styleOfRun = (run: Run): string | undefined => {
    const t = typeOf(run)
    return Object.keys(t).length ? nameOf.get(keyOf(t)) : undefined
  }
  const rewrite = (node: L1Node, inherited: string | undefined, isRoot: boolean): L1Node => {
    if (isRun(node)) {
      const s = styleOfRun(node)
      if (s === undefined) return node
      runs++
      return strip(node, s === inherited ? undefined : s)
    }
    const kids = kidsOf(node)
    if (kids.length === 0) return node
    let own = inherited
    let typed: L1Node = node
    if (!isRoot) {
      const names = new Set<string | undefined>()
      let count = 0
      forEachRun(node, (run) => {
        names.add(styleOfRun(run))
        count++
      })
      const [only] = [...names]
      if (count >= 2 && names.size === 1 && only !== undefined && only !== inherited) {
        own = only
        containers++
        typed = { ...node, type: { style: only } } as L1Node
      }
    }
    return withL1Children(typed, kids.map((k) => rewrite(k, own, false)))
  }
  const assigned = literal.map((page) => {
    const l1 = page.l1 as { root?: L1Node } | undefined
    if (!l1?.root) return page
    return { ...page, l1: { ...l1, root: rewrite(l1.root, textDefault, true) } }
  })

  // 4. Nothing painted may change: every run, page and slot, fully resolved —
  // as the site stood, and as it will stand.
  const painted = (page: Record<string, unknown>, styles: L1TextStyles | undefined, dflt: string | undefined): string => {
    const out: string[] = []
    const l1 = resolveL1TextStyles(page.l1, styles, dflt) as { root?: L1Node } | undefined
    if (l1?.root) forEachRun(l1.root, (r) => out.push(keyOf(typeOf(r))))
    for (const r of slotRuns({ modules: resolveL1TextStyles(page.modules ?? [], styles, dflt) })) out.push(keyOf(typeOf(r)))
    return out.join('|')
  }
  for (let i = 0; i < pages.length; i++) {
    const before = painted(pages[i], base.textStyles as L1TextStyles | undefined, base.textDefault as string | undefined)
    if (before !== painted(assigned[i], textStyles, textDefault)) {
      throw new Error(`type assign: page '${String(pages[i].id)}' would not keep its type exactly; nothing was written`)
    }
  }
  return {
    textStyles,
    textDefault,
    pages: assigned,
    report: { runs, containers, styles: Object.keys(textStyles).length },
    ...(rhythm ? { rhythm } : {}),
  }
}

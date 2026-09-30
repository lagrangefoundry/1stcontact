import {
  formatL1Path,
  isL1PaletteRef,
  l1PlainText,
  resolveL1Color,
  type L1Color,
  type L1Node,
  type L1Palette,
} from '@1stcontact/site-schema'
// The Astro-free framework entry, for the same reason `edit.ts` takes it: this
// runs wherever the toolbox does, a Worker included.
import { catalog, resolveControlNames, type BehaviorMeta } from '@1stcontact/framework/worker'

/**
 * The page's style-gap audit ([[REQ-349]]).
 *
 * WHAT IT IS FOR. An element nobody styled does not look wrong to the person who
 * built the page — it looks *cheap* to the person who paid for it, who cannot
 * say why. Every finding here is one of those, and every one is DECIDABLE: it is
 * read from values already on the page, the site's palette and the component's
 * own declaration of which element a control is. Nothing is rendered and nothing
 * is judged. A rule that needed taste would not belong here.
 *
 * WHY IT IS A REPORT AND NOT A GATE. A page under construction passes through
 * every one of these states legitimately; refusing the write would teach the
 * author to work around refusals. So the findings ride on `describe_page` — the
 * map that is already read first and re-read after every change — rather than on
 * an audit someone has to remember to call, because the failure this exists for
 * is precisely "nobody thought to look at that element".
 *
 * THE SHARP RULE. Absence of styling is only a defect when the element falls
 * back to the BROWSER rather than the PAGE. A text run with no colour inherits
 * the page's text colour — legitimate, not a finding. A control has had its UA
 * chrome reset by the renderer (`font: inherit; padding: 0`), and nothing above
 * it on the page names a face, so a control with no face paints the browser's
 * default face with its text against its border. That is always an omission.
 */

export type AttentionTier = 'broken' | 'inconsistent' | 'worth_a_look'

/** What one element needs looked at: its worst tier, and each reason in a phrase. */
export interface Attention {
  tier: AttentionTier
  says: string[]
}

export interface PageAudit {
  /** Flagged elements per tier — the count that is visible even when the map is long. */
  summary: Record<AttentionTier, number>
  /** Findings keyed by {@link auditKey}; an element with none is absent. */
  at: Map<string, Attention>
}

/** The key a finding is filed under — the same triple a map entry carries. */
export function auditKey(path: string, module?: string, slot?: string): string {
  return `${module ?? ''}|${slot ?? ''}|${path}`
}

const RANK: Record<AttentionTier, number> = { broken: 3, inconsistent: 2, worth_a_look: 1 }

/**
 * The narrowest an `<input>` will go as a flex item with no `min-width`.
 *
 * A flex item's automatic minimum is its content size, and an input's content
 * size is its intrinsic width (`size=20` — about 150px in every engine at the
 * body's 16px, more in most). The renderer sets no `min-width` on a control, so
 * a fluid field in a row cannot shrink below this however little room it has.
 * The figure is the conservative end of the engines, so a row it flags cannot
 * fit in any of them.
 */
const INPUT_INTRINSIC_MIN_PX = 150

/** WCAG AA: body text, and text large enough to count as large. */
const AA_NORMAL = 4.5
const AA_LARGE = 3
/** Below this nobody can read it, whatever it is for. */
const UNREADABLE = 2

type Rgba = [number, number, number, number]

/* ── colour ─────────────────────────────────────────────────────────────── */

function parseHex(hex: string): Rgba | undefined {
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.exec(hex)
  if (!m) return undefined
  let h = m[1]
  if (h.length === 3) h = h.split('').map((c) => c + c).join('')
  const n = (i: number) => parseInt(h.slice(i, i + 2), 16)
  return [n(0), n(2), n(4), h.length === 8 ? n(6) / 255 : 1]
}

/** `top` painted over an opaque `under`. */
function over(top: Rgba, under: Rgba): Rgba {
  const a = top[3]
  return [0, 1, 2].map((i) => top[i] * a + under[i] * (1 - a)).concat(1) as Rgba
}

function luminance([r, g, b]: Rgba): number {
  const lin = (c: number) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

function contrast(a: Rgba, b: Rgba): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

/* ── responsive values ──────────────────────────────────────────────────── */

interface Track {
  keyframes: { at: number; value: number }[]
  segments?: ('interpolate' | 'snap')[]
}

/** A keyframed value at width `w` — exact at a keyframe, held beyond the ends. */
function trackAt(track: Track, w: number): number {
  const kfs = [...track.keyframes].sort((a, b) => a.at - b.at)
  if (w <= kfs[0].at) return kfs[0].value
  for (let i = 0; i < kfs.length - 1; i++) {
    const [a, b] = [kfs[i], kfs[i + 1]]
    if (w > b.at) continue
    if (w === b.at) return b.value
    if (track.segments?.[i] === 'snap') return a.value
    return a.value + ((b.value - a.value) * (w - a.at)) / (b.at - a.at)
  }
  return kfs[kfs.length - 1].value
}

/** The node's layout mode at `w`, through its responsive track when it has one. */
function layoutAt(node: L1Node, w: number): 'stack' | 'row' | 'grid' | 'box' {
  if (node.kind !== 'container') return 'box'
  const kfs = node.responsiveLayout?.keyframes
  if (!kfs?.length) return node.layout
  const sorted = [...kfs].sort((a, b) => a.at - b.at)
  return [...sorted].reverse().find((k) => k.at <= w)?.value ?? sorted[0].value
}

function hiddenAt(node: L1Node, w: number): boolean {
  const v = node.visibility
  return Boolean(v && ((v.fromPx !== undefined && w < v.fromPx) || (v.untilPx !== undefined && w >= v.untilPx)))
}

function horizontalPadding(node: L1Node, w: number): number {
  const side = (name: 'leftPx' | 'rightPx') => {
    const track = node.responsivePadding?.[name]
    return track ? trackAt(track, w) : (node.padding?.[name] ?? 0)
  }
  return side('leftPx') + side('rightPx')
}

/** Does this axis bag put paint on the page? */
function paints(axes: Record<string, unknown>): boolean {
  return Boolean(
    axes.surfaceFill !== undefined || axes.surfaceGradient || axes.pattern || axes.backgroundImageUrl || axes.overlay,
  )
}

/** Out of the parent's flow: placed by its own coordinates, so it cannot overrun it. */
function isAbsolute(node: L1Node): boolean {
  return Boolean(node.geometry && (node.geometry.place ?? 'absolute') === 'absolute')
}

/**
 * The node's border-box width at `w`, when it is a declared number.
 *
 * `undefined` means UNKNOWN — hugged, content-sized, column-anchored — and an
 * unknown width never produces a finding. Only numbers the page states are used.
 */
function widthAt(node: L1Node, w: number, avail: number | undefined, parentMode: string): number | undefined {
  const s = node.sizing?.width
  const clamp = (v: number) => Math.max(s?.minPx ?? 0, Math.min(v, s?.maxPx ?? Infinity))
  if (s?.mode === 'fixed' && s.px !== undefined) return clamp(s.px)
  if (s?.mode === 'fluid') return avail === undefined ? undefined : clamp(avail)
  if (s?.mode === 'hug') return undefined
  const g = node.geometry
  if (g && !g.anchor?.width) {
    return trackAt({ keyframes: g.keyframes.map((k) => ({ at: k.at, value: k.width })), segments: g.segments }, w)
  }
  // A block in a stacked flow fills the line it sits on.
  const block = node.kind === 'container' || node.kind === 'box' || node.kind === 'slot' || node.kind === 'text'
  if (block && (parentMode === 'stack' || parentMode === 'box') && avail !== undefined) return avail
  return undefined
}

/**
 * The least the node can occupy in a row — what a row's fit is summed from.
 *
 * A declared width is the author's claim and is counted whole; a fluid node gives
 * way down to its `minPx`, except an `<input>`, which gives way only to its
 * intrinsic width (see {@link INPUT_INTRINSIC_MIN_PX}).
 */
function minWidthAt(node: L1Node, w: number, textEntry: boolean): number {
  const s = node.sizing?.width
  if (s?.mode === 'fixed' && s.px !== undefined) return Math.max(s.minPx ?? 0, Math.min(s.px, s.maxPx ?? Infinity))
  if (s?.mode === 'fluid') return s.minPx ?? (textEntry ? INPUT_INTRINSIC_MIN_PX : 0)
  if (s?.mode === 'hug') return s.minPx ?? 0
  const g = node.geometry
  if (g && !g.anchor?.width) return widthAt(node, w, undefined, 'row') ?? 0
  return 0
}

/** The number a node claims for itself — a fixed width, a flow keyframe, a floor. */
function declaredWidthAt(node: L1Node, w: number): number | undefined {
  const s = node.sizing?.width
  if (s?.mode === 'fixed' && s.px !== undefined) return widthAt(node, w, undefined, 'row')
  if (s?.minPx !== undefined) return s.minPx
  if (!s && node.geometry && !node.geometry.anchor?.width) return widthAt(node, w, undefined, 'row')
  return undefined
}

/* ── the walk ───────────────────────────────────────────────────────────── */

/** What a node inherits from where it sits. */
interface Context {
  /** The opaque colour behind it, or `null` where a gradient/image makes it unknowable. */
  backdrop: Rgba | null
  /** Per declared width: the content width its parent offers, or undefined. */
  avail: (number | undefined)[]
  /** Per declared width: the parent's resolved layout mode. */
  parentMode: string[]
  /** The parent's gap and column count, for the grid-track check. */
  parent?: L1Node
}

/** How a control is emitted, from the component's own declaration. */
interface ControlInfo {
  textEntry: boolean
  button: boolean
}

interface Visit {
  node: L1Node
  path: string
  module?: string
  slot?: string
  ctx: Context
}

type Controls = (name: string) => ControlInfo | undefined

/**
 * Audit one stored page. Pure: reads the page record and the site palette, and
 * nothing else.
 */
export function auditPage(page: Record<string, unknown>, palette: L1Palette | undefined): PageAudit {
  const at = new Map<string, Attention>()
  const flag = (v: { path: string; module?: string; slot?: string }, tier: AttentionTier, say: string) => {
    const key = auditKey(v.path, v.module, v.slot)
    const was = at.get(key)
    if (!was) return void at.set(key, { tier, says: [say] })
    if (!was.says.includes(say)) was.says.push(say)
    if (RANK[tier] > RANK[was.tier]) was.tier = tier
  }

  const l1 = (page.l1 ?? {}) as { root?: L1Node; widths?: number[]; background?: L1Color; textColor?: L1Color }
  const widths = Array.isArray(l1.widths) ? [...l1.widths].sort((a, b) => a - b) : []
  const color = (c: unknown): Rgba | undefined => {
    if (c === undefined) return undefined
    try {
      return parseHex(resolveL1Color(c as L1Color, palette))
    } catch {
      return undefined
    }
  }
  const pageBackdrop = color(l1.background) ?? [255, 255, 255, 1]
  const pageInk = color(l1.textColor) ?? [0, 0, 0, 1]

  // Every node, with where it sits. The page's own tree first, then each
  // component's slots measured against the page slot they mount into.
  const visits: Visit[] = []
  const slotContext = new Map<string, Context>()
  const controlsOf = new Map<string, Controls>()
  /** What each identified node leaves painted behind whatever sits on it. */
  const surfaces = new Map<string, Rgba | null>()

  const walk = (roots: readonly L1Node[], ctx: Context, scope: { module?: string; slot?: string }, prefix: number[]) => {
    roots.forEach((node, index) => {
      const addr = [...prefix, index]
      const visit: Visit = { node, path: formatL1Path(addr), ...scope, ctx }
      visits.push(visit)
      const inner = innerContext(node, ctx, widths, color)
      if (node.id) surfaces.set(node.id, surfaceOf(node, ctx, color))
      if (node.kind === 'slot' && !scope.module) slotContext.set(node.name, inner)
      const children = (node as { children?: L1Node[] }).children
      if (children?.length) walk(children, inner, scope, addr)
    })
  }
  const top: Context = { backdrop: over(pageBackdrop, [255, 255, 255, 1]), avail: [...widths], parentMode: widths.map(() => 'stack') }
  if (l1.root) walk([l1.root], top, {}, [])

  const modules = Array.isArray(page.modules) ? (page.modules as Record<string, unknown>[]) : []
  for (const instance of modules) {
    const id = typeof instance.id === 'string' ? instance.id : undefined
    if (!id) continue
    controlsOf.set(id, controlResolver(instance))
    const mount = typeof instance.slot === 'string' ? slotContext.get(instance.slot) : undefined
    const ctx: Context = mount ?? { backdrop: top.backdrop, avail: widths.map(() => undefined), parentMode: widths.map(() => 'box') }
    for (const [slot, raw] of Object.entries((instance.slots ?? {}) as Record<string, unknown>)) {
      walk(Array.isArray(raw) ? (raw as L1Node[]) : [raw as L1Node], ctx, { module: id, slot }, [])
    }
  }

  const controlInfo = (v: Visit): ControlInfo | undefined =>
    v.node.kind === 'control' && v.module ? controlsOf.get(v.module)?.(v.node.control) : undefined

  // Whether the page's own words name a face — the thing a control with none
  // is being inconsistent with. A page that names none anywhere is uniformly in
  // the browser's face, and its controls match it.
  const pageNamesFace = visits.some((v) => v.node.kind === 'text' && axesOf(v.node).fontFamily !== undefined)
  checkControls(visits, controlInfo, { pageHasInk: l1.textColor !== undefined, pageNamesFace }, flag)
  checkGeometry(visits, widths, controlInfo, flag)
  checkContrast(visits, pageInk, color, surfaces, flag)
  checkPaletteDiscipline(visits, palette, flag)
  checkFonts(visits, controlInfo, flag)

  const summary: Record<AttentionTier, number> = { broken: 0, inconsistent: 0, worth_a_look: 0 }
  for (const { tier } of at.values()) summary[tier] += 1
  return { summary, at }
}

/** The context a node hands its children. */
function innerContext(
  node: L1Node,
  ctx: Context,
  widths: number[],
  color: (c: unknown) => Rgba | undefined,
): Context {
  const axes = axesOf(node)
  let backdrop = ctx.backdrop
  if (axes.surfaceGradient || axes.pattern || axes.backgroundImageUrl || axes.overlay) backdrop = null
  else if (axes.surfaceFill !== undefined) {
    const fill = color(axes.surfaceFill)
    // An opaque fill is the whole story whatever was behind it; a translucent
    // one is only as knowable as what it is laid over.
    if (!fill) backdrop = null
    else if (fill[3] >= 1) backdrop = fill
    else backdrop = backdrop ? over(fill, backdrop) : null
  }
  // LAYERED CHILDREN. A captured page paints its section bands and cards as
  // absolutely placed boxes BESIDE the words on them, not around them, so which
  // one a run sits on is a matter of geometry the tree does not say. Below a
  // node like that, the backdrop is unknown — unless a run names its panel
  // (`backedBy`), which the contrast check reads for exactly this case.
  const children = (node as { children?: L1Node[] }).children ?? []
  if (children.some((c) => isAbsolute(c) && paints(axesOf(c)))) backdrop = null
  const avail = widths.map((w, i) => {
    if (hiddenAt(node, w)) return undefined
    const own = widthAt(node, w, ctx.avail[i], ctx.parentMode[i])
    return own === undefined ? undefined : Math.max(0, own - horizontalPadding(node, w))
  })
  return { backdrop, avail, parentMode: widths.map((w) => layoutAt(node, w)), parent: node }
}

/**
 * The colour a node itself leaves behind whatever sits on it — its own fill over
 * what it sits on. Unlike {@link innerContext} this ignores its children's
 * layering, because a run naming this node as its panel is saying which of them
 * it is on.
 */
function surfaceOf(node: L1Node, ctx: Context, color: (c: unknown) => Rgba | undefined): Rgba | null {
  const bare = { ...node, children: [] } as L1Node
  return innerContext(bare, ctx, [], color).backdrop
}

/** Which element each control name of one component instance is. */
function controlResolver(instance: Record<string, unknown>): Controls {
  const type = String(instance.type ?? '')
  const meta: BehaviorMeta | undefined =
    catalog.get(`${type}@${instance.version}`) ??
    [...catalog.values()].filter((m) => m.id === type).sort((a, b) => b.version - a.version)[0]
  if (!meta) return () => undefined
  const names = resolveControlNames(meta, instance as never)
  return (name) => {
    const found = names.get(name)
    if (!found) return undefined
    const tag = found.spec.element
    // A per-item control's input type is the item's own `type` — a box to tick
    // has no text in it to style.
    const item = found.spec.perItemOf
      ? ((instance.config as Record<string, unknown> | undefined)?.[found.spec.perItemOf] as unknown[] | undefined)?.find(
          (i) => (i as { name?: unknown })?.name === name,
        )
      : undefined
    const inputType = (item as { type?: unknown } | undefined)?.type
    const tickable = inputType === 'checkbox' || inputType === 'radio'
    return { textEntry: (tag === 'input' && !tickable) || tag === 'textarea', button: tag === 'button' }
  }
}

type Flag = (v: Visit, tier: AttentionTier, say: string) => void

/* ── rule: unstyled controls, and siblings styled unlike each other ─────── */

function checkControls(
  visits: Visit[],
  info: (v: Visit) => ControlInfo | undefined,
  page: { pageHasInk: boolean; pageNamesFace: boolean },
  flag: Flag,
): void {
  const controls = visits.filter((v) => {
    const i = info(v)
    return i && (i.textEntry || i.button)
  })
  const hasSize = (v: Visit) =>
    axesOf(v.node).fontSizePx !== undefined || (v.node.kind === 'control' && Boolean(v.node.responsive?.fontSizePx))
  // A component in which SOME control names a size is one whose unsized
  // controls are an inconsistency rather than a house style.
  const sized = new Set(controls.filter(hasSize).map((v) => v.module))
  for (const v of controls) {
    const i = info(v)!
    const axes = axesOf(v.node)
    const missing: string[] = []
    let tier: AttentionTier = 'worth_a_look'
    const worse = (t: AttentionTier) => {
      if (RANK[t] > RANK[tier]) tier = t
    }
    if (axes.fontFamily === undefined && page.pageNamesFace) {
      missing.push('font')
      worse('broken')
    }
    if (!hasSize(v)) {
      missing.push('size')
      if (sized.has(v.module)) worse('inconsistent')
    }
    const pad = v.node.padding ?? {}
    const padded =
      Object.values(pad).some((n) => typeof n === 'number' && n > 0) ||
      Object.keys(v.node.responsivePadding ?? {}).length > 0
    if (!padded) {
      missing.push('padding')
      worse('broken')
    }
    const inked = axes.color !== undefined || axes.gradientFill !== undefined
    if (!inked && !page.pageHasInk) missing.push('colour')
    if (i.textEntry && axes.placeholderColor === undefined) {
      missing.push('placeholder')
      if (!inked) worse('broken')
    }
    if (missing.length) flag(v, tier, `unstyled: ${missing.join(', ')}`)
  }
}

function axesOf(node: L1Node): Record<string, unknown> {
  return ((node as { axes?: Record<string, unknown> }).axes ?? {}) as Record<string, unknown>
}

/* ── rule: layouts that cannot physically work at a declared width ─────── */

function checkGeometry(
  visits: Visit[],
  widths: number[],
  info: (v: Visit) => ControlInfo | undefined,
  flag: Flag,
): void {
  const byNode = new Map<L1Node, Visit>(visits.map((v) => [v.node, v]))
  const worst = new Map<string, { v: Visit; w: number; say: string }>()
  const note = (v: Visit, kind: string, w: number, say: string) => {
    const key = `${kind}|${auditKey(v.path, v.module, v.slot)}`
    // Report the narrowest width it fails at — the one a phone sees.
    if (!worst.has(key) || w < worst.get(key)!.w) worst.set(key, { v, w, say })
  }

  for (const v of visits) {
    const children = (v.node as { children?: L1Node[] }).children
    if (!children?.length) continue
    const inner = innerContext(v.node, v.ctx, widths, () => undefined)
    widths.forEach((w, i) => {
      const room = inner.avail[i]
      if (room === undefined) return
      const mode = layoutAt(v.node, w)
      const flowing = children.filter((c) => !hiddenAt(c, w) && !isAbsolute(c))
      const gap = v.node.kind === 'container' ? (v.node.gapPx ?? 0) : 0
      if (mode === 'row' && !(v.node.kind === 'container' && v.node.wrap)) {
        const mins = flowing.map((c) => {
          const cv = byNode.get(c)
          return minWidthAt(c, w, Boolean(cv && info(cv)?.textEntry))
        })
        const need = mins.reduce((a, b) => a + b, 0) + gap * Math.max(0, flowing.length - 1)
        if (flowing.length > 1 && need > room + 0.5) {
          note(v, 'fit', w, `children cannot fit side by side at ${w}px (need ${px(need)}, have ${px(room)})`)
        } else if (flowing.length === 1 && need > room + 0.5) {
          note(byNode.get(flowing[0])!, 'wide', w, `wider than its parent at ${w}px (${px(need)} in ${px(room)})`)
        }
        return
      }
      let track = room
      let where = 'its parent'
      if (mode === 'grid' && v.node.kind === 'container' && (v.node.columns ?? 1) > 1) {
        const cols = v.node.columns ?? 1
        track = (room - gap * (cols - 1)) / cols
        where = 'its grid column'
      }
      for (const c of flowing) {
        const own = declaredWidthAt(c, w)
        const cv = byNode.get(c)
        if (own !== undefined && cv && own > track + 0.5) {
          note(cv, 'wide', w, `wider than ${where} at ${w}px (${px(own)} in ${px(track)})`)
        }
      }
    })
  }
  for (const { v, say } of worst.values()) flag(v, 'broken', say)
}

const px = (n: number) => `${Math.round(n)}px`

/* ── rule: ink that cannot be read against what it sits on ─────────────── */

function checkContrast(
  visits: Visit[],
  pageInk: Rgba,
  color: (c: unknown) => Rgba | undefined,
  surfaces: Map<string, Rgba | null>,
  flag: Flag,
): void {
  for (const v of visits) {
    const n = v.node
    if (n.kind !== 'text' && n.kind !== 'control') continue
    if (n.kind === 'text' && !l1PlainText(n.text).trim()) continue
    const axes = axesOf(n)
    if (axes.gradientFill) continue
    // The run paints on its own surface when it has one (a chip), else on
    // whatever its ancestors left behind it.
    const panel = n.kind === 'text' && n.backedBy !== undefined ? surfaces.get(n.backedBy) : undefined
    const behind = innerContext(n, panel === undefined ? v.ctx : { ...v.ctx, backdrop: panel }, [], color).backdrop
    if (!behind) continue
    const own = axes.color === undefined ? pageInk : color(axes.color)
    if (!own) continue
    const inks = [own]
    if (n.kind === 'text' && Array.isArray(n.text)) {
      for (const run of n.text) {
        const c = run.axes?.color === undefined ? undefined : color(run.axes.color)
        if (c) inks.push(c)
      }
    }
    const size = n.responsive?.fontSizePx
      ? Math.min(...n.responsive.fontSizePx.keyframes.map((k) => k.value))
      : typeof axes.fontSizePx === 'number' ? axes.fontSizePx : 16
    const weight = typeof axes.fontWeight === 'number' ? axes.fontWeight : 400
    const needed = size >= 24 || (size >= 18.66 && weight >= 700) ? AA_LARGE : AA_NORMAL
    const ratio = Math.min(...inks.map((ink) => contrast(over(ink, behind), behind)))
    if (ratio < needed) {
      const tier: AttentionTier = ratio < UNREADABLE ? 'broken' : 'worth_a_look'
      flag(v, tier, `low contrast: ${ratio.toFixed(1)}:1 against what it sits on (needs ${needed}:1)`)
    }
  }
}

/* ── rule: literal colours where the page otherwise speaks in its palette ─ */

/** A node's OWN colour values — never its children's, its words or its sources. */
function ownColours(node: L1Node): { literals: string[]; refs: number } {
  const literals: string[] = []
  let refs = 0
  const skip = new Set(['children', 'text', 'src', 'alt', 'id', 'control', 'name', 'behavior'])
  const walk = (value: unknown) => {
    if (typeof value === 'string') {
      if (/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(value)) literals.push(value.toLowerCase())
      return
    }
    if (isL1PaletteRef(value)) return void (refs += 1)
    if (Array.isArray(value)) return value.forEach(walk)
    if (value && typeof value === 'object') for (const item of Object.values(value)) walk(item)
  }
  for (const [key, value] of Object.entries(node)) if (!skip.has(key)) walk(value)
  // A text leaf's runs carry colours of their own; their words do not count.
  if (node.kind === 'text' && Array.isArray(node.text)) for (const run of node.text) walk(run.axes)
  return { literals, refs }
}

function checkPaletteDiscipline(visits: Visit[], palette: L1Palette | undefined, flag: Flag): void {
  if (!palette || Object.keys(palette).length === 0) return
  const counted = visits.map((v) => ({ v, ...ownColours(v.node) }))
  const literals = counted.reduce((a, c) => a + c.literals.length, 0)
  const refs = counted.reduce((a, c) => a + c.refs, 0)
  // Proportional: only where the palette is the page's own habit are the
  // exceptions to it a finding. A page mostly in literals is a different story.
  if (literals === 0 || refs < literals) return
  for (const c of counted) {
    if (!c.literals.length) continue
    const shown = [...new Set(c.literals)].slice(0, 3).join(', ')
    flag(c.v, 'inconsistent', `literal colours (${shown}) where the page uses its palette`)
  }
}

/* ── rule: a face the page does not otherwise use, or none at all ──────── */

function checkFonts(visits: Visit[], info: (v: Visit) => ControlInfo | undefined, flag: Flag): void {
  const typeset = visits.filter(
    (v) => (v.node.kind === 'text' && l1PlainText(v.node.text).trim()) || (v.node.kind === 'control' && info(v)),
  )
  const counts = new Map<string, number>()
  for (const v of typeset) {
    const family = axesOf(v.node).fontFamily
    if (typeof family === 'string') counts.set(family.trim(), (counts.get(family.trim()) ?? 0) + 1)
  }
  if (counts.size === 0) return
  const [main] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]
  const established = [...counts.values()].some((n) => n >= 3)
  for (const v of typeset) {
    const family = axesOf(v.node).fontFamily
    if (typeof family !== 'string') {
      // A control's missing face is already reported, louder, as unstyled.
      if (v.node.kind === 'text') flag(v, 'inconsistent', `no font: paints the browser's face where the page uses '${main}'`)
      continue
    }
    if (established && counts.get(family.trim()) === 1 && family.trim() !== main) {
      flag(v, 'inconsistent', `the only element set in '${family.trim()}'; the page otherwise uses '${main}'`)
    }
  }
}

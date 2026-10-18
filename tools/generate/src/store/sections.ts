/**
 * [[REQ-396]] — a page stored as a FRAME plus one unit per SECTION, assembled
 * by concatenation on every read.
 *
 * WHY. A page was one stored value, and its elements were addressed by child
 * index, so a write anywhere renumbered everything after it and two writers
 * on two different sections still shared one value to overwrite. A decomposed
 * page keeps each root child — a section — as its own unit, keyed by its id
 * and never by position. A write to one section touches that unit and no
 * other, and no other section's addresses move.
 *
 * WHERE ASSEMBLY HAPPENS. In the store, on read: `readPages` hands back the
 * assembled page, so the renderer, the validator, capture, publish, revisions
 * and the preview see exactly the single L1 document they always did, and
 * every site-wide check (node and depth caps, keyframe widths) still runs on
 * the whole page. The adapters differ only in where units are kept; this
 * module is the one statement of what a unit is, shared by all three.
 *
 * THE UNITS, AND THEIR FILE NAMES. An undecomposed page is one unit, named by
 * its store name (`home.json`). A decomposed page is its FRAME (`home.json`) —
 * the page with `l1.root.children` emptied, the ordered `sections` list, and
 * each section-owned module instance replaced by a `{ id, section }` stub so
 * module order survives — plus one unit per section, `home.json#<id>`, holding
 * the section's node and the module instances whose slot it hosts. The site
 * file is `site.json`. These names are what a lock is taken on.
 */

/** One section as stored: its node, and the module instances whose slot it hosts. */
export interface SectionUnit {
  node: Record<string, unknown>
  modules?: Record<string, unknown>[]
}

/** How a page is stored: as one unit, or as a frame plus sections. */
export type PageForm = 'whole' | 'sections'

/** What an adapter currently holds for one page. */
export interface PageRecord {
  /** The stored value: the whole page, or the frame. */
  stored: Record<string, unknown>
  /** Section units by id. Empty for a whole page. */
  sections: Map<string, SectionUnit>
}

/**
 * What an adapter must do to one page. `page` is the value to store under the
 * page's name, or null when it is unchanged; `put` and `drop` are section units.
 */
export interface PagePlan {
  page: Record<string, unknown> | null
  put: Array<[string, SectionUnit]>
  drop: string[]
}

/** A section id: what its unit's file name is built from, so a safe name. */
export const SECTION_ID = /^[A-Za-z0-9][A-Za-z0-9_-]*$/

/** The file name of one section of a page: `home.json#hero`. */
export function sectionFileName(pageName: string, id: string): string {
  return `${pageName}#${id}`
}

/**
 * [[REQ-406]] — the name of a page's STYLE unit, `home.json#style`: the page's
 * L1 document keys other than `root` (background, text colour, widths, fonts,
 * column). It is a file of its own for leases on every page, decomposed or not,
 * so a section of that name would collide with it — no section may be called it.
 */
export const STYLE_UNIT = 'style'

/** The file name of a page's style: `home.json#style`. */
export function styleFileName(pageName: string): string {
  return sectionFileName(pageName, STYLE_UNIT)
}

/** True when a stored page value is a frame rather than a whole page. */
export function isFrame(stored: Record<string, unknown>): boolean {
  return Array.isArray(stored.sections)
}

type Node = Record<string, unknown> & { id?: unknown; children?: unknown }

const childrenOf = (node: Node): Node[] => (Array.isArray(node.children) ? (node.children as Node[]) : [])

function rootOf(page: Record<string, unknown>): Node | null {
  const root = (page.l1 as { root?: unknown } | undefined)?.root
  return root !== null && typeof root === 'object' ? (root as Node) : null
}

/** Every node id in the page's element tree that occurs more than once. */
export function duplicateIds(page: Record<string, unknown>): string[] {
  const seen = new Map<string, number>()
  const walk = (node: Node): void => {
    if (typeof node.id === 'string') seen.set(node.id, (seen.get(node.id) ?? 0) + 1)
    for (const child of childrenOf(node)) walk(child)
  }
  const root = rootOf(page)
  if (root) walk(root)
  return [...seen].filter(([, n]) => n > 1).map(([id]) => id)
}

/**
 * Why this page cannot be stored as sections, or null when it can.
 *
 * Sections are independent only when they cannot reach each other: the root
 * must stack them in flow, and none may be placed by geometry (an absolute box
 * or a flow offset is a position measured against its neighbours). Each needs
 * an id that can name its unit, and ids that a page treats as unique — node
 * ids, in-page anchors — must be unique across all of them.
 */
export function sectionProblem(page: Record<string, unknown>): string | null {
  const root = rootOf(page)
  if (!root) return 'it has no element tree'
  if (root.kind !== 'container' || root.layout !== 'stack') {
    return 'its root is not a stack, so its parts are not sections that sit one below another'
  }
  const track = (root.responsiveLayout as { keyframes?: Array<{ layout?: unknown }> } | undefined)?.keyframes
  if (track?.some((k) => k.layout !== 'stack')) {
    return 'its root changes from a stack to another layout at some width'
  }
  const ids = new Set<string>()
  for (const [i, child] of childrenOf(root).entries()) {
    const id = child.id
    if (typeof id !== 'string' || !SECTION_ID.test(id)) {
      return `element 0.${i} at the top of the page has no id a section can be named by (letters, digits, - and _)`
    }
    if (id === STYLE_UNIT) {
      return `section '${id}' would share its name with the page's style (\`#${STYLE_UNIT}\`); give it another id`
    }
    if (ids.has(id)) return `two sections are both called '${id}'`
    ids.add(id)
    if (child.geometry !== undefined) {
      return `section '${id}' is placed by position rather than stacked, so it depends on its neighbours`
    }
  }
  const dups = duplicateIds(page)
  if (dups.length > 0) return `these ids are used more than once on the page: ${dups.join(', ')}`
  return null
}

/** True when a slot named `name` sits anywhere in this subtree. */
function hostsSlot(node: Node, name: unknown): boolean {
  if (node.kind === 'slot' && node.name === name) return true
  return childrenOf(node).some((child) => hostsSlot(child, name))
}

/** The section that hosts a module instance's slot, or null when the frame owns it. */
export function moduleHost(page: Record<string, unknown>, instance: Record<string, unknown>): string | null {
  if (typeof instance.id !== 'string' || instance.slot === undefined) return null
  const root = rootOf(page)
  const section = root ? childrenOf(root).find((child) => hostsSlot(child, instance.slot)) : undefined
  return section ? (section.id as string) : null
}

/** Split a page into its frame and its sections. Throws when it cannot be split. */
export function splitPage(page: Record<string, unknown>): {
  frame: Record<string, unknown>
  sections: Array<[string, SectionUnit]>
} {
  const problem = sectionProblem(page)
  if (problem) throw new Error(`Page cannot be stored as sections: ${problem}.`)
  const root = rootOf(page) as Node
  const nodes = childrenOf(root)
  const owned = new Map<string, Record<string, unknown>[]>()
  const modules = Array.isArray(page.modules)
    ? (page.modules as Record<string, unknown>[]).map((instance) => {
        const host = moduleHost(page, instance)
        if (host === null) return structuredClone(instance)
        owned.set(host, [...(owned.get(host) ?? []), structuredClone(instance)])
        return { id: instance.id, section: host }
      })
    : undefined
  const l1 = page.l1 as Record<string, unknown>
  const frame: Record<string, unknown> = {
    ...structuredClone(page),
    ...(modules ? { modules } : {}),
    l1: { ...structuredClone(l1), root: { ...structuredClone(root), children: [] } },
    sections: nodes.map((n) => n.id as string),
  }
  return {
    frame,
    sections: nodes.map((node) => {
      const id = node.id as string
      const mods = owned.get(id)
      return [id, { node: structuredClone(node), ...(mods ? { modules: mods } : {}) }]
    }),
  }
}

/** The whole page a record holds, assembled in section order. */
export function assemblePage(record: PageRecord): Record<string, unknown> {
  if (!isFrame(record.stored)) return structuredClone(record.stored)
  const { sections: order, ...frame } = structuredClone(record.stored) as Record<string, unknown> & {
    sections: string[]
  }
  const unit = (id: string): SectionUnit => {
    const found = record.sections.get(id)
    if (!found) throw new Error(`Section '${id}' of a stored page is missing.`)
    return found
  }
  const owned = new Map<string, Record<string, unknown>>()
  for (const id of order) for (const m of unit(id).modules ?? []) owned.set(m.id as string, m)
  if (Array.isArray(frame.modules)) {
    frame.modules = (frame.modules as Record<string, unknown>[]).map((m) =>
      typeof m.section === 'string' ? structuredClone(owned.get(m.id as string) ?? m) : m,
    )
  }
  const root = rootOf(frame) as Node
  root.children = order.map((id) => structuredClone(unit(id).node))
  return frame
}

const same = (a: unknown, b: unknown): boolean => JSON.stringify(a) === JSON.stringify(b)

/**
 * The units to write for a whole-page write.
 *
 * `form` absent KEEPS THE PAGE'S CURRENT FORM: a decomposed page is re-split
 * by root child and only the units that changed are written, so a write that
 * altered one section rewrites one unit. A decomposed page whose new content
 * no longer splits is stored whole — the edit tools refuse such writes, so this
 * is only reached by a checkout of an older revision or an import.
 */
export function planPageWrite(
  current: PageRecord | null,
  page: Record<string, unknown>,
  form?: PageForm,
): PagePlan {
  const held = current?.sections ?? new Map<string, SectionUnit>()
  const wanted: PageForm =
    form ?? (current && isFrame(current.stored) && sectionProblem(page) === null ? 'sections' : 'whole')
  if (wanted === 'whole') {
    return { page: same(current?.stored, page) ? null : structuredClone(page), put: [], drop: [...held.keys()] }
  }
  const { frame, sections } = splitPage(page)
  const keep = new Set(sections.map(([id]) => id))
  return {
    page: same(current?.stored, frame) ? null : frame,
    put: sections.filter(([id, unit]) => !same(held.get(id), unit)),
    drop: [...held.keys()].filter((id) => !keep.has(id)),
  }
}

/** The units to write for one section, and nothing else. Throws when the page has no such section. */
export function planSectionWrite(pageName: string, current: PageRecord | null, id: string, unit: SectionUnit): PagePlan {
  const order = current && isFrame(current.stored) ? (current.stored.sections as string[]) : null
  if (!order) throw new Error(`Page '${pageName}' is not stored as sections.`)
  if (!order.includes(id)) throw new Error(`Page '${pageName}' has no section '${id}'.`)
  return { page: null, put: [[id, structuredClone(unit)]], drop: [] }
}

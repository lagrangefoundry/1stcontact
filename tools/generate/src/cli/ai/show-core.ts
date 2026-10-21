/**
 * [[REQ-413]] — the consultant brings the right view to the client.
 *
 * WHY IT EXISTS. The builder has a lot on screen — the preview in View, Edit or
 * Story, the looks band, comparison sites in the pane, the progress bar and the
 * questions panel — and a novice does not know where to look. The consultant
 * knows which of them matters right now, so it brings that surface forward, and
 * says where to look and what to do there.
 *
 * ONE OPERATION, TWO WAYS. `show_client` names a target and either `switch`es
 * the client's view itself, as its message arrives, or answers a `link` the
 * consultant pastes into its reply for the client to follow when they like —
 * the same pattern as a picture in the chat ([[REQ-217]]): the tool authors the
 * line, the model places it.
 *
 * THE LINK IS A FRAGMENT, `#show=<kind>&…`, the way `#looks=<set>` already was
 * ([[REQ-391]]). It never leaves the builder, it means nothing anywhere else, and
 * because it lives in the turn's markdown it survives a reload. The builder's
 * chat pane parses it (`app.js`); this file is the only place one is written.
 *
 * A SWITCH IS RECORDED AND DELIVERED SEPARATELY. The host records the switch as a
 * line in the reply — a link to the same target, so a reload shows what was shown
 * and lets the client go back to it — and delivers a {@link SHOW_CLIENT} event
 * that changes the view once, live. A reload replays the line and never the
 * event, so a reload never switches again (`cadence-core.ts` does both).
 *
 * NEVER UNDER SOMEONE WHO IS WORKING. The client's builder reports, with each
 * message, whether they are editing, in the image editor, or part-way through an
 * answer on the panel; a switch then becomes a link, and the result says so. A
 * second switch before the client has done anything is a link too. The browser
 * checks again when the event arrives, because a turn can outlast what it was
 * told at the start.
 *
 * Self-contained, like `story-core.ts`: the plan's records arrive as arguments,
 * so this file and `plan-core.ts` never import each other.
 */
import { ledgerError } from './ledger-core'

type Params = Record<string, unknown>

/** The operation's tool name, as the model calls it and the cadence wrapper reads it. */
export const SHOW_TOOL = 'show_client'

/**
 * [[REQ-424]] — every tool whose result can switch the client's view: this one, and
 * `start_focus`, which puts its task's surface in front of the client through this
 * file's own path. The cadence wrapper delivers a switch from any of them.
 */
export const SWITCHING_TOOLS: ReadonlySet<string> = new Set([SHOW_TOOL, 'start_focus'])

/**
 * The host's event kind for "change the client's view now". `meta.href` is the
 * target's link, `meta.label` what it is called. Delivered live and never
 * recorded, so a reload never repeats it.
 */
export const SHOW_CLIENT = 'show_client'

/** What the consultant can bring forward. */
export const SHOW_TARGETS = ['draft', 'story', 'looks', 'comp', 'comps', 'ask', 'web_address'] as const
export type ShowTarget = (typeof SHOW_TARGETS)[number]

/** The two ways. */
export const SHOW_HOW = ['switch', 'link'] as const

/** What the client can be in the middle of, as their builder reports it. */
export const CLIENT_BUSY = ['editing', 'image', 'answering'] as const
export type ClientBusy = (typeof CLIENT_BUSY)[number]

/** Why a switch became a link, in words the consultant can pass on. */
const BUSY_REASON: Record<ClientBusy, string> = {
  editing: 'your client is editing the page and has changes open',
  image: 'your client has the image editor open',
  answering: 'your client is part-way through answering a question on the panel',
}
const SWITCHED_ALREADY = 'you already changed their view since they last did anything'

/** A page of the draft as the host lists it: enough to name it and find its looks. */
export interface ShowPage {
  id: string
  title?: string
  alternative?: { set: string; of: string; label?: string; archived?: boolean }
}

/**
 * The host's side. Each part is optional; a host without one refuses the targets
 * that need it, and a host with no `present` at all cannot switch anything.
 */
export interface ShowDeps {
  /** The draft's pages, looks included. */
  pages?: () => Promise<ShowPage[]>
  /**
   * Ask to switch the client's view. Answers whether it may, or why not — the
   * client is working, or was switched already. A host that cannot see a client
   * leaves this out and every switch is a link.
   */
  present?: () => { ok: true; room?: boolean } | { ok: false; reason: string }
}

/** What `show_client` reads of the plan: the asks on the panel and the comp board. */
export interface ShowPlan {
  asks: { id: string; prompt: string; status: string }[]
  comps: { reference: string; title: string }[]
}

const str = (v: unknown): string | undefined => (typeof v === 'string' && v.trim() !== '' ? v.trim() : undefined)
const refuse = (code: string, message: string): Error => ledgerError(code, message)

/** A target resolved: its link and what the client calls it. */
export interface Shown {
  href: string
  label: string
}

/** The link's fragment for a target and its parts, in a fixed order. */
export function showHref(target: ShowTarget, parts: Record<string, string> = {}): string {
  const query = new URLSearchParams({ show: target })
  for (const [k, v] of Object.entries(parts)) query.set(k, v)
  return `#${query.toString()}`
}

/** One markdown link line. Brackets in a label are dropped so the line stays one link. */
export function showLine(label: string, href: string): string {
  return `[${label.replace(/[[\]]/g, '')}](${href})`
}

/** The line the host records in the reply for a switch. */
export function shownLine(shown: Shown): string {
  return showLine(`Showing you ${shown.label}`, shown.href)
}

/**
 * Resolve a target against what the site and the plan hold, or refuse under the
 * code that says which part was not there.
 */
async function resolve(p: Params, plan: ShowPlan, deps: ShowDeps): Promise<Shown> {
  const target = String(p.target) as ShowTarget
  const pages = async (): Promise<ShowPage[]> => {
    if (!deps.pages) throw refuse('NO_VIEW', 'this host cannot show the client a page')
    return deps.pages()
  }
  if (target === 'story') return { href: showHref('story'), label: 'the story board' }
  // [[BUG-230]] — WHERE THE CLIENT CHOOSES A WEB ADDRESS: Settings, at that
  // section. A site cannot be published without one, and the client cannot be
  // expected to find it on their own.
  if (target === 'web_address') return { href: showHref('web_address'), label: 'where you choose your web address' }
  if (target === 'draft') {
    const id = str(p.page)
    if (!id) return { href: showHref('draft'), label: 'your draft' }
    const page = (await pages()).find((x) => x.id === id && !x.alternative)
    if (!page) throw refuse('UNKNOWN_PAGE', `the draft has no page ${JSON.stringify(id)}; list_pages shows the pages it holds`)
    return { href: showHref('draft', { page: id }), label: page.title ? `the ${page.title} page` : `your ${id} page` }
  }
  if (target === 'looks') {
    const all = await pages()
    const live = all.filter((x) => x.alternative && !x.alternative.archived)
    const lookId = str(p.look)
    const pageId = str(p.page)
    const look = lookId
      ? live.find((x) => x.id === lookId)
      : live.find((x) => x.alternative!.of === pageId)
    if (!look) {
      throw refuse(
        'UNKNOWN_LOOK',
        lookId
          ? `${JSON.stringify(lookId)} is not a look on offer; list_pages shows each look with its set`
          : `no looks are on offer for the page ${JSON.stringify(pageId ?? '')}; name a look, or a page that has looks`,
      )
    }
    const alt = look.alternative!
    return {
      href: showHref('looks', { set: alt.set, look: look.id }),
      label: alt.label ? `the ${alt.label} look` : 'the looks',
    }
  }
  // [[BUG-245]] — the comparison board as a whole: where the comps are announced to be.
  if (target === 'comps') return { href: showHref('comps'), label: 'the comparison board' }
  if (target === 'comp') {
    const ref = str(p.comp)
    const comp = plan.comps.find((c) => c.reference === ref)
    if (!comp) throw refuse('UNKNOWN_COMP', `${JSON.stringify(ref ?? '')} is not on the comp board; read_plan shows the sites on it`)
    return { href: showHref('comp', { comp: comp.reference }), label: comp.title || 'that site' }
  }
  if (target === 'ask') {
    const id = str(p.ask)
    const ask = plan.asks.find((a) => a.id === id)
    if (!ask) throw refuse('UNKNOWN_ASK', `the panel has no question ${JSON.stringify(id ?? '')}`)
    if (ask.status === 'withdrawn') throw refuse('ASK_WITHDRAWN', `the question ${ask.id} was withdrawn, so it is not on the panel`)
    return { href: showHref('ask', { ask: ask.id }), label: `the question "${ask.prompt}"` }
  }
  throw refuse('PLAN_INVALID', `nothing to show called ${JSON.stringify(target)}`)
}

/**
 * The operation, bound to the plan and the host. `plan` reads the asks and comps
 * at call time, so a question raised earlier in the same turn can be shown.
 */
export function showOperations(
  plan: () => Promise<ShowPlan>,
  deps: ShowDeps | undefined,
): Record<string, (p: Params) => Promise<Record<string, unknown>>> {
  return {
    show_client: async (p) => {
      const host = deps ?? {}
      const shown = await resolve(p, await plan(), host)
      const line = showLine(str(p.label) ?? `Open ${shown.label}`, shown.href)
      if (p.how !== 'switch') return { how: 'link', link: line }
      const allowed = host.present ? host.present() : { ok: false as const, reason: 'this builder cannot change the client’s view' }
      if (!allowed.ok) {
        return {
          how: 'link',
          link: line,
          not_switched: `Not switched: ${allowed.reason}. Paste the link into your reply instead, so they can open it when they are ready.`,
        }
      }
      // IN A GROUP CHAT the room's record is what the members post, not their own
      // replies, so the consultant carries the line there itself; one to one, the
      // host records it in the reply.
      return {
        how: 'switch',
        shown: shown.label,
        href: shown.href,
        ...(allowed.room ? { say_in_room: shownLine(shown) } : {}),
      }
    },
  }
}

/** Why a switch is refused for what the client is doing, or `null` when it is not. */
export function busyReason(busy: unknown): string | null {
  return typeof busy === 'string' && (CLIENT_BUSY as readonly string[]).includes(busy) ? BUSY_REASON[busy as ClientBusy] : null
}

/** The reason a second switch is refused. */
export const ALREADY_SWITCHED = SWITCHED_ALREADY

/**
 * What a `show_client` call's output says was switched, or `null` — read by the
 * cadence wrapper, which records and delivers it. `parse` is the Toolbox-output
 * reader the caller already has (it knows the provenance fence).
 */
export function switchedBy(
  output: unknown,
  parse: (output: unknown) => { result: Record<string, unknown> } | null,
): Shown | null {
  const result = parse(output)?.result
  if (result?.how !== 'switch' || typeof result.href !== 'string' || typeof result.shown !== 'string') return null
  return { href: result.href, label: result.shown }
}

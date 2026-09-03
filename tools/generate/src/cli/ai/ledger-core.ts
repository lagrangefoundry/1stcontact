/**
 * REQ-171 — the ledger surface: what the engagement decided, written down.
 *
 * A THIRD SURFACE, for the reason `fidelity-core.ts` gives for being a second.
 * `l1-surface.json` is the documented way to change a *site* ([[DOC-30]]);
 * nothing here touches one. The ledger is the engagement's record, it lives in
 * the session's own `chat` ticket, and bolting it onto the L1 surface would make
 * that document's claim about itself false.
 *
 * COMPOSED ONLY WHERE THERE IS SOMETHING TO WRITE TO. The Worker homes a session
 * in a `chat` ticket and has a ticket store; the `1c` CLI has neither, and its
 * archive is a file. So the grant travels with the surface and `createL1Toolbox`
 * narrows it away where the surface was never composed — exactly what REQ-157
 * built that narrowing for. A deployment without a ticket store gets a
 * consultant that cannot record decisions, rather than one that fails to start.
 *
 * WHY A PURPOSE-BUILT SURFACE AND NOT THE TICKETING ONE. `@lagrangefoundry/ai-ticketing`
 * already declares `TicketAppendBody` and `TicketUpdate`, and granting them would
 * be the shorter path. It would also hand a client-facing assistant the ability
 * to write *any* ticket in the project, to be clawed back by a scope predicate
 * that has to stay correct forever. These two operations can only reach this
 * session's own record, and that is a property of what they are rather than of
 * how they were configured.
 *
 * THE ENTRY FORMAT LIVES HERE, NOT IN THE HOST. Rendering is the surface's job so
 * that every deployment's ledger reads the same way and one reader can be written
 * for all of them. The host is a port: append text, rename, report state.
 */
import ledgerSurface from './ledger-surface.json'

/** The declaration, imported as data for the reason `toolbox-core.ts` gives. */
export const LEDGER_DECLARATION = ledgerSurface as unknown as Record<string, unknown>

/** The surface name, so nothing addresses it as a literal. */
export const LEDGER_SURFACE = 'ledger'

/** What a session may do with its own record. Travels with the surface. */
export function ledgerInstanceConfig(): Record<string, unknown> {
  return { [LEDGER_SURFACE]: { groups: ['KeepLedger'] } }
}

/** The ledger after a write — what both operations report back. */
export interface LedgerState {
  /** How many decisions the record now holds. */
  entries: number
  /** What the engagement is currently called. */
  title: string
}

/**
 * The host's side of the ledger.
 *
 * Deliberately three verbs and no ticket vocabulary: a host that keeps its
 * record somewhere other than a `chat` ticket implements the same port, and the
 * surface never learns the difference.
 *
 * An implementation raises `NO_LEDGER` when this session has no record to write
 * to, and `CONFLICT` when the record moved underneath a write.
 */
export interface LedgerDeps {
  /**
   * Append one entry; report the record's state afterwards.
   *
   * TAKES A RENDERER, NOT A STRING. An entry is numbered, and the only thing
   * that knows what number it gets is whatever is about to read the existing
   * record — which is the host. Passing rendered text would mean numbering it
   * before the count is known, or renumbering it after; passing the renderer
   * lets the host call it with the index the entry will actually have, inside
   * the same read the append is already doing.
   */
  append(render: (index: number) => string): Promise<LedgerState>
  /** Rename the engagement; report the record's state afterwards. */
  rename(name: string): Promise<LedgerState>
}

type Params = Record<string, unknown>
type Untyped = any // eslint-disable-line @typescript-eslint/no-explicit-any

/**
 * One decision, rendered.
 *
 * Markdown with a stable heading, because the body is indexed as prose and
 * chunked by the knowledge component: a heading per decision is what makes a
 * chunk correspond to a decision rather than to a byte offset.
 *
 * The heading is NOT the decision text. A decision is one or two sentences and a
 * heading is a label; putting the sentences in the heading gives every chunk a
 * different shape and gives a reader scanning the record nothing to scan.
 */
export function renderEntry(
  index: number,
  p: { decision: string; because: string; rejected?: string; open?: boolean },
): string {
  const lines = [`### Decision ${index}`, '', p.decision.trim(), '', `**Why:** ${p.because.trim()}`]
  if (p.rejected && p.rejected.trim() !== '') {
    lines.push('', `**Considered and rejected:** ${p.rejected.trim()}`)
  }
  // Only when open. A line reading "Status: settled" under every entry is a line
  // that gets skimmed under the one entry where it says otherwise.
  if (p.open === true) lines.push('', '*Open — expected to be revisited.*')
  return lines.join('\n')
}

/** The operations, bound to one host's ledger. */
export function ledgerOperations(deps: LedgerDeps): Record<string, (p: Params) => Promise<Untyped>> {
  return {
    record_decision: (p: Params) =>
      deps.append((index) =>
        renderEntry(index, {
          decision: p.decision as string,
          because: p.because as string,
          rejected: p.rejected as string | undefined,
          open: p.open as boolean | undefined,
        }),
      ),
    name_engagement: async (p: Params) => deps.rename(p.name as string),
  }
}

const bound = new WeakMap<object, Promise<Untyped>>()

function ledgerToolboxClass(lib: Untyped): Promise<Untyped> {
  return Promise.resolve(lib).then((mod: Untyped) => {
    const existing = bound.get(mod as object)
    if (existing) return existing
    const built = Promise.resolve(
      class LedgerToolbox extends mod.ToolboxSurface {
        constructor(deps: LedgerDeps) {
          super(LEDGER_DECLARATION)
          for (const [op, run] of Object.entries(ledgerOperations(deps))) {
            ;(this as unknown as Params)[op] = run
          }
        }
      },
    )
    bound.set(mod as object, built)
    return built
  })
}

/** The surface, bound to this deployment's ledger. */
export async function ledgerSurfaceFor(lib: Untyped, deps: LedgerDeps): Promise<Untyped> {
  const LedgerToolbox = await ledgerToolboxClass(lib)
  return new LedgerToolbox(deps)
}

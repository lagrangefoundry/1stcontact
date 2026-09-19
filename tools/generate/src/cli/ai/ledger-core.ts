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
 * WHY A PURPOSE-BUILT SURFACE AND NOT THE TICKETING ONE. The shared `ai-ticketing`
 * component already declares `TicketAppendBody` and `TicketUpdate`, and granting
 * them would be the shorter path. It would also hand a client-facing assistant the ability
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

/** The record after a write — what every operation reports back. */
export interface LedgerState {
  /** How many decisions the record now holds. */
  entries: number
  /** What the engagement is currently called. */
  title: string
  /**
   * The standing note as it now stands ([[REQ-283]]).
   *
   * REPORTED BY EVERY WRITE, not only by the one that sets it, because all three
   * write to ONE object and a caller that just recorded a decision is entitled to
   * see the record it landed in. It is also what makes `set_standing_note`
   * verifiable without a read operation beside it.
   */
  note: string
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
  /**
   * Replace the standing note; report the record's state afterwards
   * ([[REQ-283]]).
   *
   * THE OTHER ZONE OF THE SAME RECORD, and the reason it is a third verb here
   * rather than a second surface. The framework keeps a session's memory in two
   * zones because their polarity differs — one bounded and rewritten in place,
   * one unbounded and appended to — and splits them across a field and a body so
   * that the two writes cannot clobber each other. This host has the log in the
   * chat ticket's body already, where the knowledge base indexes it, so the note
   * goes in that ticket's frontmatter: same invariant, one object, and the read
   * that {@link LedgerDeps.read} already does serves both.
   *
   * THE TEXT ARRIVES CHECKED. {@link checkStandingNote} has already refused an
   * oversized note, so an implementation stores what it is given.
   */
  setNote(note: string): Promise<LedgerState>
  /**
   * The record as it stands ([[REQ-283]]).
   *
   * THE LEDGER WAS WRITE-ONLY, and that was the defect. `record_decision` wrote
   * what was settled into a body nothing ever read back, so the consultant
   * recorded a decision and could not see it on its next turn — which leaves it
   * re-deriving state it had already agreed, from the site, expensively.
   *
   * A READ ON THE PORT AND NOT A DECLARED OPERATION, deliberately. What the
   * session needs is the record DELIVERED, in the seed, every turn: a tool is a
   * capability a model may skip, and the turns it would skip it on are the long
   * ones — which are exactly the turns where having lost the thread matters
   * most. That is the same argument REQ-131 makes for pushing the change signal
   * rather than leaving the model to ask for it. So this feeds a provider, and
   * the surface gains no operation.
   *
   * ANSWERS THE BODY, NOT THE ENTRIES. The host knows where the record lives;
   * the entry format is this module's ({@link renderEntry}), so splitting it is
   * {@link ledgerEntries}' job and not a second parser in every host.
   */
  read(): Promise<LedgerRecord>
}

/** The engagement's record as stored — both zones, in one read. */
export interface LedgerRecord {
  /** The whole record, as {@link renderEntry} wrote it. Empty when nothing has. */
  body: string
  /** What the engagement is currently called. */
  title: string
  /**
   * The standing note, or `''` when nothing has written one ([[REQ-283]]).
   *
   * STORED AS `frame` AND SPOKEN OF AS A NOTE, deliberately. The stored name is
   * the framework's word for the zone, which is what a reader comparing this
   * against `summary.js` needs; every word the MODEL reads calls it a standing
   * note, because "frame" is framework vocabulary and the one rule this product's
   * prose keeps is that a consultant never says one to a client.
   */
  note: string
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

/**
 * The entries in a ledger body, in order ([[REQ-283]]).
 *
 * SPLIT ON THE HEADING {@link renderEntry} WRITES, anchored to the start of a
 * line, so a decision whose prose happens to contain the phrase cannot split
 * itself in two. Anything before the first heading is dropped: the ledger is
 * entries and nothing else, and the only way text gets in front of one is a hand
 * edit.
 *
 * Each entry comes back WHOLE, heading included, because the consumer is a seed
 * that delivers a tail of them — and a byte tail of an append-only record cuts an
 * entry in half, losing the reasoning and keeping the sentence, which is the
 * wrong half.
 */
export function ledgerEntries(body: string): string[] {
  if (!body) return []
  return body
    .split(/^(?=### Decision \d+\s*$)/m)
    .map((chunk) => chunk.trim())
    .filter((chunk) => /^### Decision \d+/.test(chunk))
}

/** The declared code an oversized standing note is refused under ([[REQ-283]]). */
export const NOTE_TOO_LONG = 'NOTE_TOO_LONG'

/**
 * The standing note as it will be stored, or a refusal ([[REQ-283]]).
 *
 * THE CAP RULE IS UPSTREAM'S, REUSED RATHER THAN RESTATED. This host does not use
 * `SummaryStore` — its two zones live on the chat ticket instead — but `checkFrame`
 * is the one part of that module that is PURE: text in, text out or a throw, no
 * store anywhere. So the bound, the byte accounting and the sentence naming both
 * sizes come from the framework, and only the code is translated.
 *
 * AN ERROR, NEVER A TRUNCATION, which is the rule that had to survive not adopting
 * the store. Upstream states the reason and it is the whole point of the zone: a
 * silently shortened note *"loses the rejections first, which are the whole reason
 * the zone exists"* — and a consultant whose record of what the client already
 * turned down was quietly trimmed will re-propose it, in front of that client.
 *
 * BYTES AND NOT CHARACTERS, also upstream's: a JS `String.length` is UTF-16 code
 * units, so a character cap would put this host and the framework's conformance
 * corpus at different bounds for the same text.
 *
 * The thrown error carries {@link NOTE_TOO_LONG}, which the declaration declares
 * with `host_detail` left at its default — so the model reads the declared meaning
 * AND the two byte counts it needs in order to shorten by a known amount rather
 * than by guesswork.
 */
export function checkStandingNote(text: string, lib: Untyped): string {
  try {
    return lib.checkFrame(text, lib.DEFAULT_FRAME_MAX_BYTES) as string
  } catch (error) {
    const coded = error as { code?: string; message?: string }
    if (coded?.code !== 'frame_too_large') throw error
    const refusal = new Error(coded.message ?? 'the standing note is over its size cap')
    ;(refusal as Error & { code: string }).code = NOTE_TOO_LONG
    throw refusal
  }
}

/**
 * The operations, bound to one host's ledger.
 *
 * `lib` IS HERE FOR THE CAP AND FOR NOTHING ELSE. The surface is bound with the
 * host's AI library already ({@link ledgerSurfaceFor}), and threading it one level
 * further is what lets {@link checkStandingNote} reuse upstream's rule instead of
 * this file growing a second copy of a byte count and a sentence.
 */
export function ledgerOperations(
  deps: LedgerDeps,
  lib: Untyped,
): Record<string, (p: Params) => Promise<Untyped>> {
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
    // CHECKED BEFORE THE STORE IS TOUCHED, so an oversized note leaves the record
    // byte-identical — which is what "nothing was stored" in the declared refusal
    // has to mean to be worth saying.
    set_standing_note: async (p: Params) =>
      deps.setNote(checkStandingNote(p.note as string, lib)),
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
          for (const [op, run] of Object.entries(ledgerOperations(deps, mod))) {
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

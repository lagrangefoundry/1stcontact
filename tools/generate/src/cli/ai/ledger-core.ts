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
  return { [LEDGER_SURFACE]: { groups: ['KeepLedger', 'ReadWorkLog'] } }
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
  /**
   * This session's own tool records, as the artifact the archive keeps
   * ([[REQ-296]]).
   *
   * THE ONE MEMBER OF THIS PORT THE LEDGER DOES NOT OWN, and naming that plainly
   * is cheaper than a fourth surface. The work log is written by the archive on
   * every drain — one `##` section per call, each marked with the turn it belongs
   * to — and nothing here writes or changes it. What it shares with the ledger is
   * everything else: it is the session's own record, it lives on the same `chat`
   * ticket, and it exists exactly where a ticket store does. A surface of its own
   * would be a declaration, a toolbox and a grant for one read.
   *
   * SUPPLIED FROM THE ARCHIVE AND NOT FROM A SECOND QUERY. `TranscriptArchive`
   * already answers this — `''` for a session that has recorded no call — so the
   * host binds the reader it is already using to decide whether to tell the
   * session the log exists at all. Absent, {@link ledgerOperations} refuses with
   * the declared `NO_WORK_LOG` rather than inventing an empty log.
   */
  workLog?: (() => Promise<string>) | null
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

/** The declared codes {@link ledgerOperations}'s work-log read refuses under. */
export const NO_WORK_LOG = 'NO_WORK_LOG'
export const UNKNOWN_TURN = 'UNKNOWN_TURN'

/**
 * An error carrying a code this surface declares.
 *
 * ONE HELPER FOR BOTH SIDES OF THE SEAM. `apps/control-app/src/ledger.ts` raises
 * `NO_LEDGER` and `CONFLICT` and had its own copy of these four lines; the
 * operations below raise two more. The declaration is here, so the way a declared
 * refusal is constructed belongs here too.
 */
export function ledgerError(code: string, message: string): Error {
  const error = new Error(message) as Error & { code: string }
  error.code = code
  return error
}

/** One recorded call, as the work-log artifact holds it ([[REQ-296]]). */
export interface WorkLogCall {
  /** The turn this call belongs to, or `''` for a record that names none. */
  turn: string
  /** The `##` heading — the tool and what it was called on. */
  heading: string
  /** The whole section, heading and marker included. */
  text: string
}

/**
 * How much of a work-log answer one turn may carry back.
 *
 * SMALLER THAN THE ARTIFACT AND DELIBERATELY SO. A single call is stored with each
 * side capped at upstream's `DEFAULT_TOOL_MAX_BYTES` (5,800), so one turn of
 * twenty calls is a quarter of a megabyte — and the session most likely to ask for
 * it is the one that is running out of room, which is the whole reason it is being
 * pointed at the log. Twelve thousand bytes is on the order of three thousand
 * tokens: enough to recover what a handful of calls did, cheap enough to be worth
 * it rather than starting the work again.
 *
 * BYTES AND NOT CHARACTERS, for {@link checkStandingNote}'s reason, and the same
 * unit upstream caps the artifact in.
 */
export const WORK_LOG_MAX_BYTES = 12_000

/** How many lines the index answers with, most recent last. */
export const WORK_LOG_INDEX_LINES = 60

/**
 * The calls a work-log artifact holds, oldest first.
 *
 * A SECTION IS A `##` LINE FOLLOWED BY THE MARKER, and requiring the pair is what
 * makes this safe to run over content it did not write. A recorded RESULT is
 * fenced but is otherwise arbitrary — a tool that returned markdown can perfectly
 * well contain a line beginning `## ` — and splitting on the heading alone would
 * cut a call in half at its own output. Upstream's renderer emits the two lines
 * together and nothing else in the artifact does.
 *
 * Unparseable input yields no calls, which the operation reports as an empty log
 * rather than as a failure: this is a recovery aid, and a session that cannot read
 * its log should be told there is nothing there rather than handed an error it
 * cannot act on.
 */
export function workLogCalls(document: string): WorkLogCall[] {
  const lines = (document ?? '').split('\n')
  const starts: number[] = []
  for (let i = 0; i < lines.length; i += 1) {
    if (lines[i].startsWith('## ') && (lines[i + 1] ?? '').startsWith('<!-- xgd-tool ')) {
      starts.push(i)
    }
  }
  return starts.map((start, index) => {
    const end = index + 1 < starts.length ? starts[index + 1] : lines.length
    const text = lines.slice(start, end).join('\n').replace(/\s+$/, '')
    const turn = /\bturn="([^"]*)"/.exec(lines[start + 1] ?? '')
    return { turn: turn ? turn[1] : '', heading: lines[start].slice(3).trim(), text }
  })
}

/**
 * The index: one line per call, naming its turn and what it was called on.
 *
 * THE CHEAP INSTRUMENT FIRST ([[REQ-284]]). What a session needs in order to ask
 * for anything is which turns have records and roughly what is in them, and that
 * is a line each rather than a quarter of a megabyte. The full sections are one
 * further call, against a turn it has chosen.
 *
 * THE MOST RECENT ARE KEPT WHEN IT WILL NOT FIT, and the cut is stated rather than
 * silent: an index that looked complete and was not would send the session looking
 * for a turn the log does not appear to hold. Recent rather than oldest because
 * what a turn is trying to recover is almost always what it was just doing.
 */
export function workLogIndex(calls: readonly WorkLogCall[], max = WORK_LOG_INDEX_LINES): string {
  const shown = calls.length > max ? calls.slice(calls.length - max) : calls
  const lines = shown.map((call) => `- turn ${call.turn || '(unrecorded)'} — ${call.heading}`)
  if (shown.length < calls.length) {
    lines.unshift(
      `(${calls.length - shown.length} earlier calls are not listed here; the ${shown.length} most recent follow.)`,
    )
  }
  return lines.join('\n')
}

/**
 * One turn's calls in full, shortened at the end if they do not fit.
 *
 * THE MARKER IS UPSTREAM'S. The artifact already shortens each side of a call and
 * says how much it kept of how much there was; an answer shortened here says it
 * the same way, so a session reads one convention rather than two.
 */
export function workLogSections(
  lib: Untyped,
  calls: readonly WorkLogCall[],
  maxBytes = WORK_LOG_MAX_BYTES,
): string {
  const text = calls.map((call) => call.text).join('\n\n')
  const bytes = new TextEncoder().encode(text)
  if (bytes.length <= maxBytes) return text
  const kept = new TextDecoder().decode(bytes.slice(0, maxBytes)).replace(/\uFFFD$/, '')
  return `${kept}\n\n${lib.elisionMarker(kept.length, bytes.length) as string}`
}

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
    // [[REQ-296]] — THE ONE READ ON THIS SURFACE, and the only operation here
    // that does not write. It answers from the archive's own artifact (see
    // {@link LedgerDeps.workLog}), so there is nothing to keep in step: a call
    // recorded by the drain is readable on the next turn without this surface
    // being told about it.
    //
    // TWO DEPTHS, NOT ONE. An index of every call is what a session can afford
    // to ask for blind; one turn in full is what it asks for once it knows which
    // turn it wants. Answering the whole artifact to every call would put a
    // quarter of a megabyte in front of the session least able to hold it.
    read_work_log: async (p: Params) => {
      if (!deps.workLog) {
        throw ledgerError(NO_WORK_LOG, 'this session keeps no work log')
      }
      const calls = workLogCalls(await deps.workLog())
      if (calls.length === 0) {
        throw ledgerError(NO_WORK_LOG, 'nothing in this session has called a tool yet')
      }
      const turn = typeof p.turn === 'string' ? p.turn.trim() : ''
      if (turn === '') {
        return {
          calls: calls.length,
          turns: [...new Set(calls.map((call) => call.turn).filter(Boolean))],
          log: workLogIndex(calls),
        }
      }
      const mine = calls.filter((call) => call.turn === turn)
      if (mine.length === 0) {
        throw ledgerError(UNKNOWN_TURN, `no recorded call belongs to turn ${JSON.stringify(turn)}`)
      }
      return { calls: mine.length, turns: [turn], log: workLogSections(lib, mine) }
    },
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

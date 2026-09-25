/**
 * BUG-140 — the round is told to append, and the ticket refuses the append.
 *
 * THE DEFECT IS A PERMANENCE MISMATCH. `gap-tickets.json` is a permanent
 * registry: every class ever recorded is rendered into every later prompt as
 * *append to that ticket, do not file a second one*. The body it points at is
 * not permanently writable — `xgd` freezes `body`/`title` everywhere outside
 * the four pre-dispatch statuses, so a class ticket accepts an append for a
 * short window and refuses one forever after. When this was found, all five of
 * the classes the round was handed sat at `ready_to_reconcile` and every one of
 * the five would have been refused. That is not bad luck; it is the state every
 * class ticket converges to.
 *
 * AND THE CONSOLE PUNISHED THE ROUND FOR REACHING IT. `confirm()` read an
 * `appended` round back exactly as it read a `filed` one — status, provenance,
 * defect class — against a ticket an EARLIER round filed. On those same five,
 * that fired the status check on all five, the provenance check on the one the
 * operator filed himself, and the class check on the four filed before the
 * field existed. So naming the comment route in the brief would not have been
 * enough on its own: it makes `"status": "appended"` reachable and the console
 * then reports the round for reaching it.
 *
 * THE FILE MAKES BOTH DIRECTIONS OF EVERY CLAIM. Suppressing the three checks
 * for every round would satisfy the first half and destroy them, so the shapes
 * that must STILL be charged — a `filed` round's own ticket, a round's
 * `bugTickets` on either path, and two live tickets for one class — are
 * asserted against the same console in the same file.
 *
 * WHAT IS REAL. The console, its HTTP surface, the brief on disk, the prompt it
 * builds, the routing, the read-back and the gap registry are the real thing.
 * Substituted are the two things a test must not have — a headless browser
 * (`1c`) and a billed model (`claude`) — plus the store the console asks about
 * (`git`, `xgd`), each through the seam the console already had.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
  APPENDABLE_STATUSES,
  SETTLED_STATUSES,
  isSettled,
  routeForStatus,
  roundMarker,
} from '../tools/repro-console/src/append-route'
import { readBrief, type AiOutcome, type AiRunner } from '../tools/repro-console/src/ai'
import { ROUND_CREATED_BY } from '../tools/repro-console/src/ticket'
import { CONSOLE_WORKSPACE } from '../tools/repro-console/src/console'
import { gapsFile, readGaps, type GapEntry } from '../tools/repro-console/src/gaps'
import type { CommandResult, CommandRunner } from '../tools/repro-console/src/run'
import type { IterationStep, StepResult, StepRunner } from '../tools/repro-console/src/iteration'
import { startReproConsole, type ConsoleHandle } from '../tools/repro-console/src/server'

const openHandles: ConsoleHandle[] = []
afterEach(async () => {
  while (openHandles.length) await openHandles.pop()!.close()
})

// ── the store the console asks about ─────────────────────────────────────────

/** One ticket in the stand-in store, as `xgd ticket get --json` reports it. */
interface StoredTicket {
  id: string
  status: string
  createdBy?: string
  defectClass?: string[]
  /** Comment bodies hanging off it, which is where a round's marker lands. */
  comments?: string[]
  /** Make `xgd ticket get` refuse, so "the console could not look" is testable. */
  unreadable?: boolean
  /** Make `xgd ticket comments` refuse, which is a different answer again. */
  commentsUnreadable?: boolean
}

/**
 * An `xgd` that answers the four questions this ticket's console asks it.
 *
 * `ticket comments` is here because the append-evidence check is the one thing
 * an `appended` round IS charged with, and it is the only place in the console
 * that reads a bare JSON array rather than a document.
 */
function fakeCommands(store: StoredTicket[], log?: string[][]): CommandRunner {
  const find = (key: string): StoredTicket | undefined =>
    store.find((t) => t.id === key || commentUid(t, key) !== null)
  return async (command, args): Promise<CommandResult> => {
    log?.push([command, ...args])
    if (command === 'git') return { code: 0, stdout: '', stderr: '' }
    if (command !== 'xgd') return { code: 0, stdout: 'rail: no worse', stderr: '' }
    if (args[0] === 'ticket' && args[1] === 'list') {
      return { code: 0, stdout: banner(JSON.stringify({ items: [], truncated: false, next_cursor: null })), stderr: '' }
    }
    if (args[0] === 'ticket' && args[1] === 'comments') {
      const subject = store.find((t) => t.id === args[2])
      if (!subject || subject.commentsUnreadable) return { code: 1, stdout: '', stderr: 'no such ticket' }
      const refs = (subject.comments ?? []).map((_body, i) => ({
        uid: `comment-${subject.id}-${i}`,
        id: `COMMENT-${i}`,
        type: 'comment',
        title: `Comment on ${subject.id}`,
      }))
      return { code: 0, stdout: banner(JSON.stringify(refs)), stderr: '' }
    }
    if (args[0] === 'ticket' && args[1] === 'get') {
      const key = args[2]
      const owner = store.find((t) => commentUid(t, key) !== null)
      if (owner) {
        const body = owner.comments![commentUid(owner, key)!]
        return {
          code: 0,
          stdout: banner(
            JSON.stringify({
              uid: key,
              frontmatter: { uid: key, id: key, type: 'comment', created_by: 'xgd', status: null, fields: {} },
              fields: { kind: 'note' },
              body,
              links: [],
            }),
          ),
          stderr: '',
        }
      }
      const ticket = find(key)
      if (!ticket || ticket.unreadable) return { code: 1, stdout: '', stderr: 'refused' }
      return {
        code: 0,
        stdout: banner(
          JSON.stringify({
            uid: `uid-${ticket.id}`,
            frontmatter: {
              uid: `uid-${ticket.id}`,
              id: ticket.id,
              type: 'request',
              title: `a class ticket`,
              created_by: ticket.createdBy ?? `${ROUND_CREATED_BY}:repro-gigabytealchemy-ai#1`,
              status: ticket.status,
            },
            fields: { defect_class: ticket.defectClass ?? ['fold-wrong'] },
            body: 'an earlier round wrote this',
            links: [],
          }),
        ),
        stderr: '',
      }
    }
    return { code: 0, stdout: '', stderr: '' }
  }
}

/** Which of a ticket's comments this uid names, or null if it names none. */
function commentUid(ticket: StoredTicket, key: string): number | null {
  const prefix = `comment-${ticket.id}-`
  if (!key.startsWith(prefix)) return null
  const n = Number(key.slice(prefix.length))
  return Number.isInteger(n) && n < (ticket.comments?.length ?? 0) ? n : null
}

/**
 * `xgd` brackets its output with its own log lines, and `parseJsonOutput` exists
 * to survive exactly that. A fake that printed a bare document would let a
 * regression in the slicing pass every test here and fail on the real CLI.
 */
const banner = (json: string): string => `▶ xgd 0.17.83\n${json}\n◀ xgd 0.17.83\n`

// ── the stand-in `1c`, thin because nothing here reads the evidence ──────────

function fakeSteps(): StepRunner {
  return async (step: IterationStep, cwd: string): Promise<StepResult> => {
    const out = (): string => step.argv[step.argv.indexOf('--out') + 1]
    switch (step.name) {
      case 'capture': {
        if (step.argv[1] === 'list') return { code: 0, stdout: '[]', stderr: '' }
        const url = step.argv[2]
        const dir = path.join(cwd, 'storage', 'references', new URL(url).hostname, 'index')
        mkdirSync(dir, { recursive: true })
        writeFileSync(path.join(dir, 'capture.json'), JSON.stringify({ url }))
        writeFileSync(path.join(dir, 'raw.html'), '<!doctype html><h1>reference</h1>')
        return { code: 0, stdout: JSON.stringify({ url, name: `${new URL(url).hostname}/index`, dir }), stderr: '' }
      }
      case 'page':
        return { code: 0, stdout: JSON.stringify({ ok: true, data: { page: { id: 'home' } } }), stderr: '' }
      case 'render': {
        mkdirSync(out(), { recursive: true })
        writeFileSync(path.join(out(), 'index.html'), '<!doctype html><title>reproduction</title>')
        return { code: 0, stdout: '', stderr: '' }
      }
      case 'gate': {
        const dir = out()
        mkdirSync(dir, { recursive: true })
        writeFileSync(path.join(dir, 'regions.json'), JSON.stringify({ meanDiff: 31.2, pctOverThreshold: 18.4, regions: [] }))
        writeFileSync(path.join(dir, 'values-diff.json'), JSON.stringify({ deltas: [] }))
        writeFileSync(
          path.join(dir, 'gate.json'),
          JSON.stringify({
            pass: false,
            verdict: 'reproduction-wrong',
            diagnosis: 'the pixels disagree',
            nextStep: 'diagnose the fold',
            perceptual: { meanDiff: 31.2, pctOverThreshold: 18.4, regions: 3 },
            values: { deltas: 0 },
          }),
        )
        return { code: 1, stdout: '', stderr: '' }
      }
      default:
        return { code: 0, stdout: '', stderr: '' }
    }
  }
}

// ── the fixture ──────────────────────────────────────────────────────────────

const SITE = 'gigabytealchemy.ai'
const SLUG = 'repro-gigabytealchemy-ai'
/** What a round of iteration 1 on this site must write into its comment. */
const MARKER = roundMarker(ROUND_CREATED_BY, SLUG, 1)

interface Fixture {
  handle: ConsoleHandle
  cwd: string
}

async function startConsole(opts: {
  ai?: AiRunner
  store?: StoredTicket[]
  gaps?: GapEntry[]
  log?: string[][]
}): Promise<Fixture> {
  const cwd = mkdtemp()
  if (opts.gaps) {
    const workspace = path.join(cwd, CONSOLE_WORKSPACE)
    mkdirSync(workspace, { recursive: true })
    writeFileSync(gapsFile(workspace), JSON.stringify(opts.gaps, null, 2))
  }
  const handle = await startReproConsole({
    cwd,
    runStep: fakeSteps(),
    runAi: opts.ai ?? (async () => ({ status: 'no-gap' })),
    runCommand: fakeCommands(opts.store ?? [], opts.log),
    env: {},
    port: 0,
  })
  openHandles.push(handle)
  return { handle, cwd }
}

function mkdtemp(): string {
  const dir = path.join(tmpdir(), `bug140-${Math.random().toString(36).slice(2)}`)
  mkdirSync(dir, { recursive: true })
  return dir
}

const fakeAi = (outcome: AiOutcome): AiRunner => async () => outcome

async function reproduce(f: Fixture): Promise<void> {
  await fetch(new URL('/recapture', f.handle.url), {
    method: 'POST',
    body: new URLSearchParams({ url: SITE }).toString(),
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    redirect: 'manual',
  })
  await f.handle.console.settled()
  await fetch(new URL('/iteration/1/diagnose', f.handle.url), { method: 'POST', redirect: 'manual' })
  await f.handle.console.settled()
}

/** The prompt the round was really handed, off the artifact the console wrote. */
function promptOf(f: Fixture): string {
  return readFileSync(path.join(f.cwd, CONSOLE_WORKSPACE, SLUG, 'iteration-1', 'ai', 'prompt.md'), 'utf8')
}

/** What the console recorded about the round, off the artifact it wrote. */
function outcomeOf(f: Fixture): AiOutcome {
  const file = path.join(f.cwd, CONSOLE_WORKSPACE, SLUG, 'iteration-1', 'ai', 'outcome.json')
  return JSON.parse(readFileSync(file, 'utf8')) as AiOutcome
}

const registryOf = (f: Fixture): GapEntry[] => readGaps(path.join(f.cwd, CONSOLE_WORKSPACE))

/** One class in the registry, carried by one ticket. */
function gapFor(ticketId: string): GapEntry {
  return {
    residualClass: 'fold-drops-half-leading',
    ticketId,
    ticketUid: `uid-${ticketId}`,
    summary: 'the fold loses half a leading on inline-boxed runs',
    references: ['/refs/gigabytealchemy.ai/index'],
    iterations: [`${SLUG}#1`],
  }
}

// ── behaviour 1: the brief names the comment as the append route ─────────────

describe('BUG-140 the brief names the route the store will accept', () => {
  it('test_UAT_FC_BUG-140_the_brief_names_the_comment_as_the_append_route', () => {
    // The cheapest of the three fixes the ticket named, and the one that stops
    // a round following the instruction literally and getting an error. The
    // brief is a file in the repository precisely so that what the AI is told
    // is a diff somebody reviews, so it is asserted on the file.
    const brief = readBrief()
    expect(brief).toContain('xgd ticket add-comment <id> --kind note --body-file')
    expect(brief).toContain('On a frozen ticket the comment IS the append.')
    // The four statuses that still take a body append, named so the round can
    // tell the two routes apart without having to try one and read the error.
    for (const status of APPENDABLE_STATUSES) expect(brief).toContain(`\`${status}\``)
    // …and it is still an append, so `"status": "appended"` stays reachable.
    expect(brief).toContain('it is still `"status": "appended"`')
  })

  it('test_UAT_FC_BUG-140_the_brief_says_the_marker_rides_in_the_comments_first_line', () => {
    // The second half of the ticket: the working route carries no
    // `--created-by`, and a `--fields '{"created_by":…}'` is swallowed into
    // `fields.payload` while the comment's own frontmatter still reads `xgd`.
    // The marker cannot ride on the flag, so the brief puts it in prose and
    // says why — an instruction without its reason is one a round talks itself
    // out of.
    const brief = readBrief()
    expect(brief).toContain("Write your round marker as the comment's own first line.")
    expect(brief).toContain('`add-comment` has\nno `--created-by`')
    expect(brief).toContain('`repro-console:<slug>#<iteration>`')
  })

  it('test_UAT_FC_BUG-140_the_brief_says_what_an_appended_round_is_not_charged_with', () => {
    // Behaviour 3, told to the round as well as implemented in the console. A
    // round that believes it will be reported for the status of a ticket it did
    // not file is a round that files a duplicate to stay clean.
    const brief = readBrief()
    expect(brief).toContain('**What you are never charged with.**')
    expect(brief).toContain('belong to the round that filed it,\nwhich was not you')
  })
})

// ── behaviour 2: the prompt carries the live status, and the route ───────────

describe('BUG-140 the route is per class, because the freeze is per ticket', () => {
  it('test_UAT_FC_BUG-140_a_writable_class_ticket_is_routed_to_the_body_append', async () => {
    const f = await startConsole({
      gaps: [gapFor('REQ-263')],
      store: [{ id: 'REQ-263', status: 'draft' }],
    })
    await reproduce(f)

    const prompt = promptOf(f)
    // The status the console read back THIS round, beside the id — so the round
    // can see what the instruction was derived from rather than trusting it.
    expect(prompt).toContain('**REQ-263** (`uid-REQ-263`, now at `draft`)')
    expect(prompt).toContain('**append to that ticket** with `xgd ticket append <id> --file <f>`')
    // Not the comment, and not a new ticket: one route per class, not three.
    expect(prompt).not.toContain('**the comment is the append**')
    expect(prompt).not.toContain('**file a new ticket**')
  })

  it('test_UAT_FC_BUG-140_a_frozen_class_ticket_is_routed_to_a_comment', async () => {
    // The case the ticket was filed on, and all five of them were this one.
    const f = await startConsole({
      gaps: [gapFor('REQ-302')],
      store: [{ id: 'REQ-302', status: 'ready_to_reconcile' }],
    })
    await reproduce(f)

    const prompt = promptOf(f)
    expect(prompt).toContain('**REQ-302** (`uid-REQ-302`, now at `ready_to_reconcile`)')
    expect(prompt).toContain('**the comment is the append**')
    expect(prompt).toContain('xgd ticket add-comment <id> --kind note --body-file <f>')
    // The marker is written out literally for this round, as `--created-by` is
    // for the create route: a round that has to assemble it gets it wrong.
    expect(prompt).toContain(MARKER)
    // And the round it is refused on is never told to try it.
    expect(prompt).not.toContain('**append to that ticket** with `xgd ticket append <id> --file <f>`')
  })

  it('test_UAT_FC_BUG-140_a_settled_class_ticket_is_routed_to_a_new_ticket', async () => {
    // The consequence the registry could not express: a class whose ticket was
    // reconciled still told the round not to file. A recurrence of a fixed
    // class is the most interesting signal this loop can produce and it had
    // nowhere to go.
    const f = await startConsole({
      gaps: [gapFor('REQ-271')],
      store: [{ id: 'REQ-271', status: 'free_and_reconciled' }],
    })
    await reproduce(f)

    const prompt = promptOf(f)
    expect(prompt).toContain('**REQ-271** (`uid-REQ-271`, now at `free_and_reconciled`)')
    expect(prompt).toContain('**file a new ticket**')
    expect(prompt).toContain('`"status": "filed"`')
    expect(prompt).not.toContain('**the comment is the append**')
  })

  it('test_UAT_FC_BUG-140_an_unreadable_class_ticket_is_routed_to_a_comment', async () => {
    // The safe default, and deliberately the comment rather than a dropped
    // class: a comment is the one route `xgd` never refuses, so not knowing
    // costs a comment where a body append would have been tidier, and never
    // costs the finding.
    const f = await startConsole({
      gaps: [gapFor('REQ-265')],
      store: [{ id: 'REQ-265', status: 'draft', unreadable: true }],
    })
    await reproduce(f)

    const prompt = promptOf(f)
    expect(prompt).toContain('now at `unreadable`')
    expect(prompt).toContain('**the comment is the append**')
  })

  it('test_UAT_FC_BUG-140_the_routing_rule_is_the_freeze_rule', () => {
    // Asserted as a function as well as through a console, because the set is
    // read off `xgd`'s own `immutable` rules and a drift in either direction is
    // a round told to run a command the store refuses — or told not to run one
    // it would have accepted.
    for (const status of APPENDABLE_STATUSES) expect(routeForStatus(status)).toBe('append')
    for (const status of SETTLED_STATUSES) {
      expect(routeForStatus(status)).toBe('new-ticket')
      expect(isSettled(status)).toBe(true)
    }
    for (const status of ['ready_to_reconcile', 'bundled', 'reconciling', 'ready_to_implement', 'in_progress', 'error']) {
      expect(routeForStatus(status)).toBe('comment')
      expect(isSettled(status)).toBe(false)
    }
    // Nobody looked, so nobody knows: the same answer as a status nothing
    // matches, which is the route that is never refused.
    expect(routeForStatus('')).toBe('comment')
  })
})

// ── behaviour 3: the round is charged for what it is responsible for ─────────

const APPENDED: AiOutcome = {
  status: 'appended',
  residualClass: 'fold-drops-half-leading',
  summary: 'seen again, same shape',
  ticketId: 'REQ-302',
}

describe('BUG-140 an appended round is not charged with an earlier round ticket', () => {
  it('test_UAT_FC_BUG-140_appending_to_a_frozen_operator_filed_unclassified_ticket_is_clean', async () => {
    // Every one of the three false checks at once, on the exact shape the
    // ticket was found on: REQ-265 was at `ready_to_reconcile`, filed by the
    // operator, and carried no `defect_class` because it predates the field.
    // A round that appended to it correctly was reported three times.
    const f = await startConsole({
      ai: fakeAi({ ...APPENDED, ticketId: 'REQ-265' }),
      gaps: [gapFor('REQ-265')],
      store: [
        {
          id: 'REQ-265',
          status: 'ready_to_reconcile',
          createdBy: 'martin-github@westhead.me',
          defectClass: [],
          comments: [`${MARKER} — iteration 1 re-measurement.\n\nthe numbers.`],
        },
      ],
    })
    await reproduce(f)

    expect(outcomeOf(f).violations).toEqual([])
    // The status is still REPORTED — the operator wants to see where the ticket
    // got to. What changed is that it is not a violation.
    expect(outcomeOf(f).ticketStatus).toBe('ready_to_reconcile')
  })

  it('test_UAT_FC_BUG-140_an_append_with_no_comment_carrying_the_marker_is_reported', async () => {
    // The check that replaced the three. `"appended"` used to be the one claim
    // nothing verified — the console read the ticket's own fields, which say
    // nothing about whether this round reached it. An unverifiable claim to
    // have appended is worse than an honest failure, which is the brief's own
    // rule about `"filed"` applied to the other status.
    const f = await startConsole({
      ai: fakeAi(APPENDED),
      gaps: [gapFor('REQ-302')],
      store: [{ id: 'REQ-302', status: 'ready_to_reconcile', comments: ['an unrelated note from somebody else'] }],
    })
    await reproduce(f)

    const violations = outcomeOf(f).violations ?? []
    expect(violations).toHaveLength(1)
    expect(violations[0]).toContain(`REQ-302 carries no comment marked '${MARKER}'`)
    // And it says what to run, because a violation a round cannot act on is a
    // violation it learns to discount.
    expect(violations[0]).toContain('xgd ticket add-comment REQ-302 --kind note --body-file <f>')
  })

  it('test_UAT_FC_BUG-140_an_unreadable_comment_list_is_unverified_not_a_missing_append', async () => {
    // "The console could not look" and "the round appended nothing" are
    // different findings and a reader has to be able to tell them apart — the
    // same distinction `readTicket` already draws between `found: false` and
    // wrong provenance. Reporting a CLI failure as a round that appended
    // nothing is the shape of mistake this whole ticket is about.
    const f = await startConsole({
      ai: fakeAi({ ...APPENDED, ticketId: 'REQ-270' }),
      gaps: [gapFor('REQ-270')],
      store: [{ id: 'REQ-270', status: 'bundled', commentsUnreadable: true }],
    })
    await reproduce(f)

    const violations = outcomeOf(f).violations ?? []
    expect(violations).toHaveLength(1)
    expect(violations[0]).toContain("could not read REQ-270's comments back, so the append is unverified")
    // Explicitly NOT the accusation: the round is not told it appended nothing.
    expect(violations[0]).not.toContain('carries no comment marked')
  })

  it('test_UAT_FC_BUG-140_an_empty_comment_list_is_a_missing_append', async () => {
    // The other side of the same read: the list came back, and nothing on it is
    // this round's. That IS the round's failure and is said in those words.
    const f = await startConsole({
      ai: fakeAi({ ...APPENDED, ticketId: 'REQ-270' }),
      gaps: [gapFor('REQ-270')],
      store: [{ id: 'REQ-270', status: 'bundled', comments: [] }],
    })
    await reproduce(f)

    expect((outcomeOf(f).violations ?? [])[0]).toContain('carries no comment marked')
  })

  it('test_UAT_FC_BUG-140_another_rounds_marker_does_not_satisfy_this_rounds_append', async () => {
    // The marker is this round's, not any round's. A class ticket accumulates
    // comments from every round that ever met it, so a check that accepted the
    // prefix would pass on evidence that has been sitting there for weeks and
    // verify nothing at all.
    const f = await startConsole({
      ai: fakeAi(APPENDED),
      gaps: [gapFor('REQ-302')],
      store: [
        {
          id: 'REQ-302',
          status: 'ready_to_reconcile',
          comments: [`${roundMarker(ROUND_CREATED_BY, SLUG, 4)} — iteration 4 re-measurement.`],
        },
      ],
    })
    await reproduce(f)

    expect((outcomeOf(f).violations ?? [])[0]).toContain(`carries no comment marked '${MARKER}'`)
  })

  it('test_UAT_FC_BUG-140_a_filed_round_is_still_checked_in_full', async () => {
    // The other direction, undiminished. A round that FILED made the ticket, so
    // its status, its provenance and its class are all the round's own work —
    // and a `ready_*` status on one it filed spawns a paid pipeline against a
    // diagnosis nobody has read, which is the expensive mistake in this loop.
    const f = await startConsole({
      ai: fakeAi({
        status: 'filed',
        residualClass: 'a-brand-new-class',
        summary: 'new',
        ticketId: 'REQ-400',
      }),
      store: [
        {
          id: 'REQ-400',
          status: 'ready_to_reconcile',
          createdBy: 'martin-github@westhead.me',
          defectClass: [],
        },
      ],
    })
    await reproduce(f)

    const violations = (outcomeOf(f).violations ?? []).join('\n')
    expect(violations).toContain("REQ-400 is at 'ready_to_reconcile', not 'draft'")
    expect(violations).toContain('a dispatcher trigger')
    expect(violations).toContain("REQ-400 was filed as 'martin-github@westhead.me'")
    expect(violations).toContain('REQ-400 carries no `defect_class`')
  })

  it('test_UAT_FC_BUG-140_bug_tickets_are_still_checked_in_full_on_an_appended_round', async () => {
    // The round CREATED these, whichever status it claimed for the gap, so
    // nothing about the append path loosens them. Loosening the gap read-back
    // for `appended` must not leak sideways into the tickets the round really
    // is answerable for.
    const f = await startConsole({
      ai: fakeAi({ ...APPENDED, bugTickets: ['BUG-500'] }),
      gaps: [gapFor('REQ-302')],
      store: [
        { id: 'REQ-302', status: 'ready_to_reconcile', comments: [`${MARKER} — iteration 1.`] },
        { id: 'BUG-500', status: 'ready_to_implement', createdBy: 'martin-github@westhead.me', defectClass: [] },
      ],
    })
    await reproduce(f)

    const violations = (outcomeOf(f).violations ?? []).join('\n')
    expect(violations).toContain("BUG-500 is at 'ready_to_implement', not 'draft'")
    expect(violations).toContain("BUG-500 was filed as 'martin-github@westhead.me'")
    expect(violations).toContain('BUG-500 carries no `defect_class`')
    // …and the ticket it appended to is still not charged with anything.
    expect(violations).not.toContain('REQ-302')
  })
})

// ── behaviour 4: a class can outlive its ticket ──────────────────────────────

describe('BUG-140 a deliberate re-file against a settled class is not a duplicate', () => {
  it('test_UAT_FC_BUG-140_a_refile_against_a_settled_class_is_not_reported', async () => {
    // The round was TOLD to file this one — behaviour 2's third route — so
    // reporting it would accuse a round of doing as it was asked, which is the
    // same failure the three checks above made in a different place.
    const f = await startConsole({
      ai: fakeAi({
        status: 'filed',
        residualClass: 'fold-drops-half-leading',
        summary: 'the class came back after its ticket was reconciled',
        ticketId: 'REQ-410',
      }),
      gaps: [gapFor('REQ-271')],
      store: [
        { id: 'REQ-271', status: 'free_and_reconciled' },
        { id: 'REQ-410', status: 'draft' },
      ],
    })
    await reproduce(f)

    expect(outcomeOf(f).violations).toEqual([])
  })

  it('test_UAT_FC_BUG-140_the_registry_succeeds_the_class_and_keeps_the_old_id', async () => {
    // A class whose history is "filed, fixed, and came back" is a stronger fact
    // than either id alone, so the predecessor moves down rather than out. The
    // registry used to refuse the second id outright and hold one while two
    // tickets described one class.
    const f = await startConsole({
      ai: fakeAi({
        status: 'filed',
        residualClass: 'fold-drops-half-leading',
        summary: 'back again, and worse',
        ticketId: 'REQ-410',
      }),
      gaps: [gapFor('REQ-271')],
      store: [
        { id: 'REQ-271', status: 'free_and_reconciled' },
        { id: 'REQ-410', status: 'draft' },
      ],
    })
    await reproduce(f)

    const gaps = registryOf(f)
    expect(gaps).toHaveLength(1)
    expect(gaps[0].ticketId).toBe('REQ-410')
    expect(gaps[0].priorTicketIds).toEqual(['REQ-271'])
    // The class describes what it looks like NOW, not what the settled ticket
    // said about it.
    expect(gaps[0].summary).toBe('back again, and worse')
  })

  it('test_UAT_FC_BUG-140_the_next_round_is_told_the_class_outlived_a_ticket', async () => {
    // The succession is only worth keeping if it reaches the round. A class on
    // its second ticket is one the engine has already been asked to fix once,
    // which is exactly the frequency signal the registry exists to carry.
    const f = await startConsole({
      gaps: [{ ...gapFor('REQ-410'), priorTicketIds: ['REQ-271'] }],
      store: [{ id: 'REQ-410', status: 'draft' }],
    })
    await reproduce(f)

    expect(promptOf(f)).toContain('Previously carried by REQ-271, which this class outlived.')
  })

  it('test_UAT_FC_BUG-140_two_live_tickets_for_one_class_is_still_reported', async () => {
    // The hazard the duplicate check exists for, undiminished: the predecessor
    // is still open, so a second ticket for the same class leaves the
    // reconciler reasoning about overlapping ownership — which is the whole
    // reason there is one ticket per class.
    const f = await startConsole({
      ai: fakeAi({
        status: 'filed',
        residualClass: 'fold-drops-half-leading',
        summary: 'filed a second one anyway',
        ticketId: 'REQ-411',
      }),
      gaps: [gapFor('REQ-263')],
      store: [
        { id: 'REQ-263', status: 'draft' },
        { id: 'REQ-411', status: 'draft' },
      ],
    })
    await reproduce(f)

    const violations = (outcomeOf(f).violations ?? []).join('\n')
    expect(violations).toContain("'fold-drops-half-leading' already had REQ-263")
    expect(violations).toContain('REQ-411 for the same class')
    // …and the registry does NOT succeed: the class still has one live ticket
    // and a human decides which.
    const gaps = registryOf(f)
    expect(gaps[0].ticketId).toBe('REQ-263')
    expect(gaps[0].priorTicketIds).toBeUndefined()
  })
})

// ── the artifact the round is handed ─────────────────────────────────────────

describe('BUG-140 the registry alone was never enough', () => {
  it('test_UAT_FC_BUG-140_every_known_class_is_read_back_before_the_prompt_is_built', async () => {
    // The registry records what the console filed and deliberately records
    // nothing about a ticket's life afterwards — that belongs to `xgd`. So the
    // life is fetched at the one moment at which it is true, which is when the
    // prompt is built, and this asserts the console really asks.
    const log: string[][] = []
    const f = await startConsole({
      gaps: [gapFor('REQ-263'), { ...gapFor('REQ-302'), residualClass: 'capture-drops-padding' }],
      store: [
        { id: 'REQ-263', status: 'draft' },
        { id: 'REQ-302', status: 'reconciling' },
      ],
      log,
    })
    await reproduce(f)

    expect(log).toContainEqual(['xgd', 'ticket', 'get', 'REQ-263', '--json'])
    expect(log).toContainEqual(['xgd', 'ticket', 'get', 'REQ-302', '--json'])
    const prompt = promptOf(f)
    expect(prompt).toContain('now at `draft`')
    expect(prompt).toContain('now at `reconciling`')
  })

  it('test_UAT_FC_BUG-140_no_known_classes_still_reads_as_a_clean_slate', async () => {
    // The first round on a fresh workspace, unchanged by any of this.
    const f = await startConsole({})
    await reproduce(f)
    expect(promptOf(f)).toContain('none yet. Anything you find this round is a new class.')
    expect(existsSync(path.join(f.cwd, CONSOLE_WORKSPACE, SLUG, 'iteration-1'))).toBe(true)
  })
})

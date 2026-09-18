/**
 * REQ-262 — loop-1 session priming: the session knowledge base, and the tools
 * a round is given.
 *
 * WHAT THIS TICKET IS ABOUT. A round starts knowing nothing beyond a method
 * brief and re-derives its bearings every time. The first live round spent ten
 * `Read` calls rediscovering that `backgroundImageUrl` is deliberately distinct
 * from `src` — stated plainly in the engine's own comments, and a cost this
 * loop would otherwise pay on every round forever.
 *
 * TWO DELIVERABLES ARE TESTED HERE. The KB — swept from every `doc` ticket,
 * indexed, rebuilt per round, reachable with `Read`/`Glob`/`Grep` — and the
 * tool grant, which [[REQ-262]] D7 widened to include `Bash` so the round can
 * run `xgd`. The second is why the third thing tested exists at all: with a
 * shell in the round's hands, "never file at a `ready_*` status" stopped being
 * structural and had to become an assertion.
 *
 * WHAT IS SUBSTITUTED. `xgd` and `git`, through the `CommandRunner` seam the
 * console already had — the same substitution [[REQ-261]]'s suite makes, and
 * for the same reason: a test must not bill a model or mutate a ticket store.
 * Everything else is the real module.
 */
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  INDEX_FILE,
  KB_TICKET_TYPE,
  SESSION_KB_DIR,
  buildSessionKb,
  kbIndex,
  summarise,
} from '../tools/repro-console/src/session-kb'
import {
  READY_STATUSES,
  ROUND_CREATED_BY,
  readyStatusArrivals,
  readyStatusFindings,
  readyStatusSnapshot,
  type ReadyTicket,
} from '../tools/repro-console/src/ticket'
import {
  AI_ALLOWED_TOOLS,
  AI_DISALLOWED_TOOLS,
  buildPrompt,
  claudeCommand,
  parseOutcome,
  readBrief as readBriefFile,
} from '../tools/repro-console/src/ai'
import { inSystemKb } from '../tools/generate/src/cli/kb'
import type { CommandRunner } from '../tools/repro-console/src/run'

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

/** A `doc` ticket as `xgd ticket list --type doc --view --json` reports one. */
interface FakeDoc {
  uid: string
  id: string
  title: string
  body: string
  fields?: Record<string, unknown>
}

const DOC_53: FakeDoc = {
  uid: 'doc-bdbc46b0',
  id: 'DOC-53',
  title: 'The reproduction engine and the loop-1 session',
  // The distinction the first round spent ten reads rediscovering. Its presence
  // in the KB is the whole acceptance criterion of this ticket.
  body:
    'Audience: the loop-1 diagnosing session, not the builder AI.\n\n' +
    '## 1.6 Field-level distinctions\n\n' +
    'Background imagery is `backgroundImageUrl`, never `src`. `src` is for ' +
    'replaced content in flow.',
  fields: { doc_kind: 'architecture' },
}

/** A PRODUCTION-KB document. D3 says it is admitted; requirement 5 says the
 *  traffic never runs the other way. */
const DOC_46: FakeDoc = {
  uid: 'doc-aaaa1111',
  id: 'DOC-46',
  title: 'What 1st Contact is, and how to say it',
  body: 'The product, in the words we use with a client. It is not a template tool.',
  fields: { doc_kind: 'system_kb' },
}

/** A document with no kind at all — the sweep does not care. */
const DOC_7: FakeDoc = {
  uid: 'doc-bbbb2222',
  id: 'DOC-7',
  title: 'Website Framework Architecture Principles',
  body: 'The framework is a safety envelope, not a set of aesthetic rails.',
}

/** `xgd`, answering the two questions the console actually asks it. */
function fakeXgd(opts: { docs?: FakeDoc[]; ready?: ReadyTicket[]; failList?: boolean } = {}): CommandRunner {
  return async (command, args) => {
    if (command !== 'xgd') return { code: 0, stdout: '', stderr: '' }
    if (args[1] === 'list' && args.includes('--type')) {
      if (opts.failList) return { code: 1, stdout: '', stderr: 'xgd: store is locked' }
      return {
        code: 0,
        // The CLI prints log lines around its JSON, which is why the console
        // looks for the document inside the output rather than parsing all of it.
        stdout: `▶ xgd 0.17.42\n${JSON.stringify({ items: opts.docs ?? [], truncated: false, next_cursor: null })}\n◀ xgd`,
        stderr: '',
      }
    }
    if (args[1] === 'list') {
      return {
        code: 0,
        stdout: `▶ xgd\n${JSON.stringify({ items: opts.ready ?? [], truncated: false, next_cursor: null })}`,
        stderr: '',
      }
    }
    return { code: 0, stdout: '', stderr: '' }
  }
}

function workspace(): string {
  return mkdtempSync(path.join(tmpdir(), 'req262-'))
}

// ── behaviour 2: the knowledge base ──────────────────────────────────────────

describe('REQ-262 the session KB is every doc ticket', () => {
  it('test_UAT_FC_REQ_262_every_doc_ticket_is_in_the_kb_with_no_opt_in', async () => {
    // D2. The rule is one line and there is no membership to maintain: a
    // hand-kept list drifts the first time a document is renamed, and an opt-in
    // field is a thing somebody has to remember to set. Three documents of
    // three different kinds — architecture, system_kb, and none at all — and
    // all three are in, because the rule does not consult the kind.
    const ws = workspace()
    const kb = await buildSessionKb({ cwd: REPO, run: fakeXgd({ docs: [DOC_53, DOC_46, DOC_7] }), workspace: ws })

    expect(kb.error).toBeUndefined()
    expect(kb.docs.map((d) => d.id)).toEqual(['DOC-7', 'DOC-46', 'DOC-53'])
    for (const id of ['DOC-7', 'DOC-46', 'DOC-53']) {
      expect(existsSync(path.join(kb.dir, `${id}.md`))).toBe(true)
    }
    // The sweep is over `doc` and nothing else — a request or a bug is not a
    // document and has no business in the round's reading material.
    expect(KB_TICKET_TYPE).toBe('doc')
  })

  it('test_UAT_FC_REQ_262_the_kb_answers_what_the_first_round_spent_ten_reads_on', async () => {
    // The acceptance criterion, stated as a test. A round asking "is background
    // imagery `src`?" now has a file that says so, and `Grep` finds it — which
    // is the difference between one tool call and the ten the first round spent.
    const ws = workspace()
    const kb = await buildSessionKb({ cwd: REPO, run: fakeXgd({ docs: [DOC_53, DOC_46, DOC_7] }), workspace: ws })

    const hits = readdirSync(kb.dir)
      .filter((name) => name.endsWith('.md'))
      .filter((name) => readFileSync(path.join(kb.dir, name), 'utf8').includes('backgroundImageUrl'))
    expect(hits).toEqual(['DOC-53.md'])
    expect(readFileSync(path.join(kb.dir, 'DOC-53.md'), 'utf8')).toContain('never `src`')
  })

  it('test_UAT_FC_REQ_262_the_index_says_what_each_document_answers', async () => {
    // D2 — the index is LOAD-BEARING. The real corpus is ~900 KB, around 222k
    // tokens read whole, which no round may spend. The index is what makes the
    // sweep affordable: one line per document, saying what it answers, so the
    // round opens the two or three it needs.
    const ws = workspace()
    const kb = await buildSessionKb({ cwd: REPO, run: fakeXgd({ docs: [DOC_53, DOC_46, DOC_7] }), workspace: ws })
    const index = readFileSync(path.join(kb.dir, INDEX_FILE), 'utf8')

    for (const doc of kb.docs) {
      expect(index).toContain(doc.id)
      expect(index).toContain(`${doc.id}.md`)
      // Not merely the id: a line that does not say what the document answers
      // gives the round no basis on which to choose it.
      expect(doc.summary.length).toBeGreaterThan(doc.title.length)
      expect(index).toContain(doc.summary)
    }
    // Numeric order, because DOC-7 belongs before DOC-46 and a lexicographic
    // sort puts it after.
    expect(index.indexOf('DOC-7')).toBeLessThan(index.indexOf('DOC-46'))
    expect(index).toMatch(/Read this index, not the corpus/i)
  })

  it('test_UAT_FC_REQ_262_a_summary_is_the_opening_statement_not_the_markup', () => {
    // The index is read by something that decides from the words, so `**` and
    // `[[DOC-19]]` brackets are noise it would pay for by the token.
    const line = summarise(
      'Design Lessons Log',
      '# Heading\n\n> a quote\n\n**The lessons** from [[DOC-19]] reproduction passes, written down so they are not relearned. More follows.',
    )
    expect(line).toContain('Design Lessons Log — ')
    expect(line).toContain('The lessons from DOC-19 reproduction passes')
    expect(line).not.toContain('**')
    expect(line).not.toContain('[[')
    expect(line).not.toContain('# Heading')
  })

  it('test_UAT_FC_REQ_262_a_retired_document_stops_being_searchable', async () => {
    // Requirement 13. A sweep that only ever adds leaves a deleted document
    // sitting in the KB looking current, and a round would quote it as current.
    // A stale file in a swept directory is worse than a missing one.
    const ws = workspace()
    const first = await buildSessionKb({ cwd: REPO, run: fakeXgd({ docs: [DOC_53, DOC_7] }), workspace: ws })
    expect(existsSync(path.join(first.dir, 'DOC-7.md'))).toBe(true)

    const second = await buildSessionKb({ cwd: REPO, run: fakeXgd({ docs: [DOC_53] }), workspace: ws })
    expect(existsSync(path.join(second.dir, 'DOC-7.md'))).toBe(false)
    expect(existsSync(path.join(second.dir, 'DOC-53.md'))).toBe(true)
    expect(readFileSync(path.join(second.dir, INDEX_FILE), 'utf8')).not.toContain('DOC-7')
  })

  it('test_UAT_FC_REQ_262_the_kb_is_rebuilt_each_round_so_it_cannot_be_stale', async () => {
    // Requirement 12. A document edited since the last round is present in the
    // next one without anyone refreshing anything.
    const ws = workspace()
    await buildSessionKb({ cwd: REPO, run: fakeXgd({ docs: [DOC_53] }), workspace: ws })
    const edited = { ...DOC_53, body: `${DOC_53.body}\n\n## 1.7 A learning added after the last round\n\nIt is here.` }
    const again = await buildSessionKb({ cwd: REPO, run: fakeXgd({ docs: [edited] }), workspace: ws })

    expect(readFileSync(path.join(again.dir, 'DOC-53.md'), 'utf8')).toContain('A learning added after the last round')
  })

  it('test_UAT_FC_REQ_262_a_kb_that_cannot_be_built_never_fails_the_round', async () => {
    // Requirement 14. A round with no KB is the round we had before this
    // ticket, which worked. Turning an improvement into a new way to fail would
    // be a poor trade — so the reason travels back and the round still runs.
    const ws = workspace()
    const kb = await buildSessionKb({ cwd: REPO, run: fakeXgd({ failList: true }), workspace: ws })

    expect(kb.docs).toEqual([])
    expect(kb.error).toContain('xgd refused to list documents')
    // And the prompt SAYS so, rather than quietly omitting the section — a
    // round that cannot tell "no KB" from "nothing relevant in the KB" would
    // draw the wrong conclusion from its silence.
    const prompt = buildPrompt('BRIEF', roundContext({ kb }))
    expect(prompt).toContain('no knowledge base this round')
    expect(prompt).toContain('store is locked')
  })
})

// ── behaviour 3: the two corpora do not mix ──────────────────────────────────

describe('REQ-262 the session KB is not the production KB', () => {
  it('test_UAT_FC_REQ_262_a_production_document_is_admitted_to_the_session_kb', async () => {
    // D3, answered yes. A `doc_kind: system_kb` document is the builder AI's,
    // which does not make it uninteresting to a diagnosing round, and D2's rule
    // admits it without a special case.
    const ws = workspace()
    const kb = await buildSessionKb({ cwd: REPO, run: fakeXgd({ docs: [DOC_46] }), workspace: ws })

    expect(kb.docs.map((d) => d.id)).toEqual(['DOC-46'])
    expect(readFileSync(path.join(kb.dir, 'DOC-46.md'), 'utf8')).toContain('not a template tool')
  })

  it('test_UAT_FC_REQ_262_no_session_document_reaches_the_production_corpus', async () => {
    // Requirement 5, and the asymmetry that matters: a round reading an extra
    // document wastes tokens, a client-facing agent reading one misinforms a
    // customer. Membership in the production corpus is `doc_kind: system_kb`
    // and DOC-53 carries `architecture`, so it is excluded BY CONSTRUCTION —
    // asserted here rather than assumed.
    expect(inSystemKb({ fields: DOC_53.fields })).toBe(false)
    expect(inSystemKb({ fields: DOC_7.fields ?? null })).toBe(false)
    expect(inSystemKb({ fields: DOC_46.fields })).toBe(true)

    // And nothing in the KB build writes outside its own directory, so there is
    // no path by which it could reach the corpus even if the predicate moved.
    const ws = workspace()
    const kb = await buildSessionKb({ cwd: REPO, run: fakeXgd({ docs: [DOC_53, DOC_46] }), workspace: ws })
    expect(kb.dir).toBe(path.join(ws, SESSION_KB_DIR))
    expect(readdirSync(ws)).toEqual([SESSION_KB_DIR])
  })
})

// ── requirements 6 and 7: how the round reaches it ───────────────────────────

describe('REQ-262 the round reaches the KB by reading, and tickets through xgd', () => {
  it('test_UAT_FC_REQ_262_every_document_is_reachable_with_read_glob_and_grep', async () => {
    // Requirement 6, held structurally rather than by a route the round has to
    // be told about: ordinary `.md` files, one per document, in one directory.
    const ws = workspace()
    const kb = await buildSessionKb({ cwd: REPO, run: fakeXgd({ docs: [DOC_53, DOC_46, DOC_7] }), workspace: ws })

    const files = readdirSync(kb.dir)
    expect(files.every((name) => name.endsWith('.md'))).toBe(true)
    expect(new Set(files)).toEqual(new Set(['INDEX.md', 'DOC-7.md', 'DOC-46.md', 'DOC-53.md']))

    for (const doc of kb.docs) {
      const text = readFileSync(path.join(kb.dir, doc.file), 'utf8')
      // Requirement 7: nothing the round is given points at a ticket path. The
      // uid is ticket bookkeeping and the frontmatter goes with it.
      expect(text).not.toContain('.xgd/')
      expect(text).not.toContain(doc.uid)
      expect(text.startsWith('---')).toBe(false)
      // What survives is the title, the kind, and the document.
      expect(text).toContain(`# ${doc.id} — ${doc.title}`)
    }
  })

  it('test_UAT_FC_REQ_262_the_prompt_names_the_index_and_does_not_inline_the_corpus', async () => {
    // D2 again, on the prompt side. Listing 52 titles in the prompt would spend
    // tokens every round reproducing a file that is already on disk and already
    // sorted, which is the "adding the KB must not simply make the prompt
    // longer" the ticket asks for.
    const ws = workspace()
    const kb = await buildSessionKb({ cwd: REPO, run: fakeXgd({ docs: [DOC_53, DOC_46, DOC_7] }), workspace: ws })
    const prompt = buildPrompt('BRIEF', roundContext({ kb }))

    expect(prompt).toContain(path.join(kb.dir, INDEX_FILE))
    expect(prompt).toContain('start here')
    expect(prompt).toMatch(/Do not read the corpus/i)
    // The documents' own text is NOT in the prompt — only the way to it.
    expect(prompt).not.toContain('never `src`')
    expect(prompt).not.toContain('not a template tool')
    // Nor are their titles enumerated: one count, not a table of contents.
    expect(prompt).toContain('3 project document(s)')
  })

  it('test_UAT_FC_REQ_262_the_prompt_sends_the_round_to_xgd_and_warns_off_ready_statuses', async () => {
    // D7. The round has `Bash` so it can search prior art — the first round
    // wanted exactly this and found its answer by grepping `.xgd/`, which works
    // and couples it to an internal it does not own. And the one expensive
    // mistake is named where the round will read it.
    const prompt = buildPrompt('BRIEF', roundContext({}))

    expect(prompt).toContain('xgd ticket list')
    expect(prompt).toContain('xgd ticket get')
    expect(prompt).toMatch(/never by path/i)
    expect(prompt).toContain('`ready_*` status')
    expect(prompt).toContain('dispatcher trigger')
    // [[BUG-108]]: this used to assert `/You still do not file/i`, which pinned
    // the half of the contradiction the console cannot honour — D10 deleted the
    // filing relay, so there was nothing on the far end of a hand-back. The
    // round files; what survives here is the warning that actually matters.
    expect(prompt).toMatch(/You file\./i)
  })
})

// ── D7 and requirement 9: the tool grant ─────────────────────────────────────

describe('REQ-262 the round may run xgd, and nothing that writes or spawns', () => {
  it('test_UAT_FC_REQ_262_bash_is_granted_and_the_writing_and_spawning_tools_are_not', () => {
    // Requirement 9 as AMENDED by D7. `Bash` is granted because it could not be
    // granted narrowly — see `measurements/tool-gating.sh`. Everything that
    // writes a file, spawns an agent or reaches the network stays denied BY
    // NAME, which is the only mechanism measured to gate anything.
    expect(AI_ALLOWED_TOOLS).toContain('Bash')
    expect(AI_DISALLOWED_TOOLS).not.toContain('Bash')

    for (const tool of ['Edit', 'Write', 'NotebookEdit']) expect(AI_DISALLOWED_TOOLS).toContain(tool)
    for (const tool of ['Task', 'Workflow', 'Skill']) expect(AI_DISALLOWED_TOOLS).toContain(tool)
    for (const tool of ['WebFetch', 'WebSearch', 'RemoteTrigger', 'SendMessage']) {
      expect(AI_DISALLOWED_TOOLS).toContain(tool)
    }

    // And the argv the console actually spawns says the same thing, so the
    // policy is a property of the process rather than of this file.
    const { args } = claudeCommand({})
    const allowed = args.slice(args.indexOf('--allowedTools') + 1, args.indexOf('--disallowedTools'))
    expect(allowed).toContain('Bash')
    expect(args.slice(args.indexOf('--disallowedTools') + 1)).not.toContain('Bash')
  })

  it('test_UAT_FC_REQ_262_the_measurement_that_justifies_the_grant_is_in_the_repo', () => {
    // Requirement 8. The policy rests on a measurement, so the measurement is
    // committed beside it and is re-runnable — a justification that cannot be
    // re-checked decays into folklore. Result B is the one that decided it.
    const script = path.join(REPO, 'tools', 'repro-console', 'measurements', 'tool-gating.sh')
    expect(existsSync(script)).toBe(true)
    const text = readFileSync(script, 'utf8')
    expect(text).toContain('Bash(xgd ticket get:*)')
    expect(text).toContain('permission_denials')
    expect(text).toMatch(/MEASURED-B.*RAN/s)
    expect(text).toMatch(/prefix rule ADMITS `Bash`/i)
  })
})

// ── requirement 11: the ready_* assertion ────────────────────────────────────

describe('REQ-262 a dispatcher trigger set during a round is reported', () => {
  it('test_UAT_FC_REQ_262_a_ticket_that_reached_a_ready_status_is_a_violation', () => {
    // Requirement 11. [[REQ-256]] made this structural by denying the round a
    // shell; D7 granted one, so it is checked instead. Found by DIFFERENCE,
    // because the store does not record which process moved a status — and, as
    // of [[BUG-114]], charged to the round only when something attributes it to
    // one. A round that filed the ticket is the plainest such thing.
    const before = new Map<string, ReadyTicket>([
      ['request-aaaa', { uid: 'request-aaaa', id: 'REQ-100', status: 'ready_to_reconcile' }],
    ])
    const after = new Map<string, ReadyTicket>([
      ['request-aaaa', { uid: 'request-aaaa', id: 'REQ-100', status: 'ready_to_reconcile' }],
      ['bug-bbbb', { uid: 'bug-bbbb', id: 'BUG-99', status: 'ready_to_implement' }],
    ])

    const { violations } = readyStatusFindings(readyStatusArrivals(before, after), {
      named: new Set<string>(),
      createdBy: new Map([['bug-bbbb', `${ROUND_CREATED_BY}:gigabytealchemy-ai#1`]]),
    })
    expect(violations).toHaveLength(1)
    expect(violations[0]).toContain('BUG-99')
    expect(violations[0]).toContain('ready_to_implement')
    expect(violations[0]).toContain('dispatcher-trigger')
    // A ticket that was ALREADY at a trigger status before the round is not the
    // round's doing and is not reported.
    expect(violations[0]).not.toContain('REQ-100')
  })

  it('test_UAT_FC_REQ_262_a_well_behaved_round_reports_nothing', () => {
    // The ordinary case says nothing, which is what makes the line worth
    // reading when it does appear.
    const same = new Map<string, ReadyTicket>([
      ['request-aaaa', { uid: 'request-aaaa', id: 'REQ-100', status: 'ready_to_reconcile' }],
    ])
    expect(readyStatusArrivals(same, new Map(same))).toEqual([])
  })

  it('test_UAT_FC_REQ_262_the_snapshot_asks_only_for_the_trigger_statuses', async () => {
    // A full list of this project's ticket store takes minutes; the filtered
    // one takes seconds. The check has to be cheap enough to run either side of
    // every round, or it will be turned off.
    const asked: string[][] = []
    const run: CommandRunner = async (command, args) => {
      asked.push([command, ...args])
      return { code: 0, stdout: JSON.stringify({ items: [], truncated: false, next_cursor: null }), stderr: '' }
    }
    await readyStatusSnapshot(REPO, run)

    const call = asked[0]
    expect(call[0]).toBe('xgd')
    for (const status of READY_STATUSES) expect(call).toContain(status)
    // Never an unfiltered sweep of the whole store.
    expect(call).toContain('--no-limit')
    expect(call).not.toContain('--view')
  })
})

/** A round context with the fields the prompt needs and nothing this suite varies. */
function roundContext(over: Record<string, unknown>): Parameters<typeof buildPrompt>[1] {
  return {
    n: 1,
    slug: 'repro-example-com',
    originalUrl: 'https://example.com',
    bundleDir: '/tmp/bundle',
    evidenceDir: '/tmp/evidence',
    pageDocument: '/tmp/page.json',
    siteDir: '/tmp/site',
    gate: null,
    rail: { available: false, summary: 'not run' },
    knownGaps: [],
    ...over,
  } as Parameters<typeof buildPrompt>[1]
}

// ── D10/D11/D12: what the brief now tells the round ──────────────────────────

describe('REQ-262 the brief teaches the three classes and direct filing', () => {
  /**
   * Normalised, because these are assertions about PROSE.
   *
   * Line wrapping and blockquote markers are LAYOUT. A phrase that moved across
   * a line break, or into a `>` block, has not been removed — and failing on
   * that teaches the next editor to fight the formatting rather than to keep
   * the rule.
   */
  const brief = (): string =>
    readBriefFile()
      .replace(/^\s*>\s?/gm, '')
      .replace(/\s+/g, ' ')

  it('test_UAT_FC_REQ_262_the_three_classes_are_the_primary_mandate', () => {
    // D11. The brief used to offer one flat list — "a serializer bug, a missing
    // L1 axis, a missing capture hint, or a region that needs promoting to
    // flow" — which collapses engine shortfall and L1 inexpressibility into
    // examples of each other and omits the renderer entirely. A round had no
    // vocabulary for "L1 says the right thing and the renderer disagrees", so
    // it could not report one.
    const text = brief()
    expect(text).toMatch(/engine shortfall/i)
    expect(text).toMatch(/L1 cannot express it/i)
    expect(text).toMatch(/renderer bug/i)

    // Class 2 is WIDER than "there is no axis" — the operator's correction. An
    // axis with no parameter for the variant, or a parameter that will not take
    // the value, is the same finding wearing a different hat.
    expect(text).toMatch(/no parameter for the variant/i)
    expect(text).toMatch(/enum is too narrow|too narrow/i)
    expect(text).toMatch(/validator refuses/i)

    // Class 3 is "wrong", not "missing" — also the operator's correction.
    expect(text).toMatch(/wrong place/i)
    expect(text).toMatch(/right at one viewport and wrong at another/i)

    // And they are distinguished by a TEST the round states, not by intuition.
    expect(text).toMatch(/three questions, in order/i)
    expect(text).toMatch(/1c page get/i)
    expect(text).toMatch(/state in the ticket which test you ran/i)
  })

  it('test_UAT_FC_REQ_262_defects_in_1c_are_secondary_to_the_three', () => {
    // D11's last clause. A bug in the console or the CLI is worth filing and
    // must never be folded into a gap ticket — but a round that files three of
    // them and names no residual class has missed what it is for, and the brief
    // has to say so or the easy findings will crowd out the hard ones.
    expect(brief()).toMatch(/secondary/i)
    expect(brief()).toMatch(/names no residual class has missed/i)
  })

  it('test_UAT_FC_REQ_262_the_round_is_told_to_file_its_own_tickets_at_draft', () => {
    // D10 and requirement 17. The brief's §1 used to open "You can read, and
    // that is all you can do" and §6 said "You do not run `xgd`" — both true of
    // [[REQ-256]] and both false since D7.
    const text = brief()
    expect(text).toMatch(/You can read, run `xgd`, and create tickets/i)
    expect(text).not.toMatch(/You do not run `xgd`/i)
    expect(text).toContain('xgd ticket create')
    // `request` for the gap: it asks for framework growth.
    expect(text).toMatch(/--type request/)
    // The one expensive mistake, named where the round will read it.
    expect(text).toMatch(/Never at any `ready_\*` status/i)
    expect(text).toMatch(/thirty seconds/i)
  })

  it('test_UAT_FC_REQ_262_the_ticket_is_unbounded_but_ordered_over_many_rounds', () => {
    // D12. No size limit — deferring a finding discards it. But the issues are
    // not independent, so a ticket demanding all of them at once can fail whole
    // where it would have succeeded in parts. Both halves have to be said, or
    // the round optimises one against the other.
    const text = brief()
    expect(text).toMatch(/no limit on the size of this ticket/i)
    expect(text).toMatch(/Deferring is losing/i)
    expect(text).toMatch(/not independent/i)
    expect(text).toMatch(/order them/i)
    expect(text).toMatch(/Landing the first three of five is a success/i)
  })

  it('test_UAT_FC_REQ_262_each_issue_says_how_the_implementer_sees_it', () => {
    // Requirement 16. The implementer is a fresh session that was not here. An
    // implementer that cannot reproduce the problem is reduced to trusting the
    // round's description of it — which is the reconstruction §2 forbids,
    // reached from the other end.
    const text = brief()
    expect(text).toMatch(/The command to run/i)
    expect(text).toMatch(/What a wrong result looks like/i)
    expect(text).toMatch(/What a right result looks like/i)

    // D9's flag travels with every browser-backed command, or the implementer
    // meets a FATAL and concludes the instrument is unavailable.
    expect(text).toContain('CHROMIUM_LAUNCH_ARGS=--single-process')
    expect(text).toMatch(/not\*?\*? a missing browser/i)
    expect(text).toMatch(/l1-gate`, `1c render`, `1c page get` and `1c refold` need no flag/i)
  })

  it('test_UAT_FC_REQ_262_the_outcome_block_reports_ids_not_ticket_bodies', () => {
    // The brief and the parser have to agree, or the round writes something the
    // console reads as a failure. This is the seam between the two documents,
    // so it is asserted across both rather than in either alone.
    const text = brief()
    expect(text).toContain('"ticketId"')
    expect(text).toContain('"bugTickets"')
    expect(text).toMatch(/You have already filed by this point/i)

    const filed = parseOutcome(
      '```json\n{"status":"filed","residualClass":"fold-x","ticketId":"REQ-263","bugTickets":["BUG-96"]}\n```',
    )
    expect(filed).toMatchObject({ status: 'filed', ticketId: 'REQ-263', bugTickets: ['BUG-96'] })
  })

  it('test_UAT_FC_REQ_262_the_brief_points_at_the_kb_rather_than_at_doc_ids', () => {
    // The old §8 cited [[DOC-19]] and [[DOC-17]] and delivered neither — the
    // round could not reach either one. They are files in the KB now, and the
    // brief says so rather than leaving a citation the round cannot follow.
    const text = brief()
    expect(text).toMatch(/knowledge base named in the round context carries these as ordinary files/i)
    expect(text).toContain('[[DOC-53]]')
    expect(text).toContain('[[DOC-19]]')
  })
})

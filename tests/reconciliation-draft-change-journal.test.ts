import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  existsSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { cmdNew, cmdPublish } from '../tools/generate/src/cli/commands'
import { run } from '../tools/generate/src/cli'
import {
  cmdApplyGapFixes,
  editAssetAdd,
  editAssetWrite,
  editChanges,
  editConfigSet,
  editCopySet,
  editL1Set,
  editPageAdd,
  editPaletteAdd,
  editPaletteSet,
} from '../tools/generate/src/cli/edit'
import { createL1Toolbox, L1_DECLARATION } from '../tools/generate/src/cli/ai/toolbox'
import {
  openSession,
  resetAiHost,
  sessionsDir,
  setModelClient,
  streamPrompt,
} from '../tools/generate/src/cli/ai/host'
import { JOURNAL_TEXT_LIMIT, JOURNAL_WINDOW, revisionDir } from '../tools/generate/src/store'
import type { ChangeSlice, JournalRecord } from '../tools/generate/src/store'
import type { L1Node } from '@1stcontact/site-schema'
import { fsOpts } from './support/site-factory'

/**
 * Reconciliation UATs for story-6cd17452 — **the draft change journal**.
 *
 * The draft is a shared mutable working copy with three writers: the client's
 * page editor, the assistant, and the operator's own tooling. Before this the
 * assistant's picture of a page was stale by default with no cheap way to find
 * out, so the only correct move was to re-read the whole page — 73 segments on a
 * real one — which is not affordable defensively on every turn of a multi-hour
 * session. The consequence of not doing it is that the assistant "improves" a
 * section the client just reworded and silently reverts them.
 *
 * The mechanism these cases prove is a monotone per-site COUNT plus a bounded
 * window of self-describing records, at three costs:
 *
 *   - "has anything changed?"  → no call at all (the per-turn reminder);
 *   - "what changed?"          → proportional to the change (one journal read);
 *   - "what is the page now?"  → the existing full reads, as the fallback.
 *
 * Nothing below stubs `edit.ts`, the store, the journal or the Toolbox. The
 * reminder case drives a real session manager and a real tool loop; the only
 * double in the file is the Anthropic client, which is the network.
 */

const SLUG = 'studio'
const HEADLINE = 'The old headline.'
/** The address of the seeded page's one text run: root list index, then child index. */
const HEADLINE_PATH = '0.0'

let cwd: string

const siteRoot = (slug = SLUG): string => path.join(cwd, 'storage', 'sites', slug)
const pagePath = (page = 'home', slug = SLUG): string =>
  path.join(siteRoot(slug), 'draft', 'pages', `${page}.json`)
const journalFile = (slug = SLUG): string => path.join(siteRoot(slug), '.journal.json')

/** A page with one addressable text run, so a copy edit has somewhere to land. */
function seedPage(text = HEADLINE, slug = SLUG): void {
  const home = JSON.parse(readFileSync(pagePath('home', slug), 'utf8'))
  home.l1.root = {
    kind: 'container',
    id: 'root',
    layout: 'stack',
    children: [{ kind: 'text', text, axes: { fontSizePx: 32 } }],
  } satisfies L1Node
  home.modules = []
  writeFileSync(pagePath('home', slug), JSON.stringify(home, null, 2))
}

/** Ask the journal the same question the assistant and the operator both ask. */
async function changes(since?: number, slug = SLUG): Promise<ChangeSlice> {
  return (await editChanges(slug, since, fsOpts(cwd))).data as ChangeSlice
}

const countNow = async (slug = SLUG): Promise<number> => (await changes(undefined, slug)).now

/** Every file under a directory, relative to it — for comparing two snapshots. */
function filesUnder(dir: string, base = dir): string[] {
  if (!existsSync(dir)) return []
  return readdirSync(dir)
    .flatMap((entry) => {
      const full = path.join(dir, entry)
      return statSync(full).isDirectory() ? filesUnder(full, base) : [path.relative(base, full)]
    })
    .sort()
}

interface CliResult {
  ok?: boolean
  data?: Record<string, unknown>
  error?: { code: string; message: string }
  exitCode: number
  out: string
}

/**
 * Drive the real `1c` entry point, exactly as `req117-copy-editing` does.
 *
 * `run` reads the working directory from the process, so the test supplies one
 * the way a shell would and restores it — along with the exit code the command
 * set — before returning. Both the raw text (what the operator reads) and the
 * parsed envelope (what a script reads) come back, so one helper serves the
 * human listing and the machine-readable form.
 */
async function cli(...argv: string[]): Promise<CliResult> {
  const prevCwd = process.cwd()
  const prevLog = console.log
  const prevErr = console.error
  const lines: string[] = []
  process.chdir(cwd)
  process.exitCode = 0
  console.log = (...a: unknown[]) => void lines.push(a.map(String).join(' '))
  console.error = (...a: unknown[]) => void lines.push(a.map(String).join(' '))
  try {
    await run(argv)
  } finally {
    console.log = prevLog
    console.error = prevErr
    process.chdir(prevCwd)
  }
  const exitCode = typeof process.exitCode === 'number' ? process.exitCode : 0
  process.exitCode = 0
  const out = lines.join('\n')
  let envelope: Partial<CliResult> = {}
  if (argv.includes('--json')) envelope = JSON.parse(lines[lines.length - 1]) as Partial<CliResult>
  return { ...envelope, exitCode, out }
}

// ── the counter: what every write hands back ─────────────────────────────────

describe('story-6cd17452 — the count is the whole mechanism', () => {
  beforeEach(() => {
    cwd = mkdtempSync(path.join(tmpdir(), 'journal-count-'))
    cmdNew(SLUG, { cwd })
    seedPage()
  })
  afterEach(() => rmSync(cwd, { recursive: true, force: true }))

  it('test_UAT_AC1253_accepted_write_raises_the_count_and_a_refusal_advances_nothing', async () => {
    // The count is what a caller HOLDS, so anything past it is by construction
    // somebody else's work. That only works if an accepted write moves it and a
    // refused one does not.
    const before = await countNow()

    const accepted = await editCopySet(SLUG, 'home', HEADLINE_PATH, { text: 'One.' }, fsOpts(cwd))
    expect(accepted.at).toBe(before + 1)
    expect((await changes(before)).changes).toHaveLength(1)

    // A refusal is thrown, not returned — so it carries no `at` at all, which is
    // the strongest form of "answers with no count". The write path validates the
    // whole resulting definition BEFORE touching disk, so nothing landed either.
    const draftBefore = readFileSync(pagePath(), 'utf8')
    await expect(
      editCopySet(SLUG, 'home', HEADLINE_PATH, { text: 42 }, fsOpts(cwd)),
    ).rejects.toMatchObject({ code: 'SCHEMA_INVALID' })

    expect(readFileSync(pagePath(), 'utf8')).toBe(draftBefore)
    expect(await countNow()).toBe(accepted.at)
    expect((await changes(accepted.at)).changes).toEqual([])
  })

  it('test_UAT_AC1254_a_write_that_changes_nothing_returns_the_current_count_and_records_nothing', async () => {
    // A no-op save from the modal must not look, to the assistant, exactly like
    // the client rewriting a heading. Only a write that ALTERS the draft counts.
    const written = await editCopySet(SLUG, 'home', HEADLINE_PATH, { text: 'Settled.' }, fsOpts(cwd))

    const noop = await editCopySet(SLUG, 'home', HEADLINE_PATH, { text: 'Settled.' }, fsOpts(cwd))
    expect(noop.human).toMatch(/No change/i)
    expect(noop.at).toBe(written.at)
    expect((await changes(written.at)).changes).toEqual([])

    // The same rule for a fix run that is asked to plan and not to apply.
    const dry = await cmdApplyGapFixes(SLUG, [], { ...fsOpts(cwd), apply: false })
    expect(dry.human).toMatch(/dry-run/)
    expect((dry.data as { applied: boolean }).applied).toBe(false)
    expect(dry.at).toBe(written.at)
    expect((await changes(written.at)).changes).toEqual([])
  })

  it('test_UAT_AC1255_every_write_shape_hands_its_count_back_including_the_ones_answering_with_an_asset', async () => {
    // AC-1255 holds only if EVERY write advances the caller's baseline. Two of
    // these answer with the ASSET they produced rather than with a `change`, and
    // it would be easy to leave them out on that basis — but then a session whose
    // last write was an upload would hold a stale count and be told next turn that
    // its own upload was somebody else's work.
    const opts = fsOpts(cwd)
    const shapes: Array<[string, () => Promise<{ at?: number }>]> = [
      ['a copy change', () => editCopySet(SLUG, 'home', HEADLINE_PATH, { text: 'Reworded.' }, opts)],
      ['a page-level change', () => editPageAdd(SLUG, 'about', { ...opts, title: 'About' })],
      ['a settings change', () => editConfigSet(SLUG, 'config', { businessName: 'Studio' }, opts)],
      ['a palette change', () => editPaletteAdd(SLUG, 'accent', '#2e86a3', opts)],
      ['an image registration', () => editAssetAdd(SLUG, 'logo.png', new Uint8Array([1, 2, 3]), opts)],
      [
        'an image generation',
        () =>
          editAssetWrite(SLUG, 'mark', '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"></svg>', {
            ...opts,
            alt: 'a mark',
          }),
      ],
    ]

    for (const [label, write] of shapes) {
      const before = await countNow()
      const out = await write()
      expect(out.at, label).toBe(before + 1)
    }

    // And the declaration SAYS so on every answer shape a write can produce, so
    // the model is told the field is there rather than having to notice it. A
    // returned field the manual never mentions is a field the model will not use.
    const declaredShapes = L1_DECLARATION.shapes as Record<string, Record<string, string>>
    for (const shape of ['change', 'palette_change', 'image', 'asset', 'publish_result']) {
      expect(declaredShapes[shape], shape).toHaveProperty('now')
      expect(declaredShapes[shape].now, shape).toMatch(/change count/i)
    }
    // And the manual a session is actually handed is projected from those shapes,
    // so the count is something the model is TOLD about rather than has to notice.
    const box = await createL1Toolbox(SLUG, { cwd })
    expect(box.manual()).toMatch(/change count/i)
  })

  it('test_UAT_AC1258_a_caller_advancing_its_baseline_never_sees_its_own_edits', async () => {
    // The reason no actor filtering is needed anywhere in this design: a caller
    // that advances its baseline as it writes has already absorbed its own work
    // into it. The arithmetic attributes; the actor field only explains.
    let baseline = await countNow()
    for (const text of ['A.', 'B.', 'C.']) {
      const out = await editCopySet(SLUG, 'home', HEADLINE_PATH, { text }, fsOpts(cwd))
      baseline = out.at as number
    }
    expect((await changes(baseline)).changes).toEqual([])

    // A DIFFERENT caller writes, and now exactly that one write is reported.
    await editCopySet(
      SLUG,
      'home',
      HEADLINE_PATH,
      { text: 'Theirs, not mine.' },
      { ...fsOpts(cwd), actor: 'client' },
    )

    const slice = await changes(baseline)
    expect(slice.changes).toHaveLength(1)
    expect(slice.changes[0].actor).toBe('client')
    expect(slice.changes[0].after).toBe('Theirs, not mine.')
  })
})

// ── what a record says, and how long it is kept ──────────────────────────────

describe('story-6cd17452 — a record says what happened, in words that outlive the address', () => {
  beforeEach(() => {
    cwd = mkdtempSync(path.join(tmpdir(), 'journal-records-'))
    cmdNew(SLUG, { cwd })
    seedPage()
  })
  afterEach(() => rmSync(cwd, { recursive: true, force: true }))

  it('test_UAT_AC1257_a_record_names_the_count_time_actor_operation_page_label_and_both_texts', async () => {
    // A record has to be readable by someone who was not there: when, who, what
    // kind, where, which thing, and what the words said on both sides of it.
    const before = await countNow()
    await editCopySet(
      SLUG,
      'home',
      HEADLINE_PATH,
      { text: 'A warmer welcome.' },
      { ...fsOpts(cwd), actor: 'client' },
    )

    const [record] = (await changes(before)).changes
    expect(record.at).toBe(before + 1)
    expect(new Date(record.ts).toISOString()).toBe(record.ts)
    expect(record.actor).toBe('client')
    expect(record.op).toBe('copy.set')
    expect(record.page).toBe('home')
    expect(record.label).toBe(HEADLINE) // the segment map's own label, not a second one
    expect(record.before).toBe(HEADLINE)
    expect(record.after).toBe('A warmer welcome.')
    expect(record.summary).toContain('home')

    // The three actors are distinguished, and an unattributed caller is recorded
    // as the operator's own tools rather than guessed at.
    const mid = await countNow()
    await editCopySet(SLUG, 'home', HEADLINE_PATH, { text: 'By the assistant.' }, { ...fsOpts(cwd), actor: 'ai' })
    await editCopySet(SLUG, 'home', HEADLINE_PATH, { text: 'By nobody in particular.' }, fsOpts(cwd))
    expect((await changes(mid)).changes.map((c) => c.actor)).toEqual(['ai', 'cli'])

    // A write that does not happen ON a page leaves `page` absent rather than
    // fabricating one.
    const beforePalette = await countNow()
    await editPaletteAdd(SLUG, 'accent', '#2e86a3', { ...fsOpts(cwd), actor: 'client' })

    const [palette] = (await changes(beforePalette)).changes
    expect(palette.page).toBeUndefined()
    expect(palette.at).toBe(beforePalette + 1)
    expect(palette.actor).toBe('client')
    expect(palette.op).toBe('palette.add')
    expect(palette.label).toContain('accent')
    expect(palette.after).toBe('#2e86a3')
    expect(palette.summary).toContain('#2e86a3')
  })

  it('test_UAT_AC1260_a_record_stays_readable_after_a_structural_change_invalidates_its_address', async () => {
    // THE reason records carry text rather than a pointer. An L1 address is
    // render-scoped: re-shape the tree and `0.0` means something else, or nothing.
    const before = await countNow()
    await editCopySet(
      SLUG,
      'home',
      HEADLINE_PATH,
      { text: 'Still here.' },
      { ...fsOpts(cwd), actor: 'client' },
    )

    // Insert a level so the address the record was taken against no longer
    // reaches what it reached.
    await editL1Set(
      SLUG,
      'home',
      '0',
      {
        kind: 'container',
        id: 'root',
        layout: 'row',
        children: [{ kind: 'box', children: [{ kind: 'text', text: 'Moved down a level.' }] }],
      },
      fsOpts(cwd),
    )

    const [copyEdit, structural] = (await changes(before)).changes
    // The address is recorded for orientation only, and is now unresolvable —
    // which is irrelevant, because nothing reads it to render the answer.
    expect(copyEdit.path).toBe(HEADLINE_PATH)
    expect(copyEdit.page).toBe('home')
    expect(copyEdit.label).toBe(HEADLINE)
    expect(copyEdit.before).toBe(HEADLINE)
    expect(copyEdit.after).toBe('Still here.')
    // And the structural write records the words on both sides of itself too.
    expect(structural.op).toBe('l1.set')
    expect(structural.page).toBe('home')
    expect(structural.before).toBe('Still here.')
    expect(structural.after).toBe('Moved down a level.')
  })

  it('test_UAT_AC1261_the_text_a_record_carries_is_bounded_and_visibly_cut', async () => {
    // One enormous paste must not make the journal expensive to read.
    const long = 'A'.repeat(JOURNAL_TEXT_LIMIT * 2)
    const longer = 'B'.repeat(JOURNAL_TEXT_LIMIT * 3)
    seedPage(long)

    const before = await countNow()
    await editCopySet(SLUG, 'home', HEADLINE_PATH, { text: longer }, fsOpts(cwd))

    const [cut] = (await changes(before)).changes
    for (const [side, value] of [
      ['before', cut.before!],
      ['after', cut.after!],
    ] as const) {
      expect(value.length, side).toBeLessThanOrEqual(JOURNAL_TEXT_LIMIT)
      expect(value.endsWith('…'), side).toBe(true)
    }
    // Still begins with the real text, so the cut costs length and not meaning.
    expect(cut.before!.startsWith(long.slice(0, 100))).toBe(true)
    expect(cut.after!.startsWith(longer.slice(0, 100))).toBe(true)

    // Text at or under the limit is carried whole and unmarked.
    const short = 'A short line.'
    const beforeShort = await countNow()
    await editCopySet(SLUG, 'home', HEADLINE_PATH, { text: short }, fsOpts(cwd))

    const [whole] = (await changes(beforeShort)).changes
    expect(whole.after).toBe(short)
    expect(whole.before).toBe(cut.after) // exactly what the previous record left behind
    expect(whole.after!.endsWith('…')).toBe(false)
  })

  it('test_UAT_AC1256_asking_since_the_current_count_is_the_cheap_nothing_happened_answer', async () => {
    // The call the assistant makes most often, and it has to be boring: an empty
    // slice, not an error.
    for (const text of ['One.', 'Two.', 'Three.']) {
      await editCopySet(SLUG, 'home', HEADLINE_PATH, { text }, fsOpts(cwd))
    }
    const now = await countNow()

    const quiet = await changes(now)
    expect(quiet.since).toBe(now)
    expect(quiet.now).toBe(now)
    expect(quiet.truncated).toBe(false)
    expect(quiet.changes).toEqual([])

    // No baseline at all means everything the window still retains, oldest first.
    const all = await changes()
    expect(all.since).toBe(0)
    expect(all.now).toBe(now)
    expect(all.changes.map((c) => c.at)).toEqual([1, 2, 3])
    expect(all.changes.map((c) => c.after)).toEqual(['One.', 'Two.', 'Three.'])
  })

  it(
    'test_UAT_AC1259_a_baseline_older_than_the_window_is_answered_truncated_with_what_remains',
    async () => {
      // The window is bounded, so the honest answer past its edge is "I cannot
      // tell you everything" — which routes the caller to a full re-read rather
      // than to a confident, incomplete list.
      const start = await countNow()
      for (let i = 0; i < JOURNAL_WINDOW + 3; i++) {
        await editCopySet(SLUG, 'home', HEADLINE_PATH, { text: `Take ${i}.` }, fsOpts(cwd))
      }

      const stale = await changes(start)
      expect(stale.truncated).toBe(true)
      expect(stale.now).toBe(start + JOURNAL_WINDOW + 3)
      expect(stale.changes).toHaveLength(JOURNAL_WINDOW) // whatever remains, still returned

      // A baseline the window can still reach back to is answered in full.
      const recent = await changes(stale.now - 2)
      expect(recent.truncated).toBe(false)
      expect(recent.changes).toHaveLength(2)

      // And a site nothing has ever been written to reports no truncation either.
      cmdNew('annex', { cwd })
      const untouched = await changes(0, 'annex')
      expect(untouched.truncated).toBe(false)
      expect(untouched.now).toBe(0)
      expect(untouched.changes).toEqual([])
    },
    180000,
  )
})

// ── degradation, and what the journal is NOT ─────────────────────────────────

describe('story-6cd17452 — the journal degrades, and is never a revision', () => {
  beforeEach(() => {
    cwd = mkdtempSync(path.join(tmpdir(), 'journal-degrade-'))
    cmdNew(SLUG, { cwd })
    seedPage()
  })
  afterEach(() => rmSync(cwd, { recursive: true, force: true }))

  it('test_UAT_AC1262_a_missing_or_unreadable_history_reads_as_nothing_and_never_fails_an_edit', async () => {
    // Correctness never depends on the journal existing. A corrupt one must
    // degrade to "I cannot tell you what changed" and never to "your edit failed".
    expect(existsSync(journalFile())).toBe(false)

    const empty = await changes()
    expect(empty.changes).toEqual([])
    expect(empty.now).toBe(0)
    expect(empty.truncated).toBe(false)

    const first = await editCopySet(SLUG, 'home', HEADLINE_PATH, { text: 'First.' }, fsOpts(cwd))
    expect(first.at).toBe(1)

    // Now make the retained history uninterpretable.
    writeFileSync(journalFile(), '{{{ this is not a journal', 'utf8')

    const degraded = await changes()
    expect(degraded.changes).toEqual([])
    expect(degraded.now).toBe(0)

    const after = await editCopySet(SLUG, 'home', HEADLINE_PATH, { text: 'Second.' }, fsOpts(cwd))
    expect(typeof after.at).toBe('number')
    expect(JSON.parse(readFileSync(pagePath(), 'utf8')).l1.root.children[0].text).toBe('Second.')
  })

  it(
    'test_UAT_AC1263_the_journal_is_not_a_revision_is_never_published_and_does_not_perturb_bytes',
    async () => {
      const history = (): { revisions: unknown[] } =>
        JSON.parse(readFileSync(path.join(siteRoot(), 'history.json'), 'utf8'))

      for (const text of ['One.', 'Two.', 'Three.']) {
        await editCopySet(SLUG, 'home', HEADLINE_PATH, { text }, fsOpts(cwd))
      }

      // Recording a change mints no revision id and adds no publish-history entry.
      expect(await countNow()).toBe(3)
      expect(existsSync(path.join(siteRoot(), 'revisions'))).toBe(false)
      expect(history().revisions).toEqual([])

      // It lives BESIDE the site, never inside `draft/`, so a snapshot cannot
      // capture it and it cannot perturb byte-identity.
      expect(existsSync(journalFile())).toBe(true)
      expect(existsSync(path.join(siteRoot(), 'draft', '.journal.json'))).toBe(false)

      const withJournal = await cmdPublish(SLUG, { cwd, message: 'with a journal' })
      const a = filesUnder(revisionDir({ cwd, root: 'sites' }, SLUG, withJournal.id))
      expect(a).toContain('site.json')
      expect(a).toContain(path.join('pages', 'home.json'))
      expect(a.some((f) => f.includes('journal'))).toBe(false)

      // AND REMOVING THE JOURNAL DOES NOT MAKE THE DRAFT LOOK CHANGED.
      //
      // This used to be asserted by publishing the same content twice and
      // comparing the two revision directories byte for byte. REQ-149 made an
      // unchanged publish a NO-OP, so there is no second directory to compare —
      // and the no-op is a sharper instrument for the same property: publish
      // diffs the draft against the live revision, so if the journal were part
      // of the definition, deleting it would show up as a change and mint r2.
      rmSync(journalFile())
      const withoutJournal = await cmdPublish(SLUG, { cwd, message: 'without a journal' })
      expect(withoutJournal.published).toBe(false)
      expect(withoutJournal.id).toBe(withJournal.id)
      expect(withoutJournal.changes).toEqual({ added: [], modified: [], removed: [] })
      expect(filesUnder(revisionDir({ cwd, root: 'sites' }, SLUG, withJournal.id))).toEqual(a)

      // And it is excluded from version control, so an edit leaves no tracked
      // working-tree modification beyond the draft content it changed.
      const ignore = readFileSync(
        path.join(path.dirname(new URL(import.meta.url).pathname), '..', '.gitignore'),
        'utf8',
      )
      expect(ignore).toContain('.journal.json')
    },
    180000,
  )
})

// ── the declared, granted, third-party-marked surface ────────────────────────

describe('story-6cd17452 — the change-reading operation is declared, granted and marked', () => {
  beforeEach(() => {
    cwd = mkdtempSync(path.join(tmpdir(), 'journal-surface-'))
    cmdNew(SLUG, { cwd })
    seedPage()
  })
  afterEach(() => rmSync(cwd, { recursive: true, force: true }))

  it('test_UAT_AC1264_the_operation_is_in_the_manual_of_a_session_granted_the_reading_group', async () => {
    // The surface declares; the grant selects. A session with the reading
    // capability is told about it; one without is never told it exists, so it
    // cannot propose it or apologise for it.
    const granted = await createL1Toolbox(SLUG, { cwd }, { config: { l1: { groups: ['ReadSite'] } } })

    expect(granted.toolNames()).toContain('list_changes')
    const manual = granted.manual() as string
    expect(manual).toContain('**list_changes**')
    expect(manual).toMatch(/changed on the site since you last looked, and who changed it/i)

    // The declaration places it in the reading group and gives it the optional
    // baseline the manual is projected from.
    const declared = (
      L1_DECLARATION.operations as Array<{
        op: string
        effect: string
        params?: Record<string, { type: string; required?: boolean; description?: string }>
      }>
    ).find((o) => o.op === 'list_changes')!
    expect(declared.effect).toBe('read')
    expect(declared.params!.since.required).not.toBe(true)
    expect(declared.params!.since.description).toMatch(/change count/i)
    const group = (L1_DECLARATION.groups as Array<{ group: string; operations: string[] }>).find(
      (g) => g.operations.includes('list_changes'),
    )!
    expect(group.group).toBe('ReadSite')

    // A session granted a different group only is never told, and cannot invoke.
    const ungranted = await createL1Toolbox(
      SLUG,
      { cwd },
      { config: { l1: { groups: ['AuthorPages'] } } },
    )
    expect(ungranted.toolNames()).not.toContain('list_changes')
    expect(ungranted.manual()).not.toContain('**list_changes**')

    const refusal = await ungranted.run('list_changes', { since: 0 })
    expect(refusal).toMatch(/not enabled/i)
  })

  it('test_UAT_AC1265_the_change_log_comes_back_marked_untrusted', async () => {
    // The journal is the client's own prose — the very words they typed — re-
    // entering the model's context, which is squarely an injection vector.
    await editCopySet(
      SLUG,
      'home',
      HEADLINE_PATH,
      { text: 'Words a person typed.' },
      { ...fsOpts(cwd), actor: 'client' },
    )

    const declared = (
      L1_DECLARATION.operations as Array<{ op: string; returns?: { provenance?: string } }>
    ).find((o) => o.op === 'list_changes')!
    expect(declared.returns?.provenance).toBe('untrusted')

    const box = await createL1Toolbox(SLUG, { cwd }, { config: { l1: { groups: ['ReadSite'] } } })
    const answer = (await box.run('list_changes', { since: 0 })) as string

    // Delivered under the same untrusted-provenance handling every other
    // third-party payload receives.
    expect(answer).toContain('<<<untrusted>>>')
    expect(answer).toContain('<<</untrusted>>>')
    expect(answer).toContain('Words a person typed.')
  })
})

// ── the push signal, through a real session ──────────────────────────────────

/**
 * A client that records what it was sent and answers with a scripted sequence.
 *
 * The ONE double in this file, and it is the network: the backend's own client
 * seam. It speaks the provider's streaming shape (`stream: true`) because that
 * is what the backend asks for and what its accumulator reassembles from —
 * everything on this side of it (the tool loop, the tool handlers, the session
 * store, the reminder channel, the journal) is the real thing.
 */
type ModelStep = () => AsyncGenerator<Record<string, unknown>>

function scriptedClient(steps: ModelStep[]) {
  const seen: { system: string }[] = []
  let index = 0
  return {
    seen,
    messages: {
      create: async (req: { system: string }) => {
        seen.push(req)
        const step = steps[Math.min(index, steps.length - 1)]
        index += 1
        return step()
      },
    },
  }
}

/** One prose reply, as the provider streams it. */
const says = (text: string): ModelStep =>
  async function* () {
    yield { type: 'content_block_start', index: 0, content_block: { type: 'text', text: '' } }
    yield { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text } }
    yield { type: 'content_block_stop', index: 0 }
  }

/** One tool call, with its input arriving as the provider fragments it. */
const calls = (name: string, input: Record<string, unknown>): ModelStep =>
  async function* () {
    yield {
      type: 'content_block_start',
      index: 0,
      content_block: { type: 'tool_use', id: `call-${name}`, name },
    }
    yield {
      type: 'content_block_delta',
      index: 0,
      delta: { type: 'input_json_delta', partial_json: JSON.stringify(input) },
    }
    yield { type: 'content_block_stop', index: 0 }
  }

describe('story-6cd17452 — a session is TOLD when the site moved under it', () => {
  beforeEach(() => {
    cwd = mkdtempSync(path.join(tmpdir(), 'journal-signal-'))
    cmdNew(SLUG, { cwd })
    seedPage()
    rmSync(sessionsDir({ cwd }), { recursive: true, force: true })
    resetAiHost()
  })
  afterEach(() => {
    setModelClient(null)
    resetAiHost()
    rmSync(cwd, { recursive: true, force: true })
  })

  /** Run one turn to completion, draining the stream so the turn has finished. */
  async function turn(sessionId: string, text: string): Promise<void> {
    const drained: unknown[] = []
    for await (const event of streamPrompt(sessionId, text, { cwd })) drained.push(event)
    expect(drained.length).toBeGreaterThan(0)
  }

  it(
    'test_UAT_AC1266_the_reminder_carries_the_change_signal_only_when_somebody_else_moved_the_site',
    async () => {
      // Through the real host: a real session manager, the real reminder channel,
      // the real tool loop, the real journal on disk. Only the Anthropic client is
      // a double, because it is the network.
      //
      // One conversation, five turns, so all three halves of the criterion are
      // observed on the SAME session rather than on three that cannot be compared:
      //   1  quiet                          → no signal
      //   2  quiet, nothing moved between   → no signal
      //   3  after the client edits         → signal, naming 1 change and a baseline
      //   4  the assistant itself writes    → (two model calls: the tool, then the reply)
      //   5  nobody else moved anything     → no signal; its own write was absorbed
      const client = scriptedClient([
        says('Right.'),
        says('Right.'),
        says('Noted — I will look before I touch anything.'),
        calls('set_l1', {
          page: 'home',
          path: HEADLINE_PATH,
          node: { kind: 'text', text: 'Mine, not theirs.', axes: { fontSizePx: 32 } },
        }),
        says('Done — the heading now reads "Mine, not theirs."'),
        says('Nothing else to do.'),
      ])
      setModelClient(client)

      const { sessionId } = await openSession(SLUG, { cwd })

      // A quiet turn says nothing about changes. A reminder that reported
      // "nothing happened" every turn is one that gets skimmed on the turn
      // something did.
      await turn(sessionId, 'hello')
      expect(client.seen[0].system).not.toMatch(/list_changes with since/)

      // Two turns with no intervening edit at all: still the plain reminder.
      await turn(sessionId, 'still nothing')
      expect(client.seen[1].system).not.toMatch(/list_changes with since/)

      // Now the client edits their own site between two of the session's turns.
      const theirs = await editCopySet(
        SLUG,
        'home',
        HEADLINE_PATH,
        { text: 'I rewrote this myself.' },
        { ...fsOpts(cwd), actor: 'client' },
      )

      await turn(sessionId, 'make the heading bigger')

      // The signal rides the system channel, names how much moved, and carries the
      // baseline to ask from — so the assistant never has to have remembered one.
      const primed = client.seen[2].system
      expect(primed).toMatch(/changed this site since your last turn — 1 change\b/)
      expect(primed).toMatch(/list_changes with since: \d+/)
      expect(primed).toContain('never write over a change you have not read')

      const since = Number(/list_changes with since: (\d+)/.exec(primed)![1])
      const slice = await changes(since)
      expect(slice.changes).toHaveLength(1)
      expect(slice.changes[0].at).toBe(theirs.at)
      expect(slice.changes[0].actor).toBe('client')
      expect(slice.changes[0].after).toBe('I rewrote this myself.')

      // A turn in which the ASSISTANT writes and nobody else does.
      await turn(sessionId, 'rename the heading')
      expect(JSON.parse(readFileSync(pagePath(), 'utf8')).l1.root.children[0].text).toBe(
        'Mine, not theirs.',
      )

      // Its own write is absorbed — the baseline is recorded after the turn — so
      // the next turn is never told its own work was somebody else's.
      await turn(sessionId, 'anything else?')
      const following = client.seen[client.seen.length - 1].system
      expect(following).not.toMatch(/list_changes with since/)
      expect(following).not.toMatch(/changed this site since your last turn/)
    },
    180000,
  )
})

// ── the operator asks the same question from the command line ────────────────

describe('story-6cd17452 — one implementation, two callers', () => {
  beforeEach(() => {
    cwd = mkdtempSync(path.join(tmpdir(), 'journal-cli-'))
    cmdNew(SLUG, { cwd })
    seedPage()
  })
  afterEach(() => rmSync(cwd, { recursive: true, force: true }))

  it(
    'test_UAT_AC1267_the_operator_gets_a_readable_listing_from_the_command_line',
    async () => {
      await editCopySet(
        SLUG,
        'home',
        HEADLINE_PATH,
        { text: 'A warmer welcome.' },
        { ...fsOpts(cwd), actor: 'client' },
      )

      const listing = await cli('changes', SLUG)
      expect(listing.exitCode).toBe(0)
      expect(listing.out).toContain('now: 1')
      // One line carrying the count, who made it, the operation, the page and the
      // label — with the words beneath it.
      expect(listing.out).toMatch(/1\s+client\s+copy\.set on 'home'\s+The old headline\./)
      expect(listing.out).toContain(`"${HEADLINE}" → "A warmer welcome."`)

      // A baseline equal to the current count prints an explicit line rather than
      // nothing at all.
      const quiet = await cli('changes', SLUG, '--since', '1')
      expect(quiet.exitCode).toBe(0)
      expect(quiet.out).toContain('now: 1')
      expect(quiet.out).toContain('(nothing has changed)')

      // Driven past the retained window, it says so rather than answering half.
      for (let i = 0; i < JOURNAL_WINDOW + 2; i++) {
        await editCopySet(SLUG, 'home', HEADLINE_PATH, { text: `Take ${i}.` }, fsOpts(cwd))
      }
      const truncated = await cli('changes', SLUG, '--since', '0')
      expect(truncated.exitCode).toBe(0)
      expect(truncated.out).toContain('(older changes are no longer retained)')

      // A slug with no draft exits non-zero with a not-found error naming it.
      const missing = await cli('changes', 'ghost')
      expect(missing.exitCode).not.toBe(0)
      expect(missing.out).toMatch(/NOT_FOUND/)
      expect(missing.out).toContain("Site 'ghost' has no draft.")
    },
    180000,
  )

  it('test_UAT_AC1268_the_same_command_in_machine_readable_form_returns_the_whole_slice', async () => {
    await editCopySet(
      SLUG,
      'home',
      HEADLINE_PATH,
      { text: 'A warmer welcome.' },
      { ...fsOpts(cwd), actor: 'client' },
    )
    await editPaletteAdd(SLUG, 'accent', '#2e86a3', { ...fsOpts(cwd), actor: 'client' })

    const answer = await cli('changes', SLUG, '--since', '0', '--json')
    expect(answer.exitCode).toBe(0)
    expect(answer.ok).toBe(true)

    const slice = answer.data as unknown as ChangeSlice
    expect(slice.since).toBe(0)
    expect(slice.now).toBe(2)
    expect(slice.truncated).toBe(false)

    // Oldest first, and the copy edit carries every field a reader needs.
    expect(slice.changes.map((c: JournalRecord) => c.at)).toEqual([1, 2])
    const [copyEdit, palette] = slice.changes
    expect(copyEdit).toMatchObject({
      at: 1,
      actor: 'client',
      op: 'copy.set',
      page: 'home',
      label: HEADLINE,
      before: HEADLINE,
      after: 'A warmer welcome.',
    })
    expect(new Date(copyEdit.ts).toISOString()).toBe(copyEdit.ts)
    expect(typeof copyEdit.summary).toBe('string')
    // A write that did not happen on a page carries no page rather than a made-up one.
    expect(palette.op).toBe('palette.add')
    expect(palette.page).toBeUndefined()

    // Asking since the current count yields the same structure with an empty list.
    const quiet = await cli('changes', SLUG, '--since', '2', '--json')
    const empty = quiet.data as unknown as ChangeSlice
    expect(empty).toMatchObject({ since: 2, now: 2, truncated: false, changes: [] })
  })
})

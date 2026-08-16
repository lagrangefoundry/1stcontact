import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { mkdtempSync, existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { cmdNew } from '../tools/generate/src/cli/commands'
import {
  editChanges,
  editCopySet,
  editL1Set,
  editPaletteAdd,
  editPaletteSet,
} from '../tools/generate/src/cli/edit'
import { startBuilder, type BuilderHandle } from '../tools/generate/src/cli/builder'
import { resetAiHost, sessionsDir, setModelClient } from '../tools/generate/src/cli/ai/host'
import { createL1Toolbox, L1_DECLARATION } from '../tools/generate/src/cli/ai/toolbox'
import { JOURNAL_WINDOW } from '../tools/generate/src/store'
import type { ChangeSlice } from '../tools/generate/src/store'
import type { L1Node } from '@1stcontact/site-schema'
import { fsOpts } from './support/site-factory'

/**
 * REQ-131 — **the draft change journal**.
 *
 * The failure this exists to prevent is specific: the operator rewords a
 * section in the page editor, the assistant later "improves" that section, and
 * their words are gone. Nothing in the product could see that coming, because
 * the only way to know a page had moved was to re-read it — 73 segments on a
 * real page (DOC-28 §6.3), which is not affordable defensively on every turn of
 * a 4–5 hour session (DOC-33 §4).
 *
 * So the evidence below is about three costs, not about one more way to edit:
 *
 * - "has anything changed?" costs NO tool call — it is pushed in the per-turn
 *   reminder, and absent when the answer is no;
 * - "what changed?" costs the size of the CHANGE;
 * - "what is the page now?" — the existing reads — stays the fallback, taken
 *   when the journal says it can no longer answer.
 *
 * Nothing here stubs `edit.ts`, the store or the Toolbox. The last case drives a
 * real builder origin with a real session manager and a real tool loop; the only
 * double in the file is the Anthropic client, which is the network.
 */

const SLUG = 'studio'
const HEADLINE = 'The old headline.'
const HEADLINE_PATH = '0.0'

let cwd: string

const pagePath = (page = 'home'): string =>
  path.join(cwd, 'storage', 'sites', SLUG, 'draft', 'pages', `${page}.json`)

/** A page with one addressable text run, so a copy edit has somewhere to land. */
function seedPage(): void {
  const home = JSON.parse(readFileSync(pagePath(), 'utf8'))
  home.l1.root = {
    kind: 'container',
    id: 'root',
    layout: 'stack',
    children: [{ kind: 'text', text: HEADLINE, axes: { fontSizePx: 32 } }],
  } satisfies L1Node
  home.modules = []
  writeFileSync(pagePath(), JSON.stringify(home, null, 2))
}

async function changes(since?: number): Promise<ChangeSlice> {
  return (await editChanges(SLUG, since, fsOpts(cwd))).data as ChangeSlice
}

// ── the counter ──────────────────────────────────────────────────────────────

describe('REQ-131 — every write advances a count, and a refusal does not', () => {
  beforeEach(async () => {
    cwd = mkdtempSync(path.join(tmpdir(), 'req131-counter-'))
    cmdNew(SLUG, { cwd })
    seedPage()
  })
  afterEach(() => rmSync(cwd, { recursive: true, force: true }))

  it('test_UAT_FC_REQ_131_a_write_returns_a_higher_count_and_a_refusal_returns_none', async () => {
    // AC-1. The count is the whole mechanism: it is what a caller holds so that
    // anything past it is, by construction, somebody else's work.
    const first = await editCopySet(SLUG, 'home', HEADLINE_PATH, { text: 'One.' }, fsOpts(cwd))
    const second = await editCopySet(SLUG, 'home', HEADLINE_PATH, { text: 'Two.' }, fsOpts(cwd))

    expect(first.at).toBeGreaterThan(0)
    expect(second.at).toBeGreaterThan(first.at as number)

    // A refused write is refused BEFORE a byte lands, so there is nothing to
    // record and nothing to count. An address that resolves to nothing is the
    // cheapest way to reach that path honestly.
    await expect(editCopySet(SLUG, 'home', '9.9.9', { text: 'nope' }, fsOpts(cwd))).rejects.toThrow()

    expect((await changes()).now).toBe(second.at)
    expect((await changes(second.at)).changes).toEqual([])
  })

  it('test_UAT_FC_REQ_131_asking_since_the_current_count_is_the_cheap_nothing_happened_answer', async () => {
    // AC-2. An empty slice, not an error — this is the call the assistant makes
    // most often and it has to be boring.
    const write = await editCopySet(SLUG, 'home', HEADLINE_PATH, { text: 'Only me.' }, fsOpts(cwd))

    const slice = await changes(write.at)
    expect(slice.changes).toEqual([])
    expect(slice.now).toBe(write.at)
    expect(slice.truncated).toBe(false)
    expect(slice.since).toBe(write.at)
  })

  it('test_UAT_FC_REQ_131_a_caller_reading_its_own_count_back_never_sees_its_own_edits', async () => {
    // AC-4, and the reason no actor filtering is needed anywhere in this design:
    // a caller that advances its baseline as it writes has already absorbed its
    // own work into it. The arithmetic attributes; the actor field only explains.
    let baseline = (await changes()).now
    for (const text of ['A.', 'B.', 'C.']) {
      const out = await editCopySet(SLUG, 'home', HEADLINE_PATH, { text }, fsOpts(cwd))
      expect((await changes(baseline)).changes).toHaveLength(1) // exactly the one just made
      baseline = out.at as number
    }
    expect((await changes(baseline)).changes).toEqual([])
  })

  it('test_UAT_FC_REQ_131_the_journal_is_not_a_revision_and_is_not_committed', async () => {
    // It lives beside the site, never inside `draft/` — so it cannot be captured
    // by a snapshot or perturb byte-identity — and it is gitignored, because a
    // record of every keystroke-settle is not something a checkout should carry.
    await editCopySet(SLUG, 'home', HEADLINE_PATH, { text: 'Written.' }, fsOpts(cwd))

    const siteRoot = path.join(cwd, 'storage', 'sites', SLUG)
    expect(existsSync(path.join(siteRoot, '.journal.json'))).toBe(true)
    expect(existsSync(path.join(siteRoot, 'draft', '.journal.json'))).toBe(false)
    // No revision was created, and `history.json` never heard about any of this.
    expect(existsSync(path.join(siteRoot, 'revisions'))).toBe(false)
    const ignore = readFileSync(
      path.join(path.dirname(new URL(import.meta.url).pathname), '..', '.gitignore'),
      'utf8',
    )
    expect(ignore).toContain('.journal.json')
  })
})

// ── what a record says ───────────────────────────────────────────────────────

describe('REQ-131 — a record says what happened, in words that outlive the address', () => {
  beforeEach(async () => {
    cwd = mkdtempSync(path.join(tmpdir(), 'req131-records-'))
    cmdNew(SLUG, { cwd })
    seedPage()
  })
  afterEach(() => rmSync(cwd, { recursive: true, force: true }))

  it('test_UAT_FC_REQ_131_a_client_copy_edit_records_the_page_a_label_and_both_texts', async () => {
    // AC-3. The record has to be readable by someone who was not there: the page
    // it happened on, something to recognise the thing by, and what the words
    // said before and after.
    const before = (await changes()).now
    await editCopySet(
      SLUG,
      'home',
      HEADLINE_PATH,
      { text: 'A warmer welcome.' },
      { ...fsOpts(cwd), actor: 'client' },
    )

    const [record] = (await changes(before)).changes
    expect(record.actor).toBe('client')
    expect(record.page).toBe('home')
    expect(record.label).toBe(HEADLINE) // the segment map's own label, not a second one
    expect(record.before).toBe(HEADLINE)
    expect(record.after).toBe('A warmer welcome.')
    expect(record.summary).toContain('home')
  })

  it('test_UAT_FC_REQ_131_a_record_survives_the_structural_change_that_invalidates_its_address', async () => {
    // AC-6. THE reason records carry text rather than a pointer. An L1 address is
    // render-scoped (DOC-28 §5.2): re-shape the tree and `0.0` means something
    // else, or nothing. The record still reads.
    const before = (await changes()).now
    await editCopySet(SLUG, 'home', HEADLINE_PATH, { text: 'Still here.' }, { ...fsOpts(cwd), actor: 'client' })

    // Now replace the whole root with a differently-shaped tree, so the address
    // the record was taken against no longer reaches what it reached.
    await editL1Set(
      SLUG,
      'home',
      '0',
      {
        kind: 'container',
        id: 'root',
        layout: 'row',
        children: [
          { kind: 'box', children: [{ kind: 'text', text: 'Moved down a level.' }] },
        ],
      },
      fsOpts(cwd),
    )

    const [copyEdit, structural] = (await changes(before)).changes
    // Unresolvable now — and irrelevant, because nothing reads it to render the
    // answer.
    expect(copyEdit.path).toBe(HEADLINE_PATH)
    expect(copyEdit.before).toBe(HEADLINE)
    expect(copyEdit.after).toBe('Still here.')
    // The replacement records the words on both sides of itself too.
    expect(structural.op).toBe('l1.set')
    expect(structural.before).toBe('Still here.')
    expect(structural.after).toBe('Moved down a level.')
  })

  it('test_UAT_FC_REQ_131_writes_beyond_the_page_tree_are_recorded_too', async () => {
    // The journal covers the whole write surface, not only copy: an operator who
    // repaints the site between turns has changed it just as much.
    const before = (await changes()).now
    await editPaletteAdd(SLUG, 'primary', '#2e86a3', { ...fsOpts(cwd), actor: 'client' })
    await editPaletteSet(SLUG, 'primary', '#101822', { ...fsOpts(cwd), actor: 'client' })

    const [added, set] = (await changes(before)).changes
    expect(added.op).toBe('palette.add')
    expect(added.after).toBe('#2e86a3')
    expect(set.op).toBe('palette.set')
    expect(set.before).toBe('#2e86a3')
    expect(set.after).toBe('#101822')
  })

  it('test_UAT_FC_REQ_131_an_over_old_baseline_says_so_rather_than_answering_half', async () => {
    // AC-5. The window is bounded, so the honest answer past its edge is "I
    // cannot tell you everything" — which routes the caller to a full read
    // rather than to a confident, incomplete list.
    const start = (await changes()).now
    for (let i = 0; i < JOURNAL_WINDOW + 5; i++) {
      await editCopySet(SLUG, 'home', HEADLINE_PATH, { text: `Take ${i}.` }, fsOpts(cwd))
    }

    const stale = await changes(start)
    expect(stale.truncated).toBe(true)
    expect(stale.changes.length).toBe(JOURNAL_WINDOW) // whatever remains, still returned
    expect(stale.now).toBe(start + JOURNAL_WINDOW + 5)

    // A baseline INSIDE the window is answered in full, as normal.
    const recent = await changes(stale.now - 2)
    expect(recent.truncated).toBe(false)
    expect(recent.changes).toHaveLength(2)
  })
})

// ── the declared surface ─────────────────────────────────────────────────────

describe('REQ-131 — the operation is declared, granted, and marked third-party', () => {
  beforeEach(async () => {
    cwd = mkdtempSync(path.join(tmpdir(), 'req131-surface-'))
    cmdNew(SLUG, { cwd })
    seedPage()
  })
  afterEach(() => rmSync(cwd, { recursive: true, force: true }))

  it('test_UAT_FC_REQ_131_the_operation_is_in_the_manual_of_a_session_granted_ReadSite', async () => {
    // AC-7, both halves. The surface declares; the grant selects. A session with
    // the reading capability is told about it; one without is never told it
    // exists, so it cannot propose it or apologise for it.
    const granted = await createL1Toolbox(SLUG, { cwd }, { config: { l1: { groups: ['ReadSite'] } } })
    expect(granted.toolNames()).toContain('list_changes')
    expect(granted.manual()).toContain('**list_changes**')

    const ungranted = await createL1Toolbox(
      SLUG,
      { cwd },
      { config: { l1: { groups: ['AuthorPages'] } } },
    )
    expect(ungranted.toolNames()).not.toContain('list_changes')
    expect(ungranted.manual()).not.toContain('**list_changes**')
  })

  it('test_UAT_FC_REQ_131_the_journal_comes_back_marked_untrusted', async () => {
    // AC-8. A journal is the operator's own prose — the very words they typed —
    // re-entering the model's context. DOC-30 S5 names exactly this, and the
    // `inproc` default would have marked it trusted.
    await editCopySet(SLUG, 'home', HEADLINE_PATH, { text: 'Words a person typed.' }, { ...fsOpts(cwd), actor: 'client' })

    const box = await createL1Toolbox(SLUG, { cwd })
    // `await`, because `Toolbox.run` is async in the shared library. It reads as
    // a detail and is not one: it is what `toolbox.ts` says makes `publish`
    // unhostable, and that note is now out of date.
    const answer = await box.run('list_changes', { since: 0 })

    expect(answer).toContain('<<<untrusted>>>')
    expect(answer).toContain('Words a person typed.')

    const declared = (L1_DECLARATION.operations as { op: string; returns?: { provenance?: string } }[])
      .find((o) => o.op === 'list_changes')!
    expect(declared.returns?.provenance).toBe('untrusted')
  })

  it('test_UAT_FC_REQ_131_a_write_hands_its_resulting_count_back_to_the_caller', async () => {
    // The half that makes AC-4 reachable from a tool session: a caller advances
    // its own baseline as it writes, with no second call to ask where it is.
    const box = await createL1Toolbox(SLUG, { cwd })
    const answer = (await box.run('set_l1', {
      page: 'home',
      path: HEADLINE_PATH,
      node: { kind: 'text', text: 'Mine.' },
    })) as string
    const written = JSON.parse(
      answer.replace(/^<<<untrusted>>>\n/, '').replace(/\n<<<\/untrusted>>>$/, ''),
    ) as { now: number }

    expect(written.now).toBeGreaterThan(0)
    expect((await changes(written.now)).changes).toEqual([])
  })

  it('test_UAT_FC_REQ_131_every_write_hands_the_count_back_including_the_ones_that_answer_with_an_asset', async () => {
    // AC-4 holds only if EVERY write advances the caller's baseline. Two of them
    // answer with the thing they wrote rather than with a `change`, and it would
    // be easy to leave them out on that basis — but a session whose last write
    // was an upload would then hold a stale count and be told, next turn, that
    // its own upload was somebody else's work. That is precisely the false alarm
    // the counter exists to make impossible, so the shape of the answer must not
    // decide whether the count travels with it.
    const box = await createL1Toolbox(SLUG, { cwd })
    const unwrap = (a: string): Record<string, unknown> =>
      JSON.parse(a.replace(/^<<<untrusted>>>\n/, '').replace(/\n<<<\/untrusted>>>$/, ''))

    const drawn = unwrap(
      (await box.run('write_image', {
        name: 'mark',
        svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1 1"></svg>',
      })) as string,
    ) as { now: number }
    expect(drawn.now).toBeGreaterThan(0)
    expect((await changes(drawn.now)).changes).toEqual([])

    // And the declaration says so, so the model is told the field is there
    // rather than having to notice it. A returned field the manual never
    // mentions is a field the model will not use.
    const shapes = L1_DECLARATION.shapes as Record<string, Record<string, string>>
    for (const shape of ['change', 'palette_change', 'image', 'asset', 'publish_result']) {
      expect(shapes[shape], shape).toHaveProperty('now')
    }
  })
})

// ── the push signal ──────────────────────────────────────────────────────────

/** A client that records what it was sent and answers with scripted text. */
function scriptedClient(replies: string[]) {
  const seen: { system: string }[] = []
  let index = 0
  return {
    seen,
    messages: {
      create: async (req: { system: string }) => {
        seen.push(req)
        const text = replies[Math.min(index, replies.length - 1)]
        index += 1
        return { content: [{ type: 'text', text }] }
      },
    },
  }
}

describe('REQ-131 — a session is TOLD when the site moved under it', () => {
  let builder: BuilderHandle
  let base: string

  beforeAll(async () => {
    cwd = mkdtempSync(path.join(tmpdir(), 'req131-signal-'))
    cmdNew(SLUG, { cwd })
    seedPage()
    builder = await startBuilder({ cwd })
    base = builder.url
  }, 180000)

  afterAll(async () => {
    await builder.close()
    rmSync(cwd, { recursive: true, force: true })
  })

  beforeEach(async () => {
    rmSync(sessionsDir({ cwd }), { recursive: true, force: true })
    resetAiHost()
  })

  afterEach(() => setModelClient(null))

  async function turn(sessionId: string, text: string): Promise<void> {
    const res = await fetch(`${base}api/ai/prompt`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ sessionId, text }),
    })
    expect(res.status).toBe(200)
    await res.text() // drain the stream, so the turn has finished before we assert
  }

  it('test_UAT_FC_REQ_131_the_reminder_carries_the_signal_only_when_something_changed', async () => {
    // AC-9, both halves, through the real host: a real session manager, the real
    // reminder channel, the real journal on disk.
    const client = scriptedClient(['Right.'])
    setModelClient(client)

    const opened = await fetch(`${base}api/ai/session`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ slug: SLUG }),
    })
    const { sessionId } = (await opened.json()) as { sessionId: string }

    await turn(sessionId, 'hello')
    // A quiet turn says nothing about changes. A reminder that reported "nothing
    // happened" every turn is a reminder that gets skimmed on the turn something
    // did.
    expect(client.seen[0].system).not.toMatch(/list_changes with since/)

    // The operator edits their own site between turns — through the SAME route
    // the builder's modal posts to, so this is the real second producer and not
    // a simulation of one.
    const save = await fetch(`${base}api/copy`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        slug: SLUG,
        page: 'home',
        path: HEADLINE_PATH,
        values: { text: 'I rewrote this myself.' },
      }),
    })
    expect(save.status).toBe(200)

    await turn(sessionId, 'make the heading bigger')

    // The signal rides the system channel, names how much moved, and carries the
    // baseline to ask from — so the assistant never has to have remembered one.
    const primed = client.seen[1].system
    expect(primed).toMatch(/changed this site since your last turn — 1 change\b/)
    expect(primed).toMatch(/list_changes with since: \d+/)
    expect(primed).toContain('never write over a change you have not read')
  })
})

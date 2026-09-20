import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { rmSync } from 'node:fs'
import { editCopySet } from '../tools/generate/src/cli/edit'
import { publishSite } from '../tools/generate/src/publish/publish'
import {
  openSession,
  resetAiHost,
  sessionsDir,
  setModelClient,
  streamPrompt,
} from '../tools/generate/src/cli/ai/host'
import { sharedModuleUrl } from '../tools/generate/src/cli/webui'
import {
  openSession as openSessionCore,
  streamPrompt as streamPromptCore,
  type HostDeps,
} from '../tools/generate/src/cli/ai/host-core'
import { collectSiteDigest, siteDigestSource } from '../tools/generate/src/cli/ai/digest-core'
import type { SiteDigest } from '../tools/generate/src/cli/ai/digest-core'
import { ledgerEntries } from '../tools/generate/src/cli/ai/ledger-core'
import type { LedgerDeps, LedgerRecord, LedgerState } from '../tools/generate/src/cli/ai/ledger-core'
import { makeFsSite, fsOpts } from './support/site-factory'
import type { SiteFixture } from './support/site-factory'
import { calls, says, scriptedClient, turnTailText } from './support/scripted-model-client'

/**
 * [[BUG-128]] — **the per-turn state summary may not lag the session's own
 * writes.**
 *
 * The consultant's report: *"The state summary I'm handed at the start of each
 * turn says the draft is at change 113. It's actually at 117 … `list_changes` is
 * accurate — I checked against it — but the summary that arrives unprompted
 * isn't, and that's the one designed to catch this."* [[REQ-285]] built that
 * summary because the session was confabulating state; a summary that can be
 * behind is the same failure with the system's authority behind it.
 *
 * WHAT WAS ACTUALLY WRONG, and it is two different things:
 *
 *   1. A REAL CACHE DEFECT. The derivation was cached against
 *      `SiteStore.version`, defended as *"bumped by every write, so a cache
 *      keyed on it cannot be stale by construction"*. The version moves on a
 *      draft `write` and on nothing else — a journal record and a publish both
 *      move state the digest REPORTS while leaving the key still, so the digest
 *      went on quoting a superseded change count and a superseded publication
 *      state for as long as nobody touched the draft.
 *   2. A PROMISE NOBODY HAD WRITTEN DOWN. A digest is assembled when the turn
 *      begins, so what the session writes DURING a turn is legitimately not in
 *      it. That is not a defect, but a session told only *"read off the site a
 *      moment ago"* cannot tell that case from case 1 — which is exactly the
 *      position the consultant was in. So the entry now says what it is as of,
 *      and names the instrument that closes the gap.
 *
 * THE CLAIMS:
 *
 *   1. A write that moves the change counter without applying a draft change is
 *      in the next turn's digest.
 *   2. A publish, which touches the draft not at all, is in the next turn's
 *      digest.
 *   3. Generically: after ANY write, the next turn's digest equals what a fresh
 *      derivation would produce. Asserted over the write paths rather than over
 *      one of them, because the defect was a key that covered one of three.
 *   4. The digest names the change it was derived from, and `list_changes`
 *      agrees with that number — the comparison the consultant had to make by
 *      hand is one the entry now invites.
 *   5. It says it is as of the start of the turn, so a disagreement with
 *      `list_changes` reads as the passage of the turn rather than as a lie.
 *   6. The engagement record carries a decision recorded on the previous turn —
 *      the second half of the report, which is in a different store and shares
 *      none of the cache above.
 */

type Untyped = any // eslint-disable-line @typescript-eslint/no-explicit-any

let site: SiteFixture

beforeEach(() => {
  site = makeFsSite()
  rmSync(sessionsDir({ cwd: site.cwd! }), { recursive: true, force: true })
  resetAiHost()
})

afterEach(() => {
  setModelClient(null)
  resetAiHost()
  site.dispose?.()
})

/** The digest source as the host builds it — one per manager, read per turn. */
function perTurnDigest(fixture: SiteFixture): () => Promise<SiteDigest | null> {
  return siteDigestSource(fixture.slug, fsOpts(fixture.cwd!))
}

// ── 1–3: every write is in the next turn's digest ────────────────────────────

describe('BUG-128 — the digest cannot be behind the store it is read from', () => {
  it('test_UAT_FC_BUG-128_a_journal_record_alone_is_in_the_next_turns_digest', async () => {
    const digest = perTurnDigest(site)
    const before = (await digest())!

    // THE WRITE THE OLD KEY COULD NOT SEE. `appendChange` moves `counter` and
    // nothing else — it is what a builder edit, an AI turn and a structured-edit
    // command all end with — so a cache keyed on the draft's write version was
    // serving a superseded count for as long as the draft itself held still.
    await site.store.appendChange(site.slug, {
      op: 'copy.set',
      actor: 'client',
      summary: 'The client changed the headline in the builder.',
      page: 'home',
    })

    const after = (await digest())!
    expect(after.counter).toBe(before.counter + 1)
    expect(after.counter).toBe(await site.store.counter(site.slug))
  })

  it('test_UAT_FC_BUG-128_a_publish_alone_is_in_the_next_turns_digest', async () => {
    const digest = perTurnDigest(site)
    const before = (await digest())!
    expect(before.live).toBeNull()

    // A publish freezes a revision and re-parents the draft. It changes no page,
    // so the draft's write version does not move — and "what the public can see"
    // is half of what this entry exists to tell the session.
    const published = await publishSite(site.store, site.slug, { message: 'first' })

    const after = (await digest())!
    expect(after.live).toBe(published.id)
    expect(after.pending).toBe(0)
  })

  /**
   * The three ways this site's state moves, as the digest reports them.
   *
   * GENERIC OVER THE WRITE PATHS AND NOT ASSERTED AGAINST ONE. The defect was a
   * key that happened to cover the first of these; a test written against the
   * first would have passed throughout. What has to hold is the promise itself —
   * the next turn's digest is what a fresh derivation would produce — and it has
   * to hold for every way the store moves, including ones added later.
   */
  const WRITES: { name: string; run: (fixture: SiteFixture) => Promise<void> }[] = [
    {
      name: 'a draft change, applied and journalled',
      run: async (fixture) => {
        await editCopySet(
          fixture.slug,
          'home',
          '0.0',
          { text: 'We have baked here since 1974.' },
          { ...fsOpts(fixture.cwd!), actor: 'client' },
        )
      },
    },
    {
      name: 'a journal record with no draft change under it',
      run: async (fixture) => {
        await fixture.store.appendChange(fixture.slug, {
          op: 'palette.set',
          actor: 'client',
          summary: 'The client changed the palette in the builder.',
        })
      },
    },
    {
      name: 'a publish, which touches the draft not at all',
      run: async (fixture) => {
        await publishSite(fixture.store, fixture.slug, { message: 'first' })
      },
    },
  ]

  for (const write of WRITES) {
    it(`test_UAT_FC_BUG-128_the_next_turns_digest_is_a_fresh_derivation_after_${write.name.replace(/[^a-z]+/gi, '_')}`, async () => {
      const digest = perTurnDigest(site)
      // The turn before the write — whatever the source keeps, it keeps it now.
      await digest()

      await write.run(site)

      // THE PROMISE, STATED AS AN ASSERTION RATHER THAN AS PROSE. The module
      // header claimed the derivation was authoritative because it was read back
      // out of the store on the turn it is delivered. This is that claim: what
      // the next turn is handed is what deriving it from scratch would produce.
      const served = await digest()
      const fresh = await collectSiteDigest(site.slug, fsOpts(site.cwd!))
      expect(served).toEqual(fresh)
    })
  }
})

// ── 4–5: the digest says what it is as of ────────────────────────────────────

describe('BUG-128 — the digest says what state it was derived from', () => {
  it('test_UAT_FC_BUG-128_the_change_it_names_is_the_one_list_changes_reports', async () => {
    await editCopySet(
      site.slug,
      'home',
      '0.0',
      { text: 'Fresh bread, every single morning' },
      { ...fsOpts(site.cwd!), actor: 'client' },
    )

    const facts = await collectSiteDigest(site.slug, fsOpts(site.cwd!))
    const slice = await site.store.changesSince(site.slug)

    // THE STAMP IS THE COUNTER, and there is deliberately no second number: a
    // stamp that could disagree with the count the entry already quotes would be
    // one more thing to distrust. What it buys is that the session can CHECK —
    // `list_changes` takes this number, and the consultant's own hand-made
    // comparison is the one the entry now invites.
    expect(facts.counter).toBe(slice.now)
    expect(facts.counter).toBeGreaterThan(0)
  })

  it('test_UAT_FC_BUG-128_it_tells_the_session_the_number_is_as_the_turn_began', async () => {
    await editCopySet(
      site.slug,
      'home',
      '0.0',
      { text: 'Fresh bread, every single morning' },
      { ...fsOpts(site.cwd!), actor: 'client' },
    )
    const client = scriptedClient([says('Right.')])
    setModelClient(client)
    const { sessionId } = await openSession(site.slug, { cwd: site.cwd! })
    for await (const event of streamPrompt(sessionId, 'what has happened', { cwd: site.cwd! })) {
      void event
    }

    const at = await site.store.counter(site.slug)
    const tail = turnTailText(client.seen[0])
    // The number, as REQ-285 delivered it…
    expect(tail).toContain(`The draft stands at change ${at}.`)
    // …and what it is as of, which is the part the consultant had to work out.
    // A digest that is a snapshot and does not say so is indistinguishable from
    // one that is wrong.
    expect(tail).toContain('when this turn began')
    expect(tail).toContain(`list_changes`)
  })
})

// ── 6: the other half of the report — the engagement record ──────────────────

/**
 * A host that keeps its record in memory — the port, implemented, not mocked.
 *
 * The Worker keeps the ledger in the session's `chat` ticket and the `1c` CLI
 * keeps none at all; the port exists precisely so that *"a host that keeps its
 * record somewhere other than a `chat` ticket implements the same port"*. This
 * is that host. Everything above it is the real thing: the real ledger surface,
 * the real numbering, the real provider, the real per-turn assembly.
 */
function memoryLedger(): LedgerDeps & { body: () => string } {
  let body = ''
  let title = ''
  let note = ''
  const state = (): LedgerState => ({ entries: ledgerEntries(body).length, title, note })
  return {
    body: () => body,
    append: async (render: (index: number) => string): Promise<LedgerState> => {
      const entry = render(ledgerEntries(body).length + 1)
      body = body.trim() === '' ? entry : `${body.replace(/\s+$/, '')}\n\n${entry}`
      return state()
    },
    rename: async (name: string): Promise<LedgerState> => {
      title = name
      return state()
    },
    setNote: async (text: string): Promise<LedgerState> => {
      note = text
      return state()
    },
    read: async (): Promise<LedgerRecord> => ({ body, title, note }),
  }
}

describe('BUG-128 — the engagement record is no more behind than the site is', () => {
  it('test_UAT_FC_BUG-128_a_decision_recorded_last_turn_is_in_this_turns_record', async () => {
    const lib = (await import(/* @vite-ignore */ sharedModuleUrl('ai'))) as Untyped
    const ledger = memoryLedger()
    const deps: HostDeps = {
      lib: lib as HostDeps['lib'],
      store: site.store,
      archive: new lib.NullArchive(),
      junctions: lib.memoryJunctions(),
      apiKey: 'test-key',
      // The deployment that HAS somewhere to keep a record.
      ledger: () => ledger,
    } as unknown as HostDeps

    const client = scriptedClient([
      // Turn one: the session settles something and records it, through the real
      // ledger surface and the real tool loop.
      calls('record_decision', {
        decision: 'The bakery site keeps a single page for now.',
        because: 'There is one thing to say and a second page would dilute it.',
        rejected: 'A separate About page, which had nothing in it that the home page lacks.',
      }),
      says('Noted.'),
      // Turn two: nothing is written, and the record it is handed must already
      // hold what turn one wrote.
      says('Right.'),
    ])
    setModelClient(client)
    const opened = await openSessionCore(site.slug, { cwd: site.cwd! }, deps)
    for await (const event of streamPromptCore(
      opened.sessionId,
      'one page is enough',
      { cwd: site.cwd! },
      deps,
    )) {
      void event
    }
    for await (const event of streamPromptCore(
      opened.sessionId,
      'what did we settle',
      { cwd: site.cwd! },
      deps,
    )) {
      void event
    }

    // It landed at all — otherwise the assertion below would pass against a
    // record that is empty on both turns.
    expect(ledgerEntries(ledger.body())).toHaveLength(1)

    // THE TURN AFTER IT WAS WRITTEN CARRIES IT. Two unrelated stores lagging by
    // exactly one turn was the reason to suspect a second mechanism behind the
    // site half's cache; there is none. The record is read out of the store on
    // the turn it is delivered, and this is what says so.
    const second = turnTailText(client.seen[client.seen.length - 1])
    expect(second).toContain('The bakery site keeps a single page for now.')
    expect(second).toContain('1 decision in this engagement')
    // And it says what it is as of, for the reason the site half does.
    expect(second).toContain('when this turn began')
  })
})

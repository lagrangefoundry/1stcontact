import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import worker from '../apps/control-app/src/index'
import type { Env } from '../apps/control-app/src/index'
import { resetChatHost } from '../apps/control-app/src/router'
import { resetAiHost, setModelClient } from '../tools/generate/src/cli/ai/host-core'
import { pacedClient, says, scriptedClient } from './support/scripted-model-client'
import { applySchema } from './support/d1-site-factory'
import { nextSlug, siteSeed } from './support/site-seed'

/**
 * BUG-64 — **the composer is not gated on a turn that is not running**.
 *
 * WHAT THE OPERATOR SAW. Open the builder, pick a site, and the chat panel is
 * already showing its STOP button with nothing invoked. Type a message: the
 * bubble appears and nothing answers it. No error, no activity, no reply — and
 * no recovery except waiting out ten minutes or reloading into the same state.
 *
 * WHAT IT WAS. `openSession` reports `live` — "a turn is open at this cursor,
 * so reattach". `storedTranscript` derived it as
 * `closedPrefix(records).length !== records.length`, and `closedPrefix` returns
 * a COUNT. `.length` on a number is `undefined`, `undefined !== n` is always
 * true, and so **every session reported a turn in flight**, from the first
 * moment it existed. The library is loaded untyped, so nothing objected.
 *
 * WHY THE PANEL THEN WENT SILENT rather than merely wasting a request. It did
 * as it was told: reattached, and put its composer into the streaming state a
 * turn in progress calls for. `mountChat` submits with
 * `streaming ? queue(md) : send(md)` — so what the operator typed was QUEUED
 * behind the phantom turn, which is the bubble with no reply. The tail it was
 * queued behind was reading a quiet junction, so it returned only when `watch`'s
 * own `timeoutMs` elapsed: ten minutes of a chat that takes input and does
 * nothing with it.
 *
 * WHY BUG-46's SUITE PASSED OVER IT. Every test there reads the flag DURING a
 * paced turn, where the answer should be true — so a value that is
 * unconditionally true was indistinguishable from a correct one. The gap was
 * never `live: true` mid-turn; it was that nothing anywhere asked what it said
 * when no turn was running.
 *
 * SO THE SUITE ASSERTS BOTH DIRECTIONS. A flag that is always true and a flag
 * that is always false are both wrong, and only one of them is this bug —
 * pinning the quiet case alone would leave the fix one `false` away from
 * silently undoing BUG-46.
 *
 * AND IT PINS THE EMPTY CASE SEPARATELY, because that one was never broken and
 * explains why the report reads the way it does. A site nobody has talked to
 * takes `storedTranscript`'s null path and never reaches the derivation at all,
 * so the operator meets this on the SECOND page load and every one after it, not
 * on a fresh site — which is why it presents as "the builder is like this" rather
 * than as something a particular action caused.
 *
 * The apparatus is BUG-46's, deliberately: the real session manager, junction, D1
 * ticket store and SSE framing, with only the Anthropic client doubled.
 */

const TENANT = 'bug64'

function workerEnv(overrides: Partial<Env> = {}): Env {
  return {
    DB: env.DB,
    SITES: env.SITES,
    BLOBS: env.BLOBS as R2Bucket,
    TENANT_ID: TENANT,
    ACCESS_DEV_OPEN: '1',
    ACCESS_TEAM_DOMAIN: '',
    ACCESS_AUD: '',
    ANTHROPIC_API_KEY: 'test-key-not-a-real-one',
    ASSETS: {
      fetch: async () => new Response('asset', { status: 200 }),
    } as unknown as Fetcher,
    ...overrides,
  }
}

const post = (path: string, body: unknown): Promise<Response> =>
  worker.fetch(
    new Request(`https://app.example/${path.replace(/^\//, '')}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }),
    workerEnv(),
    { waitUntil: () => {}, passThroughOnException: () => {}, props: {} } as unknown as ExecutionContext,
  )

interface Opened {
  sessionId: string
  turns: { role: string; markdown: string }[]
  cursor: number
  live: boolean
  ready: boolean
}

/** What `/api/ai/session` answers for `slug` — the call a page load makes. */
async function openSession(slug: string): Promise<Opened> {
  const res = await post('/api/ai/session', { slug })
  expect(res.status).toBe(200)
  return (await res.json()) as Opened
}

async function seedSite(slug: string): Promise<void> {
  const seed = siteSeed({ slug })
  const res = await post('/api/import', {
    slug: seed.slug,
    siteJson: seed.siteJson as Record<string, unknown>,
    pages: Object.entries(seed.pages).map(([name, page]) => ({
      name,
      page: page as Record<string, unknown>,
    })),
    assets: [] as { name: string; base64: string }[],
  })
  expect(res.status).toBe(200)
}

/** Read one SSE body to the end. Every turn here is meant to finish. */
async function drain(response: Response): Promise<void> {
  await response.text()
}

describe('BUG-64 a quiet session does not claim a turn is running', () => {
  beforeAll(async () => {
    await applySchema(env.DB)
  })

  afterEach(() => {
    setModelClient(null)
    resetAiHost()
    resetChatHost()
  })

  it('test_UAT_FC_BUG-64_a_freshly_opened_session_is_not_live', async () => {
    // THE ONE CASE THAT WAS NEVER BROKEN, pinned because it is what made the bug
    // confusing to describe. A site nobody has talked to has no junction and no
    // archive entry, so `storedTranscript` returns null and `live` takes its
    // `?? false` default — the broken derivation was never reached. The symptom
    // therefore did not appear on a brand-new site; it appeared from the second
    // page load onward, on any conversation with a single turn in it.
    //
    // This test does not fail on the unfixed code and is not meant to. It is the
    // boundary that says the fix did not move the empty case. The evidence that
    // fails before it is the three below.
    const slug = nextSlug('quiet')
    await seedSite(slug)

    const opened = await openSession(slug)

    expect(opened.live).toBe(false)
    // The rest of the projection is unchanged and says so: an empty conversation
    // that is ready to take a turn, not a broken one.
    expect(opened.turns).toEqual([])
    expect(opened.ready).toBe(true)
  })

  it('test_UAT_FC_BUG-64_a_session_whose_turn_has_finished_is_not_live', async () => {
    // THE CASE THE OPERATOR ACTUALLY MEETS, once they have used the builder at
    // all: a conversation with history, reopened between turns. The junction now
    // holds records — which is exactly the condition the broken derivation
    // mistook for an open turn, since ANY records made its comparison true.
    const slug = nextSlug('settled')
    await seedSite(slug)
    const { sessionId } = await openSession(slug)

    setModelClient(scriptedClient([says('Done — the heading now reads differently.')]))
    await drain(await post('/api/ai/prompt', { sessionId, text: 'Change the heading.' }))

    const reopened = await openSession(slug)

    // The turn is closed. `turn_end` is on the junction, the record stream ends
    // at a closed boundary, and there is nothing to rejoin.
    expect(reopened.live).toBe(false)
    // AND THE HISTORY IS THERE, which is what makes the assertion above about
    // this flag rather than about an empty log: the records the fold read are
    // the ones the broken comparison was reading too.
    expect(reopened.turns.map((t) => t.role)).toEqual(['user', 'assistant'])
    expect(reopened.turns[0].markdown).toBe('Change the heading.')
  })

  it('test_UAT_FC_BUG-64_a_session_read_during_a_turn_is_still_live', async () => {
    // THE OTHER DIRECTION, and the reason it is here. "Always false" fixes this
    // ticket and silently undoes BUG-46 — a reload mid-turn would stop rejoining
    // and go back to showing a reply frozen mid-sentence. The flag has to be an
    // answer, not a constant, so both constants are excluded.
    //
    // Paced, because the state under test exists only between `turn_start` and
    // `turn_end`: a model that answers in one go never produces it.
    const slug = nextSlug('inflight')
    await seedSite(slug)
    const { sessionId } = await openSession(slug)

    const model = pacedClient('I have started editing. ', 'And now I am finished.')
    setModelClient(model)
    const turn = await post('/api/ai/prompt', { sessionId, text: 'Change the heading.' })
    const reader = turn.body!.getReader()
    // Pull the first frame, so the turn is demonstrably open before it is read.
    await reader.read()

    const midTurn = await openSession(slug)
    expect(midTurn.live).toBe(true)
    // The cursor is what makes that flag actionable — the two are consumed
    // together or not at all.
    expect(midTurn.cursor).toBeGreaterThan(0)

    model.release()
    await reader.cancel()
  })

  it('test_UAT_FC_BUG-64_the_flag_returns_to_false_after_the_turn_it_was_true_for', async () => {
    // ONE SESSION, BOTH ANSWERS, in order. The two tests above could each be
    // satisfied by a different constant; only watching the value CHANGE over a
    // single conversation shows it tracking the turn. This is the whole property
    // in one place, and it is the sequence a real page load walks through.
    const slug = nextSlug('cycle')
    await seedSite(slug)
    const { sessionId } = await openSession(slug)

    expect((await openSession(slug)).live).toBe(false)

    const model = pacedClient('Working on it. ', 'All done.')
    setModelClient(model)
    const turn = await post('/api/ai/prompt', { sessionId, text: 'Change the heading.' })
    const reader = turn.body!.getReader()
    await reader.read()

    expect((await openSession(slug)).live).toBe(true)

    model.release()
    // Drain to the end, so `turn_end` has actually been written before the read
    // below — the flag is about that record, so reading ahead of it would be
    // asserting a race rather than the fix.
    for (;;) {
      const { done } = await reader.read()
      if (done) break
    }

    expect((await openSession(slug)).live).toBe(false)
  })
})

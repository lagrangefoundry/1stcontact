import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import worker from '../apps/control-app/src/index'
import type { Env } from '../apps/control-app/src/index'
import { resetChatHost } from '../apps/control-app/src/router'
import { resetAiHost, setModelClient } from '../tools/generate/src/cli/ai/host-core'
import { says, scriptedClient } from './support/scripted-model-client'
import { applySchema, seedTenantSite } from './support/d1-site-factory'
import { nextSlug } from './support/site-seed'

/**
 * BUG-138 — **the origin hands the panel the moment each turn happened**.
 *
 * THE ORIGIN'S HALF. The panel suite beside this one proves that a turn carrying
 * its moment is stamped, and that day separators land where the calendar days
 * change. None of that can happen if the moment never reaches the browser — and
 * it did not. `storedTranscript` mapped the folded session's turns to
 * `{role, markdown}` and dropped `ts` on the floor, so `/api/ai/session`'s
 * transcript was a list of turns with no times in it at all, and `ChatTurn` had
 * nowhere to put one even if it had been kept.
 *
 * WHY THE VALUE IS WORTH PROVING RATHER THAN ASSUMING. It is carried, never
 * computed, across four handoffs: the transcript markup's `ts="…"`, the records a
 * resume seeds a junction from, the fold that projects turns out of them, and
 * this mapping. A test that asserted merely "the field is present" would pass on
 * a host that stamped it with `Date.now()` at read time — which is the defect
 * wearing the fix's clothes, because the whole complaint is a history dated by
 * the reload. So what is asserted is that the moment is the TURN's: it is inside
 * the window the turn actually ran in, and it survives a re-read unchanged.
 *
 * The one double is the Anthropic client, as in every chat-host suite here. The
 * session manager, the junction, the archive, the D1 ticket store and the routes
 * are the real thing.
 */

const TENANT = 'bug138'

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
  )

interface OpenedSession {
  sessionId: string
  turns: { role: string; markdown: string; ts?: string }[]
  cursor: number
  live: boolean
}

const openSession = async (site: string): Promise<OpenedSession> =>
  (await (await post('/api/ai/session', { site })).json()) as OpenedSession

/** Run a whole turn and drain its stream, so the transcript is closed. */
async function ask(sessionId: string, text: string): Promise<void> {
  const response = await post('/api/ai/prompt', { sessionId, text })
  expect(response.status).toBe(200)
  await response.text()
}

describe('BUG-138 — the session carries when each turn happened', () => {
  beforeAll(async () => {
    await applySchema(env.DB)
  })

  afterEach(() => {
    setModelClient(null)
    resetAiHost()
    resetChatHost()
  })

  it('test_UAT_FC_BUG-138_every_turn_of_the_stored_transcript_carries_its_own_moment', async () => {
    setModelClient(scriptedClient([says('The fold is on the left now.'), says('Smaller.')]))
    const { site } = await seedTenantSite(TENANT, { slug: nextSlug('when') })
    const { sessionId } = await openSession(site)

    // The window the conversation actually happened in. Every moment reported
    // has to fall inside it — which is what distinguishes a carried timestamp
    // from one invented at read time by a clock that would also be "now-ish".
    const before = Date.now()
    await ask(sessionId, 'Rebuild the recursion diagram.')
    await ask(sessionId, 'Make the caption smaller.')
    const after = Date.now()

    const reopened = await openSession(site)
    // Both halves of both turns — the prompt's moment comes off its `turn_start`,
    // the reply's off its first delta, and before this fix neither reached here.
    expect(reopened.turns.map((t) => t.role)).toEqual([
      'user',
      'assistant',
      'user',
      'assistant',
    ])
    for (const turn of reopened.turns) {
      expect(typeof turn.ts).toBe('string')
      const ms = Date.parse(turn.ts as string)
      expect(Number.isNaN(ms)).toBe(false)
      // WITHIN THE TURN'S OWN WINDOW. A second's grace on each side, because the
      // moments are recorded by the library's clock and read by this test's.
      expect(ms).toBeGreaterThanOrEqual(before - 1000)
      expect(ms).toBeLessThanOrEqual(after + 1000)
    }
    // AND IN ORDER, which is what makes the panel's day-boundary rule — compare
    // each turn's day to the one before it — mean anything at all.
    const order = reopened.turns.map((t) => Date.parse(t.ts as string))
    expect([...order].sort((a, b) => a - b)).toEqual(order)
  })

  it('test_UAT_FC_BUG-138_re_reading_the_session_reports_the_same_moments', async () => {
    // THE RELOAD, WHICH IS THE WHOLE COMPLAINT. A moment computed when the
    // session is read would be a different number on every read, and a
    // conversation opened tomorrow would claim to have happened tomorrow. The
    // value is the turn's, so two reads report the same thing.
    setModelClient(scriptedClient([says('Started.')]))
    const { site } = await seedTenantSite(TENANT, { slug: nextSlug('again') })
    const { sessionId } = await openSession(site)
    await ask(sessionId, 'Start the site.')

    const first = await openSession(site)
    // ASSERTED BEFORE THE COMPARISON, because "the same on both reads" is also
    // true of a field that is absent on both — which is exactly the state before
    // this fix, and the one shape of pass that would prove nothing.
    expect(first.turns.length).toBeGreaterThan(0)
    for (const turn of first.turns) {
      expect(typeof turn.ts).toBe('string')
      expect(Number.isNaN(Date.parse(turn.ts as string))).toBe(false)
    }

    // A FRESH HOST, not merely a second call — this is what a reload is on the
    // origin side, and it is the path that re-seeds the junction from the
    // archived transcript's `ts="…"` markers rather than reading RAM.
    resetAiHost()
    resetChatHost()
    const second = await openSession(site)

    expect(second.turns.map((t) => t.ts)).toEqual(first.turns.map((t) => t.ts))
    expect(second.turns.map((t) => t.markdown)).toEqual(first.turns.map((t) => t.markdown))
  })
})

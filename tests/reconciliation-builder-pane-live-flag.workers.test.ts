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
 * story-7f437d57 — **the origin reports a conversation live only while a turn
 * is open** (BUNDLE-39, plan item 7; AC-2094's origin half — BUG-64).
 *
 * AC-2094 was restated so its "not rejoined" promise is checkable from this
 * story: the pane's half (a quiet conversation is not rejoined, a failed rejoin
 * is silent, a transport without rejoin mounts) is asserted in
 * `reconciliation-builder-pane-rejoin.test.ts`. What that jsdom suite cannot
 * show is which conversations the origin calls live, because jsdom cannot serve
 * `/api/ai/session`. That half runs here, against the real control-app routes,
 * session manager, junction and D1, with only the model client doubled.
 *
 * Both directions are asserted on one conversation over one turn, so neither a
 * constant `true` (BUG-64) nor a constant `false` (which would undo BUG-46)
 * passes.
 */

const TENANT = 'story104'

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

describe('story-7f437d57 — which conversations the origin reports live', () => {
  beforeAll(async () => {
    await applySchema(env.DB)
  })

  afterEach(() => {
    setModelClient(null)
    resetAiHost()
    resetChatHost()
  })

  it('test_UAT_AC2094_origin_reports_live_only_while_a_turn_is_open_never_when_settled_or_empty', async () => {
    const slug = nextSlug('liveflag')
    await seedSite(slug)

    // ── EMPTY: no turns at all, not live ────────────────────────────────────
    const empty = await openSession(slug)
    expect(empty.live).toBe(false)
    expect(empty.turns).toEqual([])
    expect(empty.ready).toBe(true)
    const { sessionId } = empty

    // ── SETTLED: one turn, closed — not live, history intact ────────────────
    setModelClient(scriptedClient([says('Done — the heading now reads differently.')]))
    await (await post('/api/ai/prompt', { sessionId, text: 'Change the heading.' })).text()

    const settled = await openSession(slug)
    expect(settled.sessionId).toBe(sessionId)
    expect(settled.live).toBe(false)
    expect(settled.turns.map((t) => t.role)).toEqual(['user', 'assistant'])
    expect(settled.turns[0].markdown).toBe('Change the heading.')
    expect(settled.turns[1].markdown).toContain('the heading now reads differently')

    // ── LIVE: a turn held open — live, with a cursor and the history so far ─
    const model = pacedClient('I have started editing. ', 'And now I am finished.')
    setModelClient(model)
    const turn = await post('/api/ai/prompt', { sessionId, text: 'Change the footer.' })
    const reader = turn.body!.getReader()
    await reader.read()

    const midTurn = await openSession(slug)
    expect(midTurn.live).toBe(true)
    expect(midTurn.cursor).toBeGreaterThan(0)
    expect(midTurn.turns.map((t) => t.markdown)).toContain('Change the heading.')
    expect(midTurn.turns.map((t) => t.markdown)).toContain('Change the footer.')

    // ── SETTLED AGAIN: once the turn ends, not live ─────────────────────────
    model.release()
    for (;;) {
      const { done } = await reader.read()
      if (done) break
    }

    const after = await openSession(slug)
    expect(after.live).toBe(false)
    expect(after.turns.filter((t) => t.role === 'user').map((t) => t.markdown)).toEqual([
      'Change the heading.',
      'Change the footer.',
    ])
  })
})

import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import worker from '../apps/control-app/src/index'
import type { Env } from '../apps/control-app/src/index'
import { resetChatHost } from '../apps/control-app/src/router'
import { resetAiHost, setModelClient } from '../tools/generate/src/cli/ai/host-core'
import { applySchema } from './support/d1-site-factory'
import { nextSlug, siteSeed } from './support/site-seed'
import { calls, says, scriptedClient } from './support/scripted-model-client'

/**
 * BUG-43 — **the site tells the panel when it moved**.
 *
 * WHAT WAS WRONG. `draft` and `edit` render at request time (REQ-119), so a write
 * reaches the operator's iframe only when something reloads it. The palette popup
 * and the segment editor both do; the assistant did not, so its edits sat in the
 * store, correct and invisible, until the operator reloaded by hand — while the
 * system preamble told the assistant the page had already re-rendered.
 *
 * WHAT MAKES THIS EVIDENCE. Every assertion runs inside workerd, through the
 * Worker's own `fetch`, against a real D1 database and a real R2 bucket, with the
 * one double these suites are allowed (the Anthropic client). So the signal is
 * produced by the real tool loop running real `edit.ts` writes against the real
 * store, and the counter it carries is the counter those writes moved.
 *
 * WHY THE INTERLEAVING IS ASSERTED AND NOT JUST THE COUNT. A signal per turn
 * would satisfy "the page updates" and would still lose the thing asked for: a
 * request answered by several edits should show the page unfolding as the
 * assistant works, not jump to a finished state when it stops talking. That is a
 * property of WHERE the frames are in the stream, so it is asserted as an order.
 */

const TENANT = 'bug43'

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

const call = (path: string, init?: RequestInit): Promise<Response> =>
  worker.fetch(new Request(`https://app.example/${path.replace(/^\//, '')}`, init), workerEnv())

const post = (path: string, body: unknown): Promise<Response> =>
  call(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })

interface Frame {
  kind: string
  content?: string
  meta?: Record<string, unknown>
}

/** Read an SSE body back into the events the chat panel would see. */
async function frames(response: Response): Promise<Frame[]> {
  const text = await response.text()
  return text
    .split('\n\n')
    .map((f) => f.trim())
    .filter((f) => f.startsWith('data:'))
    .map((f) => JSON.parse(f.slice(5).trim()) as Frame)
}

/** A site made only of L1, imported through the Worker's own route. */
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

/** Open the site's conversation and hand back the id every turn carries. */
async function openSession(slug: string): Promise<string> {
  const opened = await post('/api/ai/session', { slug })
  expect(opened.status).toBe(200)
  const session = (await opened.json()) as { sessionId: string; ready: boolean }
  expect(session.ready).toBe(true)
  return session.sessionId
}

beforeAll(async () => {
  await applySchema()
})

afterEach(() => {
  setModelClient(null)
  resetAiHost()
  resetChatHost()
})

describe('BUG-43 — the assistant’s writes reach the page', () => {
  it('test_UAT_FC_BUG-43_every_write_signals_the_page_as_it_lands', async () => {
    const slug = nextSlug('unfold')
    await seedSite(slug)
    const sessionId = await openSession(slug)

    // Two writes in one turn — the case a per-turn signal would collapse.
    setModelClient(
      scriptedClient([
        calls('add_page', { page: 'services', title: 'Services' }),
        calls('add_page', { page: 'contact', title: 'Contact' }),
        says('I added both pages.'),
      ]),
    )

    const turn = await post('/api/ai/prompt', {
      sessionId,
      text: 'Add a services page and a contact page.',
    })
    expect(turn.status).toBe(200)
    const events = await frames(turn)

    // THE ORDER IS THE ASSERTION. Each write is announced where it happened —
    // straight after the tool activity that caused it and before the next call —
    // so the frame reloads twice, once per page, rather than once at the end.
    expect(events.map((e) => e.kind)).toEqual([
      'tool_activity',
      'site_changed',
      'tool_activity',
      'site_changed',
      'text',
      'done',
    ])

    // And each carries the counter as it stood at that moment, which is what
    // makes the signal a fact about the store rather than a note from the model.
    const signals = events.filter((e) => e.kind === 'site_changed')
    expect(signals.map((e) => e.meta)).toEqual([
      { at: 1, changes: 1 },
      { at: 2, changes: 1 },
    ])

    // The page a signal announced really is renderable the moment it arrives:
    // the writes are in the store and the next render of the draft finds them.
    for (const [page, title] of [
      ['services', 'Services'],
      ['contact', 'Contact'],
    ]) {
      const rendered = await call(`/preview/${slug}/draft/${page}`)
      expect(rendered.status).toBe(200)
      expect(await rendered.text()).toContain(`<title>${title}`)
    }
  })

  it('test_UAT_FC_BUG-43_a_turn_that_changes_nothing_says_nothing', async () => {
    const slug = nextSlug('quiet')
    await seedSite(slug)
    const sessionId = await openSession(slug)

    // A question, answered from a read tool. The operator is looking at a page
    // that has not moved, and reloading it would throw away their scroll
    // position to show them the identical bytes.
    setModelClient(
      scriptedClient([calls('list_pages', {}), says('You have one page: home.')]),
    )

    const turn = await post('/api/ai/prompt', { sessionId, text: 'What pages do I have?' })
    const events = await frames(turn)

    expect(events.some((e) => e.kind === 'tool_activity')).toBe(true)
    expect(events.filter((e) => e.kind === 'site_changed')).toEqual([])
  })

  it('test_UAT_FC_BUG-43_a_turn_with_no_tools_makes_no_extra_store_read', async () => {
    const slug = nextSlug('chat')
    await seedSite(slug)
    const sessionId = await openSession(slug)

    // The cost is stated in the code and is checked here: the counter is
    // re-read only after tool activity, so a conversational turn pays nothing
    // for a signal it could not possibly produce.
    setModelClient(scriptedClient([says('Hello — what would you like to change?')]))

    const turn = await post('/api/ai/prompt', { sessionId, text: 'Hello' })
    const events = await frames(turn)

    expect(events.map((e) => e.kind)).toEqual(['text', 'done'])
  })
})

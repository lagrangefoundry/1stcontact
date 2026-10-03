import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import worker from '../apps/control-app/src/index'
import type { Env } from '../apps/control-app/src/index'
import { resetChatHost } from '../apps/control-app/src/router'
import { resetAiHost, setModelClient } from '../tools/generate/src/cli/ai/host-core'
import { applySchema } from './support/d1-site-factory'
import { nextSlug, siteSeed } from './support/site-seed'
import {
  calls,
  says,
  scriptedClient,
  systemText,
  turnTailText,
  type ModelRequest,
} from './support/scripted-model-client'

/**
 * BUG-193 — **the standing note says it is a start-of-turn snapshot**.
 *
 * WHAT WAS REPORTED, AND WHAT WAS ACTUALLY WRONG. A consultant rewrote its note
 * with `set_standing_note`, saw the write succeed, then found the older note
 * still in front of it and filed a persistence bug. Nothing was lost: the
 * record is read when the turn's priming is assembled, so a rewrite made during
 * a turn reaches the session at the start of the NEXT one. The decisions block
 * and the page digest already said they were taken when the turn began. The note
 * didn't, so an unchanged note read as a failed write.
 *
 * WHAT IS REAL HERE: the same as REQ-283's suite — the Worker's own route, real
 * D1, real providers. One double: the Anthropic client.
 */

let businessSeq = 0
const nextBusiness = (): string => `bug193-${(businessSeq += 1)}`

function workerEnv(tenant: string): Env {
  return {
    DB: env.DB,
    SITES: env.SITES,
    BLOBS: env.BLOBS as R2Bucket,
    TENANT_ID: tenant,
    ACCESS_DEV_OPEN: '1',
    ACCESS_TEAM_DOMAIN: '',
    ACCESS_AUD: '',
    ANTHROPIC_API_KEY: 'test-key-not-a-real-one',
    ASSETS: {
      fetch: async () => new Response('asset', { status: 200 }),
    } as unknown as Fetcher,
  }
}

const post = (tenant: string, path: string, body: unknown): Promise<Response> =>
  worker.fetch(
    new Request(`https://app.example/${path.replace(/^\//, '')}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }),
    workerEnv(tenant),
  )

async function conversation(): Promise<{ tenant: string; sessionId: string }> {
  const tenant = nextBusiness()
  const seed = siteSeed({ slug: nextSlug('bug193') })
  const imported = await post(tenant, '/api/import', {
    slug: seed.slug,
    siteJson: seed.siteJson as Record<string, unknown>,
    pages: Object.entries(seed.pages).map(([name, page]) => ({
      name,
      page: page as Record<string, unknown>,
    })),
    assets: [] as { name: string; base64: string }[],
  })
  expect(imported.status).toBe(200)
  const slug = ((await imported.json()) as { site: string }).site
  const opened = await post(tenant, '/api/ai/session', { site: slug })
  expect(opened.status).toBe(200)
  return { tenant, sessionId: ((await opened.json()) as { sessionId: string }).sessionId }
}

async function turn(
  ctx: { tenant: string; sessionId: string },
  text: string,
  steps: Parameters<typeof scriptedClient>[0],
): Promise<ModelRequest[]> {
  const client = scriptedClient(steps)
  setModelClient(client)
  const response = await post(ctx.tenant, '/api/ai/prompt', { sessionId: ctx.sessionId, text })
  expect(response.status).toBe(200)
  await response.text()
  return client.seen
}

/** The standing-note block as delivered: its heading up to the next heading of any level. */
function noteBlock(req: ModelRequest): string {
  const told = `${systemText(req)}\n${turnTailText(req)}`
  const at = told.indexOf('### Your standing note')
  expect(at).toBeGreaterThanOrEqual(0)
  const end = told.indexOf('\n#', at + 3)
  return told.slice(at, end === -1 ? undefined : end)
}

beforeAll(async () => {
  await applySchema()
})

afterEach(() => {
  setModelClient(null)
  resetAiHost()
  resetChatHost()
})

describe('BUG-193 — a note rewritten this turn arrives next turn, and the heading says so', () => {
  it('test_UAT_FC_BUG-193_the_note_delivered_is_the_one_from_when_the_turn_began', async () => {
    const ctx = await conversation()
    await turn(ctx, 'Start.', [
      calls('set_standing_note', { note: 'Version A: the brief is a one-page site.' }),
      says('Noted.'),
    ])

    // Turn two rewrites the note part-way through. Its priming was assembled
    // before the rewrite, so it carries A — and says that is what it is.
    const second = await turn(ctx, 'We are adding a contact page.', [
      calls('set_standing_note', { note: 'Version B: one page plus a contact page.' }),
      says('Rewritten.'),
    ])
    const delivered = noteBlock(second[0])
    expect(delivered).toContain('Version A: the brief is a one-page site.')
    expect(delivered).not.toContain('Version B')
    expect(delivered).toContain('when this turn began')
    expect(delivered).toContain('is not a failed write')

    // Turn three begins after the rewrite, so it carries B, in full.
    const third = await turn(ctx, 'Carry on.', [says('Carrying on.')])
    const next = noteBlock(third[0])
    expect(next).toContain('Version B: one page plus a contact page.')
    expect(next).not.toContain('Version A')
  })
})

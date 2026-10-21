import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import worker from '../apps/control-app/src/index'
import type { Env } from '../apps/control-app/src/index'
import { resetChatHost } from '../apps/control-app/src/router'
import { durableJunctions, type JunctionNamespace } from '../apps/control-app/src/junctions'
import { RECOVERING_LINE, resetAiHost, setModelClient, STUCK_AGAIN_LINE } from '../tools/generate/src/cli/ai/host-core'
import { setStallDeadline } from '../tools/generate/src/cli/ai/turn-clock-core'
import { calls, says, scriptedClient, type ModelStep } from './support/scripted-model-client'
import { applySchema, seedTenantSite } from './support/d1-site-factory'
import { nextSlug } from './support/site-seed'

/**
 * [[BUG-249]] — **a turn that stops making progress cannot wedge its session**.
 *
 * THE INCIDENT. A consultant turn opened and then produced nothing: no error, no
 * end in `turn_log`, and every retry in that conversation failed until the dev
 * server was restarted. The mechanism: a turn parked forever on an await keeps
 * its lease alive with a bare heartbeat, so every later message loses the claim
 * and is queued onto a queue nothing drains.
 *
 * HOW THE WEDGE IS MADE. The database is the external boundary the consultant's
 * `list_pages` tool reads, so it is the one thing doubled: a D1 handle whose
 * page query never answers while the wedge is on. Everything else — the route,
 * the host, the framework's tool loop and lease — is the real thing. The wedge is
 * switched on by the model's own tool call and released in `afterEach`, so the
 * abandoned step unwinds before the next case.
 *
 * THE FALSIFIERS: a turn that waits for the hung tool (the stream never ends); a
 * session still claimed after the stall (the next message is answered `queued`
 * with no reply); a ledger row with no cause; and a client handed a turn id.
 */

const TENANT = 'bug249'
const DEADLINE_MS = 1_500

/** A D1 handle whose next `hangs` reads of `site_pages` never answer (until released). */
interface Wedge {
  hangs: number
  release(): void
  db: D1Database
}

function wedgeable(db: D1Database): Wedge {
  const parked: Array<() => void> = []
  const sqlOf = new WeakMap<object, string>()
  const realOf = new WeakMap<object, D1PreparedStatement>()
  const wedge: Wedge = {
    hangs: 0,
    release() {
      wedge.hangs = 0
      for (const go of parked.splice(0)) go()
    },
    db: undefined as unknown as D1Database,
  }
  const stuck = (sql: string): boolean => {
    if (wedge.hangs <= 0 || !sql.includes('FROM site_pages')) return false
    wedge.hangs -= 1
    return true
  }
  // Parked until released, then answered for real: an abandoned step settles late.
  const park = <T>(run: () => Promise<T>): Promise<T> =>
    new Promise<T>((resolve, reject) => {
      parked.push(() => run().then(resolve, reject))
    })
  const wrap = (stmt: D1PreparedStatement, sql: string): D1PreparedStatement => {
    const proxy = new Proxy(stmt, {
      get(target, key) {
        if (key === 'bind') return (...args: unknown[]) => wrap(target.bind(...args), sql)
        if (key === 'all' || key === 'first' || key === 'run' || key === 'raw') {
          return (...args: unknown[]) => {
            const call = () => (target[key] as (...a: unknown[]) => Promise<unknown>).apply(target, args)
            return stuck(sql) ? park(call) : call()
          }
        }
        const value = Reflect.get(target, key, target)
        return typeof value === 'function' ? value.bind(target) : value
      },
    })
    sqlOf.set(proxy, sql)
    realOf.set(proxy, stmt)
    return proxy
  }
  wedge.db = new Proxy(db, {
    get(target, key) {
      if (key === 'prepare') return (sql: string) => wrap(target.prepare(sql), sql)
      if (key === 'batch') {
        return (stmts: D1PreparedStatement[]) => {
          const call = () => target.batch(stmts.map((s) => realOf.get(s) ?? s))
          return stmts.some((s) => stuck(sqlOf.get(s) ?? '')) ? park(call) : call()
        }
      }
      const value = Reflect.get(target, key, target)
      return typeof value === 'function' ? value.bind(target) : value
    },
  })
  return wedge
}

let wedge: Wedge

function workerEnv(extra: Partial<Env> = {}): Env {
  return {
    DB: wedge.db,
    SITES: env.SITES,
    BLOBS: env.BLOBS as R2Bucket,
    TENANT_ID: TENANT,
    ACCESS_DEV_OPEN: '1',
    ACCESS_TEAM_DOMAIN: '',
    ACCESS_AUD: '',
    ANTHROPIC_API_KEY: 'test-key-not-a-real-one',
    ASSETS: { fetch: async () => new Response('asset', { status: 200 }) } as unknown as Fetcher,
    ...extra,
  }
}

function collectingCtx(): { ctx: ExecutionContext; settled: () => Promise<unknown[]> } {
  const held: Promise<unknown>[] = []
  const ctx = {
    waitUntil: (promise: Promise<unknown>) => {
      held.push(promise)
    },
    passThroughOnException: () => {},
    props: {},
  } as unknown as ExecutionContext
  return { ctx, settled: () => Promise.all(held) }
}

const post = (path: string, body: unknown, ctx?: ExecutionContext, extra: Partial<Env> = {}): Promise<Response> =>
  worker.fetch(
    new Request(`https://app.example/${path.replace(/^\//, '')}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    }),
    workerEnv(extra),
    ctx ?? ({ waitUntil: () => {}, passThroughOnException: () => {} } as unknown as ExecutionContext),
  )

interface Frame {
  kind: string
  content?: string
  meta?: Record<string, unknown>
}

/** Every frame of one turn, the terminal one last. */
async function frames(response: Response): Promise<Frame[]> {
  const text = await response.text()
  return text
    .split('\n\n')
    .map((f) => f.trim())
    .filter((f) => f.startsWith('data:'))
    .map((f) => JSON.parse(f.slice(5).trim()) as Frame)
}

/** One prompt, driven to the end of its drain, and its frames. */
async function prompt(sessionId: string, text: string): Promise<Frame[]> {
  const { ctx, settled } = collectingCtx()
  const response = await post('/api/ai/prompt', { sessionId, text }, ctx)
  expect(response.status).toBe(200)
  const seen = await frames(response)
  await settled()
  return seen
}

interface LedgerRow {
  turn_id: string
  ended_at: string | null
  outcome: string | null
  detail: string | null
}

async function ledger(sessionId: string): Promise<LedgerRow[]> {
  const rows = await env.DB.prepare('SELECT * FROM turn_log WHERE session_id = ? ORDER BY started_at ASC')
    .bind(sessionId)
    .all<LedgerRow>()
  return rows.results ?? []
}

async function openFor(prefix: string): Promise<{ site: string; sessionId: string }> {
  const { site } = await seedTenantSite(TENANT, { slug: nextSlug(prefix) })
  const opened = await post('/api/ai/session', { site })
  expect(opened.status).toBe(200)
  const { sessionId } = (await opened.json()) as { sessionId: string }
  return { site, sessionId }
}

/** The model's tool call, arming the wedge for exactly the read that call makes. */
const wedgedListPages: ModelStep = (req) => {
  wedge.hangs = 1
  return calls('list_pages', {})(req)
}

const said = (seen: Frame[]): string =>
  seen
    .filter((f) => f.kind === 'text')
    .map((f) => f.content ?? '')
    .join('')

describe('BUG-249 — a turn that stops making progress cannot wedge its session', () => {
  beforeAll(async () => {
    await applySchema()
  })

  afterEach(async () => {
    // LET THE ABANDONED STEP UNWIND, so its late records land before the next case.
    wedge?.release()
    await new Promise((resolve) => setTimeout(resolve, 50))
    setStallDeadline(null)
    setModelClient(null)
    resetAiHost()
    resetChatHost()
  })

  it('test_UAT_FC_BUG-249_a_tool_that_never_returns_is_ended_and_the_work_carried_on', async () => {
    wedge = wedgeable(env.DB)
    setStallDeadline(DEADLINE_MS)
    const { sessionId } = await openFor('carried')
    // Round one hangs in `list_pages`; the host's recovery round (two) is told
    // what hung and answers; the client's next message (three) runs normally.
    const model = scriptedClient([
      wedgedListPages,
      says('Back on it — here is the plan.'),
      says('And the next answer.'),
    ])
    setModelClient(model)

    const seen = await prompt(sessionId, 'List my pages.')

    // THE STREAM ENDED, which on the unfixed code it never did.
    const done = seen.at(-1)!
    expect(done.kind).toBe('done')
    // THE CLIENT READ THE GENTLE STATUS LINE, then the recovered answer — no turn id.
    expect(seen.some((f) => f.kind === 'progress' && f.content === RECOVERING_LINE)).toBe(true)
    expect(said(seen)).toContain('Back on it')
    expect(JSON.stringify(seen)).not.toMatch(/turn_[0-9a-f]{32}/)
    // THE RECOVERY ROUND WAS TOLD WHAT HUNG, so it looks before redoing it.
    const cue = JSON.stringify(model.seen[1].messages)
    expect(cue).toContain('tool list_pages')

    // THE LEDGER CLOSED, WITH ITS CAUSE: it stalled, on what, and recovered.
    const [row] = await ledger(sessionId)
    expect(row.ended_at).not.toBeNull()
    expect(row.outcome).toBe('complete')
    expect(row.detail).toContain('recovered after stalled')
    expect(row.detail).toContain('awaiting tool list_pages')

    // AND THE SESSION IS FREE: the next message is answered, not queued, with no restart.
    const next = await prompt(sessionId, 'Thanks — what next?')
    expect(said(next)).toContain('And the next answer.')
    expect(next.at(-1)?.meta?.queued).not.toBe(true)
    expect((await ledger(sessionId))[1].outcome).toBe('complete')
  }, 30_000)

  it('test_UAT_FC_BUG-249_a_turn_that_stalls_twice_is_recorded_stalled_and_frees_the_session', async () => {
    wedge = wedgeable(env.DB)
    setStallDeadline(DEADLINE_MS)
    const { site, sessionId } = await openFor('twice')
    const model = scriptedClient([
      wedgedListPages,
      wedgedListPages,
      says('Working again.'),
    ])
    setModelClient(model)

    const seen = await prompt(sessionId, 'List my pages.')
    expect(seen.at(-1)?.kind).toBe('done')
    expect(seen.at(-1)?.meta?.status).toBe('stalled')
    // A SECOND STALL IS NOT CHASED: the client is told gently, once.
    expect(said(seen)).toContain(STUCK_AGAIN_LINE)

    const [row] = await ledger(sessionId)
    expect(row.outcome).toBe('stalled')
    expect(row.detail).toMatch(/^stalled \d+s awaiting tool list_pages \(last: tool_issue\)$/)

    // REOPENING: nothing is live any more, and a client is handed no machinery.
    const reopened = (await (await post('/api/ai/session', { site })).json()) as {
      live?: boolean
      failed: Record<string, unknown> | null
    }
    expect(reopened.live).not.toBe(true)
    expect(reopened.failed?.state).toBe('stalled')
    expect(reopened.failed).not.toHaveProperty('turn')
    expect(reopened.failed).not.toHaveProperty('detail')
    // WITH DIAGNOSTICS ON (the dev server), the detailed note is kept.
    const dev = (await (await post('/api/ai/session', { site }, undefined, { TURN_DIAGNOSTICS: '1' })).json()) as {
      failed: Record<string, unknown> | null
    }
    expect(dev.failed?.turn).toBe(row.turn_id)
    expect(String(dev.failed?.detail)).toContain('awaiting tool list_pages')

    // THE NEXT MESSAGE RUNS — the lease the wedged turn held is free.
    const next = await prompt(sessionId, 'Try again?')
    expect(said(next)).toContain('Working again.')
    expect((await ledger(sessionId))[1].outcome).toBe('complete')
  }, 30_000)

  it('test_UAT_FC_BUG-249_the_watchdog_closes_a_row_nobody_closed', async () => {
    wedge = wedgeable(env.DB)
    const old = new Date(Date.now() - 20 * 60_000).toISOString()
    const fresh = new Date().toISOString()
    await env.DB.prepare('INSERT INTO turn_log (turn_id, tenant_id, session_id, started_at) VALUES (?, ?, ?, ?)')
      .bind('turn_watchdog_old', TENANT, 'site-watchdog', old)
      .run()
    await env.DB.prepare('INSERT INTO turn_log (turn_id, tenant_id, session_id, started_at) VALUES (?, ?, ?, ?)')
      .bind('turn_watchdog_fresh', TENANT, 'site-watchdog', fresh)
      .run()

    await worker.scheduled({ cron: '*/10 * * * *', scheduledTime: Date.now(), noRetry() {} } as ScheduledController, workerEnv())

    const rows = await ledger('site-watchdog')
    const swept = rows.find((r) => r.turn_id === 'turn_watchdog_old')!
    expect(swept.outcome).toBe('lost')
    expect(swept.ended_at).not.toBeNull()
    expect(swept.detail).toContain('watchdog')
    // A ROW INSIDE THE CEILING MAY BE A TURN STILL RUNNING, and is left alone.
    expect(rows.find((r) => r.turn_id === 'turn_watchdog_fresh')!.ended_at).toBeNull()
  })

  it('test_UAT_FC_BUG-249_a_junction_write_that_never_lands_does_not_wedge_the_session', async () => {
    wedge = wedgeable(env.DB)
    // A Durable Object whose `append` never answers, the first time it is asked.
    let appends = 0
    const landed: string[] = []
    const stub = {
      since: async () => ({ present: false, size: 0, epoch: 0, at: 0, bytes: new Uint8Array(), meta: null }),
      append: (text: string) => {
        appends += 1
        if (appends === 1) return new Promise(() => {})
        landed.push(text)
        return Promise.resolve()
      },
      replace: async () => {},
      remove: async () => {},
      writeMeta: async () => {},
    }
    const namespace = { idFromName: (n: string) => n, get: () => stub } as unknown as JunctionNamespace
    const junctions = durableJunctions(namespace, { callTimeoutMs: 50 })

    await junctions.prepare('site-wedged')
    const log = junctions.open('site-wedged')
    log.append('delta', { turn_id: 't', content: 'one' })
    // THE DRAIN SETTLES, rather than waiting on the write that never answers.
    await junctions.flush('site-wedged')
    log.append('delta', { turn_id: 't', content: 'two' })
    await junctions.flush('site-wedged')
    // AND THE NEXT ONE STILL LANDS: the chain was not poisoned.
    expect(landed.join('')).toContain('"two"')
    // A LATER PREPARE — what every turn awaits first — completes too.
    await junctions.prepare('site-wedged')
  })
})

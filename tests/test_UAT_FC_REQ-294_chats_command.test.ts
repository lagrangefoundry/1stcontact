import { afterAll, describe, expect, it } from 'vitest'
import { execFile } from 'node:child_process'
import http from 'node:http'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'
import {
  assertDataClass,
  copyChats,
  CLASS_ROUTES,
} from '../tools/generate/src/cli/copy'

/**
 * REQ-294 — `bin/copy-to-cloud --chats`, the command half.
 *
 * WHAT IS BEING PROVED HERE. The two routes have their own suite in workerd;
 * this one is about the two HTTP calls and the choices around them — which
 * origin is read and which is written, that a business NAME becomes each side's
 * own id on the conversation pair exactly as it does on the site pair, that the
 * class reaches its OWN routes rather than the site's, and what is refused and
 * when.
 *
 * THE TRANSPORT IS INJECTED AND NOTHING ELSE IS, the shape REQ-289's suite uses
 * and for its reason: the thing under test is what goes out on the wire.
 *
 * TWO TESTS SPAWN THE REAL COMMAND, over real HTTP against a loopback builder,
 * because two of the decisions are the CLI's own and are invisible from the
 * library: `--chats --backup` writes a conversation history to a file and makes
 * no second call, and `--chats` is refused from-cloud BEFORE the credential
 * check rather than after it. An operator sent to provision an Access token,
 * who provisions one and is then told the flag was never going to be carried,
 * has been sent on an errand.
 */

const REPO_ROOT = join(__dirname, '..')
const run = promisify(execFile)

interface Call {
  url: string
  method: string
  headers: Record<string, string>
  body: unknown
}

/** What each origin answers: its business list and its conversation history. */
interface Side {
  businesses: { id: string; name: string }[]
  chats?: Record<string, unknown>
  /** Status + body for this side's chats import. Defaults to a successful land. */
  importAnswer?: { status: number; body: unknown }
}

/** A `fetch` that answers as two builders and records every call, routed by URL. */
function twoBuilders(sides: Record<string, Side>) {
  const calls: Call[] = []
  const impl = (async (url: string, init: RequestInit) => {
    const parsed = new URL(url)
    const side = sides[parsed.origin]
    calls.push({
      url,
      method: init.method ?? 'GET',
      headers: (init.headers ?? {}) as Record<string, string>,
      body: typeof init.body === 'string' ? JSON.parse(init.body) : undefined,
    })
    const answer = (status: number, body: unknown) => ({
      ok: status >= 200 && status < 300,
      status,
      text: () => Promise.resolve(typeof body === 'string' ? body : JSON.stringify(body)),
    })
    if (!side) return answer(404, { error: `no builder at ${parsed.origin}` })
    if (parsed.pathname === '/api/businesses') {
      return answer(200, {
        person: null,
        businesses: side.businesses.map((b) => ({ ...b, selectable: true, lapse: null })),
      })
    }
    if (parsed.pathname.endsWith(CLASS_ROUTES.chats.read)) {
      return answer(200, side.chats ?? { business: 'unset', chats: [] })
    }
    if (parsed.pathname.endsWith(CLASS_ROUTES.chats.write)) {
      const a = side.importAnswer ?? {
        status: 200,
        body: { created: 2, replaced: 0, kept: 0, comments: 2 },
      }
      return answer(a.status, a.body)
    }
    return answer(404, { error: `no route ${parsed.pathname}` })
  }) as unknown as typeof fetch
  return { impl, calls }
}

/** The history a builder's chats export answers with. */
const HISTORY = {
  business: 'biz_local',
  chats: [
    {
      sessionId: 'sess-a',
      title: 'sess-a',
      status: 'open',
      body: '### Decision 1\n\nSerif wordmark.\n',
      fields: { session_id: 'sess-a', frame: 'the palette is settled' },
      comments: [{ kind: 'chat_transcript', body: '- user: make the hero warmer\n' }],
    },
    {
      sessionId: 'sess-b',
      title: 'sess-b',
      status: 'open',
      body: '### Decision 1\n\nDrop the carousel.\n',
      fields: { session_id: 'sess-b' },
      comments: [{ kind: 'chat_transcript', body: '- user: too busy\n' }],
    },
  ],
}

const FAKE_CLOUD = 'https://cloud.test'
const FAKE_LOCAL = 'http://local.test'

/** Both ends holding the same business under different ids, as they really would. */
function bothEnds(over: { local?: Partial<Side>; cloud?: Partial<Side> } = {}) {
  return twoBuilders({
    [FAKE_LOCAL]: {
      businesses: [{ id: 'biz_local', name: 'Lagrange Foundry' }],
      chats: HISTORY,
      ...over.local,
    },
    [FAKE_CLOUD]: {
      businesses: [{ id: 'biz_cloud', name: 'Lagrange Foundry' }],
      chats: { business: 'biz_cloud', chats: [] },
      ...over.cloud,
    },
  })
}

describe('REQ-294 — a conversation history crosses on its own pair of routes', () => {
  it('test_UAT_FC_REQ-294_to_cloud_reads_local_and_writes_the_cloud_on_the_chats_routes', async () => {
    // THE CLASS REACHES ITS OWN PAIR. A history read from `/api/chats/export`
    // must be written to `/api/chats/import` — the pair is separate from the
    // site's on purpose, and a class that came to read from one pair and write
    // to the other is exactly what `CLASS_ROUTES` exists to make visible.
    //
    // AND `--site` IS UNTOUCHED BY THIS: no call here goes near `/api/export`
    // or `/api/import`, which is the whole point of not fattening `SitePayload`.
    const { impl, calls } = bothEnds()
    const result = await copyChats('Lagrange Foundry', {
      direction: 'to-cloud',
      local: FAKE_LOCAL,
      cloud: FAKE_CLOUD,
      fetch: impl,
    })

    // THE BUSINESS NAME RESOLVED TO EACH SIDE'S OWN ID, which is why the command
    // takes a name at all: the two stores mint different strings for the thing
    // the operator calls one name, and each call names the id of the side it is
    // addressed to.
    expect(result.from.id).toBe('biz_local')
    expect(result.to.id).toBe('biz_cloud')
    expect(calls.find((c) => c.url.endsWith(CLASS_ROUTES.chats.read))?.url).toBe(
      `${FAKE_LOCAL}/b/biz_local${CLASS_ROUTES.chats.read}`,
    )
    expect(calls.find((c) => c.method === 'POST')?.url).toBe(
      `${FAKE_CLOUD}/b/biz_cloud${CLASS_ROUTES.chats.write}`,
    )
    for (const call of calls) {
      expect(call.url).not.toContain('/api/export')
      expect(call.url).not.toContain('/api/import')
    }

    // What was exported is what was posted, with nothing in between to translate
    // it — the same obligation the site pair carries.
    expect(calls.find((c) => c.method === 'POST')?.body).toMatchObject({ chats: HISTORY.chats })
    expect(result.read).toBe(2)
    expect(result.landed).toEqual({ created: 2, replaced: 0, kept: 0, comments: 2 })
  })

  it('test_UAT_FC_REQ-294_force_reaches_the_payload_and_absent_means_no', async () => {
    // `--force` IS WHAT REPLACES A CONVERSATION THE FAR SIDE ALREADY HOLDS, and
    // absent it means KEEP. So an ordinary copy must send a body with no `force`
    // key at all rather than one that says `false`: the wire then shows what was
    // meant, which is `push.ts`'s rule kept on the second pair.
    const plain = bothEnds()
    await copyChats('Lagrange Foundry', {
      direction: 'to-cloud',
      local: FAKE_LOCAL,
      cloud: FAKE_CLOUD,
      fetch: plain.impl,
    })
    expect(plain.calls.find((c) => c.method === 'POST')?.body).not.toHaveProperty('force')

    const forced = bothEnds()
    await copyChats('Lagrange Foundry', {
      direction: 'to-cloud',
      local: FAKE_LOCAL,
      cloud: FAKE_CLOUD,
      force: true,
      fetch: forced.impl,
    })
    expect(forced.calls.find((c) => c.method === 'POST')?.body).toMatchObject({ force: true })
  })

  it('test_UAT_FC_REQ-294_a_business_absent_on_the_far_side_is_refused_before_the_read', async () => {
    // THE COMMAND NEVER MINTS A TENANT, on this class either — and nothing is
    // read first. A copy that fetched a history's worth of transcripts and then
    // discovered the destination does not exist has spent the operator's time to
    // tell them something it could have said first.
    const { impl, calls } = bothEnds({ cloud: { businesses: [{ id: 'biz_other', name: 'XGD' }] } })
    await expect(
      copyChats('Lagrange Foundry', {
        direction: 'to-cloud',
        local: FAKE_LOCAL,
        cloud: FAKE_CLOUD,
        fetch: impl,
      }),
    ).rejects.toThrow(/No business called 'Lagrange Foundry'[\s\S]*never creates[\s\S]*'XGD'/)
    expect(calls.some((c) => c.url.endsWith(CLASS_ROUTES.chats.read))).toBe(false)
    expect(calls.some((c) => c.method === 'POST')).toBe(false)
  })

  it('test_UAT_FC_REQ-294_chats_is_carried_up_and_refused_down_with_its_reason', async () => {
    // THE ASYMMETRY IS THE DECISION, and it is `--contacts`' decision applied to
    // a class that is at least as sensitive: a conversation with the consultant
    // is unstructured text the customer typed and can contain anything. The
    // local builder runs with ACCESS_DEV_OPEN=1 — reachable on loopback with no
    // identity check — so pulling one down is not a smaller version of copying a
    // site. Written here before the reverse direction exists, precisely so that
    // building it later cannot quietly make the two symmetric.
    expect(() => assertDataClass('chats', 'from-cloud')).toThrow(
      /will not carry --chats[\s\S]*ACCESS_DEV_OPEN=1[\s\S]*decision, not a gap/,
    )
    // AND IT IS NOT AN UNKNOWN-FLAG ERROR ON THE DIRECTION THAT CARRIES IT: to-cloud
    // is implemented, so it simply passes.
    expect(() => assertDataClass('chats', 'to-cloud')).not.toThrow()
    // `--contacts` still answers as it always did, on both directions — the
    // third class did not disturb the second.
    expect(() => assertDataClass('contacts', 'from-cloud')).toThrow(/will not carry --contacts/)
    expect(() => assertDataClass('contacts', 'to-cloud')).toThrow(/--site and --chats/)

    // And the refusal happens before anything is read.
    const { impl, calls } = bothEnds()
    await expect(
      copyChats('Lagrange Foundry', {
        direction: 'from-cloud',
        local: FAKE_LOCAL,
        cloud: FAKE_CLOUD,
        fetch: impl,
      }),
    ).rejects.toThrow(/--chats/)
    expect(calls).toHaveLength(0)
  })

  it('test_UAT_FC_REQ-294_the_credential_pair_reaches_both_ends_of_a_chats_copy', async () => {
    // BUG-134's rule, unchanged by the new class and asserted so it stays that
    // way: every call a copy makes carries the credential for the end it
    // addresses, and never the header Access SETS on what it forwards.
    const { impl, calls } = bothEnds()
    await copyChats('Lagrange Foundry', {
      direction: 'to-cloud',
      local: FAKE_LOCAL,
      cloud: FAKE_CLOUD,
      cloudAccess: { clientId: 'abc.access', clientSecret: 's3cret' },
      fetch: impl,
    })
    expect(calls.length).toBeGreaterThan(2)
    for (const call of calls) {
      expect(call.headers['CF-Access-Client-Id']).toBe('abc.access')
      expect(call.headers['CF-Access-Client-Secret']).toBe('s3cret')
      expect(Object.keys(call.headers).map((n) => n.toLowerCase())).not.toContain(
        'cf-access-jwt-assertion',
      )
    }
  })
})

/**
 * The two decisions that belong to the command rather than to the library, run
 * through the real script, over real HTTP, against a loopback builder.
 */
describe('REQ-294 — the operator script', () => {
  const work = mkdtempSync(join(tmpdir(), 'req294-'))
  let server: http.Server | null = null

  afterAll(() => {
    server?.close()
    rmSync(work, { recursive: true, force: true })
  })

  /** A builder that answers the two GETs this command makes, and nothing else. */
  async function builder(): Promise<string> {
    server = http.createServer((req, res) => {
      const url = new URL(req.url ?? '/', 'http://127.0.0.1')
      res.setHeader('content-type', 'application/json')
      if (url.pathname === '/api/businesses') {
        res.end(
          JSON.stringify({
            person: null,
            businesses: [
              { id: 'biz_local', name: 'Lagrange Foundry', selectable: true, lapse: null },
            ],
          }),
        )
        return
      }
      if (url.pathname === `/b/biz_local${CLASS_ROUTES.chats.read}`) {
        res.end(JSON.stringify(HISTORY))
        return
      }
      res.statusCode = 500
      res.end(JSON.stringify({ error: `this builder answers no ${url.pathname}` }))
    })
    await new Promise<void>((resolve) => server?.listen(0, '127.0.0.1', resolve))
    const addr = server?.address()
    return `http://127.0.0.1:${typeof addr === 'object' && addr ? addr.port : 0}`
  }

  it('test_UAT_FC_REQ-294_backup_writes_the_sources_conversations_and_touches_no_destination', async () => {
    // `--backup` WORKS FOR THIS CLASS TOO, because it is the same source-side
    // read landing in a file — and to-cloud reads local, so this is the local
    // builder's own conversation history landing somewhere committable. The
    // loopback builder above answers no import route at all, so if anything
    // tried to write, this fails.
    const origin = await builder()
    const out = join(work, 'lagrange-foundry-chats.json')
    const { stdout } = await run(
      join(REPO_ROOT, 'bin/copy-to-cloud'),
      ['--chats', '--origin', origin, '--backup', out, 'Lagrange Foundry'],
      { cwd: REPO_ROOT },
    )

    expect(stdout).toContain("backed up 'Lagrange Foundry's conversations")
    expect(stdout).toContain('chats   2')
    expect(stdout).toContain(out)
    // The file is the export, whole — the payload `/api/chats/import` takes back.
    expect(JSON.parse(readFileSync(out, 'utf8'))).toEqual(HISTORY)
    // AND NO CREDENTIAL WAS REQUIRED. Nothing in this run touches the cloud.
  }, 120000)

  it('test_UAT_FC_REQ-294_chats_is_refused_from_cloud_before_the_command_asks_for_a_credential', async () => {
    // The ordering, through the real script and with no credential in the
    // environment. What was ASKED FOR is refused first; how to reach a side is a
    // question that only arises for a request that was going to be carried.
    await expect(
      run(join(REPO_ROOT, 'bin/copy-from-cloud'), ['--chats', 'Lagrange Foundry'], {
        cwd: REPO_ROOT,
        env: { ...process.env, CF_ACCESS_CLIENT_ID: '', CF_ACCESS_CLIENT_SECRET: '' },
      }),
    ).rejects.toThrow(/will not carry --chats[\s\S]*ACCESS_DEV_OPEN=1/)
  }, 120000)
})

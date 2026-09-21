import { afterAll, describe, expect, it } from 'vitest'
import { execFile } from 'node:child_process'
import http from 'node:http'
import { mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'
import {
  assertDataClass,
  copySite,
  endsFor,
  exportSite,
  serviceToken,
  CLOUD_ORIGIN,
  LOCAL_ORIGIN,
} from '../tools/generate/src/cli/copy'

/**
 * REQ-289 — `bin/copy-to-cloud` / `bin/copy-from-cloud`, the command half.
 *
 * WHAT IS BEING PROVED. The route has its own suite in workerd; this one is
 * about the two HTTP calls and the choices around them — which origin is read
 * and which is written, how a business NAME becomes each side's own id, what is
 * refused and when, and that a refusal leaves nothing behind.
 *
 * THE TRANSPORT IS INJECTED AND NOTHING ELSE IS. `copySite` takes a `fetch`, so
 * these drive the real resolution, the real payload assembly and the real
 * refusal messages against recorded requests — the same shape BUG-36's suite
 * uses for `pushSite`, and for the same reason: the thing under test is what
 * goes out on the wire.
 *
 * TWO TESTS SPAWN THE REAL COMMAND, over real HTTP against a loopback builder,
 * because two of the decisions are the CLI's own and are invisible from the
 * library: `--backup` writes a file and makes no second call, and `--contacts`
 * is refused BEFORE the credential check rather than after it. An operator sent
 * to provision an Access token, who provisions one and is then told the flag was
 * never going to be carried, has been sent on an errand.
 */

const REPO_ROOT = join(__dirname, '..')
const run = promisify(execFile)

/** One recorded request, as the fake transport saw it. */
interface Call {
  url: string
  method: string
  headers: Record<string, string>
  body: unknown
}

/** What each origin answers: its business list, its site, and what an import lands. */
interface Side {
  businesses: { id: string; name: string }[]
  site?: Record<string, unknown>
  /** Status + body for this side's import route. Defaults to a successful land. */
  importAnswer?: { status: number; body: unknown }
}

/**
 * A `fetch` that answers as two builders and records every call.
 *
 * ROUTED BY ORIGIN AND PATH, not by call order, so a test that asserts "the
 * export went to the local end" is asserting something about the URL rather
 * than about which call happened to be first.
 */
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
      return answer(200, { person: null, businesses: side.businesses.map((b) => ({ ...b, selectable: true, lapse: null })) })
    }
    if (parsed.pathname.endsWith('/api/export')) {
      return answer(200, side.site ?? { error: 'no site' })
    }
    if (parsed.pathname.endsWith('/api/import')) {
      const a = side.importAnswer ?? {
        status: 200,
        body: { site: 'site_landed', pages: 1, assets: 1, siteJson: true },
      }
      return answer(a.status, a.body)
    }
    return answer(404, { error: `no route ${parsed.pathname}` })
  }) as unknown as typeof fetch
  return { impl, calls }
}

/** The payload a builder's export answers with. */
const SITE = {
  slug: 'site_936dd7c92e5e14df694dd9a80433aa4f',
  siteJson: { config: { businessName: 'Lagrange Foundry' } },
  pages: [{ name: 'home.json', page: { kind: 'l1' } }],
  assets: [{ name: 'founder-portrait.jpg', base64: 'AAEC' }],
}

const FAKE_CLOUD = 'https://cloud.test'
const FAKE_LOCAL = 'http://local.test'

/** Both ends holding the same business under different ids, as they really would. */
function bothEnds(over: { local?: Partial<Side>; cloud?: Partial<Side> } = {}) {
  return twoBuilders({
    [FAKE_LOCAL]: {
      businesses: [{ id: 'biz_local', name: 'Lagrange Foundry' }],
      site: SITE,
      ...over.local,
    },
    [FAKE_CLOUD]: {
      businesses: [{ id: 'biz_cloud', name: 'Lagrange Foundry' }],
      site: SITE,
      ...over.cloud,
    },
  })
}

describe('REQ-289 — the direction chooses the ends', () => {
  it('test_UAT_FC_REQ-289_to_cloud_reads_local_and_from_cloud_reads_the_cloud', async () => {
    // The whole of "the same two calls with the origins swapped", asserted as
    // one function rather than believed from a comment. It is also where the
    // defaults live: `bin/publish`'s two origins, unchanged.
    expect(endsFor('to-cloud')).toEqual({ source: LOCAL_ORIGIN, destination: CLOUD_ORIGIN })
    expect(endsFor('from-cloud')).toEqual({ source: CLOUD_ORIGIN, destination: LOCAL_ORIGIN })

    const up = bothEnds()
    await copySite('Lagrange Foundry', {
      direction: 'to-cloud',
      local: FAKE_LOCAL,
      cloud: FAKE_CLOUD,
      fetch: up.impl,
    })
    const upExport = up.calls.find((c) => c.url.endsWith('/api/export'))
    const upImport = up.calls.find((c) => c.method === 'POST')
    expect(upExport?.url.startsWith(FAKE_LOCAL)).toBe(true)
    expect(upImport?.url.startsWith(FAKE_CLOUD)).toBe(true)

    const down = bothEnds()
    await copySite('Lagrange Foundry', {
      direction: 'from-cloud',
      local: FAKE_LOCAL,
      cloud: FAKE_CLOUD,
      fetch: down.impl,
    })
    const downExport = down.calls.find((c) => c.url.endsWith('/api/export'))
    const downImport = down.calls.find((c) => c.method === 'POST')
    expect(downExport?.url.startsWith(FAKE_CLOUD)).toBe(true)
    expect(downImport?.url.startsWith(FAKE_LOCAL)).toBe(true)
  })

  it('test_UAT_FC_REQ-289_the_business_name_resolves_to_each_sides_own_id', async () => {
    // WHY THE COMMAND TAKES A NAME. A site's business id is minted by the store
    // that holds it, so the two ends hold different strings for the thing the
    // operator calls one name. Each call must carry the id of the side it is
    // addressed to — and carry it explicitly, in the `/b/<id>/` prefix, rather
    // than leaving the Worker to resolve "whichever one you may open first".
    const { impl, calls } = bothEnds()
    const result = await copySite('Lagrange Foundry', {
      direction: 'to-cloud',
      local: FAKE_LOCAL,
      cloud: FAKE_CLOUD,
      fetch: impl,
    })

    expect(result.from.id).toBe('biz_local')
    expect(result.to.id).toBe('biz_cloud')
    expect(calls.find((c) => c.url.endsWith('/api/export'))?.url).toBe(
      `${FAKE_LOCAL}/b/biz_local/api/export`,
    )
    expect(calls.find((c) => c.method === 'POST')?.url).toBe(
      `${FAKE_CLOUD}/b/biz_cloud/api/import`,
    )
    // The site's own content reached the far side intact — what was exported is
    // what was posted, with nothing in between to translate it.
    expect(calls.find((c) => c.method === 'POST')?.body).toMatchObject({
      siteJson: SITE.siteJson,
      pages: SITE.pages,
      assets: SITE.assets,
    })
  })

  it('test_UAT_FC_REQ-289_the_credential_pair_reaches_both_ends', async () => {
    // Access fronts the cloud, and `bin/access-sim` fronts the local builder
    // when the local end is reached that way — which is what `--origin` is for.
    // Withholding the pair from the local end would make the simulator
    // unreachable for no reason, so it is sent to whichever end was asked for.
    //
    // STILL TRUE AFTER [[BUG-134]], and deliberately: one pair with no local
    // override still reaches both ends. That ticket adds a way to say the ends
    // differ, it does not make everyone say so.
    const { impl, calls } = bothEnds()
    await copySite('Lagrange Foundry', {
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
      // BUG-36's deleted mistake, asserted as deleted on this path too.
      expect(Object.keys(call.headers).map((n) => n.toLowerCase())).not.toContain(
        'cf-access-jwt-assertion',
      )
    }
  })
})

describe('REQ-289 — what the copy refuses', () => {
  it('test_UAT_FC_REQ-289_a_business_absent_on_the_far_side_is_refused_before_the_read', async () => {
    // THE COMMAND NEVER MINTS A TENANT. A deployment acquiring a business nobody
    // signed up for, from a laptop script, is the failure this refusal exists to
    // prevent — and production holds one tenant and no sites today, so this path
    // is reached on the very first use.
    //
    // AND NOTHING IS READ FIRST. A copy that fetched a site's worth of assets
    // and then discovered the destination does not exist has spent the
    // operator's time to tell them something it could have said first.
    const { impl, calls } = bothEnds({ cloud: { businesses: [{ id: 'biz_other', name: 'XGD' }] } })
    await expect(
      copySite('Lagrange Foundry', {
        direction: 'to-cloud',
        local: FAKE_LOCAL,
        cloud: FAKE_CLOUD,
        fetch: impl,
      }),
    ).rejects.toThrow(/No business called 'Lagrange Foundry'[\s\S]*never creates[\s\S]*'XGD'/)
    expect(calls.some((c) => c.url.endsWith('/api/export'))).toBe(false)
    expect(calls.some((c) => c.method === 'POST')).toBe(false)
  })

  it('test_UAT_FC_REQ-289_one_name_on_two_businesses_is_ambiguity_not_a_first_match', async () => {
    // The refusal `/api/import` makes over two sites, made here over two
    // businesses and for the mirror-image reason: guessing on the write
    // overwrites something, and guessing on the read hands back something the
    // operator did not ask for — which the command then writes somewhere.
    const { impl } = bothEnds({
      cloud: {
        businesses: [
          { id: 'biz_a', name: 'Lagrange Foundry' },
          { id: 'biz_b', name: 'lagrange foundry' },
        ],
      },
    })
    await expect(
      copySite('Lagrange Foundry', {
        direction: 'to-cloud',
        local: FAKE_LOCAL,
        cloud: FAKE_CLOUD,
        fetch: impl,
      }),
    ).rejects.toThrow(/2 businesses called 'Lagrange Foundry'[\s\S]*Nothing was read or written/)
  })

  it('test_UAT_FC_REQ-289_force_reaches_the_payload_and_the_409_names_the_business', async () => {
    // BUG-51's guard, preserved and passed through. Without `--force` the far
    // side refuses a target carrying builder-authored changes and says how many;
    // this side reports that sentence with the business named, because the
    // operator typed a name and has never seen the site key in it.
    const refusing = {
      status: 409,
      body: {
        error: "Site 'site_936dd7c92e5e14df694dd9a80433aa4f' has 190 change(s) made in the builder. Importing would replace them. Nothing was written.",
        changes: 190,
      },
    }
    const { impl, calls } = bothEnds({ cloud: { importAnswer: refusing } })
    await expect(
      copySite('Lagrange Foundry', {
        direction: 'to-cloud',
        local: FAKE_LOCAL,
        cloud: FAKE_CLOUD,
        fetch: impl,
      }),
    ).rejects.toThrow(/Copy of 'Lagrange Foundry' was refused with 409[\s\S]*190 change[\s\S]*--force/)
    // ABSENT MEANS NO: an ordinary copy sends a body with no `force` key at all
    // rather than one that says `false`, so the wire shows what was meant.
    expect(calls.find((c) => c.method === 'POST')?.body).not.toHaveProperty('force')

    const forced = bothEnds()
    await copySite('Lagrange Foundry', {
      direction: 'to-cloud',
      local: FAKE_LOCAL,
      cloud: FAKE_CLOUD,
      force: true,
      fetch: forced.impl,
    })
    expect(forced.calls.find((c) => c.method === 'POST')?.body).toMatchObject({ force: true })
  })

  it('test_UAT_FC_REQ-289_contacts_is_recognised_and_answered_differently_per_direction', async () => {
    // THE ASYMMETRY IS THE DECISION. Contacts are real people's data and the
    // local builder runs with ACCESS_DEV_OPEN=1, so pulling them down is refused
    // with its reason — written before the feature exists precisely so that
    // building `--contacts` later cannot quietly make it symmetric. Pushing them
    // up is merely unbuilt, which is a different sentence.
    expect(() => assertDataClass('contacts', 'from-cloud')).toThrow(
      /will not carry --contacts[\s\S]*ACCESS_DEV_OPEN=1[\s\S]*decision, not a gap/,
    )
    expect(() => assertDataClass('contacts', 'to-cloud')).toThrow(/not[\s\S]*yet[\s\S]*--site/)
    // NEITHER IS AN UNKNOWN-FLAG ERROR, and `--site` is simply the default.
    expect(() => assertDataClass('site', 'to-cloud')).not.toThrow()
    expect(() => assertDataClass('site', 'from-cloud')).not.toThrow()

    // And the refusal happens before anything is read.
    const { impl, calls } = bothEnds()
    await expect(
      copySite('Lagrange Foundry', {
        direction: 'from-cloud',
        klass: 'contacts',
        local: FAKE_LOCAL,
        cloud: FAKE_CLOUD,
        fetch: impl,
      }),
    ).rejects.toThrow(/--contacts/)
    expect(calls).toHaveLength(0)
  })

  it('test_UAT_FC_REQ-289_half_a_service_token_is_refused_and_names_the_wrong_credential', async () => {
    // Half a credential is not a weaker credential: it is a request declined at
    // the edge with a message about identity rather than about the half that was
    // missing here. `CLOUDFLARE_API_TOKEN` is named because it is the credential
    // an operator reaches for and the one thing that cannot work.
    expect(() => serviceToken('abc.access', undefined)).toThrow(
      /PAIR[\s\S]*CF_ACCESS_CLIENT_SECRET[\s\S]*CLOUDFLARE_API_TOKEN/,
    )
    expect(() => serviceToken(undefined, 's3cret')).toThrow(/PAIR/)
    expect(serviceToken(undefined, undefined)).toBeUndefined()
    expect(serviceToken('abc.access', 's3cret')).toEqual({
      clientId: 'abc.access',
      clientSecret: 's3cret',
    })
  })

  it('test_UAT_FC_REQ-289_an_access_bounce_reads_as_a_refusal_on_the_read_too', async () => {
    // BUG-36's symptom, on the half that did not exist then. Access answers an
    // unauthenticated request with a 302 to its login page; followed, that is a
    // 200 carrying HTML and `JSON.parse` chokes on a doctype. The redirect has
    // to arrive as itself and be named — including how to get a credential.
    const impl = (async () => ({
      ok: false,
      status: 302,
      text: () => Promise.resolve(''),
    })) as unknown as typeof fetch
    await expect(
      exportSite(FAKE_CLOUD, 'Lagrange Foundry', { end: 'cloud', fetch: impl }),
    ).rejects.toThrow(/login page[\s\S]*CF_ACCESS_CLIENT_ID[\s\S]*CF_ACCESS_CLIENT_SECRET/)
  })
})

/**
 * The two decisions that belong to the command rather than to the library, run
 * through the real script, over real HTTP, against a loopback builder.
 */
describe('REQ-289 — the operator scripts', () => {
  const work = mkdtempSync(join(tmpdir(), 'req289-'))
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
      if (url.pathname === '/b/biz_local/api/export') {
        res.end(JSON.stringify(SITE))
        return
      }
      res.statusCode = 500
      res.end(JSON.stringify({ error: `this builder answers no ${url.pathname}` }))
    })
    await new Promise<void>((resolve) => server?.listen(0, '127.0.0.1', resolve))
    const addr = server?.address()
    return `http://127.0.0.1:${typeof addr === 'object' && addr ? addr.port : 0}`
  }

  it('test_UAT_FC_REQ-289_backup_writes_the_sources_export_and_touches_no_destination', async () => {
    // THE TICKET'S FIRST REAL USE. The Lagrange Foundry draft exists in exactly
    // one gitignored directory with no published revision to fall back to, and
    // what saves it is the LOCAL builder's own export landing somewhere
    // committable. To-cloud reads local, so `--backup` on that direction is that
    // read — and the loopback builder above answers no import route at all, so
    // if anything tried to write, this fails.
    const origin = await builder()
    const out = join(work, 'lagrange-foundry.json')
    const { stdout } = await run(
      join(REPO_ROOT, 'bin/copy-to-cloud'),
      ['--origin', origin, '--backup', out, 'Lagrange Foundry'],
      { cwd: REPO_ROOT },
    )

    expect(stdout).toContain("backed up 'Lagrange Foundry'")
    expect(stdout).toContain(out)
    // The file is the export, whole — the payload `/api/import` takes back.
    const saved = JSON.parse(readFileSync(out, 'utf8')) as Record<string, unknown>
    expect(saved).toEqual(SITE)
    // AND NO CREDENTIAL WAS REQUIRED. Nothing in this run touches the cloud, so
    // demanding an Access token for it would be demanding one to read a file on
    // the machine the command is running on.
  }, 120000)

  it('test_UAT_FC_REQ-289_contacts_is_refused_before_the_command_asks_for_a_credential', async () => {
    // The ordering, through the real script and with no credential in the
    // environment. What was ASKED FOR is refused first; how to reach a side is a
    // question that only arises for a request that was going to be carried.
    await expect(
      run(join(REPO_ROOT, 'bin/copy-from-cloud'), ['--contacts', 'Lagrange Foundry'], {
        cwd: REPO_ROOT,
        env: { ...process.env, CF_ACCESS_CLIENT_ID: '', CF_ACCESS_CLIENT_SECRET: '' },
      }),
    ).rejects.toThrow(/will not carry --contacts[\s\S]*ACCESS_DEV_OPEN=1/)
  }, 120000)
})

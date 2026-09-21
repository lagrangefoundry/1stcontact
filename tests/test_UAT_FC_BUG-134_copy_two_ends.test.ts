import { describe, expect, it } from 'vitest'
import { execFile } from 'node:child_process'
import http from 'node:http'
import { join } from 'node:path'
import { promisify } from 'node:util'
import {
  accessFor,
  byEnd,
  copySite,
  endNamesFor,
  endsFor,
  exportSite,
  serviceToken,
} from '../tools/generate/src/cli/copy'
import { accessAdvice, postSitePayload, type SitePayload } from '../tools/generate/src/cli/push'

/**
 * BUG-134 — a copy carries TWO credentials, one per end.
 *
 * WHAT WENT WRONG. `copy.ts` had one `access` field and sent it to both ends.
 * That is fine whenever the other end has no credential, and false in exactly
 * the configuration the command was written for: the deployed builder is behind
 * Cloudflare Access and wants a service token from `bin/access-token`, while the
 * local builder run behind `bin/access-sim` — the only local front door that can
 * reach a business other than `TENANT_ID` — accepts ONLY the simulator's own
 * pair. One slot could satisfy either and never both, and the way out was to
 * restart the simulator with the production token's values: a production
 * credential in a local process's argv, to work around a missing parameter.
 *
 * AND THE REFUSAL POINTED AT THE WRONG VARIABLE. When the local end declined,
 * the message said to set `CF_ACCESS_CLIENT_*` — which were already set,
 * correctly, for the end that was not refusing. It named neither which end had
 * refused nor which credential that end wanted, and following it made things
 * worse.
 *
 * WHAT IS PROVED HERE. That the two pairs reach the two ends and never each
 * other's; that the mapping is the same swap the origins already use, so
 * `from-cloud` cannot disagree with `to-cloud` about which machine is which;
 * that the fallback preserving today's single-pair behaviour is still there;
 * and that every refusal — half a pair, a bounced GET, a bounced POST — names
 * the end and that end's own variables.
 *
 * THE TRANSPORT IS INJECTED AND NOTHING ELSE IS, as in REQ-289's suite: these
 * drive the real resolution, the real headers and the real refusal text against
 * recorded requests. Two tests spawn the real script over real HTTP, because
 * reading `LOCAL_ACCESS_CLIENT_*` out of the environment is the CLI's own job
 * and is invisible from the library.
 */

const REPO_ROOT = join(__dirname, '..')
const run = promisify(execFile)

const FAKE_CLOUD = 'https://cloud.test'
const FAKE_LOCAL = 'http://local.test'

/** The production pair, as `bin/access-token` mints one. */
const CLOUD_PAIR = { clientId: 'prod.access', clientSecret: 'prod-secret' }

/**
 * The simulator's pair. FIXED, NOT MINTED — `bin/access-sim` defaults to
 * `local-dev.access` / `local-dev-secret`, so the two-pairs case can be
 * exercised with the real values and without starting the simulator.
 */
const LOCAL_PAIR = { clientId: 'local-dev.access', clientSecret: 'local-dev-secret' }

const SITE = {
  slug: 'site_936dd7c92e5e14df694dd9a80433aa4f',
  siteJson: { config: { businessName: 'Lagrange Foundry' } },
  pages: [{ name: 'home.json', page: { kind: 'l1' } }],
  assets: [{ name: 'founder-portrait.jpg', base64: 'AAEC' }],
}

interface Call {
  url: string
  method: string
  headers: Record<string, string>
}

/**
 * Two builders behind two DIFFERENT gates, each refusing the other's pair.
 *
 * THIS IS THE BUG'S OWN CONFIGURATION, and it is the point of the fake: a
 * transport that accepted anything would pass just as happily with one pair
 * sent to both ends, which is the behaviour being fixed. Each side checks the
 * two headers the way `bin/access-sim` does and bounces a mismatch to a login
 * page, so a credential arriving at the wrong end fails the test rather than
 * being silently ignored.
 */
function gatedEnds(pairs: {
  local: { clientId: string; clientSecret: string }
  cloud: { clientId: string; clientSecret: string }
}) {
  const calls: Call[] = []
  const impl = (async (url: string, init: RequestInit) => {
    const parsed = new URL(url)
    const headers = (init.headers ?? {}) as Record<string, string>
    calls.push({ url, method: init.method ?? 'GET', headers })
    const answer = (status: number, body: unknown) => ({
      ok: status >= 200 && status < 300,
      status,
      text: () => Promise.resolve(typeof body === 'string' ? body : JSON.stringify(body)),
    })
    const side = parsed.origin === FAKE_CLOUD ? 'cloud' : 'local'
    const want = pairs[side]
    if (
      headers['CF-Access-Client-Id'] !== want.clientId ||
      headers['CF-Access-Client-Secret'] !== want.clientSecret
    ) {
      // What Access does: a 302 at the edge, not a JSON error from the origin.
      return answer(302, '')
    }
    if (parsed.pathname === '/api/businesses') {
      return answer(200, {
        person: null,
        businesses: [
          {
            id: side === 'cloud' ? 'biz_cloud' : 'biz_local',
            name: 'Lagrange Foundry',
            selectable: true,
            lapse: null,
          },
        ],
      })
    }
    if (parsed.pathname.endsWith('/api/export')) return answer(200, SITE)
    if (parsed.pathname.endsWith('/api/import')) {
      return answer(200, { site: 'site_landed', pages: 1, assets: 1, siteJson: true })
    }
    return answer(404, { error: `no route ${parsed.pathname}` })
  }) as unknown as typeof fetch
  return { impl, calls }
}

describe('BUG-134 — two ends, two credentials', () => {
  it('test_UAT_FC_BUG-134_each_end_gets_its_own_pair_and_neither_gets_the_others', async () => {
    // THE ACCEPTANCE CRITERION, as the ticket states it: the simulator's pair in
    // LOCAL_ACCESS_CLIENT_*, the production pair in CF_ACCESS_CLIENT_*, and both
    // ends authenticated in ONE run with no credential shared between them and
    // nothing retyped into `access-sim`. The fake refuses the wrong pair, so
    // this cannot pass by both ends being lenient.
    const { impl, calls } = gatedEnds({ local: LOCAL_PAIR, cloud: CLOUD_PAIR })
    const result = await copySite('Lagrange Foundry', {
      direction: 'to-cloud',
      local: FAKE_LOCAL,
      cloud: FAKE_CLOUD,
      cloudAccess: CLOUD_PAIR,
      localAccess: LOCAL_PAIR,
      fetch: impl,
    })
    expect(result.to.id).toBe('biz_cloud')
    expect(result.from.id).toBe('biz_local')

    // NOT ONE CALL CARRIED THE OTHER END'S CREDENTIAL. A production secret
    // reaching the laptop is the half of this bug the workaround made real.
    expect(calls.length).toBeGreaterThan(2)
    for (const call of calls) {
      const want = call.url.startsWith(FAKE_CLOUD) ? CLOUD_PAIR : LOCAL_PAIR
      expect(call.headers['CF-Access-Client-Id']).toBe(want.clientId)
      expect(call.headers['CF-Access-Client-Secret']).toBe(want.clientSecret)
    }
    expect(calls.some((c) => c.url.startsWith(FAKE_LOCAL))).toBe(true)
    expect(calls.some((c) => c.url.startsWith(FAKE_CLOUD))).toBe(true)
  })

  it('test_UAT_FC_BUG-134_the_credentials_are_swapped_by_the_same_function_as_the_origins', async () => {
    // ONE SWAP IN THE CODEBASE. The origins, the credentials and the end names
    // are three per-END facts read per-ROLE, and writing the conditional out a
    // second time is how it gets reversed in the direction nobody runs daily.
    // So the same function does all three, and this asserts that rather than
    // believing the comment.
    expect(byEnd('to-cloud', 'L', 'C')).toEqual({ source: 'L', destination: 'C' })
    expect(byEnd('from-cloud', 'L', 'C')).toEqual({ source: 'C', destination: 'L' })

    expect(endsFor('to-cloud', FAKE_LOCAL, FAKE_CLOUD)).toEqual({
      source: FAKE_LOCAL,
      destination: FAKE_CLOUD,
    })
    expect(accessFor('to-cloud', LOCAL_PAIR, CLOUD_PAIR)).toEqual({
      source: LOCAL_PAIR,
      destination: CLOUD_PAIR,
    })
    expect(endNamesFor('to-cloud')).toEqual({ source: 'local', destination: 'cloud' })

    // And from-cloud is to-cloud with the ends swapped — on all three at once.
    expect(accessFor('from-cloud', LOCAL_PAIR, CLOUD_PAIR)).toEqual({
      source: CLOUD_PAIR,
      destination: LOCAL_PAIR,
    })
    expect(endNamesFor('from-cloud')).toEqual({ source: 'cloud', destination: 'local' })

    // Which the wire agrees with: pulling DOWN, the cloud pair must be on the
    // read and the local pair on the write, or the import lands unauthenticated.
    const { impl, calls } = gatedEnds({ local: LOCAL_PAIR, cloud: CLOUD_PAIR })
    await copySite('Lagrange Foundry', {
      direction: 'from-cloud',
      local: FAKE_LOCAL,
      cloud: FAKE_CLOUD,
      cloudAccess: CLOUD_PAIR,
      localAccess: LOCAL_PAIR,
      fetch: impl,
    })
    const post = calls.find((c) => c.method === 'POST')
    expect(post?.url.startsWith(FAKE_LOCAL)).toBe(true)
    expect(post?.headers['CF-Access-Client-Id']).toBe(LOCAL_PAIR.clientId)
  })

  it('test_UAT_FC_BUG-134_an_absent_local_pair_falls_back_to_the_cloud_one', async () => {
    // THE FIX ADDS A WAY TO SAY THE ENDS DIFFER; IT DOES NOT FORCE ANYONE TO.
    // One credential genuinely serving both is a real configuration — a UAT
    // aiming both ends at a single fake, or a local builder with no gate at all,
    // which ignores the headers either way — and that is what this did before.
    expect(accessFor('to-cloud', undefined, CLOUD_PAIR)).toEqual({
      source: CLOUD_PAIR,
      destination: CLOUD_PAIR,
    })
    // The fallback runs one way only: the cloud end never borrows the local pair.
    expect(accessFor('to-cloud', LOCAL_PAIR, undefined)).toEqual({
      source: LOCAL_PAIR,
      destination: undefined,
    })

    // Both ends behind the SAME gate, and only the cloud pair supplied.
    const { impl, calls } = gatedEnds({ local: CLOUD_PAIR, cloud: CLOUD_PAIR })
    await copySite('Lagrange Foundry', {
      direction: 'to-cloud',
      local: FAKE_LOCAL,
      cloud: FAKE_CLOUD,
      cloudAccess: CLOUD_PAIR,
      fetch: impl,
    })
    for (const call of calls) {
      expect(call.headers['CF-Access-Client-Id']).toBe(CLOUD_PAIR.clientId)
    }
  })
})

describe('BUG-134 — a refusal names the end and that end‑s credential', () => {
  it('test_UAT_FC_BUG-134_a_bounced_read_names_the_end_that_refused', async () => {
    // THE SECOND HALF OF THE BUG. "That end is behind Cloudflare Access. Set
    // CF_ACCESS_CLIENT_ID…" named neither which end refused nor which credential
    // it wanted, and the operator had already set that pair — for the end that
    // was not the problem. A copy has two ends and the operator has two pairs.
    const bounce = (async () => ({
      ok: false,
      status: 302,
      text: () => Promise.resolve(''),
    })) as unknown as typeof fetch

    const local = exportSite(FAKE_LOCAL, 'Lagrange Foundry', { end: 'local', fetch: bounce })
    await expect(local).rejects.toThrow(/The LOCAL end is behind Cloudflare Access/)
    await expect(local).rejects.toThrow(
      /LOCAL_ACCESS_CLIENT_ID[\s\S]*LOCAL_ACCESS_CLIENT_SECRET[\s\S]*--local-client-id/,
    )
    // And it points at the tool that mints a pair THIS end accepts.
    await expect(local).rejects.toThrow(/access-sim --print-token/)
    // Naming the other end's variables is what sent the operator the wrong way.
    await expect(local).rejects.not.toThrow(/Set CF_ACCESS_CLIENT_ID/)

    const cloud = exportSite(FAKE_CLOUD, 'Lagrange Foundry', { end: 'cloud', fetch: bounce })
    await expect(cloud).rejects.toThrow(
      /The CLOUD end is behind Cloudflare Access[\s\S]*CF_ACCESS_CLIENT_ID[\s\S]*bin\/access-token/,
    )
  })

  it('test_UAT_FC_BUG-134_a_bounced_import_names_the_destination_end_not_the_cloud', async () => {
    // `postSitePayload` HAD THE SAME DEFECT ONE LAYER DOWN, and it could not be
    // fixed by editing the text: `1c push` shares the function and its target
    // really is the cloud, while `copy-from-cloud`'s destination is the laptop.
    // So the end reaches the sentence as a parameter.
    const bounce = (async () => ({
      ok: false,
      status: 302,
      text: () => Promise.resolve(''),
    })) as unknown as typeof fetch
    const payload = SITE as unknown as SitePayload

    await expect(
      postSitePayload(payload, {
        url: `${FAKE_LOCAL}/b/biz_local/api/import`,
        subject: "Copy of 'Lagrange Foundry'",
        end: 'local',
        fetch: bounce,
      }),
    ).rejects.toThrow(/The LOCAL end is behind[\s\S]*LOCAL_ACCESS_CLIENT_ID/)

    await expect(
      postSitePayload(payload, {
        url: `${FAKE_CLOUD}/b/biz_cloud/api/import`,
        subject: "Copy of 'Lagrange Foundry'",
        end: 'cloud',
        fetch: bounce,
      }),
    ).rejects.toThrow(/The CLOUD end is behind[\s\S]*CF_ACCESS_CLIENT_ID/)

    // Reached through the real copy, whose from-cloud destination IS the local
    // end — the case that read as advice about the wrong machine.
    const { impl } = gatedEnds({ local: LOCAL_PAIR, cloud: CLOUD_PAIR })
    await expect(
      copySite('Lagrange Foundry', {
        direction: 'from-cloud',
        local: FAKE_LOCAL,
        cloud: FAKE_CLOUD,
        cloudAccess: CLOUD_PAIR,
        // No local pair, so the cloud's is what reaches the laptop — and that
        // gate refuses it, which is the operator's own configuration.
        fetch: impl,
      }),
    ).rejects.toThrow(/The LOCAL end is behind[\s\S]*LOCAL_ACCESS_CLIENT_ID/)
  })

  it('test_UAT_FC_BUG-134_half_a_local_pair_is_refused_exactly_as_half_a_cloud_pair_is', async () => {
    // HALF A CREDENTIAL IS NOT A WEAKER CREDENTIAL whichever machine it was
    // meant for, so there is no second rule — one function, one sentence, the
    // refusing end's own variables in it.
    expect(() => serviceToken('local-dev.access', undefined, 'local')).toThrow(
      /is a PAIR[\s\S]*LOCAL_ACCESS_CLIENT_ID[\s\S]*LOCAL_ACCESS_CLIENT_SECRET/,
    )
    expect(() => serviceToken(undefined, 'local-dev-secret', 'local')).toThrow(
      /--local-client-id[\s\S]*--local-client-secret/,
    )
    expect(() => serviceToken('prod.access', undefined, 'cloud')).toThrow(
      /is a PAIR[\s\S]*CF_ACCESS_CLIENT_ID[\s\S]*bin\/access-token/,
    )
    // Both halves absent is still "no credential", on either end.
    expect(serviceToken(undefined, undefined, 'local')).toBeUndefined()
    expect(serviceToken(' ', ' ', 'local')).toBeUndefined()
    // CLOUDFLARE_API_TOKEN stays named on both: it is the credential an operator
    // reaches for and the one thing that cannot work, whichever end they meant.
    expect(() => serviceToken('x', undefined, 'local')).toThrow(/CLOUDFLARE_API_TOKEN/)

    // ONE TABLE, NOT FIVE STRING LITERALS. Every sentence above is built from
    // the same row, which is why the two ends cannot drift apart again.
    expect(accessAdvice('local')).toContain('LOCAL_ACCESS_CLIENT_ID')
    expect(accessAdvice('local')).not.toContain('CF_ACCESS_CLIENT_ID')
    expect(accessAdvice('cloud')).toContain('CF_ACCESS_CLIENT_ID')
    expect(accessAdvice('cloud')).not.toContain('LOCAL_ACCESS_CLIENT_ID')
  })
})

/**
 * The part that belongs to the command rather than to the library: reading each
 * end's pair out of the environment, and saying so in the help.
 */
describe('BUG-134 — the operator scripts', () => {
  /** A builder that admits exactly one pair, as `bin/access-sim` does. */
  async function gatedBuilder(pair: { clientId: string; clientSecret: string }): Promise<{
    origin: string
    seen: Call[]
    close: () => void
  }> {
    const seen: Call[] = []
    const server = http.createServer((req, res) => {
      const url = new URL(req.url ?? '/', 'http://127.0.0.1')
      seen.push({
        url: url.pathname,
        method: req.method ?? 'GET',
        headers: req.headers as unknown as Record<string, string>,
      })
      res.setHeader('content-type', 'application/json')
      if (
        req.headers['cf-access-client-id'] !== pair.clientId ||
        req.headers['cf-access-client-secret'] !== pair.clientSecret
      ) {
        res.statusCode = 302
        res.setHeader('location', 'https://example.cloudflareaccess.com/cdn-cgi/access/login')
        res.end('')
        return
      }
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
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
    const addr = server.address()
    return {
      origin: `http://127.0.0.1:${typeof addr === 'object' && addr ? addr.port : 0}`,
      seen,
      close: () => server.close(),
    }
  }

  it('test_UAT_FC_BUG-134_the_command_reads_the_local_pair_from_its_own_variables', async () => {
    // THE WHOLE ACCEPTANCE, THROUGH THE REAL SCRIPT. The gated builder stands in
    // for `bin/access-sim` and admits only its own pair, while CF_ACCESS_CLIENT_*
    // hold the production values — exactly the operator's machine. A `--backup`
    // reads the local end and writes nothing to the cloud, so this authenticates
    // the local end with the local pair and nothing else is required.
    const sim = await gatedBuilder(LOCAL_PAIR)
    try {
      const out = join(REPO_ROOT, '.xgd', 'tmp', 'bug134-backup.json')
      const { stdout } = await run(
        join(REPO_ROOT, 'bin/copy-to-cloud'),
        ['--origin', sim.origin, '--backup', out, 'Lagrange Foundry'],
        {
          cwd: REPO_ROOT,
          env: {
            ...process.env,
            CF_ACCESS_CLIENT_ID: CLOUD_PAIR.clientId,
            CF_ACCESS_CLIENT_SECRET: CLOUD_PAIR.clientSecret,
            LOCAL_ACCESS_CLIENT_ID: LOCAL_PAIR.clientId,
            LOCAL_ACCESS_CLIENT_SECRET: LOCAL_PAIR.clientSecret,
          },
        },
      )
      expect(stdout).toContain("backed up 'Lagrange Foundry'")
      // THE PRODUCTION SECRET NEVER REACHED THE LAPTOP. Putting it there is what
      // the workaround did, and it is the reason this is a bug and not a
      // papercut.
      expect(sim.seen.length).toBeGreaterThan(0)
      for (const call of sim.seen) {
        expect(call.headers['cf-access-client-id']).toBe(LOCAL_PAIR.clientId)
        expect(call.headers['cf-access-client-secret']).toBe(LOCAL_PAIR.clientSecret)
      }
    } finally {
      sim.close()
    }
  }, 120000)

  it('test_UAT_FC_BUG-134_the_wrong_pair_on_the_local_end_is_told_which_one_it_wants', async () => {
    // The failure the operator actually met, now answered. With only the cloud
    // pair set, the simulator bounces — and the sentence names the LOCAL end,
    // the LOCAL variables and the tool that prints a pair it accepts, instead of
    // the pair that was already correct for the other end.
    const sim = await gatedBuilder(LOCAL_PAIR)
    try {
      await expect(
        run(
          join(REPO_ROOT, 'bin/copy-to-cloud'),
          ['--origin', sim.origin, '--backup', '/dev/null', 'Lagrange Foundry'],
          {
            cwd: REPO_ROOT,
            env: {
              ...process.env,
              CF_ACCESS_CLIENT_ID: CLOUD_PAIR.clientId,
              CF_ACCESS_CLIENT_SECRET: CLOUD_PAIR.clientSecret,
              LOCAL_ACCESS_CLIENT_ID: '',
              LOCAL_ACCESS_CLIENT_SECRET: '',
            },
          },
        ),
      ).rejects.toThrow(/The LOCAL end is behind[\s\S]*LOCAL_ACCESS_CLIENT_ID/)
    } finally {
      sim.close()
    }
  }, 120000)

  it('test_UAT_FC_BUG-134_both_help_texts_describe_both_pairs_and_which_end_each_reaches', async () => {
    // THE VARIABLE NAMES APPEAR IN SIX PLACES and this bug is what one of them
    // naming the wrong credential costs. The three the operator reads are
    // asserted here; the three in the refusals are asserted above, and all six
    // are built from one table.
    const texts = await Promise.all([
      run(join(REPO_ROOT, 'bin/copy-to-cloud'), ['--help'], { cwd: REPO_ROOT }),
      run(join(REPO_ROOT, 'bin/copy-from-cloud'), ['--help'], { cwd: REPO_ROOT }),
      run(join(REPO_ROOT, 'bin/1c'), ['--help'], { cwd: REPO_ROOT }),
    ])
    for (const { stdout } of texts) {
      expect(stdout).toContain('CF_ACCESS_CLIENT_ID')
      expect(stdout).toContain('LOCAL_ACCESS_CLIENT_ID')
      expect(stdout).toContain('--local-client-id')
      // WHICH END EACH REACHES, and not merely that both exist: a list of four
      // variables with no machine attached to them is the message that failed.
      expect(stdout).toMatch(/CLOUD end/)
      expect(stdout).toMatch(/LOCAL end/)
      // And the trap in `--print-token`, which emits the CLOUD names.
      expect(stdout).toContain('--print-token')
    }
  }, 120000)
})

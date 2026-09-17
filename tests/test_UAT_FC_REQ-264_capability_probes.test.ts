import { describe, expect, it } from 'vitest'
import {
  EXIT,
  EXPIRY_WARNING_DAYS,
  PROBES,
  formatReport,
  oneLine,
  readRecords,
  record,
  runProbe,
  // @ts-expect-error — plain JS with no type declarations, deliberately: it runs
  // from a deploy hook under bare `node`, with no transform available.
} from '../bin/deploy.d/lib/probe.mjs'

/**
 * [[REQ-264]] — **a credential that exists is not a credential that works.**
 *
 * WHAT WENT WRONG. Every hook under `bin/deploy.d/secrets/` answered one
 * question — *is there a value* — and a Resend **Sending access** key passed it,
 * shipped, and 401'd the first time a customer pressed `Send email from this
 * domain`. The hazard was written down in `resend.ts` before it happened
 * (*"would offer the toggle and refuse it, which is worse than not offering
 * it"*) and nothing detected it.
 *
 * WHAT MAKES THIS EVIDENCE. Every case drives the SHIPPED probe module — the
 * same file `bin/deploy.d/lib/secret.sh` runs — against a fake `fetch`. A suite
 * holding a real key would not fail against the real API; it would succeed, and
 * against the account this product actually sends from. So the credential is
 * always a string nobody could use and the provider is always a double, which is
 * what makes the branches that matter (*valid but wrongly scoped*, *expiring*,
 * *refused*) reachable at all.
 *
 * THE CLAIMS, in the order the ticket makes them:
 *
 *  1. A SENDING-ONLY KEY IS ITS OWN VERDICT — not capable, and not invalid
 *     either, because it still sends every message this product sends.
 *  2. THE PROBE IS THE CALL THE PRODUCT MAKES. `GET /domains` is the request
 *     that failed in the field; a health check on another endpoint would answer
 *     200 for the broken key and prove the wrong thing.
 *  3. NOTHING IS WRITTEN, SENT OR CREATED. Every request is a read, with one
 *     stated exception that still creates nothing.
 *  4. EXPIRY IS THE *"up to date"* HALF, and is answered honestly — with the
 *     date where a provider exposes one, and with the reason where none does.
 *     Never blank, because blank reads as *checked and fine*.
 *  5. A PROVIDER THAT DID NOT ANSWER IS NOT A VERDICT ABOUT THE KEY.
 *  6. AN UNPROBED CREDENTIAL READS AS UNVERIFIED AND NEVER AS OK.
 *  7. THE REPORT NAMES WHAT IS OFF IN THE SHIPPED PRODUCT, in a sentence.
 */

/** A `fetch` double that answers from a table and records every request. */
function provider(table: Record<string, { status: number; body?: unknown }>) {
  const asked: { method: string; url: string }[] = []
  const fetchImpl = async (url: string | URL, options: RequestInit = {}) => {
    const href = String(url)
    asked.push({ method: options.method ?? 'GET', url: href })
    const hit =
      table[href] ?? Object.entries(table).find(([key]) => href.startsWith(key))?.[1]
    if (hit === undefined) throw new Error(`no double for ${options.method ?? 'GET'} ${href}`)
    return new Response(JSON.stringify(hit.body ?? {}), {
      status: hit.status,
      headers: { 'content-type': 'application/json' },
    })
  }
  return { asked, fetchImpl: fetchImpl as unknown as typeof fetch }
}

const RESEND = 'https://api.resend.com/domains'
const VERIFY = 'https://api.cloudflare.com/client/v4/user/tokens/verify'
const ZONES = 'https://api.cloudflare.com/client/v4/zones'
const NOW = Date.parse('2026-09-16T00:00:00Z')

/** A credential no provider could ever accept — every suite here uses these. */
const FAKE = 'do-not-print-me-and-do-not-use-me'

describe('REQ-264 — capability probes', () => {
  // ── 1 and 2: the failure this ticket exists for ────────────────────────────

  it('test_UAT_FC_REQ-264_a_sending_only_resend_key_is_degraded_not_broken', async () => {
    const { asked, fetchImpl } = provider({
      [RESEND]: { status: 401, body: { message: 'This API key is restricted to only send emails' } },
    })
    const row = await runProbe('RESEND_API_KEY', { RESEND_API_KEY: FAKE }, fetchImpl, NOW)

    // NOT CAPABLE — which is the whole defect: this exact key passed before.
    expect(row.verdict).toBe('insufficient')
    // AND NOT INVALID EITHER. It sends, and the hook must not refuse the deploy
    // over a capability the deployment is allowed to be without.
    expect(row.can).toContain('send mail')
    expect(row.cannot.join(' ')).toMatch(/manage sending domains/i)
    expect(row.cannot.join(' ')).toMatch(/Full access/)
    // THE CONSEQUENCE IS NAMED IN THE SHIPPED PRODUCT'S OWN TERMS.
    expect(row.effect).toMatch(/Your domain/)
    expect(row.effect).toMatch(/toggle/)

    // THE PROBE IS THE CALL THE PRODUCT MAKES — the one that failed in the field.
    expect(asked).toEqual([{ method: 'GET', url: RESEND }])
  })

  it('test_UAT_FC_REQ-264_a_full_access_resend_key_is_capable', async () => {
    const { fetchImpl } = provider({ [RESEND]: { status: 200, body: { data: [] } } })
    const row = await runProbe('RESEND_API_KEY', { RESEND_API_KEY: FAKE }, fetchImpl, NOW)
    expect(row.verdict).toBe('capable')
    expect(row.cannot).toEqual([])
  })

  it('test_UAT_FC_REQ-264_a_key_the_provider_does_not_recognise_is_invalid', async () => {
    // A REFUSAL THAT IS NOT ABOUT SCOPE. The two arrive as one 401 and must not
    // stay one: a sending-only key is a deployment choice, an unrecognised key
    // is an operator error, and the hooks answer them differently.
    const { fetchImpl } = provider({
      [RESEND]: { status: 401, body: { message: 'API key is invalid' } },
    })
    const row = await runProbe('RESEND_API_KEY', { RESEND_API_KEY: FAKE }, fetchImpl, NOW)
    expect(row.verdict).toBe('invalid')
    expect(row.can).toEqual([])
  })

  // ── the zone credential, which is where expiry lives ───────────────────────

  const activeToken = (over: Record<string, unknown> = {}) => ({
    status: 200,
    body: { success: true, result: { id: 'tok', status: 'active', ...over } },
  })

  it('test_UAT_FC_REQ-264_a_zone_token_that_sees_the_zones_is_capable_and_says_edit_is_inferred', async () => {
    const { asked, fetchImpl } = provider({
      [VERIFY]: activeToken({ expires_on: null }),
      [ZONES]: { status: 200, body: { success: true, result: [{ id: 'z' }] } },
    })
    const row = await runProbe('CLOUDFLARE_DNS_TOKEN', { CLOUDFLARE_DNS_TOKEN: FAKE }, fetchImpl, NOW)
    expect(row.verdict).toBe('capable')
    // `Zone:DNS:Edit` CANNOT BE PROVEN WITHOUT WRITING, so it is not claimed to
    // have been. A report that said "verified" about a request it never made
    // would be the confident answer this ticket exists to remove.
    expect(row.can.join(' ')).toMatch(/INFERRED/)
    expect(asked.map((a) => a.method)).toEqual(['GET', 'GET'])
  })

  it('test_UAT_FC_REQ-264_a_zone_token_that_cannot_see_the_zones_is_insufficient', async () => {
    // THE WORKERS-AI-SCOPED TOKEN. It authenticates, so a presence check and a
    // naive "does it 200" check both pass; the selector it is supposed to fill
    // would draw an empty pool.
    const { fetchImpl } = provider({
      [VERIFY]: activeToken(),
      [ZONES]: { status: 403, body: { success: false, errors: [{ message: 'not authorized' }] } },
    })
    const row = await runProbe('CLOUDFLARE_DNS_TOKEN', { CLOUDFLARE_DNS_TOKEN: FAKE }, fetchImpl, NOW)
    expect(row.verdict).toBe('insufficient')
    expect(row.cannot.join(' ')).toMatch(/zones/)
  })

  it('test_UAT_FC_REQ-264_an_expiry_inside_the_window_is_reported_with_its_date', async () => {
    const soon = new Date(NOW + 11 * 86400000).toISOString()
    const { fetchImpl } = provider({
      [VERIFY]: activeToken({ expires_on: soon }),
      [ZONES]: { status: 200, body: { success: true, result: [{ id: 'z' }] } },
    })
    const row = await runProbe('CLOUDFLARE_DNS_TOKEN', { CLOUDFLARE_DNS_TOKEN: FAKE }, fetchImpl, NOW)
    // STILL CAPABLE — it works today. What is being reported is a DATE, because
    // the alternative is a deploy that starts failing on a day nobody wrote down.
    expect(row.verdict).toBe('capable')
    expect(row.expiry).toContain(soon)
    expect(row.expiry).toMatch(/11 days away/)
    expect(row.expiring).toBe(true)
    expect(EXPIRY_WARNING_DAYS).toBeGreaterThan(11)
    expect(formatReport([row])).toMatch(/inside the warning window/)
  })

  it('test_UAT_FC_REQ-264_a_token_that_is_not_live_is_invalid_and_no_zone_is_asked_for', async () => {
    const { asked, fetchImpl } = provider({
      [VERIFY]: {
        status: 200,
        body: { success: true, result: { status: 'expired', expires_on: '2026-01-01T00:00:00Z' } },
      },
    })
    const row = await runProbe('CLOUDFLARE_DNS_TOKEN', { CLOUDFLARE_DNS_TOKEN: FAKE }, fetchImpl, NOW)
    expect(row.verdict).toBe('invalid')
    // AND IT STOPS THERE. Asking the zones of a token Cloudflare has already
    // disowned would spend a request to learn nothing.
    expect(asked).toHaveLength(1)
  })

  // ── the model credentials ──────────────────────────────────────────────────

  it('test_UAT_FC_REQ-264_a_model_key_is_probed_by_listing_models_and_never_by_spending', async () => {
    const models = 'https://api.anthropic.com/v1/models'
    const { asked, fetchImpl } = provider({ [models]: { status: 200, body: { data: [] } } })
    const row = await runProbe('ANTHROPIC_API_KEY', { ANTHROPIC_API_KEY: FAKE }, fetchImpl, NOW)
    expect(row.verdict).toBe('capable')
    // TAKING A TURN TO FIND OUT WOULD BILL THE ACCOUNT ON EVERY DEPLOY, and the
    // only extra thing it would establish is not a permission.
    expect(asked.every((a) => a.method === 'GET')).toBe(true)
    expect(row.cannot.join(' ')).toMatch(/credit/)

    const refused = provider({ [models]: { status: 401, body: {} } })
    const dead = await runProbe('ANTHROPIC_API_KEY', { ANTHROPIC_API_KEY: FAKE }, refused.fetchImpl, NOW)
    expect(dead.verdict).toBe('invalid')
    expect(dead.effect).toMatch(/cannot take a turn/)
  })

  it('test_UAT_FC_REQ-264_a_refused_openai_key_is_invalid_and_names_the_tool_it_breaks', async () => {
    const { fetchImpl } = provider({ 'https://api.openai.com/v1/models': { status: 401, body: {} } })
    const row = await runProbe('OPENAI_API_KEY', { OPENAI_API_KEY: FAKE }, fetchImpl, NOW)
    expect(row.verdict).toBe('invalid')
    expect(row.effect).toMatch(/create_image/)
  })

  // ── the embedder pair, which is both-or-neither ────────────────────────────

  it('test_UAT_FC_REQ-264_the_workers_ai_pair_is_both_or_neither_and_the_vector_width_is_checked', async () => {
    const half = await runProbe(
      'CLOUDFLARE_API_TOKEN',
      { CLOUDFLARE_API_TOKEN: FAKE },
      provider({}).fetchImpl,
      NOW,
    )
    expect(half.verdict).toBe('insufficient')
    expect(half.cannot.join(' ')).toMatch(/CLOUDFLARE_ACCOUNT_ID/)

    const run = 'https://api.cloudflare.com/client/v4/accounts/acct/ai/run/'
    const env = { CLOUDFLARE_API_TOKEN: FAKE, CLOUDFLARE_ACCOUNT_ID: 'acct' }

    // A MODEL THAT ANSWERS AT THE WRONG WIDTH IS NOT AN ERROR ANYWHERE ELSE. The
    // index and the Worker are both built at 384; vectors of another width are
    // not comparable and the symptom is plausible-looking nonsense, not a throw.
    const narrow = provider({
      [run]: { status: 200, body: { success: true, result: { data: [new Array(256).fill(0)] } } },
    })
    const wrong = await runProbe('CLOUDFLARE_API_TOKEN', env, narrow.fetchImpl, NOW)
    expect(wrong.verdict).toBe('insufficient')
    expect(wrong.cannot.join(' ')).toMatch(/384/)

    const right = provider({
      [run]: { status: 200, body: { success: true, result: { data: [new Array(384).fill(0)] } } },
    })
    const ok = await runProbe('CLOUDFLARE_API_TOKEN', env, right.fetchImpl, NOW)
    expect(ok.verdict).toBe('capable')
  })

  // ── 3: nothing is written, sent or created ────────────────────────────────

  it('test_UAT_FC_REQ-264_no_probe_writes_sends_or_creates_anything', async () => {
    // EVERY PROBE, DRIVEN AT ONCE, with every request recorded. A deploy must
    // not create a DNS record, register a domain or send a message to find out
    // that it could — so the one non-`GET` in the whole set is named here
    // explicitly, and anything else appearing is this ticket's own falsifier.
    const seen: { method: string; url: string }[] = []
    const fetchImpl = (async (url: string | URL, options: RequestInit = {}) => {
      seen.push({ method: options.method ?? 'GET', url: String(url) })
      return new Response(JSON.stringify({ success: true, result: { status: 'active', data: [[]] } }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      })
    }) as unknown as typeof fetch

    const env: Record<string, string> = {
      RESEND_API_KEY: FAKE,
      CLOUDFLARE_DNS_TOKEN: FAKE,
      ANTHROPIC_API_KEY: FAKE,
      OPENAI_API_KEY: FAKE,
      CLOUDFLARE_API_TOKEN: FAKE,
      CLOUDFLARE_ACCOUNT_ID: 'acct',
    }
    for (const credential of Object.keys(PROBES)) {
      await runProbe(credential, env, fetchImpl, NOW)
    }

    const writes = seen.filter((request) => request.method !== 'GET')
    expect(writes.map((w) => `${w.method} ${w.url}`)).toEqual([
      // THE ONE EXCEPTION, AND IT STILL CREATES NOTHING: Workers AI has no read
      // endpoint that proves the model is reachable, so the probe runs the model.
      // An inference registers no domain, writes no record and sends no message.
      'POST https://api.cloudflare.com/client/v4/accounts/acct/ai/run/@cf/baai/bge-small-en-v1.5',
    ])
  })

  // ── 5: a silent provider is not a verdict ─────────────────────────────────

  it('test_UAT_FC_REQ-264_a_provider_that_did_not_answer_is_unproven_and_not_a_verdict', async () => {
    const fetchImpl = (async () => {
      throw new Error('the network went away')
    }) as unknown as typeof fetch
    const row = await runProbe('RESEND_API_KEY', { RESEND_API_KEY: FAKE }, fetchImpl, NOW)
    expect(row.verdict).toBe('unreachable')
    // IT SAYS NOTHING WAS PROVEN rather than anything about the key, because a
    // lost network is not a scoping fact and must never fail a deploy.
    expect(row.can).toEqual([])
    expect(row.cannot.join(' ')).toMatch(/nothing was proven/)
    expect(EXIT.unreachable).not.toBe(EXIT.capable)
  })

  // ── 4 and 6: the honesty rules the report has to keep ─────────────────────

  it('test_UAT_FC_REQ-264_the_expiry_line_is_never_blank_for_any_credential', async () => {
    // A BLANK COLUMN READS AS *CHECKED AND FINE*. Resend keys do not expire and
    // neither model provider exposes an expiry, so the honest answer is a
    // sentence saying which of those it is — never an empty cell.
    const { fetchImpl } = provider({
      [RESEND]: { status: 200, body: { data: [] } },
      [VERIFY]: activeToken({ expires_on: null }),
      [ZONES]: { status: 200, body: { success: true, result: [] } },
      'https://api.anthropic.com/v1/models': { status: 200, body: {} },
      'https://api.openai.com/v1/models': { status: 200, body: {} },
      'https://api.cloudflare.com/client/v4/accounts/': {
        status: 200,
        body: { success: true, result: { data: [new Array(384).fill(0)] } },
      },
    })
    const env: Record<string, string> = {
      RESEND_API_KEY: FAKE,
      CLOUDFLARE_DNS_TOKEN: FAKE,
      ANTHROPIC_API_KEY: FAKE,
      OPENAI_API_KEY: FAKE,
      CLOUDFLARE_API_TOKEN: FAKE,
      CLOUDFLARE_ACCOUNT_ID: 'acct',
    }
    for (const credential of Object.keys(PROBES)) {
      const row = await runProbe(credential, env, fetchImpl, NOW)
      expect(String(row.expiry).trim(), `${credential} left its expiry blank`).not.toBe('')
    }
    for (const state of ['stored', 'absent', 'unreadable']) {
      const row = record('RESEND_API_KEY', state)
      expect(String(row.expiry).trim(), `an ${state} row left its expiry blank`).not.toBe('')
    }
  })

  it('test_UAT_FC_REQ-264_a_credential_nobody_probed_reads_as_unverified_and_never_as_ok', async () => {
    // A SECRET ON THE WORKER CANNOT BE READ BACK — `wrangler secret list`
    // answers with names — so a deploy that leaves one alone proved nothing
    // about it. Claiming otherwise would be the presence check again.
    const row = record('RESEND_API_KEY', 'stored')
    const printed = formatReport([row])
    expect(printed).toMatch(/unverified/)
    expect(printed).not.toMatch(/\bok\b/)
    expect(row.cannot.join(' ')).toMatch(/cannot be read back/)
    expect(row.effect).toMatch(/nothing is claimed either way/)
    expect(oneLine(row)).toMatch(/not probed/)
  })

  // ── 7: the report itself ──────────────────────────────────────────────────

  it('test_UAT_FC_REQ-264_the_report_names_every_credential_and_what_is_off', async () => {
    const degraded = await runProbe(
      'RESEND_API_KEY',
      { RESEND_API_KEY: FAKE },
      provider({
        [RESEND]: {
          status: 403,
          body: { message: 'This API key is restricted to only send emails' },
        },
      }).fetchImpl,
      NOW,
    )
    const printed = formatReport([degraded, record('OPENAI_API_KEY', 'absent')])

    // EVERY CREDENTIAL HAS A ROW, in one place, at the moment the operator is
    // looking. A capability that is off in the shipped product and named nowhere
    // in this output is this ticket's own falsifier.
    expect(printed).toMatch(/RESEND_API_KEY — DEGRADED/)
    expect(printed).toMatch(/OPENAI_API_KEY — absent/)
    expect(printed).toMatch(/cannot   manage sending domains/)
    expect(printed).toMatch(/effect .*Your domain/)
    expect(printed).toMatch(/effect .*image tool|effect .*create_image/)

    // AND AN EMPTY REPORT SAYS SO rather than printing nothing, which would be
    // indistinguishable from every credential passing.
    expect(formatReport([])).toMatch(/nothing was probed/)
  })

  it('test_UAT_FC_REQ-264_the_report_file_survives_a_line_it_cannot_read', async () => {
    // A CORRUPT ROW IS A LOST ROW, NOT A FAILED DEPLOY. The report is written by
    // several hooks appending to one file; a half-written line must not take the
    // deploy's last report down with it.
    const rows = readRecords('{"credential":"A","verdict":"absent","can":[],"cannot":[],"expiry":"x"}\nnot json\n\n')
    expect(rows).toHaveLength(1)
    expect(rows[0].credential).toBe('A')
  })
})

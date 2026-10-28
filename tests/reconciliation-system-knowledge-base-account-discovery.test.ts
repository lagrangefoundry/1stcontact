import { afterEach, describe, expect, it, vi } from 'vitest'
import { chmodSync, existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import {
  buildKb,
  corpusDir,
  KB_USAGE,
  resolveDescriber,
  resolveEmbedder,
} from '../tools/generate/src/cli/kb'

/**
 * Reconciliation UATs for story-c4f329d3 — **what indexing asks of the operator**
 * (AC-1306 as restated by BUG-49, AC-2058, AC-2059).
 *
 * Indexing needs one value, the Cloudflare API token. The account id is a path
 * segment the token can answer for itself, so it is discovered by
 * `GET /accounts` and only ever set as an override.
 *
 * WHAT IS STOOD IN FOR. Three boundaries, each doubled at its own seam:
 *
 *   • Cloudflare's REST API — `fetch`, stubbed per case to return the envelope
 *     Cloudflare would return, including the `success: false`-under-200 refusal
 *     a happy-path stub never exercises;
 *   • the ticket store — the `xgd` CLI `readDocTickets` shells out to, replaced
 *     on `PATH` by a shim, so the refusals are driven through `buildKb` itself;
 *   • the models — `tests/fixtures/kb-stub-model.mjs`, named through the
 *     `LAGRANGE_KM_EMBEDDER` / `LAGRANGE_KM_DESCRIBER` seams production ships.
 *
 * Everything else — `buildKb`, `resolveEmbedder`, the account resolution and its
 * diagnoses — is the shipped code.
 */

const STUB = path.resolve('tests/fixtures/kb-stub-model.mjs')
const TOKEN = 'cf-api-token-under-test'
const ACCOUNTS_URL = 'https://api.cloudflare.com/client/v4/accounts'

/** Two member documents on separate subjects — enough for a map with territories. */
const STORE = [
  {
    uid: 'doc-doc-a',
    id: 'DOC-A',
    title: 'Carousel behaviour module',
    body: '## Slides\n\nA carousel rotates slides on a timer and pauses on hover.\n',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-02T00:00:00Z',
    fields: { doc_kind: 'system_kb' },
  },
  {
    uid: 'doc-doc-b',
    id: 'DOC-B',
    title: 'Invoice payments through Stripe',
    body: '## Billing\n\nInvoices are paid through Stripe checkout; card data is never stored.\n',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-02T00:00:00Z',
    fields: { doc_kind: 'system_kb' },
  },
]

const scratch: string[] = []

/** A scratch directory, removed after the test. */
function tempDir(prefix: string): string {
  const dir = mkdtempSync(path.join(tmpdir(), prefix))
  scratch.push(dir)
  return dir
}

/** Put an `xgd` on `PATH` that answers the listing with `STORE`, whole. */
function installStore(): () => void {
  const dir = tempDir('kb-store-')
  const shim = path.join(dir, 'xgd')
  writeFileSync(
    shim,
    `#!/usr/bin/env node\nprocess.stdout.write(${JSON.stringify(
      JSON.stringify({ items: STORE, next_cursor: null, truncated: false }),
    )})\n`,
    'utf8',
  )
  chmodSync(shim, 0o755)
  const previous = process.env.PATH
  process.env.PATH = `${dir}${path.delimiter}${previous ?? ''}`
  return () => {
    process.env.PATH = previous
  }
}

/** Run `fn` with `env` overlaid on `process.env` (`undefined` deletes), then restore. */
async function withEnv<T>(
  env: Record<string, string | undefined>,
  fn: () => Promise<T>,
): Promise<T> {
  const saved = new Map(Object.keys(env).map((name) => [name, process.env[name]]))
  for (const [name, value] of Object.entries(env)) {
    if (value === undefined) delete process.env[name]
    else process.env[name] = value
  }
  try {
    return await fn()
  } finally {
    for (const [name, value] of saved) {
      if (value === undefined) delete process.env[name]
      else process.env[name] = value
    }
  }
}

/** Drive `buildKb` over a scratch tree and the controlled store; resolve to its error message. */
async function buildFailure(env: Record<string, string | undefined>): Promise<string> {
  const restore = installStore()
  try {
    const root = tempDir('kb-')
    return await withEnv(env, () =>
      buildKb(root).then(
        () => '',
        (err: Error) => err.message,
      ),
    )
  } finally {
    restore()
  }
}

/** Cloudflare's envelope for a successful list. */
function accountsResponse(accounts: { id: string; name?: string }[]): Response {
  return new Response(JSON.stringify({ success: true, errors: [], result: accounts }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  })
}

/** Answer every `fetch` with `respond()`, recording the calls. */
function stubFetch(respond: () => Response | Promise<Response>): ReturnType<typeof vi.fn> {
  const spy = vi.fn(async () => respond())
  vi.stubGlobal('fetch', spy)
  return spy
}

afterEach(() => {
  vi.unstubAllGlobals()
  while (scratch.length) rmSync(scratch.pop()!, { recursive: true, force: true })
})

describe('story-c4f329d3 — indexing needs the token, and the account is asked of it', () => {
  it('test_UAT_AC1306_indexing_is_refused_without_the_token_naming_the_account_id_as_an_override', async () => {
    // A build with no token and no named embedder is refused before any model or
    // Cloudflare call — and the refusal asks for ONE value, not two.
    const fetchSpy = stubFetch(() => accountsResponse([]))
    const message = await buildFailure({
      LAGRANGE_KM_EMBEDDER: undefined,
      LAGRANGE_KM_DESCRIBER: STUB,
      CLOUDFLARE_API_TOKEN: undefined,
      CLOUDFLARE_ACCOUNT_ID: undefined,
    })
    expect(message).toContain('set CLOUDFLARE_API_TOKEN')
    expect(message).toMatch(/index/i)
    // The account id is presented as the optional override it is…
    expect(message).toContain('discovered from the token')
    expect(message).toMatch(/CLOUDFLARE_ACCOUNT_ID is only needed to override/)
    // …never as a second required value.
    expect(message).not.toMatch(/set CLOUDFLARE_ACCOUNT_ID and/)
    expect(message).not.toMatch(/set CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID/)
    expect(fetchSpy).not.toHaveBeenCalled()

    // The map's prose needs no credential of its own: with no model API key the
    // describing seam still resolves a backend, and names it.
    const describer = await withEnv(
      { ANTHROPIC_API_KEY: undefined, LAGRANGE_KM_DESCRIBER: undefined },
      () => resolveDescriber(),
    )
    expect(typeof describer.describe).toBe('function')
    expect(describer.name).toBeTruthy()

    // …and a build with no model API key writes the map and reports who wrote it.
    const restore = installStore()
    try {
      const root = tempDir('kb-')
      const built = await withEnv(
        {
          ANTHROPIC_API_KEY: undefined,
          LAGRANGE_KM_EMBEDDER: STUB,
          LAGRANGE_KM_DESCRIBER: STUB,
        },
        () => buildKb(root),
      )
      expect(built.describer).toBe('stub-describer')
      expect(existsSync(path.join(corpusDir(root), 'awareness.md'))).toBe(true)
    } finally {
      restore()
    }

    // The usage text states the same facts before anything is run.
    expect(KB_USAGE).toContain('needs CLOUDFLARE_API_TOKEN')
    expect(KB_USAGE).toMatch(/account\s+is discovered from the token/)
    expect(KB_USAGE).toMatch(/set CLOUDFLARE_ACCOUNT_ID only when the token sees\s+more than one account/)
    expect(KB_USAGE).toMatch(/too narrowly scoped to list them/)
    expect(KB_USAGE).toMatch(/needs no credentials/i)
  }, 120_000)

  it('test_UAT_AC2058_the_token_alone_resolves_the_account_and_an_explicit_id_costs_no_call', async () => {
    // The token alone is enough — with the account id unset, and with it blank.
    for (const accountId of [undefined, '', '   ']) {
      const fetchSpy = stubFetch(() => accountsResponse([{ id: 'acct-solo', name: 'Lagrange' }]))
      const env: Record<string, string> = { CLOUDFLARE_API_TOKEN: TOKEN }
      if (accountId !== undefined) env.CLOUDFLARE_ACCOUNT_ID = accountId

      const embedder = await resolveEmbedder(env)

      expect(embedder.accountId).toBe('acct-solo')
      expect(embedder.apiToken).toBe(TOKEN)
      expect(fetchSpy).toHaveBeenCalledTimes(1)
      const [url, init] = fetchSpy.mock.calls[0]
      expect(url).toBe(ACCOUNTS_URL)
      expect((init as RequestInit).headers).toMatchObject({ Authorization: `Bearer ${TOKEN}` })
      vi.unstubAllGlobals()
    }

    // An explicit account id wins, trimmed, and the question is never asked.
    const asked = stubFetch(() => accountsResponse([{ id: 'acct-discovered', name: 'Other' }]))
    const named = await resolveEmbedder({
      CLOUDFLARE_API_TOKEN: TOKEN,
      CLOUDFLARE_ACCOUNT_ID: '  acct-named  ',
    })
    expect(named.accountId).toBe('acct-named')
    expect(asked).not.toHaveBeenCalled()
    vi.unstubAllGlobals()

    // The named-embedder seam comes first: no Cloudflare variable is read, no
    // token is required, and no request is made.
    const untouched = stubFetch(() => accountsResponse([]))
    const seam = await resolveEmbedder({ LAGRANGE_KM_EMBEDDER: STUB })
    expect(seam.name).toBe('stub-hash-384')
    expect(seam.accountId).toBeUndefined()
    expect(untouched).not.toHaveBeenCalled()
  }, 60_000)

  it('test_UAT_AC2059_an_unsettled_account_is_refused_with_a_diagnosis_specific_to_why', async () => {
    const env = {
      LAGRANGE_KM_EMBEDDER: undefined,
      LAGRANGE_KM_DESCRIBER: STUB,
      CLOUDFLARE_API_TOKEN: TOKEN,
      CLOUDFLARE_ACCOUNT_ID: undefined,
    }
    const NO_ACCOUNTS = 'can see no Cloudflare accounts'
    const NARROW = 'Could not ask Cloudflare which account this API token belongs to'

    // Several accounts: counted, each named by name and id, none picked.
    let fetchSpy = stubFetch(() =>
      accountsResponse([
        { id: 'acct-first', name: 'Lagrange Foundry' },
        { id: 'acct-second', name: 'Client Sandbox' },
      ]),
    )
    let message = await buildFailure(env)
    expect(message).toContain('sees 2 accounts')
    expect(message).toContain('Lagrange Foundry (acct-first)')
    expect(message).toContain('Client Sandbox (acct-second)')
    expect(message).toContain('CLOUDFLARE_ACCOUNT_ID')
    expect(message).not.toContain(NO_ACCOUNTS)
    expect(message).not.toContain(NARROW)
    // The only call made was the listing — no embedding against a guessed account.
    expect(fetchSpy.mock.calls.map(([url]) => url)).toEqual([ACCOUNTS_URL])
    vi.unstubAllGlobals()

    // An account Cloudflare returns unnamed is still listed by its id.
    stubFetch(() => accountsResponse([{ id: 'acct-unnamed' }, { id: 'acct-named', name: 'Named' }]))
    message = await buildFailure(env)
    expect(message).toContain('(acct-unnamed)')
    expect(message).toContain('Named (acct-named)')
    vi.unstubAllGlobals()

    // None: the token's scope is the problem, and the override is named.
    stubFetch(() => accountsResponse([]))
    message = await buildFailure(env)
    expect(message).toContain(NO_ACCOUNTS)
    expect(message).toContain('scope')
    expect(message).toContain('CLOUDFLARE_ACCOUNT_ID')
    expect(message).not.toContain(NARROW)
    vi.unstubAllGlobals()

    // Refused — as a 403, and as `success: false` under a 200 — or never
    // completed: each is the narrow-scope diagnosis carrying Cloudflare's reason,
    // and none is ever read as an empty list.
    const refusals: [string, () => Response | Promise<Response>, string][] = [
      [
        '403',
        () =>
          new Response(
            JSON.stringify({ success: false, errors: [{ message: 'Authentication error' }] }),
            { status: 403, headers: { 'content-type': 'application/json' } },
          ),
        'Authentication error',
      ],
      [
        '200 with success:false',
        () =>
          new Response(
            JSON.stringify({ success: false, errors: [{ message: 'Insufficient permissions' }] }),
            { status: 200, headers: { 'content-type': 'application/json' } },
          ),
        'Insufficient permissions',
      ],
      [
        '403 with no reason',
        () => new Response('not json', { status: 403 }),
        'HTTP 403',
      ],
      [
        'transport failure',
        () => Promise.reject(new TypeError('fetch failed: ECONNREFUSED')),
        'ECONNREFUSED',
      ],
    ]
    for (const [label, respond, reason] of refusals) {
      fetchSpy = stubFetch(respond)
      message = await buildFailure(env)
      expect(message, label).toContain(NARROW)
      expect(message, label).toContain(reason)
      expect(message, label).toContain('separate permission')
      expect(message, label).toContain('Workers AI')
      expect(message, label).toContain('not necessarily wrong')
      expect(message, label).toContain('Set CLOUDFLARE_ACCOUNT_ID')
      expect(message, label).not.toContain(NO_ACCOUNTS)
      expect(fetchSpy, label).toHaveBeenCalledTimes(1)
      vi.unstubAllGlobals()
    }
  }, 120_000)
})

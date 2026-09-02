import { afterEach, describe, expect, it, vi } from 'vitest'
import { resolveEmbedder } from '../tools/generate/src/cli/kb'

/**
 * BUG-49 — **the account id is discovered, not demanded**.
 *
 * `1c kb build` used to refuse to start unless the operator set both
 * `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN`. Only one of those is a
 * credential. The other is a path segment in the Workers AI REST URL, and
 * `GET /accounts` returns exactly the accounts a token can see — so the tool was
 * asking the operator to look up and paste a value the token could answer for
 * itself, which `bin/access-token` has never done.
 *
 * WHAT IS REAL HERE AND WHAT IS NOT. The Cloudflare API is the double, and it is
 * the only one: `fetch` is stubbed per case to return the envelope Cloudflare
 * would return — including its `success: false`-under-200 refusal, which is not a
 * shape a happy-path stub would ever exercise. Everything else is the shipped
 * `resolveEmbedder`, and the assertions read the embedder it actually built.
 *
 * `resolveEmbedder` takes its environment as an argument, so no case mutates
 * `process.env` and none can leak a credential into the next one.
 */

/** Cloudflare's envelope for a successful list. */
function accountsResponse(accounts: { id: string; name: string }[]): Response {
  return new Response(JSON.stringify({ success: true, errors: [], result: accounts }), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  })
}

/** A stubbed `fetch` that answers every call with `response`, and records the calls. */
function stubFetch(response: () => Response): ReturnType<typeof vi.fn> {
  const spy = vi.fn(async () => response())
  vi.stubGlobal('fetch', spy)
  return spy
}

const TOKEN = 'cf-api-token-under-test'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('BUG-49 — kb build infers the Cloudflare account from the API token', () => {
  it('test_UAT_FC_BUG-49_token_alone_is_enough', async () => {
    const fetchSpy = stubFetch(() => accountsResponse([{ id: 'acct-solo', name: 'Lagrange' }]))

    const embedder = await resolveEmbedder({ CLOUDFLARE_API_TOKEN: TOKEN })

    // The operator set one variable and got an embedder bound to their account.
    expect(embedder.accountId).toBe('acct-solo')
    expect(embedder.apiToken).toBe(TOKEN)

    const [url, init] = fetchSpy.mock.calls[0]
    expect(url).toBe('https://api.cloudflare.com/client/v4/accounts')
    expect((init as RequestInit).headers).toMatchObject({ Authorization: `Bearer ${TOKEN}` })
  })

  it('test_UAT_FC_BUG-49_explicit_account_wins_and_costs_no_call', async () => {
    const fetchSpy = stubFetch(() => accountsResponse([{ id: 'acct-discovered', name: 'Other' }]))

    const embedder = await resolveEmbedder({
      CLOUDFLARE_API_TOKEN: TOKEN,
      CLOUDFLARE_ACCOUNT_ID: 'acct-named',
    })

    expect(embedder.accountId).toBe('acct-named')
    // Not merely "the named one won" — the question was never asked. This is what
    // keeps a token too narrowly scoped to list accounts usable.
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it('test_UAT_FC_BUG-49_several_accounts_are_named_never_guessed', async () => {
    stubFetch(() =>
      accountsResponse([
        { id: 'acct-first', name: 'Lagrange Foundry' },
        { id: 'acct-second', name: 'Client Sandbox' },
      ]),
    )

    const failure = await resolveEmbedder({ CLOUDFLARE_API_TOKEN: TOKEN }).catch(
      (err: Error) => err,
    )

    // Both accounts named, both ways round: the operator can recognise the one
    // they meant, and can paste the id without a trip to the dashboard.
    expect(failure).toBeInstanceOf(Error)
    expect((failure as Error).message).toContain('Lagrange Foundry (acct-first)')
    expect((failure as Error).message).toContain('Client Sandbox (acct-second)')
    expect((failure as Error).message).toContain('CLOUDFLARE_ACCOUNT_ID')
  })

  it('test_UAT_FC_BUG-49_no_accounts_reads_as_a_scope_problem', async () => {
    stubFetch(() => accountsResponse([]))

    const failure = await resolveEmbedder({ CLOUDFLARE_API_TOKEN: TOKEN }).catch(
      (err: Error) => err,
    )

    expect((failure as Error).message).toContain('can see no Cloudflare accounts')
    expect((failure as Error).message).toContain('scope')
  })

  it('test_UAT_FC_BUG-49_a_token_that_cannot_list_accounts_is_diagnosed', async () => {
    // Cloudflare refuses in two shapes and both mean the same thing. A 200 with
    // `success: false` read as a successful empty list would report the operator's
    // scope as the problem when the scope is fine and only the listing permission
    // is missing — the wrong instruction, delivered confidently.
    const refusals: Response[] = [
      new Response(
        JSON.stringify({ success: false, errors: [{ message: 'Authentication error' }] }),
        { status: 403, headers: { 'content-type': 'application/json' } },
      ),
      new Response(
        JSON.stringify({ success: false, errors: [{ message: 'Insufficient permissions' }] }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      ),
    ]

    for (const refusal of refusals) {
      stubFetch(() => refusal.clone())

      const failure = await resolveEmbedder({ CLOUDFLARE_API_TOKEN: TOKEN }).catch(
        (err: Error) => err,
      )

      const message = (failure as Error).message
      expect(message).toContain('separate permission')
      expect(message).toContain('Workers AI')
      expect(message).toContain('CLOUDFLARE_ACCOUNT_ID')
      // The refusal Cloudflare gave, carried through — an operator debugging a
      // token needs to know which of the two happened.
      expect(message).toMatch(/Authentication error|Insufficient permissions/)
      vi.unstubAllGlobals()
    }
  })

  it('test_UAT_FC_BUG-49_missing_token_stops_asking_for_both', async () => {
    const failure = await resolveEmbedder({}).catch((err: Error) => err)

    const message = (failure as Error).message
    expect(message).toContain('CLOUDFLARE_API_TOKEN')
    // The account id may still be mentioned — but as the override it now is, never
    // as a second thing to go and find. Restating the original demand would be the
    // bug, restated.
    expect(message).not.toMatch(/set CLOUDFLARE_ACCOUNT_ID and/)
    expect(message).toContain('discovered from the token')
  })
})

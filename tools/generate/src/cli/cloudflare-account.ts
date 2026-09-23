/**
 * The Cloudflare account the release-time toolset works in.
 *
 * ONE CREDENTIAL FOR THE TOOLSET, NOT ONE PER COMMAND. `1c kb build` needs
 * Workers AI and `1c fonts publish` ([[REQ-312]]) needs R2, and both are the same
 * question of the same account — so the resolution lives here rather than being
 * answered twice. It was `kb.ts`'s private function until the font mirror needed
 * the same answer; extracting it is the alternative to a second copy that could
 * come to disagree about what an operator must supply.
 */

/** Cloudflare's REST root — the same API `bin/access-token` provisions through. */
export const CLOUDFLARE_API = 'https://api.cloudflare.com/client/v4'

/** One account as `GET /accounts` reports it. */
interface CloudflareAccount {
  id: string
  name?: string
}

/**
 * The Cloudflare account to work in: named by the operator, or asked of the token.
 *
 * THE TOKEN ALREADY KNOWS. `GET /accounts` returns exactly the accounts a token
 * can see, so requiring the operator to look the id up and paste it alongside the
 * credential asks for a value the credential can answer for itself. This is the
 * rule `bin/access-token` has always followed (`resolve_account()` there).
 *
 * AN EXPLICIT ID SHORT-CIRCUITS THE CALL. It is the override, and a build that
 * has been given the answer has no business going to ask for it — which also
 * keeps a token too narrowly scoped to list accounts perfectly usable.
 *
 * SEVERAL ACCOUNTS GET NO GUESS. Taking the first would bind the work to
 * whichever account Cloudflare happened to list first, and the failure would not
 * be an error: it would be a successful run against the wrong account, discovered
 * much later. So they are named back to the operator instead.
 */
export async function resolveAccountId(apiToken: string, env = process.env): Promise<string> {
  const named = (env.CLOUDFLARE_ACCOUNT_ID ?? '').trim()
  if (named) return named

  let accounts: CloudflareAccount[]
  try {
    // Cloudflare answers a refused operation with `success: false` under a 200 as
    // readily as it answers 4xx, so BOTH are checked. Reading only the HTTP status
    // would turn "you may not do that" into an empty account list, and an empty
    // list is reported below as a scope problem the operator does not have.
    const response = await fetch(`${CLOUDFLARE_API}/accounts`, {
      headers: { Authorization: `Bearer ${apiToken}` },
    })
    const payload = (await response.json().catch(() => null)) as {
      success?: boolean
      result?: CloudflareAccount[]
      errors?: { message?: string }[]
    } | null
    if (!response.ok || !payload?.success) {
      const errors = (payload?.errors ?? []).map((e) => e.message ?? '?').join('; ')
      throw new Error(errors || `HTTP ${response.status}`)
    }
    accounts = payload.result ?? []
  } catch (err) {
    // The one failure that would otherwise read as broken work when the credential
    // is fine. Listing accounts is a permission of its own, so a token scoped
    // narrowly can do its job and still be refused here — and the way past it is
    // the override, not a new token.
    throw new Error(
      'Could not ask Cloudflare which account this API token belongs to ' +
        `(GET /accounts: ${err instanceof Error ? err.message : String(err)}). ` +
        'Listing accounts is a separate permission, so a narrowly scoped token can ' +
        'do its job and still be refused here — the credential is not necessarily ' +
        'wrong. Set CLOUDFLARE_ACCOUNT_ID to name the account outright.',
    )
  }

  if (accounts.length === 1) return accounts[0].id
  if (accounts.length === 0) {
    throw new Error(
      'This CLOUDFLARE_API_TOKEN can see no Cloudflare accounts, so there is no ' +
        "account to work in — check the token's scope, or set CLOUDFLARE_ACCOUNT_ID " +
        'to name the account explicitly.',
    )
  }
  const seen = accounts.map((a) => `${a.name ?? '?'} (${a.id})`).join(', ')
  throw new Error(
    `This CLOUDFLARE_API_TOKEN sees ${accounts.length} accounts; set ` +
      'CLOUDFLARE_ACCOUNT_ID to say which one this work belongs in. ' +
      `Saw: ${seen}.`,
  )
}

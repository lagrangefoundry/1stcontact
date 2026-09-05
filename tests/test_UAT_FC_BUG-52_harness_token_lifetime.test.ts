/**
 * BUG-52 — **a test session outlives the sitting it is used in**.
 *
 * WHY THIS IS PART OF THIS TICKET. The stand-in Access team minted one-hour
 * tokens, and an hour is the worst possible length: long enough to look like a
 * working session, short enough to end inside one. So the harness running down
 * produces exactly the symptom this bug is about — every call 401s and the
 * builder empties — and an operator reproducing the bug cannot tell the harness
 * apart from the thing they are trying to reproduce.
 *
 * HARNESS-ONLY, WITH NO PRODUCTION COUNTERPART. Deployed session lifetime is a
 * Cloudflare Access setting and REQ-187's subject; nothing here reaches it.
 *
 * The assertion is on the CLAIM the token makes, read back out of the payload —
 * not on the constant, which would only prove the constant equals itself.
 */

import { describe, expect, it } from 'vitest'
import { startAccessTeam } from './support/access'

/** The `exp` a minted token actually carries, in seconds since the epoch. */
function expiryOf(token: string): number {
  const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8'))
  return payload.exp
}

const DAY = 24 * 60 * 60

describe('BUG-52 — the local Access harness issues multi-day tokens', () => {
  it('test_UAT_FC_BUG_52_a_minted_token_lasts_days_rather_than_one_hour', async () => {
    const access = await startAccessTeam()
    try {
      const now = Math.floor(Date.now() / 1000)
      const lifetime = expiryOf(await access.token()) - now
      // MEASURED IN DAYS, which is the requirement — not the exact number of
      // them, which is a tuning decision this should not freeze.
      expect(lifetime).toBeGreaterThan(DAY)
    } finally {
      await access.close()
    }
  })

  it('test_UAT_FC_BUG_52_a_deliberately_expired_token_is_still_mintable', async () => {
    // A DEFAULT, NOT A CEILING. The suites that prove the gate refuses a lapsed
    // session mint one by overriding `exp`, and lengthening the default must not
    // take that away — the evidence for this very bug depends on it.
    const access = await startAccessTeam()
    try {
      const past = Math.floor(Date.now() / 1000) - 60
      expect(expiryOf(await access.token({ exp: past }))).toBe(past)
    } finally {
      await access.close()
    }
  })
})

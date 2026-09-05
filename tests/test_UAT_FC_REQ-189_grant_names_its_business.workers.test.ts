import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import type { IdentityEnv } from '../apps/control-app/src/identity'
import { openGrant, personDetail, peopleOf } from '../apps/control-app/src/people'
import { inviteAccount } from './support/invite-account'
import { applySchema } from './support/d1-site-factory'

/**
 * REQ-189 — **a grant says which business it is for, by name.**
 *
 * WHY THE ORIGIN HAD TO CHANGE FOR A PRESENTATION TICKET. The detail pane now
 * presents one table keyed by business, carrying the membership facts and the
 * grant facts as columns, and the row that most needs a name is the one with no
 * membership to borrow it from — a grant against a business this person does not
 * operate, which is a support arrangement or a mistake and is exactly the
 * mismatch the join exists to surface. `operates` already carried a name;
 * `grants` carried only an opaque `acct_…` id, so that row would have rendered
 * as the one cell an operator would skip.
 *
 * WHAT MAKES IT EVIDENCE. Both cases run inside workerd against a real D1 with
 * the deployed migrations applied, and every row is written by a shipped entry
 * point — `inviteAccount`, `provisionBusiness`, `openGrant` — so a divergence
 * between what the product writes and what the tab reads fails here.
 */

const PLATFORM = 'req189-platform'

function identityEnv(tenantId = PLATFORM): IdentityEnv {
  return { DB: env.DB as D1Database, SITES: env.SITES as R2Bucket, TENANT_ID: tenantId }
}

let seq = 0
const anEmail = (): string => `req189-${(seq += 1)}@example.test`

beforeAll(async () => {
  await applySchema(env.DB as D1Database)
})

describe('REQ-189 — the grant names its business', () => {
  it('test_UAT_FC_REQ-189_a_grant_on_a_business_they_run_carries_that_businesss_name', async () => {
    const email = anEmail()
    const invited = await inviteAccount(identityEnv(), { email, accountName: "Alice's Plumbing" })

    const people = await peopleOf(identityEnv(), { businessId: PLATFORM })
    const person = people.find((p) => p.email === email)!
    const detail = await personDetail(identityEnv(), { businessId: PLATFORM }, person.id)

    const grant = detail!.grants.find((g) => g.businessId === invited.businessId)!
    expect(grant.businessName).toBe("Alice's Plumbing")
    // The membership row already carried the name; the two must agree, because
    // the joined table draws ONE business cell from whichever arrives first.
    const membership = detail!.operates.find((b) => b.businessId === invited.businessId)!
    expect(membership.name).toBe(grant.businessName)
  })

  /**
   * THE MISMATCH THE TABLE EXISTS TO SHOW. A grant whose object is a business
   * this person does not operate: the account-subject grant a support
   * arrangement writes, and the shape a mistake takes. It reaches the pane
   * through the `account_id = ?` half of the read, with no membership beside it.
   */
  it('test_UAT_FC_REQ-189_a_grant_against_a_business_they_do_not_run_still_names_it', async () => {
    const holder = await inviteAccount(identityEnv(), { email: anEmail(), accountName: 'Holder' })
    // Somebody else's business entirely — nothing gives `holder` a membership on it.
    const other = await inviteAccount(identityEnv(), {
      email: anEmail(),
      accountName: 'Somebody Else Ltd',
    })

    await openGrant(identityEnv(), {
      businessId: other.businessId,
      accountId: holder.user.id,
      plan: 'support',
    })

    const detail = await personDetail(identityEnv(), { businessId: PLATFORM }, holder.user.id)
    const stray = detail!.grants.find((g) => g.businessId === other.businessId)!

    expect(stray.businessName).toBe('Somebody Else Ltd')
    // ...and it is genuinely a mismatch: no membership on that business at all,
    // which is what the table renders as an empty role cell reading in words.
    expect(detail!.operates.some((b) => b.businessId === other.businessId)).toBe(false)
  })
})

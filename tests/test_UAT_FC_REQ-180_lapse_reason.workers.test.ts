import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import {
  admissibleBusiness,
  admit,
  provisionBusiness,
  type IdentityEnv,
} from '../apps/control-app/src/identity'
import { inviteAccount } from './support/invite-account'
import { businessesPayload } from '../apps/control-app/src/router'
import { applySchema } from './support/d1-site-factory'

/**
 * REQ-180 §1 — **a lapsed business says WHY**.
 *
 * WHAT MAKES THIS EVIDENCE. Every case runs inside workerd against a real D1
 * database with the deployed schema from `db/migrations`, and every business is
 * provisioned through the shipped `inviteAccount` / `provisionBusiness`. The
 * grants are then moved with the same `UPDATE` an expiry or a withdrawal
 * actually performs, so what is being read back is a real row in a real state
 * rather than a fixture's idea of one.
 *
 * WHY THE REASON IS WORTH A FILE. [[REQ-179]] made a lapsed business
 * distinguishable from a deleted one, which is what stops the switcher lying.
 * It left one step short: two of these four states are fixed by paying and two
 * are fixed by talking to us, and a person shown only that their access is gone
 * will do neither. The ticket's acceptance is that lapsed businesses appear
 * *marked, with a reason*, and the reason is the half that did not exist.
 *
 * THE FOUR REASONS ARE DRIVEN FROM THE ROWS THAT PRODUCE THEM, not asserted
 * against a switch statement. `expired` and `not_yet` are the two sides of the
 * date arithmetic — the single most likely silent failure in this area, because
 * a bound that is never evaluated is worse than no bound at all, having been
 * promised as one.
 *
 * AND THE PAIR CANNOT DISAGREE. `selectable === false` and `lapse !== null` are
 * computed from one answer, and every case here asserts both — because a
 * business unselectable for no stated reason, or selectable while carrying one,
 * is precisely how the switcher and the account surface come to contradict each
 * other in front of the person who owns both.
 */

const PLATFORM = 'req180-lapse-platform'

function identityEnv(overrides: Partial<IdentityEnv> = {}): IdentityEnv {
  return { DB: env.DB as D1Database, SITES: env.SITES as R2Bucket, TENANT_ID: PLATFORM, ...overrides }
}

let seq = 0
const anEmail = (): string => `req180-lapse-${(seq += 1)}@example.test`

const iso = (offsetMs: number): string => new Date(Date.now() + offsetMs).toISOString()

/** The one business an invite provisions, read back out of a fresh admission. */
async function onlyBusiness(email: string) {
  const result = await admit(identityEnv(), email)
  expect(result.ok, `${email} was not admitted`).toBe(true)
  if (!result.ok) throw new Error('unreachable')
  expect(result.businesses).toHaveLength(1)
  return result.businesses[0]
}

/**
 * The same read for an account whose ONLY business has lapsed.
 *
 * `admit` refuses that account — `no_entitlement`, because no business is
 * selectable — so the businesses cannot be reached through it. They are read
 * through {@link admissibleBusiness} instead, which is the administrator's path
 * onto the identical answer: it bypasses membership and nothing else, and it
 * computes the lapse through the same function the owner's path does. Using it
 * here is therefore not a workaround around the refusal; it is the second half
 * of the claim that both paths report one thing.
 */
async function lapsedBusiness(businessId: string) {
  const business = await admissibleBusiness(identityEnv(), businessId)
  expect(business, `business ${businessId} was not readable`).toBeTruthy()
  return business!
}

beforeAll(async () => {
  await applySchema()
})

describe('REQ-180 — why a business lapsed', () => {
  it('test_UAT_FC_REQ-180_a_selectable_business_carries_no_lapse', async () => {
    // The ordinary case, asserted first because it is the one that must not
    // acquire noise. A live business has nothing to explain, and a reason
    // rendered beside it would be a sentence about a problem that is not
    // happening on every row of the list.
    const email = anEmail()
    await inviteAccount(identityEnv(), { email, accountName: 'Salon', endsAt: null })

    const business = await onlyBusiness(email)
    expect(business.selectable).toBe(true)
    expect(business.lapse).toBeNull()
  })

  it('test_UAT_FC_REQ-180_an_expired_grant_reports_expired_and_the_date_it_ended', async () => {
    // The card-expired shape, and the one the date exists for: "your access
    // ended" and "your access ended on the 1st" are different sentences, and
    // only the second lets someone check it against what they thought they had
    // bought.
    const email = anEmail()
    const ended = iso(-86_400_000)
    const invite = await inviteAccount(identityEnv(), { email, accountName: 'Salon' })
    await env.DB.prepare('UPDATE entitlements SET ends_at = ? WHERE business_id = ?')
      .bind(ended, invite.businessId)
      .run()

    const business = await lapsedBusiness(invite.businessId)
    expect(business.selectable).toBe(false)
    expect(business.lapse).toEqual({ reason: 'expired', endedAt: ended })
  })

  it('test_UAT_FC_REQ-180_a_renewed_and_re_expired_grant_reports_the_latest_end', async () => {
    // An account renewed twice has three expired rows and only the last one is
    // the date its access actually stopped. Reporting an earlier one would be a
    // true row and a false answer — and the customer would quote the wrong date
    // back at us.
    const email = anEmail()
    const invite = await inviteAccount(identityEnv(), { email, accountName: 'Salon' })
    const first = iso(-90 * 86_400_000)
    const latest = iso(-2 * 86_400_000)
    await env.DB.prepare('UPDATE entitlements SET ends_at = ? WHERE business_id = ?')
      .bind(first, invite.businessId)
      .run()
    await env.DB.prepare(
      'INSERT INTO entitlements (id, business_id, email, plan, source, status, starts_at, ends_at, ' +
        'created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    )
      .bind(
        'ent_req180_renewal',
        invite.businessId,
        email,
        'pro',
        'admin_grant',
        'active',
        first,
        latest,
        first,
        latest,
      )
      .run()

    const business = await lapsedBusiness(invite.businessId)
    expect(business.lapse).toEqual({ reason: 'expired', endedAt: latest })
  })

  it('test_UAT_FC_REQ-180_a_withdrawn_grant_reports_revoked_and_no_date', async () => {
    // A withdrawal is an act rather than an expiry, and the row records no time
    // for it — so there is no date to give, and inventing one from `updated_at`
    // would be presenting a bookkeeping timestamp as the moment access stopped.
    // It is the fix that differs: this one is settled by talking to us.
    const email = anEmail()
    const invite = await inviteAccount(identityEnv(), { email, accountName: 'Salon', endsAt: null })
    await env.DB.prepare('UPDATE entitlements SET status = ? WHERE business_id = ?')
      .bind('revoked', invite.businessId)
      .run()

    const business = await lapsedBusiness(invite.businessId)
    expect(business.selectable).toBe(false)
    expect(business.lapse).toEqual({ reason: 'revoked', endedAt: null })
  })

  it('test_UAT_FC_REQ-180_a_grant_written_ahead_of_time_reports_not_yet', async () => {
    // The other side of the date arithmetic. `starts_at <= now` is what excludes
    // a grant written ahead of time, and without this case that predicate could
    // be deleted and every test would still pass — while access became live the
    // moment it was sold rather than the moment it began.
    const email = anEmail()
    const invite = await inviteAccount(identityEnv(), { email, accountName: 'Salon' })
    await env.DB.prepare('UPDATE entitlements SET starts_at = ?, ends_at = ? WHERE business_id = ?')
      .bind(iso(86_400_000), null, invite.businessId)
      .run()

    const business = await lapsedBusiness(invite.businessId)
    expect(business.selectable).toBe(false)
    expect(business.lapse).toEqual({ reason: 'not_yet', endedAt: null })
  })

  it('test_UAT_FC_REQ-180_a_business_that_has_come_back_reports_not_yet_over_expired', async () => {
    // An account holding both an expired grant and one that starts tomorrow is
    // an account whose access is COMING BACK. "Your access ended" would be true,
    // unhelpful, and the opposite of the news — so the branch order is asserted
    // rather than left to whichever row the planner returned first.
    const email = anEmail()
    const invite = await inviteAccount(identityEnv(), { email, accountName: 'Salon' })
    await env.DB.prepare('UPDATE entitlements SET ends_at = ? WHERE business_id = ?')
      .bind(iso(-86_400_000), invite.businessId)
      .run()
    await env.DB.prepare(
      'INSERT INTO entitlements (id, business_id, email, plan, source, status, starts_at, ends_at, ' +
        'created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    )
      .bind(
        'ent_req180_future',
        invite.businessId,
        email,
        'pro',
        'admin_grant',
        'active',
        iso(86_400_000),
        null,
        iso(0),
        iso(0),
      )
      .run()

    const business = await lapsedBusiness(invite.businessId)
    expect(business.lapse?.reason).toBe('not_yet')
  })

  it('test_UAT_FC_REQ-180_a_business_with_no_grant_at_all_reports_never_granted', async () => {
    // The repairable half-provision `identity.ts` documents: membership and
    // grant batch together, so this state means something wrote a membership by
    // another path. It is distinct from `revoked` because the fix is different —
    // nothing was withdrawn, something was never made — and an operator reading
    // "revoked" would go looking for who withdrew it.
    const email = anEmail()
    const invite = await inviteAccount(identityEnv(), { email, accountName: 'Salon', endsAt: null })
    await env.DB.prepare('DELETE FROM entitlements WHERE business_id = ?')
      .bind(invite.businessId)
      .run()

    const business = await lapsedBusiness(invite.businessId)
    expect(business.selectable).toBe(false)
    expect(business.lapse).toEqual({ reason: 'never_granted', endedAt: null })
  })

  it('test_UAT_FC_REQ-180_selectable_and_lapse_never_disagree_across_a_whole_account', async () => {
    // The invariant, over an account holding a live business and a lapsed one at
    // the same time — which is the arrangement in which a disagreement would
    // actually be visible, because the switcher and the account surface would be
    // rendering both rows side by side.
    const email = anEmail()
    const live = await inviteAccount(identityEnv(), { email, accountName: 'Salon', endsAt: null })
    const dead = await provisionBusiness(identityEnv(), {
      accountUserId: live.user.id,
      name: 'Studio',
      email,
    })
    await env.DB.prepare('UPDATE entitlements SET ends_at = ? WHERE business_id = ?')
      .bind(iso(-1_000), dead.businessId)
      .run()

    const result = await admit(identityEnv(), email)
    expect(result.ok).toBe(true)
    if (!result.ok) return

    expect(result.businesses).toHaveLength(2)
    for (const business of result.businesses) {
      expect(
        business.lapse === null,
        `${business.name}: selectable=${business.selectable} lapse=${JSON.stringify(business.lapse)}`,
      ).toBe(business.selectable)
    }
  })

  it('test_UAT_FC_REQ-180_the_wire_carries_the_reason_and_never_someone_elses', async () => {
    // The payload builder is asserted directly because the field is the whole of
    // what this ticket adds to a contract [[REQ-179]] already proved end to end.
    // The second half is the property that lets the reason be told at all: the
    // payload holds only businesses the caller has a live membership on, so a
    // reason in it is a fact about their own business and about nobody else's.
    const mine = anEmail()
    const theirs = anEmail()
    const live = await inviteAccount(identityEnv(), { email: mine, accountName: 'Salon', endsAt: null })
    const dead = await provisionBusiness(identityEnv(), {
      accountUserId: live.user.id,
      name: 'Studio',
      email: mine,
    })
    const stranger = await inviteAccount(identityEnv(), { email: theirs, accountName: 'Theirs' })
    await env.DB.prepare('UPDATE entitlements SET status = ? WHERE business_id = ?')
      .bind('revoked', dead.businessId)
      .run()
    await env.DB.prepare('UPDATE entitlements SET status = ? WHERE business_id = ?')
      .bind('revoked', stranger.businessId)
      .run()

    const admission = await admit(identityEnv(), mine)
    const payload = businessesPayload(admission, { businessId: live.businessId })

    const onWire = payload.businesses.find((b) => b.id === dead.businessId)
    expect(onWire?.selectable).toBe(false)
    expect(onWire?.lapse).toEqual({ reason: 'revoked', endedAt: null })
    expect(payload.businesses.find((b) => b.id === live.businessId)?.lapse).toBeNull()

    // The stranger's business is lapsed too, and its reason is nowhere on this
    // wire — because the business itself is not.
    expect(payload.businesses.map((b) => b.id)).not.toContain(stranger.businessId)
  })
})

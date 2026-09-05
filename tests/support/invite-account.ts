import {
  provisionBusiness,
  type BusinessResult,
  type IdentityEnv,
  type UserRow,
} from '../../apps/control-app/src/identity'
import { invitePerson } from '../../apps/control-app/src/people'

/**
 * A 1st Contact ACCOUNT, seeded for a suite that needs one to exist.
 *
 * A FIXTURE, AND DELIBERATELY NOT A SHIPPED FUNCTION ([[REQ-186]]). This used to
 * be `provisionInvite` in `identity.ts` — one call that wrote the person AND
 * their first business — and it was deleted from production for a model reason
 * rather than a tidiness one: it can only ever express a person who owns a
 * business, so it cannot express Bob, a member of a customer's business with a
 * portal and nothing to run ([[DOC-42]] §1). The product performs the two steps
 * separately, which is what makes level 2 expressible at all.
 *
 * WHAT SURVIVES HERE IS THE SEQUENCE, not the semantics. Dozens of suites need
 * "an account that exists, entitled, with a site" as their FIRST line, and
 * spelling three calls at each of a hundred call sites would buy nothing but
 * noise. So the composite lives where a composite belongs — in the fixtures — and
 * it is written as the two shipped calls in order, so a change to either one is
 * felt here rather than routed around.
 *
 * IT INVITES INTO THE PLATFORM TENANT, because that is what a 1st Contact
 * ACCOUNT is ([[DOC-40]] §2.1): a `users` row in the business whose product is
 * businesses. A suite wanting Bob — a member one level down — calls
 * {@link invitePerson} against that customer's business directly, which is the
 * whole of the difference and is why it is not a parameter here.
 */
export interface SeededAccount {
  /** False when the email was already known in the platform tenant. */
  created: boolean
  user: UserRow
  /** The business seeded for them, or the first one they already held. */
  businessId: string
  /** The starter site's slug, when this call provisioned a business. */
  siteSlug: string | null
}

export interface AccountSeed {
  email: string
  accountName?: string
  displayName?: string
  plan?: string
  startsAt?: string
  endsAt?: string | null
  grantedBy?: string
  note?: string
}

export async function inviteAccount(
  env: IdentityEnv,
  seed: AccountSeed,
): Promise<SeededAccount> {
  const platformTenant = (env.TENANT_ID ?? '').trim()
  if (platformTenant === '') {
    throw new Error('inviteAccount needs TENANT_ID — it seeds an account, which is a row there.')
  }

  const invited = await invitePerson(env, { businessId: platformTenant }, {
    email: seed.email,
    displayName: seed.displayName ?? null,
  })

  const user = await env.DB.prepare('SELECT * FROM users WHERE tenant_id = ? AND id = ?')
    .bind(platformTenant, invited.person.id)
    .first<UserRow>()
  if (!user) throw new Error('The invited person was not readable back.')

  // ALREADY HOLDS ONE → REPORTED RATHER THAN GIVEN A SECOND. A suite re-seeding
  // the same address is asking for the account to exist, not for another
  // business; provisioning one anyway would silently change what every later
  // assertion about "their business" refers to.
  const held = await env.DB.prepare(
    "SELECT business_id FROM memberships WHERE user_id = ? AND status = 'active' " +
      'ORDER BY granted_at ASC',
  )
    .bind(user.id)
    .first<{ business_id: string }>()
  if (held) {
    return { created: invited.created, user, businessId: held.business_id, siteSlug: null }
  }

  const business: BusinessResult = await provisionBusiness(env, {
    accountUserId: user.id,
    name: seed.accountName ?? user.email,
    email: user.email,
    plan: seed.plan,
    startsAt: seed.startsAt,
    endsAt: seed.endsAt,
    grantedBy: seed.grantedBy,
    note: seed.note,
  })
  return { created: invited.created, user, businessId: business.businessId, siteSlug: business.siteSlug }
}

import { env } from 'cloudflare:test'
import type { IdentityEnv } from '../../apps/control-app/src/identity'
import { invitePeople } from '../../apps/control-app/src/invites'
import type { Message } from '../../apps/control-app/src/mail'
import { addContact, type Person } from '../../apps/control-app/src/people'
import type { Scope } from '../../apps/control-app/src/scope'
import { ticketStoreFor } from '../../apps/control-app/src/tickets'

/**
 * ADD A CONTACT, THEN INVITE THEM BY ID — the two shipped calls, in order
 * ([[REQ-199]]).
 *
 * The invite used to be one call that took an address and created the row. It
 * is now a transition on an existing contact, and the add is the separate act
 * that creates one. Suites whose criterion says "invite an address" need both,
 * so this fixture spells exactly those two calls and nothing else, the way
 * `invite-account.ts` spells add-then-provision.
 *
 * THE MAIL PORT IS A RECORDING DOUBLE, because `invitePeople` takes the port as
 * an argument and imports no adapter ([[REQ-196]]). The fixture asserts that
 * exactly one message went to the added address, so a suite built on it cannot
 * pass on an invite that silently sent nothing.
 */

export const FIXTURE_FROM = 'no-reply@example.test'
export const FIXTURE_CTA = 'https://app.example/sign-in/fixture-token'

export interface AddedAndInvited {
  /** True when the add inserted the row. */
  created: boolean
  /** The row as the invite left it (pipeline Invited, invitation stamped). */
  person: Person
  /** What was handed to the mail port. */
  sent: Message[]
}

export async function addAndInvite(
  identity: IdentityEnv,
  scope: Scope,
  spec: { email: string; displayName?: string | null },
): Promise<AddedAndInvited> {
  const added = await addContact(identity, scope, spec)
  const sent: Message[] = []
  const store = await ticketStoreFor(
    { DB: identity.DB, BLOBS: env.BLOBS as R2Bucket },
    scope,
  )
  const [result] = await invitePeople(
    {
      env: identity,
      scope,
      store,
      send: async (message) => {
        sent.push(message)
        return { providerId: `prov_${sent.length}` }
      },
      from: FIXTURE_FROM,
      inviteUrl: async () => FIXTURE_CTA,
    },
    [added.person.id],
  )
  if (!result || result.status !== 'sent' || !result.person) {
    throw new Error(`the invite did not go out: ${result?.status} ${result?.reason ?? ''}`)
  }
  if (sent.length !== 1 || sent[0].to !== added.person.email) {
    throw new Error(`the invite was not one message to ${added.person.email}`)
  }
  return { created: added.created, person: result.person, sent }
}

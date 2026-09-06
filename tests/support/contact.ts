import { newId, userEmailInsert, type IdentityEnv } from '../../apps/control-app/src/identity'

/**
 * A CONTACT, seeded straight into the database: known to a business, never
 * invited, and it MAY become a member ([[DOC-44]] §2).
 *
 * IT LIVES HERE BECAUSE A CONTACT IS TWO ROWS NOW ([[REQ-191]]). Every suite
 * that needed one used to write a single `INSERT INTO users`, and each one held
 * its own copy of it; a person and their address are two rows in two tables, and
 * four copies of that pair is four places for one of them to be forgotten. The
 * failure it prevents is quiet — a person with no address is a person `peopleOf`
 * shows with a blank cell and `admit` can never find, which reads as an
 * admission bug rather than a fixture that wrote half a contact.
 *
 * WHAT IT DELIBERATELY DOES NOT WRITE. `pipeline_stage` is left to the schema,
 * because the claim several of these suites make is that a contact arrives at
 * `lead` without anybody deciding to put them there — a fixture that wrote the
 * value would prove only that it can spell it. Nor is `invited_at` stamped:
 * inviting is the transition under test, not the starting state.
 *
 * IT IS A FIXTURE AND NOT A SHIPPED FUNCTION. `invitePerson` is how the product
 * makes a person, and it stamps the pipeline — which is exactly what a suite
 * testing the pipeline cannot start from.
 */
export async function seedContact(
  env: IdentityEnv,
  spec: { tenantId: string; email: string; displayName?: string | null; id?: string },
): Promise<string> {
  const id = spec.id ?? newId('usr')
  const now = new Date().toISOString()
  await env.DB.batch([
    env.DB.prepare(
      'INSERT INTO users (id, tenant_id, status, display_name, created_at, updated_at) ' +
        'VALUES (?, ?, ?, ?, ?, ?)',
    ).bind(id, spec.tenantId, 'active', spec.displayName ?? null, now, now),
    userEmailInsert(env, { userId: id, tenantId: spec.tenantId, email: spec.email, now }),
  ])
  return id
}

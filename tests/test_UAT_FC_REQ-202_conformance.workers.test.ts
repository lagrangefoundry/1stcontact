import { beforeAll, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import { PasswordlessAuth } from '../apps/control-app/src/generated/auth-passwordless'
import { assertPasswordlessContract } from '../apps/control-app/src/generated/auth-passwordless-conformance'
import { applySchema } from './support/d1-site-factory'

/**
 * REQ-202 — **the component's own contract, run against this deployment's D1.**
 *
 * WHAT THIS PROVES THAT NOTHING ELSE DOES. Every other file in this ticket proves
 * a route, a page or a composition. This one proves the SUBSTRATE: that the
 * schema transcribed into `0001_baseline.sql` is the schema the component's
 * statements need, that D1's SQLite honours the conditional `UPDATE` the
 * single-use guarantee rests on, and that the two tables carry the indexes
 * `recentTokenCount` and `endSessionsForSubject` are written against.
 *
 * `test_UAT_FC_REQ-202_passwordless_wiring` compares the migration text to
 * `SCHEMA_STATEMENTS` and can only say the two agree AS STRINGS. This one applies
 * the migration and then asks the component to exercise it — which is the
 * difference between "the file says the right thing" and "the database does the
 * right thing".
 *
 * THE COMPONENT SUPPLIES THE ASSERTIONS AND THIS FILE SUPPLIES THE BINDING,
 * which is the shape `assertPasswordlessContract` is written for: the host hands
 * back a `PasswordlessAuth` over an empty pair of ITS OWN tables, and every port,
 * clock and cookie setting a case needs, the case builds itself. A double here
 * would only prove the double agrees with itself.
 *
 * EMPTY MEANS EMPTIED, NOT DROPPED. The tables are this deployment's, created by
 * the migration; a factory that re-created them would be testing DDL it wrote
 * rather than DDL that ships.
 */

beforeAll(async () => {
  await applySchema()
})

it('test_UAT_FC_REQ-202_the_passwordless_contract_holds_against_this_deployments_d1', async () => {
  await assertPasswordlessContract(async (config: Record<string, unknown>) => {
    await env.DB.batch([
      env.DB.prepare('DELETE FROM login_tokens'),
      env.DB.prepare('DELETE FROM sessions'),
    ])
    return new PasswordlessAuth(env.DB, config)
  }, expect)
})

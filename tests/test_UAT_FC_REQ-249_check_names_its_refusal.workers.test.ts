import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import { type IdentityEnv } from '../apps/control-app/src/identity'
import {
  PLATFORM_APEX,
  RESERVED_LABELS,
  checkHostname,
  claimHostname,
} from '../apps/control-app/src/hostname'
import { acceptTerms } from '../apps/control-app/src/terms'
import { inviteAccount } from './support/invite-account'
import { applySchema } from './support/d1-site-factory'

/**
 * REQ-249 — **a check says WHICH refusal it is, not just that there was one.**
 *
 * WHY THIS IS THE SERVER'S JOB AND NOT THE PANE'S. The settings field says four
 * different things — available, *somebody has it*, *that one is ours*, and the
 * rule a name broke — and the ticket's own falsifier is *"one refusal line
 * standing for `taken`, `reserved` and `invalid`"*. `checkHostname` already knows
 * which of the three it hit; without it saying so, the only way the browser could
 * tell them apart would be to read the refusal's prose or to carry its own copy
 * of the reserved list, which is the falsifier *"any re-implementation of the
 * syntax rules, the reserved list, or availability in the client"*.
 *
 * WHY `taken` AND `reserved` MAY NOT COLLAPSE. A customer told `mail` is *taken*
 * goes looking for `mail2`, which is also reserved, and so is every other
 * decoration of the word. The refusal has to say *this word is ours* so they
 * change the word rather than decorate it.
 *
 * WHAT MAKES THIS EVIDENCE. Real D1 with the deployed schema, and the business
 * whose hostname is claimed is minted by the shipped `inviteAccount` →
 * `provisionBusiness` path — so the `taken` case is taken by an address the
 * product actually issued rather than by a row written for the test.
 */

const PLATFORM = 'req249-platform'

function identityEnv(): IdentityEnv {
  return { DB: env.DB as D1Database, SITES: env.SITES as R2Bucket, TENANT_ID: PLATFORM }
}

let seq = 0
const aLabel = (): string => `req249x${(seq += 1)}`

async function anAccount() {
  const invited = await inviteAccount(identityEnv(), {
    email: `req249-${(seq += 1)}@example.test`,
    accountName: 'Unnamed business',
    endsAt: null,
  })
  await acceptTerms(identityEnv(), invited.user.id)
  return invited
}

beforeAll(async () => {
  await applySchema()
  await env.DB.prepare(
    "INSERT OR IGNORE INTO tenants (id, name, status, created_at) VALUES (?, ?, 'active', ?)",
  )
    .bind(PLATFORM, 'REQ-249 platform', new Date(0).toISOString())
    .run()
})

describe('REQ-249 — the check names which refusal it is', () => {
  it('test_UAT_FC_REQ-249_a_free_name_has_no_reason_at_all', async () => {
    const answer = await checkHostname(identityEnv(), aLabel())
    expect(answer.available).toBe(true)
    expect(answer.refusal).toBeNull()
    // NULL RATHER THAN A FOURTH WORD. "Available" is not a kind of refusal, and a
    // pane switching on `reason` would otherwise have to know that one of its
    // values means the opposite of the others.
    expect(answer.reason).toBeNull()
  })

  it('test_UAT_FC_REQ-249_a_name_somebody_holds_is_reported_as_taken', async () => {
    const label = aLabel()
    const holder = await anAccount()
    await claimHostname(identityEnv(), holder.businessId, label)

    const answer = await checkHostname(identityEnv(), label)
    expect(answer.available).toBe(false)
    expect(answer.reason).toBe('taken')
    // THE WHOLE HOST TRAVELS WITH IT, because the sentence the pane says names
    // the address and not the word the customer typed.
    expect(answer.host).toBe(`${label}.${PLATFORM_APEX}`)
  })

  it('test_UAT_FC_REQ-249_every_reserved_label_is_reported_as_reserved_and_never_as_taken', async () => {
    // EVERY ONE OF THEM, from the shipped list rather than a sample: the whole
    // point of the distinction is that a customer who meets it must be told to
    // change the word, and a label that reported `taken` would send them to
    // decorate it instead.
    for (const label of RESERVED_LABELS) {
      const answer = await checkHostname(identityEnv(), label)
      expect(answer.available, label).toBe(false)
      expect(answer.reason, label).toBe('reserved')
    }
  })

  it('test_UAT_FC_REQ-249_a_name_that_is_not_a_hostname_is_reported_as_invalid', async () => {
    for (const label of ['Alice Smith', '-alice', 'alice-', 'a'.repeat(64), 'xn--pple-43d', '']) {
      const answer = await checkHostname(identityEnv(), label)
      expect(answer.available, label).toBe(false)
      expect(answer.reason, label).toBe('invalid')
      // AND THE SENTENCE IS STILL THERE, because `invalid` is the one class the
      // pane cannot word for itself: which rule was broken is the route's to say.
      expect(answer.refusal, label).toBeTruthy()
    }
  })
})

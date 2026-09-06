import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { env } from 'cloudflare:test'
import {
  admit,
  DENIED_MESSAGE,
  type DenialReason,
  type IdentityEnv,
} from '../apps/control-app/src/identity'
import { inviteAccount } from './support/invite-account'
import { applySchema } from './support/d1-site-factory'

/**
 * BUG-62 — **the refusal claims nothing ended, and every refusal says why in the
 * log.**
 *
 * WHAT MAKES THIS EVIDENCE. Every assertion runs inside workerd against a real
 * D1 database with the deployed schema applied from `db/migrations`, and every
 * refusal is produced by driving `admit` into the state that causes it — a
 * suspended person, a withdrawn membership, an address nobody invited — rather
 * than by constructing a refusal object. So what is proved is what the shipped
 * decision does, including the log line it writes on the way out.
 *
 * TWO CLAIMS, one per half of the bug:
 *
 *   1. THE SENTENCE IS TRUE OF EVERY REASON. It used to say access "has ended",
 *      which is false of `no_user` and `no_membership` — and `no_membership` is
 *      what every invited contact hits, so the false reading was the common one.
 *      The replacement must assert no ending AND still name no reason, because
 *      naming one is a membership oracle to anyone who can pass a one-time PIN.
 *      Those two pull in opposite directions, which is why both are asserted
 *      here against the same string.
 *
 *   2. EVERY REFUSAL REACHES THE LOG, EXACTLY ONCE. The reason used to be
 *      written by whichever caller rendered the response, so the guarantee
 *      belonged to that call site rather than to the decision. It is now written
 *      where the decision is made, which is what these cases drive: `admit`
 *      alone, with no Worker and no response, still reports.
 *
 * THE WIRE IS PINNED NEXT DOOR, deliberately not restated. That a refused
 * request's 403 body IS `DENIED_MESSAGE`, and that two different reasons produce
 * byte-identical responses, is
 * `test_UAT_FC_REQ-167_the_refusal_does_not_say_which_check_failed` — driven
 * end to end through the Access gate with a real RS256 token. Copying that
 * apparatus here would be a second place the same claim could disagree with
 * itself; what this file adds is what that body is now required to SAY.
 */

const PLATFORM = 'bug62-platform'

function identityEnv(overrides: Partial<IdentityEnv> = {}): IdentityEnv {
  return { DB: env.DB as D1Database, SITES: env.SITES as R2Bucket, TENANT_ID: PLATFORM, ...overrides }
}

let seq = 0
const anEmail = (): string => `bug62-${(seq += 1)}@example.test`

interface DenialLine {
  event: string
  reason: DenialReason
  email: string | null
  platformAdminSeed: boolean
}

/**
 * Every `admission_denied` line written while `run` was in flight.
 *
 * IT PARSES RATHER THAN MATCHES. The acceptance is a STRUCTURED line — the
 * `console.warn(JSON.stringify({ event, … }))` shape `router.ts` already uses —
 * because an operator queries invocation logs, and a substring match would pass
 * for a line of prose that happened to contain the word.
 */
async function denialLines(run: () => Promise<unknown>): Promise<DenialLine[]> {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
  let calls: unknown[][] = []
  try {
    await run()
  } finally {
    // READ BEFORE RESTORING. `mockRestore` resets the mock's recorded state as
    // well as putting the original back, so a read afterwards is always empty —
    // which looks exactly like "nothing was logged" and would make this whole
    // file pass against a Worker that reported nothing at all.
    calls = warn.mock.calls.map((call) => [...call])
    warn.mockRestore()
  }
  return calls
    .map(([first]) => {
      if (typeof first !== 'string') return null
      try {
        return JSON.parse(first) as DenialLine
      } catch {
        return null
      }
    })
    .filter((line): line is DenialLine => line?.event === 'admission_denied')
}

beforeAll(async () => {
  await applySchema()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('BUG-62 — what the refused visitor is told', () => {
  it('test_UAT_FC_BUG-62_the_refusal_claims_nothing_ended', async () => {
    // THE DEFECT, STATED AS AN ASSERTION. "Ended" tells the reader they had
    // something and lost it, so they go looking for what they did wrong — and
    // for the commonest refusal, an invited contact who has not been provisioned
    // yet, nothing ended because nothing ever began. Every word that makes that
    // claim is refused, not merely the sentence that made it.
    for (const claim of [/\bended\b/i, /\bexpired\b/i, /\brevoked\b/i, /\bno longer\b/i]) {
      expect(DENIED_MESSAGE, `the refusal still claims ${String(claim)}`).not.toMatch(claim)
    }
  })

  it('test_UAT_FC_BUG-62_the_refusal_still_names_no_reason', async () => {
    // The constraint that keeps the fix to ONE sentence rather than five. A
    // refusal that distinguished "no such user" from "not a member" is a
    // membership oracle to anyone who can pass a one-time PIN, which is anyone —
    // so a message made truthful by naming which reason applied would have
    // traded one defect for a worse one.
    for (const leak of [
      /member/i,
      /entitle/i,
      /invit/i,
      /suspend/i,
      /inactive/i,
      /no such/i,
      /grant/i,
      /account/i,
    ]) {
      expect(DENIED_MESSAGE, `the refusal leaks ${String(leak)}`).not.toMatch(leak)
    }
    // …and it is still an answer rather than a shrug: the one act available to
    // every reason is to talk to us, and it says so.
    expect(DENIED_MESSAGE).toMatch(/get in touch/i)
  })
})

describe('BUG-62 — the reason reaches the log', () => {
  it('test_UAT_FC_BUG-62_a_stranger_is_refused_no_user_in_one_structured_line', async () => {
    const email = anEmail()

    const lines = await denialLines(() => admit(identityEnv(), email))

    // EXACTLY ONE, which is the half a second log line would break. The reason
    // was previously written at the response boundary as well; two lines for one
    // denial is two things to keep in agreement and one of them can drift.
    expect(lines).toHaveLength(1)
    expect(lines[0].reason satisfies DenialReason).toBe('no_user')
    expect(lines[0].email).toBe(email)
  })

  it('test_UAT_FC_BUG-62_every_refusing_reason_names_itself_and_the_address', async () => {
    // ALL OF THEM, DRIVEN INTO THE STATE THAT CAUSES THEM. `no_entitlement` is
    // absent because it no longer refuses ([[DOC-42]] §10.1) — a member whose
    // grant lapsed is admitted with nothing selectable, and `index.ts` logs that
    // state separately as `no_business`. These four are the ones that can still
    // produce `ok: false`.
    const suspended = anEmail()
    const invitedSuspended = await inviteAccount(identityEnv(), { email: suspended, endsAt: null })
    await env.DB.prepare("UPDATE users SET status = 'suspended' WHERE id = ?")
      .bind(invitedSuspended.user.id)
      .run()

    const unmembered = anEmail()
    const invitedUnmembered = await inviteAccount(identityEnv(), { email: unmembered, endsAt: null })
    await env.DB.prepare('UPDATE memberships SET revoked_at = ? WHERE user_id = ?')
      .bind(new Date().toISOString(), invitedUnmembered.user.id)
      .run()

    const stranger = anEmail()
    const cases: Array<[string | null, DenialReason]> = [
      [null, 'no_email'],
      [stranger, 'no_user'],
      [suspended, 'user_inactive'],
      [unmembered, 'no_membership'],
    ]

    for (const [email, reason] of cases) {
      const lines = await denialLines(() => admit(identityEnv(), email))
      expect(lines, `${reason} wrote no line`).toHaveLength(1)
      expect(lines[0].reason, `${reason} was reported as ${lines[0].reason}`).toBe(reason)
      // The address that was attempted, so a refusal can be tied to the person
      // reporting it. A service token carries no email at all, and the line says
      // null rather than omitting the field.
      expect(lines[0].email).toBe(email)
    }
  })

  it('test_UAT_FC_BUG-62_an_admitted_person_writes_no_denial_line', async () => {
    // The other half, and the half that would otherwise be assumed. A logger
    // that fired on every admission would pass every case above while making the
    // log useless — a refusal has to be distinguishable from a sign-in in the
    // output an operator reads.
    const email = anEmail()
    await inviteAccount(identityEnv(), { email, endsAt: null })

    const lines = await denialLines(() => admit(identityEnv(), email))

    expect(lines).toHaveLength(0)
  })
})

describe('BUG-62 — the diagnosis that cost us one', () => {
  it('test_UAT_FC_BUG-62_a_misconfigured_platform_admins_is_readable_from_the_log', async () => {
    // THE LOCKOUT THIS BUG WAS FILED FROM. A duplicated `PLATFORM_ADMINS` key in
    // `.dev.vars` meant the deployment named a different address from the one
    // the operator signed in with, so the break-glass seed never fired and they
    // were refused with a sentence that said their access had ended. Nothing in
    // the running system said why; the answer came from reading the file.
    //
    // `no_user` ALONE DOES NOT CLOSE IT — it is equally what an uninvited
    // stranger gets. `platformAdminSeed` is the field that separates the two
    // without going back to the configuration the log is meant to replace.
    const operator = anEmail()
    const somebodyElse = anEmail()

    const lines = await denialLines(() =>
      admit(identityEnv({ PLATFORM_ADMINS: somebodyElse }), operator),
    )

    expect(lines).toHaveLength(1)
    expect(lines[0].reason).toBe('no_user')
    expect(lines[0].platformAdminSeed).toBe(false)
  })

  it('test_UAT_FC_BUG-62_a_named_operator_is_seeded_and_never_reaches_the_log', async () => {
    // The control, and the reason the boolean is worth carrying: it tracks the
    // DEPLOYMENT's configuration, not the person. Named correctly, the same
    // address that was refused above is seeded on the way through and admitted,
    // so there is no denial line at all — which is what makes `false` above a
    // statement about the var rather than about who was asking.
    const operator = anEmail()

    const lines = await denialLines(() =>
      admit(identityEnv({ PLATFORM_ADMINS: `  ${operator.toUpperCase()} ` }), operator),
    )

    expect(lines).toHaveLength(0)
    expect((await admit(identityEnv(), operator)).ok).toBe(true)
  })
})

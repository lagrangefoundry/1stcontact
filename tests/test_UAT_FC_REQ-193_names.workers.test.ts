import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { env } from 'cloudflare:test'
import worker from '../apps/control-app/src/index'
import type { Env } from '../apps/control-app/src/index'
import { certsUrl, resetJwksCache } from '../apps/control-app/src/access'
import { admit, type IdentityEnv } from '../apps/control-app/src/identity'
import { addContact, peopleOf, personDetail } from '../apps/control-app/src/people'
import {
  currentNameOf,
  formerNamesOf,
  redactNames,
  writeName,
} from '../apps/control-app/src/names'
import { CHANGED, CORRECTED } from '../apps/control-app/src/builder/people-name.js'
import { acceptTerms } from '../apps/control-app/src/terms'
import { businessesPayload, BUSINESSES_PATH, PERSON_RECORD_PATH } from '../apps/control-app/src/router'
import { applySchema } from './support/d1-site-factory'
import { inviteAccount } from './support/invite-account'

/**
 * REQ-193 — **a person's name is a table, and every part of it is optional**.
 *
 * WHAT THIS FILE PROVES. That the product called 1st Contact can hold a name:
 * a mononym with no given name and no family name; a name that is DISPLAYED as
 * it was stored rather than assembled out of parts; exactly one current name per
 * person, enforced by the database rather than by whoever wrote the last query;
 * a change of name that moves no key; and the distinction the whole design turns
 * on — a corrected typo that is never searched and never shown, beside a genuine
 * former name that is both.
 *
 * IT RUNS IN WORKERD AGAINST REAL D1, because half the claims are constraints
 * rather than code. "Exactly one current name" is a partial unique index, and a
 * suite asserting it against a fake would be asserting that the fake was written
 * carefully. The write is attempted and the database refuses it.
 *
 * AND THE ROUTE IS DRIVEN FOR THE HALF THAT IS AUTHORISATION AND WIRING. The
 * parts arrive flat and are gathered into a name record; `nameReason` decides
 * whether the old name becomes visible. Both are things a direct call to
 * `writeName` would step over.
 */

const PLATFORM = 'req193-platform'
const TEAM = 'https://req193-team.cloudflareaccess.com'
const AUD = 'd'.repeat(64)

let signing: CryptoKeyPair
let jwks: { keys: JsonWebKey[] }

function identityEnv(overrides: Partial<IdentityEnv> = {}): IdentityEnv {
  return { DB: env.DB as D1Database, SITES: env.SITES as R2Bucket, TENANT_ID: PLATFORM, ...overrides }
}

function workerEnv(overrides: Partial<Env> = {}): Env {
  return {
    DB: env.DB as D1Database,
    SITES: env.SITES as R2Bucket,
    BLOBS: env.BLOBS as R2Bucket,
    TENANT_ID: PLATFORM,
    ACCESS_DEV_OPEN: '',
    ACCESS_TEAM_DOMAIN: TEAM,
    ACCESS_AUD: AUD,
    ASSETS: { fetch: async () => new Response('asset', { status: 200 }) } as unknown as Fetcher,
    ...overrides,
  } as Env
}

function b64url(bytes: Uint8Array | string): string {
  const raw =
    typeof bytes === 'string' ? bytes : Array.from(bytes, (b) => String.fromCharCode(b)).join('')
  return btoa(raw).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function mint(email: string): Promise<string> {
  const header = { alg: 'RS256', kid: 'req193-key', typ: 'JWT' }
  const now = Math.floor(Date.now() / 1000)
  const payload = { iss: TEAM, aud: [AUD], iat: now, nbf: now, exp: now + 3600, email }
  const signed = `${b64url(JSON.stringify(header))}.${b64url(JSON.stringify(payload))}`
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    signing.privateKey,
    new TextEncoder().encode(signed) as unknown as BufferSource,
  )
  return `${signed}.${b64url(new Uint8Array(signature))}`
}

function stubJwks(): void {
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
      if (url === certsUrl(TEAM)) {
        return new Response(JSON.stringify(jwks), {
          headers: { 'content-type': 'application/json' },
        })
      }
      throw new Error(`unexpected fetch to ${url}`)
    }),
  )
}

let seq = 0
const anEmail = (): string => `req193-${(seq += 1)}@example.test`

/** An owner of a business, and somebody in it whose name they curate. */
async function aBusinessWithSomebodyInIt(displayName: string | null = null) {
  const owner = anEmail()
  const seeded = await inviteAccount(identityEnv(), {
    email: owner,
    accountName: "Alice's Plumbing",
    endsAt: null,
  })
  await acceptTerms(identityEnv(), seeded.user.id)
  const contact = anEmail()
  const invited = await addContact(
    identityEnv(),
    { businessId: seeded.businessId },
    { email: contact, displayName },
  )
  return {
    owner,
    ownerId: seeded.user.id,
    businessId: seeded.businessId,
    contact,
    personId: invited.person.id,
  }
}

const postRecord = async (
  token: string,
  body: unknown,
  businessId: string,
): Promise<Response> =>
  worker.fetch(
    new Request(`https://app.example/b/${businessId}${PERSON_RECORD_PATH}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'cf-access-jwt-assertion': token },
      body: JSON.stringify(body),
    }),
    workerEnv(),
  )

/**
 * Every name row this person has ever held, superseded ones first.
 *
 * ORDERED BY THE SUPERSESSION AND NOT BY `created_at`, because two writes inside
 * one millisecond carry the same stamp and the tie would break on a random key —
 * an assertion that passes on most runs is worse than one that never does.
 */
const historyOf = async (userId: string) => {
  const { results } = await env.DB.prepare(
    'SELECT id, display_name, superseded_at, superseded_reason FROM user_names ' +
      'WHERE user_id = ? ORDER BY superseded_at IS NULL ASC, superseded_at ASC, id ASC',
  )
    .bind(userId)
    .all<{
      id: string
      display_name: string
      superseded_at: string | null
      superseded_reason: string | null
    }>()
  return results ?? []
}

beforeAll(async () => {
  await applySchema()
  const params = {
    name: 'RSASSA-PKCS1-v1_5',
    modulusLength: 2048,
    publicExponent: new Uint8Array([1, 0, 1]),
    hash: 'SHA-256',
  }
  signing = (await crypto.subtle.generateKey(params, true, ['sign', 'verify'])) as CryptoKeyPair
  const jwk = await crypto.subtle.exportKey('jwk', signing.publicKey)
  jwks = { keys: [{ ...jwk, kid: 'req193-key', alg: 'RS256', use: 'sig' }] }
})

afterEach(() => {
  vi.unstubAllGlobals()
  resetJwksCache()
})

describe('REQ-193 — every part of a name is optional', () => {
  it('test_UAT_FC_REQ-193_a_person_with_one_name_is_representable_and_renders', async () => {
    // THE ACCEPTANCE, IN ITS PLAINEST FORM. Prince. Sukarno. No given name, no
    // family name, no title — and a required `family_name` would have made this
    // row unwritable, which is why nothing but the displayed name is NOT NULL.
    const { businessId, personId } = await aBusinessWithSomebodyInIt()

    const written = await writeName(identityEnv(), personId, { displayName: 'Prince' })

    expect(written?.displayName).toBe('Prince')
    expect(written?.givenName).toBeNull()
    expect(written?.familyName).toBeNull()
    expect(written?.title).toBeNull()
    const detail = await personDetail(identityEnv(), { businessId }, personId)
    expect(detail?.person.name?.displayName).toBe('Prince')
  })

  it('test_UAT_FC_REQ-193_the_displayed_name_is_the_one_that_was_stored_and_not_one_assembled', async () => {
    // A NAME THAT NO CONCATENATION RULE PRODUCES. Family name first, no space
    // where a Western template would put one, and a title that must not be
    // prepended. Whatever the parts say, what is shown is what was authored —
    // which is what makes this correct for mononyms, patronymics and Spanish
    // double surnames without one line of cultural logic.
    const { personId } = await aBusinessWithSomebodyInIt()

    const written = await writeName(identityEnv(), personId, {
      displayName: '田中 花子',
      givenName: '花子',
      familyName: '田中',
      title: 'Dr',
      suffix: 'PhD',
    })

    expect(written?.displayName).toBe('田中 花子')
    // The parts are kept for salutation and sorting and are NOT the display.
    expect(written?.displayName).not.toContain('Dr')
    expect(written?.displayName).not.toContain('PhD')
  })

  it('test_UAT_FC_REQ-193_a_title_and_a_suffix_are_free_text_and_no_enum_refuses_them', async () => {
    // NO ENUM SURVIVES `Rt Hon`, and an enum of {Jr, Sr} cannot hold `III` or
    // `MBE`. Asserted by writing the awkward ones and reading them back, because
    // a CHECK constraint added later would fail here rather than in production.
    const { personId } = await aBusinessWithSomebodyInIt()

    const written = await writeName(identityEnv(), personId, {
      displayName: 'Someone',
      title: 'Rt Hon',
      suffix: 'III MBE',
    })

    expect(written?.title).toBe('Rt Hon')
    expect(written?.suffix).toBe('III MBE')
  })
})

describe('REQ-193 — exactly one name is current, and the database says so', () => {
  it('test_UAT_FC_REQ-193_a_second_live_name_row_is_refused_by_the_index_and_not_by_code', async () => {
    // ENFORCED BY CONSTRAINT RATHER THAN BY APPLICATION CODE, which is the
    // ticket's word for it. The INSERT below is what a forgetful future writer
    // does; the partial unique index is what stops them, and this asserts the
    // index exists rather than that `writeName` happens to be careful.
    const { personId } = await aBusinessWithSomebodyInIt()
    await writeName(identityEnv(), personId, { displayName: 'One' })

    const now = new Date().toISOString()
    const second = env.DB.prepare(
      'INSERT INTO user_names (id, user_id, display_name, created_at, updated_at) ' +
        'VALUES (?, ?, ?, ?, ?)',
    )
      .bind('nam_smuggled', personId, 'Two', now, now)
      .run()

    await expect(second).rejects.toThrow(/UNIQUE constraint failed/i)
    expect((await currentNameOf(identityEnv(), personId))?.displayName).toBe('One')
  })

  it('test_UAT_FC_REQ-193_replacing_a_name_supersedes_rather_than_overwrites', async () => {
    // HISTORY IS THE POINT. An UPDATE would keep the current name and lose the
    // fact that there was another one — which is the fact the operator searches
    // by.
    const { personId } = await aBusinessWithSomebodyInIt()
    await writeName(identityEnv(), personId, { displayName: 'Sarah Jones' })

    await writeName(identityEnv(), personId, { displayName: 'Sarah Patel' }, CHANGED)

    const history = await historyOf(personId)
    expect(history.map((r) => r.display_name)).toEqual(['Sarah Jones', 'Sarah Patel'])
    expect(history[0].superseded_at).not.toBeNull()
    expect(history[1].superseded_at).toBeNull()
  })

  it('test_UAT_FC_REQ-193_changing_a_name_changes_no_key_and_no_foreign_key', async () => {
    // THE WHOLE REASON A NAME IS NOT A KEY. A marriage rewrites nothing: the
    // person's id is untouched, and so is every row that points at it.
    const { businessId, personId } = await aBusinessWithSomebodyInIt('Sarah Jones')
    const before = await personDetail(identityEnv(), { businessId }, personId)

    await writeName(identityEnv(), personId, { displayName: 'Sarah Patel' }, CHANGED)

    const after = await personDetail(identityEnv(), { businessId }, personId)
    expect(after?.person.id).toBe(before?.person.id)
    expect(after?.person.email).toBe(before?.person.email)
    // The name row is a NEW key; the person's is the same one.
    expect(after?.person.name?.id).not.toBe(before?.person.name?.id)
  })

  it('test_UAT_FC_REQ-193_a_patch_carries_the_other_parts_forward', async () => {
    // A PATCH AND NOT A RECORD, the same rule the address already follows. The
    // record pane commits one box at a time, so writing `knownAs` alone must not
    // silently drop the family name somebody typed a minute earlier.
    const { personId } = await aBusinessWithSomebodyInIt()
    await writeName(identityEnv(), personId, {
      displayName: 'Robert Smith',
      givenName: 'Robert',
      familyName: 'Smith',
    })

    const written = await writeName(identityEnv(), personId, { knownAs: 'Bob' })

    expect(written?.knownAs).toBe('Bob')
    expect(written?.givenName).toBe('Robert')
    expect(written?.familyName).toBe('Smith')
    expect(written?.displayName).toBe('Robert Smith')
  })

  it('test_UAT_FC_REQ-193_committing_a_value_that_did_not_change_writes_no_history', async () => {
    // A RECORD PANE DOES THIS CONSTANTLY — focus, blur, no edit. Each one would
    // otherwise leave a supersession behind, and the timeline that exists to
    // record the one real transition would be buried in transitions that never
    // happened.
    const { personId } = await aBusinessWithSomebodyInIt('Bob')

    await writeName(identityEnv(), personId, { displayName: 'Bob' })
    await writeName(identityEnv(), personId, { displayName: '  Bob  ' })

    expect(await historyOf(personId)).toHaveLength(1)
  })

  it('test_UAT_FC_REQ-193_clearing_the_displayed_name_leaves_them_with_no_name_at_all', async () => {
    // "NO NAME" IS A STATE, not an empty string pretending to be one — it is
    // what the list draws as *no name yet*, and it has to be reachable or an
    // operator who typed a name into the wrong row could never take it back.
    const { businessId, personId } = await aBusinessWithSomebodyInIt('Mistake')

    await writeName(identityEnv(), personId, { displayName: '' })

    expect(await currentNameOf(identityEnv(), personId)).toBeNull()
    const detail = await personDetail(identityEnv(), { businessId }, personId)
    expect(detail?.person.name).toBeNull()
  })

  it('test_UAT_FC_REQ-193_clearing_the_displayed_name_while_parts_remain_is_refused', async () => {
    // THE ONE NOT NULL COLUMN, DEFENDED. There is nothing to hang the parts off,
    // and the alternative — inventing a display out of them — is exactly the
    // assembly this model exists to avoid. So it is a sentence, not a guess.
    const { personId } = await aBusinessWithSomebodyInIt()
    await writeName(identityEnv(), personId, { displayName: 'Robert Smith', familyName: 'Smith' })

    await expect(
      writeName(identityEnv(), personId, { displayName: '' }),
    ).rejects.toThrow(/needs something to show/i)
    expect((await currentNameOf(identityEnv(), personId))?.displayName).toBe('Robert Smith')
  })
})

describe('REQ-193 — a correction and a name change are different facts', () => {
  it('test_UAT_FC_REQ-193_a_former_name_marked_changed_is_found_by_search_and_shown', async () => {
    // *Sarah Jones; oh, she is Sarah Patel now.* The reason history is a table
    // and not an audit log: the operator searches by the name they remember.
    const { businessId, personId } = await aBusinessWithSomebodyInIt('Sarah Jones')

    await writeName(identityEnv(), personId, { displayName: 'Sarah Patel' }, CHANGED)

    expect(await formerNamesOf(identityEnv(), personId)).toEqual(['Sarah Jones'])
    const listed = await peopleOf(identityEnv(), { businessId })
    expect(listed.find((p) => p.id === personId)?.formerNames).toEqual(['Sarah Jones'])
  })

  it('test_UAT_FC_REQ-193_a_correction_is_kept_for_audit_and_never_leaves_the_server', async () => {
    // THE ASYMMETRY THAT MATTERS. A stale typo left out of a search costs
    // nothing; a former name surfaced when it should not have been is a
    // deadname, or a greeting by a name somebody deliberately left behind. So a
    // `corrected` row exists in the table and appears in no payload.
    const { businessId, personId } = await aBusinessWithSomebodyInIt('Marting')

    await writeName(identityEnv(), personId, { displayName: 'Martin' }, CORRECTED)

    expect(await historyOf(personId)).toHaveLength(2)
    expect(await formerNamesOf(identityEnv(), personId)).toEqual([])
    const listed = await peopleOf(identityEnv(), { businessId })
    expect(listed.find((p) => p.id === personId)?.formerNames).toEqual([])
    const detail = await personDetail(identityEnv(), { businessId }, personId)
    expect(detail?.person.formerNames).toEqual([])
  })

  it('test_UAT_FC_REQ-193_a_supersession_with_no_reason_is_treated_as_a_correction', async () => {
    // THE COMMON CASE AND THE SAFE CASE ARE THE SAME CASE. Corrections are
    // frequent and accidental; name changes are rare and deliberate. So the
    // default is the one that discloses nothing, and marking a real change is
    // the explicit act.
    const { personId } = await aBusinessWithSomebodyInIt('Marting')

    await writeName(identityEnv(), personId, { displayName: 'Martin' })

    expect((await historyOf(personId))[0].superseded_reason).toBe(CORRECTED)
    expect(await formerNamesOf(identityEnv(), personId)).toEqual([])
  })

  it('test_UAT_FC_REQ-193_an_unrecognised_reason_is_a_correction_and_not_a_name_change', async () => {
    // FAIL TOWARDS SILENCE. A caller that invents a value must not thereby make
    // a former name searchable and displayable — anything that is not the
    // deliberate word is the safe one.
    const { personId } = await aBusinessWithSomebodyInIt('Marting')

    await writeName(identityEnv(), personId, { displayName: 'Martin' }, 'whatever')

    expect(await formerNamesOf(identityEnv(), personId)).toEqual([])
  })
})

describe('REQ-193 — erasure reaches names', () => {
  it('test_UAT_FC_REQ-193_redaction_removes_the_text_and_keeps_the_row_and_its_timeline', async () => {
    // [[DOC-37]]: a name is personal data and has to be removable. What it is
    // NOT is the fact that a name changed on a date — deleting the rows would
    // take the timeline with it, including the record that anything was erased.
    const { businessId, personId } = await aBusinessWithSomebodyInIt('Sarah Jones')
    await writeName(identityEnv(), personId, { displayName: 'Sarah Patel' }, CHANGED)

    const cleared = await redactNames(identityEnv(), personId)

    expect(cleared).toBe(2)
    const history = await historyOf(personId)
    expect(history).toHaveLength(2)
    expect(history.map((r) => r.display_name)).toEqual(['', ''])
    // The transition survives its own text.
    expect(history[0].superseded_reason).toBe(CHANGED)
    // And nothing surfaces an empty name as a name.
    expect(await formerNamesOf(identityEnv(), personId)).toEqual([])
    const detail = await personDetail(identityEnv(), { businessId }, personId)
    expect(detail?.person.name?.displayName).toBe('')
  })
})

describe('REQ-193 — the operator curates through the route', () => {
  it('test_UAT_FC_REQ-193_the_parts_arrive_flat_and_are_gathered_into_one_name', async () => {
    // THE CLIENT NEVER LEARNS THAT A NAME IS A ROW. The record pane commits one
    // named field at a time, so the body is `{id, knownAs}` — the same flat
    // shape the address already uses — and the route assembles it.
    stubJwks()
    const { owner, businessId, personId } = await aBusinessWithSomebodyInIt('Robert Smith')

    const response = await postRecord(
      await mint(owner),
      { id: personId, knownAs: 'Bob', title: 'Dr' },
      businessId,
    )

    expect(response.status).toBe(200)
    const name = await currentNameOf(identityEnv(), personId)
    expect(name?.knownAs).toBe('Bob')
    expect(name?.title).toBe('Dr')
    expect(name?.displayName).toBe('Robert Smith')
  })

  it('test_UAT_FC_REQ-193_the_route_records_a_correction_unless_it_is_told_otherwise', async () => {
    // The default reaching the route, not just `writeName`. An operator fixing a
    // spelling sends no reason at all, and what they get is the safe one.
    stubJwks()
    const { owner, businessId, personId } = await aBusinessWithSomebodyInIt('Marting')

    expect(
      (await postRecord(await mint(owner), { id: personId, displayName: 'Martin' }, businessId))
        .status,
    ).toBe(200)

    expect(await formerNamesOf(identityEnv(), personId)).toEqual([])
  })

  it('test_UAT_FC_REQ-193_the_route_records_a_name_change_when_it_is_told_so', async () => {
    // The deliberate act, which is the dialog rather than the record pane.
    stubJwks()
    const { owner, businessId, personId } = await aBusinessWithSomebodyInIt('Sarah Jones')

    const response = await postRecord(
      await mint(owner),
      { id: personId, displayName: 'Sarah Patel', nameReason: CHANGED },
      businessId,
    )

    expect(response.status).toBe(200)
    expect(await formerNamesOf(identityEnv(), personId)).toEqual(['Sarah Jones'])
  })

  it('test_UAT_FC_REQ-193_naming_nobody_leaves_the_name_alone', async () => {
    // A body with no name key at all must not supersede anything. The panel
    // commits the address by itself constantly, and a route that wrote a name
    // row each time would fill the history with nothing.
    stubJwks()
    const { owner, businessId, personId } = await aBusinessWithSomebodyInIt('Bob')

    expect(
      (
        await postRecord(
          await mint(owner),
          { id: personId, email: 'moved@example.test' },
          businessId,
        )
      ).status,
    ).toBe(200)

    expect(await historyOf(personId)).toHaveLength(1)
    expect((await currentNameOf(identityEnv(), personId))?.displayName).toBe('Bob')
  })
})

describe('REQ-193 — every reader goes through the name table', () => {
  it('test_UAT_FC_REQ-193_the_users_table_carries_no_display_name_column_any_more', async () => {
    // READ FROM THE DATABASE rather than asserted about the migration text, so a
    // column reintroduced by any route is caught. A surviving `display_name`
    // would be a second place a name could live, and the two would disagree.
    const { results } = await env.DB.prepare('PRAGMA table_info(users)').all<{ name: string }>()
    expect((results ?? []).map((c) => c.name)).not.toContain('display_name')
  })

  it('test_UAT_FC_REQ-193_the_account_switcher_names_the_person_from_the_name_table', async () => {
    // THE ONE READER OUTSIDE THE PEOPLE TAB. It read `users.display_name`, so
    // dropping the column would have left the chrome showing nobody's name at
    // all — silently, because the field is optional and a null reads as "not
    // set" rather than as "broken".
    stubJwks()
    const { owner, ownerId } = await aBusinessWithSomebodyInIt()
    await writeName(identityEnv(), ownerId, { displayName: 'Alice Adams' })

    const response = await worker.fetch(
      new Request(`https://app.example${BUSINESSES_PATH}`, {
        headers: { 'cf-access-jwt-assertion': await mint(owner) },
      }),
      workerEnv(),
    )

    expect(response.status).toBe(200)
    // THE KEY IS `person` SINCE [[REQ-194]]. The surface is still the account
    // switcher — that is the noun a person looks for — but what it names is the
    // human who is signed in, and the payload says so now that an account is a
    // row of its own rather than a person standing in for one.
    const payload = await response.json<{ person: { name: string | null; email: string } }>()
    expect(payload.person.name).toBe('Alice Adams')
    expect(payload.person.email).toBe(owner)
  })

  it('test_UAT_FC_REQ-193_the_switcher_says_no_name_rather_than_guessing_one', async () => {
    // A PURE FUNCTION, still. The name is resolved by the route and passed in,
    // so this holds the other half: given nothing, it reports nothing rather
    // than falling back to an address dressed up as a name.
    stubJwks()
    const { owner, businessId } = await aBusinessWithSomebodyInIt()
    const admission = await admit(identityEnv(), owner)

    const payload = businessesPayload(admission, { businessId })

    expect(payload.person?.name).toBeNull()
    expect(payload.person?.email).toBe(owner)
  })

  it('test_UAT_FC_REQ-193_an_invite_gives_a_person_their_first_name_and_never_renames_them', async () => {
    // The invite is a courtesy for somebody who has none. Letting it overwrite
    // would be a second, undeclared way to rename a person — and would write a
    // supersession for an act that was not a rename at all.
    const { businessId, contact, personId } = await aBusinessWithSomebodyInIt('Bob Smith')

    const again = await addContact(
      identityEnv(),
      { businessId },
      { email: contact, displayName: 'Robert Smith' },
    )

    expect(again.created).toBe(false)
    expect(again.person.name?.displayName).toBe('Bob Smith')
    expect(await historyOf(personId)).toHaveLength(1)
  })
})

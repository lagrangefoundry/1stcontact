import { beforeAll, describe, expect, it } from 'vitest'
import { applySchema } from './support/d1-site-factory'
import {
  aColleagueOf,
  aCustomerWithADomain,
  callDnsRoute,
  dnsFor,
  identityEnv,
} from './support/dns'
import { changesFor } from '../apps/control-app/src/dns-changes'
import { undoDnsChange } from '../apps/control-app/src/dns-assistant'
import { DNS_CHANGES_PATH, DNS_UNDO_PATH } from '../apps/control-app/src/router'

/**
 * [[REQ-260]] — **the undo, and the state check that is the whole of its
 * safety.**
 *
 * WHAT IT IS. Every operation records the records as it found them and the
 * records as it left them, and undo refuses unless the zone still says what the
 * operation left. Compare-and-swap, on DNS.
 *
 * WHAT IT REPLACES. An earlier draft said undo expires — that a change made three
 * weeks and four operations ago does not restore cleanly. Elapsed time is a proxy
 * for the real question and a bad one in both directions: a record nothing has
 * touched for a year reverts perfectly safely, and one something else changed ten
 * minutes ago does not. The cases below assert the real question is the one being
 * asked.
 *
 * THE SCENARIO IT EXISTS FOR is a client returning to a year-old conversation,
 * pressing a button they do not remember, with four intervening changes they
 * never saw. Without the check that silently reverts their DNS to a state that
 * was correct a year ago; with it, that is a sentence.
 *
 * THE FALSIFIERS THIS FILE EXISTS FOR:
 *
 *   - *an undo that applies without first comparing live state to the recorded
 *     after-set*;
 *   - *an undo that applies to the records that still match while refusing the
 *     ones that drifted*;
 *   - *drift decided by comparing Cloudflare record ids, or by an unnormalised
 *     string compare*;
 *   - *an undo that expires on elapsed time rather than on drift*;
 *   - *an undo refusal the client cannot act on, or one that names a record
 *     type*;
 *   - *an undo that is not itself recorded as a change*.
 */

beforeAll(async () => {
  await applySchema()
})

describe('REQ-260 AC7 — undo puts it back, and is itself a change', () => {
  it('test_UAT_FC_REQ-260_undo_restores_the_policy_that_was_there_before', async () => {
    const held = await aCustomerWithADomain()
    held.zone.records.push({
      id: 'rec-existing',
      type: 'TXT',
      name: held.domain,
      content: 'v=spf1 include:spf.protection.outlook.com -all',
      ttl: 1,
    })
    const change = await dnsFor(held).allowSender({
      include: 'servers.mcsv.net',
      who: 'Mailchimp',
    })

    await undoDnsChange(identityEnv(), held.zone.client, held.businessId, change.id)

    const policies = held.zone.records
      .filter((r) => r.type === 'TXT' && r.name === held.domain)
      .map((r) => r.content)
    // EXACTLY WHAT WAS THERE BEFORE. Not a policy this product composed from
    // what it thought it had found — the restore is read off the recorded
    // before-set, which was read off the zone.
    expect(policies).toEqual(['v=spf1 include:spf.protection.outlook.com -all'])
  })

  it('test_UAT_FC_REQ-260_undoing_a_created_record_removes_it', async () => {
    const held = await aCustomerWithADomain()
    const change = await dnsFor(held).addVerification({
      value: 'google-site-verification=abc',
      who: 'Google',
    })
    expect(held.zone.records.some((r) => r.content === 'google-site-verification=abc')).toBe(true)

    await undoDnsChange(identityEnv(), held.zone.client, held.businessId, change.id)

    // A CHANGE THAT CREATED A RECORD IS UNDONE BY DELETING IT. The recorded
    // before is an absence, which is a state the slot can hold — and that is what
    // makes an undo able to do more than rewrite a value.
    expect(held.zone.records.some((r) => r.content === 'google-site-verification=abc')).toBe(false)
  })

  it('test_UAT_FC_REQ-260_an_undo_is_itself_a_change_and_can_be_undone', async () => {
    const held = await aCustomerWithADomain()
    const change = await dnsFor(held).addVerification({
      value: 'google-site-verification=abc',
      who: 'Google',
    })
    const undo = await undoDnsChange(
      identityEnv(),
      held.zone.client,
      held.businessId,
      change.id,
    )

    const history = await changesFor(identityEnv(), held.businessId)
    // OTHERWISE THE HISTORY LIES ABOUT WHAT THE ZONE HAS BEEN.
    expect(history).toHaveLength(2)
    expect(history[0].id).toBe(undo.id)
    expect(history[0].undoes).toBe(change.id)
    expect(history[0].operation).toBe('undo')
    // AND IT OPENS ITS OWN SUPPRESSION WINDOW, because a revert propagates like
    // anything else.
    expect(Date.parse(undo.suppressedUntil)).toBeGreaterThan(Date.parse(undo.createdAt))
    // THE CHANGE IT UNDID IS MARKED, so the second press is a sentence rather
    // than a replayed restore.
    expect(history[1].undoneAt).not.toBeNull()

    // AND AN UNDO CAN BE UNDONE — the record comes back.
    await undoDnsChange(identityEnv(), held.zone.client, held.businessId, undo.id)
    expect(held.zone.records.some((r) => r.content === 'google-site-verification=abc')).toBe(true)
  })

  it('test_UAT_FC_REQ-260_the_same_change_cannot_be_undone_twice', async () => {
    const held = await aCustomerWithADomain()
    const change = await dnsFor(held).addVerification({
      value: 'google-site-verification=abc',
      who: 'Google',
    })
    await undoDnsChange(identityEnv(), held.zone.client, held.businessId, change.id)
    await expect(
      undoDnsChange(identityEnv(), held.zone.client, held.businessId, change.id),
    ).rejects.toMatchObject({ name: 'DnsAlreadyUndoneError' })
  })

  it('test_UAT_FC_REQ-260_another_businesss_change_is_not_one_of_yours', async () => {
    const mine = await aCustomerWithADomain()
    const theirs = await aCustomerWithADomain()
    const change = await dnsFor(theirs).addVerification({
      value: 'google-site-verification=abc',
      who: 'Google',
    })
    // THE SAME ANSWER AN ID THAT NEVER EXISTED GETS, which is what stops this
    // being a way to discover that somebody else's change exists.
    await expect(
      undoDnsChange(identityEnv(), mine.zone.client, mine.businessId, change.id),
    ).rejects.toMatchObject({ name: 'UnknownDnsChangeError' })
    expect(theirs.zone.records.some((r) => r.content === 'google-site-verification=abc')).toBe(
      true,
    )
  })
})

describe('REQ-260 AC8 — the check is on drift, and drift is semantic', () => {
  it('test_UAT_FC_REQ-260_a_record_moved_since_refuses_the_whole_undo', async () => {
    const held = await aCustomerWithADomain()
    const change = await dnsFor(held).allowSender({
      include: 'servers.mcsv.net',
      who: 'Mailchimp',
    })
    // SOMETHING ELSE HAS EDITED THE POLICY SINCE — a later operation of ours, an
    // operator in the dashboard, or a provider rotating a key. From here they
    // are indistinguishable, which is the point.
    const policy = held.zone.records.find((r) => r.type === 'TXT' && r.name === held.domain)
    policy!.content = 'v=spf1 include:servers.mcsv.net include:_spf.google.com ~all'

    await expect(
      undoDnsChange(identityEnv(), held.zone.client, held.businessId, change.id),
    ).rejects.toMatchObject({ name: 'DnsDriftError' })
    // NOTHING WAS PUT BACK. Putting it back would have deleted the newer include
    // as well, which is the data loss the check exists to turn into a sentence.
    expect(policy!.content).toBe('v=spf1 include:servers.mcsv.net include:_spf.google.com ~all')
  })

  it('test_UAT_FC_REQ-260_the_refusal_says_what_moved_and_names_no_record_type', async () => {
    const held = await aCustomerWithADomain()
    const change = await dnsFor(held).publishEmailReporting()
    held.zone.records.find((r) => r.name === `_dmarc.${held.domain}`)!.content =
      'v=DMARC1; p=quarantine'

    const refusal = await undoDnsChange(
      identityEnv(),
      held.zone.client,
      held.businessId,
      change.id,
    ).catch((err) => err as Error & { what: string[] })

    // A SENTENCE, NOT A DEAD END: what is different, and somewhere to go.
    expect(refusal.message).toContain('changed since')
    expect(refusal.what.join(' ')).toContain(held.domain)
    expect(refusal.message).toContain('Ask us')
    for (const jargon of ['TXT', 'DMARC', 'MX', 'CNAME', 'record']) {
      expect(refusal.message).not.toContain(jargon)
    }
  })

  it('test_UAT_FC_REQ-260_a_record_recreated_with_the_same_value_has_not_drifted', async () => {
    const held = await aCustomerWithADomain()
    const change = await dnsFor(held).addVerification({
      value: 'google-site-verification=abc',
      who: 'Google',
    })
    const at = held.zone.records.findIndex((r) => r.content === 'google-site-verification=abc')
    // DELETED AND RECREATED — a new Cloudflare id, quoted the way Cloudflare
    // quotes a `TXT`, and the same record as far as any resolver is concerned.
    // AN ID-BASED OR BYTE-EXACT COMPARE REPORTS DRIFT HERE, undo then refuses
    // always, and the feature is useless rather than dangerous — which is the
    // failure mode nobody notices until the day they need it.
    held.zone.records[at] = {
      ...held.zone.records[at],
      id: 'rec-recreated',
      name: held.zone.records[at].name.toUpperCase(),
      content: '"google-site-verification=abc"',
    }

    await undoDnsChange(identityEnv(), held.zone.client, held.businessId, change.id)
    expect(held.zone.records.some((r) => r.id === 'rec-recreated')).toBe(false)
  })

  it('test_UAT_FC_REQ-260_one_drifted_member_refuses_the_set_rather_than_half_of_it', async () => {
    const held = await aCustomerWithADomain()
    const dns = dnsFor(held)
    const first = await dns.addVerification({ value: 'first-code=1', who: 'Google' })
    await dns.addVerification({ value: 'second-code=2', who: 'Stripe' })
    // The first change's own record is gone — somebody removed it by hand.
    const at = held.zone.records.findIndex((r) => r.content === 'first-code=1')
    held.zone.records.splice(at, 1)

    await expect(
      undoDnsChange(identityEnv(), held.zone.client, held.businessId, first.id),
    ).rejects.toMatchObject({ name: 'DnsDriftError' })
    // A PARTIAL REVERT IS WORSE THAN NONE — half-reverting an SPF merge yields a
    // policy that was correct at no point in time — so the OTHER change's record
    // is untouched and the history records no undo at all.
    expect(held.zone.records.some((r) => r.content === 'second-code=2')).toBe(true)
    expect((await changesFor(identityEnv(), held.businessId)).some((c) => c.undoes)).toBe(false)
  })

  it('test_UAT_FC_REQ-260_an_old_change_nothing_touched_still_undoes', async () => {
    const held = await aCustomerWithADomain()
    const change = await dnsFor(held).addVerification({
      value: 'google-site-verification=abc',
      who: 'Google',
    })
    // A YEAR AGO, AND FOUR OTHER CHANGES SINCE — to other names, so nothing has
    // happened to THESE records. An undo that expired on elapsed time would
    // refuse this; the question is drift, and there is none.
    await env_backdate(change.id)
    const dns = dnsFor(held)
    await dns.addVerification({ value: 'second-code=2', who: 'Stripe' })
    await dns.publishEmailReporting()
    await dns.pointSubdomain({
      host: `shop.${held.domain}`,
      target: 'shops.myshopify.com',
      who: 'their shop',
    })
    await dns.allowSender({ include: 'servers.mcsv.net', who: 'Mailchimp' })

    await undoDnsChange(identityEnv(), held.zone.client, held.businessId, change.id)
    expect(held.zone.records.some((r) => r.content === 'google-site-verification=abc')).toBe(false)
  })
})

/** Push a recorded change a year into the past, so age is genuinely in play. */
async function env_backdate(changeId: string): Promise<void> {
  await identityEnv()
    .DB.prepare('UPDATE dns_changes SET created_at = ?, suppressed_until = ? WHERE id = ?')
    .bind('2025-09-17T00:00:00.000Z', '2025-09-17T00:20:00.000Z', changeId)
    .run()
}

describe('REQ-260 AC9 — the history is where the undo still is a year later', () => {
  it('test_UAT_FC_REQ-260_the_history_is_sentences_and_never_records', async () => {
    const held = await aCustomerWithADomain()
    await dnsFor(held).addVerification({ value: 'google-site-verification=abc', who: 'Google' })

    const answer = await (
      await callDnsRoute(DNS_CHANGES_PATH, held, { method: 'GET' })
    ).json<{
      changes: { change: string; summary: string; at: string; undoable: boolean }[]
      mayUndo: boolean
    }>()

    expect(answer.changes).toHaveLength(1)
    expect(answer.changes[0].undoable).toBe(true)
    expect(answer.mayUndo).toBe(true)
    // THE ROUTE CARRIES NO RECORD, NO VALUE AND NO ZONE — which is what makes
    // *"if a customer is being shown a record type, we have failed"* a property
    // of the API rather than a discipline of the surface that draws it.
    const wire = JSON.stringify(answer)
    for (const leak of ['TXT', 'google-site-verification', 'cf-', 'zone']) {
      expect(wire).not.toContain(leak)
    }
  })

  it('test_UAT_FC_REQ-260_the_route_puts_it_back_and_reports_the_refusal', async () => {
    const held = await aCustomerWithADomain()
    const change = await dnsFor(held).addVerification({
      value: 'google-site-verification=abc',
      who: 'Google',
    })

    const put = await callDnsRoute(DNS_UNDO_PATH, held, {
      method: 'POST',
      body: JSON.stringify({ change: change.id }),
    })
    expect(put.status).toBe(200)
    expect(held.zone.records.some((r) => r.content === 'google-site-verification=abc')).toBe(false)

    // AND A SECOND PRESS IS A SENTENCE RATHER THAN A REPLAYED RESTORE.
    const again = await callDnsRoute(DNS_UNDO_PATH, held, {
      method: 'POST',
      body: JSON.stringify({ change: change.id }),
    })
    expect(again.status).toBe(409)
  })

  it('test_UAT_FC_REQ-260_drift_is_a_409_carrying_the_sentence_to_read_out', async () => {
    const held = await aCustomerWithADomain()
    const change = await dnsFor(held).publishEmailReporting()
    held.zone.records.find((r) => r.name === `_dmarc.${held.domain}`)!.content =
      'v=DMARC1; p=quarantine'

    const answer = await callDnsRoute(DNS_UNDO_PATH, held, {
      method: 'POST',
      body: JSON.stringify({ change: change.id }),
    })
    // A 409 AND NOT A 500: drift is the expected outcome of an undo pressed
    // late, not a failure of the request.
    expect(answer.status).toBe(409)
    const said = await answer.json<{ error: string; drifted: string[] }>()
    expect(said.error).toContain('changed since')
    expect(said.drifted.length).toBeGreaterThan(0)
  })

  it('test_UAT_FC_REQ-260_a_member_who_is_not_the_account_holder_may_read_and_not_undo', async () => {
    const held = await aCustomerWithADomain()
    const change = await dnsFor(held).addVerification({
      value: 'google-site-verification=abc',
      who: 'Google',
    })
    const colleague = await aColleagueOf(held.businessId)

    // READING IS NOT GATED. A member who may change nothing is still owed the
    // truth about what changed, and a 403 would tell them neither what happened
    // nor who to ask.
    const read = await callDnsRoute(DNS_CHANGES_PATH, held, { method: 'GET' }, colleague)
    expect(read.status).toBe(200)
    expect((await read.json<{ mayUndo: boolean }>()).mayUndo).toBe(false)

    const put = await callDnsRoute(
      DNS_UNDO_PATH,
      held,
      { method: 'POST', body: JSON.stringify({ change: change.id }) },
      colleague,
    )
    expect(put.status).toBe(403)
    expect(held.zone.records.some((r) => r.content === 'google-site-verification=abc')).toBe(true)
  })
})

import { beforeAll, describe, expect, it } from 'vitest'
import { applySchema } from './support/d1-site-factory'
import {
  aCustomer,
  aCustomerWithADomain,
  clean,
  cloudflare,
  dnsFor,
  identityEnv,
  resolver,
} from './support/dns'
import { businessDns } from '../apps/control-app/src/dns-assistant'
import type { DnsResolver } from '../apps/control-app/src/resolver'
import { zoneByApex } from '../apps/control-app/src/zones'
import {
  changesFor,
  declaredTargets,
  DNS_SUPPRESSION_MS,
} from '../apps/control-app/src/dns-changes'
import { DMARC_POLICY } from '../apps/control-app/src/sending'
import { DnsRefusedError, isPrivilegedName } from '../apps/control-app/src/dns-ops'
import { SpfConflictError } from '../apps/control-app/src/spf'

/**
 * [[REQ-260]] — **the closed set of DNS changes, and the rules that make each
 * one safe.**
 *
 * WHAT MAKES THIS EVIDENCE. Every case runs against a real D1 database with the
 * deployed migration list — including `0014`'s `dns_changes`, which the undo and
 * the history are both ABOUT. Accounts, businesses and sites come from the
 * shipped provisioning path, and the domain is attached through the shipped
 * route, because a change made to a domain nobody attached is not the change
 * this ticket is about.
 *
 * THE OPERATIONS ARE REACHED THROUGH THE ASSISTANT'S OWN PORT — `businessDns`,
 * the wire `router.ts` hands the `dns` surface — rather than by calling
 * `dns-ops.ts` directly. That is the entry point a conversation actually goes
 * through, and it is what makes *"the assistant picks from the list, it does not
 * compose record edits"* a property these cases can falsify.
 *
 * CLOUDFLARE AND THE RESOLVER ARE DOUBLES, and neither is a convenience: a real
 * token would rewrite the DNS of every domain this deployment manages, and a
 * real resolver would make the verdict depend on what somebody else's domain
 * published this week. What is on THIS side of the seams is the whole of what
 * this ticket builds.
 *
 * THE FALSIFIERS THIS FILE EXISTS FOR:
 *
 *   - *a generic set-a-record tool* — there is no operation on this port that
 *     takes a record type;
 *   - *an SPF change that appends a second `v=spf1` on one name*;
 *   - *`_dmarc` written where one exists, or written at anything other than
 *     `p=none`*;
 *   - *a verification record written over the top of another company's*;
 *   - *a write at a privileged name — `_dmarc`, `_domainkey`, `send.`*;
 *   - *a mutation that does not write the declared target or open the
 *     suppression window*;
 *   - *a mutation that records no before-set and after-set, and therefore has no
 *     undo*;
 *   - *a safety rule enforced by the card rather than by code* — nothing in this
 *     file renders one, and every rule below still holds.
 */

/** Every `TXT` at one name, as the zone currently holds them. */
function txtAt(zone: ReturnType<typeof cloudflare>, name: string): string[] {
  return zone.records
    .filter((r) => r.type === 'TXT' && r.name.toLowerCase() === name.toLowerCase())
    .map((r) => r.content)
}

beforeAll(async () => {
  await applySchema()
})

describe('REQ-260 AC1 — the assistant reads a domain before it changes one', () => {
  it('test_UAT_FC_REQ-260_the_reading_is_the_external_resolvers', async () => {
    const held = await aCustomerWithADomain()
    const eyes = resolver({
      snapshot: {
        ...clean(held.domain),
        mail: { host: 'alice-com.mail.protection.outlook.com', provider: 'Microsoft 365' },
        web: { host: 'ghs.google.com', provider: null },
        senders: [{ host: 'servers.mcsv.net', provider: 'Mailchimp' }],
        dkim: [{ selector: 'selector1', provider: 'Microsoft 365', value: 'p=AAA' }],
        live: true,
      },
    })
    const reading = await dnsFor(held, { resolver: eyes.client }).reading()

    // READ FROM OUTSIDE, which is the only way to answer *what do their
    // customers' mail servers actually see* — and a second implementation of DNS
    // reading would show up here as a double nothing consulted.
    expect(eyes.asked).toContain(`snapshot ${held.domain}`)
    expect(reading.mail?.provider).toBe('Microsoft 365')
    // AN UNKNOWN HOST IS REPORTED AS THE HOST and never as an absence — the
    // assistant has something true to say either way.
    expect(reading.web).toEqual({ host: 'ghs.google.com', provider: null })
    expect(reading.senders.map((s) => s.provider)).toEqual(['Mailchimp'])
    expect(reading.signing.map((k) => k.selector)).toEqual(['selector1'])
    expect(reading.live).toBe(true)
  })

  it('test_UAT_FC_REQ-260_a_business_with_no_domain_has_nothing_to_read', async () => {
    const customer = await aCustomer()
    const zone = cloudflare()
    const deps = businessDns(identityEnv(), zone.client, resolver().client, customer.businessId)
    expect(await deps.domain()).toBeNull()
    // AND THE READ REFUSES RATHER THAN INVENTING A DOMAIN TO READ.
    await expect(deps.reading()).rejects.toMatchObject({ name: 'UnknownDomainError' })
    // NOTHING WAS WRITTEN, which is the property every refusal in this file
    // shares and the one a customer would notice if it failed.
    expect(zone.records).toEqual([])
  })
})

describe('REQ-260 AC2 — SPF merges, and never appends', () => {
  it('test_UAT_FC_REQ-260_a_sender_is_merged_into_the_policy_that_is_already_there', async () => {
    const held = await aCustomerWithADomain()
    // A LIVE POLICY, already authorising somebody else. This is the case the
    // rule exists for: a second record here stops ALL their mail.
    held.zone.records.push({
      id: 'rec-existing',
      type: 'TXT',
      name: held.domain,
      content: 'v=spf1 include:spf.protection.outlook.com -all',
      ttl: 1,
    })

    await dnsFor(held).allowSender({ include: 'servers.mcsv.net', who: 'Mailchimp' })

    const policies = txtAt(held.zone, held.domain).filter((v) => v.startsWith('v=spf1'))
    // ONE RECORD. Not two, at any point and under any circumstances.
    expect(policies).toHaveLength(1)
    expect(policies[0]).toContain('include:spf.protection.outlook.com')
    expect(policies[0]).toContain('include:servers.mcsv.net')
    // AND IT DOES NOT TIGHTEN. `-all` was the author's choice and is still theirs.
    expect(policies[0].endsWith('-all')).toBe(true)
  })

  it('test_UAT_FC_REQ-260_a_policy_on_another_name_is_left_alone', async () => {
    const held = await aCustomerWithADomain()
    // *"Merge on the apex; never delete `send.`'s"* — the worked example from
    // `MAIL.md`, and the second way this has gone wrong in real life.
    held.zone.records.push({
      id: 'rec-send',
      type: 'TXT',
      name: `send.${held.domain}`,
      content: 'v=spf1 include:amazonses.com ~all',
      ttl: 1,
    })

    await dnsFor(held).allowSender({ include: 'servers.mcsv.net', who: 'Mailchimp' })

    expect(txtAt(held.zone, `send.${held.domain}`)).toEqual([
      'v=spf1 include:amazonses.com ~all',
    ])
    expect(txtAt(held.zone, held.domain)).toEqual(['v=spf1 include:servers.mcsv.net ~all'])
  })

  it('test_UAT_FC_REQ-260_two_policies_on_one_name_is_a_refusal_and_not_a_repair', async () => {
    const held = await aCustomerWithADomain([
      { id: 'a', type: 'TXT', name: 'x', content: 'v=spf1 include:one.example ~all', ttl: 1 },
    ])
    held.zone.records.push(
      {
        id: 'rec-1',
        type: 'TXT',
        name: held.domain,
        content: 'v=spf1 include:one.example ~all',
        ttl: 1,
      },
      {
        id: 'rec-2',
        type: 'TXT',
        name: held.domain,
        content: 'v=spf1 include:two.example -all',
        ttl: 1,
      },
    )
    const before = held.zone.records.length

    await expect(
      dnsFor(held).allowSender({ include: 'servers.mcsv.net', who: 'Mailchimp' }),
    ).rejects.toBeInstanceOf(SpfConflictError)
    // MERGING THREE INTO ONE IS A JUDGEMENT ABOUT WHICH AUTHOR WAS RIGHT, and
    // this product wrote neither — so nothing is touched.
    expect(held.zone.records).toHaveLength(before)
  })

  it('test_UAT_FC_REQ-260_a_sender_already_allowed_is_told_so_and_nothing_is_written', async () => {
    const held = await aCustomerWithADomain()
    held.zone.records.push({
      id: 'rec-existing',
      type: 'TXT',
      name: held.domain,
      content: 'v=spf1 include:servers.mcsv.net ~all',
      ttl: 1,
    })
    await expect(
      dnsFor(held).allowSender({ include: 'SERVERS.MCSV.NET', who: 'Mailchimp' }),
    ).rejects.toMatchObject({ code: 'ALREADY_SET' })
    expect(await changesFor(identityEnv(), held.businessId)).toEqual([])
  })
})

describe('REQ-260 AC3 — `_dmarc` only when absent, and only at `p=none`', () => {
  it('test_UAT_FC_REQ-260_a_monitoring_policy_is_published_where_there_is_none', async () => {
    const held = await aCustomerWithADomain()
    await dnsFor(held).publishEmailReporting()

    expect(txtAt(held.zone, `_dmarc.${held.domain}`)).toEqual([DMARC_POLICY])
    // MONITORING AND NEVER ENFORCEMENT. There is no configuration for this and
    // no path that writes anything else.
    expect(DMARC_POLICY).toBe('v=DMARC1; p=none')
  })

  it('test_UAT_FC_REQ-260_a_domain_with_a_policy_is_refused_even_when_our_zone_has_none', async () => {
    const held = await aCustomerWithADomain()
    // PUBLISHED IN THE WORLD AND NOT IN OUR ZONE — the mid-migration case, and
    // the one where writing over the top bins somebody else's mail.
    const eyes = resolver({
      txt: { [`_dmarc.${held.domain}`]: ['v=DMARC1; p=reject; rua=mailto:them@example.test'] },
    })
    await expect(
      dnsFor(held, { resolver: eyes.client }).publishEmailReporting(),
    ).rejects.toMatchObject({ code: 'DMARC_EXISTS' })
    expect(txtAt(held.zone, `_dmarc.${held.domain}`)).toEqual([])
  })

  it('test_UAT_FC_REQ-260_a_resolver_that_could_not_be_reached_is_a_no', async () => {
    const held = await aCustomerWithADomain()
    const blind: DnsResolver = {
      resolve: async () => {
        throw new Error('the resolver could not be reached')
      },
      probeDkim: async () => [],
      snapshot: async () => {
        throw new Error('the resolver could not be reached')
      },
    }
    // COULD NOT LOOK IS NOT NOTHING IS PUBLISHED. The fail-closed direction costs
    // a report nobody reads yet; the other direction can bin somebody's mail.
    await expect(
      dnsFor(held, { resolver: blind }).publishEmailReporting(),
    ).rejects.toMatchObject({ code: 'DMARC_EXISTS' })
    expect(txtAt(held.zone, `_dmarc.${held.domain}`)).toEqual([])
  })
})

describe('REQ-260 AC4 — the privileged names, and what may never be written at them', () => {
  it('test_UAT_FC_REQ-260_a_verification_code_cannot_be_written_at_a_privileged_name', async () => {
    const held = await aCustomerWithADomain()
    const dns = dnsFor(held)
    for (const host of [
      `_dmarc.${held.domain}`,
      `selector1._domainkey.${held.domain}`,
      `send.${held.domain}`,
    ]) {
      expect(isPrivilegedName(host)).toBe(true)
      await expect(
        dns.addVerification({ host, value: 'google-site-verification=abc', who: 'Google' }),
      ).rejects.toMatchObject({ code: 'PRIVILEGED_NAME' })
    }
    expect(held.zone.records.filter((r) => r.type === 'TXT')).toEqual([])
  })

  it('test_UAT_FC_REQ-260_a_sending_policy_offered_as_a_verification_code_is_refused', async () => {
    const held = await aCustomerWithADomain()
    // AN SPF RECORD WEARING A VERIFICATION RECORD'S CLOTHES. Written here it
    // would be the append the merge rule exists to prevent, reached by the back
    // door.
    await expect(
      dnsFor(held).addVerification({
        value: 'v=spf1 include:servers.mcsv.net ~all',
        who: 'Mailchimp',
      }),
    ).rejects.toMatchObject({ code: 'BAD_VALUE' })
    expect(txtAt(held.zone, held.domain)).toEqual([])
  })

  it('test_UAT_FC_REQ-260_a_verification_code_is_added_beside_what_is_already_there', async () => {
    const held = await aCustomerWithADomain()
    held.zone.records.push(
      {
        id: 'rec-spf',
        type: 'TXT',
        name: held.domain,
        content: 'v=spf1 include:spf.protection.outlook.com -all',
        ttl: 1,
      },
      {
        id: 'rec-stripe',
        type: 'TXT',
        name: held.domain,
        content: 'stripe-verification=xyz',
        ttl: 1,
      },
    )

    await dnsFor(held).addVerification({
      value: 'google-site-verification=abc',
      who: 'Google',
    })

    // NOTHING WAS REPLACED. Several `TXT` records legitimately share one name,
    // and a write that replaced what it found would delete one company's proof
    // of ownership in order to add another's.
    expect(txtAt(held.zone, held.domain)).toEqual([
      'v=spf1 include:spf.protection.outlook.com -all',
      'stripe-verification=xyz',
      'google-site-verification=abc',
    ])
  })

  it('test_UAT_FC_REQ-260_a_subdomain_that_reaches_their_site_is_not_repointed', async () => {
    const held = await aCustomerWithADomain()
    // WHAT ATTACHING THE DOMAIN LEFT: a proxied pair at the apex and at `www`,
    // written by [[REQ-258]]'s serving path through the route above.
    const www = `www.${held.domain}`
    expect(held.zone.records.some((r) => r.name === www && r.proxied === true)).toBe(true)

    const dns = dnsFor(held)
    await expect(
      dns.pointSubdomain({ host: www, target: 'shops.myshopify.com', who: 'their shop' }),
    ).rejects.toMatchObject({ code: 'IN_USE_BY_YOUR_SITE' })
    // AND NOT THE APEX EITHER, which is a decision to stop having a website.
    await expect(
      dns.pointSubdomain({
        host: held.domain,
        target: 'shops.myshopify.com',
        who: 'their shop',
      }),
    ).rejects.toMatchObject({ code: 'APEX_IS_YOUR_SITE' })
  })

  it('test_UAT_FC_REQ-260_a_spare_subdomain_is_pointed_where_the_client_asked', async () => {
    const held = await aCustomerWithADomain()
    const host = `shop.${held.domain}`
    await dnsFor(held).pointSubdomain({
      host,
      target: 'shops.myshopify.com.',
      who: 'their shop',
    })
    const written = held.zone.records.find((r) => r.name === host)
    expect(written?.type).toBe('CNAME')
    expect(written?.content).toBe('shops.myshopify.com')
    // UNPROXIED: proxying somebody else's service through our account would put
    // this product in the path of traffic it has no business being in.
    expect(written?.proxied).toBe(false)
  })

  it('test_UAT_FC_REQ-260_a_name_outside_the_clients_domain_is_not_ours_to_change', async () => {
    const held = await aCustomerWithADomain()
    await expect(
      dnsFor(held).pointSubdomain({
        host: 'shop.someone-else.example',
        target: 'shops.myshopify.com',
        who: 'their shop',
      }),
    ).rejects.toMatchObject({ code: 'NOT_YOUR_DOMAIN' })
    expect(held.zone.records.some((r) => r.name.includes('someone-else'))).toBe(false)
  })
})

describe('REQ-260 AC5 — the signing-key repair, and the key it will not overwrite', () => {
  it('test_UAT_FC_REQ-260_a_missed_signing_key_is_put_back', async () => {
    const held = await aCustomerWithADomain()
    const value = 'v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQ'
    await dnsFor(held).restoreSigningKey({ selector: 'k1', value, who: 'Mailchimp' })
    expect(txtAt(held.zone, `k1._domainkey.${held.domain}`)).toEqual([value])
  })

  it('test_UAT_FC_REQ-260_a_working_signing_key_is_not_replaced', async () => {
    const held = await aCustomerWithADomain()
    const live = 'v=DKIM1; k=rsa; p=LIVEKEY'
    held.zone.records.push({
      id: 'rec-live',
      type: 'TXT',
      name: `k1._domainkey.${held.domain}`,
      content: live,
      ttl: 1,
    })
    await expect(
      dnsFor(held).restoreSigningKey({
        selector: 'k1',
        value: 'v=DKIM1; k=rsa; p=RETYPED',
        who: 'Mailchimp',
      }),
    ).rejects.toMatchObject({ code: 'ALREADY_SET' })
    // REPLACING A LIVE KEY IS HOW SIGNING BREAKS — which is the failure this
    // operation exists to repair, caused by the repair.
    expect(txtAt(held.zone, `k1._domainkey.${held.domain}`)).toEqual([live])
  })

  it('test_UAT_FC_REQ-260_a_value_that_is_not_a_signing_key_is_refused', async () => {
    const held = await aCustomerWithADomain()
    await expect(
      dnsFor(held).restoreSigningKey({ selector: 'k1', value: 'p=MIGfMA0', who: 'Mailchimp' }),
    ).rejects.toBeInstanceOf(DnsRefusedError)
    expect(txtAt(held.zone, `k1._domainkey.${held.domain}`)).toEqual([])
  })
})

describe('REQ-260 AC6 — every mutation leaves a declared target and a window', () => {
  it('test_UAT_FC_REQ-260_a_change_records_what_it_found_and_what_it_left', async () => {
    const held = await aCustomerWithADomain()
    held.zone.records.push({
      id: 'rec-existing',
      type: 'TXT',
      name: held.domain,
      content: 'v=spf1 include:one.example ~all',
      ttl: 1,
    })
    const at = Date.now()
    const change = await dnsFor(held).allowSender({
      include: 'servers.mcsv.net',
      who: 'Mailchimp',
    })

    const [recorded] = await changesFor(identityEnv(), held.businessId)
    expect(recorded.id).toBe(change.id)
    expect(recorded.operation).toBe('allow_sender')
    // THE BEFORE-SET AND THE AFTER-SET, which is what gives the change an undo.
    expect(recorded.slots).toHaveLength(1)
    expect(recorded.slots[0].before?.content).toBe('v=spf1 include:one.example ~all')
    expect(recorded.slots[0].after?.content).toContain('include:servers.mcsv.net')

    // AND THE PROPAGATION SUPPRESSION WINDOW — *"I just changed this, expect the
    // world to disagree until T"*. Specified here, consumed by [[EPIC-7]].
    const settles = Date.parse(recorded.suppressedUntil)
    expect(settles).toBeGreaterThanOrEqual(at + DNS_SUPPRESSION_MS - 5000)
    expect(settles).toBeLessThanOrEqual(Date.now() + DNS_SUPPRESSION_MS + 5000)
    expect(change.settlesBy).toBe(recorded.suppressedUntil)
  })

  it('test_UAT_FC_REQ-260_the_declared_targets_are_what_a_monitor_reads', async () => {
    const held = await aCustomerWithADomain()
    const dns = dnsFor(held)
    await dns.addVerification({ value: 'google-site-verification=abc', who: 'Google' })
    await dns.publishEmailReporting()

    const zone = await zoneByApex(identityEnv(), held.domain)
    const targets = await declaredTargets(identityEnv(), String(zone?.id))
    const declared = targets.map((t) => `${t.identity.name} ${t.identity.type} ${t.record?.content}`)
    expect(declared).toContain(`${held.domain} TXT google-site-verification=abc`)
    expect(declared).toContain(`_dmarc.${held.domain} TXT ${DMARC_POLICY}`)
    // EVERY TARGET CARRIES ITS OWN WINDOW, so a monitor can tell *"we just did
    // this"* from *"this has been wrong for a week"*.
    for (const target of targets) expect(Date.parse(target.suppressedUntil)).toBeGreaterThan(0)
  })

  it('test_UAT_FC_REQ-260_a_refused_operation_records_nothing', async () => {
    const held = await aCustomerWithADomain()
    await expect(
      dnsFor(held).addVerification({
        host: `_dmarc.${held.domain}`,
        value: 'anything',
        who: 'Google',
      }),
    ).rejects.toMatchObject({ code: 'PRIVILEGED_NAME' })
    // A HISTORY THAT LISTED THE REFUSALS WOULD TELL A CLIENT THEIR DOMAIN HAD
    // BEEN CHANGED WHEN IT HAD NOT.
    expect(await changesFor(identityEnv(), held.businessId)).toEqual([])
  })

  it('test_UAT_FC_REQ-260_the_summary_never_names_a_record', async () => {
    const held = await aCustomerWithADomain()
    const dns = dnsFor(held)
    const made = [
      await dns.allowSender({ include: 'servers.mcsv.net', who: 'Mailchimp' }),
      await dns.publishEmailReporting(),
      await dns.addVerification({ value: 'google-site-verification=abc', who: 'Google' }),
      await dns.pointSubdomain({
        host: `shop.${held.domain}`,
        target: 'shops.myshopify.com',
        who: 'their shop',
      }),
      await dns.restoreSigningKey({
        selector: 'k1',
        value: 'v=DKIM1; k=rsa; p=AAA',
        who: 'Mailchimp',
      }),
    ]
    // *"IF A CUSTOMER IS BEING SHOWN A RECORD TYPE, WE HAVE FAILED"* — and the
    // summary is the one string that reaches them verbatim, on the card and in
    // the history.
    for (const change of made) {
      for (const jargon of ['TXT', 'CNAME', ' MX', 'SPF', 'DKIM', 'DMARC', 'v=spf1', 'zone']) {
        expect(change.summary).not.toContain(jargon)
      }
      expect(change.summary.length).toBeGreaterThan(20)
    }
    // ONE CHANGE, ONE ENTRY: five operations are five cards, not one cascade.
    expect((await changesFor(identityEnv(), held.businessId)).length).toBe(5)
  })
})

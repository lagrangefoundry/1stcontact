import { describe, expect, it } from 'vitest'
import {
  DKIM_SELECTORS,
  DOH_ENDPOINT,
  ResolverUnreachableError,
  classifyMailHost,
  classifySpfSender,
  classifyWebHost,
  dnsResolver,
  normaliseName,
  spfIncludes,
  unquoteTxt,
} from '../apps/control-app/src/resolver'

/**
 * [[REQ-257]] — **the external resolver: live DNS, read from outside, and
 * classified into names a customer recognises.**
 *
 * WHAT MAKES THIS EVIDENCE. Every case drives the SHIPPED resolver against a
 * scripted zone — a map from `name/type` to the answers a real recursive
 * resolver would give — and asserts what the resolver asked for and what it made
 * of the replies. It is scripted rather than live for the reason the ticket
 * cares about: the claims here are *"six selectors are probed BY NAME"* and
 * *"an MX of `aspmx.l.google.com` is reported as Google Workspace"*, and a suite
 * pointed at a real domain would be asserting what somebody else published this
 * week.
 *
 * THE CLAIMS, in the order the ticket makes them:
 *
 *  1. IT READS FROM OUTSIDE. Every query is an HTTPS request to a public
 *     recursive resolver, which follows the domain's CURRENT delegation —
 *     never a read of our own zone through the Cloudflare API. There is no
 *     other way out of a Worker: `fetch-guard.ts` already records that *"workerd
 *     cannot resolve a name before fetching it"*.
 *  2. THE SIX TYPES THE TICKET NAMES ARE RESOLVED — `A`, `AAAA`, `CNAME`, `MX`,
 *     `TXT`, `NS` — and each answer is normalised per type rather than handed
 *     back as the resolver's raw string.
 *  3. **DKIM IS PROBED BY NAME, BECAUSE IT CANNOT BE ENUMERATED.** The ticket
 *     names the selectors and the failure: *"a missed selector breaks signing
 *     silently and the symptom arrives weeks later as 'our email goes to
 *     spam'"*. A probe that enumerated is the falsifier.
 *  4. WHAT IT FINDS IS CLASSIFIED INTO WHOSE IT IS, which is what makes *"your
 *     email is with Microsoft — I'll keep that working"* sayable.
 *  5. AN UNRECOGNISED HOST IS REPORTED AS THE HOST. Never as an absence:
 *     *"you have no mail"* is the sentence that precedes breaking it.
 *  6. **COULD-NOT-LOOK IS NOT NOTHING-IS-PUBLISHED.** An empty snapshot says
 *     *this domain is green field, write what you like*, and a resolver that
 *     could not be reached must never be read as saying that.
 */

type Zone = Record<string, { type: number; data: string; ttl?: number }[]>

/** A transport over a scripted zone, recording every name and type asked for. */
function overZone(zone: Zone): { fetch: typeof fetch; asked: string[] } {
  const asked: string[] = []
  const impl = (async (input: RequestInfo | URL) => {
    const url = new URL(String(input))
    const name = url.searchParams.get('name') ?? ''
    const type = url.searchParams.get('type') ?? ''
    asked.push(`${name}/${type}`)
    const answers = zone[`${name}/${type}`] ?? []
    return new Response(
      JSON.stringify({
        Status: answers.length > 0 ? 0 : 3,
        Answer: answers.map((a) => ({ name, type: a.type, TTL: a.ttl ?? 300, data: a.data })),
      }),
      { status: 200, headers: { 'content-type': 'application/json' } },
    )
  }) as unknown as typeof fetch
  return { fetch: impl, asked }
}

const A = 1
const NS = 2
const CNAME = 5
const MX = 15
const TXT = 16
const AAAA = 28

/** A furniture restorer with Microsoft mail, a Squarespace site and a newsletter. */
const LIVE: Zone = {
  'oakandash.co.uk/A': [{ type: A, data: '198.185.159.144' }],
  'oakandash.co.uk/AAAA': [],
  'oakandash.co.uk/CNAME': [],
  'oakandash.co.uk/MX': [
    { type: MX, data: '10 oakandash-co-uk.mail.protection.outlook.com.' },
    { type: MX, data: '20 backup.mail.protection.outlook.com.' },
  ],
  'oakandash.co.uk/TXT': [
    { type: TXT, data: '"v=spf1 include:spf.protection.outlook.com include:servers.mcsv.net -all"' },
    { type: TXT, data: '"MS=ms12345678"' },
  ],
  'oakandash.co.uk/NS': [
    { type: NS, data: 'ns1.registrar.example.' },
    { type: NS, data: 'ns2.registrar.example.' },
  ],
  'www.oakandash.co.uk/A': [],
  'www.oakandash.co.uk/CNAME': [{ type: CNAME, data: 'ext-cust.squarespace.com.' }],
  // TWO SELECTORS ANSWER AND FIVE DO NOT, which is the ordinary shape: a domain
  // publishes the selectors of the providers it actually uses.
  'selector1._domainkey.oakandash.co.uk/TXT': [
    { type: TXT, data: '"v=DKIM1; k=rsa; p=MIIBIjANBg" "kqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA"' },
  ],
  'k1._domainkey.oakandash.co.uk/TXT': [{ type: TXT, data: '"k=rsa; p=MIGfMA0GCSqGSIb3"' }],
}

describe('REQ-257 — the external resolver', () => {
  it('test_UAT_FC_REQ-257_every_query_goes_out_to_a_public_recursive_resolver', async () => {
    // FROM OUTSIDE IS THE PROPERTY. The query goes to a resolver that follows
    // the domain's own delegation, so what comes back is what the customer's
    // visitors and mail servers actually get — which is the only reading that
    // can detect a domain we have not taken over yet.
    const seen: string[] = []
    const impl = (async (input: RequestInfo | URL, init?: RequestInit) => {
      seen.push(String(input))
      expect(new Headers(init?.headers as HeadersInit).get('accept')).toBe('application/dns-json')
      return new Response(JSON.stringify({ Status: 0, Answer: [] }), { status: 200 })
    }) as unknown as typeof fetch

    await dnsResolver(impl).resolve('oakandash.co.uk', 'MX')
    expect(seen).toHaveLength(1)
    expect(seen[0].startsWith(DOH_ENDPOINT)).toBe(true)
    expect(seen[0]).toContain('name=oakandash.co.uk')
    expect(seen[0]).toContain('type=MX')
  })

  it('test_UAT_FC_REQ-257_each_record_type_is_normalised_rather_than_passed_through', async () => {
    const resolver = dnsResolver(overZone(LIVE).fetch)

    // MX CARRIES ITS PRIORITY BESIDE THE HOST, not inside a string a caller has
    // to re-split — and the trailing dot is gone, because every comparison
    // downstream is against a host somebody typed.
    const mx = await resolver.resolve('oakandash.co.uk', 'MX')
    expect(mx.map((r) => ({ priority: r.priority, data: r.data }))).toEqual([
      { priority: 10, data: 'oakandash-co-uk.mail.protection.outlook.com' },
      { priority: 20, data: 'backup.mail.protection.outlook.com' },
    ])

    const ns = await resolver.resolve('oakandash.co.uk', 'NS')
    expect(ns.map((r) => r.data)).toEqual(['ns1.registrar.example', 'ns2.registrar.example'])

    // AN `A` RECORD IS AN ADDRESS AND STAYS ONE.
    expect((await resolver.resolve('oakandash.co.uk', 'A')).map((r) => r.data)).toEqual([
      '198.185.159.144',
    ])

    // A CHAIN IS FILTERED TO THE TYPE ASKED FOR. Asking for `A` on a name that
    // is a `CNAME` returns the `CNAME` too, and a reader that kept it would put
    // a hostname in the address list.
    const chained = overZone({
      'shop.test/A': [
        { type: CNAME, data: 'shops.myshopify.com.' },
        { type: A, data: '23.227.38.65' },
      ],
    })
    expect((await dnsResolver(chained.fetch).resolve('shop.test', 'A')).map((r) => r.data)).toEqual([
      '23.227.38.65',
    ])
  })

  it('test_UAT_FC_REQ-257_a_long_txt_record_is_rejoined_before_anything_reads_it', async () => {
    // DNS SPLITS A STRING INTO 255-BYTE CHUNKS and the JSON API hands them back
    // as several quoted segments. A DKIM key is always longer than that, so a
    // reader that did not join them would see every key truncated at the first
    // boundary — and would compare two truncations and call them equal.
    expect(unquoteTxt('"v=DKIM1; k=rsa; p=AAAA" "BBBBCCCC"')).toBe('v=DKIM1; k=rsa; p=AAAABBBBCCCC')
    expect(unquoteTxt('"v=spf1 -all"')).toBe('v=spf1 -all')

    const txt = await dnsResolver(overZone(LIVE).fetch).resolve(
      'selector1._domainkey.oakandash.co.uk',
      'TXT',
    )
    expect(txt[0].data).toBe('v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA')
  })

  it('test_UAT_FC_REQ-257_dkim_is_probed_by_name_and_every_answer_names_its_provider', async () => {
    // THE LIST IS THE CAPABILITY. There is no DNS query meaning "list the
    // selectors under `_domainkey`", so a selector is a name you have to already
    // know — and the ticket names which ones.
    expect(DKIM_SELECTORS.map((s) => s.selector)).toEqual([
      'google',
      'selector1',
      'selector2',
      'k1',
      's1',
      's2',
      'resend',
    ])

    const transport = overZone(LIVE)
    const keys = await dnsResolver(transport.fetch).probeDkim('oakandash.co.uk')

    // EVERY SELECTOR IS ASKED FOR, by name, at `<selector>._domainkey.<domain>`.
    for (const { selector } of DKIM_SELECTORS) {
      expect(
        transport.asked,
        `the ${selector} selector was never probed, so signing through it would break silently`,
      ).toContain(`${selector}._domainkey.oakandash.co.uk/TXT`)
    }

    // AND THE ANSWER CARRIES WHOSE IT IS. A base64 key with no provider beside
    // it is not something a customer can be told about.
    expect(keys).toEqual([
      {
        selector: 'selector1',
        provider: 'Microsoft 365',
        value: 'v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA',
      },
      { selector: 'k1', provider: 'Mailchimp', value: 'k=rsa; p=MIGfMA0GCSqGSIb3' },
    ])
  })

  it('test_UAT_FC_REQ-257_a_domainkey_name_carrying_something_else_is_not_a_key', async () => {
    // A `_domainkey` NAME MAY CARRY OTHER TXT. Reporting one as a DKIM key
    // would tell a customer their signing is set up when it is not.
    const odd = overZone({
      'google._domainkey.bob.test/TXT': [{ type: TXT, data: '"some-verification-token"' }],
    })
    expect(await dnsResolver(odd.fetch).probeDkim('bob.test')).toEqual([])
  })

  it('test_UAT_FC_REQ-257_a_live_domain_is_described_in_names_a_customer_recognises', async () => {
    const snapshot = await dnsResolver(overZone(LIVE).fetch).snapshot('oakandash.co.uk')

    // *"Your email is with Microsoft — I'll keep that working."* The LOWEST
    // priority MX is the one mail is actually delivered to, so it is the one
    // that names the provider.
    expect(snapshot.mail).toEqual({
      host: 'oakandash-co-uk.mail.protection.outlook.com',
      provider: 'Microsoft 365',
    })

    // *"Your site is on Squarespace — moving the nameservers will take it
    // offline unless we copy it first."*
    //
    // AND THIS IS THE COMMONEST LIVE SHAPE IN THIS MARKET: the apex is an `A`
    // record pointing at a builder's anycast address, and the `CNAME` that
    // NAMES the builder is on `www`. Reading the apex and stopping would answer
    // *"198.185.159.144, provider unknown"* for a site that is unmistakably on
    // Squarespace. The host reported is the one the provider was read from, so
    // the pair never disagrees with itself.
    expect(snapshot.web).toEqual({ host: 'ext-cust.squarespace.com', provider: 'Squarespace' })

    // EVERYONE AUTHORISED TO SEND AS THEM, in the order their own record names
    // them — which is the list that gets read back to them, and why an SPF
    // record is merged rather than replaced.
    expect(snapshot.senders).toEqual([
      { host: 'spf.protection.outlook.com', provider: 'Microsoft 365' },
      { host: 'servers.mcsv.net', provider: 'Mailchimp' },
    ])

    expect(snapshot.dkim.map((k) => k.provider)).toEqual(['Microsoft 365', 'Mailchimp'])

    // **IS THERE A LIVE BUSINESS ON THIS DOMAIN TODAY?** Yes, on both counts —
    // and this is the summary, computed here and gated elsewhere.
    expect(snapshot.hasLiveMail).toBe(true)
    expect(snapshot.hasLiveWeb).toBe(true)
    expect(snapshot.live).toBe(true)
    expect(Date.parse(snapshot.takenAt)).not.toBeNaN()
  })

  it('test_UAT_FC_REQ-257_a_domain_nobody_is_using_is_green_field', async () => {
    // THE OTHER HALF OF THE SAME QUESTION. A domain we just registered, or one
    // the operator has owned and parked, is where the records can be written
    // without care — and the whole snapshot apparatus is dead weight for it.
    const parked = await dnsResolver(overZone({}).fetch).snapshot('brandnew.test')
    expect(parked.live).toBe(false)
    expect(parked.mail).toBeNull()
    expect(parked.web).toBeNull()
    expect(parked.senders).toEqual([])
    expect(parked.dkim).toEqual([])
  })

  it('test_UAT_FC_REQ-257_an_unrecognised_host_is_reported_as_the_host', async () => {
    // NEVER AS `null` DRESSED UP AS AN ABSENCE. *"Your mail is at
    // `mx.smallisp.example` and I do not recognise it"* is usable; *"you have no
    // mail"* is the sentence that precedes breaking it.
    const obscure = overZone({
      'bob.test/MX': [{ type: MX, data: '10 mx.smallisp.example.' }],
      'bob.test/A': [{ type: A, data: '203.0.113.7' }],
      'bob.test/TXT': [{ type: TXT, data: '"v=spf1 include:mail.smallisp.example -all"' }],
    })
    const snapshot = await dnsResolver(obscure.fetch).snapshot('bob.test')

    expect(snapshot.mail).toEqual({ host: 'mx.smallisp.example', provider: null })
    expect(snapshot.web).toEqual({ host: '203.0.113.7', provider: null })
    expect(snapshot.senders).toEqual([{ host: 'mail.smallisp.example', provider: null }])
    // AND IT IS STILL LIVE. An unrecognised provider is not an absent one.
    expect(snapshot.live).toBe(true)
  })

  it('test_UAT_FC_REQ-257_the_classification_tables_name_the_providers_the_ticket_does', () => {
    // A TABLE AND NOT A CHAIN OF CONDITIONALS: the failure mode is a provider
    // nobody added, and a table says plainly what is known.
    expect(classifyMailHost('aspmx.l.google.com')).toBe('Google Workspace')
    expect(classifyMailHost('alice-com.mail.protection.outlook.com')).toBe('Microsoft 365')
    expect(classifyMailHost('in1-smtp.messagingengine.com')).toBe('Fastmail')
    expect(classifyMailHost('mx.nobody-has-heard-of.example')).toBeNull()

    expect(classifyWebHost('ext-cust.squarespace.com')).toBe('Squarespace')
    expect(classifyWebHost('www123.wixdns.net')).toBe('Wix')
    expect(classifyWebHost('shops.myshopify.com')).toBe('Shopify')

    expect(classifySpfSender('_spf.google.com')).toBe('Google Workspace')
    expect(classifySpfSender('sendgrid.net')).toBe('SendGrid')
    expect(classifySpfSender('_spf.resend.com')).toBe('1st Contact')

    // A SUFFIX MATCH AND NOT A SUBSTRING ONE. `notgoogle.com` is somebody else.
    expect(classifyMailHost('mx.notgoogle.com')).toBeNull()
  })

  it('test_UAT_FC_REQ-257_only_an_spf_record_contributes_senders', () => {
    // A DOMAIN'S TXT SET IS A JUNK DRAWER — verification tokens, site ownership
    // proofs, a note somebody left — and an `include:` in one of those is not an
    // SPF include.
    expect(
      spfIncludes([
        'v=spf1 include:_spf.google.com ~all',
        'google-site-verification=include:not-an-spf-record',
        'v=SPF1 include:sendgrid.net -all',
      ]),
    ).toEqual(['_spf.google.com', 'sendgrid.net'])

    expect(normaliseName('  WWW.Alice.COM.  ')).toBe('www.alice.com')
  })

  it('test_UAT_FC_REQ-257_could_not_look_is_not_the_same_as_nothing_is_published', async () => {
    // AN EMPTY SNAPSHOT SAYS *WRITE WHAT YOU LIKE*. A resolver that could not be
    // reached must never be read as saying that — the two lead to opposite
    // decisions about somebody's mail.
    const dead = (async () => {
      throw new TypeError('network is unreachable')
    }) as unknown as typeof fetch
    await expect(dnsResolver(dead).snapshot('oakandash.co.uk')).rejects.toThrow(
      ResolverUnreachableError,
    )

    const refusing = (async () =>
      new Response('rate limited', { status: 429 })) as unknown as typeof fetch
    await expect(dnsResolver(refusing).resolve('oakandash.co.uk', 'MX')).rejects.toThrow(
      ResolverUnreachableError,
    )
  })
})

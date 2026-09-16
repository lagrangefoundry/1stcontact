/**
 * Live DNS, read from OUTSIDE — the READ half of [[REQ-257]]'s DNS layer.
 *
 * WHAT QUESTION THIS ANSWERS, and it is the one [[EPIC-5]] says actually decides
 * the work: *"is there a live business on this domain today?"* A domain we just
 * registered is green field and the records can be written without care. A
 * domain currently carrying somebody's mail and their old Wix site is the
 * dangerous one, and the whole snapshot / DKIM-probe / preserve-forward
 * apparatus exists for it. Nothing can tell the two apart except looking.
 *
 * FROM OUTSIDE, WHICH IS THE PROPERTY AND NOT AN IMPLEMENTATION DETAIL. This
 * reads what the world currently resolves, by following the domain's delegation
 * to its CURRENT authoritative nameservers. It never reads a zone back through
 * the Cloudflare API — that would answer *what have we written*, which is a
 * different question and is exactly the one that cannot detect a domain we have
 * not taken over yet.
 *
 * OVER DNS-OVER-HTTPS, BECAUSE THERE IS NO OTHER WAY OUT OF A WORKER.
 * `fetch-guard.ts` already records the constraint: *"workerd cannot resolve a
 * name before fetching it."* There is no UDP and no resolver API on the
 * platform, so reading DNS means an HTTPS query to a public recursive resolver.
 * What that costs is cache latency — a recursive resolver answers with what it
 * last saw, within TTL — and that is the correct answer anyway, because what a
 * snapshot records is what the world currently gets.
 *
 * DKIM IS PROBED BY NAME, BECAUSE IT CANNOT BE ENUMERATED. There is no DNS query
 * meaning *"list the selectors under `_domainkey`"* — a selector is a name you
 * have to already know. So {@link DKIM_SELECTORS} is a list of the names the
 * providers a small business actually uses publish under, and each one is asked
 * for individually. A MISSED SELECTOR BREAKS SIGNING SILENTLY and the symptom
 * arrives weeks later as *"our email goes to spam"*, which is why the list is
 * here in the open rather than inside whichever caller remembered.
 *
 * CLASSIFICATION IS A TABLE AND NOT A CHAIN OF CONDITIONALS. What makes *"your
 * email is with Microsoft — I'll keep that working"* sayable is a mapping from
 * a hostname nobody can read to a name everybody can, and the failure mode of
 * such a mapping is a provider nobody added rather than a rule nobody got right.
 * A table says plainly what is known, and therefore what is not.
 *
 * AND AN UNKNOWN HOST IS REPORTED AS THE HOST. Never as `null` dressed up as an
 * absence. *"Your mail is at `mx.example.net` and I do not recognise it"* is
 * usable; *"you have no mail"* is the sentence that precedes breaking it.
 *
 * `fetchImpl` IS AN ARGUMENT, on `resendMailer`'s reasoning: a UAT proving that
 * six selectors are probed and that an MX of `aspmx.l.google.com` is reported as
 * Google must drive a scripted resolver, not whatever `example.com` happens to
 * publish this week.
 */

/** The recursive resolver every query here goes to. */
export const DOH_ENDPOINT = 'https://cloudflare-dns.com/dns-query'

/** The record types this module reads. */
export type RecordType = 'A' | 'AAAA' | 'CNAME' | 'MX' | 'TXT' | 'NS'

/**
 * DNS type numbers, because the wire format uses them and the JSON API echoes
 * them back in every answer.
 */
const TYPE_NUMBERS: Record<RecordType, number> = {
  A: 1,
  NS: 2,
  CNAME: 5,
  MX: 15,
  TXT: 16,
  AAAA: 28,
}

/** One answer. */
export interface ResolvedRecord {
  type: RecordType
  /** The name that answered, without its trailing dot. */
  name: string
  /**
   * The value, normalised per type: a host for `CNAME`/`NS`, the host alone for
   * `MX` (the priority is beside it), the joined and unquoted string for `TXT`.
   */
  data: string
  /** `MX` only. */
  priority?: number
  ttl: number
}

/** One DKIM key that answered a probe. */
export interface DkimKey {
  /** The selector asked for — `google`, `selector1`, `resend`. */
  selector: string
  /**
   * Whose selector it is, in words a customer recognises.
   *
   * NEVER OPTIONAL. A DKIM answer reported without the provider whose selector
   * it is, is a string of base64 the customer cannot act on — and the whole
   * reason to probe is so *"your signing for Mailchimp"* can be said out loud.
   */
  provider: string
  /** The record's value — the public key, as published. */
  value: string
}

/**
 * The selectors probed, and whose they are.
 *
 * WHY THESE. [[EPIC-5]] names five and this adds ours. They are the providers a
 * small business signs mail with; the list grows when somebody finds a customer
 * whose signing was missed, which is the only honest way for it to grow.
 *
 * SEVERAL SELECTORS MAY BE ONE PROVIDER'S, and each is asked for separately
 * because publishing one and not the other is ordinary — Microsoft rotates
 * between `selector1` and `selector2`, and a domain that has only ever used one
 * has only one.
 */
export const DKIM_SELECTORS: readonly { selector: string; provider: string }[] = Object.freeze([
  { selector: 'google', provider: 'Google Workspace' },
  { selector: 'selector1', provider: 'Microsoft 365' },
  { selector: 'selector2', provider: 'Microsoft 365' },
  { selector: 'k1', provider: 'Mailchimp' },
  { selector: 's1', provider: 'SendGrid' },
  { selector: 's2', provider: 'SendGrid' },
  { selector: 'resend', provider: '1st Contact' },
])

/** A hostname suffix, and the name a customer would use for it. */
interface HostRule {
  suffix: string
  provider: string
}

/**
 * Who a domain's MAIL is with, by the host its `MX` points at.
 *
 * THE MX IS THE STRONGEST SIGNAL THERE IS, because it is where mail actually
 * goes: an SPF record can name six senders and a DKIM selector can outlive the
 * provider that published it, but exactly one set of hosts receives.
 */
export const MAIL_HOSTS: readonly HostRule[] = Object.freeze([
  { suffix: 'google.com', provider: 'Google Workspace' },
  { suffix: 'googlemail.com', provider: 'Google Workspace' },
  { suffix: 'outlook.com', provider: 'Microsoft 365' },
  { suffix: 'protection.outlook.com', provider: 'Microsoft 365' },
  { suffix: 'zoho.com', provider: 'Zoho Mail' },
  { suffix: 'zoho.eu', provider: 'Zoho Mail' },
  { suffix: 'messagingengine.com', provider: 'Fastmail' },
  { suffix: 'mail.protonmail.ch', provider: 'Proton Mail' },
  { suffix: 'protonmail.ch', provider: 'Proton Mail' },
  { suffix: 'improvmx.com', provider: 'ImprovMX' },
  { suffix: 'mx.cloudflare.net', provider: 'Cloudflare Email Routing' },
  { suffix: 'secureserver.net', provider: 'GoDaddy' },
  { suffix: 'emailsrvr.com', provider: 'Rackspace' },
  { suffix: 'ionos.co.uk', provider: 'IONOS' },
  { suffix: 'ionos.com', provider: 'IONOS' },
  { suffix: 'one.com', provider: 'one.com' },
])

/**
 * Who a domain's WEB is with, by what its apex or `www` answers.
 *
 * WHY THIS MATTERS AS MUCH AS THE MAIL. *"There is a live business on this
 * domain"* is most often a site somebody is paying for, and naming it is what
 * turns a warning into a sentence: *"your site is on Squarespace — moving the
 * nameservers will take it offline unless we copy it first."*
 *
 * THE `A` RULES ARE HOSTS AND NOT ADDRESSES. A literal IP in this table would be
 * a value a provider is free to change tomorrow with nothing to notice; a
 * `CNAME` target is a name the provider publishes on purpose.
 */
export const WEB_HOSTS: readonly HostRule[] = Object.freeze([
  { suffix: 'wixdns.net', provider: 'Wix' },
  { suffix: 'squarespace.com', provider: 'Squarespace' },
  { suffix: 'myshopify.com', provider: 'Shopify' },
  { suffix: 'shops.myshopify.com', provider: 'Shopify' },
  { suffix: 'github.io', provider: 'GitHub Pages' },
  { suffix: 'netlify.app', provider: 'Netlify' },
  { suffix: 'vercel-dns.com', provider: 'Vercel' },
  { suffix: 'vercel.app', provider: 'Vercel' },
  { suffix: 'webflow.io', provider: 'Webflow' },
  { suffix: 'wordpress.com', provider: 'WordPress.com' },
  { suffix: 'wpengine.com', provider: 'WP Engine' },
  { suffix: 'ghost.io', provider: 'Ghost' },
  { suffix: 'pages.dev', provider: 'Cloudflare Pages' },
  { suffix: 'workers.dev', provider: 'Cloudflare Workers' },
  { suffix: 'secureserver.net', provider: 'GoDaddy' },
  { suffix: 'websitebuilder.online', provider: 'GoDaddy' },
])

/**
 * Who else SENDS as this domain, by the `include:` tokens in its SPF.
 *
 * A DIFFERENT QUESTION FROM THE MX AND A LONGER ANSWER. A business receives in
 * one place and sends from several — the mail host, the newsletter tool, the
 * booking system, the invoicing app — and every one of them is something a
 * cutover can silently break. This is the list the customer gets read back to
 * them, and it is why the SPF record is merged rather than replaced.
 */
export const SPF_SENDERS: readonly HostRule[] = Object.freeze([
  { suffix: '_spf.google.com', provider: 'Google Workspace' },
  { suffix: 'spf.protection.outlook.com', provider: 'Microsoft 365' },
  { suffix: 'servers.mcsv.net', provider: 'Mailchimp' },
  { suffix: 'sendgrid.net', provider: 'SendGrid' },
  { suffix: 'amazonses.com', provider: 'Amazon SES' },
  { suffix: 'mailgun.org', provider: 'Mailgun' },
  { suffix: 'spf.mandrillapp.com', provider: 'Mandrill' },
  { suffix: '_spf.salesforce.com', provider: 'Salesforce' },
  { suffix: 'zoho.com', provider: 'Zoho Mail' },
  { suffix: '_spf.resend.com', provider: '1st Contact' },
  { suffix: 'spf.messagingengine.com', provider: 'Fastmail' },
  { suffix: 'secureserver.net', provider: 'GoDaddy' },
  { suffix: 'spf.constantcontact.com', provider: 'Constant Contact' },
  { suffix: 'mktomail.com', provider: 'Marketo' },
  { suffix: 'stripe.com', provider: 'Stripe' },
  { suffix: 'spf.squarespace.com', provider: 'Squarespace' },
])

/** Something this domain does, and who does it. */
export interface Attribution {
  /** The host or SPF token the answer came from — always present. */
  host: string
  /**
   * The provider's name, or `null` where nothing in the table matched.
   *
   * NULL MEANS *"I DO NOT RECOGNISE THIS"* AND NEVER *"THERE IS NOTHING"*.
   * {@link Attribution.host} is populated either way, so a caller always has
   * something true to say.
   */
  provider: string | null
}

/** Everything this module can see about a domain, at one moment. */
export interface DomainSnapshot {
  domain: string
  /** Every answer, by type, for the apex. */
  records: Record<RecordType, ResolvedRecord[]>
  /** `A` and `CNAME` on `www`, which is where half of small-business web lives. */
  www: ResolvedRecord[]
  /** Every selector that answered, with whose it is. */
  dkim: DkimKey[]
  /** Who receives mail here, from the `MX` — `null` where there is no mail. */
  mail: Attribution | null
  /** Who serves the web here, from the apex or `www` — `null` where nothing does. */
  web: Attribution | null
  /** Everyone the SPF authorises to send, in the order the record names them. */
  senders: Attribution[]
  hasLiveMail: boolean
  hasLiveWeb: boolean
  /**
   * The summary [[EPIC-5]]'s gate wants: **is there a live business here today?**
   *
   * COMPUTED HERE AND GATED ELSEWHERE, which is the epic's own surface /
   * capability split. What a caller does about a `true` — refuse, warn, sweep
   * and copy forward — is [[REQ-259]]'s and the nameserver flow's decision, and
   * a resolver that made it would be two tickets in one module.
   */
  live: boolean
  /** When this was read, so a later comparison knows how stale it is. */
  takenAt: string
}

/** The read half's whole surface. */
export interface DnsResolver {
  /** One name, one type, as the world currently answers it. */
  resolve(name: string, type: RecordType): Promise<ResolvedRecord[]>
  /** Every selector in {@link DKIM_SELECTORS} that answers for this domain. */
  probeDkim(domain: string): Promise<DkimKey[]>
  /** Everything at once, classified. */
  snapshot(domain: string): Promise<DomainSnapshot>
}

/** A name without its trailing dot, lower-cased. DNS is case-insensitive. */
export function normaliseName(raw: string): string {
  let name = String(raw ?? '')
    .trim()
    .toLowerCase()
  while (name.endsWith('.')) name = name.slice(0, -1)
  return name
}

/**
 * A `TXT` answer as the record's author wrote it.
 *
 * DNS SPLITS A LONG STRING INTO 255-BYTE CHUNKS and the JSON API hands them back
 * as several quoted segments in one `data` field. A DKIM public key is always
 * longer than that, so a reader that did not join them would see every key
 * truncated at the first chunk boundary — and would compare two truncations and
 * call them equal.
 */
export function unquoteTxt(raw: string): string {
  const segments = [...String(raw ?? '').matchAll(/"((?:[^"\\]|\\.)*)"/g)].map((m) =>
    m[1].replace(/\\(.)/g, '$1'),
  )
  return segments.length > 0 ? segments.join('') : String(raw ?? '').trim()
}

/** The first rule whose suffix this host ends on, or `null`. */
function match(host: string, rules: readonly HostRule[]): string | null {
  const name = normaliseName(host)
  for (const rule of rules) {
    if (name === rule.suffix || name.endsWith(`.${rule.suffix}`)) return rule.provider
  }
  return null
}

/** Who a mail host belongs to, or `null` where the table does not know. */
export function classifyMailHost(host: string): string | null {
  return match(host, MAIL_HOSTS)
}

/** Who a web host belongs to, or `null` where the table does not know. */
export function classifyWebHost(host: string): string | null {
  return match(host, WEB_HOSTS)
}

/** Who an SPF `include:` token belongs to, or `null`. */
export function classifySpfSender(token: string): string | null {
  return match(token, SPF_SENDERS)
}

/**
 * Every `include:` in an SPF record, in the order it names them.
 *
 * ORDER IS KEPT because SPF is evaluated left to right and a customer reading
 * the list back recognises it in the order their own record has it.
 *
 * ONLY `v=spf1` RECORDS. A domain's `TXT` set is a junk drawer — verification
 * tokens, site ownership proofs, a note somebody left — and an `include:` in one
 * of those is not an SPF include.
 */
export function spfIncludes(txtValues: readonly string[]): string[] {
  const includes: string[] = []
  for (const value of txtValues) {
    if (!/^v=spf1\b/i.test(value.trim())) continue
    for (const token of value.split(/\s+/)) {
      const found = /^include:(.+)$/i.exec(token)
      if (found) includes.push(normaliseName(found[1]))
    }
  }
  return includes
}

/** What the JSON resolver answers with. */
interface DohAnswer {
  name?: unknown
  type?: unknown
  TTL?: unknown
  data?: unknown
}
interface DohResponse {
  Status?: unknown
  Answer?: DohAnswer[]
}

/** Nothing could be read, because the resolver could not be reached. */
export class ResolverUnreachableError extends Error {
  readonly name = 'ResolverUnreachableError'
}

function toRecord(type: RecordType, answer: DohAnswer): ResolvedRecord | null {
  // THE ANSWER SECTION CARRIES THE CHAIN AND NOT ONLY THE LEAF. Asking for `A`
  // on a name that is a `CNAME` returns the `CNAME` too, so every answer is
  // filtered by the type actually wanted — otherwise a `CNAME` would arrive in
  // the `A` list as a hostname pretending to be an address.
  if (answer.type !== TYPE_NUMBERS[type]) return null
  const raw = String(answer.data ?? '')
  const name = normaliseName(String(answer.name ?? ''))
  const ttl = typeof answer.TTL === 'number' ? answer.TTL : 0

  if (type === 'MX') {
    const parts = raw.trim().split(/\s+/)
    const priority = Number(parts[0])
    return {
      type,
      name,
      data: normaliseName(parts.slice(1).join(' ')),
      priority: Number.isFinite(priority) ? priority : 0,
      ttl,
    }
  }
  if (type === 'TXT') return { type, name, data: unquoteTxt(raw), ttl }
  if (type === 'CNAME' || type === 'NS') return { type, name, data: normaliseName(raw), ttl }
  return { type, name, data: raw.trim(), ttl }
}

/**
 * The resolver.
 *
 * NO CREDENTIAL AND THEREFORE NO CONFIGURATION. Public recursive DNS is
 * available to anyone, which is the whole reason this half of the DNS layer has
 * no fail-closed gate while the write half does: reading what a domain publishes
 * is something the deployment can always do, and an absent answer means the
 * domain publishes nothing rather than that we are not allowed to look.
 */
export function dnsResolver(fetchImpl: typeof fetch = fetch): DnsResolver {
  async function query(name: string, type: RecordType): Promise<ResolvedRecord[]> {
    const target = normaliseName(name)
    if (target === '') return []
    const url = `${DOH_ENDPOINT}?name=${encodeURIComponent(target)}&type=${type}`
    let response: Response
    try {
      response = await fetchImpl(url, { headers: { accept: 'application/dns-json' } })
    } catch (err) {
      const why = err instanceof Error ? err.message : String(err)
      throw new ResolverUnreachableError(`DNS could not be read for ${target}: ${why}`)
    }
    if (!response.ok) {
      throw new ResolverUnreachableError(
        `DNS could not be read for ${target}: the resolver answered ${response.status}.`,
      )
    }
    const payload = (await response.json().catch(() => null)) as DohResponse | null
    // NXDOMAIN AND AN EMPTY ANSWER ARE THE SAME THING TO EVERY CALLER HERE —
    // nothing is published at this name for this type — so neither is an error.
    // A resolver that could not be reached IS one, and the two must not arrive
    // as the same empty list: *"they have no MX"* and *"we could not look"*
    // lead to opposite decisions about somebody's mail.
    const answers = Array.isArray(payload?.Answer) ? payload.Answer : []
    return answers.map((answer) => toRecord(type, answer)).filter((r): r is ResolvedRecord => r !== null)
  }

  async function probeDkim(domain: string): Promise<DkimKey[]> {
    const target = normaliseName(domain)
    // EVERY SELECTOR AT ONCE. They are independent queries and doing them in
    // sequence would make the sweep as slow as the list is long, on the one
    // path a customer is waiting on.
    const probes = await Promise.all(
      DKIM_SELECTORS.map(async ({ selector, provider }) => {
        const records = await query(`${selector}._domainkey.${target}`, 'TXT')
        // A `_domainkey` NAME MAY CARRY OTHER TXT, so the answer is only a DKIM
        // key if it says so. `v=DKIM1` is optional in the spec and `p=` is not,
        // so the presence of a public key is what is tested.
        const key = records.find((r) => /(^|;)\s*p=/.test(r.data) || /^v=DKIM1\b/i.test(r.data))
        return key ? { selector, provider, value: key.data } : null
      }),
    )
    return probes.filter((k): k is DkimKey => k !== null)
  }

  return {
    resolve: query,
    probeDkim,

    async snapshot(domain) {
      const target = normaliseName(domain)
      const [a, aaaa, cname, mx, txt, ns, wwwA, wwwCname, dkim] = await Promise.all([
        query(target, 'A'),
        query(target, 'AAAA'),
        query(target, 'CNAME'),
        query(target, 'MX'),
        query(target, 'TXT'),
        query(target, 'NS'),
        query(`www.${target}`, 'A'),
        query(`www.${target}`, 'CNAME'),
        probeDkim(target),
      ])

      const records: Record<RecordType, ResolvedRecord[]> = {
        A: a,
        AAAA: aaaa,
        CNAME: cname,
        MX: mx,
        TXT: txt,
        NS: ns,
      }
      const www = [...wwwA, ...wwwCname]

      // THE LOWEST-PRIORITY MX IS THE ONE THAT NAMES THE PROVIDER. A domain
      // usually publishes several and they are usually all one provider's; when
      // they are not, the one mail is actually delivered to is the answer.
      const primary = [...mx].sort((x, y) => (x.priority ?? 0) - (y.priority ?? 0))[0]
      const mail: Attribution | null = primary
        ? { host: primary.data, provider: classifyMailHost(primary.data) }
        : null

      // THE APEX FIRST AND `www` AS THE FALLBACK, because the apex is the
      // address the business is actually known by.
      const candidates = [cname[0], a[0], wwwCname[0], wwwA[0]]
        .filter((r): r is ResolvedRecord => r !== undefined)
        .map((r) => r.data)
      // BUT A CANDIDATE THAT NAMES ITS PROVIDER WINS OVER ONE THAT DOES NOT, and
      // that is not a preference for tidier output. The commonest live shape in
      // this product's market is an apex `A` record pointing at a builder's
      // anycast address with the `CNAME` that NAMES that builder sitting on
      // `www` — so reading the apex and stopping would answer *"203.0.113.7,
      // provider unknown"* for a domain whose site is unmistakably on
      // Squarespace, and the sentence a customer needs to hear is the one that
      // names it. The HOST reported is always the one the provider was read
      // from, so the pair never disagrees with itself.
      const named = candidates.find((host) => classifyWebHost(host) !== null)
      const webHost = named ?? candidates[0] ?? null
      const web: Attribution | null =
        webHost === null ? null : { host: webHost, provider: classifyWebHost(webHost) }

      const senders: Attribution[] = spfIncludes(txt.map((r) => r.data)).map((host) => ({
        host,
        provider: classifySpfSender(host),
      }))

      const hasLiveMail = mx.length > 0
      const hasLiveWeb = a.length > 0 || aaaa.length > 0 || cname.length > 0 || www.length > 0

      return {
        domain: target,
        records,
        www,
        dkim,
        mail,
        web,
        senders,
        hasLiveMail,
        hasLiveWeb,
        live: hasLiveMail || hasLiveWeb,
        takenAt: new Date().toISOString(),
      }
    },
  }
}

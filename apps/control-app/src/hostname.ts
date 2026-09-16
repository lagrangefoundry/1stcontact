/**
 * The public address a site is reached at — the one place `site_domains` is read
 * and written ([[REQ-238]], [[DOC-45]] §5 and §7).
 *
 * TWO NAMES, OPPOSITE LIFECYCLES, AND THIS IS THE PERMANENT ONE. `business.ts`
 * holds what the business IS CALLED: visible to its owner and to us, unique
 * inside one account, chosen early and cheaply, changed freely and with no
 * consequence. This holds what the PUBLIC types: unique across every hostname
 * ever issued, chosen deliberately, and **changed not at all**. The two sit on
 * one settings tab, and keeping them in two modules with two vocabularies is the
 * cheapest way to stop a reader — or a model — treating a decision somebody
 * lives with as a text field.
 *
 * CHOSEN, NEVER ASSIGNED. [[DOC-45]] §7 used to say the label was assigned at
 * provision from the slugified business name, and [[REQ-190]]'s `unnamed`
 * reasoning held that up: a default must exist and must visibly ask to be
 * changed rather than block somebody on a choice they are not ready to make.
 * That argument fails here and only here, because the name it would slugify is
 * `Unnamed business` — so the assigned default is `unnamedbusiness`, which is
 * not a name that asks to be changed but a name that says nothing, handed to
 * somebody who never asked for it, in the one namespace on this product that is
 * global, public and first-come. Nothing in this module mints a hostname. The
 * customer chooses, and may take as long as they like: until a site is published
 * it has no public address and needs none.
 *
 * FINAL, AND THERE IS NO UPDATE PATH ON `host`. Not a guarded one, not an
 * operator-only one. If a hostname could be swapped freely and the old one
 * recycled, one business could walk through dozens of good names in an
 * afternoon, and `1stc.site` is a first-come namespace that only ever gets
 * smaller. Because nothing is relinquished, nothing is re-issued: the customer
 * who paints `alice.1stc.site` on a van keeps it, and no stranger can ever
 * inherit their traffic. A change path is expected eventually, gated by a
 * one-off fee — it lands as a new row and a status flip, and **nothing here is
 * built in anticipation of it**.
 *
 * TWO OPERATIONS, AND THE SPLIT IS THE POINT. The experience is a domain
 * registrar's: you type a name, you press return, and you are told "already
 * taken" or "yes, you can have it". So {@link checkHostname} has no side effect,
 * is repeatable, and is safe to call as fast as somebody can type; and
 * {@link claimHostname} is the only operation with a consequence. Without a
 * check, the settings assistant could only guess — and a suggestion that turns
 * out to be taken is worse than no suggestion.
 *
 * A CHECK IS NOT A PROMISE AND THE CLAIM IS THE AUTHORITY. Two customers can
 * check `alice` in the same second and both be told yes. The unique index on
 * `host` decides it and the loser is refused at the claim — *"that one went
 * while you were deciding"* — rather than being handed a duplicate. Nothing here
 * reserves anything and nothing trusts an earlier check: a check that reserved
 * would be a hold on a finite public namespace, with no expiry, obtainable by
 * typing.
 *
 * EXPOSING THE CHECK IS NOT AN INFORMATION LEAK. An existence oracle matters
 * when the value is one a business would not otherwise disclose, and a public
 * address exists in order to be publicly resolvable ([[DOC-45]] §5). DNS gives
 * this away for free to anyone who asks.
 */

import { d1r2SiteStore } from '../../../tools/generate/src/store/d1r2-store'
import { newId } from '../../../tools/generate/src/store/ids'
import type { IdentityEnv } from './identity'
import { PUBLIC_SITE_ORIGIN } from './public-url'

/**
 * This product's own apex ([[TODO-6]]).
 *
 * A CONSTANT AND NOT A VAR, on `PUBLIC_SITE_ORIGIN`'s reasoning: it is the
 * product's own address, the same in every deployment that exists, and a
 * per-environment override's only reachable effect would be to issue a customer
 * a permanent hostname under a domain nobody owns.
 */
export const PLATFORM_APEX = '1stc.site'

/**
 * What kind of address a row is.
 *
 * `custom` IS IMPLEMENTED NOW ([[REQ-258]]), and the arrangement it was declared
 * for is what made that cheap: every question asked of an address is asked over
 * the KIND rather than over `platform`, so `publish` refuses a site with no
 * address rather than a site with no `1stc.site` hostname, and it landed
 * unchanged when the second kind arrived.
 *
 * THE TWO KINDS OBEY OPPOSITE RULES AND THAT IS DELIBERATE. A `platform` host is
 * scarce, public and first-come, so it is chosen once and never changed or
 * re-issued — the whole of this module's header. A customer's own domain is none
 * of those things: they may move it between sites, take it off a site, and take
 * it away entirely, because it is theirs. Same table, opposite rules, and the
 * finality rule is the one already implemented, so it is the one that will
 * otherwise be applied uniformly by whoever gets here first.
 */
export type AddressKind = 'platform' | 'custom'

/** One public address, as this module reports it. Always the whole host. */
export interface SiteAddress {
  /** The row's opaque key. Never shown to a customer. */
  id: string
  /** The site this host reaches, by its key. */
  siteKey: string
  /**
   * The whole host — `alice.1stc.site`, never `alice`.
   *
   * THE LABEL IS NOT A FIELD ON THIS SHAPE, deliberately. A permanent name,
   * entered as free text, by the low-tech customer this product is for, is a
   * permanent typo waiting to happen — so everything downstream of here is
   * handed the address as it will actually be, and no surface has to remember to
   * append an apex before showing it to somebody about to commit.
   */
  host: string
  kind: AddressKind
  /**
   * Whether this host is **the** address, or one that redirects to it
   * ([[REQ-258]], `0011_site_domains_canonical.sql`).
   *
   * [[DOC-45]] §4's *"a site has exactly one address"* is a statement about the
   * canonical one and never about how many hosts resolve. Attaching a domain
   * writes the apex AND `www`, because a visitor who types `www.` must not meet
   * a certificate error — so the moment custom domains exist, two hosts reach
   * one site in the ordinary case and something has to say which one a link is
   * composed from and which one 301s to the other.
   *
   * EXACTLY ONE LIVE ROW PER SITE CARRIES IT, enforced by a partial unique index
   * rather than by convention.
   */
  canonical: boolean
}

/** Refused because of what was typed. */
export class InvalidHostnameError extends Error {
  readonly name = 'InvalidHostnameError'
}

/**
 * Refused because the label is one we keep.
 *
 * ITS OWN ERROR AND NOT AN `InvalidHostnameError`, because the two want
 * different words: one says *that is not a hostname*, and the other says *that
 * one is ours* — and only the second is worth offering an alternative for.
 */
export class ReservedHostnameError extends Error {
  readonly name = 'ReservedHostnameError'
}

/**
 * Refused because somebody else has it.
 *
 * IT CARRIES THE HOST, because *"that one went while you were deciding"* is only
 * useful if it says which one — a customer who typed three candidates in ten
 * seconds cannot otherwise tell which of them was refused.
 */
export class HostnameTakenError extends Error {
  readonly name = 'HostnameTakenError'
  constructor(
    readonly host: string,
    message: string,
  ) {
    super(message)
  }
}

/**
 * Refused because this business already has one, and it cannot be changed.
 *
 * THE REFUSAL CARRIES THE ADDRESS THEY HOLD. A customer asking for a second one
 * has almost certainly forgotten what the first was, and *"you already have
 * one"* without naming it is the least useful true sentence available.
 */
export class HostnameAlreadyHeldError extends Error {
  readonly name = 'HostnameAlreadyHeldError'
  constructor(
    readonly held: SiteAddress,
    message: string,
  ) {
    super(message)
  }
}

/** There is no site to give an address to. */
export class NoSiteError extends Error {
  readonly name = 'NoSiteError'
}

/**
 * Labels this product keeps, in the four groups [[TODO-6]] §2 names.
 *
 * FOUR GROUPS BECAUSE THEY CHANGE FOR FOUR DIFFERENT REASONS, and flattening
 * them into one array is how the reason a label is on the list gets lost. What
 * follows is [[TODO-6]] §2 written out, and it includes every label
 * [[REQ-238]]'s own behaviour list names.
 *
 * THE FAILURE IS NOT SYMMETRIC, which is the whole argument for a list longer
 * than the sentence that motivated it: a label wrongly refused is a mild
 * annoyance answered by typing another one, and a label wrongly granted is
 * unrecoverable once somebody is using it as their business address.
 */
export const RESERVED_INFRASTRUCTURE: readonly string[] = Object.freeze([
  'www',
  'app',
  'api',
  'mail',
  'smtp',
  'imap',
  'mx',
  'ns',
  'ns1',
  'ns2',
  'cdn',
  'static',
  'assets',
  'admin',
  'dashboard',
  'status',
  'staging',
  'dev',
  'test',
  'localhost',
])

/**
 * Protocol and validation labels ([[TODO-6]] §2).
 *
 * EVERY ONE OF THESE IS ALREADY REFUSED BY THE CHARACTER RULE, because a leading
 * underscore is not in `a-z0-9-`. They are on the list anyway, and that is not
 * redundancy: it means the day somebody widens the character set — for an
 * internationalised label, say — they cannot silently hand a customer
 * `_acme-challenge.1stc.site` and with it the ability to interfere with
 * certificate issuance for the apex every other customer is under.
 */
export const RESERVED_PROTOCOL: readonly string[] = Object.freeze([
  '_acme-challenge',
  '_dmarc',
  '_domainkey',
  'autodiscover',
  'autoconfig',
])

/**
 * Labels that would wear this product's name ([[TODO-6]] §2).
 *
 * A CUSTOMER SITE AT `billing.1stc.site` IS A READY-MADE CREDENTIAL-HARVESTING
 * PAGE WEARING OUR NAME, and it would be reached over our certificate, under our
 * apex, beside every real customer.
 *
 * `portal` IS HERE FOR A SECOND REASON TOO. It was the reserved slug the account
 * portal was found under before [[REQ-236]] replaced it with `sites.kind`, and a
 * name this product has already used once for something structural is not a name
 * to hand out permanently.
 */
export const RESERVED_PLATFORM_IDENTITY: readonly string[] = Object.freeze([
  '1stcontact',
  '1stc',
  'firstcontact',
  'support',
  'help',
  'billing',
  'account',
  'accounts',
  'login',
  'signin',
  'secure',
  'verify',
  'payment',
  'portal',
])

/**
 * Every reserved label, as one set.
 *
 * THE FOURTH GROUP [[TODO-6]] §2 NAMES IS NOT HERE, and its absence is a
 * decision rather than an oversight ([[REQ-238]], [[DOC-45]] §11 item 6).
 * Impersonation of a bank, a government or this platform harms a third party
 * immediately and has no benefit of the doubt to give; the obscenity tail is a
 * different problem, because a substring blocklist eventually refuses a real
 * business its real name, and answering that badly is worse than deferring it.
 * What closes the gap in the meantime is {@link revokeHostname} — which is why
 * revocation is built here rather than left for later.
 */
export const RESERVED_LABELS: ReadonlySet<string> = new Set([
  ...RESERVED_INFRASTRUCTURE,
  ...RESERVED_PROTOCOL,
  ...RESERVED_PLATFORM_IDENTITY,
])

/** The longest a DNS label may be. */
export const MAX_LABEL_LENGTH = 63

/**
 * What the customer typed, as a label.
 *
 * TIDYING, AND ONE PIECE OF GENEROSITY. Whitespace and case are removed because
 * a hostname has neither and refusing `Alice ` for having a capital and a space
 * would be pedantry about a difference DNS does not observe. The generosity is
 * the apex: everything that asks for this value shows the customer the WHOLE
 * host — that is this ticket's requirement, not a rendering choice — so
 * `alice.1stc.site` is exactly what a careful person will paste back, and
 * refusing it would be refusing them the string we just showed them.
 *
 * A TRAILING DOT IS AN ABSOLUTE NAME and means the same host. It costs one
 * character to accept and produces a baffling refusal if it is not.
 *
 * IT VALIDATES NOTHING. Everything this returns still goes through
 * {@link labelRefusal}; the two are separate so that what is *tidied* and what
 * is *refused* can be read apart.
 */
export function normaliseLabel(raw: string): string {
  let label = String(raw ?? '')
    .trim()
    .toLowerCase()
  while (label.endsWith('.')) label = label.slice(0, -1)
  const suffix = `.${PLATFORM_APEX}`
  if (label.endsWith(suffix)) label = label.slice(0, -suffix.length)
  return label
}

/** The whole host a label resolves to. */
export function hostFor(label: string): string {
  return `${normaliseLabel(label)}.${PLATFORM_APEX}`
}

/**
 * Why this label cannot be a hostname, or null.
 *
 * ONE FUNCTION, AND IT IS THE WHOLE SYNTACTIC AND RESERVED RULE. `check` and
 * `claim` both call it, which is what makes a check honest: a check that applied
 * a looser rule than the claim would tell somebody `alice-` was free and then
 * refuse it, which is the one thing a registrar's field must never do.
 *
 * IT ANSWERS A SENTENCE AND NOT A BOOLEAN, because every one of these refusals
 * is actionable and the action differs — shorten it, drop the hyphen, pick
 * another word. A boolean would make every one of them "no".
 */
export function labelRefusal(raw: string): string | null {
  const label = normaliseLabel(raw)
  if (label === '') return 'A hostname needs at least one character.'
  if (label.length > MAX_LABEL_LENGTH) {
    return `A hostname can be at most ${MAX_LABEL_LENGTH} characters, and that one is ${label.length}.`
  }
  // THE `xn--` PREFIX IS REFUSED SO NOBODY HAND-ROLLS A PUNYCODE LOOKALIKE.
  // `xn--pple-43d` is how `äpple` is written on the wire, and a customer who
  // typed the encoded form directly would be choosing a hostname that renders in
  // a browser as a word they did not type — which is the mechanism every
  // homograph attack is built on. Internationalised labels are not refused
  // forever by this; they are refused until somebody encodes them on the way in
  // rather than a customer encoding them by hand.
  if (label.startsWith('xn--')) {
    return 'A hostname cannot start with `xn--`. If you want an accented or non-Latin name, ask us.'
  }
  if (!/^[a-z0-9-]+$/.test(label)) {
    return 'A hostname can only use letters, numbers and hyphens.'
  }
  if (label.startsWith('-') || label.endsWith('-')) {
    return 'A hostname cannot start or end with a hyphen.'
  }
  if (RESERVED_LABELS.has(label)) {
    return `\`${label}\` is one we keep for the product itself. Pick another word.`
  }
  return null
}

/**
 * Which KIND of refusal a check ran into ([[REQ-249]]).
 *
 * THE CLASS IS DECIDED HERE BECAUSE THE RULES ARE HERE. The settings pane says
 * something different for each of the three — *try another word* for a name
 * somebody else has, *that one is ours* for a reserved label, and the broken
 * rule itself for a name that is not a hostname — and the only other way for it
 * to tell them apart would be to read {@link labelRefusal}'s prose, or to carry
 * its own copy of the reserved list. Both are re-deciding, in the client, what
 * this module already decided.
 *
 * `taken` AND `reserved` ARE NOT THE SAME ANSWER, and collapsing them sends the
 * customer the wrong way: somebody told `mail` is *taken* goes looking for
 * `mail2`, which is also reserved, and so is every other decoration of the word.
 */
export type HostnameRefusal = 'taken' | 'reserved' | 'invalid'

/** What {@link checkHostname} answers. */
export interface HostnameCheck {
  /** The whole host, as it would be. Present even when it is refused. */
  host: string
  available: boolean
  /** Why not, in a sentence. Null when it is available. */
  refusal: string | null
  /** Which kind of refusal it was. Null when it is available. */
  reason: HostnameRefusal | null
}

/**
 * Is this hostname available?
 *
 * NO SIDE EFFECT, REPEATABLE, AND CHEAP. It is what the field on the settings
 * pane calls on every return press and what the settings assistant calls when a
 * customer's first six choices are gone. Nothing is written, nothing is
 * reserved, and nothing about having called it makes a later claim more likely
 * to succeed.
 *
 * IT ASKS ABOUT THE ROW AND NOT ABOUT `active`, and that is the one place in
 * this module where a revoked row is deliberately visible. A revoked host is
 * never re-issued, so a check that ignored revoked rows would report a hostname
 * as free and the claim would then be refused by the unique index — the exact
 * disagreement between the two operations this function exists to prevent.
 */
export async function checkHostname(env: IdentityEnv, raw: string): Promise<HostnameCheck> {
  const host = hostFor(raw)
  const refusal = labelRefusal(raw)
  if (refusal !== null) {
    // THE SAME SPLIT `claimHostname` MAKES, and made once here so the two
    // operations cannot come to disagree about which refusal a label earns.
    const reason: HostnameRefusal = RESERVED_LABELS.has(normaliseLabel(raw))
      ? 'reserved'
      : 'invalid'
    return { host, available: false, refusal, reason }
  }
  const row = await env.DB.prepare('SELECT id FROM site_domains WHERE host = ?')
    .bind(host)
    .first<{ id: string }>()
  return row
    ? { host, available: false, refusal: `\`${host}\` is already taken.`, reason: 'taken' }
    : { host, available: true, refusal: null, reason: null }
}

/** Every live address for one site, whatever kind it is. */
export async function addressesOf(env: IdentityEnv, siteKey: string): Promise<SiteAddress[]> {
  const { results } = await env.DB.prepare(
    // ORDERED CANONICAL-FIRST AND THEN BY AGE. `created_at` alone was a stable
    // order and is no longer a MEANINGFUL one now that a site holds several
    // hosts: the apex and its `www` are written in the same operation and can
    // share a timestamp, so *"the first one"* stopped being an answer to
    // anything. Callers that want the address still ask {@link canonicalAddress};
    // what this ordering buys is that a caller which reads the list in order
    // meets the address before its aliases rather than in insertion order.
    "SELECT id, site_id, host, kind, canonical FROM site_domains WHERE site_id = ? AND status = 'active' ORDER BY canonical DESC, created_at, host",
  )
    .bind(siteKey)
    .all<AddressRow>()
  return (results ?? []).map(toAddress)
}

/**
 * Which of a site's addresses a LINK should wear, or `null` for a site with none
 * ([[BUG-97]]).
 *
 * THE CUSTOM ONE WINS AND `platform` IS THE FALLBACK. A business that has gone
 * to the trouble of pointing its own domain at us has said which address it wants
 * to be seen at, and a mail to a stranger is the surface where being seen at the
 * other one costs the most — it is the whole of why [[BUG-97]] is a bug rather
 * than an inelegance. Nothing holds both today, because `custom` is declared and
 * not implemented; the preference is written now so that [[EPIC-6]] landing does
 * not silently leave every gated mail on the platform host.
 *
 * ASKED OVER `kind` AND NEVER BY MATCHING THE APEX, which is the rule this
 * module already holds itself to: a reader that tested for `.1stc.site` would be
 * `if (!hostname) refuse` in a different costume, wrong the day a second kind
 * appears.
 *
 * PURE, OVER A LIST THE CALLER ALREADY HAS. {@link addressesOf} is the read; this
 * is the choice. Keeping them apart is what lets the publish gate ask *does this
 * site have at least one address* over the same list without going near which
 * one of them a link would use.
 */
export function addressForLinks(addresses: readonly SiteAddress[]): SiteAddress | null {
  // THE CANONICAL ONE FIRST ([[REQ-258]]), and the kind ordering below it
  // unchanged. Preferring `custom` was the whole answer while a site held one
  // host of each kind; a site now holds `alicesplumbing.com` AND
  // `www.alicesplumbing.com`, both `custom`, and *"the first custom one"* would
  // pick whichever the list happened to return — so a mailed link could name the
  // alias, arrive, and 301 the recipient before showing them anything.
  //
  // THE FALLBACK IS NOT DEAD CODE. `canonical` defaults to 1 for every row that
  // existed before `0011`, so a site with no canonical row is one whose only
  // address was revoked — and the kind ordering is then the honest answer rather
  // than `null`.
  return (
    addresses.find((address) => address.canonical) ??
    addresses.find((address) => address.kind === 'custom') ??
    addresses.find((address) => address.kind === 'platform') ??
    null
  )
}

/**
 * **The** address, or `null` for a site that has none ([[REQ-258]]).
 *
 * PURE, OVER A LIST THE CALLER ALREADY HAS, on {@link addressForLinks}'s
 * reasoning exactly — and it is deliberately NOT that function. This one answers
 * *"which host is the address"*, which is a fact about the site and is what a
 * non-canonical host redirects TO. That one answers *"which address should this
 * link wear"*, which is a question about an audience and has a fallback for a
 * site whose canonical row has been revoked. They agree in every ordinary case
 * and the two questions are still different ones.
 */
export function canonicalAddress(addresses: readonly SiteAddress[]): SiteAddress | null {
  return addresses.find((address) => address.canonical) ?? null
}

/** The columns every read in this module selects, as SQLite hands them back. */
interface AddressRow {
  id: string
  site_id: string
  host: string
  kind: string
  /**
   * SQLite's boolean, which is an INTEGER.
   *
   * READ THROUGH `Number(...)` RATHER THAN `=== 1`, and defaulted to canonical.
   * A `1` arriving as the string `'1'` from some other driver would otherwise
   * read as non-canonical, and a non-canonical row is one that 301s — so the
   * failure of guessing wrong here is a redirect loop rather than a wrong
   * label, which is worth one coercion.
   */
  canonical?: number | string | null
}

function toAddress(row: AddressRow): SiteAddress {
  return {
    id: row.id,
    siteKey: row.site_id,
    host: row.host,
    kind: row.kind as AddressKind,
    canonical: Number(row.canonical ?? 1) === 1,
  }
}

/**
 * The site this business's address belongs to.
 *
 * `'site'` — THE CUSTOMER'S SITE, NOT THE PORTAL, the same distinction
 * `business.ts` draws. A portal is authored under the same business
 * ([[REQ-236]]'s `kind`) and is not the thing a public hostname reaches.
 *
 * THE FIRST ONE, BECAUSE THERE IS EXACTLY ONE. Provisioning mints it
 * ([[REQ-236]]); a business holding two is a shape nothing in the product
 * creates today, and [[EPIC-4]]'s settlement of [[DOC-45]] §11 item 4 — one
 * hostname per business, at a time — is what will still be true when a site
 * selector lands.
 */
export async function siteOf(env: IdentityEnv, businessId: string): Promise<string | null> {
  const store = await d1r2SiteStore(env).forTenant(businessId)
  const keys = await store.siteKeys('site')
  return keys[0] ?? null
}

/** Every live address this business holds, across its sites. */
export async function businessAddresses(
  env: IdentityEnv,
  businessId: string,
): Promise<SiteAddress[]> {
  const siteKey = await siteOf(env, businessId)
  return siteKey === null ? [] : addressesOf(env, siteKey)
}

/**
 * Take a hostname. Final.
 *
 * THE ONLY OPERATION HERE WITH A CONSEQUENCE, and it is written so that the
 * refusals arrive in the order a person would ask them: is that a hostname at
 * all, is it one we keep, do you already have one, and — last, from the database
 * rather than from a read — is it still free.
 *
 * IT DOES NOT TRUST AN EARLIER CHECK, and that is not defensiveness. Between
 * {@link checkHostname} answering yes and this insert, another customer may have
 * claimed the same host; a `SELECT` here followed by an `INSERT` would be the
 * same race with two round trips instead of one. The unique index decides, this
 * function reports what it decided, and the customer is told *"that one went
 * while you were deciding"* rather than being handed a duplicate.
 *
 * ONE AT A TIME, PER BUSINESS. [[EPIC-4]] settled [[DOC-45]] §11 item 4 that
 * way. The read that enforces it is not atomic against a second concurrent claim
 * by the same business, and the partial unique index in
 * `0008_site_domains.sql` is what makes that case impossible rather than merely
 * unlikely — the same two-sided arrangement `0007` has, with the code carrying
 * the rule and the index carrying the integrity.
 */
export async function claimHostname(
  env: IdentityEnv,
  businessId: string,
  raw: string,
): Promise<SiteAddress> {
  const refusal = labelRefusal(raw)
  if (refusal !== null) {
    if (RESERVED_LABELS.has(normaliseLabel(raw))) throw new ReservedHostnameError(refusal)
    throw new InvalidHostnameError(refusal)
  }

  const siteKey = await siteOf(env, businessId)
  if (siteKey === null) {
    throw new NoSiteError('This business has no site yet, so there is nothing to give an address to.')
  }

  const held = (await addressesOf(env, siteKey)).find((a) => a.kind === 'platform')
  if (held) {
    throw new HostnameAlreadyHeldError(
      held,
      `This business already has \`${held.host}\`, and a hostname cannot be changed.`,
    )
  }

  const host = hostFor(raw)
  // CANONICAL ONLY IF NOTHING ELSE ALREADY IS ([[REQ-258]]). A business that
  // attached its own domain first and then claims its free `1stc.site` hostname
  // is asking for a second address, not for a new one — and a site with two
  // canonical rows is refused by `idx_site_domains_site_canonical`, so getting
  // this wrong would turn an ordinary claim into a constraint failure whose
  // message names an index rather than a decision.
  //
  // AND THE CUSTOM DOMAIN KEEPS THE TITLE, which is the same preference
  // `addressForLinks` has always expressed: a business that went to the trouble
  // of pointing its own domain at us has said which address it wants to be seen
  // at, and claiming the free one afterwards is not a retraction of that.
  const canonical = canonicalAddress(await addressesOf(env, siteKey)) === null
  const address: SiteAddress = { id: newId('dom'), siteKey, host, kind: 'platform', canonical }
  try {
    await env.DB.prepare(
      "INSERT INTO site_domains (id, site_id, host, kind, status, canonical, created_at) VALUES (?, ?, ?, ?, 'active', ?, ?)",
    )
      .bind(address.id, siteKey, host, address.kind, canonical ? 1 : 0, new Date().toISOString())
      .run()
  } catch (error) {
    // WHAT A CONSTRAINT FAILURE MEANS HERE IS DECIDED BY WHICH INDEX FIRED, and
    // the two are distinguished by re-reading rather than by parsing SQLite's
    // message: the message is a string from a dependency and the answer is one
    // query away. If the host now exists, somebody else took it; if it does not,
    // the site acquired an address between the read above and this insert, which
    // is the same business claiming twice at once.
    const taken = await env.DB.prepare('SELECT id FROM site_domains WHERE host = ?')
      .bind(host)
      .first<{ id: string }>()
    if (taken) {
      throw new HostnameTakenError(
        host,
        `\`${host}\` went while you were deciding. Pick another one.`,
      )
    }
    const now = (await addressesOf(env, siteKey)).find((a) => a.kind === 'platform')
    if (now) {
      throw new HostnameAlreadyHeldError(
        now,
        `This business already has \`${now.host}\`, and a hostname cannot be changed.`,
      )
    }
    throw error
  }
  return address
}

/**
 * Take a hostname back. Ours, never the owner's ([[TODO-6]] §2).
 *
 * THE SAFETY VALVE FINALITY CREATES THE NEED FOR. An owner cannot change their
 * own hostname, so a hostname that has to go — a bank's name, a government's,
 * ours, or whatever gets through a reserved list that cannot be complete — can
 * only go by our hand. *"Whatever the list says, something will get through it,
 * and the only alternative to revocation is leaving it up."*
 *
 * IT IS NOT AN UPDATE PATH ON `host`, and the distinction is the one
 * [[DOC-45]] §7's falsifier turns on. The host is never rewritten: the row keeps
 * the value it was created with forever, and what changes is whether that row is
 * live. Which is also why a revoked hostname is never re-issued — the row is
 * still there, and the unique index still refuses it to the next person who
 * asks.
 *
 * THE BUSINESS CAN THEN CLAIM ANOTHER ONE, which is a consequence rather than a
 * courtesy: a revoked hostname leaves the site with no address, and a site with
 * no address cannot be published.
 *
 * ANSWERS NULL FOR A HOST THAT WAS NOT LIVE, rather than raising — revoking
 * something already revoked is not an error, and an operator repeating a command
 * should get the same answer twice.
 */
export async function revokeHostname(env: IdentityEnv, rawHost: string): Promise<SiteAddress | null> {
  const host = normaliseHost(rawHost)
  const row = await env.DB.prepare(
    "SELECT id, site_id, host, kind, canonical FROM site_domains WHERE host = ? AND status = 'active'",
  )
    .bind(host)
    .first<AddressRow>()
  if (!row) return null
  await env.DB.prepare("UPDATE site_domains SET status = 'revoked' WHERE id = ?").bind(row.id).run()
  return toAddress(row)
}

/* ------------------------------------------------------------------------- *
 * Custom domains — a host the business owns, pointed at one of its sites
 * ([[REQ-258]]).
 *
 * SAME TABLE, OPPOSITE RULES, AND THE RULES ARE THE WHOLE REASON THIS SECTION
 * IS SEPARATE FROM THE ONE ABOVE. `claimHostname` is final because `1stc.site`
 * is a finite, public, first-come namespace: nothing is relinquished, so nothing
 * is re-issued, and a customer who painted a label on a van keeps it. A domain
 * the business bought is none of those things. They may move it between sites,
 * take it off a site, and take it away entirely — so {@link releaseCustomHosts}
 * DELETES the rows rather than revoking them, which is precisely what the
 * platform side must never do.
 *
 * WHAT IS STILL SHARED IS THE TABLE AND THIS MODULE. Every read and write of
 * `site_domains` is here, which is the invariant this file's header states, and
 * the serving mechanism (`serving.ts`) composes these operations with the
 * Cloudflare ones rather than reaching for the table itself.
 * ------------------------------------------------------------------------- */

/** The longest a hostname may be, in total. */
export const MAX_HOST_LENGTH = 253

/**
 * A hostname as it will be stored: lower-cased, no scheme, no path, no trailing
 * dot.
 *
 * THE SAME GENEROSITY `normaliseLabel` EXTENDS AND FOR THE SAME REASON. A pasted
 * address is a likely input — whoever is attaching a domain has almost certainly
 * just been looking at it — and `https://alicesplumbing.com/` means the domain
 * they mean. A trailing dot is an absolute name and names the same host.
 *
 * IT VALIDATES NOTHING; {@link hostRefusal} does. The two are apart so that what
 * is *tidied* and what is *refused* can be read separately, exactly as
 * `normaliseLabel` and `labelRefusal` are.
 */
export function normaliseHost(raw: string): string {
  let host = String(raw ?? '')
    .trim()
    .toLowerCase()
  host = host.replace(/^[a-z][a-z0-9+.-]*:\/\//, '').split('/')[0]
  // A port is not part of a host and would make the stored value unmatchable
  // against a `Host:` header, which arrives without one for 80 and 443.
  host = host.split(':')[0]
  while (host.endsWith('.')) host = host.slice(0, -1)
  return host
}

/**
 * Why this cannot be a custom hostname, or null.
 *
 * ONE FUNCTION AND IT IS THE WHOLE SYNTACTIC RULE, on {@link labelRefusal}'s
 * reasoning: a pre-check that applied a looser rule than the write would accept
 * a domain and then refuse it. It answers a SENTENCE and not a boolean because
 * every one of these is actionable and the actions differ.
 *
 * THE PLATFORM APEXES ARE REFUSED HERE, which is a namespace rule rather than a
 * syntactic one and belongs with it anyway: `alice.1stc.site` is a hostname
 * somebody may have, and the way to have it is {@link claimHostname} — with its
 * reserved list, its finality and its one-per-business rule. Reaching it through
 * the custom-domain path would be all of those rules, walked past.
 */
export function hostRefusal(raw: string): string | null {
  const host = normaliseHost(raw)
  if (host === '') return 'A domain is needed.'
  if (host.length > MAX_HOST_LENGTH) {
    return `A domain can be at most ${MAX_HOST_LENGTH} characters, and that one is ${host.length}.`
  }
  const labels = host.split('.')
  // A SINGLE LABEL IS NOT A DOMAIN SOMEBODY CAN OWN. `localhost` and `intranet`
  // resolve differently for every visitor, and no certificate authority will
  // issue for one.
  if (labels.length < 2) return `\`${host}\` is not a domain. It needs at least one dot.`
  for (const label of labels) {
    if (label === '') return 'A domain cannot have an empty part.'
    if (label.length > MAX_LABEL_LENGTH) {
      return `Each part of a domain can be at most ${MAX_LABEL_LENGTH} characters.`
    }
    // THE SAME `xn--` REFUSAL `labelRefusal` MAKES, and for the same reason: a
    // hand-encoded punycode label renders in a browser as a word nobody typed,
    // which is the mechanism every homograph attack is built on.
    if (label.startsWith('xn--')) {
      return 'A domain cannot use a hand-written `xn--` part. If it is an accented or non-Latin name, ask us.'
    }
    if (!/^[a-z0-9-]+$/.test(label)) return 'A domain can only use letters, numbers and hyphens.'
    if (label.startsWith('-') || label.endsWith('-')) {
      return 'No part of a domain can start or end with a hyphen.'
    }
  }
  for (const apex of PLATFORM_APEXES_FOR_HOSTS) {
    if (host === apex || host.endsWith(`.${apex}`)) {
      return `\`${apex}\` is ours. A hostname under it is chosen in settings, not attached as a domain.`
    }
  }
  return null
}

/**
 * The apexes a custom domain may not sit under.
 *
 * DECLARED HERE AND NOT IMPORTED FROM `zones.ts`, which holds the same set as
 * `PLATFORM_APEXES`. That module imports {@link PLATFORM_APEX} from this one, so
 * the dependency already runs that way and importing back would close a cycle.
 * Both are derived from the same two constants rather than from a third literal
 * spelling, which is the property that actually matters.
 */
const PLATFORM_APEXES_FOR_HOSTS: readonly string[] = [
  PLATFORM_APEX,
  new URL(PUBLIC_SITE_ORIGIN).hostname,
]

/** What {@link attachCustomHosts} is asked to write. */
export interface CustomHostSpec {
  /** The host that becomes **the** address. */
  canonicalHost: string
  /** Hosts that reach the same site and 301 to the canonical one. */
  aliases?: readonly string[]
}

/**
 * Point hosts a business owns at one of its sites. Not final ([[REQ-258]]).
 *
 * ONE WRITE, IN A BATCH, BECAUSE HALF OF IT IS A BROKEN SITE. The previous
 * canonical row is demoted and the new rows are inserted in one D1 batch — which
 * is a transaction — so there is no window in which a site has two canonical
 * addresses (refused by the index) or none (every host 301ing to nothing). The
 * demote has to precede the insert for the same reason.
 *
 * THE ROW IS WRITTEN LAST IN THE MECHANISM AND THAT IS `serving.ts`'S JOB, not
 * this function's. What this owes it is that a failure here leaves the table
 * exactly as it found it.
 *
 * IT DOES NOT TRUST A PRE-CHECK, on {@link claimHostname}'s reasoning: the
 * unique index on `host` decides, and a constraint failure is re-read to find
 * out which host it was about rather than parsed out of SQLite's message.
 */
export async function attachCustomHosts(
  env: IdentityEnv,
  siteKey: string,
  spec: CustomHostSpec,
): Promise<SiteAddress[]> {
  const canonicalHost = normaliseHost(spec.canonicalHost)
  const aliases = (spec.aliases ?? []).map(normaliseHost).filter((h) => h !== canonicalHost)
  const hosts = [canonicalHost, ...new Set(aliases)]

  for (const host of hosts) {
    const refusal = hostRefusal(host)
    if (refusal !== null) throw new InvalidHostnameError(refusal)
  }

  const now = new Date().toISOString()
  const addresses: SiteAddress[] = hosts.map((host) => ({
    id: newId('dom'),
    siteKey,
    host,
    kind: 'custom' as const,
    canonical: host === canonicalHost,
  }))

  const statements = [
    // DEMOTE, NEVER DELETE. The site may already hold its `1stc.site` hostname,
    // which is final and stays — what changes is that it is no longer the
    // address, so it starts 301ing to the domain the business chose. That is the
    // preference `addressForLinks` has always expressed, made into a serving
    // behaviour rather than only a link one.
    env.DB.prepare(
      "UPDATE site_domains SET canonical = 0 WHERE site_id = ? AND status = 'active' AND canonical = 1",
    ).bind(siteKey),
    ...addresses.map((address) =>
      env.DB.prepare(
        "INSERT INTO site_domains (id, site_id, host, kind, status, canonical, created_at) VALUES (?, ?, ?, 'custom', 'active', ?, ?)",
      ).bind(address.id, siteKey, address.host, address.canonical ? 1 : 0, now),
    ),
  ]

  try {
    await env.DB.batch(statements)
  } catch (error) {
    // WHICH HOST THE INDEX REFUSED IS ONE QUERY AWAY, so it is asked rather than
    // read out of a driver's error string. A host somebody else already holds is
    // the only outcome a caller can do anything about, and naming it is the
    // difference between *\"pick another\"* and *\"something went wrong\"*.
    for (const host of hosts) {
      const taken = await env.DB.prepare('SELECT id FROM site_domains WHERE host = ?')
        .bind(host)
        .first<{ id: string }>()
      if (taken) {
        throw new HostnameTakenError(host, `\`${host}\` is already pointed at a site.`)
      }
    }
    throw error
  }
  return addresses
}

/**
 * Stop serving hosts a business owns. **Deletes**, and that is the point.
 *
 * THE OPPOSITE OF {@link revokeHostname}, DELIBERATELY. A revoked `platform` row
 * stays in the table forever so that the unique index keeps refusing the host to
 * everybody — that is how nothing is ever re-issued on a scarce namespace. A
 * customer's own domain is not scarce and is not ours: they may take it off this
 * site and point it at another one tomorrow, or at somebody else entirely, and a
 * tombstone row would make this product the reason they cannot.
 *
 * IT WILL NOT TOUCH A `platform` ROW, and the `kind` in the WHERE clause is the
 * whole of that guard. Deleting one would hand a scarce, permanent, first-come
 * hostname back to the pool — the one outcome this module's header says is
 * impossible — and the refusal has to live in the statement rather than in a
 * caller's discipline.
 *
 * THE ROLLBACK PATH USES IT TOO. A mechanism that wrote records, failed to
 * create the route, and left a row behind would have produced exactly this
 * ticket's first falsifier, so undoing is the same operation as releasing and
 * there is one definition of it.
 */
export async function releaseCustomHosts(
  env: IdentityEnv,
  hosts: readonly string[],
): Promise<string[]> {
  const wanted = [...new Set(hosts.map(normaliseHost).filter((h) => h !== ''))]
  if (wanted.length === 0) return []
  const released: string[] = []
  for (const host of wanted) {
    const row = await env.DB.prepare(
      "SELECT id FROM site_domains WHERE host = ? AND kind = 'custom'",
    )
      .bind(host)
      .first<{ id: string }>()
    if (!row) continue
    await env.DB.prepare("DELETE FROM site_domains WHERE id = ? AND kind = 'custom'")
      .bind(row.id)
      .run()
    released.push(host)
  }
  return released
}

/**
 * The live address a HOST is, or `null` ([[REQ-258]]).
 *
 * THE INVERSE OF {@link addressesOf}, and it is here for that function's reason:
 * every read of `site_domains` is in this module, so *\"filtered to
 * `status = 'active'`\"* is a property of one file rather than a discipline every
 * caller observes. `public-site` asks the same question of the same table and
 * asks it in its own Worker, which is a different bundle with its own store —
 * that seam is `site-store.ts` over there, not a second reader here.
 */
export async function addressByHost(
  env: IdentityEnv,
  rawHost: string,
): Promise<SiteAddress | null> {
  const row = await env.DB.prepare(
    "SELECT id, site_id, host, kind, canonical FROM site_domains WHERE host = ? AND status = 'active'",
  )
    .bind(normaliseHost(rawHost))
    .first<AddressRow>()
  return row ? toAddress(row) : null
}

/**
 * Make sure a site that has any live address has a canonical one ([[REQ-258]]).
 *
 * WHAT IT REPAIRS IS A HOLE RELEASING LEAVES. A site whose canonical address was
 * the custom domain it just gave up holds rows that all 301 to a host with no
 * row — a redirect to nothing, on every address the site has left. Promotion is
 * therefore part of releasing rather than something a caller remembers, and it
 * lives here because it is a write to this table.
 *
 * IT PROMOTES THE FIRST OF WHAT IS LEFT, which {@link addressesOf} orders
 * canonical-first and then by age — so with no canonical row left, the oldest
 * survivor wins. For the case this exists for that is the business's `1stc.site`
 * hostname, which is the address it had before the domain arrived.
 *
 * A NO-OP WHEN THERE IS ALREADY ONE, and a no-op for a site with no addresses at
 * all: a site with no address is a site that cannot be published, which is a
 * state the product already has a word for.
 */
export async function ensureCanonical(
  env: IdentityEnv,
  siteKey: string,
): Promise<SiteAddress | null> {
  const live = await addressesOf(env, siteKey)
  const held = canonicalAddress(live)
  if (held) return held
  const promote = live[0]
  if (!promote) return null
  await env.DB.prepare('UPDATE site_domains SET canonical = 1 WHERE id = ?').bind(promote.id).run()
  return { ...promote, canonical: true }
}

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
 * `custom` IS DECLARED AND NOT IMPLEMENTED, and that is the whole reason the
 * kind exists at all. [[EPIC-6]] builds custom domains; what this ticket owes
 * them is that every question asked of an address is asked over the KIND rather
 * than over `platform` — so `publish` refuses a site with no address rather than
 * a site with no `1stc.site` hostname, and lands unchanged the day a second kind
 * appears.
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

/** What {@link checkHostname} answers. */
export interface HostnameCheck {
  /** The whole host, as it would be. Present even when it is refused. */
  host: string
  available: boolean
  /** Why not, in a sentence. Null when it is available. */
  refusal: string | null
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
  if (refusal !== null) return { host, available: false, refusal }
  const row = await env.DB.prepare('SELECT id FROM site_domains WHERE host = ?')
    .bind(host)
    .first<{ id: string }>()
  return row
    ? { host, available: false, refusal: `\`${host}\` is already taken.` }
    : { host, available: true, refusal: null }
}

/** Every live address for one site, whatever kind it is. */
export async function addressesOf(env: IdentityEnv, siteKey: string): Promise<SiteAddress[]> {
  const { results } = await env.DB.prepare(
    "SELECT id, site_id, host, kind FROM site_domains WHERE site_id = ? AND status = 'active' ORDER BY created_at",
  )
    .bind(siteKey)
    .all<{ id: string; site_id: string; host: string; kind: string }>()
  return (results ?? []).map(toAddress)
}

function toAddress(row: { id: string; site_id: string; host: string; kind: string }): SiteAddress {
  return {
    id: row.id,
    siteKey: row.site_id,
    host: row.host,
    kind: row.kind as AddressKind,
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
async function siteOf(env: IdentityEnv, businessId: string): Promise<string | null> {
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
  const address: SiteAddress = { id: newId('dom'), siteKey, host, kind: 'platform' }
  try {
    await env.DB.prepare(
      "INSERT INTO site_domains (id, site_id, host, kind, status, created_at) VALUES (?, ?, ?, ?, 'active', ?)",
    )
      .bind(address.id, siteKey, host, address.kind, new Date().toISOString())
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
  const host = String(rawHost ?? '').trim().toLowerCase()
  const row = await env.DB.prepare(
    "SELECT id, site_id, host, kind FROM site_domains WHERE host = ? AND status = 'active'",
  )
    .bind(host)
    .first<{ id: string; site_id: string; host: string; kind: string }>()
  if (!row) return null
  await env.DB.prepare("UPDATE site_domains SET status = 'revoked' WHERE id = ?").bind(row.id).run()
  return toAddress(row)
}

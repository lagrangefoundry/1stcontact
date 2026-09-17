/**
 * **The customer's own domain, as three controls and no records** ([[REQ-259]]).
 *
 * WHAT A CUSTOMER GETS TO DECIDE, in full: *which domain*, *whether mail goes
 * out from it*, and *whether it stays*. Everything else — `A` versus `CNAME`,
 * the `www` redirect, the certificate, the SPF, DKIM and DMARC values, the
 * propagation wait, the Cloudflare zone id — is machinery, and **if a customer
 * is being shown a record type, we have failed**. That is *"notify in their
 * language, do not ask in ours"* applied to the happy path rather than to the
 * dangerous one.
 *
 * IT COMPOSES AND IT IMPLEMENTS ALMOST NOTHING. The pool is [[REQ-257]]'s
 * `zonesForAccount`; exclusivity is the unique index `0008_site_domains.sql`
 * already carries, read back rather than re-decided; attaching is [[REQ-258]]'s
 * `serveHostOnSite` entire; the pre-attach reading is [[REQ-257]]'s resolver and
 * **not a second implementation**; the mail half is `sending.ts`. What is
 * genuinely new here is the authorisation rule, the sentence a live domain is
 * described with, and the ordering of a release.
 *
 * AUTHORISATION IS THE THING THE SELECTOR HIDES. The pool belongs to an ACCOUNT
 * and the assignment happens inside a BUSINESS, so a business member who is not
 * the account holder does not get to spend an account asset — they are told to
 * ask, and are shown no pool at all. Without that, a member of one business
 * could consume a domain the account holder bought for a sibling business.
 *
 * FINALITY IS A `platform` RULE AND IS NOT INHERITED HERE. `hostname.ts`'s
 * header is emphatic that a `1stc.site` hostname is chosen once and never
 * changed, because that namespace is scarce, public and first-come. **A
 * customer's own domain is none of those things.** They may move it between
 * sites, take it off a site, and take it away entirely, because it is theirs —
 * and the finality rule is the one already implemented, so it is the one that
 * will otherwise be applied uniformly by whoever gets here first. Telling a
 * customer that the domain they bought is now permanently welded to a site is
 * the worst available way to fail closed.
 *
 * EXCLUSIVITY IS PER HOST AND NOT PER DOMAIN. The unique index gives one site
 * per host and that is the whole rule. A per-domain rule would additionally
 * forbid `alicesplumbing.com` reaching one site while `shop.alicesplumbing.com`
 * reaches another — which [[DOC-45]] §2.3 commits to eventually, and which is
 * the natural way to trial a new site on a domain whose apex still runs the old
 * one.
 */

import { businessRecord } from './business'
import type { CloudflareClient } from './cloudflare'
import type { Admission } from './identity'
import type { IdentityEnv } from './identity'
import { addressesOf, normaliseHost, siteOf, type SiteAddress } from './hostname'
import type { DnsResolver, DomainSnapshot } from './resolver'
import { ResendNotPermittedError, type ResendClient } from './resend'
import {
  disableSending,
  enableSending,
  refreshSending,
  sendingFor,
  SendingNotConfiguredError,
  type Sending,
} from './sending'
import { serveHostOnSite, servingPlan, stopServingHost } from './serving'
import { zoneByApex, zoneForHost, zonesForAccount, type Zone } from './zones'

/** The caller may not spend this account's assets. */
export class NotTheAccountHolderError extends Error {
  readonly name = 'NotTheAccountHolderError'
  constructor() {
    super(ASK_THE_ACCOUNT_HOLDER)
  }
}

/**
 * What a business member who is not the account holder is told.
 *
 * IT NAMES WHO TO ASK AND NOT WHAT THEY LACK. *"You do not have permission"*
 * ends the conversation; *"ask the account owner"* is the next step, and it is
 * the true one — the domain really is somebody else's asset and really can be
 * attached by them in a minute.
 */
export const ASK_THE_ACCOUNT_HOLDER =
  'Ask the account owner to attach a domain to this site.'

/** The domain is not one this account holds. */
export class UnknownDomainError extends Error {
  readonly name = 'UnknownDomainError'
}

/** One entry in the selector. */
export interface DomainOption {
  /** The whole domain, as the customer knows it. `alicesplumbing.com`. */
  domain: string
  /**
   * Whether it is free to attach.
   *
   * A TAKEN DOMAIN IS LISTED AND DISABLED RATHER THAN OMITTED. A customer who
   * bought two domains and can only see one has been shown a bug; a customer who
   * can see both and is told which is already in use has been shown the truth.
   */
  available: boolean
  /** Why not, in a sentence, or null. Never an id and never a host list. */
  refusal: string | null
}

/** What this business's domain section draws itself from. */
export interface DomainState {
  /** The pool. Empty for a caller who may not spend it — see {@link mayAttach}. */
  pool: DomainOption[]
  /** The domain currently serving this site, or null. */
  attached: string | null
  /**
   * Where mail from this domain got to: `off`, or the third wait's own state.
   *
   * `off` IS A STATE AND NOT AN ABSENCE, because the toggle has to draw itself
   * either way and a surface that had to distinguish "no row" from "a row saying
   * off" would be asking the database a question the customer never asked.
   */
  email: 'off' | 'pending' | 'verified' | 'failed'
  /** Whether this caller may attach, release or change the toggle. */
  mayAttach: boolean
  /**
   * Can this deployment configure sending at all? ([[REQ-264]])
   *
   * SEPARATE FROM {@link email}, because they answer different questions and
   * collapsing them is what shipped the defect. `email` is where this
   * customer's mail got to; this is whether the control that changes it can
   * work — and when it cannot, the surface does not draw the control. A
   * deployment with no `RESEND_API_KEY` and one holding a *Sending access* key
   * are the same state here, which is the point: `resend.ts` says offering a
   * toggle and refusing it is *"worse than not offering it"*, and that is true
   * whichever way the deployment got there.
   */
  emailAvailable: boolean
  /** Why not, in a sentence, or null. */
  refusal: string | null
}

/**
 * What one attachment found already living on the domain, in the customer's
 * words.
 *
 * IT NOTIFIES; IT DOES NOT ASK. [[EPIC-5]] is decisive about why, and the reason
 * is the client's own: *"our users are not going to be in a position to confirm
 * anything here."* A confirmation a furniture restorer cannot perform launders
 * our error into their approval — so this is a list of sentences the surface
 * shows AFTER the attach, and there is deliberately no shape here that a caller
 * could turn into a gate.
 *
 * EMPTY WHEN THE DOMAIN IS CLEAN, and that is load-bearing. A warning about a
 * risk that does not exist is how customers learn to dismiss warnings.
 */
export interface LiveUse {
  /** True when anything at all is already running here. */
  live: boolean
  /** One sentence per thing found, in their language. Never a record. */
  notes: string[]
}

/**
 * Read what is already on the domain and say it in their words.
 *
 * THE ASSUMPTION THAT THE OPERATOR'S OWN ZONES ARE GREEN FIELD IS FALSE, and
 * `MAIL.md` is the counter-example: `1stcontact.io` carries a live Resend record
 * set today. **A domain that has been owned for years is exactly as likely to be
 * carrying live mail as one that just arrived**, so this check is a prerequisite
 * of attaching anything rather than a courtesy for imported domains.
 *
 * IT NAMES THE PROVIDER WHEN IT CAN AND THE HOST WHEN IT CANNOT.
 * {@link Attribution} carries both for exactly this reason: *"Your email is with
 * Microsoft 365"* is a sentence a customer can contradict, and a sentence they
 * can contradict is the only useful signal they can actually give us.
 *
 * AND IT PROMISES WHAT WE WILL DO ABOUT IT — *"I'll keep that working"* — because
 * the true statement is that attaching a domain touches the WEB records and the
 * `send.` subdomain, and leaves their `MX` exactly where it is.
 */
export function describeLiveUse(snapshot: DomainSnapshot): LiveUse {
  const notes: string[] = []
  if (snapshot.mail) {
    const who = snapshot.mail.provider ?? snapshot.mail.host
    notes.push(`Your email is with ${who} — I'll keep that working.`)
  }
  if (snapshot.web) {
    const who = snapshot.web.provider ?? snapshot.web.host
    notes.push(
      `Your website is currently with ${who}. Once this is switched over, ` +
        'visitors will see the site we have built instead.',
    )
  }
  return { live: snapshot.live, notes }
}

/**
 * Is this caller the account holder for this business?
 *
 * THE ACCOUNT AND NOT THE ROLE. Owning the business is `ownsBusiness` and is a
 * different question: a `support` member may be an owner of the business they
 * are helping without being the person whose account paid for its domains. What
 * is being spent here is an ACCOUNT asset, so the predicate is over the account.
 *
 * IT READS THE ADMISSION AND THE BUSINESS RECORD, and nothing else. The
 * admission already carries the caller's account, and `tenants.owner_account_id`
 * is where a business's account is recorded — so this is a comparison rather
 * than a policy, and there is no third place it could disagree with.
 *
 * THE PLATFORM BUSINESS HAS NO OWNER ACCOUNT (`owner_account_id` is NULL), so
 * this answers false for it, which is correct: the platform's own zones are the
 * operator's and are reached through `/api/admin/domains`.
 */
export async function isAccountHolder(
  env: IdentityEnv,
  admission: Admission | null | undefined,
  businessId: string,
): Promise<boolean> {
  if (!admission?.ok) return false
  const business = await businessRecord(env, businessId)
  const owner = business?.ownerAccountId ?? null
  if (owner === null) return false
  return owner === admission.user.account_id
}

/**
 * Which hosts of a zone an attachment would occupy — the apex and its `www`.
 *
 * ASKED OF `serving.ts` RATHER THAN SPELT OUT. What an attachment writes is that
 * module's decision, and a selector that computed the same list separately would
 * be a second answer to *"is this domain free"* that could disagree with the one
 * the attach actually acts on.
 */
function hostsFor(apex: string): string[] {
  const plan = servingPlan(apex, apex)
  return [plan.canonicalHost, ...plan.aliases]
}

/**
 * The account's pool, with each domain's availability read off the table that
 * decides it.
 *
 * **NO NEW EXCLUSIVITY LOGIC.** The unique index on `site_domains.host` is the
 * authority and this only reports what it already holds: a host with a live row
 * is taken, and by which site. Re-deriving the rule here would be a second
 * answer that can disagree with the one the insert enforces — and the insert
 * wins, so the disagreement would surface as a selector offering a domain the
 * attach then refuses.
 *
 * A DOMAIN THIS SITE ALREADY HOLDS IS NOT IN THE POOL. It is the attached one,
 * and it is reported as such by {@link domainState}.
 */
export async function domainPool(
  env: IdentityEnv,
  accountId: string | null,
  siteKey: string | null,
): Promise<DomainOption[]> {
  const zones = await zonesForAccount(env, accountId, { status: 'active' })
  if (zones.length === 0) return []
  const hosts = zones.flatMap((zone) => hostsFor(zone.apex))
  const placeholders = hosts.map(() => '?').join(', ')
  const { results } = await env.DB.prepare(
    `SELECT host, site_id FROM site_domains WHERE status = 'active' AND host IN (${placeholders})`,
  )
    .bind(...hosts)
    .all<{ host: string; site_id: string }>()
  const claimed = new Map((results ?? []).map((row) => [row.host, row.site_id]))

  const pool: DomainOption[] = []
  for (const zone of zones) {
    const taken = hostsFor(zone.apex)
      .map((host) => claimed.get(host))
      .find((site) => site !== undefined)
    if (taken !== undefined && taken === siteKey) continue
    pool.push({
      domain: zone.apex,
      available: taken === undefined,
      // THE REFUSAL NAMES NO SITE AND NO KEY. Which other site holds it is not
      // this customer's business to be told, and an opaque key would be the
      // machinery on the screen this ticket exists to keep off it.
      refusal: taken === undefined ? null : 'This domain is already in use on another site.',
    })
  }
  return pool
}

/** The domain currently serving this site, or null. */
export function attachedDomain(addresses: readonly SiteAddress[]): string | null {
  const custom = addresses.find((address) => address.kind === 'custom' && address.canonical)
  return custom?.host ?? null
}

/**
 * Everything the section draws itself from, in one read.
 *
 * ONE ROUTE AND ONE ANSWER, because every part of it is about the same subject
 * and a surface assembling four calls would draw itself four times — showing a
 * pool before it knew whether the caller may spend it, which is the one ordering
 * that cannot be allowed to happen even briefly.
 *
 * A NON-HOLDER SEES NO POOL AT ALL, not a disabled one. The pool is a list of
 * things somebody else paid for, and showing it to a member who cannot spend it
 * invites them to ask for a specific one — which is a conversation about
 * somebody else's assets that we started.
 */
export async function domainState(
  env: IdentityEnv,
  admission: Admission | null | undefined,
  businessId: string,
  resend: ResendClient | null = null,
): Promise<DomainState> {
  const siteKey = await siteOf(env, businessId)
  const addresses = siteKey === null ? [] : await addressesOf(env, siteKey)
  const attached = attachedDomain(addresses)
  const holder = await isAccountHolder(env, admission, businessId)

  let sending = await sendingFor(env, businessId)
  // CAN THIS DEPLOYMENT CONFIGURE SENDING AT ALL ([[REQ-264]]). Asked before the
  // section draws rather than discovered when somebody presses the toggle, on
  // `resend.ts`'s own rule. One request, on a pane nobody opens twice a minute,
  // and only for the caller who could act on the answer — a member sees a
  // disabled control either way, so spending a round trip to tell them which
  // kind of disabled it is would buy nothing.
  let emailAvailable = resend !== null
  if (resend !== null && holder) emailAvailable = await resend.canManageDomains()

  // THE THIRD WAIT IS ASKED ABOUT ON A READ, and only while it is pending. The
  // customer's own question is *has my email come right yet*, and the surface
  // that answers it is this one — a separate poll route would be a second way to
  // ask one question, and a state that only moved when somebody pressed
  // something would read as broken.
  if (sending && resend) {
    try {
      sending = await refreshSending(env, resend, sending)
    } catch (error) {
      // A KEY NARROWED AFTER THE FACT MUST NOT BREAK THE READ. The records are
      // published and the mail still flows; what has gone is our ability to ask
      // Resend about it, so the last known answer stands and the toggle goes.
      if (!(error instanceof ResendNotPermittedError)) throw error
      emailAvailable = false
    }
  }

  return {
    pool: holder ? await domainPool(env, admission?.ok ? admission.user.account_id : null, siteKey) : [],
    attached,
    email: emailStateOf(sending),
    mayAttach: holder,
    emailAvailable,
    refusal: holder ? null : ASK_THE_ACCOUNT_HOLDER,
  }
}

function emailStateOf(sending: Sending | null): DomainState['email'] {
  return sending === null ? 'off' : sending.status
}

/**
 * What a customer is told when this deployment cannot configure sending.
 *
 * ONE SENTENCE, IN OUR WORDS, for every way of getting there — no key, a
 * *Sending access* key, a key revoked since. It names no provider and quotes
 * none: *"This API key is restricted to only send emails"* is a sentence about
 * our configuration shown to somebody who has no configuration ([[REQ-264]]).
 */
const SENDING_UNAVAILABLE =
  'Sending from your own domain is not available on this deployment, so the ' +
  'toggle would change nothing. Your website is unaffected.'

/** What one attach did, as the surface reports it. */
export interface AttachResult {
  domain: string
  /** What was already living here — empty when the domain is clean. */
  liveUse: LiveUse
  email: DomainState['email']
}

/**
 * Point a domain this account holds at this business's site.
 *
 * THE READING COMES FIRST AND IS NOT A GATE. The pre-attach check is a
 * prerequisite of attaching — the epic's *"is there a live business on this
 * domain today?"* — and what it produces is a sentence, not a decision. A
 * resolver that could not be reached does not stop the attach: refusing to
 * connect somebody's domain because a public DNS endpoint was slow would be this
 * product breaking itself over a question it only asked in order to be polite.
 *
 * SENDING IS ON BY DEFAULT and is turned on AFTER the web records, because the
 * site working is the thing the customer asked for and mail is the thing they
 * assumed. A sending failure therefore leaves a working website and a toggle
 * that can be tried again, rather than undoing an attachment that succeeded.
 */
export async function attachDomain(
  env: IdentityEnv,
  client: CloudflareClient,
  resolver: DnsResolver,
  resend: ResendClient | null,
  request: { businessId: string; domain: string; email?: boolean },
): Promise<AttachResult> {
  const domain = normaliseHost(request.domain)
  // `zoneForHost` AND NOT `zoneByApex`, because the host the customer names is
  // not always the apex. Exclusivity is per HOST, so `shop.alicesplumbing.com`
  // reaching one site while the apex reaches another is a supported shape
  // ([[DOC-45]] §2.3) — and an apex-only lookup would refuse it as an unknown
  // domain rather than serving it.
  const zone = await zoneForHost(env, domain)
  if (zone === null || zone.status !== 'active') {
    throw new UnknownDomainError(`\`${domain}\` is not a domain on this account.`)
  }
  // AND IT HAS TO BE **THIS** ACCOUNT'S. The route gate answers *is this caller
  // the holder of this business's account*; without this, a holder could name a
  // domain belonging to somebody else's account entirely and have it attached —
  // the same failure the selector's account filter prevents, arrived at by
  // typing rather than by choosing.
  const business = await businessRecord(env, request.businessId)
  if (zone.accountId === null || zone.accountId !== (business?.ownerAccountId ?? null)) {
    throw new UnknownDomainError(`\`${domain}\` is not a domain on this account.`)
  }
  const siteKey = await siteOf(env, request.businessId)
  if (siteKey === null) {
    throw new UnknownDomainError('This business has no site yet, so there is nothing to address.')
  }

  let liveUse: LiveUse = { live: false, notes: [] }
  try {
    liveUse = describeLiveUse(await resolver.snapshot(domain))
  } catch {
    // COULD NOT LOOK. Nothing is said, because the honest alternative — *"we
    // could not check whether your email is affected"* — is a sentence that
    // frightens a customer about a risk we have no reason to believe exists.
  }

  await serveHostOnSite(env, client, { siteKey, host: domain })

  const wantsEmail = request.email !== false
  let email: DomainState['email'] = 'off'
  if (wantsEmail && resend) {
    try {
      const sending = await enableSending(env, client, resend, resolver, {
        businessId: request.businessId,
        zone,
      })
      email = sending.status
    } catch (error) {
      // A KEY THAT CANNOT MANAGE DOMAINS IS THE SAME AS NO KEY ([[REQ-264]]),
      // and the attach is where that matters most: the customer asked for their
      // domain and got it, and the thing they did not ask about — mail they
      // assumed — reports `off` exactly as it does on a deployment with no
      // sending credential. Refusing the whole attach over it would take the
      // website away to punish a configuration the customer has no part in.
      if (!(error instanceof ResendNotPermittedError)) throw error
      email = 'off'
    }
  }
  return { domain, liveUse, email }
}

/**
 * Turn mail from the attached domain on or off, on its own.
 *
 * THE TOGGLE IS SEPARATE FROM THE ATTACH because it is separately reversible. A
 * customer who turned sending on and then discovered their accountant was
 * confused by the new `From` address must be able to put it back without giving
 * up the website address they just told their customers about.
 */
export async function setDomainEmail(
  env: IdentityEnv,
  client: CloudflareClient,
  resend: ResendClient | null,
  resolver: DnsResolver,
  request: { businessId: string; enabled: boolean },
): Promise<DomainState['email']> {
  const held = await sendingFor(env, request.businessId)
  if (!request.enabled) {
    if (held) {
      const zone = await zoneByApex(env, held.domain)
      if (zone) await disableSending(env, client, resend, held, zone.cfZoneId)
    }
    return 'off'
  }

  const siteKey = await siteOf(env, request.businessId)
  const addresses = siteKey === null ? [] : await addressesOf(env, siteKey)
  const domain = attachedDomain(addresses)
  if (domain === null) {
    throw new UnknownDomainError('There is no domain on this site to send from.')
  }
  const zone = await zoneForAttached(env, domain)
  // ONE REFUSAL FOR BOTH WAYS OF NOT BEING ABLE TO SEND ([[REQ-264]]). It was
  // an `UnknownDomainError`, which is a sentence about the domain for a
  // condition that has nothing to do with it; `SendingNotConfiguredError` is
  // the one this module already has for *turning sending on needs a live
  // registration and there is none*, and a key the provider refuses is that
  // condition arrived at from the other direction.
  if (resend === null) {
    throw new SendingNotConfiguredError(SENDING_UNAVAILABLE)
  }
  try {
    const sending = await enableSending(env, client, resend, resolver, {
      businessId: request.businessId,
      zone,
    })
    return sending.status
  } catch (error) {
    if (!(error instanceof ResendNotPermittedError)) throw error
    throw new SendingNotConfiguredError(SENDING_UNAVAILABLE)
  }
}

/** The zone an attached host belongs to, or a refusal naming the host. */
async function zoneForAttached(env: IdentityEnv, host: string): Promise<Zone> {
  const zone = await zoneForHost(env, host)
  if (zone === null) throw new UnknownDomainError(`\`${host}\` is not a domain on this account.`)
  return zone
}

/**
 * Take the domain off this site.
 *
 * MAIL FIRST, THEN THE WEB. The mail records sit under the same zone and are
 * removed by name; doing it after the web release would mean doing it to a
 * domain this business no longer holds, which is a window in which a concurrent
 * attach by somebody else could have its records deleted by our cleanup.
 *
 * THE ZONE STAYS IN THE ACCOUNT AND STAYS IN THE POOL. Release takes the host
 * off the site and nothing more — taking the zone out of our account entirely is
 * offboarding, which is [[EPIC-5]]'s and is not this.
 *
 * IT IS NOT AN ERROR TO RELEASE NOTHING, on `revokeHostname`'s reasoning: a
 * customer who pressed the button twice, or whose first press succeeded and
 * whose browser did not hear so, gets the same answer both times.
 */
export async function releaseDomain(
  env: IdentityEnv,
  client: CloudflareClient,
  resend: ResendClient | null,
  businessId: string,
): Promise<{ released: string | null }> {
  const siteKey = await siteOf(env, businessId)
  const addresses = siteKey === null ? [] : await addressesOf(env, siteKey)
  const domain = attachedDomain(addresses)
  if (domain === null) return { released: null }

  const held = await sendingFor(env, businessId)
  if (held) {
    const zone = await zoneByApex(env, held.domain)
    if (zone) await disableSending(env, client, resend, held, zone.cfZoneId)
  }
  const stopped = await stopServingHost(env, client, domain)
  return { released: stopped === null ? null : domain }
}

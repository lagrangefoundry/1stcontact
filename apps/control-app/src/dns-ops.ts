/**
 * **The closed set of DNS changes this product will make, each with its safety
 * rule in code** ([[REQ-260]]).
 *
 * WHERE THE SAFETY ACTUALLY COMES FROM. Not from the card in the conversation —
 * a card prevents nothing that a confidently-worded wrong proposal would not get
 * past, and a customer who cannot read a DNS record cannot withhold consent from
 * one. It comes from here, and every rule below holds whether or not anybody
 * clicks anything, because the card is not on this path at all.
 *
 * A CLOSED SET AND NOT A RECORD EDITOR. There is no *"set record of type T on
 * name N to value V"* function in this module and adding one is the ticket's own
 * falsifier: a general capability is an unbounded surface with an unbounded
 * failure mode, and the changes actually wanted are small and enumerable. Each
 * one below gets its own safety rule and its own sentence, instead of one
 * generic guardrail standing in for all of them.
 *
 * THE FIVE RULES, stated once here because each is enforced in a different
 * function below:
 *
 *   1. **SPF merges, never appends.** Two `v=spf1` records on one name is a hard
 *      failure that breaks all mail from that name. Same name → merge; different
 *      names → leave both. `spf.ts` owns the transformation and is the only way
 *      an SPF value is written.
 *   2. **`_dmarc` only when absent, and only at `p=none`.** Never tighten a
 *      policy on a domain we did not start from zero: publishing one on a domain
 *      that already sends from Mailchimp or Microsoft 365 starts binning THEIR
 *      mail. The predicate is `sending.ts`'s {@link dmarcAbsent}, reused rather
 *      than restated — [[REQ-259]] said this module should.
 *   3. **MX, SPF, DMARC and DKIM are privileged** — readable freely, and never
 *      casually replaceable. A verification record cannot be written at a
 *      privileged name and a subdomain cannot be pointed at one.
 *   4. **A verification record is only ever CREATED.** Several `TXT` records
 *      legitimately share one name — an SPF policy, a Search Console token, a
 *      payment provider's — so a write that replaced what it found at the name
 *      would delete somebody's proof of ownership to add ours.
 *   5. **Every mutation records its before-set and its after-set**, which is
 *      what gives it an undo, a declared target and a suppression window. There
 *      is no path through this module that changes a zone without writing one:
 *      every operation ends at {@link commit}.
 *
 * NOTHING HERE DRAWS ANYTHING, and nothing here decides whether the caller is
 * allowed to ask. Who may change a domain is the route's question and is
 * `domains.ts`'s answer; what the assistant may propose is the grant's.
 */

import type { CloudflareClient, DnsRecord } from './cloudflare'
import type { IdentityEnv } from './identity'
import type { DnsResolver } from './resolver'
import { normaliseName } from './resolver'
import type { Zone } from './zones'
import { DMARC_POLICY, dmarcAbsent, dmarcName } from './sending'
import { isSpf, mergeSpfInclude, spfAllows, SpfConflictError } from './spf'
import {
  normaliseRecord,
  recordChange,
  toSpec,
  type DnsChange,
  type DnsOperation,
  type DnsRecordState,
  type DnsSlot,
} from './dns-changes'

/** What every operation in this module is told. */
export interface DnsOpContext {
  businessId: string
  zone: Zone
}

/**
 * The refusals, as one error with a code.
 *
 * ITS CODES ARE THE DECLARED SURFACE'S, on `settings-core.ts`'s arrangement: the
 * model reads the declaration's sentence and this carries the diagnosis only the
 * call knows. The message is customer-facing in every case, because the
 * assistant says it out loud.
 */
export class DnsRefusedError extends Error {
  readonly name = 'DnsRefusedError'
  constructor(
    readonly code:
      | 'ALREADY_SET'
      | 'PRIVILEGED_NAME'
      | 'NOT_YOUR_DOMAIN'
      | 'DMARC_EXISTS'
      | 'APEX_IS_YOUR_SITE'
      | 'IN_USE_BY_YOUR_SITE'
      | 'BAD_VALUE',
    message: string,
  ) {
    super(message)
  }
}

/**
 * The names this product will not write at on a customer's say-so.
 *
 * READ AS *"a name whose records carry somebody's mail"*. `_dmarc` is a policy
 * that can bin mail; anything under `_domainkey` is a signing key and a wrong
 * one silently fails every signature; `send.` is the return-path Resend puts a
 * subdomain's `MX` on, and a `CNAME` written over it takes the customer's own
 * sending down.
 *
 * IT IS A PREDICATE AND NOT A SETTING. A list somebody can widen is a list
 * somebody widens on the day a customer asks for something awkward.
 */
export function isPrivilegedName(rawName: string): boolean {
  const name = normaliseName(rawName)
  return (
    name === '_dmarc' ||
    name.startsWith('_dmarc.') ||
    name.includes('_domainkey') ||
    name === 'send' ||
    name.startsWith('send.')
  )
}

/** A hostname shaped like one, and inside this zone. */
function hostInZone(zone: Zone, rawHost: string): string {
  const host = normaliseName(rawHost)
  const apex = normaliseName(zone.apex)
  if (host === '') {
    throw new DnsRefusedError('BAD_VALUE', 'That is not an address I can work with.')
  }
  if (host !== apex && !host.endsWith(`.${apex}`)) {
    throw new DnsRefusedError(
      'NOT_YOUR_DOMAIN',
      `\`${host}\` is not part of \`${apex}\`, so it is not mine to change.`,
    )
  }
  if (!/^[a-z0-9_]([a-z0-9_-]*[a-z0-9_])?(\.[a-z0-9_]([a-z0-9_-]*[a-z0-9_])?)*$/.test(host)) {
    throw new DnsRefusedError('BAD_VALUE', 'That is not an address I can work with.')
  }
  return host
}

/** A hostname somewhere else — the target of a subdomain, or an SPF include. */
function externalHost(raw: string): string {
  const host = normaliseName(raw)
  if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(host)) {
    throw new DnsRefusedError('BAD_VALUE', `\`${raw}\` is not an address I can point anything at.`)
  }
  return host
}

/** Every record at one name and type, as Cloudflare currently holds them. */
function at(zone: readonly DnsRecord[], name: string, type: string): DnsRecord[] {
  return zone.filter(
    (record) =>
      normaliseName(record.name) === normaliseName(name) &&
      record.type.toUpperCase() === type.toUpperCase(),
  )
}

/**
 * Write one record and record the change.
 *
 * **THE ONLY WAY OUT OF THIS MODULE.** Every operation ends here, which is what
 * makes *"no mutation without a before-set, an after-set and a suppression
 * window"* a property of the code rather than a discipline each operation is
 * trusted with.
 *
 * THE ROW IS WRITTEN AFTER THE ZONE, on `enableSending`'s ordering rule: the row
 * is what the history and the undo read as *"this happened"*, so it is written
 * once it has.
 */
async function commit(
  env: IdentityEnv,
  client: CloudflareClient,
  ctx: DnsOpContext,
  operation: DnsOperation,
  summary: string,
  writes: { prior: DnsRecord | null; after: DnsRecordState }[],
): Promise<DnsChange> {
  const slots: DnsSlot[] = []
  for (const write of writes) {
    const before = write.prior ? normaliseRecord(write.prior) : null
    const written = write.prior
      ? await client.updateRecord(ctx.zone.cfZoneId, write.prior.id, toSpec(write.after))
      : await client.createRecord(ctx.zone.cfZoneId, toSpec(write.after))
    // NORMALISED FROM WHAT CLOUDFLARE ANSWERED, not from what was asked for.
    // What the undo compares against has to be what the zone will report back,
    // and Cloudflare is entitled to normalise quoting, dots and case on the way
    // in — so recording the request would record a target the zone never says.
    slots.push({ before, after: normaliseRecord(written) })
  }
  return recordChange(env, {
    businessId: ctx.businessId,
    zoneId: ctx.zone.id,
    operation,
    summary,
    slots,
  })
}

/**
 * **Let somebody else send email as this domain** — the SPF merge.
 *
 * THE RULE THIS OPERATION EXISTS FOR. A second `v=spf1` record at a name is not
 * a worse policy, it is a `permerror`, and every message from that name starts
 * failing everywhere. So there is exactly one write path for an SPF value in
 * this product and it goes through `spf.ts`: read whatever is at the name, fold
 * the include into it, write ONE record back.
 *
 * SAME NAME MERGES; A DIFFERENT NAME IS LEFT ALONE. `MAIL.md`'s worked example
 * states it as *"merge on the apex; never delete `send.`'s"* — a policy at
 * another name belongs to somebody else's sending and is not this operation's
 * business.
 *
 * TWO POLICIES ALREADY AT ONE NAME IS A REFUSAL AND NOT A REPAIR. Merging three
 * into one is a judgement about which of two authors was right, and this product
 * wrote neither.
 */
export async function allowSender(
  env: IdentityEnv,
  client: CloudflareClient,
  ctx: DnsOpContext,
  request: { host: string; include: string; who: string },
): Promise<DnsChange> {
  const host = hostInZone(ctx.zone, request.host)
  const include = externalHost(request.include)
  const zone = await client.listRecords(ctx.zone.cfZoneId)
  const policies = at(zone, host, 'TXT').filter((record) =>
    isSpf(normaliseRecord(record).content),
  )
  if (policies.length > 1) throw new SpfConflictError(host)
  const prior = policies[0] ?? null
  const existing = prior ? normaliseRecord(prior).content : null
  if (existing && spfAllows(existing, include)) {
    throw new DnsRefusedError(
      'ALREADY_SET',
      `${request.who} can already send email as \`${host}\`, so there is nothing to change.`,
    )
  }
  const after: DnsRecordState = {
    name: host,
    type: 'TXT',
    content: mergeSpfInclude(existing, include),
    ttl: 1,
    priority: null,
    proxied: false,
  }
  return commit(
    env,
    client,
    ctx,
    'allow_sender',
    `I'm letting ${request.who} send email as ${host}. Anyone already sending for ` +
      'you keeps working.',
    [{ prior, after }],
  )
}

/**
 * **Publish a monitoring email policy**, and only where there is none.
 *
 * THE DANGER RUNS THE OTHER WAY FROM THE OBVIOUS ONE. The risk is not that our
 * mail fails, it is that a policy published on a domain that already sends from
 * Mailchimp, Microsoft 365 or a booking system starts binning THEIR mail. So:
 * only when absent, only at `p=none`, never an edit to one that exists, and
 * `p=none` is not configurable — a value that can be set is a value somebody
 * sets to `p=reject` on a domain whose other senders are not aligned yet.
 *
 * ABSENT MEANS ABSENT IN THE WORLD AS WELL AS IN THE ZONE, which is why the
 * resolver is here: a domain mid-migration can have a live policy that our zone
 * does not carry yet, and writing over the top of THAT is the same harm with an
 * extra step.
 */
export async function publishDmarcMonitoring(
  env: IdentityEnv,
  client: CloudflareClient,
  resolver: DnsResolver,
  ctx: DnsOpContext,
): Promise<DnsChange> {
  const domain = normaliseName(ctx.zone.apex)
  const zone = await client.listRecords(ctx.zone.cfZoneId)
  let absent = false
  try {
    absent = await dmarcAbsent(resolver, domain, zone)
  } catch {
    // COULD NOT LOOK IS NOT NOTHING IS PUBLISHED — `enableSending`'s fail-closed
    // direction exactly. Refusing costs the customer a report nobody reads yet;
    // writing anyway can bin somebody's mail.
    absent = false
  }
  if (!absent) {
    throw new DnsRefusedError(
      'DMARC_EXISTS',
      `\`${domain}\` already has an email policy, and it is not mine to tighten. ` +
        'Whoever set it up is the one to change it.',
    )
  }
  const after: DnsRecordState = {
    name: dmarcName(domain),
    type: 'TXT',
    content: DMARC_POLICY,
    ttl: 1,
    priority: null,
    proxied: false,
  }
  return commit(
    env,
    client,
    ctx,
    'publish_dmarc_monitoring',
    `I'm turning on email reporting for ${domain}. It only asks other providers to ` +
      'tell us what they see; nothing you send is affected.',
    [{ prior: null, after }],
  )
}

/**
 * **Prove to somebody else that this domain is yours** — a verification record.
 *
 * IT ONLY EVER CREATES. Several `TXT` records legitimately share one name — an
 * email policy, a Search Console token, a payment provider's proof — so a write
 * that replaced what it found would delete one company's proof of ownership in
 * order to add another's. There is no branch in this function that updates an
 * existing record.
 *
 * AND IT REFUSES AN EMAIL POLICY, whatever name it was asked to put it at. A
 * value beginning `v=spf1` is an SPF record wearing a verification record's
 * clothes, and writing one here would be the append this product exists not to
 * do — {@link allowSender} is the operation for that, and it merges.
 */
export async function addVerification(
  env: IdentityEnv,
  client: CloudflareClient,
  ctx: DnsOpContext,
  request: { host: string; value: string; who: string },
): Promise<DnsChange> {
  const host = hostInZone(ctx.zone, request.host)
  const value = String(request.value ?? '').trim()
  if (value === '') throw new DnsRefusedError('BAD_VALUE', 'There is nothing there to add.')
  if (isPrivilegedName(host)) {
    throw new DnsRefusedError(
      'PRIVILEGED_NAME',
      `\`${host}\` is part of how your email works, so I will not put a verification ` +
        'code there.',
    )
  }
  if (isSpf(value)) {
    throw new DnsRefusedError(
      'BAD_VALUE',
      'That is an email sending policy rather than a verification code, and those ' +
        'have to be merged with what is already there rather than added beside it.',
    )
  }
  const zone = await client.listRecords(ctx.zone.cfZoneId)
  const present = at(zone, host, 'TXT').some(
    (record) => normaliseRecord(record).content === value,
  )
  if (present) {
    throw new DnsRefusedError(
      'ALREADY_SET',
      `That verification code is already on \`${host}\`, so there is nothing to do.`,
    )
  }
  const after: DnsRecordState = {
    name: host,
    type: 'TXT',
    content: value,
    ttl: 1,
    priority: null,
    proxied: false,
  }
  return commit(
    env,
    client,
    ctx,
    'add_verification',
    `I'm adding the code ${request.who} gave you to ${host}, so they can see the ` +
      'domain is yours. Nothing else changes.',
    [{ prior: null, after }],
  )
}

/**
 * **Point part of the domain at something the customer already runs.**
 *
 * NEVER THE APEX. The apex is where this product serves their website, and a
 * `CNAME` there would take it down — which is not a DNS decision, it is a
 * decision to stop having a website, and it belongs to the domain section's
 * release control where it is made deliberately.
 *
 * NEVER A NAME THIS PRODUCT SERVES. A host we answer for is proxied through
 * Cloudflare, and that flag is how this function recognises one without having
 * to re-derive which names a site is reachable at.
 *
 * AND NEVER A PRIVILEGED NAME — a `CNAME` at `send.` takes the customer's own
 * sending down and the symptom arrives days later as bounced mail.
 */
export async function pointSubdomain(
  env: IdentityEnv,
  client: CloudflareClient,
  ctx: DnsOpContext,
  request: { host: string; target: string; who: string },
): Promise<DnsChange> {
  const host = hostInZone(ctx.zone, request.host)
  const target = externalHost(request.target)
  if (host === normaliseName(ctx.zone.apex)) {
    throw new DnsRefusedError(
      'APEX_IS_YOUR_SITE',
      `\`${host}\` is where your own website is, so I will not point it somewhere ` +
        'else. Ask me to stop using the domain for your site if that is what you want.',
    )
  }
  if (isPrivilegedName(host)) {
    throw new DnsRefusedError(
      'PRIVILEGED_NAME',
      `\`${host}\` is part of how your email works, so I will not point it anywhere.`,
    )
  }
  const zone = await client.listRecords(ctx.zone.cfZoneId)
  const here = [...at(zone, host, 'A'), ...at(zone, host, 'AAAA'), ...at(zone, host, 'CNAME')]
  if (here.some((record) => record.proxied === true)) {
    throw new DnsRefusedError(
      'IN_USE_BY_YOUR_SITE',
      `\`${host}\` already reaches your website, so I will not point it somewhere else.`,
    )
  }
  if (here.length > 1) {
    throw new DnsRefusedError(
      'IN_USE_BY_YOUR_SITE',
      `\`${host}\` already points at more than one place, so changing it safely is ` +
        'not something to do without looking.',
    )
  }
  const prior = here[0] ?? null
  if (prior && normaliseRecord(prior).content === target && prior.type === 'CNAME') {
    throw new DnsRefusedError(
      'ALREADY_SET',
      `\`${host}\` already goes to ${target}, so there is nothing to change.`,
    )
  }
  const after: DnsRecordState = {
    name: host,
    type: 'CNAME',
    content: target,
    ttl: 1,
    priority: null,
    // UNPROXIED, AND FOR `sending.ts`'S REASON TURNED AROUND: proxying somebody
    // else's service through our account would put this product in the path of
    // traffic it has no business being in, and would answer with our address for
    // a name the customer expects to reach theirs.
    proxied: false,
  }
  return commit(
    env,
    client,
    ctx,
    'point_subdomain',
    `I'm sending ${host} to ${request.who}. The rest of your domain is unaffected.`,
    [{ prior, after }],
  )
}

/**
 * **Put back a signing key that got lost** — the preservation-miss repair.
 *
 * WHAT THIS IS FOR. Taking over a live domain means carrying its existing
 * records forward, and DKIM is the one class that cannot be enumerated: there is
 * no query meaning *"list the selectors"*, so the probe asks for the names it
 * knows ([[REQ-257]]'s `DKIM_SELECTORS`) and a selector nobody listed is simply
 * missed. The symptom arrives weeks later as *"our email goes to spam"*, and
 * this is the operation that fixes it once the customer has found the value in
 * their provider's dashboard.
 *
 * ONLY WHERE THERE IS NONE. A selector that already answers is one that is
 * working, and overwriting a live signing key with a value somebody retyped is
 * the failure this operation exists to repair, caused by the repair.
 */
export async function restoreSigningKey(
  env: IdentityEnv,
  client: CloudflareClient,
  resolver: DnsResolver,
  ctx: DnsOpContext,
  request: { selector: string; value: string; who: string },
): Promise<DnsChange> {
  const selector = normaliseName(request.selector)
  if (!/^[a-z0-9]([a-z0-9._-]*[a-z0-9])?$/.test(selector)) {
    throw new DnsRefusedError('BAD_VALUE', 'That is not a signing key name I can work with.')
  }
  const value = String(request.value ?? '').trim()
  if (!/^v=DKIM1\b/i.test(value)) {
    throw new DnsRefusedError(
      'BAD_VALUE',
      'That does not look like a signing key. Copy the whole value your email ' +
        'provider shows, starting `v=DKIM1`.',
    )
  }
  const domain = normaliseName(ctx.zone.apex)
  const host = `${selector}._domainkey.${domain}`
  const zone = await client.listRecords(ctx.zone.cfZoneId)
  if (at(zone, host, 'TXT').length > 0) {
    throw new DnsRefusedError(
      'ALREADY_SET',
      `There is already a signing key called \`${selector}\` on ${domain}, and ` +
        'replacing a working one is how signing breaks.',
    )
  }
  // AND IN THE WORLD, for {@link publishDmarcMonitoring}'s reason: a domain
  // mid-migration can be publishing a key our zone does not carry, and a
  // resolver that could not be reached is a no rather than a yes.
  try {
    const published = await resolver.resolve(host, 'TXT')
    if (published.length > 0) {
      throw new DnsRefusedError(
        'ALREADY_SET',
        `\`${selector}\` is already signing mail for ${domain}, so there is nothing ` +
          'to put back.',
      )
    }
  } catch (error) {
    if (error instanceof DnsRefusedError) throw error
    // Could not look. The zone says there is none and that is the reading this
    // operation was given; proceeding writes a key at a name nothing else uses.
  }
  const after: DnsRecordState = {
    name: host,
    type: 'TXT',
    content: value,
    ttl: 1,
    priority: null,
    proxied: false,
  }
  return commit(
    env,
    client,
    ctx,
    'restore_signing_key',
    `I'm putting back the signing your ${request.who} email needs, so it stops ` +
      'being treated as suspicious. Nothing you send changes.',
    [{ prior: null, after }],
  )
}

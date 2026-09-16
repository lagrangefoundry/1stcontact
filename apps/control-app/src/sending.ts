/**
 * **Sending as the customer's own domain** — the record set, the third wait, and
 * the one record that can do harm ([[REQ-259]]).
 *
 * WHAT THE TOGGLE ACTUALLY DOES. It applies `MAIL.md`'s record set to the
 * customer's domain instead of to ours: an SPF `TXT` and a return-path `MX` on
 * `send.<domain>`, a DKIM key at `resend._domainkey.<domain>`, and — only
 * sometimes, see below — a `_dmarc` policy. Then it asks Resend to verify, and
 * waits.
 *
 * THE BLAST RADIUS IS SMALLER THAN IT LOOKS, AND THAT IS WHY THIS SHIPS WITH THE
 * WEB RECORDS RATHER THAN AS A LATER, MORE CAREFUL EPIC. **Resend puts its
 * return-path on `send.`**, a subdomain nothing else occupies, so enabling
 * sending need not touch the customer's apex SPF or their `MX` at all — the two
 * records that carry their existing mail. The DKIM selector is `resend`, which
 * nobody else uses. Three records under names nothing else occupies.
 *
 * `_dmarc` IS THE ONE DANGEROUS RECORD, and it is dangerous in a direction the
 * apex-SPF worry misses: publishing a policy on a domain that already sends from
 * Mailchimp, Microsoft 365 or a booking system can start binning **their** mail,
 * not ours. So the rule, and it has no exceptions here:
 *
 *   - **written only when absent** — read from the world through [[REQ-257]]'s
 *     resolver AND from the zone, because a record that exists in either is a
 *     record somebody is relying on;
 *   - **written only at `p=none`** — a monitoring policy, which changes what
 *     receivers REPORT and never what they DELIVER;
 *   - **never tightened**, and there is no code path here that edits an existing
 *     `_dmarc` at all;
 *   - **removed on release only when we wrote it**, which is what
 *     `sending_domains.dmarc_ours` is for. Deleting a policy the customer's other
 *     provider depends on is the same silent, delayed, lands-on-their-business
 *     harm as publishing one.
 *
 * [[REQ-260]] OWNS THE GENERAL FORM OF THAT CONSTRAINT and this is its first
 * caller. What is here is the constraint applied to one record set; what is
 * there will be the assistant's arbitrary mutations under the same rule, and the
 * predicate below ({@link dmarcAbsent}) is the piece it should reuse rather than
 * restate.
 *
 * A THIRD WAIT, AND IT NEEDS ITS OWN STATE OR IT READS AS BROKEN. The route and
 * the certificate are [[REQ-258]]'s two; Resend's verification is minutes after
 * the records are written and is unrelated to either. A surface that folded it
 * into "attaching…" would tell a customer their domain was not ready when their
 * website was already serving on it.
 *
 * NOTHING HERE DRAWS ANYTHING. Every sentence a customer reads about their mail
 * is in `builder/domain.js`, and every word of it is about mail rather than about
 * records — *"If a customer is being shown a record type, we have failed."*
 */

import type { CloudflareClient, DnsRecord, DnsRecordSpec } from './cloudflare'
import { businessRecord } from './business'
import type { IdentityEnv } from './identity'
import { applyRecords, removeRecords, revertRecords, matchesRecord } from './records'
import type { AppliedRecord } from './records'
import type { DnsResolver } from './resolver'
import type { ResendClient, SendingRecord } from './resend'
import { newId } from '../../../tools/generate/src/store/ids'
import type { Zone } from './zones'

/**
 * The policy we publish, and the only one.
 *
 * `p=none` IS MONITORING AND NOT ENFORCEMENT. It asks receivers to report what
 * failed and tells them to do nothing about it, which is the strongest statement
 * that cannot break a domain we did not start from zero. There is no
 * configuration for this and no path that writes anything else: a value that
 * could be changed is a value somebody will change to `p=reject` on a domain
 * whose other senders are not yet aligned.
 *
 * NO `rua=`. Report collection would have to name an address of ours, and DMARC
 * requires the receiving domain to publish an authorisation record per reporting
 * domain — one record on OUR zone per customer, for a report nobody currently
 * reads. Adding it later is one record and no migration.
 */
export const DMARC_POLICY = 'v=DMARC1; p=none'

/** Where the `_dmarc` policy for a domain lives. */
export function dmarcName(domain: string): string {
  return `_dmarc.${domain.toLowerCase()}`
}

/**
 * The local part every message from a customer's domain comes from.
 *
 * `no-reply` FOR THE REASON `MAIL_FROM` USES IT: nothing in this product can
 * receive a reply on a customer's domain yet, and an address that looks
 * replyable and is not is worse than one that says so. When replies land
 * ([[REQ-197]]'s per-template address is where that argument already lives) this
 * is the one place to change.
 */
export const SENDING_LOCAL_PART = 'no-reply'

/** Where the third wait has got to. Mirrors `sending_domains.status`. */
export type SendingStatus = 'pending' | 'verified' | 'failed'

/** One business's sending configuration, as this module reports it. */
export interface Sending {
  id: string
  businessId: string
  zoneId: string
  /** The whole domain, lower-cased. */
  domain: string
  /** Resend's id for the registration, or null before one exists. */
  providerId: string | null
  status: SendingStatus
  /** Whether the `_dmarc` record at this domain is one we wrote. */
  dmarcOurs: boolean
}

interface SendingRow {
  id: string
  business_id: string
  zone_id: string
  domain: string
  provider_id: string | null
  status: string
  dmarc_ours: number
}

const COLUMNS = 'id, business_id, zone_id, domain, provider_id, status, dmarc_ours'

function toSending(row: SendingRow): Sending {
  return {
    id: row.id,
    businessId: row.business_id,
    zoneId: row.zone_id,
    domain: row.domain,
    providerId: row.provider_id,
    status: row.status === 'verified' ? 'verified' : row.status === 'failed' ? 'failed' : 'pending',
    dmarcOurs: row.dmarc_ours === 1,
  }
}

/** What this business sends as, or `null` where sending is off. */
export async function sendingFor(env: IdentityEnv, businessId: string): Promise<Sending | null> {
  const row = await env.DB.prepare(
    `SELECT ${COLUMNS} FROM sending_domains WHERE business_id = ? ORDER BY created_at LIMIT 1`,
  )
    .bind(businessId)
    .first<SendingRow>()
  return row ? toSending(row) : null
}

/** The configuration for one domain, whoever's it is. */
export async function sendingForDomain(
  env: IdentityEnv,
  domain: string,
): Promise<Sending | null> {
  const row = await env.DB.prepare(`SELECT ${COLUMNS} FROM sending_domains WHERE domain = ?`)
    .bind(domain.trim().toLowerCase())
    .first<SendingRow>()
  return row ? toSending(row) : null
}

/**
 * The `From` header this business's mail goes out with, or `null`.
 *
 * `null` UNTIL IT IS `verified`, AND THAT IS THE WHOLE GUARD. Mail sent from a
 * domain whose DKIM key is not yet published is mail that is unsigned, which is
 * mail that is binned — and binned mail is indistinguishable from mail that was
 * never sent. So the toggle changes nothing about what recipients see until
 * Resend says the records are live, and the fallback until then is the address
 * this product has always sent from.
 *
 * IT CARRIES THE BUSINESS'S NAME AS THE DISPLAY NAME, in RFC 5322 form, for
 * `MAIL.md` §2's reason: an anonymous `From` is most of what makes a message
 * from a domain with no reputation look like phishing to a filter. A business
 * with no readable name falls back to the address alone rather than to the empty
 * quotes a naive template would produce.
 */
export async function sendingFrom(env: IdentityEnv, businessId: string): Promise<string | null> {
  const sending = await sendingFor(env, businessId)
  if (!sending || sending.status !== 'verified') return null
  const address = `${SENDING_LOCAL_PART}@${sending.domain}`
  const business = await businessRecord(env, businessId)
  const name = (business?.name ?? '').trim()
  // A NAME WITH A COMMA OR A QUOTE IN IT IS QUOTED, because `Cole's Bakery, Ltd
  // <no-reply@…>` is two addresses to a parser and the message is refused.
  if (name === '') return address
  const display = /[",;:<>@\\[\]]/.test(name) ? `"${name.replace(/(["\\])/g, '\\$1')}"` : name
  return `${display} <${address}>`
}

/**
 * Is there no `_dmarc` policy on this domain today?
 *
 * BOTH READINGS, AND EITHER ONE IS A NO. The world is asked through
 * [[REQ-257]]'s resolver — which follows the domain's current delegation and so
 * reports what receivers actually get — and the zone is asked through the
 * records we already listed, because a record written into a zone whose
 * nameservers have just landed may not have propagated yet. A domain that is
 * clean by one reading and not the other is a domain somebody is relying on.
 *
 * AND A RESOLVER THAT COULD NOT BE REACHED IS A NO. `snapshot` throwing means
 * *we could not look*, which is not the same as *there is nothing there* — and
 * the two lead to opposite decisions about somebody's mail. The caller catches
 * it and this answers false, which is the fail-closed direction: no policy is
 * published and nothing is broken.
 */
export async function dmarcAbsent(
  resolver: DnsResolver,
  domain: string,
  zone: readonly DnsRecord[],
): Promise<boolean> {
  const name = dmarcName(domain)
  if (zone.some((record) => matchesRecord(record, name, 'TXT'))) return false
  const published = await resolver.resolve(name, 'TXT')
  return !published.some((record) => /^v=DMARC1\b/i.test(record.data.trim()))
}

/** Resend's records as Cloudflare specs — unproxied, because mail is not HTTP. */
function toSpecs(records: readonly SendingRecord[]): DnsRecordSpec[] {
  return records.map((record) => ({
    type: record.type,
    name: record.name,
    content: record.value,
    // UNPROXIED, AND IT IS NOT A PREFERENCE. Cloudflare's proxy answers HTTP; a
    // `TXT` or `MX` behind it would either be refused outright or answer with
    // the proxy's own address, and the symptom would be a domain that verifies
    // nothing while every record looks present in the dashboard.
    proxied: false,
    ...(record.priority === undefined ? {} : { priority: record.priority }),
  }))
}

/** Turning sending on needs a live registration, and there is no credential. */
export class SendingNotConfiguredError extends Error {
  readonly name = 'SendingNotConfiguredError'
}

/**
 * Turn sending on for a domain. Records, then verify, then the row.
 *
 * THE ORDER IS [[REQ-258]]'S, FOR ITS REASON. The row is what every other part
 * of this product reads as *"this business sends as its own domain"* — it is
 * what {@link sendingFrom} answers from — so it is written only once the records
 * that make that true are in the zone. A failure part-way puts the zone back the
 * way it was found and writes nothing.
 *
 * IT IS REPEATABLE. Resend's registration is looked up rather than duplicated
 * (`resend.ts`), an already-correct record is not rewritten (`records.ts`), and
 * an existing row for this domain is updated rather than inserted beside — so a
 * customer who toggles twice, or whose first attempt failed after the records
 * landed, ends in the same state as one whose first attempt worked.
 */
export async function enableSending(
  env: IdentityEnv,
  client: CloudflareClient,
  resend: ResendClient,
  resolver: DnsResolver,
  request: { businessId: string; zone: Zone },
): Promise<Sending> {
  const domain = request.zone.apex.toLowerCase()
  const held = await sendingForDomain(env, domain)
  if (held && held.businessId !== request.businessId) {
    throw new SendingNotConfiguredError(
      `\`${domain}\` is already set up to send for another business.`,
    )
  }

  const registered = await resend.createDomain(domain)
  const zoneRecords = await client.listRecords(request.zone.cfZoneId)

  // `_dmarc` IS DECIDED BEFORE ANYTHING IS WRITTEN, on `serveHostOnSite`'s rule
  // that every guard runs first: a decision taken half way through would be
  // taken against a zone this operation had already changed.
  let dmarcOurs = false
  try {
    dmarcOurs = await dmarcAbsent(resolver, domain, zoneRecords)
  } catch {
    // COULD NOT LOOK IS NOT NOTHING IS PUBLISHED. Sending works without a
    // `_dmarc` of ours — SPF and DKIM are what get mail accepted — so the
    // fail-closed answer costs the customer nothing and cannot break anybody.
    dmarcOurs = false
  }

  const specs = toSpecs(registered.records)
  if (dmarcOurs) {
    specs.push({ type: 'TXT', name: dmarcName(domain), content: DMARC_POLICY, proxied: false })
  }

  let applied: AppliedRecord[] = []
  try {
    const wrote = await applyRecords(client, request.zone.cfZoneId, specs, zoneRecords)
    applied = wrote.applied
    // ASKED TO LOOK NOW RATHER THAN ON ITS OWN SCHEDULE. Resend re-checks
    // periodically anyway; asking turns a wait of unknown length into one that
    // usually ends in a minute or two, which is the difference between a state
    // that reads as progress and one that reads as broken.
    await resend.verifyDomain(registered.id)
  } catch (error) {
    await revertRecords(client, request.zone.cfZoneId, applied)
    throw error
  }

  const now = new Date().toISOString()
  const status: SendingStatus = registered.status === 'verified' ? 'verified' : 'pending'
  if (held) {
    await env.DB.prepare(
      'UPDATE sending_domains SET zone_id = ?, provider_id = ?, status = ?, dmarc_ours = ?, updated_at = ? WHERE id = ?',
    )
      .bind(request.zone.id, registered.id, status, dmarcOurs || held.dmarcOurs ? 1 : 0, now, held.id)
      .run()
    return { ...held, zoneId: request.zone.id, providerId: registered.id, status, dmarcOurs: dmarcOurs || held.dmarcOurs }
  }
  const id = newId('snd')
  await env.DB.prepare(
    'INSERT INTO sending_domains (id, business_id, zone_id, domain, provider_id, status, dmarc_ours, created_at, updated_at) ' +
      'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
  )
    .bind(id, request.businessId, request.zone.id, domain, registered.id, status, dmarcOurs ? 1 : 0, now, now)
    .run()
  return {
    id,
    businessId: request.businessId,
    zoneId: request.zone.id,
    domain,
    providerId: registered.id,
    status,
    dmarcOurs,
  }
}

/**
 * Ask Resend where the verification got to, and record the answer.
 *
 * ONLY WHILE IT IS `pending`. A verified domain does not un-verify on its own,
 * and a surface that asked a third party on every draw would show a spinner
 * every time somebody opened Settings — and would show nothing at all on a
 * deployment whose key had been rotated.
 *
 * A REGISTRATION THAT HAS GONE IS `failed` AND NOT AN ERROR. Somebody deleted it
 * at Resend; the records are still in the zone and mean nothing, and the honest
 * thing to tell the customer is that it did not work rather than that the
 * request failed.
 */
export async function refreshSending(
  env: IdentityEnv,
  resend: ResendClient,
  sending: Sending,
): Promise<Sending> {
  if (sending.status !== 'pending' || sending.providerId === null) return sending
  const seen = await resend.readDomain(sending.providerId)
  const status: SendingStatus =
    seen === null ? 'failed' : seen.status === 'verified' ? 'verified' : seen.status === 'failed' ? 'failed' : 'pending'
  if (status === sending.status) return sending
  await env.DB.prepare('UPDATE sending_domains SET status = ?, updated_at = ? WHERE id = ?')
    .bind(status, new Date().toISOString(), sending.id)
    .run()
  return { ...sending, status }
}

/**
 * Turn sending off. The records we wrote come down, and only those.
 *
 * WHAT COMES DOWN IS ENUMERATED FROM WHAT WENT UP, never from a pattern. The two
 * names on `send.` and the `resend` DKIM selector are ours by construction —
 * nothing else puts a record there — and `_dmarc` comes down **only when
 * `dmarcOurs`**, which is the whole reason that column exists.
 *
 * THE REGISTRATION GOES TOO. A domain left registered at Resend is a domain
 * another business cannot register, and the customer who released it has no
 * surface that could ever clear it.
 *
 * IT IS IDEMPOTENT, on `revokeHostname`'s reasoning: turning off something
 * already off is not an error, and release runs this whether or not sending was
 * ever on.
 */
export async function disableSending(
  env: IdentityEnv,
  client: CloudflareClient,
  resend: ResendClient | null,
  sending: Sending,
  cfZoneId: string,
): Promise<void> {
  const wanted = [
    { name: `send.${sending.domain}`, type: 'TXT' },
    { name: `send.${sending.domain}`, type: 'MX' },
    { name: `resend._domainkey.${sending.domain}`, type: 'TXT' },
    ...(sending.dmarcOurs ? [{ name: dmarcName(sending.domain), type: 'TXT' }] : []),
  ]
  await removeRecords(client, cfZoneId, wanted)
  if (resend && sending.providerId !== null) await resend.deleteDomain(sending.providerId)
  await env.DB.prepare('DELETE FROM sending_domains WHERE id = ?').bind(sending.id).run()
}

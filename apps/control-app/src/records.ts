/**
 * **Writing a set of DNS records into a zone, and putting it back** — the one
 * definition of the four-line dance every caller that touches somebody's DNS
 * would otherwise write again ([[REQ-259]], extracted from [[REQ-258]]).
 *
 * WHY IT IS ITS OWN MODULE. `serving.ts` wrote the apex and `www` this way and
 * held the logic privately, which was right while there was one caller. The
 * sending toggle is the second — three records at names Resend chose — and the
 * assistant's mutations ([[REQ-260]]) will be the third. Three copies of *read
 * the zone once, create what is missing, replace what is wrong, leave what is
 * already right, and undo in reverse* is three places the "leave what is already
 * right" branch can go missing, and the symptom of losing it is a zone churned
 * on every re-attach.
 *
 * ALREADY EXACTLY RIGHT IS NOT A WRITE, and that is the branch worth naming.
 * Re-attaching a domain, or attaching one whose records somebody set by hand,
 * must not rewrite them — and a no-op is also what makes every operation here
 * repeatable after a partial failure.
 *
 * THE RESTORE IS READ FROM THE ZONE AND NOT COMPOSED. What is put back is the
 * record as it was FOUND, so a rollback leaves the zone the way it was rather
 * than deleting a record this operation did not create. `updateRecord` is a
 * `PUT` and replaces wholesale, which is what makes the prior reading a complete
 * description of what to undo.
 *
 * NOTHING HERE DECIDES WHAT TO WRITE. Which records a purpose needs is that
 * purpose's judgement — `serving.ts` decides the proxied `A`/`AAAA` pair,
 * `sending.ts` decides the mail set and the `_dmarc` rule — and a module that
 * knew both would be the place a future caller adds a third.
 */

import type { CloudflareClient, DnsRecord, DnsRecordSpec } from './cloudflare'

/** What a rollback has to undo for one record. */
export interface AppliedRecord {
  record: DnsRecord
  /** The record that was there before, or `null` when this one was created. */
  restore: DnsRecordSpec | null
}

/** What one {@link applyRecords} did, in full. */
export interface RecordOutcome {
  applied: AppliedRecord[]
  /**
   * Records that already existed at one of these names and were overwritten.
   *
   * REPORTED RATHER THAN REFUSED, AND REPORTED RATHER THAN SWALLOWED. Pointing a
   * domain at us IS replacing whatever was there, so refusing would refuse the
   * operation — but nothing may be replaced silently, because the customer whose
   * record it was is the one who finds out.
   */
  replaced: DnsRecord[]
}

/** Compare a record to a name and type, the way Cloudflare reports them. */
export function matchesRecord(record: DnsRecord, name: string, type: string): boolean {
  return record.name.toLowerCase() === name.toLowerCase() && record.type.toUpperCase() === type.toUpperCase()
}

/** Whether what is already there is exactly what was wanted. */
function settled(prior: DnsRecord, spec: DnsRecordSpec): boolean {
  return (
    prior.content === spec.content &&
    (prior.proxied ?? false) === (spec.proxied ?? false) &&
    (prior.priority ?? null) === (spec.priority ?? null)
  )
}

/**
 * Write a set of records, reading the zone once.
 *
 * THE ZONE IS READ ONCE AND EVERY DECISION IS MADE AGAINST THAT READING, so four
 * records cost one listing rather than four. `existing` is a parameter for the
 * caller that has already listed — the sending path reads the zone to answer a
 * question about `_dmarc` before it decides what to write, and listing twice
 * would be two readings that can disagree.
 */
export async function applyRecords(
  client: CloudflareClient,
  cfZoneId: string,
  specs: readonly DnsRecordSpec[],
  existing?: readonly DnsRecord[],
): Promise<RecordOutcome> {
  const zone = existing ?? (await client.listRecords(cfZoneId))
  const applied: AppliedRecord[] = []
  const replaced: DnsRecord[] = []
  for (const spec of specs) {
    const prior = zone.find((record) => matchesRecord(record, spec.name, spec.type))
    if (prior) {
      if (settled(prior, spec)) {
        applied.push({ record: prior, restore: null })
        continue
      }
      replaced.push(prior)
      applied.push({
        record: await client.updateRecord(cfZoneId, prior.id, spec),
        restore: {
          type: prior.type,
          name: prior.name,
          content: prior.content,
          ttl: prior.ttl,
          priority: prior.priority,
          proxied: prior.proxied,
        },
      })
      continue
    }
    applied.push({ record: await client.createRecord(cfZoneId, spec), restore: null })
  }
  return { applied, replaced }
}

/**
 * Put the zone back the way it was found.
 *
 * IN REVERSE, AND EVERY FAILURE SWALLOWED. A rollback runs because something has
 * already gone wrong; the error the caller needs to see is that one, and a
 * second failure here must not replace it with a less informative one.
 */
export async function revertRecords(
  client: CloudflareClient,
  cfZoneId: string,
  applied: readonly AppliedRecord[],
): Promise<void> {
  for (const entry of [...applied].reverse()) {
    try {
      if (entry.restore) await client.updateRecord(cfZoneId, entry.record.id, entry.restore)
      else await client.deleteRecord(cfZoneId, entry.record.id)
    } catch {
      /* the original error is the one worth reporting */
    }
  }
}

/**
 * Delete the records this product wrote at these names, and nothing else.
 *
 * SCOPED BY NAME **AND** TYPE, never by name alone. A customer's `_dmarc` and
 * ours sit at the same name as a `TXT`; their `MX` and Resend's return-path `MX`
 * do not, because Resend's is on a subdomain nothing else occupies. What makes
 * this safe is that the caller passes exactly the pairs it put there.
 */
export async function removeRecords(
  client: CloudflareClient,
  cfZoneId: string,
  wanted: readonly { name: string; type: string }[],
  existing?: readonly DnsRecord[],
): Promise<DnsRecord[]> {
  if (wanted.length === 0) return []
  const zone = existing ?? (await client.listRecords(cfZoneId))
  const removed: DnsRecord[] = []
  for (const record of zone) {
    if (!wanted.some((want) => matchesRecord(record, want.name, want.type))) continue
    await client.deleteRecord(cfZoneId, record.id)
    removed.push(record)
  }
  return removed
}

/**
 * **What we changed, what it takes to put it back, and the check that decides
 * whether putting it back is still safe** ([[REQ-260]]).
 *
 * THE UNDO IS A COMPARE-AND-SWAP, ON DNS. Every operation records the records as
 * it FOUND them and the records as it LEFT them, and undo refuses unless the
 * zone still says what the operation left. That is the whole of its safety, and
 * it replaces the idea of a time horizon rather than supplementing it: elapsed
 * time is a proxy for the real question in both directions — a record nothing
 * has touched for a year reverts perfectly safely, and one something else
 * changed ten minutes ago does not. *"Undo needs to preserve the new and the old
 * state, and check that the new state is what it is expecting before reverting
 * to the old."*
 *
 * THE SCENARIO IT EXISTS FOR is a customer returning to a year-old conversation,
 * pressing a button they do not remember, with four intervening changes they
 * never saw. Without the check that silently reverts their DNS to a state that
 * was correct a year ago. **The check turns that from data loss into a
 * sentence.**
 *
 * ALL-OR-NOTHING, AND THAT IS NOT TIDINESS. An operation touches a SET, so the
 * whole set is compared before anything is written and one drifted member
 * refuses the lot. A partial revert is worse than none: half-reverting an SPF
 * merge yields a policy that was correct at no point in time.
 *
 * THE COMPARISON IS SEMANTIC, OR THE FEATURE FAILS THE OTHER WAY. Cloudflare
 * normalises `TXT` quoting, trailing dots on `MX` and `CNAME` targets, and case.
 * A byte-exact compare reports drift where nothing changed, undo then refuses
 * always, and it is USELESS RATHER THAN DANGEROUS — which is the failure mode
 * nobody notices until the day they need it. So {@link normaliseRecord} is what
 * a record IS, and {@link sameRecord} is the only equality anything here uses.
 *
 * AND NEVER CLOUDFLARE'S RECORD IDS. A record deleted and recreated with an
 * identical value takes a new id and has not drifted; a record whose value was
 * rewritten in place keeps its id and has. An id-based compare gets both
 * backwards.
 *
 * DRIFT DOES NOT ONLY COME FROM US. The zone is in our account so the customer
 * cannot touch it, but three other sources can: a later operation of our own, an
 * operator working by hand in the dashboard — which [[REQ-257]]'s drift check
 * already assumes will happen — and **DKIM key rotation by Resend, which changes
 * `resend._domainkey` with nobody here doing anything at all.** That last one
 * makes the check earn its keep without any mistake having been made.
 *
 * AN UNDO IS ITSELF A CHANGE. It writes its own row, opens its own suppression
 * window, and appears in the same history — otherwise the history lies about
 * what the zone has been, and an undo cannot be undone.
 */

import type { CloudflareClient, DnsRecord, DnsRecordSpec } from './cloudflare'
import type { IdentityEnv } from './identity'
import { normaliseName, unquoteTxt } from './resolver'
import { newId } from '../../../tools/generate/src/store/ids'

/**
 * A record as this module compares it — the fields that decide what a record
 * MEANS, each normalised the way a resolver would read it.
 *
 * NO `id`, DELIBERATELY. See the module header.
 */
export interface DnsRecordState {
  /** Lower-cased, no trailing dot. */
  name: string
  /** Upper-cased. */
  type: string
  /** Unquoted for `TXT`; lower-cased and de-dotted for a hostname target. */
  content: string
  /** Seconds, or 1 for Cloudflare's "automatic". */
  ttl: number
  /** `MX` and `SRV` only; null everywhere else. */
  priority: number | null
  proxied: boolean
}

/**
 * One record's before and after.
 *
 * POSITIONAL RATHER THAN KEYED, and either half may be null: a `null` before is
 * a record this operation CREATED, and a `null` after is one it removed. The
 * pair is what makes undo able to delete as well as restore, and what makes an
 * undo's own entry expressible in the same shape — which is what lets an undo be
 * undone.
 */
export interface DnsSlot {
  before: DnsRecordState | null
  after: DnsRecordState | null
}

/** Which of the closed set a change was. `undo` is the entry an undo writes. */
export type DnsOperation =
  | 'allow_sender'
  | 'publish_dmarc_monitoring'
  | 'add_verification'
  | 'point_subdomain'
  | 'restore_signing_key'
  | 'undo'

/** One recorded change. */
export interface DnsChange {
  id: string
  businessId: string
  zoneId: string
  operation: DnsOperation
  /** What the customer was told, in their nouns. Never a record type. */
  summary: string
  slots: DnsSlot[]
  /** When the world may be expected to agree — the propagation window's end. */
  suppressedUntil: string
  /** The change this one undid, or null. */
  undoes: string | null
  /** When this change was undone, or null. */
  undoneAt: string | null
  createdAt: string
}

/**
 * How long after a change the world is allowed to disagree with it.
 *
 * TWENTY MINUTES, AND IT IS A CEILING RATHER THAN A PREDICTION. Cloudflare
 * serves a new record immediately and everything written here is written at
 * Cloudflare's automatic TTL, so the real delay is usually seconds — but a
 * recursive resolver between the customer and us is entitled to serve the
 * PREVIOUS answer until its own cache expires, and an alarm raised inside that
 * window is an alarm about somebody else's cache.
 *
 * ONE CONSTANT AND NOT PER-OPERATION. A window per operation would be five
 * numbers to justify separately and to keep in step with a monitor that is not
 * written yet ([[EPIC-7]]); one is a value that epic can narrow when it has
 * measurements, which is the only honest way to arrive at five.
 */
export const DNS_SUPPRESSION_MS = 20 * 60 * 1000

/** Cloudflare's "automatic" TTL, which is what every record here is written at. */
const TTL_AUTOMATIC = 1

/** The types whose content is a hostname, and therefore case- and dot-insensitive. */
const HOST_VALUED = new Set(['CNAME', 'MX', 'NS', 'PTR'])

/**
 * A record, as it will be compared.
 *
 * THIS IS THE FUNCTION THE UNDO'S USEFULNESS RESTS ON. Every normalisation here
 * is a difference Cloudflare, a resolver or an operator's typing can introduce
 * without the record meaning anything different.
 */
export function normaliseRecord(record: DnsRecord | DnsRecordSpec): DnsRecordState {
  const type = String(record.type ?? '').toUpperCase()
  const raw = String(record.content ?? '')
  const content =
    type === 'TXT'
      ? unquoteTxt(raw).trim()
      : HOST_VALUED.has(type)
        ? normaliseName(raw)
        : raw.trim()
  return {
    name: normaliseName(record.name),
    type,
    content,
    ttl: typeof record.ttl === 'number' ? record.ttl : TTL_AUTOMATIC,
    priority: typeof record.priority === 'number' ? record.priority : null,
    proxied: record.proxied === true,
  }
}

/** Whether two records say the same thing. The only equality this module uses. */
export function sameRecord(a: DnsRecordState, b: DnsRecordState): boolean {
  return (
    a.name === b.name &&
    a.type === b.type &&
    a.content === b.content &&
    a.ttl === b.ttl &&
    a.priority === b.priority &&
    a.proxied === b.proxied
  )
}

/** A state as Cloudflare takes it back. */
export function toSpec(state: DnsRecordState): DnsRecordSpec {
  return {
    type: state.type,
    name: state.name,
    content: state.content,
    ttl: state.ttl,
    proxied: state.proxied,
    ...(state.priority === null ? {} : { priority: state.priority }),
  }
}

/**
 * Which record a slot is ABOUT.
 *
 * `after ?? before`, and the fallback is what makes an undo undoable: an entry
 * whose after is null is one where a record was removed, and the record it was
 * is the only thing that says which name and value the check should be looking
 * for the absence of.
 */
export function slotIdentity(slot: DnsSlot): DnsRecordState {
  const identity = slot.after ?? slot.before
  if (!identity) throw new Error('a slot with neither a before nor an after describes nothing')
  return identity
}

interface ChangeRow {
  id: string
  business_id: string
  zone_id: string
  operation: string
  summary: string
  before_set: string
  after_set: string
  suppressed_until: string
  undoes: string | null
  undone_at: string | null
  created_at: string
}

const COLUMNS =
  'id, business_id, zone_id, operation, summary, before_set, after_set, suppressed_until, undoes, undone_at, created_at'

function parseSet(raw: string): (DnsRecordState | null)[] {
  try {
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? (parsed as (DnsRecordState | null)[]) : []
  } catch {
    return []
  }
}

function toChange(row: ChangeRow): DnsChange {
  const before = parseSet(row.before_set)
  const after = parseSet(row.after_set)
  const length = Math.max(before.length, after.length)
  const slots: DnsSlot[] = []
  for (let i = 0; i < length; i += 1) {
    slots.push({ before: before[i] ?? null, after: after[i] ?? null })
  }
  return {
    id: row.id,
    businessId: row.business_id,
    zoneId: row.zone_id,
    operation: row.operation as DnsOperation,
    summary: row.summary,
    slots,
    suppressedUntil: row.suppressed_until,
    undoes: row.undoes,
    undoneAt: row.undone_at,
    createdAt: row.created_at,
  }
}

/** What {@link recordChange} is told. */
export interface ChangeSpec {
  businessId: string
  zoneId: string
  operation: DnsOperation
  summary: string
  slots: DnsSlot[]
  /** The change this one undoes, where it is an undo. */
  undoes?: string | null
}

/**
 * Write the change down.
 *
 * AFTER THE ZONE HAS BEEN WRITTEN, NEVER BEFORE IT, on `enableSending`'s
 * ordering rule: the row is what the history and the undo both read as *"this
 * happened"*, so it is written only once it has.
 *
 * THE SENTENCE IS STORED RATHER THAN COMPOSED LATER. What the customer was shown
 * is what the history owes them; a sentence rebuilt from a record diff months
 * afterwards is a sentence nobody ever wrote.
 */
export async function recordChange(env: IdentityEnv, spec: ChangeSpec): Promise<DnsChange> {
  const now = new Date()
  const id = newId('dnc')
  const createdAt = now.toISOString()
  const suppressedUntil = new Date(now.getTime() + DNS_SUPPRESSION_MS).toISOString()
  await env.DB.prepare(
    'INSERT INTO dns_changes (id, business_id, zone_id, operation, summary, before_set, after_set, ' +
      'suppressed_until, undoes, undone_at, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, ?)',
  )
    .bind(
      id,
      spec.businessId,
      spec.zoneId,
      spec.operation,
      spec.summary,
      JSON.stringify(spec.slots.map((slot) => slot.before)),
      JSON.stringify(spec.slots.map((slot) => slot.after)),
      suppressedUntil,
      spec.undoes ?? null,
      createdAt,
    )
    .run()
  return {
    id,
    businessId: spec.businessId,
    zoneId: spec.zoneId,
    operation: spec.operation,
    summary: spec.summary,
    slots: spec.slots,
    suppressedUntil,
    undoes: spec.undoes ?? null,
    undoneAt: null,
    createdAt,
  }
}

/** One business's changes, newest first. The history, and what the card reads. */
export async function changesFor(
  env: IdentityEnv,
  businessId: string,
  limit = 20,
): Promise<DnsChange[]> {
  const { results } = await env.DB.prepare(
    `SELECT ${COLUMNS} FROM dns_changes WHERE business_id = ? ORDER BY created_at DESC, id DESC LIMIT ?`,
  )
    .bind(businessId, limit)
    .all<ChangeRow>()
  return (results ?? []).map(toChange)
}

/** One change, whoever's it is. The caller checks whose. */
export async function changeById(env: IdentityEnv, id: string): Promise<DnsChange | null> {
  const row = await env.DB.prepare(`SELECT ${COLUMNS} FROM dns_changes WHERE id = ?`)
    .bind(id)
    .first<ChangeRow>()
  return row ? toChange(row) : null
}

/**
 * What this product currently believes a zone's records should say, and until
 * when the world is allowed to disagree — **[[EPIC-7]]'s handoff, specified here
 * and consumed there**.
 *
 * NEWEST WINS, PER RECORD. A name written twice has one current target and it is
 * the later one; the earlier row stays in the history because the history is
 * about what happened, not about what is true now.
 *
 * A CHANGE THAT HAS BEEN UNDONE DECLARES NOTHING. Its target was withdrawn by
 * the undo, and the undo's own row declares the restored state — which is what
 * makes *"an undo is itself a change"* mean something to a monitor rather than
 * only to a reader.
 */
export interface DeclaredTarget {
  /** What should be there, or null where the declared state is its absence. */
  record: DnsRecordState | null
  /** The record this target is about, present either way. */
  identity: DnsRecordState
  /** Until when a disagreement is propagation rather than a fault. */
  suppressedUntil: string
}

export async function declaredTargets(
  env: IdentityEnv,
  zoneId: string,
): Promise<DeclaredTarget[]> {
  const { results } = await env.DB.prepare(
    `SELECT ${COLUMNS} FROM dns_changes WHERE zone_id = ? AND undone_at IS NULL ORDER BY created_at, id`,
  )
    .bind(zoneId)
    .all<ChangeRow>()
  const latest = new Map<string, DeclaredTarget>()
  for (const row of results ?? []) {
    const change = toChange(row)
    for (const slot of change.slots) {
      const identity = slot.after ?? slot.before
      if (!identity) continue
      latest.set(`${identity.name} ${identity.type} ${identity.content}`, {
        record: slot.after,
        identity,
        suppressedUntil: change.suppressedUntil,
      })
    }
  }
  return [...latest.values()]
}

/** There is no such change, or it is not this business's. */
export class UnknownDnsChangeError extends Error {
  readonly name = 'UnknownDnsChangeError'
  constructor() {
    super('That change is not one of yours, so there is nothing here to undo.')
  }
}

/** It has already been undone. Undoing it again would replay a restore. */
export class DnsAlreadyUndoneError extends Error {
  readonly name = 'DnsAlreadyUndoneError'
  constructor() {
    super('That change has already been undone.')
  }
}

/**
 * The zone no longer says what the change left, so putting it back would undo
 * somebody else's work as well.
 *
 * **THE REFUSAL IS A SENTENCE, NOT A DEAD END.** It says what is different in
 * the customer's own nouns, names no record type, and ends somewhere they can
 * go — same standard as every other customer-facing string here.
 */
export class DnsDriftError extends Error {
  readonly name = 'DnsDriftError'
  constructor(readonly what: string[]) {
    super(
      "I can't undo this — your settings have changed since then, so putting it " +
        `back would undo the newer change as well. What has moved: ${what.join('; ')}. ` +
        'Ask us and we will sort it out with you.',
    )
  }
}

/**
 * What a drifted record is called in front of a customer.
 *
 * NEVER A RECORD TYPE. A `TXT` carrying a policy, an `MX` and a signing key are
 * all *"your email settings"* to the person reading; the distinction between
 * them is ours, and telling them about it helps nobody.
 */
export function whatChanged(state: DnsRecordState): string {
  const name = state.name
  const mail =
    state.type === 'MX' || name.startsWith('_dmarc.') || name.includes('_domainkey.')
  if (mail) {
    const domain = name.replace(/^_dmarc\./, '').replace(/^.*_domainkey\./, '')
    return `your email settings for ${domain}`
  }
  if (state.type === 'TXT') return `a setting on ${name}`
  return `where ${name} points`
}

/**
 * Put a change back, or refuse with a sentence.
 *
 * THE CHECK RUNS OVER THE WHOLE SET BEFORE ANYTHING IS WRITTEN — see the module
 * header on why a partial revert is worse than none.
 *
 * AND THE UNDO IS RECORDED AS A CHANGE OF ITS OWN, with the restored records as
 * its declared target and its own suppression window.
 */
export async function undoChange(
  env: IdentityEnv,
  client: CloudflareClient,
  cfZoneId: string,
  change: DnsChange,
): Promise<DnsChange> {
  // THE ZONE IS READ FIRST, AND EVERY REFUSAL BELOW IS DECIDED AGAINST THAT ONE
  // READING — including *"this has already been put back"*. A guard that answered
  // before the read would be a second source of truth about the same question,
  // and the whole design of this function is that there is exactly one: what the
  // zone currently says, compared once.
  const live = await client.listRecords(cfZoneId)
  if (change.undoneAt !== null) throw new DnsAlreadyUndoneError()

  const normalised = live.map((record) => ({ record, state: normaliseRecord(record) }))

  // EVERY SLOT IS RESOLVED FIRST. Nothing below writes until every one of them
  // has been found to be exactly where this change left it.
  const plan: { slot: DnsSlot; found: DnsRecord | null }[] = []
  const drifted: string[] = []
  for (const slot of change.slots) {
    const identity = slotIdentity(slot)
    const matches = normalised.filter((entry) => sameRecord(entry.state, identity))
    if (slot.after === null) {
      // The change REMOVED this record; if something has put one back, the zone
      // no longer says what this change left.
      if (matches.length !== 0) drifted.push(whatChanged(identity))
      else plan.push({ slot, found: null })
      continue
    }
    if (matches.length !== 1) {
      drifted.push(whatChanged(identity))
      continue
    }
    plan.push({ slot, found: matches[0].record })
  }
  if (drifted.length > 0) throw new DnsDriftError([...new Set(drifted)])

  // Applied in order, and put back in reverse if one of them fails — the shape
  // `records.ts` uses, for its reason: a rollback runs because something has
  // already gone wrong, and the error the caller needs is that one.
  const done: { id: string; restore: DnsRecordSpec | null }[] = []
  try {
    for (const step of plan) {
      if (step.slot.after === null) {
        if (!step.slot.before) continue
        const created = await client.createRecord(cfZoneId, toSpec(step.slot.before))
        done.push({ id: created.id, restore: null })
        continue
      }
      if (!step.found) continue
      if (step.slot.before === null) {
        await client.deleteRecord(cfZoneId, step.found.id)
        continue
      }
      const restored = await client.updateRecord(cfZoneId, step.found.id, toSpec(step.slot.before))
      done.push({ id: restored.id, restore: toSpec(step.slot.after) })
    }
  } catch (error) {
    for (const entry of [...done].reverse()) {
      try {
        if (entry.restore) await client.updateRecord(cfZoneId, entry.id, entry.restore)
        else await client.deleteRecord(cfZoneId, entry.id)
      } catch {
        /* the original error is the one worth reporting */
      }
    }
    throw error
  }

  const undone = await recordChange(env, {
    businessId: change.businessId,
    zoneId: change.zoneId,
    operation: 'undo',
    summary: `Undone: ${change.summary}`,
    // MIRRORED, NOT RE-DERIVED. What this operation found is what the change
    // left, and what it leaves is what the change found — so one shape describes
    // both and an undo can itself be undone.
    slots: change.slots.map((slot) => ({ before: slot.after, after: slot.before })),
    undoes: change.id,
  })
  await env.DB.prepare('UPDATE dns_changes SET undone_at = ? WHERE id = ?')
    .bind(undone.createdAt, change.id)
    .run()
  return undone
}

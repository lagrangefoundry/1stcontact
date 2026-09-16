/**
 * The zones this deployment manages DNS for — the one place `zones` is read and
 * written ([[REQ-257]], [[EPIC-5]]).
 *
 * WHAT THIS TABLE HOLDS THAT CLOUDFLARE CANNOT. Cloudflare holds every zone in
 * the account and will list them on request; what it has no field for is WHOSE
 * each one is. In its model every zone in the account is equally ours — that is
 * the whole point of the arrangement — so the association is a fact we record,
 * and {@link ZoneOrigin} records the only reliable source for it: how the zone
 * got here.
 *
 * `origin` IS WRITTEN ONCE AND IS NEVER DERIVED. There is no path in this module
 * that reads something back from Cloudflare and concludes whose a zone is. What
 * IS read back from Cloudflare is `status`, `cf_zone_id` and the assigned
 * nameservers, and that is the opposite move: those are facts Cloudflare owns and
 * we mirror, and inventing our own would be inventing a second thing that can be
 * wrong.
 *
 * TWO GUARDS, BOTH DEFAULT-CLOSED AND BOTH HERE RATHER THAN IN A CONVENTION:
 *
 *   1. **{@link PLATFORM_APEXES} are permanently unattributable.** `1stc.site`
 *      and `1stcontact.io` live in the same Cloudflare account and appear in any
 *      naive zone listing. `1stc.site` in particular carries EVERY customer's
 *      platform hostname, so attributing it to one account would hand that
 *      account the whole namespace — every other customer's address, to redirect
 *      or to take down. This is a refusal in code, not a list an operator is
 *      trusted to maintain.
 *   2. **A zone with no `account_id` is selectable by nobody.**
 *      {@link zonesForAccount} is the only selection query and it always names
 *      an account, so an unattributed row is returned to no customer. Which also
 *      buys {@link driftCheck}: a zone somebody added by hand in the dashboard
 *      has no row here at all, and the diff is what asks a human whose it is.
 *
 * THE BACKFILL IS NOT A FLOW ([[REQ-257]]). The operator's own domains are
 * already in the platform account and already active, so the trap case — delete
 * from their Cloudflare account, re-add to ours, take a new nameserver pair, go
 * dark in between — does not apply to them at all. {@link attributeZone} is a
 * human decision, recorded: an operator names the account, and everything else
 * is read from the zone that is already there.
 */

import { newId } from '../../../tools/generate/src/store/ids'
import type { IdentityEnv } from './identity'
import { normaliseHost, PLATFORM_APEX } from './hostname'
import { PUBLIC_SITE_ORIGIN } from './public-url'
import type { CloudflareClient, CloudflareZone } from './cloudflare'

/**
 * How a zone came to be in this account.
 *
 * A CLOSED ENUM THE CODE DECLARES, like `sites.kind` and `site_domains.kind`:
 * SQLite would enforce a CHECK and then a fifth origin would be a migration
 * rather than a constant.
 *
 * ONLY ONE OF THEM IS BUILT BY [[REQ-257]] — `operator`. `registered` is
 * [[EPIC-6]]'s, written when a purchase completes and the account that paid is
 * already known; `nameserver` is the claim flow's, written from the logged-in
 * account that started it. Both are declared now so neither lands as a
 * migration, and so that every question this module asks is asked over the
 * origin rather than over whichever one happened to exist first.
 */
export type ZoneOrigin = 'registered' | 'nameserver' | 'operator' | 'platform'

/**
 * Where a zone is in Cloudflare's state machine, mirrored.
 *
 * `released` AND `revoked` ARE DECLARED AND NOT WRITTEN HERE, exactly as
 * `AddressKind`'s `custom` is declared and not implemented in `hostname.ts`. A
 * `pending` claim that never sees a nameserver change is `released` after a
 * bounded window (the claim flow); a zone an owner takes back is the release
 * control ([[REQ-259]]). What this ticket owes them is a column that admits the
 * value and a reader that asks over the status rather than over a boolean.
 */
export type ZoneStatus = 'pending' | 'active' | 'released' | 'revoked'

/** One zone, as this module reports it. */
export interface Zone {
  /** Our key, `zon_…`, and never Cloudflare's id. */
  id: string
  /** Whose it is, or `null` for unattributed — which means selectable by nobody. */
  accountId: string | null
  apex: string
  /** Cloudflare's id, which every API call against the zone is addressed by. */
  cfZoneId: string
  /** The nameserver pair we showed them. */
  assignedNs: string[]
  origin: ZoneOrigin
  status: ZoneStatus
  claimedAt: string
  /** When Cloudflare first reported it active, or `null` while it has not. */
  activatedAt: string | null
}

/**
 * The apexes that are this product's own and can never be a customer's.
 *
 * DERIVED FROM THE TWO CONSTANTS THAT ALREADY EXIST rather than restated. A
 * third literal spelling of `1stcontact.io` would be a third place for it to be
 * wrong, and the one that would be wrong is this one — the other two are read on
 * every request and this list is read by an operator occasionally.
 */
export const PLATFORM_APEXES: ReadonlySet<string> = new Set([
  PLATFORM_APEX,
  new URL(PUBLIC_SITE_ORIGIN).hostname,
])

/**
 * An apex without its trailing dot, lower-cased, and without a scheme.
 *
 * `normaliseHost` IS THE DEFINITION NOW ([[REQ-258]]) AND THIS IS ITS NAME HERE.
 * The two were written separately and were the same rule — tidy what somebody
 * pasted into the string a `Host:` header would actually carry — and the moment
 * a hostname had to be matched against an apex to find its zone, two spellings
 * of that rule became two answers to *"is this host inside that zone"*. What is
 * kept is the NAME, because an apex and a host are different things to a reader
 * even when the tidying is identical.
 *
 * A PASTED ADDRESS IS A LIKELY INPUT AND IS NOT A REFUSAL WORTH MAKING. An
 * operator typing the backfill has almost certainly just been looking at the
 * site, and `https://alicesplumbing.com/` means the domain they mean.
 */
export function normaliseApex(raw: string): string {
  return normaliseHost(raw)
}

/** Is this one of ours? */
export function isPlatformApex(apex: string): boolean {
  return PLATFORM_APEXES.has(normaliseApex(apex))
}

/**
 * Refused because the apex is this product's own.
 *
 * ITS OWN ERROR, on `ReservedHostnameError`'s reasoning: *"that is not a
 * domain"* and *"that one is ours"* want different words, and only the second is
 * a refusal an operator needs explaining.
 */
export class PlatformZoneError extends Error {
  readonly name = 'PlatformZoneError'
}

/** Refused because this apex already has a row. */
export class ZoneApexTakenError extends Error {
  readonly name = 'ZoneApexTakenError'
  constructor(
    readonly apex: string,
    message: string,
  ) {
    super(message)
  }
}

/** There is no such zone in the Cloudflare account. */
export class UnknownZoneError extends Error {
  readonly name = 'UnknownZoneError'
}

/** The row, as SQLite hands it back. */
interface ZoneRow {
  id: string
  account_id: string | null
  apex: string
  cf_zone_id: string
  assigned_ns: string
  origin: string
  status: string
  claimed_at: string
  activated_at: string | null
}

function toZone(row: ZoneRow): Zone {
  let assignedNs: string[] = []
  try {
    const parsed: unknown = JSON.parse(row.assigned_ns)
    if (Array.isArray(parsed)) assignedNs = parsed.map((ns) => String(ns))
  } catch {
    // A ROW THAT CANNOT BE PARSED IS REPORTED AS HAVING NO PAIR rather than
    // raising. The pair is what we showed a customer, not what anything
    // resolves by, so an unreadable one degrades a support answer; raising here
    // would take the whole drift report down with it.
    assignedNs = []
  }
  return {
    id: row.id,
    accountId: row.account_id,
    apex: row.apex,
    cfZoneId: row.cf_zone_id,
    assignedNs,
    origin: row.origin as ZoneOrigin,
    status: row.status as ZoneStatus,
    claimedAt: row.claimed_at,
    activatedAt: row.activated_at,
  }
}

const COLUMNS =
  'id, account_id, apex, cf_zone_id, assigned_ns, origin, status, claimed_at, activated_at'

/**
 * Cloudflare's status, as one of ours.
 *
 * THE ONE PLACE THE TWO VOCABULARIES MEET. Cloudflare says `pending`,
 * `initializing`, `active`, `moved`, `deleted`, and adds to that list without
 * asking us. Everything that is not `active` is `pending` here, which is the
 * honest reading: the question this column answers is *"is this zone serving"*,
 * and Cloudflare is the only party in a position to say yes.
 *
 * IT NEVER RETURNS `released` OR `revoked`, and that is deliberate rather than
 * an omission. Those two are OUR decisions about a zone — a claim that expired,
 * an owner who took it back — and a mirror of Cloudflare's state has no business
 * inventing either.
 */
export function mirrorStatus(cloudflareStatus: string): ZoneStatus {
  return cloudflareStatus.trim().toLowerCase() === 'active' ? 'active' : 'pending'
}

/** What a new row says. */
export interface ZoneSpec {
  apex: string
  cfZoneId: string
  assignedNs?: readonly string[]
  origin: ZoneOrigin
  status: ZoneStatus
  /** Whose it is. `null` for a `platform` zone, and required for every other. */
  accountId: string | null
  activatedAt?: string | null
}

/**
 * Write a zone's row. The one insert in this module.
 *
 * THE TWO GUARDS ARE HERE AND NOT AT THE CALL SITES, which is what makes them
 * guards. A refusal that every caller has to remember to perform is a convention;
 * a refusal the write itself performs is a rule, and the difference shows up the
 * first time a fourth on-ramp is added by somebody who has not read this file.
 *
 * AND THE UNIQUE INDEX DECIDES THE RACE, on `claimHostname`'s reasoning exactly:
 * a `SELECT` followed by an `INSERT` is the same race with two round trips, so
 * the insert is attempted and a constraint failure is re-read to find out what it
 * meant.
 */
export async function recordZone(env: IdentityEnv, spec: ZoneSpec): Promise<Zone> {
  const apex = normaliseApex(spec.apex)
  if (apex === '') throw new PlatformZoneError('A zone needs an apex.')

  // GUARD 1 — THE PLATFORM APEXES, FROM BOTH DIRECTIONS. A platform apex may
  // only ever be recorded as `platform`, and a `platform` zone may never name an
  // account. Either half alone is bypassable: the first without the second lets
  // `1stc.site` in as `origin = 'operator'` with an account on it, and the second
  // without the first lets it in as an ordinary customer zone.
  if (isPlatformApex(apex) && spec.origin !== 'platform') {
    throw new PlatformZoneError(
      `\`${apex}\` is this product's own domain and cannot belong to an account. ` +
        'It carries every customer\'s address, so attributing it to one account ' +
        'would hand that account the whole namespace.',
    )
  }
  if (spec.origin === 'platform' && spec.accountId !== null) {
    throw new PlatformZoneError(
      'A platform zone belongs to nobody, so it cannot be recorded against an account.',
    )
  }

  const zone: Zone = {
    id: newId('zon'),
    accountId: spec.accountId,
    apex,
    cfZoneId: spec.cfZoneId,
    assignedNs: [...(spec.assignedNs ?? [])],
    origin: spec.origin,
    status: spec.status,
    claimedAt: new Date().toISOString(),
    activatedAt: spec.activatedAt ?? null,
  }

  try {
    await env.DB.prepare(
      `INSERT INTO zones (${COLUMNS}) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
      .bind(
        zone.id,
        zone.accountId,
        zone.apex,
        zone.cfZoneId,
        JSON.stringify(zone.assignedNs),
        zone.origin,
        zone.status,
        zone.claimedAt,
        zone.activatedAt,
      )
      .run()
  } catch (error) {
    // WHICH INDEX FIRED IS ANSWERED BY RE-READING, not by parsing SQLite's
    // message — the message is a string from a dependency and the answer is one
    // query away. `hostname.ts` settles it the same way.
    const existing = await zoneByApex(env, apex)
    if (existing) {
      throw new ZoneApexTakenError(
        apex,
        `\`${apex}\` is already recorded — Cloudflare allows one zone per apex, ` +
          'so a second row would be a state the account it mirrors cannot be in.',
      )
    }
    throw error
  }
  return zone
}

/** One zone by apex, whoever it belongs to and whatever its status. */
export async function zoneByApex(env: IdentityEnv, rawApex: string): Promise<Zone | null> {
  const row = await env.DB.prepare(`SELECT ${COLUMNS} FROM zones WHERE apex = ?`)
    .bind(normaliseApex(rawApex))
    .first<ZoneRow>()
  return row ? toZone(row) : null
}

/**
 * The zone a HOST belongs to, or `null` when this deployment holds none
 * ([[REQ-258]]).
 *
 * BY WALKING THE SUFFIXES AGAINST THIS TABLE, NOT BY GUESSING THE APEX.
 * Stripping one label off `shop.alicesplumbing.com` gives the right answer and
 * stripping one off `alice.co.uk` gives `co.uk`, which is not a domain anybody
 * can own — the boundary is the Public Suffix List, which is a downloaded file
 * that goes stale and is a dependency this product does not have. The zones we
 * hold are recorded in this table, so asking it *"is this a zone, is its parent
 * a zone, is its grandparent"* is exact for exactly the domains the question is
 * ever asked about, and it needs no list at all.
 *
 * LONGEST MATCH FIRST, because the walk starts at the whole host and shortens.
 * A deployment holding both `alicesplumbing.com` and `shop.alicesplumbing.com`
 * as separate zones — which Cloudflare permits — resolves a host under the
 * second to the second, which is the zone whose records actually serve it.
 *
 * IT STOPS ONE LABEL SHORT OF NOTHING. A single remaining label is a TLD and can
 * never be a zone in this account, so the walk does not ask.
 */
export async function zoneForHost(env: IdentityEnv, rawHost: string): Promise<Zone | null> {
  const host = normaliseApex(rawHost)
  if (host === '') return null
  const labels = host.split('.')
  for (let i = 0; i + 1 < labels.length; i += 1) {
    const zone = await zoneByApex(env, labels.slice(i).join('.'))
    if (zone) return zone
  }
  return null
}

/** Every zone recorded, for the operator's report. Never a customer's read. */
export async function allZones(env: IdentityEnv): Promise<Zone[]> {
  const { results } = await env.DB.prepare(`SELECT ${COLUMNS} FROM zones ORDER BY apex`).all<ZoneRow>()
  return (results ?? []).map(toZone)
}

/**
 * The pool one account holds — **the only selection query in this module**.
 *
 * IT ALWAYS NAMES AN ACCOUNT, and the `IS NOT NULL` beside the equality is not
 * redundant defensiveness: it is what makes *"a zone with no `account_id` is
 * selectable by nobody"* a property of the SQL rather than of the caller. A
 * caller that passed `null` through — from an unauthenticated session, from a
 * field that was absent in a body — would otherwise be handed every
 * unattributed zone on the deployment, including a platform one.
 *
 * `status` IS AN OPTIONAL FILTER AND NOT A BAKED-IN `active`. [[REQ-259]]'s
 * selector wants the active ones; an operator looking at one account's pool
 * wants all of them, `pending` claims included, because a claim that has not
 * completed is the thing they are most likely to be asking about.
 */
export async function zonesForAccount(
  env: IdentityEnv,
  accountId: string | null,
  opts: { status?: ZoneStatus } = {},
): Promise<Zone[]> {
  if (accountId === null || accountId.trim() === '') return []
  const status = opts.status
  const sql =
    status === undefined
      ? `SELECT ${COLUMNS} FROM zones WHERE account_id = ? AND account_id IS NOT NULL ORDER BY apex`
      : `SELECT ${COLUMNS} FROM zones WHERE account_id = ? AND account_id IS NOT NULL AND status = ? ORDER BY apex`
  const statement = env.DB.prepare(sql)
  const bound = status === undefined ? statement.bind(accountId) : statement.bind(accountId, status)
  const { results } = await bound.all<ZoneRow>()
  return (results ?? []).map(toZone)
}

/**
 * Attach a zone that is already in the Cloudflare account to an account — the
 * **operator backfill** ([[REQ-257]]).
 *
 * THE ACCOUNT COMES FROM THE OPERATOR AND NEVER FROM CLOUDFLARE. That sentence
 * is the ticket's first falsifier, and everything else in this function is read
 * from Cloudflare precisely because it is a fact Cloudflare owns: the zone id,
 * the assigned nameservers, and the status. The division is the whole design —
 * *whose* is ours to record, *where it is in its lifecycle* is theirs to report.
 *
 * IT LOOKS THE ZONE UP BY APEX AND REFUSES WHAT IS NOT THERE. A backfill against
 * an apex the account does not hold would write a row naming a Cloudflare zone
 * id that resolves to nothing, and the failure would surface later as a record
 * write against a zone that does not exist.
 *
 * NO DELETION, NO RE-ADD, NO DOWNTIME. This is what makes the backfill not a
 * flow: these zones are already active, so there is no nameserver change to ask
 * anybody for and no window in which the site is dark.
 */
export async function attributeZone(
  env: IdentityEnv,
  client: CloudflareClient,
  spec: { apex: string; accountId: string },
): Promise<Zone> {
  const apex = normaliseApex(spec.apex)
  if (isPlatformApex(apex)) {
    throw new PlatformZoneError(
      `\`${apex}\` is this product's own domain and cannot belong to an account.`,
    )
  }
  if (spec.accountId.trim() === '') {
    throw new PlatformZoneError('A zone has to be attributed to an account.')
  }

  const zones = await client.listZones()
  const found = zones.find((zone) => zone.apex === apex)
  if (!found) {
    throw new UnknownZoneError(
      `\`${apex}\` is not a zone in the Cloudflare account, so there is nothing ` +
        'to attach. Add it in Cloudflare first, or use the claim flow.',
    )
  }

  const status = mirrorStatus(found.status)
  return recordZone(env, {
    apex,
    cfZoneId: found.id,
    assignedNs: found.nameServers,
    // `operator` AND NOT SOMETHING INFERRED. A human looked at a zone and said
    // whose it is; that IS the provenance, and it is the only thing that
    // distinguishes this row from one the claim flow would have written.
    origin: 'operator',
    status,
    accountId: spec.accountId,
    activatedAt: status === 'active' ? new Date().toISOString() : null,
  })
}

/**
 * Bring one row's `status` back in line with Cloudflare's.
 *
 * ONLY `status` AND `activated_at` MOVE. Not `origin`, not `account_id` — those
 * are ours and Cloudflare has no opinion about them, and a sync that touched
 * them would be the falsifier this module is built around.
 *
 * `activated_at` IS WRITTEN ONCE AND NEVER CLEARED. It records that this zone
 * has served, which stays true after a later status change; a zone that goes
 * `active` and is then revoked still has.
 */
export async function syncZoneStatus(
  env: IdentityEnv,
  client: CloudflareClient,
  rawApex: string,
): Promise<Zone | null> {
  const zone = await zoneByApex(env, rawApex)
  if (!zone) return null
  const upstream = await client.readZone(zone.cfZoneId)
  if (!upstream) return zone
  const status = mirrorStatus(upstream.status)
  const activatedAt = zone.activatedAt ?? (status === 'active' ? new Date().toISOString() : null)
  if (status === zone.status && activatedAt === zone.activatedAt) return zone
  await env.DB.prepare('UPDATE zones SET status = ?, activated_at = ? WHERE id = ?')
    .bind(status, activatedAt, zone.id)
    .run()
  return { ...zone, status, activatedAt }
}

/** A zone Cloudflare holds that this table has never heard of. */
export interface UnrecordedZone {
  apex: string
  cfZoneId: string
  /** Cloudflare's own word for where it is. */
  cloudflareStatus: string
  /**
   * Whether this is one of ours.
   *
   * THE *"EITHER A PLATFORM ZONE OR A MISTAKE"* DISTINCTION, MADE LEGIBLE. The
   * two platform apexes will be in every drift report forever, because nothing
   * records them and nothing should; flagging them is what stops an operator
   * reading past two permanent entries and missing the third.
   */
  platform: boolean
}

/** A row whose status no longer agrees with Cloudflare's. */
export interface ZoneStatusDrift {
  apex: string
  recorded: ZoneStatus
  cloudflare: string
}

/** What an operator is shown. No writes anywhere in it. */
export interface ZoneDrift {
  /** In Cloudflare, absent here. Somebody added a zone in the dashboard. */
  unrecorded: UnrecordedZone[]
  /** Here, absent from Cloudflare. A zone deleted upstream and not offboarded. */
  missing: Zone[]
  /** Both know it; they disagree about where it is. */
  statusDrift: ZoneStatusDrift[]
  /** Here, with nobody's name on it. Selectable by nobody until somebody says. */
  unattributed: Zone[]
}

/**
 * Compare Cloudflare's zones against this table.
 *
 * **NO AUTOMATIC RECONCILIATION, AND THAT IS THE POINT.** `origin` is a human
 * decision and there is no way to derive it, so a drift check that wrote rows
 * would be inventing the one fact this whole table exists to record. What it
 * produces is a question, addressed to a person.
 *
 * SOMEBODY ADDING A ZONE BY HAND IN THE DASHBOARD IS A THING THAT WILL HAPPEN.
 * The alternative to noticing is a zone nobody can offboard, because nothing
 * recorded how it arrived.
 *
 * IT REFUSES ON A MISSING TOKEN RATHER THAN REPORTING NO DRIFT. A report
 * assembled from no upstream data says everything is fine, which is the one
 * answer a drift check must never give by accident — so the caller passes a
 * client in, and `requireCloudflare` is what refuses.
 */
export async function driftCheck(env: IdentityEnv, client: CloudflareClient): Promise<ZoneDrift> {
  const [recorded, upstream] = await Promise.all([allZones(env), client.listZones()])
  const byApex = new Map<string, Zone>(recorded.map((zone) => [zone.apex, zone]))
  const upstreamByApex = new Map<string, CloudflareZone>(upstream.map((zone) => [zone.apex, zone]))

  const unrecorded: UnrecordedZone[] = upstream
    .filter((zone) => !byApex.has(zone.apex))
    .map((zone) => ({
      apex: zone.apex,
      cfZoneId: zone.id,
      cloudflareStatus: zone.status,
      platform: isPlatformApex(zone.apex),
    }))

  const missing = recorded.filter((zone) => !upstreamByApex.has(zone.apex))

  const statusDrift: ZoneStatusDrift[] = []
  for (const zone of recorded) {
    const found = upstreamByApex.get(zone.apex)
    if (!found) continue
    if (mirrorStatus(found.status) !== zone.status) {
      statusDrift.push({ apex: zone.apex, recorded: zone.status, cloudflare: found.status })
    }
  }

  // A `platform` ROW IS NOT UNATTRIBUTED, IT IS UNATTRIBUTABLE. Reporting it
  // beside the rows that genuinely need a decision would be asking the operator
  // to make one they must not be able to make.
  const unattributed = recorded.filter((zone) => zone.accountId === null && zone.origin !== 'platform')

  return { unrecorded, missing, statusDrift, unattributed }
}

/**
 * The test gutter — the mark manufactured traffic carries, and the one channel
 * that carries it on an address ([[DOC-54]], [[REQ-267]] §7).
 *
 * WHAT THE GUTTER IS FOR. The product's promise is that a business's site
 * *works*, and the only test that can prove a form works is one that fills it
 * in. That test writes to production. What stands between "we can prove it
 * works" and "we have polluted the customer's record" is a mark: on the traffic
 * in flight, on the rows it produces, on the blobs it writes — and a read layer
 * that excludes all of it by default.
 *
 * WHAT THIS MODULE OWNS AND WHAT IT DOES NOT. [[DOC-54]] R1's marker is a SIGNED
 * token on a request, and it belongs to [[EPIC-15]]'s first code child along with
 * the reaper. This module owns the one channel that child cannot cover — inbound
 * mail, where there is no request to attach a token to and the envelope is the
 * only thing available — plus the two pieces that channel cannot be verified
 * without: the run registry, and the blob prefix.
 *
 * THE ADDRESS IS A DIFFERENT CARRIER FOR THE SAME ID, not an alternative to the
 * marker ([[DOC-54]] §2.2). `newId('run')` mints it, once, and it rides whichever
 * channel the entry point has.
 */

import { newId } from '../../../tools/generate/src/store/ids'
import { normaliseEmail } from './identity'

/** What this module needs: a database, and nothing else. */
export interface RunEnv {
  DB: D1Database
}

/**
 * The reserved local-part prefix — the whole of the namespace.
 *
 * ONE STRING, AND EVERY READER OF IT IS IN THIS FILE. A second spelling anywhere
 * would be a second answer to "is this address ours", and the failure mode of
 * disagreeing is a probe's mail forwarded to a customer's inbox.
 */
export const RESERVED_PREFIX = 'bfm+'

/** The prefix a run id is minted under. `newId`'s reading aid, spelled once. */
const RUN_PREFIX = 'run'

/**
 * How long a run's window stays open by default.
 *
 * A DAY, WHICH IS GENEROUS AND IS MEANT TO BE. A probe measures its lifecycle in
 * minutes; a human-confirmed one — somebody pressing *test my forwarding* and
 * then going to look in their inbox — measures it in hours. What the window is
 * actually bounding is how long a run id that has leaked into a spam filter's
 * logs remains usable as a make-my-mail-invisible token, and a day is short
 * enough for that and long enough that no real probe is cut off mid-flight.
 */
export const RUN_WINDOW_MS = 24 * 60 * 60 * 1000

/**
 * The R2 key prefix a synthetic run's bytes are written under ([[DOC-54]] §2.5).
 *
 * IN THE KEY AND NOT IN OBJECT METADATA, because a bucket has no `WHERE` clause.
 * The reaper's blob sweep is a prefix listing; metadata would make it a listing
 * of everything followed by a `head` per object. It also makes an accidental
 * exposure greppable, and makes "is this blob a test artifact" answerable from
 * the key alone by a reader that holds nothing else.
 */
export const SYNTHETIC_BLOB_PREFIX = 'synthetic/'

/**
 * Is this address in the reserved namespace?
 *
 * SHAPE ONLY, AND DELIBERATELY NOT A VERIFICATION. An address matching the
 * reserved pattern is reserved whether or not its run id resolves, because the
 * two questions have different failure directions: *may this be forwarded to a
 * customer* must fail closed on anything that looks like ours, while *is this
 * traffic synthetic* must fail OPEN — an unverifiable marker is real mail
 * ([[DOC-54]] §2.1). Collapsing them into one predicate would pick one of those
 * directions for both.
 *
 * So the reserved namespace never forwards and never appears in any UI on THIS
 * answer, and rows are marked on {@link runIdIn}'s.
 */
export function isReservedAddress(address: string): boolean {
  return localPartOf(address).startsWith(RESERVED_PREFIX)
}

/**
 * The run id a reserved address claims, by SHAPE alone — null when it claims
 * none.
 *
 * IT VALIDATES THE FORM AND NOT THE RUN. Whether the run exists and is still
 * open is {@link runIsOpen}, a database question, and keeping the two apart is
 * what lets the never-forward half of the rule ship without a registry at all.
 *
 * THE SHAPE IS `newId`'s AND NOT A LOOSER ONE. `run_<32 lowercase hex>` is what
 * the one minter produces ([[REQ-190]]); accepting anything else here would be
 * accepting an id this system cannot have minted.
 */
export function runIdIn(address: string): string | null {
  const local = localPartOf(address)
  if (!local.startsWith(RESERVED_PREFIX)) return null
  const claimed = local.slice(RESERVED_PREFIX.length)
  return /^run_[0-9a-f]{32}$/.test(claimed) ? claimed : null
}

/** The address a probe sends to, to have its mail marked. */
export function reservedAddressFor(runId: string, domain: string): string {
  return `${RESERVED_PREFIX}${runId}@${domain}`
}

/**
 * Open a run, and say what its id is.
 *
 * THE WINDOW IS WRITTEN AT OPEN AND NEVER EXTENDED. A run that needs longer
 * opens a second one; extending would make "when does this id stop working"
 * depend on a write that could happen at any time, which is the property the
 * window exists to remove.
 */
export async function openRun(
  env: RunEnv,
  spec: { note?: string; windowMs?: number; now?: Date } = {},
): Promise<string> {
  const id = newId(RUN_PREFIX)
  const now = spec.now ?? new Date()
  const closes = new Date(now.getTime() + (spec.windowMs ?? RUN_WINDOW_MS))
  await env.DB.prepare(
    'INSERT INTO synthetic_runs (id, opened_at, closes_at, note) VALUES (?, ?, ?, ?)',
  )
    .bind(id, now.toISOString(), closes.toISOString(), spec.note ?? null)
    .run()
  return id
}

/**
 * Does this run id name a run that exists and is still open?
 *
 * UNKNOWN AND EXPIRED ARE THE SAME ANSWER, and that is the point: both mean the
 * address in front of us is not a live marker, so the message is ordinary mail.
 * Reporting them apart would be an existence oracle over the run table for
 * anyone who can send an email.
 *
 * COMPARED AS ISO STRINGS, which sort lexicographically in exactly the order
 * they sort chronologically — the comparison the rest of this schema already
 * makes against `expires_at` and `ends_at`.
 */
export async function runIsOpen(env: RunEnv, runId: string, now?: Date): Promise<boolean> {
  if (!/^run_[0-9a-f]{32}$/.test(runId)) return false
  const row = await env.DB.prepare(
    'SELECT id FROM synthetic_runs WHERE id = ? AND closes_at > ?',
  )
    .bind(runId, (now ?? new Date()).toISOString())
    .first<{ id: string }>()
  return row !== null
}

/**
 * What a piece of traffic's marker resolved to.
 *
 * TWO FIELDS AND NOT ONE, because the two halves of §7 answer differently. A
 * reserved address whose run is unknown is `reserved: true, runId: null` — it
 * must not be forwarded, and everything it writes is REAL. Collapsing that into
 * a boolean loses exactly the case the rule exists for.
 */
export interface Marker {
  /** In the reserved namespace: never forwarded, never shown. */
  reserved: boolean
  /** A live run — the rows this traffic writes are synthetic and carry it. */
  runId: string | null
}

/** The marker an inbound envelope recipient carries. */
export async function markerOf(env: RunEnv, address: string, now?: Date): Promise<Marker> {
  const normalised = normaliseEmail(address)
  if (!isReservedAddress(normalised)) return { reserved: false, runId: null }
  const claimed = runIdIn(normalised)
  if (claimed === null) return { reserved: true, runId: null }
  return { reserved: true, runId: (await runIsOpen(env, claimed, now)) ? claimed : null }
}

/** Everything before the `@`, lower-cased. Empty for anything that is not an address. */
function localPartOf(address: string): string {
  const value = normaliseEmail(address)
  const at = value.lastIndexOf('@')
  return at <= 0 ? '' : value.slice(0, at)
}

/** Everything after the `@`, lower-cased. Empty for anything that is not an address. */
export function domainOf(address: string): string {
  const value = normaliseEmail(address)
  const at = value.lastIndexOf('@')
  return at === -1 || at === value.length - 1 ? '' : value.slice(at + 1)
}

/* -------------------------------------------------------------------------- *
 * Collection — how manufactured records leave again ([[REQ-268]] §4,
 * [[DOC-54]] §2.7).
 *
 * THE REAPER THE HEADER ABOVE SAYS BELONGS TO [[EPIC-15]]'s FIRST CODE CHILD.
 * It lands here, beside the run registry, rather than in a module of its own,
 * because a collector and the thing it collects should be readable together —
 * and because `RESERVED_PREFIX` and `SYNTHETIC_BLOB_PREFIX` are the two other
 * facts somebody extending collection will need.
 *
 * TWO PASSES, AND THE SECOND MUST NOT DEPEND ON THE FIRST.
 *
 *   1. {@link collectRun} — a probe has verified what it produced and takes it
 *      back. Named, immediate, exact.
 *   2. {@link sweepSynthetic} — a scheduled collector keyed on the ROW ALONE:
 *      `synthetic = 1 AND created_at < horizon`, across every business, joined
 *      to `synthetic_runs` and to nothing else — in fact joined to NOTHING. The
 *      moment it consults the run registry, a lost run row means orphans that
 *      live for ever, which is precisely what it exists to catch. It must
 *      collect rows from a run nobody remembers, a probe since deleted, or a
 *      path that stamped `synthetic` and forgot the run id.
 *
 * A NON-EMPTY SWEEP IS A BUG REPORT, NOT HYGIENE. If pass one works, pass two
 * takes nothing, every time. Every row it takes means a run leaked — crashed
 * between writing and verifying, or never verified at all. The count is a health
 * metric for the gutter itself, which is why `index.ts` reports it rather than
 * discarding it.
 *
 * ONE DELETE REACHES EVERYTHING, because the schema already says so. Every table
 * that hangs off a contact declares `FOREIGN KEY (contact_id) REFERENCES users
 * (id) ON DELETE CASCADE` — `contact_events`, `user_acceptances`, `asset_grants`,
 * `user_emails`, `user_names` — so deleting a synthetic contact takes the whole
 * chain with it. This is the same statement the customer-facing contact delete
 * will be ([[DOC-54]] §2.7, R5), which is why they are one piece of work.
 *
 * WHAT IT DOES NOT REACH IS BLOBS AND MESSAGE TICKETS. {@link
 * SYNTHETIC_BLOB_PREFIX} exists so a bucket sweep is a prefix listing, and a
 * synthetic message is a ticket rather than a D1 row; both are collected by
 * whatever writes them, and neither is a row this cascade could have taken.
 * -------------------------------------------------------------------------- */

/**
 * How long a marked record may live before the sweep takes it.
 *
 * A FLOOR ABOVE EVERY PER-PROBE LIFETIME, GENEROUSLY SO ([[DOC-54]] §2.7). This
 * is LEAK COLLECTION AND NOT LIFECYCLE MANAGEMENT: a probe's own verification
 * removes what it made within seconds, and a sweep that outran a slower,
 * human-confirmed probe would delete the evidence that probe was still waiting
 * on. Seven days is far longer than {@link RUN_WINDOW_MS} and costs nothing,
 * because the expected harvest is zero.
 *
 * A MONTH-OLD FAILURE WILL NOT BE DEBUGGED. Failure scaffolding is retained by
 * a probe's own collection declining to run, not by this horizon; past it the
 * verdict is what has evidential value and the scaffolding does not.
 */
export const SWEEP_HORIZON_MS = 7 * 24 * 60 * 60 * 1000

/**
 * The largest harvest the sweep will perform rather than refuse.
 *
 * IT REFUSES AN IMPLAUSIBLE HARVEST RATHER THAN PERFORMING IT ([[REQ-268]] §4).
 * This is a scheduled `DELETE` holding production credentials and the expected
 * count is zero-to-a-handful; a sweep about to take five hundred contacts has a
 * broken predicate, not a backlog. Stopping and shouting is correct and is very
 * much cheaper to write than to recover from.
 *
 * AND THE REFUSAL IS A THROW, which marks the cron invocation failed. A sweep
 * that quietly declined would be indistinguishable from a sweep with nothing to
 * do — which is the state it is in every other day.
 */
export const MAX_HARVEST = 500

/** A refused sweep, and the count that refused it. */
export class ImplausibleHarvestError extends Error {
  readonly name = 'ImplausibleHarvestError'
  constructor(readonly found: number) {
    super(
      `The synthetic sweep found ${found} contacts to collect, which is more than ` +
        `${MAX_HARVEST}. Expected is zero; a harvest this size means the predicate is ` +
        'wrong rather than that there is a backlog, so nothing has been deleted.',
    )
  }
}

/** What a collection took. */
export interface Harvest {
  /** Contacts removed. Their events, acceptances and grants went with them. */
  contacts: number
  /** Accounts removed with them — parentless once the contact had gone. */
  accounts: number
}

/**
 * Remove every marked contact the predicate names, and the chain beneath each.
 *
 * ONE IMPLEMENTATION FOR BOTH PASSES, because they differ only in their `WHERE`.
 * Two would be two answers to *what does collection actually delete*, and the
 * second one is the one that would quietly stop reaching a table.
 *
 * `synthetic = 1` IS RESTATED HERE AS WELL AS IN EVERY PREDICATE THIS TAKES. It
 * is the difference between a collector and an incident, and a belt-and-braces
 * clause in a `DELETE FROM users` is not a place to economise.
 *
 * THE ACCOUNT IS THE ONE THING THE CASCADE CANNOT REACH. `addContact` mints an
 * `accounts` row alongside every contact and the foreign key points the other
 * way (`users.account_id -> accounts.id`), so a collected contact would leave its
 * account behind. It is invisible to every customer surface, which is exactly
 * why nothing would ever notice it accumulating. The ids are read BEFORE the
 * contacts go, because afterwards there is nothing left to read them from.
 */
async function collect(env: RunEnv, where: string, values: unknown[]): Promise<Harvest> {
  const { results } = await env.DB.prepare(
    `SELECT id, account_id FROM users WHERE synthetic = 1 AND ${where}`,
  )
    .bind(...values)
    .all<{ id: string; account_id: string }>()
  const rows = results ?? []
  if (rows.length === 0) return { contacts: 0, accounts: 0 }

  await env.DB.prepare(`DELETE FROM users WHERE synthetic = 1 AND ${where}`)
    .bind(...values)
    .run()

  // ONE STATEMENT PER ACCOUNT, AND THE COUNT IS SMALL BY CONSTRUCTION. A
  // bind-variable list would be one query, and its length is a cliff the model
  // knows nothing about — `formerNamesIn`'s own note — and the harvest is capped
  // at {@link MAX_HARVEST} anyway.
  //
  // `NOT EXISTS` RATHER THAN AN UNCONDITIONAL DELETE. An account is many-to-one
  // on purpose ([[REQ-194]]); taking one that still has a contact on it would
  // orphan a REAL person's row, which is the only way this function could damage
  // something it was not asked to touch.
  let accounts = 0
  for (const accountId of new Set(rows.map((r) => r.account_id))) {
    const gone = await env.DB.prepare(
      'DELETE FROM accounts WHERE id = ? ' +
        'AND NOT EXISTS (SELECT 1 FROM users u WHERE u.account_id = accounts.id)',
    )
      .bind(accountId)
      .run()
    accounts += gone.meta?.changes ?? 0
  }

  // THE COUNT IS THE ROWS THIS SELECTED AND NOT THE DELETE'S OWN `changes`. D1
  // reports rows AFFECTED, which includes every cascaded child — one contact with
  // an event, an acceptance, a grant, an address and a name reports eight. What a
  // collector's report has to say is how many CONTACTS it took, because that is
  // the number an operator compares against zero.
  return { contacts: rows.length, accounts }
}

/**
 * Take back everything one run produced ([[REQ-268]] §4).
 *
 * KEYED ON THE RUN ID AND NOT ON A LIST OF ROWS THE PROBE REMEMBERS, because it
 * cannot remember them: the public capture endpoint answers with one frozen
 * acknowledgement whatever it says ([[REQ-223]] §2), deliberately, so no
 * identifier ever crosses back. The run id is the whole reason a boolean flag
 * would not have been enough ([[DOC-54]] §2.2).
 *
 * IT REACHES EVERY BUSINESS, which is right and is not a hole in the tenant
 * barrier. The caller is not an operator holding a scope — it is the platform
 * collecting its own manufactured traffic, and a run may legitimately have
 * touched more than one business. What bounds it is `synthetic = 1`, which no
 * real row carries.
 *
 * IT DOES NOT CONSULT `synthetic_runs`, and closing a run does not collect it.
 * The registry answers *may this marker still mark*; this answers *take back
 * what it marked*, and a collector that required its subject's run to still be
 * on file would be unable to collect exactly the runs that went missing.
 *
 * AN ID THAT IS NOT ONE COLLECTS NOTHING, rather than collecting everything. A
 * malformed id matches no row anyway — but the guard is explicit, because the
 * cost of being wrong about that is every synthetic record on the deployment and
 * the cost of the guard is one line.
 */
export async function collectRun(env: RunEnv, runId: string): Promise<Harvest> {
  const id = (runId ?? '').trim()
  if (!/^run_[0-9a-f]{32}$/.test(id)) return { contacts: 0, accounts: 0 }
  return collect(env, 'run_id = ?', [id])
}

/**
 * The periodic sweep: every marked record older than the horizon, whoever made
 * it ([[REQ-268]] §4).
 *
 * `now` AND `horizonMs` ARE ARGUMENTS so the horizon is provable without a test
 * waiting seven days for one, and so the constant is a default rather than a
 * fact buried in a query.
 *
 * IT COUNTS BEFORE IT DELETES, which is what makes {@link MAX_HARVEST} a refusal
 * rather than a limit. A capped `DELETE` would perform part of an implausible
 * harvest and report a plausible number, which is the worst of both.
 */
export async function sweepSynthetic(
  env: RunEnv,
  options: { now?: number; horizonMs?: number; max?: number } = {},
): Promise<Harvest> {
  const now = options.now ?? Date.now()
  const horizon = new Date(now - (options.horizonMs ?? SWEEP_HORIZON_MS)).toISOString()
  const max = options.max ?? MAX_HARVEST

  const counted = await env.DB.prepare(
    'SELECT COUNT(*) AS n FROM users WHERE synthetic = 1 AND created_at < ?',
  )
    .bind(horizon)
    .first<{ n: number }>()
  const found = counted?.n ?? 0
  if (found === 0) return { contacts: 0, accounts: 0 }
  if (found > max) throw new ImplausibleHarvestError(found)

  return collect(env, 'created_at < ?', [horizon])
}

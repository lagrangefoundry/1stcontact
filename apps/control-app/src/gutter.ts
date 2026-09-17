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

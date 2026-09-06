/**
 * A person's name — the one place `user_names` is read and written
 * ([[REQ-193]], [[CHAT-38]]).
 *
 * ONE RESOLVER, NOT A PREDICATE AT EVERY CALL SITE. `superseded_at IS NULL` is a
 * filter somebody eventually forgets, and the row it forgets is a name the
 * person used to have — so the failure is not an empty cell, it is the tab
 * confidently showing the wrong name, or two names, depending on which row the
 * database happened to return first. Every read of a current name in this
 * repository goes through {@link CURRENT_NAME_JOIN} or {@link currentNameOf},
 * and the predicate is written here exactly twice.
 *
 * THE JOIN IS A FRAGMENT RATHER THAN A FUNCTION, and that is the one concession
 * to the reader's shape. `peopleOf` lists everybody in a business; fetching
 * their names afterwards would be an `IN (…)` list bounded by D1's bind-variable
 * limit and by nothing in the model. So the current name arrives on the same
 * query as the person, through a fragment this module owns — the predicate still
 * has exactly one spelling, and the list is still one round trip.
 *
 * THE DISPLAYED NAME IS STORED AND NEVER ASSEMBLED. Nothing here concatenates
 * parts into a name; see `builder/people-name.js`, which owns that rule and the
 * greeting's fallback chain, and which both this module and the browser panel
 * read so there is one answer rather than two.
 *
 * HISTORY IS DATA AND NOT A TRAIL. Former names are returned to the client so
 * the operator can find *Sarah Jones* and be shown *Sarah Patel* — but only the
 * ones marked {@link CHANGED}. A `corrected` supersession never leaves this
 * module, which is what makes "a deadname cannot be surfaced by a client" a
 * property of the server rather than a rule every client has to remember.
 */

import { CHANGED, NAME_PARTS, supersessionReason } from './builder/people-name.js'
import type { IdentityEnv } from './identity'
import { newId } from './identity'

/**
 * One name, as every reader sees it.
 *
 * `displayName` IS THE ONLY FIELD THAT IS ALWAYS THERE, because it is the only
 * `NOT NULL` column. Everything else is a parse of it kept for salutation and
 * sorting, and a person with one name — no given name, no family name, no
 * title — is an ordinary row here rather than a special case.
 */
export interface PersonName {
  id: string
  displayName: string
  knownAs: string | null
  title: string | null
  givenName: string | null
  middleNames: string | null
  familyName: string | null
  suffix: string | null
  createdAt: string
  updatedAt: string
}

/**
 * A change to a name: an absent key means leave that part alone.
 *
 * A PATCH AND NOT A RECORD, for the reason `PersonPatch` already is one — the
 * record pane commits one field at a time, and a whole-record write would send
 * back a stale copy of every part the operator did not touch.
 */
export interface NamePatch {
  displayName?: string | null
  knownAs?: string | null
  title?: string | null
  givenName?: string | null
  middleNames?: string | null
  familyName?: string | null
  suffix?: string | null
}

/** Refused because of what was typed — see {@link writeName}. */
export class InvalidNameError extends Error {}

/**
 * The current name, joined onto a query that already names the person as `u`.
 *
 * `superseded_at IS NULL` APPEARS HERE AND IN {@link currentNameOf} AND NOWHERE
 * ELSE. That is the whole discipline: the index makes at most one row satisfy
 * it, and this fragment is how a reader reaches that row.
 */
export const CURRENT_NAME_JOIN =
  'LEFT JOIN user_names n ON n.user_id = u.id AND n.superseded_at IS NULL'

/**
 * The columns that fragment brings back, aliased out of the way.
 *
 * PREFIXED, because `user_names` and `users` both carry `id`, `created_at` and
 * `updated_at`, and an unaliased join would silently hand the caller whichever
 * one the driver decided to keep.
 */
export const CURRENT_NAME_COLUMNS =
  'n.id AS name_id, n.display_name AS name_display_name, n.known_as AS name_known_as, ' +
  'n.title AS name_title, n.given_name AS name_given_name, ' +
  'n.middle_names AS name_middle_names, n.family_name AS name_family_name, ' +
  'n.suffix AS name_suffix, n.created_at AS name_created_at, n.updated_at AS name_updated_at'

/** The shape {@link CURRENT_NAME_COLUMNS} adds to a row. */
export interface JoinedName {
  name_id: string | null
  name_display_name: string | null
  name_known_as: string | null
  name_title: string | null
  name_given_name: string | null
  name_middle_names: string | null
  name_family_name: string | null
  name_suffix: string | null
  name_created_at: string | null
  name_updated_at: string | null
}

/** Lift the joined columns into a name, or null when the person has none. */
export function nameFromJoin(row: JoinedName): PersonName | null {
  if (!row.name_id) return null
  return {
    id: row.name_id,
    displayName: row.name_display_name ?? '',
    knownAs: row.name_known_as,
    title: row.name_title,
    givenName: row.name_given_name,
    middleNames: row.name_middle_names,
    familyName: row.name_family_name,
    suffix: row.name_suffix,
    createdAt: row.name_created_at ?? '',
    updatedAt: row.name_updated_at ?? '',
  }
}

interface NameRecord {
  id: string
  display_name: string
  known_as: string | null
  title: string | null
  given_name: string | null
  middle_names: string | null
  family_name: string | null
  suffix: string | null
  created_at: string
  updated_at: string
}

const NAME_COLUMNS =
  'id, display_name, known_as, title, given_name, middle_names, family_name, ' +
  'suffix, created_at, updated_at'

function toName(row: NameRecord): PersonName {
  return {
    id: row.id,
    displayName: row.display_name,
    knownAs: row.known_as,
    title: row.title,
    givenName: row.given_name,
    middleNames: row.middle_names,
    familyName: row.family_name,
    suffix: row.suffix,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

/** The current name of one person, for a caller with no query to join onto. */
export async function currentNameOf(
  env: IdentityEnv,
  userId: string,
): Promise<PersonName | null> {
  const row = await env.DB.prepare(
    `SELECT ${NAME_COLUMNS} FROM user_names WHERE user_id = ? AND superseded_at IS NULL`,
  )
    .bind(userId)
    .first<NameRecord>()
  return row ? toName(row) : null
}

/**
 * The former names of one person that are safe to surface.
 *
 * `changed` ONLY, AND THE FILTER IS HERE. A `corrected` row is a typo we kept
 * for audit; returning it would put `Marting` in a search index and, worse,
 * would make the client the thing deciding which former names may be shown.
 *
 * OLDEST FIRST, so "formerly Sarah Jones, Sarah Smith" reads as a sequence.
 * Empty strings are dropped: a redacted row keeps its place in the timeline and
 * has no text left to show ([[DOC-37]]).
 */
export async function formerNamesOf(env: IdentityEnv, userId: string): Promise<string[]> {
  const { results } = await env.DB.prepare(
    'SELECT display_name FROM user_names WHERE user_id = ? AND superseded_at IS NOT NULL ' +
      'AND superseded_reason = ? ORDER BY superseded_at ASC, id ASC',
  )
    .bind(userId, CHANGED)
    .all<{ display_name: string }>()
  return (results ?? []).map((r) => r.display_name).filter((n) => n.trim() !== '')
}

/**
 * The same, for every person in a business, in one query.
 *
 * SCOPED THROUGH `users` RATHER THAN BY AN `IN (…)` LIST of ids the caller
 * gathered. The list is unbounded — it is everybody in the business — and a
 * bind-variable limit is a cliff the model knows nothing about. It also keeps
 * the tenant predicate on the query that reads the rows, so this cannot return a
 * name from another business even if the caller passed the wrong ids.
 */
export async function formerNamesIn(
  env: IdentityEnv,
  businessId: string,
): Promise<Map<string, string[]>> {
  const { results } = await env.DB.prepare(
    'SELECT n.user_id AS user_id, n.display_name AS display_name FROM user_names n ' +
      'JOIN users u ON u.id = n.user_id WHERE u.tenant_id = ? AND n.superseded_at IS NOT NULL ' +
      'AND n.superseded_reason = ? ORDER BY n.superseded_at ASC, n.id ASC',
  )
    .bind(businessId, CHANGED)
    .all<{ user_id: string; display_name: string }>()
  const byUser = new Map<string, string[]>()
  for (const row of results ?? []) {
    if (row.display_name.trim() === '') continue
    const held = byUser.get(row.user_id)
    if (held) held.push(row.display_name)
    else byUser.set(row.user_id, [row.display_name])
  }
  return byUser
}

/** The parts, as this module addresses them — declared once, in the shared module. */
const PARTS = NAME_PARTS.map((part) => part.name) as Array<keyof NamePatch>

/** What this part currently says, trimmed. */
function partOf(name: PersonName | null, part: keyof NamePatch): string | null {
  return name ? trimmed(name[part]) : null
}

/** Empty, blank and absent are one state, on the way in as well as on the way out. */
function trimmed(value: string | null | undefined): string | null {
  const said = typeof value === 'string' ? value.trim() : ''
  return said === '' ? null : said
}

/**
 * Give this person a name, or replace the one they have.
 *
 * IT SUPERSEDES; IT NEVER UPDATES. A name that changed and a name that was
 * always this are different facts, and an UPDATE keeps neither — so the current
 * row is stamped `superseded_at` and a new row is inserted, in that order,
 * because the partial unique index will not hold two live rows and is the thing
 * enforcing that rather than this function.
 *
 * NO KEY MOVES. `user_names.id` is a key of a name and never of a person, so a
 * marriage changes no foreign key anywhere in the schema and nothing that
 * pointed at this person has to be rewritten.
 *
 * A PATCH OVER THE CURRENT ROW: an absent part is carried forward, an empty one
 * is cleared. That is what lets the record pane commit `knownAs` alone without
 * sending back a stale copy of the other six.
 *
 * A NO-OP WRITES NO HISTORY. Committing a field to the value it already held is
 * something a record pane does constantly — focus, blur, no edit — and each one
 * would otherwise leave a supersession behind, filling the timeline with
 * transitions that never happened and burying the one that did.
 *
 * AN EMPTY DISPLAYED NAME IS "NO NAME", NOT "A NAMELESS NAME". Clearing it when
 * nothing else is set supersedes the row and leaves the person with none, which
 * is the state the list draws as *no name yet*. Clearing it while parts remain
 * is refused, because `display_name` is the only NOT NULL column and there is
 * nothing to hang the parts off — and because the alternative, inventing one
 * out of the parts, is precisely the assembly this model exists to avoid.
 *
 * THE REASON DEFAULTS TO `corrected`, and {@link supersessionReason} is where
 * that is decided. Marking a supersession as a real name change has to be an
 * explicit act; anything else and a typo fixed at the keyboard becomes a
 * searchable, displayable former name.
 */
export async function writeName(
  env: IdentityEnv,
  userId: string,
  patch: NamePatch,
  reason?: string | null,
): Promise<PersonName | null> {
  const current = await currentNameOf(env, userId)

  const next = {} as Record<keyof NamePatch, string | null>
  for (const part of PARTS) {
    next[part] = part in patch ? trimmed(patch[part]) : partOf(current, part)
  }

  const display = next.displayName
  if (display === null) {
    const remains = PARTS.some((part) => part !== 'displayName' && next[part] !== null)
    if (remains) {
      throw new InvalidNameError(
        'A name needs something to show. Fill in the name itself, or clear the other parts too.',
      )
    }
    if (!current) return null
    await supersede(env, userId, reason)
    return null
  }

  const unchanged =
    current !== null && PARTS.every((part) => next[part] === partOf(current, part))
  if (unchanged) return current

  const now = new Date().toISOString()
  if (current) await supersede(env, userId, reason, now)

  const id = newId('nam')
  await env.DB.prepare(
    'INSERT INTO user_names (id, user_id, display_name, known_as, title, given_name, ' +
      'middle_names, family_name, suffix, created_at, updated_at) ' +
      'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
  )
    .bind(
      id,
      userId,
      display,
      next.knownAs,
      next.title,
      next.givenName,
      next.middleNames,
      next.familyName,
      next.suffix,
      now,
      now,
    )
    .run()

  const written = await currentNameOf(env, userId)
  if (!written) throw new InvalidNameError('The name was not readable back.')
  return written
}

/** Retire whichever row is current, recording why. */
async function supersede(
  env: IdentityEnv,
  userId: string,
  reason?: string | null,
  at?: string,
): Promise<void> {
  const now = at ?? new Date().toISOString()
  await env.DB.prepare(
    'UPDATE user_names SET superseded_at = ?, superseded_reason = ?, updated_at = ? ' +
      'WHERE user_id = ? AND superseded_at IS NULL',
  )
    .bind(now, supersessionReason(reason), now, userId)
    .run()
}

/**
 * Erasure, as it reaches names ([[DOC-37]]).
 *
 * THE TEXT GOES AND THE ROWS STAY. A name is personal data and has to be
 * removable; the fact that a name changed on a date is not the name, and
 * deleting the rows would take the timeline with it — including the record that
 * anything was ever erased. So every part is cleared, `display_name` to the
 * empty string because it is the one column that may not be null, and every
 * reader answers *no name* for it because `displayNameFrom` treats empty as
 * absent.
 *
 * IT DOES NOT SUPERSEDE. Redacting the current name leaves it current: the
 * person still has exactly one name row, and it is now blank.
 */
export async function redactNames(env: IdentityEnv, userId: string): Promise<number> {
  const now = new Date().toISOString()
  const done = await env.DB.prepare(
    "UPDATE user_names SET display_name = '', known_as = NULL, title = NULL, " +
      'given_name = NULL, middle_names = NULL, family_name = NULL, suffix = NULL, ' +
      'updated_at = ? WHERE user_id = ?',
  )
    .bind(now, userId)
    .run()
  return done.meta?.changes ?? 0
}

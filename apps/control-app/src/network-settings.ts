/**
 * [[REQ-353]] — what each business says about its own AI network, against D1.
 *
 * THE WORKER'S HALF OF `DelegationResolver`. `delegation.ts` owns the document,
 * its validation and every named refusal; this owns the row. The two never learn
 * each other's vocabulary — the host does not know there is a table, and this
 * does not know what `primary_writes` means — which is the same division
 * `chatLedger` / `LedgerDeps` and `d1TurnSpend` / `RecordTurnSpend` already have,
 * and is what lets the `1c` CLI keep no per-business answer at all without a
 * branch anywhere above it.
 *
 * WHAT A BUSINESS MAY SAY IS ONE WORD: whether its consultant delegates
 * construction to a cheaper worker. It does not choose which model the worker
 * runs on, whether the consultant keeps its own hands (`primary_writes`), or what
 * a worker may do — all three are deployment facts, stated in `delegation.json`
 * and `backends.json`, and [[EPIC-22]] settled that they stay there. So `on`
 * means whatever THIS deployment means by on, and the business's answer is
 * applied TO the deployment's document rather than replacing it.
 *
 * NULL MEANS INHERIT, and that is the whole reason this is a nullable column
 * rather than a boolean with a default. A business that has never been asked
 * behaves exactly as it did before the table existed.
 */

import {
  delegationForScope,
  delegationSettings,
  type DelegationResolver,
} from '../../../tools/generate/src/cli/ai/delegation'
import { BUILDER_ROLE } from '../../../tools/generate/src/cli/ai/roles'

/** What this module needs from the environment: a database, and nothing else. */
export interface NetworkSettingsEnv {
  DB: D1Database
}

/** The one table, named once. */
const TABLE = 'business_network_settings'

/**
 * What the column holds, translated ONLY where it is the boolean it should be.
 *
 * NOT A COERCION, AND THAT IS DELIBERATE. SQLite columns carry an affinity
 * rather than a type, so a row written by hand — `wrangler d1 execute`, a repair
 * script, a future writer with a bug — can hold `'maybe'` in a column declared
 * INTEGER. A reader that coerced would turn that into `true` or `false` silently
 * and serve a business an arrangement nobody chose.
 *
 * SO ANYTHING THAT IS NOT THE BOOLEAN TRAVELS ON, UNTOUCHED, to the document
 * validator — which refuses it by name, naming the business as well as the key,
 * on the path that builds the host rather than at the first delegation in a
 * customer's conversation. `0` and `1` are what D1 hands back for a boolean
 * bound by {@link writeDelegationChoice}, and are the only values translated.
 */
function asStoredChoice(raw: unknown): unknown {
  if (typeof raw === 'boolean') return raw
  if (raw === 0 || raw === 1) return raw === 1
  return raw
}

/**
 * This deployment's document with one business's answer applied.
 *
 * THE DEPLOYMENT'S SETTINGS IN FORCE ARE THE BASE, not the bundled JSON, so the
 * two mechanisms compose instead of one shadowing the other: a deployment (or a
 * suite) that installed its own document through `configureDelegation` still
 * decides what `on` means, and the business still decides whether it is on.
 *
 * IT IS A DOCUMENT AND NOT A SETTINGS OBJECT, because a document is what the
 * validator takes — which is the point of routing a stored value through it at
 * all. `workers` is rebuilt from the settings rather than from the bundle for the
 * same reason the base is: the roles and backends in force are the deployment's
 * current answer, and a worker bound to a backend nobody declares must still be
 * refused by name.
 */
function documentWith(enabled: unknown): Record<string, unknown> {
  const deployment = delegationSettings()
  return {
    enabled,
    primary_writes: deployment.primaryWrites,
    workers: Object.fromEntries(
      Object.entries(deployment.workers).map(([role, worker]) => [role, { backend: worker.backend }]),
    ),
  }
}

/**
 * What this business has said, or `null` where it has said nothing.
 *
 * ONE STATEMENT, ONE ROW, KEYED BY THE PRIMARY KEY. A missing row and a NULL
 * column are the same answer — *inherit* — and collapsing them here is what
 * keeps every caller above from having to know that a row may not exist.
 */
export async function readDelegationChoice(
  env: NetworkSettingsEnv,
  businessId: string,
): Promise<unknown> {
  const row = await env.DB.prepare(
    `SELECT delegate_tool_calls FROM ${TABLE} WHERE business_id = ?`,
  )
    .bind(businessId)
    .first<{ delegate_tool_calls: unknown }>()
  const raw = row?.delegate_tool_calls
  if (raw === null || raw === undefined) return null
  return asStoredChoice(raw)
}

/**
 * Record what this business says.
 *
 * AN UPSERT AND NOT AN INSERT-OR-UPDATE PAIR. The row's existence is not a fact
 * anybody asks about — a business either holds an opinion or inherits — so the
 * database decides whether this is the first time, in one statement, rather than
 * a read deciding it and racing a second writer.
 *
 * IT SURVIVES A REDEPLOY AND AN ISOLATE RECYCLE, which is the whole reason this
 * is a table and not a variable.
 */
export async function writeDelegationChoice(
  env: NetworkSettingsEnv,
  businessId: string,
  enabled: boolean,
  now: Date = new Date(),
): Promise<void> {
  await env.DB.prepare(
    `INSERT INTO ${TABLE} (business_id, delegate_tool_calls, updated_at) VALUES (?, ?, ?) ` +
      `ON CONFLICT(business_id) DO UPDATE SET delegate_tool_calls = excluded.delegate_tool_calls, ` +
      `updated_at = excluded.updated_at`,
  )
    .bind(businessId, enabled ? 1 : 0, now.toISOString())
    .run()
}

/**
 * The resolver the AI host is handed, bound to one business ([[REQ-353]]).
 *
 * BOUND AT CONSTRUCTION AND NEVER PER CALL, which is the same scoping
 * `d1TurnSpend(env, tenantId)` has and for the same reason: `router.ts` resolves
 * the business before the host is built and holds it for the life of the cached
 * host, so a crossing is impossible by construction rather than prevented by a
 * check somebody has to keep writing. Nothing on the resolver takes a business,
 * so nothing that reaches it can name another one.
 *
 * IT READS WHEN IT IS ASKED, not when it is built. `host-core.ts` asks on the
 * path that composes a manager, so a flip reaches the business's next session —
 * which is the semantics, and the switch says so in words.
 */
export function delegationResolverFor(
  env: NetworkSettingsEnv,
  businessId: string,
): DelegationResolver {
  return {
    business: businessId,
    read: async () => {
      const stored = await readDelegationChoice(env, businessId)
      return stored === null ? null : documentWith(stored)
    },
  }
}

/** What the Debug tab draws: what is in force, what was stored, what is inherited. */
export interface NetworkSettingsView {
  /** What the next session for this business will actually compose. */
  delegateToolCalls: boolean
  /** This business's own answer, or `null` where it inherits. */
  stored: boolean | null
  /** What this deployment's `delegation.json` carries. */
  deployment: boolean
}

/**
 * What is in force for this business, and where it came from.
 *
 * IT REPORTS BOTH HALVES, because the surface must never be a control rendered
 * from a default it did not read: a switch that showed `off` without knowing
 * whether that was this business's decision or the deployment's would be
 * inviting the operator to "change" something that was already what they wanted.
 *
 * VALIDATED THROUGH THE SAME CALL THE HOST MAKES. A stored value the host would
 * refuse must not render as a working switch, so this goes through
 * {@link delegationForScope} rather than trusting the column — and the refusal it
 * raises is the host's, naming the business and the offending key.
 */
export async function networkSettingsView(
  env: NetworkSettingsEnv,
  businessId: string,
): Promise<NetworkSettingsView> {
  const deployment = delegationSettings().enabled
  const stored = await readDelegationChoice(env, businessId)
  const resolved = await delegationForScope([BUILDER_ROLE], {
    business: businessId,
    read: async () => (stored === null ? null : documentWith(stored)),
  })
  return {
    delegateToolCalls: resolved.enabled,
    stored: stored === null ? null : resolved.enabled,
    deployment,
  }
}

/**
 * Whether this business's builder conversation is a group chat ([[REQ-357]]).
 *
 * THE SAME ROW AS DELEGATION, A COLUMN OF ITS OWN — the shape `0022` was drawn
 * for. NULL and `0` both read as off: group chat has no deployment document to
 * inherit, it ships off for everybody, and a business nobody has touched behaves
 * exactly as it did before the column existed.
 *
 * A STORED VALUE THAT IS NOT A BOOLEAN IS REFUSED BY NAME rather than coerced, for
 * the reason the delegation reader passes its own through: a word in an INTEGER
 * column is a repair script's mistake, and resolving it to `true` would open a
 * room nobody chose.
 */
export async function readGroupChatChoice(
  env: NetworkSettingsEnv,
  businessId: string,
): Promise<boolean | null> {
  const row = await env.DB.prepare(`SELECT group_chat FROM ${TABLE} WHERE business_id = ?`)
    .bind(businessId)
    .first<{ group_chat: unknown }>()
  const raw = row?.group_chat
  if (raw === null || raw === undefined) return null
  const stored = asStoredChoice(raw)
  if (typeof stored !== 'boolean') {
    throw new Error(
      `business '${businessId}' stores a group_chat value that is not a boolean: ` +
        `${JSON.stringify(raw)}`,
    )
  }
  return stored
}

/** Write the switch; one row per business, the delegation column untouched. */
export async function writeGroupChatChoice(
  env: NetworkSettingsEnv,
  businessId: string,
  enabled: boolean,
  now: Date = new Date(),
): Promise<void> {
  await env.DB.prepare(
    `INSERT INTO ${TABLE} (business_id, group_chat, updated_at) VALUES (?, ?, ?) ` +
      `ON CONFLICT(business_id) DO UPDATE SET group_chat = excluded.group_chat, ` +
      `updated_at = excluded.updated_at`,
  )
    .bind(businessId, enabled ? 1 : 0, now.toISOString())
    .run()
}

/** What the Debug tab draws the group-chat switch from. */
export interface GroupChatView {
  groupChat: boolean
  stored: boolean | null
}

export async function groupChatView(
  env: NetworkSettingsEnv,
  businessId: string,
): Promise<GroupChatView> {
  const stored = await readGroupChatChoice(env, businessId)
  return { groupChat: stored === true, stored }
}

/**
 * The host's question, asked per request ([[REQ-357]]).
 *
 * ON `deps`, like delegation's resolver and for its reason: two businesses served
 * by one isolate must never see each other's value. Read when a conversation
 * opens and when a turn arrives, so a flip shows on the next open of the builder
 * rather than on the next isolate.
 */
export function groupChatResolverFor(
  env: NetworkSettingsEnv,
  businessId: string,
): { enabled(): Promise<boolean> } {
  return { enabled: async () => (await readGroupChatChoice(env, businessId)) === true }
}

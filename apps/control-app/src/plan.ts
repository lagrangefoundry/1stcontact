/**
 * REQ-356 — the site plan, kept in the business's ticket store as a `plan` ticket.
 *
 * ONE PER SITE, keyed by (`kind`, `site_key`): `kind: site` is the site plan, and
 * the site key is the one the store mints ([[DOC-45]] §6) — sites carry no slug.
 * The plan lives in the business's own store, so it belongs to the business
 * through the store and to the site through the field. It replaces the `brief`
 * type that `productTypePack()` declared and nothing ever wrote.
 *
 * WHAT THIS FILE OWNS IS STORAGE. The plan's shape, rules, seed and operations are
 * `plan-core.ts`'s; this is the {@link PlanDeps} port over the ticket store, the
 * lookup that makes "one per site" mean something, and the creation that keeps it
 * true.
 *
 * CREATED AT PROVISIONING, AND ON FIRST OPEN IF MISSING. `provisionBusiness`
 * creates it beside the starter site, so a new business has a plan before its
 * first conversation. A business provisioned before this existed — or one whose
 * provisioning failed after the site was made — gets it the first time anything
 * reads it.
 */
import {
  checkPlan,
  seedPlan,
  SITE_PLAN,
  type Plan,
  type PlanDeps,
  type PlanFields,
} from '../../../tools/generate/src/cli/ai/plan-core'
import { ledgerError } from '../../../tools/generate/src/cli/ai/ledger-core'
import type { Ticket, TicketStore } from './tickets'

/** The ticket type a plan is stored as. */
export const PLAN_TYPE = 'plan'

/** The frontmatter keys a plan holds. */
const PLAN_KEYS: (keyof PlanFields)[] = [
  'kind',
  'site_key',
  'phase',
  'brief',
  'functionality',
  'decisions',
  'checks',
  'tasks',
  'asks',
  'milestones',
]

/**
 * Every live site plan for a site, the one every reader agrees on first.
 *
 * `limit: 'all'` AND THE MATCH IN JS, for `findChat`'s reasons: a bounded page
 * decides findability by where a uid happened to sort, and a key could be coerced
 * by the predicate parser. OLDEST FIRST, uid as the tiebreak, so that if two ever
 * exist every reader — and {@link settle} — picks the same one.
 */
async function sitePlans(tickets: TicketStore, siteKey: string): Promise<Ticket[]> {
  const { tickets: plans } = await tickets.query({ predicate: `type=${PLAN_TYPE}`, limit: 'all' })
  return plans
    .filter((t) => {
      const f = (t.fields ?? {}) as Record<string, unknown>
      return !t.archived && (f.kind ?? SITE_PLAN) === SITE_PLAN && f.site_key === siteKey
    })
    .sort(
      (a, b) =>
        String(a.created_at ?? '').localeCompare(String(b.created_at ?? '')) || a.uid.localeCompare(b.uid),
    )
}

/** The site's plan ticket, or `null`. */
export async function findPlan(tickets: TicketStore, siteKey: string): Promise<Ticket | null> {
  return (await sitePlans(tickets, siteKey))[0] ?? null
}

/** A stored plan ticket as the core's {@link Plan}. */
function toPlan(ticket: Ticket): Plan {
  const fields = (ticket.fields ?? {}) as Record<string, unknown>
  const plan = { ...seedPlan(String(fields.site_key ?? '')).fields } as unknown as Record<string, unknown>
  for (const key of PLAN_KEYS) if (fields[key] !== undefined && fields[key] !== null) plan[key] = fields[key]
  return { fields: plan as unknown as PlanFields, body: ticket.body ?? '' }
}

/** The plan's frontmatter as a field patch: every key, so a write is whole. */
function toFields(plan: Plan): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  // An optional key the plan does not hold yet is left out rather than written
  // as nothing ([[REQ-379]]'s `milestones`).
  for (const key of PLAN_KEYS) if (plan.fields[key] !== undefined) out[key] = plan.fields[key]
  return out
}

/** Store a seeded plan for a site. No lookup: callers decide whether one exists. */
async function insertSeed(tickets: TicketStore, siteKey: string): Promise<void> {
  const seed = seedPlan(siteKey)
  checkPlan(seed.fields)
  await tickets.create({ type: PLAN_TYPE, title: `Site plan: ${siteKey}`, fields: toFields(seed), body: seed.body })
}

/**
 * Collapse to one plan, and answer it.
 *
 * WHY THIS EXISTS. The store has no unique constraint a product can declare, so two
 * first opens racing can each find nothing and each create. Both then call this:
 * both see the same plans in the same order, both keep the oldest, and the newer
 * ones are archived — the store's own lifecycle, so nothing is deleted. A plan
 * archived here was created a moment ago from the seed and never written to,
 * because every write goes through {@link ensurePlan} first and lands on the winner.
 */
async function settle(tickets: TicketStore, siteKey: string): Promise<Ticket> {
  const [winner, ...extra] = await sitePlans(tickets, siteKey)
  for (const duplicate of extra) {
    try {
      await tickets.archive({ uid: duplicate.uid })
    } catch {
      // The other opener archived it first. Either way it is gone from the reads.
    }
  }
  return winner
}

/**
 * The site's plan, created from the seed if the site has none ([[REQ-356]]).
 *
 * IDEMPOTENT, and safe to race: see {@link settle}.
 */
export async function ensurePlan(tickets: TicketStore, siteKey: string): Promise<Ticket> {
  const found = await findPlan(tickets, siteKey)
  if (found) return found
  await insertSeed(tickets, siteKey)
  return settle(tickets, siteKey)
}

/**
 * Create a site's plan; refuse when it already has one ([[REQ-356]]: exactly one
 * site plan per site).
 *
 * THE REFUSAL IS THE POINT. A second plan for a site would split its decisions
 * across two records, which is the per-session fragmentation this type exists to
 * end. A later redesign moves the existing plan's phase back instead.
 */
export async function createPlan(tickets: TicketStore, siteKey: string): Promise<Ticket> {
  if (await findPlan(tickets, siteKey)) {
    throw ledgerError('PLAN_EXISTS', `site ${siteKey} already has a site plan; a redesign moves its phase back`)
  }
  await insertSeed(tickets, siteKey)
  return settle(tickets, siteKey)
}

/**
 * One site's plan as a {@link PlanDeps}.
 *
 * CHECKED AND COMPARE-AND-SET ON EVERY WRITE. {@link checkPlan} runs on what is
 * about to be stored whoever produced it — the ledger's append writes through this
 * port too — and the write demands the version the read saw, for the ledger's
 * reason: a plan holds what a client said, and two turns racing must not lose one
 * of them silently. The declared `CONFLICT` says to read and write again.
 */
export function sitePlan(tickets: TicketStore, siteKey: string): PlanDeps {
  return {
    async read(): Promise<Plan> {
      return toPlan(await ensurePlan(tickets, siteKey))
    },

    async write(change: (plan: Plan) => Plan): Promise<Plan> {
      const ticket = await ensurePlan(tickets, siteKey)
      const next = change(toPlan(ticket))
      checkPlan(next.fields)
      try {
        await tickets.update({
          uid: ticket.uid,
          patch: { fields: toFields(next), body: next.body },
          expected_version: ticket.version,
        })
      } catch (error) {
        throw conflictOrRethrow(error, planConflict)
      }
      return next
    },
  }
}

const planConflict = (): Error => ledgerError('CONFLICT', 'the plan moved while this change was being written')

/**
 * A version clash, translated; anything else left alone.
 *
 * SHARED WITH THE LEDGER, which writes the same store and reads the same
 * vocabulary. An unrecognised failure is re-thrown unchanged, because telling a
 * model to retry a write that failed for some other reason is telling it to fail
 * again.
 */
export function conflictOrRethrow(error: unknown, conflict: () => Error): unknown {
  const text = `${(error as { code?: string })?.code ?? ''} ${(error as Error)?.message ?? ''}`
  return /conflict|version|stale|expected_version/i.test(text) ? conflict() : error
}

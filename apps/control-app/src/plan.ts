/**
 * REQ-356 — the site plan, kept in the tenant's ticket store as a `plan` ticket.
 *
 * ONE PER SITE, keyed by `site_slug`. It replaces the `brief` type that
 * `productTypePack()` declared and nothing ever wrote: same placement, same key,
 * widened from a body-only decisions document into the structured plan both the
 * consultant and the coordinator work from ([[DOC-64]] §5).
 *
 * WHAT THIS FILE OWNS IS STORAGE. The plan's shape, rules, seed and operations are
 * `plan-core.ts`'s; this is the {@link PlanDeps} port over the ticket store, the
 * lookup that makes "one per site" mean something, and the explicit create that
 * refuses a second one.
 *
 * CREATED ON FIRST WRITE. A site gets its plan the first time anything is recorded
 * about it — an intake answer, a decision, a ledger entry — so nothing has to
 * remember to create one, and a site nobody has talked about has no empty ticket
 * in its corpus.
 */
import {
  checkPlan,
  seedPlan,
  type Plan,
  type PlanDeps,
  type PlanFields,
} from '../../../tools/generate/src/cli/ai/plan-core'
import { ledgerError } from '../../../tools/generate/src/cli/ai/ledger-core'
import type { Ticket, TicketStore } from './tickets'

/** The ticket type a plan is stored as. */
export const PLAN_TYPE = 'plan'

/** The frontmatter keys a plan holds, in the order the type pack declares them. */
const PLAN_KEYS: (keyof PlanFields)[] = [
  'site_slug',
  'phase',
  'brief',
  'functionality',
  'decisions',
  'checks',
  'tasks',
]

/**
 * The site's plan ticket, or `null`.
 *
 * `limit: 'all'` AND THE MATCH IN JS, for `findChat`'s reasons: a bounded page
 * decides findability by where a uid happened to sort, and a numeric-looking slug
 * could be coerced by the predicate parser. Oldest first, so that if two ever
 * existed every reader would agree on which is the plan.
 */
export async function findPlan(tickets: TicketStore, site: string): Promise<Ticket | null> {
  const { tickets: plans } = await tickets.query({ predicate: `type=${PLAN_TYPE}`, limit: 'all' })
  const mine = plans
    .filter((t) => (t.fields ?? {}).site_slug === site)
    .sort((a, b) => String(a.created_at ?? '').localeCompare(String(b.created_at ?? '')))
  return mine[0] ?? null
}

/** A stored plan ticket as the core's {@link Plan}. */
function toPlan(ticket: Ticket): Plan {
  const fields = (ticket.fields ?? {}) as Record<string, unknown>
  const seed = seedPlan(String(fields.site_slug ?? ''))
  const plan = { ...seed.fields } as unknown as Record<string, unknown>
  for (const key of PLAN_KEYS) if (fields[key] !== undefined && fields[key] !== null) plan[key] = fields[key]
  return { fields: plan as unknown as PlanFields, body: ticket.body ?? '' }
}

/** The plan's frontmatter as a field patch: every key, so a write is whole. */
function toFields(plan: Plan): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  for (const key of PLAN_KEYS) out[key] = plan.fields[key]
  return out
}

/**
 * Create a site's plan; refuse when it already has one ([[REQ-356]]: exactly one
 * plan per site).
 *
 * THE REFUSAL IS THE POINT. A second plan for a site would split its decisions
 * across two records, which is the per-session fragmentation this type exists to
 * end. A later redesign moves the existing plan's phase back instead.
 */
export async function createPlan(tickets: TicketStore, site: string, plan: Plan = seedPlan(site)): Promise<Ticket> {
  if (await findPlan(tickets, site)) {
    throw ledgerError('PLAN_EXISTS', `site ${site} already has a plan; a redesign moves its phase back`)
  }
  checkPlan(plan.fields)
  const { ticket } = await tickets.create({
    type: PLAN_TYPE,
    title: `Plan: ${site}`,
    fields: toFields({ ...plan, fields: { ...plan.fields, site_slug: site } }),
    body: plan.body,
  })
  return ticket
}

/**
 * One site's plan as a {@link PlanDeps}.
 *
 * CHECKED AND COMPARE-AND-SET ON EVERY WRITE. {@link checkPlan} runs on what is
 * about to be stored whoever produced it, and the write demands the version the
 * read saw, for the ledger's reason: a plan holds what a
 * client said, and two turns racing must not lose one of them silently. The
 * declared `CONFLICT` says to read and write again.
 */
export function sitePlan(tickets: TicketStore, site: string): PlanDeps {
  return {
    async read(): Promise<Plan | null> {
      const ticket = await findPlan(tickets, site)
      return ticket ? toPlan(ticket) : null
    },

    async write(change: (plan: Plan) => Plan): Promise<Plan> {
      const ticket = await findPlan(tickets, site)
      if (ticket === null) {
        const next = change(seedPlan(site))
        try {
          await createPlan(tickets, site, next)
        } catch (error) {
          // Another turn created it between the read and this create — the same
          // race a version clash is, reported the same way.
          if ((error as { code?: string })?.code === 'PLAN_EXISTS') throw planConflict()
          throw error
        }
        return next
      }
      const next = change(toPlan(ticket))
      // THE RULES HOLD FOR EVERY WRITER, not only for the plan surface: the
      // ledger's append writes through this port too.
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

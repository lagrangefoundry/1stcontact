import { describe, expect, it } from 'vitest'
import { chatLedger } from '../apps/control-app/src/ledger'
import type { Ticket, TicketStore } from '../apps/control-app/src/tickets'
import { logEntries, seedPlan } from '../tools/generate/src/cli/ai/plan-core'

/**
 * REQ-171 — **the engagement record**, in the Worker that has somewhere to keep
 * it.
 *
 * [[DOC-33]] §3.1 puts the ledger in a ticket BODY, because the body is what the
 * knowledge component indexes (`ticketText`) — a comment is not. Since
 * [[REQ-356]] that body is the SITE's plan, in its `## Decision log` section:
 * a decision is about the site and has to outlive the conversation it was made
 * in. The engagement's NAME stays on the conversation's `chat` ticket.
 *
 * These run in workerd because this is the host that has a ticket store. The
 * `1c` CLI archives to a file, composes no ledger surface, and is covered by the
 * node suite asserting its absence.
 */

const SESSION = 'site-studio'
const SITE = 'studio'

function ticket(over: Partial<Ticket> = {}): Ticket {
  return {
    uid: 'chat-1',
    type: 'chat',
    title: SESSION,
    status: null,
    human_id: null,
    fields: { session_id: SESSION },
    links: [],
    body: '',
    version: 3,
    archived: false,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...over,
  }
}

/** The site's plan as stored, with `log` already in its decision log. */
function planTicket(over: Partial<Ticket> = {}, log = ''): Ticket {
  const seed = seedPlan(SITE)
  return ticket({
    uid: 'plan-1',
    type: 'plan',
    title: `Plan: ${SITE}`,
    fields: { ...seed.fields },
    body: seed.body.replace('## Decision log', `## Decision log${log ? `\n\n${log}` : ''}`),
    ...over,
  })
}

/** A store that remembers every write, and can be told to reject an update. */
function store(
  tickets: Ticket[],
  onUpdate?: (a: { uid: string; patch?: Record<string, unknown>; expected_version?: number }) => void,
): TicketStore & { patches: Array<Record<string, unknown>>; created: Array<Record<string, unknown>> } {
  const patches: Array<Record<string, unknown>> = []
  const created: Array<Record<string, unknown>> = []
  return {
    patches,
    created,
    query: async (a: { predicate?: string }) => ({
      tickets: tickets.filter((t) => !a.predicate || a.predicate === `type=${t.type}`),
    }),
    // A CREATE IS REMEMBERED AND THEN FOUND, as the real store's would be — the
    // plan port re-reads after creating to settle on one plan.
    create: async (a: Record<string, unknown>) => {
      created.push(a)
      const made = ticket({ ...(a as Partial<Ticket>), uid: `plan-new-${created.length}`, version: 1 })
      tickets.push(made)
      return { ticket: made }
    },
    archive: async () => ({ ticket: ticket() }),
    update: async (a) => {
      onUpdate?.(a)
      patches.push({ uid: a.uid, ...(a.patch ?? {}), expected_version: a.expected_version })
      return { ticket: ticket() }
    },
  } as unknown as TicketStore & {
    patches: Array<Record<string, unknown>>
    created: Array<Record<string, unknown>>
  }
}

describe('REQ-171 — a decision survives the conversation', () => {
  it('test_UAT_FC_REQ-171_the_first_decision_opens_the_ledger', async () => {
    // A SITE WITH NO PLAN GETS ONE, seeded, and the entry lands in its log
    // ([[REQ-356]]): the plan is created on first open, then written like any
    // other — compare-and-set against the version just created.
    const s = store([ticket()])
    const state = await chatLedger(s, SESSION, SITE).append((i) => `### Decision ${i}\n\nThe palette is oxblood.`)

    expect(state.entries).toBe(1)
    expect(s.created).toHaveLength(1)
    expect(s.created[0]).toMatchObject({ type: 'plan', fields: { kind: 'site', site_key: SITE } })
    expect(String(s.patches[0].body)).toMatch(/## Decision log\n\n### Decision 1\n\nThe palette is oxblood\.\n\n## Notes/)
  })

  it('test_UAT_FC_REQ-171_each_decision_is_numbered_from_what_is_already_there', async () => {
    const s = store([ticket(), planTicket({}, '### Decision 1\n\nThe palette is oxblood.')])
    await chatLedger(s, SESSION, SITE).append((i) => `### Decision ${i}\n\nTwo pages, for now.`)

    // The number comes from the record, not from the session: a consultant that
    // resumed a conversation started last week must not begin again at one.
    expect(s.patches[0].body).toContain('### Decision 2')
    // And the earlier decision is still there. An append that replaced the body
    // would lose exactly what the ledger exists to keep.
    expect(s.patches[0].body).toContain('### Decision 1')
  })

  it('test_UAT_FC_REQ-171_a_decision_is_never_lost_to_a_race', async () => {
    // COMPARE-AND-SET, unlike the delta cursor beside it. A cursor is a
    // bookmark and two turns racing both move it forward; a ledger entry is
    // something a client said, and a silently dropped one is gone with no trace
    // it was written. The version the read saw is the version the write demands.
    const s = store([ticket(), planTicket({ version: 7 })])
    await chatLedger(s, SESSION, SITE).append((i) => `### Decision ${i}\n\nx`)
    expect(s.patches[0]).toMatchObject({ uid: 'plan-1', expected_version: 7 })
  })

  it('test_UAT_FC_REQ-171_a_clash_is_reported_as_something_to_retry', async () => {
    const s = store([ticket(), planTicket()], () => {
      throw Object.assign(new Error('expected_version did not match'), { code: 'VERSION_CONFLICT' })
    })
    await expect(
      chatLedger(s, SESSION, SITE).append((i) => `### Decision ${i}\n\nx`),
    ).rejects.toMatchObject({ code: 'CONFLICT' })
  })

  it('test_UAT_FC_REQ-171_an_unrelated_failure_is_not_dressed_up_as_a_clash', async () => {
    // Telling a model to retry a write that failed for some other reason is
    // telling it to fail again.
    const s = store([ticket(), planTicket()], () => {
      throw Object.assign(new Error('the database is unreachable'), { code: 'STORE_DOWN' })
    })
    await expect(
      chatLedger(s, SESSION, SITE).append((i) => `### Decision ${i}\n\nx`),
    ).rejects.toMatchObject({ code: 'STORE_DOWN' })
  })

  it('test_UAT_FC_REQ-171_no_chat_ticket_yet_still_keeps_the_decision', async () => {
    // THE ARCHIVE CREATES THE CHAT TICKET on the first turn that writes anything,
    // so a session can reach here before one exists. That used to be a refusal;
    // since [[REQ-356]] the decision belongs to the site, which exists, so it is
    // written — and the client's answer keeps its index entry too.
    const s = store([])
    const state = await chatLedger(s, SESSION, SITE).append((i) => `### Decision ${i}\n\nx`)
    expect(state.entries).toBe(1)
    expect(s.created).toHaveLength(1)
    expect(String(s.patches[0].body)).toContain('### Decision 1')
  })

  it('test_UAT_FC_REQ-171_naming_the_engagement_replaces_the_session_id', async () => {
    const s = store([ticket()])
    const state = await chatLedger(s, SESSION, SITE).rename('Website for a Bristol furniture restorer')

    expect(state.title).toBe('Website for a Bristol furniture restorer')
    expect(s.patches[0].title).toBe('Website for a Bristol furniture restorer')
    // NO compare-and-set on a rename. A title is not accumulated: two turns
    // racing to name the engagement both name it, and the later one wins, which
    // is what a rename is asking for.
    expect(s.patches[0].expected_version).toBeUndefined()
  })

  it('test_UAT_FC_REQ-171_the_count_cannot_be_inflated_by_the_prose', () => {
    // The count numbers the next entry. A ledger that renumbered itself because
    // a client's own words contained the heading text would be worse than one
    // that did not number at all.
    const body = (log: string): string => seedPlan(SITE).body.replace('## Decision log', `## Decision log\n\n${log}`)
    expect(logEntries(body('### Decision 1\n\nWe wrote "### Decision 2" on the wall.'))).toBe(1)
    expect(logEntries('')).toBe(0)
  })
})

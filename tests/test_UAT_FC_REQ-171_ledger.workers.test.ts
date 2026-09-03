import { describe, expect, it } from 'vitest'
import { chatLedger, countEntries } from '../apps/control-app/src/ledger'
import type { Ticket, TicketStore } from '../apps/control-app/src/tickets'

/**
 * REQ-171 — **the engagement record**, in the Worker that has somewhere to keep
 * it.
 *
 * [[DOC-33]] §3.1 puts the ledger in the session's `chat` ticket BODY, and the
 * body is what the knowledge component indexes (`ticketText`) — a comment is
 * not. So an unwritten body is a conversation that contributes a content-free
 * vector to the project KB, and every conversation this client has ever had is
 * unfindable.
 *
 * These run in workerd because this is the host that has a ticket store. The
 * `1c` CLI archives to a file, composes no ledger surface, and is covered by the
 * node suite asserting its absence.
 */

const SESSION = 'site-studio'

function chatTicket(over: Partial<Ticket> = {}): Ticket {
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

/** A store that remembers the last patch, and can be told to reject a write. */
function store(
  tickets: Ticket[],
  onUpdate?: (a: { uid: string; patch?: Record<string, unknown>; expected_version?: number }) => void,
): TicketStore & { patches: Array<Record<string, unknown>> } {
  const patches: Array<Record<string, unknown>> = []
  return {
    patches,
    query: async () => ({ tickets }),
    update: async (a) => {
      onUpdate?.(a)
      patches.push({ ...(a.patch ?? {}), expected_version: a.expected_version })
      return { ticket: chatTicket() }
    },
  } as unknown as TicketStore & { patches: Array<Record<string, unknown>> }
}

describe('REQ-171 — a decision survives the conversation', () => {
  it('test_UAT_FC_REQ-171_the_first_decision_opens_the_ledger', async () => {
    const s = store([chatTicket()])
    const state = await chatLedger(s, SESSION).append((i) => `### Decision ${i}\n\nThe palette is oxblood.`)

    expect(state.entries).toBe(1)
    // An empty body gains the entry and nothing else — no preamble, no heading
    // the entry then sits under. The body IS the ledger.
    expect(s.patches[0].body).toBe('### Decision 1\n\nThe palette is oxblood.')
  })

  it('test_UAT_FC_REQ-171_each_decision_is_numbered_from_what_is_already_there', async () => {
    const s = store([chatTicket({ body: '### Decision 1\n\nThe palette is oxblood.' })])
    await chatLedger(s, SESSION).append((i) => `### Decision ${i}\n\nTwo pages, for now.`)

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
    const s = store([chatTicket({ version: 7 })])
    await chatLedger(s, SESSION).append((i) => `### Decision ${i}\n\nx`)
    expect(s.patches[0].expected_version).toBe(7)
  })

  it('test_UAT_FC_REQ-171_a_clash_is_reported_as_something_to_retry', async () => {
    const s = store([chatTicket()], () => {
      throw Object.assign(new Error('expected_version did not match'), { code: 'VERSION_CONFLICT' })
    })
    await expect(
      chatLedger(s, SESSION).append((i) => `### Decision ${i}\n\nx`),
    ).rejects.toMatchObject({ code: 'CONFLICT' })
  })

  it('test_UAT_FC_REQ-171_an_unrelated_failure_is_not_dressed_up_as_a_clash', async () => {
    // Telling a model to retry a write that failed for some other reason is
    // telling it to fail again.
    const s = store([chatTicket()], () => {
      throw Object.assign(new Error('the database is unreachable'), { code: 'STORE_DOWN' })
    })
    await expect(
      chatLedger(s, SESSION).append((i) => `### Decision ${i}\n\nx`),
    ).rejects.toMatchObject({ code: 'STORE_DOWN' })
  })

  it('test_UAT_FC_REQ-171_no_ticket_yet_is_a_refusal_that_keeps_the_answer', async () => {
    // The archive creates the ticket on the first turn that writes anything, so
    // a session can genuinely reach here before one exists. The declared
    // refusal tells the consultant to say what it decided and record it later —
    // which loses the index entry and keeps the client's answer.
    const s = store([])
    await expect(
      chatLedger(s, SESSION).append((i) => `### Decision ${i}\n\nx`),
    ).rejects.toMatchObject({ code: 'NO_LEDGER' })
  })

  it('test_UAT_FC_REQ-171_naming_the_engagement_replaces_the_session_id', async () => {
    const s = store([chatTicket()])
    const state = await chatLedger(s, SESSION).rename('Website for a Bristol furniture restorer')

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
    expect(countEntries('### Decision 1\n\nWe wrote "### Decision 2" on the wall.')).toBe(1)
    expect(countEntries('')).toBe(0)
  })
})

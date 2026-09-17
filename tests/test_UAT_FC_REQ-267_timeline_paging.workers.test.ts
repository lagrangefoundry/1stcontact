import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import {
  contactEventInsert,
  eventsOf,
  provenanceOf,
  TIMELINE_LIMIT,
  type EventEnv,
} from '../apps/control-app/src/events'
import { newId } from '../apps/control-app/src/identity'
import type { Scope } from '../apps/control-app/src/scope'
import { applySchema } from './support/d1-site-factory'
import { seedContact } from './support/contact'

/**
 * [[REQ-267]] §8 — **a contact's history reads past the hundredth row.**
 *
 * WHAT THIS PINS, AND WHY IT IS NOT A NICETY. `TIMELINE_LIMIT` was a cap and not
 * a page on a stated assumption — *"paging it would be a control nobody has
 * asked for over data nobody has enough of"* — which inbound mail falsifies:
 * every message in both directions lands on the spine, and a campaign writes an
 * event per recipient. Left as it was, the hundredth row becomes where a
 * contact's history APPEARS TO BEGIN, silently, which is the only way a
 * truncation can mislead.
 *
 * THE FALSIFIERS:
 *
 *   - *a row that appears on two pages, or on neither* — which is what a cursor
 *     over `occurred_at` alone produces the moment two events share a stamp, and
 *     an import writes a whole history on one stamp;
 *   - *paging in an order the unpaged query does not produce* — after which the
 *     reader's "history" is a different sequence from the one the pane shows;
 *   - *provenance read off the tail of a page* — quietly wrong for exactly the
 *     contacts with the longest histories, which are the ones an operator asks
 *     about.
 *
 * EVERY EVENT IS WRITTEN THROUGH THE SHIPPED STATEMENT BUILDER against a real
 * D1, so what is paged is rows the product would have written.
 */

const BUSINESS = 'biz_req267_paging'
/** Enough to need three pages, so a boundary is crossed more than once. */
const TOTAL = TIMELINE_LIMIT * 2 + 7

function eventEnv(): EventEnv {
  return env as unknown as EventEnv
}

const scope: Scope = { businessId: BUSINESS }

let contactId = ''

beforeAll(async () => {
  await applySchema()
  contactId = await seedContact(eventEnv() as never, {
    tenantId: BUSINESS,
    email: `paging-${newId('t')}@example.test`,
  })
  // ONE BATCH, AND THE STAMPS ARE DELIBERATELY NOT ALL DISTINCT. Ten of them
  // share a millisecond, which is the shape an import produces and the shape a
  // cursor on `occurred_at` alone silently mishandles.
  const statements = []
  for (let i = 0; i < TOTAL; i += 1) {
    const at = new Date(Date.UTC(2026, 0, 1) + Math.floor(i / 10) * 60_000).toISOString()
    statements.push(
      contactEventInsert(eventEnv(), {
        contactId,
        businessId: BUSINESS,
        kind: 'test.event',
        occurredAt: at,
        detail: { n: i },
      }),
    )
  }
  await env.DB.batch(statements)
})

describe('REQ-267 — the timeline pages', () => {
  it('test_UAT_FC_REQ-267_the_cursor_reads_every_event_with_no_repeats_and_no_gaps', async () => {
    const seen: string[] = []
    let cursor: string | null = null
    // A BOUND ON THE WALK ITSELF, because the failure this guards against is a
    // cursor that does not advance — which without one is an infinite loop and a
    // suite that hangs rather than fails.
    for (let page = 0; page < 20; page += 1) {
      const events: Awaited<ReturnType<typeof eventsOf>> = await eventsOf(
        eventEnv(),
        scope,
        contactId,
        cursor === null ? {} : { before: cursor },
      )
      if (events.length === 0) break
      seen.push(...events.map((one) => one.id))
      cursor = events[events.length - 1].cursor
      if (events.length < TIMELINE_LIMIT) break
    }

    expect(seen).toHaveLength(TOTAL)
    expect(new Set(seen).size).toBe(TOTAL)
  })

  it('test_UAT_FC_REQ-267_paging_matches_the_ordering_of_a_single_unpaged_query', async () => {
    // THE WHOLE HISTORY IN ONE READ, as the comparison. If paging invented its
    // own ordering, the two sequences would disagree at the first shared stamp.
    const whole = await eventsOf(eventEnv(), scope, contactId, { limit: TOTAL })
    const paged: string[] = []
    let cursor: string | null = null
    for (let page = 0; page < 20; page += 1) {
      const events: Awaited<ReturnType<typeof eventsOf>> = await eventsOf(
        eventEnv(),
        scope,
        contactId,
        cursor === null ? {} : { before: cursor },
      )
      if (events.length === 0) break
      paged.push(...events.map((one) => one.id))
      cursor = events[events.length - 1].cursor
      if (events.length < TIMELINE_LIMIT) break
    }
    expect(paged).toEqual(whole.map((one) => one.id))
  })

  it('test_UAT_FC_REQ-267_the_first_page_still_caps_at_timeline_limit', async () => {
    const first = await eventsOf(eventEnv(), scope, contactId)
    expect(first).toHaveLength(TIMELINE_LIMIT)
  })

  it('test_UAT_FC_REQ-267_provenance_answers_from_the_genuinely_earliest_row', async () => {
    const origin = await provenanceOf(eventEnv(), scope, contactId)
    const whole = await eventsOf(eventEnv(), scope, contactId, { limit: TOTAL })
    // The list is newest-first, so the earliest row is its last element.
    expect(origin?.id).toBe(whole[whole.length - 1].id)
    // AND IT IS NOT THE END OF THE FIRST PAGE, which is what reading provenance
    // off a capped list would have produced.
    const first = await eventsOf(eventEnv(), scope, contactId)
    expect(origin?.id).not.toBe(first[first.length - 1].id)
  })

  it('test_UAT_FC_REQ-267_a_cursor_we_did_not_mint_reads_as_no_cursor_at_all', async () => {
    // A READER WHO HAS LOST THEIR PLACE GETS THE FIRST PAGE, which is the answer
    // they actually want — and no timeline refuses to render because a URL was
    // hand-edited.
    const first = await eventsOf(eventEnv(), scope, contactId)
    const garbage = await eventsOf(eventEnv(), scope, contactId, { before: 'not-a-cursor' })
    expect(garbage.map((one) => one.id)).toEqual(first.map((one) => one.id))
  })
})

import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import { EMAIL_RECEIVED } from '../apps/control-app/src/builder/contact-events.js'
import { contactEventInsert, TIMELINE_LIMIT } from '../apps/control-app/src/events'
import { newId } from '../apps/control-app/src/identity'
import { receiveMail, type InboundEnv } from '../apps/control-app/src/inbound'
import {
  PERSON_EVENTS_PATH,
  PERSON_INBOUND_DISCARD_PATH,
  PERSON_INBOUND_PATH,
  PERSON_INBOUND_PROMOTE_PATH,
  PERSON_MESSAGES_PATH,
  route,
  type RouterEnv,
} from '../apps/control-app/src/router'
import type { Scope } from '../apps/control-app/src/scope'
import { ticketStoreFor } from '../apps/control-app/src/tickets'
import { applySchema } from './support/d1-site-factory'
import { seedContact } from './support/contact'
import { inboundMessage, rawMessage } from './support/inbound-message'

/**
 * [[REQ-267]] — **the inbound surfaces, as routes.**
 *
 * WHY THE ROUTES NEED THEIR OWN FILE. `receiveMail`, `pendingInbound` and
 * `promotePending` are proved as functions elsewhere; what a function test
 * cannot say anything about is the door — whether the queue is reachable at all,
 * whether the promote gate is the one that guards creating a contact, and
 * whether the correspondence route answers with BOTH directions. Every one of
 * those is a thing that is silently wrong rather than loudly broken.
 *
 * THE FALSIFIERS:
 *
 *   - *promote reachable without the gate `/api/people/add` carries* — a route
 *     that can create a contact without meeting the create route's gate IS that
 *     gate's bypass;
 *   - *the correspondence route answering with only what we sent* — which is how
 *     a reply becomes invisible on the one surface that exists to show it;
 *   - *no way to reach the history past the cap*.
 */

const BUSINESS = 'biz_req267_routes'
const DOMAIN = 'routes.test'

function routerEnv(): RouterEnv & InboundEnv {
  return {
    DB: env.DB as D1Database,
    SITES: env.SITES as R2Bucket,
    BLOBS: env.BLOBS as R2Bucket,
    TENANT_ID: BUSINESS,
  } as unknown as RouterEnv & InboundEnv
}

const scopeOf = (): Scope => ({ businessId: BUSINESS })

/** An admission that owns this business — what the create gate asks for. */
const owner = {
  admission: {
    ok: true as const,
    user: { platform_operator: false },
    businesses: [{ businessId: BUSINESS, role: 'owner', selectable: true }],
  },
}

/** An admission that is admitted and owns nothing — the gate's other side. */
const bystander = {
  admission: {
    ok: true as const,
    user: { platform_operator: false },
    businesses: [{ businessId: BUSINESS, role: 'member', selectable: true }],
  },
}

async function call(
  path: string,
  init: RequestInit = {},
  deps: Record<string, unknown> = owner,
): Promise<Response> {
  return route(
    new Request(`https://app.test${path}`, init),
    routerEnv(),
    scopeOf(),
    deps as never,
  )
}

/** Take delivery of one message for this business. */
async function deliver(from: string, subject: string): Promise<void> {
  const env_ = routerEnv()
  await receiveMail(
    env_,
    inboundMessage({
      from,
      to: `hello@${DOMAIN}`,
      raw: rawMessage({ from, to: `hello@${DOMAIN}`, subject, body: 'body' }),
    }),
    { openStore: (scope: Scope) => ticketStoreFor(env_, scope) },
  )
}

beforeAll(async () => {
  await applySchema()
  await env.DB.prepare(
    'INSERT OR REPLACE INTO sending_domains ' +
      '(id, business_id, zone_id, domain, status, dmarc_ours, created_at, updated_at, forward_to) ' +
      "VALUES (?, ?, 'zone', ?, 'verified', 0, ?, ?, NULL)",
  )
    .bind(newId('snd'), BUSINESS, DOMAIN, new Date().toISOString(), new Date().toISOString())
    .run()
})

describe('REQ-267 — the pending queue as a route', () => {
  it('test_UAT_FC_REQ-267_the_pending_route_lists_and_promotes_only_for_an_owner', async () => {
    const stranger = `queued-${newId('t')}@example.test`
    await deliver(stranger, 'Do you do gutters')

    const listed = await call(PERSON_INBOUND_PATH)
    expect(listed.status).toBe(200)
    const queue = (await listed.json()) as { pending: Array<{ uid: string; envelopeFrom: string }> }
    const waiting = queue.pending.find((one) => one.envelopeFrom === stranger)
    expect(waiting).toBeDefined()

    // THE GATE IS THE CREATE ROUTE'S. Promoting makes a person, so a caller who
    // may not add contacts may not promote one either — otherwise this is the
    // add route's own bypass.
    const refused = await call(
      PERSON_INBOUND_PROMOTE_PATH,
      { method: 'POST', body: JSON.stringify({ uid: waiting!.uid }) },
      bystander,
    )
    expect(refused.status).toBe(403)

    const promoted = await call(PERSON_INBOUND_PROMOTE_PATH, {
      method: 'POST',
      body: JSON.stringify({ uid: waiting!.uid }),
    })
    expect(promoted.status).toBe(200)
    const outcome = (await promoted.json()) as { contactId: string; created: boolean }
    expect(outcome.created).toBe(true)

    // AND IT LEAVES THE QUEUE, because the decision has been taken.
    const after = (await (await call(PERSON_INBOUND_PATH)).json()) as {
      pending: Array<{ envelopeFrom: string }>
    }
    expect(after.pending.filter((one) => one.envelopeFrom === stranger)).toHaveLength(0)
  })

  it('test_UAT_FC_REQ-267_the_discard_route_suppresses_a_sender_and_reports_it', async () => {
    const stranger = `discard-${newId('t')}@example.test`
    await deliver(stranger, 'Buy my SEO')

    const discarded = await call(PERSON_INBOUND_DISCARD_PATH, {
      method: 'POST',
      body: JSON.stringify({ address: stranger }),
    })
    expect(discarded.status).toBe(200)

    const after = (await (await call(PERSON_INBOUND_PATH)).json()) as {
      pending: Array<{ envelopeFrom: string }>
      suppressed: string[]
    }
    expect(after.pending.filter((one) => one.envelopeFrom === stranger)).toHaveLength(0)
    // REVERSIBLE, SO IT IS REPORTED. A suppression nobody can see is one nobody
    // can undo, which would make a mis-click permanent.
    expect(after.suppressed).toContain(stranger)
  })
})

describe('REQ-267 — correspondence and history as routes', () => {
  it('test_UAT_FC_REQ-267_the_correspondence_route_answers_both_directions', async () => {
    const address = `both-${newId('t')}@example.test`
    const contactId = await seedContact(routerEnv(), { tenantId: BUSINESS, email: address })
    await deliver(address, 'Their reply')

    const answer = (await (
      await call(`${PERSON_MESSAGES_PATH}?id=${encodeURIComponent(contactId)}`)
    ).json()) as { messages: unknown[]; received: Array<{ subject: string }> }

    expect(Array.isArray(answer.messages)).toBe(true)
    expect(answer.received.map((one) => one.subject)).toContain('Their reply')
  })

  it('test_UAT_FC_REQ-267_the_events_route_serves_past_the_cap_through_the_cursor', async () => {
    const address = `history-${newId('t')}@example.test`
    const contactId = await seedContact(routerEnv(), { tenantId: BUSINESS, email: address })
    const statements = []
    for (let i = 0; i < TIMELINE_LIMIT + 5; i += 1) {
      statements.push(
        contactEventInsert(routerEnv(), {
          contactId,
          businessId: BUSINESS,
          kind: EMAIL_RECEIVED,
          occurredAt: new Date(Date.UTC(2026, 0, 1) + i * 60_000).toISOString(),
        }),
      )
    }
    await env.DB.batch(statements)

    const first = (await (
      await call(`${PERSON_EVENTS_PATH}?id=${encodeURIComponent(contactId)}`)
    ).json()) as { events: Array<{ id: string; cursor: string }> }
    expect(first.events).toHaveLength(TIMELINE_LIMIT)

    const next = (await (
      await call(
        `${PERSON_EVENTS_PATH}?id=${encodeURIComponent(contactId)}&before=${encodeURIComponent(
          first.events[first.events.length - 1].cursor,
        )}`,
      )
    ).json()) as { events: Array<{ id: string }> }
    expect(next.events).toHaveLength(5)
    // NO OVERLAP. A row on two pages is the failure a cursor on the stamp alone
    // produces the moment two events share one.
    const seen = new Set(first.events.map((one) => one.id))
    expect(next.events.some((one) => seen.has(one.id))).toBe(false)
  })
})

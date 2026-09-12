// @vitest-environment jsdom
/**
 * REQ-233 — **the Contacts pane, subscribed rather than reloaded.**
 *
 * WHAT THIS FILE PROVES, and what its workerd sibling proves instead.
 * `…_contact_changes.workers.test.ts` is the ORIGIN CONTRACT — that a write
 * nobody made on this connection produces a frame, that the frame carries the
 * row, that the cursor is honest enough to reconnect on, and that a feed raised
 * under one business can never observe another's. This one is the PANE: that a
 * frame puts the contact on screen, under the filter that is currently set, and
 * disturbs nothing else.
 *
 * THE CLAIMS THAT MATTER MOST ARE THE ONES ABOUT WHAT *DOES NOT* HAPPEN. A live
 * list is easy to build and easy to build wrongly, and the wrong version is
 * indistinguishable from the right one until an operator is halfway through
 * ticking people to invite: it re-reads the whole list on every frame, throws the
 * selection away, and reshuffles rows that did not change. So the cases below
 * assert the survival of the ticks and the order at least as hard as they assert
 * that the new contact appeared.
 *
 * MOUNTED AGAINST THE ACTUALLY-INSTALLED COMPONENTS, on [[REQ-199]]'s pattern:
 * the selection is `list-detail`'s own rendering of a set this panel keeps, and a
 * mocked component would assert the mock rather than that the ticks survived.
 *
 * THE ONLY DOUBLE IS THE FEED, because it is the network. `transport.subscribe`
 * is handed a driver the test pushes frames into, which is the same seam
 * `transport.list` already occupies — jsdom has no `EventSource`, and a suite
 * that polyfilled one would be asserting the polyfill.
 */

import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'

let createPeoplePanel: (opts?: Record<string, unknown>) => never

if (!WEBUI_INSTALLED) console.warn(`REQ-233 contacts-live suite skipped: ${WEBUI_SKIP_REASON}`)

const settle = () => new Promise((resolve) => setTimeout(resolve, 0))

function memoryStorage() {
  const map = new Map<string, string>()
  return {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => void map.set(k, String(v)),
    removeItem: (k: string) => void map.delete(k),
    clear: () => map.clear(),
    key: (i: number) => [...map.keys()][i] ?? null,
    get length() {
      return map.size
    },
  }
}

type Person = Record<string, unknown> & { id: string; createdAt: string }

const person = (over: Record<string, unknown>): Person =>
  ({
    name: null,
    formerNames: [],
    email: null,
    status: 'active',
    invitedAt: null,
    firstSeenAt: null,
    lastSeenAt: null,
    termsAcceptedAt: null,
    pipelineStage: 'lead',
    createdAt: '2026-09-01T09:00:00.000Z',
    ...over,
  }) as Person

/** The business as it stands when the operator opens the pane. */
const PEOPLE: Person[] = [
  person({ id: 'usr_a', email: 'a@example.test', createdAt: '2026-09-01T09:00:00.000Z' }),
  person({ id: 'usr_b', email: 'b@example.test', createdAt: '2026-09-01T10:00:00.000Z' }),
  person({
    id: 'usr_c',
    email: 'c@example.test',
    createdAt: '2026-09-01T11:00:00.000Z',
    pipelineStage: 'invited',
    invitedAt: '2026-09-02T09:00:00.000Z',
  }),
]

/**
 * The lead this ticket is about: captured by a `contact-form` on the published
 * site, into a business whose owner is sitting on the Contacts pane.
 */
const ARRIVED = person({
  id: 'usr_lead',
  email: 'someone@example.test',
  createdAt: '2026-09-12T20:47:00.057Z',
})

/**
 * The transport, with the change feed as a driver the test pushes into.
 *
 * `opened` RECORDS EVERY SUBSCRIPTION AND ITS CURSOR, which is how the
 * business-switch and re-arm claims are made: what matters there is not only that
 * a feed exists but that the previous one was CLOSED and the next one opened at
 * the right position.
 */
function transportOver(rows: Person[] = PEOPLE, seq = '2026-09-01T11:00:00.000Z|usr_c') {
  const opened: Array<{ since: string; closed: boolean; push: (change: unknown) => void }> = []
  let lists = 0
  return {
    opened,
    get lists() {
      return lists
    },
    /** The live feed, or undefined before anything subscribed. */
    get feed() {
      return opened.find((o) => !o.closed)
    },
    list: async () => {
      lists += 1
      return {
        seq,
        people: rows.map((row) => ({ ...row })),
        canInvite: true,
        canFulfil: false,
        bounced: [],
      }
    },
    item: async (id: string) => ({
      person: { ...(rows.find((p) => p.id === id) ?? ARRIVED) },
      emails: [],
      operates: [],
      grants: [],
      events: [],
      provenance: null,
    }),
    messages: async () => ({ messages: [] }),
    saveRecord: async () => ({}),
    grant: async () => ({}),
    revoke: async () => {},
    add: async () => ({ created: true, person: ARRIVED }),
    inviteDraft: async () => ({ from: '', subject: '', body: '', declared: [] }),
    invite: async () => ({ results: [] }),
    fulfil: async () => ({}),
    subscribe: (since: string, onChange: (change: unknown) => void) => {
      const handle = { since, closed: false, push: onChange }
      opened.push(handle)
      return {
        close: () => {
          handle.closed = true
        },
      }
    },
  }
}

/** One frame, exactly as `streamContactChanges` writes it. */
function frame(row: Person): Record<string, unknown> {
  return { kind: 'contact', seq: `${row.createdAt}|${row.id}`, person: { ...row } }
}

beforeAll(async () => {
  if (WEBUI_INSTALLED) {
    ;({ createPeoplePanel } = await import('../apps/control-app/src/builder/people.js'))
  }
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as never
})

let root: HTMLElement
beforeEach(() => {
  document.body.replaceChildren()
  root = document.createElement('div')
  document.body.append(root)
})

type Panel = {
  element: HTMLElement
  refresh: () => Promise<unknown>
  clear: () => void
  destroy: () => void
}

/** A mounted pane over the fixture, already loaded and already subscribed. */
async function pane(transport = transportOver()) {
  const panel = createPeoplePanel({
    storage: memoryStorage(),
    transport,
  }) as unknown as Panel
  root.append(panel.element)
  await panel.refresh()
  await settle()
  return { panel, transport }
}

const rowsIn = (el: Element) => [...el.querySelectorAll('.builder-people__row')]
const emails = (el: Element) =>
  rowsIn(el).map((row) => row.querySelector('.builder-people__email')?.textContent)
const stages = (el: Element) =>
  rowsIn(el).map((row) => row.querySelector('.builder-people__stage')?.textContent)
const names = (el: Element) =>
  rowsIn(el).map((row) => row.querySelector('.builder-people__who')?.textContent)
const boxes = (el: Element) =>
  [...el.querySelectorAll('.builder-people__check')] as HTMLInputElement[]
const facet = (el: Element, axis: string) =>
  el.querySelector(`.builder-people__facet[data-axis="${axis}"]`) as HTMLSelectElement

/** Tick a row and let the panel react. */
async function tick(el: Element, index: number) {
  const box = boxes(el)[index]
  box.checked = true
  box.dispatchEvent(new Event('change', { bubbles: true }))
  await settle()
}

describe.skipIf(!WEBUI_INSTALLED)('REQ-233 — the pane subscribes on load', () => {
  it('test_UAT_FC_REQ-233_it_subscribes_from_the_cursor_the_list_read_returned', async () => {
    // NOT FROM "NOW", AND THE DIFFERENCE IS A LOST CONTACT. The origin reads the
    // cursor BEFORE it lists, so opening at that position is what makes a capture
    // landing between the load and the subscription arrive twice rather than
    // never — and applying it twice is idempotent.
    const { transport } = await pane()
    expect(transport.opened).toHaveLength(1)
    expect(transport.opened[0].since).toBe('2026-09-01T11:00:00.000Z|usr_c')
    expect(transport.opened[0].closed).toBe(false)
  })

  it('test_UAT_FC_REQ-233_a_pane_whose_transport_offers_no_feed_still_works', async () => {
    // THE DEGRADED PATH IS THE OLD BEHAVIOUR, NOT A BROKEN TAB. A browser with no
    // `EventSource` — and a suite injecting a transport to assert something else
    // entirely — gets the pane that redraws when the operator wrote, which is
    // exactly what this tab did before REQ-233.
    const bare = transportOver()
    const { subscribe: _dropped, ...withoutFeed } = bare
    const panel = createPeoplePanel({
      storage: memoryStorage(),
      transport: withoutFeed,
    }) as unknown as Panel
    root.append(panel.element)
    await panel.refresh()
    await settle()
    expect(rowsIn(panel.element)).toHaveLength(3)
  })

  it('test_UAT_FC_REQ-233_a_business_switch_closes_one_feed_and_opens_another', async () => {
    // A SUBSCRIPTION IS A READ IN A SCOPE. Left open across a switch it would
    // keep delivering the PREVIOUS business's contacts into a pane whose header
    // names another — so `clear` closes it and `refresh` opens the next one, both
    // inside the panel where they are true of every caller.
    const { panel, transport } = await pane()
    panel.clear()
    expect(transport.opened[0].closed).toBe(true)
    expect(transport.feed).toBeUndefined()

    await panel.refresh()
    await settle()
    expect(transport.opened).toHaveLength(2)
    expect(transport.feed).toBeTruthy()
  })

  it('test_UAT_FC_REQ-233_destroying_the_pane_closes_the_feed', async () => {
    // AN OPEN FEED OUTLIVING THE PANEL delivers into a torn-down component, and
    // holds a poll open at the origin for a reader that has gone.
    const { panel, transport } = await pane()
    panel.destroy()
    expect(transport.opened[0].closed).toBe(true)
  })
})

describe.skipIf(!WEBUI_INSTALLED)('REQ-233 — a contact arrives with no operator action', () => {
  it('test_UAT_FC_REQ-233_a_lead_captured_elsewhere_appears_without_a_reload', async () => {
    // THE CASE THIS TICKET IS ABOUT. `captureLead` wrote the row on the public
    // site; nothing about this pane, this tab or this operator was involved.
    const { panel, transport } = await pane()
    expect(emails(panel.element)).not.toContain('someone@example.test')

    transport.feed!.push(frame(ARRIVED))
    await settle()
    expect(emails(panel.element)).toContain('someone@example.test')
    // AND NOT BY RE-READING. A list read per frame would throw away the
    // selection, the open detail and the scroll on every arrival.
    expect(transport.lists).toBe(1)
  })

  it('test_UAT_FC_REQ-233_an_arriving_contact_joins_at_the_end_and_moves_nobody', async () => {
    // `created_at ASC` IS THE LIST'S ORDER, so a new contact joins at the end —
    // and the rows already on screen stay exactly where the operator left them.
    const { panel, transport } = await pane()
    const before = emails(panel.element)
    transport.feed!.push(frame(ARRIVED))
    await settle()
    expect(emails(panel.element)).toEqual([...before, 'someone@example.test'])
  })

  it('test_UAT_FC_REQ-233_a_contact_created_before_the_last_row_lands_in_its_own_place', async () => {
    // THE ORDER IS THE LIST'S AND NOT THE FEED'S. The feed is ordered by when a
    // row CHANGED; the list is ordered by when it was CREATED, and the two
    // disagree the moment a backdated or imported contact arrives. Inserting by
    // the list's own key is what keeps a re-read from reordering the pane.
    const { panel, transport } = await pane()
    transport.feed!.push(
      frame(
        person({
          id: 'usr_mid',
          email: 'mid@example.test',
          createdAt: '2026-09-01T09:30:00.000Z',
        }),
      ),
    )
    await settle()
    expect(emails(panel.element)).toEqual([
      'a@example.test',
      'mid@example.test',
      'b@example.test',
      'c@example.test',
    ])
  })

  it('test_UAT_FC_REQ-233_the_same_frame_twice_is_the_same_contact_once', async () => {
    // THE FEED IS ALLOWED TO REPEAT ITSELF. The origin reads from slightly behind
    // its cursor to survive clock skew, and a reconnect replays from the last id
    // the browser saw — so a frame the pane has already applied has to be a
    // patch, never a second row.
    const { panel, transport } = await pane()
    transport.feed!.push(frame(ARRIVED))
    transport.feed!.push(frame(ARRIVED))
    await settle()
    expect(emails(panel.element).filter((e) => e === 'someone@example.test')).toHaveLength(1)
  })
})

describe.skipIf(!WEBUI_INSTALLED)('REQ-233 — a change elsewhere reaches the row', () => {
  it('test_UAT_FC_REQ-233_a_stage_moved_elsewhere_replaces_the_stale_one', async () => {
    // A SECOND OPERATOR, OR THE SAME ONE IN ANOTHER TAB. The pane must not hold a
    // stale `pipelineStage` for a row somebody else moved.
    const { panel, transport } = await pane()
    expect(stages(panel.element)).toEqual(['Lead', 'Lead', 'Invited'])

    transport.feed!.push(
      frame(
        person({
          ...PEOPLE[0],
          pipelineStage: 'invited',
          invitedAt: '2026-09-12T21:00:00.000Z',
        }),
      ),
    )
    await settle()
    expect(stages(panel.element)).toEqual(['Invited', 'Lead', 'Invited'])
    expect(emails(panel.element)).toHaveLength(3)
  })

  it('test_UAT_FC_REQ-233_a_rename_made_elsewhere_reaches_the_row', async () => {
    // THE NAME IS ONE OF THE TWO FIELDS AN OPERATOR CAN EDIT, and it lives in a
    // different table from the row. It reaches the pane because the write stamps
    // the PERSON and not only the name — see `writeName`.
    const { panel, transport } = await pane()
    transport.feed!.push(
      frame(person({ ...PEOPLE[1], name: { displayName: 'Sarah Patel' } })),
    )
    await settle()
    expect(names(panel.element)[1]).toBe('Sarah Patel')
  })
})

describe.skipIf(!WEBUI_INSTALLED)('REQ-233 — the pane the operator left is the pane they get back', () => {
  it('test_UAT_FC_REQ-233_an_arrival_obeys_the_facet_that_is_currently_set', async () => {
    // NARROWED TO *INVITED*, AN ARRIVING LEAD DOES NOT APPEAR AND THEN VANISH.
    // The filter decides after the row is in the list, never on the way in —
    // filtering on the way in would make what is on screen depend on which facet
    // happened to be set when the frame arrived, and clearing it would then
    // reveal a stale list.
    const { panel, transport } = await pane()
    const stage = facet(panel.element, 'pipeline')
    stage.value = 'invited'
    stage.dispatchEvent(new Event('change', { bubbles: true }))
    await settle()
    expect(emails(panel.element)).toEqual(['c@example.test'])

    transport.feed!.push(frame(ARRIVED))
    await settle()
    expect(emails(panel.element)).toEqual(['c@example.test'])

    // AND IT IS IN THE LIST, not discarded. Clearing the facet reveals it,
    // because `all` is the business's contacts and the facet is a question asked
    // of them.
    stage.value = ''
    stage.dispatchEvent(new Event('change', { bubbles: true }))
    await settle()
    expect(emails(panel.element)).toContain('someone@example.test')
  })

  it('test_UAT_FC_REQ-233_a_tick_survives_an_arrival', async () => {
    // AN OPERATOR WHO HAS TICKED PEOPLE AND IS REACHING FOR *INVITE* DOES NOT
    // LOSE THE SELECTION BECAUSE SOMEBODY ELSE SIGNED UP. This is the failure a
    // wrongly-built live list produces, and it is silent: the boxes clear, the
    // button's count drops, and the operator sends to whoever is left.
    const { panel, transport } = await pane()
    await tick(panel.element, 0)
    await tick(panel.element, 2)
    const invite = panel.element.querySelector('.builder-people__invite') as HTMLButtonElement
    expect(invite.textContent).toBe('Invite 2')

    transport.feed!.push(frame(ARRIVED))
    await settle()
    expect(invite.textContent).toBe('Invite 2')
    expect(boxes(panel.element).map((b) => b.checked)).toEqual([true, false, true, false])
  })

  it('test_UAT_FC_REQ-233_an_update_to_a_ticked_row_keeps_the_tick', async () => {
    // THE ROW IS PATCHED IN PLACE AND THE SELECTION IS KEYED BY ID, so a change
    // to somebody the operator has already ticked leaves them ticked.
    const { panel, transport } = await pane()
    await tick(panel.element, 1)
    transport.feed!.push(
      frame(person({ ...PEOPLE[1], name: { displayName: 'Bee' } })),
    )
    await settle()
    expect(boxes(panel.element).map((b) => b.checked)).toEqual([false, true, false])
  })
})

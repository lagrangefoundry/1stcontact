// @vitest-environment jsdom
/**
 * BUG-54 — **Who they are: what may be edited, and that an edit lands**.
 *
 * WHAT THIS FILE PROVES, next to its origin sibling. That one proves the write
 * reaches the row and is refused when it should be; this one proves the two
 * halves of the bug as the operator met them — that seven of the nine fields no
 * longer offer a box at all, and that the two that do reach the transport rather
 * than being applied to a copy in the browser and forgotten.
 *
 * THE SILENT FAILURE IS THE POINT OF THE COMMIT CASES. The panel used to pass
 * `onSave`, which the fields component does not read; every edit was accepted by
 * the widget, shown as if saved, and went nowhere. Nothing threw, so a test that
 * only asserted "the cell shows what I typed" would have passed against the bug.
 * Every case here asserts on the TRANSPORT — what left the browser — and the
 * refusal cases assert it was NOT called, which is the same claim from the other
 * side.
 *
 * MOUNTED AGAINST THE ACTUALLY-INSTALLED COMPONENTS, on the pattern the REQ-186
 * suite established: the only double is the HTTP call, because that is the
 * network. A mocked `mountFields` would assert the mock, and the whole of this
 * bug lived in how this panel configures the real one.
 */

import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'
import { isEmailShape } from '../apps/control-app/src/builder/email-shape.js'

let createPeoplePanel: (opts?: Record<string, unknown>) => never

if (!WEBUI_INSTALLED) console.warn(`BUG-54 person-record suite skipped: ${WEBUI_SKIP_REASON}`)

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

interface Person {
  id: string
  email: string
  displayName: string | null
  status: string
  invitedAt: string | null
  firstSeenAt: string | null
  lastSeenAt: string | null
  termsAcceptedAt: string | null
  createdAt: string
}

const ALICE: Person = {
  id: 'usr_1',
  email: 'alice@example.test',
  displayName: 'Alice',
  status: 'active',
  invitedAt: '2026-09-01T10:00:00.000Z',
  firstSeenAt: '2026-09-02T10:00:00.000Z',
  lastSeenAt: '2026-09-03T10:00:00.000Z',
  termsAcceptedAt: '2026-09-02T10:05:00.000Z',
  createdAt: '2026-09-01T09:00:00.000Z',
}

/**
 * A transport over one in-memory business, recording every record write.
 *
 * IT NORMALISES THE WAY THE ORIGIN DOES — casefolds the address, trims the name,
 * empties to null. Not decoration: the panel puts the SAVED row back into the
 * widget precisely because the two can differ, and a double that echoed what it
 * was given would let a panel which skipped that step pass.
 */
function transportOver(row: Person = ALICE) {
  const person = { ...row }
  const saved: Array<Record<string, unknown>> = []
  let refuse: string | null = null
  return {
    saved,
    person,
    refuseWith(message: string | null) {
      refuse = message
    },
    list: async () => ({ people: [{ ...person }], canInvite: true, canFulfil: false }),
    item: async () => ({ person: { ...person }, operates: [], grants: [] }),
    saveRecord: async (id: string, patch: Record<string, unknown>) => {
      if (refuse) throw new Error(refuse)
      saved.push({ id, ...patch })
      if ('email' in patch) person.email = String(patch.email ?? '').trim().toLowerCase()
      if ('displayName' in patch) {
        person.displayName = String(patch.displayName ?? '').trim() || null
      }
      return { ...person }
    },
    grant: async () => ({}),
    revoke: async () => ({}),
    invite: async () => ({ created: true, person: { ...person } }),
    fulfil: async () => ({}),
  }
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

/** The panel, with one person's detail already open — every case starts here. */
async function openAlice(row: Person = ALICE) {
  const transport = transportOver(row)
  const panel = createPeoplePanel({ storage: memoryStorage(), transport })
  root.append(panel.element)
  await panel.refresh()
  panel.listDetail.select('usr_1')
  await settle()
  await settle()
  return { panel, transport }
}

const row = (name: string) =>
  root.querySelector(`.fields-row[data-field="${name}"]`) as HTMLElement | null
const cell = (name: string) => row(name)!.querySelector('.fields-value') as HTMLElement | null
const control = (name: string) =>
  row(name)!.querySelector('.fields-control') as HTMLInputElement | null
const errorOf = (name: string) =>
  (row(name)!.querySelector('.fields-error') as HTMLElement).textContent ?? ''

/** Type into a field and press Return — the component's confirm gesture. */
async function type(name: string, value: string) {
  ;(row(name)!.querySelector('.fields-value-editable') as HTMLElement).click()
  const input = control(name)!
  input.value = value
  input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }))
  await settle()
  await settle()
}

/**
 * Everything the system observed, and the two derived-or-separate fields beside
 * them. Listed rather than looped over `RECORD_FIELDS` deliberately: the claim is
 * about THESE nine names, so a schema that quietly dropped one must fail here
 * rather than shrink the assertion with it.
 */
const LOCKED = [
  'state',
  'status',
  'invitedAt',
  'firstSeenAt',
  'lastSeenAt',
  'termsAcceptedAt',
  'createdAt',
]

describe.skipIf(!WEBUI_INSTALLED)('BUG-54 — what Who they are offers', () => {
  it('test_UAT_FC_BUG-54_the_record_of_what_happened_offers_no_box_at_all', async () => {
    // The first half of the bug: `editable: true` at the mount made every field
    // editable, and the `{ editable: true }` written on one descriptor to narrow
    // it was a key the component never reads. An operator was being invited to
    // retype when somebody first signed in.
    await openAlice()
    for (const name of LOCKED) {
      expect(row(name), `${name} is not on the panel`).toBeTruthy()
      expect(row(name)!.classList.contains('is-locked'), `${name} is not locked`).toBe(true)
      expect(cell(name)!.classList.contains('fields-value-editable')).toBe(false)
      // AND CLICKING IT DOES NOTHING, which is the claim the class name only
      // stands in for: an affordance removed from CSS while the handler survived
      // would still open a box for anyone who clicked where it used to be.
      cell(name)!.click()
      await settle()
      expect(control(name), `${name} opened an editor`).toBeNull()
    }
  })

  it('test_UAT_FC_BUG-54_the_address_and_the_name_are_the_two_that_do', async () => {
    // The operator's own answer to who this person is, and the only place in the
    // product either can be corrected.
    //
    // ONE FRESH PANEL PER FIELD, and not one panel clicked twice: moving focus
    // out of an open control is the component's confirm gesture, so opening the
    // second field would commit the first — a real behaviour, and one that would
    // make this case about something other than what it says.
    for (const name of ['email', 'displayName']) {
      await openAlice()
      expect(cell(name)!.classList.contains('fields-value-editable'), name).toBe(true)
      cell(name)!.click()
      await settle()
      expect(control(name), `${name} opened no editor`).toBeTruthy()
      document.body.replaceChildren()
      root = document.createElement('div')
      document.body.append(root)
    }
  })
})

describe.skipIf(!WEBUI_INSTALLED)('BUG-54 — an edit leaves the browser', () => {
  it('test_UAT_FC_BUG-54_confirming_a_name_reaches_the_transport', async () => {
    // The second half of the bug, and the reason the assertion is on the
    // transport: the widget showed the typed value either way. What was missing
    // was the call.
    const { transport } = await openAlice()

    await type('displayName', 'Alice Smith')

    expect(transport.saved).toEqual([{ id: 'usr_1', displayName: 'Alice Smith' }])
    expect(transport.person.displayName).toBe('Alice Smith')
  })

  it('test_UAT_FC_BUG-54_one_field_is_sent_and_not_the_whole_record', async () => {
    // A patch, not a record. Sending everything back would rewrite the columns
    // the system observed with whatever copy this pane was holding — which is
    // the same falsification the locked fields exist to prevent, arriving by
    // the back door.
    const { transport } = await openAlice()

    await type('displayName', 'Alice Smith')

    expect(Object.keys(transport.saved[0]!).sort()).toEqual(['displayName', 'id'])
  })

  it('test_UAT_FC_BUG-54_the_address_that_is_shown_is_the_one_that_was_stored', async () => {
    // The origin casefolds, because the `(tenant_id, email)` index is byte-exact.
    // A pane left showing what was TYPED would disagree with the row, and with
    // the list drawn from the same server beside it.
    const { transport } = await openAlice()

    await type('email', 'Alice@Example.Test')

    expect(transport.saved).toEqual([{ id: 'usr_1', email: 'Alice@Example.Test' }])
    expect(cell('email')!.textContent).toBe('alice@example.test')
  })

  it('test_UAT_FC_BUG-54_a_refusal_rolls_the_cell_back_and_says_why', async () => {
    // The one thing the old code could not do at all. A commit that rejects is
    // how the origin's refusals — an address somebody else already holds — reach
    // the operator, and it must land beside the box rather than in a console.
    const { transport } = await openAlice()
    transport.refuseWith('Somebody in this business already has that address.')

    await type('email', 'taken@example.test')

    expect(cell('email')!.textContent).toBe('alice@example.test')
    expect(errorOf('email')).toContain('already has that address')
  })
})

describe.skipIf(!WEBUI_INSTALLED)('BUG-54 — an address is checked before it is sent', () => {
  // ONE `@`, AND AFTER IT AT LEAST ONE `.` SEPARATOR — the rule as specified.
  // Each of these fails a different clause of it, so a check that dropped one
  // clause cannot pass by satisfying the others.
  const MALFORMED = [
    ['no separator at all', 'alice.example.test'],
    ['no dot in the domain', 'alice@example'],
    ['two addresses pasted together', 'alice@a.test@b.test'],
    ['an empty first label', 'alice@.test'],
    ['an empty last label', 'alice@example.'],
    ['no local part', '@example.test'],
    ['a space inside', 'alice smith@example.test'],
  ] as const

  for (const [why, typed] of MALFORMED) {
    it(`test_UAT_FC_BUG-54_a_malformed_address_is_refused_inline_${why.replace(/\W+/g, '_')}`, async () => {
      const { transport } = await openAlice()

      await type('email', typed)

      // REFUSED, AND STILL OPEN. The component keeps the control up until the
      // value is valid, which is what lets the operator fix the typo in the box
      // they typed it into instead of starting again.
      expect(errorOf('email'), `"${typed}" was accepted`).not.toBe('')
      expect(control('email'), `"${typed}" closed the editor`).toBeTruthy()
      // AND NOTHING WAS SENT — the claim from the other side.
      expect(transport.saved).toEqual([])
      expect(transport.person.email).toBe('alice@example.test')
    })
  }

  it('test_UAT_FC_BUG-54_clearing_the_address_is_refused_rather_than_saved_as_nothing', async () => {
    // Validation is skipped for an empty value unless the field is required, so
    // without `required` an emptied box would sail past the shape check by never
    // reaching it — and a person with no address is one `admit` can never find.
    const { transport } = await openAlice()

    await type('email', '')

    expect(errorOf('email')).not.toBe('')
    expect(transport.saved).toEqual([])
  })

  it('test_UAT_FC_BUG-54_a_well_formed_address_is_sent', async () => {
    // The other side of every case above: the rule refuses typos and admits
    // addresses. `a@b.c` is the minimum the specification accepts.
    const { transport } = await openAlice()

    await type('email', 'a@b.c')

    expect(errorOf('email')).toBe('')
    expect(transport.saved).toEqual([{ id: 'usr_1', email: 'a@b.c' }])
  })

  it('test_UAT_FC_BUG-54_the_panel_and_the_origin_share_one_definition_of_an_address', async () => {
    // THE MODULE IS THE CLAIM, not the two copies agreeing today. `people.js`
    // and `people.ts` both import `isEmailShape`; asserting it directly is what
    // makes the shared rule itself evidence, and what would catch a second
    // regex growing beside it.
    expect(isEmailShape('a@b.c')).toBe(true)
    expect(isEmailShape('alice@example.test')).toBe(true)
    for (const [, typed] of MALFORMED) expect(isEmailShape(typed), typed).toBe(false)
    expect(isEmailShape('')).toBe(false)
    expect(isEmailShape(null)).toBe(false)
    // TRIMMED BUT NOT REPAIRED: surrounding space is a paste artifact, space
    // inside means the box holds something other than one address.
    expect(isEmailShape('  a@b.c  ')).toBe(true)
  })
})

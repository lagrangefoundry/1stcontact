// @vitest-environment jsdom
/**
 * REQ-186 — **the invite control on the User tab**.
 *
 * WHAT THIS FILE PROVES, next to its origin sibling. That one proves the row and
 * the gate; this one proves the operator can reach them: that the control is on
 * the uniform tab rather than in a platform console, that it appears on *you own
 * this business* and not on *you are 1st Contact*, that it says out loud that no
 * message is sent, and that a contact promoted is reported as a promotion rather
 * than as a new person.
 *
 * MOUNTED AGAINST THE ACTUALLY-INSTALLED COMPONENTS, on the pattern the REQ-161
 * suite established: the only double is the HTTP call, because that is the
 * network. A mocked `list-detail` would assert the mock, and the claim here is
 * about a control that lives among this tab's real ones.
 */

import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'

let createPeoplePanel: (opts?: Record<string, unknown>) => never

if (!WEBUI_INSTALLED) console.warn(`REQ-186 invite-control suite skipped: ${WEBUI_SKIP_REASON}`)

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

const person = (over: Partial<Person> & { id: string; email: string }): Person => ({
  displayName: null,
  status: 'active',
  invitedAt: '2026-09-01T10:00:00.000Z',
  firstSeenAt: null,
  lastSeenAt: null,
  termsAcceptedAt: null,
  createdAt: '2026-09-01T09:00:00.000Z',
  ...over,
})

/**
 * A transport over an in-memory business, recording what was invited through it.
 *
 * IT IMPLEMENTS THE TRANSITION rather than always appending, because that is the
 * behaviour the control has to REPORT — a promoted contact and a new person are
 * two different sentences, and a double that always created would let a panel
 * that always said "is invited" pass.
 */
function transportOver(people: Person[], canInvite = true, canFulfil = false) {
  const rows = people.map((p) => ({ ...p }))
  const invited: Array<{ email: string; displayName: string | null }> = []
  const provisioned: Array<{ accountEmail: string; name: string }> = []
  return {
    invited,
    provisioned,
    rows,
    list: async () => ({ people: rows.map((p) => ({ ...p })), canInvite, canFulfil }),
    item: async (id: string) => ({
      person: { ...rows.find((p) => p.id === id)! },
      operates: [],
      grants: [],
    }),
    saveStatus: async (id: string, status: string) => {
      const row = rows.find((p) => p.id === id)!
      row.status = status
      return { ...row }
    },
    grant: async () => ({}),
    revoke: async () => ({}),
    fulfil: async (accountEmail: string, name: string) => {
      provisioned.push({ accountEmail, name })
      return { businessId: 'acct_1', name, siteSlug: 'acct_1' }
    },
    invite: async (email: string, displayName: string | null) => {
      const normalised = String(email ?? '').trim().toLowerCase()
      if (normalised === '') throw new Error('An invite needs an email address.')
      invited.push({ email: normalised, displayName })
      const existing = rows.find((p) => p.email === normalised)
      if (existing) {
        existing.invitedAt ??= '2026-09-02T10:00:00.000Z'
        return { created: false, person: { ...existing } }
      }
      const made = person({
        id: `usr_${rows.length + 1}`,
        email: normalised,
        displayName: displayName || null,
      })
      rows.push(made)
      return { created: true, person: { ...made } }
    },
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

const EXISTING = [
  person({ id: 'usr_1', email: 'alice@example.test', displayName: 'Alice' }),
  // A CONTACT: known here, never invited, and MAY become a member ([[DOC-42]] §4).
  person({ id: 'usr_2', email: 'contact@example.test', invitedAt: null }),
]

async function panelOver(canInvite = true, canFulfil = false) {
  const transport = transportOver(EXISTING, canInvite, canFulfil)
  const panel = createPeoplePanel({ storage: memoryStorage(), transport })
  root.append(panel.element)
  await panel.refresh()
  return { panel, transport }
}

const inviteButton = () =>
  root.querySelector('.builder-people__invite') as HTMLButtonElement | null
// THE LAST ONE, because the invite dialog stays open over a refusal (which is
// deliberate — see the refusal case) and a test that closed it to make a
// selector work would be testing a flow no operator takes.
const dialog = () =>
  ([...root.querySelectorAll('.builder-modal')].at(-1) ?? null) as HTMLElement | null
const field = (cls: string) => root.querySelector(`.${cls}`) as HTMLInputElement
const said = () => root.querySelector('.builder-people__invite-said') as HTMLElement

async function invite(email: string, name = '') {
  inviteButton()!.click()
  field('builder-people__invite-email').value = email
  field('builder-people__invite-name').value = name
  const buttons = [...dialog()!.querySelectorAll('button')] as HTMLButtonElement[]
  buttons.find((b) => b.textContent === 'Invite')!.click()
  await settle()
  await settle()
}

describe.skipIf(!WEBUI_INSTALLED)('REQ-186 — the invite is a control on the uniform tab', () => {
  it('test_UAT_FC_REQ-186_the_invite_sits_with_the_list_controls_and_not_in_a_persons_detail', async () => {
    // IT MAKES A PERSON, so it cannot hang off one. The detail pane edits somebody
    // who already exists; this is the list's own action. Asserted by containment
    // rather than by class name alone, because "there is a button somewhere" is
    // not the claim.
    await panelOver()
    const controls = root.querySelector('.builder-people__filter')
    expect(controls?.contains(inviteButton())).toBe(true)
    expect(inviteButton()!.hidden).toBe(false)
  })

  it('test_UAT_FC_REQ-186_the_control_is_absent_for_someone_who_does_not_own_this_business', async () => {
    // `canInvite` is [[DOC-42]] §7 condition 1 — *you own this business* — and the
    // panel renders on it. NOT RENDERING IT IS NOT THE GATE: the origin asks the
    // same question again for itself, which its own suite proves.
    await panelOver(false)
    expect(inviteButton()!.hidden).toBe(true)
  })

  it('test_UAT_FC_REQ-186_the_control_is_not_the_fulfilment_control', async () => {
    // The two flags are two conditions, and this is the panel half of that: a
    // business owner who is not 1st Contact gets the invite and not the
    // provisioning control. Collapsing them is what would foreclose level 2.
    const { panel } = await panelOver(true, false)
    expect(inviteButton()!.hidden).toBe(false)
    // The fulfilment control is rendered into a person's DETAIL, so it is looked
    // for after opening one — which also asserts that the pane renders at all.
    panel.listDetail.select('usr_1')
    await settle()
    const detail = root.querySelector('.list-detail-detail-body')!
    expect(detail.querySelector('.builder-people__detail'), 'the detail pane is empty').toBeTruthy()
    expect(detail.textContent).toContain('Who they are')
    expect(detail.querySelector('.builder-people__fulfil')).toBeNull()
  })

  it('test_UAT_FC_REQ-186_the_dialog_says_no_message_is_sent', async () => {
    // PART OF THE FEATURE, not decoration. There is no sender in this system, so
    // an operator who reads "Invite" and is told nothing will assume a message
    // went out and will not check.
    await panelOver()
    inviteButton()!.click()
    const hint = root.querySelector('.builder-people__invite-hint')
    expect(hint?.textContent ?? '').toMatch(/no message is sent/i)
  })
})

describe.skipIf(!WEBUI_INSTALLED)('REQ-186 — what the operator is told', () => {
  it('test_UAT_FC_REQ-186_inviting_a_new_address_adds_them_to_the_list', async () => {
    const { transport } = await panelOver()

    await invite('bob@example.test', 'Bob')

    expect(transport.invited).toEqual([{ email: 'bob@example.test', displayName: 'Bob' }])
    expect(said().hidden).toBe(false)
    expect(said().textContent).toContain('bob@example.test')
    // The list is RE-READ rather than patched locally: the row that matters is the
    // one the business actually holds, and a list mutated client-side would
    // diverge from it the first time the origin decided something different.
    const listed = [...root.querySelectorAll('.builder-people__who')].map((n) => n.textContent)
    expect(listed).toContain('Bob')
  })

  it('test_UAT_FC_REQ-186_promoting_a_contact_is_reported_as_a_promotion', async () => {
    // The transition made visible ([[DOC-42]] §9). It is the same row moving
    // between two states, and saying so at the moment it happens is the only
    // place that movement is legible anywhere in the product.
    await panelOver()

    await invite('contact@example.test')

    expect(said().textContent).toMatch(/already known/i)
    // And the row now reads as INVITED — not Member ([[REQ-188]]). The invite
    // moves a contact one step; the person completes the journey themselves by
    // accepting the terms, and neither of these two rows has.
    const states = [...root.querySelectorAll('.builder-people__state')].map((n) => n.textContent)
    expect(states).toEqual(['Invited', 'Invited'])
  })

  it('test_UAT_FC_REQ-186_a_refusal_is_put_in_front_of_the_operator', async () => {
    // A failed invite must not close the dialog silently and leave the operator
    // believing it worked. The sentence the origin sent is what is shown, because
    // 403 and 400 mean different things and a number does not say which.
    await panelOver()

    await invite('   ')

    expect(said().hidden).toBe(false)
    expect(said().textContent).toContain('needs an email address')
    expect(dialog(), 'the dialog closed over a refusal').not.toBeNull()
  })
})

describe.skipIf(!WEBUI_INSTALLED)('REQ-186 — the two controls compose', () => {
  it('test_UAT_FC_REQ-186_invite_plus_provision_is_what_makes_a_level_one_customer', async () => {
    // [[DOC-42]] §1's sequence, on the tab that performs it. Invite alone makes a
    // member of this business — a level-2 customer with a portal. Invite and then
    // provision makes a level-1 customer, who also gets the app. That is
    // `provisionInvite` decomposed into the two steps §9 describes, and the
    // decomposition is only real if BOTH controls are reachable.
    const { panel, transport } = await panelOver(true, true)

    await invite('alice@plumbing.test', 'Alice')
    expect(transport.invited).toEqual([{ email: 'alice@plumbing.test', displayName: 'Alice' }])
    // Done with the invite; the operator closes it and goes to the person.
    ;([...dialog()!.querySelectorAll('button')] as HTMLButtonElement[])
      .find((b) => b.textContent === 'Close')!
      .click()

    const invitee = transport.rows.find((p) => p.email === 'alice@plumbing.test')!
    panel.listDetail.select(invitee.id)
    await settle()

    const fulfil = root.querySelector('.builder-people__fulfil') as HTMLButtonElement
    expect(fulfil, 'the fulfilment control did not render for a caller who may fulfil').toBeTruthy()
    fulfil.click()
    field('builder-people__fulfil-name').value = "Alice's Plumbing"
    const buttons = [...dialog()!.querySelectorAll('button')] as HTMLButtonElement[]
    buttons.find((b) => b.textContent === 'Provision')!.click()
    await settle()
    await settle()

    // THE ACCOUNT IS TAKEN FROM THE ROW, not retyped: a dialog asking the
    // operator to re-enter an address they are looking at invites a typo into a
    // `tenants` row, which is permanent and appears in R2 keys.
    expect(transport.provisioned).toEqual([
      { accountEmail: 'alice@plumbing.test', name: "Alice's Plumbing" },
    ])
  })
})

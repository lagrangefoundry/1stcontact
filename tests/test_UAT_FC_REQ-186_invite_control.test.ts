// @vitest-environment jsdom
/**
 * REQ-186 — **the invite control on the User tab**.
 *
 * WHAT THIS FILE PROVES, next to its origin sibling. That one proves the row and
 * the gate; this one proves the operator can reach them: that the control is on
 * the uniform tab rather than in a platform console, that it appears on *you own
 * this business* and not on *you are 1st Contact*, that a refusal is put in
 * front of the operator rather than swallowed, and that invite-then-provision
 * composes into a level-one customer.
 *
 * TWO OF ITS CASES WERE SUPERSEDED BY [[REQ-199]] AND ARE GONE. The dialog used
 * to promise that *no message is sent* and the invite used to CREATE a contact
 * from an address typed into it; both were true and neither is now. Inviting
 * sends real mail, and adding is the `+` control's own act — so the two cases
 * that pinned the old behaviour were removed rather than adjusted, and
 * `test_UAT_FC_REQ-199_contacts_tab` carries what replaced them.
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


/**
 * A name record, as the origin reports one ([[REQ-193]]).
 *
 * THE PANEL READS `person.name` — a name is a row now, and the displayed value
 * is one field of it.
 */
interface PersonName {
  id: string
  displayName: string
  knownAs: string | null
  title: string | null
  givenName: string | null
  middleNames: string | null
  familyName: string | null
  suffix: string | null
  createdAt: string
  updatedAt: string
}

const named = (displayName: string): PersonName => ({
  id: `nam_${displayName.replace(/\W+/g, '_')}`,
  displayName,
  knownAs: null,
  title: null,
  givenName: null,
  middleNames: null,
  familyName: null,
  suffix: null,
  createdAt: '2026-09-01T09:00:00.000Z',
  updatedAt: '2026-09-01T09:00:00.000Z',
})

interface Person {
  id: string
  email: string
  name: PersonName | null
  formerNames: string[]
  status: string
  invitedAt: string | null
  firstSeenAt: string | null
  lastSeenAt: string | null
  termsAcceptedAt: string | null
  pipelineStage: string
  createdAt: string
}

const person = (over: Partial<Person> & { id: string; email: string }): Person => ({
  name: null,
  formerNames: [],
  status: 'active',
  invitedAt: '2026-09-01T10:00:00.000Z',
  firstSeenAt: null,
  lastSeenAt: null,
  termsAcceptedAt: null,
  pipelineStage: 'invited',
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
  const invited: Array<{ ids: string[]; subject: string; body: string }> = []
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
    // ADD IS ITS OWN CALL SINCE [[REQ-199]], and it leaves the pipeline at Lead.
    add: async (email: string, displayName: string | null) => {
      const normalised = String(email ?? '').trim().toLowerCase()
      if (normalised === '') throw new Error('A contact needs an email address.')
      const existing = rows.find((p) => p.email === normalised)
      if (existing) return { created: false, person: { ...existing } }
      const made = person({
        id: `usr_${rows.length + 1}`,
        email: normalised,
        name: displayName ? named(displayName) : null,
        pipelineStage: 'lead',
        invitedAt: null,
      })
      rows.push(made)
      return { created: true, person: { ...made } }
    },
    inviteDraft: async () => ({
      from: 'no-reply@example.test',
      subject: 'Your invitation',
      body: '<p><a href="{{cta_url}}">Accept</a></p>',
      declared: ['cta_url'],
      templateKey: 'invite',
      templateUid: 'tkt_invite',
    }),
    // IT MOVES ROWS THAT EXIST rather than appending, because that is the
    // behaviour the control has to REPORT — and a double that created would let
    // a panel that still took an address pass.
    invite: async (ids: string[], subject: string, body: string) => {
      if (!Array.isArray(ids) || ids.length === 0) {
        throw new Error('Nobody was selected, so there is nobody to invite.')
      }
      invited.push({ ids: [...ids], subject, body })
      return {
        results: ids.map((id) => {
          const row = rows.find((p) => p.id === id)
          if (!row) return { contactId: id, who: id, to: null, status: 'refused', reason: 'gone' }
          // Both, as the origin writes them ([[REQ-188]]): the stamp is kept and
          // the stage is assigned.
          row.invitedAt ??= '2026-09-02T10:00:00.000Z'
          row.pipelineStage = 'invited'
          return { contactId: id, who: row.email, to: row.email, status: 'sent', reason: null }
        }),
      }
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
  person({ id: 'usr_1', email: 'alice@example.test', name: named('Alice') }),
  // A LEAD: known here, never invited, and MAY become a member ([[DOC-44]] §4).
  person({
    id: 'usr_2',
    email: 'contact@example.test',
    invitedAt: null,
    pipelineStage: 'lead',
  }),
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
/** Add a contact through the `+` control ([[REQ-199]]). */
async function add(email: string, name = '') {
  ;(root.querySelector('.builder-people__add') as HTMLButtonElement).click()
  await settle()
  field('builder-people__add-email').value = email
  field('builder-people__add-name').value = name
  const buttons = [...dialog()!.querySelectorAll('button')] as HTMLButtonElement[]
  buttons.find((b) => b.textContent === 'Add')!.click()
  await settle()
  await settle()
  buttons.find((b) => b.textContent === 'Close')!.click()
  await settle()
}

/**
 * Tick the rows and press Invite — the gesture the tab performs since
 * [[REQ-199]].
 *
 * IT IS A SELECTION AND NOT A FORM. The dialog composes a message over whoever
 * is checked; there is no address to type into it, because creating a contact is
 * the `+` control's own act on its own path.
 */
async function invite(...labels: string[]) {
  // ROWS ARE FOUND BY THEIR CHECKBOX'S ACCESSIBLE NAME, which is how an operator
  // finds them too: the person's name if they have one, else their address.
  for (const label of labels) {
    const target = ([...root.querySelectorAll('.builder-people__check')] as HTMLInputElement[]).find(
      (node) => (node.getAttribute('aria-label') ?? '').includes(label),
    )
    if (!target) throw new Error(`no row is checkable for ${label}`)
    target.checked = true
    target.dispatchEvent(new Event('change', { bubbles: true }))
  }
  await settle()
  inviteButton()!.click()
  await settle()
  await settle()
  const buttons = [...dialog()!.querySelectorAll('button')] as HTMLButtonElement[]
  buttons.find((b) => (b.textContent ?? '').startsWith('Send'))!.click()
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

})

describe.skipIf(!WEBUI_INSTALLED)('REQ-186 — what the operator is told', () => {
  it('test_UAT_FC_REQ-186_inviting_a_contact_is_reported_and_moves_them_along_the_pipeline', async () => {
    // The transition made visible ([[DOC-42]] §9). It is the same row moving
    // along one axis, and saying so at the moment it happens is the only place
    // that movement is legible anywhere in the product.
    //
    // SINCE [[REQ-199]] THE GESTURE IS A SELECTION: the operator ticks the rows
    // and presses Invite, and what goes up is a list of ids rather than an
    // address typed into a form.
    const { transport } = await panelOver()

    await invite('contact@example.test')

    expect(transport.invited).toHaveLength(1)
    expect(transport.invited[0].ids).toEqual(['usr_2'])
    // The list is RE-READ rather than patched locally: the row that matters is
    // the one the business actually holds, and a list mutated client-side would
    // diverge from it the first time the origin decided something different.
    // Both rows read as INVITED on the pipeline axis ([[REQ-188]], [[DOC-44]]
    // §3) — `usr_1` was already, `usr_2` has just moved — and the invite touches
    // access not at all, so neither carries a member badge.
    const stages = [...root.querySelectorAll('.builder-people__stage')].map((n) => n.textContent)
    expect(stages).toEqual(['Invited', 'Invited'])
    expect(root.querySelectorAll('.builder-people__access')).toHaveLength(0)
  })

  it('test_UAT_FC_REQ-186_a_refusal_is_put_in_front_of_the_operator', async () => {
    // A failed invite must not close the dialog silently and leave the operator
    // believing it worked. The sentence the origin sent is what is shown, because
    // 403 and 400 mean different things and a number does not say which.
    const { panel } = await panelOver()
    void panel

    // Ticked, then the row disappears from under the selection — which is what a
    // stale client looks like from the server's side, and the refusal it earns.
    const box = root.querySelector('.builder-people__check') as HTMLInputElement
    box.checked = true
    box.dispatchEvent(new Event('change', { bubbles: true }))
    await settle()
    inviteButton()!.click()
    await settle()
    await settle()
    const buttons = [...dialog()!.querySelectorAll('button')] as HTMLButtonElement[]
    const send = buttons.find((b) => (b.textContent ?? '').startsWith('Send'))!
    // The list changes underneath: the selection now names nobody the server
    // will accept, which is the shape of every refusal this dialog can meet.
    ;(root.querySelector('.builder-people__check') as HTMLInputElement).checked = false
    send.click()
    await settle()
    await settle()

    expect(said().hidden).toBe(false)
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

    // THREE STEPS SINCE [[REQ-199]], not two, and the first one is the point:
    // adding is what makes a person, and inviting is what asks them in.
    await add('alice@plumbing.test')
    const added = transport.rows.find((p) => p.email === 'alice@plumbing.test')!
    await invite('alice@plumbing.test')
    expect(transport.invited.at(-1)?.ids).toEqual([added.id])
    // Done with the invite; the operator closes it and goes to the person.
    ;([...dialog()!.querySelectorAll('button')] as HTMLButtonElement[])
      .find((b) => b.textContent === 'Close')!
      .click()
    await settle()

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

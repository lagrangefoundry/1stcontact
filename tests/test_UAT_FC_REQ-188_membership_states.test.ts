// @vitest-environment jsdom
/**
 * REQ-188 — **the three states on the User tab**.
 *
 * WHAT THIS FILE PROVES, next to its workers sibling. That one proves the two
 * transitions against real rows driven through real routes; this one proves what
 * the operator is shown: that a row carries one of THREE labels rather than two,
 * that the facet can reach each of them — the middle one especially, since "who
 * did I ask who never came" is the question the third state exists to make
 * askable — and that the invite dialog does not promise a membership it cannot
 * confer.
 *
 * MOUNTED AGAINST THE ACTUALLY-INSTALLED COMPONENTS, on the pattern the REQ-186
 * suite established: the only double is the HTTP call, because that is the
 * network. A mocked `list-detail` would assert the mock, and the claim here is
 * about labels among this tab's real rows.
 */

import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'
import { stateOf } from '../apps/control-app/src/builder/people-state.js'

let createPeoplePanel: (opts?: Record<string, unknown>) => never

if (!WEBUI_INSTALLED) console.warn(`REQ-188 states suite skipped: ${WEBUI_SKIP_REASON}`)

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
  invitedAt: null,
  firstSeenAt: null,
  lastSeenAt: null,
  termsAcceptedAt: null,
  createdAt: '2026-09-01T09:00:00.000Z',
  ...over,
})

/** One of each: never asked, asked and not come, signed up. */
const CONTACT = person({ id: 'usr_1', email: 'contact@example.test', displayName: 'Cara' })
const INVITED = person({
  id: 'usr_2',
  email: 'invited@example.test',
  displayName: 'Ivan',
  invitedAt: '2026-09-01T10:00:00.000Z',
})
const MEMBER = person({
  id: 'usr_3',
  email: 'member@example.test',
  displayName: 'Mena',
  invitedAt: '2026-09-01T10:00:00.000Z',
  // Seen BEFORE they accepted, which is the ordinary case: `admit` stamps
  // `first_seen_at` on the first request through the door and the terms gate runs
  // after it. Only the acceptance makes them a member.
  firstSeenAt: '2026-09-02T09:00:00.000Z',
  termsAcceptedAt: '2026-09-02T09:00:01.000Z',
})

/**
 * A transport over an in-memory business.
 *
 * ACCEPTING THE TERMS IS MODELLED AS SOMETHING THAT HAPPENS OUT THERE — a method
 * that stamps the row without any panel call — because that is precisely the
 * claim: the second transition takes no operator action, so the panel's only part
 * in it is to re-read and redraw.
 */
function transportOver(people: Person[]) {
  const rows = people.map((p) => ({ ...p }))
  return {
    rows,
    list: async () => ({ people: rows.map((p) => ({ ...p })), canInvite: true, canFulfil: false }),
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
    fulfil: async () => ({ businessId: 'acct_1', name: 'x', siteSlug: 'acct_1' }),
    /** They sign up somewhere else entirely. Nothing on this tab is called. */
    theyAcceptTheTerms: (email: string) => {
      rows.find((p) => p.email === email)!.termsAcceptedAt = '2026-09-03T12:00:00.000Z'
    },
    invite: async (email: string, displayName: string | null) => {
      const normalised = String(email ?? '').trim().toLowerCase()
      if (normalised === '') throw new Error('An invite needs an email address.')
      const existing = rows.find((p) => p.email === normalised)
      if (existing) {
        existing.invitedAt ??= '2026-09-02T10:00:00.000Z'
        return { created: false, person: { ...existing } }
      }
      const made = person({
        id: `usr_${rows.length + 1}`,
        email: normalised,
        displayName: displayName || null,
        invitedAt: '2026-09-02T10:00:00.000Z',
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

async function panelOver(people: Person[] = [CONTACT, INVITED, MEMBER]) {
  const transport = transportOver(people)
  const panel = createPeoplePanel({ storage: memoryStorage(), transport })
  root.append(panel.element)
  await panel.refresh()
  return { panel, transport }
}

const labels = () =>
  [...root.querySelectorAll('.builder-people__state')].map((n) => n.textContent)
const who = () => [...root.querySelectorAll('.builder-people__who')].map((n) => n.textContent)
const facet = () => root.querySelector('.builder-people__states') as HTMLSelectElement
const said = () => root.querySelector('.builder-people__invite-said') as HTMLElement

async function chooseState(value: string) {
  facet().value = value
  facet().dispatchEvent(new Event('change'))
  await settle()
}

describe.skipIf(!WEBUI_INSTALLED)('REQ-188 — the tab shows three states', () => {
  it('test_UAT_FC_REQ-188_a_row_reads_contact_invited_or_member_by_its_two_markers', async () => {
    // The acceptance, on screen: three people, three different words. Under the
    // old model the second and third both read "Member" and the funnel the
    // operator needs was invisible.
    await panelOver()
    expect(labels()).toEqual(['Contact', 'Invited', 'Member'])
  })

  it('test_UAT_FC_REQ-188_the_facet_reaches_the_middle_state', async () => {
    // THE ONE WORTH ACTING ON. Two states collapsed the funnel; three show it, and
    // a state a row can display but the filter cannot select would show it without
    // making it usable. Asserted for all three, because the facet is built from
    // the same list the label is derived from and either could drift alone.
    await panelOver()

    await chooseState('Invited')
    expect(who()).toEqual(['Ivan'])

    await chooseState('Contact')
    expect(who()).toEqual(['Cara'])

    await chooseState('Member')
    expect(who()).toEqual(['Mena'])

    await chooseState('')
    expect(who()).toEqual(['Cara', 'Ivan', 'Mena'])
  })

  it('test_UAT_FC_REQ-188_inviting_a_contact_moves_them_to_invited_and_not_to_member', async () => {
    // The operator's transition, and its ceiling. The row moves one step and the
    // sentence they are shown says so — an invite that reported a membership
    // would be the old two-state model surviving in the place they actually read.
    await panelOver()

    const invite = root.querySelector('.builder-people__invite') as HTMLButtonElement
    invite.click()
    ;(root.querySelector('.builder-people__invite-email') as HTMLInputElement).value =
      'contact@example.test'
    const dialog = [...root.querySelectorAll('.builder-modal')].at(-1) as HTMLElement
    ;([...dialog.querySelectorAll('button')] as HTMLButtonElement[])
      .find((b) => b.textContent === 'Invite')!
      .click()
    await settle()
    await settle()

    expect(labels()).toEqual(['Invited', 'Invited', 'Member'])
    expect(said().textContent).toMatch(/invited/i)
    expect(said().textContent, 'the invite claimed to make a member').not.toMatch(/member/i)
  })

  it('test_UAT_FC_REQ-188_accepting_the_terms_moves_them_to_member_with_no_operator_action', async () => {
    // THE SECOND TRANSITION IS NOT THE OPERATOR'S. The row is stamped out there,
    // by the person themselves; the panel's whole part is to re-read and redraw,
    // and no control on this tab is touched between the two assertions.
    const { panel, transport } = await panelOver()
    expect(labels()).toEqual(['Contact', 'Invited', 'Member'])

    transport.theyAcceptTheTerms('invited@example.test')
    await panel.refresh()

    expect(labels()).toEqual(['Contact', 'Member', 'Member'])
  })

  it('test_UAT_FC_REQ-188_the_dialog_does_not_promise_a_membership_the_button_cannot_confer', async () => {
    // PART OF THE FEATURE, in the same way "no message is sent" is. The operator
    // is told what the button actually does — marks them invited — and what has
    // to happen next, by whom, for that to become a membership.
    await panelOver()
    ;(root.querySelector('.builder-people__invite') as HTMLButtonElement).click()

    const hint = root.querySelector('.builder-people__invite-hint')?.textContent ?? ''
    expect(hint).toMatch(/invited/i)
    expect(hint).toMatch(/accept the terms/i)
    expect(hint, 'the hint still says the invite makes a member').not.toMatch(
      /become a member here/i,
    )
  })

  it('test_UAT_FC_REQ-188_the_membership_rule_has_one_definition', async () => {
    // ONE ANSWER, NOT TWO. The panel re-exports the derivation rather than
    // carrying a copy, which is what lets the workers sibling assert the same
    // rule against real rows. Two derivations would be two answers free to
    // disagree about who is a member, in the one place a legal fact is surfaced.
    const { panel } = await panelOver()
    expect(panel.stateOf).toBe(stateOf)
    expect(stateOf(MEMBER)).toBe('Member')
    expect(stateOf(INVITED)).toBe('Invited')
    expect(stateOf(CONTACT)).toBe('Contact')
  })
})

// @vitest-environment jsdom
/**
 * REQ-188 — **the two axes on the User tab** ([[DOC-44]] §3).
 *
 * WHAT THIS FILE PROVES, next to its workers sibling. That one proves the two
 * transitions against real rows driven through real routes; this one proves what
 * the operator is SHOWN: that a row draws its pipeline stage and its membership
 * as two separate things, that there are two facets rather than one and that
 * narrowing on both at once is what makes the operator's two real questions
 * askable — *who did I ask who never came*, and *who signed up that I never
 * asked* — and that the invite dialog does not promise a membership it cannot
 * confer.
 *
 * THE SECOND OF THOSE QUESTIONS IS THE ONE THAT KILLED THE EARLIER FIX. It is a
 * conjunction across the two axes, so no single facet over a merged list of
 * values can express it, however many values that list is given.
 *
 * MOUNTED AGAINST THE ACTUALLY-INSTALLED COMPONENTS, on the pattern the REQ-186
 * suite established: the only double is the HTTP call, because that is the
 * network. A mocked `list-detail` would assert the mock, and the claim here is
 * about labels among this tab's real rows.
 */

import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'
import { accessOf, stageOf } from '../apps/control-app/src/builder/people-axes.js'

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
  pipelineStage: string
  createdAt: string
}

const person = (over: Partial<Person> & { id: string; email: string }): Person => ({
  displayName: null,
  status: 'active',
  invitedAt: null,
  firstSeenAt: null,
  lastSeenAt: null,
  termsAcceptedAt: null,
  pipelineStage: 'lead',
  createdAt: '2026-09-01T09:00:00.000Z',
  ...over,
})

/**
 * FOUR PEOPLE, BECAUSE TWO AXES HAVE FOUR CORNERS ([[DOC-44]] §3) — and the two
 * the earlier three-value model could not draw are the last two here.
 */
const LEAD = person({ id: 'usr_1', email: 'lead@example.test', displayName: 'Cara' })
const INVITED = person({
  id: 'usr_2',
  email: 'invited@example.test',
  displayName: 'Ivan',
  invitedAt: '2026-09-01T10:00:00.000Z',
  pipelineStage: 'invited',
})
const INVITED_MEMBER = person({
  id: 'usr_3',
  email: 'member@example.test',
  displayName: 'Mena',
  invitedAt: '2026-09-01T10:00:00.000Z',
  pipelineStage: 'invited',
  // Seen BEFORE they accepted, which is the ordinary case: `admit` stamps
  // `first_seen_at` on the first request through the door and the terms gate runs
  // after it. Only the acceptance makes them a member.
  firstSeenAt: '2026-09-02T09:00:00.000Z',
  termsAcceptedAt: '2026-09-02T09:00:01.000Z',
})
/** Signed up without this business ever asking: a member, and still a lead. */
const SELF_SERVED = person({
  id: 'usr_4',
  email: 'self@example.test',
  displayName: 'Sam',
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
        // THE STAMP IS KEPT AND THE STAGE IS ASSIGNED, which is what the origin
        // does ([[REQ-188]]): `invited_at` records when, the stage records where.
        existing.invitedAt ??= '2026-09-02T10:00:00.000Z'
        existing.pipelineStage = 'invited'
        return { created: false, person: { ...existing } }
      }
      const made = person({
        id: `usr_${rows.length + 1}`,
        email: normalised,
        displayName: displayName || null,
        invitedAt: '2026-09-02T10:00:00.000Z',
        pipelineStage: 'invited',
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

async function panelOver(people: Person[] = [LEAD, INVITED, INVITED_MEMBER, SELF_SERVED]) {
  const transport = transportOver(people)
  const panel = createPeoplePanel({ storage: memoryStorage(), transport })
  root.append(panel.element)
  await panel.refresh()
  return { panel, transport }
}

const stages = () =>
  [...root.querySelectorAll('.builder-people__stage')].map((n) => n.textContent)
const members = () =>
  [...root.querySelectorAll('.builder-people__access')].map((n) => n.textContent)
const who = () => [...root.querySelectorAll('.builder-people__who')].map((n) => n.textContent)
const facet = (axis: string) =>
  root.querySelector(`.builder-people__facet[data-axis="${axis}"]`) as HTMLSelectElement
const said = () => root.querySelector('.builder-people__invite-said') as HTMLElement

/** Narrow one axis. `''` is no opinion on it, which is what an empty facet means. */
async function choose(axis: string, value: string) {
  facet(axis).value = value
  facet(axis).dispatchEvent(new Event('change'))
  await settle()
}

describe.skipIf(!WEBUI_INSTALLED)('REQ-188 — the tab draws two axes', () => {
  it('test_UAT_FC_REQ-188_a_row_draws_its_stage_and_its_membership_separately', async () => {
    // THE ACCEPTANCE, ON SCREEN. Four contacts, four rows: every one carries a
    // stage, and the two who have signed up ALSO carry a member badge. Under the
    // three-value model the first column would have read
    // `Contact / Invited / Member / Member` and the last row's stage — a member
    // nobody here invited — would have been unrepresentable.
    await panelOver()

    expect(stages()).toEqual(['Lead', 'Invited', 'Invited', 'Lead'])
    expect(members()).toEqual(['Member', 'Member'])
  })

  it('test_UAT_FC_REQ-188_the_two_facets_narrow_independently', async () => {
    // EACH AXIS ALONE FIRST. A value a row can display but the filter cannot
    // select would show the fact without making it usable, so both facets are
    // driven across every value they offer.
    await panelOver()

    await choose('pipeline', 'invited')
    expect(who()).toEqual(['Ivan', 'Mena'])

    await choose('pipeline', 'lead')
    expect(who()).toEqual(['Cara', 'Sam'])

    await choose('pipeline', '')
    await choose('access', 'member')
    expect(who()).toEqual(['Mena', 'Sam'])

    await choose('access', 'not_member')
    expect(who()).toEqual(['Cara', 'Ivan'])

    await choose('access', '')
    expect(who()).toEqual(['Cara', 'Ivan', 'Mena', 'Sam'])
  })

  it('test_UAT_FC_REQ-188_narrowing_both_axes_asks_the_operators_real_questions', async () => {
    // THE TEST THE EARLIER FIX COULD NOT PASS. Both of these are conjunctions
    // across the two axes, and no single facet over one merged list of values can
    // express either — however many values that list is given ([[DOC-44]] §3).
    await panelOver()

    // "Who did I ask who never came" — the follow-up list.
    await choose('pipeline', 'invited')
    await choose('access', 'not_member')
    expect(who()).toEqual(['Ivan'])

    // "Who signed up that I never asked" — the one the old model erased.
    await choose('pipeline', 'lead')
    await choose('access', 'member')
    expect(who()).toEqual(['Sam'])
  })

  it('test_UAT_FC_REQ-188_inviting_moves_the_stage_and_confers_no_membership', async () => {
    // THE OPERATOR'S TRANSITION, AND ITS CEILING. The row moves along one axis,
    // the other is untouched, and the sentence they are shown says so — an invite
    // that reported a membership would be the old model surviving in the place
    // they actually read.
    await panelOver()

    const invite = root.querySelector('.builder-people__invite') as HTMLButtonElement
    invite.click()
    ;(root.querySelector('.builder-people__invite-email') as HTMLInputElement).value =
      'lead@example.test'
    const dialog = [...root.querySelectorAll('.builder-modal')].at(-1) as HTMLElement
    ;([...dialog.querySelectorAll('button')] as HTMLButtonElement[])
      .find((b) => b.textContent === 'Invite')!
      .click()
    await settle()
    await settle()

    expect(stages()).toEqual(['Invited', 'Invited', 'Invited', 'Lead'])
    // Cara moved stage and gained nothing else: still the same two members.
    expect(members()).toEqual(['Member', 'Member'])
    expect(said().textContent).toMatch(/invited/i)
    expect(said().textContent, 'the invite claimed to make a member').not.toMatch(/member/i)
  })

  it('test_UAT_FC_REQ-188_signing_up_adds_a_member_badge_with_no_operator_action', async () => {
    // THE SECOND TRANSITION IS NOT THE OPERATOR'S. The row is stamped out there,
    // by the person themselves; the panel's whole part is to re-read and redraw,
    // and no control on this tab is touched between the two assertions. The stage
    // column is asserted UNCHANGED across it, which is the independence claim
    // stated the way an operator would see it fail.
    const { panel, transport } = await panelOver()
    expect(members()).toEqual(['Member', 'Member'])

    transport.theyAcceptTheTerms('invited@example.test')
    await panel.refresh()

    expect(members()).toEqual(['Member', 'Member', 'Member'])
    expect(stages(), 'signing up moved the pipeline').toEqual([
      'Lead',
      'Invited',
      'Invited',
      'Lead',
    ])
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

  it('test_UAT_FC_REQ-188_each_axis_has_one_definition', async () => {
    // ONE ANSWER PER AXIS, NOT TWO. The panel re-exports the derivations rather
    // than carrying copies, which is what lets the workers sibling assert the
    // same rules against real rows. Two derivations would be two answers free to
    // disagree about who is a member, in the one place a legal fact is surfaced.
    const { panel } = await panelOver()
    expect(panel.stageOf).toBe(stageOf)
    expect(panel.accessOf).toBe(accessOf)

    // AND THE AXES DO NOT READ EACH OTHER'S MARKERS. `stageOf` returns the stored
    // value for a row whose stamps would have implied something else, and
    // `accessOf` ignores the stage entirely.
    expect(stageOf(SELF_SERVED)).toBe('lead')
    expect(accessOf(SELF_SERVED)).toBe('member')
    expect(stageOf(INVITED)).toBe('invited')
    expect(accessOf(INVITED)).toBe('not_member')
    expect(stageOf(LEAD)).toBe('lead')
    expect(accessOf(LEAD)).toBe('not_member')
  })
})

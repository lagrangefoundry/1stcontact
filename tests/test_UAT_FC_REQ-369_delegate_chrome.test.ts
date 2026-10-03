// @vitest-environment jsdom
/**
 * REQ-369 — **the chrome a delegate and an owner see.**
 *
 * WHAT THIS FILE PROVES, through the shipped browser modules:
 *
 *   1. The default business: a remembered selection still wins; otherwise a
 *      delegate whose own business is not published opens on the business they
 *      were invited to run, a live one first; an owner whose business is live
 *      opens on their own.
 *   2. Every switcher entry says whether it is owned or delegated.
 *   3. The Contacts tab badges delegates, shows the Delegate section only to an
 *      owner, and its Make delegate / Revoke delegate controls reach the routes.
 *   4. The add control reads `+ Add` rather than a bare glyph.
 *
 * MOUNTED AGAINST THE INSTALLED COMPONENTS; the only double is the transport,
 * because that is the network.
 */

import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'

type Business = { id: string; name?: string; selectable?: boolean; role?: string | null; live?: boolean }

let resolveBusiness: (businesses: Business[], stored: string | null) => string | null
let createBusinessSwitcher: (spec: { businesses: Business[]; selected?: string | null }) => {
  element: HTMLElement
}
let createPeoplePanel: (opts?: Record<string, unknown>) => {
  element: HTMLElement
  refresh(): Promise<void>
  listDetail: { select(k: string): void }
}

if (!WEBUI_INSTALLED) console.warn(`REQ-369 contacts suite skipped: ${WEBUI_SKIP_REASON}`)

const settle = () => new Promise((resolve) => setTimeout(resolve, 0))
const text = (node: Element | null) => (node?.textContent ?? '').trim()

beforeAll(async () => {
  ;({ resolveBusiness, createBusinessSwitcher } = await import(
    '../apps/control-app/src/builder/business.js'
  ))
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

const OWN = { id: 'biz_own', name: 'My starter', selectable: true, role: 'owner', live: false }
const RUN = { id: 'biz_run', name: 'Alice Plumbing', selectable: true, role: 'delegate', live: true }

describe('REQ-369 — which business a delegate opens on', () => {
  it('test_UAT_FC_REQ-369_a_delegate_with_an_unpublished_own_business_opens_the_delegated_one', () => {
    // THE STARTER BUSINESS COMES FIRST IN MEMBERSHIP ORDER for a person who
    // already had an account, and is empty. Opening it would put a delegate in
    // front of a blank site instead of the business they came to run.
    expect(resolveBusiness([OWN, RUN], null)).toBe('biz_run')
    // A LIVE DELEGATED BUSINESS IS PREFERRED over an unpublished one.
    const quiet = { ...RUN, id: 'biz_quiet', live: false }
    expect(resolveBusiness([OWN, quiet, RUN], null)).toBe('biz_run')
    expect(resolveBusiness([OWN, quiet], null)).toBe('biz_quiet')
  })

  it('test_UAT_FC_REQ-369_a_remembered_selection_still_wins', () => {
    expect(resolveBusiness([OWN, RUN], 'biz_own')).toBe('biz_own')
  })

  it('test_UAT_FC_REQ-369_an_owner_whose_business_is_live_opens_their_own', () => {
    const live = { ...OWN, live: true }
    expect(resolveBusiness([RUN, live], null)).toBe('biz_own')
    // AND SOMEBODY WHO DELEGATES NOTHING IS UNCHANGED: first selectable.
    expect(resolveBusiness([OWN, { ...OWN, id: 'biz_two' }], null)).toBe('biz_own')
  })

  it('test_UAT_FC_REQ-369_every_switcher_entry_says_owned_or_delegated', () => {
    const switcher = createBusinessSwitcher({ businesses: [OWN, RUN], selected: 'biz_run' })
    root.append(switcher.element)
    const options = [...root.querySelectorAll('option')].map((o) => text(o))
    expect(options).toEqual(['My starter · owned', 'Alice Plumbing · delegated'])

    // ONE BUSINESS IS STILL A NAME, AND STILL MARKED.
    document.body.replaceChildren()
    const only = createBusinessSwitcher({ businesses: [RUN] })
    document.body.append(only.element)
    expect(text(document.querySelector('.builder-business__name'))).toBe('Alice Plumbing · delegated')

    // A BUSINESS ENTERED WITHOUT A MEMBERSHIP (role null) CARRIES NEITHER MARK.
    document.body.replaceChildren()
    const entered = createBusinessSwitcher({ businesses: [{ id: 'biz_x', name: 'Elsewhere', role: null }] })
    document.body.append(entered.element)
    expect(text(document.querySelector('.builder-business__name'))).toBe('Elsewhere')
  })
})

const person = (over: Record<string, unknown>) => ({
  name: null,
  formerNames: [],
  status: 'active',
  invitedAt: null,
  firstSeenAt: null,
  lastSeenAt: null,
  termsAcceptedAt: null,
  pipelineStage: 'lead',
  createdAt: '2026-09-01T09:00:00.000Z',
  ...over,
})

const PEOPLE = [
  person({ id: 'usr_del', email: 'del@example.test' }),
  person({ id: 'usr_lead', email: 'lead@example.test' }),
]

let calls: { delegate: string[]; undelegate: string[] }

function transport(canDelegate: boolean) {
  const standing: Record<string, unknown> = {
    usr_del: { status: 'active', grantedAt: '2026-10-01T10:00:00.000Z', revokedAt: null },
  }
  return {
    list: async () => ({
      people: PEOPLE.map((p) => ({ ...p })),
      canInvite: true,
      canFulfil: false,
      canDelegate,
      bounced: [],
      delegates: ['usr_del'],
    }),
    item: async (id: string) => ({
      person: { ...PEOPLE.find((p) => p.id === id)! },
      emails: [],
      operates: [],
      grants: [],
      events: [],
      provenance: null,
      delegate: standing[id] ?? null,
    }),
    messages: async () => ({ messages: [] }),
    events: async () => ({ events: [] }),
    pending: async () => ({ pending: [] }),
    delegate: async (id: string) => {
      calls.delegate.push(id)
      return { result: { status: 'sent', to: `${id}@example.test` } }
    },
    undelegate: async (id: string) => {
      calls.undelegate.push(id)
      return { delegate: { status: 'revoked' } }
    },
  }
}

async function open(id: string, canDelegate: boolean) {
  const made = createPeoplePanel({ transport: transport(canDelegate) })
  root.append(made.element)
  await made.refresh()
  made.listDetail.select(id)
  for (let i = 0; i < 4; i += 1) await settle()
  return root.querySelector('.builder-people__detail') as HTMLElement
}

describe.skipIf(!WEBUI_INSTALLED)('REQ-369 — the Contacts tab', () => {
  beforeEach(() => {
    calls = { delegate: [], undelegate: [] }
  })

  it('test_UAT_FC_REQ-369_a_delegate_row_is_badged_and_the_add_control_reads_add', async () => {
    const made = createPeoplePanel({ transport: transport(true) })
    root.append(made.element)
    await made.refresh()
    const badges = [...root.querySelectorAll('.builder-people__delegate')]
    expect(badges).toHaveLength(1)
    expect(text(badges[0].closest('.builder-people__row'))).toContain('del@example.test')
    // THE OPEN QUESTION'S ANSWER: the control existed and was a bare glyph.
    const add = root.querySelector('.builder-people__add') as HTMLButtonElement
    expect(add.hidden).toBe(false)
    expect(text(add)).toBe('+ Add')
  })

  it('test_UAT_FC_REQ-369_an_owner_makes_a_contact_a_delegate_from_their_pane', async () => {
    const detail = await open('usr_lead', true)
    const button = detail.querySelector('.builder-people__delegate-btn') as HTMLButtonElement
    expect(text(button)).toBe('Make delegate')
    button.click()
    await settle()
    const send = [...root.querySelectorAll('.builder-modal__btn')].find(
      (b) => text(b) === 'Send invitation',
    ) as HTMLButtonElement
    expect(send, 'no confirmation dialog').toBeTruthy()
    send.click()
    for (let i = 0; i < 4; i += 1) await settle()
    expect(calls.delegate).toEqual(['usr_lead'])
  })

  it('test_UAT_FC_REQ-369_an_owner_revokes_a_live_delegate_from_their_pane', async () => {
    const detail = await open('usr_del', true)
    expect(text(detail.querySelector('.builder-people__delegate-state'))).toMatch(/delegate since/i)
    const button = detail.querySelector('.builder-people__delegate-btn') as HTMLButtonElement
    expect(text(button)).toBe('Revoke delegate')
    button.click()
    for (let i = 0; i < 4; i += 1) await settle()
    expect(calls.undelegate).toEqual(['usr_del'])
  })

  it('test_UAT_FC_REQ-369_a_delegate_sees_no_delegate_section', async () => {
    // DELEGATION MANAGEMENT IS THE OWNER'S ALONE. The routes refuse it as well;
    // this is the chrome not offering what would be refused.
    const detail = await open('usr_lead', false)
    expect(detail.querySelector('.builder-people__delegate-btn')).toBeNull()
    expect([...detail.querySelectorAll('h3')].map((h) => text(h))).not.toContain('Delegate')
  })
})

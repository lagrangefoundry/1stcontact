// @vitest-environment jsdom
/**
 * story-a55c2f35 — **the Contacts tab, editing: the panel half.**
 *
 * What the operator meets in a contact's detail: which fields of Who they are
 * offer an edit, what a confirmed edit sends and shows, how a malformed address
 * or a server refusal is reported, the Withdraw control on a grant, the absence
 * of any login-suspension control, and Provision a business.
 *
 * Mounted against the actually-installed components (`mountFields`,
 * `mountListDetail`, the modal shell); the only double is the transport, because
 * that is the network. The double normalises the way the origin does (casefold,
 * trim, empty → null) so a panel that skipped putting the SAVED row back would
 * fail rather than pass. The origin half is the workerd sibling.
 */

import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'
import { isEmailShape } from '../apps/control-app/src/builder/email-shape.js'

let createPeoplePanel: (opts?: Record<string, unknown>) => never

if (!WEBUI_INSTALLED) console.warn(`story-a55c2f35 contacts-editing suite skipped: ${WEBUI_SKIP_REASON}`)

const settle = () => new Promise((resolve) => setTimeout(resolve, 0))
const settleAll = async () => {
  for (let i = 0; i < 4; i += 1) await settle()
}

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

interface Grant {
  id: string
  businessId: string
  businessName: string | null
  accountId: string | null
  plan: string
  source: string
  status: string
  startsAt: string
  endsAt: string | null
  note: string | null
}

const SARAH: Person = {
  id: 'usr_1',
  email: 'sarah@example.test',
  displayName: 'Sarah',
  status: 'active',
  invitedAt: '2026-09-01T10:00:00.000Z',
  firstSeenAt: '2026-09-02T10:00:00.000Z',
  lastSeenAt: '2026-09-03T10:00:00.000Z',
  termsAcceptedAt: '2026-09-02T10:05:00.000Z',
  pipelineStage: 'invited',
  createdAt: '2026-09-01T09:00:00.000Z',
}

const grant = (over: Partial<Grant>): Grant => ({
  id: 'ent_x',
  businessId: 'acct_alpha',
  businessName: 'Alpha Ltd',
  accountId: null,
  plan: 'pro',
  source: 'admin_grant',
  status: 'active',
  startsAt: '2026-09-01T00:00:00.000Z',
  endsAt: null,
  note: null,
  ...over,
})

/**
 * A transport over one in-memory business, recording every call that leaves the
 * panel. `item` and `list` count their calls so a re-read is observable.
 */
function transportOver(opts: { canFulfil?: boolean; grants?: Grant[] } = {}) {
  const person = { ...SARAH }
  const grants = (opts.grants ?? []).map((g) => ({ ...g }))
  const operates = [
    { businessId: 'acct_alpha', name: 'Alpha Ltd', role: 'owner', status: 'active', revokedAt: null as string | null },
  ]
  const saved: Array<Record<string, unknown>> = []
  const revoked: string[] = []
  const provisioned: Array<{ accountEmail: string; name: string }> = []
  const statusCalls: unknown[] = []
  const calls = { list: 0, item: 0 }
  let refuseSave: string | null = null
  let refuseFulfil: string | null = null
  return {
    person,
    grants,
    operates,
    saved,
    revoked,
    provisioned,
    statusCalls,
    calls,
    refuseSaveWith(message: string | null) {
      refuseSave = message
    },
    refuseFulfilWith(message: string | null) {
      refuseFulfil = message
    },
    list: async () => {
      calls.list += 1
      return { people: [{ ...person }], canInvite: true, canFulfil: opts.canFulfil === true }
    },
    item: async () => {
      calls.item += 1
      return {
        person: { ...person },
        operates: operates.map((b) => ({ ...b })),
        grants: grants.map((g) => ({ ...g })),
      }
    },
    saveRecord: async (id: string, patch: Record<string, unknown>) => {
      if (refuseSave) throw new Error(refuseSave)
      saved.push({ id, ...patch })
      if ('email' in patch) person.email = String(patch.email ?? '').trim().toLowerCase()
      if ('displayName' in patch) person.displayName = String(patch.displayName ?? '').trim() || null
      return { ...person }
    },
    // Present so that a panel which DID bind the login control would be caught.
    saveStatus: async (...args: unknown[]) => {
      statusCalls.push(args)
      return { ...person }
    },
    grant: async () => ({}),
    revoke: async (id: string) => {
      revoked.push(id)
      const g = grants.find((x) => x.id === id)
      if (g) g.status = 'revoked'
      return { ok: true }
    },
    invite: async () => ({ created: true, person: { ...person } }),
    fulfil: async (accountEmail: string, name: string) => {
      if (refuseFulfil) throw new Error(refuseFulfil)
      provisioned.push({ accountEmail, name })
      operates.push({ businessId: 'acct_new', name, role: 'owner', status: 'active', revokedAt: null })
      return { businessId: 'acct_new', name, siteSlug: 'acct_new' }
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
function freshRoot() {
  document.body.replaceChildren()
  root = document.createElement('div')
  document.body.append(root)
}
beforeEach(freshRoot)

/** The panel, with Sarah's detail open. */
async function openSarah(opts: { canFulfil?: boolean; grants?: Grant[] } = {}) {
  const transport = transportOver(opts)
  const panel = createPeoplePanel({ storage: memoryStorage(), transport })
  root.append(panel.element)
  await panel.refresh()
  panel.listDetail.select('usr_1')
  await settleAll()
  return { panel, transport }
}

const row = (name: string) =>
  root.querySelector(`.fields-row[data-field="${name}"]`) as HTMLElement | null
const cell = (name: string) => row(name)!.querySelector('.fields-value') as HTMLElement | null
const control = (name: string) =>
  row(name)!.querySelector('.fields-control') as HTMLInputElement | null
const errorOf = (name: string) =>
  (row(name)!.querySelector('.fields-error') as HTMLElement | null)?.textContent ?? ''
const headings = () =>
  [...root.querySelectorAll('.builder-people__heading')].map((h) => h.textContent)
const dialog = () =>
  ([...root.querySelectorAll('.builder-modal')].at(-1) ?? null) as HTMLElement | null
const grantLine = (plan: string) =>
  [...root.querySelectorAll('tr')].find(
    (tr) => tr.querySelector('.builder-people__plan')?.textContent === plan,
  ) as HTMLElement | undefined

/** Type into a field and press Return — the component's confirm gesture. */
async function type(name: string, value: string) {
  ;(row(name)!.querySelector('.fields-value-editable') as HTMLElement).click()
  const input = control(name)!
  input.value = value
  input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }))
  await settleAll()
}

const EDITABLE = ['email', 'displayName']
const LOCKED = ['stage', 'access', 'status', 'invitedAt', 'firstSeenAt', 'lastSeenAt', 'termsAcceptedAt', 'createdAt']
const MALFORMED = ['a@b', 'a@@b.c', 'a@.c', 'a@b.', '@b.c', 'a b@example.test']

describe.skipIf(!WEBUI_INSTALLED)('story-a55c2f35 — Who they are', () => {
  it('test_UAT_AC2188_only_email_and_name_are_editable_and_the_eight_observed_fields_are_locked', async () => {
    await openSarah()
    const section = root.querySelectorAll('.fields-row')
    expect(section.length).toBe(10)
    expect([...section].map((r) => (r as HTMLElement).dataset.field).sort()).toEqual(
      [...EDITABLE, ...LOCKED].sort(),
    )

    for (const name of LOCKED) {
      expect(row(name)!.classList.contains('is-locked'), `${name} is not locked`).toBe(true)
      expect(cell(name)!.classList.contains('fields-value-editable'), `${name} has an affordance`).toBe(false)
      cell(name)!.click()
      await settle()
      expect(control(name), `${name} opened an editor`).toBeNull()
    }

    // One fresh panel per editable field: focus leaving an open control commits it.
    for (const name of EDITABLE) {
      freshRoot()
      await openSarah()
      expect(cell(name)!.classList.contains('fields-value-editable'), name).toBe(true)
      cell(name)!.click()
      await settle()
      expect(control(name), `${name} opened no editor`).toBeTruthy()
    }
  })

  it('test_UAT_AC2189_a_confirmed_edit_sends_only_that_field_and_shows_the_stored_value', async () => {
    const named = await openSarah()
    await type('displayName', 'Sarah Jones')
    expect(named.transport.saved).toEqual([{ id: 'usr_1', displayName: 'Sarah Jones' }])

    freshRoot()
    const { transport } = await openSarah()
    const listsBefore = transport.calls.list
    await type('email', 'Sarah.Jones@Example.com')
    expect(transport.saved).toEqual([{ id: 'usr_1', email: 'Sarah.Jones@Example.com' }])
    // The stored (casefolded) value is shown, not what was typed.
    expect(cell('email')!.textContent).toBe('sarah.jones@example.com')
    // And the list was re-read so it agrees with the pane.
    expect(transport.calls.list).toBeGreaterThan(listsBefore)
  })

  it('test_UAT_AC2190_a_malformed_address_is_refused_inline_and_not_sent', async () => {
    for (const typed of [...MALFORMED, '']) {
      freshRoot()
      const { transport } = await openSarah()
      await type('email', typed)
      expect(errorOf('email'), `"${typed}" showed no message`).not.toBe('')
      // Clearing is refused as required; every malformed shape gets the shape sentence.
      if (typed !== '') {
        expect(errorOf('email')).toContain('must be an address like name@example.com')
      }
      expect(control('email'), `"${typed}" closed the editor`).toBeTruthy()
      expect(transport.saved, `"${typed}" was sent`).toEqual([])
    }

    freshRoot()
    const { transport } = await openSarah()
    await type('email', 'a@b.c')
    expect(transport.saved).toEqual([{ id: 'usr_1', email: 'a@b.c' }])

    // The panel and the origin read one rule — the shared module.
    for (const typed of [...MALFORMED, '']) expect(isEmailShape(typed), typed).toBe(false)
    expect(isEmailShape('a@b.c')).toBe(true)
  })

  it('test_UAT_AC2191_a_rejected_save_rolls_the_cell_back_and_shows_the_message', async () => {
    const { transport } = await openSarah()
    transport.refuseSaveWith('Somebody in this business already has that address.')

    await type('email', 'taken@example.test')

    expect(cell('email')!.textContent).toBe('sarah@example.test')
    expect(errorOf('email')).toContain('Somebody in this business already has that address.')
    expect(transport.person.email).toBe('sarah@example.test')
  })
})

describe.skipIf(!WEBUI_INSTALLED)('story-a55c2f35 — grants and login, in the detail', () => {
  it('test_UAT_AC2199_withdraw_shows_only_on_live_grants_sends_the_revoke_and_rereads', async () => {
    const { transport } = await openSarah({
      canFulfil: true,
      grants: [
        grant({ id: 'ent_live', plan: 'pro', status: 'active' }),
        grant({ id: 'ent_gone', plan: 'support', status: 'revoked' }),
      ],
    })

    const live = grantLine('pro')!
    const gone = grantLine('support')!
    expect(live.querySelector('.builder-people__revokegrant')?.textContent).toBe('Withdraw')
    expect(gone.querySelector('.builder-people__revokegrant')).toBeNull()

    const itemsBefore = transport.calls.item
    ;(live.querySelector('.builder-people__revokegrant') as HTMLButtonElement).click()
    await settleAll()

    expect(transport.revoked).toEqual(['ent_live'])
    expect(transport.calls.item).toBeGreaterThan(itemsBefore)
    const after = grantLine('pro')!
    expect(after.querySelector('.builder-people__grantstatus')?.textContent).toContain('revoked')
    expect(after.querySelector('.builder-people__revokegrant')).toBeNull()
  })

  it('test_UAT_AC2200_a_customer_owner_is_offered_no_withdraw_control', async () => {
    const { transport } = await openSarah({
      canFulfil: false,
      grants: [grant({ id: 'ent_live', plan: 'pro', status: 'active' })],
    })

    const live = grantLine('pro')!
    expect(live.querySelector('.builder-people__grantstatus')?.textContent).toContain('active')
    expect(live.querySelector('.builder-people__revokegrant')).toBeNull()
    expect(transport.revoked).toEqual([])
  })

  it('test_UAT_AC2201_may_sign_in_is_locked_and_the_panel_offers_no_suspend_control', async () => {
    const { transport } = await openSarah({ grants: [grant({ id: 'ent_live' })] })

    expect(row('status')!.classList.contains('is-locked')).toBe(true)
    cell('status')!.click()
    await settle()
    expect(control('status')).toBeNull()

    const buttons = [...root.querySelectorAll('button')].map((b) => (b.textContent ?? '').toLowerCase())
    for (const text of buttons) {
      expect(text).not.toMatch(/suspend|restore|deactivate|block/)
    }
    expect(transport.statusCalls).toEqual([])
    expect(transport.saved.some((s) => 'status' in s)).toBe(false)
  })
})

describe.skipIf(!WEBUI_INSTALLED)('story-a55c2f35 — Provision a business', () => {
  it('test_UAT_AC2202_provision_a_business_submits_the_contacts_own_address', async () => {
    // Absent when the caller may not fulfil.
    await openSarah({ canFulfil: false })
    expect(headings()).not.toContain('Add a business')
    expect(root.querySelector('.builder-people__fulfil')).toBeNull()

    // Present when they may.
    freshRoot()
    const { transport } = await openSarah({ canFulfil: true })
    expect(headings()).toContain('Add a business')
    const button = root.querySelector('.builder-people__fulfil') as HTMLButtonElement
    expect(button.textContent).toBe('Provision a business')

    button.click()
    const modal = dialog()!
    expect(modal.querySelector('.builder-modal__title')?.textContent).toBe('Provision a business')
    expect(modal.querySelector('.builder-people__fulfil-who')?.textContent).toContain(SARAH.email)
    const inputs = modal.querySelectorAll('input')
    expect(inputs.length).toBe(1)
    ;(inputs[0] as HTMLInputElement).value = "Sarah's Bakery"

    const itemsBefore = transport.calls.item
    const provision = () =>
      [...dialog()!.querySelectorAll('button')].find((b) => b.textContent === 'Provision') as HTMLButtonElement
    provision().click()
    await settleAll()

    expect(transport.provisioned).toEqual([{ accountEmail: SARAH.email, name: "Sarah's Bakery" }])
    expect(dialog()!.querySelector('.builder-people__fulfil-said')?.textContent).toBe(
      "Sarah's Bakery is provisioned.",
    )
    expect(transport.calls.item).toBeGreaterThan(itemsBefore)
    expect(root.querySelector('.builder-people__detail')?.textContent).toContain("Sarah's Bakery")

    // A failure is reported in the dialog and Provision can be pressed again.
    freshRoot()
    const failing = await openSarah({ canFulfil: true })
    failing.transport.refuseFulfilWith('That business name is not allowed.')
    ;(root.querySelector('.builder-people__fulfil') as HTMLButtonElement).click()
    ;(dialog()!.querySelector('input') as HTMLInputElement).value = 'Bad Name'
    provision().click()
    await settleAll()
    expect(dialog()!.querySelector('.builder-people__fulfil-said')?.textContent).toBe(
      'That business name is not allowed.',
    )
    expect(provision().disabled).toBe(false)
    expect(failing.transport.provisioned).toEqual([])
  })
})

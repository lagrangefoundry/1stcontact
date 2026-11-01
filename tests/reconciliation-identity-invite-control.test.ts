// @vitest-environment jsdom
/**
 * STORY-7b1025b8 — the invite control on the Users tab (REQ-186).
 *
 * Mounted against the actually-installed panel; the only double is the HTTP
 * transport, because that is the network. The double implements the invite as
 * the origin does — a transition on the row for that address, inserting only
 * when there is none — so a panel that reported every invite the same way would
 * fail here.
 */

import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'

let createPeoplePanel: (opts?: Record<string, unknown>) => never

if (!WEBUI_INSTALLED) console.warn(`STORY-7b1025b8 invite-control suite skipped: ${WEBUI_SKIP_REASON}`)

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

function transportOver(people: Person[], canInvite: boolean) {
  const rows = people.map((p) => ({ ...p }))
  return {
    rows,
    list: async () => ({ people: rows.map((p) => ({ ...p })), canInvite, canFulfil: false }),
    item: async (id: string) => ({ person: { ...rows.find((p) => p.id === id)! }, operates: [], grants: [] }),
    saveStatus: async () => ({}),
    grant: async () => ({}),
    revoke: async () => ({}),
    fulfil: async () => ({}),
    invite: async (email: string, displayName: string | null) => {
      const normalised = String(email ?? '').trim().toLowerCase()
      if (normalised === '') throw new Error('An invite needs an email address.')
      const existing = rows.find((p) => p.email === normalised)
      if (existing) {
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

async function panelOver(canInvite: boolean) {
  const transport = transportOver(
    [person({ id: 'usr_1', email: 'known@example.test', displayName: 'Known' })],
    canInvite,
  )
  const panel = createPeoplePanel({ storage: memoryStorage(), transport })
  root.append(panel.element)
  await panel.refresh()
  return transport
}

const inviteButton = () => root.querySelector('.builder-people__invite') as HTMLButtonElement | null
const dialog = () => ([...root.querySelectorAll('.builder-modal')].at(-1) ?? null) as HTMLElement | null
const said = () => root.querySelector('.builder-people__invite-said') as HTMLElement

async function submitInvite(email: string) {
  ;(root.querySelector('.builder-people__invite-email') as HTMLInputElement).value = email
  ;(root.querySelector('.builder-people__invite-name') as HTMLInputElement).value = ''
  const buttons = [...dialog()!.querySelectorAll('button')] as HTMLButtonElement[]
  buttons.find((b) => b.textContent === 'Invite')!.click()
  await settle()
  await settle()
}

describe.skipIf(!WEBUI_INSTALLED)('the invite control', () => {
  it('test_UAT_AC2175_the_invite_control_is_owner_only_and_its_dialog_says_no_message_is_sent', async () => {
    // Hidden for a caller who may not invite.
    await panelOver(false)
    expect(inviteButton(), 'the control was not rendered at all').not.toBeNull()
    expect(inviteButton()!.hidden).toBe(true)

    // Shown, with the list controls, for one who may.
    root.replaceChildren()
    await panelOver(true)
    expect(inviteButton()!.hidden).toBe(false)
    expect(root.querySelector('.builder-people__filter')?.contains(inviteButton())).toBe(true)

    inviteButton()!.click()
    expect(dialog(), 'the invite dialog did not open').not.toBeNull()
    expect(dialog()!.querySelector('.builder-people__invite-email')).not.toBeNull()
    expect(dialog()!.querySelector('.builder-people__invite-name')).not.toBeNull()
    expect(dialog()!.textContent ?? '').toMatch(/no message is sent/i)

    // A new address is reported as newly added.
    await submitInvite('new@example.test')
    expect(said().hidden).toBe(false)
    expect(said().textContent).toBe('new@example.test is invited.')

    // An already-known address is reported as already known.
    await submitInvite('known@example.test')
    expect(said().textContent).toMatch(/already known/i)
    expect(said().textContent).toContain('known@example.test')

    // A refusal is shown in the dialog rather than closing it.
    await submitInvite('   ')
    expect(said().hidden).toBe(false)
    expect(said().textContent).toContain('needs an email address')
    expect(dialog(), 'the dialog closed over a refusal').not.toBeNull()
  })
})

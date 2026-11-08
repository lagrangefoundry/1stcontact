// @vitest-environment jsdom
/**
 * story-7b1025b8 (BUNDLE-38, REQ-199) — **the Contacts tab: `+` adds a Lead,
 * Invite acts on a checked selection.**
 *
 * The rendering half of AC-2336, AC-2409 and AC-2339; the route and D1 half is
 * `test_reconciliation_contacts_add_invite.workers.test.ts`. Mounted against the
 * installed `builder/people.js`; the only double is the HTTP transport, because
 * that is the network.
 */

import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'

let createPeoplePanel: (opts?: Record<string, unknown>) => never

if (!WEBUI_INSTALLED) {
  console.warn(`story-7b1025b8 contacts-tab suite skipped: ${WEBUI_SKIP_REASON}`)
}

const settle = () => new Promise((resolve) => setTimeout(resolve, 0))
const flush = async () => {
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

const person = (over: Record<string, unknown>) => ({
  name: null,
  formerNames: [],
  status: 'active',
  invitedAt: null,
  firstSeenAt: null,
  lastSeenAt: null,
  termsAcceptedAt: null,
  pipelineStage: 'lead',
  accountId: 'acct_x',
  createdAt: '2026-09-01T09:00:00.000Z',
  ...over,
})

const PEOPLE = [
  person({ id: 'usr_a', email: 'a@example.test' }),
  person({ id: 'usr_b', email: 'b@example.test' }),
  person({ id: 'usr_c', email: null, name: { displayName: 'Cara NoAddress' } }),
]

const DRAFT = {
  from: 'no-reply@1stcontact.io',
  subject: 'Your invitation',
  body: '<p>Hello,</p><p><a href="{{cta_url}}">Accept your invitation</a></p>',
  declared: ['cta_url'],
  templateKey: 'invite',
  templateUid: 'tkt_invite',
}

type Result = { contactId: string; who: string; to: string | null; status: string; reason: string | null }

let calls: { add: unknown[]; invite: unknown[] }

function transport(over: Record<string, unknown> = {}) {
  const known = new Set<string>()
  return {
    list: async () => ({
      people: PEOPLE.map((p) => ({ ...p })),
      canInvite: true,
      canFulfil: false,
      bounced: [],
    }),
    item: async (id: string) => ({
      person: { ...PEOPLE.find((p) => p.id === id)! },
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
    add: async (email: string, displayName: string) => {
      calls.add.push({ email, displayName })
      if (email.trim() === '') throw new Error('A contact needs an email address.')
      const created = !known.has(email)
      known.add(email)
      return { created, person: person({ id: `usr_${email}`, email }) }
    },
    inviteDraft: async () => ({ ...DRAFT }),
    invite: async (ids: string[], subject: string, body: string) => {
      calls.invite.push({ ids, subject, body })
      return {
        results: ids.map(
          (id): Result => ({ contactId: id, who: id, to: `${id}@example.test`, status: 'sent', reason: null }),
        ),
      }
    },
    fulfil: async () => ({}),
    ...over,
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
  calls = { add: [], invite: [] }
})

async function panel(over: Record<string, unknown> = {}) {
  const made = createPeoplePanel({ storage: memoryStorage(), transport: transport(over) })
  root.append(made.element)
  await (made as unknown as { refresh(): Promise<void> }).refresh()
  return made
}

const boxes = () => [...document.querySelectorAll('.builder-people__check')] as HTMLInputElement[]
const inviteButton = () => document.querySelector('.builder-people__invite') as HTMLButtonElement
const addButton = () => document.querySelector('.builder-people__add') as HTMLButtonElement
const text = (node: Element | null) => (node?.textContent ?? '').trim()
const modalButton = (startsWith: string) =>
  [...document.querySelectorAll('.builder-modal__btn')].find((b) =>
    text(b).startsWith(startsWith),
  ) as HTMLButtonElement | undefined

async function setChecked(index: number, checked: boolean) {
  const box = boxes()[index]
  box.checked = checked
  box.dispatchEvent(new Event('change', { bubbles: true }))
  await settle()
}

async function press(button: HTMLButtonElement | undefined) {
  if (!button) throw new Error('no such button')
  button.dispatchEvent(new MouseEvent('click', { bubbles: true }))
  await flush()
}

describe.skipIf(!WEBUI_INSTALLED)('story-7b1025b8 — the add dialog', () => {
  it('test_UAT_AC2336_the_plus_control_is_owner_only_and_its_dialog_says_nothing_is_sent_and_stays_open', async () => {
    // Hidden for a caller who may not invite.
    await panel({
      list: async () => ({ people: [], canInvite: false, canFulfil: false, bounced: [] }),
    })
    expect(addButton()?.hidden, 'a caller who may not invite was shown +').toBe(true)
    expect(inviteButton()?.hidden).toBe(true)

    // Visible for one who may.
    document.body.replaceChildren()
    root = document.createElement('div')
    document.body.append(root)
    await panel()
    expect(addButton().hidden).toBe(false)
    await press(addButton())

    const hint = text(document.querySelector('.builder-people__add-hint'))
    expect(hint).toMatch(/nothing is sent/i)
    expect(hint).toMatch(/lead/i)

    const email = () => document.querySelector('.builder-people__add-email') as HTMLInputElement
    const name = () => document.querySelector('.builder-people__add-name') as HTMLInputElement
    const said = () => document.querySelector('.builder-people__add-said') as HTMLElement

    email().value = 'new@example.test'
    name().value = 'New Person'
    await press(modalButton('Add'))
    expect(calls.add).toEqual([{ email: 'new@example.test', displayName: 'New Person' }])
    expect(calls.invite, 'adding reached the invite').toEqual([])
    expect(said().hidden).toBe(false)
    expect(text(said())).toMatch(/added as a lead/i)
    // Open, with its fields cleared, ready for the next add.
    expect(email(), 'the dialog closed after an add').toBeTruthy()
    expect(email().value).toBe('')
    expect(name().value).toBe('')

    // The same address again: reported as already there.
    email().value = 'new@example.test'
    await press(modalButton('Add'))
    expect(text(said())).toMatch(/already/i)

    // A refused add is reported in the dialog, which stays open.
    email().value = '   '
    await press(modalButton('Add'))
    expect(text(said())).toMatch(/needs an email address/i)
    expect(email(), 'a refused add closed the dialog').toBeTruthy()
  })
})

describe.skipIf(!WEBUI_INSTALLED)('story-7b1025b8 — the invite modal', () => {
  it('test_UAT_AC2409_invite_is_disabled_until_a_row_is_checked_and_shows_the_templates_sender_read_only_with_a_to_list', async () => {
    // REQ-205: the From the modal shows is whatever the invite template resolved
    // to — here the seeded invite's own address, not a deployment-wide one.
    const TEMPLATE_FROM = '1st Contact <invite@1stcontact.io>'
    const draft = { ...DRAFT, from: TEMPLATE_FROM }
    await panel({ inviteDraft: async () => ({ ...draft }) })
    expect(boxes()).toHaveLength(3)
    for (const box of boxes()) expect(box.type).toBe('checkbox')

    expect(inviteButton().hidden, 'Invite is hidden rather than disabled').toBe(false)
    expect(inviteButton().disabled).toBe(true)
    await setChecked(0, true)
    expect(inviteButton().disabled).toBe(false)
    await setChecked(0, false)
    expect(inviteButton().disabled, 'unticking the last row left Invite live').toBe(true)

    await setChecked(0, true)
    await setChecked(1, true)
    await press(inviteButton())

    const from = document.querySelector('.builder-people__from') as HTMLElement
    expect(text(from)).toBe(TEMPLATE_FROM)
    expect(['INPUT', 'TEXTAREA', 'SELECT']).not.toContain(from.tagName)
    expect(from.getAttribute('contenteditable')).toBeNull()

    expect((document.querySelector('.builder-people__subject') as HTMLInputElement).value).toBe(
      draft.subject,
    )
    expect((document.querySelector('.builder-people__body') as HTMLTextAreaElement).value).toBe(draft.body)

    const toList = document.querySelector('.builder-people__tolist') as HTMLTextAreaElement
    expect(toList.readOnly).toBe(true)
    expect(toList.value.split('\n')).toEqual(['a@example.test', 'b@example.test'])
    const label = [...document.querySelectorAll('.builder-people__label')].find(
      (node) => text(node) === 'To-List:',
    ) as HTMLElement
    expect(label, 'the recipients are not labelled To-List:').toBeTruthy()
    expect(label.getAttribute('title') ?? '').toMatch(/own message/i)
    expect(label.getAttribute('title') ?? '').toMatch(/address/i)

    expect(text(modalButton('Send') ?? null)).toBe('Send 2')

    await press(modalButton('Send'))
    expect(calls.invite).toHaveLength(1)
    expect((calls.invite[0] as { ids: string[] }).ids).toEqual(['usr_a', 'usr_b'])
  })

  it('test_UAT_AC2339_the_modal_reports_every_contact_and_the_selection_survives_a_send_in_which_nothing_was_sent', async () => {
    // A mixed send: one line per contact, naming them and their outcome.
    await panel({
      invite: async (ids: string[], subject: string, body: string) => {
        calls.invite.push({ ids, subject, body })
        return {
          results: [
            { contactId: 'usr_a', who: 'a@example.test', to: 'a@example.test', status: 'sent', reason: null },
            {
              contactId: 'usr_b',
              who: 'b@example.test',
              to: 'b@example.test',
              status: 'failed',
              reason: 'mailbox does not exist',
            },
            {
              contactId: 'usr_c',
              who: 'Cara NoAddress',
              to: null,
              status: 'refused',
              reason: 'They have no primary address, so there is nowhere to send this.',
            },
          ] satisfies Result[],
        }
      },
    })
    await setChecked(0, true)
    await setChecked(1, true)
    await setChecked(2, true)
    await press(inviteButton())
    await press(modalButton('Send'))

    const lines = [...document.querySelectorAll('.builder-people__invite-said .builder-people__outcome')]
    expect(lines).toHaveLength(3)
    expect(text(lines[0])).toContain('a@example.test')
    expect(lines[1].getAttribute('data-status')).toBe('failed')
    expect(text(lines[1])).toContain('mailbox does not exist')
    expect(lines[2].getAttribute('data-status')).toBe('refused')
    expect(text(lines[2])).toContain('Cara NoAddress')
    expect(text(lines[2])).toMatch(/no primary address/i)
    expect(document.querySelector('.builder-people__tolist'), 'the modal closed over its report').toBeTruthy()
    // Something was sent, so the selection is cleared and Invite goes dead again.
    expect(
      boxes().map((box) => box.checked),
      'a send in which something went out left the selection ticked',
    ).toEqual([false, false, false])
    expect(inviteButton().disabled, 'a cleared selection left Invite live').toBe(true)

    // Only the no-primary contact, and every result refused: the selection survives.
    document.body.replaceChildren()
    root = document.createElement('div')
    document.body.append(root)
    await panel({
      invite: async (ids: string[]) => ({
        results: ids.map(
          (id): Result => ({
            contactId: id,
            who: 'Cara NoAddress',
            to: null,
            status: 'refused',
            reason: 'They have no primary address, so there is nowhere to send this.',
          }),
        ),
      }),
    })
    await setChecked(2, true)
    await press(inviteButton())
    await press(modalButton('Send'))
    const refusedLine = document.querySelector('.builder-people__invite-said .builder-people__outcome')
    expect(refusedLine?.getAttribute('data-status')).toBe('refused')
    expect(boxes()[2].checked, 'a send in which nothing was sent cleared the selection').toBe(true)
    expect(inviteButton().disabled, 'the refused contact is no longer selected').toBe(false)
  })
})

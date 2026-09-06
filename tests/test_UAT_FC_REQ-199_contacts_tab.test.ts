// @vitest-environment jsdom
/**
 * REQ-199 — **the Contacts tab: add a Lead, invite a selection, see the report.**
 *
 * WHAT THIS FILE PROVES. That the tab grew the act it did not have — a `+` that
 * adds a contact and does nothing else — and that inviting became a selection
 * rather than a form: every row carries a checkbox, Invite is DISABLED with none
 * checked and enabled with one or more, and the dialog it opens is a message
 * showing From (display only), Subject, the To-List and the Body.
 *
 * WHY DISABLED AND NOT ABSENT is itself an assertion here. A control that
 * vanishes teaches nothing — an operator who has never used the tab has no way
 * to discover that ticking rows is what makes inviting possible — so the button
 * has to be findable in the DOM while unavailable, which is a different fact
 * from being missing and is asserted as one.
 *
 * `To-List:` AND ITS HOVER. The label is unusual on purpose: these go out as N
 * separate messages because contacts must not be given each other's addresses.
 * The tooltip is what makes the label legible rather than a typo, so both the
 * text and the explanation are asserted — a label with no title would read as a
 * mistake somebody should tidy away.
 *
 * MOUNTED AGAINST THE ACTUALLY-INSTALLED COMPONENTS, on [[REQ-198]]'s pattern:
 * the only double is the HTTP call, because that is the network.
 */

import { readFileSync } from 'node:fs'
import path from 'node:path'
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'

let createPeoplePanel: (opts?: Record<string, unknown>) => never
let describeOutcome: (result: Record<string, unknown>) => { status: string; text: string }

if (!WEBUI_INSTALLED) console.warn(`REQ-199 contacts-tab suite skipped: ${WEBUI_SKIP_REASON}`)

const repo = (...parts: string[]) => path.resolve(__dirname, '..', ...parts)
const CSS = readFileSync(repo('apps/control-app/src/builder/builder.css'), 'utf8')

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
  person({ id: 'usr_a', email: 'a@example.test' }),
  person({ id: 'usr_b', email: 'b@example.test' }),
  person({ id: 'usr_c', email: null }),
]

const DRAFT = {
  from: 'no-reply@1stcontact.io',
  subject: 'Your invitation',
  body: '<p>Hello,</p><p><a href="{{cta_url}}">Accept your invitation</a></p>',
  declared: ['cta_url'],
  templateKey: 'invite',
  templateUid: 'tkt_invite',
}

/** What the transport was asked to do, so a claim can be about the call. */
let calls: { add: unknown[]; invite: unknown[] }

function transport(over: Record<string, unknown> = {}) {
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
      return { created: true, person: person({ id: 'usr_new', email }) }
    },
    inviteDraft: async () => ({ ...DRAFT }),
    invite: async (ids: string[], subject: string, body: string) => {
      calls.invite.push({ ids, subject, body })
      return {
        results: ids.map((id) => ({
          contactId: id,
          who: id,
          to: `${id}@example.test`,
          status: 'sent',
          reason: null,
        })),
      }
    },
    fulfil: async () => ({}),
    ...over,
  }
}

beforeAll(async () => {
  if (WEBUI_INSTALLED) {
    ;({ createPeoplePanel, describeOutcome } = await import(
      '../apps/control-app/src/builder/people.js'
    ))
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
  await made.refresh()
  return made
}

const boxes = () =>
  [...root.querySelectorAll('.builder-people__check')] as HTMLInputElement[]
const inviteButton = () => root.querySelector('.builder-people__invite') as HTMLButtonElement
const addButton = () => root.querySelector('.builder-people__add') as HTMLButtonElement
const text = (node: Element | null) => (node?.textContent ?? '').trim()

/** Tick a row and let the panel react. */
async function tick(index: number) {
  const box = boxes()[index]
  box.checked = true
  box.dispatchEvent(new Event('change', { bubbles: true }))
  await settle()
}

describe.skipIf(!WEBUI_INSTALLED)('REQ-199 — add is its own control', () => {
  it('test_UAT_FC_REQ-199_the_tab_carries_a_plus_control_that_adds_a_contact', async () => {
    // THE ACT THE TAB DID NOT HAVE. Inviting was insert-or-update and was
    // therefore the only way to create anybody, so recording a person
    // necessarily also asked them to sign up.
    await panel()
    const add = addButton()
    expect(add, 'the tab has no add control').toBeTruthy()
    expect(add.hidden).toBe(false)
    // ITS ACCESSIBLE NAME IS THE SENTENCE THE GLYPH IS SHORT FOR. A control
    // announced as "plus" is one a screen reader user has to guess at.
    expect(add.getAttribute('aria-label')).toBe('Add a contact')

    add.click()
    await settle()
    const email = root.querySelector('.builder-people__add-email') as HTMLInputElement
    const name = root.querySelector('.builder-people__add-name') as HTMLInputElement
    expect(email, 'the add dialog has no address box').toBeTruthy()
    email.value = 'new@example.test'
    name.value = 'New Person'
    ;[...root.querySelectorAll('.builder-modal__btn')]
      .find((b) => text(b) === 'Add')!
      .dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await settle()
    await settle()

    expect(calls.add).toEqual([{ email: 'new@example.test', displayName: 'New Person' }])
    // AND IT SENT NOTHING. The two acts are separate functions on separate
    // paths, so adding cannot reach the invite even by mistake.
    expect(calls.invite).toEqual([])
  })

  it('test_UAT_FC_REQ-199_the_add_dialog_says_that_nothing_is_sent', async () => {
    // AN OPERATOR WILL READ "ADD" AS "ADD AND TELL THEM", because that is what
    // every invite-shaped control they have used did. Saying so is cheaper than
    // the conversation where they assumed mail went out and it did not.
    await panel()
    addButton().click()
    await settle()
    const hint = text(root.querySelector('.builder-people__add-hint'))
    expect(hint).toMatch(/nothing is sent/i)
    expect(hint).toMatch(/lead/i)
  })
})

describe.skipIf(!WEBUI_INSTALLED)('REQ-199 — invite is a selection, not a form', () => {
  it('test_UAT_FC_REQ-199_every_row_carries_a_checkbox', async () => {
    await panel()
    expect(boxes()).toHaveLength(PEOPLE.length)
    for (const box of boxes()) expect(box.type).toBe('checkbox')
    // AN ACCESSIBLE NAME PER ROW, because a bare checkbox in a list of them is
    // announced as "checkbox" and nothing else.
    expect(boxes()[0].getAttribute('aria-label')).toContain('a@example.test')
  })

  it('test_UAT_FC_REQ-199_invite_is_disabled_with_none_checked_and_enabled_with_one_or_more', async () => {
    // DISABLED RATHER THAN ABSENT, so the control teaches what it needs.
    await panel()
    expect(inviteButton().hidden, 'the invite was hidden rather than disabled').toBe(false)
    expect(inviteButton().disabled).toBe(true)
    expect(inviteButton().title).toMatch(/tick/i)

    await tick(0)
    expect(inviteButton().disabled).toBe(false)

    const box = boxes()[0]
    box.checked = false
    box.dispatchEvent(new Event('change', { bubbles: true }))
    await settle()
    expect(inviteButton().disabled, 'unticking the last row left Invite live').toBe(true)
  })

  it('test_UAT_FC_REQ-199_the_stylesheet_has_a_rule_for_the_disabled_state', async () => {
    // "DISABLED" HAS TO BE VISIBLE AS WELL AS TRUE. jsdom computes no layout, so
    // this is proved as REQ-189 and REQ-198 prove distinguishability: the
    // element carries the state and the sheet has a rule for it.
    expect(CSS).toContain('.builder-people__invite:disabled')
  })

  it('test_UAT_FC_REQ-199_ticking_a_row_does_not_move_the_detail_pane', async () => {
    // AN OPERATOR CHECKS FIVE ROWS WHILE READING A SIXTH. A tick that also
    // selected the row would make that impossible, so the checkbox stops its own
    // clicks before the row's handler sees them.
    const made = await panel()
    ;(made as unknown as { listDetail: { select(k: string): void } }).listDetail.select('usr_b')
    await settle()
    await settle()
    await settle()
    const before = text(root.querySelector('.builder-people__detail'))
    expect(before, 'the pane never opened on the row that was selected').toContain(
      'b@example.test',
    )

    boxes()[0].dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))
    await settle()
    await settle()

    const after = text(root.querySelector('.builder-people__detail'))
    expect(after, 'ticking a row opened that row instead').toContain('b@example.test')
    expect(after).not.toContain('a@example.test')
  })
})

describe.skipIf(!WEBUI_INSTALLED)('REQ-199 — the invite modal is a message', () => {
  async function open() {
    await panel()
    await tick(0)
    await tick(1)
    inviteButton().click()
    await settle()
    await settle()
    return root
  }

  it('test_UAT_FC_REQ-199_from_is_display_only_and_subject_and_body_come_from_the_template', async () => {
    // AN ARBITRARY SENDER FAILS DKIM AND LANDS IN SPAM, so offering the field
    // would offer a way to break delivery silently. It is shown because *who
    // will this appear to be from* is a fair question.
    await open()
    const from = root.querySelector('.builder-people__from') as HTMLElement
    expect(text(from)).toBe(DRAFT.from)
    expect(from.tagName, 'From was rendered as something editable').not.toBe('INPUT')
    expect(from.tagName).not.toBe('TEXTAREA')

    expect((root.querySelector('.builder-people__subject') as HTMLInputElement).value).toBe(
      DRAFT.subject,
    )
    expect((root.querySelector('.builder-people__body') as HTMLTextAreaElement).value).toBe(
      DRAFT.body,
    )
  })

  it('test_UAT_FC_REQ-199_the_recipient_field_is_labelled_to_list_and_explains_itself_on_hover', async () => {
    // THE LABEL IS UNUSUAL ON PURPOSE and the tooltip is what makes it legible
    // rather than a typo: each contact receives their own message, and addresses
    // are not shared.
    await open()
    const label = [...root.querySelectorAll('.builder-people__label')].find(
      (node) => text(node) === 'To-List:',
    ) as HTMLElement
    expect(label, 'the recipient field is not labelled To-List:').toBeTruthy()
    const hover = label.getAttribute('title') ?? ''
    expect(hover).toMatch(/own message/i)
    expect(hover).toMatch(/address/i)
    // AND THE SHEET SAYS THERE IS SOMETHING TO HOVER, or the explanation exists
    // only for the reader who already knew to look.
    expect(CSS).toContain('.builder-people__label--explained')
  })

  it('test_UAT_FC_REQ-199_the_to_list_shows_one_selected_address_per_line', async () => {
    await open()
    const list = root.querySelector('.builder-people__tolist') as HTMLTextAreaElement
    expect(list.readOnly, 'the recipients were editable').toBe(true)
    expect(list.value.split('\n')).toEqual(['a@example.test', 'b@example.test'])
  })

  it('test_UAT_FC_REQ-199_a_selected_contact_with_no_address_is_visible_before_anything_is_sent', async () => {
    // A SELECTION OF THREE THAT LISTS TWO ADDRESSES INVITES A MISCOUNT. The
    // server refuses that contact by name and the others still send; this is
    // where the operator finds out which one, before pressing anything.
    await panel()
    await tick(2)
    inviteButton().click()
    await settle()
    await settle()
    const list = root.querySelector('.builder-people__tolist') as HTMLTextAreaElement
    expect(list.value).toMatch(/no address/i)
  })

  it('test_UAT_FC_REQ-199_sending_posts_the_selected_ids_with_the_edited_copy', async () => {
    // THE EDIT IS FOR THIS SEND. It goes up because the operator may have
    // changed it, and nothing on this path writes it back to the template.
    await open()
    const subject = root.querySelector('.builder-people__subject') as HTMLInputElement
    const body = root.querySelector('.builder-people__body') as HTMLTextAreaElement
    subject.value = 'Come and see'
    body.value = '<p><a href="{{cta_url}}">Look</a></p>'
    ;[...root.querySelectorAll('.builder-modal__btn')]
      .find((b) => text(b).startsWith('Send'))!
      .dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await settle()
    await settle()

    expect(calls.invite).toEqual([
      {
        ids: ['usr_a', 'usr_b'],
        subject: 'Come and see',
        body: '<p><a href="{{cta_url}}">Look</a></p>',
      },
    ])
  })

  it('test_UAT_FC_REQ-199_the_report_names_every_selected_contact_and_the_selection_clears', async () => {
    await open()
    ;[...root.querySelectorAll('.builder-modal__btn')]
      .find((b) => text(b).startsWith('Send'))!
      .dispatchEvent(new MouseEvent('click', { bubbles: true }))
    await settle()
    await settle()

    const lines = [...root.querySelectorAll('.builder-people__outcome')]
    expect(lines).toHaveLength(2)
    expect(text(lines[0])).toContain('usr_a')
    // THE SELECTION IS SPENT, so a second press does not silently re-send.
    expect(inviteButton().disabled).toBe(true)
  })
})

describe.skipIf(!WEBUI_INSTALLED)('REQ-199 — what the report says', () => {
  it('test_UAT_FC_REQ-199_every_outcome_gets_a_line_and_a_refusal_names_the_person_and_the_reason', async () => {
    // A REPORT LISTING ONLY FAILURES LEAVES "NINE SENT" TO BE INFERRED FROM AN
    // ABSENCE, and the question after pressing Send is *did it go to everybody
    // I ticked*.
    expect(
      describeOutcome({ who: 'Alice', to: 'alice@example.test', status: 'sent', reason: null }),
    ).toEqual({ status: 'sent', text: 'Alice: sent to alice@example.test' })

    const refused = describeOutcome({
      who: 'Bob Smith',
      to: null,
      status: 'refused',
      reason: 'They have no primary address, so there is nowhere to send this.',
    })
    expect(refused.status).toBe('refused')
    expect(refused.text).toContain('Bob Smith')
    expect(refused.text).toContain('no primary address')

    const failed = describeOutcome({
      who: 'Cara',
      to: 'cara@example.test',
      status: 'failed',
      reason: 'domain is not verified',
    })
    expect(failed.status).toBe('failed')
    expect(failed.text).toContain('domain is not verified')
  })

  it('test_UAT_FC_REQ-199_the_two_outcomes_worth_acting_on_are_accented_by_one_rule', async () => {
    // THE IDIOM THIS TAB ALREADY USES for its statuses: the value is data about
    // the element, not a class per value — and never colour alone, since every
    // line says what happened in words.
    expect(CSS).toContain(".builder-people__outcome[data-status='refused']")
    expect(CSS).toContain(".builder-people__outcome[data-status='failed']")
  })
})

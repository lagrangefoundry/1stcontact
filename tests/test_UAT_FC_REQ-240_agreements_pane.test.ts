// @vitest-environment jsdom
/**
 * REQ-240 — **the Contacts tab shows what a contact has agreed to.**
 *
 * WHAT THIS FILE PROVES. That the current answer is drawn beside the history
 * rather than folded out of it, that a withdrawal is drawn as a value and not as
 * an absence, and that a contact nobody has asked anything is told so instead of
 * being shown a region that failed to load. [[REQ-240]] §1 names "cannot show it
 * on the contact" as one of the defects the round exists to close, and a pane is
 * where that is either true or not.
 *
 * MOUNTED AGAINST THE ACTUALLY-INSTALLED COMPONENTS, on the [[REQ-195]] pattern:
 * the only double is the HTTP call, because that is the network.
 */

import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'
import {
  NEWSLETTER,
  T_AND_C_ACCEPTED,
  acceptanceLabel,
} from '../apps/control-app/src/builder/acceptances.js'

let createPeoplePanel: (opts?: Record<string, unknown>) => never

if (!WEBUI_INSTALLED) console.warn(`REQ-240 agreements suite skipped: ${WEBUI_SKIP_REASON}`)

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

const person = (id: string) => ({
  id,
  name: { id: `nam_${id}`, displayName: id, knownAs: null, title: null },
  status: 'active',
  email: `${id}@example.test`,
  pipelineStage: 'lead',
  termsAcceptedAt: null,
  invitedAt: null,
  createdAt: '2026-01-01T00:00:00.000Z',
})

const PEOPLE = [person('usr_asked'), person('usr_unasked')]

/**
 * The two shapes that must not draw the same.
 *
 * `usr_asked` HAS SAID NO TO ONE OF THEM, which is the case the section exists
 * for: a withdrawal is a fact and has to be visible as one. `usr_unasked` has
 * been asked nothing, which is a DIFFERENT fact and is not a refusal.
 */
const ACCEPTANCES: Record<string, Array<Record<string, unknown>>> = {
  usr_asked: [
    {
      key: T_AND_C_ACCEPTED,
      granted: true,
      documentUid: 'acceptance-11111111',
      setAt: '2026-09-01T10:15:00.000Z',
    },
    { key: NEWSLETTER, granted: false, documentUid: null, setAt: '2026-09-12T17:05:00.000Z' },
  ],
  usr_unasked: [],
}

function transport() {
  return {
    list: async () => ({ people: PEOPLE.map((p) => ({ ...p })), canInvite: true, canFulfil: false }),
    item: async (id: string) => ({
      person: { ...PEOPLE.find((p) => p.id === id)! },
      emails: [],
      operates: [],
      grants: [],
      events: [],
      provenance: null,
      acceptances: ACCEPTANCES[id],
    }),
    saveRecord: async () => ({ ...PEOPLE[0] }),
    saveStatus: async () => ({}),
    grant: async () => ({}),
    revoke: async () => {},
    invite: async () => ({ created: true, person: PEOPLE[0] }),
    fulfil: async () => ({ businessId: 'acct_new', name: 'New', siteKey: 'site_new' }),
  }
}

beforeAll(async () => {
  if (WEBUI_INSTALLED) {
    const panel = await import('../apps/control-app/src/builder/people.js')
    ;({ createPeoplePanel } = panel as never)
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

async function open(id: string): Promise<HTMLElement> {
  const made = createPeoplePanel({ storage: memoryStorage(), transport: transport() })
  root.append((made as unknown as { element: HTMLElement }).element)
  await (made as unknown as { refresh(): Promise<unknown> }).refresh()
  ;(made as unknown as { listDetail: { select(k: string): void } }).listDetail.select(id)
  await settle()
  await settle()
  return root.querySelector('.builder-people__detail') as HTMLElement
}

const headings = (detail: HTMLElement): string[] =>
  [...detail.querySelectorAll('.builder-people__heading')].map((h) => h.textContent?.trim() ?? '')

const rowsOf = (detail: HTMLElement): string[][] =>
  [...detail.querySelectorAll('.builder-people__acceptance')].map((row) =>
    [
      'builder-people__acceptancekey',
      'builder-people__acceptancevalue',
      'builder-people__acceptancewhen',
    ].map((cls) => (row.querySelector(`.${cls}`) as HTMLElement | null)?.textContent?.trim() ?? ''),
  )

describe.skipIf(!WEBUI_INSTALLED)('REQ-240 — agreements on the contact', () => {
  it('test_UAT_FC_REQ-240_the_pane_lists_the_current_answer_with_the_date_it_was_set', async () => {
    const detail = await open('usr_asked')
    expect(headings(detail)).toContain('Agreements')

    // THE CURRENT ANSWER, NOT A FOLD OVER THE TIMELINE — and a withdrawal drawn
    // as a value rather than as a missing row, because "they said no" and
    // "nobody asked" are two different facts about a person.
    expect(rowsOf(detail)).toEqual([
      [acceptanceLabel(T_AND_C_ACCEPTED), 'Agreed', '2026-09-01 10:15'],
      [acceptanceLabel(NEWSLETTER), 'Withdrawn', '2026-09-12 17:05'],
    ])
  })

  it('test_UAT_FC_REQ-240_a_contact_nobody_has_asked_is_told_so', async () => {
    const detail = await open('usr_unasked')
    // THE SECTION IS DRAWN EVEN WHEN IT IS EMPTY, on the history's reasoning: an
    // absent region is indistinguishable from one that failed to load, and "we
    // have never put the question to this person" is a fact worth stating.
    expect(headings(detail)).toContain('Agreements')
    expect(rowsOf(detail)).toEqual([])
    expect(detail.textContent).toContain('Nothing asked of them yet.')
  })

  it('test_UAT_FC_REQ-240_the_pane_offers_no_control_to_change_somebody_elses_mind', async () => {
    const detail = await open('usr_asked')
    const section = [...detail.querySelectorAll('.builder-people__acceptance')]
    // Every writer in this round is the contact's own act (§7). A checkbox here
    // would imply an operator can consent on their behalf, which is a different
    // thing with a different record and is not built.
    for (const row of section) {
      expect(row.querySelector('input, button, select')).toBeNull()
    }
  })
})

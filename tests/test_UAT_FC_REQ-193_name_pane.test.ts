// @vitest-environment jsdom
/**
 * REQ-193 — **the User tab, once a name is a table**.
 *
 * WHAT THIS FILE PROVES, next to its workerd sibling. That one proves the model:
 * the rows, the constraint, the two kinds of supersession. This proves what the
 * operator can actually do with it — that every part of a name has a box, that
 * editing one is a CORRECTION and sends no reason, that recording a real name
 * change is a separate deliberate act that does, that a former name is searchable
 * and says why the row matched, and that the greeting the product will put in
 * front of a customer is visible to the person curating it.
 *
 * THE TWO SURFACES ARE THE CLAIM, not an implementation detail. Getting a
 * supersession wrong in the safe direction leaves a stale typo out of a search;
 * getting it wrong the other way surfaces a deadname. So "the plain path is a
 * correction" is asserted on the wire — what the transport was handed — rather
 * than on anything the panel rendered.
 *
 * MOUNTED AGAINST THE ACTUALLY-INSTALLED COMPONENTS, on the pattern the REQ-186
 * and REQ-189 suites established: the only double is the HTTP call.
 */

import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'

let createPeoplePanel: (opts?: Record<string, unknown>) => never
let NO_NAME_YET: string

if (!WEBUI_INSTALLED) console.warn(`REQ-193 name-pane suite skipped: ${WEBUI_SKIP_REASON}`)

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

const named = (displayName: string, over: Partial<PersonName> = {}): PersonName => ({
  id: 'nam_1',
  displayName,
  knownAs: null,
  title: null,
  givenName: null,
  middleNames: null,
  familyName: null,
  suffix: null,
  createdAt: '2026-09-01T09:00:00.000Z',
  updatedAt: '2026-09-01T09:00:00.000Z',
  ...over,
})

const person = (over: Record<string, unknown>) => ({
  name: null,
  formerNames: [] as string[],
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
 * FOUR PEOPLE, EACH A SHAPE THE TAB HAS TO DRAW:
 *
 * - `usr_bob` — a full name, with the parts and a `knownAs` that overrides the
 *   given name in the greeting.
 * - `usr_prince` — a mononym. No given name, no family name, no title.
 * - `usr_sarah` — a former name marked `changed`, so she is findable by it.
 * - `usr_none` — a contact with no name at all, which is an ordinary state.
 */
const PEOPLE = [
  person({
    id: 'usr_bob',
    email: 'bob@example.test',
    name: named('Robert Smith', {
      knownAs: 'Bob',
      givenName: 'Robert',
      familyName: 'Smith',
      title: 'Dr',
      suffix: 'PhD',
    }),
  }),
  person({ id: 'usr_prince', email: 'prince@example.test', name: named('Prince') }),
  person({
    id: 'usr_sarah',
    email: 'sarah@example.test',
    name: named('Sarah Patel', { givenName: 'Sarah', familyName: 'Patel' }),
    formerNames: ['Sarah Jones'],
  }),
  person({ id: 'usr_none', email: 'nameless@example.test', name: null }),
]

/**
 * A transport recording every record write, and normalising the way the origin
 * does — the flat parts in, a name record back.
 */
function transportOver(rows = PEOPLE) {
  const people = rows.map((p) => ({ ...p }))
  const saved: Array<Record<string, unknown>> = []
  return {
    saved,
    people,
    list: async () => ({ people: people.map((p) => ({ ...p })), canInvite: true, canFulfil: false }),
    item: async (id: string) => ({
      person: { ...people.find((p) => p.id === id)! },
      operates: [],
      grants: [],
    }),
    saveRecord: async (id: string, patch: Record<string, unknown>) => {
      saved.push({ id, ...patch })
      const row = people.find((p) => p.id === id)!
      const next = { ...(row.name ?? named('')) }
      for (const [key, value] of Object.entries(patch)) {
        if (key === 'nameReason') continue
        if (key in next) (next as Record<string, unknown>)[key] = String(value ?? '').trim() || null
      }
      // A NAME CHANGE KEEPS THE OLD NAME, which is what makes the *formerly*
      // line and the search below real rather than a fixture.
      if (patch.nameReason === 'changed' && row.name) {
        row.formerNames = [...row.formerNames, row.name.displayName]
      }
      row.name = next.displayName ? (next as PersonName) : null
      return { ...row }
    },
    grant: async () => ({}),
    revoke: async () => ({}),
    invite: async () => ({ created: true, person: { ...people[0] } }),
    fulfil: async () => ({}),
  }
}

beforeAll(async () => {
  if (WEBUI_INSTALLED) {
    ;({ createPeoplePanel, NO_NAME_YET } = await import('../apps/control-app/src/builder/people.js'))
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

async function panel(transport = transportOver()) {
  const made = createPeoplePanel({ storage: memoryStorage(), transport })
  root.append((made as unknown as { element: HTMLElement }).element)
  await (made as unknown as { refresh(): Promise<unknown> }).refresh()
  return { made, transport }
}

async function open(id: string, transport = transportOver()) {
  const opened = await panel(transport)
  ;(opened.made as unknown as { listDetail: { select(k: string): void } }).listDetail.select(id)
  await settle()
  await settle()
  return { ...opened, detail: root.querySelector('.builder-people__detail') as HTMLElement }
}

/** The `webui-fields` row for one field, by the label it was declared with. */
function field(label: string): HTMLElement | null {
  for (const row of root.querySelectorAll('.fields-row')) {
    if (row.querySelector('.fields-label')?.textContent?.trim() === label) return row as HTMLElement
  }
  return null
}

const valueOf = (label: string) => field(label)?.querySelector('.fields-value')?.textContent ?? null

/** Type into a field the way the operator does: click, type, confirm with Enter. */
async function type(label: string, text: string): Promise<void> {
  const cell = field(label)!.querySelector('.fields-value') as HTMLElement
  cell.click()
  await settle()
  const box = field(label)!.querySelector('input, textarea') as HTMLInputElement
  box.value = text
  box.dispatchEvent(new Event('input', { bubbles: true }))
  box.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
  await settle()
  await settle()
}

const rows = () => [...root.querySelectorAll('.builder-people__row')]
const who = () => rows().map((r) => r.querySelector('.builder-people__who')!.textContent)

async function search(text: string) {
  const box = root.querySelector('.builder-people__search') as HTMLInputElement
  box.value = text
  box.dispatchEvent(new Event('input', { bubbles: true }))
  await settle()
}

describe.skipIf(!WEBUI_INSTALLED)('REQ-193 — the list shows a name, or says there is none', () => {
  it('test_UAT_FC_REQ-193_a_mononym_renders_as_itself_and_not_as_a_missing_surname', async () => {
    // Prince. The row draws what was stored, so a person with no given name and
    // no family name is an ordinary row rather than a blank cell.
    await panel()
    expect(who()).toContain('Prince')
  })

  it('test_UAT_FC_REQ-193_a_person_with_no_name_reads_as_no_name_yet', async () => {
    // Every part of a name is optional, and having none at all is a state a
    // captured contact is in permanently. It says so in words.
    await panel()
    const cell = rows()[3].querySelector('.builder-people__who')!
    expect(cell.textContent).toBe(NO_NAME_YET)
    expect(cell.classList.contains('builder-people__noname')).toBe(true)
  })

  it('test_UAT_FC_REQ-193_searching_a_former_name_finds_the_row_and_says_why_it_matched', async () => {
    // *Sarah Jones; oh, she is Sarah Patel now.* Without the *formerly* line the
    // operator is looking at a result they cannot account for.
    await panel()

    await search('sarah jones')

    expect(who()).toEqual(['Sarah Patel'])
    expect(rows()[0].querySelector('.builder-people__formerly')!.textContent).toContain(
      'Sarah Jones',
    )
  })

  it('test_UAT_FC_REQ-193_a_row_with_no_former_name_draws_no_formerly_line', async () => {
    // The corrected case reaching the browser: a `corrected` supersession never
    // leaves the server, so the array is empty and there is nothing to draw.
    // Asserted because an empty label would read as a person who had a former
    // name and lost it.
    await panel()
    await search('prince')
    expect(rows()[0].querySelector('.builder-people__formerly')).toBeNull()
  })
})

describe.skipIf(!WEBUI_INSTALLED)('REQ-193 — the record pane is where the operator curates', () => {
  it('test_UAT_FC_REQ-193_every_part_of_the_name_has_a_box_and_shows_what_is_stored', async () => {
    // THE OPERATOR IS THE CURATOR and these fields are for them: the one who
    // corrects a spelling, who knows Robert is Bob, who knows this customer is
    // a Dr.
    await open('usr_bob')
    expect(valueOf('Name')).toBe('Robert Smith')
    expect(valueOf('Known as')).toBe('Bob')
    expect(valueOf('Title')).toBe('Dr')
    expect(valueOf('Given name')).toBe('Robert')
    expect(valueOf('Family name')).toBe('Smith')
    expect(valueOf('Suffix')).toBe('PhD')
    expect(field('Middle names')).toBeTruthy()
  })

  it('test_UAT_FC_REQ-193_the_greeting_is_shown_so_the_person_filling_it_in_can_see_it', async () => {
    // THE HIGHEST-FREQUENCY READ IN THE RECORD, and it derives from the parts
    // badly: Robert gets "Hi Robert," when everyone alive calls him Bob. An
    // operator typing `Known as` has no other way to see what it did.
    await open('usr_bob')
    expect(valueOf('Greeting')).toBe('Hi Bob,')
  })

  it('test_UAT_FC_REQ-193_the_greeting_falls_back_to_the_given_name_then_to_the_displayed_name', async () => {
    // The chain, at both of its other links — and never through the title, or a
    // greeting would one day read "Hi Dr,".
    await open('usr_sarah')
    expect(valueOf('Greeting')).toBe('Hi Sarah,')
    document.body.replaceChildren()
    root = document.createElement('div')
    document.body.append(root)
    await open('usr_prince')
    expect(valueOf('Greeting')).toBe('Hi Prince,')
  })

  it('test_UAT_FC_REQ-193_the_pane_says_which_names_this_person_used_to_have', async () => {
    // Displayable as *formerly*, which is the half of the `changed` marker the
    // search does not cover.
    await open('usr_sarah')
    expect(valueOf('Formerly')).toContain('Sarah Jones')
  })

  it('test_UAT_FC_REQ-193_editing_a_part_sends_that_part_alone_and_no_reason_at_all', async () => {
    // THE PLAIN PATH IS A CORRECTION. Sending no reason is what makes it one —
    // the server defaults to `corrected` — so this is asserted on the wire
    // rather than on anything rendered. A `nameReason` leaking in here would
    // turn every fixed typo into a searchable, displayable former name.
    const { transport } = await open('usr_bob')

    await type('Known as', 'Bobby')

    expect(transport.saved).toEqual([{ id: 'usr_bob', knownAs: 'Bobby' }])
    expect(transport.people.find((p) => p.id === 'usr_bob')!.name?.knownAs).toBe('Bobby')
  })

  it('test_UAT_FC_REQ-193_the_greeting_follows_the_part_that_was_just_edited', async () => {
    // The pane redraws from the SAVED row, so the derived rows cannot be left
    // describing the value that was there before the commit.
    await open('usr_bob')

    await type('Known as', 'Bobby')

    expect(valueOf('Greeting')).toBe('Hi Bobby,')
  })
})

describe.skipIf(!WEBUI_INSTALLED)('REQ-193 — a real name change is a deliberate act', () => {
  const openRename = async (id: string) => {
    const opened = await open(id)
    ;(root.querySelector('.builder-people__rename') as HTMLButtonElement).click()
    await settle()
    return opened
  }

  it('test_UAT_FC_REQ-193_the_dialog_says_what_it_will_do_before_it_is_used', async () => {
    // An operator reaching for this to fix a spelling has to be told, before
    // they press it, that the old name is kept, searched and shown.
    await openRename('usr_sarah')
    const hint = root.querySelector('.builder-people__rename-hint')!.textContent!
    expect(hint).toMatch(/spelling/i)
    expect(hint).toMatch(/formerly/i)
  })

  it('test_UAT_FC_REQ-193_it_is_prefilled_from_the_current_name_because_most_of_it_survives', async () => {
    await openRename('usr_bob')
    const box = (name: string) =>
      (root.querySelector(`.builder-people__rename-box[name="${name}"]`) as HTMLInputElement).value
    expect(box('displayName')).toBe('Robert Smith')
    expect(box('familyName')).toBe('Smith')
    expect(box('knownAs')).toBe('Bob')
  })

  it('test_UAT_FC_REQ-193_recording_a_change_sends_every_part_once_and_marks_it_changed', async () => {
    // ONE TRANSITION, ONE SUPERSESSION. Field-at-a-time commits would write
    // several rows into the history for a single event, and the timeline is what
    // this table exists to keep.
    const { transport } = await openRename('usr_sarah')

    const family = root.querySelector(
      '.builder-people__rename-box[name="familyName"]',
    ) as HTMLInputElement
    family.value = 'Okonkwo'
    const shown = root.querySelector(
      '.builder-people__rename-box[name="displayName"]',
    ) as HTMLInputElement
    shown.value = 'Sarah Okonkwo'
    ;(root.querySelector('.builder-modal__btn--primary') as HTMLButtonElement).click()
    await settle()
    await settle()

    expect(transport.saved).toHaveLength(1)
    expect(transport.saved[0]).toMatchObject({
      id: 'usr_sarah',
      displayName: 'Sarah Okonkwo',
      familyName: 'Okonkwo',
      nameReason: 'changed',
    })
    // Every part travels, so the dialog cannot be the surface that forgets one.
    expect(Object.keys(transport.saved[0]!).sort()).toEqual([
      'displayName',
      'familyName',
      'givenName',
      'id',
      'knownAs',
      'middleNames',
      'nameReason',
      'suffix',
      'title',
    ])
  })

  it('test_UAT_FC_REQ-193_the_old_name_becomes_a_former_name_the_list_can_be_searched_by', async () => {
    // The whole point of marking it, end to end: the operator who still knows
    // her as Sarah Patel finds Sarah Okonkwo.
    const { transport } = await openRename('usr_sarah')
    const shown = root.querySelector(
      '.builder-people__rename-box[name="displayName"]',
    ) as HTMLInputElement
    shown.value = 'Sarah Okonkwo'
    ;(root.querySelector('.builder-modal__btn--primary') as HTMLButtonElement).click()
    await settle()
    await settle()

    await search('sarah patel')

    expect(who()).toEqual(['Sarah Okonkwo'])
    expect(transport.people.find((p) => p.id === 'usr_sarah')!.formerNames).toContain('Sarah Patel')
  })
})

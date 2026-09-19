// @vitest-environment jsdom
/**
 * [[REQ-281]] — **the client gets rid of what they do not want to keep**.
 *
 * THE HALF A PERSON LOOKS AT. The `.workers` suite beside this one proves what
 * the origin does to D1 and R2; this proves the surface — where the control is,
 * what the confirmation says before anything happens, and what the screen does
 * once it has. The ticket's own scenario is in here: three near-identical
 * generated variants, of which the client wants one.
 *
 * WHAT IS ASSERTED IS WHAT THE DOM SAYS. The wording is asserted as wording,
 * deliberately and not as an incidental string: *"the wording should tell the
 * client what will and will not happen, in their terms"* is the requirement, and
 * the sentence about a placed picture staying on the site is the one the whole
 * CTA turns on — the opposite assumption is the natural one, and acting on it
 * would be alarming.
 *
 * THE TRANSPORT IS THE DOUBLE, as in every Library suite here: the panel's job
 * is to ask, once, when it has been told to.
 */

import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'

let createLibraryPanel: (opts?: Record<string, unknown>) => never

if (!WEBUI_INSTALLED) console.warn(`REQ-281 library suite skipped: ${WEBUI_SKIP_REASON}`)

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

function material(over: Record<string, unknown>): Record<string, unknown> {
  return {
    type: 'material',
    kind: 'image',
    content_type: 'image/png',
    role: 'site',
    rights: 'owned',
    republishable: true,
    exportable: false,
    origin: 'uploaded',
    placed_on: [],
    source_url: null,
    edits: [],
    description_status: 'ok',
    updated_at: '2026-09-18T12:00:00.000Z',
    ...over,
  }
}

/** The ticket's own case: three variants of one prompt, two of them unwanted. */
const CRUCIBLES = [
  material({
    uid: 'material-3328dff9',
    label: 'IMAGE-3',
    title: 'A crucible of molten metal leaning forward to pour',
    filename: 'crucible-a.png',
    origin: 'generated',
  }),
  material({
    uid: 'material-de9ac4ed',
    label: 'IMAGE-4',
    title: 'A crucible of molten metal leaning forward to pour',
    filename: 'crucible-b.png',
    origin: 'generated',
  }),
  material({
    uid: 'material-bd70d8d9',
    label: 'IMAGE-5',
    title: 'A crucible of molten metal leaning forward to pour',
    filename: 'crucible-c.png',
    origin: 'generated',
  }),
]

interface Log {
  removed: string[]
}

function transportOver(
  rows: Record<string, unknown>[],
  opts: { refuse?: string } = {},
): { transport: Record<string, unknown>; log: Log; deliver: (change: unknown) => void } {
  const log: Log = { removed: [] }
  let deliver: (change: unknown) => void = () => {}
  const transport = {
    list: async () => ({ material: rows.map((row) => ({ ...row })), seq: 1 }),
    item: async (uid: string) => ({
      ...rows.find((row) => row.uid === uid)!,
      body: 'About it.',
      members: [],
    }),
    save: async (uid: string, body: string) => ({ ...rows.find((row) => row.uid === uid)!, body }),
    setName: async (uid: string, title: string) => ({
      ...rows.find((row) => row.uid === uid)!,
      title,
    }),
    remove: async (uid: string) => {
      if (opts.refuse) throw new Error(opts.refuse)
      log.removed.push(uid)
      return { uid, forgotten: true }
    },
    fileUrl: (uid: string) => `/api/material/file?uid=${encodeURIComponent(uid)}`,
    subscribe: (_since: number, onChange: (change: unknown) => void) => {
      deliver = onChange
      return { close: () => {} }
    },
  }
  return { transport, log, deliver: (change: unknown) => deliver(change) }
}

beforeAll(async () => {
  if (WEBUI_INSTALLED) {
    ;({ createLibraryPanel } = await import('../apps/control-app/src/builder/library.js'))
  }
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as never
  globalThis.matchMedia ??= ((q: string) => ({
    matches: false,
    media: q,
    addEventListener() {},
    removeEventListener() {},
    addListener() {},
    removeListener() {},
    onchange: null,
    dispatchEvent: () => false,
  })) as never
})

let root: HTMLElement
beforeEach(() => {
  document.body.replaceChildren()
  root = document.createElement('div')
  document.body.append(root)
})

async function library(rows = CRUCIBLES, opts: { refuse?: string } = {}) {
  const { transport, log, deliver } = transportOver(rows, opts)
  const panel = createLibraryPanel({ storage: memoryStorage(), transport }) as unknown as {
    element: HTMLElement
    refresh: () => Promise<unknown>
  }
  root.append(panel.element)
  await panel.refresh()
  return { panel, log, deliver }
}

/** Open one item's detail and let its first request land. */
async function open(panel: { element: HTMLElement }, uid: string) {
  const row = panel.element.querySelector(`.list-detail-row[data-key="${uid}"]`) as HTMLElement
  row.click()
  await Promise.resolve()
  await Promise.resolve()
}

const rowKeys = (panel: { element: HTMLElement }) =>
  [...panel.element.querySelectorAll('.list-detail-row')].map((r) => r.getAttribute('data-key'))

const deleteButton = (panel: { element: HTMLElement }) =>
  panel.element.querySelector('.builder-library__delete') as HTMLButtonElement | null

const dialog = () => document.querySelector('.builder-modal') as HTMLElement | null

const dialogLines = () =>
  [...document.querySelectorAll('.builder-library__confirm')].map((p) => p.textContent ?? '')

const confirmButton = () =>
  document.querySelector('.builder-library__confirm-delete') as HTMLButtonElement

/** Whichever footer button is not the confirm — the way out. */
const cancelButton = () =>
  [...document.querySelectorAll('.builder-modal__footer .builder-modal__btn')].find(
    (b) => !b.classList.contains('builder-library__confirm-delete'),
  ) as HTMLButtonElement

// ── where it is ──────────────────────────────────────────────────────────────

describe('REQ-281 — reachable, not prominent', () => {
  it('test_UAT_FC_REQ-281_the_delete_control_is_in_the_detail_pane_and_not_on_the_row', async () => {
    // *"Deleting is rare and irreversible from the client's point of view. It
    // belongs in the detail pane, not on the row."* A row-level control on a
    // list of three identically-titled pictures is a control that gets pressed
    // on the wrong one.
    const { panel } = await library()
    expect(deleteButton(panel)).toBeNull()

    await open(panel, 'material-de9ac4ed')
    const button = deleteButton(panel)
    expect(button).not.toBeNull()
    expect(button?.textContent).toMatch(/library/i)

    // NOT INSIDE A ROW, asserted structurally rather than by position: it is in
    // the detail, which is the claim.
    expect(button?.closest('.list-detail-row')).toBeNull()
    expect(button?.closest('.builder-library__detail')).not.toBeNull()
  })

  it('test_UAT_FC_REQ-281_it_is_the_last_thing_on_the_pane_and_not_beside_the_name', async () => {
    // AS FAR FROM THE ACTIONS THEY USE OFTEN AS THE PANE GOES. The name box is
    // what a client comes here to fix on a generated image ([[REQ-220]]); a
    // destructive control next to it is one that will eventually be pressed by
    // accident. Asserted as document order, which is what a pointer follows.
    const { panel } = await library()
    await open(panel, 'material-de9ac4ed')
    const pane = panel.element.querySelector('.builder-library__detail') as HTMLElement
    const name = pane.querySelector('.builder-library__name') as HTMLElement
    const danger = pane.querySelector('.builder-library__danger') as HTMLElement

    expect(name.compareDocumentPosition(danger) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(pane.lastElementChild).toBe(danger)
  })
})

// ── what it says before it happens ───────────────────────────────────────────

describe('REQ-281 — the confirmation says what will and will not happen', () => {
  it('test_UAT_FC_REQ-281_pressing_delete_asks_first_and_removes_nothing_yet', async () => {
    const { panel, log } = await library()
    await open(panel, 'material-de9ac4ed')
    deleteButton(panel)!.click()

    expect(dialog()).not.toBeNull()
    // NOTHING HAS HAPPENED. The origin has not been called and the row is still
    // on screen — a dialog that deleted as it opened would be no dialog at all.
    expect(log.removed).toEqual([])
    expect(rowKeys(panel)).toHaveLength(3)

    // THE WAY OUT HOLDS FOCUS, on `domain.js`'s reasoning about releasing a
    // customer's domain: a return press aimed at something else must not land on
    // the control that deletes a client's file.
    expect(document.activeElement).toBe(cancelButton())
  })

  it('test_UAT_FC_REQ-281_it_says_what_is_lost_and_that_the_only_way_back_is_to_upload_it_again', async () => {
    // *"Say what is lost. The bytes, the description the describer wrote, the
    // edit recipe, and the item's place in any conversation that referred to it
    // by name."* The number is the shared reference ([[REQ-280]]), so a client
    // who has been saying `IMAGE-4` all afternoon is told that name stops
    // meaning anything.
    const { panel } = await library([
      { ...CRUCIBLES[1], edits: [{ op: 'crop', x: 0, y: 0, width: 0.5, height: 0.5 }] },
    ])
    await open(panel, 'material-de9ac4ed')
    deleteButton(panel)!.click()

    const said = dialogLines().join(' ')
    expect(said).toMatch(/file/i)
    expect(said).toMatch(/what we wrote about it/i)
    expect(said).toMatch(/IMAGE-4/)
    expect(said).toMatch(/upload it again/i)
    // THE CROP IS NAMED BECAUSE THERE IS ONE.
    expect(said).toMatch(/crop/i)

    // AND THE TITLE NAMES THE THING, so a dialog opened over the wrong row is
    // visibly the wrong dialog.
    expect(document.querySelector('.builder-modal__title')?.textContent).toMatch(/IMAGE-4/)
  })

  it('test_UAT_FC_REQ-281_a_placed_picture_is_promised_it_stays_on_the_site', async () => {
    // **THE SENTENCE THE WHOLE CTA TURNS ON.** Placement COPIES the bytes, so
    // the page holds the site's own file and the catalogue entry is a different
    // object. Without this a client believes deleting takes their shopfront
    // photograph off their home page — and either will not press it, or will
    // press it believing they have edited their site.
    const { panel } = await library([{ ...CRUCIBLES[2], placed_on: ['acme'] }])
    await open(panel, 'material-bd70d8d9')
    deleteButton(panel)!.click()

    const said = dialogLines().join(' ')
    expect(said).toMatch(/stays on your site/i)
    expect(said).toMatch(/own copy/i)
    // AND IT SAYS WHERE THE OTHER OPERATION LIVES, because *"taking a picture
    // off a page is an editing operation on the page"* and a client told only
    // that this will not do it is left with no next step.
    expect(said).toMatch(/change to the page/i)
  })

  it('test_UAT_FC_REQ-281_an_unplaced_item_is_not_reassured_about_a_site_it_was_never_on', async () => {
    // A CONFIRMATION THAT LISTS CONSEQUENCES A READER CANNOT PLACE IS ONE THEY
    // STOP READING. Telling a client their unplaced photograph *stays on the
    // site* is a reassurance about something that never happened.
    const { panel } = await library()
    await open(panel, 'material-de9ac4ed')
    deleteButton(panel)!.click()

    expect(dialogLines().join(' ')).not.toMatch(/stays on your site/i)
  })
})

// ── what happens when it is answered ─────────────────────────────────────────

describe('REQ-281 — the row disappears and the pane goes with it', () => {
  it('test_UAT_FC_REQ-281_confirming_deletes_that_item_and_leaves_the_others_alone', async () => {
    // THE TICKET'S OWN SCENARIO: three near-identical variants, one of them
    // unwanted. The one that goes is the one whose pane was open, which on a
    // list where every title reads the same is the only way to tell.
    const { panel, log } = await library()
    await open(panel, 'material-de9ac4ed')
    deleteButton(panel)!.click()
    confirmButton().click()
    await Promise.resolve()
    await Promise.resolve()

    expect(log.removed).toEqual(['material-de9ac4ed'])
    expect(rowKeys(panel)).toEqual(['material-3328dff9', 'material-bd70d8d9'])
    // AND THE DIALOG IS GONE, rather than sitting over the list it just changed.
    expect(dialog()).toBeNull()
  })

  it('test_UAT_FC_REQ-281_the_pane_does_not_stay_open_over_a_file_that_is_gone', async () => {
    // THE ROWS AND THE DETAIL ARE HELD APART BY THE COMPONENT ([[BUG-89]]), so
    // removing the row alone would leave the client reading the description, the
    // rights record and the picture of a deleted file — and pressing its
    // buttons, including this one.
    const { panel } = await library()
    await open(panel, 'material-de9ac4ed')
    expect(panel.element.querySelector('.builder-library__detail')).not.toBeNull()

    deleteButton(panel)!.click()
    confirmButton().click()
    await Promise.resolve()
    await Promise.resolve()

    expect(panel.element.querySelector('.builder-library__detail')).toBeNull()
  })

  it('test_UAT_FC_REQ-281_keeping_it_deletes_nothing', async () => {
    const { panel, log } = await library()
    await open(panel, 'material-de9ac4ed')
    deleteButton(panel)!.click()
    cancelButton().click()

    expect(dialog()).toBeNull()
    expect(log.removed).toEqual([])
    expect(rowKeys(panel)).toHaveLength(3)
    // AND THE PANE IS STILL THERE, because nothing happened.
    expect(panel.element.querySelector('.builder-library__detail')).not.toBeNull()
  })

  it('test_UAT_FC_REQ-281_a_refused_deletion_says_why_and_keeps_the_file', async () => {
    // THE ONE ACTION ON THIS PANE THAT CANNOT BE ROLLED BACK BY REDRAWING, so a
    // refusal has to reach the person who asked rather than being reported into
    // a pane they are no longer looking at. The dialog stays open and carries
    // the origin's own sentence.
    const { panel, log } = await library(CRUCIBLES, { refuse: 'the store is unhappy' })
    await open(panel, 'material-de9ac4ed')
    deleteButton(panel)!.click()
    confirmButton().click()
    await Promise.resolve()
    await Promise.resolve()

    expect(dialog()).not.toBeNull()
    expect(document.querySelector('.builder-library__confirm-failed')?.textContent).toMatch(
      /the store is unhappy/,
    )
    expect(log.removed).toEqual([])
    expect(rowKeys(panel)).toHaveLength(3)
    // AND IT CAN BE ANSWERED AGAIN, rather than leaving a dialog with two dead
    // buttons in it.
    expect(confirmButton().disabled).toBe(false)
  })

  it('test_UAT_FC_REQ-281_a_deletion_made_elsewhere_takes_the_row_and_the_pane_too', async () => {
    // THE SAME OUTCOME BY THE OTHER ROUTE IN. An archive raises the change
    // feed's `exit` ([[REQ-201]]), which this tab already dropped the row for —
    // what it did not do was close a pane standing open over the deleted file,
    // which is the identical stale assertion the case above rules out.
    const { panel, deliver } = await library()
    await open(panel, 'material-bd70d8d9')
    expect(panel.element.querySelector('.builder-library__detail')).not.toBeNull()

    deliver({ seq: 2, kind: 'exit', cause: 'archive', uid: 'material-bd70d8d9', row: null })

    expect(rowKeys(panel)).toEqual(['material-3328dff9', 'material-de9ac4ed'])
    expect(panel.element.querySelector('.builder-library__detail')).toBeNull()
  })

  it('test_UAT_FC_REQ-281_an_exit_for_another_item_leaves_the_open_pane_alone', async () => {
    // THE GUARD ON THE ABOVE. `clearDetail` closes whatever detail is active, so
    // without the check a deletion made in another tab would shut the pane a
    // client is reading about something else entirely.
    const { panel, deliver } = await library()
    await open(panel, 'material-de9ac4ed')

    deliver({ seq: 2, kind: 'exit', cause: 'archive', uid: 'material-3328dff9', row: null })

    expect(rowKeys(panel)).toEqual(['material-de9ac4ed', 'material-bd70d8d9'])
    // THE PANE THE CLIENT IS READING IS STILL THE PANE THE CLIENT IS READING.
    const still = panel.element.querySelector('.builder-library__detail')
    expect(still).not.toBeNull()
    expect(deleteButton(panel)).not.toBeNull()
  })
})

// @vitest-environment jsdom
/**
 * REQ-213 — **the one row of the rights record the client may correct**.
 *
 * WHAT THIS FILE PROVES, and what its sibling proves instead. The workers suite
 * beside it is the CONTRACT — what the correction does to the rights record, to
 * the bytes, and the two ways the origin refuses it. This is the SURFACE: that
 * the field is offered where it may be offered and nowhere else, that it edits in
 * the vocabulary it displays, that a change repaints everything it changed, and
 * that a refusal comes back to the client instead of being swallowed.
 *
 * MOUNTED AGAINST THE ACTUALLY-INSTALLED COMPONENTS, on the pattern every Library
 * suite here follows. The acceptance is specifically that this is `mountFields`
 * CONFIGURED — the block that was already on screen, with one row unlocked —
 * rather than a second editing vocabulary bolted beside it, and a mocked
 * `webui-fields` would assert the mock. The only doubles are the HTTP calls,
 * because they are the network.
 *
 * THE CLAIMS, in the order the ticket makes them:
 *
 *  1. `What it is for` IS EDITABLE ON AN UPLOAD, AND EVERY OTHER ROW OF THE
 *     RIGHTS RECORD IS STILL NOT. DOC-38 §10.1 is untouched.
 *  2. THE SELECT OFFERS THE WORDS THE BLOCK ALREADY DISPLAYS, and sends the wire
 *     value — a field that reads one way and edits another teaches the client the
 *     wrong vocabulary for their own data.
 *  3. A CHANGE REPAINTS EVERYTHING IT CHANGED — `republishable` and `placed_on`
 *     on the same block, and the row's badge and warning in the list.
 *  4. MATERIAL WHOSE ROLE NOBODY CHOSE IS NOT OFFERED AS EDITABLE. A control that
 *     always fails is worse than no control.
 *  5. A REFUSAL ROLLS THE CONTROL BACK AND SAYS WHY, against the field.
 */

import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'
import { UPLOAD_AREAS } from '../apps/control-app/src/builder/config.js'

let createLibraryPanel: (opts?: Record<string, unknown>) => never

if (!WEBUI_INSTALLED) console.warn(`REQ-213 library suite skipped: ${WEBUI_SKIP_REASON}`)

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

function material(over: Record<string, unknown>): Record<string, unknown> {
  return {
    type: 'material',
    kind: 'image',
    role: 'site',
    rights: 'owned',
    republishable: true,
    exportable: false,
    origin: 'uploaded',
    placed_on: [],
    source_url: null,
    description_status: 'ok',
    description_model: 'stub/vision-1',
    updated_at: '2026-09-09T12:00:00.000Z',
    ...over,
  }
}

/**
 * Four rows: the mis-drop, the placed asset, and the two origins that are not
 * the client's to correct.
 *
 * THE LAST TWO ARE WHY THE GATE IS `origin` AND NOT `republishable`. The capture
 * is of the client's OWN old site, so `captureRights` made it `owned` and
 * republishable — a surface that unlocked the field on the strength of that bit
 * would offer an edit the origin refuses with a 403.
 */
const MATERIAL = [
  material({
    uid: 'mis-drop',
    title: 'The shopfront at dusk',
    filename: 'shopfront.jpg',
    role: 'reference',
    republishable: false,
  }),
  material({
    uid: 'landed',
    title: 'The wordmark',
    filename: 'wordmark.svg',
    placed_on: ['alpha'],
  }),
  material({
    uid: 'we-fetched-it',
    title: 'An industry report',
    filename: 'report.txt',
    kind: 'document',
    role: 'reference',
    rights: 'third_party',
    republishable: false,
    exportable: true,
    origin: 'fetched',
    source_url: 'https://example.com/report.txt',
  }),
  material({
    uid: 'we-captured-it',
    type: 'reference',
    title: 'Their old site',
    kind: 'capture',
    role: 'reference',
    rights: 'owned',
    republishable: true,
    origin: 'captured',
    source_url: 'https://theirs.example/',
  }),
]

/** What the origin answered, and what it was asked. Recorded, never asserted blind. */
function transportOver(rows = MATERIAL) {
  const calls: Array<{ uid: string; role: string }> = []
  let answer: (uid: string, role: string) => Promise<Record<string, unknown>> = async (uid, role) => {
    const row = rows.find((r) => r.uid === uid)!
    // WHAT THE ORIGIN ACTUALLY RETURNS: the row after the write, with
    // `republishable` re-derived and `placed_on` filled in by the placement.
    return {
      ...row,
      role,
      republishable: role !== 'reference',
      placed_on: role === 'site' ? ['alpha'] : (row.placed_on as string[]),
    }
  }
  return {
    calls,
    refuseWith(message: string) {
      answer = async () => {
        throw new Error(message)
      }
    },
    list: async () => ({ material: rows.map((row) => ({ ...row })) }),
    item: async (uid: string) => ({ ...rows.find((row) => row.uid === uid)!, body: 'About it.' }),
    save: async (uid: string, body: string) => ({ ...rows.find((r) => r.uid === uid)!, body }),
    setRole: async (uid: string, role: string) => {
      calls.push({ uid, role })
      return answer(uid, role)
    },
    fileUrl: (uid: string) => `/api/material/file?uid=${encodeURIComponent(uid)}`,
  }
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

/** A mounted Library with one row's detail open. */
async function opened(uid: string, rows = MATERIAL) {
  const transport = transportOver(rows)
  const panel = createLibraryPanel({ storage: memoryStorage(), transport }) as never as {
    element: HTMLElement
    listDetail: { select(key: string): void }
    refresh(): Promise<void>
  }
  root.append(panel.element)
  await panel.refresh()
  panel.listDetail.select(uid)
  await settle()
  const rights = panel.element.querySelector('.builder-library__rights')!
  return { panel, transport, rights }
}

const fieldRow = (rights: Element, name: string) =>
  rights.querySelector(`.fields-row[data-field="${name}"]`)!

/** Open the role editor the way a client does: click its read cell. */
function openRoleEditor(rights: Element): HTMLSelectElement {
  const cell = fieldRow(rights, 'role').querySelector('.fields-value-editable') as HTMLElement
  cell.click()
  return fieldRow(rights, 'role').querySelector('select') as HTMLSelectElement
}

/** Pick an option, the way a client does. */
async function pick(select: HTMLSelectElement, label: string) {
  select.value = label
  select.dispatchEvent(new Event('change', { bubbles: true }))
  await settle()
}

describe.skipIf(!WEBUI_INSTALLED)('REQ-213 — one row unlocked, and only one', () => {
  it('test_UAT_FC_REQ-213_what_it_is_for_is_editable_and_the_rest_of_the_rights_record_is_not', async () => {
    const { rights } = await opened('mis-drop')

    // THE ONE ROW THAT WAS NEVER INFERRED. For an upload, *what it is for* is
    // which of two drop areas a human chose (REQ-161) — so correcting a mis-drop
    // asserts nothing DOC-38 §10.1 has not already accepted.
    expect(fieldRow(rights, 'role').classList.contains('is-editable')).toBe(true)

    // AND EVERY OTHER ROW IS STILL LOCKED, which is the check on the whole change
    // rather than a style rule. §10.1 infers the rights record from provenance
    // precisely so the client is never put in front of a legal question; a
    // `republishable` they could set by hand would be that question with a
    // checkbox on it. The component marks an editable row `is-editable`, so its
    // absence is the mechanical form of the claim.
    for (const row of rights.querySelectorAll('.fields-row')) {
      const name = row.getAttribute('data-field') ?? ''
      if (name === 'role') continue
      expect(row.classList.contains('is-editable'), name).toBe(false)
    }
  })

  it('test_UAT_FC_REQ-213_material_whose_role_nobody_chose_is_not_offered_as_editable', async () => {
    // A CONTROL THAT ALWAYS FAILS IS WORSE THAN NO CONTROL, so the surface holds
    // the same `origin` rule the gate does.
    for (const uid of ['we-fetched-it', 'we-captured-it']) {
      const { rights } = await opened(uid)
      const row = fieldRow(rights, 'role')
      expect(row.classList.contains('is-editable'), uid).toBe(false)
      expect(row.querySelector('.fields-value-editable'), uid).toBeNull()
    }
  })

  it('test_UAT_FC_REQ-213_a_capture_is_locked_even_though_its_bytes_are_republishable', async () => {
    // THE ORIGIN THAT IS NOT A NEAR MISS. A capture of the client's own old site
    // is `owned` and republishable, so a surface gated on that bit would unlock
    // this one — and the origin would then refuse every click with a 403. The
    // rule is `origin`, and this row is the reason it has to be.
    const { rights } = await opened('we-captured-it')
    expect(fieldRow(rights, 'republishable').textContent).toContain('Yes')
    expect(fieldRow(rights, 'role').classList.contains('is-editable')).toBe(false)
  })
})

describe.skipIf(!WEBUI_INSTALLED)('REQ-213 — it edits in the vocabulary it displays', () => {
  it('test_UAT_FC_REQ-213_the_select_offers_the_words_the_block_already_displays', async () => {
    const { rights } = await opened('mis-drop')

    // THE BLOCK HAS ALWAYS RENDERED A ROLE AS ITS LABEL, so the options are those
    // labels. Offering `site` / `reference` would mean the field reads one way and
    // edits another, which is the commonest way a form teaches somebody the wrong
    // vocabulary for their own data.
    expect(fieldRow(rights, 'role').textContent).toContain('Background information')

    const select = openRoleEditor(rights)
    expect([...select.options].map((o) => o.textContent)).toEqual(
      UPLOAD_AREAS.map((a: { label: string }) => a.label),
    )
    // NO EMPTY OPTION: a material is for one of two things, and "neither" is not
    // an answer a client can give.
    expect([...select.options].map((o) => o.value)).not.toContain('')
    // AND IT OPENS ON WHAT THE ROW ALREADY SAYS.
    expect(select.value).toBe('Background information')
  })

  it('test_UAT_FC_REQ-213_picking_an_option_sends_the_wire_value_and_not_the_label', async () => {
    const { rights, transport } = await opened('mis-drop')
    await pick(openRoleEditor(rights), 'Site asset')

    // THE ROUND TRIP IS EXPLICIT. The origin has never been asked to parse the
    // words a client saw; both directions derive from the upload overlay's own
    // area list, so the drop areas stay the single place the two roles are named.
    expect(transport.calls).toEqual([{ uid: 'mis-drop', role: 'site' }])
  })
})

describe.skipIf(!WEBUI_INSTALLED)('REQ-213 — a change repaints everything it changed', () => {
  it('test_UAT_FC_REQ-213_the_whole_rights_block_repaints_not_just_the_row_that_was_picked', async () => {
    const { rights } = await opened('mis-drop')
    expect(fieldRow(rights, 'republishable').textContent).toContain('No')
    expect(fieldRow(rights, 'placed_on').textContent).not.toContain('alpha')

    await pick(openRoleEditor(rights), 'Site asset')

    // A ROLE CHANGE IS NOT CONFINED TO ITS OWN FIELD: the origin derives
    // `republishable` from it, and widening PLACES the bytes and writes
    // `placed_on`. Both sit two rows below the one the client just used, and
    // leaving them showing the old answer would make the record contradict itself
    // on screen — the client would be looking at a site asset that says it may not
    // be published.
    expect(fieldRow(rights, 'role').textContent).toContain('Site asset')
    expect(fieldRow(rights, 'republishable').textContent).toContain('Yes')
    expect(fieldRow(rights, 'placed_on').textContent).toContain('alpha')
  })

  it('test_UAT_FC_REQ-213_the_list_redraws_because_the_badge_and_the_warning_read_what_changed', async () => {
    const { panel, rights } = await opened('mis-drop')
    const listRow = () => panel.element.querySelector('.list-detail-row[data-key="mis-drop"]')!
    expect(listRow().querySelector('.builder-library__badge--role')!.textContent).toBe(
      'Background information',
    )
    // NOT WARNED WHILE IT IS BACKGROUND INFORMATION — REQ-181's predicate is two
    // facts, and a reference row's `placed_on` is empty by construction.
    expect(listRow().querySelector('.builder-library__badge--unplaced')).toBeNull()

    await pick(openRoleEditor(rights), 'Site asset')

    expect(listRow().querySelector('.builder-library__badge--role')!.textContent).toBe('Site asset')
    // AND STILL NOT WARNED, because the bytes actually landed. That is the whole
    // reason the correction places rather than only relabelling: without it the
    // row would flip straight to "Not on the site", which would be true and
    // useless.
    expect(listRow().querySelector('.builder-library__badge--unplaced')).toBeNull()
  })

  it('test_UAT_FC_REQ-213_a_correction_that_could_not_be_placed_is_warned_about_by_the_row', async () => {
    // THE SOFT FAILURE, SEEN FROM THE SURFACE. The origin keeps the role change
    // and reports that the bytes did not get there; REQ-181's badge is what says
    // so, and it fires here for exactly the reason it was built.
    const rows = [material({ uid: 'homeless', title: 'A logo', filename: 'logo.svg', role: 'reference', republishable: false })]
    const transport = transportOver(rows)
    // No site to place on: the role lands, `placed_on` stays empty.
    transport.setRole = async (uid: string, role: string) => {
      transport.calls.push({ uid, role })
      return { ...rows[0], role, republishable: true, placed_on: [] }
    }
    const panel = createLibraryPanel({ storage: memoryStorage(), transport }) as never as {
      element: HTMLElement
      listDetail: { select(key: string): void }
      refresh(): Promise<void>
    }
    root.append(panel.element)
    await panel.refresh()
    panel.listDetail.select('homeless')
    await settle()

    const rights = panel.element.querySelector('.builder-library__rights')!
    await pick(openRoleEditor(rights), 'Site asset')

    const warn = panel.element.querySelector(
      '.list-detail-row[data-key="homeless"] .builder-library__badge--unplaced',
    )!
    expect(warn).toBeTruthy()
    expect(warn.textContent).toContain('Not on the site')
  })
})

describe.skipIf(!WEBUI_INSTALLED)('REQ-213 — a refusal reaches the person who clicked', () => {
  it('test_UAT_FC_REQ-213_a_refused_correction_rolls_the_control_back_and_says_why', async () => {
    // THE ORIGIN REFUSES THIS IN TWO NAMED WAYS, and each carries a sentence
    // written for the person who clicked. Swallowing it would leave them looking
    // at a select that snapped back for no stated reason — which reads as a bug in
    // the builder rather than as the answer it is.
    const { rights, transport } = await opened('landed')
    const refusal =
      'This is already on your site, so it cannot go back to being just for me to read. ' +
      'Take it off your site first.'
    transport.refuseWith(refusal)

    expect(fieldRow(rights, 'role').textContent).toContain('Site asset')
    await pick(openRoleEditor(rights), 'Background information')

    // ROLLED BACK to what the record still says…
    expect(fieldRow(rights, 'role').textContent).toContain('Site asset')
    expect(fieldRow(rights, 'republishable').textContent).toContain('Yes')
    // …AND THE REASON IS SHOWN AGAINST THE FIELD, verbatim. The component's own
    // `.fields-error` is the alert region, so this is the same failure vocabulary
    // every other field in the builder uses.
    const error = fieldRow(rights, 'role').querySelector('.fields-error')!
    expect(error.textContent).toBe(refusal)
    expect(error.getAttribute('role')).toBe('alert')

    // AND THE LIST STILL AGREES WITH THE RECORD rather than with the click.
    expect(transport.calls).toEqual([{ uid: 'landed', role: 'reference' }])
  })
})

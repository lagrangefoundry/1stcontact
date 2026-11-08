// @vitest-environment jsdom
/**
 * Library (STORY-1500b111) — the detail pane with an upload's role correctable,
 * the SURFACE half, as reconciled in BUNDLE-41 (REQ-213).
 *
 * WHAT THIS FILE PROVES. The detail shows the file and a record that is
 * read-only but for one row of one origin (AC-1717); the description, and on an
 * upload only the role, are the editable fields (AC-1718); the role select
 * offers the drop-area labels, sends the role id, and repaints everything it
 * changed (AC-2458); fetched and captured material, however permissive its
 * rights, is offered no role control while material with no recorded origin is
 * (AC-2459); and a 409 refusal of a narrowing rolls the select back and shows
 * why against the field (AC-2461). The route half is
 * `reconciliation-library-role-correction.workers.test.ts`.
 *
 * MOUNTED AGAINST THE ACTUALLY-INSTALLED webui COMPONENTS, on the pattern every
 * Library suite follows, and SKIPPED with a reason where they are not
 * installed. The only double is the network (`transport`); for AC-2461 the
 * refusal travels through the real `saveMaterialRole` over a fetch double, so
 * the sentence shown is the one the route's envelope carries.
 */

import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'
import { UPLOAD_AREAS } from '../apps/control-app/src/builder/config.js'

let createLibraryPanel: (opts?: Record<string, unknown>) => never
let saveMaterialRole: (uid: string, role: string, fetchImpl: typeof fetch) => Promise<Record<string, unknown>>
let setSanitizer: (fn: ((html: string) => string) | null) => unknown
let setParser: (parser: unknown) => unknown

if (!WEBUI_INSTALLED) console.warn(`Library role-correction suite skipped: ${WEBUI_SKIP_REASON}`)

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
    updated_at: '2026-11-08T12:00:00.000Z',
    ...over,
  }
}

const MATERIAL = [
  material({ uid: 'landed', title: 'The wordmark', filename: 'wordmark.png', placed_on: ['salon'] }),
  material({
    uid: 'mis-drop',
    title: 'The shopfront',
    filename: 'shopfront.jpg',
    role: 'reference',
    republishable: false,
  }),
  material({
    uid: 'guidelines',
    title: 'Brand guidelines',
    filename: 'guidelines.pdf',
    kind: 'document',
    content_type: 'application/pdf',
    role: 'reference',
    republishable: false,
  }),
  material({ uid: 'a-font', title: 'Plex Sans', filename: 'plex.woff2', kind: 'font', content_type: 'font/woff2' }),
  material({
    uid: 'fetched',
    title: 'An industry report',
    filename: 'report.txt',
    kind: 'document',
    content_type: 'text/plain',
    role: 'reference',
    rights: 'third_party',
    republishable: false,
    exportable: true,
    origin: 'fetched',
    source_url: 'https://example.com/report.txt',
  }),
  material({
    uid: 'captured',
    type: 'reference',
    title: 'Our old site',
    kind: 'capture',
    role: 'reference',
    rights: 'owned',
    republishable: true,
    origin: 'captured',
    source_url: 'https://ours.example/',
  }),
  material({
    uid: 'no-origin',
    title: 'An older upload',
    filename: 'old-logo.png',
    role: 'reference',
    republishable: false,
    origin: undefined,
  }),
  material({ uid: 'undescribed', title: 'The awning', filename: 'awning.jpg', description_status: 'no_describer' }),
]

const MARKDOWN = '## The wordmark\n\nGold on **cream**, set _tight_.'
const BODIES: Record<string, string> = { undescribed: '' }

function transportOver(rows = MATERIAL) {
  const roleCalls: Array<{ uid: string; role: string }> = []
  const saved: Array<{ uid: string; body: string }> = []
  const t = {
    roleCalls,
    saved,
    failSave: false,
    list: async () => ({ material: rows.map((row) => ({ ...row })) }),
    item: async (uid: string) => ({
      ...rows.find((row) => row.uid === uid)!,
      body: uid in BODIES ? BODIES[uid] : MARKDOWN,
      members: [],
    }),
    save: async (uid: string, body: string) => {
      saved.push({ uid, body })
      if (t.failSave) throw new Error('the store refused the write')
      return { ...rows.find((row) => row.uid === uid)!, description_status: 'ok', body }
    },
    setRole: async (uid: string, role: string): Promise<Record<string, unknown>> => {
      roleCalls.push({ uid, role })
      const row = rows.find((r) => r.uid === uid)!
      // What the route returns: the stored row, republishable re-derived and,
      // on a widening that placed, placed_on filled in.
      return { ...row, role, republishable: role !== 'reference', placed_on: role === 'site' ? ['salon'] : [] }
    },
    fileUrl: (uid: string, member?: string) =>
      `/api/material/file?uid=${encodeURIComponent(uid)}${member ? `&member=${encodeURIComponent(member)}` : ''}`,
  }
  return t
}

type Panel = {
  element: HTMLElement
  listDetail: { select: (uid: string) => void }
  refresh: () => Promise<unknown>
  getRows: () => Array<Record<string, unknown>>
}

beforeAll(async () => {
  if (WEBUI_INSTALLED) {
    ;({ createLibraryPanel } = await import('../apps/control-app/src/builder/library.js'))
    ;({ saveMaterialRole } = await import('../apps/control-app/src/builder/api.js'))
    ;({ setSanitizer } = await import('@lagrangefoundry/webui-chat'))
    ;({ setParser } = await import('@lagrangefoundry/webui-markdown'))
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

afterEach(() => {
  if (WEBUI_INSTALLED) {
    setSanitizer(null)
    setParser(null)
  }
})

/** A minimal markdown engine (marked is a CDN import that cannot run here) and a pass-through scrubber. */
function installEngines() {
  const inline = (md: string) =>
    md.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/_(.+?)_/g, '<em>$1</em>')
  setParser({
    parse: (md: string) =>
      md
        .trim()
        .split(/\n{2,}/)
        .map((block) =>
          block.startsWith('## ') ? `<h2>${inline(block.slice(3))}</h2>` : `<p>${inline(block)}</p>`,
        )
        .join(''),
    parseInline: inline,
  })
  setSanitizer((html: string) => html)
}

async function library(transport = transportOver()) {
  const panel = createLibraryPanel({
    storage: memoryStorage(),
    transport,
    markdownReady: Promise.resolve(),
  }) as unknown as Panel
  root.append(panel.element)
  await panel.refresh()
  return { panel, transport }
}

async function open(panel: Panel, uid: string) {
  panel.listDetail.select(uid)
  await settle()
  return panel.element.querySelector('.list-detail-detail-body')!
}

const rightsOf = (detail: Element) => detail.querySelector('.builder-library__rights')!
const fieldRow = (scope: Element, name: string) => scope.querySelector(`.fields-row[data-field="${name}"]`)!
const editableFields = (scope: Element) =>
  [...scope.querySelectorAll('.fields-row.is-editable')].map((r) => r.getAttribute('data-field'))

function openRoleEditor(rights: Element): HTMLSelectElement {
  ;(fieldRow(rights, 'role').querySelector('.fields-value-editable') as HTMLElement).click()
  return fieldRow(rights, 'role').querySelector('select') as HTMLSelectElement
}

async function pick(select: HTMLSelectElement, label: string) {
  select.value = label
  select.dispatchEvent(new Event('change', { bubbles: true }))
  await settle()
}

const listRow = (panel: Panel, uid: string) => panel.element.querySelector(`.list-detail-row[data-key="${uid}"]`)!

describe.skipIf(!WEBUI_INSTALLED)('AC-1717 — the file itself, and the record read-only but for an upload\'s role', () => {
  it('test_UAT_AC1717_detail_shows_the_file_and_a_record_read_only_except_an_uploads_role', async () => {
    const { panel } = await library()

    // A PICTURE rendered from its own bytes, with a download under its filename.
    const image = await open(panel, 'landed')
    const img = image.querySelector('.builder-library__image') as HTMLImageElement
    expect(img.getAttribute('src')).toBe('/api/material/file?uid=landed')
    const imgDownload = image.querySelector('.builder-library__download') as HTMLAnchorElement
    expect(imgDownload.getAttribute('download')).toBe('wordmark.png')
    // Bytes that cannot be read → a plain statement, not a broken image.
    img.dispatchEvent(new Event('error'))
    expect(image.querySelector('.builder-library__image')).toBeNull()
    expect(image.querySelector('.builder-library__missing')!.textContent).toMatch(/no longer in storage/i)
    expect(image.querySelector('.builder-library__download')).toBeTruthy()

    // A READABLE DOCUMENT in the reader above the record, download still present.
    const doc = await open(panel, 'guidelines')
    const reader = doc.querySelector('.builder-reader')!
    expect(reader).toBeTruthy()
    expect(reader.compareDocumentPosition(rightsOf(doc)) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect((doc.querySelector('.builder-library__download') as HTMLAnchorElement).getAttribute('download')).toBe(
      'guidelines.pdf',
    )

    // THE RECORD, every field displayed, on an upload only `role` editable.
    const rights = rightsOf(doc)
    for (const name of ['filename', 'kind', 'role', 'origin', 'rights', 'republishable', 'placed_on', 'source_url']) {
      expect(fieldRow(rights, name), name).toBeTruthy()
    }
    expect(fieldRow(rights, 'placed_on').textContent).toContain('Placed on')
    expect(editableFields(rights)).toEqual(['role'])

    // NOTHING NAMEABLE ON THE PANE LETS A CLIENT ASSERT RIGHTS: open the role
    // editor too, then every control lives in the description or the role row.
    openRoleEditor(rights)
    for (const c of doc.querySelectorAll('input, select, textarea, [contenteditable="true"]')) {
      const home = c.closest('.fields-row')?.getAttribute('data-field')
      expect(['body', 'role'], c.outerHTML).toContain(home)
    }
    expect(fieldRow(rights, 'rights').classList.contains('is-editable')).toBe(false)
    expect(fieldRow(rights, 'republishable').classList.contains('is-editable')).toBe(false)

    // A KIND NOTHING CAN RENDER: the download alone.
    const font = await open(panel, 'a-font')
    expect(font.querySelector('.builder-reader')).toBeNull()
    expect(font.querySelector('.builder-library__image')).toBeNull()
    expect((font.querySelector('.builder-library__download') as HTMLAnchorElement).getAttribute('download')).toBe(
      'plex.woff2',
    )

    // FETCHED AND CAPTURED: no row of the record editable at all.
    for (const uid of ['fetched', 'captured']) {
      const detail = await open(panel, uid)
      expect(editableFields(rightsOf(detail)), uid).toEqual([])
      expect(rightsOf(detail).querySelectorAll('.fields-value-editable, input, select, textarea'), uid).toHaveLength(0)
    }
  })
})

describe.skipIf(!WEBUI_INSTALLED)('AC-1718 — the description, and on an upload the role, are the editable fields', () => {
  it('test_UAT_AC1718_description_and_upload_role_are_editable_rendered_edited_as_source_and_stored', async () => {
    installEngines()
    const { panel, transport } = await library()

    // UNDESCRIBED material says so.
    const blank = await open(panel, 'undescribed')
    expect(blank.querySelector('.builder-library__status')!.textContent).toMatch(/Nothing has read this yet/i)

    // EDITABLE FIELDS: upload → description and role; fetched/captured → description only.
    expect(editableFields(blank).sort()).toEqual(['body', 'role'])
    for (const uid of ['fetched', 'captured']) {
      expect(editableFields(await open(panel, uid)), uid).toEqual(['body'])
    }

    // SHOWN RENDERED, not as markers.
    const detail = await open(panel, 'landed')
    const cell = () =>
      detail.querySelector('.builder-library__description .fields-row[data-field="body"] > .fields-value')!
    expect(cell().querySelector('h2')?.textContent).toBe('The wordmark')
    expect(cell().querySelector('strong')?.textContent).toBe('cream')
    expect(cell().querySelector('em')?.textContent).toBe('tight')
    expect(cell().textContent).not.toContain('**')
    expect(cell().textContent).not.toContain('##')

    // EDITED AS SOURCE.
    ;(cell() as HTMLElement).click()
    const control = detail.querySelector('.builder-library__description textarea') as HTMLTextAreaElement
    expect(control.value).toBe(MARKDOWN)

    // COMMITTED BY LEAVING THE FIELD: stored, repainted rendered, reflected in the row.
    control.value = 'The wordmark, **corrected**.'
    control.dispatchEvent(new Event('blur'))
    await settle()
    expect(transport.saved).toEqual([{ uid: 'landed', body: 'The wordmark, **corrected**.' }])
    expect(cell().querySelector('strong')?.textContent).toBe('corrected')
    expect(panel.getRows().find((r) => r.uid === 'landed')!.body).toBe('The wordmark, **corrected**.')

    // A FAILED WRITE reverts to the stored text, shown rendered again.
    transport.failSave = true
    ;(cell() as HTMLElement).click()
    const again = detail.querySelector('.builder-library__description textarea') as HTMLTextAreaElement
    again.value = 'This will not land.'
    again.dispatchEvent(new Event('blur'))
    await settle()
    expect(transport.saved.at(-1)).toEqual({ uid: 'landed', body: 'This will not land.' })
    expect(cell().textContent).not.toContain('This will not land.')
    expect(cell().querySelector('strong')?.textContent).toBe('corrected')
  })
})

describe.skipIf(!WEBUI_INSTALLED)('AC-2458 — the select edits in the drop-area labels and repaints everything it changed', () => {
  it('test_UAT_AC2458_role_select_offers_drop_area_labels_sends_role_id_and_repaints_block_and_row', async () => {
    const { panel, transport } = await library()
    const rights = rightsOf(await open(panel, 'mis-drop'))
    expect(fieldRow(rights, 'role').textContent).toContain('Background information')
    expect(fieldRow(rights, 'republishable').textContent).toContain('No')
    expect(fieldRow(rights, 'placed_on').textContent).not.toContain('salon')
    expect(listRow(panel, 'mis-drop').querySelector('.builder-library__badge--role')!.textContent).toBe(
      'Background information',
    )

    // THE OPTIONS ARE THE DROP AREAS' OWN LABELS, opened on the current one.
    const select = openRoleEditor(rights)
    expect([...select.options].map((o) => o.textContent)).toEqual(UPLOAD_AREAS.map((a: { label: string }) => a.label))
    expect([...select.options].map((o) => o.textContent)).toEqual(['Site asset', 'Background information'])
    expect(select.value).toBe('Background information')

    // PICKING COMMITS, sending the role id, not the label.
    await pick(select, 'Site asset')
    expect(transport.roleCalls).toEqual([{ uid: 'mis-drop', role: 'site' }])

    // THE WHOLE RIGHTS BLOCK REPAINTS from the returned row…
    expect(fieldRow(rights, 'role').textContent).toContain('Site asset')
    expect(fieldRow(rights, 'republishable').textContent).toContain('Yes')
    expect(fieldRow(rights, 'placed_on').textContent).toContain('salon')
    // …AND SO DOES THE LIST ROW: pill changed, no warning since it landed.
    expect(listRow(panel, 'mis-drop').querySelector('.builder-library__badge--role')!.textContent).toBe('Site asset')
    expect(listRow(panel, 'mis-drop').querySelector('.builder-library__badge--unplaced')).toBeNull()

    // A WIDENING THAT DID NOT PLACE leaves the row warned.
    transport.setRole = async (uid: string, role: string) => {
      transport.roleCalls.push({ uid, role })
      return { ...MATERIAL.find((r) => r.uid === uid)!, role, republishable: true, placed_on: [] }
    }
    await pick(openRoleEditor(rightsOf(await open(panel, 'no-origin'))), 'Site asset')
    expect(transport.roleCalls.at(-1)).toEqual({ uid: 'no-origin', role: 'site' })
    expect(listRow(panel, 'no-origin').querySelector('.builder-library__badge--unplaced')!.textContent).toContain(
      'Not on the site',
    )
  })
})

describe.skipIf(!WEBUI_INSTALLED)('AC-2459 — no role control where the origin chose the role', () => {
  it('test_UAT_AC2459_fetched_and_captured_offer_no_role_control_and_absent_origin_is_offered_one', async () => {
    const { panel, transport } = await library()

    for (const uid of ['fetched', 'captured']) {
      const rights = rightsOf(await open(panel, uid))
      const role = fieldRow(rights, 'role')
      expect(role.classList.contains('is-editable'), uid).toBe(false)
      expect(role.querySelector('.fields-value-editable, select'), uid).toBeNull()
      // Still SHOWN, read-only.
      expect(role.textContent, uid).toContain('Background information')
    }
    // The capture is owned and republishable — the gate is origin, not rights.
    const capture = rightsOf(await open(panel, 'captured'))
    expect(fieldRow(capture, 'republishable').textContent).toContain('Yes')
    expect(fieldRow(capture, 'rights').textContent).toContain('owned')

    // NO RECORDED ORIGIN reads as uploaded, as the route does.
    const legacy = rightsOf(await open(panel, 'no-origin'))
    expect(fieldRow(legacy, 'role').classList.contains('is-editable')).toBe(true)
    expect(transport.roleCalls).toEqual([])
  })
})

describe.skipIf(!WEBUI_INSTALLED)('AC-2461 — a placed material\'s narrowing is refused and the select reverts', () => {
  it('test_UAT_AC2461_refused_narrowing_reverts_the_select_to_site_asset_and_shows_the_409_against_the_field', async () => {
    const refusal =
      'This is already on your site, so it cannot go back to being just for me to read: the file is ' +
      'live where your visitors can see it. Take it off your site first.'
    const sent: Array<Record<string, unknown>> = []
    // The real browser call, over a network double answering as the route does.
    const fetch409 = (async (_url: string, init: RequestInit) => {
      sent.push(JSON.parse(String(init.body)))
      return new Response(JSON.stringify({ error: refusal, uid: 'landed', placed_on: ['salon'] }), {
        status: 409,
        headers: { 'content-type': 'application/json' },
      })
    }) as unknown as typeof fetch
    const transport = transportOver()
    transport.setRole = (uid: string, role: string) => saveMaterialRole(uid, role, fetch409)

    const { panel } = await library(transport)
    const rights = rightsOf(await open(panel, 'landed'))
    expect(fieldRow(rights, 'role').textContent).toContain('Site asset')

    await pick(openRoleEditor(rights), 'Background information')

    expect(sent).toEqual([{ uid: 'landed', role: 'reference' }])
    // REVERTED to what the record still says, and the record unchanged.
    expect(fieldRow(rights, 'role').textContent).toContain('Site asset')
    expect(fieldRow(rights, 'republishable').textContent).toContain('Yes')
    expect(fieldRow(rights, 'placed_on').textContent).toContain('salon')
    // THE REFUSAL SHOWN AGAINST THE FIELD.
    const error = fieldRow(rights, 'role').querySelector('.fields-error')!
    expect(error).toBeTruthy()
    expect(error.textContent).toBe(refusal)
    // The list row still says Site asset.
    expect(listRow(panel, 'landed').querySelector('.builder-library__badge--role')!.textContent).toBe('Site asset')
  })
})

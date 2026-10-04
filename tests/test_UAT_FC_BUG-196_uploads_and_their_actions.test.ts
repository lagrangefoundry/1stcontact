// @vitest-environment jsdom
/**
 * [[BUG-196]] — **an upload ask says what its files are for, takes several, and
 * every upload shows what the client can do with it.**
 *
 * THE REAL PANEL AND THE REAL LIBRARY, mounted in jsdom, with the origin replaced
 * at the transports they already take. What is read for evidence is what the
 * client sees (the picker, the buttons, the dialog) and what reached the
 * transport (each upload's role, each answer, each role change and deletion). The
 * server half — that a `site` upload is placeable and the consultant's operations
 * — is the workers suite's.
 */
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'

type Handle = Record<string, any>

let createPlanPanel: (opts?: Record<string, unknown>) => Handle
let createLibraryPanel: (opts?: Record<string, unknown>) => Handle

if (!WEBUI_INSTALLED) console.warn(`BUG-196 suites skipped: ${WEBUI_SKIP_REASON}`)

const settle = async (n = 10) => {
  for (let i = 0; i < n; i += 1) await new Promise((r) => setTimeout(r, 0))
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

const ask = (id: string, extra: Record<string, unknown> = {}) => ({
  id,
  prompt: `${id}?`,
  why: `Why ${id} matters.`,
  input: 'upload',
  needed_by: 'first_pass',
  blocking: false,
  status: 'open',
  ...extra,
})

function material(over: Record<string, unknown>): Record<string, unknown> {
  return {
    type: 'material',
    kind: 'image',
    content_type: 'image/jpeg',
    role: 'reference',
    rights: 'owned',
    republishable: false,
    exportable: false,
    origin: 'uploaded',
    placed_on: [],
    source_url: null,
    edits: [],
    description_status: 'ok',
    updated_at: '2026-10-03T12:00:00.000Z',
    ...over,
  }
}

/** A plan transport serving `view`, recording every call the panel makes. */
function planTransport(view: Record<string, unknown>) {
  const calls = {
    uploads: [] as { name: string; role: string }[],
    answers: [] as Record<string, unknown>[],
    roles: [] as [string, string][],
    removed: [] as string[],
  }
  let current = view
  let next = 0
  return {
    calls,
    set: (v: Record<string, unknown>) => {
      current = v
    },
    fetchPlan: async () => current,
    answerAsk: async (body: Record<string, unknown>) => {
      calls.answers.push(body)
      return current
    },
    uploadMaterial: async ({ file, role }: { file: File; role: string }) => {
      calls.uploads.push({ name: file.name, role })
      next += 1
      return { uid: `material-${next}` }
    },
    setRole: async (uid: string, role: string) => {
      calls.roles.push([uid, role])
      return {}
    },
    remove: async (uid: string) => {
      calls.removed.push(uid)
      return { uid, forgotten: true }
    },
  }
}

/** Pick `names` in a file input, as the browser's picker does. */
function pick(input: HTMLInputElement, names: string[]) {
  const files = names.map((n) => new File(['x'], n, { type: 'image/jpeg' }))
  Object.defineProperty(input, 'files', { value: files, configurable: true })
  input.dispatchEvent(new Event('change'))
}

beforeAll(async () => {
  if (WEBUI_INSTALLED) {
    ;({ createPlanPanel } = await import('../apps/control-app/src/builder/plan-panel.js'))
    ;({ createLibraryPanel } = await import('../apps/control-app/src/builder/library.js'))
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

async function panel(view: Record<string, unknown>) {
  const transport = planTransport(view)
  const p = createPlanPanel({ transport, getModalHost: () => root })
  root.append(p.element)
  await p.setSite('alpha')
  await settle()
  return { p, transport }
}

const block = (p: Handle, id: string): HTMLElement => p.element.querySelector(`[data-ask="${id}"]`) as HTMLElement

/** The delete control is a danger-styled button with a trash icon, not a link. */
function expectDangerButton(button: Element | null) {
  expect(button).not.toBeNull()
  expect(button!.tagName).toBe('BUTTON')
  expect(button!.classList.contains('builder-danger')).toBe(true)
  expect(button!.querySelector('svg')).not.toBeNull()
  expect(button!.textContent).toContain('Delete')
  expect(button!.getAttribute('aria-label')).toBe('Delete this from your Library')
}

describe.skipIf(!WEBUI_INSTALLED)('BUG-196 — an upload ask says what its files are for', () => {
  it('test_UAT_FC_BUG-196_a_site_ask_takes_several_files_and_uploads_them_all_as_site', async () => {
    const { p, transport } = await panel({
      phase: 'first_pass',
      asks: [ask('photos', { upload_role: 'site', multiple: true })],
    })
    const input = block(p, 'photos').querySelector('input[type=file]') as HTMLInputElement
    expect(input.multiple).toBe(true)

    pick(input, ['van.jpg', 'boiler.jpg', 'team.jpg'])
    await settle()

    // EVERY FILE, WITH THE ASK'S ROLE — not the constant `reference` it used to be.
    expect(transport.calls.uploads).toEqual([
      { name: 'van.jpg', role: 'site' },
      { name: 'boiler.jpg', role: 'site' },
      { name: 'team.jpg', role: 'site' },
    ])
    // ONE ANSWER, CITING ALL OF THEM.
    expect(transport.calls.answers).toEqual([
      { site: 'alpha', ask: 'photos', action: 'answer', answerMaterial: ['material-1', 'material-2', 'material-3'] },
    ])
  })

  it('test_UAT_FC_BUG-196_a_reference_ask_uploads_one_file_as_reference', async () => {
    const { p, transport } = await panel({
      phase: 'first_pass',
      asks: [ask('price_list', { upload_role: 'reference', multiple: false })],
    })
    const input = block(p, 'price_list').querySelector('input[type=file]') as HTMLInputElement
    expect(input.multiple).toBe(false)
    pick(input, ['prices.pdf'])
    await settle()
    expect(transport.calls.uploads).toEqual([{ name: 'prices.pdf', role: 'reference' }])
    expect(transport.calls.answers[0]).toMatchObject({ answerMaterial: 'material-1' })
  })
})

describe.skipIf(!WEBUI_INSTALLED)('BUG-196 — an answered upload shows what the client can do with it', () => {
  const ANSWERED = {
    phase: 'first_pass',
    asks: [
      ask('photos', {
        status: 'answered',
        answered_by: 'client',
        answered_at: '2026-10-03T12:00:00.000Z',
        answer_material: ['material-a', 'material-b'],
        upload_role: 'reference',
        multiple: true,
      }),
    ],
    materials: {
      'material-a': material({ uid: 'material-a', label: 'IMAGE-1', title: 'A van', filename: 'van.jpg' }),
      'material-b': material({
        uid: 'material-b',
        label: 'IMAGE-2',
        title: 'A boiler',
        filename: 'boiler.jpg',
        role: 'site',
        republishable: true,
      }),
    },
  }

  it('test_UAT_FC_BUG-196_use_on_the_site_moves_a_reference_upload_from_the_panel', async () => {
    const { p, transport } = await panel(ANSWERED)
    const files = [...block(p, 'photos').querySelectorAll('.plan-ask__file')] as HTMLElement[]
    expect(files.map((f) => f.dataset.material)).toEqual(['material-a', 'material-b'])
    expect(block(p, 'photos').textContent).toContain('2 files you sent')

    // OFFERED WHERE IT WOULD SUCCEED: on the reference upload, not the site one.
    const useA = files[0].querySelector('[data-action="use-on-site"]') as HTMLButtonElement
    expect(useA?.textContent).toBe('Use on the site')
    expect(files[1].querySelector('[data-action="use-on-site"]')).toBeNull()

    useA.click()
    await settle()
    expect(transport.calls.roles).toEqual([['material-a', 'site']])
  })

  it('test_UAT_FC_BUG-196_delete_on_the_panel_asks_first_then_deletes', async () => {
    const { p, transport } = await panel(ANSWERED)
    const file = block(p, 'photos').querySelector('[data-material="material-a"]') as HTMLElement
    const button = file.querySelector('[data-action="delete"]')
    expectDangerButton(button)
    ;(button as HTMLButtonElement).click()
    expect(transport.calls.removed).toEqual([])

    const confirm = document.querySelector('.builder-library__confirm-delete') as HTMLButtonElement
    // THE DANGEROUS STEP LOOKS DANGEROUS TOO.
    expect(confirm.classList.contains('builder-danger')).toBe(true)
    expect(confirm.querySelector('svg')).not.toBeNull()
    confirm.click()
    await settle()
    expect(transport.calls.removed).toEqual(['material-a'])
    expect(document.querySelector('.builder-modal')).toBeNull()
  })

  it('test_UAT_FC_BUG-196_a_file_deleted_since_is_shown_as_gone', async () => {
    const { p } = await panel({ ...ANSWERED, materials: { 'material-b': ANSWERED.materials['material-b'] } })
    const gone = block(p, 'photos').querySelector('[data-material="material-a"]') as HTMLElement
    expect(gone.textContent).toContain('Deleted from your Library')
    expect(gone.querySelector('button')).toBeNull()
  })
})

describe.skipIf(!WEBUI_INSTALLED)('BUG-196 — the Library row carries the same actions', () => {
  const ROWS = [
    material({ uid: 'material-a', label: 'IMAGE-1', title: 'A van', filename: 'van.jpg' }),
    material({ uid: 'material-c', label: 'IMAGE-3', title: 'Old site', filename: '', origin: 'captured', kind: 'capture' }),
  ]

  async function library() {
    const log = { roles: [] as [string, string][], removed: [] as string[] }
    const transport = {
      list: async () => ({ material: ROWS.map((r) => ({ ...r })), seq: 1 }),
      item: async (uid: string) => ({ ...ROWS.find((r) => r.uid === uid)!, body: 'About it.', members: [] }),
      save: async () => ({}),
      setName: async () => ({}),
      setRole: async (uid: string, role: string) => {
        log.roles.push([uid, role])
        return { ...ROWS.find((r) => r.uid === uid)!, role, republishable: true }
      },
      remove: async (uid: string) => {
        log.removed.push(uid)
        return { uid, forgotten: true }
      },
      fileUrl: (uid: string) => `/api/material/file?uid=${uid}`,
    }
    const lib = createLibraryPanel({ storage: memoryStorage(), transport, getModalHost: () => root })
    root.append(lib.element)
    await lib.refresh()
    return { lib, log }
  }

  const row = (lib: Handle, uid: string) =>
    lib.element.querySelector(`.list-detail-row[data-key="${uid}"]`) as HTMLElement

  it('test_UAT_FC_BUG-196_a_reference_upload_row_offers_use_on_the_site_and_delete', async () => {
    const { lib, log } = await library()
    const use = row(lib, 'material-a').querySelector('[data-action="use-on-site"]') as HTMLButtonElement
    expect(use).not.toBeNull()
    // A CAPTURE'S ROLE WAS NEVER THE CLIENT'S CHOICE, so it is not offered there.
    expect(row(lib, 'material-c').querySelector('[data-action="use-on-site"]')).toBeNull()

    use.click()
    await settle()
    expect(log.roles).toEqual([['material-a', 'site']])
    // PRESSING AN ACTION DOES NOT OPEN THE ROW.
    expect(lib.element.querySelector('.builder-library__detail')).toBeNull()
    // AND THE ROW NOW SAYS SITE ASSET, with no move left to offer.
    expect(row(lib, 'material-a').querySelector('[data-action="use-on-site"]')).toBeNull()
  })

  it('test_UAT_FC_BUG-196_the_delete_control_is_a_danger_button_on_the_row_and_in_the_pane', async () => {
    const { lib, log } = await library()
    const onRow = row(lib, 'material-a').querySelector('[data-action="delete"]')
    expectDangerButton(onRow)
    ;(onRow as HTMLButtonElement).click()
    ;(document.querySelector('.builder-library__confirm-delete') as HTMLButtonElement).click()
    await settle()
    expect(log.removed).toEqual(['material-a'])
    expect(row(lib, 'material-a')).toBeNull()

    row(lib, 'material-c').click()
    await settle()
    expectDangerButton(lib.element.querySelector('.builder-library__detail .builder-library__delete'))
  })
})

// @vitest-environment jsdom
/**
 * REQ-220 — **the image modal: the viewer, the editable Library name, and the
 * editing tools**.
 *
 * WHAT THIS FILE PROVES. A client could look at a picture in the Library and
 * change nothing about it: the detail pane rendered the image, offered a download
 * link, and stopped. This is the surface half — that clicking a picture opens it,
 * that the name is editable in the modal and in the pane and is the same field,
 * that the tools are the ones the ticket names, that undo and redo work through
 * the sitting, and that nothing in here can destroy a photograph. The pure suite
 * beside it proves the vocabulary and the rendering; the workers suite proves what
 * the routes write.
 *
 * MOUNTED AGAINST THE ACTUALLY-INSTALLED COMPONENTS, on the pattern every Library
 * suite here follows. The acceptance is specifically that this is `modal.js`'s
 * shell and `mountFields` CONFIGURED — *"the pattern already exists"* — rather
 * than a second way of showing a file, and mocked components would assert the
 * mocks. The only doubles are the HTTP calls, because they are the network.
 *
 * THE CLAIMS, in the order the ticket makes them:
 *
 *  1. CLICKING A PICTURE OPENS IT IN A MODAL, WITH THE EDITING TOOLS — and the
 *     picture is a BUTTON, so the editor is not a mouse-only capability.
 *  2. IT IS THE SHELL THE READER ALREADY USES. Escape closes it, the backdrop
 *     closes it, and the panel is the wide one.
 *  3. THE LIBRARY NAME IS IN THE MODAL AND IT IS EDITABLE — one field, one
 *     meaning, both places. Editing it in either changes the same thing.
 *  4. THE TOOLS ARE THE SHARED VOCABULARY AND NOTHING MORE.
 *  5. UNDO AND REDO, THROUGHOUT THE SESSION — and the recipe is what is written,
 *     not the stack.
 *  6. AND THE PICTURE IS NEVER DESTROYED: no control here sends bytes, and every
 *     step back is a recipe the origin is told about.
 *  7. INTERACTION IS LOCAL; TRUTH IS RENDERED. A crop is dragged against a CSS
 *     overlay and commits as one operation.
 *  8. A CAPTURE IS NOT OFFERED THE EDITOR, AND NEITHER IS A DRAWING.
 */

import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'
import { EDIT_OPS } from '../tools/generate/src/cli/image-recipe'

let mountImageEditor: (spec: Record<string, unknown>) => {
  element: HTMLElement
  close: () => void
  setName: (n: string) => void
}
let createLibraryPanel: (opts?: Record<string, unknown>) => never

if (!WEBUI_INSTALLED) console.warn(`REQ-220 modal suite skipped: ${WEBUI_SKIP_REASON}`)

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
    origin: 'generated',
    placed_on: [],
    source_url: null,
    description_status: 'ok',
    description_model: 'stub/vision-1',
    edits: [],
    updated_at: '2026-09-09T12:00:00.000Z',
    ...over,
  }
}

/**
 * A generated picture named after its own prompt, and a capture.
 *
 * THE FIRST IS THE CASE THE TICKET IS ABOUT: *"a generated image is titled from
 * the prompt that made it, so it arrives in the Library under a sentence nobody
 * chose to call it."*
 */
const MATERIAL = [
  material({
    uid: 'made-one',
    title: 'a warm photograph of a corner bakery at golden hour with bread in the window',
    filename: 'generated-3f2a.png',
  }),
  material({
    uid: 'a-drawing',
    title: 'A mark the assistant drew',
    filename: 'mark.svg',
    content_type: 'image/svg+xml',
  }),
  material({
    uid: 'their-old-site',
    type: 'reference',
    title: 'Their old site',
    kind: 'capture',
    origin: 'captured',
    role: 'reference',
    source_url: 'https://theirs.example/',
  }),
]

/** What the origin was asked, and what it answered. Recorded, never blind. */
function transportOver(rows = MATERIAL) {
  const names: Array<{ uid: string; title: string }> = []
  const recipes: Array<{ uid: string; recipe: unknown[] }> = []
  let recipeAnswer: ((uid: string) => Promise<unknown>) | null = null
  const find = (uid: string) => rows.find((r) => r.uid === uid)!
  return {
    names,
    recipes,
    refuseRecipeWith(message: string) {
      recipeAnswer = async () => {
        throw new Error(message)
      }
    },
    list: async () => ({ material: rows.map((row) => ({ ...row })) }),
    item: async (uid: string) => ({ ...find(uid), body: 'About it.' }),
    save: async (uid: string, body: string) => ({ ...find(uid), body }),
    setRole: async (uid: string) => ({ ...find(uid) }),
    setName: async (uid: string, title: string) => {
      names.push({ uid, title })
      Object.assign(find(uid), { title })
      return { ...find(uid) }
    },
    setRecipe: async (uid: string, recipe: unknown[]) => {
      recipes.push({ uid, recipe })
      if (recipeAnswer) return recipeAnswer(uid)
      Object.assign(find(uid), { edits: recipe })
      // `rendered: false` IS WHAT A DEPLOYMENT WITH NO IMAGES BINDING ANSWERS,
      // and it is the stub's default because it is the harder case to get right:
      // the recipe is stored and the bytes on screen do not carry it yet.
      return { ...find(uid), rendered: false }
    },
    fileUrl: (uid: string) => `/api/material/file?uid=${encodeURIComponent(uid)}`,
  }
}

beforeAll(async () => {
  if (WEBUI_INSTALLED) {
    ;({ mountImageEditor } = await import('../apps/control-app/src/builder/image-editor.js'))
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
  const panel = createLibraryPanel({
    storage: memoryStorage(),
    transport,
    getModalHost: () => root,
  }) as never as {
    element: HTMLElement
    listDetail: { select(key: string): void }
    refresh(): Promise<void>
  }
  root.append(panel.element)
  await panel.refresh()
  panel.listDetail.select(uid)
  await settle()
  return { panel, transport }
}

/**
 * The editor on its own, with the stage's size TOLD rather than measured.
 *
 * jsdom does no layout, so `getBoundingClientRect` is all zeros and a gesture
 * against it would be arithmetic over nothing. `measure` is the seam the module
 * publishes for exactly this; every geometric claim below goes through it.
 */
function editorOver(over: Record<string, unknown> = {}) {
  const transport = transportOver()
  const editor = mountImageEditor({
    uid: 'made-one',
    href: '/api/material/file?uid=made-one',
    name: 'a warm photograph of a corner bakery at golden hour with bread in the window',
    natural: { width: 1000, height: 500 },
    host: root,
    measure: () => ({ width: 1000, height: 500 }),
    transport: {
      saveName: transport.setName,
      saveRecipe: transport.setRecipe,
    },
    ...over,
  })
  return { editor, transport, panel: root.querySelector('.builder-modal__imaged')! }
}

const labels = (box: Element, selector: string) =>
  [...box.querySelectorAll(selector)]
    .filter((b) => !(b as HTMLElement).hidden)
    .map((b) => (b.textContent ?? '').trim())

/** Open a `mountFields` cell the way a client does: click it. */
function openNameEditor(host: Element): HTMLInputElement {
  const cell = host.querySelector('.fields-value-editable') as HTMLElement
  cell.click()
  return host.querySelector('input') as HTMLInputElement
}

async function typeName(input: HTMLInputElement, value: string) {
  input.value = value
  input.dispatchEvent(new Event('input', { bubbles: true }))
  input.dispatchEvent(new Event('change', { bubbles: true }))
  input.blur()
  await settle()
}

describe.skipIf(!WEBUI_INSTALLED)('REQ-220 — clicking a picture opens it', () => {
  it('test_UAT_FC_REQ-220_clicking_the_picture_in_the_library_opens_the_modal_with_the_editing_tools', async () => {
    const { panel } = await opened('made-one')

    // THE PICTURE IS A BUTTON. An `<img>` cannot be reached from a keyboard, so a
    // click handler on one would make the crop, the name and the adjustments
    // available only to a mouse. The words are on the button; the photograph is
    // inside it, exactly as the reader's expand affordance puts its glyph inside.
    const opener = panel.element.querySelector('.builder-library__open-image') as HTMLButtonElement
    expect(opener).toBeTruthy()
    expect(opener.tagName).toBe('BUTTON')
    expect(opener.getAttribute('aria-label')).toMatch(/open this picture/i)
    expect(opener.querySelector('img.builder-library__image')).toBeTruthy()

    expect(document.querySelector('.builder-modal')).toBeNull()
    opener.click()
    await settle()

    // A MODAL, WITH THE EDITING TOOLS IN IT.
    const dialog = document.querySelector('.builder-modal')!
    expect(dialog).toBeTruthy()
    expect(dialog.querySelector('.builder-modal__imaged')).toBeTruthy()
    expect(dialog.querySelector('.builder-imaged__image')).toBeTruthy()
    expect(dialog.querySelectorAll('.builder-imaged__tool').length).toBeGreaterThan(0)
  })

  it('test_UAT_FC_REQ-220_it_is_the_shell_the_reader_already_uses_rather_than_a_second_way_of_showing_a_file', async () => {
    const { panel } = await opened('made-one')
    ;(panel.element.querySelector('.builder-library__open-image') as HTMLElement).click()
    await settle()

    // *"The pattern already exists"* — `mountReader` opens documents in a modal
    // host and this is that furniture extended to pictures. So it is the SAME
    // shell: the dialog role, the backdrop, and the one `close` every exit runs
    // through. A hand-rolled dialog beside it would be two dialogs that are the
    // same dialog until one of them is fixed.
    const dialog = document.querySelector('.builder-modal')!
    expect(dialog.getAttribute('role')).toBe('dialog')
    expect(dialog.getAttribute('aria-modal')).toBe('true')
    expect(dialog.querySelector('.builder-modal__backdrop')).toBeTruthy()

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await settle()
    expect(document.querySelector('.builder-modal')).toBeNull()
  })

  it('test_UAT_FC_REQ-220_a_drawing_is_not_offered_the_editor_either', async () => {
    const { panel } = await opened('a-drawing')

    // `kindOf` files an SVG as an `image`, so a drawing reaches the pane's own
    // `<img>` alongside a photograph — and none of the four operations applies to
    // one: the platform renderer cannot transform a vector, cropping one means
    // changing its viewBox, and the assistant can simply redraw it. So the pane
    // does not offer a control the origin would refuse.
    expect(panel.element.querySelector('.builder-library__image')).toBeTruthy()
    expect(panel.element.querySelector('.builder-library__open-image')).toBeNull()
  })

  it('test_UAT_FC_REQ-220_a_capture_is_not_offered_the_editor', async () => {
    const { panel } = await opened('their-old-site')

    // A capture's bytes are a screenshot of somebody else's site held as
    // reference (REQ-166), and the one thing a crop of it could be for is
    // publishing it. The detail pane has drawn captures and pictures through the
    // same `<img>` since REQ-166, so this is stated rather than inherited.
    expect(panel.element.querySelector('.builder-library__image')).toBeTruthy()
    expect(panel.element.querySelector('.builder-library__open-image')).toBeNull()
  })
})

describe.skipIf(!WEBUI_INSTALLED)('REQ-220 — the Library name, in both places', () => {
  it('test_UAT_FC_REQ-220_the_name_is_editable_in_the_detail_pane_and_in_the_modal', async () => {
    const { panel } = await opened('made-one')

    // IN THE PANE. This is the fix for a generated image arriving named after its
    // own prompt, and the client meets it where they already are.
    const paneName = panel.element.querySelector('.builder-library__name')!
    expect(paneName.querySelector('.fields-row[data-field="title"]')).toBeTruthy()
    expect(
      paneName.querySelector('.fields-row[data-field="title"]')!.classList.contains('is-editable'),
    ).toBe(true)

    ;(panel.element.querySelector('.builder-library__open-image') as HTMLElement).click()
    await settle()

    // AND IN THE MODAL, which is where the client is looking when they decide the
    // name is wrong — because they are looking at the picture.
    const modalName = document.querySelector('.builder-imaged__name')!
    expect(modalName.querySelector('.fields-row[data-field="title"]')).toBeTruthy()
  })

  it('test_UAT_FC_REQ-220_editing_the_name_in_either_place_changes_the_same_thing', async () => {
    const { panel, transport } = await opened('made-one')
    ;(panel.element.querySelector('.builder-library__open-image') as HTMLElement).click()
    await settle()

    // Renamed in the MODAL.
    const modalName = document.querySelector('.builder-imaged__name')!
    await typeName(openNameEditor(modalName), 'The bakery, golden hour')

    // ONE FIELD, ONE MEANING, BOTH PLACES. The pane behind the dialog follows,
    // and so does the row in the list — four places showing one fact, all from
    // the one answer the origin gave.
    expect(transport.names).toEqual([{ uid: 'made-one', title: 'The bakery, golden hour' }])
    const paneName = panel.element.querySelector('.builder-library__name')!
    expect(paneName.textContent).toContain('The bakery, golden hour')
    expect(panel.element.querySelector('.builder-library__row-title')!.textContent).toBe(
      'The bakery, golden hour',
    )

    // And the other way round: renamed in the PANE, the open modal follows.
    await typeName(openNameEditor(paneName), 'Golden hour')
    expect(transport.names.at(-1)).toEqual({ uid: 'made-one', title: 'Golden hour' })
    expect(document.querySelector('.builder-imaged__name')!.textContent).toContain('Golden hour')
  })

  it('test_UAT_FC_REQ-220_the_name_is_the_library_name_and_the_download_still_saves_under_the_filename', async () => {
    const { panel, transport } = await opened('made-one')
    const paneName = panel.element.querySelector('.builder-library__name')!
    await typeName(openNameEditor(paneName), 'The bakery')

    // WHAT WAS SENT IS A TITLE. The filename is the name the bytes arrived with —
    // a different fact about the same material — and a client who renames a
    // photograph has said nothing about what lands in their downloads folder.
    expect(transport.names.at(-1)!.title).toBe('The bakery')
    const link = panel.element.querySelector('.builder-library__download') as HTMLAnchorElement
    expect(link.getAttribute('download')).toBe('generated-3f2a.png')
  })
})

describe.skipIf(!WEBUI_INSTALLED)('REQ-220 — the tools, and what they write', () => {
  it('test_UAT_FC_REQ-220_the_tools_offered_are_the_shared_vocabulary_and_nothing_more', () => {
    const { panel } = editorOver()
    const offered = labels(panel, '.builder-imaged__tool, .builder-imaged__apply')
      .join(' ')
      .toLowerCase()

    // *"crop, rotate, resize, and adjustment of brightness, contrast and
    // saturation. The same list the assistant's `edit_image` uses, because there
    // is one list."*
    expect(offered).toContain('crop')
    expect(offered).toMatch(/turn (left|right)/)
    expect(offered).toContain('resize')
    for (const axis of ['brightness', 'contrast', 'saturation']) {
      expect(panel.querySelector(`input[data-adjust="${axis}"]`), axis).toBeTruthy()
    }

    // AND NOTHING MORE. A control the vocabulary cannot express is a control the
    // renderer cannot honour and the assistant cannot talk about.
    expect(offered).not.toContain('flip')
    expect(offered).not.toContain('blur')
    expect([...EDIT_OPS]).toEqual(['crop', 'rotate', 'resize', 'adjust'])
  })

  it('test_UAT_FC_REQ-220_no_control_here_can_destroy_the_picture', async () => {
    const { panel, transport } = editorOver()

    // *"The editor must not offer any control that makes it false."* The
    // mechanical form of that claim: every control writes a RECIPE, and the
    // editor's whole transport is two calls — a name and a recipe. There is no
    // byte on this surface, so no press of anything here can lose a photograph,
    // however it fails.
    const verbs = labels(panel, 'button').join(' ').toLowerCase()
    for (const destructive of ['delete', 'replace', 'flatten', 'apply permanently', 'discard']) {
      expect(verbs, destructive).not.toContain(destructive)
    }

    ;(panel.querySelector('.builder-imaged__tool') as HTMLButtonElement).click()
    await settle()
    ;[...panel.querySelectorAll('button')].forEach((b) => !b.hidden && b.click())
    await settle()
    for (const call of transport.recipes) {
      expect(Array.isArray(call.recipe)).toBe(true)
    }
  })

  it('test_UAT_FC_REQ-220_turning_the_picture_writes_the_operation_and_repaints_from_it', async () => {
    const { panel, transport } = editorOver()
    const turnRight = [...panel.querySelectorAll('.builder-imaged__tool')].find(
      (b) => b.textContent === 'Turn right',
    ) as HTMLButtonElement
    turnRight.click()
    await settle()

    expect(transport.recipes.at(-1)!.recipe).toEqual([{ op: 'rotate', degrees: 90 }])

    // AND TRUTH IS RENDERED. Once the operation is committed the editor stops
    // drawing it and re-fetches the picture, because the file route now serves
    // the stored bytes with the recipe applied by the one renderer (REQ-219). A
    // local transform left in place would be the editor's own opinion of what the
    // renderer did — which is how a client crops one thing and publishes another.
    const windowBox = panel.querySelector('.builder-imaged__window') as HTMLElement
    expect(windowBox.style.transform).toBe('none')
    const img = panel.querySelector('.builder-imaged__image') as HTMLImageElement
    expect(img.getAttribute('src')).toContain('v=1')
  })
})

describe.skipIf(!WEBUI_INSTALLED)('REQ-220 — undo and redo, throughout the session', () => {
  it('test_UAT_FC_REQ-220_the_client_can_step_back_through_what_they_have_done_in_this_sitting', async () => {
    const { panel, transport } = editorOver()
    const tool = (label: string) =>
      [...panel.querySelectorAll('.builder-imaged__tool')].find(
        (b) => b.textContent === label,
      ) as HTMLButtonElement

    // Nothing done yet, so there is nothing to step back out of.
    expect(tool('Undo').disabled).toBe(true)

    tool('Turn right').click()
    await settle()
    tool('Turn right').click()
    await settle()
    expect(transport.recipes.at(-1)!.recipe).toHaveLength(2)

    tool('Undo').click()
    await settle()
    // *"Without thinking about recipes"* — one press, one step, and the RECIPE is
    // what the origin is told, because the recipe is what is persisted and the
    // stack is this sitting only.
    expect(transport.recipes.at(-1)!.recipe).toEqual([{ op: 'rotate', degrees: 90 }])

    tool('Undo').click()
    await settle()
    expect(transport.recipes.at(-1)!.recipe).toEqual([])
    expect(tool('Undo').disabled).toBe(true)

    tool('Redo').click()
    await settle()
    expect(transport.recipes.at(-1)!.recipe).toEqual([{ op: 'rotate', degrees: 90 }])
  })

  it('test_UAT_FC_REQ-220_a_refusal_leaves_the_picture_as_it_was_and_says_why_in_the_origins_words', async () => {
    const { panel, transport } = editorOver()
    const tool = (label: string) =>
      [...panel.querySelectorAll('.builder-imaged__tool')].find(
        (b) => b.textContent === label,
      ) as HTMLButtonElement

    tool('Turn right').click()
    await settle()
    transport.refuseRecipeWith(
      'operation 2 would leave 0×300 of a 400×300 picture, which is nothing.',
    )
    tool('Turn right').click()
    await settle()

    // THE REFUSED STEP IS TAKEN BACK OUT, AND ONLY THAT STEP. The renderer has not
    // got it, so leaving it on the stack would mean the client's next Undo
    // appeared to do nothing — while everything they did before it is untouched
    // and still steppable.
    expect(tool('Undo').disabled).toBe(false)
    tool('Undo').click()
    await settle()
    expect(transport.recipes.at(-1)!.recipe).toEqual([])

    // AND THE SENTENCE IS THE ORIGIN'S OWN. `image-recipe.ts` writes refusals for
    // the person who asked, and the assistant already shows them verbatim; a
    // second wording invented here is how one refusal comes to be explained two
    // different ways.
    expect(panel.querySelector('.builder-imaged__note')!.textContent).toContain('which is nothing')
  })

  it('test_UAT_FC_REQ-220_a_deployment_with_no_renderer_still_stores_the_edit_and_says_what_is_on_screen', async () => {
    const { panel, transport } = editorOver()
    const turn = [...panel.querySelectorAll('.builder-imaged__tool')].find(
      (b) => b.textContent === 'Turn right',
    ) as HTMLButtonElement
    turn.click()
    await settle()

    // The stub answers `rendered: false`, which is what a deployment with no
    // Images binding reports. The recipe IS stored — losing the client's crop
    // because a binding is absent would be a refusal of something we recorded —
    // and what they are told is which picture they are looking at.
    expect(transport.recipes.at(-1)!.recipe).toEqual([{ op: 'rotate', degrees: 90 }])
    expect(panel.querySelector('.builder-imaged__note')!.textContent).toMatch(/before the change/i)
  })
})

describe.skipIf(!WEBUI_INSTALLED)('REQ-220 — interaction is local; truth is rendered', () => {
  it('test_UAT_FC_REQ-220_a_crop_is_dragged_locally_and_committed_as_one_operation', async () => {
    const { panel, transport } = editorOver()
    const tool = (label: string) =>
      [...panel.querySelectorAll('.builder-imaged__tool')].find(
        (b) => b.textContent === label,
      ) as HTMLButtonElement

    tool('Crop').click()
    await settle()
    const box = panel.querySelector('.builder-imaged__crop') as HTMLElement
    expect(box.hidden).toBe(false)

    // DRAGGING MOVES A CSS OVERLAY AND WRITES NOTHING. The gesture is immediate
    // and the origin hears about it once, when the client says they mean it.
    const before = transport.recipes.length
    const grip = box.querySelector('[data-handle="move"]') as HTMLElement
    grip.dispatchEvent(new MouseEvent('mousedown', { clientX: 0, clientY: 0, bubbles: true }))
    document.dispatchEvent(new MouseEvent('mousemove', { clientX: 100, clientY: 50 }))
    document.dispatchEvent(new MouseEvent('mouseup', {}))
    await settle()
    expect(transport.recipes.length).toBe(before)
    expect(box.dataset.insets).toBe('0.2,0.2,0,0')

    // AND WHAT IS SENT IS THE VOCABULARY'S OWN SHAPE — four insets, each a
    // fraction of the frame the client can see. No conversion happens on the way
    // out, because the frame on screen IS the recipe so far.
    const apply = panel.querySelector('.builder-imaged__apply') as HTMLButtonElement
    apply.click()
    await settle()
    expect(transport.recipes.at(-1)!.recipe).toEqual([
      { op: 'crop', left: 0.2, top: 0.2, right: 0, bottom: 0 },
    ])
  })
})

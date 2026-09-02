// @vitest-environment jsdom
/**
 * BUG-42 — **markdown is not painted before the engine that renders it exists**.
 *
 * TWO SURFACES, ONE RULE. The chat transcript showed markdown source on a cold
 * load and rendered correctly on the next one; the Library's "What this is"
 * showed source on every load. Both are the same miss — a surface painting
 * markdown while `marked`/DOMPurify were still coming down from a CDN, at which
 * point `renderSafe` deliberately degrades to escaped source. That degradation
 * is right when the engines are absent and wrong when they are merely late.
 *
 * WHY THE ORDERING IS DRIVEN, NOT AWAITED. A test that just let the real loads
 * resolve would prove nothing about the cold case: under vitest the CDN import
 * fails within a macrotask, so the race the operator hit is not reproducible by
 * waiting. Both surfaces therefore take `markdownReady` as an injected promise,
 * and these tests HOLD IT OPEN across the moment the content arrives — which is
 * the cold load, stated as something a test can observe rather than hope for.
 *
 * WHY THE SANITIZER IS INJECTED. `renderSafe`'s policy is "render then scrub;
 * escape when there is no scrubber", so the presence of a sanitizer is what
 * separates rendered output from escaped source. `setSanitizer` is the seam the
 * component publishes for exactly this, and injecting a pass-through keeps the
 * subject of these tests the RENDERING RULE rather than DOMPurify's behaviour.
 *
 * MOUNTED AGAINST THE ACTUALLY-INSTALLED COMPONENTS, on the pattern the REQ-127
 * and REQ-161 suites established: the claim is about what the browser SHOWS, and
 * a mocked panel would assert the mock.
 */

import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'

let mountBuilder: (root: HTMLElement, opts?: Record<string, unknown>) => never
let createLibraryPanel: (opts?: Record<string, unknown>) => never
let setSanitizer: (fn: ((html: string) => string) | null) => unknown
let setParser: (parser: unknown) => unknown

if (!WEBUI_INSTALLED) console.warn(`BUG-42 markdown suite skipped: ${WEBUI_SKIP_REASON}`)

const settle = () => new Promise((resolve) => setTimeout(resolve, 0))

/** A promise this suite decides the moment of. The cold load, held open. */
function deferred() {
  let resolve!: () => void
  const promise = new Promise<void>((r) => {
    resolve = r
  })
  return { promise, resolve }
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

/** Markdown whose rendering is unmistakable in the DOM. */
const MARKDOWN = 'Gold on **cream**, with a\n\n- narrow counter\n- and a long descender\n'

const SITES = [{ slug: 'alpha', latest: 1 }]

function chatTransport(turns: Array<{ role: string; markdown: string }>, fail = false) {
  return {
    openSession: async () => {
      if (fail) throw new Error('no key')
      return { sessionId: 'site-alpha', turns, ready: true }
    },
    streamPrompt: async function* () {
      yield { kind: 'done' }
    },
  }
}

const MATERIAL = [
  {
    uid: 'material-1',
    type: 'material',
    title: 'The wordmark',
    filename: 'wordmark.svg',
    kind: 'image',
    role: 'site',
    rights: 'owned',
    republishable: true,
    exportable: false,
    origin: 'uploaded',
    placed_on: ['alpha'],
    source_url: null,
    description_status: 'ok',
    description_model: 'stub/vision-1',
    updated_at: '2026-08-31T12:00:00.000Z',
  },
  {
    uid: 'material-2',
    type: 'material',
    title: 'Nothing has read this',
    filename: 'mystery.pdf',
    kind: 'document',
    role: 'reference',
    rights: 'owned',
    republishable: false,
    exportable: false,
    origin: 'uploaded',
    placed_on: [],
    source_url: null,
    description_status: 'no_describer',
    description_model: null,
    updated_at: '2026-08-31T11:00:00.000Z',
  },
]

function materialTransport() {
  const bodies: Record<string, string> = { 'material-1': MARKDOWN, 'material-2': '' }
  const saved: Array<{ uid: string; body: string }> = []
  return {
    saved,
    list: async () => ({ material: MATERIAL.map((row) => ({ ...row })) }),
    item: async (uid: string) => ({ ...MATERIAL.find((r) => r.uid === uid)!, body: bodies[uid] }),
    save: async (uid: string, body: string) => {
      saved.push({ uid, body })
      bodies[uid] = body
      return { ...MATERIAL.find((r) => r.uid === uid)!, description_status: 'ok', body }
    },
    fileUrl: (uid: string) => `/api/material/file?uid=${encodeURIComponent(uid)}`,
  }
}

beforeAll(async () => {
  if (WEBUI_INSTALLED) {
    ;({ mountBuilder } = await import('../apps/control-app/src/builder/app.js'))
    ;({ createLibraryPanel } = await import('../apps/control-app/src/builder/library.js'))
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
  // Both seams are module-global. Left set, the next test would inherit an engine
  // it did not ask for — and the escaped-source assertions are the ones that
  // would then quietly stop meaning anything.
  if (WEBUI_INSTALLED) {
    setSanitizer(null)
    setParser(null)
  }
})

/** Install the engines: a real markdown parser and a pass-through scrubber. */
async function installEngines() {
  const { renderBlock } = await import('@lagrangefoundry/webui-markdown')
  // `marked` itself is the CDN import that cannot run here, so the parser seam
  // takes a minimal stand-in covering exactly what the fixture markdown uses.
  // This is the ENGINE, not the policy — the policy under test is ours.
  const inline = (md: string) =>
    md.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/_(.+?)_/g, '<em>$1</em>')
  setParser({
    parse: (md: string) =>
      md
        .trim()
        .split(/\n{2,}/)
        .map((block) =>
          block.startsWith('- ')
            ? `<ul>${block
                .split('\n')
                .filter((line) => line.trim() !== '')
                .map((line) => `<li>${inline(line.replace(/^- /, ''))}</li>`)
                .join('')}</ul>`
            : `<p>${inline(block)}</p>`,
        )
        .join(''),
    parseInline: inline,
  })
  setSanitizer((html: string) => html)
  return renderBlock
}

// ── the transcript ───────────────────────────────────────────────────────────

describe.skipIf(!WEBUI_INSTALLED)('BUG-42 — the transcript waits for the renderer', () => {
  it('test_UAT_FC_BUG-42_a_transcript_is_not_painted_until_the_markdown_engines_have_settled', async () => {
    const engines = deferred()
    const app = mountBuilder(root, {
      sites: SITES,
      storage: memoryStorage(),
      chatTransport: chatTransport([{ role: 'assistant', markdown: MARKDOWN }]),
      markdownReady: engines.promise,
    })
    await settle()

    // THE COLD LOAD. The session has answered — the transport resolved on the
    // first tick — but the engines have not, so nothing has been painted. This
    // is the whole of the fix: `mountChat` paints each turn ONCE, so a turn drawn
    // here would be escaped source for the life of the page, refresh or not.
    const messages = () => [...app.split.element.querySelectorAll('.chat-message')]
    expect(messages()).toHaveLength(0)

    await installEngines()
    engines.resolve()
    await settle()

    // And now it is there, rendered — the markers gone, real elements in their
    // place, which is what the operator reported only ever seeing after a reload.
    expect(messages()).toHaveLength(1)
    const body = messages()[0]
    expect(body.querySelector('strong')?.textContent).toBe('cream')
    expect(body.querySelectorAll('li')).toHaveLength(2)
    expect(body.textContent).not.toContain('**')
  })

  it('test_UAT_FC_BUG-42_a_session_that_cannot_be_opened_reports_itself_as_rendered_markdown', async () => {
    const engines = deferred()
    const app = mountBuilder(root, {
      sites: SITES,
      storage: memoryStorage(),
      chatTransport: chatTransport([], true),
      markdownReady: engines.promise,
    })
    await settle()

    // The failure branch writes a note, and a note is markdown too (`_…_`), so it
    // waits on the same signal. Painting it early would put the panel's own voice
    // on screen as underscores.
    expect(app.split.element.querySelectorAll('.chat-message')).toHaveLength(0)

    await installEngines()
    engines.resolve()
    await settle()

    const note = app.split.element.querySelector('.chat-message.assistant')!
    expect(note.textContent).toContain('The assistant could not be reached')
    expect(note.textContent).not.toContain('_')
  })
})

// ── the Library ──────────────────────────────────────────────────────────────

describe.skipIf(!WEBUI_INSTALLED)('BUG-42 — "What this is" is prose, not source', () => {
  /** A mounted Library over the fixture, already loaded. */
  async function library(markdownReady: Promise<void>) {
    const transport = materialTransport()
    const panel = createLibraryPanel({
      storage: memoryStorage(),
      transport,
      getSite: () => 'alpha',
      markdownReady,
    })
    root.append(panel.element)
    await panel.refresh()
    return { panel, transport }
  }

  const cell = () =>
    document.querySelector('.builder-library__description .fields-row[data-field="body"] > .fields-value')!

  it('test_UAT_FC_BUG-42_the_material_description_is_shown_rendered_rather_than_as_its_source', async () => {
    await installEngines()
    const { panel } = await library(Promise.resolve())
    panel.listDetail.select('material-1')
    await settle()

    // The description is the ticket body an AI wrote about the file (DOC-38 §6),
    // so it arrives as markdown. `mountFields` reads a scalar and would show it
    // as one; this is the read cell repainted, in place.
    expect(cell().querySelector('strong')?.textContent).toBe('cream')
    expect(cell().querySelectorAll('li')).toHaveLength(2)
    expect(cell().textContent).not.toContain('**')
  })

  it('test_UAT_FC_BUG-42_the_description_still_edits_and_commits_through_the_component', async () => {
    await installEngines()
    const { panel, transport } = await library(Promise.resolve())
    panel.listDetail.select('material-1')
    await settle()

    // REPAINTED, NOT REPLACED — the component's own cell is still the cell, so
    // its click-to-edit affordance survived the repaint. If this had become a
    // hand-rolled read view, the class and the listener would both be gone.
    expect(cell().classList.contains('fields-value-editable')).toBe(true)
    ;(cell() as HTMLElement).click()

    // And what opens is the component's textarea, over the markdown SOURCE. The
    // client corrects what the file SAYS; they do not edit rendered HTML.
    const control = document.querySelector(
      '.builder-library__description textarea',
    ) as HTMLTextAreaElement
    expect(control.value).toBe(MARKDOWN)

    control.value = 'A **plain** correction'
    control.dispatchEvent(new Event('blur'))
    await settle()

    expect(transport.saved).toEqual([{ uid: 'material-1', body: 'A **plain** correction' }])
    // The committed value comes back as prose, not as the source just typed —
    // the component rebuilds its read cell on commit and the repaint follows it.
    expect(cell().querySelector('strong')?.textContent).toBe('plain')
  })

  it('test_UAT_FC_BUG-42_a_description_opened_during_a_cold_load_is_repainted_when_the_engines_land', async () => {
    const engines = deferred()
    const { panel } = await library(engines.promise)
    panel.listDetail.select('material-1')
    await settle()

    // Honest and wrong: with no engine there is nothing to render with, so the
    // source is escaped rather than injected raw. That is the right answer for
    // OFFLINE and the wrong one for a CDN that is merely slow.
    expect(cell().textContent).toContain('**cream**')

    await installEngines()
    engines.resolve()
    await settle()

    // The detail was opened before the engines existed and upgrades itself, so
    // the operator does not have to reload to read their own description.
    expect(cell().querySelector('strong')?.textContent).toBe('cream')
  })

  it('test_UAT_FC_BUG-42_a_description_nothing_has_written_keeps_the_components_placeholder', async () => {
    await installEngines()
    const { panel } = await library(Promise.resolve())
    panel.listDetail.select('material-2')
    await settle()

    // Nothing to render, and an empty render would be a blank where the component
    // has an answer. The pane's own prompt to write one is beside it.
    expect(cell().classList.contains('fields-value-empty')).toBe(true)
    expect(cell().classList.contains('md-body')).toBe(false)
    expect(
      document.querySelector('.builder-library__status')!.textContent,
    ).toMatch(/Nothing has read this yet/)
  })
})

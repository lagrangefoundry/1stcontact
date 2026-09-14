// @vitest-environment jsdom
/**
 * story-7f437d57 — **nothing is painted before the renderer exists**
 * (CAP-90 bundle, plan item 9; AC-1063's ordering half and AC-1816).
 *
 * WHY A SECOND FILE BESIDE `reconciliation-builder-assistant-pane`. That suite
 * owns the pane's nine original criteria and is unchanged by this
 * reconciliation. What BUNDLE-27 added is a rule about WHEN a surface may paint
 * — AC-1816's shared, never-failing readiness and the ordering AC-1063 now
 * states — and both are properties of the WORKSPACE rather than of the pane.
 * They are asserted here so the pane's suite stays about the pane.
 *
 * THE DISTINCTION THE CRITERIA CARRY. The render seam degrades to ESCAPED SOURCE
 * when there is no sanitizer. That is the right answer for an engine that is
 * ABSENT — offline should be a plainer panel, not a blank one — and the wrong
 * answer for one that is merely LATE, because the chat component paints each
 * turn once and offers no way to redraw it. The same visible output is therefore
 * correct in one case and a defect in the other, and only the ORDERING tells
 * them apart. That is why neither criterion can be verified by looking at a
 * finished screen.
 *
 * WHY THE ORDERING IS DRIVEN RATHER THAN AWAITED. Letting the real loads resolve
 * would prove nothing about the cold case: under vitest the CDN import cannot
 * run at all, so the race the operator hit is not reproducible by waiting.
 * `mountBuilder` takes `markdownReady` as an injected promise, and the AC-1063
 * test HOLDS IT OPEN across the moment the session arrives.
 *
 * WHY THE ENGINES ARE INJECTED, AND THROUGH `markdown.js`. The presence of a
 * sanitizer is exactly what separates rendered output from escaped source, and
 * the components publish injection seams for a host that already has its own.
 * They are reached through the builder's own markdown module rather than from
 * the packages directly, because `bug32-webui-scope-rebrand` permits the
 * component scope in two places and a test file is neither — that module's
 * header states this as the reason it re-exports them.
 *
 * MOUNTED AGAINST THE ACTUALLY-INSTALLED COMPONENTS, on the pattern the pane's
 * own suite states: every claim here is about what the browser SHOWS, and a
 * mocked panel would assert the mock. Absent components skip rather than pass.
 */

import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'

interface Turn {
  role: string
  markdown: string
}

interface BuilderApp {
  split: { element: HTMLElement }
  chat: { element: HTMLElement; getChat: () => { getMessages: () => Turn[] } | null }
  destroy: () => void
}

type MountBuilder = (root: HTMLElement, opts?: Record<string, unknown>) => BuilderApp

interface LibraryPanel {
  element: HTMLElement
  refresh: () => Promise<unknown>
  listDetail: { select: (uid: string) => void }
  destroy: () => void
}

interface MarkdownModule {
  markdownReady: Promise<void>
  markdownEngineReady: () => boolean
  setParser: (parser: unknown) => unknown
  setSanitizer: (fn: ((html: string) => string) | null) => unknown
}

let mountBuilder: MountBuilder
let setSanitizer: MarkdownModule['setSanitizer']
let setParser: MarkdownModule['setParser']

if (!WEBUI_INSTALLED) console.warn(`story-7f437d57 readiness suite skipped: ${WEBUI_SKIP_REASON}`)

/** Let the workspace's open-and-wait chain settle. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 0))

/** A promise this suite decides the moment of. The cold load, held open. */
function deferred() {
  let resolve!: () => void
  const promise = new Promise<void>((r) => {
    resolve = r
  })
  return { promise, resolve }
}

/**
 * A workspace-scoped store the test owns.
 *
 * Real `localStorage` would leak the panel's site and the composer's drafts
 * between mounts, and the escaped-versus-rendered assertions are the ones that
 * would then quietly stop meaning anything.
 */
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

/** Markdown whose rendering — and whose failure to render — is unmistakable. */
const MARKDOWN = 'Gold on **cream**, with a\n\n- narrow counter\n- and a long descender\n'

const SITES = [{ slug: 'alpha', latest: 1 }]

function chatTransport(turns: Turn[], fail = false) {
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

const MATERIAL = {
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
  site_slug: 'alpha',
  source_url: null,
  description_status: 'ok',
  description_model: 'stub/vision-1',
  updated_at: '2026-08-31T12:00:00.000Z',
}

function materialTransport() {
  return {
    list: async () => ({ material: [{ ...MATERIAL }] }),
    item: async (uid: string) => ({ ...MATERIAL, uid, body: MARKDOWN }),
    save: async (uid: string, body: string) => ({ ...MATERIAL, uid, body }),
    fileUrl: (uid: string) => `/api/material/file?uid=${encodeURIComponent(uid)}`,
  }
}

/** The Library's description cell, as the component and the repaint leave it. */
const DESCRIPTION_CELL =
  '.builder-library__description .fields-row[data-field="body"] > .fields-value'

beforeAll(async () => {
  if (WEBUI_INSTALLED) {
    ;({ mountBuilder } = (await import('../apps/control-app/src/builder/app.js')) as {
      mountBuilder: MountBuilder
    })
    ;({ setParser, setSanitizer } = (await import(
      '../apps/control-app/src/builder/markdown.js'
    )) as MarkdownModule)
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

/**
 * Install the engines: a real-enough markdown parser and a pass-through scrubber.
 *
 * The third-party parser is the CDN import that cannot run here, so the seam
 * takes a minimal stand-in covering exactly what the fixture markdown uses. This
 * is the ENGINE, not the policy — the policy under test is the workspace's.
 */
function installEngines() {
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
}

/** A fresh host for a second mount within one test. */
function freshRoot() {
  root = document.createElement('div')
  document.body.append(root)
  return root
}

// ── the transcript waits for the renderer ────────────────────────────────────

describe.skipIf(!WEBUI_INSTALLED)('story-7f437d57 — replay waits for the engines', () => {
  it('test_UAT_AC1063_replay_is_withheld_until_the_engines_settle_and_then_reads_as_prose', async () => {
    const drawn = (app: BuilderApp) => [...app.split.element.querySelectorAll('.chat-message')]
    const HISTORY: Turn[] = [
      { role: 'user', markdown: 'Describe the lettering' },
      { role: 'assistant', markdown: MARKDOWN },
    ]

    // ── THE COLD LOAD, HELD OPEN ────────────────────────────────────────────
    // The conversation has answered — the transport resolves on the first tick —
    // but the engines have not. NOTHING may be painted here: each turn is drawn
    // once and cannot afterwards be redrawn, so a turn drawn now would stay as
    // its own markdown source for the life of the page, which is precisely the
    // "right only after a reload" report.
    const engines = deferred()
    const cold = mountBuilder(root, {
      sites: SITES,
      storage: memoryStorage(),
      chatTransport: chatTransport(HISTORY),
      markdownReady: engines.promise,
    })
    await settle()
    expect(drawn(cold)).toHaveLength(0)

    // Released, with the engines now present: the turns appear, in the order they
    // were spoken and each attributed to whoever said it…
    installEngines()
    engines.resolve()
    await settle()
    expect(cold.chat.getChat()!.getMessages()).toEqual(HISTORY)

    // …and as RENDERED MARKDOWN — emphasis and list items as real elements, with
    // no marker left anywhere in the visible text.
    const painted = drawn(cold)
    expect(painted).toHaveLength(2)
    const reply = painted[1]
    expect(reply.querySelector('strong')?.textContent).toBe('cream')
    expect(reply.querySelectorAll('li')).toHaveLength(2)
    expect(reply.textContent).not.toContain('**')
    cold.destroy()

    // ── THE PANE'S OWN NOTE IS MARKDOWN TOO ─────────────────────────────────
    // A conversation that cannot be opened at all is reported by a note the pane
    // writes in its own voice, and that note is emphasised markdown. It is held
    // for the same readiness the transcript is — painting it early would put the
    // panel's own words on screen as their markers.
    freshRoot()
    const held = deferred()
    const unopened = mountBuilder(root, {
      sites: SITES,
      storage: memoryStorage(),
      chatTransport: chatTransport([], true),
      markdownReady: held.promise,
    })
    await settle()
    expect(drawn(unopened)).toHaveLength(0)

    held.resolve()
    await settle()
    const note = unopened.split.element.querySelector('.chat-message.assistant')!
    expect(note.textContent).toContain('The assistant could not be reached')
    expect(note.querySelector('em')).toBeTruthy()
    expect(note.textContent).not.toContain('_')
    unopened.destroy()

    // ── AN ENGINE THAT GENUINELY CANNOT LOAD ────────────────────────────────
    // Settled readiness with no engine behind it settles the wait exactly as a
    // loaded one does. Replay is NOT withheld indefinitely and never waits
    // forever on a renderer that is not coming: the transcript is shown, as
    // readable escaped text in a plainer panel rather than as raw markup.
    freshRoot()
    setParser(null)
    setSanitizer(null)
    const plain = mountBuilder(root, {
      sites: SITES,
      storage: memoryStorage(),
      chatTransport: chatTransport(HISTORY),
      markdownReady: Promise.resolve(),
    })
    await settle()

    const escaped = drawn(plain)
    expect(escaped).toHaveLength(2)
    expect(escaped[1].textContent).toContain('**cream**')
    expect(escaped[1].querySelector('strong')).toBeNull()
    expect(escaped[1].innerHTML).not.toContain('<strong')
    plain.destroy()
  })
})

// ── one pair of engines, for the whole workspace ─────────────────────────────

describe.skipIf(!WEBUI_INSTALLED)('story-7f437d57 — the engines belong to the workspace', () => {
  it('test_UAT_AC1816_the_engines_start_once_for_the_workspace_and_readiness_settles_either_way', async () => {
    // A FRESH MODULE REGISTRY is what makes "started once" observable at all: the
    // loads are kicked off when the module is evaluated and cached for its life,
    // so the start can only be watched in a workspace that has not loaded yet.
    vi.resetModules()

    // STARTED BY LOADING THE WORKSPACE, NOT BY A SURFACE ASKING. Evaluating the
    // workspace's markdown module is the whole of it: no surface has been
    // mounted, none has requested an engine, and the wait is already over.
    //
    // AND IT NEVER REPORTS FAILURE. Under vitest the CDN import cannot run, which
    // IS the "cannot be fetched at all" case — readiness RESOLVES rather than
    // rejecting, so nothing waiting on it can be stranded and no surface needs a
    // second path for the engines refusing to come.
    const markdown = (await import(
      '../apps/control-app/src/builder/markdown.js'
    )) as MarkdownModule
    await expect(markdown.markdownReady).resolves.toBeUndefined()
    expect(markdown.markdownEngineReady()).toBe(false)

    // ONE PAIR FOR THE WORKSPACE, not one per importer: every module that reaches
    // for the engines is handed back the same readiness, over the same loads.
    const again = (await import('../apps/control-app/src/builder/markdown.js')) as MarkdownModule
    expect(again.markdownReady).toBe(markdown.markdownReady)

    // ── A SURFACE BROUGHT UP ON ITS OWN, AND REACHED FIRST ──────────────────
    // The Library's description, mounted alone with no readiness of its own to
    // wait on. It finds the loads already in flight rather than starting a
    // second copy: it PROCEEDS rather than stalling, and shows its content as
    // escaped text rather than as raw markup or not at all.
    const { createLibraryPanel } = (await import(
      '../apps/control-app/src/builder/library.js'
    )) as { createLibraryPanel: (opts?: Record<string, unknown>) => LibraryPanel }
    const library = createLibraryPanel({
      storage: memoryStorage(),
      transport: materialTransport(),
      getSite: () => 'alpha',
    })
    root.append(library.element)
    await library.refresh()
    library.listDetail.select('material-1')
    await markdown.markdownReady
    await settle()

    const cell = library.element.querySelector(DESCRIPTION_CELL) as HTMLElement
    expect(cell).toBeTruthy()
    expect(cell.dataset.markdownPaint).toBe('escaped')
    expect(cell.textContent).toContain('**cream**')
    expect(cell.innerHTML).not.toContain('<strong')

    // ── A SECOND SURFACE, IN THE WORKSPACE ITSELF ───────────────────────────
    // The assistant pane, on the workspace's own readiness — nothing is injected
    // here, so this is the real signal the Library just used.
    const { mountBuilder: mount } = (await import('../apps/control-app/src/builder/app.js')) as {
      mountBuilder: MountBuilder
    }
    const host = freshRoot()
    const app = mount(host, {
      sites: SITES,
      storage: memoryStorage(),
      chatTransport: chatTransport([{ role: 'assistant', markdown: MARKDOWN }]),
    })
    await markdown.markdownReady
    await settle()

    // It proceeded too, and the workspace is simply a plainer one: the turn is
    // there, as readable escaped text…
    const shown = [...app.split.element.querySelectorAll('.chat-message')]
    expect(shown).toHaveLength(1)
    expect(shown[0].textContent).toContain('**cream**')
    expect(shown[0].innerHTML).not.toContain('<strong')

    // …and NO FAILURE was put in front of the operator to clear: the pane holds
    // the conversation's one turn and nothing else, and nothing is still
    // spinning. An engine that could not be fetched is not an error the operator
    // has to dismiss.
    expect(app.chat.getChat()!.getMessages()).toEqual([{ role: 'assistant', markdown: MARKDOWN }])
    expect(app.chat.element.querySelector('.chat-widget.is-streaming')).toBeNull()

    // ── THE COUNT, AFTER BOTH ───────────────────────────────────────────────
    // Still one pair, whichever surface was reached first: the readiness is the
    // same object it was before either mounted, and no surface installed an
    // engine of its own along the way.
    const after = (await import('../apps/control-app/src/builder/markdown.js')) as MarkdownModule
    expect(after.markdownReady).toBe(markdown.markdownReady)
    expect(after.markdownEngineReady()).toBe(false)

    library.destroy()
    app.destroy()
  })
})

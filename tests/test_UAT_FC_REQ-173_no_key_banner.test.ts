// @vitest-environment jsdom
/**
 * REQ-173 — **a builder with no API key says so once and blocks**.
 *
 * WHY THIS IS PART OF THIS TICKET. It arrived as the answer to a narrower
 * question: what should a document's body be when no describer is configured?
 * The answer is that the question should not arise. Nothing in this product works
 * without a key — the assistant cannot take a turn, an image cannot be looked at,
 * and since this ticket a document cannot be described either — so the builder
 * finds out first, says it in one sentence at the top, and blocks rather than
 * letting the operator discover the same fact one failing surface at a time.
 *
 * WHAT IS ASSERTED AND WHAT DELIBERATELY IS NOT. This proves what the DOM says: a
 * banner carrying the reason, mounted OUTSIDE the disabled subtree so its text can
 * still be selected and pasted; the shell `inert`, which is what removes every
 * control at once from the tab order and from hit testing; no session opened; and
 * an upload refused before it is sent. It does NOT assert the dimming, which is a
 * CSS property jsdom computes nothing about — the class that carries it is
 * asserted instead, beside the rule that defines it.
 *
 * `inert` RATHER THAN PER-SURFACE DISABLING, and that is the claim worth stating.
 * One attribute covers the tabs, the toolbar, the pane, the assistant and the
 * Library together — and covers the surface added next month, which a list of
 * `disabled` calls would not.
 */

import { readFileSync } from 'node:fs'
import path from 'node:path'
import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'

let mountBuilder: (root: HTMLElement, opts?: Record<string, unknown>) => never

if (!WEBUI_INSTALLED) console.warn(`REQ-173 banner suite skipped: ${WEBUI_SKIP_REASON}`)

const repo = (...parts: string[]) => path.resolve(__dirname, '..', ...parts)
const CSS = readFileSync(repo('apps/control-app/src/builder/builder.css'), 'utf8')

const SITES = [{ slug: 'bakery', latest: 1 }]
const REASON =
  'This builder has no Anthropic API key, so nothing that needs the assistant can run.'

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

/** Let the app's site-change `openSession` settle, if it makes one. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 0))

beforeAll(async () => {
  if (WEBUI_INSTALLED) {
    ;({ mountBuilder } = await import('../apps/control-app/src/builder/app.js'))
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

describe.skipIf(!WEBUI_INSTALLED)('REQ-173 — the reason is at the top and everything below is off', () => {
  it('test_UAT_FC_REQ_173_an_unconfigured_deployment_shows_the_reason_and_disables_the_shell', async () => {
    const app = mountBuilder(root, {
      sites: SITES,
      storage: memoryStorage(),
      aiStatus: { ai: false, message: REASON },
    }) as unknown as { banner: HTMLElement | null; shell: { element: HTMLElement }; destroy(): void }
    await settle()

    const banner = root.querySelector('.builder-banner')!
    expect(banner).toBeTruthy()
    expect(banner.textContent).toContain('Anthropic API key')
    // AN ALERT, not a status: this is not progress, it is the reason nothing
    // below responds, and a screen reader should reach it without being asked.
    expect(banner.getAttribute('role')).toBe('alert')

    // OUTSIDE THE DISABLED SUBTREE, which is the whole reason it is mounted on
    // the root rather than inside the shell. A warning whose text cannot be
    // selected is a warning that cannot be pasted into a support message.
    expect(app.shell.element.contains(banner)).toBe(false)
    expect(banner.compareDocumentPosition(app.shell.element)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    )

    // ONE ATTRIBUTE, EVERY CONTROL. The tabs, the toolbar, the pane, the
    // assistant and the Library are inside it — and so is whatever is added next.
    expect(app.shell.element.hasAttribute('inert')).toBe(true)
    expect(app.shell.element.classList.contains('builder-shell--blocked')).toBe(true)

    app.destroy()
    // …and taken away with the app, so a second mount does not inherit it.
    expect(root.querySelector('.builder-banner')).toBeNull()
  })

  it('test_UAT_FC_REQ_173_a_configured_deployment_is_unchanged', async () => {
    // THE DEFAULT IS UNBLOCKED, and it has to be: every existing host and every
    // suite that does not care about the key mounts exactly the builder it
    // mounted before, without passing anything new.
    const app = mountBuilder(root, {
      sites: SITES,
      storage: memoryStorage(),
    }) as unknown as { banner: HTMLElement | null; shell: { element: HTMLElement } }
    await settle()

    expect(app.banner).toBeNull()
    expect(root.querySelector('.builder-banner')).toBeNull()
    expect(app.shell.element.hasAttribute('inert')).toBe(false)
  })

  it('test_UAT_FC_REQ_173_no_session_is_opened_and_the_pane_says_the_same_thing', async () => {
    // THE REQUEST IS NOT MADE. The origin would answer `ready: false` with the
    // host's own wording, which is true but describes the chat route rather than
    // the deployment — and the banner has already said the deployment-wide thing.
    const asked: string[] = []
    const app = mountBuilder(root, {
      sites: SITES,
      storage: memoryStorage(),
      aiStatus: { ai: false, message: REASON },
      chatTransport: {
        openSession: async (slug: string) => {
          asked.push(slug)
          return { sessionId: `site-${slug}`, turns: [], ready: true }
        },
      },
    }) as unknown as { chat: { element: HTMLElement }; destroy(): void }
    await settle()

    expect(asked).toEqual([])
    expect(app.chat.element.textContent).toContain('Anthropic API key')
    app.destroy()
  })

  it('test_UAT_FC_REQ_173_a_dropped_file_is_not_sent', async () => {
    // BELT AND BRACES BESIDE `inert`. The attribute stops a click; a drag onto an
    // inert subtree is not something it is specified to refuse, and this is the
    // one action with a real origin behind it — which would answer 503 and give
    // the operator a second error to interpret on top of the banner.
    const sent: unknown[] = []
    const app = mountBuilder(root, {
      sites: SITES,
      storage: memoryStorage(),
      aiStatus: { ai: false, message: REASON },
      libraryTransport: {
        list: async () => ({ material: [] }),
        item: async () => ({}),
        save: async () => ({}),
        fileUrl: () => '',
        upload: async (args: unknown) => {
          sent.push(args)
          return {}
        },
      },
    }) as unknown as {
      receiveFiles(files: File[], role: string, source: string): Promise<void>
      destroy(): void
    }
    await settle()

    // The overlay's own callback, which is the function a committed drop calls.
    await app.receiveFiles([new File(['hello'], 'notes.txt', { type: 'text/plain' })], 'reference', 'library')
    expect(sent).toEqual([])
    app.destroy()
  })
})

describe('REQ-173 — the banner is visible as well as blocking', () => {
  it('test_UAT_FC_REQ_173_the_blocked_shell_is_dimmed_by_the_class_the_app_sets', () => {
    // `inert` STOPS THE INTERACTION AND SHOWS NOTHING. A builder that ignores
    // every click while looking perfectly normal reads as broken software rather
    // than as a deployment that is switched off — so the class carries the
    // visible half, and the rule that defines it is asserted beside the app that
    // applies it.
    expect(CSS).toMatch(/\.builder-shell--blocked\s*\{[^}]*opacity/)
    expect(CSS).toMatch(/\.builder-banner\s*\{/)
  })
})

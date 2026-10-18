// @vitest-environment jsdom
/**
 * [[REQ-407]] UATs — **"Open in new tab" is a button**, like the controls beside
 * it.
 *
 * It sat in the toolbar as the one accent-coloured link in a strip of buttons —
 * View on your phone, Colors, Publish — and read as a different kind of thing.
 * Driven against the real `mountBuilder` composition, as BUG-131's suite is.
 *
 * Covered:
 *
 *   1  the control is a `<button>`, beside View on your phone, and clicking it
 *      opens the draft render of the page in a new tab, without an opener
 *   2  it is styled by the same rule as Publish and View on your phone, and no
 *      longer carries a link colour of its own
 */
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { beforeEach, describe, expect, it } from 'vitest'
import * as pageState from '../packages/framework/src/l1/page-state'
import { setBusinessScope } from '../apps/control-app/src/builder/api.js'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'

const SITES = [{ site: 'acme', latest: null }]

const PAGES = [
  { id: 'home', slug: 'home', title: 'Home', reachable: true },
  { id: 'about', slug: 'about', title: 'About us', reachable: true },
]

function memoryStorage(): Storage {
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
  } as Storage
}

const settled = () => new Promise((resolve) => setTimeout(resolve, 0))

/** `app.js` imports the webui components by bare specifier — hence the dynamic load. */
let mountBuilder: (root: HTMLElement, opts?: Record<string, unknown>) => Record<string, any>

if (!WEBUI_INSTALLED) console.warn(`REQ-407 open-in-tab suite skipped: ${WEBUI_SKIP_REASON}`)

describe.skipIf(!WEBUI_INSTALLED)('REQ-407 — Open in new tab is a button', () => {
  let root: HTMLElement

  beforeEach(async () => {
    ;({ mountBuilder } = await import('../apps/control-app/src/builder/app.js'))
    setBusinessScope(null)
    document.body.replaceChildren()
    root = document.createElement('div')
    document.body.append(root)
  })

  it('test_UAT_FC_REQ-407_open_in_new_tab_is_a_button_that_opens_the_draft', async () => {
    mountBuilder(root, {
      sites: SITES,
      storage: memoryStorage(),
      pageState,
      pagesTransport: { list: async () => ({ pages: PAGES }) },
    })
    await settled()

    const control = root.querySelector('.builder-toolbar__open') as HTMLElement
    expect(control, 'the toolbar does not render Open in new tab').toBeTruthy()
    expect(control.tagName).toBe('BUTTON')
    expect((control as HTMLButtonElement).type).toBe('button')
    expect(control.textContent).toBe('Open in new tab')
    expect(control.hasAttribute('href'), 'still carries a link address').toBe(false)
    // A button among buttons: View on your phone is one too.
    expect(root.querySelector('.builder-toolbar__phone')!.tagName).toBe('BUTTON')
    expect(control.title, 'the tooltip names where it goes').toBe('/preview/acme/draft/')

    const calls: unknown[][] = []
    const open = window.open
    window.open = ((...args: unknown[]) => (calls.push(args), null)) as typeof window.open
    try {
      control.click()
    } finally {
      window.open = open
    }
    expect(calls).toEqual([['/preview/acme/draft/', '_blank', 'noopener']])
  })

  it('test_UAT_FC_REQ-407_open_in_new_tab_is_styled_with_the_other_buttons', () => {
    const css = readFileSync(
      path.resolve(__dirname, '..', 'apps/control-app/src/builder/builder.css'),
      'utf8',
    ).replace(/\/\*[\s\S]*?\*\//g, '')
    const rules = [...css.matchAll(/([^{}]+)\{([^}]*)\}/g)].map((m) => ({
      selectors: m[1].split(',').map((s) => s.trim()),
      body: m[2],
    }))
    const shared = rules.find((r) => r.selectors.includes('.builder-toolbar__publish'))
    expect(shared, 'no rule styles Publish').toBeTruthy()
    expect(shared!.selectors).toContain('.builder-toolbar__phone')
    expect(shared!.selectors, 'Open in new tab is not styled with Publish').toContain(
      '.builder-toolbar__open',
    )
    for (const r of rules.filter((r) => r.selectors.includes('.builder-toolbar__open'))) {
      expect(r.body, 'Open in new tab keeps a link colour of its own').not.toMatch(/(^|[;\s])color\s*:/)
    }
  })
})

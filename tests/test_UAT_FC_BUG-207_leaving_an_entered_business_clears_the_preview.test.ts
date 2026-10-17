// @vitest-environment jsdom
/**
 * BUG-207 — **leaving an entered business clears its site from the preview.**
 *
 * The platform operator enters a customer's business from the console
 * ([[REQ-367]]) and the Site tab shows that customer's site. Taking the way back
 * lands on the operator's own first business — and when that business has no
 * sites (1st Contact's only page is the `/account` portal, which `/api/sites`
 * does not list), the pane has nothing to show. It used to write `src=""` into
 * the frame, which a browser does not unload, so the customer's site stayed on
 * screen under a builder that had moved everywhere else.
 *
 * WHAT MAKES IT EVIDENCE. The real builder shell and the real display panel,
 * mounted in a DOM: the assertion is on the frame the operator can see — its
 * `src` attribute, which is what the browser navigates from — and not on the
 * panel's own bookkeeping, which always said "nothing".
 */

import { beforeEach, describe, expect, it } from 'vitest'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'

type Handle = Record<string, any>

if (!WEBUI_INSTALLED) console.warn(`BUG-207 cases skipped: ${WEBUI_SKIP_REASON}`)

const settle = async () => {
  for (let i = 0; i < 3; i += 1) await new Promise((r) => setTimeout(r, 0))
}

function memoryStorage() {
  const map = new Map<string, string>()
  return {
    map,
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

/** The operator's own businesses; the first — where "back" lands — has no sites. */
const OWN = [
  { id: 'biz_platform', name: '1st Contact', selectable: true },
  { id: 'biz_lab', name: 'Lab', selectable: true },
]
const ENTERED = { id: 'biz_customer', name: 'Customer' }
const SITES: Record<string, { site: string }[]> = {
  biz_customer: [{ site: 'site_customer' }],
  biz_platform: [],
  biz_lab: [{ site: 'site_lab' }],
}

let root: HTMLElement

beforeEach(() => {
  document.body.replaceChildren()
  root = document.createElement('div')
  document.body.append(root)
})

async function mountApp(over: Record<string, unknown> = {}): Promise<Handle> {
  const { mountBuilder } = await import('../apps/control-app/src/builder/app.js')
  const app = mountBuilder(root, {
    businesses: OWN,
    person: { name: 'Operator', email: 'op@example.test' },
    ownsPlatformBusiness: true,
    entered: ENTERED,
    storage: memoryStorage(),
    loadSites: async (id: string) => SITES[id] ?? [],
    chatTransport: {
      openSession: async (slug: string) => ({ sessionId: `s-${slug}`, turns: [], ready: true }),
      streamPrompt: async function* () {
        yield { kind: 'done' }
      },
    },
    libraryTransport: {
      list: async () => ({ material: [] }),
      item: async () => ({ body: '' }),
      save: async () => ({}),
      fileUrl: (uid: string) => `/api/material/file?uid=${uid}`,
      upload: async () => ({}),
    },
    paletteTransport: {
      get: async () => ({ palette: {}, usage: {} }),
      write: async () => ({ palette: {}, usage: {} }),
    },
    ...over,
  }) as Handle
  await settle()
  return app
}

/** Where the frame on screen is pointed — what the browser actually loads. */
const shownSrc = (app: Handle) => (app.panel.frame as HTMLIFrameElement | null)?.getAttribute('src')

describe.skipIf(!WEBUI_INSTALLED)('BUG-207 — an entered business does not linger in the preview', () => {
  it('test_UAT_FC_BUG-207_the_way_back_to_a_siteless_business_blanks_the_preview', async () => {
    const app = await mountApp()
    // Entered: the customer's site is what the pane shows.
    expect(app.scope.getSite()).toBe('site_customer')
    expect(shownSrc(app)).toContain('site_customer')

    ;(app.operatorBanner as HTMLElement).querySelector('button')!.click()
    await settle()

    // Back in the operator's own business, which has no sites: the frame is
    // genuinely emptied, not left holding the customer's page.
    expect(app.scope.getBusiness()).toBe(OWN[0].id)
    expect(app.scope.getSite()).toBeNull()
    expect(shownSrc(app)).toBe('about:blank')
    // The panel still reports "nothing shown" the way it always has.
    expect(app.panel.getSrc()).toBe('')
    app.destroy()
  })

  it('test_UAT_FC_BUG-207_switching_to_a_siteless_business_blanks_the_preview', async () => {
    // The other way out: the operator moves to a business of their own — here
    // one WITH a site, then the site-less one — through the switcher.
    const app = await mountApp()
    const select = root.querySelector<HTMLSelectElement>('.builder-business__select')!

    select.value = OWN[1].id
    select.dispatchEvent(new Event('change'))
    await settle()
    expect(shownSrc(app)).toContain('site_lab')

    select.value = OWN[0].id
    select.dispatchEvent(new Event('change'))
    await settle()
    expect(app.scope.getSite()).toBeNull()
    expect(shownSrc(app)).toBe('about:blank')
    app.destroy()
  })
})

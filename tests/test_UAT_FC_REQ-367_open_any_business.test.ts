// @vitest-environment jsdom
/**
 * REQ-367 — **the platform operator can open any business from the console** —
 * the chrome half.
 *
 * WHAT MAKES IT EVIDENCE. The real console list and the real builder shell are
 * mounted in a DOM and read back the way an operator would see them: the row's
 * Open control, the switcher's entries, the banner above the tabs, and what a
 * switch does to all three. The server half — that the link actually lands in
 * the business, is audited, and leaves owner controls shut — is the workers
 * suite beside this one.
 *
 * THE CLAIMS:
 *
 *   1. EVERY CONSOLE ROW CARRIES AN OPEN CONTROL linking to the builder under
 *      that business's prefix.
 *   2. AN ENTERED BUSINESS OPENS, IS SHOWN IN THE SWITCHER MARKED AS ENTERED,
 *      and a banner names it on every tab with a way back.
 *   3. SWITCHING AWAY LEAVES IT FOR GOOD — the entry and the banner both go, and
 *      the operator's own businesses are what remain.
 *   4. A PAGE URL NAMING A BUSINESS IS READ, which is how the boot scopes its
 *      first request to the business the link opened.
 */

import { beforeEach, describe, expect, it } from 'vitest'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'
import * as CONFIG from '../apps/control-app/src/builder/config.js'
import { businessFromPath, getBusinessScope } from '../apps/control-app/src/builder/api.js'

type Handle = Record<string, any>

if (!WEBUI_INSTALLED) console.warn(`REQ-367 chrome cases skipped: ${WEBUI_SKIP_REASON}`)

const settle = () => new Promise((r) => setTimeout(r, 0))

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

/** The operator's OWN businesses — memberships. */
const OWN = [
  { id: 'biz_platform', name: '1st Contact', selectable: true },
  { id: 'biz_lab', name: 'Lab', selectable: true },
]
const ENTERED = { id: 'biz_salon', name: 'Salon' }

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
    loadSites: async () => [],
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

describe.skipIf(!WEBUI_INSTALLED)('REQ-367 — the console opens any business', () => {
  it('test_UAT_FC_REQ-367_every_console_row_links_into_its_business', async () => {
    const { mountPlatformSites } = await import('../apps/control-app/src/builder/platform-sites.js')
    const sites = [
      { site: 'site_a', business: 'biz_salon', businessName: 'Salon', ownerAccount: 'acct_a', address: null },
      { site: 'site_b', business: 'biz_lab', businessName: 'Lab', ownerAccount: 'acct_b', address: null },
      { site: 'site_c', business: 'biz/odd id', businessName: 'Odd', ownerAccount: 'acct_c', address: null },
    ]
    const handle = mountPlatformSites(root, {
      fetchSites: async () => ({ sites }),
      fetchLeague: async () => ({ businesses: [] }),
    })
    await settle()
    await settle()

    const rows = [...root.querySelectorAll<HTMLElement>('.builder-console-sites__row')]
    expect(rows).toHaveLength(3)
    for (const row of rows) {
      const open = row.querySelector<HTMLAnchorElement>('a.builder-console-sites__open')
      expect(open?.textContent).toBe(CONFIG.CONSOLE_OPEN_LABEL)
      // The builder under that business's own prefix — encoded, so an id the
      // URL grammar would otherwise split still names one business.
      expect(open?.getAttribute('href')).toBe(`/b/${encodeURIComponent(row.dataset.business!)}/`)
    }
    handle.destroy()
  })

  it('test_UAT_FC_REQ-367_an_entered_business_opens_marked_with_a_banner', async () => {
    const app = await mountApp()

    // It is the business the builder opened on, ahead of every membership.
    expect(app.scope.getBusiness()).toBe(ENTERED.id)
    expect(getBusinessScope()).toBe(ENTERED.id)

    // The switcher shows it as the CURRENT entry, marked entered and not owned,
    // with the operator's own businesses still listed beneath it.
    const select = root.querySelector<HTMLSelectElement>('.builder-business__select')!
    expect(select.value).toBe(ENTERED.id)
    const marked = select.querySelector<HTMLOptionElement>('option[data-entered="true"]')!
    expect(marked.value).toBe(ENTERED.id)
    expect(marked.textContent).toBe(`${ENTERED.name}${CONFIG.BUSINESS_ENTERED_SUFFIX}`)
    expect([...select.options].map((o) => o.value)).toEqual([ENTERED.id, ...OWN.map((b) => b.id)])

    // The banner names it, above the shell so it stands over every tab, and
    // offers the way back to a business of the operator's own, by name.
    const banner = app.operatorBanner as HTMLElement
    expect(banner).toBeTruthy()
    expect(banner.textContent).toContain(CONFIG.OPERATOR_BANNER(ENTERED.name))
    expect(app.shell.element.contains(banner)).toBe(false)
    expect(root.contains(banner)).toBe(true)
    for (const tab of CONFIG.TABS) {
      app.shell.setActiveTab(tab.id)
      expect(banner.isConnected).toBe(true)
    }
    expect(banner.querySelector('button')?.textContent).toBe(CONFIG.OPERATOR_BANNER_BACK(OWN[0].name))

    // The console is still on offer: the gate is the operator's own, unchanged.
    expect(
      app.shell.element.querySelector(`[data-action="${CONFIG.CONSOLE_ACTION_ID}"]`),
    ).toBeTruthy()
    app.destroy()
  })

  it('test_UAT_FC_REQ-367_the_way_back_leaves_the_entered_business_for_good', async () => {
    const storage = memoryStorage()
    const app = await mountApp({ storage })
    const banner = app.operatorBanner as HTMLElement

    banner.querySelector('button')!.click()
    await settle()

    // Back in the operator's own business, through the shell's one switch.
    expect(app.scope.getBusiness()).toBe(OWN[0].id)
    // The banner is gone and the entered business is no longer offered: the
    // switcher may not re-enter it — that is the console's audited act.
    expect(app.operatorBanner).toBeNull()
    expect(banner.isConnected).toBe(false)
    const select = root.querySelector<HTMLSelectElement>('.builder-business__select')!
    expect([...select.options].map((o) => o.value)).toEqual(OWN.map((b) => b.id))
    expect(select.value).toBe(OWN[0].id)
    // And the entered business was never remembered as the operator's selection.
    expect([...storage.map.values()]).not.toContain(ENTERED.id)
    app.destroy()
  })

  it('test_UAT_FC_REQ-367_switching_away_with_the_switcher_also_leaves_it', async () => {
    const app = await mountApp()
    const select = root.querySelector<HTMLSelectElement>('.builder-business__select')!

    select.value = OWN[1].id
    select.dispatchEvent(new Event('change'))
    await settle()

    expect(app.scope.getBusiness()).toBe(OWN[1].id)
    expect(app.operatorBanner).toBeNull()
    expect(select.querySelector('option[data-entered="true"]')).toBeNull()
    app.destroy()
  })

  it('test_UAT_FC_REQ-367_a_held_business_draws_no_banner', async () => {
    const app = await mountApp({ entered: null, linkedBusiness: OWN[1].id })

    // A link naming one of the operator's own businesses opens it, as the
    // switcher would, with nothing marked and nothing to remind them of.
    expect(app.scope.getBusiness()).toBe(OWN[1].id)
    expect(app.operatorBanner).toBeNull()
    expect(root.querySelector('option[data-entered="true"]')).toBeNull()
    app.destroy()
  })
})

describe('REQ-367 — the page URL names the business', () => {
  it('test_UAT_FC_REQ-367_the_boot_reads_the_business_from_the_page_url', () => {
    expect(businessFromPath('/b/biz_salon/')).toBe('biz_salon')
    expect(businessFromPath('/b/biz_salon')).toBe('biz_salon')
    expect(businessFromPath(`/b/${encodeURIComponent('biz/odd id')}/`)).toBe('biz/odd id')
    expect(businessFromPath('/')).toBeNull()
    expect(businessFromPath('/b/')).toBeNull()
  })
})

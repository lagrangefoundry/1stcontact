// @vitest-environment jsdom
/**
 * REQ-179 — **the business selector is shell chrome, not a tab's toolbar**.
 *
 * WHAT MAKES THIS EVIDENCE. Every case mounts the REAL builder over the
 * ACTUALLY-INSTALLED shared `webui-*` components — never a stand-in for the
 * shell, because "the control is in the shell's chrome and outside every tab
 * panel" is a claim about the shell's own markup and a mock of it would prove
 * nothing. The seams that are injected are the network ones the builder already
 * declares (`loadSites`, `chatTransport`, `libraryTransport`, `paletteTransport`),
 * so the composition under test is the shipped one.
 *
 * THE CLAIMS, in the order the ticket makes them:
 *
 *   1. THE SELECTOR IS SHELL CHROME. It renders in the shell's own header,
 *      outside every tab panel, and stays on screen when the active tab changes.
 *      That is what makes it apply to every tab rather than to one.
 *   2. CHANGING IT RE-SCOPES EVERY MOUNTED TAB, IN ONE ACT — the pane's site and
 *      the URL it loads, the assistant's session, the Library's list, and the
 *      site an upload is placed on. Each of these used to find out
 *      separately; the failure this guards is one of them left behind, which
 *      would put one business's material in front of another business's site.
 *   3. IT SCOPES THE REQUESTS, NOT ONLY THE CHROME. Every URL carries
 *      `/b/<businessId>` — without that the switcher would re-label the chrome
 *      while every request still resolved to the server's fallback.
 *   4. NO TAB READS `panel.getSite()` TO DISCOVER THE SCOPE.
 *   5. THE ACCOUNT IS BEHIND THE AVATAR AND ABSENT FROM THE TAB STRIP.
 *   6. A STORED SELECTION THE ACCOUNT CANNOT OPERATE FALLS BACK SILENTLY.
 *   7. WITH ONE BUSINESS THE SWITCHER CLAIMS NO MORE CHROME THAN THE NAME.
 *   8. WITH NOTHING SELECTABLE THE SWITCHER STILL RENDERS, THE TABS GO AND THE
 *      CHROME STAYS ([[REQ-179]] reopen, [[DOC-42]] §10.1). This state did not
 *      exist when the cases above were written: an account whose every grant had
 *      lapsed was refused at the door, so the person whose problem was a payment
 *      met a login failure and could reach neither the page showing what they
 *      were charged nor the button closing their account. Membership admits now.
 *      The failure these cases guard is the block landing on the wrong subtree —
 *      an inert shell takes the avatar with it, and the avatar is the whole
 *      remedy.
 */

import fs from 'node:fs'
import path from 'node:path'
import { beforeEach, describe, expect, it } from 'vitest'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'

const REPO = path.resolve(__dirname, '..')
const BUILDER = path.join(REPO, 'apps/control-app/src/builder')

type Handle = Record<string, any>

let mountBuilder: (root: HTMLElement, opts?: Record<string, unknown>) => Handle
let CONFIG: Record<string, any>
let resolveBusiness: (businesses: unknown[], stored: string | null) => string | null

if (!WEBUI_INSTALLED) console.warn(`REQ-179 chrome suites skipped: ${WEBUI_SKIP_REASON}`)

/** A `Storage`-shaped map, so a second mount can restore what the first wrote. */
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

const settle = () => new Promise((r) => setTimeout(r, 0))

const BUSINESSES = [
  { id: 'acct_salon', name: 'Salon', selectable: true },
  { id: 'acct_studio', name: 'Studio', selectable: true },
  { id: 'acct_gone', name: 'Gone', selectable: false },
]

const SITES_OF: Record<string, Array<{ slug: string; latest: number | null }>> = {
  acct_salon: [{ slug: 'salon-site', latest: null }],
  acct_studio: [{ slug: 'studio-site', latest: 1 }],
}

const ACCOUNT = { name: 'Sam Salon', email: 'sam@example.test' }

/**
 * The same account with every grant lapsed — what [[DOC-42]] §10.1 made
 * reachable. `lapse` is on the wire exactly when `selectable` is false, so these
 * carry it: the account surface states the reason per business, and a fixture
 * without it would exercise a payload the Worker never sends.
 */
const ALL_LAPSED = [
  { id: 'acct_salon', name: 'Salon', selectable: false, lapse: { reason: 'expired', endedAt: '2026-07-01T00:00:00Z' } },
  { id: 'acct_studio', name: 'Studio', selectable: false, lapse: { reason: 'revoked', endedAt: null } },
]

let root: HTMLElement

beforeEach(async () => {
  if (WEBUI_INSTALLED && !mountBuilder) {
    ;({ mountBuilder } = await import('../apps/control-app/src/builder/app.js'))
    ;({ resolveBusiness } = await import('../apps/control-app/src/builder/business.js'))
  }
  // `config.js` imports nothing, so it loads on every machine.
  if (!CONFIG) CONFIG = await import('../apps/control-app/src/builder/config.js')
  document.body.replaceChildren()
  root = document.createElement('div')
  document.body.append(root)
})

/**
 * The real builder, with every network seam recorded.
 *
 * `loadSites` is the one seam this ticket added, and it stands in for
 * `/api/sites` — which is business-scoped by the prefix the switcher sets, so a
 * suite that drove the real call would be asserting the origin's routing rather
 * than the chrome's.
 */
function mount(over: Record<string, unknown> = {}) {
  const asked = { sessions: [] as string[], lists: 0, uploads: [] as unknown[], palettes: [] as unknown[] }
  const app = mountBuilder(root, {
    businesses: BUSINESSES,
    account: ACCOUNT,
    storage: memoryStorage(),
    loadSites: async (businessId: string | null) => SITES_OF[businessId ?? ''] ?? [],
    chatTransport: {
      openSession: async (slug: string) => {
        asked.sessions.push(slug)
        return { sessionId: `session-${slug}`, turns: [], ready: true }
      },
      streamPrompt: async function* () {
        yield { kind: 'done' }
      },
    },
    libraryTransport: {
      list: async () => {
        asked.lists += 1
        return { material: [] }
      },
      item: async () => ({ body: '' }),
      save: async () => ({}),
      fileUrl: (uid: string) => `/api/material/file?uid=${uid}`,
      upload: async (args: Record<string, unknown>) => {
        asked.uploads.push(args)
        return { uid: `material-${asked.uploads.length}`, role: args.role, indexed: true }
      },
    },
    paletteTransport: {
      get: async (slug: string) => {
        asked.palettes.push(slug)
        return { palette: {}, usage: {} }
      },
      write: async () => ({ palette: {}, usage: {} }),
    },
    ...over,
  })
  return { app, asked }
}

// ── 1 & 5: where the controls live ───────────────────────────────────────────

describe.skipIf(!WEBUI_INSTALLED)('REQ-179 — the selector is shell chrome', () => {
  it('test_UAT_FC_REQ-179_the_switcher_is_in_shell_chrome_and_outside_every_tab_panel', async () => {
    const { app } = mount()
    await settle()

    const switcher = root.querySelector('.builder-business')!
    expect(switcher).toBeTruthy()
    // INSIDE the shell — so it inherits the `--shell-*` tokens and the app font,
    // and so it is chrome rather than a floating control beside the app.
    expect(app.shell.element.contains(switcher)).toBe(true)
    // …and OUTSIDE every tab's panel, which is the whole claim. A control inside
    // one panel scopes one tab, however it is labelled.
    for (const tab of CONFIG.TABS) {
      expect(app.shell.getPanel(tab.id).contains(switcher)).toBe(false)
    }

    // It is visible from every tab, not merely from the one that happened to be
    // active at mount.
    for (const tab of CONFIG.TABS) {
      app.shell.setActiveTab(tab.id)
      expect(switcher.isConnected).toBe(true)
      expect(app.shell.getActiveTab()).toBe(tab.id)
    }
  })

  it('test_UAT_FC_REQ-179_the_account_is_behind_the_avatar_and_is_not_a_tab', async () => {
    const { app } = mount()
    await settle()

    // NOT A TAB, and this is not a layout preference. The account is the one
    // surface that is not business-scoped, so a tab for it would be the single
    // place where the shell's switcher is present and silently does not apply.
    expect(CONFIG.TABS.map((t: { id: string }) => t.id)).not.toContain(CONFIG.ACCOUNT_ACTION_ID)
    expect(app.shell.getTabs().map((t: { id: string }) => t.id)).not.toContain(
      CONFIG.ACCOUNT_ACTION_ID,
    )

    // It is reachable from the avatar, which carries the account's own initial
    // rather than a generic glyph.
    const avatarButton = app.shell.element.querySelector(
      `[data-action="${CONFIG.ACCOUNT_ACTION_ID}"]`,
    ) as HTMLButtonElement
    expect(avatarButton).toBeTruthy()
    expect(avatarButton.querySelector('.builder-avatar')!.textContent).toBe('S')

    // The shell's own controls survived being joined by a third — `actions`
    // REPLACES the defaults, so omitting them would have silently removed them.
    const actionIds = [...app.shell.element.querySelectorAll('[data-action]')].map(
      (el) => (el as HTMLElement).dataset.action,
    )
    expect(actionIds).toEqual(expect.arrayContaining(['theme', 'about', CONFIG.ACCOUNT_ACTION_ID]))

    avatarButton.click()
    const dialog = app.shell.element.querySelector('.builder-modal')!
    expect(dialog).toBeTruthy()
    // It states who is signed in and which businesses that identity reaches —
    // including the lapsed one, marked, for the reason the switcher shows it.
    expect(dialog.textContent).toContain(ACCOUNT.email)
    expect(dialog.textContent).toContain('Salon')
    expect(dialog.querySelector('[data-lapsed="true"]')!.textContent).toContain('Gone')
  })

  it('test_UAT_FC_REQ-179_one_business_renders_the_name_and_no_control', async () => {
    // THE MODAL CASE IS ONE ([[DOC-40]] §2.3), and a select box offering a
    // choice that does not exist reads as an unmade decision. So it renders the
    // name: present, legible, claiming no more chrome than the fact it states.
    const { app } = mount({ businesses: [BUSINESSES[0]] })
    await settle()

    const switcher = root.querySelector('.builder-business')!
    expect(switcher.querySelector('select')).toBeNull()
    expect(switcher.querySelector('.builder-business__name')!.textContent).toBe('Salon')
    // It is still the scope: one business, selected, and everything scoped to it.
    expect(app.scope.getBusiness()).toBe('acct_salon')
  })

  it('test_UAT_FC_REQ-179_a_lapsed_business_is_offered_and_cannot_be_chosen', async () => {
    const { app } = mount()
    await settle()

    const select = root.querySelector('.builder-business__select') as HTMLSelectElement
    expect([...select.options].map((o) => o.value)).toEqual(BUSINESSES.map((b) => b.id))
    const lapsed = [...select.options].find((o) => o.value === 'acct_gone')!
    // Readable and unreachable, said with the attribute the platform already
    // means it with — so keyboard and assistive technology get it for free.
    expect(lapsed.disabled).toBe(true)
    expect(lapsed.textContent).toContain(CONFIG.BUSINESS_LAPSED_SUFFIX.trim())
    expect(app.scope.getBusiness()).not.toBe('acct_gone')
  })
})

// ── 2 & 3: what a switch actually moves ──────────────────────────────────────

describe.skipIf(!WEBUI_INSTALLED)('REQ-179 — one act re-scopes every tab', () => {
  it('test_UAT_FC_REQ-179_changing_the_business_moves_every_surface_at_once', async () => {
    const { app, asked } = mount()
    await settle()

    expect(app.scope.getBusiness()).toBe('acct_salon')
    expect(app.scope.getSite()).toBe('salon-site')
    expect(asked.sessions).toEqual(['salon-site'])
    const listsBefore = asked.lists

    // The operator's own gesture, through the control that is on screen.
    const select = root.querySelector('.builder-business__select') as HTMLSelectElement
    select.value = 'acct_studio'
    select.dispatchEvent(new Event('change'))
    await settle()

    // ONE ACT, EVERY SURFACE. Each of these used to be discovered separately by
    // the surface that needed it; the failure this guards is one left behind.
    expect(app.scope.getBusiness()).toBe('acct_studio')
    // …the pane
    expect(app.scope.getSite()).toBe('studio-site')
    expect(app.panel.getSite()).toBe('studio-site')
    // …the assistant, which is a session per site
    expect(asked.sessions).toEqual(['salon-site', 'studio-site'])
    // …the Library, whose list is the BUSINESS's material and is therefore a
    // DIFFERENT list rather than the same list redrawn ([[REQ-181]])
    expect(asked.lists).toBeGreaterThan(listsBefore)

    // …and the uploads, which name the site a file is placed on.
    await app.receiveFiles([new File(['x'], 'logo.png')], 'site', 'library')
    expect((asked.uploads.at(-1) as Record<string, unknown>).slug).toBe('studio-site')
  })

  it('test_UAT_FC_REQ-179_every_url_the_builder_builds_carries_the_business', async () => {
    const { app } = mount()
    await settle()

    // THE PREFIX [[REQ-168]] ALREADY PARSES. Without it the switcher would
    // re-label the chrome while every request still resolved to the server's
    // own fallback — the very failure this ticket exists to prevent, one layer
    // down and invisible.
    expect(app.panel.frame.getAttribute('src')).toBe('/b/acct_salon/preview/salon-site/draft/')
    expect(app.panel.getSrc()).toBe('/b/acct_salon/preview/salon-site/draft/')

    await app.scope.setBusiness('acct_studio')
    await settle()
    expect(app.panel.frame.getAttribute('src')).toBe('/b/acct_studio/preview/studio-site/draft/')

    // The `open in new tab` link points at exactly what the frame loads, so the
    // prefix reaches the surface an operator can copy out of the browser.
    const link = app.toolbar.get('open-new-tab') as HTMLAnchorElement
    expect(link.getAttribute('href')).toBe(app.panel.frame.getAttribute('src'))
  })

  it('test_UAT_FC_REQ-179_the_frame_reloads_when_only_the_business_changed', async () => {
    // THE CASE THAT IS EASY TO MISS: two businesses whose sites happen to share
    // a slug. Slugs are unique per business, not globally, so this is two
    // different sites — and `setSite` is deliberately a no-op on an unchanged
    // slug, so nothing inside the pane would notice. The URL is what tells them
    // apart, and it must change.
    const shared = [
      { id: 'acct_a', name: 'A', selectable: true },
      { id: 'acct_b', name: 'B', selectable: true },
    ]
    const { app, asked } = mount({
      businesses: shared,
      loadSites: async () => [{ slug: 'home', latest: null }],
    })
    await settle()
    expect(app.panel.frame.getAttribute('src')).toBe('/b/acct_a/preview/home/draft/')

    await app.scope.setBusiness('acct_b')
    await settle()

    expect(app.scope.getSite()).toBe('home')
    expect(app.panel.frame.getAttribute('src')).toBe('/b/acct_b/preview/home/draft/')
    // …and the assistant was re-opened even though the slug never changed: the
    // session belongs to a site, and this is a different site.
    expect(asked.sessions).toEqual(['home', 'home'])
  })
})

// ── 6: persistence and the silent fallback ───────────────────────────────────

describe.skipIf(!WEBUI_INSTALLED)('REQ-179 — the selection survives, and degrades honestly', () => {
  it('test_UAT_FC_REQ-179_the_selection_is_restored_on_a_fresh_mount', async () => {
    const storage = memoryStorage()
    const first = mount({ storage })
    await settle()
    await first.app.scope.setBusiness('acct_studio')
    await settle()
    first.app.destroy()

    // Namespaced by the shell like everything else that persists — the key is
    // the shell's, not a bare `localStorage` write.
    expect([...storage.map.keys()].some((k) => k.includes(CONFIG.STORAGE_KEYS.business))).toBe(true)

    root = document.createElement('div')
    document.body.append(root)
    const second = mount({ storage })
    await settle()
    expect(second.app.scope.getBusiness()).toBe('acct_studio')
    expect(second.app.scope.getSite()).toBe('studio-site')
  })

  it('test_UAT_FC_REQ-179_a_stored_business_the_account_cannot_operate_falls_back_silently', async () => {
    // Browser storage outlives the grant it was written under. Honouring the
    // stored id anyway would send every request to a business the server will
    // refuse, and the operator would meet a builder that 403s on every call with
    // nothing on screen to say why.
    const storage = memoryStorage()
    const seed = mount({ storage })
    await settle()
    await seed.app.scope.setBusiness('acct_studio')
    await settle()
    seed.app.destroy()

    root = document.createElement('div')
    document.body.append(root)
    // The account has been removed from `acct_studio` since; `acct_gone` is
    // offered but lapsed, so the fallback must skip it too.
    const after = mount({
      storage,
      businesses: [BUSINESSES[2], BUSINESSES[0]],
    })
    await settle()

    expect(after.app.scope.getBusiness()).toBe('acct_salon')
    expect(after.app.scope.getSite()).toBe('salon-site')
    // And the stored value is corrected, so the fallback happens once rather
    // than on every load for the rest of the account's life.
    const key = [...storage.map.keys()].find((k) => k.includes(CONFIG.STORAGE_KEYS.business))!
    expect(storage.map.get(key)).toBe('acct_salon')
  })
})

// ── the pure half of the fallback, and the source claim ──────────────────────

// ── 8: nothing selectable — the tabs go, the chrome stays ────────────────────

describe.skipIf(!WEBUI_INSTALLED)('REQ-179 — an account with nothing selectable', () => {
  it('test_UAT_FC_REQ-179_the_switcher_renders_when_no_business_is_selectable', async () => {
    const { app } = mount({ businesses: ALL_LAPSED })
    await settle()

    // IT RENDERS. An empty switcher and a missing switcher say different things,
    // and the businesses are this person's own — the same argument this ticket
    // already makes for the one-business case, at the other end of the range.
    const switcher = root.querySelector('.builder-business') as HTMLElement
    expect(switcher).toBeTruthy()
    expect(app.shell.element.contains(switcher)).toBe(true)
    expect(switcher.dataset.noneSelectable).toBe('true')

    // EVERY ENTRY IS PRESENT AND UNSELECTABLE. Present, because a lapsed
    // business and a deleted one are different facts to the person who owns
    // both; unselectable, because none of them can be entered.
    const select = switcher.querySelector('select') as HTMLSelectElement
    expect(select).toBeTruthy()
    expect([...select.options].map((o) => o.value)).toEqual(ALL_LAPSED.map((b) => b.id))
    expect([...select.options].every((o) => o.disabled)).toBe(true)
    for (const option of select.options) {
      expect(option.textContent).toContain(CONFIG.BUSINESS_LAPSED_SUFFIX)
    }

    // THE CONTROL ITSELF IS DISABLED, and names the first rather than showing
    // blank: a chooser with nothing choosable invites the operator to try and
    // conclude the page is broken, and an empty box reads as still loading.
    expect(select.disabled).toBe(true)
    expect(select.value).toBe('acct_salon')

    // AND NO SCOPE IS IN FORCE — the fallback had nothing to fall back to, and
    // says so rather than opening a business the server will refuse.
    expect(app.scope.getBusiness()).toBeNull()
  })

  it('test_UAT_FC_REQ-179_the_tabs_are_blocked_and_the_account_chrome_still_works', async () => {
    const { app } = mount({ businesses: ALL_LAPSED })
    await settle()

    // THE TABS ARE WHAT BECOME UNAVAILABLE. Both subtrees — the strip and the
    // panels — so a tab cannot be reached by clicking it OR by tabbing into the
    // surface behind it.
    const shellEl = app.shell.element as HTMLElement
    expect(shellEl.querySelector('.shell-tabs')!.hasAttribute('inert')).toBe(true)
    expect(shellEl.querySelector('.shell-panels')!.hasAttribute('inert')).toBe(true)
    expect(shellEl.classList.contains('builder-shell--no-business')).toBe(true)

    // THE CHROME IS NOT. This is the assertion that matters: the shell as a
    // whole must NOT be inert, because the whole-shell block would take the
    // avatar with it — and the avatar is where the account is, which is where
    // this person would see what they were charged or ask for erasure.
    expect(shellEl.hasAttribute('inert')).toBe(false)
    const avatarButton = shellEl.querySelector(
      `[data-action="${CONFIG.ACCOUNT_ACTION_ID}"]`,
    ) as HTMLButtonElement
    expect(avatarButton).toBeTruthy()
    expect(avatarButton.closest('[inert]')).toBeNull()

    // …and it still opens, listing every business with the reason it lapsed —
    // which is the one place in the product the reason is stated.
    avatarButton.click()
    const dialog = shellEl.querySelector('.builder-modal')!
    expect(dialog).toBeTruthy()
    expect(dialog.textContent).toContain('Salon')
    expect(dialog.textContent).toContain('Studio')
    expect(dialog.textContent).toContain(CONFIG.BUSINESS_LAPSE_SENTENCES.revoked)
    expect(dialog.textContent).toContain(CONFIG.BUSINESS_LAPSE_EXPIRED_ON('2026-07-01'))

    // The switcher is outside the blocked subtrees too — it is chrome, not
    // product, and this is the boundary [[DOC-42]] §5 draws.
    expect((root.querySelector('.builder-business') as HTMLElement).closest('[inert]')).toBeNull()

    // THE STATE IS NAMED, WHERE THE PRODUCT WOULD BE, AND SELECTABLE. A page
    // that is simply empty looks like a broken deployment, and a message whose
    // text cannot be selected cannot be pasted into a support request.
    const banner = shellEl.querySelector('.builder-banner--no-business') as HTMLElement
    expect(banner).toBeTruthy()
    expect(banner.getAttribute('role')).toBe('alert')
    expect(banner.textContent).toBe(CONFIG.BUSINESS_NONE_SELECTABLE_MESSAGE)
    expect(banner.closest('[inert]')).toBeNull()
    expect(shellEl.querySelector('.shell-content')!.contains(banner)).toBe(true)
  })

  it('test_UAT_FC_REQ-179_no_business_in_scope_asks_the_origin_for_nothing', async () => {
    // WITHOUT A SCOPE THERE IS NOTHING TO ASK FOR, and the failure this guards
    // is not a wasted round trip. An unprefixed `/api/sites` resolves at the
    // origin's own fallback, so the request that should not be made is one whose
    // answer would be some other business's site list arriving under an account
    // that may open none of them.
    const calls: string[] = []
    const realFetch = globalThis.fetch
    globalThis.fetch = (async (input: unknown) => {
      calls.push(String(input))
      return new Response('[]', { status: 200, headers: { 'content-type': 'application/json' } })
    }) as typeof globalThis.fetch

    try {
      // `loadSites` left to the default, which is the branch under test — the
      // other cases inject the seam, so nothing else exercises it.
      const { app } = mount({ businesses: ALL_LAPSED, loadSites: undefined })
      await settle()

      expect(app.scope.getBusiness()).toBeNull()
      expect(app.scope.getSite()).toBeNull()
      expect(calls.filter((url) => url.includes('/api/sites'))).toEqual([])
      // Non-vacuity: with a business in scope the same default DOES ask, so the
      // assertion above is about the scope and not about a seam that never runs.
      const live = mountBuilder(document.body.appendChild(document.createElement('div')), {
        businesses: [{ id: 'acct_salon', name: 'Salon', selectable: true }],
        account: ACCOUNT,
        storage: memoryStorage(),
      })
      await settle()
      expect(calls.some((url) => url.includes('/b/acct_salon/api/sites'))).toBe(true)
      live.shell?.destroy?.()
    } finally {
      globalThis.fetch = realFetch
    }
  })
})

describe('REQ-179 — the rules, without a DOM', () => {
  it('test_UAT_FC_REQ-179_resolve_business_prefers_the_stored_id_and_falls_back_to_admissible', async () => {
    if (!WEBUI_INSTALLED) {
      // `business.js` imports `modal.js` and `config.js` only — no webui — so
      // this is a genuine skip of nothing rather than a hidden gap.
      ;({ resolveBusiness } = await import('../apps/control-app/src/builder/business.js'))
    }
    const list = BUSINESSES
    expect(resolveBusiness(list, 'acct_studio')).toBe('acct_studio')
    // Unknown, lapsed and absent all fall back to the first business that can
    // actually be entered — never to the first business in the list, which here
    // would be right by accident and wrong the moment the oldest one lapses.
    expect(resolveBusiness(list, 'acct_nope')).toBe('acct_salon')
    expect(resolveBusiness(list, 'acct_gone')).toBe('acct_salon')
    expect(resolveBusiness(list, null)).toBe('acct_salon')
    expect(resolveBusiness([BUSINESSES[2], BUSINESSES[1]], null)).toBe('acct_studio')
    // Nothing selectable, and nothing at all, are both "no scope" rather than a
    // throw: a host with no identity behind it mounts unscoped.
    expect(resolveBusiness([BUSINESSES[2]], null)).toBeNull()
    expect(resolveBusiness([], 'acct_salon')).toBeNull()
  })

  it('test_UAT_FC_REQ-179_no_surface_asks_the_pane_which_scope_it_is_in', async () => {
    // THE STRUCTURAL HALF OF THE TICKET. Every tab used to reach sideways into
    // the site tab's panel to discover the selected site — which is what made
    // the selector scope one tab however it was labelled. The behavioural cases
    // above prove a switch moves every surface; this proves there is no second
    // route by which one of them could find out, so a surface added tomorrow
    // cannot quietly reintroduce the pattern.
    //
    // `app.js` is allowed exactly ONE, and it is the scope seeding itself from
    // the pane's own persistence at bootstrap — a scope reading the value that
    // was persisted for exactly that purpose, not a tab interrogating another
    // tab. `panel.js` is the panel itself.
    const strip = (src: string) =>
      src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1')

    const modules = fs
      .readdirSync(BUILDER)
      .filter((f) => f.endsWith('.js') && f !== 'panel.js')

    // Non-vacuity: the search is over the whole builder, not a hand-picked list
    // that could silently stop covering a new module.
    expect(modules.length).toBeGreaterThan(8)

    for (const file of modules) {
      const code = strip(fs.readFileSync(path.join(BUILDER, file), 'utf8'))
      const hits = code.match(/panel\.getSite\(\)/g) ?? []
      expect(hits.length, `${file} reads the pane's site ${hits.length} time(s)`).toBe(
        file === 'app.js' ? 1 : 0,
      )
    }

    // And the toolbar's site selector is gone rather than kept beside the new
    // control — two selectors that can disagree is precisely what the rule this
    // ticket keeps has always forbidden.
    const toolbar = fs.readFileSync(path.join(BUILDER, 'toolbar.js'), 'utf8')
    expect(strip(toolbar)).not.toContain('siteSelectorAction')
  })
})

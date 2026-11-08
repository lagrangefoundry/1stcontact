// @vitest-environment jsdom
/**
 * story-7f437d57 (STORY-104) — **the conversation follows the business, not only
 * the site** (BUNDLE-41 plan item 5, BUG-69; AC-2462).
 *
 * A conversation belongs to a site *within a business*. The origin names a site's
 * conversation after its slug (`site-<slug>`), and slugs are unique only within a
 * business, so two businesses may each hold a conversation of the same name. The
 * criterion is that switching business swaps the pane to the new business's
 * conversation anyway, and that an unsent draft stays with the business it was
 * typed under, while an ordinary site switch inside one business still works.
 *
 * WHERE THE BOUNDARY IS. The real workspace (`mountBuilder`) is mounted over the
 * actually-installed `webui-*` components, and the business is switched through
 * the workspace's own business switcher (the `<select>` an operator uses). Only the
 * HTTP seams are injected. `openSession` answers `site-<slug>` for BOTH
 * businesses because that is what the origin really answers: a fixture minting
 * distinct ids would hide the defect this criterion exists to catch. The
 * transcript it returns is read for the business currently in scope, exactly the
 * fact the origin resolves a request against.
 */

import { beforeEach, describe, expect, it } from 'vitest'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'

type Handle = Record<string, any>
type Turn = { role: string; markdown: string }

let mountBuilder: (root: HTMLElement, opts?: Record<string, unknown>) => Handle
let getBusinessScope: () => string | null

if (!WEBUI_INSTALLED) console.warn(`AC-2462 suite skipped: ${WEBUI_SKIP_REASON}`)

/** A `Storage`-shaped map so drafts cannot leak between cases or into the host. */
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

const settle = () => new Promise((r) => setTimeout(r, 0))

const BUSINESSES = [
  { id: 'biz_north', name: 'North Bakery', selectable: true },
  { id: 'biz_south', name: 'South Plumbing', selectable: true },
]

/** Each business's `home` site has its own, distinguishable conversation. */
const TRANSCRIPTS: Record<string, Record<string, Turn[]>> = {
  biz_north: {
    home: [
      { role: 'user', markdown: 'Put the sourdough on the north home page' },
      { role: 'assistant', markdown: 'Added a sourdough section for North.' },
    ],
    menu: [{ role: 'user', markdown: 'List the north menu prices' }],
  },
  biz_south: {
    home: [{ role: 'user', markdown: 'Make the south emergency number larger' }],
  },
}

let root: HTMLElement

beforeEach(async () => {
  if (WEBUI_INSTALLED && !mountBuilder) {
    ;({ mountBuilder } = await import('../apps/control-app/src/builder/app.js'))
    ;({ getBusinessScope } = await import('../apps/control-app/src/builder/api.js'))
  }
  document.body.replaceChildren()
  root = document.createElement('div')
  document.body.append(root)
})

function mount() {
  const opened: { business: string | null; slug: string }[] = []
  const app = mountBuilder(root, {
    businesses: BUSINESSES,
    person: { name: 'Sam', email: 'sam@example.test' },
    storage: memoryStorage(),
    // North has two sites; South has one. Both have a site slugged `home`.
    loadSites: async () =>
      getBusinessScope() === 'biz_north'
        ? [
            { slug: 'home', latest: null },
            { slug: 'menu', latest: null },
          ]
        : [{ slug: 'home', latest: null }],
    chatTransport: {
      openSession: async (slug: string) => {
        const business = getBusinessScope()
        opened.push({ business, slug })
        return {
          sessionId: `site-${slug}`,
          turns: TRANSCRIPTS[business ?? '']?.[slug] ?? [],
          ready: true,
        }
      },
      streamPrompt: async function* () {
        yield { kind: 'done' }
      },
    },
    libraryTransport: {
      list: async () => ({ material: [] }),
      item: async () => ({ body: '' }),
      save: async () => ({}),
      fileUrl: (uid: string) => `/api/material/file?uid=${uid}`,
      upload: async () => ({ uid: 'material-1', role: 'site', indexed: true }),
    },
    paletteTransport: {
      get: async () => ({ palette: {}, usage: {} }),
      write: async () => ({ palette: {}, usage: {} }),
    },
  })
  return { app, opened }
}

/** The text of every message bubble currently painted in the pane. */
function paneText(app: Handle): string {
  return (app.chat.element as HTMLElement).textContent ?? ''
}

function switchBusiness(id: string) {
  const select = root.querySelector('.builder-business__select') as HTMLSelectElement
  expect(select, 'the workspace business switcher is on screen').not.toBeNull()
  select.value = id
  select.dispatchEvent(new Event('change'))
}

describe.skipIf(!WEBUI_INSTALLED)('STORY-104 — the pane follows the business (AC-2462)', () => {
  it('test_UAT_AC2462_business_switch_swaps_conversation_on_shared_slug_and_draft_stays_with_its_business', async () => {
    const { app, opened } = mount()
    await settle()

    const NORTH_HOME = TRANSCRIPTS.biz_north.home
    const SOUTH_HOME = TRANSCRIPTS.biz_south.home

    // Opened on North's `home`, showing North's conversation.
    expect(app.scope.getBusiness()).toBe('biz_north')
    expect(app.scope.getSite()).toBe('home')
    expect(app.chat.getChat().getMessages()).toEqual(NORTH_HOME)

    // A distinctive, unsent draft typed under North.
    const DRAFT = 'Half a thought about the north croissants'
    app.chat.getChat().setInputMarkdown(DRAFT)
    expect(app.chat.getChat().getInputMarkdown()).toBe(DRAFT)

    // Switch business with the workspace's own switcher. The site slug stays `home`.
    switchBusiness('biz_south')
    await settle()

    // The page beside the pane moved to South's `home`...
    expect(app.scope.getBusiness()).toBe('biz_south')
    expect(app.scope.getSite()).toBe('home')
    expect(app.panel.frame.getAttribute('src')).toBe('/b/biz_south/preview/home/draft/')
    // ...and so did the pane: South's turns, none of North's, even though the
    // conversation's name is the same string.
    expect(app.chat.getChat().getMessages()).toEqual(SOUTH_HOME)
    for (const turn of NORTH_HOME) {
      expect(app.chat.getChat().getMessages()).not.toContainEqual(turn)
      expect(paneText(app)).not.toContain(turn.markdown)
    }
    expect(paneText(app)).toContain(SOUTH_HOME[0].markdown)

    // The draft stayed with North: South's composer does not hold it.
    expect(app.chat.getChat().getInputMarkdown()).not.toContain(DRAFT)
    expect(app.chat.getChat().getInputMarkdown()).toBe('')

    // Going back to North brings back North's conversation and its draft.
    switchBusiness('biz_north')
    await settle()
    expect(app.chat.getChat().getMessages()).toEqual(NORTH_HOME)
    expect(app.chat.getChat().getInputMarkdown()).toBe(DRAFT)

    // Within one business, changing site still swaps the conversation.
    app.panel.setSite('menu')
    await settle()
    expect(app.scope.getSite()).toBe('menu')
    expect(app.chat.getChat().getMessages()).toEqual(TRANSCRIPTS.biz_north.menu)
    expect(paneText(app)).not.toContain(NORTH_HOME[0].markdown)

    // The origin was asked for each conversation under the business in scope.
    expect(opened).toEqual([
      { business: 'biz_north', slug: 'home' },
      { business: 'biz_south', slug: 'home' },
      { business: 'biz_north', slug: 'home' },
      { business: 'biz_north', slug: 'menu' },
    ])
  })
})

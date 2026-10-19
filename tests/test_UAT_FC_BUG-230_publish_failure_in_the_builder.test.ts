// @vitest-environment jsdom
/**
 * BUG-230 — in the builder: a site with no web address gets the dialog that sends
 * the client to Settings, an unexpected failure gets plain words, and the
 * consultant can link to the web address section.
 *
 * WHAT MAKES THIS EVIDENCE. The publish cases drive the shipped builder with the
 * shipped stream client (`api.js` `streamPublish`) in its publish seam; only
 * `fetch` is replaced, answering exactly the bytes the Worker sends (a 409
 * envelope, or an event stream). The `show_client` cases stream the host's own
 * events through the shipped chat pane.
 */

import { beforeAll, beforeEach, describe, expect, it } from 'vitest'
import { setBusinessScope } from '../apps/control-app/src/builder/api.js'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'

type Handle = Record<string, any>
type Event = { kind: string; content?: string; meta?: Record<string, unknown> }

let mountBuilder: (root: HTMLElement, opts?: Record<string, unknown>) => Handle
let API: Record<string, any>
let CONFIG: Record<string, any>
let COPY: Record<string, any>

if (!WEBUI_INSTALLED) console.warn(`BUG-230 builder suite skipped: ${WEBUI_SKIP_REASON}`)

const APEX = '1stc.site'
const SITE = 'site_c78b12e50dde030a34e9becfabb6815d'
const NO_ADDRESS_SENTENCE =
  `Site '${SITE}' has no public address, so publishing it would put it somewhere nobody can reach. ` +
  'Choose a 1stc.site hostname, or connect a domain you own — either one is enough.'

const settle = async (n = 12) => {
  for (let i = 0; i < n; i += 1) await new Promise((r) => setTimeout(r, 0))
}

/** What the Worker answers when it refuses before the stream: a JSON envelope. */
const refusing = (status: number, body: Record<string, unknown>) =>
  (async () =>
    new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })) as typeof fetch

/** What the Worker answers once it has committed to a stream: `data:` frames. */
const streaming = (frames: Record<string, unknown>[]) =>
  (async () =>
    new Response(frames.map((f) => `data: ${JSON.stringify(f)}\n\n`).join(''), {
      status: 200,
      headers: { 'content-type': 'text/event-stream' },
    })) as typeof fetch

/** The chat transport: each prompt streams `reply`. */
function chatTransport(reply: Event[] = []) {
  return {
    openSession: async () => ({ sessionId: 's', turns: [], ready: true }),
    openSettingsSession: async () => ({ sessionId: 'b', turns: [], ready: true }),
    streamPrompt: async function* () {
      for (const event of reply) yield event
      yield { kind: 'done', content: '', meta: { status: 'complete' } }
    },
  }
}

beforeAll(async () => {
  API = await import('../apps/control-app/src/builder/api.js')
  CONFIG = await import('../apps/control-app/src/builder/config.js')
  COPY = await import('../apps/control-app/src/builder/publish-address.js')
  if (WEBUI_INSTALLED) {
    ;({ mountBuilder } = await import('../apps/control-app/src/builder/app.js'))
    // THE ENGINES, so a markdown link is an `<a>` — as REQ-413's suite installs them.
    const { setParser, setSanitizer } = await import('../apps/control-app/src/builder/markdown.js')
    const links = (md: string) =>
      md.replace(/\[([^\]]*)\]\(([^)]*)\)/g, (_, text, href) => `<a href="${href.replace(/&/g, '&amp;')}">${text}</a>`)
    setParser({ parse: (md: string) => `<p>${links(md)}</p>`, parseInline: links })
    setSanitizer((html: string) => html)
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
  setBusinessScope(null)
  document.body.replaceChildren()
  root = document.createElement('div')
  document.body.append(root)
  Element.prototype.scrollIntoView = function () {}
})

/** The builder, publishing through the real stream client over `fetchImpl`. */
async function mount({ fetchImpl, reply = [] }: { fetchImpl?: typeof fetch; reply?: Event[] }): Promise<Handle> {
  const app = mountBuilder(root, {
    businesses: [{ id: 'acct_bob', name: "Bob's Salon", selectable: true }],
    person: { name: 'Bob', email: 'bob@example.test' },
    storage: {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
      key: () => null,
      length: 0,
    },
    loadSites: async () => [{ site: SITE, latest: null }],
    publish: (site: string, onProgress?: unknown) => API.streamPublish(site, onProgress, fetchImpl),
    chatTransport: chatTransport(reply),
    settingsTransport: {
      saveName: async (name: string) => ({ businessId: 'acct_bob', name, effects: {} }),
      loadAddresses: async () => ({ apex: APEX, addresses: [] }),
      checkHostname: async (label: string) => ({ host: `${label}.${APEX}`, available: true }),
      claimHostname: async (label: string) => ({ id: 'dom_1', siteKey: SITE, host: `${label}.${APEX}`, kind: 'platform' }),
    },
    libraryTransport: {
      list: async () => ({ material: [] }),
      item: async () => ({ body: '' }),
      save: async () => ({}),
      fileUrl: (uid: string) => `/api/material/file?uid=${uid}`,
      upload: async () => ({ uid: 'm1', role: 'site', indexed: true }),
    },
    peopleTransport: { list: async () => ({ people: [] }), person: async () => ({}) },
    paletteTransport: {
      get: async () => ({ palette: {}, usage: {} }),
      write: async () => ({ palette: {}, usage: {} }),
    },
  })
  await settle()
  return app
}

const publishButton = () => root.querySelector<HTMLButtonElement>('.builder-toolbar__publish')!
const dialog = () => root.querySelector<HTMLElement>('.builder-no-address')
const banner = () => root.querySelector<HTMLElement>('.builder-banner--publish-failed')
const pressPublish = async () => {
  publishButton().click()
  await settle()
}
/** What the client reads without opening Details. */
const visibleText = (el: HTMLElement) => {
  const copy = el.cloneNode(true) as HTMLElement
  for (const hidden of copy.querySelectorAll('details > :not(summary)')) hidden.remove()
  return copy.textContent ?? ''
}
const hostnameField = (app: Handle) =>
  app.settings.element.querySelector('input.builder-hostname__label') as HTMLInputElement | null
const chatLink = (app: Handle, href: string) =>
  [...app.chat.element.querySelectorAll('a[href]')].find((a) => a.getAttribute('href') === href) as
    | HTMLAnchorElement
    | undefined

describe.skipIf(!WEBUI_INSTALLED)('BUG-230 — a missing web address is a dialog, never the banner', () => {
  it('test_UAT_FC_BUG-230_a_409_from_the_streaming_publish_opens_the_no_address_dialog', async () => {
    await mount({ fetchImpl: refusing(409, { error: NO_ADDRESS_SENTENCE, code: 'NO_PUBLIC_ADDRESS' }) })

    await pressPublish()

    expect(dialog(), 'the no-address dialog opens').toBeTruthy()
    expect(banner(), 'and no failure banner').toBeNull()
  })

  it('test_UAT_FC_BUG-230_a_coded_refusal_after_the_stream_starts_still_opens_the_dialog', async () => {
    // THE FALLBACK: the refusal arrives in the terminal frame, and its code with it.
    const app = await mount({
      fetchImpl: streaming([
        { kind: 'progress', total: 1, done: 0 },
        { kind: 'done', ok: false, error: NO_ADDRESS_SENTENCE, code: 'NO_PUBLIC_ADDRESS' },
      ]),
    })

    await pressPublish()

    expect(dialog()).toBeTruthy()
    expect(banner()).toBeNull()
    // And the dialog's button still goes where it always did.
    const choose = [...dialog()!.querySelectorAll('button')].find((b) => b.textContent === COPY.CHOOSE_LABEL)!
    choose.click()
    await settle()
    expect(app.shell.getActiveTab()).toBe(CONFIG.SETTINGS_TAB.id)
    expect(document.activeElement).toBe(hostnameField(app))
  })
})

describe.skipIf(!WEBUI_INSTALLED)('BUG-230 — an unexpected failure is plain words, with Details behind', () => {
  it('test_UAT_FC_BUG-230_an_unexpected_failure_shows_the_plain_line_and_keeps_the_server_text_under_details', async () => {
    const serverText = `Site '${SITE}' could not be written: D1_ERROR store conflict on ladder rung 3.`
    await mount({ fetchImpl: streaming([{ kind: 'progress', total: 2, done: 1 }, { kind: 'done', ok: false, error: serverText }]) })

    await pressPublish()

    const shown = banner()
    expect(shown, 'a failed publish reports itself').toBeTruthy()
    expect(shown!.getAttribute('role')).toBe('alert')
    // WHAT THE CLIENT READS: our line, and nothing internal.
    expect(visibleText(shown!)).toContain(CONFIG.PUBLISH_FAILED_MESSAGE)
    expect(visibleText(shown!)).not.toContain('site_')
    expect(visibleText(shown!)).not.toMatch(/D1_ERROR|ladder|hostname|slug/)
    // THE SERVER'S TEXT IS KEPT, behind a closed Details toggle, for a support request.
    const details = shown!.querySelector('details')!
    expect(details.querySelector('summary')!.textContent).toBe('Details')
    expect(details.open).toBe(false)
    expect(details.textContent).toContain(serverText)
  })
})

describe.skipIf(!WEBUI_INSTALLED)('BUG-230 — show_client can bring the web address section forward', () => {
  it('test_UAT_FC_BUG-230_a_web_address_link_opens_settings_at_the_web_address_section', async () => {
    const app = await mount({
      reply: [{ kind: 'text', content: 'First, an address: [Choose your web address](#show=web_address)' }],
    })
    await app.chat.getChat().send('Can we publish?')
    await settle()
    expect(app.shell.getActiveTab()).not.toBe(CONFIG.SETTINGS_TAB.id)

    chatLink(app, '#show=web_address')!.click()
    await settle()

    expect(app.shell.getActiveTab()).toBe(CONFIG.SETTINGS_TAB.id)
    expect(document.activeElement).toBe(hostnameField(app))
  })

  it('test_UAT_FC_BUG-230_a_web_address_switch_opens_settings_at_the_web_address_section', async () => {
    const href = '#show=web_address'
    const label = 'where you choose your web address'
    const app = await mount({
      reply: [
        { kind: 'text', content: `[Showing you ${label}](${href})\n\n` },
        { kind: 'show_client', content: '', meta: { href, label } },
        { kind: 'text', content: 'Pick one and we can publish.' },
      ],
    })

    await app.chat.getChat().send('Can we publish?')
    await settle()

    expect(app.shell.getActiveTab()).toBe(CONFIG.SETTINGS_TAB.id)
    expect(document.activeElement).toBe(hostnameField(app))
  })
})

// @vitest-environment jsdom
/**
 * [[REQ-250]] — **Publish refuses a site with no address, and the refusal offers
 * the way out.**
 *
 * WHAT MAKES THIS EVIDENCE. Every claim below drives the SHIPPED builder
 * (`builder/app.js`) mounted in a real document, over the shipped dialog shell
 * (`builder/modal.js`) and the shipped Settings pane with [[REQ-249]]'s hostname
 * section on it. The one seam injected is `publish`, which is the transport
 * `main.js` fills with `streamPublish` — and `streamPublish` itself is driven
 * here too, against a stub `fetch`, so the whole path from a 409 on the wire to a
 * dialog on the screen is covered without an origin.
 *
 * NOTHING HERE DECIDES WHETHER A SITE HAS AN ADDRESS. That is [[REQ-238]]'s gate,
 * in the Worker, over a list with two kinds — and *that nothing here decides it*
 * is itself a claim, scanned over the builder source, because a client-side
 * pre-check is this ticket's own falsifier: it would be a second implementation
 * of the gate, free to disagree with the real one, and the disagreement would be
 * invisible until it let a publish through.
 *
 * THE CLAIMS, in the order the ticket makes them:
 *
 *  1. THE REFUSAL SURVIVES THE THROW. `streamPublish` turns a pre-stream refusal
 *     into an `Error`; the status and the code ride on it, so a missing address
 *     and an invalid draft are no longer the same shape by the time the builder
 *     sees them.
 *  2. IT OPENS A DIALOG AND NOT THE PUBLISH FAILURE BANNER, and the builder is
 *     given back — the lock comes off and no grey line is left where the site
 *     was going to appear.
 *  3. THE DIALOG NAMES BOTH FIXES. A free web address OR a domain you already
 *     own, because that is what the gate asks; copy naming only the hostname
 *     would be wrong the day custom domains land.
 *  4. THE BUTTON IS THE POINT. `Choose my web address` opens the Settings tab
 *     with the hostname field in view and focused, and takes the dialog away.
 *  5. `Not now` LEAVES THEM WHERE THEY WERE, with a working builder and no
 *     failure banner — and Publish still pressable.
 *  6. EVERY OTHER PUBLISH FAILURE IS UNTOUCHED. It reaches the failure banner
 *     exactly as it did, and opens no dialog. This ticket adds one branch.
 *  7. NOTHING IS CHECKED IN THE CLIENT. Publish is never disabled, hidden or
 *     greyed on the strength of a client-side answer, and the post happens
 *     whatever the business holds.
 *  8. ONE CODE, DECLARED EITHER SIDE OF A RUNTIME BOUNDARY, PINNED TOGETHER.
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
let COPY: Record<string, any>
let API: Record<string, any>

if (!WEBUI_INSTALLED) console.warn(`REQ-250 builder suites skipped: ${WEBUI_SKIP_REASON}`)

const settle = () => new Promise((r) => setTimeout(r, 0))

const APEX = '1stc.site'

/** The sentence the Worker actually sends — `NoPublicAddressError`'s own. */
const ORIGIN_SENTENCE =
  "Site 'site-bakery' has no public address, so publishing it would put it " +
  'somewhere nobody can reach. Choose a 1stc.site hostname, or connect a ' +
  'domain you own — either one is enough.'

/** What `api.js` hands the builder for that refusal, once it has been thrown. */
function noAddressError() {
  const err: any = new Error(ORIGIN_SENTENCE)
  err.status = 409
  err.code = 'NO_PUBLIC_ADDRESS'
  return err
}

let root: HTMLElement

beforeEach(async () => {
  if (WEBUI_INSTALLED && !mountBuilder) {
    ;({ mountBuilder } = await import('../apps/control-app/src/builder/app.js'))
  }
  if (!CONFIG) CONFIG = await import('../apps/control-app/src/builder/config.js')
  if (!COPY) COPY = await import('../apps/control-app/src/builder/publish-address.js')
  if (!API) API = await import('../apps/control-app/src/builder/api.js')
  document.body.replaceChildren()
  root = document.createElement('div')
  document.body.append(root)
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

/**
 * The whole builder, with the publish transport the test drives by hand.
 *
 * THE SETTINGS TRANSPORT IS REAL IN SHAPE and reports a business holding nothing,
 * because that is the business this ticket is about — the one whose Publish is
 * about to be refused. It is here so the hostname section the dialog's button
 * navigates to is the SHIPPED one, mounted, with a box in it.
 */
function mount(publish: (site: string, onProgress?: unknown) => Promise<unknown>) {
  const asked = { publishes: [] as string[] }
  const app = mountBuilder(root, {
    businesses: [{ id: 'acct_bakery', name: 'Cole’s Bakery', selectable: true }],
    person: { name: 'Sam', email: 'sam@example.test' },
    storage: {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      clear: () => {},
      key: () => null,
      length: 0,
    },
    loadSites: async () => [{ site: 'site-bakery', latest: null }],
    publish: (site: string, onProgress?: unknown) => {
      asked.publishes.push(site)
      return publish(site, onProgress)
    },
    chatTransport: {
      openSession: async () => ({ sessionId: 's', turns: [], ready: true }),
      openSettingsSession: async () => ({ sessionId: 'b', turns: [], ready: true }),
      streamPrompt: async function* () {
        yield { kind: 'done' }
      },
    },
    settingsTransport: {
      saveName: async (name: string) => ({ businessId: 'acct_bakery', name, effects: {} }),
      loadAddresses: async () => ({ apex: APEX, addresses: [] }),
      checkHostname: async (label: string) => ({ host: `${label}.${APEX}`, available: true }),
      claimHostname: async (label: string) => ({
        id: 'dom_1',
        siteKey: 'site-bakery',
        host: `${label}.${APEX}`,
        kind: 'platform',
      }),
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
  return { app, asked }
}

const publishButton = () => root.querySelector<HTMLButtonElement>('.builder-toolbar__publish')
const dialog = () => root.querySelector<HTMLElement>('.builder-no-address')
const failureBanner = () => root.querySelector('.builder-banner--publish-failed')

/** Find a button in the dialog by the words on it. */
function dialogButton(label: string): HTMLButtonElement {
  const found = [...(dialog()?.querySelectorAll('button') ?? [])].find(
    (b) => b.textContent === label,
  )
  expect(found, `the dialog offers “${label}”`).toBeTruthy()
  return found as HTMLButtonElement
}

/** Press Publish and let the refusal come back. */
async function pressPublish() {
  publishButton()!.click()
  await settle()
  await settle()
  await settle()
}

// ── 1. the refusal survives the throw ────────────────────────────────────────

describe('REQ-250 AC1 — a pre-stream refusal keeps its status and its code', () => {
  /** A `Response`-shaped stub: only what `streamPublish` reads before the stream. */
  const refusing = (status: number, body: Record<string, unknown>) =>
    (async () => ({ ok: false, status, json: async () => body })) as unknown as typeof fetch

  it('test_UAT_FC_REQ-250_a_missing_address_arrives_as_more_than_a_sentence', async () => {
    // BEFORE THIS, `parsed.error` WAS ALL THAT SURVIVED, so a missing address and
    // an invalid draft were the same shape by the time `app.js` saw them and the
    // only handle on the difference was the prose — which is a second copy of a
    // rule the Worker already applied, and which breaks the day somebody improves
    // the sentence.
    const err: any = await API.streamPublish(
      'site-bakery',
      undefined,
      refusing(409, { error: ORIGIN_SENTENCE, code: 'NO_PUBLIC_ADDRESS' }),
    ).catch((e: unknown) => e)

    expect(err).toBeInstanceOf(Error)
    expect(err.message).toBe(ORIGIN_SENTENCE)
    expect(err.status).toBe(409)
    expect(err.code).toBe('NO_PUBLIC_ADDRESS')
  })

  it('test_UAT_FC_REQ-250_a_refusal_with_no_code_carries_none', async () => {
    // EVERY OTHER PRE-STREAM REFUSAL IS UNCHANGED — an invalid draft, a missing
    // site, a lapsed session. They get a status, because it costs nothing, and no
    // `code`, because the Worker did not name one. That absence is what keeps the
    // branch in `app.js` narrow rather than a status test that a second 409 on
    // this route would one day walk into.
    const err: any = await API.streamPublish(
      'site-bakery',
      undefined,
      refusing(400, { error: 'home.json: hero.text is required' }),
    ).catch((e: unknown) => e)

    expect(err.message).toBe('home.json: hero.text is required')
    expect(err.status).toBe(400)
    expect(err.code).toBeUndefined()
  })
})

// ── 2–7. the assembled product ───────────────────────────────────────────────

describe.skipIf(!WEBUI_INSTALLED)('REQ-250 AC2 — the refusal is a dialog, not a grey line', () => {
  it('test_UAT_FC_REQ-250_a_site_with_no_address_opens_a_dialog_and_no_banner', async () => {
    // THE MOST CONSEQUENTIAL REFUSAL IN THE PRODUCT WAS DELIVERED IN THE SAME
    // PLACE AS *the ladder was larger than one request* — a line of grey text
    // where the site was going to appear. It is not that: nothing went wrong, and
    // there is something for the customer to do.
    const { app } = mount(async () => {
      throw noAddressError()
    })
    await settle()
    await pressPublish()

    expect(dialog(), 'the address refusal opens a dialog').toBeTruthy()
    expect(failureBanner(), 'and not the publish failure banner').toBeNull()

    // THE DIALOG IS THE SHARED SHELL's, not a second dialog that is this one
    // until one of them is fixed.
    expect(dialog()!.getAttribute('role')).toBe('dialog')
    expect(dialog()!.getAttribute('aria-modal')).toBe('true')
    expect(dialog()!.classList.contains('builder-modal')).toBe(true)
    expect(dialog()!.querySelector('.builder-modal__backdrop')).toBeTruthy()

    // AND IT IS INSIDE THE SHELL ROOT, which is where `modal.js` resolves the
    // theme tokens and the app font from.
    expect(app.shell.element.contains(dialog())).toBe(true)

    // THE BUILDER IS GIVEN BACK. A refusal that left the draft inert would cost
    // the customer more than the publish did.
    expect(app.shell.element.querySelector('.shell-tabs')?.hasAttribute('inert')).toBe(false)
    expect(app.shell.element.querySelector('.shell-panels')?.hasAttribute('inert')).toBe(false)
    expect(app.shell.element.classList.contains('builder-shell--publishing')).toBe(false)
    app.destroy()
  })

  it('test_UAT_FC_REQ-250_the_dialog_names_both_fixes_and_not_one', async () => {
    // THE GATE ASKS *does this site have at least one address*, over a list that
    // has two kinds ([[REQ-238]]'s own falsifier). The sentence says the same
    // thing, so the day custom domains land the copy is already right — and the
    // second half is deliberately not a button, because there is not yet anywhere
    // for it to go and a button that went nowhere would be a fake.
    const { app } = mount(async () => {
      throw noAddressError()
    })
    await settle()
    await pressPublish()

    const text = dialog()!.textContent ?? ''
    expect(text).toContain(COPY.NO_ADDRESS_TITLE)
    expect(text).toContain(COPY.NO_ADDRESS_BODY)
    expect(COPY.NO_ADDRESS_BODY).toMatch(/free web address/i)
    expect(COPY.NO_ADDRESS_BODY).toMatch(/domain you already own/i)
    // NOT THE HOSTNAME AS THE ONLY FIX, and not the apex as a brand lesson: the
    // customer meeting this does not know what `1stc.site` is.
    expect(text).not.toContain('1stc.site')

    // TWO WAYS OUT, AND THE WAY OUT COMES FIRST — in the DOM and in focus. A
    // Return press aimed at Publish must not land on a navigation.
    const buttons = [...dialog()!.querySelectorAll('.builder-modal__footer button')]
    expect(buttons.map((b) => b.textContent)).toEqual([COPY.NOT_NOW_LABEL, COPY.CHOOSE_LABEL])
    expect(document.activeElement).toBe(buttons[0])
    app.destroy()
  })
})

describe.skipIf(!WEBUI_INSTALLED)('REQ-250 AC3 — the refusal carries the route out of itself', () => {
  it('test_UAT_FC_REQ-250_choose_my_web_address_opens_the_hostname_field', async () => {
    // THE MODAL IS NOT THE POINT — THE BUTTON IS. A dialog that only says no
    // leaves the customer exactly where they were, and the customer who hits this
    // is by definition the one who does not know what an address is.
    const { app } = mount(async () => {
      throw noAddressError()
    })
    await settle()
    await pressPublish()

    dialogButton(COPY.CHOOSE_LABEL).click()
    await settle()

    // THE TAB, AND THEN THE SECTION. Either alone is half a route.
    expect(app.shell.getActiveTab()).toBe(CONFIG.SETTINGS_TAB.id)
    const field = app.settings.element.querySelector<HTMLInputElement>(
      'input.builder-hostname__label',
    )
    expect(field, '[[REQ-249]]’s field is on the pane it landed on').toBeTruthy()
    expect(document.activeElement).toBe(field)

    // AND THE DIALOG IS GONE — it must not sit over the thing it just asked them
    // to look at.
    expect(dialog()).toBeNull()
    app.destroy()
  })

  it('test_UAT_FC_REQ-250_not_now_leaves_a_working_builder_and_no_banner', async () => {
    const { app, asked } = mount(async () => {
      throw noAddressError()
    })
    await settle()
    await pressPublish()

    dialogButton(COPY.NOT_NOW_LABEL).click()
    await settle()

    expect(dialog()).toBeNull()
    expect(failureBanner()).toBeNull()
    expect(app.shell.element.querySelector('.shell-panels')?.hasAttribute('inert')).toBe(false)
    // AND PUBLISH IS PRESSABLE AGAIN. Declining the route out is not a state the
    // customer is stuck in — it is one press, and the same answer.
    expect(publishButton()!.disabled).toBe(false)
    await pressPublish()
    expect(asked.publishes).toEqual(['site-bakery', 'site-bakery'])
    expect(dialog(), 'the second refusal opens one dialog, not two').toBeTruthy()
    expect(root.querySelectorAll('.builder-no-address')).toHaveLength(1)
    app.destroy()
  })
})

describe.skipIf(!WEBUI_INSTALLED)('REQ-250 AC4 — one branch, and every other failure untouched', () => {
  it('test_UAT_FC_REQ-250_an_invalid_draft_still_reaches_the_failure_banner', async () => {
    // THE FALSIFIER IS *any other publish failure diverted into this modal*.
    const { app } = mount(async () => {
      const err: any = new Error('home.json: hero.text is required')
      err.status = 400
      throw err
    })
    await settle()
    await pressPublish()

    expect(dialog(), 'no dialog for a failure with no route out of it').toBeNull()
    expect(failureBanner()?.textContent).toContain('was not published')
    expect(failureBanner()?.textContent).toContain('home.json: hero.text is required')
    app.destroy()
  })

  it('test_UAT_FC_REQ-250_a_409_that_is_not_this_one_reaches_the_banner_too', async () => {
    // 409 IS A SHAPE — *the state of the business makes this refusable* — and
    // there is nothing to stop a second refusal on this route sharing it. The
    // branch is on the code the Worker deliberately named, which is why this
    // arrives as text rather than as a navigation nobody asked for.
    const { app } = mount(async () => {
      const err: any = new Error('Another publish of this site is already running.')
      err.status = 409
      throw err
    })
    await settle()
    await pressPublish()

    expect(dialog()).toBeNull()
    expect(failureBanner()?.textContent).toContain('already running')
    app.destroy()
  })

  it('test_UAT_FC_REQ-250_a_failure_mid_stream_still_reaches_the_banner', async () => {
    // AFTER THE RESPONSE COMMITTED `200` there is no status at all, and the
    // verdict is in the terminal frame — the failure `api.js` throws as a plain
    // `Error`. It is not this refusal and must not become it.
    const { app } = mount(async () => {
      throw new Error('The publish stopped before it said whether it finished.')
    })
    await settle()
    await pressPublish()

    expect(dialog()).toBeNull()
    expect(failureBanner()?.textContent).toContain('stopped before it said')
    app.destroy()
  })
})

describe.skipIf(!WEBUI_INSTALLED)('REQ-250 AC5 — nothing is checked in the client', () => {
  it('test_UAT_FC_REQ-250_publish_is_pressable_and_the_post_always_happens', async () => {
    // A CLIENT-SIDE PRE-CHECK WOULD BE A SECOND IMPLEMENTATION OF THE GATE, free
    // to disagree with the real one, and the disagreement would be invisible
    // until it let a publish through. So: always pressable, the post always
    // happens, and the dialog is a rendering of the ANSWER.
    const { app, asked } = mount(async () => {
      throw noAddressError()
    })
    await settle()

    const btn = publishButton()!
    expect(btn.disabled).toBe(false)
    expect(btn.hidden).toBe(false)
    expect(btn.getAttribute('aria-disabled')).toBeNull()
    // The business holds no address at all, and the builder has already read the
    // addresses for the Settings pane — so if anything were going to grey the
    // button out on the strength of one, it could have.
    expect(asked.publishes).toEqual([])

    await pressPublish()
    expect(asked.publishes).toEqual(['site-bakery'])
    app.destroy()
  })
})

// ── static: the rule is not restated, and the code is declared once ──────────

describe('REQ-250 AC6 — one gate, one code', () => {
  it('test_UAT_FC_REQ-250_the_builder_does_not_decide_whether_a_site_has_an_address', () => {
    // SCANNED OVER THE CLIENT SOURCE rather than asserted by behaviour, because
    // the thing being refused is a code path that does not exist. A behavioural
    // test can only show that today's client agrees with the Worker; this shows
    // there is nothing there to disagree.
    const offenders: string[] = []
    for (const file of fs.readdirSync(BUILDER)) {
      if (!file.endsWith('.js')) continue
      const source = fs.readFileSync(path.join(BUILDER, file), 'utf8')
      // Comments say “address” constantly and that is the point of them. What is
      // refused is CODE that reads a list of addresses to decide something.
      const code = source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')
      if (/addresses\s*(\.length|\?\.length|\[0\])/.test(code)) offenders.push(file)
      if (/(disabled|hidden)\s*=\s*[^=]*address/i.test(code)) offenders.push(file)
    }
    // `hostname.js` reads the list to decide whether to draw a BOX, which is a
    // different question from whether a publish may proceed — and it asks it of
    // the answer the pane already has rather than gating anything.
    expect(offenders.filter((f) => f !== 'hostname.js')).toEqual([])
  })

  it('test_UAT_FC_REQ-250_the_code_is_the_same_string_either_side_of_the_boundary', async () => {
    // TWO DECLARATIONS ACROSS A RUNTIME BOUNDARY, because the browser builder
    // cannot import the Worker's error module. This is the closest thing to one
    // declaration the boundary allows, and it is better than a literal in a
    // conditional with nothing watching it.
    const errors = await import('../tools/generate/src/cli/errors')
    expect(COPY.NO_PUBLIC_ADDRESS).toBe(errors.NO_PUBLIC_ADDRESS_CODE)

    // AND THE ROUTE SENDS THAT CONSTANT, not a third copy of the string.
    const router = fs.readFileSync(
      path.join(REPO, 'apps/control-app/src/router.ts'),
      'utf8',
    )
    expect(router).toContain('code: NO_PUBLIC_ADDRESS_CODE')
  })
})

import fs from 'node:fs'
import path from 'node:path'
import { JSDOM } from 'jsdom'
import { describe, expect, it } from 'vitest'
import { accountPortalMeta } from '../packages/framework/src/modules/account-portal/meta'
import {
  preferenceRows,
  preferenceStatus,
} from '../packages/framework/src/modules/account-portal/client.js'
import { ACCEPTANCE_KEYS } from '../apps/control-app/src/builder/acceptances.js'
import { renderSiteFiles } from '../tools/generate/src/render/render'
import { assembleSite } from '../tools/generate/src/store/assemble'
import {
  PORTAL_SLUG,
  portalFallbackStore,
  portalHomePage,
  portalSiteJson,
} from '../apps/control-app/src/portal'

/**
 * [[REQ-245]] — **the portal shows a contact's preferences, and changes exactly
 * the ones that are theirs**.
 *
 * WHAT THIS FILE IS EVIDENCE FOR. The surface half of the ticket: that the
 * agreements section is drawn from the endpoint rather than authored, that a row
 * carries a control only when the acceptance's own type says it may, that the
 * one write this module now makes sends a key and a direction and nothing else,
 * and that a business turning on a new preference reaches the page with nothing
 * here edited.
 *
 * THE HARDER HALF IS WHAT THE SURFACE MUST NOT SAY. [[REQ-183]] built this page
 * on the rule that a control claiming something the page cannot do converts a
 * missing feature into a lie ([[DOC-37]] §6.2), and [[REQ-245]] opens its
 * read-only contract by exactly one thing. So the assertions below are as much
 * about the absences — no control on a document, no control on a request, no
 * contact id on the wire, no section at all before the endpoint has answered —
 * as about the one thing that now moves.
 *
 * The workers-side sibling proves the endpoint behind it against a real Worker,
 * a real Access token and real D1.
 */

const ACCOUNT_ENDPOINT = '/api/businesses'
const ACCEPTANCES_ENDPOINT = '/api/acceptances'

/** The shipped default, assembled exactly as the store's own loader assembles it. */
function loadPortal() {
  const loaded = assembleSite({
    slug: PORTAL_SLUG,
    sourceDir: '',
    base: portalSiteJson(),
    pages: [portalHomePage(ACCOUNT_ENDPOINT, ACCEPTANCES_ENDPOINT)],
    assetFiles: [],
  })
  if (!loaded.ok) throw new Error(JSON.stringify(loaded.errors))
  return loaded.value
}

/** The portal's own page, rendered by the shared renderer. */
async function renderPortal(): Promise<string> {
  const rendered = await renderSiteFiles(loadPortal())
  const html = rendered.files.get('index.html')
  if (!html) throw new Error('the portal rendered no index page')
  return html
}

/** The rendered portal, in a DOM, with the vetted client importable beside it. */
async function portalDom(): Promise<{ dom: JSDOM; section: HTMLElement }> {
  const dom = new JSDOM(`<!doctype html><body>${await renderPortal()}</body>`)
  const section = dom.window.document.querySelector('[data-account-portal]') as HTMLElement
  return { dom, section }
}

const client = () => import('../packages/framework/src/modules/account-portal/client.js')

/** One endpoint answer, in the shape the route returns. */
function answer(acceptances: unknown[]): Response {
  return new Response(JSON.stringify({ acceptances }), {
    headers: { 'content-type': 'application/json' },
  })
}

const preference = (over: Record<string, unknown> = {}) => ({
  key: 'newsletter',
  label: 'Newsletter',
  wording: 'Send me occasional news about the salon.',
  editable: true,
  historic: false,
  granted: false,
  since: null,
  outstanding: false,
  ...over,
})

const document1 = (over: Record<string, unknown> = {}) => ({
  key: 't_and_c_accepted',
  label: 'Terms and conditions',
  wording: '',
  editable: false,
  historic: false,
  granted: true,
  since: '2026-03-04T09:00:00.000Z',
  outstanding: false,
  ...over,
})

const request3 = (over: Record<string, unknown> = {}) => ({
  key: 'whitepapers',
  label: 'Asked for the papers',
  wording: '',
  editable: false,
  historic: true,
  granted: true,
  since: '2026-05-01T09:00:00.000Z',
  outstanding: false,
  ...over,
})

describe('REQ-245 — the preferences appear on their own', () => {
  it('test_UAT_FC_REQ-245_the_module_names_no_acceptance_and_lists_none', () => {
    // §3's whole claim, made mechanical. Which acceptances a business holds is
    // its own definitions; a list here — a config field of keys, a default
    // roster, a key spelt in the markup — would be a SECOND answer to that
    // question, free to drift from the first by one entry in silence. So the
    // module's contract and its client may name no key at all, and a business
    // turning on a new preference reaches the page because nothing here decides.
    const contract = JSON.stringify(accountPortalMeta)
    const source = fs.readFileSync(
      path.join(__dirname, '..', 'packages/framework/src/modules/account-portal/client.js'),
      'utf8',
    )
    for (const key of ACCEPTANCE_KEYS) {
      expect(contract).not.toContain(key)
      expect(source).not.toContain(key)
    }
    // Nor may it name the three types. The surface is told `editable` and
    // `historic` — two facts the acceptance layer computed from the key's own
    // type — so a key of ANY type gets the right treatment with nothing edited.
    for (const type of ['document', 'preference', 'request']) {
      expect(source).not.toContain(`'${type}'`)
    }
  })

  it('test_UAT_FC_REQ-245_the_section_is_drawn_from_the_endpoint_the_instance_names', async () => {
    const html = await renderPortal()
    // The region exists in the served bytes, so there is somewhere for the facts
    // to land — and it names the endpoint as site content rather than a path
    // compiled into the module, which is what lets the portal move origins.
    expect(html).toContain('data-account-agreements')
    expect(html).toContain(`data-acceptances-src="${ACCEPTANCES_ENDPOINT}"`)
    // And it is rendered HIDDEN. The erasure explanation renders open because it
    // is prose that is true before any fetch; this is the reader's own facts and
    // is true of nobody, so a visitor whose script failed sees the copy its
    // author wrote and no claim at all about what they have agreed to.
    const dom = new JSDOM(`<!doctype html><body>${html}</body>`)
    const region = dom.window.document.querySelector('[data-account-agreements]') as HTMLElement
    expect(region.hasAttribute('hidden')).toBe(true)
    expect(region.querySelectorAll('li').length).toBe(0)
  })

  it('test_UAT_FC_REQ-245_a_business_with_nothing_turned_on_shows_no_section', async () => {
    const { section } = await portalDom()
    const { loadPreferences } = await client()
    await loadPreferences(section, async () => answer([]))

    // Nothing turned on is nothing to show — NOT an empty heading over an empty
    // list, which would read as "this person has no preferences" and is a claim
    // about the contact rather than about the business.
    const region = section.querySelector('[data-account-agreements]') as HTMLElement
    expect(region.hasAttribute('hidden')).toBe(true)
  })

  it('test_UAT_FC_REQ-245_every_row_the_endpoint_returns_is_drawn_in_its_order', async () => {
    const { section } = await portalDom()
    const { loadPreferences } = await client()
    await loadPreferences(section, async () =>
      answer([document1(), preference(), request3()]),
    )

    const region = section.querySelector('[data-account-agreements]') as HTMLElement
    expect(region.hasAttribute('hidden')).toBe(false)
    const rows = [...region.querySelectorAll('li')]
    // Three rows for three definitions, in the order the endpoint sent them —
    // the module neither filters nor reorders, because it does not know what any
    // of them are.
    expect(rows.map((r) => r.getAttribute('data-preference-key'))).toEqual([
      't_and_c_accepted',
      'newsletter',
      'whitepapers',
    ])
    // Each is labelled by the BUSINESS'S OWN wording, which arrived on the wire.
    expect(region.textContent).toContain('Send me occasional news about the salon.')
    expect(region.textContent).toContain('Terms and conditions')
  })
})

describe('REQ-245 — a control exists exactly where the type allows one', () => {
  it('test_UAT_FC_REQ-245_only_the_editable_rows_carry_a_control', async () => {
    const { section } = await portalDom()
    const { loadPreferences } = await client()
    await loadPreferences(section, async () =>
      answer([document1(), preference(), request3()]),
    )

    const rowFor = (key: string) =>
      section.querySelector(`li[data-preference-key="${key}"]`) as HTMLElement
    // The preference is the contact's own and offers the control.
    expect(rowFor('newsletter').querySelector('input[type=checkbox]')).not.toBeNull()
    // A document acceptance is not revocable by the contact and a request has
    // nothing to take back, so NEITHER offers one — and not a disabled one
    // either, which would say "you could change this, but not now".
    expect(rowFor('t_and_c_accepted').querySelector('input')).toBeNull()
    expect(rowFor('whitepapers').querySelector('input')).toBeNull()
    expect(section.querySelectorAll('input').length).toBe(1)
  })

  it('test_UAT_FC_REQ-245_the_control_is_decided_by_the_flag_and_not_by_the_key', async () => {
    const { section } = await portalDom()
    const { loadPreferences } = await client()
    // A key this module has never seen — the shape a business's own custom
    // acceptance will take — arrives editable and gets a control; the same key
    // arriving unwritable does not. The decision is the acceptance layer's, so a
    // key added to the registry tomorrow is drawn correctly today.
    await loadPreferences(section, async () =>
      answer([
        preference({ key: 'invented_key', label: 'Invented', wording: 'Something new.' }),
        preference({ key: 'invented_locked', editable: false, wording: '', label: 'Locked' }),
      ]),
    )
    expect(
      section.querySelector('li[data-preference-key="invented_key"] input'),
    ).not.toBeNull()
    expect(section.querySelector('li[data-preference-key="invented_locked"] input')).toBeNull()
  })

  it('test_UAT_FC_REQ-245_the_control_is_named_by_the_wording_the_contact_is_shown', async () => {
    const { section } = await portalDom()
    const { loadPreferences } = await client()
    await loadPreferences(section, async () => answer([preference()]))

    // The sentence is the checkbox's OWN accessible name, inside its label,
    // rather than a neighbouring string — so what is recorded as the evidence and
    // what an assistive technology reads out are the same words.
    const label = section.querySelector('label.account-portal__preflabel') as HTMLElement
    expect(label.querySelector('input[type=checkbox]')).not.toBeNull()
    expect(label.textContent).toContain('Send me occasional news about the salon.')
  })
})

describe('REQ-245 — where the contact stands, said honestly', () => {
  it('test_UAT_FC_REQ-245_never_asked_is_not_drawn_as_a_refusal', () => {
    // A key with no record means nobody put the question, which is a different
    // fact from a withdrawal — the distinction [[REQ-240]] made the operator's
    // pane keep, kept here for the contact's own eyes.
    expect(preferenceStatus(preference({ granted: null }))).toBe('Not asked yet')
    expect(preferenceStatus(document1({ granted: null, since: null }))).toBe('Not asked yet')
    expect(preferenceStatus(preference({ granted: false, since: '2026-03-04T09:00:00.000Z' })))
      .toContain('Off since')
  })

  it('test_UAT_FC_REQ-245_a_request_is_said_in_the_past_and_a_preference_in_the_present', () => {
    // The tense comes from `historic` and from nothing else. A request is a
    // statement about something that happened; a preference is a value that
    // stands today, and saying either in the other's tense misdescribes it.
    expect(preferenceStatus(request3())).toContain('Asked')
    expect(preferenceStatus(preference({ granted: true, since: '2026-03-04T09:00:00.000Z' })))
      .toContain('On since')
  })

  it('test_UAT_FC_REQ-245_a_document_they_agreed_to_an_older_version_of_says_so', () => {
    // They agreed, and the business has published a newer document since. Saying
    // "Agreed" alone would be true of the act and false about where they stand,
    // on the one surface whose whole job is telling them where they stand.
    expect(preferenceStatus(document1())).toContain('Agreed')
    expect(preferenceStatus(document1({ outstanding: true }))).toBe(
      'Agreed to an earlier version',
    )
  })

  it('test_UAT_FC_REQ-245_an_unreadable_answer_draws_nothing_rather_than_guessing', () => {
    expect(preferenceRows(null)).toEqual([])
    expect(preferenceRows({ acceptances: 'no' })).toEqual([])
    // A row with no key could not be changed and could not be labelled; dropping
    // it costs one line, and drawing it would put an anonymous control on a page
    // whose subject is what somebody agreed to.
    expect(preferenceRows({ acceptances: [{ label: 'x' }, preference()] })).toHaveLength(1)
  })
})

describe('REQ-245 — the one write, and its bounds', () => {
  it('test_UAT_FC_REQ-245_toggling_posts_a_key_and_a_direction_and_nothing_else', async () => {
    const { dom, section } = await portalDom()
    const { loadPreferences } = await client()
    const calls: Array<{ url: string; init: RequestInit }> = []
    await loadPreferences(section, async (url: string, init: RequestInit) => {
      calls.push({ url, init })
      if (init.method === 'GET') return answer([preference()])
      return new Response(
        JSON.stringify({
          acceptance: preference({ granted: true, since: '2026-09-13T10:00:00.000Z' }),
        }),
        { headers: { 'content-type': 'application/json' } },
      )
    })

    const box = section.querySelector('input[type=checkbox]') as HTMLInputElement
    box.checked = true
    box.dispatchEvent(new dom.window.Event('change'))
    await new Promise((r) => setTimeout(r, 0))

    expect(calls.map((c) => c.init.method)).toEqual(['GET', 'POST'])
    const wrote = calls[1]
    // It goes to the endpoint the INSTANCE named, not to the account endpoint —
    // the two are separate fields precisely so what may be written is legible
    // from the definition.
    expect(wrote.url).toBe(ACCEPTANCES_ENDPOINT)
    // AND IT CARRIES NO CONTACT. Who is changing their mind is the session's
    // answer; a contact id on the wire would be a field worth forging.
    expect(JSON.parse(String(wrote.init.body))).toEqual({ key: 'newsletter', granted: true })
    // The row redraws from what the endpoint says it recorded, not from what was
    // asked for.
    expect(section.textContent).toContain('On since')
  })

  it('test_UAT_FC_REQ-245_a_refused_write_puts_the_box_back_and_says_so', async () => {
    const { dom, section } = await portalDom()
    const { loadPreferences } = await client()
    await loadPreferences(section, async (_url: string, init: RequestInit) => {
      if (init.method === 'GET') return answer([preference({ granted: true })])
      return new Response('no', { status: 403 })
    })

    const box = section.querySelector('input[type=checkbox]') as HTMLInputElement
    expect(box.checked).toBe(true)
    box.checked = false
    box.dispatchEvent(new dom.window.Event('change'))
    await new Promise((r) => setTimeout(r, 0))

    // The checkbox is the reader's belief about what is recorded. Leaving it
    // moved after a write that did not land would make the surface lie about the
    // one thing on it that is theirs.
    expect(box.checked).toBe(true)
    const error = section.querySelector('[data-account-prefs-error]') as HTMLElement
    expect(error.hasAttribute('hidden')).toBe(false)
  })

  it('test_UAT_FC_REQ-245_the_client_still_has_no_verb_that_destroys_or_grants', async () => {
    // [[REQ-183]] §4.1's property, restated for the opened contract. The portal
    // may now write, and what it may write is bounded by the shape of the only
    // request it can make: one `POST`, to the preferences endpoint, carrying a
    // key and a boolean. There is no `DELETE`, no `PUT`, no `PATCH`, and no
    // second URL field for one to be hung off.
    const source = fs.readFileSync(
      path.join(__dirname, '..', 'packages/framework/src/modules/account-portal/client.js'),
      'utf8',
    )
    expect(source).not.toMatch(/method:\s*'(PUT|PATCH|DELETE)'/i)
    expect(source.match(/method:\s*'POST'/g) ?? []).toHaveLength(1)
    const urls = Object.entries(accountPortalMeta.config)
      .filter(([, spec]) => spec.type === 'url')
      .map(([name]) => name)
    expect(urls).toEqual(['account', 'acceptances'])
  })

  it('test_UAT_FC_REQ-245_an_unreachable_endpoint_costs_the_section_and_nothing_else', async () => {
    const { section } = await portalDom()
    const { loadPreferences } = await client()
    await loadPreferences(section, async () => new Response('no', { status: 500 }))

    // Isolation ([[DOC-25]]): the region stays exactly as the server left it, and
    // the rest of the portal — the authored copy, the erasure explanation — is
    // untouched.
    const region = section.querySelector('[data-account-agreements]') as HTMLElement
    expect(region.hasAttribute('hidden')).toBe(true)
    const erasure = section.querySelector('[data-account-erasure]') as HTMLElement
    expect(erasure.hasAttribute('hidden')).toBe(false)
  })
})

describe('REQ-245 — the shipped portal carries the endpoint', () => {
  it('test_UAT_FC_REQ-245_the_default_portal_names_both_endpoints', async () => {
    // A business that has authored no portal of its own still gets the section,
    // through the same in-memory store [[REQ-183]] built — so the surface lands
    // everywhere on the day it ships rather than for whoever authors next.
    const store = portalFallbackStore(ACCOUNT_ENDPOINT, ACCEPTANCES_ENDPOINT)
    const pages = await store.readPages(PORTAL_SLUG)
    const instance = (pages[0].page as { modules: Array<{ config: Record<string, unknown> }> })
      .modules[0]
    expect(instance.config.account).toBe(ACCOUNT_ENDPOINT)
    expect(instance.config.acceptances).toBe(ACCEPTANCES_ENDPOINT)
  })
})

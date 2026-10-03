import { JSDOM } from 'jsdom'
import { describe, expect, it } from 'vitest'
import { addressStatus } from '../packages/framework/src/modules/account-portal/client.js'
import { renderSiteFiles } from '../tools/generate/src/render/render'
import { assembleSite } from '../tools/generate/src/store/assemble'
import {
  PORTAL_SLUG,
  portalFallbackStore,
  portalHomePage,
  portalSiteJson,
} from '../apps/control-app/src/portal'

/**
 * [[REQ-368]] — **the profile portal lists the addresses you sign in with, with
 * Add, Remove and Make primary**.
 *
 * The surface half of the ticket, against the shipped default portal rendered by
 * the shared renderer and enhanced by the vetted client in a DOM. The endpoint
 * behind it — and every rule it enforces — is proved against a real Worker in
 * the workers-side sibling; here the question is what the page shows and what it
 * sends.
 */

const ACCOUNT = '/api/businesses'
const ACCEPTANCES = '/api/acceptances'
const EMAILS = '/api/account/emails'

async function portalDom(): Promise<{ dom: JSDOM; section: HTMLElement }> {
  const loaded = assembleSite({
    slug: PORTAL_SLUG,
    sourceDir: '',
    base: portalSiteJson(),
    pages: [portalHomePage(ACCOUNT, ACCEPTANCES, EMAILS)],
    assetFiles: [],
  })
  if (!loaded.ok) throw new Error(JSON.stringify(loaded.errors))
  const html = (await renderSiteFiles(loaded.value)).files.get('index.html') ?? ''
  const dom = new JSDOM(`<!doctype html><body>${html}</body>`)
  const section = dom.window.document.querySelector('[data-account-portal]') as HTMLElement
  return { dom, section }
}

const client = () => import('../packages/framework/src/modules/account-portal/client.js')

const json = (status: number, body: unknown): Response =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })

const PRIMARY = {
  id: 'eml_a',
  email: 'me@example.test',
  primary: true,
  validated: true,
  removable: false,
  canMakePrimary: false,
}
const VALIDATED = {
  id: 'eml_b',
  email: 'work@example.test',
  primary: false,
  validated: true,
  removable: true,
  canMakePrimary: true,
}
const UNVALIDATED = {
  id: 'eml_c',
  email: 'new@example.test',
  primary: false,
  validated: false,
  removable: true,
  canMakePrimary: false,
}

const rowFor = (section: HTMLElement, id: string) =>
  section.querySelector(`[data-address-id="${id}"]`) as HTMLElement
const buttonsOf = (row: HTMLElement) => [...row.querySelectorAll('button')].map((b) => b.textContent)

describe('REQ-368 — the list of addresses you sign in with', () => {
  it('test_UAT_FC_REQ-368_the_default_portal_names_the_addresses_endpoint_and_draws_nothing_before_it_answers', async () => {
    const pages = await portalFallbackStore(ACCOUNT, ACCEPTANCES, EMAILS).readPages(PORTAL_SLUG)
    const instance = (pages[0].page as { modules: Array<{ config: Record<string, unknown> }> }).modules[0]
    expect(instance.config.emails).toBe(EMAILS)

    // Before the endpoint answers there is nothing true to show, so the region is
    // hidden and holds no rows.
    const { section } = await portalDom()
    const region = section.querySelector('[data-account-emails]') as HTMLElement
    expect(region.getAttribute('data-emails-src')).toBe(EMAILS)
    expect(region.hasAttribute('hidden')).toBe(true)
    expect(section.querySelectorAll('[data-address-id]')).toHaveLength(0)
  })

  it('test_UAT_FC_REQ-368_each_address_shows_whether_it_is_validated_and_only_the_controls_it_allows', async () => {
    const { section } = await portalDom()
    const { loadAddresses } = await client()
    await loadAddresses(section, async () => json(200, { emails: [PRIMARY, VALIDATED, UNVALIDATED] }))

    expect((section.querySelector('[data-account-emails]') as HTMLElement).hidden).toBe(false)
    // The primary: no Remove (it is primary) and no Make primary (it already is).
    expect(buttonsOf(rowFor(section, 'eml_a'))).toEqual([])
    expect(rowFor(section, 'eml_a').textContent).toContain('Primary')
    expect(rowFor(section, 'eml_a').textContent).toContain('Validated')
    // A validated second address may be made primary or removed.
    expect(buttonsOf(rowFor(section, 'eml_b'))).toEqual(['Make primary', 'Remove'])
    // An unvalidated address may be removed, never made primary — and says how to
    // validate it.
    expect(buttonsOf(rowFor(section, 'eml_c'))).toEqual(['Remove'])
    expect(rowFor(section, 'eml_c').textContent).toMatch(/not validated/i)
    expect(addressStatus(UNVALIDATED)).toMatch(/sign in with it/i)
    // And one form to add another.
    expect(section.querySelectorAll('form[data-address-add] input[type="email"]')).toHaveLength(1)
  })
})

describe('REQ-368 — what the page sends, and what it does with the answer', () => {
  it('test_UAT_FC_REQ-368_add_posts_the_address_and_nothing_else_then_redraws_from_the_answer', async () => {
    const { dom, section } = await portalDom()
    const { loadAddresses } = await client()
    const sent: Array<{ method: string; body: unknown }> = []
    const fetchImpl = async (_url: string, init: RequestInit = {}) => {
      sent.push({ method: init.method ?? 'GET', body: init.body ? JSON.parse(String(init.body)) : null })
      if (init.method === 'POST') return json(200, { emails: [PRIMARY, UNVALIDATED] })
      return json(200, { emails: [PRIMARY] })
    }
    await loadAddresses(section, fetchImpl)

    const form = section.querySelector('form[data-address-add]') as HTMLFormElement
    ;(form.querySelector('input') as HTMLInputElement).value = 'new@example.test'
    form.dispatchEvent(new dom.window.Event('submit', { cancelable: true }))
    await new Promise((resolve) => setTimeout(resolve, 0))

    // An action and an address — never a person, which the endpoint reads from the
    // session.
    expect(sent.find((s) => s.method === 'POST')?.body).toEqual({ action: 'add', email: 'new@example.test' })
    expect(rowFor(section, 'eml_c')).not.toBeNull()
  })

  it('test_UAT_FC_REQ-368_a_refusal_shows_the_endpoints_reason_and_leaves_the_list', async () => {
    const { section } = await portalDom()
    const { loadAddresses } = await client()
    const reason = 'You must keep at least one validated address.'
    await loadAddresses(section, async (_url: string, init: RequestInit = {}) =>
      init.method === 'POST' ? json(409, { error: reason }) : json(200, { emails: [PRIMARY, VALIDATED] }),
    )

    const remove = [...rowFor(section, 'eml_b').querySelectorAll('button')].find(
      (b) => b.textContent === 'Remove',
    ) as HTMLButtonElement
    remove.click()
    await new Promise((resolve) => setTimeout(resolve, 0))

    const error = section.querySelector('[data-account-emails-error]') as HTMLElement
    expect(error.hidden).toBe(false)
    expect(error.textContent).toBe(reason)
    expect(rowFor(section, 'eml_b')).not.toBeNull()
  })

  it('test_UAT_FC_REQ-368_an_unreachable_endpoint_costs_the_section_and_nothing_else', async () => {
    const { section } = await portalDom()
    const { loadAddresses } = await client()
    await loadAddresses(section, async () => new Response('no', { status: 500 }))
    expect((section.querySelector('[data-account-emails]') as HTMLElement).hasAttribute('hidden')).toBe(true)
    expect((section.querySelector('[data-account-erasure]') as HTMLElement).hasAttribute('hidden')).toBe(false)
  })
})

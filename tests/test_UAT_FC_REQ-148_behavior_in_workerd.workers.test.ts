import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import { getModule, latestModuleVersion } from '../packages/framework/src/worker'
import worker from '../apps/control-app/src/index'
import type { Env } from '../apps/control-app/src/index'
import { applySchema } from './support/d1-site-factory'
import { contactFormProps, contactFormSeed } from './support/behavior-site'

/**
 * REQ-148 — a behavior module renders IN WORKERD.
 *
 * This is the assertion the whole ticket exists for, and it runs where the claim
 * is made: inside workerd, through the Worker's own `fetch`, against a real D1
 * database and R2 bucket. Every one of these requests answered with an error
 * naming REQ-148 before this change — `renderSiteFiles` refused a page that
 * mounted a behavior, because rendering one needed Astro's transform and a
 * Worker has no way to run it.
 *
 * The fix was not to precompile the transform's output but to remove the need
 * for it: the two behavior components are plain TypeScript functions now. That
 * is what makes node/worker parity STRUCTURAL rather than a comparison — both
 * hosts call the same function — and it is why the parity assertion below is
 * written the only way that means anything: the served page must contain exactly
 * what calling the component in THIS runtime produces.
 */

function workerEnv(overrides: Partial<Env> = {}): Env {
  return {
    DB: env.DB,
    SITES: env.SITES,
    TENANT_ID: 'req148',
    ACCESS_DEV_OPEN: '1',
    ACCESS_TEAM_DOMAIN: '',
    ACCESS_AUD: '',
    ASSETS: {
      fetch: async () => new Response('asset', { status: 200 }),
    } as unknown as Fetcher,
    ...overrides,
  }
}

const call = (path: string): Promise<Response> =>
  worker.fetch(new Request(`https://app.example/${path.replace(/^\//, '')}`), workerEnv())

async function importSeed(): Promise<string> {
  const seed = contactFormSeed()
  const res = await worker.fetch(
    new Request('https://app.example/api/import', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        slug: seed.slug,
        siteJson: seed.siteJson,
        pages: Object.entries(seed.pages).map(([name, page]) => ({ name, page })),
        assets: [],
      }),
    }),
    workerEnv(),
  )
  expect(res.status).toBe(200)
  return seed.slug
}

describe('REQ-148 — behavior modules render in workerd', () => {
  beforeAll(async () => {
    await applySchema()
  })

  it('test_UAT_FC_REQ-148_a_behavior_module_site_renders_its_draft_channel', async () => {
    // AC-1. The page mounts `contact-form` into an L1 seam; the Worker renders it.
    const slug = await importSeed()

    const draft = await call(`/preview/${slug}/draft/`)
    expect(draft.status).toBe(200)
    const html = await draft.text()

    // The module's own chrome, its behavioural attributes, and the L1 controls
    // mounted into its slot — all produced inside workerd.
    expect(html).toContain('data-fc-type="contact-form"')
    expect(html).toContain('action="https://forms.example/contact"')
    expect(html).toContain('method="post"')
    expect(html).toContain('<label class="contact-form__label"')
    expect(html).toContain('id="cf-message"')

    // AC-5's other half: the invariant chrome reaches the page through theme.css.
    const css = await call(`/preview/${slug}/draft/theme.css`)
    expect(css.status).toBe(200)
    expect(await css.text()).toContain('.contact-form__label')
  })

  it('test_UAT_FC_REQ-148_the_served_bytes_are_the_components_own_output', async () => {
    // AC-1's parity clause. `getModule` is reachable HERE, in workerd — it could
    // not be while it resolved an Astro component — so the test can render the
    // module directly in this runtime and demand the served page contain those
    // exact bytes. A second render path would show up as a mismatch.
    const slug = await importSeed()
    const html = await (await call(`/preview/${slug}/draft/`)).text()

    const { Component } = getModule('contact-form', latestModuleVersion('contact-form')!)
    const direct = Component(contactFormProps())
    expect(typeof Component).toBe('function')
    // The renderer stamps the editor's hook onto the module root; the rest is
    // byte-identical to the direct call.
    expect(html).toContain(direct.slice(direct.indexOf('>') + 1))
  })

  it('test_UAT_FC_REQ-148_the_edit_channel_switches_the_behaviour_off', async () => {
    // REQ-116's rule still holds through the new render: the edit channel drops
    // the endpoint and the verb, so a submit cannot leave the page.
    const slug = await importSeed()
    const edit = await call(`/preview/${slug}/edit/`)
    expect(edit.status).toBe(200)
    const html = await edit.text()
    expect(html).toContain('data-contact-form')
    expect(html).not.toContain('action="https://forms.example/contact"')
    expect(html).not.toContain('method="post"')
  })
})

import { beforeAll, describe, expect, it } from 'vitest'
import { env } from 'cloudflare:test'
import { getModule, latestModuleVersion } from '../packages/framework/src/worker'
import { renderSiteFiles } from '../tools/generate/src/render/render'
import { assembleSite } from '../tools/generate/src/store/assemble'
import worker from '../apps/control-app/src/index'
import type { Env } from '../apps/control-app/src/index'
import { applySchema } from './support/d1-site-factory'
import { contactFormProps, contactFormSeed } from './support/behavior-site'

/**
 * story-179b8c06 — the portable half of the behavior-module contract.
 *
 * These run INSIDE WORKERD, through the Worker's own `fetch`, against real D1 and
 * R2 bindings — because that is where the claim is made. Every request below
 * answered with an error naming the work that would make it possible before a
 * behavior became a plain props-to-markup function: rendering one needed a
 * filesystem-bound build transform, so a page that mounted a behavior could be
 * rendered by the operator's own machine and by nothing else.
 *
 * Host-to-host parity is therefore asserted the only way that means anything.
 * Not by diffing two renders — there is no second implementation to diff —
 * but by demanding the SERVED bytes contain exactly what calling the component
 * in this same runtime produces, and that the one render entry point both hosts
 * call agrees. Parity with the deleted transform's output is deliberately NOT
 * claimed: its inter-element whitespace differs and is semantically inert.
 */

function workerEnv(overrides: Partial<Env> = {}): Env {
  return {
    DB: env.DB,
    SITES: env.SITES,
    TENANT_ID: 'story179b8c06',
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

/** Seed the module-mounting site through the Worker's own import route. */
async function importSeed(): Promise<ReturnType<typeof contactFormSeed>> {
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
  return seed
}

/**
 * The same seed rendered through the ONE render entry point (`renderSiteFiles`)
 * that the filesystem host's `1c render` reaches through its writer. Both hosts
 * name this function and it resolves modules through the shipping catalog by
 * default, so this is the "equivalent render" the criteria contrast against —
 * one function, not a second implementation.
 */
async function renderThroughTheSharedEntryPoint(
  seed: ReturnType<typeof contactFormSeed>,
  edit = false,
): Promise<string> {
  const loaded = assembleSite({
    slug: seed.slug,
    sourceDir: `seed:${seed.slug}`,
    base: seed.siteJson,
    pages: Object.values(seed.pages),
    assetFiles: [],
  })
  expect(loaded.ok).toBe(true)
  if (!loaded.ok) throw new Error('seed did not validate')
  const rendered = await renderSiteFiles(loaded.value, { edit })
  const html = rendered.files.get('index.html')
  expect(html).toBeTypeOf('string')
  return html as string
}

describe('story-179b8c06 — a behavior-mounting site renders in the edge runtime', () => {
  beforeAll(async () => {
    await applySchema()
  })

  it('test_UAT_AC1412_edge_runtime_serves_the_components_own_bytes_dressed', async () => {
    const seed = await importSeed()

    // 1. The draft channel of a behavior-mounting site answers from the edge
    //    runtime at all — the request that used to fail naming the work that
    //    would make it possible.
    const draft = await call(`/preview/${seed.slug}/draft/`)
    expect(draft.status).toBe(200)
    const html = await draft.text()
    expect(html).not.toMatch(/REQ-148/)

    // 2. …with the module's chrome, its behavioural attributes, and the L1
    //    controls mounted into its slot. All produced inside workerd.
    expect(html).toContain('data-fc-type="contact-form"')
    expect(html).toContain('action="https://forms.example/contact"')
    expect(html).toContain('method="post"')
    expect(html).toContain('<label class="contact-form__label"')
    expect(html).toContain('id="cf-name"')
    expect(html).toContain('id="cf-message"')

    // 3. It renders DRESSED, not merely without throwing: the invariant chrome
    //    reaches the page the way it always did — folded into the stylesheet the
    //    same request serves.
    const css = await call(`/preview/${seed.slug}/draft/theme.css`)
    expect(css.status).toBe(200)
    expect(await css.text()).toContain('.contact-form__label')

    // 4. THE PARITY CLAUSE. `getModule` is reachable HERE, in workerd — it could
    //    not be while it resolved a build-transform artifact — so the component
    //    can be called in this very runtime and the served page must contain
    //    those exact bytes. A second, host-specific render path shows up here as
    //    a mismatch. The renderer's only contribution is the editor hook it
    //    stamps on the module root's opening tag.
    const { Component } = getModule('contact-form', latestModuleVersion('contact-form')!)
    expect(typeof Component).toBe('function')
    const direct = Component(contactFormProps())
    const insideTheRoot = direct.slice(direct.indexOf('>') + 1)
    expect(html).toContain(insideTheRoot)

    // 5. The equivalent render through the one entry point the filesystem host
    //    takes, on the same seed, contains that same component output — so the
    //    two hosts are shown to be running one function rather than two
    //    implementations that happen to agree today.
    const shared = await renderThroughTheSharedEntryPoint(seed)
    expect(shared).toContain(insideTheRoot)
  })

  it('test_UAT_AC1413_edit_channel_switches_the_behaviour_off_in_both_hosts', async () => {
    const seed = await importSeed()

    // The edit channel: the module root and its content are present, so every
    // editable region is reachable in the channel built for editing it…
    const edit = await call(`/preview/${seed.slug}/edit/`)
    expect(edit.status).toBe(200)
    const editHtml = await edit.text()
    expect(editHtml).toContain('data-contact-form')
    expect(editHtml).toContain('<label class="contact-form__label"')
    expect(editHtml).toContain('id="cf-message"')

    // …while the functional attributes are REMOVED rather than blanked: no
    // endpoint and no submission verb, so a submit cannot leave the page the
    // editor is working on.
    expect(editHtml).not.toContain('action="https://forms.example/contact"')
    expect(editHtml).not.toContain('method="post"')

    // The draft channel of the SAME site, served by the SAME runtime, carries
    // both — so the difference is shown to be the channel and not the seed.
    const draftHtml = await (await call(`/preview/${seed.slug}/draft/`)).text()
    expect(draftHtml).toContain('action="https://forms.example/contact"')
    expect(draftHtml).toContain('method="post"')

    // And the rule holds through the one render entry point the filesystem host
    // takes as well: a channel guarantee that survived on only one host would be
    // a regression the relocation introduced silently.
    const sharedEdit = await renderThroughTheSharedEntryPoint(seed, true)
    expect(sharedEdit).toContain('data-contact-form')
    expect(sharedEdit).not.toContain('action="https://forms.example/contact"')
    expect(sharedEdit).not.toContain('method="post"')

    const sharedDraft = await renderThroughTheSharedEntryPoint(seed, false)
    expect(sharedDraft).toContain('action="https://forms.example/contact"')
    expect(sharedDraft).toContain('method="post"')
  })
})

// @vitest-environment jsdom
/**
 * story-e674c60a — **the workspace mounted against its own real origin**.
 *
 * Three criteria need both halves at once: a workspace mounted out of the REAL
 * `webui-*` components, and a live builder origin serving a real
 * store. The chrome suite (jsdom) has no origin, and the origin suite (node)
 * has no DOM, so the criteria whose subject is the seam between them —
 * AC-1029's registered editable mode, AC-972's publish of the *displayed*
 * site, AC-967's selector listing the store the origin actually holds — live
 * here.
 *
 * The discipline is the one the sibling suites follow (story Technical
 * Context): the components arrive from an out-of-band install, so the half of
 * each criterion that needs no components is asserted UNCONDITIONALLY against
 * the real origin, and the half that needs the mounted chrome reports itself as
 * unverified out loud rather than passing quietly. Components are never mocked
 * and no stand-in panel is ever substituted — a stand-in would prove nothing
 * about the mode the shipped workspace actually registers.
 */

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'
import {
  cmdNew,
  cmdPublish,
  cmdRender,
  cmdRevisions,
  startBuilder,
  type BuilderHandle,
} from '../tools/generate/src/cli'

const REPO = path.resolve(__dirname, '..')

/**
 * Move `beta`'s draft, so a publish has something to mint.
 *
 * Written through the page file rather than an edit command because what this
 * suite is about is the toolbar's aim — which slug reaches publish — and the
 * edit is only there to make the draft differ from the live revision.
 */
function editBetaHeadline(cwd: string, text: string): void {
  const file = path.join(cwd, 'storage/sites/beta/draft/pages/home.json')
  const page = JSON.parse(fs.readFileSync(file, 'utf8')) as {
    l1: { root: { children: Array<{ text: string }> } }
  }
  page.l1.root.children[0].text = text
  fs.writeFileSync(file, JSON.stringify(page, null, 2), 'utf8')
}

/** The listing the workspace is mounted over — `alpha` first, so it opens there. */
const SITES = [
  { slug: 'alpha', latest: null },
  { slug: 'beta', latest: null },
]

if (!WEBUI_INSTALLED) console.warn(`story-e674c60a mounted suites: ${WEBUI_SKIP_REASON}`)

/** A loud report for evidence this machine genuinely cannot produce. */
function unverified(what: string): void {
  console.warn(`story-e674c60a: ${what} NOT VERIFIED here — ${WEBUI_SKIP_REASON}`)
}

/** A `Storage`-shaped map, so a mount never leaks state into the next one. */
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

/** Two real sites, each rendered in the draft and edit channels. */
async function makeWorkspace(): Promise<string> {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'story-e674c60a-mounted-'))
  for (const slug of ['alpha', 'beta']) {
    cmdNew(slug, { cwd })
    await cmdRender(slug, { cwd, source: 'draft' })
    await cmdRender(slug, { cwd, edit: true })
  }
  return cwd
}

/**
 * `app.js` imports the components by bare specifier, so it is loaded
 * dynamically: on a machine without them a static import would fail the whole
 * file at transform time rather than reporting a skip. `api.js` imports
 * nothing, so the address helpers load everywhere.
 */
let mountBuilder: (root: HTMLElement, opts?: Record<string, unknown>) => never
let previewUrl: (slug: string, channel: string) => string
let publishSite: (slug: string, fetchImpl?: typeof fetch) => Promise<{ id: number }>
let fetchSites: (
  fetchImpl?: typeof fetch,
) => Promise<Array<{ slug: string; latest: number | null }>>

describe('story-e674c60a workspace mounted over its origin', () => {
  let cwd: string
  let builder: BuilderHandle
  let root: HTMLElement

  beforeAll(async () => {
    if (WEBUI_INSTALLED) {
      ;({ mountBuilder } = await import('../apps/control-app/src/builder/app.js'))
    }
    ;({ previewUrl, publishSite, fetchSites } = (await import(
      '../apps/control-app/src/builder/api.js'
    )) as {
      previewUrl: typeof previewUrl
      publishSite: typeof publishSite
      fetchSites: typeof fetchSites
    })
    // jsdom ships neither; the split primitive observes its container.
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

    cwd = await makeWorkspace()
    builder = await startBuilder({
      cwd,
      clientDir: path.join(REPO, 'apps/control-app/src/builder'),
    })
  }, 180000)

  afterAll(async () => {
    await builder?.close()
    if (cwd) fs.rmSync(cwd, { recursive: true, force: true })
  })

  beforeEach(() => {
    document.body.replaceChildren()
    root = document.createElement('div')
    document.body.append(root)
  })

  /** The workspace's own addresses are root-relative; jsdom is not that origin. */
  const get = (p: string, init?: RequestInit) => fetch(new URL(p, builder.url), init)
  /** The real client publish call, aimed at the real origin over real HTTP. */
  const originFetch = ((input: string, init?: RequestInit) =>
    get(input, init)) as unknown as typeof fetch

  const onDisk = (slug: string, channel: string) =>
    fs.readFileSync(path.join(cwd, `storage/dist/sites/${slug}/${channel}/index.html`), 'utf8')

  it('test_UAT_AC1029_workspace_registers_an_editable_mode_showing_the_edit_channel', async () => {
    // AC-1029 — the shipped workspace registers an EDITABLE mode of its own.
    // AC-968 and AC-969 are deliberately mode-agnostic and a workspace shipping
    // no editable mode would satisfy both; this is what makes the mode contract
    // true of two real modes rather than one real and one hypothetical.
    //
    // First the half that needs no components: the address such a mode points
    // at is a distinct channel, and this origin serves that site's real edit
    // rendering there.
    const editUrl = previewUrl('alpha', 'edit')
    const viewUrl = previewUrl('alpha', 'draft')
    expect(editUrl).not.toBe(viewUrl)

    const editRes = await get(editUrl)
    expect(editRes.status).toBe(200)
    const editBody = await editRes.text()
    expect(editBody).toBe(onDisk('alpha', 'edit'))
    // Genuinely the edit rendering, not the ordinary channel served twice.
    const viewBody = await (await get(viewUrl)).text()
    expect(editBody).not.toBe(viewBody)
    expect(viewBody).toBe(onDisk('alpha', 'draft'))

    if (!WEBUI_INSTALLED) {
      unverified(
        "the workspace's OWN registration of the editable mode (the chrome needs the components)",
      )
      return
    }

    // …and now the claim itself, against the shipped workspace. No mode is
    // registered here: every mode below came out of `mountBuilder`.
    const app = mountBuilder(root, { sites: SITES, storage: memoryStorage() })
    const offered = app.panel.getModes().map((m: { id: string }) => m.id)
    expect(offered).toContain('view')
    expect(offered).toContain('edit')

    expect(app.panel.getMode()).toBe('view')
    expect(app.panel.getSite()).toBe('alpha')
    expect(app.panel.getSrc()).toBe(viewUrl)

    // Selecting it displays the current site's edit channel — a different
    // address from the one the view mode shows for that same site…
    app.panel.setMode('edit')
    expect(app.panel.getMode()).toBe('edit')
    expect(app.panel.getSrc()).toBe(editUrl)
    expect(app.panel.frame.getAttribute('src')).toBe(editUrl)
    expect(app.panel.getSrc()).not.toBe(viewUrl)
    // …and fetching the address the pane is DISPLAYING over the workspace
    // origin returns that site's edit rendering.
    expect(await (await get(app.panel.getSrc())).text()).toBe(onDisk('alpha', 'edit'))

    // Mode and site COMPOSE: with the editable mode still active, choosing a
    // different site follows to that site's edit channel.
    app.panel.setSite('beta')
    expect(app.panel.getMode()).toBe('edit')
    expect(app.panel.getSrc()).toBe(previewUrl('beta', 'edit'))
    expect(await (await get(app.panel.getSrc())).text()).toBe(onDisk('beta', 'edit'))

    // Switching back returns to the ordinary channel of the site now selected.
    app.panel.setMode('view')
    expect(app.panel.getSrc()).toBe(previewUrl('beta', 'draft'))
    expect(await (await get(app.panel.getSrc())).text()).toBe(onDisk('beta', 'draft'))

    app.destroy()
  })

  it('test_UAT_AC972_publish_creates_a_revision_for_the_displayed_site', async () => {
    // AC-972 — publish acts on the site currently displayed, not a default, and
    // adds no semantics of its own.
    //
    // The transport half first, on every machine: the origin's publish
    // operation is the platform's own `publish`, reached over HTTP.
    expect(await cmdRevisions('beta', { cwd })).toHaveLength(0)
    expect(await cmdRevisions('alpha', { cwd })).toHaveLength(0)

    const res = await get('/api/publish', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ slug: 'beta', message: 'from the workspace' }),
    })
    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({ id: 1 })

    // A new entry in THAT site's history — and the other site is untouched.
    const revisions = await cmdRevisions('beta', { cwd })
    expect(revisions).toHaveLength(1)
    expect(revisions[0]).toMatchObject({ id: 1, message: 'from the workspace' })
    expect(await cmdRevisions('alpha', { cwd })).toHaveLength(0)

    // Locked in the same form a command-line publish produces: an immutable
    // snapshot directory holding the draft as it was. Proven by publishing
    // `alpha` through the CLI path and comparing the two revisions' shapes.
    const viaWorkspace = path.join(cwd, 'storage/sites/beta/revisions/0001')
    expect(fs.existsSync(viaWorkspace)).toBe(true)
    await cmdPublish('alpha', { cwd, message: 'from the cli' })
    const viaCli = path.join(cwd, 'storage/sites/alpha/revisions/0001')
    expect(fs.readdirSync(viaWorkspace).sort()).toEqual(fs.readdirSync(viaCli).sort())
    expect(Object.keys((await cmdRevisions('beta', { cwd }))[0]).sort()).toEqual(
      Object.keys((await cmdRevisions('alpha', { cwd }))[0]).sort(),
    )

    // The published channel was rendered — and the origin REDIRECTS to it
    // rather than serving it (REQ-149 D4). One serving path for published
    // bytes: public-site owns them, and a second origin answering the same
    // question would be the duplicate resolve-and-serve that seam exists to
    // prevent.
    const published = path.join(cwd, 'storage/dist/sites/beta/published/index.html')
    expect(fs.existsSync(published)).toBe(true)
    const servedRes = await get('/preview/beta/published/', { redirect: 'manual' })
    expect(servedRes.status).toBe(302)
    expect(servedRes.headers.get('location')).toBe('https://1stcontact.io/site/beta/')

    if (!WEBUI_INSTALLED) {
      unverified(
        'the DISPLAYED-site half — publish invoked from the mounted workspace toolbar ' +
          '(the chrome needs the components)',
      )
      return
    }

    // …and the load-bearing clause: the slug reaching the platform's publish
    // path is the one the PANE IS DISPLAYING. The control is clicked, not
    // called; the publish handed to the workspace is the app's own
    // `publishSite`, aimed at the real origin — nothing about the request is
    // written by hand here, so a regression sending `sites[0].slug` or a stale
    // captured slug would publish `alpha` and fail below.
    const app = mountBuilder(root, {
      sites: SITES,
      storage: memoryStorage(),
      publish: (slug: string) => publishSite(slug, originFetch),
    })
    // The workspace opens on the FIRST site, so `beta` below is a selection the
    // operator made rather than the default.
    expect(app.panel.getSite()).toBe('alpha')
    app.panel.setSite('beta')
    expect(app.panel.getSite()).toBe('beta')

    // `beta` was published above and has not moved since, and REQ-149 made
    // publishing an unchanged draft a NO-OP. So the draft is edited first — not
    // to work around the rule, but because the button under test mints a
    // revision only when there is something to mint, and a test that clicked it
    // on an unchanged site would be asserting the old behaviour.
    editBetaHeadline(cwd, 'Displayed-site publish.')

    ;(app.toolbar.get('publish') as HTMLButtonElement).click()

    await vi.waitFor(async () => expect(await cmdRevisions('beta', { cwd })).toHaveLength(2))
    // The site the workspace was NOT displaying gained nothing.
    expect(await cmdRevisions('alpha', { cwd })).toHaveLength(1)
    // …and the published channel of the displayed site is re-rendered, and the
    // origin points at where it is served from (REQ-149 D4).
    expect(
      fs.readFileSync(path.join(cwd, 'storage/dist/sites/beta/published/index.html'), 'utf8'),
    ).toContain('Displayed-site publish.')
    const redirected = await get('/preview/beta/published/', { redirect: 'manual' })
    expect(redirected.status).toBe(302)

    app.destroy()
  })

  /**
   * Last in the file on purpose: it adds a site to the store, and every test
   * above is written against the two `makeWorkspace` created.
   */
  it('test_UAT_AC967_the_site_selector_lists_exactly_the_store_and_switches_the_site', async () => {
    // AC-967 — "neither a hardcoded list nor a subset" is a claim about the
    // chain store → `/api/sites` → selector, so no link in it is written by
    // hand here: the expected set is READ OFF THE STORE, the listing is
    // obtained by the app's own `fetchSites` over the real origin, and that
    // listing (never a literal) is what the workspace is mounted over.
    const inStore = () =>
      fs
        .readdirSync(path.join(cwd, 'storage/sites'), { withFileTypes: true })
        .filter((e) => e.isDirectory())
        .map((e) => e.name)
        .sort()

    // Non-vacuity: the store is genuinely non-empty and holds more than one site,
    // so "exactly" below has something to be wrong about.
    expect(inStore()).toEqual(['alpha', 'beta'])
    expect((await fetchSites(originFetch)).map((s) => s.slug).sort()).toEqual(inStore())

    // A site created AFTER the origin started is listed too. A hardcoded list, a
    // boot-time snapshot, or a filter that drops sites without revisions (only
    // `beta` and `alpha` have any by now, and `gamma` never will) all fail here.
    cmdNew('gamma', { cwd })
    await cmdRender('gamma', { cwd, source: 'draft' })
    expect(inStore()).toEqual(['alpha', 'beta', 'gamma'])

    const listing = await fetchSites(originFetch)
    expect(listing.map((s) => s.slug).sort()).toEqual(inStore())

    if (!WEBUI_INSTALLED) {
      unverified('the SELECTOR built from that listing (the chrome needs the components)')
      return
    }

    // The chrome half, mounted over the listing that just came off the origin.
    const app = mountBuilder(root, { sites: listing, storage: memoryStorage() })
    const select = app.toolbar.get('site-selector') as HTMLSelectElement
    expect([...select.options].map((o) => o.value).sort()).toEqual(inStore())

    // Choosing a different option changes the displayed document to that site's
    // rendering IN THE CURRENT MODE…
    const modeBefore = app.panel.getMode()
    select.value = 'gamma'
    select.dispatchEvent(new Event('change'))
    expect(app.panel.getSite()).toBe('gamma')
    expect(app.panel.getMode()).toBe(modeBefore)
    expect(app.panel.frame.getAttribute('src')).toBe(previewUrl('gamma', 'draft'))
    // …and that address serves that site's real rendered page over this origin.
    expect(await (await get(app.panel.getSrc())).text()).toBe(onDisk('gamma', 'draft'))

    app.destroy()
  })
})

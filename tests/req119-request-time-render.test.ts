/**
 * REQ-119 — request-time draft and edit renders (DOC-28 §12 T5).
 *
 * The builder used to serve `/preview/<slug>/draft|edit/…` off `storage/dist/…`,
 * and every save re-materialised both whole channels to disk before the iframe
 * reloaded. Now the channel is rendered when the request arrives, through the
 * ONE render `1c render` is itself a writer over.
 *
 * The risk this ticket carries is not "does a page come back" — it is drift:
 * two render paths that agree today and disagree after the next L1 axis lands.
 * So the load-bearing assertions here are equalities. The request-time bytes are
 * compared to the build-time bytes for a real site (behavior modules, an L1
 * document, assets, two pages), and the writer's output on disk is compared to
 * the render's output in memory, file set and all.
 */

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  cmdPublish,
  cmdRender,
  startBuilder,
  type BuilderHandle,
} from '../tools/generate/src/cli'
import { getModule } from '../packages/framework/src/modules/registry'
import { renderSite, renderSiteFiles } from '../tools/generate/src/render'
import { loadSite, type LoadedSite } from '../tools/generate/src/store'

const REPO = path.resolve(__dirname, '..')
const SLUG = 'xgd'
/**
 * A real site, not a scaffold. The starter has no behavior module and no asset,
 * so it would exercise neither the Astro container path nor asset serving —
 * which is most of what a request-time render has to get right.
 */
const FIXTURE = path.join(REPO, 'storage/sites', SLUG, 'draft')

/** Every text artifact under a rendered channel, keyed by its relative path. */
function textFiles(dir: string, prefix = ''): Map<string, string> {
  const out = new Map<string, string>()
  for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) =>
    a.name.localeCompare(b.name),
  )) {
    const rel = prefix === '' ? entry.name : `${prefix}/${entry.name}`
    // `assets/` is copied through byte-for-byte and is not part of the render:
    // the emitter never decides an asset's contents (DOC-28 §5.1).
    if (entry.isDirectory()) {
      if (entry.name !== 'assets') for (const [k, v] of textFiles(path.join(dir, entry.name), rel)) out.set(k, v)
      continue
    }
    out.set(rel, fs.readFileSync(path.join(dir, entry.name), 'utf8'))
  }
  return out
}

function loadDraft(cwd: string): LoadedSite {
  const result = loadSite({ cwd, root: 'sites' }, SLUG, 'draft')
  if (!result.ok) throw new Error(`fixture draft does not validate: ${JSON.stringify(result.errors)}`)
  return result.value
}

describe('REQ-119 request-time draft and edit renders', () => {
  let cwd: string
  let builder: BuilderHandle
  let assetName: string

  beforeAll(async () => {
    cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'req119-'))
    const site = path.join(cwd, 'storage', 'sites', SLUG)
    fs.mkdirSync(site, { recursive: true })
    fs.cpSync(FIXTURE, path.join(site, 'draft'), { recursive: true })
    fs.writeFileSync(path.join(site, 'history.json'), JSON.stringify({ revisions: [] }))

    const assets = path.join(site, 'draft', 'assets')
    assetName = fs.readdirSync(assets).sort()[0]
    expect(assetName, 'fixture must carry at least one asset').toBeTruthy()

    builder = await startBuilder({
      cwd,
      clientDir: path.join(REPO, 'apps/control-app/src/builder'),
    })
  }, 180000)

  afterAll(async () => {
    await builder?.close()
    if (cwd) fs.rmSync(cwd, { recursive: true, force: true })
  })

  const get = (p: string, init?: RequestInit) => fetch(new URL(p, builder.url), init)

  it('test_UAT_FC_REQ-119_one_render_implementation_backs_both_paths', async () => {
    // AC-3. The writer is compared to the render it writes: not "they agree on
    // the home page" but "the file set and every byte are the same object". A
    // second implementation could not satisfy this without being a copy, and a
    // copy is exactly what the AC forbids.
    const loaded = loadDraft(cwd)
    for (const edit of [false, true]) {
      const outDir = path.join(cwd, 'out', edit ? 'edit' : 'draft')
      const pages = await renderSite(loaded, outDir, { edit })
      // The same options `renderSite` supplies, which is what keeps this a
      // comparison of the two paths rather than of two configurations. There
      // used to be a third — `createContainer: astroContainer`, the injected
      // Astro seam REQ-145 introduced so this file could render a behavior
      // module without importing Astro. REQ-148 deleted the container and the
      // export with it (the name has resolved to `undefined` here ever since);
      // REQ-150 removed the dependency, so the seam is gone from the call too.
      const rendered = await renderSiteFiles(loaded, {
        edit,
        resolveModule: getModule,
      })

      expect(textFiles(outDir)).toEqual(new Map([...rendered.files]))
      // Every artifact, not just the pages — theme.css is where an L1 axis and a
      // token change actually land, and it is the file a second implementation
      // would be most likely to reproduce approximately.
      expect([...rendered.files.keys()]).toContain('theme.css')
      expect(pages).toEqual(
        [...rendered.files.keys()].filter((f) => f.endsWith('.html')).sort(),
      )
    }
  }, 180000)

  it('test_UAT_FC_REQ-119_request_time_bytes_are_the_build_time_bytes', async () => {
    // AC-2, over the wire. Verified by comparison against `1c render`'s own
    // output for the same definition, for both draft-side channels and for
    // every artifact each one contains — including the edit channel, whose
    // whole point is that it renders the same document differently.
    for (const channel of ['draft', 'edit'] as const) {
      const { outDir } = await cmdRender(SLUG, { cwd, edit: channel === 'edit' })
      const onDisk = textFiles(outDir)
      expect(onDisk.size, channel).toBeGreaterThan(2)

      for (const [rel, text] of onDisk) {
        const res = await get(`/preview/${SLUG}/${channel}/${rel}`)
        expect(res.status, `${channel}/${rel}`).toBe(200)
        expect(await res.text(), `${channel}/${rel}`).toBe(text)
      }
      // The URL the iframe actually loads is a directory, not `index.html`.
      const root = await get(`/preview/${SLUG}/${channel}/`)
      expect(await root.text(), channel).toBe(onDisk.get('index.html'))
    }
  }, 180000)

  it('test_UAT_FC_REQ-119_channels_render_with_no_artifact_on_disk', async () => {
    // AC-1. The previous suite left a rendered tree behind, so the only honest
    // way to show the request no longer needs one is to delete it and ask again.
    fs.rmSync(path.join(cwd, 'storage', 'dist'), { recursive: true, force: true })

    for (const channel of ['draft', 'edit'] as const) {
      const res = await get(`/preview/${SLUG}/${channel}/`)
      expect(res.status, channel).toBe(200)
      const html = await res.text()
      expect(html, channel).toContain('<html')
      // A real page, not an empty shell: the site's own copy is in it.
      expect(html, channel).toContain('</body>')
      // And the stylesheet it references resolves over the same origin.
      const css = await get(`/preview/${SLUG}/${channel}/theme.css`)
      expect(css.status, channel).toBe(200)
      expect(css.headers.get('content-type'), channel).toContain('text/css')
    }

    // Assets are served from the definition's own `assets/`, so a page is whole
    // rather than a document with broken references.
    const asset = await get(`/preview/${SLUG}/draft/assets/${assetName}`)
    expect(asset.status).toBe(200)

    // Still nothing materialised. A render that quietly wrote the channel out on
    // first request would pass every assertion above and reintroduce exactly the
    // artifact this ticket removes.
    expect(fs.existsSync(path.join(cwd, 'storage', 'dist'))).toBe(false)
  }, 180000)

  it('test_UAT_FC_REQ-119_a_definition_change_needs_no_render_step', async () => {
    // The staleness class, closed. Before this ticket the served bytes were
    // whatever the last `1c render` produced, so a change made anywhere but the
    // builder's own save path was invisible until someone re-rendered — and
    // nothing on screen said so.
    const pagePath = path.join(cwd, 'storage', 'sites', SLUG, 'draft', 'pages', 'home.json')
    const before = fs.readFileSync(pagePath, 'utf8')
    const marker = 'Edited out of band 119'
    const page = JSON.parse(before) as { seoMeta?: { title?: string }; title: string }
    page.seoMeta = { ...page.seoMeta, title: marker }
    fs.writeFileSync(pagePath, JSON.stringify(page, null, 2))

    try {
      for (const channel of ['draft', 'edit'] as const) {
        expect(await (await get(`/preview/${SLUG}/${channel}/`)).text(), channel).toContain(marker)
      }
    } finally {
      fs.writeFileSync(pagePath, before)
    }

    // And it goes back, so the cache is keyed on the definition rather than
    // warmed once and held.
    expect(await (await get(`/preview/${SLUG}/draft/`)).text()).not.toContain(marker)
  }, 180000)

  it('test_UAT_FC_REQ-119_an_invalid_draft_is_reported_not_papered_over', async () => {
    // The one failure on this route the operator can fix. Serving off disk hid
    // it: a broken edit left the last good render in place, so the iframe went
    // on showing a page that no longer described the definition, indefinitely.
    const sitePath = path.join(cwd, 'storage', 'sites', SLUG, 'draft', 'site.json')
    const before = fs.readFileSync(sitePath, 'utf8')
    const broken = JSON.parse(before) as Record<string, unknown>
    delete broken.theme
    fs.writeFileSync(sitePath, JSON.stringify(broken, null, 2))

    try {
      const res = await get(`/preview/${SLUG}/draft/`)
      expect(res.status).toBe(500)
      // In the iframe, as a page — and naming the field, so it is actionable.
      expect(res.headers.get('content-type')).toContain('text/html')
      expect(await res.text()).toContain('theme')
    } finally {
      fs.writeFileSync(sitePath, before)
    }

    // Recovers on the next request, with no restart and no manual re-render.
    expect((await get(`/preview/${SLUG}/draft/`)).status).toBe(200)
  }, 180000)

  it('test_UAT_FC_REQ-119_published_still_comes_from_the_publish_render', async () => {
    // AC-4. `published` is the immutable artifact a locked revision produced.
    // Deriving it from today's draft — the easy way to make one code path serve
    // all three channels — would put unpublished work on the published URL.
    const { outDir } = await cmdPublish(SLUG, { cwd, message: 'req119' })
    const published = path.join(outDir, 'index.html')
    expect(fs.existsSync(published)).toBe(true)
    const artifact = fs.readFileSync(published, 'utf8')

    // The builder REDIRECTS the published channel to public-site (REQ-149 D4)
    // rather than serving it: one serving path for published bytes.
    const redirected = await get(`/preview/${SLUG}/published/`, { redirect: 'manual' })
    expect(redirected.status).toBe(302)
    expect(redirected.headers.get('location')).toBe(`https://1stcontact.io/site/${SLUG}/`)

    // Now move the draft. The draft-side channels follow it; published does not.
    const pagePath = path.join(cwd, 'storage', 'sites', SLUG, 'draft', 'pages', 'home.json')
    const before = fs.readFileSync(pagePath, 'utf8')
    const marker = 'Unpublished work 119'
    const page = JSON.parse(before) as { seoMeta?: { title?: string } }
    page.seoMeta = { ...page.seoMeta, title: marker }
    fs.writeFileSync(pagePath, JSON.stringify(page, null, 2))

    try {
      expect(await (await get(`/preview/${SLUG}/draft/`)).text()).toContain(marker)
      // The published ARTIFACT is what a visitor gets, and it did not move with
      // the draft — asserted against the bytes rather than a response, since the
      // builder no longer serves them.
      expect(fs.readFileSync(published, 'utf8')).not.toContain(marker)
      expect(fs.readFileSync(published, 'utf8')).toBe(artifact)
    } finally {
      fs.writeFileSync(pagePath, before)
    }
  }, 180000)

  it('test_UAT_FC_REQ-119_the_iframe_source_contract_is_unchanged', async () => {
    // AC-5. A mode change swaps the panel's source; it does not rebuild the pane
    // (DOC-8 §3.2). So the runtime move must be invisible to the client: the
    // same two URLs, built the same way, from the untouched builder source.
    const api = fs.readFileSync(
      path.join(REPO, 'apps/control-app/src/builder/api.js'),
      'utf8',
    )
    expect(api).toContain('`/preview/${encodeURIComponent(slug)}/${encodeURIComponent(channel)}/`')

    const app = fs.readFileSync(path.join(REPO, 'apps/control-app/src/builder/app.js'), 'utf8')
    expect(app).toContain("previewUrl(site, 'draft')")
    expect(app).toContain("previewUrl(site, 'edit')")
  })

  it('test_UAT_FC_REQ-119_a_preview_url_cannot_reach_outside_the_channel', async () => {
    // Rendered artifacts are looked up in a map, so a page cannot be traversed
    // to. Assets are the one thing still resolved on disk, and therefore the one
    // place a `..` could reach the operator's store.
    for (const p of [
      `/preview/${SLUG}/draft/assets/../../site.json`,
      `/preview/${SLUG}/draft/assets/..%2f..%2fsite.json`,
      `/preview/${SLUG}/draft/nope.html`,
      `/preview/no-such-site/draft/`,
    ]) {
      const res = await get(p)
      expect(res.status, p).toBe(404)
      expect(await res.text(), p).not.toContain('"theme"')
    }
  })
})

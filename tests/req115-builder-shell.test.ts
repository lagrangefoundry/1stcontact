/**
 * REQ-115 — the builder shell (DOC-28 §12 T1).
 *
 * Exercised through real entry points: the builder origin over HTTP, the
 * `control-app` Worker under `unstable_dev`, and the browser composition mounted
 * against the actually-installed shared `webui-*` components in jsdom. No
 * webui component is mocked — mocking them would prove nothing about the
 * consumption route, which is most of this ticket's risk.
 */

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { unstable_dev, type UnstableDevWorker } from 'wrangler'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'
// REQ-147 made the control app PRIVATE: the front verifies a Cloudflare Access
// JWT before it proxies. What this AC pins — one host, same origin, verbatim —
// is what an ADMITTED caller receives, so the caller here is admitted.
import { startAccessTeam, type AccessTeam } from './support/access'
import {
  chromeHtml,
  cmdNew,
  cmdRender,
  cmdRevisions,
  startBuilder,
  webuiExports,
  webuiPackageDir,
  WEBUI_PACKAGES,
  WEBUI_SCOPE,
  type BuilderHandle,
} from '../tools/generate/src/cli'

const REPO = path.resolve(__dirname, '..')

if (!WEBUI_INSTALLED) console.warn(`REQ-115 origin suites skipped: ${WEBUI_SKIP_REASON}`)

/** A throwaway store with two real, rendered sites. */
async function makeWorkspace(): Promise<string> {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'req115-'))
  for (const slug of ['alpha', 'beta']) {
    cmdNew(slug, { cwd })
    await cmdRender(slug, { cwd, source: 'draft' })
  }
  return cwd
}

describe.skipIf(!WEBUI_INSTALLED)('REQ-115 builder origin', () => {
  let cwd: string
  let builder: BuilderHandle

  beforeAll(async () => {
    cwd = await makeWorkspace()
    builder = await startBuilder({ cwd, clientDir: path.join(REPO, 'apps/control-app/src/builder') })
  })

  afterAll(async () => {
    await builder?.close()
    if (cwd) fs.rmSync(cwd, { recursive: true, force: true })
  })

  const get = (p: string, init?: RequestInit) => fetch(new URL(p, builder.url), init)

  it('test_UAT_FC_REQ-115_site_selector_lists_the_store', async () => {
    const res = await get('/api/sites')
    expect(res.status).toBe(200)
    const sites = (await res.json()) as { slug: string }[]
    // Derived from the store, never a hardcoded list (AC 6).
    expect(sites.map((s) => s.slug).sort()).toEqual(['alpha', 'beta'])
  })

  it('test_UAT_FC_REQ-115_view_mode_serves_a_real_rendered_site', async () => {
    const res = await get('/preview/alpha/draft/')
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('text/html')
    const html = await res.text()
    // The bytes are the rendered draft on disk, not a stub.
    const onDisk = fs.readFileSync(
      path.join(cwd, 'storage/dist/sites/alpha/draft/index.html'),
      'utf8',
    )
    expect(html).toBe(onDisk)

    // Every site in the store is reachable the same way (AC 6).
    expect((await get('/preview/beta/draft/')).status).toBe(200)
    // An unknown channel is refused rather than silently resolved.
    expect((await get('/preview/alpha/bogus/')).status).toBe(404)
  })

  it('test_UAT_FC_REQ-115_webui_components_are_served_not_vendored', async () => {
    // The consumption route (AC 1): the bytes the browser loads are the bytes
    // Node resolves from the shared artifact store — byte-identical, and outside
    // this repo.
    for (const name of WEBUI_PACKAGES) {
      const entry = webuiExports(name)['.'].replace(/^\.\//, '')
      const res = await get(`/webui/${name}/${entry}`)
      expect(res.status, name).toBe(200)
      const served = await res.text()
      expect(served).toBe(fs.readFileSync(path.join(webuiPackageDir(name), entry), 'utf8'))
      // Nothing was copied in.
      expect(webuiPackageDir(name).startsWith(REPO + path.sep)).toBe(false)
    }
    expect((await get('/webui/webui-nonexistent/src/index.js')).status).toBe(404)
  })

  it('test_UAT_FC_REQ-115_chrome_import_map_is_derived_from_package_exports', async () => {
    const res = await get('/')
    expect(res.status).toBe(200)
    const html = await res.text()
    const map = JSON.parse(
      /<script type="importmap">(.*?)<\/script>/s.exec(html)![1],
    ) as { imports: Record<string, string> }
    for (const name of WEBUI_PACKAGES) {
      const declared = webuiExports(name)['.'].replace(/^\.\//, '')
      // Composed from the single scope declaration, not restated: AC-960
      // (story-e674c60a) brings the component scope under the one-definition
      // rule, so a literal here would be a second copy free to drift.
      expect(map.imports[`${WEBUI_SCOPE}/${name}`]).toBe(`/webui/${name}/${declared}`)
      // The map points at something that actually resolves.
      expect((await get(map.imports[`${WEBUI_SCOPE}/${name}`])).status).toBe(200)
    }
    expect(chromeHtml()).toBe(html)
  })

  it('test_UAT_FC_REQ-115_publish_creates_a_revision_through_the_existing_path', async () => {
    expect(cmdRevisions('alpha', { cwd })).toHaveLength(0)

    const res = await get('/api/publish', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ slug: 'alpha', message: 'first' }),
    })
    expect(res.status).toBe(200)
    expect(await res.json()).toMatchObject({ id: 1 })

    // The existing DOC-12 publish ran: history appended, revision locked, and
    // the published channel rendered and served.
    const revisions = cmdRevisions('alpha', { cwd })
    expect(revisions).toHaveLength(1)
    expect(revisions[0]).toMatchObject({ id: 1, message: 'first' })
    expect(fs.existsSync(path.join(cwd, 'storage/sites/alpha/revisions/0001'))).toBe(true)
    expect((await get('/preview/alpha/published/')).status).toBe(200)

    // A malformed call changes nothing.
    expect((await get('/api/publish', { method: 'POST', body: '{}' })).status).toBe(400)
    expect(cmdRevisions('alpha', { cwd })).toHaveLength(1)
  })

  it('test_UAT_FC_REQ-115_static_trees_refuse_traversal', async () => {
    for (const p of [
      '/preview/alpha/draft/../../../../../etc/passwd',
      '/webui/webui-shell/../../../../etc/passwd',
      '/builder/../../../package.json',
    ]) {
      const res = await get(p)
      expect([403, 404], p).toContain(res.status)
    }
  })
})

describe.skipIf(!WEBUI_INSTALLED)('REQ-115 control-app front', () => {
  let cwd: string
  let builder: BuilderHandle
  let worker: UnstableDevWorker
  let access: AccessTeam
  let admitted: Record<string, string>

  beforeAll(async () => {
    cwd = await makeWorkspace()
    builder = await startBuilder({ cwd, clientDir: path.join(REPO, 'apps/control-app/src/builder') })
    access = await startAccessTeam()
    admitted = await access.headers()
    worker = await unstable_dev('apps/control-app/src/index.ts', {
      config: 'apps/control-app/wrangler.toml',
      vars: {
        BUILDER_ORIGIN: builder.url.replace(/\/$/, ''),
        ACCESS_TEAM_DOMAIN: access.teamDomain,
        ACCESS_AUD: access.aud,
      },
      experimental: { disableExperimentalWarning: true },
    })
  })

  afterAll(async () => {
    await worker?.stop()
    await builder?.close()
    await access?.close()
    if (cwd) fs.rmSync(cwd, { recursive: true, force: true })
  })

  /**
   * Supersedes `test_UAT_FC_REQ-1_control_app_returns_placeholder`. `/` is now
   * the builder, not the placeholder string — the placeholder existed only until
   * something real occupied the route.
   */
  it('test_UAT_FC_REQ-115_control_app_fronts_the_builder_same_origin', async () => {
    const res = await worker.fetch('/', { headers: admitted })
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('text/html')
    expect(await res.text()).toBe(chromeHtml())

    // Same host serves the API and the rendered channels, so the iframe is
    // same-origin and open-in-new-tab lands on the identical document.
    const sites = (await (await worker.fetch('/api/sites', { headers: admitted })).json()) as {
      slug: string
    }[]
    expect(sites.map((s) => s.slug).sort()).toEqual(['alpha', 'beta'])
    expect((await worker.fetch('/preview/alpha/draft/', { headers: admitted })).status).toBe(200)
    expect(
      (await worker.fetch('/webui/webui-shell/src/index.js', { headers: admitted })).status,
    ).toBe(200)

    // The same host, to a caller Access has NOT admitted, is not a host at all
    // (REQ-147): being one origin is what makes the iframe same-origin, and the
    // gate is what makes that origin private.
    expect((await worker.fetch('/')).status).toBe(401)
  })
})

describe('REQ-115 consumption route', () => {
  it('test_UAT_FC_REQ-115_absent_component_names_the_install_command', () => {
    // Upstream's install is deliberate and the dependency is implicit, so a
    // fresh clone gets nothing "with no diagnostic pointing here". This is that
    // diagnostic, and it is the single resolution point for every consumer.
    let err: Error | null = null
    try {
      webuiPackageDir('webui-does-not-exist')
    } catch (e) {
      err = e as Error
    }
    expect(err).toBeTruthy()
    expect(err!.name).toBe('MissingWebuiComponentError')
    expect(err!.message).toContain('lagrange-framework')
    expect(err!.message).toContain('bin/install')
    expect(err!.message).toContain('webui-does-not-exist')
  })

  it('test_UAT_FC_REQ-115_no_webui_source_is_vendored_into_this_repo', () => {
    // AC 1 — copying is rejected: it forks the shell and guarantees divergence.
    const offenders: string[] = []
    for (const root of ['apps', 'packages', 'tools']) {
      for (const file of walk(path.join(REPO, root))) {
        if (/mountShell|mountSplit/.test(fs.readFileSync(file, 'utf8'))) {
          // Importing them is the point; defining them here would be the fork.
          const text = fs.readFileSync(file, 'utf8')
          if (/(export\s+function|function)\s+(mountShell|mountSplit)\s*\(/.test(text)) {
            offenders.push(path.relative(REPO, file))
          }
        }
      }
    }
    expect(offenders).toEqual([])
  })
})

describe('REQ-115 naming', () => {
  it('test_UAT_FC_REQ-115_tab_label_has_exactly_one_definition_site', () => {
    // AC 3: the label is provisional, so changing it must be a one-line edit.
    // The id is what code addresses; the label must never be a repeated literal.
    const { SITE_TAB } = requireConfig()
    const roots = ['apps', 'tools', 'packages']
    const hits: string[] = []
    for (const root of roots) {
      for (const file of walk(path.join(REPO, root))) {
        const text = fs.readFileSync(file, 'utf8')
        for (const [i, line] of text.split('\n').entries()) {
          if (line.includes(`'${SITE_TAB.label}'`) || line.includes(`"${SITE_TAB.label}"`)) {
            hits.push(`${path.relative(REPO, file)}:${i + 1}`)
          }
        }
      }
    }
    expect(hits).toHaveLength(1)
    expect(hits[0]).toMatch(/^apps\/control-app\/src\/builder\/config\.js:\d+$/)

    // …and that one site is the SITE_TAB declaration itself, so changing it
    // there changes every rendered occurrence.
    const line = Number(hits[0].split(':')[1])
    const configSrc = fs
      .readFileSync(path.join(REPO, 'apps/control-app/src/builder/config.js'), 'utf8')
      .split('\n')
    expect(configSrc[line - 1]).toContain('export const SITE_TAB')
  })
})

function requireConfig(): { SITE_TAB: { id: string; label: string } } {
  const src = fs.readFileSync(
    path.join(REPO, 'apps/control-app/src/builder/config.js'),
    'utf8',
  )
  // Only `id` and `label` are captured, but the object is free to carry more
  // (REQ-117 added `fill`). Anchoring on `' }` made an unrelated tab option a
  // failure in the NAMING suite, which is not what this test is about.
  const m = /export const SITE_TAB = \{ id: '([^']+)', label: '([^']+)'/.exec(src)!
  return { SITE_TAB: { id: m[1], label: m[2] } }
}

function* walk(dir: string): Generator<string> {
  if (!fs.existsSync(dir)) return
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) yield* walk(full)
    else if (/\.(ts|js|mjs|astro|html)$/.test(entry.name)) yield full
  }
}

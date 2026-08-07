/**
 * story-e674c60a — **the builder workspace, origin side**: one browser surface
 * showing the operator's real rendered site, served from a single origin.
 *
 * These UATs drive real entry points only — the builder origin over HTTP
 * (`startBuilder`), the `control-app` Worker under `unstable_dev`, and the
 * `1c` command functions that produce what the origin serves. Nothing reaches
 * into a handler directly: every claim here is about bytes a browser is handed.
 *
 * THE COMPONENT DEPENDENCY IS IMPLICIT, and that is a stated coverage gap
 * (story Technical Context). The `@gendevlabs/webui-*` components arrive from an
 * out-of-band install into a shared artifact store, so a fresh clone has none of
 * them. Suites that need them skip with a reported reason; the criteria with a
 * substantial component-independent core (AC-961, AC-977, AC-978) assert that
 * core unconditionally and warn LOUDLY about the part they could not reach —
 * a green run that silently proved nothing would be worse than a reported gap.
 * Components are never mocked: mocking them would prove nothing about the
 * consumption route, which is most of this story's risk.
 */

import fs from 'node:fs'
import { createRequire } from 'node:module'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { unstable_dev, type UnstableDevWorker } from 'wrangler'
import { WEBUI_INSTALLED, WEBUI_SKIP_REASON } from './support/webui-installed'
import {
  chromeHtml,
  cmdNew,
  cmdPublish,
  cmdRender,
  startBuilder,
  webuiExports,
  webuiPackageDir,
  WEBUI_PACKAGES,
  type BuilderHandle,
} from '../tools/generate/src/cli'

const REPO = path.resolve(__dirname, '..')

if (!WEBUI_INSTALLED) console.warn(`story-e674c60a origin suites: ${WEBUI_SKIP_REASON}`)

/** A loud report for evidence this machine genuinely cannot produce. */
function unverified(what: string): void {
  console.warn(`story-e674c60a: ${what} NOT VERIFIED here — ${WEBUI_SKIP_REASON}`)
}

/**
 * A throwaway store with two real sites, each rendered in all three channels.
 * `published` comes from a real `cmdPublish`, so the channel AC-977 asks about
 * exists in the form the platform actually produces it.
 */
async function makeWorkspace(): Promise<string> {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'story-e674c60a-'))
  for (const slug of ['alpha', 'beta']) {
    cmdNew(slug, { cwd })
    await cmdRender(slug, { cwd, source: 'draft' })
    await cmdRender(slug, { cwd, edit: true })
  }
  return cwd
}

// ── the origin ───────────────────────────────────────────────────────────────

describe('story-e674c60a builder origin', () => {
  let cwd: string
  let builder: BuilderHandle

  beforeAll(async () => {
    cwd = await makeWorkspace()
    builder = await startBuilder({
      cwd,
      clientDir: path.join(REPO, 'apps/control-app/src/builder'),
    })
  }, 120000)

  afterAll(async () => {
    await builder?.close()
    if (cwd) fs.rmSync(cwd, { recursive: true, force: true })
  })

  const get = (p: string, init?: RequestInit) => fetch(new URL(p, builder.url), init)

  it('test_UAT_AC966_view_mode_serves_the_real_rendered_artifact_byte_identical', async () => {
    // AC-966 — the pane shows the operator's ACTUAL rendered site: the bytes on
    // the wire are the bytes on disk, not a placeholder, a re-generation, or a
    // differently-serialised copy.
    const res = await get('/preview/alpha/draft/')
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('text/html')

    const onDisk = fs.readFileSync(
      path.join(cwd, 'storage/dist/sites/alpha/draft/index.html'),
      'utf8',
    )
    expect(await res.text()).toBe(onDisk)

    // The assets the page references resolve over the SAME origin, so the
    // rendered document is whole rather than a shell with broken references.
    const assets = fs
      .readdirSync(path.join(cwd, 'storage/dist/sites/alpha/draft'))
      .filter((f) => /\.(css|js)$/.test(f))
    expect(assets.length).toBeGreaterThan(0)
    for (const asset of assets) {
      const assetRes = await get(`/preview/alpha/draft/${asset}`)
      expect(assetRes.status, asset).toBe(200)
      expect(await assetRes.text()).toBe(
        fs.readFileSync(path.join(cwd, 'storage/dist/sites/alpha/draft', asset), 'utf8'),
      )
    }
  })

  /**
   * AC-972 lives in `reconciliation-builder-workspace-mounted.test.ts`.
   *
   * Its load-bearing clause is that publish acts on the site the pane is
   * DISPLAYING, which cannot be shown from here: proving it means clicking the
   * workspace's own control, and this file has no DOM. That suite starts the
   * same real origin under jsdom and keeps every assertion this one used to
   * make, so nothing moved out of the unconditional path.
   */

  it('test_UAT_AC979_unknown_channel_or_component_is_answered_as_not_found', async () => {
    // AC-979 — never satisfied from a neighbouring directory, never a success
    // status with unrelated content.
    const validPage = fs.readFileSync(
      path.join(cwd, 'storage/dist/sites/alpha/draft/index.html'),
      'utf8',
    )

    const channelRes = await get('/preview/alpha/bogus-channel/')
    expect(channelRes.status).toBe(404)
    const channelBody = await channelRes.text()
    expect(channelBody).not.toContain('<html')
    // Not answered out of the neighbouring `draft` directory next door.
    expect(channelBody).not.toContain(validPage.slice(0, 40))

    const componentRes = await get('/webui/webui-not-consumed/src/index.js')
    expect(componentRes.status).toBe(404)
    const componentBody = await componentRes.text()
    expect(componentBody.length).toBeLessThan(64)
    if (WEBUI_INSTALLED) {
      const shellEntry = webuiExports('webui-shell')['.'].replace(/^\.\//, '')
      const shellBytes = fs.readFileSync(
        path.join(webuiPackageDir('webui-shell'), shellEntry),
        'utf8',
      )
      expect(componentBody).not.toContain(shellBytes.slice(0, 40))
    }
  })

  it('test_UAT_AC978_every_served_tree_never_satisfies_a_request_that_escapes_it', async () => {
    // AC-978 — a request resolving outside a served tree is never satisfied:
    // the targeted file's contents never come back, and the outcome is the same
    // on every tree, so the confinement cannot be present on one tree and
    // missing on another. Percent-encoded forms are included because they are
    // the form a naive decode-then-join misses.
    //
    // The status is deliberately NOT pinned to `forbidden`. Confinement is by
    // clamping — every served path arrives root-relative, and normalising a
    // root-relative path drops its leading traversal segments — so an escaping
    // request resolves to a path that does not exist INSIDE the tree and is
    // answered as not found. Pinning 403 would document an aspiration rather
    // than the shipped behaviour; what must hold is non-delivery, uniformly.
    const trees: { tree: string; probes: string[]; secret: string }[] = [
      {
        tree: 'rendered channels',
        probes: [
          '/preview/alpha/draft/../../../../../../etc/passwd',
          '/preview/alpha/draft/%2e%2e/%2e%2e/%2e%2e/%2e%2e/%2e%2e/%2e%2e/etc/passwd',
          '/preview/alpha/draft/..%2f..%2f..%2f..%2f..%2f..%2fetc/passwd',
        ],
        secret: 'root:',
      },
      {
        tree: "the workspace's own browser source",
        probes: [
          '/builder/../../../package.json',
          '/builder/%2e%2e/%2e%2e/%2e%2e/package.json',
          '/builder/..%2f..%2f..%2fpackage.json',
        ],
        secret: '"packageManager"',
      },
    ]

    if (WEBUI_INSTALLED) {
      trees.push({
        tree: 'the installed components',
        probes: [
          '/webui/webui-shell/../../../../../../etc/passwd',
          '/webui/webui-shell/%2e%2e/%2e%2e/%2e%2e/%2e%2e/%2e%2e/%2e%2e/etc/passwd',
          '/webui/webui-shell/..%2f..%2f..%2f..%2f..%2f..%2fetc/passwd',
        ],
        secret: 'root:',
      })
    } else {
      unverified('the confinement of the installed-components tree')
    }

    const statuses = new Set<number>()
    for (const { tree, probes, secret } of trees) {
      for (const probe of probes) {
        const res = await get(probe)
        // Never satisfied: not a success, and none of the targeted file's bytes.
        expect(res.ok, `${tree}: ${probe}`).toBe(false)
        expect(res.status, `${tree}: ${probe}`).toBeGreaterThanOrEqual(400)
        expect(await res.text(), `${tree}: ${probe}`).not.toContain(secret)
        statuses.add(res.status)
      }
    }

    // Identical across every tree — the property that makes "no tree lacks the
    // confinement" observable rather than asserted three times independently.
    expect([...statuses], 'one refusal, every tree alike').toHaveLength(1)
  })

  it('test_UAT_AC977_every_response_the_origin_returns_is_non_cacheable', async () => {
    // AC-977 — the origin rewrites its own bytes underneath the browser, so a
    // single cacheable response leaves an operator looking at a stale page that
    // appears to be working. There is no exempt response.
    // Asserted on the header alone, and deliberately NOT on the status: the
    // claim is about every response, and the refusals (a bad address, an
    // unknown channel, a route that does not exist) are exactly the ones a
    // 200-only probe would skip past.
    const noStore = async (route: string, init?: RequestInit) => {
      const res = await get(route, init)
      expect(res.headers.get('cache-control'), route).toMatch(/no-store/)
      return res
    }
    const ok = async (route: string, init?: RequestInit) => {
      const res = await noStore(route, init)
      expect(res.status, route).toBe(200)
    }

    // The browser source, and a rendered page in EACH channel.
    await ok('/builder/main.js')
    await ok('/builder/builder.css')
    await ok('/preview/alpha/draft/')
    await ok('/preview/alpha/edit/')
    await cmdPublish('alpha', { cwd })
    await ok('/preview/alpha/published/')

    // The bridge served to the browser: its own route, transpiled per request,
    // travelling neither the file-sending path nor the JSON one.
    await ok('/framework/edit-client.js')
    await ok('/framework/site-schema-edit.js')

    // The operations, which answer JSON rather than bytes off disk. They are as
    // perishable as the renders: `/api/copy` GET is the field values the modal
    // is about to display, and `/api/sites` is the selector's listing.
    await ok('/api/sites')
    await ok('/api/assets?slug=alpha')
    await ok('/api/copy?slug=alpha&page=home&path=0')

    // And the refusals — the error envelope the modal reads, and the plain-text
    // dead ends. A stale refusal is a refusal the operator cannot clear.
    expect((await noStore('/api/assets')).status, '/api/assets no slug').toBe(400)
    expect((await noStore('/api/copy?slug=alpha')).status, '/api/copy no page').toBe(400)
    expect((await noStore('/preview/alpha/nosuchchannel/')).status).toBe(404)
    expect((await noStore('/no/such/route')).status).toBe(404)
    expect((await noStore('/builder/no-such-file.js')).status).toBe(404)

    if (!WEBUI_INSTALLED) {
      unverified('the no-store directive on the workspace document and a served component')
      return
    }

    // The workspace document explicitly: it is hand-written and does NOT travel
    // the same file-sending path as everything else, so it is exactly the
    // response a blanket assumption would miss.
    await ok('/')
    for (const name of WEBUI_PACKAGES) {
      await ok(`/webui/${name}/${webuiExports(name)['.'].replace(/^\.\//, '')}`)
    }
    expect((await noStore('/webui/no-such-component/index.js')).status).toBe(404)
  })

  it('test_UAT_AC961_components_are_served_byte_identical_from_outside_this_repo', async () => {
    // AC-961 — consumed, never copied. The scan below is independent of whether
    // anything is installed, so it runs on every machine: it is the half that
    // catches a component being vendored in.
    const offenders: string[] = []
    for (const root of ['apps', 'packages', 'tools']) {
      for (const file of walk(path.join(REPO, root))) {
        const text = fs.readFileSync(file, 'utf8')
        // Importing them is the point; DEFINING one here would be the fork.
        if (/(export\s+)?function\s+(mountShell|mountSplit|mountFields)\s*\(/.test(text)) {
          offenders.push(path.relative(REPO, file))
        }
      }
    }
    expect(offenders).toEqual([])

    if (!WEBUI_INSTALLED) {
      unverified('the byte-identity of served components against the installed copy')
      return
    }

    for (const name of WEBUI_PACKAGES) {
      const entry = webuiExports(name)['.'].replace(/^\.\//, '')
      const res = await get(`/webui/${name}/${entry}`)
      expect(res.status, name).toBe(200)
      const installed = path.join(webuiPackageDir(name), entry)
      expect(await res.text(), name).toBe(fs.readFileSync(installed, 'utf8'))
      // The installed copy lives OUTSIDE this repository.
      expect(webuiPackageDir(name).startsWith(REPO + path.sep), name).toBe(false)
    }
  })

  it('test_UAT_AC963_chrome_references_each_component_by_its_declared_entry_point', async () => {
    // AC-963 — derived from each package's own `exports`, never a hardcoded
    // path, so an upstream file move is reported at the origin rather than
    // becoming a 404 in the browser.
    if (!WEBUI_INSTALLED) {
      unverified('the chrome import map (it cannot be built without the components)')
      return
    }
    const res = await get('/')
    expect(res.status).toBe(200)
    const html = await res.text()

    const map = JSON.parse(/<script type="importmap">(.*?)<\/script>/s.exec(html)![1]) as {
      imports: Record<string, string>
    }

    // Every declared entry point is referenced at the location the package
    // itself declares, and that reference actually resolves.
    const declared = new Set<string>()
    for (const name of WEBUI_PACKAGES) {
      for (const [subpath, target] of Object.entries(webuiExports(name))) {
        const url = `/webui/${name}/${target.replace(/^\.\//, '')}`
        declared.add(url)
        if (subpath === '.') expect(map.imports[`@gendevlabs/${name}`]).toBe(url)
        const served = await get(url)
        expect(served.status, url).toBe(200)
        expect(await served.text()).toBe(
          fs.readFileSync(
            path.join(webuiPackageDir(name), target.replace(/^\.\//, '')),
            'utf8',
          ),
        )
      }
    }

    // …and the document contains NO component path absent from those
    // declarations — a hardcoded `src/index.js` would show up right here.
    for (const ref of html.match(/\/webui\/[^"']+/g) ?? []) {
      expect(declared.has(ref), `${ref} is not a declared entry point`).toBe(true)
    }
  })
})

// ── the consumption route ────────────────────────────────────────────────────

describe('story-e674c60a component consumption route', () => {
  it('test_UAT_AC962_absent_component_names_the_component_and_the_install_command', () => {
    // AC-962 — the dependency is implicit and the install is deliberate, so a
    // machine that has not run it must get a diagnostic, not a module-resolution
    // error and not a workspace whose components 404 in the browser.
    let err: Error | null = null
    try {
      webuiPackageDir('webui-definitely-not-installed')
    } catch (e) {
      err = e as Error
    }
    expect(err).toBeTruthy()
    expect(err!.name).toBe('MissingWebuiComponentError')
    expect(err!.message).toContain('webui-definitely-not-installed')
    expect(err!.message).toContain('bin/install')
    expect(err!.message).toContain('--component webui-definitely-not-installed')
    // Not a bare resolver failure.
    expect(err!.message).not.toMatch(/Cannot find module|ERR_MODULE_NOT_FOUND/)

    // Raised at the SINGLE resolution point, so every consumer gets the same
    // diagnostic rather than a different error per call site. `webuiExports`
    // and `chromeHtml` both route through it.
    let viaExports: Error | null = null
    try {
      webuiExports('webui-definitely-not-installed')
    } catch (e) {
      viaExports = e as Error
    }
    expect(viaExports!.name).toBe('MissingWebuiComponentError')
    expect(viaExports!.message).toBe(err!.message)

    if (!WEBUI_INSTALLED) {
      // On this machine the real components are absent, so `chromeHtml` — the
      // other consumer — must produce that identical diagnostic too.
      let viaChrome: Error | null = null
      try {
        chromeHtml()
      } catch (e) {
        viaChrome = e as Error
      }
      expect(viaChrome!.name).toBe('MissingWebuiComponentError')
      expect(viaChrome!.message).toContain('bin/install')
    }
  })
})

// ── the single origin, fronted by the Worker ─────────────────────────────────

describe('story-e674c60a control-app front', () => {
  let cwd: string
  let builder: BuilderHandle
  let worker: UnstableDevWorker

  beforeAll(async () => {
    if (!WEBUI_INSTALLED) return
    cwd = await makeWorkspace()
    builder = await startBuilder({
      cwd,
      clientDir: path.join(REPO, 'apps/control-app/src/builder'),
    })
    worker = await unstable_dev('apps/control-app/src/index.ts', {
      config: 'apps/control-app/wrangler.toml',
      vars: { BUILDER_ORIGIN: builder.url.replace(/\/$/, '') },
      experimental: { disableExperimentalWarning: true },
    })
  }, 120000)

  afterAll(async () => {
    await worker?.stop()
    await builder?.close()
    if (cwd) fs.rmSync(cwd, { recursive: true, force: true })
  })

  it('test_UAT_AC964_one_host_answers_every_route_with_the_origin_response_verbatim', async () => {
    // AC-964 — the workspace document, its components, its browser source, the
    // rendered channels and its operations all come from ONE host, so the frame
    // showing a site is never a foreign document. The front reinterprets
    // nothing: status, content type and body are the origin's own.
    if (!WEBUI_INSTALLED) {
      unverified('the verbatim-forwarding comparison (the chrome route needs the components)')
      return
    }

    const routes = [
      '/', // the workspace document
      `/webui/webui-shell/${webuiExports('webui-shell')['.'].replace(/^\.\//, '')}`, // a component module
      '/preview/alpha/draft/', // a rendered page
      '/api/sites', // a listing response
    ]

    for (const route of routes) {
      const viaWorker = await worker.fetch(route)
      const direct = await fetch(new URL(route, builder.url))
      expect(viaWorker.status, route).toBe(direct.status)
      expect(viaWorker.headers.get('content-type'), route).toBe(
        direct.headers.get('content-type'),
      )
      expect(await viaWorker.text(), route).toBe(await direct.text())
    }

    // Same-origin by construction: the URL the pane displays is ROOT-RELATIVE,
    // so the frame's document URL can only ever be this same host.
    const { previewUrl } = (await import('../apps/control-app/src/builder/api.js')) as {
      previewUrl: (slug: string, channel: string) => string
    }
    expect(previewUrl('alpha', 'draft').startsWith('/')).toBe(true)
    expect(previewUrl('alpha', 'draft')).not.toMatch(/^https?:/)
    // …and that path is served by the very host serving the chrome.
    expect((await worker.fetch(previewUrl('alpha', 'draft'))).status).toBe(200)
  })
})

// ── the front's two failure modes ────────────────────────────────────────────

describe('story-e674c60a origin failure reporting', () => {
  it('test_UAT_AC965_unconfigured_and_unreachable_origins_are_distinct_failures', async () => {
    // AC-965 — neither condition returns a blank page nor a success status, and
    // the two are distinguishable, because "you never started it" and "it died"
    // need different actions from the operator.
    const unconfigured = await unstable_dev('apps/control-app/src/index.ts', {
      config: 'apps/control-app/wrangler.toml',
      vars: { BUILDER_ORIGIN: '' },
      experimental: { disableExperimentalWarning: true },
    })
    let unconfiguredStatus: number
    let unconfiguredBody: string
    try {
      const res = await unconfigured.fetch('/')
      unconfiguredStatus = res.status
      unconfiguredBody = await res.text()
    } finally {
      await unconfigured.stop()
    }

    expect(unconfiguredStatus).toBe(503)
    expect(unconfiguredBody).toContain('BUILDER_ORIGIN')
    // Names the command that starts the origin.
    expect(unconfiguredBody).toContain('1c builder')
    expect(unconfiguredBody.trim().length).toBeGreaterThan(0)

    const deadAddress = 'http://127.0.0.1:1'
    const unreachable = await unstable_dev('apps/control-app/src/index.ts', {
      config: 'apps/control-app/wrangler.toml',
      vars: { BUILDER_ORIGIN: deadAddress },
      experimental: { disableExperimentalWarning: true },
    })
    let unreachableStatus: number
    let unreachableBody: string
    try {
      const res = await unreachable.fetch('/')
      unreachableStatus = res.status
      unreachableBody = await res.text()
    } finally {
      await unreachable.stop()
    }

    expect(unreachableStatus).toBe(502)
    // The address that was tried, so the operator can check what is listening.
    expect(unreachableBody).toContain(deadAddress)
    expect(unreachableBody).toMatch(/unreachable/i)

    // Distinct from each other, and neither is a success.
    expect(unreachableStatus).not.toBe(unconfiguredStatus)
    expect(unconfiguredStatus).toBeGreaterThanOrEqual(400)
    expect(unreachableStatus).toBeGreaterThanOrEqual(400)
  }, 180000)
})

// ── the measurement, in a real browser ───────────────────────────────────────

/**
 * jsdom does no layout — every `getBoundingClientRect()` is zero, so a
 * layout-less environment cannot tell a filled pane from a collapsed one. Only
 * a real browser can answer AC-975, and where none can be launched the test
 * says so out loud rather than passing quietly.
 */
describe('story-e674c60a measured against a real browser', () => {
  let cwd: string
  let builder: BuilderHandle | undefined
  let chromium: typeof import('playwright').chromium | undefined

  beforeAll(async () => {
    if (!WEBUI_INSTALLED) return
    chromium = await loadChromium()
    if (!chromium) return
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

  it(
    'test_UAT_AC975_displayed_site_fills_the_window_and_the_page_never_scrolls',
    async () => {
      if (!WEBUI_INSTALLED) {
        unverified('the frame height measurement (the chrome needs the components)')
        return
      }
      if (!chromium || !builder) {
        console.warn(
          'story-e674c60a: frame measurement SKIPPED — playwright is not resolvable ' +
            'from tools/generate. The viewport-fill behaviour is unverified here.',
        )
        return
      }
      const browser = await launchAnyChromium(chromium)
      if (!browser) {
        console.warn(
          'story-e674c60a: frame measurement SKIPPED — no chromium build or system ' +
            'Chrome could be launched. The viewport-fill behaviour is unverified here.',
        )
        return
      }

      try {
        const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
        await page.goto(builder.url, { waitUntil: 'networkidle' })

        const frameHeight = () =>
          page.evaluate(() => {
            const el = document.querySelector('.builder-panel__frame')
            return el ? Math.round(el.getBoundingClientRect().height) : 0
          })

        // Nowhere near an iframe's 150px intrinsic height, and close to the
        // space available below the fixed chrome. A floor rather than an exact
        // value, so adding a toolbar control does not break the measurement.
        const tall = await frameHeight()
        expect(tall, 'the pane fills a 900px window').toBeGreaterThan(700)

        // Grows and shrinks WITH the window — tied to the viewport, not to a
        // constant that merely happens to be large.
        await page.setViewportSize({ width: 1280, height: 500 })
        const short = await frameHeight()
        expect(short, 'the pane shrinks with the window').toBeCloseTo(tall - 400, -1)
        await page.setViewportSize({ width: 1280, height: 1100 })
        expect(await frameHeight(), 'the pane grows with the window').toBeCloseTo(
          tall + 200,
          -1,
        )

        // The workspace page itself never scrolls: the site scrolls internally.
        // A document taller than its viewport means the height chain leaked.
        const overflow = await page.evaluate(
          () => document.documentElement.scrollHeight - document.documentElement.clientHeight,
        )
        expect(overflow, 'the workspace page itself never scrolls').toBe(0)
      } finally {
        await browser.close()
      }
    },
    180000,
  )
})

// ── helpers ──────────────────────────────────────────────────────────────────

/**
 * Playwright belongs to `tools/generate`, not to the root, so a bare
 * `import('playwright')` fails at TRANSFORM time — vite resolves the specifier
 * statically, which a try/catch cannot survive. Resolving through the owning
 * package and importing by file URL keeps the dependency where it lives.
 */
async function loadChromium(): Promise<typeof import('playwright').chromium | undefined> {
  try {
    const require = createRequire(path.join(REPO, 'tools/generate/package.json'))
    const entry = pathToFileURL(require.resolve('playwright')).href
    const mod = (await import(/* @vite-ignore */ entry)) as Record<string, never>
    // `require.resolve` lands on the CommonJS entry, so the namespace object is
    // `{ default: { chromium } }` rather than `{ chromium }`.
    return (mod.chromium ?? (mod.default as Record<string, never>)?.chromium) as never
  } catch {
    return undefined
  }
}

/**
 * Playwright refuses to launch a browser build other than the one pinned to its
 * own version, and the machine may only have a neighbouring build cached. Fall
 * back to the installed system Chrome — a real browser with a real layout
 * engine, which is all this measurement needs.
 */
async function launchAnyChromium(
  chromium: typeof import('playwright').chromium,
): Promise<import('playwright').Browser | undefined> {
  for (const opts of [{}, { channel: 'chrome' as const }]) {
    try {
      return await chromium.launch(opts)
    } catch {
      /* try the next one */
    }
  }
  return undefined
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

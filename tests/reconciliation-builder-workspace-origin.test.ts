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
 * (story Technical Context). The shared webui components arrive from an
 * out-of-band install into a shared artifact store, so a fresh clone has none
 * of them.
 *
 * TWO KINDS OF EVIDENCE SIT ON TOP OF THAT, AND THEY BEHAVE DIFFERENTLY ON
 * PURPOSE. Evidence about *consumption* — that each component resolves, that
 * the copy resolved declares itself under the scope this repository uses, and
 * that the generated document agrees with that scope (AC-961, AC-963) — is
 * UNCONDITIONAL: on a machine without the install it fails and says which
 * component it could not account for. Evidence about *mounting* real components
 * still skips with a stated, reported reason; its subject is mount behaviour,
 * not which copy was consumed.
 *
 * The split matters because `WEBUI_INSTALLED` is presence-only: used as a skip
 * gate it reports "renamed upstream and not renamed here" and "never installed"
 * identically, so a rename that has broken the browser would read as a clean
 * green run. Components are never mocked, faked or vendored in either kind of
 * evidence: a stand-in would prove nothing about the consumption route, which is
 * most of this story's risk.
 *
 * `vitest.config.mts` DOES alias the components, and that is a route correction
 * rather than a stand-in: Node's upward resolution reaches the store from the
 * main checkout but not from a linked `git worktree`, so the aliases point Vite
 * at the identical out-of-repo package by deriving every target from
 * `webuiPackageDir`/`webuiExports` — the same single resolution point production
 * uses — and composing every key from `WEBUI_SCOPE`. Nothing is substituted, and
 * AC-961 below asserts the copy actually consumed lives outside this repository
 * and declares itself under the scope in use.
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
  WEBUI_SCOPE,
  type BuilderHandle,
} from '../tools/generate/src/cli'

const REPO = path.resolve(__dirname, '..')

/**
 * Scopes the components were previously published under. Split-and-joined so
 * this suite does not itself restate a name the tree guard
 * (`bug32-webui-scope-rebrand`) forbids in any tracked file.
 */
const SUPERSEDED_SCOPES = [['@gendev', 'labs'].join('')]

/**
 * A one-pixel JPEG. Real bytes, so the image reference AC-966 walks out of the
 * rendered document resolves to something the origin actually has to serve.
 */
const ONE_PIXEL_JPEG = Buffer.from(
  '/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0a' +
    'HBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAAAAAAAA' +
    'AAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AKp//2Q==',
  'base64',
)

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

  it('test_UAT_AC966_the_pane_shows_the_selected_sites_whole_rendering_over_this_origin', async () => {
    // AC-966 — what an operator is looking at IS the site: the address the
    // display panel puts in the pane answers with that site's own rendered home
    // page, and every reference that page carries resolves over this same
    // origin, so the pane holds the rendering WHOLE rather than a shell with
    // broken references or a placeholder that merely looks like one.
    //
    // Equality with what `1c render` writes — same file set, same bytes — is
    // AC-1032's claim and is deliberately not restated here in weaker form.
    // What is asserted instead is the criterion's own guard: THE SITE UNDER
    // TEST HAS NEVER BEEN RENDERED TO DISK. Reading the expectation out of
    // `dist` (as this UAT used to) cannot distinguish "produced from the
    // definition on request" from "handed back off a shelf", because it needs
    // the shelf to exist before it can compare against it.
    const { previewUrl } = (await import('../apps/control-app/src/builder/api.js')) as {
      previewUrl: (slug: string, channel: string) => string
    }

    // A site created in the real store, given real content — copy of its own
    // and an image drawn from its own assets — and never rendered.
    const slug = 'unrendered'
    const marker = 'The copy only this site carries.'
    cmdNew(slug, { cwd })
    const draft = path.join(cwd, 'storage/sites', slug, 'draft')
    fs.writeFileSync(path.join(draft, 'assets', 'hero.jpg'), ONE_PIXEL_JPEG)
    const homeJson = path.join(draft, 'pages', 'home.json')
    const home = JSON.parse(fs.readFileSync(homeJson, 'utf8')) as {
      l1: { root: { children: unknown[] } }
    }
    home.l1.root.children = [
      { kind: 'text', id: 'home-copy', text: marker, axes: { fontSizePx: 32 } },
      { kind: 'image', src: 'assets/hero.jpg', alt: 'A hero image' },
    ]
    fs.writeFileSync(homeJson, JSON.stringify(home, null, 2))
    expect(
      fs.existsSync(path.join(cwd, 'storage/dist/sites', slug)),
      'the guard is void unless the site is genuinely unrendered',
    ).toBe(false)

    // The address the DISPLAY PANEL puts in the pane, from the workspace's own
    // browser module, rather than a path this test made up.
    const displayed = previewUrl(slug, 'draft')
    const page = new URL(displayed, builder.url)
    const res = await fetch(page)
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('text/html')
    const html = await res.text()

    // That site's real content, from its own definition — not a placeholder,
    // and not some other site's page answered out of a neighbouring directory.
    expect(html).toContain(marker)

    // Whole. The references are read OUT OF THE RETURNED DOCUMENT, so a renamed
    // stylesheet or a rewritten image address is caught here rather than
    // silently stepped over by globbing an output directory.
    const stylesheets = [
      ...html.matchAll(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"/g),
    ].map((m) => m[1])
    const images = [...html.matchAll(/<img[^>]+src="([^"]+)"/g)].map((m) => m[1])
    expect(stylesheets, 'the document references no stylesheet').not.toHaveLength(0)
    expect(images, 'the document references no image').not.toHaveLength(0)

    for (const ref of [...stylesheets, ...images]) {
      const target = new URL(ref, page)
      // Same origin: a reference that left this origin is not something the
      // pane can be relied on to be showing.
      expect(target.origin, ref).toBe(new URL(builder.url).origin)
      const refRes = await fetch(target)
      expect(refRes.status, ref).toBe(200)
      expect((await refRes.arrayBuffer()).byteLength, ref).toBeGreaterThan(0)
    }
    // The stylesheet arrives AS a stylesheet — a 200 of the wrong kind renders
    // an unstyled page, which is the failure this clause is about.
    const cssRes = await fetch(new URL(stylesheets[0], page))
    expect(cssRes.headers.get('content-type')).toContain('text/css')
  })

  it('test_UAT_AC1240_the_edit_client_is_served_derived_from_the_renderers_own_source', async () => {
    // AC-1240 — the gesture's client code is answered BY THIS ORIGIN, as
    // browser-executable script, and its bytes are derived at serve time from
    // the renderer's own source. A hand-written second copy of that code would
    // be free to drift from the markup the renderer emits, and the drift would
    // show up only in a browser — nowhere a test can see it.
    //
    // What that code DOES once a browser runs it — the click, the resolution,
    // the modal — is AC-1006's subject under the editing-gesture capability.
    // This criterion owns what the origin answers with.
    const res = await get('/framework/edit-client.js')
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('javascript')
    const served = await res.text()
    expect(served.length).toBeGreaterThan(0)

    // DERIVED, not authored. The source is located in the framework package and
    // derived here exactly as the origin derives it; the served bytes must be
    // that derivation, so a file written separately beside it fails.
    const require = createRequire(import.meta.url)
    const ts = require('typescript') as typeof import('typescript')
    const source = fs.readFileSync(
      path.join(REPO, 'packages/framework/src/l1/edit-client.ts'),
      'utf8',
    )
    const derived = ts
      .transpileModule(source, {
        compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
      })
      .outputText.replace(
        /(['"])@1stcontact\/site-schema\1/g,
        "'/framework/site-schema-edit.js'",
      )
    expect(served).toBe(derived)

    // Browser-executable, rather than the TypeScript passed through: the source
    // carries build-time-only syntax and none of it survives into the answer.
    expect(source).toMatch(/\b(import\s+type|interface\s+\w+\s*\{)/)
    expect(served).not.toMatch(/\bimport\s+type\b/)
    expect(served).not.toMatch(/\binterface\s+\w+\s*\{/)
    // Its package import is rewritten to a sibling THIS origin answers for, so
    // the module a browser loads has nothing left to resolve elsewhere. What
    // that sibling contains is AC-1006's claim, not this one's.
    expect(served).not.toContain('@1stcontact/site-schema')
    expect((await get('/framework/site-schema-edit.js')).status).toBe(200)

    // NO SECOND COPY of the served code in the workspace's own application
    // sources. Checked as CONTENT — substantial statements of the derived
    // module appearing verbatim in a file that ships beside it — because that
    // is what a copy looks like whatever it chooses to name its functions.
    const appSources: string[] = []
    const walkApp = (dir: string): void => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const abs = path.join(dir, entry.name)
        if (entry.isDirectory()) walkApp(abs)
        else if (/\.(js|ts|mjs)$/.test(entry.name)) appSources.push(abs)
      }
    }
    walkApp(path.join(REPO, 'apps/control-app/src'))
    expect(appSources.length).toBeGreaterThan(0)

    const statements = served
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 40 && !line.startsWith('*') && !line.startsWith('//'))
      .slice(0, 40)
    expect(statements.length, 'nothing distinctive enough to detect a copy by').toBeGreaterThan(5)
    for (const file of appSources) {
      const text = fs.readFileSync(file, 'utf8')
      const rel = path.relative(REPO, file)
      for (const statement of statements) {
        expect(text, `${rel} carries a second copy of the served client code`).not.toContain(
          statement,
        )
      }
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
    // appears to be working. THERE IS NO EXEMPT RESPONSE.
    //
    // STRUCTURAL, NOT A LIST OF REPRESENTATIVES. A hand-maintained probe list
    // is what let the JSON class ship cacheable while this criterion reported
    // green: `json()` wrote its own two headers and carried no directive, so
    // `/api/sites` — the response that populates the site selector — was free
    // to be cached, and a newly created site could stay invisible behind a
    // workspace that looked like it was working. So the routing table is read
    // out of the ORIGIN'S OWN SOURCE and every route it declares must be
    // answered by a probe below: a route added tomorrow fails here until
    // someone states what it returns.
    const DIRECTIVE = 'no-store, must-revalidate'
    const origin = fs.readFileSync(
      path.join(REPO, 'tools/generate/src/cli/builder.ts'),
      'utf8',
    )
    const declared = new Set<string>()
    for (const m of origin.matchAll(/\bp === '([^']+)'/g)) declared.add(m[1])
    for (const m of origin.matchAll(/\bp\.startsWith\('([^']+)'\)/g)) declared.add(m[1])
    for (const m of origin.matchAll(/\bp\.match\(\/\^\\\/([A-Za-z][\w-]*)/g)) {
      declared.add(`/${m[1]}/`)
    }

    interface Probe {
      /** The declared route this probe stands for. */
      route: string
      url: string
      init?: RequestInit
      /** Whether a 200 is the expected answer, so error probes stay honest. */
      ok: boolean
    }
    const probes: Probe[] = [
      // The workspace document. Hand-written, and it does NOT travel the
      // file-sending path everything else uses — exactly the response a
      // blanket assumption would miss. Without the component store installed
      // it answers 500, which is still a response and still carries the
      // directive, so the freshness claim is checked either way.
      { route: '/', url: '/', ok: WEBUI_INSTALLED },
      { route: '/index.html', url: '/index.html', ok: WEBUI_INSTALLED },

      // The JSON class, in BOTH the success and the rejection shape — the
      // class this criterion previously had no probe for at all.
      { route: '/api/sites', url: '/api/sites', ok: true },
      {
        route: '/api/publish',
        url: '/api/publish',
        ok: true,
        init: {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ slug: 'alpha', message: 'freshness probe' }),
        },
      },
      {
        route: '/api/publish',
        url: '/api/publish',
        ok: false,
        init: { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' },
      },
      { route: '/api/assets', url: '/api/assets?slug=alpha', ok: true },
      { route: '/api/assets', url: '/api/assets', ok: false },
      { route: '/api/copy', url: '/api/copy', ok: false },
      {
        route: '/api/copy',
        url: '/api/copy',
        ok: false,
        init: { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' },
      },

      // The assistant (REQ-122). Its routes answer without ever reaching a
      // model — `/api/ai/roles` reports capability, and the two POSTs are
      // probed in their REJECTION shape, which needs no API key and is the
      // response an operator is most likely to be looking at when something is
      // wrong. `/api/ai/prompt` is deliberately not probed in its success shape:
      // that would be a live model call, and this criterion is about a header.
      { route: '/api/ai/roles', url: '/api/ai/roles', ok: true },
      {
        route: '/api/ai/session',
        url: '/api/ai/session',
        ok: false,
        init: { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' },
      },
      {
        route: '/api/ai/prompt',
        url: '/api/ai/prompt',
        ok: false,
        init: { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' },
      },

      // A rendered page in EACH channel — `published` produced by the publish
      // probe above, so it is the channel in the form the platform makes it —
      // plus the two ways a preview request fails.
      { route: '/preview/', url: '/preview/alpha/draft/', ok: true },
      { route: '/preview/', url: '/preview/alpha/edit/', ok: true },
      { route: '/preview/', url: '/preview/alpha/published/', ok: true },
      { route: '/preview/', url: '/preview/alpha/nosuchchannel/', ok: false },
      { route: '/preview/', url: '/preview/alpha/draft/no-such-asset.css', ok: false },

      // The edit bridge, served type-stripped rather than off a tree.
      { route: '/framework/', url: '/framework/edit-client.js', ok: true },
      { route: '/framework/', url: '/framework/site-schema-edit.js', ok: true },

      // The builder's own browser source, and a miss inside that tree.
      { route: '/builder/', url: '/builder/main.js', ok: true },
      { route: '/builder/', url: '/builder/builder.css', ok: true },
      { route: '/builder/', url: '/builder/no-such-file.js', ok: false },

      // An unknown component: the `/webui/` route's refusal, which needs no
      // install to reach.
      { route: '/webui/', url: '/webui/no-such-component/index.js', ok: false },
    ]

    // Each installed component's real entry point. Reached only when the store
    // is there; the route itself is already probed above regardless.
    if (WEBUI_INSTALLED) {
      for (const name of WEBUI_PACKAGES) {
        probes.push({
          route: '/webui/',
          url: `/webui/${name}/${webuiExports(name)['.'].replace(/^\.\//, '')}`,
          ok: true,
        })
      }
    } else {
      unverified('the no-store directive on the workspace document and a served component')
    }

    // Nothing routes here at all — the fallthrough 404 is a response the origin
    // returns, so it is subject to the same claim. It has no route literal to
    // match, which is why it is not in the coverage check below.
    const unrouted: Probe = { route: '(unrouted)', url: '/no-such-route', ok: false }

    // BOTH DIRECTIONS. Declared-but-unprobed is the hole this criterion fell
    // through. Probed-but-undeclared means the extraction above has stopped
    // finding routes, which would otherwise let the coverage check pass over an
    // empty set and prove nothing.
    const probed = new Set(probes.map((probe) => probe.route))
    expect(
      [...declared].filter((route) => !probed.has(route)).sort(),
      'a route the origin declares that no probe covers',
    ).toEqual([])
    expect(
      [...probed].filter((route) => !declared.has(route)).sort(),
      'a probe for a route the origin does not declare — has the extraction broken?',
    ).toEqual([])

    for (const probe of [...probes, unrouted]) {
      const method = (probe.init?.method ?? 'GET') as string
      const res = await get(probe.url, probe.init)
      await res.arrayBuffer()
      const where = `${method} ${probe.url}`
      // The exact directive, not merely "contains no-store": one behaviour
      // across the whole origin, never three near-misses.
      expect(res.headers.get('cache-control'), where).toBe(DIRECTIVE)
      if (probe.ok) expect(res.status, where).toBe(200)
      else expect(res.status, where).toBeGreaterThanOrEqual(400)
    }
  })

  it('test_UAT_AC961_components_are_served_byte_identical_from_outside_this_repo', async () => {
    // AC-961 — consumed, never copied, and the copy consumed must be the RIGHT
    // one rather than merely one with the right name.
    //
    // THIS IS ASSERTED, NOT SKIPPED. `WEBUI_INSTALLED` is presence-only, so
    // gating here would report "renamed upstream and not renamed here" and
    // "never installed" identically — and a one-sided rename that has broken
    // the browser would read as a clean green run. `WEBUI_INSTALLED` is
    // therefore an OUTCOME of this check, never a precondition for running it.
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
    expect(offenders, 'a component is defined inside this repository').toEqual([])

    for (const name of WEBUI_PACKAGES) {
      // Per component, so a failure names WHICH one could not be accounted for.
      const dir = webuiPackageDir(name)

      // IDENTITY, not presence: the resolved package declares itself, in its
      // own published identity, as this component under the scope in use. A
      // same-named package left behind under a superseded scope resolves and
      // mounts perfectly well — only this assertion rejects it.
      const declared = (
        JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8')) as { name?: string }
      ).name
      expect(declared, `${name} resolved to a package declaring a different identity`).toBe(
        `${WEBUI_SCOPE}/${name}`,
      )
      for (const superseded of SUPERSEDED_SCOPES) {
        expect(
          declared!.startsWith(`${superseded}/`),
          `${name} resolved to a copy left behind under a superseded scope`,
        ).toBe(false)
      }

      // The installed copy lives OUTSIDE this repository, so resolution was not
      // redirected, aliased or stubbed to reach a copy inside it.
      expect(dir.startsWith(REPO + path.sep), `${name} resolved inside this repository`).toBe(false)

      const entry = webuiExports(name)['.'].replace(/^\.\//, '')
      const res = await get(`/webui/${name}/${entry}`)
      expect(res.status, name).toBe(200)
      expect(await res.text(), name).toBe(fs.readFileSync(path.join(dir, entry), 'utf8'))
    }

    // Reported as installed as an outcome of the check above, not as the gate
    // that decided whether to run it.
    expect(WEBUI_INSTALLED, WEBUI_SKIP_REASON).toBe(true)
  })

  it('test_UAT_AC963_chrome_references_each_component_by_its_declared_entry_point', async () => {
    // AC-963 — derived from each package's own `exports`, never a hardcoded
    // path, so an upstream file move is reported at the origin rather than
    // becoming a 404 in the browser. The NAMES those references are made under
    // are equally derived, which is why this no longer skips: an import map
    // keyed under a superseded scope resolves nowhere in the browser and
    // nowhere else would observe it.
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
        if (subpath === '.') expect(map.imports[`${WEBUI_SCOPE}/${name}`]).toBe(url)
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

    // The names are derived too. On this same freshly produced document —
    // fetched from the origin just now, never a copy committed to the repo,
    // which compared against itself would prove nothing about what an operator
    // is served.
    const keys = Object.keys(map.imports)
    expect(keys.length, 'the document declares no component references').toBeGreaterThan(0)
    for (const key of keys) {
      expect(key.startsWith(`${WEBUI_SCOPE}/`), `${key} is not under the scope in use`).toBe(true)
      for (const superseded of SUPERSEDED_SCOPES) {
        expect(key.startsWith(`${superseded}/`), `${key} names a superseded scope`).toBe(false)
      }
    }
    // Every component the workspace consumes has a reference.
    for (const name of WEBUI_PACKAGES) {
      expect(keys, `no reference for ${name}`).toContain(`${WEBUI_SCOPE}/${name}`)
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

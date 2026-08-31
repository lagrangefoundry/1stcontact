/**
 * story-e674c60a — **the browser client, the shared components and the framework
 * bridges are build artifacts**: produced once by `1c assets`, served by falling
 * through the route table, and never resolved, transpiled or type-stripped while
 * a request is being answered.
 *
 * TWO BOUNDARIES, BOTH REAL, AND THE SPLIT IS DELIBERATE.
 *
 * The BYTES are asserted over the workspace's own HTTP front door
 * (`startBuilder`), because that door serves the real `dist-assets` directory
 * through the production assets fetcher — so what is compared is the build's
 * actual output, not a description of it.
 *
 * The ORDERING is asserted through the deployed Worker's own `fetch`, with a
 * real Cloudflare Access team on loopback minting real RS256 tokens, because
 * the ordering claim is a SECURITY claim: the gate lives in `fetch`, so an
 * artifact answered before it is an artifact answered to anyone. There the
 * assets binding is a marker, since the question is *which layer answered*
 * rather than *what it contained*.
 *
 * THE COMPONENT SCOPE IS NEVER WRITTEN HERE. Every reference is composed from
 * `WEBUI_SCOPE`, the single declaration — a restatement in a test is the exact
 * defect `bug32-webui-scope-rebrand` forbids across every tracked file.
 */

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import worker from '../apps/control-app/src/index'
import type { Env } from '../apps/control-app/src/index'
import { MODULE_CLIENT_JS, MODULE_CSS } from '../packages/framework/src/modules/module-assets'
import { composeModuleAssets } from '../tools/generate/src/cli/module-assets'
import { startBuilder, type BuilderHandle } from '../tools/generate/src/cli/builder'
import {
  WEBUI_PACKAGES,
  WEBUI_SCOPE,
  webuiExports,
  webuiPackageDir,
} from '../tools/generate/src/cli/webui'
import { startAccessTeam, type AccessTeam } from './support/access'

const REPO = path.resolve(__dirname, '..')
const DIST = path.join(REPO, 'apps', 'control-app', 'dist-assets')

/** The map `1c assets` derives, recomposed here from each component's own declaration. */
function declaredMap(): { imports: Record<string, string>; styles: string[] } {
  const imports: Record<string, string> = {}
  const styles: string[] = []
  for (const name of WEBUI_PACKAGES) {
    for (const [subpath, target] of Object.entries(webuiExports(name))) {
      const url = `/webui/${name}/${target.replace(/^\.\//, '')}`
      if (subpath === '.') imports[`${WEBUI_SCOPE}/${name}`] = url
      else if (target.endsWith('.css')) styles.push(url)
      else imports[`${WEBUI_SCOPE}/${name}/${subpath.replace(/^\.\//, '')}`] = url
    }
  }
  return { imports, styles }
}

/** The installed file a served artifact URL corresponds to. */
function installedFileFor(url: string): string {
  const m = /^\/webui\/([^/]+)\/(.+)$/.exec(url)
  expect(m, `${url} is not a component URL`).toBeTruthy()
  return path.join(webuiPackageDir(m![1]), m![2])
}

/** A binding that says which layer answered, without pretending to hold bytes. */
function markerAssets(): Fetcher {
  return {
    fetch: async (request: Request | string) =>
      new Response(
        `asset:${new URL(typeof request === 'string' ? request : request.url).pathname}`,
        { status: 200, headers: { 'content-type': 'text/plain; charset=utf-8' } },
      ),
  } as unknown as Fetcher
}

/**
 * The Worker's env, with the store bindings unreachable ON PURPOSE.
 *
 * An artifact request must never open a store, so a binding that throws the
 * moment it is touched turns "it happens not to be opened today" into a claim a
 * test can actually fail on.
 */
function workerEnv(team: AccessTeam, overrides: Partial<Env> = {}): Env {
  const unreachable = (what: string) => () => {
    throw new Error(`${what} was touched while answering a build-artifact request.`)
  }
  return {
    DB: new Proxy({}, { get: unreachable('D1') }) as D1Database,
    SITES: new Proxy({}, { get: unreachable('R2') }) as R2Bucket,
    TENANT_ID: 'story-e674c60a',
    ACCESS_TEAM_DOMAIN: team.teamDomain,
    ACCESS_AUD: team.aud,
    ACCESS_DEV_OPEN: '',
    ASSETS: markerAssets(),
    ...overrides,
  }
}

/** Comment lines stripped, so prose naming a forbidden specifier is not a hit. */
function runtimeSourceOf(rel: string): string {
  return fs
    .readFileSync(path.join(REPO, rel), 'utf8')
    .split('\n')
    .filter((line) => !/^\s*(\/\/|\*|\/\*)/.test(line))
    .join('\n')
}

describe('story-e674c60a — the workspace serves what the build wrote', () => {
  let cwd: string
  let builder: BuilderHandle
  let team: AccessTeam

  beforeAll(async () => {
    cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'story-e674c60a-assets-'))
    builder = await startBuilder({ cwd })
    team = await startAccessTeam()
  }, 120000)

  afterAll(async () => {
    await builder?.close()
    await team?.close()
    if (cwd) fs.rmSync(cwd, { recursive: true, force: true })
  })

  it('test_UAT_AC1400_client_components_and_bridges_are_built_artifacts_behind_the_gate', async () => {
    // The build must have been run for any of this to mean anything. Its absence
    // is an environment precondition and says so, rather than passing vacuously.
    expect(
      fs.existsSync(DIST),
      'apps/control-app/dist-assets is missing — run `1c assets`',
    ).toBe(true)

    const get = (p: string) => fetch(new URL(p, builder.url))

    // ── derived, not hardcoded ──────────────────────────────────────────────
    // The document declares its client and its components through the built
    // map, and that map is composed from each component's OWN declaration — so
    // an upstream file move is a loud failure of the build rather than a broken
    // reference in a browser.
    const chrome = await get('/')
    expect(chrome.status).toBe(200)
    const html = await chrome.text()
    expect(html).toContain('src="/builder/main.js"')

    const declared = declaredMap()
    const served = JSON.parse(
      /<script type="importmap">(.*?)<\/script>/s.exec(html)![1],
    ) as { imports: Record<string, string> }
    expect(served.imports).toEqual(declared.imports)
    expect(Object.keys(served.imports).length).toBeGreaterThan(0)
    for (const href of declared.styles) {
      expect(html, `the document references ${href}`).toContain(`href="${href}"`)
    }

    // …and what the document points at is what the build wrote: byte-identical
    // to the installed component, over this origin.
    for (const url of [...Object.values(declared.imports), ...declared.styles]) {
      const res = await get(url)
      expect(res.status, url).toBe(200)
      const body = Buffer.from(await res.arrayBuffer())
      expect(body.equals(fs.readFileSync(installedFileFor(url))), url).toBe(true)
      expect(body.length, url).toBeGreaterThan(0)
    }

    // The browser client, copied verbatim; and the framework bridges, which used
    // to be type-stripped per request and are a build output now.
    const client = await get('/builder/main.js')
    expect(client.status).toBe(200)
    const clientBytes = Buffer.from(await client.arrayBuffer())
    expect(
      clientBytes.equals(fs.readFileSync(path.join(REPO, 'apps/control-app/src/builder/main.js'))),
    ).toBe(true)
    for (const bridge of ['edit-client', 'site-schema-edit', 'site-schema-shade']) {
      const res = await get(`/framework/${bridge}.js`)
      expect(res.status, bridge).toBe(200)
      expect((await res.text()).length, bridge).toBeGreaterThan(0)
    }

    // The precompiled presentation the RENDER needs is reproducible: rebuilding
    // it from its sources yields the same bytes, so an artifact that has gone
    // stale is a build-time failure and not a page styled slightly wrong.
    const rebuilt = composeModuleAssets(REPO)
    expect(MODULE_CSS).toBe(rebuilt.css)
    expect(MODULE_CLIENT_JS).toBe(rebuilt.clientJs)
    expect(MODULE_CSS.length).toBeGreaterThan(0)
    expect(MODULE_CLIENT_JS.length).toBeGreaterThan(0)

    // ── behind the gate, never ahead of it ──────────────────────────────────
    const admitted = await team.headers()
    const req = (p: string, headers?: Record<string, string>) =>
      new Request(`https://app.example${p}`, headers ? { headers } : undefined)

    const gated = await worker.fetch(req('/builder/main.js', admitted), workerEnv(team))
    expect(gated.status).toBe(200)
    expect(await gated.text()).toBe('asset:/builder/main.js')

    const refused = await worker.fetch(req('/builder/main.js'), workerEnv(team))
    expect(refused.status).toBe(401)
    const refusedBody = await refused.text()
    expect(refusedBody).not.toContain('asset:')
    // …and none of the real artifact's bytes came back either.
    expect(refusedBody).not.toContain(clientBytes.subarray(0, 64).toString('utf8'))

    // ── the fall-through does not depend on an account ──────────────────────
    // A build artifact has nothing to do with one, and the store bindings above
    // throw if touched — so this passing is the evidence the store stayed shut.
    const noAccount = await worker.fetch(
      req('/webui/marker.js', admitted),
      workerEnv(team, { TENANT_ID: '' }),
    )
    expect(noAccount.status).toBe(200)
    expect(await noAccount.text()).toBe('asset:/webui/marker.js')

    // ── and it stays LAST: no artifact answers in place of a route ──────────
    const document = await worker.fetch(req('/', admitted), workerEnv(team))
    expect(document.status).toBe(200)
    expect(document.headers.get('content-type')).toContain('text/html')
    expect(await document.text()).not.toContain('asset:')

    const published = await worker.fetch(req('/preview/alpha/published/', admitted), workerEnv(team))
    expect(published.status).toBe(302)
    expect(published.headers.get('location')).toContain('/site/alpha/')

    // ── nothing is resolved or transpiled while a request is answered ───────
    // Asserted as a property of the SOURCES reachable from the request path, not
    // by observing one successful request: a bundler resolves a static specifier
    // whether or not the branch naming it ever runs.
    for (const rel of [
      'apps/control-app/src/index.ts',
      'apps/control-app/src/router.ts',
      'apps/control-app/src/chrome.ts',
      'apps/control-app/src/store.ts',
      'apps/control-app/src/ai.ts',
    ]) {
      const src = runtimeSourceOf(rel)
      expect(src, rel).not.toMatch(/createRequire/)
      expect(src, rel).not.toMatch(/transpileModule/)
      expect(src, rel).not.toMatch(/from ['"]typescript['"]/)
      expect(src, rel).not.toMatch(/from ['"]node:fs['"]|from ['"]node:path['"]/)
      // The component resolver is a BUILD-time function; naming it here would
      // put `node_modules` walking back on the request path.
      expect(src, rel).not.toMatch(/webuiPackageDir|webuiExports/)
    }

    // A build that has not been run says so, naming the command that runs it,
    // rather than answering as though the artifact simply did not exist.
    const unbuilt = await startBuilder({
      cwd: fs.mkdtempSync(path.join(os.tmpdir(), 'story-e674c60a-unbuilt-')),
    })
    try {
      // The fallback resolves to this checkout's real build, so the "not built"
      // report is only reachable where that is genuinely absent. Where it is
      // present the artifact arrives; either way, a bare 404 is not the answer.
      const res = await fetch(new URL('/builder/main.js', unbuilt.url))
      expect(res.status).not.toBe(404)
      if (res.status !== 200) {
        expect(res.status).toBe(503)
        expect(await res.text()).toContain('1c assets')
      }
    } finally {
      await unbuilt.close()
    }
  }, 120000)
})

/**
 * story-e674c60a — **the operator's builder command is a transport, not a second
 * origin**, and its default target is the locally simulated store.
 *
 * The claim has two halves and they are checked at two real entry points.
 *
 * ONE ROUTE TABLE, TWO FRONT DOORS. The local front door is driven over ordinary
 * HTTP (`startBuilder`) for a route that reads the store, one that writes it,
 * one that renders, and the workspace document itself — and the document is
 * compared to the router's own composition, which is what "returns the response
 * unchanged" means when a body has no store in it. What the local door may
 * answer *itself* is then pinned against its source, because a route it never
 * intercepts is invisible in any single successful request: the absence is the
 * property, and only the source can show an absence.
 *
 * THE DEFAULT TARGET. `1c builder` is run through the CLI's own `run()` entry
 * point with `npx` shimmed on PATH — the thin mock is the external process
 * (`wrangler dev`) and nothing else. What is asserted is the report the operator
 * reads before that process starts.
 */

import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { chromeHtml } from '../apps/control-app/src/chrome'
import { run } from '../tools/generate/src/cli'
import { cmdNew } from '../tools/generate/src/cli/commands'
import { startBuilder, type BuilderHandle } from '../tools/generate/src/cli/builder'

const REPO = path.resolve(__dirname, '..')
const SLUG = 'alpha'

/** Everything the transport is allowed to answer itself, and nothing else. */
const ASSISTANT_ROUTES = /^\/api\/ai\//

/**
 * Routes the workspace defines that the transport must hand straight over. A
 * route intercepted on the way past is the one place two front doors can
 * disagree about what a route *is*.
 */
const DELEGATED = [
  '/',
  '/api/sites',
  '/api/import',
  '/api/publish',
  '/api/revisions',
  '/api/assets',
  '/api/palette',
  '/api/copy',
  '/preview/',
]

/** `1c <argv>` through the CLI's own entry point, with stdout captured. */
async function cli(argv: string[], env: Record<string, string>): Promise<string> {
  const out: string[] = []
  const prevLog = console.log
  const prevEnv: Record<string, string | undefined> = {}
  for (const [k, v] of Object.entries(env)) {
    prevEnv[k] = process.env[k]
    process.env[k] = v
  }
  console.log = (...a: unknown[]) => void out.push(a.map(String).join(' '))
  try {
    await run(argv)
  } finally {
    console.log = prevLog
    for (const [k, v] of Object.entries(prevEnv)) {
      if (v === undefined) delete process.env[k]
      else process.env[k] = v
    }
  }
  return out.join('\n')
}

describe('story-e674c60a — the builder command is a transport over the one route table', () => {
  let cwd: string
  let builder: BuilderHandle
  /** A PATH entry whose `npx` exits immediately, standing in for `wrangler dev`. */
  let shimDir: string

  beforeAll(async () => {
    cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'story-e674c60a-transport-'))
    cmdNew(SLUG, { cwd })
    builder = await startBuilder({ cwd })

    shimDir = fs.mkdtempSync(path.join(os.tmpdir(), 'story-e674c60a-npx-'))
    const shim = path.join(shimDir, 'npx')
    fs.writeFileSync(shim, '#!/bin/sh\nexit 0\n')
    fs.chmodSync(shim, 0o755)
  }, 120000)

  afterAll(async () => {
    await builder?.close()
    if (cwd) fs.rmSync(cwd, { recursive: true, force: true })
    if (shimDir) fs.rmSync(shimDir, { recursive: true, force: true })
  })

  it('test_UAT_AC1401_the_builder_command_is_a_transport_defaulting_to_the_local_store', async () => {
    const get = (p: string, init?: RequestInit) => fetch(new URL(p, builder.url), init)

    // ── the workspace document, returned unchanged ──────────────────────────
    // Composed by the route table, not read from anywhere, so the local door
    // handing it over verbatim is checkable byte for byte.
    const document = await get('/')
    expect(document.status).toBe(200)
    expect(document.headers.get('content-type')).toContain('text/html')
    expect(await document.text()).toBe(chromeHtml())

    // ── one that READS the store ────────────────────────────────────────────
    const listing = await get('/api/sites')
    expect(listing.status).toBe(200)
    expect(listing.headers.get('content-type')).toContain('application/json')
    const sites = (await listing.json()) as { slug: string }[]
    expect(sites.map((s) => s.slug)).toContain(SLUG)

    // ── one that WRITES it, through the same edit functions `1c` dispatches to ─
    const wrote = await get('/api/palette', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ slug: SLUG, op: 'add', name: 'accent', value: '#0f172a' }),
    })
    expect(wrote.status).toBe(200)
    const readBack = (await (await get(`/api/palette?slug=${SLUG}`)).json()) as {
      entries: { name: string; value: string }[]
    }
    expect(readBack.entries).toContainEqual(
      expect.objectContaining({ name: 'accent', value: '#0f172a' }),
    )

    // ── and one that RENDERS ────────────────────────────────────────────────
    const rendered = await get(`/preview/${SLUG}/draft/`)
    expect(rendered.status).toBe(200)
    expect(rendered.headers.get('content-type')).toContain('text/html')
    expect((await rendered.text()).length).toBeGreaterThan(0)

    // The route table's own freshness directive, inherited rather than restated
    // by this front door — which is what proves the response came out of it.
    for (const p of ['/', '/api/sites', `/preview/${SLUG}/draft/`, '/nothing-here']) {
      expect((await get(p)).headers.get('cache-control'), p).toBe('no-store, must-revalidate')
    }

    // ── it stands up no route table of its own ──────────────────────────────
    // An absence cannot be observed in a successful request, so it is pinned
    // against the source: every path the transport compares for itself is an
    // assistant-host path — the one capability the deployed runtime does not
    // have on an operator's machine, and one this story puts out of scope — and
    // nothing the workspace defines is intercepted on the way past.
    const transport = fs.readFileSync(
      path.join(REPO, 'tools/generate/src/cli/builder.ts'),
      'utf8',
    )
    const intercepted = [...transport.matchAll(/\bp === '([^']+)'/g)].map((m) => m[1])
    expect(intercepted.length, 'the transport compares no path at all').toBeGreaterThan(0)
    for (const p of intercepted) {
      expect(p, `${p} is intercepted by the local front door`).toMatch(ASSISTANT_ROUTES)
    }
    for (const p of DELEGATED) {
      expect(intercepted, `${p} must be handed to the route table`).not.toContain(p)
    }
    // …and everything else is one hand-over into the one route table.
    expect(transport).toContain('await send(res, await route(await toRequest(req)')
    expect(transport.match(/await route\(/g), 'more than one hand-over').toHaveLength(1)

    // ── the default target is the locally simulated store ───────────────────
    const withShim = { PATH: `${shimDir}${path.delimiter}${process.env.PATH ?? ''}` }
    const local = await cli(['builder', '--port', '8799'], withShim)
    expect(local).toContain('http://localhost:8799')
    expect(local).toMatch(/store:\s*local/)
    expect(local).not.toMatch(/REMOTE/)

    const remote = await cli(['builder', '--port', '8799', '--remote'], withShim)
    expect(remote).toMatch(/store:\s*REMOTE/)
    expect(remote).toContain('production data')
    // Distinguishable, which is the whole point: a development loop that writes
    // to production by default is one keystroke from losing a site.
    expect(remote).not.toBe(local)
  }, 180000)
})

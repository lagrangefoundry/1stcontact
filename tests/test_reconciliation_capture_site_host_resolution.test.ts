import { describe, expect, it } from 'vitest'
import { aiCore } from '../tools/generate/src/cli/ai/toolbox'
import { createL1Toolbox } from '../tools/generate/src/cli/ai/toolbox-core'
import { fidelitySurfaceFor } from '../tools/generate/src/cli/ai/fidelity-core'
import type { FidelityDeps } from '../tools/generate/src/cli/ai/fidelity-core'
import { memoryReferenceStore } from '../tools/generate/src/store/memory-reference-store'
import { readCapture } from '../tools/generate/src/cli/capture/bundle'
import { runCapturePipeline } from '../tools/generate/src/cli/capture/pipeline'
import { HINTS_SCRIPT } from '../tools/generate/src/cli/capture/hints'
import type { BrowserDriver } from '../tools/generate/src/cli/capture'
import type { Viewport } from '../tools/generate/src/cli/capture/types'
import { FakeCaptureDriver } from './support/fake-capture-driver'
import { makeMemorySite } from './support/site-factory'

/**
 * story-31204812 — capture_site host resolution (BUG-67 Defect B, BUNDLE-41).
 *
 * WHAT IS REAL. The composed Toolbox (L1 + fidelity surface), `capture_site`,
 * its pre-flight egress check, the whole capture pipeline (first pass, viewport
 * ladder, per-width screenshots, structural hints), the bundle writer and the
 * reference store.
 *
 * WHAT IS DOUBLED: the browser, and with it DNS. The double resolves only the
 * hostnames it is given and raises the engine's own resolution error for every
 * other one, and it records each navigation together with what that driver was
 * then asked to do (screenshot, hints script). "Which host did each pass ask
 * for?" is therefore answered by the browser, not by the code under test.
 */

interface Visit {
  url: string
  viewport?: Viewport
  screenshots: number
  hints: boolean
}

interface Browser {
  visits: Visit[]
}

const notResolved = (url: string) => new Error(`page.goto: net::ERR_NAME_NOT_RESOLVED at ${url}`)

/** A guarded-driver factory whose browser resolves only `resolves`. */
function browser(
  resolves: string[],
  failure: (url: string) => Error = notResolved,
): { log: Browser; factory: () => Promise<BrowserDriver> } {
  const log: Browser = { visits: [] }
  class HostAwareDriver extends FakeCaptureDriver {
    private visit: Visit | null = null
    override async navigate(url: string, viewport?: Viewport): Promise<void> {
      this.visit = { url, viewport, screenshots: 0, hints: false }
      log.visits.push(this.visit)
      if (!resolves.includes(new URL(url).hostname)) throw failure(url)
      await super.navigate(url, viewport)
    }
    override async screenshot(): Promise<Uint8Array> {
      if (this.visit) this.visit.screenshots += 1
      return super.screenshot()
    }
    override async query<T>(script: string): Promise<T> {
      if (this.visit && script === HINTS_SCRIPT) this.visit.hints = true
      return super.query<T>(script)
    }
  }
  return { log, factory: async () => new HostAwareDriver() }
}

const hostsOf = (log: Browser) => log.visits.map((v) => new URL(v.url).hostname)
const hits = (log: Browser, host: string) => hostsOf(log).filter((h) => h === host).length

/** The composed Toolbox over an in-memory site, with `capture_site` on `factory`. */
async function composed(factory: () => Promise<BrowserDriver>) {
  const site = makeMemorySite()
  const references = memoryReferenceStore()
  const deps: FidelityDeps = {
    slug: site.slug,
    origin: 'https://studio.test',
    references,
    driverFactory: factory,
    guardedDriver: () => factory,
  }
  const lib = await aiCore()
  const box = await createL1Toolbox(
    site.slug,
    {},
    { lib, store: site.store, extraSurfaces: [{ surface: await fidelitySurfaceFor(lib, deps) }] },
  )
  const run = async (op: string, params: Record<string, unknown>) => String(await box.run(op, params))
  return { run, references }
}

function payload<T>(answer: string): T {
  if (answer.startsWith('Error')) throw new Error(`expected a result, got: ${answer}`)
  return JSON.parse(answer.slice(answer.indexOf('{'), answer.lastIndexOf('}') + 1)) as T
}

interface CaptureResult {
  bundle: string
  url: string
}

// ── AC-2465 ──────────────────────────────────────────────────────────────────

describe('AC-2465 — an unresolvable host costs one navigation and earns one guarded alternate', () => {
  it('test_UAT_AC2465_unresolved_host_is_navigated_once_and_one_guarded_alternate_is_tried', async () => {
    // 1. www typed, only the apex resolves. Path and query survive the swap.
    {
      const b = browser(['gigabytealchemy.ai'])
      const { run } = await composed(b.factory)
      const result = payload<CaptureResult>(
        await run('capture_site', { url: 'https://www.gigabytealchemy.ai/about?ref=1' }),
      )
      expect(result.url).toBe('https://gigabytealchemy.ai/about?ref=1')
      expect(hits(b.log, 'www.gigabytealchemy.ai'), 'the dead name costs one navigation').toBe(1)
      expect(b.log.visits[1].url, 'the alternate changes only the hostname').toBe(
        'https://gigabytealchemy.ai/about?ref=1',
      )
    }

    // 2. Mirrored: the bare name does not resolve, www does.
    {
      const b = browser(['www.example.com'])
      const { run } = await composed(b.factory)
      const result = payload<CaptureResult>(await run('capture_site', { url: 'https://example.com/' }))
      expect(result.url).toBe('https://www.example.com/')
      expect(hits(b.log, 'example.com')).toBe(1)
    }

    // 3. A timeout is not a resolution failure: full budget, no alternate.
    {
      const b = browser([], (url) => new Error(`page.goto: Timeout 30000ms exceeded at ${url}`))
      const { run } = await composed(b.factory)
      const answer = await run('capture_site', { url: 'https://www.example.com/' })
      expect(answer).toMatch(/after 3 attempt\(s\)/)
      expect(hits(b.log, 'www.example.com'), 'the retry budget is unchanged').toBe(3)
      expect(new Set(hostsOf(b.log)), 'no other hostname is invented').toEqual(new Set(['www.example.com']))
    }

    // 3b. Node resolver wording (ENOTFOUND / EAI_AGAIN) counts as resolution too.
    for (const code of ['getaddrinfo ENOTFOUND', 'getaddrinfo EAI_AGAIN']) {
      const b = browser(['example.org'], (url) => new Error(`${code} ${new URL(url).hostname}`))
      const { run } = await composed(b.factory)
      const result = payload<CaptureResult>(await run('capture_site', { url: 'https://www.example.org/' }))
      expect(result.url, code).toBe('https://example.org/')
      expect(hits(b.log, 'www.example.org'), code).toBe(1)
    }

    // 4. No alternate for IP literals, localhost or single-label names. The
    //    public ones pass capture_site's pre-flight; the private ones are
    //    refused there, so the pipeline capture_site composes is driven directly.
    for (const url of ['https://93.184.216.34/', 'https://[2606:4700::1111]/', 'http://intranet/']) {
      const b = browser([])
      const { run } = await composed(b.factory)
      const answer = await run('capture_site', { url })
      expect(answer, url).toMatch(/no such host/)
      expect(b.log.visits.length, `${url}: one navigation, no second hostname`).toBe(1)
    }
    for (const url of ['http://127.0.0.1:8787/', 'http://[::1]:8787/', 'http://localhost:8787/']) {
      const b = browser([])
      await expect(runCapturePipeline(url, { driverFactory: b.factory }), url).rejects.toThrow(/no such host/)
      expect(b.log.visits.length, `${url}: one navigation, no second hostname`).toBe(1)
    }

    // 5. An alternate the egress rule would refuse is never navigated. Through
    //    capture_site such a typed address is already refused at pre-flight, so
    //    the composed pipeline is driven directly: `www.localhost` must never
    //    become a route to loopback.
    {
      const b = browser([])
      await expect(
        runCapturePipeline('http://www.localhost:8787/', { driverFactory: b.factory }),
      ).rejects.toThrow(/no such host/)
      expect(hostsOf(b.log), 'loopback is never reached via the fallback').not.toContain('localhost')
      expect(b.log.visits.length).toBe(1)
    }
  })
})

// ── AC-2466 ──────────────────────────────────────────────────────────────────

describe('AC-2466 — the host that answered is the host every pass uses; no host is reported as an address fact', () => {
  it('test_UAT_AC2466_alternate_host_carries_through_every_pass_and_no_such_host_is_actionable', async () => {
    // 1. Success on the alternate carries through the record, the bundle and every pass.
    {
      const b = browser(['gigabytealchemy.ai'])
      const { run, references } = await composed(b.factory)
      const result = payload<CaptureResult>(await run('capture_site', { url: 'https://www.gigabytealchemy.ai/' }))

      expect(result.url).toBe('https://gigabytealchemy.ai/')
      expect(result.bundle.startsWith('gigabytealchemy.ai/'), result.bundle).toBe(true)
      const capture = await readCapture(references.bundle(result.bundle))
      expect(capture?.url).toBe('https://gigabytealchemy.ai/')
      expect(capture?.host).toBe('gigabytealchemy.ai')

      // The typed host was asked exactly once — the failed first navigation —
      // and every later pass (ladder, per-width screenshots, hints) asked the apex.
      expect(hits(b.log, 'www.gigabytealchemy.ai')).toBe(1)
      const later = b.log.visits.slice(1)
      expect(later.every((v) => new URL(v.url).hostname === 'gigabytealchemy.ai')).toBe(true)
      const widths = new Set(later.filter((v) => v.viewport).map((v) => v.viewport!.width))
      expect(widths.size, 'the viewport ladder navigated the apex at several widths').toBeGreaterThan(1)
      expect(
        later.filter((v) => v.screenshots > 0 && v.viewport).length,
        'per-width screenshots were shot on the apex',
      ).toBeGreaterThan(1)
      expect(later.some((v) => v.hints), 'the hints pass ran on the apex').toBe(true)
    }

    // 2. Both forms unresolvable: an address problem, in words the caller can act on.
    {
      const b = browser([])
      const { run } = await composed(b.factory)
      const answer = await run('capture_site', { url: 'https://www.nowhere-bundle41.test/' })
      expect(answer).toMatch(/no such host/)
      expect(answer).toContain('Tried https://www.nowhere-bundle41.test/ and https://nowhere-bundle41.test/')
      expect(answer).toMatch(/did not resolve/)
      expect(answer).toMatch(/not\s+about the site/)
      expect(answer).toMatch(/check the spelling, or try a different host form/)
      expect(answer, 'not the raw browser code as the explanation').not.toMatch(/ERR_NAME_NOT_RESOLVED/)
    }

    // 3. No alternate exists: only the typed form is named.
    {
      const b = browser([])
      const { run } = await composed(b.factory)
      const answer = await run('capture_site', { url: 'http://intranet/' })
      expect(answer).toMatch(/no such host/)
      expect(answer).toMatch(/Tried http:\/\/intranet\/\. /)
      expect(answer, 'no second form is named').not.toMatch(/Tried \S+ and /)
    }

    // 4. Mixed failure: the typed host does not resolve, the alternate resolves
    //    and then times out — reported against the host that answered.
    {
      const b = browser(['example.net'])
      class Hang extends Error {}
      const log = b.log
      const hanging = async () => {
        const d = await b.factory()
        const nav = d.navigate.bind(d)
        d.navigate = async (url: string, viewport?: Viewport) => {
          await nav(url, viewport)
          throw new Hang(`page.goto: Timeout 30000ms exceeded at ${url}`)
        }
        return d
      }
      const { run } = await composed(hanging)
      const answer = await run('capture_site', { url: 'https://www.example.net/' })
      expect(answer).toMatch(/Capture failed for https:\/\/example\.net\/ after 3 attempt\(s\): .*Timeout/)
      expect(answer).not.toMatch(/no such host/)
      expect(hits(log, 'example.net'), 'the alternate gets the full transient budget').toBe(3)
    }
  })
})

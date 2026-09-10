/**
 * BUG-67 — a hostname that does not resolve is an address fact, not a site fact.
 *
 * THE FAILURE THIS CLOSES. On 2026-09-09 an assistant was asked to use a
 * reference site the operator owns. It reached for `www.gigabytealchemy.ai`,
 * got `net::ERR_NAME_NOT_RESOLVED` three times in a row, and told the operator
 * their site "may already be down". It was not down: the bare apex
 * `gigabytealchemy.ai` captured seven pages on the first try, once the operator
 * pasted the exact URL and pushed back. An earlier guess at the wrong TLD had
 * already cost ninety seconds — three thirty-second navigation timeouts against
 * a host nobody expected to answer.
 *
 * Two defects, and they are separable, so they are tested separately.
 *
 *   - **The retry loop had no opinion about the error.** A DNS failure, a
 *     timeout and a bug in the extract script were all worth three attempts.
 *     Only one of those can change its mind on the second ask.
 *   - **Nothing ever tried the other form of the host.** The `www.`/apex pair is
 *     the single most common way a correct site reads as a dead one, and the
 *     capture is ours — trying both is entirely within reach.
 *
 * The fake driver here is host-aware: it records every navigation and answers
 * according to a set of hosts that "resolve", which is what lets these assert on
 * the *number* of navigations per host form as well as the outcome.
 */
import { describe, expect, it } from 'vitest'
import {
  alternateHostUrl,
  isHostResolutionFailure,
  runCapturePipeline,
} from '../tools/generate/src/cli/capture/pipeline'
import type { BrowserDriver, CapturedResponse, RawSignals } from '../tools/generate/src/cli/capture'

/**
 * Signals thin enough to assemble a capture and no thinner.
 *
 * These tests are about which HOST answered, not about what came back from it,
 * so this is the minimum `RawSignals` the pipeline will fold without complaint.
 */
function signals(): RawSignals {
  return {
    title: 'Reference',
    viewport: { width: 1280, height: 800 },
    bands: [],
    colorUsage: [],
    fontFaces: [],
    typeScale: [],
    spacingScalePx: [],
    containerMaxWidthPx: 1280,
    images: [],
    bodyBackground: '#0b0b0d',
  }
}

interface Trace {
  /** Every URL `navigate` was asked for, in order. */
  navigations: string[]
}

/**
 * A driver that resolves only the hosts it is given.
 *
 * `failure` decides what an unresolvable host raises, so the same fake covers
 * the DNS case and the timeout case — the two the retry loop must now treat
 * differently.
 */
function hostAwareDriver(
  resolves: string[],
  trace: Trace,
  failure: (url: string) => Error = (url) => new Error(`net::ERR_NAME_NOT_RESOLVED at ${url}`),
): () => Promise<BrowserDriver> {
  class HostAwareDriver implements BrowserDriver {
    async navigate(url: string): Promise<void> {
      trace.navigations.push(url)
      if (!resolves.includes(new URL(url).hostname)) throw failure(url)
    }
    async screenshot(): Promise<Uint8Array> {
      return new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])
    }
    async query<T>(): Promise<T> {
      return signals() as T
    }
    responses(): CapturedResponse[] {
      return []
    }
    diagnostics() {
      return { consoleErrors: [], pageErrors: [], failedRequests: [], requestedUrls: [] }
    }
    async content(): Promise<string> {
      return '<html><body>Reference Heading</body></html>'
    }
    async close(): Promise<void> {}
  }
  return async () => new HostAwareDriver()
}

/** How many times a given hostname was navigated. */
const hits = (trace: Trace, host: string) =>
  trace.navigations.filter((u) => new URL(u).hostname === host).length

describe('BUG-67 — the capture corrects a hostname instead of condemning a site', () => {
  // AC1 — the failure exactly as it happened: www typed, only the apex serves.
  it('test_UAT_FC_BUG-67_www_that_does_not_resolve_falls_back_to_the_apex', async () => {
    const trace: Trace = { navigations: [] }
    const result = await runCapturePipeline('https://www.gigabytealchemy.ai/', {
      driverFactory: hostAwareDriver(['gigabytealchemy.ai'], trace),
    })
    expect(result.capture.host, 'the apex is what answered').toBe('gigabytealchemy.ai')
    // The whole point: the dead name costs ONE navigation, not the retry budget.
    expect(hits(trace, 'www.gigabytealchemy.ai'), 'www navigated once, not three times').toBe(1)
    expect(hits(trace, 'gigabytealchemy.ai'), 'the apex was reached').toBe(1)
  })

  // AC2 — mirrored: the bare name is the guess, and www is what serves.
  it('test_UAT_FC_BUG-67_apex_that_does_not_resolve_falls_back_to_www', async () => {
    const trace: Trace = { navigations: [] }
    const result = await runCapturePipeline('https://example.com/', {
      driverFactory: hostAwareDriver(['www.example.com'], trace),
    })
    expect(result.capture.host).toBe('www.example.com')
    expect(hits(trace, 'example.com')).toBe(1)
    expect(hits(trace, 'www.example.com')).toBe(1)
  })

  // AC3 — a timeout is not a resolution failure. A host that timed out resolved,
  // so something answered and hung: retry it, and do NOT go inventing hostnames.
  it('test_UAT_FC_BUG-67_a_timeout_still_retries_and_tries_no_other_host', async () => {
    const trace: Trace = { navigations: [] }
    await expect(
      runCapturePipeline('https://www.example.com/', {
        driverFactory: hostAwareDriver([], trace, (url) => new Error(`Navigation timeout of 30000 ms exceeded at ${url}`)),
      }),
    ).rejects.toThrow(/after 3 attempt\(s\)/)
    expect(hits(trace, 'www.example.com'), 'the existing retry budget is unchanged').toBe(3)
    expect(hits(trace, 'example.com'), 'no alternate host is guessed after a timeout').toBe(0)
  })

  // AC4 — hosts with no meaningful other form get none invented for them.
  it('test_UAT_FC_BUG-67_hosts_with_no_meaningful_alternate_get_none', async () => {
    expect(alternateHostUrl('https://93.184.216.34/'), 'an IP literal has no www').toBeNull()
    expect(alternateHostUrl('http://localhost:8787/'), 'localhost has no apex').toBeNull()
    expect(alternateHostUrl('http://intranet/'), 'a single-label host has no apex').toBeNull()
    expect(alternateHostUrl('not a url'), 'a non-URL yields no candidate').toBeNull()

    const trace: Trace = { navigations: [] }
    await expect(
      runCapturePipeline('https://93.184.216.34/', { driverFactory: hostAwareDriver([], trace) }),
    ).rejects.toThrow(/no such host/)
    expect(trace.navigations.length, 'one attempt, one host, no invented second').toBe(1)
  })

  // AC5 — the message names every form tried and blames the address, not the site.
  it('test_UAT_FC_BUG-67_total_resolution_failure_names_both_forms_and_the_cause', async () => {
    const trace: Trace = { navigations: [] }
    const failure = await runCapturePipeline('https://www.nowhere.test/', {
      driverFactory: hostAwareDriver([], trace),
    }).catch((e: unknown) => e as Error)

    expect(failure.message, 'says the hostname is what failed').toMatch(/no such host/)
    expect(failure.message, 'names the form typed').toContain('www.nowhere.test')
    expect(failure.message, 'names the form tried on the caller’s behalf').toContain(
      'https://nowhere.test/',
    )
    // The sentence that stops the next assistant reporting a live site as dead.
    expect(failure.message).toMatch(/not\s+about the site/)
    // Both forms, once each — never the old three-per-form.
    expect(trace.navigations.length).toBe(2)
  })

  // AC6 — the corrected host is what the capture records, so everything
  // downstream (the bundle name, the returned url, the later passes) follows it.
  it('test_UAT_FC_BUG-67_the_capture_records_the_host_that_answered', async () => {
    const trace: Trace = { navigations: [] }
    const result = await runCapturePipeline('https://www.gigabytealchemy.ai/', {
      driverFactory: hostAwareDriver(['gigabytealchemy.ai'], trace),
    })
    expect(result.capture.url, 'the url recorded is the one that worked').toBe(
      'https://gigabytealchemy.ai/',
    )
    expect(result.capture.url).not.toContain('www.')
  })

  // AC7 — the alternate is a URL this tool chose, so the egress rules still bind
  // it. `www.localhost` must never become a route to loopback.
  it('test_UAT_FC_BUG-67_an_alternate_the_guard_would_refuse_is_not_fetched', async () => {
    const trace: Trace = { navigations: [] }
    await expect(
      runCapturePipeline('http://www.localhost:8787/', { driverFactory: hostAwareDriver([], trace) }),
    ).rejects.toThrow()
    expect(
      trace.navigations.some((u) => new URL(u).hostname === 'localhost'),
      'loopback is never reached through the fallback',
    ).toBe(false)
  })

  // The classifier itself, at the boundary the driver seam actually promises.
  it('test_UAT_FC_BUG-67_resolution_failures_are_told_from_other_browser_failures', async () => {
    expect(isHostResolutionFailure(new Error('net::ERR_NAME_NOT_RESOLVED at https://x.test/'))).toBe(true)
    expect(isHostResolutionFailure(new Error('getaddrinfo ENOTFOUND x.test'))).toBe(true)
    expect(isHostResolutionFailure(new Error('Navigation timeout of 30000 ms exceeded'))).toBe(false)
    expect(isHostResolutionFailure(new Error('net::ERR_CONNECTION_RESET'))).toBe(false)
  })
})

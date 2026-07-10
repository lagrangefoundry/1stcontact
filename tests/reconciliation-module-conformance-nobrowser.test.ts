import { describe, expect, it, vi } from 'vitest'
import type { BrowserDriver, BrowserDriverFactory } from '../tools/generate/src/cli'
import { assertModuleConforms, ConformanceError, type ConformanceFixture } from '../tools/generate/src'

/**
 * Reconciliation UAT for AC-554 (story-a6962b23) — the conformance check is an
 * advisory no-op when no headless browser is available (default driver), and runs
 * (and can fail) when an explicit driver is supplied.
 *
 * `playwright` is mocked so `chromiumAvailable()` resolves false regardless of the
 * host, letting the no-browser branch be exercised deterministically even on a
 * runner that *does* have Chromium installed. This lives in its own file because
 * the mock must not affect the real browser-driven UATs in the sibling file.
 */

vi.mock('playwright', () => {
  const noBrowser = (): Promise<never> => Promise.reject(new Error('no browser (mocked absent)'))
  return {
    chromium: { launch: noBrowser },
    webkit: { launch: noBrowser },
    firefox: { launch: noBrowser },
  }
})

const cleanFixture: ConformanceFixture = {
  label: 'clean-text-block',
  props: {
    variant: 'prose',
    content: { heading: 'No-op Marker', body: 'A well-formed paragraph that renders cleanly.' },
  },
}

/**
 * A fake driver that reports horizontal overflow — supplying it bypasses the
 * no-browser no-op and proves the checks actually execute (they fail on it).
 */
const overflowDriver: BrowserDriverFactory = async () =>
  ({
    navigate: async () => {},
    screenshot: async () => new Uint8Array(),
    query: async () => ({ overflow: { scrollWidth: 5000, innerWidth: 1280 }, collapsed: [], clipped: [] }),
    responses: () => [],
    diagnostics: () => ({ consoleErrors: [], pageErrors: [], failedRequests: [], requestedUrls: [] }),
    content: async () => '<html></html>',
    close: async () => {},
  }) as unknown as BrowserDriver

describe('Reconciliation — conformance no-browser advisory no-op (story-a6962b23)', () => {
  // AC-554
  it('test_UAT_AC554_advisory_noop_without_browser_runs_with_explicit_driver', async () => {
    // Default driver + no browser available → advisory no-op: resolves without
    // throwing (and never attempts a browser launch, which would reject).
    await expect(assertModuleConforms('text-block', [cleanFixture], {})).resolves.toBeUndefined()

    // Explicit driver supplied → the checks execute and can fail as normal; the
    // injected driver reports overflow, so the run throws a ConformanceError.
    const err = await assertModuleConforms('text-block', [cleanFixture], {
      driverFactory: overflowDriver,
      keepSandboxOnFailure: false,
    }).then(
      () => null,
      (e: unknown) => e as ConformanceError,
    )
    expect(err).toBeInstanceOf(ConformanceError)
    expect(err?.violations.some((v) => v.ac === 'safety.overflow')).toBe(true)
  }, 120000)
})

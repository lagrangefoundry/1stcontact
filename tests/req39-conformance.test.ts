import { describe, expect, it } from 'vitest'
import type { CapabilityDefinition } from '@1stcontact/framework'
import {
  assertModuleConforms,
  ConformanceError,
  chromiumAvailable,
  createPlaywrightDriver,
  getModule,
  serveOneModulePage,
  type ConformanceFixture,
  type ModuleResolver,
} from '../tools/generate/src'

const carouselMeta = getModule('carousel', 2).meta
import Overflow from './fixtures/conformance/overflow.astro'
import PageError from './fixtures/conformance/page-error.astro'
import Collapsed from './fixtures/conformance/collapsed.astro'

/**
 * UATs for REQ-39 — the conformance harness core ([[DOC-20]]). The harness is
 * the discriminator every module leaf will delegate to, so its **own**
 * correctness is the gating deliverable: these tests are the proof-of-
 * discrimination. Deliberately-broken fixture modules MUST be flagged red; a
 * well-formed one MUST pass with no false positive. The negative fixtures are
 * mounted through the *same* catalog renderer via an injected resolver, never
 * the shipping catalog.
 *
 * The flag/pass tests drive a real headless Chromium (the only faithful way to
 * observe overflow, page errors, and collapse); they skip cleanly where no
 * browser is available. The isolation test needs no browser — it renders and
 * serves, then inspects what was mounted.
 */

const browserOk = await chromiumAvailable()
const itB = it.runIf(browserOk)

// ── the injected test-only catalog of deliberately-broken modules ─────────────
const brokenMeta = (id: string): CapabilityDefinition['meta'] => ({
  id,
  version: 1,
  kind: 'capability',
  config: {},
  slots: {},
  conformance: { obligations: ['safety'] },
})
const BROKEN: Record<string, CapabilityDefinition> = {
  'fc-overflow': { meta: brokenMeta('fc-overflow'), Component: Overflow },
  'fc-page-error': { meta: brokenMeta('fc-page-error'), Component: PageError },
  'fc-collapsed': { meta: brokenMeta('fc-collapsed'), Component: Collapsed },
}
const resolveBroken: ModuleResolver = (type) => {
  const def = BROKEN[type]
  if (!def) throw new Error(`Unknown broken conformance module: ${type}`)
  return def
}

/** A well-formed real catalog module — the clean, must-pass baseline. */
const cleanFixture: ConformanceFixture = {
  label: 'clean-carousel',
  props: {
    version: carouselMeta.version,
    // Behavioural config + L1-authored slide slots (REQ-85). Each slide is an L1
    // subtree; the marker text lets the isolation test prove the mount happened.
    config: { view: 'single' },
    slots: {
      slide: [
        { kind: 'text', text: 'Isolation Marker Heading' },
        { kind: 'text', text: 'A well-formed slide of prose that reflows within the viewport.' },
      ],
    },
  },
}

/** Run the harness and return the thrown ConformanceError (or null if it passed). */
async function conformanceErrorOf(
  slug: string,
  fixture: ConformanceFixture,
  opts: Parameters<typeof assertModuleConforms>[2],
): Promise<ConformanceError | null> {
  return assertModuleConforms(slug, [fixture], opts).then(
    () => null,
    (e: unknown) => e as ConformanceError,
  )
}

describe('Conformance harness core (REQ-39)', () => {
  itB('test_UAT_FC_REQ-39_clean_module_passes', async () => {
    // A well-formed real module conforms with no violations — no false positive.
    await expect(
      assertModuleConforms('carousel', [cleanFixture], {
        driverFactory: createPlaywrightDriver,
      }),
    ).resolves.toBeUndefined()
  }, 120000)

  itB('test_UAT_FC_REQ-39_overflow_fixture_flagged', async () => {
    const err = await conformanceErrorOf(
      'fc-overflow',
      { label: 'overflow', props: {} },
      { resolveModule: resolveBroken, driverFactory: createPlaywrightDriver, keepSandboxOnFailure: false },
    )
    expect(err).toBeInstanceOf(ConformanceError)
    expect(err?.violations.some((v) => v.ac === 'safety.overflow')).toBe(true)
  }, 120000)

  itB('test_UAT_FC_REQ-39_console_error_fixture_flagged', async () => {
    const err = await conformanceErrorOf(
      'fc-page-error',
      { label: 'page-error', props: {} },
      { resolveModule: resolveBroken, driverFactory: createPlaywrightDriver, keepSandboxOnFailure: false },
    )
    expect(err).toBeInstanceOf(ConformanceError)
    // An uncaught page error surfaces as a page error (and a console error).
    expect(
      err?.violations.some((v) => v.ac === 'safety.page-error' || v.ac === 'safety.console-error'),
    ).toBe(true)
  }, 120000)

  itB('test_UAT_FC_REQ-39_collapsed_container_flagged', async () => {
    const err = await conformanceErrorOf(
      'fc-collapsed',
      { label: 'collapsed', props: {} },
      { resolveModule: resolveBroken, driverFactory: createPlaywrightDriver, keepSandboxOnFailure: false },
    )
    expect(err).toBeInstanceOf(ConformanceError)
    expect(err?.violations.some((v) => v.ac === 'safety.collapsed')).toBe(true)
  }, 120000)

  itB('test_UAT_FC_REQ-39_except_suppresses_declared_ac', async () => {
    // The overflow module is flagged normally, but a declared `except` for its
    // AC lets the same fixture pass — the exemption mechanism.
    await expect(
      assertModuleConforms('fc-overflow', [{ label: 'overflow-excepted', props: {} }], {
        resolveModule: resolveBroken,
        driverFactory: createPlaywrightDriver,
        except: ['safety.overflow'],
      }),
    ).resolves.toBeUndefined()
  }, 120000)

  it('test_UAT_FC_REQ-39_isolation_renders_single_module', async () => {
    // The harness mounts exactly one module through the catalog renderer and
    // serves it over loopback — provable without a browser.
    const served = await serveOneModulePage('carousel', cleanFixture)
    try {
      expect(served.handle.url).toMatch(/^http:\/\/(localhost|127\.0\.0\.1):\d+\/$/)
      const html = await fetch(served.handle.url).then((r) => r.text())
      // Exactly one module band was rendered.
      expect((html.match(/<section/g) ?? []).length).toBe(1)
      // It went through the catalog renderer (theme.css) and carries our content.
      expect(html).toContain('theme.css')
      expect(html).toContain('Isolation Marker Heading')
    } finally {
      await served.dispose()
    }
  }, 60000)
})

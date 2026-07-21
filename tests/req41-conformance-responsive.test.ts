import { describe, expect, it } from 'vitest'
import type { CapabilityDefinition } from '@1stcontact/framework'
import {
  assertModuleConforms,
  ConformanceError,
  chromiumAvailable,
  createPlaywrightDriver,
  getModule,
  type ConformanceFixture,
  type ModuleResolver,
} from '../tools/generate/src'

const carouselMeta = getModule('carousel', 2).meta
import MobileOverflow from './fixtures/conformance/mobile-overflow.astro'
import SmallTapTarget from './fixtures/conformance/small-tap-target.astro'
import SmallFont from './fixtures/conformance/small-font.astro'
import ResponsiveClean from './fixtures/conformance/responsive-clean.astro'

/**
 * UATs for REQ-41 — the conformance harness **responsive dimension** ([[DOC-20]]
 * AC-M4). Responsive is the viewport axis over the REQ-39 fast safety checks
 * (overflow / collapse / clip, run at each width) plus two mobile-band checks:
 * tap targets ≥44px and a text legibility floor. As with REQ-39/40, the
 * discriminator's own correctness is the gated deliverable — deliberately-broken
 * fixtures MUST be flagged red, and a properly responsive module MUST pass at
 * every viewport with no false positive.
 *
 * The negative fixtures are mounted through the *same* catalog renderer via an
 * injected resolver, never the shipping catalog. Browser-driving tests skip
 * cleanly where no Chromium is available.
 */

const browserOk = await chromiumAvailable()
const itB = it.runIf(browserOk)

// ── the injected test-only catalog of responsive fixtures ─────────────────────
const brokenMeta = (id: string): CapabilityDefinition['meta'] => ({
  id,
  version: 1,
  kind: 'capability',
  config: {},
  slots: {},
  conformance: { obligations: ['responsive'] },
})
const FIXTURES: Record<string, CapabilityDefinition> = {
  'fc-mobile-overflow': { meta: brokenMeta('fc-mobile-overflow'), Component: MobileOverflow },
  'fc-small-tap-target': { meta: brokenMeta('fc-small-tap-target'), Component: SmallTapTarget },
  'fc-small-font': { meta: brokenMeta('fc-small-font'), Component: SmallFont },
  'fc-responsive-clean': { meta: brokenMeta('fc-responsive-clean'), Component: ResponsiveClean },
}
const resolveFixture: ModuleResolver = (type) => {
  const def = FIXTURES[type]
  if (!def) throw new Error(`Unknown responsive conformance fixture: ${type}`)
  return def
}

const RESPONSIVE = { dimension: 'responsive' as const, driverFactory: createPlaywrightDriver }

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

/** A well-formed real catalog module — the clean, must-pass baseline. */
const cleanCarousel: ConformanceFixture = {
  label: 'clean-carousel',
  props: {
    version: carouselMeta.version,
    config: { view: 'single' },
    slots: {
      slide: [
        {
          kind: 'text',
          text: 'A well-formed slide of prose that reflows within the viewport at every width from 320px up.',
        },
      ],
    },
  },
}

describe('Conformance harness responsive dimension (REQ-41)', () => {
  itB('test_UAT_FC_REQ-41_no_overflow_across_viewports', async () => {
    // A well-formed real module has no horizontal overflow at any width ≥320 —
    // the responsive default sweeps the full 320…1440 ladder and passes.
    await expect(
      assertModuleConforms('carousel', [cleanCarousel], RESPONSIVE),
    ).resolves.toBeUndefined()
  }, 180000)

  itB('test_UAT_FC_REQ-41_mobile_overflow_fixture_flagged', async () => {
    // A module that overflows only below 480px is flagged on the mobile widths…
    const err = await conformanceErrorOf(
      'fc-mobile-overflow',
      { label: 'mobile-overflow', props: {} },
      { ...RESPONSIVE, resolveModule: resolveFixture, keepSandboxOnFailure: false },
    )
    expect(err).toBeInstanceOf(ConformanceError)
    expect(
      err?.violations.some(
        (v) => v.ac === 'safety.overflow' && (v.viewport === '320' || v.viewport === '375'),
      ),
    ).toBe(true)
    // …but a desktop-only sweep misses it entirely — proving the viewport axis is
    // load-bearing, not decorative.
    await expect(
      assertModuleConforms('fc-mobile-overflow', [{ label: 'mobile-overflow-desktop', props: {} }], {
        ...RESPONSIVE,
        resolveModule: resolveFixture,
        viewports: [768, 1024, 1280, 1440],
      }),
    ).resolves.toBeUndefined()
  }, 180000)

  itB('test_UAT_FC_REQ-41_small_tap_target_flagged', async () => {
    // A standalone interactive control under 44px in the mobile band is flagged.
    const err = await conformanceErrorOf(
      'fc-small-tap-target',
      { label: 'small-tap-target', props: {} },
      { ...RESPONSIVE, resolveModule: resolveFixture, keepSandboxOnFailure: false },
    )
    expect(err).toBeInstanceOf(ConformanceError)
    expect(err?.violations.some((v) => v.ac === 'responsive.tap-target')).toBe(true)
  }, 180000)

  itB('test_UAT_FC_REQ-41_font_floor_enforced', async () => {
    // Text below the mobile legibility floor is flagged.
    const err = await conformanceErrorOf(
      'fc-small-font',
      { label: 'small-font', props: {} },
      { ...RESPONSIVE, resolveModule: resolveFixture, keepSandboxOnFailure: false },
    )
    expect(err).toBeInstanceOf(ConformanceError)
    expect(err?.violations.some((v) => v.ac === 'responsive.font-floor')).toBe(true)
  }, 180000)

  itB('test_UAT_FC_REQ-41_responsive_clean_passes', async () => {
    // A properly responsive module — adequately-sized tap target and legible text,
    // no fixed-width overflow — passes at every viewport with no false positive,
    // exercising the positive path of both mobile-band checks.
    await expect(
      assertModuleConforms(
        'fc-responsive-clean',
        [{ label: 'responsive-clean', props: {} }],
        { ...RESPONSIVE, resolveModule: resolveFixture },
      ),
    ).resolves.toBeUndefined()
  }, 180000)
})

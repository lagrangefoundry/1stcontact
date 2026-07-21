import { describe, expect, it } from 'vitest'
import type { CapabilityDefinition } from '@1stcontact/framework'
import {
  assertModuleConforms,
  ConformanceError,
  getModule,
  type ConformanceFixture,
  type ModuleResolver,
} from '../tools/generate/src'
import ThrowsOnRender from './fixtures/conformance/throws-on-render.astro'

/**
 * UATs for REQ-85 acceptance `conformance` — both capability modules satisfy the
 * capability conformance obligations, and the new **isolation** dimension is a
 * real discriminator. The universal browser dimensions (safety / security /
 * x-browser / responsive) are covered by req39–42 against the reframed config/slot
 * fixtures; this file proves (1) each capability *declares* the full obligation
 * set, (2) the render-level `isolation` check passes for degenerate-but-valid
 * input on both real capabilities, and (3) it flags a capability whose core
 * throws during render — so it is not a no-op. The isolation check needs no
 * browser, so it always runs.
 */

const carouselMeta = getModule('carousel', 2).meta
const contactFormMeta = getModule('contact-form', 3).meta

// A test-only catalog entry whose core throws during SSR (non-isolated).
const brokenIsolation = (id: string): CapabilityDefinition['meta'] => ({
  id,
  version: 1,
  kind: 'capability',
  config: {},
  slots: {},
  conformance: { obligations: ['isolation'] },
})
const resolveThrows: ModuleResolver = (type) => {
  if (type === 'fc-throws') return { meta: brokenIsolation('fc-throws'), Component: ThrowsOnRender }
  throw new Error(`Unknown isolation fixture: ${type}`)
}

/** Degenerate-but-schema-valid fixtures: wrong-typed config + missing/empty slots. */
const carouselDegenerate: ConformanceFixture = {
  label: 'carousel-degenerate',
  props: { version: 2, config: { view: 12345, controls: 'bogus' }, slots: {} },
}
const contactDegenerate: ConformanceFixture = {
  label: 'contact-degenerate',
  props: {
    version: 3,
    config: { action: 'https://example.com/lead', fields: 'not-a-list' },
    slots: {},
  },
}

describe('REQ-85 conformance — obligations + isolation dimension', () => {
  it('test_UAT_FC_REQ-85_capabilities_declare_the_full_obligation_set', () => {
    for (const meta of [carouselMeta, contactFormMeta]) {
      expect([...meta.conformance.obligations].sort()).toEqual([
        'isolation',
        'responsive',
        'safety',
        'security',
        'x-browser',
      ])
    }
  })

  it('test_UAT_FC_REQ-85_conformance_isolation_passes_for_degenerate_carousel', async () => {
    // Wrong-typed config + no slides must degrade inertly — no throw, section intact.
    await expect(
      assertModuleConforms('carousel', [carouselDegenerate], { dimension: 'isolation' }),
    ).resolves.toBeUndefined()
  }, 30000)

  it('test_UAT_FC_REQ-85_conformance_isolation_passes_for_degenerate_contact_form', async () => {
    await expect(
      assertModuleConforms('contact-form', [contactDegenerate], { dimension: 'isolation' }),
    ).resolves.toBeUndefined()
  }, 30000)

  it('test_UAT_FC_REQ-85_conformance_isolation_flags_a_capability_that_throws', async () => {
    // Proof the dimension discriminates: a core that throws during render is a
    // page-robustness break, flagged as isolation.render-throws.
    const err = await assertModuleConforms(
      'fc-throws',
      [{ label: 'throws', props: { config: {}, slots: {} } }],
      { dimension: 'isolation', resolveModule: resolveThrows },
    ).then(
      () => null,
      (e: unknown) => e as ConformanceError,
    )
    expect(err).toBeInstanceOf(ConformanceError)
    expect(err?.violations.some((v) => v.ac === 'isolation.render-throws')).toBe(true)
  }, 30000)
})

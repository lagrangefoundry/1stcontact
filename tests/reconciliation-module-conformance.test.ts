import { describe, expect, it } from 'vitest'
import { existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import type { ModuleDefinition } from '@1stcontact/framework'
import {
  assertModuleConforms,
  buildBenignContent,
  buildInjectionContent,
  ConformanceError,
  chromiumAvailable,
  createPlaywrightDriver,
  getModule,
  serveOneModulePage,
  type ConformanceFixture,
  type ModuleResolver,
} from '../tools/generate/src'
import Overflow from './fixtures/conformance/overflow.astro'
import PageError from './fixtures/conformance/page-error.astro'
import Collapsed from './fixtures/conformance/collapsed.astro'
import XssUrl from './fixtures/conformance/xss-url.astro'
import XssHandler from './fixtures/conformance/xss-handler.astro'
import CssBreakout from './fixtures/conformance/css-breakout.astro'
import Egress from './fixtures/conformance/egress.astro'

/**
 * Reconciliation UATs for story-a6962b23 — the shared module conformance harness
 * ([[DOC-20]]): render a module in isolation through the real catalog renderer
 * and fail on any safety / security violation, with the discriminator's own
 * correctness proven by deliberately-broken fixtures.
 *
 * One UAT per acceptance criterion. AC-548 (isolation) and AC-552/AC-553 (whose
 * decisive signals fire at render, before any browser) run unconditionally; the
 * purely browser-driven ACs (AC-549/AC-550/AC-551) skip cleanly where no Chromium
 * is available. AC-554 (the no-browser advisory no-op) lives in the sibling
 * `reconciliation-module-conformance-nobrowser.test.ts`, where `playwright` is
 * mocked absent so the no-op branch can be exercised deterministically.
 *
 * The negative fixtures are mounted through the *same* catalog renderer via an
 * injected resolver — never the shipping catalog.
 */

const browserOk = await chromiumAvailable()
const itB = it.runIf(browserOk)

const textBlockMeta = getModule('text-block', 1).meta

// ── injected test-only catalogs of deliberately-broken / -unsafe modules ──────
const brokenMeta = (id: string): ModuleDefinition['meta'] => ({
  id,
  version: 1,
  variants: [],
  dials: {},
  contentSchema: {},
})
const SAFETY_BROKEN: Record<string, ModuleDefinition> = {
  'fc-overflow': { meta: brokenMeta('fc-overflow'), Component: Overflow },
  'fc-page-error': { meta: brokenMeta('fc-page-error'), Component: PageError },
  'fc-collapsed': { meta: brokenMeta('fc-collapsed'), Component: Collapsed },
}
const SECURITY_BROKEN: Record<string, ModuleDefinition> = {
  'fc-xss-url': { meta: brokenMeta('fc-xss-url'), Component: XssUrl },
  'fc-xss-handler': { meta: brokenMeta('fc-xss-handler'), Component: XssHandler },
  'fc-css-breakout': { meta: brokenMeta('fc-css-breakout'), Component: CssBreakout },
  'fc-egress': { meta: brokenMeta('fc-egress'), Component: Egress },
}
const resolveFrom =
  (catalog: Record<string, ModuleDefinition>): ModuleResolver =>
  (type) => {
    const def = catalog[type]
    if (!def) throw new Error(`Unknown conformance fixture: ${type}`)
    return def
  }
const resolveSafetyBroken = resolveFrom(SAFETY_BROKEN)
const resolveSecurityBroken = resolveFrom(SECURITY_BROKEN)

/** A well-formed real catalog module — the clean, must-pass baseline. */
const cleanFixture: ConformanceFixture = {
  label: 'clean-text-block',
  props: {
    variant: 'prose',
    content: {
      heading: 'Isolation Marker Heading',
      body: 'A well-formed paragraph of prose that renders cleanly and stays within the viewport.',
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

describe('Reconciliation — module conformance harness (story-a6962b23)', () => {
  // AC-548 — renders a single module through the real catalog renderer over
  // loopback, backed by an isolated throwaway store root that is cleaned up.
  it('test_UAT_AC548_isolation_single_module_no_site_pollution', async () => {
    const served = await serveOneModulePage('text-block', cleanFixture)
    try {
      // Served over a loopback address.
      expect(served.handle.url).toMatch(/^http:\/\/(localhost|127\.0\.0\.1):\d+\/$/)
      const html = await fetch(served.handle.url).then((r) => r.text())
      // Exactly one module band, produced by the real catalog renderer (theme.css
      // present) and carrying the fixture's authored content.
      expect((html.match(/<section/g) ?? []).length).toBe(1)
      expect(html).toContain('theme.css')
      expect(html).toContain('Isolation Marker Heading')
      // The backing store root is an isolated temp dir — never real site storage.
      expect(served.root).toContain('fc-conformance-')
      expect(served.root.startsWith(tmpdir())).toBe(true)
      expect(served.root.startsWith(process.cwd())).toBe(false)
      expect(existsSync(served.root)).toBe(true)
    } finally {
      await served.dispose()
    }
    // A clean pass removes the sandbox — no pollution left behind.
    expect(existsSync(served.root)).toBe(false)
  }, 60000)

  // AC-549 — the safety dimension flags a broken render, tagging each violation
  // with its stable category id and the fixture that produced it.
  itB('test_UAT_AC549_safety_flags_broken_render_by_category', async () => {
    const cases = [
      { slug: 'fc-overflow', label: 'overflow', acs: ['safety.overflow'] },
      { slug: 'fc-page-error', label: 'page-error', acs: ['safety.page-error', 'safety.console-error'] },
      { slug: 'fc-collapsed', label: 'collapsed', acs: ['safety.collapsed'] },
    ]
    for (const c of cases) {
      const err = await conformanceErrorOf(
        c.slug,
        { label: c.label, props: {} },
        { resolveModule: resolveSafetyBroken, driverFactory: createPlaywrightDriver, keepSandboxOnFailure: false },
      )
      expect(err, `${c.slug} must be flagged`).toBeInstanceOf(ConformanceError)
      expect(err?.violations.some((v) => c.acs.includes(v.ac)), `${c.slug} category`).toBe(true)
      // Every violation identifies the fixture that produced it.
      expect(err?.violations.every((v) => v.fixture === c.label)).toBe(true)
    }
  }, 300000)

  // AC-550 — a well-formed module passes with no false-positive violation, in
  // both the safety dimension and the security dimension (schema-derived benign).
  itB('test_UAT_AC550_wellformed_module_passes_both_dimensions', async () => {
    await expect(
      assertModuleConforms('text-block', [cleanFixture], { driverFactory: createPlaywrightDriver }),
    ).resolves.toBeUndefined()

    const benign: ConformanceFixture = {
      label: 'text-block-benign',
      props: { variant: textBlockMeta.variants[0], content: buildBenignContent(textBlockMeta) },
    }
    await expect(
      assertModuleConforms('text-block', [benign], { dimension: 'security', driverFactory: createPlaywrightDriver }),
    ).resolves.toBeUndefined()
  }, 300000)

  // AC-551 — a declared exemption suppresses a specific check category while any
  // non-excepted violation still fails the run.
  itB('test_UAT_AC551_declared_exemption_suppresses_only_its_category', async () => {
    const overflow: ConformanceFixture = { label: 'overflow', props: {} }
    const base = {
      resolveModule: resolveSafetyBroken,
      driverFactory: createPlaywrightDriver,
      keepSandboxOnFailure: false,
    }
    // Flagged normally when not excepted.
    const err = await conformanceErrorOf('fc-overflow', overflow, base)
    expect(err).toBeInstanceOf(ConformanceError)
    expect(err?.violations.some((v) => v.ac === 'safety.overflow')).toBe(true)
    // Passes when its own category is declared in `except`.
    await expect(
      assertModuleConforms('fc-overflow', [overflow], { ...base, except: ['safety.overflow'] }),
    ).resolves.toBeUndefined()
    // An UNRELATED exemption does not suppress the real violation — still fails.
    const err2 = await conformanceErrorOf('fc-overflow', overflow, { ...base, except: ['security.egress'] })
    expect(err2).toBeInstanceOf(ConformanceError)
    expect(err2?.violations.some((v) => v.ac === 'safety.overflow')).toBe(true)
  }, 300000)

  // AC-552 — the security dimension fills the module's schema-declared content
  // fields with hostile values and flags an injection-live / off-allowlist render,
  // identifying each violation's security category.
  it('test_UAT_AC552_security_flags_injection_from_schema_payloads', async () => {
    // Payloads are DERIVED from the module's declared content schema, not
    // hand-listed: every filled key is a declared content field, carrying a
    // hostile vector.
    const injected = buildInjectionContent(textBlockMeta)
    const declaredFields = Object.keys(textBlockMeta.contentSchema)
    expect(declaredFields.length).toBeGreaterThan(0)
    expect(Object.keys(injected).length).toBeGreaterThan(0)
    expect(Object.keys(injected).every((k) => declaredFields.includes(k))).toBe(true)
    expect(JSON.stringify(injected)).toMatch(/__fcXssExecuted|onerror|javascript:/)

    // Detector: each deliberately-unsafe fixture is flagged with its security
    // category (needs a browser to observe the rendered DOM / egress).
    if (!browserOk) return
    const cases = [
      { slug: 'fc-xss-url', label: 'xss-url', ac: 'security.url-scheme' },
      { slug: 'fc-xss-handler', label: 'xss-handler', ac: 'security.script' },
      { slug: 'fc-css-breakout', label: 'css-breakout', ac: 'security.css-breakout' },
      { slug: 'fc-egress', label: 'egress', ac: 'security.egress' },
    ]
    for (const c of cases) {
      const err = await conformanceErrorOf(
        c.slug,
        { label: c.label, props: {} },
        {
          dimension: 'security',
          resolveModule: resolveSecurityBroken,
          driverFactory: createPlaywrightDriver,
          keepSandboxOnFailure: false,
        },
      )
      expect(err, `${c.slug} must be flagged`).toBeInstanceOf(ConformanceError)
      expect(err?.violations.some((v) => v.ac === c.ac), `${c.slug} category`).toBe(true)
    }
  }, 300000)

  // AC-553 — a module that fails loud on hostile content is counted as a
  // conformant safe-rejection; a non-safety render error still propagates. The
  // rejection short-circuits at render (before any browser launch), so this runs
  // deterministically even without Chromium.
  it('test_UAT_AC553_content_safety_refusal_is_conformant_safe_rejection', async () => {
    const heroMeta = getModule('hero', 1).meta
    const injection: ConformanceFixture = {
      label: 'hero-injection',
      props: { variant: heroMeta.variants[0], content: buildInjectionContent(heroMeta) },
    }
    // The render refuses the injected payload (ContentSafetyError) → no violation.
    await expect(
      assertModuleConforms('hero', [injection], {
        dimension: 'security',
        driverFactory: createPlaywrightDriver,
        keepSandboxOnFailure: false,
      }),
    ).resolves.toBeUndefined()

    // A NON-safety error from the render still propagates as a real failure.
    const throwing: ModuleResolver = () => {
      throw new Error('boom-non-safety-render-error')
    }
    const benign: ConformanceFixture = {
      label: 'text-block-benign',
      props: { variant: textBlockMeta.variants[0], content: buildBenignContent(textBlockMeta) },
    }
    await expect(
      assertModuleConforms('text-block', [benign], {
        dimension: 'security',
        driverFactory: createPlaywrightDriver,
        resolveModule: throwing,
        keepSandboxOnFailure: false,
      }),
    ).rejects.toThrow('boom-non-safety-render-error')
  }, 120000)
})

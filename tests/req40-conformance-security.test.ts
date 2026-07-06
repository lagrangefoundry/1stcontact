import { describe, expect, it } from 'vitest'
import type { ModuleDefinition } from '@1stcontact/framework'
import {
  assertModuleConforms,
  buildBenignContent,
  buildInjectionContent,
  ConformanceError,
  chromiumAvailable,
  createPlaywrightDriver,
  getModule,
  type ConformanceFixture,
  type ModuleResolver,
} from '../tools/generate/src'

const heroMeta = getModule('hero', 1).meta
const textBlockMeta = getModule('text-block', 1).meta
import XssUrl from './fixtures/conformance/xss-url.astro'
import XssHandler from './fixtures/conformance/xss-handler.astro'
import CssBreakout from './fixtures/conformance/css-breakout.astro'
import Egress from './fixtures/conformance/egress.astro'

/**
 * UATs for REQ-40 — the conformance harness **security dimension** ([[DOC-20]]
 * AC-M2). The dimension is a *detector*: it treats every module as the
 * sanitization boundary for untrusted content and flags a render that is not
 * injection-inert or that egresses off-allowlist. As with REQ-39, the detector's
 * own discrimination is the gated deliverable — deliberately-unsafe fixture
 * modules MUST be flagged red and clean content MUST pass with no false positive.
 *
 * The final test is a **gap demonstration**: pointing the dimension at a *real*
 * catalog module configured with an injected `javascript:` payload flags it
 * today, proving the render path is unenforced. That is the evidence motivating
 * [[REQ-46]] (renderer hardening); when REQ-46 lands, this expectation inverts
 * (the real module is rejected at load / rendered inert) and this test flips.
 *
 * Browser-driving tests skip cleanly where no Chromium is available.
 */

const browserOk = await chromiumAvailable()
const itB = it.runIf(browserOk)
/**
 * Expected-fail (xfail): the assertion is the **secure** contract REQ-46 will
 * deliver. It fails today — that failure is the gap — so `it.fails` keeps the
 * suite green while recording it as a known failure. The moment REQ-46 makes the
 * body pass, `it.fails` flips to a hard RED, forcing this to be converted to a
 * plain `itB(...)`. Skips cleanly on a browser-less runner.
 */
const itBGap = it.runIf(browserOk).fails

// ── the injected test-only catalog of deliberately-unsafe modules ─────────────
const brokenMeta = (id: string): ModuleDefinition['meta'] => ({
  id,
  version: 1,
  variants: [],
  dials: {},
  contentSchema: {},
})
const BROKEN: Record<string, ModuleDefinition> = {
  'fc-xss-url': { meta: brokenMeta('fc-xss-url'), Component: XssUrl },
  'fc-xss-handler': { meta: brokenMeta('fc-xss-handler'), Component: XssHandler },
  'fc-css-breakout': { meta: brokenMeta('fc-css-breakout'), Component: CssBreakout },
  'fc-egress': { meta: brokenMeta('fc-egress'), Component: Egress },
}
const resolveBroken: ModuleResolver = (type) => {
  const def = BROKEN[type]
  if (!def) throw new Error(`Unknown security conformance fixture: ${type}`)
  return def
}

const SECURITY = { dimension: 'security' as const, driverFactory: createPlaywrightDriver }

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

describe('Conformance harness security dimension (REQ-40)', () => {
  itB('test_UAT_FC_REQ-40_unsafe_url_scheme_rejected', async () => {
    // A `javascript:` / `data:text/html` href must be caught as unsafe-scheme.
    const err = await conformanceErrorOf(
      'fc-xss-url',
      { label: 'xss-url', props: {} },
      { ...SECURITY, resolveModule: resolveBroken, keepSandboxOnFailure: false },
    )
    expect(err).toBeInstanceOf(ConformanceError)
    expect(err?.violations.some((v) => v.ac === 'security.url-scheme')).toBe(true)
  }, 120000)

  itB('test_UAT_FC_REQ-40_script_payload_rendered_inert', async () => {
    // The inert-script contract: a render that is NOT inert must be flagged. A
    // module emitting an inline `on*` handler that fires is caught as
    // `security.script` — so the day a module renders a payload live (rather than
    // escaped), the detector fails it rather than shipping executing script.
    const err = await conformanceErrorOf(
      'fc-xss-handler',
      { label: 'xss-handler', props: {} },
      { ...SECURITY, resolveModule: resolveBroken, keepSandboxOnFailure: false },
    )
    expect(err).toBeInstanceOf(ConformanceError)
    expect(err?.violations.some((v) => v.ac === 'security.script')).toBe(true)
  }, 120000)

  itB('test_UAT_FC_REQ-40_css_breakout_blocked', async () => {
    const err = await conformanceErrorOf(
      'fc-css-breakout',
      { label: 'css-breakout', props: {} },
      { ...SECURITY, resolveModule: resolveBroken, keepSandboxOnFailure: false },
    )
    expect(err).toBeInstanceOf(ConformanceError)
    expect(err?.violations.some((v) => v.ac === 'security.css-breakout')).toBe(true)
  }, 120000)

  itB('test_UAT_FC_REQ-40_unexpected_egress_flagged', async () => {
    const err = await conformanceErrorOf(
      'fc-egress',
      { label: 'egress', props: {} },
      { ...SECURITY, resolveModule: resolveBroken, keepSandboxOnFailure: false },
    )
    expect(err).toBeInstanceOf(ConformanceError)
    expect(err?.violations.some((v) => v.ac === 'security.egress')).toBe(true)
  }, 120000)

  itB('test_UAT_FC_REQ-40_clean_content_passes', async () => {
    // Ordinary, schema-derived benign content on a real module passes with no
    // security violation — the detector does not false-positive.
    const benign: ConformanceFixture = {
      label: 'text-block-benign',
      props: { variant: textBlockMeta.variants[0], content: buildBenignContent(textBlockMeta) },
    }
    await expect(assertModuleConforms('text-block', [benign], SECURITY)).resolves.toBeUndefined()
  }, 120000)

  itBGap('test_UAT_FC_REQ-40_real_module_rejects_unsafe_url', async () => {
    // GAP ([[REQ-46]]), URL-scheme vector. The SECURE contract: a real catalog
    // module given schema-derived injection content (a `javascript:` CTA href and
    // markdown link) must render inert / be rejected — no security violation.
    // FAILS today: the render path does no enforcement, so it emits live
    // `javascript:` hrefs and the security dimension flags `security.url-scheme`.
    // When REQ-46 lands this passes → `it.fails` flips → convert to `itB(...)`.
    const injection: ConformanceFixture = {
      label: 'hero-injection',
      props: { variant: heroMeta.variants[0], content: buildInjectionContent(heroMeta) },
    }
    await assertModuleConforms('hero', [injection], { ...SECURITY, keepSandboxOnFailure: false })
  }, 120000)

  itBGap('test_UAT_FC_REQ-40_real_module_renders_injected_script_inert', async () => {
    // GAP ([[REQ-46]]), inline-content vector. The SECURE contract: a raw <script>
    // in a real module's `markdown` body must not execute. FAILS today — the
    // framework renders markdown with raw-HTML passthrough, so the parser-inserted
    // <script> lands in the static HTML and EXECUTES on load (sentinel fires),
    // which the security dimension flags `security.script`. Flips when REQ-46 lands.
    const scriptInBody: ConformanceFixture = {
      label: 'text-block-live-script',
      props: {
        variant: textBlockMeta.variants[0],
        content: { body: 'Intro copy <script>window.__fcXssExecuted=true</script> and outro copy.' },
      },
    }
    await assertModuleConforms('text-block', [scriptInBody], { ...SECURITY, keepSandboxOnFailure: false })
  }, 120000)
})

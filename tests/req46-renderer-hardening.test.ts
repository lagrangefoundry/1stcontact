import { describe, expect, it } from 'vitest'
import {
  assertModuleConforms,
  buildInjectionContent,
  chromiumAvailable,
  createPlaywrightDriver,
  getModule,
  type ConformanceFixture,
} from '../tools/generate/src'

/**
 * REQ-46 acceptance spec — the renderer/validator must **fail loud on dangerous
 * content** instead of silently rendering it. These are deliberately **RED until
 * REQ-46 is implemented**: they assert the SECURE contract (a real catalog module
 * given schema-derived injection content renders inert / is rejected — no security
 * violation), which the render path does NOT satisfy today. They are the
 * failing-test signal that the gap the [[REQ-40]] security dimension detects is
 * still open; each turns GREEN the moment REQ-46 lands.
 *
 * Two vectors, both confirmed live by the REQ-40 detector:
 *   1. unsafe URL scheme  — a `javascript:` CTA href / markdown link is emitted raw.
 *   2. inline HTML         — a raw <script> in a markdown field executes on load.
 *
 * Browser-driving tests skip cleanly where no Chromium is available.
 */

const browserOk = await chromiumAvailable()
const itB = it.runIf(browserOk)
const SECURITY = { dimension: 'security' as const, driverFactory: createPlaywrightDriver }
const heroMeta = getModule('hero', 1).meta
const textBlockMeta = getModule('text-block', 1).meta

describe('Renderer hardening acceptance (REQ-46) — RED until implemented', () => {
  itB('test_UAT_FC_REQ-46_real_module_rejects_unsafe_url', async () => {
    // SECURE contract: a real `hero` given a `javascript:` CTA href + markdown link
    // must render inert / be rejected. FAILS today — the render path emits the live
    // scheme and the security dimension flags `security.url-scheme`.
    const injection: ConformanceFixture = {
      label: 'hero-injection',
      props: { variant: heroMeta.variants[0], content: buildInjectionContent(heroMeta) },
    }
    await expect(
      assertModuleConforms('hero', [injection], { ...SECURITY, keepSandboxOnFailure: false }),
    ).resolves.toBeUndefined()
  }, 120000)

  itB('test_UAT_FC_REQ-46_real_module_renders_injected_script_inert', async () => {
    // SECURE contract: a raw <script> in a real `text-block` markdown body must not
    // execute. FAILS today — markdown renders with raw-HTML passthrough, so the
    // parser-inserted <script> lands in the static HTML and runs (sentinel fires),
    // flagged `security.script`.
    const scriptInBody: ConformanceFixture = {
      label: 'text-block-live-script',
      props: {
        variant: textBlockMeta.variants[0],
        content: { body: 'Intro copy <script>window.__fcXssExecuted=true</script> and outro copy.' },
      },
    }
    await expect(
      assertModuleConforms('text-block', [scriptInBody], { ...SECURITY, keepSandboxOnFailure: false }),
    ).resolves.toBeUndefined()
  }, 120000)
})

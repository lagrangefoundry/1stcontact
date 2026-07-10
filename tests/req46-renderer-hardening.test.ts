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
 * REQ-46 acceptance spec — the renderer **fails loud on dangerous content**
 * instead of silently rendering it. Each test asserts the SECURE contract: a real
 * catalog module given schema-derived injection content produces **no security
 * violation** — because the render path *rejects* the dangerous value
 * (`ContentSafetyError`) rather than emitting it. The [[REQ-40]] security
 * dimension is the detector these run through; its harness now counts a fail-loud
 * rejection as conformant.
 *
 * These were RED until REQ-46 landed (the render path emitted the live vectors);
 * they are GREEN now that enforcement is in place. Two confirmed vectors plus the
 * other two URL-bearing modules, proving the sink wiring end-to-end:
 *   1. unsafe URL scheme  — a `javascript:` CTA href / markdown link (hero,
 *      services-grid) and a `javascript:` form `action` (contact-form).
 *   2. inline HTML         — a raw <script> in a markdown field (text-block).
 *
 * Browser-driving tests skip cleanly where no Chromium is available; note the
 * rejection short-circuits *before* any browser launch (it throws at render).
 */

const browserOk = await chromiumAvailable()
const itB = it.runIf(browserOk)
const SECURITY = { dimension: 'security' as const, driverFactory: createPlaywrightDriver }
const heroMeta = getModule('hero', 2).meta
const textBlockMeta = getModule('text-block', 2).meta
const servicesGridMeta = getModule('services-grid', 2).meta
const contactFormMeta = getModule('contact-form', 2).meta

/** An injection fixture built generically from a module's own content schema. */
function injectionFixture(meta: typeof heroMeta): ConformanceFixture {
  return {
    label: `${meta.id}-injection`,
    props: { version: meta.version, variant: meta.variants[0], content: buildInjectionContent(meta) },
  }
}

describe('Renderer hardening acceptance (REQ-46)', () => {
  itB('test_UAT_FC_REQ-46_real_module_rejects_unsafe_url', async () => {
    // A real `hero` given a `javascript:` CTA href + markdown link must be rejected
    // (was: emitted live → `security.url-scheme`).
    await expect(
      assertModuleConforms('hero', [injectionFixture(heroMeta)], {
        ...SECURITY,
        keepSandboxOnFailure: false,
      }),
    ).resolves.toBeUndefined()
  }, 120000)

  itB('test_UAT_FC_REQ-46_real_module_renders_injected_script_inert', async () => {
    // A raw <script> in a real `text-block` markdown body must not execute (was:
    // parser-inserted script ran on load → sentinel fired → `security.script`).
    const scriptInBody: ConformanceFixture = {
      label: 'text-block-live-script',
      props: {
        version: 2,
        variant: textBlockMeta.variants[0],
        content: { body: 'Intro copy <script>window.__fcXssExecuted=true</script> and outro copy.' },
      },
    }
    await expect(
      assertModuleConforms('text-block', [scriptInBody], { ...SECURITY, keepSandboxOnFailure: false }),
    ).resolves.toBeUndefined()
  }, 120000)

  itB('test_UAT_FC_REQ-46_services_grid_rejects_unsafe_url', async () => {
    // A real `services-grid` given injected card CTA hrefs + markdown-link bodies
    // must be rejected at the render sinks (`assertSafeUrl` / hardened markdown).
    await expect(
      assertModuleConforms('services-grid', [injectionFixture(servicesGridMeta)], {
        ...SECURITY,
        keepSandboxOnFailure: false,
      }),
    ).resolves.toBeUndefined()
  }, 120000)

  itB('test_UAT_FC_REQ-46_contact_form_rejects_unsafe_action', async () => {
    // A real `contact-form` given a `javascript:` form `action` must be rejected
    // at the `action` sink rather than emitting a live scheme.
    await expect(
      assertModuleConforms('contact-form', [injectionFixture(contactFormMeta)], {
        ...SECURITY,
        keepSandboxOnFailure: false,
      }),
    ).resolves.toBeUndefined()
  }, 120000)
})

import { describe, expect, it } from 'vitest'
import { generateThemeCss } from '../packages/framework/src/tokens/css'

/**
 * UATs for REQ-32 capability 5 — the surviving token surface. The `layer`
 * art-direction treatments (image shadow/border, text typography) went away with
 * the semantic `layer` module in the framework pivot (REQ-84); what survives — and
 * is asserted here — is the `xl` shadow token those treatments referenced, still
 * emitted by `generateThemeCss` and available to L1 / capability modules.
 */

describe('REQ-32 cap 5 — xl shadow token', () => {
  it('test_UAT_FC_REQ-32_xl_shadow_token_emitted_and_overridable', () => {
    // The default theme emits `--shadow-xl` (safe to reference from a treatment).
    const css = generateThemeCss()
    expect(css).toContain('--shadow-xl:')

    // A site can tune the exact value in its theme (site-specific config).
    const tuned = generateThemeCss({
      shadow: { xl: '0 20px 60px rgba(0,0,0,0.6)' } as any,
    })
    expect(tuned).toContain('--shadow-xl: 0 20px 60px rgba(0,0,0,0.6);')
  })
})

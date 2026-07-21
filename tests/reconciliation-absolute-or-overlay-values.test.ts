import { describe, expect, it } from 'vitest'
import { validateModuleContent } from '../packages/framework/src/modules/validate'
import type { ModuleMeta } from '../packages/framework/src/modules/types'

/**
 * Reconciliation UAT for story-c490f1cf — "Absolute-or-overlay values": a length
 * dial accepts either an exact absolute value (for reproducing a captured site)
 * or a named overlay (spacing step / container width). Length validation is
 * exercised at the framework validation entry (validateModuleContent), the
 * surviving observable boundary after the carousel/contact-form dials were
 * dropped in the framework pivot (REQ-85).
 *
 *   AC-664 malformed length fails validation with a descriptive error
 */

// ── AC-664: a malformed length fails validation with a descriptive error ───────
describe('AC-664 — malformed length fails site validation loudly', () => {
  const lengthMeta: ModuleMeta = {
    id: 'test-length',
    version: 1,
    variants: ['default'],
    dials: {},
    contentSchema: { width: { type: 'length', required: false } },
  }

  it('test_UAT_AC664_malformed_length_fails_validation', () => {
    // A typo'd unit is neither an absolute/relative/content length nor a token.
    const errors = validateModuleContent(lengthMeta, { width: '8ppx' })
    expect(errors).toHaveLength(1)
    expect(errors[0].field).toBe('width')
    // The error names the field's expected forms and echoes the bad value.
    expect(errors[0].message).toContain('must be a length')
    expect(errors[0].message).toContain('fit-content')
    expect(errors[0].message).toContain('8ppx')

    // Well-formed lengths of every kind pass silently (the malformed value is the
    // only failure — the escape hatch does not weaken validation).
    expect(validateModuleContent(lengthMeta, { width: '80px' })).toEqual([])
    expect(validateModuleContent(lengthMeta, { width: '50%' })).toEqual([])
    expect(validateModuleContent(lengthMeta, { width: 'fit-content' })).toEqual([])
    expect(validateModuleContent(lengthMeta, { width: 'lg' })).toEqual([])
  })
})

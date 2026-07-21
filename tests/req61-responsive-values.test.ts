import { describe, expect, it } from 'vitest'
import {
  responsiveStepVars,
  isResponsiveValue,
  resolveStep,
  SPACING_STEPS,
} from '../packages/framework/src/modules/dials'
import {
  BREAKPOINTS,
  BREAKPOINT_PX,
  overrideChain,
  responsivePropertyRules,
} from '../packages/framework/src/modules/breakpoints'
import { responsiveDialValueSchema } from '../packages/site-schema/src/schema'

/**
 * UATs for REQ-61 — per-breakpoint length values (the def-side reproduction
 * mandate: every length parameter expressible as absolute values, now across the
 * breakpoint dimension, via the shared resolveStep / --fc-* var seam).
 */

// ── the shared breakpoint primitive ──────────────────────────────────────────

describe('REQ-61 — breakpoints primitive (override-and-up)', () => {
  it('test_UAT_FC_REQ-61_override_chain_falls_through_to_base', () => {
    // At sm only the sm override (else base); at xl the full nested fallback.
    expect(overrideChain('pt', 0)).toBe('var(--fc-pt-sm, var(--fc-pt))')
    expect(overrideChain('pt', 3)).toBe(
      'var(--fc-pt-xl, var(--fc-pt-lg, var(--fc-pt-md, var(--fc-pt-sm, var(--fc-pt)))))',
    )
    // The vocabulary + widths are the position model's (shared, never drifting).
    expect([...BREAKPOINTS]).toEqual(['sm', 'md', 'lg', 'xl'])
    expect(BREAKPOINT_PX).toEqual({ sm: 640, md: 768, lg: 1024, xl: 1280 })
  })

  it('test_UAT_FC_REQ-61_property_rules_emit_media_blocks_per_breakpoint', () => {
    const css = responsivePropertyRules('.text-block', 'padding-top', 'pt')
    expect(css).toContain('@media (min-width: 640px) { .text-block { padding-top: var(--fc-pt-sm, var(--fc-pt)); } }')
    expect(css).toContain('@media (min-width: 1280px)')
    // One block per breakpoint.
    expect(css.match(/@media/g)).toHaveLength(4)
  })
})

// ── the responsive resolver ──────────────────────────────────────────────────

describe('REQ-61 — responsiveStepVars (scalar path unchanged, object path adds overrides)', () => {
  it('test_UAT_FC_REQ-61_scalar_emits_only_base_var', () => {
    // A scalar dial is byte-identical to the old resolveStep single-var emission.
    expect(responsiveStepVars('pt', 'lg', SPACING_STEPS, 'lg')).toBe(`--fc-pt: ${resolveStep('lg', SPACING_STEPS, 'lg')}`)
    expect(responsiveStepVars('pt', 80, SPACING_STEPS, 'lg')).toBe('--fc-pt: 80px')
    // Absent → the fallback resolution, still one base var.
    expect(responsiveStepVars('pt', undefined, SPACING_STEPS, 'lg')).toBe(`--fc-pt: ${resolveStep('lg', SPACING_STEPS, 'lg')}`)
  })

  it('test_UAT_FC_REQ-61_object_emits_base_plus_present_overrides', () => {
    // Per-breakpoint absolute values: base + only the breakpoints supplied.
    const vars = responsiveStepVars('pt', { base: 32, md: 48, xl: 64 }, SPACING_STEPS, 'lg')
    expect(vars).toBe('--fc-pt: 32px; --fc-pt-md: 48px; --fc-pt-xl: 64px')
    // Each value goes through the overlay/absolute seam: a named step resolves.
    const mixed = responsiveStepVars('pt', { base: 'lg', sm: 24 }, SPACING_STEPS, 'lg')
    expect(mixed).toBe(`--fc-pt: ${SPACING_STEPS.lg}; --fc-pt-sm: 24px`)
  })

  it('test_UAT_FC_REQ-61_is_responsive_value_guard', () => {
    expect(isResponsiveValue({ base: 10 })).toBe(true)
    expect(isResponsiveValue(10)).toBe(false)
    expect(isResponsiveValue('lg')).toBe(false)
    expect(isResponsiveValue(null)).toBe(false)
  })
})

// ── the schema shape ─────────────────────────────────────────────────────────

describe('REQ-61 — responsiveDialValueSchema accepts the per-breakpoint shape', () => {
  it('test_UAT_FC_REQ-61_schema_accepts_base_plus_breakpoints', () => {
    expect(responsiveDialValueSchema.safeParse({ base: 32, md: '48px', xl: 64 }).success).toBe(true)
    // base is required.
    expect(responsiveDialValueSchema.safeParse({ md: 48 }).success).toBe(false)
    // strict — a stray key is rejected, not silently dropped.
    expect(responsiveDialValueSchema.safeParse({ base: 32, xxl: 64 }).success).toBe(false)
  })
})


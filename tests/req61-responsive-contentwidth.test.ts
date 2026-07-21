import { describe, expect, it } from 'vitest'
import { responsiveContainerWidthVars } from '../packages/framework/src/modules/dials'

/**
 * UATs for REQ-61 — per-breakpoint `contentWidth` (the max-width cap). Unlike the
 * plain length dials, a cap can mean "no cap" (bleed/absent → null), so the
 * resolver returns both the vars and whether a base cap exists (gates the
 * `has-content-width` class).
 */

describe('REQ-61 — responsiveContainerWidthVars handles caps + no-cap', () => {
  it('test_UAT_FC_REQ-61_content_width_scalar_and_bleed', () => {
    expect(responsiveContainerWidthVars(896)).toEqual({ decls: '--fc-content-width: 896px', hasCap: true })
    expect(responsiveContainerWidthVars('4xl')).toEqual({ decls: '--fc-content-width: var(--container-4xl)', hasCap: true })
    // bleed / absent → no cap: no decls, class stays off.
    expect(responsiveContainerWidthVars('bleed')).toEqual({ decls: '', hasCap: false })
    expect(responsiveContainerWidthVars(undefined)).toEqual({ decls: '', hasCap: false })
  })

  it('test_UAT_FC_REQ-61_content_width_per_breakpoint', () => {
    const { decls, hasCap } = responsiveContainerWidthVars({ base: '4xl', lg: 896 })
    expect(hasCap).toBe(true)
    expect(decls).toBe('--fc-content-width: var(--container-4xl); --fc-content-width-lg: 896px')
    // A per-breakpoint cap needs a base cap (the class hangs off it); a bleed base
    // means no cap at all, so overrides are dropped with it.
    expect(responsiveContainerWidthVars({ base: 'bleed', md: 896 }).hasCap).toBe(false)
  })
})

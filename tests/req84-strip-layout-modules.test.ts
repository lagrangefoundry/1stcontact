import { describe, expect, it } from 'vitest'
import * as framework from '../packages/framework/src/index'
import { registry, getModule, getModuleCss } from '../packages/framework/src/modules'

/**
 * UATs for REQ-84 — strip the semantic layout-module system now that L1 is the
 * layout substrate. Evidence that the catalog reduces to the capability modules,
 * that every deleted layout module is a genuine catalog miss, that the aggregated
 * module CSS carries only capability-module rules, and that no deleted layout /
 * composition symbol survives on the framework's public surface (a dangling
 * export would be a build break — its absence proves the strip left no vestige).
 */
describe('REQ-84 — strip layout modules to L1', () => {
  it('test_UAT_FC_REQ-84_no_layout_modules', () => {
    // The catalog holds ONLY the capability modules.
    const ids = [...registry.values()].map((d) => d.meta.id).sort()
    expect(ids).toEqual(['carousel', 'contact-form'])

    // getModule for every deleted semantic layout module is a catalog miss.
    const deleted: [string, number][] = [
      ['hero', 2],
      ['header', 2],
      ['footer', 1],
      ['text-block', 2],
      ['services-grid', 2],
      ['layer', 1],
    ]
    for (const [id, v] of deleted) {
      expect(() => getModule(id, v), `${id} must be gone`).toThrow(/not found in catalog/i)
    }

    // getModuleCss iterates ONLY capability modules — no deleted-module CSS.
    const css = getModuleCss()
    expect(css).toContain('/* module: carousel */')
    expect(css).toContain('/* module: contact-form */')
    for (const dead of ['hero', 'header', 'footer', 'text-block', 'services-grid', 'layer']) {
      expect(css, `${dead} CSS must be gone`).not.toContain(`/* module: ${dead} */`)
    }
  })

  it('test_UAT_FC_REQ-84_build_clean_no_dangling_layout_exports', () => {
    // The framework barrel no longer re-exports any deleted layout module meta,
    // composition helper, or motion symbol. TypeScript would fail the build on a
    // dangling re-export; asserting their runtime absence proves the strip is total.
    const gone = [
      'headerMeta', 'heroMeta', 'footerMeta', 'textBlockMeta', 'servicesGridMeta', 'layerMeta',
      'navHref',
      'SECTION_CSS', 'renderBackgroundLayers', 'wrapWithBackground',
      'LAYER_CSS', 'renderLayer', 'wrapWithLayer',
      'OVERLAY_BAND_CSS', 'composeOverlayHeader',
      'ROW_CSS', 'composeRow',
      'MOTION_CSS', 'MOTION_SCRIPT', 'motionClasses', 'motionVars', 'wrapWithMotion', 'isScrollMotion',
    ]
    const surface = framework as Record<string, unknown>
    for (const sym of gone) {
      expect(surface[sym], `${sym} should no longer be exported`).toBeUndefined()
    }

    // The capability modules + the L1 renderer ARE the surviving public surface.
    expect(framework.carouselMeta).toBeDefined()
    expect(framework.contactFormMeta).toBeDefined()
    expect(typeof framework.renderL1Document).toBe('function')
  })
})

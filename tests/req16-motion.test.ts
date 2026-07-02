import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import {
  MOTION_CSS,
  motionClasses,
  motionVars,
  renderLayer,
  wrapWithMotion,
} from '../packages/framework/src/index'
import { validateSite } from '../packages/site-schema/src/index'
import { cmdNew, cmdRender } from '../tools/generate/src/cli/commands'
import { loadSite } from '../tools/generate/src/store'

/**
 * UATs for REQ-16 — the structured motion primitive (entrance / scroll-reveal /
 * hover).
 *
 * Entry points under test: the public `validateSite` (the Motion contract and
 * raw-CSS rejection), the framework's motion rendering (`wrapWithMotion` /
 * `motionClasses` / `motionVars` + `MOTION_CSS`), and an end-to-end render
 * through the `1c` CLI. The scroll-reveal island's DOM behaviour is exercised
 * in the jsdom sibling `req16-motion-island.test.ts` (esbuild — the Astro
 * container render here — cannot run under jsdom). Nothing internal is mocked;
 * module HTML is produced through the same path `tools/generate` uses.
 */

/** A minimal, schema-valid site with one hero module (REQ-3 shape). */
function minimalSite(): Record<string, any> {
  return {
    id: 'site-motion',
    config: { businessName: 'Acme Co' },
    theme: {
      palette: {
        bg: '#ffffff',
        surface: '#f9fafb',
        surfaceSubtle: '#f3f4f6',
        surfaceInverse: '#111827',
        text: '#111827',
        muted: '#6b7280',
        primary: '#2563eb',
        accent: '#f59e0b',
        border: '#e5e7eb',
      },
      typography: {
        family: { heading: 'Inter, sans-serif', body: 'Inter, sans-serif' },
        scale: {
          xs: '0.75rem',
          sm: '0.875rem',
          base: '1rem',
          lg: '1.125rem',
          xl: '1.25rem',
          '2xl': '1.5rem',
          '3xl': '1.875rem',
          '4xl': '2.25rem',
          '5xl': '3rem',
        },
        weights: { regular: '400', medium: '500', semibold: '600', bold: '700', black: '900' },
        lineHeights: { tight: '1.1', normal: '1.5', relaxed: '1.75' },
      },
      spacing: {
        '0': '0',
        '1': '0.25rem',
        '2': '0.5rem',
        '3': '0.75rem',
        '4': '1rem',
        '6': '1.5rem',
        '8': '2rem',
        '12': '3rem',
        '16': '4rem',
        '24': '6rem',
      },
      radius: { none: '0', sm: '0.125rem', md: '0.375rem', lg: '0.5rem', full: '9999px' },
      shadow: {
        none: 'none',
        sm: '0 1px 2px rgba(0,0,0,0.05)',
        md: '0 4px 6px rgba(0,0,0,0.1)',
        lg: '0 10px 15px rgba(0,0,0,0.1)',
      },
      container: { narrow: '40rem', default: '72rem', wide: '90rem', bleed: '100%' },
      breakpoints: { sm: '640px', md: '768px', lg: '1024px', xl: '1280px' },
    },
    nav: { pattern: 'in-page-anchors', entries: [] },
    pages: [
      {
        id: 'page-home',
        slug: 'home',
        title: 'Home',
        modules: [
          {
            id: 'm1',
            type: 'hero',
            version: 1,
            variant: 'bg-color',
            dials: {},
            content: { heading: 'Welcome' },
          },
        ],
      },
    ],
  }
}

describe('REQ-16 — Motion schema (validateSite)', () => {
  it('test_UAT_FC_REQ-16_entrance_and_hover_render', () => {
    // A load entrance on the module and a hover motion both validate...
    const load = minimalSite()
    load.pages[0].modules[0].motion = { type: 'fade', trigger: 'load' }
    expect(validateSite(load).ok).toBe(true)

    const hover = minimalSite()
    hover.pages[0].modules[0].motion = { type: 'scale', trigger: 'hover' }
    expect(validateSite(hover).ok).toBe(true)

    // ...and the framework renders each as trigger + type classes on a wrapper.
    const loadHtml = wrapWithMotion('<section>host</section>', { type: 'fade', trigger: 'load' })
    expect(loadHtml).toContain('fc-motion fc-motion--load fc-motion--fade')
    // A load entrance does not carry the scroll island hook.
    expect(loadHtml).not.toContain('data-fc-motion-scroll')

    const hoverHtml = wrapWithMotion('<section>host</section>', { type: 'scale', trigger: 'hover' })
    expect(hoverHtml).toContain('fc-motion fc-motion--hover fc-motion--scale')

    // The static rules that realise them live in MOTION_CSS.
    expect(MOTION_CSS).toContain('.fc-motion--load.fc-motion--fade { animation-name: fc-motion-fade; }')
    expect(MOTION_CSS).toContain('.fc-motion--hover.fc-motion--scale:hover { transform: scale(1.04); }')
    expect(MOTION_CSS).toContain('@keyframes fc-motion-fade')

    // A named-enum contract on easing: a raw cubic-bezier string is rejected.
    const rawEasing = minimalSite()
    rawEasing.pages[0].modules[0].motion = {
      type: 'fade',
      trigger: 'load',
      easing: 'cubic-bezier(0.1, 0.7, 1, 0.1)',
    }
    expect(validateSite(rawEasing).ok).toBe(false)
  })
})

describe('REQ-16 — reduced motion (MOTION_CSS)', () => {
  it('test_UAT_FC_REQ-16_reduced_motion', () => {
    // Under prefers-reduced-motion, every animation and transition is disabled
    // and scroll-revealed content is forced visible — motion never gates
    // content.
    expect(MOTION_CSS).toContain('@media (prefers-reduced-motion: reduce)')
    const reduced = MOTION_CSS.slice(MOTION_CSS.indexOf('@media (prefers-reduced-motion: reduce)'))
    expect(reduced).toContain('animation: none !important;')
    expect(reduced).toContain('transition: none !important;')
    expect(reduced).toContain('.fc-motion--scroll { opacity: 1 !important; }')
    // Hover end-states are also neutralised so nothing shifts on pointer.
    expect(reduced).toContain('transform: none !important;')
  })
})

describe('REQ-16 — params drive output (wrapWithMotion + 1c render)', () => {
  let cwd: string
  beforeEach(() => {
    cwd = mkdtempSync(path.join(tmpdir(), 'req16-'))
  })
  afterEach(() => {
    rmSync(cwd, { recursive: true, force: true })
  })

  it('test_UAT_FC_REQ-16_params_drive_output', async () => {
    // duration / easing / delay flow into framework-computed custom properties
    // — never raw instance CSS.
    const motion = { type: 'slide', trigger: 'load', duration: 700, easing: 'ease-in-out', delay: 120 }
    const vars = motionVars(motion as any)
    expect(vars).toContain('--fc-motion-duration: 700ms;')
    expect(vars).toContain('--fc-motion-easing: ease-in-out;')
    expect(vars).toContain('--fc-motion-delay: 120ms;')
    expect(motionClasses(motion as any)).toBe('fc-motion fc-motion--load fc-motion--slide')

    // Omitted params emit no declaration — they fall through to the CSS default.
    expect(motionVars({ type: 'fade', trigger: 'load' } as any)).toBe('')

    // A motion on a layer child wraps the child's inner content (not the
    // positioned element, whose own transform a keyframe would clobber).
    const stack = await renderLayer({
      children: [
        {
          kind: 'text',
          text: 'Rising',
          position: { x: 10, y: 20, z: 1 },
          motion: { type: 'slide', trigger: 'scroll' },
        },
      ],
    } as any)
    expect(stack).toContain('data-fc-motion-scroll')
    expect(stack).toContain('fc-motion--scroll fc-motion--slide')

    // End-to-end: a scroll motion on the hero renders the wrapper, ships the
    // island exactly once, and folds MOTION_CSS into the per-site stylesheet.
    cmdNew('acme', { cwd })
    const pagePath = path.join(cwd, 'storage', 'sites', 'acme', 'draft', 'pages', 'home.json')
    const page = JSON.parse(readFileSync(pagePath, 'utf8'))
    const hero = page.modules.find((m: { type: string }) => m.type === 'hero')
    hero.motion = { type: 'fade', trigger: 'scroll', duration: 600 }
    writeFileSync(pagePath, JSON.stringify(page, null, 2))

    // The edited draft still validates through the real loader.
    expect(loadSite({ cwd, root: 'sites' }, 'acme', 'draft').ok).toBe(true)

    const { outDir } = await cmdRender('acme', { cwd })
    const outHtml = readFileSync(path.join(outDir, 'index.html'), 'utf8')
    expect(outHtml).toContain('fc-motion--scroll fc-motion--fade')
    expect(outHtml).toContain('--fc-motion-duration: 600ms;')
    // The island ships exactly once for the page, and the wrapper carries the
    // hook it looks for.
    expect((outHtml.match(/<script>/g) ?? []).length).toBe(1)
    expect(outHtml).toContain('<script>(function ()')
    expect(outHtml).toContain('data-fc-motion-scroll')

    const themeCss = readFileSync(path.join(outDir, 'theme.css'), 'utf8')
    expect(themeCss).toContain('@keyframes fc-motion-fade')
    expect(themeCss).toContain('@media (prefers-reduced-motion: reduce)')
  })

  it('test_UAT_FC_REQ-16_island_omitted_without_scroll_motion', async () => {
    // A page with only a load motion must not ship the scroll island.
    cmdNew('acme2', { cwd })
    const pagePath = path.join(cwd, 'storage', 'sites', 'acme2', 'draft', 'pages', 'home.json')
    const page = JSON.parse(readFileSync(pagePath, 'utf8'))
    const hero = page.modules.find((m: { type: string }) => m.type === 'hero')
    hero.motion = { type: 'fade', trigger: 'load' }
    writeFileSync(pagePath, JSON.stringify(page, null, 2))

    const { outDir } = await cmdRender('acme2', { cwd })
    const outHtml = readFileSync(path.join(outDir, 'index.html'), 'utf8')
    expect(outHtml).toContain('fc-motion--load fc-motion--fade')
    expect(outHtml).not.toContain('data-fc-motion-scroll')
    expect(outHtml).not.toContain('<script>(function ()')
  })
})

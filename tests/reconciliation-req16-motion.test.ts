import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { renderLayer } from '../packages/framework/src/index'
import { validateSite } from '../packages/site-schema/src/index'
import { cmdNew, cmdRender } from '../tools/generate/src/cli/commands'
import { loadSite } from '../tools/generate/src/store'

/**
 * Reconciliation UATs for story-b13e15c5 — the structured motion primitive
 * (entrance / scroll-reveal / hover / stagger, REQ-16). One UAT per acceptance
 * criterion (AC-488..AC-494), asserting the existing implementation at its
 * external boundaries:
 *
 *  - the `validateSite` contract from `@1stcontact/site-schema` (the Motion
 *    schema, its named-easing / enum / integer rules and the raw-CSS rejection)
 *    — AC-488 / AC-489;
 *  - the framework's public layer rendering (`renderLayer`), which wraps a
 *    child's inner content in motion without clobbering its positioning
 *    — AC-494;
 *  - a full site render through the `1c` CLI, reading the emitted HTML and the
 *    per-site `theme.css` — AC-490 (load entrance), AC-491 (scroll island),
 *    AC-492 (stagger cascade), AC-493 (reduced-motion safety).
 *
 * Nothing internal is mocked; only the filesystem is isolated to a temp dir.
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

const PHOTO = { id: 'photo', src: '/assets/photo.jpg', alt: 'Montage' }

describe('story-b13e15c5 — structured motion schema + framework (REQ-16)', () => {
  // AC-488 (acceptance_criterion-346f50c8): A well-formed motion on a module
  // instance and on a layer child validates and round-trips unchanged.
  it('test_UAT_AC488_well_formed_motion_validates_and_round_trips', () => {
    // A fully-specified motion on the module instance validates, and the
    // normalized site preserves every field exactly as supplied.
    const onInstance = minimalSite()
    const instanceMotion = {
      type: 'fade',
      trigger: 'load',
      duration: 400,
      easing: 'ease-in-out',
      delay: 50,
    }
    onInstance.pages[0].modules[0].motion = instanceMotion
    const instanceResult = validateSite(onInstance)
    expect(instanceResult.ok, 'a well-formed instance motion should validate').toBe(true)
    if (instanceResult.ok) {
      // Round-trip: type, trigger, duration, delay, easing survive unchanged.
      expect(instanceResult.value.pages[0].modules[0].motion).toEqual(instanceMotion)
    }

    // The same holds for a motion attached to a layer child (here an image).
    const onChild = minimalSite()
    const childMotion = { type: 'scale', trigger: 'hover', duration: 200, easing: 'ease-out' }
    onChild.pages[0].modules[0].layer = {
      children: [{ kind: 'image', asset: PHOTO, position: { x: 0, y: 0, z: 1 }, motion: childMotion }],
    }
    const childResult = validateSite(onChild)
    expect(childResult.ok, 'a well-formed layer-child motion should validate').toBe(true)
    if (childResult.ok) {
      expect(childResult.value.pages[0].modules[0].layer!.children[0].motion).toEqual(childMotion)
    }
  })

  // AC-489 (acceptance_criterion-89f14294): A malformed or raw-CSS motion is
  // rejected with a path-pointed error. Motion is structured-only — no raw-CSS
  // escape hatch.
  it('test_UAT_AC489_malformed_or_raw_css_motion_rejected_with_path', () => {
    const MOTION_PATH = '/pages/0/modules/0/motion'
    // Each case violates exactly one motion rule; every one must fail with an
    // error whose path points at the motion field.
    const cases: { label: string; motion: Record<string, unknown> }[] = [
      { label: 'raw cubic-bezier easing', motion: { type: 'fade', trigger: 'load', easing: 'cubic-bezier(0.1, 0.7, 1, 0.1)' } },
      { label: 'type outside the permitted set', motion: { type: 'spin', trigger: 'load' } },
      { label: 'trigger outside the permitted set', motion: { type: 'fade', trigger: 'click' } },
      { label: 'negative duration', motion: { type: 'fade', trigger: 'load', duration: -5 } },
      { label: 'non-integer delay', motion: { type: 'fade', trigger: 'load', delay: 1.5 } },
    ]
    for (const { label, motion } of cases) {
      const site = minimalSite()
      site.pages[0].modules[0].motion = motion
      const result = validateSite(site)
      expect(result.ok, `${label} should be rejected`).toBe(false)
      if (!result.ok) {
        expect(
          result.errors.some((e) => e.path.startsWith(MOTION_PATH)),
          `${label} should report a path under the motion field`,
        ).toBe(true)
      }
    }

    // An arbitrary extra property on the motion object (a raw-CSS/style escape
    // hatch) is rejected by `.strict()`, at the motion path, naming the key.
    const smuggled = minimalSite()
    smuggled.pages[0].modules[0].motion = {
      type: 'fade',
      trigger: 'load',
      style: 'animation: spin 2s infinite;',
    }
    const smuggledResult = validateSite(smuggled)
    expect(smuggledResult.ok, 'a smuggled raw-CSS field must be rejected').toBe(false)
    if (!smuggledResult.ok) {
      expect(
        smuggledResult.errors.some((e) => e.path === MOTION_PATH && e.message.includes('style')),
      ).toBe(true)
    }
  })

  // AC-494 (acceptance_criterion-66d2ba0a): Motion on a layer child wraps the
  // child's *inner* content, not the positioned element — the child keeps its
  // authored position/rotation while its content animates.
  it('test_UAT_AC494_layer_child_motion_preserves_positioning', async () => {
    const stack = await renderLayer({
      children: [
        {
          kind: 'image',
          asset: PHOTO,
          position: { x: 30, y: 40, z: 2, width: 50, rotate: 12 },
          motion: { type: 'scale', trigger: 'load' },
        },
      ],
    } as any)

    // The positioned child element retains its full positioning as
    // framework-computed custom properties — the scale motion has not displaced
    // it.
    const childOpen = stack.match(/<div class="(fc-layer__child[^"]*)" style="([^"]*)">/)
    expect(childOpen, 'the positioned child element should be present').not.toBeNull()
    const [, childClass, childStyle] = childOpen!
    expect(childStyle).toContain('--fc-x: 30%;')
    expect(childStyle).toContain('--fc-y: 40%;')
    expect(childStyle).toContain('--fc-rotate: 12deg;')
    expect(childStyle).toContain('--fc-w: 50%;')

    // The motion wrapper is applied to the child's inner content (the <img>),
    // NOT to the positioned element itself: the positioned element carries no
    // motion class, and the motion wrapper nests directly around the image.
    expect(childClass).not.toContain('fc-motion')
    expect(stack).toContain(
      '<div class="fc-motion fc-motion--load fc-motion--scale"><img src="/assets/photo.jpg"',
    )
    // Document order confirms the motion wrapper sits inside the positioned
    // child, after its positioning style.
    expect(stack.indexOf('--fc-rotate')).toBeLessThan(stack.indexOf('fc-motion'))
  })
})

describe('story-b13e15c5 — motion end-to-end (1c render)', () => {
  let cwd: string
  beforeEach(() => {
    cwd = mkdtempSync(path.join(tmpdir(), 'req16-recon-'))
  })
  afterEach(() => {
    rmSync(cwd, { recursive: true, force: true })
  })

  /** Read + edit the home page's hero module through the real draft store. */
  function editHome(site: string, mutate: (hero: any, page: any) => void): void {
    const pagePath = path.join(cwd, 'storage', 'sites', site, 'draft', 'pages', 'home.json')
    const page = JSON.parse(readFileSync(pagePath, 'utf8'))
    const hero = page.modules.find((m: { type: string }) => m.type === 'hero')
    mutate(hero, page)
    writeFileSync(pagePath, JSON.stringify(page, null, 2))
  }

  // AC-490 (acceptance_criterion-f32a601a): A load-triggered motion renders as
  // framework-computed animation, with no raw instance CSS on the page.
  it('test_UAT_AC490_load_motion_renders_framework_computed_animation', async () => {
    cmdNew('loadsite', { cwd })
    editHome('loadsite', (hero) => {
      hero.motion = { type: 'slide', trigger: 'load', duration: 700, easing: 'ease-in-out' }
    })
    expect(loadSite({ cwd, root: 'sites' }, 'loadsite', 'draft').ok).toBe(true)

    const { outDir } = await cmdRender('loadsite', { cwd })
    const html = readFileSync(path.join(outDir, 'index.html'), 'utf8')

    // The module is wrapped so the section animates on load (trigger + type).
    expect(html).toContain('fc-motion fc-motion--load fc-motion--slide')
    // A load entrance ships no scroll hook.
    expect(html).not.toContain('data-fc-motion-scroll')

    // duration / easing surface only as framework-computed custom properties on
    // the wrapper — never as raw CSS authored by the instance.
    const wrapper = html.match(/<div class="fc-motion[^"]*"\s+style="([^"]*)">/)
    expect(wrapper, 'the motion wrapper should carry a style attribute').not.toBeNull()
    const decls = wrapper![1].split(';').map((d) => d.trim()).filter(Boolean)
    expect(decls.length).toBeGreaterThan(0)
    for (const decl of decls) {
      expect(decl.startsWith('--fc-motion-'), `unexpected raw CSS on the wrapper: ${decl}`).toBe(true)
    }
    expect(wrapper![1]).toContain('--fc-motion-duration: 700ms;')
    expect(wrapper![1]).toContain('--fc-motion-easing: ease-in-out;')

    // The entrance keyframes + the load animation binding are folded into the
    // per-site stylesheet.
    const themeCss = readFileSync(path.join(outDir, 'theme.css'), 'utf8')
    expect(themeCss).toContain('@keyframes fc-motion-slide')
    expect(themeCss).toContain('.fc-motion--load.fc-motion--slide { animation-name: fc-motion-slide; }')
  })

  // AC-491 (acceptance_criterion-ef35bcf7): The scroll-reveal script is shipped
  // once per page and only when the page contains scroll motion.
  it('test_UAT_AC491_scroll_reveal_script_shipped_once_only_when_needed', async () => {
    // A page whose scroll motion lives on a layer child ships exactly one
    // self-contained reveal island, and the scroll element carries the marker
    // the island selects.
    cmdNew('scrollsite', { cwd })
    editHome('scrollsite', (hero) => {
      hero.layer = {
        children: [
          {
            kind: 'text',
            text: 'Reveal me',
            position: { x: 10, y: 20, z: 1 },
            motion: { type: 'slide', trigger: 'scroll' },
          },
        ],
      }
    })
    expect(loadSite({ cwd, root: 'sites' }, 'scrollsite', 'draft').ok).toBe(true)

    const scrollHtml = readFileSync(
      path.join((await cmdRender('scrollsite', { cwd })).outDir, 'index.html'),
      'utf8',
    )
    expect(scrollHtml).toContain('data-fc-motion-scroll')
    expect((scrollHtml.match(/<script>\(function \(\)/g) ?? []).length).toBe(1)

    // A page with only load motion ships no reveal island at all.
    cmdNew('loadonly', { cwd })
    editHome('loadonly', (hero) => {
      hero.motion = { type: 'fade', trigger: 'load' }
    })
    const loadHtml = readFileSync(
      path.join((await cmdRender('loadonly', { cwd })).outDir, 'index.html'),
      'utf8',
    )
    expect(loadHtml).toContain('fc-motion--load fc-motion--fade')
    expect(loadHtml).not.toContain('data-fc-motion-scroll')
    expect(loadHtml).not.toContain('<script>(function ()')
  })

  // AC-492 (acceptance_criterion-e7c69b92): A stagger motion sequences a group's
  // direct children with increasing delays — a bounded, monotonic cascade.
  it('test_UAT_AC492_stagger_sequences_children_with_increasing_delays', async () => {
    cmdNew('staggersite', { cwd })
    editHome('staggersite', (hero) => {
      hero.motion = { type: 'stagger', trigger: 'load' }
    })
    const { outDir } = await cmdRender('staggersite', { cwd })
    const html = readFileSync(path.join(outDir, 'index.html'), 'utf8')
    // The staggered group is marked on the wrapper.
    expect(html).toContain('fc-motion--stagger')

    // The per-site stylesheet carries per-child delay rules whose start delays
    // increase monotonically with child position.
    const themeCss = readFileSync(path.join(outDir, 'theme.css'), 'utf8')
    const rules = [
      ...themeCss.matchAll(
        /nth-child\((\d+)\)\s*\{\s*animation-delay:\s*calc\(var\(--fc-motion-delay,\s*\d+ms\)\s*\+\s*(\d+)ms\)/g,
      ),
    ]
      .map((m) => ({ idx: Number(m[1]), offset: Number(m[2]) }))
      .sort((a, b) => a.idx - b.idx)

    expect(rules.length, 'a bounded cascade of per-child delay rules').toBeGreaterThan(2)
    for (let i = 1; i < rules.length; i += 1) {
      expect(
        rules[i].offset,
        `child ${rules[i].idx} should start later than child ${rules[i - 1].idx}`,
      ).toBeGreaterThan(rules[i - 1].offset)
    }
  })

  // AC-493 (acceptance_criterion-ad57c34d): A reduced-motion preference disables
  // all motion and forces scroll-revealed content visible.
  it('test_UAT_AC493_reduced_motion_disables_all_and_reveals_scroll_content', async () => {
    // A site carrying load, scroll, hover, and stagger motions on four modules.
    cmdNew('reducedsite', { cwd })
    editHome('reducedsite', (hero, page) => {
      const clone = (id: string, motion: Record<string, unknown>) => ({ ...hero, id, motion })
      page.modules = [
        clone('m-load', { type: 'fade', trigger: 'load' }),
        clone('m-scroll', { type: 'slide', trigger: 'scroll' }),
        clone('m-hover', { type: 'scale', trigger: 'hover' }),
        clone('m-stagger', { type: 'stagger', trigger: 'load' }),
      ]
    })
    expect(loadSite({ cwd, root: 'sites' }, 'reducedsite', 'draft').ok).toBe(true)

    const { outDir } = await cmdRender('reducedsite', { cwd })
    const html = readFileSync(path.join(outDir, 'index.html'), 'utf8')
    // All four motion triggers are genuinely present on the page.
    expect(html).toContain('fc-motion--load')
    expect(html).toContain('fc-motion--scroll')
    expect(html).toContain('fc-motion--hover')
    expect(html).toContain('fc-motion--stagger')

    // The per-site stylesheet includes a reduced-motion block that neutralises
    // every animation/transition and forces scroll-revealed content visible.
    const themeCss = readFileSync(path.join(outDir, 'theme.css'), 'utf8')
    const markerIdx = themeCss.indexOf('@media (prefers-reduced-motion: reduce)')
    expect(markerIdx, 'a reduced-motion media block should be present').toBeGreaterThanOrEqual(0)
    const block = themeCss.slice(markerIdx)
    expect(block).toContain('animation: none !important;')
    expect(block).toContain('transition: none !important;')
    // Scroll-revealed content that starts hidden is forced to its visible
    // end-state — never trapped behind an unplayed motion.
    expect(block).toContain('.fc-motion--scroll { opacity: 1 !important; }')
    expect(block).toContain('transform: none !important;')
  })
})

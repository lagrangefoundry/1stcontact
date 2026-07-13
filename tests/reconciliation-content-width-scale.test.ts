import { readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import Hero from '../packages/framework/src/modules/hero/index.astro'
import TextBlock from '../packages/framework/src/modules/text-block/index.astro'
import ServicesGrid from '../packages/framework/src/modules/services-grid/index.astro'
import { composeRow } from '../packages/framework/src/modules/row'
import {
  CONTAINER_STEPS,
  CONTENT_WIDTH_DIAL,
  resolveContainerWidth,
} from '../packages/framework/src/modules/dials'
import { generateThemeCss } from '../packages/framework/src/tokens'

/**
 * Reconciliation UATs for story-d555b990 — the Tailwind-aligned `contentWidth`/
 * `rowWidth` scale with a literal escape hatch. The named layer resolves to the
 * themeable `--container-<step>` token (1:1 with Tailwind's `max-w` scale); a
 * literal (a `px` number matching captured render values, or a CSS length string)
 * resolves straight through; `bleed`/absent means "no cap". The resolved measure
 * is applied via a single inline `--fc-content-width` (or `--fc-row-width`) custom
 * property with a marker class, uniformly across every width-bearing module.
 *
 * One UAT per acceptance criterion (AC-604..AC-609).
 */

type Container = Awaited<ReturnType<typeof AstroContainer.create>>
let container: Container
async function render(Component: unknown, props: unknown): Promise<string> {
  container ??= await AstroContainer.create()
  return container.renderToString(Component as Parameters<Container['renderToString']>[0], {
    props: props as Record<string, unknown>,
  })
}

/** Recursively collect every shipped site `.json` document under storage/sites. */
function siteDocs(dir: string): string[] {
  const out: string[] = []
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry)
    if (statSync(full).isDirectory()) out.push(...siteDocs(full))
    else if (entry.endsWith('.json')) out.push(full)
  }
  return out
}

function docModules(doc: unknown): Array<{ dials?: Record<string, unknown> }> {
  // A page doc carries `modules`; a site.json doc does not.
  if (doc && typeof doc === 'object' && Array.isArray((doc as { modules?: unknown }).modules)) {
    return (doc as { modules: Array<{ dials?: Record<string, unknown> }> }).modules
  }
  return []
}

describe('story-d555b990 content-width scale', () => {
  // AC-604 — a named step caps the content column to the matching Tailwind `max-w`
  // measure, across the full scale (sm..7xl + bleed), including the 4xl step (896px)
  // the previous scale could not express (it jumped 768 → 1152).
  it('test_UAT_AC604_named_step_caps_to_tailwind_measure', async () => {
    // `contentWidth: "4xl"` resolves to the themeable token, and that token is 56rem = 896px.
    const html = await render(TextBlock, {
      variant: 'prose',
      dials: { contentWidth: '4xl' },
      content: { body: 'Most apps.' },
    })
    expect(html).toContain('has-content-width')
    expect(html).toContain('style="--fc-content-width: var(--container-4xl)"')
    expect(resolveContainerWidth('4xl')).toBe('var(--container-4xl)')
    expect(CONTAINER_STEPS['4xl']).toBe('56rem')
    expect(parseFloat(CONTAINER_STEPS['4xl']) * 16).toBe(896)
    expect(generateThemeCss()).toContain('--container-4xl: 56rem;')

    // Every named step corresponds 1:1 to its Tailwind px value; `bleed` fills the frame.
    const px = (rem: string) => parseFloat(rem) * 16
    expect(px(CONTAINER_STEPS.sm)).toBe(384)
    expect(px(CONTAINER_STEPS.md)).toBe(448)
    expect(px(CONTAINER_STEPS.lg)).toBe(512)
    expect(px(CONTAINER_STEPS.xl)).toBe(576)
    expect(px(CONTAINER_STEPS['2xl'])).toBe(672)
    expect(px(CONTAINER_STEPS['3xl'])).toBe(768)
    expect(px(CONTAINER_STEPS['5xl'])).toBe(1024)
    expect(px(CONTAINER_STEPS['6xl'])).toBe(1152)
    expect(px(CONTAINER_STEPS['7xl'])).toBe(1280)
    expect(CONTAINER_STEPS.bleed).toBe('100%')
  })

  // AC-605 — the literal escape hatch: a bare number is a `px` literal; a CSS length
  // string passes straight through. Neither has to match a named step.
  it('test_UAT_AC605_literal_value_renders_exact_off_scale_measure', async () => {
    // A bare number → `<n>px`. `896` renders an 896px content column.
    const numeric = await render(ServicesGrid, {
      variant: 'three-col',
      dials: { contentWidth: 896 },
      content: { items: [{ title: { text: 'A' }, body: 'x' }] },
    })
    expect(numeric).toContain('has-content-width')
    expect(numeric).toContain('style="--fc-content-width: 896px"')

    // A CSS length string → applied verbatim. `"56rem"` renders a 56rem column.
    const rem = await render(ServicesGrid, {
      variant: 'three-col',
      dials: { contentWidth: '56rem' },
      content: { items: [{ title: { text: 'A' }, body: 'x' }] },
    })
    expect(rem).toContain('style="--fc-content-width: 56rem"')

    expect(resolveContainerWidth(896)).toBe('896px')
    expect(resolveContainerWidth('56rem')).toBe('56rem')
    // Neither literal is a named step — they bypass the scale entirely.
    expect(Object.keys(CONTAINER_STEPS)).not.toContain('56rem')
    expect(CONTENT_WIDTH_DIAL as readonly string[]).not.toContain('56rem')
  })

  // AC-606 — `bleed`, or an absent dial, leaves the content column uncapped: no
  // max-width measure, no content-width marker class.
  it('test_UAT_AC606_bleed_or_absent_leaves_column_uncapped', async () => {
    const bleed = await render(TextBlock, {
      variant: 'prose',
      dials: { contentWidth: 'bleed' },
      content: { body: 'x' },
    })
    const absent = await render(TextBlock, { variant: 'prose', dials: {}, content: { body: 'x' } })
    for (const html of [bleed, absent]) {
      expect(html).not.toContain('has-content-width')
      expect(html).not.toContain('--fc-content-width')
    }
    expect(resolveContainerWidth('bleed')).toBeNull()
    expect(resolveContainerWidth(undefined)).toBeNull()
  })

  // AC-607 — `rowWidth` boxes a grouped multi-column row using the same vocabulary:
  // a named step → that step's measure; a literal → exactly that value.
  it('test_UAT_AC607_rowWidth_boxes_grouped_row', () => {
    // A named step boxes the grouped row to the 3xl (768px) token.
    const named = composeRow([
      { html: '<section>a</section>', width: 'third', rowWidth: '3xl' },
      { html: '<section>b</section>', width: 'two-thirds', rowWidth: '3xl' },
    ])
    expect(named).toContain('style="--fc-row-width: var(--container-3xl)"')
    expect(parseFloat(CONTAINER_STEPS['3xl']) * 16).toBe(768)

    // A literal px number boxes the grouped row to exactly 896px.
    const literal = composeRow([
      { html: '<section>a</section>', width: 'half', rowWidth: 896 },
      { html: '<section>b</section>', width: 'half', rowWidth: 896 },
    ])
    expect(literal).toContain('style="--fc-row-width: 896px"')
  })

  // AC-608 — the same `contentWidth` value produces the identical resolved measure
  // regardless of which width-bearing module (hero, text-block, services-grid) carries it.
  it('test_UAT_AC608_contentWidth_honored_uniformly_across_modules', async () => {
    const heroProps = (dials: Record<string, unknown>) => ({
      variant: 'bg-color',
      dials,
      content: { heading: { text: 'H' }, subhead: { text: 'S' } },
    })
    const textProps = (dials: Record<string, unknown>) => ({
      variant: 'prose',
      dials,
      content: { body: 'x' },
    })
    const gridProps = (dials: Record<string, unknown>) => ({
      variant: 'three-col',
      dials,
      content: { items: [{ title: { text: 'A' }, body: 'x' }] },
    })

    // A named step resolves to the same token measure on all three modules.
    const named = '--fc-content-width: var(--container-4xl)'
    const heroNamed = await render(Hero, heroProps({ contentWidth: '4xl' }))
    const textNamed = await render(TextBlock, textProps({ contentWidth: '4xl' }))
    const gridNamed = await render(ServicesGrid, gridProps({ contentWidth: '4xl' }))
    for (const html of [heroNamed, textNamed, gridNamed]) {
      expect(html).toContain('has-content-width')
      expect(html).toContain(`style="${named}"`)
    }

    // A literal resolves to the same exact value on all three modules.
    const literal = '--fc-content-width: 896px'
    const heroLit = await render(Hero, heroProps({ contentWidth: 896 }))
    const textLit = await render(TextBlock, textProps({ contentWidth: 896 }))
    const gridLit = await render(ServicesGrid, gridProps({ contentWidth: 896 }))
    for (const html of [heroLit, textLit, gridLit]) {
      expect(html).toContain(`style="${literal}"`)
    }
  })

  // AC-609 — the retired pre-REQ-55 width scale is fully gone: not a valid dial
  // value, not a container token key, and referenced by no shipped site document.
  it('test_UAT_AC609_retired_width_names_removed', () => {
    const RETIRED = ['xnarrow', 'narrow', 'readable', 'default', 'wide'] as const

    // The dial vocabulary is exactly the Tailwind scale (`bleed` + `sm..7xl`).
    expect(CONTENT_WIDTH_DIAL).toEqual([
      'bleed', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl', '7xl',
    ])
    for (const name of RETIRED) {
      expect(CONTENT_WIDTH_DIAL as readonly string[]).not.toContain(name)
      // No retired name survives as a container width token key.
      expect(Object.keys(CONTAINER_STEPS)).not.toContain(name)
    }

    // No shipped site document references a retired name as a contentWidth/rowWidth
    // dial value or a container token override.
    const docs = siteDocs(path.join(process.cwd(), 'storage/sites'))
    expect(docs.length).toBeGreaterThan(0)
    for (const file of docs) {
      const doc = JSON.parse(readFileSync(file, 'utf8'))
      for (const m of docModules(doc)) {
        const dials = m.dials ?? {}
        for (const key of ['contentWidth', 'rowWidth']) {
          const v = dials[key]
          if (typeof v === 'string') {
            expect(RETIRED as readonly string[], `${file} ${key}=${v}`).not.toContain(v)
          }
        }
      }
      const containerOverrides = doc?.theme?.container ?? {}
      for (const name of RETIRED) {
        expect(containerOverrides, `${file} container.${name}`).not.toHaveProperty(name)
      }
    }
  })
})

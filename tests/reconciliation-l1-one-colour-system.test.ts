/**
 * Reconciliation UATs — story-d0a8cfad "L1 layout substrate rendered safe by
 * construction", one-colour-system slice (REQ-114).
 *
 *   AC-933  a rendered page emits no colour custom property, and exactly one
 *           colour system survives
 *   AC-934  page background and inherited text colour are L1 *document* fields,
 *           validated as ordinary colour axes
 *   AC-935  no closed colour-role vocabulary survives — in the schema, in a
 *           stored definition, or on a layer treatment
 *   AC-936  the non-colour token groups validate and emit exactly as before the
 *           colour cut
 *
 * Every test drives a real boundary: `generateThemeCss` (the theme-stylesheet
 * generator), `renderSite` over a real on-disk site (the whole-snapshot claim —
 * theme stylesheet, the document's own L1 stylesheet, and the CSS a behavior
 * module ships, all in one rendered directory), `validateSite` / `validateL1`
 * (the one validator every consumer goes through), `validateModuleContent` and
 * `resolveTextStyle` (the module colour sink), and the published site-schema
 * module surface itself.
 */
import { mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import * as siteSchema from '../packages/site-schema/src/index'
import { validateSite } from '../packages/site-schema/src/index'
import { validateL1 } from '../packages/site-schema/src/l1/validate'
import { renderL1Document } from '../packages/framework/src/l1/render'
import { defaultTokens, generateThemeCss } from '../packages/framework/src/tokens/index'
import { CALLOUT_CSS } from '../packages/framework/src/modules/markdown'
import { resolveTextStyle, resolveSurfaceGradient } from '../packages/framework/src/modules/text-style'
import { validateModuleContent } from '../packages/framework/src/modules/validate'
import type { ModuleMeta } from '../packages/framework/src/modules/types'
import { starterSiteJson, starterHomePage } from '../tools/generate/src/cli/scaffold'
import { loadSite } from '../tools/generate/src/store'
import { renderSite } from '../tools/generate/src/render/write'

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SITES = path.join(REPO, 'storage', 'sites')

const WIDTHS = [320, 1440]

let out: string
let cwd: string

beforeEach(() => {
  out = mkdtempSync(path.join(tmpdir(), 'reconcile-colour-out-'))
  cwd = mkdtempSync(path.join(tmpdir(), 'reconcile-colour-cwd-'))
})
afterEach(() => {
  rmSync(out, { recursive: true, force: true })
  rmSync(cwd, { recursive: true, force: true })
})

/** The declarations inside a `:root { … }` block. */
function rootBlock(css: string): string {
  const m = css.match(/:root\s*\{([\s\S]*?)\}/)
  return m ? m[1] : ''
}

/** Every `<style>…</style>` body in a rendered page. */
function inlineStyles(html: string): string[] {
  return [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map((m) => m[1])
}

/** A site definition wrapping one page. */
function siteWith(page: Record<string, unknown>, slug = 'colourstory'): Record<string, unknown> {
  return { ...starterSiteJson(slug), pages: [page] }
}

/** A page whose body is a module stack (the shape a `layer` treatment lives in). */
function modulePage(module: Record<string, unknown>): Record<string, unknown> {
  return { id: 'home', slug: 'home', title: 'Home', modules: [module] }
}

/** Write a site definition into `dir` in the one-file-per-page on-disk shape. */
function writeSite(dir: string, slug: string, site: Record<string, unknown>): void {
  const draft = path.join(dir, 'storage', 'sites', slug, 'draft')
  mkdirSync(path.join(draft, 'pages'), { recursive: true })
  const { pages, ...base } = site as { pages: Record<string, unknown>[] }
  writeFileSync(path.join(draft, 'site.json'), JSON.stringify({ ...base, id: slug }, null, 2))
  pages.forEach((page, i) => {
    writeFileSync(path.join(draft, 'pages', `p${i}.json`), JSON.stringify(page, null, 2))
  })
}

/** The module meta used to probe the styled-text colour sink. */
const STYLED_META: ModuleMeta = {
  id: 'colour-probe',
  version: 1,
  variants: ['default'],
  dials: {},
  contentSchema: {
    heading: { type: 'styled-text', required: true },
  },
}

// ── AC-933 ───────────────────────────────────────────────────────────────────

describe('AC-933 a rendered page emits no colour custom property, and exactly one colour system survives', () => {
  it('test_UAT_AC933_no_colour_custom_property_is_declared_or_referenced_anywhere_the_renderer_emits', async () => {
    // (1) The theme stylesheet. The colour group left the token surface, so the
    //     generated `:root` declares the non-colour vocabulary and no colour
    //     property — and there is no scheme-conditioned block re-declaring one.
    const theme = generateThemeCss(defaultTokens)
    expect(theme).not.toMatch(/--color-/)
    expect(theme).not.toContain('prefers-color-scheme')
    expect(theme).not.toContain('@media')
    for (const group of [
      '--font-family-',
      '--font-size-',
      '--font-weight-',
      '--line-height-',
      '--space-',
      '--radius-',
      '--shadow-',
      '--container-',
      '--breakpoint-',
    ]) {
      expect(theme, `theme stylesheet lost the ${group} group`).toContain(group)
    }
    // No hook exists to supply a dark override: the generator takes the tokens
    // and nothing else.
    expect(generateThemeCss.length).toBe(1)

    // (2) A page rendered end to end. `renderSite` writes the site's theme
    //     stylesheet (theme tokens + every behavior module's CSS + the callout
    //     CSS) and the document's own L1 stylesheet inline. Neither may declare
    //     or reference a colour custom property.
    const site = siteWith(starterHomePage('colourstory') as Record<string, unknown>)
    writeSite(cwd, 'colourstory', site)
    const loaded = loadSite({ cwd, root: 'sites' }, 'colourstory', 'draft')
    expect(loaded.ok, JSON.stringify(loaded.ok ? [] : loaded.errors)).toBe(true)
    if (!loaded.ok) return
    await renderSite(loaded.value, out)

    const themeCss = readFileSync(path.join(out, 'theme.css'), 'utf-8')
    // The module CSS really is in there — otherwise the assertion below would be
    // vacuous for the "CSS a behavior module ships" half of the claim.
    expect(themeCss.length).toBeGreaterThan(theme.length)
    expect(themeCss).toContain('fc-callout')

    const pages = readdirSync(out).filter((f) => f.endsWith('.html'))
    expect(pages.length).toBeGreaterThan(0)
    const sheets = [themeCss]
    for (const page of pages) {
      sheets.push(...inlineStyles(readFileSync(path.join(out, page), 'utf-8')))
    }
    // The document's own L1 stylesheet is among them (the starter page is an L1
    // page), so this is not just the theme sheet re-checked.
    expect(sheets.some((s) => /\.l1-\d/.test(s))).toBe(true)
    for (const sheet of sheets) {
      expect(sheet).not.toContain('--color-')
      expect(sheet).not.toContain('var(--color-')
    }

    // (3) A module colour is a hex literal and nothing else. A colour-ROLE name
    //     where a module expects a colour fails content validation, naming the
    //     field…
    const roleErrors = validateModuleContent(STYLED_META, {
      heading: { text: 'Emphasis', color: 'accent' },
    })
    expect(roleErrors.length).toBeGreaterThan(0)
    expect(roleErrors.some((e) => e.field === 'heading.color')).toBe(true)
    expect(roleErrors.some((e) => /#hex colour/.test(e.message))).toBe(true)
    // …the literal form is still accepted, so the boundary is the value's form
    // rather than the presence of the field.
    expect(validateModuleContent(STYLED_META, { heading: { text: 'x', color: '#ff6b35' } })).toEqual([])

    // …and a non-literal that reaches the renderer anyway is DROPPED, not
    // emitted: the sink stays fail-closed.
    expect(resolveTextStyle({ text: 'x', color: 'accent' })).not.toContain('color:')
    expect(resolveTextStyle({ text: 'x', color: 'accent' })).not.toContain('--color-')
    expect(resolveTextStyle({ text: 'x', color: '#ff6b35' })).toContain('color: #ff6b35')

    // A gradient one of whose stops is a role name drops the WHOLE gradient —
    // a partial sweep would paint a colour the author never chose.
    expect(resolveSurfaceGradient({ angleDeg: 90, stops: [{ color: '#f5e6a3' }, { color: 'accent' }] })).toBe('')
    expect(
      resolveSurfaceGradient({ angleDeg: 90, stops: [{ color: '#f5e6a3' }, { color: '#ff6b35' }] }),
    ).toContain('#ff6b35')

    // (4) The left-bar callout takes its bar from the current text colour, and
    //     no per-name colour rule survives for it. The marker vocabulary is now
    //     an emphasis set, not a colour one.
    expect(CALLOUT_CSS).toContain('border-inline-start: var(--space-1) solid currentColor')
    expect(CALLOUT_CSS).not.toContain('--color-')
    expect(CALLOUT_CSS).not.toContain('border-inline-start-color')
  })
})

// ── AC-934 ───────────────────────────────────────────────────────────────────

describe('AC-934 page background and inherited text colour are L1 document fields, validated as colour axes', () => {
  it('test_UAT_AC934_document_page_colours_validate_as_colour_axes_and_emit_as_body_rules', () => {
    // Both fields declared: accepted, and emitted by the sole safe emitter as
    // exactly one body background-colour rule and one body colour rule.
    const both = validateL1({
      widths: WIDTHS,
      background: '#fffef8',
      textColor: '#1f2937',
      root: {
        kind: 'container',
        layout: 'stack',
        children: [
          { kind: 'text', text: 'own colour', axes: { color: '#c0392b', fontSizePx: 18 } },
          { kind: 'text', text: 'inherits', axes: { fontSizePx: 18 } },
        ],
      },
    })
    expect(both.ok, both.ok ? '' : JSON.stringify(both.errors)).toBe(true)
    if (!both.ok) return

    const { css } = renderL1Document(both.value)
    expect(css.match(/body \{ background-color: #fffef8 \}/g)).toHaveLength(1)
    expect(css.match(/body \{ color: #1f2937 \}/g)).toHaveLength(1)

    // Text colour is a FLOOR, not an override: the leaf that declares its own
    // colour paints it, and the leaf that declares none emits no colour
    // declaration at all — so the document's value is what paints there.
    const rules = css.split('\n').filter((line) => /^\.l1-\d/.test(line))
    const declaring = rules.filter((r) => r.includes('color: #c0392b'))
    expect(declaring).toHaveLength(1)
    const leafRules = rules.filter((r) => r.includes('font-size: 18px'))
    expect(leafRules).toHaveLength(2)
    const inheriting = leafRules.filter((r) => !r.includes('#c0392b'))
    expect(inheriting).toHaveLength(1)
    expect(inheriting[0]).not.toMatch(/[^-]color:/)

    // A document declaring neither field emits neither body rule — the page
    // renders exactly as it did before the fields existed.
    const neither = validateL1({
      widths: WIDTHS,
      root: { kind: 'text', text: 'plain', axes: { fontSizePx: 18 } },
    })
    expect(neither.ok).toBe(true)
    if (!neither.ok) return
    const plain = renderL1Document(neither.value).css
    expect(plain).not.toContain('body { background-color')
    expect(plain).not.toContain('body { color')

    // Each field is an ORDINARY colour axis: a value outside the colour-axis
    // form is rejected, with the error naming that field's path — through the
    // same site-definition validation every consuming operation performs.
    for (const [field, value] of [
      ['background', 'red'],
      ['textColor', 'rgb(0,0,0)'],
    ] as const) {
      const doc = {
        widths: WIDTHS,
        [field]: value,
        root: { kind: 'text', text: 'x', axes: { fontSizePx: 18 } },
      }
      const errors = validateSite(
        siteWith({ id: 'home', slug: 'home', title: 'Home', modules: [], l1: doc }),
      )
      expect(errors.ok, `${field}: '${value}' was accepted`).toBe(false)
      if (errors.ok) continue
      expect(
        errors.errors.some((e) => e.path === `/pages/0/l1/${field}`),
        `${field}: no error at its own path — got ${JSON.stringify(errors.errors)}`,
      ).toBe(true)
    }
  })
})

// ── AC-935 ───────────────────────────────────────────────────────────────────

describe('AC-935 no closed colour-role vocabulary survives in the schema, in a definition, or on a layer', () => {
  it('test_UAT_AC935_colour_role_vocabulary_is_absent_from_the_schema_surface_and_from_every_definition', () => {
    // The published schema surface exposes no colour-token group and no
    // colour-role enum, and the theme-token shape has no palette key.
    const surface = siteSchema as Record<string, unknown>
    expect(surface.paletteTokensSchema).toBeUndefined()
    expect(surface.layerColorRoleSchema).toBeUndefined()
    expect('palette' in siteSchema.themeTokensSchema.shape).toBe(false)

    // A theme declaring a palette obtains no behaviour by declaring it: the
    // colour group is not part of the shape, so the key is discarded on parse
    // and reaches nothing downstream.
    const parsed = siteSchema.themeTokensSchema.parse({
      ...defaultTokens,
      palette: { bg: '#ffffff', text: '#111827', border: '#e5e7eb' },
    })
    expect('palette' in (parsed as Record<string, unknown>)).toBe(false)

    // No layer treatment names a colour role. A layer image border naming one,
    // and a layer text run naming one, are each rejected as an UNKNOWN KEY —
    // not quietly ignored.
    const POSITION = { x: 10, y: 10, z: 1 }
    const ASSET = { id: 'a0', src: '/assets/x.png', alt: 'x' }
    const layerImage = (border: Record<string, unknown>): Record<string, unknown> => ({
      id: 'm0',
      type: 'hero',
      version: 1,
      layer: {
        children: [
          { kind: 'image', asset: ASSET, treatment: { border }, position: POSITION },
        ],
      },
    })
    const layerText = (typography: Record<string, unknown>): Record<string, unknown> => ({
      id: 'm0',
      type: 'hero',
      version: 1,
      layer: {
        children: [{ kind: 'text', text: 'wordmark', typography, position: POSITION }],
      },
    })

    for (const [label, instance, owner] of [
      ['image border', layerImage({ width: 'thin', color: 'accent' }), 'treatment/border'],
      ['text run', layerText({ size: '3xl', weight: 'bold', color: 'primary' }), 'typography'],
    ] as const) {
      const result = validateSite(siteWith(modulePage(instance)))
      expect(result.ok, `${label}: a colour role was accepted`).toBe(false)
      if (result.ok) continue
      // Rejected as an UNKNOWN KEY naming the colour field — not quietly ignored,
      // and not coerced to some surviving value.
      const offending = result.errors.filter((e) => e.path.endsWith(owner))
      expect(offending.length, `${label}: no error at ${owner}`).toBeGreaterThan(0)
      expect(
        offending.some((e) => /Unrecognized key/i.test(e.message) && e.message.includes('color')),
        `${label}: not reported as an unknown key naming 'color' — got ${JSON.stringify(offending)}`,
      ).toBe(true)
    }

    // With the colour-role field removed the same definitions are accepted, and
    // every surviving field on each treatment still validates.
    expect(validateSite(siteWith(modulePage(layerImage({ width: 'thin' })))).ok).toBe(true)
    expect(
      validateSite(
        siteWith(
          modulePage(
            layerText({
              size: '3xl',
              weight: 'bold',
              font: 'display',
              tracking: 'wide',
              leading: 'tight',
              align: 'center',
              shadow: 'glow',
            }),
          ),
        ),
      ).ok,
    ).toBe(true)

    // No stored site definition declares a theme palette.
    const slugs = readdirSync(SITES, { withFileTypes: true })
      .filter((e) => e.isDirectory())
      .map((e) => e.name)
    expect(slugs.length).toBeGreaterThan(0)
    for (const slug of slugs) {
      const stored = JSON.parse(readFileSync(path.join(SITES, slug, 'draft', 'site.json'), 'utf-8'))
      expect(stored.theme?.palette, `${slug} still declares theme.palette`).toBeUndefined()
    }
  })
})

// ── AC-936 ───────────────────────────────────────────────────────────────────

describe('AC-936 the non-colour token groups validate and emit exactly as before the colour cut', () => {
  it('test_UAT_AC936_every_surviving_token_group_still_emits_and_sparse_themes_are_default_filled', () => {
    const css = generateThemeCss(defaultTokens)
    const block = rootBlock(css)
    expect(block).not.toBe('')

    // One property from each surviving group.
    for (const name of [
      '--font-family-heading',
      '--font-size-5xl',
      '--font-weight-bold',
      '--line-height-normal',
      '--tracking-tight',
      '--space-24',
      '--radius-md',
      '--shadow-lg',
      '--container-6xl',
      '--breakpoint-md',
    ]) {
      expect(block, `missing ${name}`).toContain(`${name}:`)
    }

    // The emitted surface is exactly the non-colour token vocabulary: one
    // property per slot, nothing extra (in particular no colour property that
    // slipped back in), nothing missing.
    const t = defaultTokens
    const expected =
      // heading / body / display / label — the last two fall back when omitted.
      4 +
      Object.keys(t.typography.scale).length +
      Object.keys(t.typography.weights).length +
      Object.keys(t.typography.lineHeights).length +
      Object.keys(t.typography.tracking ?? {}).length +
      Object.values(t.typography.subScales ?? {}).reduce(
        (n, scale) => n + Object.keys(scale ?? {}).length,
        0,
      ) +
      Object.keys(t.spacing).length +
      Object.keys(t.radius).length +
      Object.keys(t.shadow).length +
      Object.keys(t.container).length +
      Object.keys(t.breakpoints).length
    const declCount = (block.match(/--[a-z0-9-]+:/g) ?? []).length
    expect(declCount).toBe(expected)

    // Slot-filling is unchanged: a theme supplying ONE spacing slot still gets
    // the whole surface — the override present, the omitted slot in the same
    // group default-filled, and a slot in another group default-filled.
    const sparse = generateThemeCss({ spacing: { '4': '9rem' } })
    expect(sparse).toContain('--space-4: 9rem;')
    expect(sparse).toContain('--space-8: 2rem;')
    expect(sparse).toContain('--radius-md: 0.375rem;')
    expect((rootBlock(sparse).match(/--[a-z0-9-]+:/g) ?? []).length).toBe(expected)
    expect(sparse).not.toMatch(/--color-/)

    // A theme declaring every surviving group validates with the shape it had
    // before the colour cut.
    const full = siteSchema.themeTokensSchema.safeParse(defaultTokens)
    expect(full.success, full.success ? '' : JSON.stringify(full.error.issues)).toBe(true)
    if (full.success) {
      expect(Object.keys(full.data).sort()).toEqual([
        'breakpoints',
        'container',
        'radius',
        'shadow',
        'spacing',
        'typography',
      ])
    }
  })
})

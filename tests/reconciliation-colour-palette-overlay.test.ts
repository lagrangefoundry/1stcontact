/**
 * Reconciliation UATs for story-c490f1cf — "Absolute values re-homed in L1:
 * every colour, length, and radius is carried as a validated literal, with a
 * palette overlay for colour".
 *
 * The absolute base of the model (AC-716) is covered by
 * `reconciliation-absolute-value-literals.test.ts`. This file covers the colour
 * **overlay** the story adds on top of it — the half that makes one conceptual
 * colour the unit of change without costing a pixel of reproduction fidelity:
 *
 *   AC-928  a site declares an arbitrary-size palette of named entries, and
 *           every colour axis accepts either a hex literal or a reference.
 *   AC-929  a reference that does not resolve is a validation failure, and
 *           resolution never substitutes a default.
 *   AC-930  translucency rides on the reference, so one colour used at several
 *           opacities is one entry.
 *   AC-931  references resolve once at the load boundary, so the authoring form
 *           is invisible downstream.
 *   AC-932  a retrofitted site's palette is materially smaller than its distinct
 *           colour count, with no colour lost.
 *
 * Every test drives a real entry point — `validateSite` (the one validator every
 * consumer goes through), `loadSite` (the load boundary itself), the
 * `renderL1Document` emitter, and the `1c colors` / `1c colors --assign` command
 * handlers over real on-disk site trees in a temp workspace. Nothing touches the
 * repo's own `storage/` tree.
 */
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, describe, expect, it } from 'vitest'
import type {
  L1Document,
  L1Node,
  L1Palette,
  ValidationError,
} from '../packages/site-schema/src/index'
import { resolveL1Color, validateSite } from '../packages/site-schema/src/index'
import { renderL1Document } from '../packages/framework/src/l1/render'
import { starterSiteJson } from '../tools/generate/src/cli/scaffold'
import { cmdColors, cmdColorsAssign, collectColorLiterals } from '../tools/generate/src/cli/colors'
import { loadSite } from '../tools/generate/src/store'

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const tmpDirs: string[] = []
function freshCwd(): string {
  const cwd = mkdtempSync(path.join(tmpdir(), 'storyc490f1cf-'))
  tmpDirs.push(cwd)
  return cwd
}
afterAll(() => {
  for (const d of tmpDirs) rmSync(d, { recursive: true, force: true })
})

const WIDTHS = [320, 1280]

/**
 * The palette under test. Free-form kebab-case names nowhere in DOC-23 §5.4's
 * starting vocabulary, every entry one opaque colour.
 *
 * REQ-137 deleted the named `steps` this fixture used to carry: an entry's
 * light↔dark family is generated from the reference's `shade` instead, so a
 * ramp is no longer something an entry *holds*.
 */
const PALETTE: L1Palette = {
  'brand-teal': { value: '#2e86a3' },
  'surface-accent': { value: '#101820' },
  ink: { value: '#1f2937' },
  rule: { value: '#c0392b' },
  glow: { value: '#7bd389' },
  edge: { value: '#ffb703' },
  wash: { value: '#8ecae6' },
}

/** A site definition wrapping one L1 page — the real authored shape. */
function siteWith(
  doc: unknown,
  extra: { palette?: L1Palette; modules?: unknown[] } = {},
): Record<string, unknown> {
  const base = starterSiteJson('storyc490f1cf')
  return {
    ...base,
    ...(extra.palette ? { palette: extra.palette } : {}),
    pages: [
      { id: 'home', slug: '', title: 'Home', modules: extra.modules ?? [], l1: doc },
    ],
  }
}

function errorsOf(site: Record<string, unknown>): ValidationError[] {
  const result = validateSite(site)
  return result.ok ? [] : result.errors
}

/** Write a site definition to a temp workspace in the one-file-per-page on-disk shape. */
function writeSite(cwd: string, slug: string, site: Record<string, unknown>): void {
  const draft = path.join(cwd, 'storage', 'sites', slug, 'draft')
  mkdirSync(path.join(draft, 'pages'), { recursive: true })
  const { pages, ...base } = site as { pages: Record<string, unknown>[] }
  writeFileSync(path.join(draft, 'site.json'), JSON.stringify({ ...base, id: slug }, null, 2))
  pages.forEach((page, i) => {
    writeFileSync(path.join(draft, 'pages', `p${i}.json`), JSON.stringify(page, null, 2))
  })
}

// ── AC-928 ───────────────────────────────────────────────────────────────────

describe('AC-928 a site declares an arbitrary-size palette; every colour axis takes a literal or a reference', () => {
  it('test_UAT_AC928_palette_entries_and_every_colour_axis_accepts_either_form', () => {
    // A page whose colour axes are spread across the substrate — the document's
    // own page colours, a text run, a box surface, a border, a shadow, a gradient
    // stop, a texture, an interaction state and a focus ring — mixing hex
    // literals with references to entries and to a shade of an entry. Each axis
    // gets a DISTINCT colour, so finding it in the emitted CSS proves *that*
    // axis accepted the form it was authored in, rather than one favoured axis
    // standing in for the rest.
    const doc = {
      widths: WIDTHS,
      background: { ref: 'surface-accent' }, //     #101820  — reference
      textColor: { ref: 'ink' }, //                 #1f2937  — reference
      root: {
        kind: 'box',
        axes: {
          surfaceFill: { ref: 'brand-teal' }, //     #2e86a3  — reference
          border: { widthPx: 2, color: { ref: 'rule' } }, //          #c0392b
          boxShadow: { offsetXPx: 0, offsetYPx: 4, blurPx: 8, color: { ref: 'glow' } }, // #7bd389
          surfaceGradient: {
            kind: 'linear',
            angleDeg: 90,
            stops: [{ color: { ref: 'edge' } }, { color: '#123456' }], // ref + literal, same axis
          },
          pattern: { shape: 'dots', spacingPx: 24, thicknessPx: 2, color: { ref: 'wash' } }, // #8ecae6
        },
        children: [
          {
            kind: 'text',
            text: 'Overlay',
            axes: {
              color: { ref: 'brand-teal', shade: 0.3 }, // #73aabf — a shade of an entry
              fontSizePx: 18,
            },
            interaction: {
              hover: { color: '#ff00aa' }, //   a literal on an interaction state
              focus: { ring: { widthPx: 3, color: '#0055ff' } }, // a literal on the ring
            },
          },
        ],
      },
    }

    // The site validates as a whole — the palette is declared on the site, the
    // references live in the page, and both halves are checked together.
    expect(errorsOf(siteWith(doc, { palette: PALETTE }))).toEqual([])

    // …and it renders, with every referenced entry resolved to the hex it names.
    const { css } = renderL1Document(doc as unknown as L1Document, { palette: PALETTE })
    for (const hex of [
      '#101820', // document background      (ref)
      '#1f2937', // document text colour     (ref)
      '#2e86a3', // box surfaceFill          (ref)
      '#c0392b', // border colour            (ref)
      '#7bd389', // box-shadow colour        (ref)
      '#ffb703', // gradient stop            (ref)
      '#123456', // gradient stop            (literal, same axis)
      '#8ecae6', // pattern colour           (ref)
      '#73aabf', // text colour              (ref at shade +0.3)
      '#ff00aa', // hover state colour       (literal)
      '#0055ff', // focus ring colour        (literal)
    ]) {
      expect(css, `no colour axis emitted ${hex}`).toContain(hex)
    }

    // The palette has no fixed size and no fixed slots: 40 free-form kebab-case
    // names, none of them in DOC-23 §5.4's starting vocabulary, all validate.
    const big: L1Palette = {}
    for (let i = 0; i < 40; i++) big[`house-hue-${i}`] = { value: '#123456' }
    const wide = {
      widths: WIDTHS,
      root: { kind: 'text', text: 'x', axes: { color: { ref: 'house-hue-39' } } },
    }
    expect(errorsOf(siteWith(wide, { palette: big }))).toEqual([])

    // An entry value carrying an alpha byte is rejected: entries are opaque by
    // construction, because translucency is an axis of the *reference* (AC-930).
    const translucentEntry = errorsOf(
      siteWith(wide, { palette: { 'house-hue-39': { value: '#12345678' } } as L1Palette }),
    )
    expect(translucentEntry.length).toBeGreaterThan(0)
    expect(translucentEntry.some((e) => /opaque hex/.test(e.message))).toBe(true)

    // A non-hex colour is still rejected in either form — the widening admits a
    // reference, not a freeform value.
    const keyword = { widths: WIDTHS, root: { kind: 'text', text: 'x', axes: { color: 'teal' } } }
    expect(errorsOf(siteWith(keyword, { palette: PALETTE })).length).toBeGreaterThan(0)
  })
})

// ── AC-929 ───────────────────────────────────────────────────────────────────

describe('AC-929 a dangling reference fails validation, and resolution never substitutes a default', () => {
  it('test_UAT_AC929_unresolvable_references_are_rejected_and_resolution_fails_loudly', () => {
    const docWith = (color: unknown): unknown => ({
      widths: WIDTHS,
      root: { kind: 'text', text: 'x', axes: { color, fontSizePx: 16 } },
    })

    // (a) an entry name the palette does not declare — the error names the
    //     offending reference AND the names actually available.
    const unknownEntry = errorsOf(siteWith(docWith({ ref: 'nope' }), { palette: PALETTE }))
    expect(unknownEntry.length).toBeGreaterThan(0)
    expect(unknownEntry.some((e) => e.message.includes("'nope'"))).toBe(true)
    expect(unknownEntry.some((e) => e.message.includes('brand-teal'))).toBe(true)

    // (b) a shade off the axis. REQ-137 replaced named steps — which could name
    //     something the entry did not declare — with a continuous scalar, which
    //     cannot dangle. What is left to get wrong is the range, and `[-1, +1]`
    //     is a validation failure to leave rather than a value to clamp: a
    //     clamp would silently paint a colour nobody asked for.
    for (const shade of [1.5, -1.5]) {
      const offAxis = errorsOf(siteWith(docWith({ ref: 'brand-teal', shade }), { palette: PALETTE }))
      expect(offAxis.length).toBeGreaterThan(0)
    }
    // …and an unknown *key* cannot be smuggled in beside a good reference,
    // because every L1 object is strict.
    expect(errorsOf(siteWith(docWith({ ref: 'brand-teal', step: '300' }), { palette: PALETTE })).length).toBeGreaterThan(0)

    // (c) any entry, in a site that declares no palette at all. Omitting the
    //     palette does not relax the rule — the alternative is exactly the
    //     render-time fallback the model does not have.
    const noPalette = errorsOf(siteWith(docWith({ ref: 'brand-teal' })))
    expect(noPalette.some((e) => e.message.includes('no palette'))).toBe(true)

    // A reference is checked wherever it is reachable in a page — including
    // inside the L1 content a behavior module holds in one of its slots.
    const page = {
      widths: WIDTHS,
      root: {
        kind: 'container',
        layout: 'stack',
        children: [{ kind: 'slot', name: 'body' }],
      },
    }
    const inSlot = errorsOf(
      siteWith(page, {
        palette: PALETTE,
        modules: [
          {
            id: 'form',
            type: 'contact-form',
            version: 1,
            slot: 'body',
            slots: {
              wrapper: {
                kind: 'text',
                text: 'inside a module slot',
                axes: { color: { ref: 'not-declared' } },
              } satisfies L1Node,
            },
          },
        ],
      }),
    )
    expect(inSlot.some((e) => e.message.includes("'not-declared'"))).toBe(true)
    expect(inSlot.some((e) => e.path.includes('/modules/0/slots'))).toBe(true)

    // Bypass validation and resolve a dangling reference directly: it fails
    // loudly rather than returning a substituted colour. Painting the wrong
    // colour is treated as worse than failing.
    expect(() => resolveL1Color({ ref: 'nope' }, PALETTE)).toThrow(/does not resolve/)
    expect(() => resolveL1Color({ ref: 'nope', shade: -0.5 }, PALETTE)).toThrow(/does not resolve/)
    expect(() => resolveL1Color({ ref: 'brand-teal' }, undefined)).toThrow(/no palette is declared/)

    // …and so does the renderer, which resolves at its entry: a document that
    // reached it unvalidated throws instead of painting a default.
    expect(() => renderL1Document(docWith({ ref: 'nope' }) as L1Document, { palette: PALETTE })).toThrow(
      /does not resolve/,
    )
  })
})

// ── AC-930 ───────────────────────────────────────────────────────────────────

describe('AC-930 translucency is an axis of the reference, so one colour at several opacities is one entry', () => {
  it('test_UAT_AC930_one_rgb_at_several_alphas_collapses_to_one_entry_exactly', () => {
    // The measured case (DOC-23 §5.3): the `xgd` brand colour painted at
    // #2e86a3, #2e86a3a6 and #2e86a355 — one conceptual colour at three
    // opacities. Retrofit a site carrying exactly those three literals and
    // confirm the conversion makes them ONE entry referenced at three alphas.
    const cwd = freshCwd()
    const doc = {
      widths: WIDTHS,
      background: '#2e86a3',
      root: {
        kind: 'box',
        axes: {
          surfaceFill: '#2e86a3a6',
          border: { widthPx: 1, color: '#2e86a355' },
        },
        children: [{ kind: 'text', text: 'alpha', axes: { color: '#2e86a3', fontSizePx: 16 } }],
      },
    }
    writeSite(cwd, 'alphas', siteWith(doc))

    const census = cmdColors('alphas', { cwd })
    expect(census.colors.map((c) => c.literal).sort()).toEqual([
      '#2e86a3',
      '#2e86a355',
      '#2e86a3a6',
    ])
    expect(census.distinctRgb).toBe(1)
    expect(census.alphaFamilies).toEqual([{ rgb: '#2e86a3', alphas: [255, 0xa6, 0x55] }])

    const assigned = cmdColorsAssign('alphas', { cwd })
    // Three literals, one entry — the entry stays the unit of colour change.
    expect(assigned.before).toBe(3)
    expect(assigned.after).toBe(1)
    const [entry] = Object.values(assigned.palette)
    // The entry itself is opaque; the opacity lives on the reference.
    expect(entry.value).toBe('#2e86a3')
    expect(Object.keys(entry)).toEqual(['value'])

    // The three references written to disk name that one entry at three alphas,
    // and each resolves back to the literal it replaced, byte for byte.
    const [name] = Object.keys(assigned.palette)
    const page = JSON.parse(
      readFileSync(path.join(cwd, 'storage', 'sites', 'alphas', 'draft', 'pages', 'p0.json'), 'utf8'),
    ) as { l1: Record<string, unknown> }
    const refs = JSON.stringify(page.l1)
    expect(refs).toContain(`"ref":"${name}"`)
    expect(resolveL1Color({ ref: name }, assigned.palette)).toBe('#2e86a3')
    expect(resolveL1Color({ ref: name, alpha: 0xa6 / 255 }, assigned.palette)).toBe('#2e86a3a6')
    expect(resolveL1Color({ ref: name, alpha: 0x55 / 255 }, assigned.palette)).toBe('#2e86a355')

    // Exactness holds across the WHOLE alpha byte range, not only the three
    // sampled values: every byte expressible in an 8-digit hex round-trips to
    // the identical byte, so replacing such a literal is reproduction, not
    // approximation.
    for (let byte = 0; byte < 255; byte++) {
      const hex = resolveL1Color({ ref: name, alpha: byte / 255 }, assigned.palette)
      expect(hex.slice(0, 7)).toBe('#2e86a3')
      expect(parseInt(hex.slice(7), 16), `alpha byte ${byte} did not round-trip`).toBe(byte)
    }
    // A fully-opaque reference emits the bare `#rrggbb`, so a literal that never
    // carried an alpha byte does not grow one on conversion.
    expect(resolveL1Color({ ref: name, alpha: 1 }, assigned.palette)).toBe('#2e86a3')
  })
})

// ── AC-931 ───────────────────────────────────────────────────────────────────

describe('AC-931 references resolve once at the load boundary, so the authoring form is invisible downstream', () => {
  it('test_UAT_AC931_a_referenced_document_loads_and_renders_identically_to_its_literal_twin', () => {
    const cwd = freshCwd()

    // The SAME page, authored twice: once with palette references, once with the
    // literals those references resolve to. Nothing else differs.
    const referenced = {
      widths: WIDTHS,
      background: { ref: 'surface-accent' },
      textColor: { ref: 'ink' },
      root: {
        kind: 'box',
        axes: {
          surfaceFill: { ref: 'brand-teal', shade: -0.3 },
          border: { widthPx: 2, color: { ref: 'rule' } },
        },
        children: [
          {
            kind: 'text',
            text: 'Same page, two authoring forms',
            axes: { color: { ref: 'brand-teal', shade: 0.5 }, fontSizePx: 20 },
          },
        ],
      },
    }
    const literal = {
      widths: WIDTHS,
      background: '#101820',
      textColor: '#1f2937',
      root: {
        kind: 'box',
        axes: {
          surfaceFill: '#185163', // brand-teal at shade -0.3
          border: { widthPx: 2, color: '#c0392b' },
        },
        children: [
          {
            kind: 'text',
            text: 'Same page, two authoring forms',
            axes: { color: '#9bc2d1', fontSizePx: 20 }, // brand-teal at shade +0.5
          },
        ],
      },
    }
    writeSite(cwd, 'refs', siteWith(referenced, { palette: PALETTE }))
    writeSite(cwd, 'literals', siteWith(literal))

    const loadedRefs = loadSite({ cwd, root: 'sites' }, 'refs')
    const loadedLiterals = loadSite({ cwd, root: 'sites' }, 'literals')
    expect(loadedRefs.ok && loadedLiterals.ok).toBe(true)
    if (!loadedRefs.ok || !loadedLiterals.ok) return

    // Resolution happened once, at the load boundary: what a consumer receives
    // carries no reference at all — it is exactly the literal document.
    const loadedRefDoc = loadedRefs.value.site.pages[0].l1
    expect(JSON.stringify(loadedRefDoc)).not.toContain('"ref"')
    expect(loadedRefDoc).toEqual(loadedLiterals.value.site.pages[0].l1)

    // …so a downstream consumer emits byte-identical output for the two forms.
    // Converting a site's literals to references moves no pixel.
    const a = renderL1Document(loadedRefDoc as L1Document)
    const b = renderL1Document(loadedLiterals.value.site.pages[0].l1 as L1Document)
    expect(a.css).toBe(b.css)
    expect(a.html).toBe(b.html)

    // The on-disk definition keeps its references — resolution is a read-time
    // overlay, not a rewrite — so a palette entry stays the single place a
    // colour is changed.
    const onDisk = readFileSync(
      path.join(cwd, 'storage', 'sites', 'refs', 'draft', 'pages', 'p0.json'),
      'utf8',
    )
    expect(onDisk).toContain('"ref": "brand-teal"')
    expect(onDisk).toContain('"shade": 0.5')

    // A literal-only document is entirely unaffected by the widening: it needs
    // no palette, and it validates and renders exactly as before.
    expect(loadedLiterals.value.site.palette).toBeUndefined()
    expect(errorsOf(siteWith(literal))).toEqual([])
    expect(b.css).toContain('#9bc2d1')

    // ── the precondition resolution-at-the-boundary places on the render seam ──
    // Because resolution happens at the boundary, the palette is an INPUT to
    // rendering and not something the renderer can recover. A caller entering
    // below the boundary — handing the renderer the stored document directly —
    // must supply that document's palette with it.
    const stored = JSON.parse(onDisk) as { l1: L1Document }

    // Without it, rendering RAISES. It does not fall back to a default colour or
    // silently drop the axis: an unresolvable reference is loud wherever it is
    // met, which is the same rule that makes a dangling reference a validation
    // failure rather than a render-time substitution.
    expect(() => renderL1Document(stored.l1)).toThrow(/palette/i)

    // With it, the same document renders exactly as the load boundary's own
    // output does — so the requirement is only that the palette travel with the
    // document, not that the seam behave differently.
    const direct = renderL1Document(stored.l1, { palette: PALETTE })
    expect(direct.css).toBe(a.css)
    expect(direct.html).toBe(a.html)
  })
})

// ── AC-932 ───────────────────────────────────────────────────────────────────

describe('AC-932 a retrofitted site yields a palette, not a colour list, and loses no colour', () => {
  /** Copy a real stored site into an isolated workspace. */
  function stage(cwd: string, slug: string): void {
    mkdirSync(path.join(cwd, 'storage', 'sites'), { recursive: true })
    cpSync(path.join(REPO_ROOT, 'storage', 'sites', slug), path.join(cwd, 'storage', 'sites', slug), {
      recursive: true,
    })
  }

  /** The multiset of colours a site's pages actually paint, sorted. */
  function paintedColors(cwd: string, slug: string): string[] {
    const load = loadSite({ cwd, root: 'sites' }, slug)
    if (!load.ok) throw new Error(`'${slug}' does not load: ${JSON.stringify(load.errors)}`)
    // The loaded site has every reference already resolved, so this is what the
    // renderer will paint regardless of which form was authored.
    return load.value.site.pages.flatMap((page) => collectColorLiterals(page)).sort()
  }

  it('test_UAT_AC932_retrofit_shrinks_the_palette_materially_and_paints_the_same_colours', () => {
    // The two stored sites carrying L1 pages. The retrofit is re-runnable — an
    // already-assigned site censuses back to its literals — so running it here
    // measures the same conversion that produced the sites on disk.
    // REQ-137 moved both entry counts: a colour a tint/shade mix cannot reach is
    // no longer filed under a family it is not part of, so it becomes its own
    // entry. `xgd` went 6→7, `gigabytealchemy` 8→15, because most of what
    // REQ-114's hue grouping called a family there was never a ramp — four of
    // its "blues" are unrelated colours, and the palette now says so.
    for (const [slug, expected] of [
      ['xgd', { distinctRgb: 16, entries: 7 }],
      ['gigabytealchemy', { distinctRgb: 30, entries: 15 }],
    ] as const) {
      const cwd = freshCwd()
      stage(cwd, slug)

      const before = paintedColors(cwd, slug)
      // Guard the comparison below against being vacuously true.
      expect(before.length, `${slug} paints no colours at all`).toBeGreaterThan(0)
      const census = cmdColors(slug, { cwd })
      expect(census.distinctRgb, `${slug} distinct RGB`).toBe(expected.distinctRgb)

      const assigned = cmdColorsAssign(slug, { cwd })
      const entries = Object.keys(assigned.palette).length
      expect(entries, `${slug} palette entries`).toBe(expected.entries)

      // A palette, not a colour list: fewer entries than the site has distinct
      // colours, because colours sharing an RGB at different opacities collapse
      // to one entry and colours on a ramp become shades of one. The exact
      // counts above are the real guard — this is the shape of the claim.
      expect(entries).toBeLessThan(census.distinctRgb)
      expect(assigned.before).toBeGreaterThan(entries)

      // Colour-lossless: every colour the site painted before is still painted
      // after, and no new colour appeared. Compared as a multiset, from the load
      // boundary both times, so a reference that resolved differently would show.
      expect(paintedColors(cwd, slug), `${slug} lost or gained a colour`).toEqual(before)

      // Every entry the retrofit wrote is one opaque colour — the alpha rode on
      // the refs, and REQ-137 left the entry nothing else to carry.
      for (const entry of Object.values(assigned.palette)) {
        expect(entry.value).toMatch(/^#[0-9a-f]{6}$/)
        expect(Object.keys(entry)).toEqual(['value'])
      }
    }

    // A site with no L1 colour axes carries no palette at all and remains valid
    // — the "palette is optional" guarantee in action, not a special case.
    for (const slug of ['1stcontact', 'harbor-cafe']) {
      const cwd = freshCwd()
      stage(cwd, slug)
      const load = loadSite({ cwd, root: 'sites' }, slug)
      expect(load.ok, `${slug} does not load`).toBe(true)
      if (!load.ok) continue
      expect(load.value.site.palette, `${slug} declares a palette`).toBeUndefined()
      expect(cmdColors(slug, { cwd }).colors).toEqual([])
    }
  })
})

import { existsSync, readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import * as siteSchema from '../packages/site-schema/src/index'
import {
  collectL1PaletteRefs,
  resolveL1Color,
  resolveL1Palette,
  shadeHex,
} from '../packages/site-schema/src/l1/palette'
import { validateL1 } from '../packages/site-schema/src/l1/validate'
import type { L1Palette } from '../packages/site-schema/src/index'
import {
  SHADE_FIT_TOLERANCE,
  cmdColors,
  derivePalette,
  fitShade,
} from '../tools/generate/src/cli/colors'

/**
 * UATs for REQ-137 — **shade on the reference replaces named steps**.
 *
 * The claim under test is one sentence: a palette entry is *one colour*, and the
 * light↔dark family around it is generated rather than stored. Everything below
 * is that claim from a different side — the schema that no longer admits a step,
 * the axis that generates the family, the derivation that fits real sites onto
 * it, and the bound within which it is allowed to differ from what it replaced.
 *
 * The bound is the part worth stating plainly. REQ-114 could promise
 * byte-identity because a step *stored* the member's hex; a shade *computes* it,
 * so a genuine ramp member lands near where it was rather than exactly on it.
 * REQ-137 §3 supersedes that guarantee with a measured one — ≤8/255 per channel
 * on the members re-expressed as shades, exact everywhere else.
 */

const REPO = path.resolve(__dirname, '..')
const SITES = path.join(REPO, 'storage', 'sites')

/** The two stored sites carrying L1 colour, which are the retrofit's subjects. */
const RETROFITTED = ['xgd', 'gigabytealchemy'] as const

/** A minimal well-formed document, parameterised by the colour under test. */
function docWith(color: unknown): unknown {
  return {
    widths: [1440],
    root: {
      kind: 'container',
      layout: 'stack',
      children: [{ kind: 'text', text: 'hello', axes: { color, fontSizePx: 16 } }],
    },
  }
}

/** The largest per-channel byte difference between two `#rrggbb` values. */
function channelDelta(a: string, b: string): number {
  let worst = 0
  for (let i = 1; i < 7; i += 2) {
    worst = Math.max(worst, Math.abs(parseInt(a.slice(i, i + 2), 16) - parseInt(b.slice(i, i + 2), 16)))
  }
  return worst
}

const readSite = (slug: string): { palette?: L1Palette } =>
  JSON.parse(readFileSync(path.join(SITES, slug, 'draft', 'site.json'), 'utf8'))

/**
 * Every stored site, by slug. A site is a directory that holds a site
 * definition — not merely a directory. Enumerating the raw entries picks up
 * whatever else the filesystem has left lying about (`.DS_Store` on any
 * checkout Finder has visited), and deleting a site leaves its directory
 * standing whenever one of those is inside it, because git tracks files and
 * not directories. Either way the leftover has no `site.json`, so asking for
 * one is what distinguishes a stored site from filesystem detritus. A test
 * that passes or fails on detritus is not evidence of anything.
 */
const storedSlugs = (): string[] =>
  readdirSync(SITES, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .filter((slug) => existsSync(path.join(SITES, slug, 'draft', 'site.json')))

function readPages(slug: string): unknown[] {
  const dir = path.join(SITES, slug, 'draft', 'pages')
  return readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => JSON.parse(readFileSync(path.join(dir, f), 'utf8')))
}

// ── AC1 — an entry is one colour ─────────────────────────────────────────────

describe('REQ-137 AC1 — a palette entry holds a single colour and `steps` is gone', () => {
  it('test_UAT_FC_REQ-137_an_entry_is_one_colour_and_a_step_is_not_a_field', () => {
    expect(siteSchema.l1PaletteEntrySchema.safeParse({ value: '#2e86a3' }).success).toBe(true)

    // Not merely ignored — *rejected*. The entry schema is strict, so a document
    // carrying the old shape fails loudly instead of quietly dropping a ramp.
    const withSteps = siteSchema.l1PaletteEntrySchema.safeParse({
      value: '#2e86a3',
      steps: { '500': '#4aafc9' },
    })
    expect(withSteps.success).toBe(false)

    // The entry is still opaque: alpha is the other reference axis (REQ-114).
    expect(siteSchema.l1PaletteEntrySchema.safeParse({ value: '#2e86a3a6' }).success).toBe(false)
  })

  it('test_UAT_FC_REQ-137_no_stored_site_carries_a_step', () => {
    // The claim is about the store, not only the schema: no `site.json` on disk
    // declares a step, and no page reference names one.
    let entriesSeen = 0
    for (const slug of storedSlugs()) {
      const sitePath = path.join(SITES, slug, 'draft', 'site.json')
      for (const entry of Object.values(readSite(slug).palette ?? {})) {
        entriesSeen++
        expect(Object.keys(entry), `${sitePath} entry carries more than a value`).toEqual(['value'])
      }
      for (const page of readPages(slug)) {
        for (const { ref } of collectL1PaletteRefs(page)) {
          expect(Object.keys(ref).sort().join(','), `${slug} reference carries a step`).toMatch(
            /^(alpha,)?ref(,shade)?$/,
          )
        }
      }
    }
    // The loop above is a "nothing on disk violates this" claim, which an empty
    // store satisfies for free. `xgd` and `gigabytealchemy` carry the only two
    // stored palettes, at 7 and 15 entries.
    expect(entriesSeen, 'no stored palette entry was examined at all').toBe(22)
  })
})

// ── AC2 — the shade axis ─────────────────────────────────────────────────────

describe('REQ-137 AC2 — a reference carries a continuous shade on [-1, +1]', () => {
  const PALETTE: L1Palette = { primary: { value: '#2e86a3' } }

  it('test_UAT_FC_REQ-137_shade_mixes_toward_black_and_white_and_zero_is_the_entry', () => {
    // Absent and zero are the entry itself, byte for byte — not a round trip
    // through the maths that happens to come back.
    expect(resolveL1Color({ ref: 'primary' }, PALETTE)).toBe('#2e86a3')
    expect(resolveL1Color({ ref: 'primary', shade: 0 }, PALETTE)).toBe('#2e86a3')

    // The ends of the axis are the pure targets it mixes toward.
    expect(resolveL1Color({ ref: 'primary', shade: 1 }, PALETTE)).toBe('#ffffff')
    expect(resolveL1Color({ ref: 'primary', shade: -1 }, PALETTE)).toBe('#000000')

    // In between: positive lightens, negative darkens, monotonically. Sampled
    // across the whole axis rather than at two points, so a mix that folded
    // back on itself somewhere in the middle could not pass.
    const lightness = (hex: string): number =>
      0.2126 * parseInt(hex.slice(1, 3), 16) +
      0.7152 * parseInt(hex.slice(3, 5), 16) +
      0.0722 * parseInt(hex.slice(5, 7), 16)
    // Never darkens, at any step size — including the ends, where consecutive
    // shades quantise onto the same byte and equality is the honest outcome.
    let previous = -1
    for (let i = -100; i <= 100; i++) {
      const here = lightness(shadeHex('#2e86a3', i / 100))
      expect(here, `shade ${i / 100} darkened on the one before it`).toBeGreaterThanOrEqual(previous)
      previous = here
    }
    // …and genuinely moves: over steps the eye can tell apart, strictly.
    let coarse = -1
    for (let i = -4; i <= 4; i++) {
      const here = lightness(shadeHex('#2e86a3', i / 4))
      expect(here, `shade ${i / 4} did not lighten on the one before it`).toBeGreaterThan(coarse)
      coarse = here
    }
  })

  it('test_UAT_FC_REQ-137_a_shade_only_ever_removes_chroma', () => {
    // The property that decides which colours are shades of an entry and which
    // are separate entries (AC4): both mix targets are achromatic, so no shade
    // of a colour is more saturated than the colour itself.
    const chroma = (hex: string): number => {
      const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))
      return Math.max(r, g, b) - Math.min(r, g, b)
    }
    for (const base of ['#2e86a3', '#d94f2b', '#00bc7d', '#1447e6']) {
      for (let s = -1; s <= 1.0001; s += 0.05) {
        const shaded = shadeHex(base, Math.round(s * 100) / 100)
        expect(chroma(shaded), `${base} @ ${s} gained chroma`).toBeLessThanOrEqual(chroma(base) + 1)
      }
    }
  })

  it('test_UAT_FC_REQ-137_an_out_of_range_shade_is_a_validation_failure', () => {
    // Rejected, not clamped: a clamp would silently paint a colour nobody asked
    // for, which is the render-time fallback DOC-23 §6 does not have.
    for (const shade of [1.001, -1.001, 5, -5]) {
      const result = validateL1(docWith({ ref: 'primary', shade }), { palette: PALETTE })
      expect(result.ok, `shade ${shade} was accepted`).toBe(false)
    }
    for (const shade of [-1, -0.5, 0, 0.25, 1]) {
      expect(validateL1(docWith({ ref: 'primary', shade }), { palette: PALETTE }).ok).toBe(true)
    }
  })

  it('test_UAT_FC_REQ-137_shade_and_alpha_are_independent_axes', () => {
    // Both live on the reference, and neither displaces the other: one entry
    // carries a whole family at any opacity.
    const shaded = shadeHex('#2e86a3', -0.3)
    expect(resolveL1Color({ ref: 'primary', shade: -0.3 }, PALETTE)).toBe(shaded)
    expect(resolveL1Color({ ref: 'primary', shade: -0.3, alpha: 0.5 }, PALETTE)).toBe(`${shaded}80`)
    expect(resolveL1Color({ ref: 'primary', alpha: 0.5 }, PALETTE)).toBe('#2e86a380')
  })

  it('test_UAT_FC_REQ-137_a_reference_counts_against_its_entry_at_every_shade', () => {
    // REQ-133 §5(c)'s delete rule is written in terms of this count, and the
    // per-step tally that used to split it is gone.
    const doc = {
      widths: [1440],
      root: {
        kind: 'container',
        layout: 'stack',
        children: [
          { kind: 'text', text: 'a', axes: { color: { ref: 'primary' }, fontSizePx: 16 } },
          { kind: 'text', text: 'b', axes: { color: { ref: 'primary', shade: 0.4 }, fontSizePx: 16 } },
          {
            kind: 'text',
            text: 'c',
            axes: { color: { ref: 'primary', shade: -0.4, alpha: 0.5 }, fontSizePx: 16 },
          },
        ],
      },
    }
    const refs = collectL1PaletteRefs(doc)
    expect(refs).toHaveLength(3)
    expect(refs.every((r) => r.ref.ref === 'primary')).toBe(true)
  })
})

// ── AC3/AC4 — derivation ─────────────────────────────────────────────────────

describe('REQ-137 AC3/AC4 — derivation emits entries and shades, never a step', () => {
  const censusOf = (slug: string) => cmdColors(slug, { cwd: REPO })

  it('test_UAT_FC_REQ-137_derivation_emits_entries_and_shades_and_never_a_step', () => {
    for (const slug of RETROFITTED) {
      const { palette, refs } = derivePalette(censusOf(slug))
      for (const entry of Object.values(palette)) expect(Object.keys(entry)).toEqual(['value'])
      for (const ref of refs.values()) {
        expect(Object.keys(ref).sort().join(',')).toMatch(/^(alpha,)?ref(,shade)?$/)
        if (ref.shade !== undefined) {
          expect(ref.shade).toBeGreaterThanOrEqual(-1)
          expect(ref.shade).toBeLessThanOrEqual(1)
          // A stored shade of exactly 0 would be a key claiming a variation the
          // reference does not have — the bare entry says it better.
          expect(ref.shade).not.toBe(0)
        }
      }
      // A shade is actually being used: the model would be vacuously satisfied
      // by a palette of one entry per colour.
      expect([...refs.values()].some((r) => r.shade !== undefined)).toBe(true)
    }
  })

  it('test_UAT_FC_REQ-137_a_colour_a_mix_cannot_reach_becomes_its_own_exact_entry', () => {
    // The measured case from REQ-137 §3: `#ffb900` is more saturated than the
    // `#f5e6a3` REQ-114 filed it under, and a mix only removes chroma, so it is
    // not a shade of anything. It becomes its own entry — and *exactly*, since
    // an entry stores its colour rather than computing it.
    const { palette, refs } = derivePalette(censusOf('gigabytealchemy'))
    const amber = refs.get('#ffb900')
    expect(amber).toBeDefined()
    expect(amber?.shade).toBeUndefined()
    expect(palette[amber?.ref as string].value).toBe('#ffb900')
    expect(resolveL1Color(amber!, palette)).toBe('#ffb900')

    // And the general rule behind it, over every derived reference: a colour
    // that is an entry's own value is reproduced byte for byte, and everything
    // else lands within the bound.
    for (const slug of RETROFITTED) {
      const derived = derivePalette(censusOf(slug))
      for (const [literal, ref] of derived.refs) {
        const resolved = resolveL1Color(ref, derived.palette)
        expect(resolved.length, `${slug} ${literal} changed its alpha`).toBe(literal.length)
        expect(resolved.slice(7)).toBe(literal.slice(7))
        if (derived.palette[ref.ref].value === literal.slice(0, 7)) {
          expect(resolved, `${slug} ${literal} is an entry value and must be exact`).toBe(literal)
        } else {
          expect(
            channelDelta(resolved.slice(0, 7), literal.slice(0, 7)),
            `${slug} ${literal} → ${resolved}`,
          ).toBeLessThanOrEqual(SHADE_FIT_TOLERANCE)
        }
      }
    }
  })

  it('test_UAT_FC_REQ-137_the_base_is_the_member_that_reaches_the_most_others', () => {
    // A family generated from one teal by the shade axis — which is exactly the
    // family the model claims to capture — collapses to that one entry. The
    // base has to be the chromatic member: mixing removes chroma and never adds
    // it, so a pale tint cannot reproduce the colour it came from.
    const base = '#2e86a3'
    const family = [-0.4, -0.2, 0, 0.2, 0.4].map((s) => shadeHex(base, s))
    const census = {
      slug: 'ramp',
      colors: family.map((rgb) => ({ literal: rgb, rgb, alpha: 255, count: 1 })),
      distinctRgb: family.length,
      alphaFamilies: [],
    }
    const { palette, refs } = derivePalette(census)
    expect(Object.keys(palette)).toHaveLength(1)
    expect(Object.values(palette)[0].value).toBe(base)
    for (const member of family) {
      expect(resolveL1Color(refs.get(member)!, palette)).toBe(member)
    }
  })

  it('test_UAT_FC_REQ-137_a_fit_that_would_change_a_colours_family_is_refused', () => {
    // What keeps the retrofit re-runnable. A shade replaces the literal, so the
    // next census reads the colour the shade *paints*; if that colour would be
    // grouped differently, re-running would regroup it and the palette would
    // change under a command that is supposed to be reproducible.
    const chromaOf = (hex: string): number => {
      const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))
      return Math.max(r, g, b) - Math.min(r, g, b)
    }
    for (const slug of RETROFITTED) {
      const { palette, refs } = derivePalette(cmdColors(slug, { cwd: REPO }))
      for (const [literal, ref] of refs) {
        if (ref.shade === undefined) continue
        const painted = resolveL1Color(ref, palette).slice(0, 7)
        const authored = literal.slice(0, 7)
        // Both sides agree on the one threshold grouping turns on first.
        expect(chromaOf(painted) < 6, `${slug} ${authored} → ${painted} crossed the neutral floor`).toBe(
          chromaOf(authored) < 6,
        )
      }
    }
  })

  it('test_UAT_FC_REQ-137_the_fit_is_searched_over_the_renderers_own_shade_function', () => {
    // The drift the retrofit measures has to be the drift that paints, or the
    // bound is a claim about a second copy of the maths rather than about the
    // site. `fitShade` reports the hex it found; the resolver must agree.
    for (const [base, target] of [
      ['#2e86a3', '#236d87'],
      ['#1f2937', '#9ca3af'],
      ['#00d492', '#007a55'],
      ['#e8dfd3', '#ece6dd'],
    ]) {
      const fit = fitShade(base, target)
      expect(fit.resolved).toBe(resolveL1Color({ ref: 'e', shade: fit.shade }, { e: { value: base } }))
      expect(fit.delta).toBe(channelDelta(fit.resolved, target))
    }
  })
})

// ── AC5 — the retrofitted sites ──────────────────────────────────────────────

describe('REQ-137 AC5 — the two retrofitted sites are on the new model and within the bound', () => {
  it('test_UAT_FC_REQ-137_retrofitted_sites_use_shades_and_resolve_within_the_bound', () => {
    for (const slug of RETROFITTED) {
      const palette = readSite(slug).palette as L1Palette
      expect(palette, `${slug} has no palette`).toBeDefined()

      const refs = readPages(slug).flatMap((page) => collectL1PaletteRefs(page))
      expect(refs.length, `${slug} carries no references`).toBeGreaterThan(0)
      expect(refs.some(({ ref }) => ref.shade !== undefined), `${slug} uses no shade`).toBe(true)

      // Every reference resolves — no dangling entry, no shade off the axis.
      for (const { ref } of refs) {
        expect(palette[ref.ref], `${slug} references '${ref.ref}'`).toBeDefined()
        if (ref.shade !== undefined) {
          expect(ref.shade).toBeGreaterThanOrEqual(-1)
          expect(ref.shade).toBeLessThanOrEqual(1)
        }
        expect(() => resolveL1Color(ref, palette)).not.toThrow()
      }
    }
  })

  it('test_UAT_FC_REQ-137_re_running_the_retrofit_on_a_stored_site_changes_nothing', () => {
    // The stored sites sit at the derivation's fixpoint: deriving again from
    // what they paint today reproduces the same colours in the same structure,
    // so the drift REQ-137 §3 bounds is paid once rather than compounded on
    // every re-run.
    //
    // Compared by colour rather than by entry *name*, because a name is a
    // labelling choice made at retrofit time — `xgd`'s roles came from
    // `--assign --names` — and re-deriving here supplies no such mapping.
    for (const slug of RETROFITTED) {
      const stored = readSite(slug).palette as L1Palette
      const { palette, refs, drift } = derivePalette(cmdColors(slug, { cwd: REPO }))
      const values = (p: L1Palette): string[] => Object.values(p).map((e) => e.value).sort()
      expect(values(palette), `${slug} re-derives different entries`).toEqual(values(stored))
      expect(drift, `${slug} re-derivation moves a colour`).toEqual([])
      for (const [literal, ref] of refs) {
        expect(resolveL1Color(ref, palette), `${slug} ${literal}`).toBe(literal)
      }
    }
  })

  it('test_UAT_FC_REQ-137_resolution_leaves_no_reference_behind', () => {
    // The one resolution pass still covers everything: a retrofitted page,
    // resolved against its palette, carries no reference at all.
    for (const slug of RETROFITTED) {
      const palette = readSite(slug).palette as L1Palette
      for (const page of readPages(slug)) {
        expect(collectL1PaletteRefs(resolveL1Palette(page, palette))).toEqual([])
      }
    }
  })
})

import { describe, expect, it } from 'vitest'
import { l1Operations } from '../tools/generate/src/cli/ai/toolbox-core'
import l1Surface from '../tools/generate/src/cli/ai/l1-surface.json'
import { makeMemorySite, type SiteFixture } from './support/site-factory'

/**
 * [[REQ-349]] — **the page map says what looks wrong, before the client does.**
 *
 * WHAT WENT WRONG. A full design review of a page missed that its four input
 * fields carried nothing but a 1px border and a corner radius: no face, no size,
 * no placeholder colour, no padding. They painted in the browser's own serif,
 * near-black, jammed against the border, beside fully styled buttons — and the
 * client saw it first. Nothing could have said so: `describe_page` gave a label,
 * `get_l1` gave one element, and nobody opened the element.
 *
 * WHAT THESE PIN. Each finding is read off `describe_page` exactly as a session
 * calls it — the grant's own operation over a real store — and every page here
 * is a stored page with a real `contact-form` instance, so "which element is a
 * control" is answered by the component's own declaration, not by the test.
 * Each rule is pinned both ways: it fires on the defect, and it stays quiet on
 * the legitimate case next to it, because an audit that cries wolf is ignored.
 */

type Tier = 'broken' | 'inconsistent' | 'worth_a_look'
interface Entry {
  path: string
  kind: string
  module?: string
  slot?: string
  label: string
  attention?: { tier: Tier; says: string[] }
}
interface PageMap {
  attention: Record<Tier, number>
  segments: Entry[]
}

const WIDTHS = [320, 768, 1280]
const INK = '#1f2937'
const SAND = '#f5efe6'
const FACE = 'Satoshi, Helvetica Neue, Arial, sans-serif'

/** A control the way a finished form paints one. */
function styledControl(control: string, extra: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    kind: 'control',
    control,
    axes: {
      color: INK,
      placeholderColor: '#6b7280',
      fontFamily: FACE,
      fontSizePx: 15,
      surfaceFill: '#ffffff',
      borderRadiusPx: 6,
      border: { widthPx: 1, color: '#d1d5db', style: 'solid' },
    },
    padding: { topPx: 12, rightPx: 16, bottomPx: 12, leftPx: 16 },
    ...extra,
  }
}

/** The ticket's defect: a field somebody gave a border and a radius, and nothing else. */
function bareControl(control: string, extra: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    kind: 'control',
    control,
    axes: { borderRadiusPx: 6, border: { widthPx: 1, color: '#d1d5db', style: 'solid' } },
    ...extra,
  }
}

/** A contact form mounted at the page slot `enquiry`, its form slot holding `form`. */
function contactForm(fields: string[], form: Record<string, unknown>): Record<string, unknown> {
  return {
    id: 'enquiry',
    type: 'contact-form',
    version: 7,
    slot: 'enquiry',
    config: {
      fields: fields.map((name) => ({ name, label: name, labelMode: 'placeholder', type: 'text', required: true })),
      submitLabel: 'Send',
      successMessage: 'Thanks.',
      assets: [],
    },
    slots: { form },
  }
}

/** A page: some copy, then the component's seam, on a sand page with dark ink. */
function page(opts: {
  copy?: Record<string, unknown>[]
  modules?: Record<string, unknown>[]
  column?: Record<string, unknown>
  widths?: number[]
}): Record<string, unknown> {
  return {
    id: 'home',
    slug: 'home',
    title: 'Home',
    modules: opts.modules ?? [],
    l1: {
      widths: opts.widths ?? WIDTHS,
      background: SAND,
      textColor: INK,
      root: {
        kind: 'container',
        layout: 'stack',
        padding: { topPx: 48, rightPx: 24, bottomPx: 48, leftPx: 24 },
        children: [
          ...(opts.copy ?? [
            { kind: 'text', text: 'We fix boilers', axes: { fontFamily: FACE, fontSizePx: 40 } },
          ]),
          ...(opts.column ? [opts.column] : [{ kind: 'slot', name: 'enquiry', behavior: 'contact-form' }]),
        ],
      },
    },
  }
}

async function describePage(pages: Record<string, unknown>, palette?: Record<string, unknown>): Promise<PageMap> {
  const site: SiteFixture = makeMemorySite({
    pages: { 'home.json': pages },
    ...(palette ? { patchSiteJson: { palette } } : {}),
  })
  try {
    const ops = l1Operations(site.slug, site.opts) as Record<string, (p: Record<string, unknown>) => Promise<unknown>>
    return (await ops.describe_page({ page: 'home' })) as PageMap
  } finally {
    await site.dispose()
  }
}

const flagged = (map: PageMap) => map.segments.filter((s) => s.attention)
const control = (map: PageMap, label: string) => map.segments.find((s) => s.kind === 'control' && s.label === label)!

describe('REQ-349 — describe_page reports style gaps', () => {
  it('test_UAT_FC_REQ-349_unstyled_inputs_are_broken_beside_a_styled_button', async () => {
    const map = await describePage(
      page({
        modules: [
          contactForm(['name', 'email'], {
            kind: 'container',
            layout: 'stack',
            gapPx: 12,
            children: [bareControl('name'), bareControl('email'), styledControl('submit')],
          }),
        ],
      }),
    )

    for (const name of ['name', 'email']) {
      const entry = control(map, name)
      expect(entry.module).toBe('enquiry')
      expect(entry.attention?.tier).toBe('broken')
      const says = entry.attention!.says.join(' | ')
      for (const gap of ['font', 'padding', 'placeholder']) expect(says).toContain(gap)
    }
    // The button somebody did style is not a finding — the audit names the
    // omission, not the component.
    expect(control(map, 'submit').attention).toBeUndefined()
    expect(map.attention.broken).toBe(2)
  })

  it('test_UAT_FC_REQ-349_a_text_run_with_no_colour_inherits_the_page_and_is_not_flagged', async () => {
    // The sharp rule: absence is only a defect when the element falls back to
    // the browser. A run with no colour falls back to the page's declared ink.
    const map = await describePage(
      page({
        copy: [
          { kind: 'text', text: 'Heading', axes: { fontFamily: FACE, fontSizePx: 40 } },
          { kind: 'text', text: 'Body copy with no colour of its own', axes: { fontFamily: FACE, fontSizePx: 16 } },
        ],
      }),
    )
    expect(flagged(map)).toEqual([])
    expect(map.attention).toEqual({ broken: 0, inconsistent: 0, worth_a_look: 0 })
  })

  it('test_UAT_FC_REQ-349_a_row_that_cannot_fit_at_a_declared_width_is_broken', async () => {
    // The ticket's second case: a fluid field and a 123px button side by side
    // at every width. At 320px the column is 272px and a field will not shrink
    // below its intrinsic width, so the pair cannot fit.
    const map = await describePage(
      page({
        modules: [
          contactForm(['email'], {
            kind: 'container',
            layout: 'row',
            gapPx: 12,
            children: [
              styledControl('email', { sizing: { width: { mode: 'fluid' } } }),
              styledControl('submit', { sizing: { width: { mode: 'fixed', px: 123 } } }),
            ],
          }),
        ],
      }),
    )
    const row = map.segments.find((s) => s.module === 'enquiry' && s.kind === 'container')!
    expect(row.attention?.tier).toBe('broken')
    expect(row.attention!.says.join(' ')).toMatch(/cannot fit side by side at 320px \(need 285px, have 272px\)/)
  })

  it('test_UAT_FC_REQ-349_a_child_wider_than_its_parent_is_broken', async () => {
    // The ticket's third case: a box narrowed to 424px and its 528px children
    // left behind. A desktop-only ladder, so the 424px box itself fits the page.
    const map = await describePage(
      page({
        widths: [768, 1280],
        column: {
          kind: 'container',
          layout: 'stack',
          sizing: { width: { mode: 'fixed', px: 424 } },
          children: [
            { kind: 'box', sizing: { width: { mode: 'fixed', px: 528 } } },
            { kind: 'box', sizing: { width: { mode: 'fixed', px: 400 } } },
          ],
        },
      }),
    )
    const wide = map.segments.filter((s) => s.attention?.says.some((x) => x.includes('wider than its parent')))
    expect(wide).toHaveLength(1)
    expect(wide[0].attention!.tier).toBe('broken')
    expect(wide[0].attention!.says.join(' ')).toContain('528px in 424px')
  })

  it('test_UAT_FC_REQ-349_literal_colours_on_a_palette_page_are_inconsistent_and_only_there', async () => {
    const palette = { ink: { value: INK }, sand: { value: SAND }, accent: { value: '#b45309' } }
    const referenced = (text: string) => ({
      kind: 'text',
      text,
      axes: { fontFamily: FACE, fontSizePx: 18, color: { ref: 'ink' }, surfaceFill: { ref: 'sand' } },
    })
    // One block pasted in from somewhere that did not know the palette.
    const reverted = { kind: 'text', text: 'Reverted card', axes: { fontFamily: FACE, fontSizePx: 18, color: '#0f172b' } }
    const copy = [referenced('One'), referenced('Two'), referenced('Three'), reverted]

    const withPalette = await describePage(page({ copy }), palette)
    const hit = withPalette.segments.find((s) => s.label === 'Reverted card')!
    expect(hit.attention?.tier).toBe('inconsistent')
    expect(hit.attention!.says.join(' ')).toContain('#0f172b')
    expect(withPalette.segments.find((s) => s.label === 'One')!.attention).toBeUndefined()

    // A site with no palette at all is a different situation, and is not nagged.
    const noPalette = await describePage(
      page({ copy: [reverted, { ...reverted, text: 'Another' }, { ...reverted, text: 'A third' }] }),
    )
    expect(flagged(noPalette)).toEqual([])
  })

  it('test_UAT_FC_REQ-349_text_too_faint_for_what_it_sits_on_is_flagged', async () => {
    const map = await describePage(
      page({
        copy: [
          { kind: 'text', text: 'Readable', axes: { fontFamily: FACE, fontSizePx: 16 } },
          { kind: 'text', text: 'Almost invisible', axes: { fontFamily: FACE, fontSizePx: 16, color: '#efe9e0' } },
          { kind: 'text', text: 'A bit faint', axes: { fontFamily: FACE, fontSizePx: 16, color: '#8f8a84' } },
        ],
      }),
    )
    expect(map.segments.find((s) => s.label === 'Readable')!.attention).toBeUndefined()
    const invisible = map.segments.find((s) => s.label === 'Almost invisible')!.attention!
    expect(invisible.tier).toBe('broken')
    expect(invisible.says.join(' ')).toMatch(/low contrast: 1\.\d:1/)
    expect(map.segments.find((s) => s.label === 'A bit faint')!.attention?.tier).toBe('worth_a_look')
  })

  it('test_UAT_FC_REQ-349_contrast_reads_the_panel_a_captured_run_sits_on', async () => {
    // A captured page paints its bands as absolutely placed boxes BESIDE the
    // words on them. The page is sand; the hero band is near-black; the hero's
    // pale words are perfectly readable — on the band, which is not their parent.
    const at = (y: number) => ({ keyframes: WIDTHS.map((w) => ({ at: w, x: 0, y, width: w })) })
    const band = { kind: 'box', id: 'band', geometry: at(0), axes: { surfaceFill: '#111111' } }
    const run = (text: string, extra: Record<string, unknown>) => ({
      kind: 'text',
      text,
      geometry: at(40),
      axes: { fontFamily: FACE, fontSizePx: 16, color: '#f5efe6' },
      ...extra,
    })
    const map = await describePage(
      page({
        copy: [
          band,
          { kind: 'box', id: 'card', geometry: at(400), axes: { surfaceFill: '#fbf8f3' } },
          run('On the band', { backedBy: 'band' }),
          run('Placed with no panel named', {}),
          run('On the pale card', { backedBy: 'card' }),
        ],
      }),
    )
    const said = (label: string) => map.segments.find((s) => s.label === label)!.attention
    expect(said('On the band')).toBeUndefined()
    // Which layer an unnamed run sits on is geometry the tree does not state,
    // so it is not guessed at — a guess is how a readable hero reads as broken.
    expect(said('Placed with no panel named')).toBeUndefined()
    expect(said('On the pale card')?.tier).toBe('broken')
  })

  it('test_UAT_FC_REQ-349_a_control_matches_a_page_that_names_no_face', async () => {
    // A control with no face is broken because it DIFFERS from the page. On a
    // page whose words name no face either, it paints what they paint.
    const map = await describePage(
      page({
        copy: [{ kind: 'text', text: 'Plain page', axes: { fontSizePx: 32 } }],
        modules: [
          contactForm(['email'], {
            kind: 'container',
            layout: 'stack',
            children: [styledControl('email', { axes: { color: INK, placeholderColor: '#6b7280', fontSizePx: 15 } })],
          }),
        ],
      }),
    )
    expect(control(map, 'email').attention).toBeUndefined()
  })

  it('test_UAT_FC_REQ-349_a_finished_page_reports_nothing', async () => {
    const map = await describePage(
      page({
        modules: [
          contactForm(['name', 'email'], {
            kind: 'container',
            layout: 'stack',
            gapPx: 12,
            children: [styledControl('name'), styledControl('email'), styledControl('submit')],
          }),
        ],
      }),
    )
    expect(map.attention).toEqual({ broken: 0, inconsistent: 0, worth_a_look: 0 })
    expect(flagged(map)).toEqual([])
    // The map still maps: nothing about an unflagged entry changed.
    expect(control(map, 'email')).toMatchObject({ kind: 'control', module: 'enquiry', slot: 'form' })
  })

  it('test_UAT_FC_REQ-349_the_declaration_tells_the_assistant_to_read_the_counts', () => {
    const op = l1Surface.operations.find((o) => o.op === 'describe_page')!
    expect(op.description).toMatch(/`attention`/)
    expect(op.description).toMatch(/after a change/)
    const shape = (l1Surface.shapes as Record<string, Record<string, string>>).page_map
    expect(shape.attention).toMatch(/broken.*inconsistent.*worth_a_look/)
    expect(shape.segments).toMatch(/`attention`/)
  })
})

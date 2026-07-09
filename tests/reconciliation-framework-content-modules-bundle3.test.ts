import { describe, it, expect } from 'vitest'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import TextBlock from '../packages/framework/src/modules/text-block/index.astro'
import ServicesGrid from '../packages/framework/src/modules/services-grid/index.astro'
import ContactForm from '../packages/framework/src/modules/contact-form/index.astro'
import { servicesGridMeta } from '../packages/framework/src/modules/services-grid/meta'
import { contactFormMeta } from '../packages/framework/src/modules/contact-form/meta'
import { validateModuleContent } from '../packages/framework/src/modules/validate'
import { cmdNew, cmdRender } from '../tools/generate/src/cli/commands'

/**
 * Reconciliation UATs for story-903e3e3a (STORY-56) — BUNDLE-3 upgrade delta.
 *
 * The original content-module reconcile (AC-445..458) is covered by
 * `reconciliation-framework-content-modules.test.ts`. This bundle's story cycle
 * *broadened* one AC and added seven new ones — the structured card
 * art-direction treatments, the stacked/size axes, the badge-keyed checklist,
 * the half-width row, the submit-button treatment, and the shared markdown
 * callout/verbatim behaviour — so this file covers exactly that delta, one UAT
 * per AC:
 *
 *   AC-457  recursive content-contract validation (nested enum / item schemas)
 *   AC-508  services-grid card accent / badge / checklist / surface treatments
 *   AC-509  services-grid stacked variant + grid + per-card size dials
 *   AC-510  checklist ✓ is a real leading text run keyed to the card status
 *   AC-511  contact-form width dial groups consecutive half bands into one row
 *   AC-512  contact-form submit treatment dial + font: inherit
 *   AC-513  markdown GFM-alert blockquotes render as semantic left-bar callouts
 *   AC-514  markdown renders verbatim (smartypants disabled)
 *
 * Modules render through Astro's container API — the same SSR path
 * tools/generate uses; the row-grouping and stylesheet-assembly ACs render a
 * full site through the generate pipeline (`cmdNew` + `cmdRender`). The
 * container render drops each module's scoped <style>, so CSS-level claims are
 * asserted against the module source (the folded-in stylesheet on disk for the
 * pipeline cases) — the same technique the existing framework UATs use.
 */

type Container = Awaited<ReturnType<typeof AstroContainer.create>>
let container: Container
async function render(Component: unknown, props: unknown): Promise<string> {
  container ??= await AstroContainer.create()
  return container.renderToString(Component as Parameters<Container['renderToString']>[0], {
    props: props as Record<string, unknown>,
  })
}

function moduleSource(rel: string): string {
  return readFileSync(
    fileURLToPath(new URL(`../packages/framework/src/modules/${rel}`, import.meta.url)),
    'utf8',
  )
}

/** A minimal valid card (title + body) plus any structured treatments. */
function card(extra: Record<string, unknown> = {}): Record<string, unknown> {
  return { title: 'Service', body: 'Body copy.', ...extra }
}

describe('reconciliation: content module catalog — BUNDLE-3 upgrade (story-903e3e3a)', () => {
  // AC-457 — content is rejected at any depth, each violation reported against a
  // dotted/indexed field path. The validator recurses through `itemSchema`, so
  // the same required/enum/bound rules apply to nested list and object fields.
  it('test_UAT_AC457_content_validation_recurses_item_schema_reporting_nested_paths', () => {
    // services-grid `items` bounded 2..6.
    expect(
      validateModuleContent(servicesGridMeta, { items: [card()] }).some((e) => e.field === 'items'),
    ).toBe(true) // 1 < min 2
    expect(
      validateModuleContent(servicesGridMeta, {
        items: Array.from({ length: 7 }, () => card()),
      }).some((e) => e.field === 'items'),
    ).toBe(true) // 7 > max 6

    // A nested enum field outside its declared set is flagged at its path.
    expect(
      validateModuleContent(servicesGridMeta, {
        items: [card({ accent: 'lime' }), card()],
      }).some((e) => e.field === 'items[0].accent'),
    ).toBe(true)
    expect(
      validateModuleContent(servicesGridMeta, {
        items: [card({ surface: 'hotpink' }), card()],
      }).some((e) => e.field === 'items[0].surface'),
    ).toBe(true)

    // Doubly-nested: badge.variant enum + badge.label required — the path walks
    // list index → object → object field.
    expect(
      validateModuleContent(servicesGridMeta, {
        items: [card({ badge: { label: 'Soon', variant: 'danger' } }), card()],
      }).some((e) => e.field === 'items[0].badge.variant'),
    ).toBe(true)
    expect(
      validateModuleContent(servicesGridMeta, {
        items: [card({ badge: { variant: 'neutral' } }), card()],
      }).some((e) => e.field === 'items[0].badge.label'),
    ).toBe(true)

    // A card `checklist` is bounded at most 8.
    expect(
      validateModuleContent(servicesGridMeta, {
        items: [card({ checklist: Array.from({ length: 9 }, () => 'x') }), card()],
      }).some((e) => e.field === 'items[0].checklist'),
    ).toBe(true)

    // contact-form: `action` required, `fields` bounded 1..8.
    expect(
      validateModuleContent(contactFormMeta, {
        fields: [{ name: 'name', label: 'Name', type: 'text', required: true }],
      }).some((e) => e.field === 'action'),
    ).toBe(true)

    // Content that satisfies the contract at every level validates cleanly.
    expect(
      validateModuleContent(servicesGridMeta, {
        items: [
          card({
            accent: 'accent',
            surface: 'muted',
            badge: { label: 'In development', variant: 'primary' },
            checklist: ['On-device', 'Private'],
          }),
          card(),
          card(),
        ],
      }),
    ).toEqual([])
  })

  // AC-508 — a card accepts optional structured accent / badge / checklist /
  // surface treatments, rendered as scoped markup; an untreated card renders
  // exactly as before.
  it('test_UAT_AC508_cards_render_structured_accent_badge_checklist_and_surface', async () => {
    const treated = await render(ServicesGrid, {
      variant: 'two-col',
      dials: {},
      content: {
        items: [
          {
            title: 'Treated',
            body: 'x',
            accent: 'accent',
            surface: 'muted',
            badge: { label: 'In development', variant: 'primary' },
            checklist: ['On-device', 'Private'],
          },
          { title: 'Plain', body: 'y' },
        ],
      },
    })
    // accent → coloured left border class keyed to the palette role.
    expect(treated).toContain('has-accent accent-accent')
    // badge → soft pill carrying its label and variant class.
    expect(treated).toMatch(/services-grid__badge[^"]*badge-primary/)
    expect(treated).toContain('In development')
    // checklist → one ✓ item per entry.
    expect(treated.match(/class="services-grid__check"/g)?.length).toBe(2)
    // muted surface → tinted panel class.
    expect(treated).toContain('surface-muted')

    // The badge variant defaults to `neutral` when omitted.
    const defaulted = await render(ServicesGrid, {
      variant: 'two-col',
      dials: {},
      content: {
        items: [card({ badge: { label: 'Coming soon' } }), card()],
      },
    })
    expect(defaulted).toMatch(/services-grid__badge[^"]*badge-neutral/)

    // An untreated card carries none of the treatment markup.
    const untreated = await render(ServicesGrid, {
      variant: 'two-col',
      dials: {},
      content: { items: [card(), card()] },
    })
    expect(untreated).not.toContain('has-accent')
    expect(untreated).not.toContain('services-grid__badge')
    expect(untreated).not.toContain('services-grid__checklist')
    expect(untreated).not.toContain('surface-muted')

    // The treatments resolve to semantic tokens in scoped CSS — never raw colour.
    const css = moduleSource('services-grid/index.astro')
    expect(css).toMatch(/\.accent-accent[^{]*\{[^}]*border-left-color:\s*var\(--color-accent\)/)
    expect(css).toMatch(/\.surface-muted\s*\{[^}]*color-mix/)
  })

  // AC-509 — services-grid gains a `stacked` variant (one column at every
  // breakpoint) plus a grid `size` dial and an optional per-card `size`,
  // defaulting to `md`.
  it('test_UAT_AC509_stacked_variant_and_grid_and_per_card_size_dials', async () => {
    const items = [
      { title: 'A', body: 'x' },
      { title: 'B', body: 'y' },
    ]

    // The stacked variant holds cards full-width in one column at every
    // breakpoint — asserted via the section class + the module's grid CSS (the
    // container render drops the scoped <style>).
    const stacked = await render(ServicesGrid, { variant: 'stacked', dials: {}, content: { items } })
    expect(stacked).toContain('variant-stacked')
    const css = moduleSource('services-grid/index.astro')
    // Single column by default (narrow) …
    expect(css).toMatch(/\.services-grid__cards\s*\{[^}]*grid-template-columns:\s*1fr/)
    // … and still one column from the md breakpoint up (multi-col variants only
    // switch to repeat(2|3) there).
    expect(css).toMatch(
      /@media \(min-width: 768px\)[\s\S]*variant-stacked[^{]*\{[^}]*grid-template-columns:\s*1fr/,
    )

    // The grid `size` dial scales the intro; a per-card `size` scales that card,
    // so one grid mixes a featured lg card with a quieter md companion.
    const sized = await render(ServicesGrid, {
      variant: 'stacked',
      dials: { size: 'lg' },
      content: {
        subhead: 'Intro line under the heading.',
        items: [
          { title: 'Featured', body: 'Lead\n\nBody.', size: 'lg' },
          { title: 'Standard', body: 'Just a card.' },
        ],
      },
    })
    expect(sized).toMatch(/class="services-grid[^"]*\bsize-lg\b/) // grid intro scale
    expect(sized).toMatch(/services-grid__card card-size-lg/) // featured card
    expect(sized).toMatch(/services-grid__card card-size-md/) // companion defaults to md

    // Omitting the dials preserves the prior `md` scale.
    const dflt = await render(ServicesGrid, { variant: 'three-col', dials: {}, content: { items } })
    expect(dflt).toMatch(/class="services-grid[^"]*\bsize-md\b/)
    expect(dflt).not.toContain('card-size-lg')
    expect((dflt.match(/card-size-md/g) ?? []).length).toBe(2)
  })

  // AC-510 — the checklist ✓ is a real leading text run (present in the DOM /
  // a11y tree), not a ::before pseudo, coloured by the card's badge/status
  // variant and rendered at regular weight.
  it('test_UAT_AC510_checklist_tick_is_real_text_run_keyed_to_card_status_colour', async () => {
    const html = await render(ServicesGrid, {
      variant: 'two-col',
      dials: {},
      content: {
        items: [
          { title: 'Accent', body: 'x', badge: { label: 'A', variant: 'accent' }, checklist: ['a', 'b'] },
          { title: 'Secondary', body: 'y', badge: { label: 'S', variant: 'secondary' }, checklist: ['c'] },
        ],
      },
    })
    // Each tick is an actual <span> text node containing ✓ (2 + 1 = 3 marks) —
    // present in rendered-text extraction, not an invisible pseudo glyph.
    expect(html.match(/services-grid__check-mark[^>]*>✓<\/span>/g)?.length).toBe(3)
    // The card wrapper takes its badge variant's status class, which drives the
    // tick colour — so the tick colour changes with the badge variant.
    expect(html).toMatch(/services-grid__card[^"]*status-accent/)
    expect(html).toMatch(/services-grid__card[^"]*status-secondary/)

    const css = moduleSource('services-grid/index.astro')
    // No pseudo-element approach.
    expect(css).not.toContain('services-grid__check::before')
    // Tick colour resolves to the card's status role (accent / secondary /
    // neutral → muted).
    expect(css).toMatch(/\.status-accent .services-grid__check-mark\s*\{[^}]*var\(--color-accent\)/)
    expect(css).toMatch(/\.status-secondary .services-grid__check-mark\s*\{[^}]*var\(--color-secondary\)/)
    expect(css).toMatch(/\.status-neutral .services-grid__check-mark\s*\{[^}]*var\(--color-muted\)/)
    // Regular weight — emphasis is carried by colour, not a bold glyph.
    expect(css).toMatch(
      /\.services-grid__check-mark\s*\{[^}]*font-weight:\s*var\(--font-weight-regular\)/,
    )
  })

  // AC-511 — the contact-form `width` dial groups consecutive half-width bands
  // into one shared row; a single half band (and full-width bands) are
  // unaffected; the row's structural CSS is folded into the site stylesheet.
  it('test_UAT_AC511_consecutive_half_width_forms_group_into_one_shared_row', async () => {
    const half = (id: string, action: string, submitLabel: string) => ({
      id,
      type: 'contact-form',
      version: 1,
      variant: 'inline',
      dials: { width: 'half' },
      content: {
        action,
        fields: [{ name: 'email', label: 'Email', type: 'email', required: true }],
        submitLabel,
      },
    })

    // Two consecutive half-width forms → one shared row of two columns.
    const cwd = mkdtempSync(path.join(tmpdir(), 'recon-b3-row-'))
    try {
      cmdNew('acme', { cwd })
      const draft = path.join(cwd, 'storage', 'sites', 'acme', 'draft')
      const home = JSON.parse(readFileSync(path.join(draft, 'pages', 'home.json'), 'utf8'))
      home.modules.push(half('subscribe', '/subscribe', 'Subscribe'), half('contact', '/contact', 'Send'))
      writeFileSync(path.join(draft, 'pages', 'home.json'), JSON.stringify(home))

      const { outDir } = await cmdRender('acme', { cwd })
      const html = readFileSync(path.join(outDir, 'index.html'), 'utf8')
      // Exactly one row wraps both half-width bands.
      expect((html.match(/class="fc-row"/g) ?? []).length).toBe(1)
      expect((html.match(/contact-form[^"]*width-half/g) ?? []).length).toBe(2)
      // Row structural CSS is in the stylesheet and stacks to one column on
      // narrow viewports.
      const themeCss = readFileSync(path.join(outDir, 'theme.css'), 'utf8')
      expect(themeCss).toMatch(/\.fc-row\s*\{[\s\S]*display: flex/)
      expect(themeCss).toMatch(
        /@media \(max-width: 768px\)\s*\{[\s\S]*\.fc-row\s*\{[\s\S]*flex-direction: column/,
      )
    } finally {
      rmSync(cwd, { recursive: true, force: true })
    }

    // A single half-width band is not wrapped in a multi-column row.
    const cwd2 = mkdtempSync(path.join(tmpdir(), 'recon-b3-solo-'))
    try {
      cmdNew('solo', { cwd: cwd2 })
      const draft2 = path.join(cwd2, 'storage', 'sites', 'solo', 'draft')
      const home2 = JSON.parse(readFileSync(path.join(draft2, 'pages', 'home.json'), 'utf8'))
      home2.modules.push(half('only', '/only', 'Send'))
      writeFileSync(path.join(draft2, 'pages', 'home.json'), JSON.stringify(home2))

      const { outDir } = await cmdRender('solo', { cwd: cwd2 })
      const html = readFileSync(path.join(outDir, 'index.html'), 'utf8')
      expect(html).toContain('width-half') // the band still renders half-width …
      expect(html).not.toContain('class="fc-row"') // … but is not wrapped in a row.
    } finally {
      rmSync(cwd2, { recursive: true, force: true })
    }
  })

  // AC-512 — the submit button carries a `submitTreatment` dial (primary /
  // neutral) setting its colour, and inherits the site font (`font: inherit`).
  it('test_UAT_AC512_submit_button_carries_treatment_dial_and_inherits_font', async () => {
    const renderForm = (dials: Record<string, string>) =>
      render(ContactForm, {
        dials,
        content: {
          action: '/x',
          fields: [{ name: 'email', label: 'Email', type: 'email', required: true }],
          submitLabel: 'Send',
        },
      })

    // neutral → dark neutral button; default → brand primary button.
    expect(await renderForm({ submitTreatment: 'neutral' })).toMatch(
      /class="contact-form__submit submit-neutral"/,
    )
    expect(await renderForm({})).toMatch(/class="contact-form__submit submit-primary"/)

    const css = moduleSource('contact-form/index.astro')
    // The submit button inherits the site font family + size.
    expect(css).toMatch(/\.contact-form__submit\s*\{[^}]*font:\s*inherit/)
    // primary is the brand button; neutral fills with the dark text colour.
    expect(css).toMatch(/\.submit-primary\s*\{[^}]*background:\s*var\(--color-primary\)/)
    expect(css).toMatch(/\.submit-neutral\s*\{[^}]*background:\s*var\(--color-text\)/)
  })

  // AC-513 — a GFM-alert blockquote (`> [!<role>] …`, optionally `italic`)
  // becomes a semantic left-bar callout keyed to `--color-<role>` at medium
  // weight; an unknown role stays a plain blockquote; the callout CSS is
  // assembled into the site stylesheet.
  it('test_UAT_AC513_markdown_alert_blockquotes_render_as_semantic_callouts', async () => {
    const body =
      '> [!accent] These are foundations.\n\n> [!secondary italic] Not trying to change you.\n\n> [!bogus] leave me be'
    const html = await render(TextBlock, { variant: 'prose', dials: {}, content: { body } })

    // Known role → semantic callout; the marker text is consumed (never shown).
    expect(html).toContain('blockquote class="fc-callout fc-callout--accent"')
    expect(html).toContain('These are foundations.')
    expect(html).not.toContain('[!accent]')
    // The italic flag adds the italic modifier alongside the role.
    expect(html).toContain('fc-callout--secondary')
    expect(html).toContain('fc-callout--italic')
    // An unknown role is left as a plain blockquote (no silent mis-styling).
    expect(html).not.toContain('fc-callout--bogus')
    expect(html).toContain('[!bogus]')

    // The callout CSS — an accent left-bar keyed to --color-<role> at medium
    // (500) weight — is assembled into the per-site stylesheet by the pipeline.
    const cwd = mkdtempSync(path.join(tmpdir(), 'recon-b3-callout-'))
    try {
      cmdNew('acme', { cwd })
      const { outDir } = await cmdRender('acme', { cwd })
      const themeCss = readFileSync(path.join(outDir, 'theme.css'), 'utf8')
      expect(themeCss).toMatch(
        /blockquote\.fc-callout\s*\{[^}]*font-weight:\s*var\(--font-weight-medium\)/,
      )
      expect(themeCss).toMatch(
        /blockquote\.fc-callout--accent\s*\{[^}]*border-inline-start-color:\s*var\(--color-accent\)/,
      )
    } finally {
      rmSync(cwd, { recursive: true, force: true })
    }
  })

  // AC-514 — markdown renders verbatim with smartypants disabled: straight
  // quotes are not curled and `--` is not promoted to an em-dash, so rendered
  // text equals its authored/captured source.
  it('test_UAT_AC514_markdown_renders_verbatim_with_smartypants_disabled', async () => {
    const body = `We're a studio that isn't extractive -- a "quoted" range.`
    const html = await render(TextBlock, { variant: 'prose', dials: {}, content: { body } })

    // Straight apostrophes / quotes survive; `--` stays two hyphens.
    expect(html).toContain("We're")
    expect(html).toContain("isn't")
    expect(html).toContain('"quoted"')
    expect(html).toContain('--')
    // None of the smartypants substitutions are injected.
    expect(html).not.toContain('’') // right single quotation mark
    expect(html).not.toContain('—') // em dash
    expect(html).not.toContain('“') // left double quotation mark
  })
})

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import TextBlock from '../packages/framework/src/modules/text-block/index.astro'
import ServicesGrid from '../packages/framework/src/modules/services-grid/index.astro'
import ContactForm from '../packages/framework/src/modules/contact-form/index.astro'

/**
 * Reconciliation UATs for story-903e3e3a (STORY-56) — BUNDLE-4 upgrade delta.
 *
 * BUNDLE-4 (REQ-45 last-mile fidelity) added the final dial/content-field
 * additions to the three existing content modules and broadened one AC. Each is
 * token-backed, closed-value, and defaults to the prior behaviour so a section
 * that omits the dial is unchanged. The base content-module reconcile
 * (AC-445..458) and the BUNDLE-3 card/form/markdown delta are covered by
 * `reconciliation-framework-content-modules.test.ts` and
 * `reconciliation-framework-content-modules-bundle3.test.ts`; this file covers
 * exactly this bundle's delta, one UAT per AC:
 *
 *   AC-446  (broadened) text-block frame width set by variant; `contentWidth`
 *           default fills the frame, so the variant alone governs the width
 *   AC-564  text-block + services-grid `contentWidth` dial caps the content
 *           column at the left gutter
 *   AC-565  contact-form `submitForeground` dial paints the submit label a
 *           palette-role foreground
 *   AC-566  contact-form `subheadSize`/`captionSize` dials + `caption` slot
 *
 * Modules render through Astro's container API — the same SSR path
 * tools/generate uses. The container render drops each module's scoped <style>,
 * so CSS-level claims are asserted against the module source (the same technique
 * the existing framework UATs use), and rendered-markup claims (classes, inline
 * style, element order) against the rendered string.
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

describe('reconciliation: content module catalog — BUNDLE-4 upgrade (story-903e3e3a)', () => {
  // AC-446 (broadened) — the text-block content-frame width is set by its
  // variant (`prose` → narrow container, `landing` → default container); when
  // `contentWidth` is absent (`default`) the content fills the variant frame, so
  // the variant alone governs the width. (The `contentWidth`-cap half is AC-564.)
  it('test_UAT_AC446_variant_sets_frame_width_content_fills_when_default', async () => {
    const prose = await render(TextBlock, { variant: 'prose', dials: {}, content: { body: 'hi' } })
    // Variant class present; with the dial omitted the section carries the
    // no-cap `content-width-default` treatment, so the content fills the frame.
    expect(prose).toContain('variant-prose')
    expect(prose).toContain('content-width-default')
    expect(prose).not.toContain('content-width-narrow')
    expect(prose).not.toContain('content-width-wide')

    const landing = await render(TextBlock, {
      variant: 'landing',
      dials: {},
      content: { body: 'hi' },
    })
    expect(landing).toContain('variant-landing')
    expect(landing).toContain('content-width-default')

    // The variant → frame-width mapping lives in the module's scoped CSS: the
    // inner frame is bound to the narrow container for `prose` and the default
    // container for `landing`.
    const css = moduleSource('text-block/index.astro')
    expect(css).toMatch(
      /\.variant-prose \.text-block__inner\s*\{[^}]*max-width:\s*var\(--container-narrow\)/,
    )
    expect(css).toMatch(
      /\.variant-landing \.text-block__inner\s*\{[^}]*max-width:\s*var\(--container-default\)/,
    )
    // `content-width-default` applies no cap — there is no `.content-width-default`
    // selector rule at all (only `narrow`/`wide` cap), so a section that omits
    // the dial keeps its variant frame width.
    expect(css).not.toMatch(/\.content-width-default\b/)
    expect(css).toMatch(/\.content-width-narrow \.text-block__inner > \*/)
  })

  // AC-564 — text-block AND services-grid accept a `contentWidth` dial that caps
  // the section content (heading, intro, body/cards) to a narrower measure
  // (`narrow` → narrow container) pinned to the frame's left gutter; the section
  // frame stays full-width and `default` applies no cap.
  it('test_UAT_AC564_text_block_and_services_grid_content_width_caps_at_left_gutter', async () => {
    // text-block: narrow caps the content; omitting the dial fills the frame.
    const tbNarrow = await render(TextBlock, {
      variant: 'landing',
      dials: { contentWidth: 'narrow' },
      content: { heading: 'H', body: 'body copy' },
    })
    expect(tbNarrow).toContain('content-width-narrow')
    const tbDefault = await render(TextBlock, {
      variant: 'landing',
      dials: {},
      content: { heading: 'H', body: 'body copy' },
    })
    expect(tbDefault).toContain('content-width-default')
    expect(tbDefault).not.toContain('content-width-narrow')

    // services-grid: same dial, same behaviour.
    const items = [
      { title: 'A', body: 'x' },
      { title: 'B', body: 'y' },
    ]
    const sgNarrow = await render(ServicesGrid, {
      variant: 'two-col',
      dials: { contentWidth: 'narrow' },
      content: { heading: 'What we do', items },
    })
    expect(sgNarrow).toContain('content-width-narrow')
    const sgDefault = await render(ServicesGrid, {
      variant: 'two-col',
      dials: {},
      content: { heading: 'What we do', items },
    })
    expect(sgDefault).toContain('content-width-default')
    expect(sgDefault).not.toContain('content-width-narrow')

    // The cap is a token-backed measure applied to the inner's content children,
    // pinned to the frame's left gutter by the inner's default flex cross-start
    // (left alignment) — the section frame itself stays full-width.
    const tbCss = moduleSource('text-block/index.astro')
    expect(tbCss).toMatch(
      /\.content-width-narrow \.text-block__inner > \*\s*\{[^}]*max-width:\s*var\(--container-narrow\)/,
    )
    const sgCss = moduleSource('services-grid/index.astro')
    expect(sgCss).toMatch(
      /\.content-width-narrow \.services-grid__inner > \*\s*\{[^}]*max-width:\s*var\(--container-narrow\)/,
    )
    // The services-grid frame is the full-width default container (unchanged).
    expect(sgCss).toMatch(/\.services-grid__inner\s*\{[^}]*max-width:\s*var\(--container-default\)/)
  })

  // AC-565 — the contact-form `submitForeground` dial paints the submit label a
  // framework-computed `var(--color-<role>)`; `auto` (default) leaves the label
  // the colour its treatment derives, applying no override. The role set is
  // closed — no instance-supplied raw colour reaches the page.
  it('test_UAT_AC565_submit_foreground_paints_label_palette_role', async () => {
    const renderForm = (dials: Record<string, string>) =>
      render(ContactForm, {
        dials,
        content: {
          action: '/x',
          fields: [{ name: 'email', label: 'Email', type: 'email', required: true }],
          submitLabel: 'Send message',
        },
      })

    // `bg` → the submit button carries an inline `color: var(--color-bg)` fill
    // (a legible white on-primary label) rather than inheriting a surface tint.
    const bg = await renderForm({ submitForeground: 'bg' })
    const bgBtn = bg.match(/<button\b[^>]*>/)?.[0] ?? ''
    expect(bgBtn).toContain('contact-form__submit')
    expect(bgBtn).toContain('color: var(--color-bg)')

    // Any palette role resolves the same way — always a `var(--color-<role>)`
    // token, never a raw colour.
    const accent = await renderForm({ submitForeground: 'accent' })
    const accentBtn = accent.match(/<button\b[^>]*>/)?.[0] ?? ''
    expect(accentBtn).toContain('color: var(--color-accent)')

    // `auto` (dial omitted) applies no label-colour override — the button has no
    // inline colour style.
    const auto = await renderForm({})
    const autoBtn = auto.match(/<button\b[^>]*>/)?.[0] ?? ''
    expect(autoBtn).toContain('contact-form__submit')
    expect(autoBtn).not.toContain('color: var(--color-')
  })

  // AC-566 — the contact-form `subheadSize`/`captionSize` dials size the intro
  // subhead and an optional `caption` fine-print slot independently; `md`
  // (default) preserves the prior size. A form omitting the caption and the
  // dials renders as before.
  it('test_UAT_AC566_subhead_and_caption_sizes_and_caption_slot', async () => {
    const withCaption = await render(ContactForm, {
      dials: { subheadSize: 'lg', captionSize: 'sm' },
      content: {
        action: '/x',
        subhead: 'Join our mailing list',
        caption: 'More to come soon',
        fields: [{ name: 'email', label: 'Email', type: 'email', required: true }],
        submitLabel: 'Subscribe',
      },
    })
    // The subhead carries the large size treatment, the caption the small one.
    expect(withCaption).toContain('subhead-size-lg')
    expect(withCaption).toContain('caption-size-sm')
    // The caption renders as its own slot, below the form, carrying its content.
    expect(withCaption).toContain('contact-form__caption')
    expect(withCaption).toContain('More to come soon')
    expect(withCaption.indexOf('contact-form__caption')).toBeGreaterThan(
      withCaption.indexOf('</form>'),
    )

    // A form omitting the caption and the dials is unchanged: no caption slot,
    // and both dials sit at their default `md` scale.
    const plain = await render(ContactForm, {
      dials: {},
      content: {
        action: '/x',
        subhead: 'Join our mailing list',
        fields: [{ name: 'email', label: 'Email', type: 'email', required: true }],
        submitLabel: 'Subscribe',
      },
    })
    expect(plain).not.toContain('contact-form__caption')
    expect(plain).toContain('subhead-size-md')
    expect(plain).toContain('caption-size-md')

    // The two sizes resolve to independent type-scale tokens in the scoped CSS.
    const css = moduleSource('contact-form/index.astro')
    expect(css).toMatch(
      /\.subhead-size-lg \.contact-form__subhead\s*\{[^}]*font-size:\s*var\(--font-size-lg\)/,
    )
    expect(css).toMatch(
      /\.caption-size-sm \.contact-form__caption\s*\{[^}]*font-size:\s*var\(--font-size-sm\)/,
    )
  })
})

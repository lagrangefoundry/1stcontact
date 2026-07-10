import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  ContentSafetyError,
  assertModuleConforms,
  buildInjectionContent,
  chromiumAvailable,
  cmdNew,
  createPlaywrightDriver,
  distDir,
  draftDir,
  getModule,
  loadSite,
  renderSite,
  type ConformanceFixture,
  type StoreContext,
} from '../tools/generate/src'

/**
 * Reconciliation UATs for story-38de5800 — "Render path fails loud on dangerous
 * content (unsafe URL schemes + injectable HTML)".
 *
 * The framework treats each module as the sanitization boundary for untrusted
 * (AI-/customer-authored) content. Rather than silently strip a dangerous value,
 * the render path **rejects** it loudly with a {@link ContentSafetyError} naming
 * the offending field and value — a recoverable content failure the generating
 * author can locate and fix.
 *
 * Each test drives the real render path — `renderSite` (the server-side page
 * renderer, exercising every module href/src/action/nav sink through the shipping
 * catalog) and, for AC-560, the browser-driven security conformance dimension.
 * One UAT per acceptance criterion; input variants are looped inside each test so
 * the function name matches the enforced `test_UAT_AC<N>_*` convention exactly.
 */

const browserOk = await chromiumAvailable()

// ── real-render scaffold (mirrors the conformance harness one-module page) ─────

/** Build a validated single-module home page JSON from a fixture. */
function oneModulePage(slug: string, fixture: ConformanceFixture): unknown {
  const p = fixture.props
  const instance: Record<string, unknown> = {
    id: 'm0',
    type: slug,
    version: 1,
    variant: typeof p.variant === 'string' ? p.variant : '',
    dials: (p.dials as Record<string, string> | undefined) ?? {},
    content: (p.content as Record<string, unknown> | undefined) ?? {},
  }
  return { id: 'home', slug: 'home', title: `content-safety:${fixture.label}`, modules: [instance] }
}

/**
 * Scaffold a one-module site into a fresh temp root, render it through the real
 * catalog renderer, and return the rendered home-page HTML. Throws
 * {@link ContentSafetyError} when a render sink rejects a dangerous value. The
 * temp root is always removed (on success and on throw) so tests never pollute
 * real site storage.
 */
async function renderModuleHtml(slug: string, fixture: ConformanceFixture): Promise<string> {
  const root = mkdtempSync(path.join(tmpdir(), 'fc-recon-safety-'))
  const ctx: StoreContext = { cwd: root, root: 'sites' }
  try {
    cmdNew(slug, { cwd: root })
    writeFileSync(
      path.join(draftDir(ctx, slug), 'pages', 'home.json'),
      JSON.stringify(oneModulePage(slug, fixture), null, 2),
    )
    const loaded = loadSite(ctx, slug, 'draft')
    if (!loaded.ok) {
      throw new Error(
        `fixture '${fixture.label}' produced an invalid one-module page: ` +
          loaded.errors.map((e) => `${e.path}: ${e.message}`).join('; '),
      )
    }
    const out = distDir(ctx, slug, 'draft')
    await renderSite(loaded.value, out, {})
    return readFileSync(path.join(out, 'index.html'), 'utf8')
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
}

/** Render, resolving to the thrown error (or null if the render succeeded). */
async function renderErrorOf(slug: string, fixture: ConformanceFixture): Promise<unknown> {
  return renderModuleHtml(slug, fixture).then(
    () => null,
    (e: unknown) => e,
  )
}

describe('Content-safety render boundary (story-38de5800)', () => {
  // AC-555 — an unsafe URL scheme in ANY link/resource/action sink fails the
  // render. One hostile value per enumerated sink: hero CTA link + image source,
  // services-grid card link + icon source, contact-form action, header/footer
  // logo source, and header/footer navigation link targets.
  it('test_UAT_AC555_unsafe_url_scheme_in_sink_fails_render', async () => {
    const sinks: { sink: string; slug: string; fixture: ConformanceFixture }[] = [
      {
        sink: 'hero cta href',
        slug: 'hero',
        fixture: {
          label: 'hero-cta',
          props: {
            variant: 'bg-color',
            content: { heading: 'H', subhead: 'Safe copy.', cta: { label: 'Go', href: 'javascript:window.__x=1' } },
          },
        },
      },
      {
        sink: 'hero image src',
        slug: 'hero',
        fixture: {
          label: 'hero-image',
          props: {
            variant: 'bg-image',
            content: { heading: 'H', subhead: 'Safe copy.', image: { id: 'i', src: 'vbscript:msgbox(1)', alt: 'x' } },
          },
        },
      },
      {
        sink: 'services-grid cta href',
        slug: 'services-grid',
        fixture: {
          label: 'services-grid-cta',
          props: {
            variant: 'three-col',
            content: {
              items: [
                { title: 'A', body: 'a', cta: { label: 'x', href: 'javascript:window.__x=1' } },
                { title: 'B', body: 'b' },
              ],
            },
          },
        },
      },
      {
        sink: 'services-grid icon src',
        slug: 'services-grid',
        fixture: {
          label: 'services-grid-icon',
          props: {
            variant: 'three-col',
            content: {
              items: [
                { title: 'A', body: 'a', icon: { id: 'i', src: 'data:text/html,<b>x</b>', alt: 'x' } },
                { title: 'B', body: 'b' },
              ],
            },
          },
        },
      },
      {
        sink: 'contact-form action',
        slug: 'contact-form',
        fixture: {
          label: 'contact-form-action',
          props: {
            variant: 'inline',
            content: {
              action: 'javascript:window.__x=1',
              fields: [{ name: 'email', label: 'Email', type: 'email', required: true }],
            },
          },
        },
      },
      {
        sink: 'header logo src',
        slug: 'header',
        fixture: {
          label: 'header-logo',
          props: {
            variant: 'top-nav',
            content: {
              logo: { id: 'l', src: 'file:///etc/passwd', alt: 'x' },
              entries: [{ label: 'Home', target: { kind: 'page', pageId: 'home' } }],
            },
          },
        },
      },
      {
        sink: 'header nav target',
        slug: 'header',
        fixture: {
          label: 'header-nav',
          props: {
            variant: 'top-nav',
            content: { logo: 'Brand', entries: [{ label: 'Evil', target: { kind: 'url', href: 'javascript:window.__x=1' } }] },
          },
        },
      },
      {
        sink: 'footer logo src',
        slug: 'footer',
        fixture: {
          label: 'footer-logo',
          props: {
            variant: 'minimal',
            content: { copyrightHolder: 'ACME', logo: { id: 'l', src: 'javascript:window.__x=1', alt: 'x' } },
          },
        },
      },
      {
        sink: 'footer nav target',
        slug: 'footer',
        fixture: {
          label: 'footer-nav',
          props: {
            variant: 'minimal',
            content: { copyrightHolder: 'ACME', links: [{ label: 'Evil', target: { kind: 'url', href: 'vbscript:x' } }] },
          },
        },
      },
    ]

    for (const { sink, slug, fixture } of sinks) {
      const err = await renderErrorOf(slug, fixture)
      expect(err, `sink '${sink}' should reject the unsafe scheme`).toBeInstanceOf(ContentSafetyError)
    }
  }, 180000)

  // AC-556 — safe URL forms render unchanged, no error, output preserves the
  // value verbatim. Each safe form is carried through the hero CTA link sink;
  // `data:image/*` (the one permitted data: form) is carried through the image src.
  it('test_UAT_AC556_safe_urls_render_unchanged', async () => {
    const safeUrls = [
      'https://example.com/page',
      'http://example.com',
      'mailto:hi@example.com',
      'tel:+15551234',
      '/relative/path',
      'assets/logo.png',
      '#in-page-anchor',
    ]
    for (const url of safeUrls) {
      const html = await renderModuleHtml('hero', {
        label: `safe-url`,
        props: { variant: 'bg-color', content: { heading: 'H', subhead: 'Safe copy.', cta: { label: 'Go', href: url } } },
      })
      expect(html, `url '${url}' should render verbatim`).toContain(`href="${url}"`)
    }
    // The one permitted data: form — an inline image asset on an image source.
    const dataImg = 'data:image/png;base64,iVBORw0KGgo='
    const imgHtml = await renderModuleHtml('hero', {
      label: 'safe-data-image',
      props: { variant: 'bg-image', content: { heading: 'H', subhead: 'Safe copy.', image: { id: 'i', src: dataImg, alt: 'x' } } },
    })
    expect(imgHtml).toContain(`src="${dataImg}"`)
  }, 120000)

  // AC-557 — injectable HTML in a markdown content field fails the render: a raw
  // <script> tag and, separately, an unsafe-scheme markdown link both reject.
  it('test_UAT_AC557_injectable_html_in_markdown_fails_render', async () => {
    const unsafeBodies = [
      'Intro copy <script>window.__x=1</script> and outro copy.',
      'A [tap here](javascript:window.__x=1) markdown link.',
    ]
    for (const body of unsafeBodies) {
      const err = await renderErrorOf('text-block', {
        label: 'text-block-unsafe',
        props: { variant: 'prose', content: { body } },
      })
      expect(err, `markdown body '${body}' should be rejected`).toBeInstanceOf(ContentSafetyError)
    }
  }, 60000)

  // AC-558 — ordinary content (prose, safe links, safe image) renders to HTML
  // with no content-safety error; the enforcement does not false-positive.
  it('test_UAT_AC558_clean_markdown_and_content_render_unchanged', async () => {
    const body =
      'A **safe** paragraph with a [site](https://example.com/page), a [rel](/page), ' +
      'a [mail](mailto:hi@example.com), a [jump](#sec), and an image ![logo](/assets/logo.png).'
    const html = await renderModuleHtml('text-block', {
      label: 'text-block-clean',
      props: { variant: 'prose', content: { body } },
    })
    expect(html).toContain('<strong>safe</strong>')
    expect(html).toContain('href="https://example.com/page"')
    expect(html).toContain('href="/page"')
    expect(html).toContain('href="mailto:hi@example.com"')
    expect(html).toContain('href="#sec"')
    expect(html).toContain('src="/assets/logo.png"')
  }, 60000)

  // AC-559 — a rejection is a distinct ContentSafetyError whose message names the
  // sink field context, the offending value, and the reason, for both an unsafe
  // URL and dangerous HTML.
  it('test_UAT_AC559_rejection_error_names_field_and_value', async () => {
    // (a) unsafe URL: field context + offending value + reason.
    const urlErr = await renderErrorOf('hero', {
      label: 'error-url',
      props: {
        variant: 'bg-color',
        content: { heading: 'H', subhead: 'Safe copy.', cta: { label: 'Go', href: 'javascript:steal(1)' } },
      },
    })
    expect(urlErr).toBeInstanceOf(ContentSafetyError)
    const urlMsg = (urlErr as Error).message
    expect(urlMsg, 'names the sink field').toContain('hero cta href')
    expect(urlMsg, 'includes the offending value').toContain('javascript:steal(1)')
    expect(urlMsg, 'states the reason').toMatch(/unsafe URL scheme/i)

    // (b) dangerous HTML: field context + offending construct + reason.
    const htmlErr = await renderErrorOf('text-block', {
      label: 'error-html',
      props: { variant: 'prose', content: { body: 'Intro <script>alert(1)</script> outro.' } },
    })
    expect(htmlErr).toBeInstanceOf(ContentSafetyError)
    const htmlMsg = (htmlErr as Error).message
    expect(htmlMsg, 'names the field context').toContain('markdown content')
    expect(htmlMsg, 'names the offending construct').toContain('<script>')
    expect(htmlMsg, 'states the reason').toMatch(/dangerous HTML/i)
  }, 60000)

  // AC-560 — a real catalog module given schema-derived injection content passes
  // the security conformance dimension with NO violation, because the render path
  // rejects the dangerous value (a fail-loud safe rejection) rather than emitting
  // it. Browser-driven; skips cleanly where no Chromium is available.
  it.runIf(browserOk)(
    'test_UAT_AC560_real_module_passes_security_by_rejecting',
    async () => {
      const security = {
        dimension: 'security' as const,
        driverFactory: createPlaywrightDriver,
        keepSandboxOnFailure: false,
      }
      for (const slug of ['hero', 'services-grid', 'contact-form'] as const) {
        const meta = getModule(slug, 1).meta
        const fixture: ConformanceFixture = {
          label: `${slug}-injection`,
          props: { variant: meta.variants[0], content: buildInjectionContent(meta) },
        }
        await expect(
          assertModuleConforms(slug, [fixture], security),
          `module '${slug}' must reject injection content (no violation)`,
        ).resolves.toBeUndefined()
      }
      // A raw <script> in a real text-block markdown body must be rejected, not run.
      const scriptFixture: ConformanceFixture = {
        label: 'text-block-live-script',
        props: {
          variant: getModule('text-block', 1).meta.variants[0],
          content: { body: 'Intro <script>window.__fcXssExecuted=true</script> outro.' },
        },
      }
      await expect(
        assertModuleConforms('text-block', [scriptFixture], security),
      ).resolves.toBeUndefined()
    },
    300000,
  )
})

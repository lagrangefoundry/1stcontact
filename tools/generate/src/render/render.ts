import path from 'node:path'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import {
  CALLOUT_CSS,
  generateThemeCss,
  getModule,
  getModuleCss,
} from '@1stcontact/framework'
import type { ModuleDefinition } from '@1stcontact/framework'
import type { Page, Site } from '@1stcontact/site-schema'
import type { LoadedSite } from '../store/loadSite'
import { copyDir, emptyDir, pathExists, writeText } from '../store/fsutil'

/**
 * Resolve a module instance's `type` + `version` to its renderable definition.
 * Defaults to the framework catalog ({@link getModule}); the conformance harness
 * (REQ-39) injects a resolver backed by a test-only registry so deliberately-
 * broken fixture modules render through this *same* path without polluting the
 * shipping catalog.
 */
export type ModuleResolver = (type: string, version: number) => ModuleDefinition

/** Optional render treatments. All default to the production catalog behaviour. */
export interface RenderSiteOptions {
  /** Module catalog to resolve each instance against (default: framework `getModule`). */
  resolveModule?: ModuleResolver
  /** Extra CSS appended to `theme.css` — lets injected modules ship their own rules. */
  extraCss?: string
}

/**
 * Server-side render of a loaded site to a directory of static HTML (DOC-7
 * §2.4, §11). One HTML file per page, a single per-site `theme.css`, and a copy
 * of the site's assets. Output is deterministic: every module renders through
 * Astro's container API (the same SSR path the framework UATs use), the theme
 * CSS is a pure function of the theme tokens, and nothing reads the wall clock.
 */

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/**
 * Stamp the builder's edit hook onto a module instance's root element (CHAT-9 M1).
 * The Weber editor's preview overlay maps a hovered/clicked region in the iframe
 * back to the module instance to edit via `data-fc-module`; without it there is no
 * bridge from a rendered element to its structured content. The attributes go on
 * the module's own root tag (the first opening tag of its markup). The hook is
 * inert to layout and to the production site — it is plain data-* metadata.
 */
function stampEditHook(html: string, id: string, type: string): string {
  return html.replace(
    /<([a-zA-Z][\w-]*)/,
    `<$1 data-fc-module="${escapeHtml(id)}" data-fc-type="${escapeHtml(type)}"`,
  )
}

type Container = Awaited<ReturnType<typeof AstroContainer.create>>

/**
 * Render every module instance on a page, in order, to one HTML fragment. Since
 * the framework pivot (REQ-79/REQ-84) layout is owned by the L1 substrate, so a
 * page here is a plain vertical stack of **capability-module** bands — the old
 * background/layer/motion/row/overlay-header composition is gone (its helpers
 * were deleted with the semantic layout modules).
 */
async function renderModules(
  container: Container,
  page: Page,
  resolveModule: ModuleResolver,
): Promise<string> {
  const parts: string[] = []
  for (const m of page.modules) {
    const { Component } = resolveModule(m.type, m.version)
    const rendered = await container.renderToString(Component, {
      props: { variant: m.variant, dials: m.dials, content: m.content },
    })
    // Stamp the builder edit hook onto the module root so the Weber preview can
    // target this instance.
    parts.push(stampEditHook(rendered, m.id, m.type))
  }
  return parts.join('\n')
}

/** Build a complete HTML document for one page. */
async function renderPage(
  container: Container,
  site: Site,
  page: Page,
  resolveModule: ModuleResolver,
): Promise<string> {
  const title = page.seoMeta?.title ?? `${page.title} — ${site.config.businessName}`
  const description = page.seoMeta?.description ?? site.config.tagline ?? ''
  const ogImage = page.seoMeta?.ogImage
  const body = await renderModules(container, page, resolveModule)

  const head = [
    '<meta charset="utf-8" />',
    '<meta name="viewport" content="width=device-width, initial-scale=1" />',
    `<title>${escapeHtml(title)}</title>`,
    description ? `<meta name="description" content="${escapeHtml(description)}" />` : '',
    ogImage ? `<meta property="og:image" content="${escapeHtml(ogImage)}" />` : '',
    // Theme tokens (fonts, palette, spacing) are declared as custom properties
    // in theme.css; the base style below binds the document to them.
    '<link rel="stylesheet" href="./theme.css" />',
    '<style>',
    '  *, *::before, *::after { box-sizing: border-box; }',
    '  body { margin: 0; font-family: var(--font-family-body); background: var(--color-bg); color: var(--color-text); }',
    '  h1, h2, h3, h4 { font-family: var(--font-family-heading); }',
    '</style>',
  ]
    .filter(Boolean)
    .map((line) => `  ${line}`)
    .join('\n')

  return `<!DOCTYPE html>
<html lang="en">
<head>
${head}
</head>
<body>
${body}
</body>
</html>
`
}

/** The page used for `index.html`: the `home`-slugged page, else the first. */
function homePage(site: Site): Page | undefined {
  return site.pages.find((p) => p.slug === 'home') ?? site.pages[0]
}

/**
 * Render `loaded` to `outDir`. The directory is emptied first so stale pages
 * never linger. Writes `<slug>.html` per page, an `index.html` alias for the
 * home page, the per-site `theme.css`, and copies `assets/` through.
 */
export async function renderSite(
  loaded: LoadedSite,
  outDir: string,
  opts: RenderSiteOptions = {},
): Promise<string[]> {
  const { site, sourceDir } = loaded
  const resolveModule = opts.resolveModule ?? getModule
  emptyDir(outDir)

  // theme.css = design-token :root variables + the module component CSS. The
  // container render (renderModules) emits module HTML but drops each module's
  // scoped <style>, so the component rules must be folded in here or the page
  // renders unstyled (BUG-1). An optional `extraCss` tail lets an injected
  // catalog (REQ-39) ship rules the framework module CSS does not carry.
  const extraCss = opts.extraCss ? `\n\n${opts.extraCss}` : ''
  writeText(
    path.join(outDir, 'theme.css'),
    `${generateThemeCss(site.theme)}\n\n${getModuleCss()}\n\n${CALLOUT_CSS}${extraCss}\n`,
  )

  const container = await AstroContainer.create()
  const written: string[] = []

  for (const page of site.pages) {
    const html = await renderPage(container, site, page, resolveModule)
    const file = `${page.slug}.html`
    writeText(path.join(outDir, file), html)
    written.push(file)
  }

  const home = homePage(site)
  if (home) {
    const html = await renderPage(container, site, home, resolveModule)
    writeText(path.join(outDir, 'index.html'), html)
    written.push('index.html')
  }

  const assetsSrc = path.join(sourceDir, 'assets')
  if (pathExists(assetsSrc)) {
    copyDir(assetsSrc, path.join(outDir, 'assets'))
  }

  return written.sort()
}

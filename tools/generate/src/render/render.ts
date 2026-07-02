import path from 'node:path'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import {
  generateThemeCss,
  getModule,
  getModuleCss,
  SECTION_CSS,
  wrapWithBackground,
} from '@1stcontact/framework'
import type { Page, Site } from '@1stcontact/site-schema'
import type { LoadedSite } from '../store/loadSite'
import { copyDir, emptyDir, pathExists, writeText } from '../store/fsutil'

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

type Container = Awaited<ReturnType<typeof AstroContainer.create>>

/** Render every module instance on a page, in order, to one HTML fragment. */
async function renderModules(container: Container, page: Page): Promise<string> {
  const parts: string[] = []
  for (const m of page.modules) {
    const { Component } = getModule(m.type, m.version)
    const html = await container.renderToString(Component, {
      props: { variant: m.variant, dials: m.dials, content: m.content },
    })
    // A section-level background (REQ-14) wraps the module's markup in stacked
    // background/overlay/content layers; modules without one are unchanged.
    parts.push(wrapWithBackground(html, m.background))
  }
  return parts.join('\n')
}

/** Build a complete HTML document for one page. */
async function renderPage(container: Container, site: Site, page: Page): Promise<string> {
  const title = page.seoMeta?.title ?? `${page.title} — ${site.config.businessName}`
  const description = page.seoMeta?.description ?? site.config.tagline ?? ''
  const ogImage = page.seoMeta?.ogImage
  const body = await renderModules(container, page)

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
export async function renderSite(loaded: LoadedSite, outDir: string): Promise<string[]> {
  const { site, sourceDir } = loaded
  emptyDir(outDir)

  // theme.css = design-token :root variables + the module component CSS. The
  // container render (renderModules) emits module HTML but drops each module's
  // scoped <style>, so the component rules must be folded in here or the page
  // renders unstyled (BUG-1).
  writeText(
    path.join(outDir, 'theme.css'),
    `${generateThemeCss(site.theme)}\n\n${getModuleCss()}\n\n${SECTION_CSS}\n`,
  )

  const container = await AstroContainer.create()
  const written: string[] = []

  for (const page of site.pages) {
    const html = await renderPage(container, site, page)
    const file = `${page.slug}.html`
    writeText(path.join(outDir, file), html)
    written.push(file)
  }

  const home = homePage(site)
  if (home) {
    const html = await renderPage(container, site, home)
    writeText(path.join(outDir, 'index.html'), html)
    written.push('index.html')
  }

  const assetsSrc = path.join(sourceDir, 'assets')
  if (pathExists(assetsSrc)) {
    copyDir(assetsSrc, path.join(outDir, 'assets'))
  }

  return written.sort()
}

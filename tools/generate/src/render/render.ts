import path from 'node:path'
import { experimental_AstroContainer as AstroContainer } from 'astro/container'
import {
  CALLOUT_CSS,
  composeOverlayHeader,
  generateThemeCss,
  getModule,
  getModuleCss,
  isScrollMotion,
  LAYER_CSS,
  MOTION_CSS,
  MOTION_SCRIPT,
  OVERLAY_BAND_CSS,
  ROW_CSS,
  composeRow,
  SECTION_CSS,
  wrapWithBackground,
  wrapWithLayer,
  wrapWithMotion,
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

type Container = Awaited<ReturnType<typeof AstroContainer.create>>

/** Render every module instance on a page, in order, to one HTML fragment. */
async function renderModules(
  container: Container,
  page: Page,
  resolveModule: ModuleResolver,
): Promise<string> {
  const parts: string[] = []
  // A `header` with variant `overlay` (REQ-25) is not emitted as its own band —
  // it is held here and floated over the following module's band so the two
  // share one continuous image band.
  let pendingOverlayHeader: string | null = null
  // Consecutive partial-width bands (REQ-20 `half`; REQ-36 `third`/`two-thirds`)
  // are buffered and flushed into one shared `fc-row` so they render as columns
  // rather than stacking; each keeps its width so the row can carry a ratio.
  const isPartialWidth = (w: unknown): w is string =>
    w === 'half' || w === 'third' || w === 'two-thirds'
  let rowBuffer: { html: string; width: string; surface?: string; rowWidth?: string }[] = []
  const flushRow = (): void => {
    if (rowBuffer.length === 0) return
    parts.push(rowBuffer.length === 1 ? rowBuffer[0].html : composeRow(rowBuffer))
    rowBuffer = []
  }

  for (const m of page.modules) {
    const { Component } = resolveModule(m.type, m.version)
    const html = await container.renderToString(Component, {
      props: { variant: m.variant, dials: m.dials, content: m.content },
    })
    // A section-level background (REQ-14) wraps the module's markup in stacked
    // background/overlay/content layers; a layer (REQ-15) then composites its
    // freely-positioned children over that; motion (REQ-16) wraps outermost so
    // the whole section animates as one unit. Modules with none are unchanged.
    const band = wrapWithMotion(
      await wrapWithLayer(wrapWithBackground(html, m.background), m.layer),
      m.motion,
    )

    if (m.type === 'header' && m.variant === 'overlay') {
      // A header can't sit mid-row; close any open row before holding it.
      flushRow()
      pendingOverlayHeader = band
      continue
    }
    if (pendingOverlayHeader) {
      // Composite the held header over this band, then clear the hold. The
      // composited unit is always a full-width band.
      flushRow()
      parts.push(composeOverlayHeader(pendingOverlayHeader, band))
      pendingOverlayHeader = null
      continue
    }
    if (isPartialWidth(m.dials?.width)) {
      rowBuffer.push({
        html: band,
        width: m.dials!.width as string,
        surface: m.dials?.surface as string | undefined,
        rowWidth: m.dials?.rowWidth as string | undefined,
      })
      continue
    }
    flushRow()
    parts.push(band)
  }
  flushRow()
  // An overlay header with no following band still renders — never dropped.
  if (pendingOverlayHeader) parts.push(pendingOverlayHeader)
  return parts.join('\n')
}

/**
 * Whether any module on the page — or any child of a module's layer — carries a
 * scroll-triggered motion, and therefore needs the reveal island shipped.
 */
function pageHasScrollMotion(page: Page): boolean {
  return page.modules.some(
    (m) => isScrollMotion(m.motion) || (m.layer?.children ?? []).some((c) => isScrollMotion(c.motion)),
  )
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
  // The scroll-reveal island (REQ-16) ships only when the page needs it — a
  // self-contained inline script, since the container render drops component
  // <script> blocks the same way it drops <style>.
  const motionScript = pageHasScrollMotion(page)
    ? `\n<script>${MOTION_SCRIPT}</script>`
    : ''

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
${body}${motionScript}
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
    `${generateThemeCss(site.theme)}\n\n${getModuleCss()}\n\n${CALLOUT_CSS}\n\n${SECTION_CSS}\n\n${LAYER_CSS}\n\n${OVERLAY_BAND_CSS}\n\n${ROW_CSS}\n\n${MOTION_CSS}${extraCss}\n`,
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

// ASTRO IS GONE FROM THIS FILE (REQ-148).
//
// It was here as an injected seam: behavior modules were `.astro` components, so
// rendering one needed a container, so this file — which is bundled into a
// Worker — could not name `astro/container` even dynamically (a bundler resolves
// a static specifier eagerly, pulling in markdown-remark, Shiki and Prism, which
// reach a `virtual:` specifier and a wasm package no Worker bundle can resolve).
// The components are plain TypeScript functions now, so there is no container to
// create, no seam to inject, and one render path that both hosts take.
//
// `@1stcontact/framework/worker`, NOT the barrel (REQ-145): the barrel still
// reaches `renderMarkdown`, and with it the Shiki/Prism graph. The worker entry
// is everything the render needs — including, since REQ-148, `getModule`.
import {
  CALLOUT_CSS,
  L1_EDIT_CSS,
  L1_EDIT_MARKER_ATTR,
  L1_EDIT_PAGE_ATTR,
  generateThemeCss,
  getModuleCss,
  getModuleClientJs,
  getModule,
  renderL1Document,
} from '@1stcontact/framework/worker'
import type { BehaviorDefinition } from '@1stcontact/framework/worker'
import { resolveSiteLocale } from '@1stcontact/site-schema'
import type { Page, ResolvedLocale, Site } from '@1stcontact/site-schema'
// From `assemble`, which DEFINES `LoadedSite`, not from `loadSite`, which merely
// re-exports it while importing `node:path` and the filesystem helpers. A
// type-only import is erased before a bundler sees it, so the Worker's BUNDLE
// was always fine — but it is not erased before `tsc`, and control-app's
// tsconfig carries no node types, so re-exporting through the filesystem module
// put `node:fs` and `node:path` in a Worker's TYPE program and failed its build.
// Import a type from where it is declared (REQ-149).
import type { LoadedSite } from '../store/assemble'

/**
 * Resolve a module instance's `type` + `version` to its renderable definition.
 * Defaults to the framework catalog (`getModule`, imported statically since
 * REQ-148 made the registry portable); the conformance harness (REQ-39) injects a
 * resolver backed by a test-only registry so deliberately-broken fixture modules
 * render through this *same* path without polluting the shipping catalog.
 */
export type ModuleResolver = (type: string, version: number) => BehaviorDefinition

/** Optional render treatments. All default to the production catalog behaviour. */
export interface RenderSiteOptions {
  /** Module catalog to resolve each instance against (default: framework `getModule`). */
  resolveModule?: ModuleResolver
  /** Extra CSS appended to `theme.css` — lets injected modules ship their own rules. */
  extraCss?: string
  /**
   * REQ-116 — render the **edit** channel (DOC-28 §5) rather than the ordinary
   * one: the same site and the same renderer, producing the page the editor
   * works on. Deliberately non-functional (no link target, no form action, no
   * behaviour or motion script), showing all content at once, with every
   * editable region outlined and stamped with its address.
   *
   * It is a render mode, not a new artifact: an edit render is never published,
   * never content-addressed, and never entered in `history.json` (DOC-12 §11).
   */
  edit?: boolean
}

/**
 * Server-side render of a loaded site to a directory of static HTML (DOC-7
 * §2.4, §11). One HTML file per page, a single per-site `theme.css`, and a copy
 * of the site's assets. Output is deterministic: a behavior module is a pure
 * function of its props, the theme CSS is a pure function of the theme tokens,
 * and nothing reads the wall clock.
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
 * The web editor's preview overlay maps a hovered/clicked region in the iframe
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

/**
 * Render every module instance on a page, in order, to one HTML fragment. Since
 * the framework pivot (REQ-79/REQ-84) layout is owned by the L1 substrate, so a
 * page here is a plain vertical stack of **behavior-module** bands — the old
 * background/layer/motion/row/overlay-header composition is gone (its helpers
 * were deleted with the semantic layout modules).
 */
function renderModuleInstances(
  page: Page,
  resolveModule: ModuleResolver,
  edit: boolean,
  locale: ResolvedLocale,
): string[] {
  const parts: string[] = []
  for (const m of page.modules) {
    const { Component } = resolveModule(m.type, m.version)
    // REQ-116 — `edit` reaches the module as a prop rather than being patched out
    // of its markup afterwards. Only the module knows which of its attributes
    // carry behaviour (an endpoint, a submit verb) and which are presentation, so
    // only the module can say what it looks like with that behaviour switched off.
    // REQ-151 — the site's resolved locale reaches the module as a prop. A
    // behavior that formats money or a date needs the locale, the currency and
    // the zone, and the alternative to handing it over is every such module
    // re-deriving its own — which is how two modules on one page end up
    // disagreeing about what country the business is in.
    const rendered = Component({
      config: m.config,
      slots: m.slots,
      instanceId: m.id,
      edit,
      locale,
    })
    // Stamp the builder edit hook onto the module root so the web editor's preview can
    // target this instance.
    parts.push(stampEditHook(rendered, m.id, m.type))
  }
  return parts
}

/** Build a complete HTML document for one page. */
function renderPage(
  site: Site,
  page: Page,
  resolveModule: ModuleResolver,
  edit: boolean,
): string {
  const title = page.seoMeta?.title ?? `${page.title} — ${site.config.businessName}`
  const description = page.seoMeta?.description ?? site.config.tagline ?? ''
  const ogImage = page.seoMeta?.ogImage
  // The page body is either an L1 document (a folded reproduction — REQ-88) or a
  // behavior-module stack. The L1 render is self-contained (concrete values from
  // the fold); its css rides in a page-level <style> alongside the theme tokens.
  //
  // REQ-93 — when the page carries both, the L1 document is still the single
  // body and each module mounts into the `slot` it is bound to. Modules render
  // first and are handed to the pure L1 emitter as finished fragments; the page
  // schema has already proved every binding resolves to exactly one existing slot.
  const locale = resolveSiteLocale(site.config)
  const rendered = renderModuleInstances(page, resolveModule, edit, locale)
  const mounts: Record<string, string> = {}
  page.modules.forEach((m, i) => {
    if (m.slot) mounts[m.slot] = rendered[i]
  })
  const l1 = page.l1 ? renderL1Document(page.l1, { mounts, edit }) : null
  const body = l1 ? l1.html : rendered.join('\n')

  const head = [
    '<meta charset="utf-8" />',
    '<meta name="viewport" content="width=device-width, initial-scale=1" />',
    `<title>${escapeHtml(title)}</title>`,
    description ? `<meta name="description" content="${escapeHtml(description)}" />` : '',
    ogImage ? `<meta property="og:image" content="${escapeHtml(ogImage)}" />` : '',
    // Theme tokens (fonts, spacing, scales) are declared as custom properties in
    // theme.css; the base style below binds the document to them.
    //
    // REQ-114 — the page's background and text colour are NOT set here any more.
    // They came from `--color-bg` / `--color-text`, which went with the legacy
    // token palette; their home is the L1 document's own `background` /
    // `textColor` (DOC-23 §2), emitted by the sole L1 emitter below.
    '<link rel="stylesheet" href="./theme.css" />',
    '<style>',
    '  *, *::before, *::after { box-sizing: border-box; }',
    '  body { margin: 0; font-family: var(--font-family-body); }',
    '  h1, h2, h3, h4 { font-family: var(--font-family-heading); }',
    '</style>',
    // REQ-88: the folded L1 document's self-contained css (absolute geometry
    // keyframes + typed axes). Only present for a raw-L1 page.
    l1 ? `<style>\n${l1.css}\n</style>` : '',
    // REQ-116 — the edit channel's own stylesheet: the faint per-segment outline.
    // It rides here, at the page level, rather than inside the L1 emitter's
    // per-node css, so it covers a module-only page too and is emitted exactly
    // once per document.
    edit ? `<style>${L1_EDIT_CSS}</style>` : '',
    // Behavior client behaviour (REQ-85): one deferred module, emitted only
    // when a behavior ships a `client.js`. Self-wires on load.
    //
    // REQ-116 — never in the edit channel. Behaviour scripts are exactly what
    // makes the page work, and the edit render's contract is that it does not:
    // nothing submits, nothing fetches, nothing autoplays.
    !edit && getModuleClientJs() ? '<script type="module" src="./capabilities.js"></script>' : '',
  ]
    .filter(Boolean)
    .map((line) => `  ${line}`)
    .join('\n')

  // REQ-151 — `lang`/`dir` from the site's resolved locale, never a literal.
  // `resolveSiteLocale` is shared with the framework's `renderL1Page`, so the
  // two render paths cannot disagree about a site's language (AC-4). `lang` is
  // what a screen reader reads to choose pronunciation and what a search index
  // stores, and a published revision is an immutable snapshot (DOC-12 §7) — so a
  // wrong value here is not fixable by fixing this line later.
  return `<!DOCTYPE html>
<html lang="${escapeHtml(locale.locale)}" dir="${locale.dir}">
<head>
${head}
</head>
<body${edit ? ` ${L1_EDIT_MARKER_ATTR} ${L1_EDIT_PAGE_ATTR}="${escapeHtml(page.id)}"` : ''}>
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
 * A rendered channel, in memory (REQ-119).
 *
 * Every text artifact the channel contains, keyed by its path relative to the
 * channel root — exactly the paths `renderSite` (render/write.ts) writes and exactly the
 * paths a URL under `/preview/<slug>/<channel>/` names. Asset bytes are NOT
 * here: they are copied through unchanged and belong to whatever is serving,
 * not to the render.
 */
export interface RenderedSite {
  /** Relative path → its UTF-8 content (`theme.css`, `capabilities.js`, `*.html`). */
  files: ReadonlyMap<string, string>
  /** The HTML page files, sorted — the writer's report of what it wrote. */
  pages: string[]
}

/**
 * Render `loaded` to a set of files, touching no filesystem (REQ-119).
 *
 * This is **the** render. `renderSite` (render/write.ts) is a writer over it, and the
 * builder's request-time preview is a reader of it — so the build-time and
 * request-time paths cannot disagree, because there is nothing for them to
 * disagree about: adding an L1 axis or a head tag changes this function and
 * both paths move together (DOC-28 §12 T5, AC-3).
 *
 * IT AWAITS NOTHING NOW (REQ-148) and stays `async` deliberately: it is the
 * host-facing entry, every caller is already a request handler or a CLI command
 * that awaits it, and the store this will read from once the definition lives in
 * D1 (DOC-12 §7 phase 2) is asynchronous. Narrowing the signature to a value
 * would churn every call site to widen it back.
 */
export async function renderSiteFiles(
  loaded: LoadedSite,
  opts: RenderSiteOptions = {},
): Promise<RenderedSite> {
  const { site } = loaded
  const edit = opts.edit === true
  const files = new Map<string, string>()

  // theme.css = design-token :root variables + the module component CSS. A module
  // ships its static chrome as a `styles.css` beside it (precompiled into the
  // catalog by `1c assets`), so those rules are folded in here or the page renders
  // unstyled (BUG-1). An optional `extraCss` tail lets an injected catalog
  // (REQ-39) ship rules the framework module CSS does not carry.
  const extraCss = opts.extraCss ? `\n\n${opts.extraCss}` : ''
  files.set(
    'theme.css',
    `${generateThemeCss(site.theme)}\n\n${getModuleCss()}\n\n${CALLOUT_CSS}${extraCss}\n`,
  )

  // capabilities.js = every catalog behavior's vetted client behaviour (REQ-85),
  // folded into one deferred module. Written only when non-empty; the page head
  // references it only then. Ships the client behaviour the SSR render omits.
  // REQ-116 — the edit channel writes no client bundle at all. No page in it
  // references one, so shipping the file would leave live behaviour sitting in
  // the directory one stray <script> away from making the page work again.
  const clientJs = edit ? '' : getModuleClientJs()
  if (clientJs) files.set('capabilities.js', `${clientJs}\n`)

  // REQ-148 — there is no longer a branch here. A page with behavior modules and
  // a pure folded-L1 reproduction (REQ-88) render through the same code, in the
  // same hosts, because a behavior is a plain function of its props. The
  // lazy-Astro-container test this replaced (REQ-89) is the thing it made
  // unnecessary rather than something it moved.
  const resolveModule = opts.resolveModule ?? getModule
  const pages: string[] = []

  for (const page of site.pages) {
    // REQ-109 — the flatness invariant. Emitted asset URLs are document-relative
    // (`assets/x.svg`, not `/assets/x.svg`) so a snapshot is relocatable under any
    // path prefix. That rewrite is only correct while every page sits FLAT at the
    // snapshot root: a page one directory down would need a depth-aware `../`
    // prefix, and would otherwise resolve its assets against its own subdirectory
    // and 404. Fail loud here rather than emit silently-wrong relative URLs.
    if (page.slug.includes('/') || page.slug.includes('\\')) {
      throw new Error(
        `page slug '${page.slug}' is nested: rendered pages must sit flat at the ` +
          'snapshot root, because emitted asset URLs are relative to it (REQ-109)',
      )
    }
    const html = renderPage(site, page, resolveModule, edit)
    const file = `${page.slug}.html`
    files.set(file, html)
    pages.push(file)
  }

  const home = homePage(site)
  if (home) {
    // `index.html` is an ALIAS for the home page, so it is the same bytes rather
    // than a second render of them. `renderPage` is deterministic, so this was
    // always true; taking the copy makes it true by construction and halves the
    // work of the request-time path, where the home page is what the iframe asks
    // for on every reload.
    files.set('index.html', files.get(`${home.slug}.html`)!)
    pages.push('index.html')
  }

  return { files, pages: pages.sort() }
}

// `astro/container` is named here ONLY as a type, which the compiler erases.
//
// It used to be imported lazily, inside {@link renderSiteFiles}, on the argument
// that a site with no behavior-module page renders with zero Astro involvement.
// That is true at RUNTIME and false at BUILD time (REQ-145): a bundler resolves
// a dynamic `import()` with a static specifier eagerly, so bundling this module
// for a Worker pulled the whole of Astro in — and with it markdown-remark, Shiki
// and Prism, which reach a `virtual:` specifier and a wasm package no Worker
// bundle can resolve. The container is therefore INJECTED by the node-only
// writer (`render/write.ts`), exactly as the module resolver is.
import type { experimental_AstroContainer as AstroContainerType } from 'astro/container'
// `@1stcontact/framework/worker`, NOT the barrel (REQ-145). The barrel
// re-exports the module registry, which imports two `.astro` components — one
// import of it makes this file, and therefore every render, node-only. The
// worker entry is the same contracts with no render binding in the graph.
import {
  CALLOUT_CSS,
  L1_EDIT_CSS,
  L1_EDIT_MARKER_ATTR,
  L1_EDIT_PAGE_ATTR,
  generateThemeCss,
  getModuleCss,
  getModuleClientJs,
  renderL1Document,
} from '@1stcontact/framework/worker'
import type { BehaviorDefinition } from '@1stcontact/framework/worker'
import type { Page, Site } from '@1stcontact/site-schema'
import type { LoadedSite } from '../store/loadSite'

/**
 * The resolver used when the caller injects none (REQ-145).
 *
 * THIS MODULE NO LONGER NAMES THE REGISTRY, in any form. A behavior's Astro
 * component can only be resolved where Astro's transform runs, and this file is
 * bundled into a Worker — where even a *dynamic* `import()` of the registry is
 * not safe, because a bundler resolves a static specifier at build time and
 * would pull `.astro` into the bundle whether or not the branch ever runs.
 *
 * So the default moved OUT, to the node-only writer (`render/write.ts`), which
 * injects `getModule`. A Worker rendering a pure-L1 site never needs one; a
 * Worker asked to render a page that mounts a behavior gets this — a clear
 * statement of the boundary REQ-148 moves, rather than an undefined `Component`
 * failing three frames later.
 */
function unresolvableModule(type: string, version: number): BehaviorDefinition {
  throw new Error(
    `No module resolver was loaded for '${type}' v${version}: a page mounting a ` +
      'behavior should have caused one to be imported (render.ts).',
  )
}

/**
 * Resolve a module instance's `type` + `version` to its renderable definition.
 * Defaults to the framework catalog (`getModule`, imported lazily); the conformance harness
 * (REQ-39) injects a resolver backed by a test-only registry so deliberately-
 * broken fixture modules render through this *same* path without polluting the
 * shipping catalog.
 */
export type ModuleResolver = (type: string, version: number) => BehaviorDefinition

/** Optional render treatments. All default to the production catalog behaviour. */
export interface RenderSiteOptions {
  /** Module catalog to resolve each instance against (default: framework `getModule`). */
  resolveModule?: ModuleResolver
  /** Extra CSS appended to `theme.css` — lets injected modules ship their own rules. */
  extraCss?: string
  /**
   * Make the Astro container a page with behavior modules is rendered through.
   *
   * Supplied by the caller rather than imported here, because naming
   * `astro/container` in this module — even dynamically — puts Astro in the
   * bundle of anything that bundles this file. `render/write.ts` supplies the
   * real one; a Worker supplies none and renders L1, which is the boundary
   * REQ-148 moves.
   */
  createContainer?: () => Promise<Container>
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

type Container = Awaited<ReturnType<typeof AstroContainerType.create>>

/**
 * Render every module instance on a page, in order, to one HTML fragment. Since
 * the framework pivot (REQ-79/REQ-84) layout is owned by the L1 substrate, so a
 * page here is a plain vertical stack of **behavior-module** bands — the old
 * background/layer/motion/row/overlay-header composition is gone (its helpers
 * were deleted with the semantic layout modules).
 */
async function renderModuleInstances(
  container: Container | undefined,
  page: Page,
  resolveModule: ModuleResolver,
  edit: boolean,
): Promise<string[]> {
  const parts: string[] = []
  for (const m of page.modules) {
    // Unreachable in practice: renderSiteFiles creates the container whenever any page
    // has modules. Guard defensively so a future caller can't silently render a
    // module page against a missing container.
    if (!container) {
      throw new Error('internal: Astro container required to render behavior-module pages')
    }
    const { Component } = resolveModule(m.type, m.version)
    // REQ-116 — `edit` reaches the module as a prop rather than being patched out
    // of its markup afterwards. Only the module knows which of its attributes
    // carry behaviour (an endpoint, a submit verb) and which are presentation, so
    // only the module can say what it looks like with that behaviour switched off.
    const rendered = await container.renderToString(Component, {
      props: { config: m.config, slots: m.slots, instanceId: m.id, edit },
    })
    // Stamp the builder edit hook onto the module root so the web editor's preview can
    // target this instance.
    parts.push(stampEditHook(rendered, m.id, m.type))
  }
  return parts
}

/** Build a complete HTML document for one page. */
async function renderPage(
  container: Container | undefined,
  site: Site,
  page: Page,
  resolveModule: ModuleResolver,
  edit: boolean,
): Promise<string> {
  const title = page.seoMeta?.title ?? `${page.title} — ${site.config.businessName}`
  const description = page.seoMeta?.description ?? site.config.tagline ?? ''
  const ogImage = page.seoMeta?.ogImage
  // The page body is either an L1 document (a folded reproduction — REQ-88) or a
  // behavior-module stack. The L1 render is self-contained (concrete values from
  // the fold); its css rides in a page-level <style> alongside the theme tokens.
  //
  // REQ-93 — when the page carries both, the L1 document is still the single
  // body and each module mounts into the `slot` it is bound to. Modules render
  // first (async, through the Astro container) and are handed to the pure L1
  // emitter as finished fragments; the page schema has already proved every
  // binding resolves to exactly one existing slot.
  const rendered = await renderModuleInstances(container, page, resolveModule, edit)
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

  return `<!DOCTYPE html>
<html lang="en">
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
 */
export async function renderSiteFiles(
  loaded: LoadedSite,
  opts: RenderSiteOptions = {},
): Promise<RenderedSite> {
  const { site } = loaded
  const edit = opts.edit === true
  const files = new Map<string, string>()

  // theme.css = design-token :root variables + the module component CSS. The
  // container render (renderModules) emits module HTML but drops each module's
  // scoped <style>, so the component rules must be folded in here or the page
  // renders unstyled (BUG-1). An optional `extraCss` tail lets an injected
  // catalog (REQ-39) ship rules the framework module CSS does not carry.
  const extraCss = opts.extraCss ? `\n\n${opts.extraCss}` : ''
  files.set(
    'theme.css',
    `${generateThemeCss(site.theme)}\n\n${getModuleCss()}\n\n${CALLOUT_CSS}${extraCss}\n`,
  )

  // capabilities.js = every catalog behavior's vetted client behaviour (REQ-85),
  // folded into one deferred module. Written only when non-empty; the page head
  // references it only then. Ships the client JS the container render omits.
  // REQ-116 — the edit channel writes no client bundle at all. No page in it
  // references one, so shipping the file would leave live behaviour sitting in
  // the directory one stray <script> away from making the page work again.
  const clientJs = edit ? '' : getModuleClientJs()
  if (clientJs) files.set('capabilities.js', `${clientJs}\n`)

  // Astro is only needed to render behavior modules. A pure folded-L1
  // reproduction (REQ-88) — or the empty starter — needs no container, so we
  // import `astro/container` and create the container only on demand. This keeps
  // the L1 render path entirely Astro-free (REQ-89). A page that mounts a
  // behaviour into an L1 slot (REQ-93) does need one, so the test is the presence
  // of modules, not the absence of `l1`.
  const needsAstro = site.pages.some((p) => p.modules.length > 0)
  let container: Container | undefined
  if (needsAstro) {
    if (!opts.createContainer) {
      throw new Error(
        'This site mounts a behavior module, which needs an Astro container, and none ' +
          'was supplied. `1c render` supplies one (render/write.ts); a Worker cannot — ' +
          'rendering behavior modules in workerd is REQ-148.',
      )
    }
    container = await opts.createContainer()
  }
  const resolveModule = opts.resolveModule ?? unresolvableModule
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
    const html = await renderPage(container, site, page, resolveModule, edit)
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

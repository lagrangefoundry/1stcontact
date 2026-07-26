import { readFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { registry } from './registry'
import { responsiveTextCss } from './text-style'

/**
 * Module component CSS, aggregated into one string (BUG-1).
 *
 * The render pipeline draws each module through Astro's container API
 * (`renderToString`), which returns the module's HTML but drops its scoped
 * `<style>` — so the generated per-site `theme.css` carried only the design
 * token `:root` variables and every module rendered unstyled. This helper
 * restores REQ-6's `loadModuleStyles` step: it reads each catalogued module's
 * `index.astro` and folds its raw `<style>` content into the generated CSS.
 *
 * The modules' selectors are plain (`.carousel__track`, `.contact-form__field`),
 * matching the plain class attributes the container
 * render emits — so raw extraction lines up with no scope rewriting. The
 * `<style>` blocks are the single source of truth for module CSS; nothing is
 * duplicated here.
 */

const MODULES_DIR = path.dirname(fileURLToPath(import.meta.url))

/**
 * An Astro component's **template**: everything after the frontmatter fence.
 *
 * The frontmatter is TypeScript, not markup, so a `<style>` occurring there is
 * always prose or a string — never a style element. Scanning it anyway is not a
 * harmless over-read: a doc comment that merely *mentions* `<style>` opens a
 * match that runs to the first real `</style>`, folding the component's imports,
 * props interface, script body and markup into the generated `theme.css` as if
 * they were CSS. `carousel`'s comment does exactly that.
 *
 * A source with no fence is already all template.
 */
function templateOf(astroSource: string): string {
  const m = /^---\r?\n[\s\S]*?\r?\n---/.exec(astroSource)
  return m ? astroSource.slice(m[0].length) : astroSource
}

/**
 * Concatenated text of every **static** `<style>…</style>` block in
 * `astroSource` — the module's own chrome, folded once into `theme.css`.
 *
 * A module also emits per-instance CSS as a *self-closing*
 * `<style set:html={…} />` in its body, because that content varies per instance
 * and must survive `renderToString` rather than be hoisted. Such a tag has no
 * closing partner, so treating it as an opening one makes the scan run on to the
 * next real `</style>` and swallow all the markup in between — which is how the
 * component's own HTML ended up inside the generated stylesheet.
 */
function extractStyleBlocks(astroSource: string): string {
  const blocks: string[] = []
  // Removed rather than skipped: a self-closing tag has no `</style>` of its own,
  // so a match starting at one would consume the NEXT block's closing tag and
  // take the real chrome CSS down with it.
  const template = templateOf(astroSource).replace(/<style\b[^>]*\/>/g, '')
  const re = /<style\b[^>]*>([\s\S]*?)<\/style>/g
  let match: RegExpExecArray | null
  while ((match = re.exec(template)) !== null) {
    const css = match[1].trim()
    if (css) blocks.push(css)
  }
  return blocks.join('\n')
}

let cache: string | undefined

/**
 * The combined component CSS for every module in the catalog. Modules are
 * visited in catalog order and deduplicated by id (each module owns one
 * `<id>/index.astro`). Cached after first read — module sources are immutable
 * at runtime, and render output must be deterministic.
 */
export function getModuleCss(): string {
  if (cache !== undefined) return cache
  const seen = new Set<string>()
  const parts: string[] = []
  for (const { meta } of registry.values()) {
    if (seen.has(meta.id)) continue
    seen.add(meta.id)
    const src = readFileSync(path.join(MODULES_DIR, meta.id, 'index.astro'), 'utf8')
    const css = extractStyleBlocks(src)
    if (css) parts.push(`/* module: ${meta.id} */\n${css}`)
  }
  // REQ-70 — the global responsive-typography rules (once per page): media queries that
  // re-point font-size/line-height/letter-spacing at a run's per-breakpoint `--fc-rt-*`
  // vars. Inert for any run that authors only scalar typography.
  parts.push(`/* responsive TextRun typography (REQ-70) */\n${responsiveTextCss()}`)
  cache = parts.join('\n\n')
  return cache
}

let clientJsCache: string | undefined

/**
 * The combined **client behaviour** for every behavior in the catalog (REQ-85).
 *
 * A behavior module ships fixed, vetted, tested client CODE. `tools/generate`
 * renders SSR HTML through Astro's container API, which does not bundle island
 * scripts — so each behavior authors a self-contained `client.js` (plain
 * browser JS, no imports) and this helper folds them into one module, mirroring
 * how {@link getModuleCss} folds each module's `<style>`. The render pipeline
 * writes the result to a `capabilities.js` asset and references it once per page;
 * a behavior without a `client.js` simply contributes nothing. Cached — module
 * sources are immutable at runtime and render output must be deterministic.
 */
export function getModuleClientJs(): string {
  if (clientJsCache !== undefined) return clientJsCache
  const seen = new Set<string>()
  const parts: string[] = []
  for (const { meta } of registry.values()) {
    if (seen.has(meta.id)) continue
    seen.add(meta.id)
    const file = path.join(MODULES_DIR, meta.id, 'client.js')
    if (!existsSync(file)) continue
    const js = readFileSync(file, 'utf8').trim()
    if (js) parts.push(`/* behavior: ${meta.id} */\n${js}`)
  }
  clientJsCache = parts.join('\n\n')
  return clientJsCache
}

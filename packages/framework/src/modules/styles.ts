import { readFileSync } from 'node:fs'
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
 * The modules' selectors are plain (`.hero`, `.header__inner`,
 * `.hero.surface-accent`), matching the plain class attributes the container
 * render emits — so raw extraction lines up with no scope rewriting. The
 * `<style>` blocks are the single source of truth for module CSS; nothing is
 * duplicated here.
 */

const MODULES_DIR = path.dirname(fileURLToPath(import.meta.url))

/** Concatenated text of every `<style>…</style>` block in `astroSource`. */
function extractStyleBlocks(astroSource: string): string {
  const blocks: string[] = []
  const re = /<style[^>]*>([\s\S]*?)<\/style>/g
  let match: RegExpExecArray | null
  while ((match = re.exec(astroSource)) !== null) {
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

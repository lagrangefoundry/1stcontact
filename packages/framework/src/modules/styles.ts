import { MODULE_CSS, MODULE_CLIENT_JS } from './module-assets'
import { responsiveTextCss } from './text-style'

/**
 * Module component CSS, aggregated into one string (BUG-1).
 *
 * The render pipeline draws each module through Astro's container API
 * (`renderToString`), which returns the module's HTML but drops its scoped
 * `<style>` — so the generated per-site `theme.css` carried only the design
 * token `:root` variables and every module rendered unstyled. This helper
 * restores REQ-6's `loadModuleStyles` step: each catalogued module's raw
 * `<style>` content is folded into the generated CSS.
 *
 * The modules' selectors are plain (`.carousel__track`, `.contact-form__field`),
 * matching the plain class attributes the container render emits — so raw
 * extraction lines up with no scope rewriting. The `<style>` blocks are the
 * single source of truth for module CSS; nothing is duplicated here.
 *
 * WHERE THE BYTES COME FROM NOW (REQ-145). They used to be read off disk on
 * first call, which made this module — and therefore every render — node-only.
 * `theme.css` is folded for EVERY site, not only sites that mount a behavior, so
 * a Worker could not render anything rather than merely not render modules. The
 * read moved to build time (`1c assets` → `module-assets.ts`); the extraction is
 * the same code and the composition below is the same composition, so the output
 * is byte-for-byte what the filesystem path produced. A UAT re-extracts from the
 * sources and compares, because a generated file that goes stale silently would
 * serve last week's CSS with nothing to signal it.
 *
 * `responsiveTextCss()` is NOT precompiled: it is pure TypeScript that computes
 * its rules, so it runs anywhere and there is nothing to be stale about.
 */

let cache: string | undefined

/**
 * The combined component CSS for every module in the catalog, followed by the
 * global responsive-typography rules. Cached after first composition — the
 * inputs are immutable at runtime, and render output must be deterministic.
 */
export function getModuleCss(): string {
  if (cache !== undefined) return cache
  const parts: string[] = []
  if (MODULE_CSS) parts.push(MODULE_CSS)
  // REQ-70 — the global responsive-typography rules (once per page): media queries that
  // re-point font-size/line-height/letter-spacing at a run's per-breakpoint `--fc-rt-*`
  // vars. Inert for any run that authors only scalar typography.
  parts.push(`/* responsive TextRun typography (REQ-70) */\n${responsiveTextCss()}`)
  cache = parts.join('\n\n')
  return cache
}

/**
 * The combined **client behaviour** for every behavior in the catalog (REQ-85).
 *
 * A behavior module ships fixed, vetted, tested client CODE. `tools/generate`
 * renders SSR HTML through Astro's container API, which does not bundle island
 * scripts — so each behavior authors a self-contained `client.js` (plain
 * browser JS, no imports) and these are folded into one module, mirroring how
 * {@link getModuleCss} folds each module's `<style>`. The render pipeline writes
 * the result to a `capabilities.js` asset and references it once per page; a
 * behavior without a `client.js` simply contributes nothing.
 */
export function getModuleClientJs(): string {
  return MODULE_CLIENT_JS
}

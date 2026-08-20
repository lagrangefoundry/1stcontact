/**
 * `@1stcontact/framework/worker` — the framework surface reachable from workerd
 * (REQ-143).
 *
 * WHY A SECOND ENTRY POINT EXISTS. The package's main entry re-exports
 * `renderMarkdown`, and with it `@astrojs/markdown-remark` — Shiki, Prism, a
 * `virtual:` specifier and a wasm package no Worker bundle can resolve. One
 * import of the barrel therefore makes the importer node-only, transitively and
 * silently, since nothing about `latestModuleVersion` suggests it drags a
 * markdown pipeline in.
 *
 * That is what had happened to the structured-edit surface. REQ-142 took the
 * filesystem out of `edit.ts` so it could run in a Worker (DOC-12 §7 phase 2),
 * and it still could not: it imported the barrel. This entry is the missing
 * half — the same contracts, validators, L1 predicates and render, with nothing
 * unbundlable in the graph.
 *
 * WHAT MAY BE EXPORTED HERE. Anything whose transitive imports are plain
 * TypeScript. `l1/render.ts` qualifies despite its name: it emits HTML as
 * strings and imports only `@1stcontact/site-schema`. Since REQ-148 the module
 * *registry* qualifies too — its two behavior components are plain functions,
 * not `.astro` files. The workerd suite is what enforces this: it loads this
 * entry, so a regression here is a failing test rather than a discovery at
 * deploy time.
 */

// The theme tokens. Plain data with no imports at all, and the scaffolder's
// starting point — which is why it has to be reachable without the barrel.
export { defaultTokens } from './tokens'
export type { ThemeTokens, DeepPartial } from './tokens'

// The behavior catalog as contracts — no components. See `modules/catalog.ts`.
export { CATALOG, catalog, getModuleMeta, latestModuleVersion } from './modules/catalog'

// The catalog WITH its components (REQ-148). This used to be the one thing this
// entry could not carry: the components were `.astro` files, so `getModule`
// could only be reached where Astro's transform ran, and `render.ts` took it as
// an injected seam that a Worker simply never supplied. They are plain functions
// now, so the resolver is portable and the Worker renders a behavior module
// through exactly the code Node runs.
export { registry, getModule } from './modules/registry'

// The behavior contract and its validators.
export {
  validateBehaviorConfig,
  validateBehaviorSlots,
  validateBehaviorControls,
  validateBehaviorInstance,
  resolveControlNames,
} from './modules/behavior'
export type {
  BehaviorDefinition,
  BehaviorComponent,
  BehaviorProps,
  BehaviorMeta,
  BehaviorConfigSpec,
  BehaviorConfigType,
  BehaviorControlSpec,
  BehaviorSlotSpec,
  BehaviorSlotValue,
  BehaviorInstance,
  BehaviorConformance,
  ConformanceObligation,
  BehaviorValidationError,
} from './modules/behavior'

// L2 — the vetted default presentation for a behavior's slots.
export { presetSlots, hasSlotPreset } from './l2/presets'
export type { SlotPresetBuilder } from './l2/presets'

// The renderer's own predicate, imported by the edit surface rather than
// restated there — see `edit.ts` on why the two must agree.
export { l1PaintsSurface } from './l1/render'

// ── the render's own surface (REQ-145) ───────────────────────────────────────
//
// `render.ts` composes `theme.css` and every page, and it now runs in workerd.
// Each export below reaches only plain TypeScript: `l1/render.ts` emits HTML as
// strings, `tokens` is data, `markdown.ts` holds a CSS constant, and
// `modules/styles.ts` reads the PRECOMPILED module chrome (`module-assets.ts`)
// rather than the `styles.css` sources it used to open at render time.
//
export { generateThemeCss } from './tokens'
export { getModuleCss, getModuleClientJs } from './modules/styles'
export { CALLOUT_CSS } from './modules/callout-css'
export {
  renderL1Document,
  L1_EDIT_MARKER_ATTR,
  L1_EDIT_PAGE_ATTR,
  L1_EDIT_CSS,
} from './l1/render'

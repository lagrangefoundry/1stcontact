/**
 * `@1stcontact/framework/worker` — the framework surface reachable from workerd
 * (REQ-143).
 *
 * WHY A SECOND ENTRY POINT EXISTS. The package's main entry re-exports the
 * module *registry*, which imports two `.astro` components. That is correct for
 * the render path and unusable everywhere else: an `.astro` file cannot be
 * parsed by any build that does not carry Astro's transform, so one import of
 * the barrel makes the importer node-only — transitively, and silently, since
 * nothing about `latestModuleVersion` suggests it drags a component in.
 *
 * That is exactly what had happened to the structured-edit surface. REQ-142 took
 * the filesystem out of `edit.ts` so it could run in a Worker (DOC-12 §7 phase
 * 2), and it still could not: it imported the barrel. This entry is the missing
 * half — the same contracts, validators and L1 predicates, with no render
 * binding anywhere in the graph.
 *
 * WHAT MAY BE EXPORTED HERE. Anything whose transitive imports are plain
 * TypeScript. `l1/render.ts` qualifies despite its name: it emits HTML as
 * strings and imports only `@1stcontact/site-schema`. `behavior.ts` qualifies
 * because its one Astro import is `import type`, erased before any runtime sees
 * it. A `.astro` import — direct or transitive — does not qualify, and the
 * workerd suite is what says so: it loads this entry, so a regression here is a
 * failing test rather than a discovery at deploy time.
 */

// The theme tokens. Plain data with no imports at all, and the scaffolder's
// starting point — which is why it has to be reachable without the barrel.
export { defaultTokens } from './tokens'
export type { ThemeTokens, DeepPartial } from './tokens'

// The behavior catalog as contracts — no components. See `modules/catalog.ts`.
export { CATALOG, catalog, getModuleMeta, latestModuleVersion } from './modules/catalog'

// The behavior contract and its validators.
export {
  validateBehaviorConfig,
  validateBehaviorSlots,
  validateBehaviorControls,
  validateBehaviorInstance,
  resolveControlNames,
} from './modules/behavior'
export type {
  // The component-bound form. The TYPE is safe here — a resolver's signature
  // names it — while the registry that produces one is not (see below).
  BehaviorDefinition,
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
// rather than the `.astro` sources it used to open at render time.
//
// `getModule` is deliberately NOT here. It resolves a behavior's Astro
// component, so it cannot be reached without the transform; `render.ts` imports
// it dynamically, behind the same test that decides whether a container is
// needed at all. That is REQ-148's boundary, and this is the line it sits on.
export { generateThemeCss } from './tokens'
export { getModuleCss, getModuleClientJs } from './modules/styles'
export { CALLOUT_CSS } from './modules/callout-css'
export {
  renderL1Document,
  L1_EDIT_MARKER_ATTR,
  L1_EDIT_PAGE_ATTR,
  L1_EDIT_CSS,
} from './l1/render'

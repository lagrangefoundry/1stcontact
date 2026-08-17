import type { BehaviorDefinition } from './behavior'
import { CATALOG, catalog, getModuleMeta, latestModuleVersion } from './catalog'
import ContactForm from './contact-form/index.astro'
import Carousel from './carousel/index.astro'

/**
 * The behavior-module catalog **bound to its components** (REQ-85).
 *
 * Since the framework pivot layout is owned by the L1 substrate (see
 * `l1/render.ts`); the catalog holds only **behavior modules** — vetted
 * behavioural cores (a scroll-snap carousel, a lead-capture form) that mount L1
 * presentation into their named slots. `tools/generate` discovers modules
 * through this registry; a site definition pins each instance to an `id` +
 * `version` and the generator resolves the component via {@link getModule}.
 *
 * ⚠️ THIS MODULE IS NODE/ASTRO-ONLY (REQ-143). The two `.astro` imports below
 * need Astro's transform, so importing this file pulls that requirement into the
 * graph. Code that must run in a Worker — the structured-edit surface, and
 * anything reaching it — imports {@link ./catalog} instead, which is the same
 * contracts without the render binding. The component map is derived from
 * {@link CATALOG} rather than restated, so the two cannot drift.
 */
const COMPONENTS: Record<string, BehaviorDefinition['Component']> = {
  'contact-form': ContactForm,
  carousel: Carousel,
}

const MODULES: BehaviorDefinition[] = CATALOG.map((meta) => {
  const Component = COMPONENTS[meta.id]
  if (!Component) {
    // A contract in the catalog with no component is a framework bug, not a
    // configuration one: it would surface as an unrenderable site rather than as
    // a catalog miss, so it fails here where the cause is legible.
    throw new Error(`Behavior '${meta.id}' is in the catalog with no component bound to it.`)
  }
  return { meta, Component }
})

/** Catalog keyed by `"<id>@<version>"`. */
export const registry: ReadonlyMap<string, BehaviorDefinition> = new Map(
  MODULES.map((m) => [`${m.meta.id}@${m.meta.version}`, m]),
)

export { catalog, getModuleMeta, latestModuleVersion }

/**
 * Resolve a module by id + version, or throw a clear catalog-miss error naming
 * what was requested and what the catalog contains.
 */
export function getModule(id: string, version: number): BehaviorDefinition {
  const def = registry.get(`${id}@${version}`)
  if (!def) {
    const known = [...registry.keys()].join(', ')
    throw new Error(`Module not found in catalog: '${id}' v${version}. Known modules: ${known}.`)
  }
  return def
}

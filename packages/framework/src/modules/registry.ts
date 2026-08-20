import type { BehaviorDefinition } from './behavior'
import { CATALOG, catalog, getModuleMeta, latestModuleVersion } from './catalog'
import { contactForm } from './contact-form/component'
import { carousel } from './carousel/component'

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
 * THIS MODULE RUNS ANYWHERE (REQ-148). It used to be node-only: the two
 * components were `.astro` files, so importing this file pulled Astro's
 * transform into the graph and confined every importer to Node. They are plain
 * TypeScript functions now, so the registry is reachable from workerd and a
 * behavior renders there through exactly the code Node runs. {@link ./catalog}
 * remains the contracts-only entry for callers that want no component binding at
 * all; the component map below is derived from {@link CATALOG} rather than
 * restated, so the two cannot drift.
 */
const COMPONENTS: Record<string, BehaviorDefinition['Component']> = {
  'contact-form': contactForm,
  carousel,
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

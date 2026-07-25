import type { BehaviorDefinition } from './behavior'
import ContactForm from './contact-form/index.astro'
import { contactFormMeta } from './contact-form/meta'
import Carousel from './carousel/index.astro'
import { carouselMeta } from './carousel/meta'

/**
 * The behavior-module catalog (REQ-85). Since the framework pivot layout is
 * owned by the L1 substrate (see `l1/render.ts`); the catalog holds only
 * **behavior modules** — vetted behavioural cores (a scroll-snap carousel, a
 * lead-capture form) that mount L1 presentation into their named slots.
 * `tools/generate` discovers modules through this registry; a site definition
 * pins each instance to an `id` + `version` and the generator resolves the
 * component via {@link getModule}.
 */
const MODULES: BehaviorDefinition[] = [
  { meta: contactFormMeta, Component: ContactForm },
  { meta: carouselMeta, Component: Carousel },
]

/** Catalog keyed by `"<id>@<version>"`. */
export const registry: ReadonlyMap<string, BehaviorDefinition> = new Map(
  MODULES.map((m) => [`${m.meta.id}@${m.meta.version}`, m]),
)

/**
 * REQ-93 — the catalog's current version of a behavior, for a caller that is
 * *creating* an instance rather than resolving a pinned one (the reproduction
 * importer, which has a captured behaviour and no version to pin yet). Existing
 * instances still pin their own version; this is only the pin's origin.
 */
export function latestModuleVersion(id: string): number {
  const versions = MODULES.filter((m) => m.meta.id === id).map((m) => m.meta.version)
  if (versions.length === 0) {
    throw new Error(
      `Module not found in catalog: '${id}'. Known modules: ${[...registry.keys()].join(', ')}.`,
    )
  }
  return Math.max(...versions)
}

/**
 * Resolve a module by id + version, or throw a clear catalog-miss error naming
 * what was requested and what the catalog contains.
 */
export function getModule(id: string, version: number): BehaviorDefinition {
  const def = registry.get(`${id}@${version}`)
  if (!def) {
    const known = [...registry.keys()].join(', ')
    throw new Error(
      `Module not found in catalog: '${id}' v${version}. Known modules: ${known}.`,
    )
  }
  return def
}

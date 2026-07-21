import type { CapabilityDefinition } from './capability'
import ContactForm from './contact-form/index.astro'
import { contactFormMeta } from './contact-form/meta'
import Carousel from './carousel/index.astro'
import { carouselMeta } from './carousel/meta'

/**
 * The capability-module catalog (REQ-85). Since the framework pivot layout is
 * owned by the L1 substrate (see `l1/render.ts`); the catalog holds only
 * **capability modules** — vetted behavioural cores (a scroll-snap carousel, a
 * lead-capture form) that mount L1 presentation into their named slots.
 * `tools/generate` discovers modules through this registry; a site definition
 * pins each instance to an `id` + `version` and the generator resolves the
 * component via {@link getModule}.
 */
const MODULES: CapabilityDefinition[] = [
  { meta: contactFormMeta, Component: ContactForm },
  { meta: carouselMeta, Component: Carousel },
]

/** Catalog keyed by `"<id>@<version>"`. */
export const registry: ReadonlyMap<string, CapabilityDefinition> = new Map(
  MODULES.map((m) => [`${m.meta.id}@${m.meta.version}`, m]),
)

/**
 * Resolve a module by id + version, or throw a clear catalog-miss error naming
 * what was requested and what the catalog contains.
 */
export function getModule(id: string, version: number): CapabilityDefinition {
  const def = registry.get(`${id}@${version}`)
  if (!def) {
    const known = [...registry.keys()].join(', ')
    throw new Error(
      `Module not found in catalog: '${id}' v${version}. Known modules: ${known}.`,
    )
  }
  return def
}

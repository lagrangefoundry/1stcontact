import type { ModuleDefinition } from './types'
import ContactForm from './contact-form/index.astro'
import { contactFormMeta } from './contact-form/meta'
import Carousel from './carousel/index.astro'
import { carouselMeta } from './carousel/meta'

/**
 * The module catalog. Since the framework pivot (REQ-79/REQ-84) layout is owned
 * by the L1 substrate (see `l1/render.ts`); the catalog holds only **capability
 * modules** — vetted behavioural cores (a scroll-snap carousel, a lead-capture
 * form) that mount into an L1 tree. `tools/generate` discovers modules through
 * this registry; a site definition pins each instance to an `id` + `version`
 * (DOC-7 §8) and the generator resolves the component via {@link getModule}.
 */
const MODULES: ModuleDefinition[] = [
  { meta: contactFormMeta, Component: ContactForm },
  { meta: carouselMeta, Component: Carousel },
]

/** Catalog keyed by `"<id>@<version>"`. */
export const registry: ReadonlyMap<string, ModuleDefinition> = new Map(
  MODULES.map((m) => [`${m.meta.id}@${m.meta.version}`, m]),
)

/**
 * Resolve a module by id + version, or throw a clear catalog-miss error naming
 * what was requested and what the catalog contains.
 */
export function getModule(id: string, version: number): ModuleDefinition {
  const def = registry.get(`${id}@${version}`)
  if (!def) {
    const known = [...registry.keys()].join(', ')
    throw new Error(
      `Module not found in catalog: '${id}' v${version}. Known modules: ${known}.`,
    )
  }
  return def
}

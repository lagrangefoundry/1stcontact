import type { ModuleDefinition } from './types'
import Header from './header/index.astro'
import { headerMeta } from './header/meta'
import Hero from './hero/index.astro'
import { heroMeta } from './hero/meta'
import Footer from './footer/index.astro'
import { footerMeta } from './footer/meta'
import TextBlock from './text-block/index.astro'
import { textBlockMeta } from './text-block/meta'
import ServicesGrid from './services-grid/index.astro'
import { servicesGridMeta } from './services-grid/meta'
import ContactForm from './contact-form/index.astro'
import { contactFormMeta } from './contact-form/meta'
import LayerHost from './layer/index.astro'
import { layerMeta } from './layer/meta'

/**
 * The module catalog. `tools/generate` (REQ-6) discovers modules through this
 * registry; a site definition pins each module instance to an `id` + `version`
 * (DOC-7 §8) and the generator resolves the component via {@link getModule}.
 */
const MODULES: ModuleDefinition[] = [
  { meta: headerMeta, Component: Header },
  { meta: heroMeta, Component: Hero },
  { meta: footerMeta, Component: Footer },
  { meta: textBlockMeta, Component: TextBlock },
  { meta: servicesGridMeta, Component: ServicesGrid },
  { meta: contactFormMeta, Component: ContactForm },
  { meta: layerMeta, Component: LayerHost },
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

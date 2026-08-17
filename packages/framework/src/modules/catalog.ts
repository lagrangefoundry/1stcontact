import type { BehaviorMeta } from './behavior'
import { contactFormMeta } from './contact-form/meta'
import { carouselMeta } from './carousel/meta'

/**
 * The behavior catalog as **metadata only** (REQ-143).
 *
 * WHY THIS IS SEPARATE FROM `registry.ts`. A behavior module is two things that
 * belong to two different runtimes: a *contract* ({@link BehaviorMeta} — its
 * config fields, its slots, its conformance obligations) and a *component* (the
 * `.astro` file that renders it). The contract is plain data; the component is
 * an Astro artifact that only a build carrying Astro's transform can even parse.
 *
 * `registry.ts` binds the two together, which is right for the render path and
 * fatal everywhere else: a single `import ContactForm from './index.astro'`
 * makes the whole catalog unreachable from any runtime without the transform —
 * which is to say, from a Worker. The structured-edit surface (`edit.ts`) needs
 * *only* the contract: it asks which behaviors exist, what their config fields
 * are, and whether an instance validates. It never renders one. Before this
 * split it nonetheless dragged two Astro components into its import graph, so
 * `edit.ts` could not be loaded in workerd at all — and DOC-12 §7 phase 2 is
 * precisely the plan to run it there.
 *
 * So: the catalog is the data, and the registry is the data plus the render
 * binding. Nothing is duplicated — `registry.ts` reads {@link CATALOG} rather
 * than restating the list, so a behavior added here is in both by construction.
 */

/** Every behavior contract the framework ships, in catalog order. */
export const CATALOG: readonly BehaviorMeta[] = [contactFormMeta, carouselMeta]

/** Contracts keyed by `"<id>@<version>"` — the registry's key, without components. */
export const catalog: ReadonlyMap<string, BehaviorMeta> = new Map(
  CATALOG.map((meta) => [`${meta.id}@${meta.version}`, meta]),
)

/**
 * The catalog's current version of a behavior, for a caller *creating* an
 * instance rather than resolving a pinned one. Existing instances still pin
 * their own version; this is only the pin's origin.
 */
export function latestModuleVersion(id: string): number {
  const versions = CATALOG.filter((m) => m.id === id).map((m) => m.version)
  if (versions.length === 0) {
    throw new Error(
      `Module not found in catalog: '${id}'. Known modules: ${[...catalog.keys()].join(', ')}.`,
    )
  }
  return Math.max(...versions)
}

/** One behavior's contract by id + version, or a catalog-miss naming both sides. */
export function getModuleMeta(id: string, version: number): BehaviorMeta {
  const meta = catalog.get(`${id}@${version}`)
  if (!meta) {
    const known = [...catalog.keys()].join(', ')
    throw new Error(`Module not found in catalog: '${id}' v${version}. Known modules: ${known}.`)
  }
  return meta
}

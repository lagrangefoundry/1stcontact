/**
 * [[REQ-312]] — `fonts/catalogue.json`, as the mirror and the check read it.
 *
 * The catalogue is [[DOC-56]]'s declared source, so it is also the authority on
 * what the mirror OWES: a family the document tells the assistant it may serve
 * and the mirror does not hold is the exact failure this ticket exists to
 * prevent, and the two are checked against each other because of it.
 *
 * Only the fields the mirror needs are typed. The catalogue carries a great deal
 * more — designers, popularity, subsets, classifications — and typing all of it
 * here would make this file a second, drifting copy of [[REQ-311]]'s output
 * schema.
 */

import { readFileSync } from 'node:fs'
import path from 'node:path'
import type { PlatformLicence } from '@1stcontact/site-schema'
import { pathExists } from '../store/fsutil'

/** Where the catalogue lives, relative to the repo root. */
export const CATALOGUE_REL = path.join('fonts', 'catalogue.json')

/** One family, in the fields the mirror and the assistant index read. */
export interface CatalogueFamily {
  family: string
  slug: string
  /** `OFL-1.1` / `Apache-2.0` / `UFL-1.0` — as read from the family's own METADATA.pb. */
  licence: string
  /** `ofl/roboto/METADATA.pb` — the file the licence above was read from. */
  licence_source: string
  variable: boolean
  /**
   * The axes a variable family carries, with the range each covers ([[REQ-313]]).
   *
   * `min`/`max` are read here and not only by the assistant index because the
   * range is the whole difference between "this family ships 400 and 700" and
   * "any weight between 100 and 900 is real" — which is what decides whether a
   * `use_font` call for weight 550 resolves to a file or is answered with the
   * weights that exist.
   */
  axes?: { tag: string; min?: number; max?: number }[]
  /** [[REQ-313]] — the catalogue's classification, e.g. `Sans Serif`. */
  category?: string
  /**
   * [[REQ-314]] — the catalogue's SECOND classification axis, e.g. `Slab Serif`.
   *
   * `category` and `stroke` are independent and both are the catalogue's own:
   * every family the catalogue calls `stroke: Slab Serif` it also calls
   * `category: Serif`. Read here because the editor's font control offers a slab
   * chip, and the alternative to reading it is guessing from the family name.
   */
  stroke?: string
  /** [[REQ-313]] — the static weights the family names. */
  weights?: number[]
  /** [[REQ-313]] — whether a true italic ships, as against a synthesised slant. */
  italic?: boolean
}

export interface Catalogue {
  retrieved: string
  family_count: number
  families: CatalogueFamily[]
}

/**
 * The licences the platform tier mirrors, and the only ones.
 *
 * UFL 1.0's five families are excluded pending individual clearing — their
 * modification terms differ from OFL — and everything not in the catalogue at all
 * (Fontshare, Adobe, icon fonts) never reaches this decision. Excluding by
 * ALLOWLIST rather than by denying UFL is deliberate: a licence that appears
 * upstream tomorrow is excluded by default rather than mirrored by omission.
 */
const MIRRORED_LICENCES: Record<string, PlatformLicence> = {
  'OFL-1.1': 'OFL-1.1',
  'Apache-2.0': 'Apache-2.0',
}

/** The platform licence a family carries, or `null` when it is not mirrored. */
export function mirroredLicence(family: CatalogueFamily): PlatformLicence | null {
  return MIRRORED_LICENCES[family.licence] ?? null
}

/** Every catalogue family the mirror is meant to hold, in catalogue order. */
export function redistributableFamilies(catalogue: Catalogue): CatalogueFamily[] {
  return catalogue.families.filter((f) => mirroredLicence(f) !== null)
}

/** `ofl/roboto/METADATA.pb` → `ofl/roboto`. The catalogue names the directory; nothing infers it. */
export function upstreamDir(family: CatalogueFamily): string {
  return family.licence_source.replace(/\/METADATA\.pb$/, '')
}

export function cataloguePath(cwd: string): string {
  return path.join(cwd, CATALOGUE_REL)
}

/** Whether this checkout carries a catalogue at all. */
export function catalogueExists(cwd: string): boolean {
  return pathExists(cataloguePath(cwd))
}

/** Read and shape-check `fonts/catalogue.json`. Throws with the path on failure. */
export function loadCatalogue(cwd: string): Catalogue {
  const file = cataloguePath(cwd)
  const parsed = JSON.parse(readFileSync(file, 'utf8')) as Catalogue
  if (!Array.isArray(parsed?.families)) {
    throw new Error(`${CATALOGUE_REL} carries no families array.`)
  }
  return parsed
}

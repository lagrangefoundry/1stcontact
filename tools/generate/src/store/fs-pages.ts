import { readdirSync } from 'node:fs'
import path from 'node:path'
import { ensureDir, listFilesRel, pathExists, readJson, removePath, writeJson } from './fsutil'
import {
  assemblePage,
  isFrame,
  planPageWrite,
  type PageForm,
  type PagePlan,
  type PageRecord,
  type SectionUnit,
} from './sections'
import type { StoredPage } from './site-store'

/**
 * [[REQ-396]] — how a `pages/` directory holds a page stored as sections: the
 * frame at `pages/home.json`, beside it a `pages/home.sections/` directory with
 * one `<id>.json` per section unit. An undecomposed page is `pages/home.json`
 * alone, exactly as before.
 *
 * ONE READER FOR EVERY `pages/` DIRECTORY. The draft, a revision directory,
 * `loadSite` and the colour retrofit all list pages from disk, and each of them
 * would otherwise mistake a section unit for a page. Revision directories only
 * ever hold whole pages, so reading them through this costs nothing.
 */

const sectionsDirOf = (dir: string, name: string): string =>
  path.join(dir, `${name.replace(/\.json$/, '')}.sections`)

/** What the directory holds for one page, or null when it holds nothing. */
export function readPageRecord(dir: string, name: string): PageRecord | null {
  const file = path.join(dir, name)
  if (!pathExists(file)) return null
  const stored = readJson<Record<string, unknown>>(file)
  const sections = new Map<string, SectionUnit>()
  if (isFrame(stored)) {
    for (const id of stored.sections as string[]) {
      const unit = path.join(sectionsDirOf(dir, name), `${id}.json`)
      if (pathExists(unit)) sections.set(id, readJson<SectionUnit>(unit))
    }
  }
  return { stored, sections }
}

/** Every page in the directory, assembled, in load order. */
export function readPagesDir(dir: string): StoredPage[] {
  return listFilesRel(dir)
    .filter((rel) => rel.endsWith('.json') && !rel.includes('/'))
    .map((name) => {
      const record = readPageRecord(dir, name) as PageRecord
      return {
        name,
        page: assemblePage(record),
        ...(isFrame(record.stored) ? { sections: [...(record.stored.sections as string[])] } : {}),
      }
    })
}

/** Apply one page's plan to the directory. */
export function applyPagePlan(dir: string, name: string, plan: PagePlan): void {
  if (plan.page !== null) writeJson(path.join(dir, name), plan.page)
  const units = sectionsDirOf(dir, name)
  if (plan.put.length > 0) ensureDir(units)
  for (const [id, unit] of plan.put) writeJson(path.join(units, `${id}.json`), unit)
  for (const id of plan.drop) removePath(path.join(units, `${id}.json`))
  // A page with no sections left has no sections directory.
  if (pathExists(units) && readdirSync(units).length === 0) removePath(units)
}

/** Write one whole page, keeping (or setting) its form. */
export function writePageFile(dir: string, name: string, page: Record<string, unknown>, form?: PageForm): void {
  applyPagePlan(dir, name, planPageWrite(readPageRecord(dir, name), page, form))
}

/** Remove one page and its sections. */
export function removePageFile(dir: string, name: string): void {
  removePath(path.join(dir, name))
  removePath(sectionsDirOf(dir, name))
}

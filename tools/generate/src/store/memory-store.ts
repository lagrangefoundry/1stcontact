import { assembleSite } from './assemble'
import type { ChangeSlice, JournalFile, JournalRecord } from './journal-model'
import { emptyJournal, nextJournal, sliceSince } from './journal-model'
import type {
  DraftSnapshot,
  PendingChanges,
  SiteStore,
  SiteWrite,
  StoredPage,
} from './site-store'

/**
 * {@link SiteStore} with nothing behind it (REQ-142).
 *
 * WHAT IT IS FOR. AC-4: a UAT drives the whole structured-edit surface through
 * this adapter, and if any command still reached for a file it would fail here
 * rather than quietly succeed against the operator's disk. "No caller depends on
 * the filesystem" stops being a claim about a diff and becomes a property a test
 * can assert — which is the only reason to believe it will still be true after
 * the next change.
 *
 * IT IS NOT A MOCK. Nothing here is stubbed to make an assertion pass: it holds
 * real definitions, applies real writes, keeps a real journal through the same
 * {@link ./journal-model} arithmetic the filesystem adapter uses, and validates
 * through the same {@link assembleSite}. A test that passes against it passes
 * because the surface works, not because the double was told to agree.
 *
 * WHAT IT DELIBERATELY IS NOT. Not a revision store. `pendingChanges` reports
 * every file as `added` against no base revision, which is exactly what
 * `diffSnapshots(null, draft)` reports for a site that has never published —
 * publish and checkout are `commands.ts`'s and stay on the filesystem
 * (DOC-12 §4). Nor is it the D1/R2 adapter or a sketch of one; that is REQ-143,
 * and it answers to a real database rather than to a Map.
 *
 * ATOMICITY. {@link SiteWrite} lands in one synchronous mutation here, so this
 * adapter *is* atomic — not as a promise the port makes (the filesystem one is
 * not), but because there is no way for it not to be.
 */

interface MemorySite {
  siteJson: Record<string, unknown> | null
  /** Page definitions by store name (`home.json`). Load order is name order. */
  pages: Map<string, Record<string, unknown>>
  assets: Map<string, Uint8Array>
  journal: JournalFile
  /** Bumped on every write; the whole of `DraftSnapshot.stamp`. */
  revision: number
}

/** The definition a site is seeded with. Pages are keyed by store name. */
export interface MemorySiteSeed {
  siteJson: Record<string, unknown>
  pages: Record<string, Record<string, unknown>>
  assets?: Record<string, Uint8Array>
}

export interface MemorySiteStore extends SiteStore {
  /** Create (or replace) a site's draft outright, as `1c new` would. */
  seed(slug: string, seed: MemorySiteSeed): void
  /** Drop a site entirely, so `hasDraft` goes back to false. */
  forget(slug: string): void
  /** The slugs this store holds a draft for, sorted. */
  slugs(): string[]
}

/** A deep copy, so a caller mutating what it read cannot reach into the store. */
function copy<T>(value: T): T {
  return structuredClone(value)
}

export function memorySiteStore(): MemorySiteStore {
  const sites = new Map<string, MemorySite>()

  const site = (slug: string): MemorySite | undefined => sites.get(slug)

  /** The site, or the one that has to exist for a write to mean anything. */
  const require = (slug: string): MemorySite => {
    const found = sites.get(slug)
    if (!found) throw new Error(`No site '${slug}' in this store.`)
    return found
  }

  const pageNames = (found: MemorySite): string[] => [...found.pages.keys()].sort()

  return {
    seed(slug, seed) {
      sites.set(slug, {
        siteJson: copy(seed.siteJson),
        pages: new Map(Object.entries(copy(seed.pages))),
        assets: new Map(Object.entries(seed.assets ?? {}).map(([n, b]) => [n, b.slice()])),
        journal: emptyJournal(),
        revision: 0,
      })
    },

    forget(slug) {
      sites.delete(slug)
    },

    slugs() {
      return [...sites.keys()].sort()
    },

    hasDraft(slug) {
      return Promise.resolve(sites.has(slug))
    },

    readSiteJson(slug) {
      const found = site(slug)
      return Promise.resolve(found?.siteJson ? copy(found.siteJson) : null)
    },

    readPages(slug) {
      const found = site(slug)
      if (!found) return Promise.resolve([])
      const pages: StoredPage[] = pageNames(found).map((name) => ({
        name,
        page: copy(found.pages.get(name)!),
      }))
      return Promise.resolve(pages)
    },

    write(slug, change: SiteWrite) {
      const found = require(slug)
      if (change.siteJson !== undefined) found.siteJson = copy(change.siteJson)
      for (const { name, page } of change.pages ?? []) found.pages.set(name, copy(page))
      for (const name of change.removePages ?? []) found.pages.delete(name)
      for (const { name, bytes } of change.assets ?? []) found.assets.set(name, bytes.slice())
      for (const name of change.removeAssets ?? []) found.assets.delete(name)
      found.revision += 1
      return Promise.resolve()
    },

    listAssets(slug) {
      const found = site(slug)
      return Promise.resolve(found ? [...found.assets.keys()].sort() : [])
    },

    readAsset(slug, name) {
      const bytes = site(slug)?.assets.get(name)
      return Promise.resolve(bytes ? bytes.slice() : null)
    },

    counter(slug) {
      return Promise.resolve(site(slug)?.journal.counter ?? 0)
    },

    appendChange(slug, entry: Omit<JournalRecord, 'at' | 'ts'> & { ts?: string }) {
      const found = site(slug)
      // Journalling never fails a write (see `journal.ts`): a site this store
      // does not hold reports the counter unmoved rather than throwing.
      if (!found) return Promise.resolve(0)
      found.journal = nextJournal(found.journal, entry)
      return Promise.resolve(found.journal.counter)
    },

    changesSince(slug, since) {
      const journal = site(slug)?.journal ?? emptyJournal()
      return Promise.resolve<ChangeSlice>(sliceSince(journal, since))
    },

    pendingChanges(slug): Promise<PendingChanges> {
      const found = site(slug)
      if (!found) {
        return Promise.resolve({ baseRevision: null, added: [], modified: [], removed: [] })
      }
      // Everything is `added` against no base, which is what `diffSnapshots`
      // reports for a draft that has never been published — the only state a
      // store with no revisions can be in.
      const added = [
        ...(found.siteJson ? ['site.json'] : []),
        ...pageNames(found).map((name) => `pages/${name}`),
        ...[...found.assets.keys()].sort().map((name) => `assets/${name}`),
      ].sort()
      return Promise.resolve({ baseRevision: null, added, modified: [], removed: [] })
    },

    version(slug) {
      const found = site(slug)
      return Promise.resolve(found ? found.revision : null)
    },

    loadDraft(slug): Promise<DraftSnapshot | null> {
      const found = site(slug)
      if (!found) return Promise.resolve(null)
      const result = assembleSite({
        slug,
        // Descriptive only — no request-time path reads it (see `LoadedSite`).
        sourceDir: `memory:${slug}/draft`,
        base: found.siteJson ?? {},
        pages: pageNames(found).map((name) => copy(found.pages.get(name)!)),
        assetFiles: [...found.assets.keys()].sort(),
      })
      return Promise.resolve({ result, stamp: `memory:${found.revision}` })
    },
  }
}

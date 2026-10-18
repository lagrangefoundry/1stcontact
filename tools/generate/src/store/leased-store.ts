import { canonicalJson } from './revision-model'
import { planPageWrite, sectionFileName, splitPage, styleFileName, type PageRecord } from './sections'
import { StoreConflictError, type SiteStore, type SiteWrite, type StoredPage } from './site-store'
import {
  assetFileName,
  currentWrite,
  DEFAULT_LEASE_IDLE_MS,
  DraftFileRefusal,
  IMPLICIT_LEASE_MS,
  SITE_FILE,
  SYSTEM_HOLDER,
  type DraftLeases,
  type Lease,
  type Writer,
} from './leases'

/**
 * [[REQ-397]] — every draft write, checked against who holds what, and against
 * what the writing call read.
 *
 * A DECORATOR AND NOT A CHANGE TO EACH ADAPTER, on `cappedSiteStore`'s
 * precedent: every draft write in this repository — the L1 tools, the builder
 * routes, `1c` — already goes through `SiteStore.write`, so wrapping that one
 * verb is what makes "every write path checks the lease" structurally true
 * rather than a call each path has to remember.
 *
 * WHO IS WRITING comes from the call's {@link Writer} context (`asWriter`),
 * because one store serves every session on a site at once. A write with no
 * context is an unattributed implicit writer.
 *
 * THE COMPARE-AND-SET IS PER FILE. The store's own `expect` is site-wide, and
 * two builders writing two different files would refuse each other on it. So
 * this remembers, per call, each file's content as the call read it; at write
 * time it re-reads only the files the write touches, refuses with
 * `FILE_CHANGED` if any of those changed underneath the call, and then writes
 * with `expect` set to the version it just checked — so a write landing between
 * that check and this write fails the store's CAS and the check is redone.
 */

/** Where a leased store keeps its leases, for the host that claims files on it. */
const LEASES = Symbol.for('1stcontact.draftLeases')

/** How many times a write is re-checked after losing the store's CAS to an unrelated write. */
const CAS_ATTEMPTS = 4

/** The leases behind a store, or null when the store is not leased. */
export function leasesOf(store: SiteStore): DraftLeases | null {
  return ((store as unknown as Record<symbol, DraftLeases | undefined>)[LEASES]) ?? null
}

/**
 * [[REQ-406]] — a stored page value (a whole page or a frame) as its BODY and
 * its STYLE. The style is the L1 document's keys other than `root`; the body is
 * everything else. They are two files, `home.json` and `home.json#style`, so
 * naming a page does not hand a builder the right to repaint it.
 */
function styleSplit(value: Record<string, unknown>): { body: Record<string, unknown>; style: Record<string, unknown> } {
  const l1 = value.l1
  if (l1 === null || typeof l1 !== 'object') return { body: value, style: {} }
  const { root, ...style } = l1 as Record<string, unknown>
  return { body: { ...value, l1: root === undefined ? {} : { root } }, style }
}

/** One stored value under a page's name, as its body and style files. */
function pageUnits(name: string, value: Record<string, unknown>): Array<[string, unknown]> {
  const { body, style } = styleSplit(value)
  return [
    [name, body],
    [styleFileName(name), style],
  ]
}

/** A stored page as the units a lock is taken on: file name → canonical content. */
function unitsOf(stored: StoredPage): Array<[string, unknown]> {
  if (!stored.sections) return pageUnits(stored.name, stored.page)
  try {
    const { frame, sections } = splitPage(stored.page)
    return [
      ...pageUnits(stored.name, frame),
      ...sections.map(([id, unit]): [string, unknown] => [sectionFileName(stored.name, id), unit]),
    ]
  } catch {
    // Never reachable through the tools, which refuse a write that breaks a
    // section condition; if it happens anyway, the page counts as one file
    // rather than making every read of the site throw.
    return pageUnits(stored.name, stored.page)
  }
}

/** The style keys whose value differs between two styles, in order. */
function changedKeys(before: Record<string, unknown>, after: Record<string, unknown>): string[] {
  return [...new Set([...Object.keys(before), ...Object.keys(after)])]
    .filter((key) => canonicalJson(before[key] ?? null) !== canonicalJson(after[key] ?? null))
    .sort()
}

/** What the store holds for one page, in the planner's terms. */
function recordOf(stored: StoredPage | undefined): PageRecord | null {
  if (!stored) return null
  if (!stored.sections) return { stored: stored.page, sections: new Map() }
  try {
    const { frame, sections } = splitPage(stored.page)
    return { stored: frame, sections: new Map(sections) }
  } catch {
    return { stored: stored.page, sections: new Map() }
  }
}

/** The draft as it stands, as file name → canonical content. */
interface Current {
  version: number | null
  files: Map<string, string>
}

/** What a write would touch: the files, and for each page style file, which keys it changes. */
interface Touched {
  files: string[]
  styleKeys: Map<string, string[]>
}

/**
 * The files `change` would touch, judged against what the store holds now.
 * A file whose content would not change is not touched.
 */
function touched(change: SiteWrite, pages: Map<string, StoredPage>, current: Current, assets: Set<string>): Touched {
  const files = new Set<string>()
  const styleKeys = new Map<string, string[]>()
  if (change.siteJson !== undefined && current.files.get(SITE_FILE) !== canonicalJson(change.siteJson)) {
    files.add(SITE_FILE)
  }
  for (const { name, page, form } of change.pages ?? []) {
    const record = recordOf(pages.get(name))
    let plan
    try {
      plan = planPageWrite(record, page, form)
    } catch {
      // The store will refuse this write with its own sentence; the page is the file.
      files.add(name)
      continue
    }
    if (plan.page !== null) {
      const { body, style } = styleSplit(plan.page)
      if (current.files.get(name) !== canonicalJson(body)) files.add(name)
      const styleFile = styleFileName(name)
      if (current.files.get(styleFile) !== canonicalJson(style)) {
        files.add(styleFile)
        const was = pages.get(name)
        styleKeys.set(styleFile, changedKeys(was ? styleSplit(was.page).style : {}, style))
      }
    }
    for (const [id] of plan.put) files.add(sectionFileName(name, id))
    for (const id of plan.drop) files.add(sectionFileName(name, id))
  }
  for (const { page, id, unit } of change.sections ?? []) {
    const file = sectionFileName(page, id)
    if (current.files.get(file) !== canonicalJson(unit)) files.add(file)
  }
  for (const name of change.removePages ?? []) {
    for (const file of current.files.keys()) {
      if (file === name || file.startsWith(`${name}#`)) files.add(file)
    }
  }
  for (const { name } of [...(change.assets ?? []), ...(change.assetRefs ?? [])]) files.add(assetFileName(name))
  for (const name of change.removeAssets ?? []) {
    if (assets.has(name)) files.add(assetFileName(name))
  }
  return { files: [...files].sort(), styleKeys }
}

/**
 * [[REQ-406]] — a builder changing a page's style without having been given it.
 * The commonest way to get here is repainting the whole page to colour one part
 * of it, so the sentence says what to do instead.
 */
function styleRefusal(file: string, keys: string[], writer: Writer): DraftFileRefusal {
  const page = file.slice(0, file.lastIndexOf('#'))
  const what = keys.length ? keys.map((k) => `\`${k}\``).join(', ') : 'its style'
  return new DraftFileRefusal(
    'NOT_IN_SCOPE',
    file,
    `This changes the page style of \`${page}\` (${what}), and \`${file}\` is not in this session's scope ` +
      `(${writer.scope?.join(', ') || 'none declared'}); nothing was written. To colour one section, fill that ` +
      `section's own box. Ask for \`${file}\` only when the brief changes the page itself.`,
    writer.holder,
  )
}

/** Wrap `store` so every draft write is leased and compare-and-set per file. Idempotent. */
export function leasedStore<S extends SiteStore>(store: S, leases: DraftLeases): S {
  if (leasesOf(store)) return store

  /** Remember what the current call read, the first time it reads each file. */
  const remember = (site: string, units: Iterable<[string, unknown]>): void => {
    const ctx = currentWrite()
    if (!ctx) return
    const read = ctx.read.get(site) ?? new Map<string, string>()
    ctx.read.set(site, read)
    for (const [file, value] of units) if (!read.has(file)) read.set(file, canonicalJson(value))
  }

  /** The draft as it is now, read in the store's own order: version first. */
  const now = async (site: string, change: SiteWrite) => {
    const version = await store.version(site)
    const files = new Map<string, string>()
    const pages = new Map<string, StoredPage>()
    if (change.siteJson !== undefined) {
      const siteJson = await store.readSiteJson(site)
      if (siteJson !== null) files.set(SITE_FILE, canonicalJson(siteJson))
    }
    if (change.pages?.length || change.sections?.length || change.removePages?.length) {
      for (const page of await store.readPages(site)) {
        pages.set(page.name, page)
        for (const [file, value] of unitsOf(page)) files.set(file, canonicalJson(value))
      }
    }
    const touchesAssets = Boolean(change.assets?.length || change.assetRefs?.length || change.removeAssets?.length)
    const assets = new Set(touchesAssets ? await store.listAssets(site) : [])
    for (const name of assets) files.set(assetFileName(name), '')
    return { current: { version, files }, pages, assets }
  }

  /** Take the leases this write needs; returns what to release afterwards. */
  const lease = async (
    site: string,
    writer: Writer,
    { files, styleKeys }: Touched,
    exists: (file: string) => boolean,
  ) => {
    if (writer.scope === null) {
      const holder = `${writer.holder}~${Math.random().toString(36).slice(2, 10)}`
      await leases.acquire(site, files, holder, IMPLICIT_LEASE_MS)
      return async () => leases.release(site, holder, files)
    }
    const held = new Map((await leases.held(site)).map((l) => [l.file, l]))
    for (const file of files) {
      const lease = held.get(file)
      if (lease && lease.holder !== writer.holder) continue // acquire below names the holder
      if (!writer.scope.includes(file) && exists(file) && lease?.holder !== writer.holder) {
        const keys = styleKeys.get(file)
        if (keys) throw styleRefusal(file, keys, writer)
        throw new DraftFileRefusal(
          'NOT_IN_SCOPE',
          file,
          `\`${file}\` is not in this session's scope (${writer.scope.join(', ') || 'none declared'}); ` +
            'nothing was written. Report it rather than writing elsewhere.',
          writer.holder,
        )
      }
    }
    // Files in scope whose lease lapsed are taken back, and new files are taken
    // by their creator — either way only if nobody else holds them now.
    await leases.acquire(site, files, writer.holder, writer.idleMs ?? DEFAULT_LEASE_IDLE_MS)
    return async () => undefined
  }

  const write = async (site: string, change: SiteWrite): Promise<void> => {
    const ctx = currentWrite()
    const writer: Writer = ctx?.writer ?? { holder: SYSTEM_HOLDER, scope: null }
    for (let attempt = 1; ; attempt++) {
      const { current, pages, assets } = await now(site, change)
      // No such site: the store's own refusal says so better than a lease could.
      if (current.version === null) return store.write(site, change)
      const touches = touched(change, pages, current, assets)
      const files = touches.files
      const release = await lease(site, writer, touches, (file) => current.files.has(file))
      try {
        const read = ctx?.read.get(site)
        for (const file of files) {
          const was = read?.get(file)
          if (was !== undefined && was !== (current.files.get(file) ?? null)) {
            throw new DraftFileRefusal(
              'FILE_CHANGED',
              file,
              `\`${file}\` changed after this call read it, so nothing was written. Read it again and redo the change.`,
            )
          }
        }
        const expect = change.expect ?? current.version ?? undefined
        try {
          await store.write(site, expect === undefined ? change : { ...change, expect })
        } catch (err) {
          if (err instanceof StoreConflictError && change.expect === undefined && attempt < CAS_ATTEMPTS) continue
          throw err
        }
        // What this call now holds in those files is its own write, not what it read.
        for (const file of files) read?.delete(file)
        return
      } finally {
        await release()
      }
    }
  }

  const leased = {
    ...store,
    [LEASES]: leases,
    write,
    async readSiteJson(site: string) {
      const value = await store.readSiteJson(site)
      if (value !== null) remember(site, [[SITE_FILE, value]])
      return value
    },
    async readPages(site: string) {
      const pages = await store.readPages(site)
      for (const page of pages) remember(site, unitsOf(page))
      return pages
    },
  }
  return leased as S
}

/**
 * The lease on the file an element lives in, or null — what the builder's copy
 * modal asks before it opens, so a section a builder is working on says so
 * rather than offering a form whose Save will be refused. `path` is a page
 * address (`0` the root, `0.2` its third section); a module-scoped element, or
 * the root itself, lives in whichever of the page's files is held first.
 */
export async function elementLease(
  store: SiteStore,
  site: string,
  pageId: string,
  path: string,
  moduleScoped: boolean,
): Promise<Lease | null> {
  const leases = leasesOf(store)
  if (!leases) return null
  const held = await leases.held(site)
  if (held.length === 0) return null
  const page = (await store.readPages(site)).find((p) => (p.page as { id?: unknown }).id === pageId)
  if (!page) return null
  const all = [page.name, ...(page.sections ?? []).map((id) => sectionFileName(page.name, id))]
  const index = Number(path.split('.')[1])
  const section = !moduleScoped && page.sections && Number.isInteger(index) ? page.sections[index] : undefined
  const files = !page.sections ? [page.name] : section ? [sectionFileName(page.name, section)] : all
  return held.find((lease) => files.includes(lease.file)) ?? null
}

import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import type { Root, SiteStore } from '../../tools/generate/src/store'
import { fsSiteStore, memorySiteStore } from '../../tools/generate/src/store'
import type { SiteFixture, SiteSeedOptions } from './site-seed'
import { siteSeed } from './site-seed'

/**
 * One site, over either adapter (REQ-142 §8).
 *
 * WHY THIS EXISTS. Every test that needed a site used to open with the same six
 * lines: `mkdtempSync`, `cmdNew`, a `writeFileSync` or two, an `rmSync` in a
 * hook. It is repeated across dozens of files, and it is also exactly the thing
 * that cannot cross into workerd — a Worker has no `mkdtemp`. So the preamble
 * was not merely duplicated, it was duplicated in a form with no future.
 *
 * WHAT IT BUYS BEYOND TIDINESS. {@link makeFsSite} and {@link makeMemorySite}
 * return the SAME handle over the same seed, so a body of assertions written
 * once runs against both. That equivalence is the point: "no caller depends on
 * the filesystem" (AC-4) is otherwise a claim about a diff that nothing
 * re-checks, and this turns it into a property a test asserts by construction.
 * {@link SITE_BACKENDS} is the list to hand `describe.each`.
 *
 * WHY IT DOES NOT CALL `cmdNew`. `cmdNew` is `commands.ts`, which is deliberately
 * still filesystem-only (REQ-142 held its scope to `edit.ts`). A factory built on
 * it could therefore only ever have one backend, which is the one thing this must
 * not be. Instead there is ONE seed, materialised two ways — and the seed is the
 * real scaffolder's output (`starterSiteJson` / `starterHomePage`), so a fixture
 * site is the site `1c new` makes rather than a hand-written approximation that
 * drifts from it.
 */

// The seed, the fixture shape and the slug counter live in `site-seed.ts` —
// worker-safe, because the D1/R2 fixture needs the same seed and cannot import
// this module (it opens with `mkdtempSync`). Re-exported so no caller moved.
export type { SiteFixture, SiteSeed, SiteSeedOptions } from './site-seed'
export { nextSlug, siteSeed } from './site-seed'

/** A site in a temp directory, with the filesystem adapter over it. */
export function makeFsSite(options: SiteSeedOptions = {}): SiteFixture {
  const seed = siteSeed(options)
  const root: Root = options.root ?? 'sites'
  const cwd = mkdtempSync(path.join(tmpdir(), '1c-site-'))
  const draft = path.join(cwd, 'storage', root, seed.slug, 'draft')

  const writeJson = (file: string, value: unknown): void => {
    mkdirSync(path.dirname(file), { recursive: true })
    // The store's own formatting, so a fixture site is byte-identical to one the
    // CLI wrote — a test comparing files is comparing like with like.
    writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
  }

  writeJson(path.join(draft, 'site.json'), seed.siteJson)
  for (const [name, page] of Object.entries(seed.pages)) {
    writeJson(path.join(draft, 'pages', name), page)
  }
  mkdirSync(path.join(draft, 'assets'), { recursive: true })
  for (const [name, bytes] of Object.entries(seed.assets)) {
    writeFileSync(path.join(draft, 'assets', name), bytes)
  }
  // As `cmdNew` leaves it: a site that has never published still has the file.
  writeJson(path.join(cwd, 'storage', root, seed.slug, 'history.json'), { revisions: [] })

  const store = fsSiteStore({ cwd, root })
  return {
    slug: seed.slug,
    store,
    opts: { store, cwd, sandbox: root === 'sandbox', actor: options.actor },
    cwd,
    dispose: () => rmSync(cwd, { recursive: true, force: true }),
  }
}

/** The same site with nothing behind it. */
export function makeMemorySite(options: SiteSeedOptions = {}): SiteFixture {
  const seed = siteSeed(options)
  const store = memorySiteStore()
  store.seed(seed.slug, { siteJson: seed.siteJson, pages: seed.pages, assets: seed.assets })
  return {
    slug: seed.slug,
    store,
    opts: { store, actor: options.actor },
    cwd: null,
    dispose: () => store.forget(seed.slug),
  }
}

/**
 * The options an `edit*` call takes against a site tree already on disk.
 *
 * For the suites that make their own temp tree — with `cmdNew`, or by driving
 * `1c` — and want the handlers pointed at it. It is what the CLI does at its own
 * dispatch (`index.ts`'s `editOptions`), spelled once here so twenty test files
 * do not each spell it: a test is a caller like any other, and a caller's job
 * since REQ-142 is to name its adapter.
 */
export function fsOpts(cwd: string, root: Root = 'sites'): EditOptions {
  return { cwd, sandbox: root === 'sandbox', store: fsSiteStore({ cwd, root }) }
}

/** Both adapters, for `describe.each` — the shape AC-4 and AC-7 are asserted in. */
export const SITE_BACKENDS: ReadonlyArray<{
  name: string
  make: (options?: SiteSeedOptions) => SiteFixture
}> = [
  { name: 'filesystem', make: makeFsSite },
  { name: 'memory', make: makeMemorySite },
]

/** One write as {@link recordingStore} saw it. */
export interface RecordedWrite {
  slug: string
  siteJson: boolean
  pages: string[]
  removePages: string[]
  assets: string[]
  removeAssets: string[]
}

/**
 * A store that counts what it was asked to do.
 *
 * For AC-5, which is a claim about the SHAPE of a call and not about its result:
 * a multi-file change has to reach the store as one write, because that is what
 * lets the D1 adapter make it atomic later without a caller changing. Nothing
 * about the resulting definition can show this — only the call can.
 */
export function recordingStore(inner: SiteStore): { store: SiteStore; writes: RecordedWrite[] } {
  const writes: RecordedWrite[] = []
  const store: SiteStore = {
    ...inner,
    write(slug, change) {
      writes.push({
        slug,
        siteJson: change.siteJson !== undefined,
        pages: (change.pages ?? []).map((p) => p.name),
        removePages: [...(change.removePages ?? [])],
        assets: (change.assets ?? []).map((a) => a.name),
        removeAssets: [...(change.removeAssets ?? [])],
      })
      return inner.write(slug, change)
    },
  }
  return { store, writes }
}

import type { EditActor, EditOptions } from '../../tools/generate/src/cli/edit'
import { starterHomePage, starterSiteJson } from '../../tools/generate/src/cli/scaffold'
import type { Root } from '../../tools/generate/src/store/paths'
import type { SiteStore } from '../../tools/generate/src/store/site-store'

/**
 * The ONE seed every adapter's fixture materialises (REQ-142 §8, REQ-143).
 *
 * WHY IT IS SPLIT OUT OF `site-factory.ts`. That module opens with `mkdtempSync`
 * — it is the filesystem fixture — so importing it from a workerd suite fails
 * before a single assertion runs. But the *seed* it computes has nothing to do
 * with a filesystem: it is a `site.json` and a page, produced by the real
 * scaffolder. The D1/R2 fixture needs exactly that and must not re-derive it,
 * or the three adapters would be compared on three different sites.
 *
 * So the seed lives here, where every runtime can reach it, and `site-factory.ts`
 * re-exports it so no existing import had to change.
 */

/** What a fixture hands back, identically for every adapter. */
export interface SiteFixture {
  /**
   * What THIS adapter calls the site — the value every store verb takes.
   *
   * A directory name under `storage/sites/` for the filesystem fixture, a map
   * key for the in-memory one, and since [[REQ-236]] the minted key for D1. The
   * three genuinely differ, which is why {@link name} exists beside it: an
   * assertion about the site's CONTENT must not be written against its address.
   */
  slug: string
  /**
   * What the seed CALLED the site — the name that reached `site.json`'s
   * `config.businessName` and the starter page's prose ([[REQ-236]]).
   *
   * Equal to {@link slug} on every adapter that addresses a site by a name, and
   * deliberately not on D1. A contract assertion that reads content back and
   * compares it to `slug` is asserting that the store's address leaked into the
   * definition, which on D1 it must not.
   */
  name: string
  store: SiteStore
  /** The options every `edit*` call takes, already carrying the store. */
  opts: EditOptions
  /**
   * The directory the site lives under, for a test that needs to look at bytes
   * directly. `null` on any adapter without one — which is the point: a test
   * that reaches for this cannot run on every backend, and should say so.
   */
  cwd: string | null
  /** Release whatever the fixture holds. Safe to call twice. */
  dispose(): void | Promise<void>
}

/** The definition a fixture starts from. Every field defaults to the scaffolder's. */
export interface SiteSeedOptions {
  slug?: string
  /** Replaces `site.json` outright. */
  siteJson?: Record<string, unknown>
  /** Extra or replacement settings merged over the scaffolded `site.json`. */
  patchSiteJson?: Record<string, unknown>
  /** Replaces the page set outright, keyed by store name (`home.json`). */
  pages?: Record<string, Record<string, unknown>>
  assets?: Record<string, Uint8Array>
  actor?: EditActor
  /** Which tree the fs adapter targets. Ignored by every other adapter. */
  root?: Root
}

/** The one seed every adapter materialises. */
export interface SiteSeed {
  slug: string
  siteJson: Record<string, unknown>
  pages: Record<string, Record<string, unknown>>
  assets: Record<string, Uint8Array>
}

let counter = 0

/** A slug unique within a run, so two fixtures never collide in one store. */
export function nextSlug(prefix = 'fixture'): string {
  counter += 1
  return `${prefix}-${counter}`
}

/** Resolve seed options to the definition every adapter will hold. */
export function siteSeed(opts: SiteSeedOptions = {}): SiteSeed {
  const slug = opts.slug ?? nextSlug()
  const siteJson = { ...(opts.siteJson ?? starterSiteJson(slug)), ...(opts.patchSiteJson ?? {}) }
  return {
    slug,
    siteJson,
    pages: opts.pages ?? { 'home.json': starterHomePage(slug) },
    assets: opts.assets ?? {},
  }
}

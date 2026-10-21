/**
 * [[REQ-422]] — a site's SHARED PARTS (its header and footer) and its
 * NAVIGATION, as every reader needs to see them.
 *
 * WHY A SHARED PART IS A PAGE. A header written once and drawn on every page has
 * to be stored, locked, edited, validated and previewed — which is everything a
 * page already is. So a part is a page whose `kind` is `header` or `footer`:
 * stored under its own name (`header.json`, its own lease), written with the
 * same L1 operations, and NEVER SERVED at an address of its own. What makes it a
 * part is only that the renderer draws it above (or below) every web page that
 * carries it, and a page carries both unless it opts out (`shared`).
 *
 * WHY THE MENU IS DERIVED. A menu of hand-made links on each page is a menu that
 * knows nothing: adding a page changes no link, and a builder scoped to one page
 * cannot keep the others in step. The site's navigation is `site.nav.entries`,
 * in order, and a `nav` node draws it — so adding a page adds an entry, and the
 * entry is drawn on every page at once.
 *
 * IT READS DEFENSIVELY AND NEVER THROWS, on `email-pages.ts`'s reasoning: it is
 * handed stored pages as often as parsed ones, and a malformed page must yield
 * no part rather than an exception nobody can attribute.
 */

/** The two shared parts a site may declare. */
export const PAGE_PARTS = ['header', 'footer'] as const
export type PagePart = (typeof PAGE_PARTS)[number]

/** True for a page kind that is a shared part rather than a page of its own. */
export function isPagePart(kind: unknown): kind is PagePart {
  return kind === 'header' || kind === 'footer'
}

/**
 * True for a page a reader can visit: neither a message, nor a shared part, nor
 * an alternative look. The one statement of "served", so the renderer, the menu
 * and the reachability walk cannot disagree about it.
 */
export function isServedPage(page: unknown): boolean {
  const p = asRecord(page)
  if (!p) return false
  return (p.kind === undefined || p.kind === 'web') && !p.alternative
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null
}

/** The page definitions out of `{ name, page }` records or a parsed site's pages. */
function definitionsOf(pages: unknown): Record<string, unknown>[] {
  if (!Array.isArray(pages)) return []
  const out: Record<string, unknown>[] = []
  for (const entry of pages) {
    const record = asRecord(entry)
    if (record) out.push(asRecord(record.page) ?? record)
  }
  return out
}

/** The site's `header` or `footer` page, or null when it declares none. */
export function sitePartOf(pages: unknown, part: PagePart): Record<string, unknown> | null {
  return definitionsOf(pages).find((page) => page.kind === part) ?? null
}

/**
 * The parts `page` is drawn with: the site's header and footer, less any the page
 * opts out of. A part, a message, or a page with no document carries none.
 */
export function carriedParts(
  page: unknown,
  pages: unknown,
): Partial<Record<PagePart, Record<string, unknown>>> {
  const p = asRecord(page)
  if (!p || !(p.kind === undefined || p.kind === 'web')) return {}
  const shared = asRecord(p.shared) ?? {}
  const out: Partial<Record<PagePart, Record<string, unknown>>> = {}
  for (const part of PAGE_PARTS) {
    if (shared[part] === false) continue
    const found = sitePartOf(pages, part)
    if (found && found.l1) out[part] = found
  }
  return out
}

/**
 * The page `index.html` aliases — the `home`-slugged served page, else the first.
 * The renderer's own rule, so the menu's "home" is the page the front door serves.
 */
export function homePageOf(pages: unknown): Record<string, unknown> | null {
  const served = definitionsOf(pages).filter(isServedPage)
  return served.find((page) => page.slug === 'home') ?? served[0] ?? null
}

/** One item of the site's navigation, as the renderer draws it. */
export interface SiteNavItem {
  label: string
  /** Root-relative (`/`, `/prices`, `/prices#list`) or an absolute URL. */
  href: string
  /** True on the entry for the page being drawn. */
  current: boolean
}

/**
 * The site's navigation, as drawn on `currentPageId`: `site.nav.entries` in
 * order, each resolved to an href. An entry naming a page the site does not
 * serve is left out rather than drawn as a link to nothing — the site validator
 * refuses such an entry at the write, so this is only reached by a stale store.
 */
export function siteNavigation(nav: unknown, pages: unknown, currentPageId?: string): SiteNavItem[] {
  const entries = asRecord(nav)?.entries
  if (!Array.isArray(entries)) return []
  const served = new Map(
    definitionsOf(pages)
      .filter(isServedPage)
      .map((page) => [String(page.id), page]),
  )
  const home = homePageOf(pages)
  const pathOf = (page: Record<string, unknown>): string => (page === home ? '/' : `/${String(page.slug)}`)
  const out: SiteNavItem[] = []
  for (const raw of entries) {
    const entry = asRecord(raw)
    const target = asRecord(entry?.target)
    if (!entry || !target) continue
    const label = String(entry.label ?? '')
    if (target.kind === 'url' && typeof target.href === 'string') {
      out.push({ label, href: target.href, current: false })
      continue
    }
    const page = served.get(String(target.pageId))
    if (!page) continue
    const anchor = target.kind === 'anchor' && typeof target.moduleId === 'string' ? `#${target.moduleId}` : ''
    out.push({ label, href: `${pathOf(page)}${anchor}`, current: !anchor && String(page.id) === currentPageId })
  }
  return out
}

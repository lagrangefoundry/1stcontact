// The Astro-free entry (REQ-143): the scaffolder is reachable from a Worker, and
// the barrel would drag two `.astro` components in for the sake of a token table.
import { defaultTextStyle, defaultTextStyles, defaultTokens } from '@1stcontact/framework/worker'
import { RESPONSIVE_VIEWPORTS } from './capture/values-diff'
import type { SiteStore } from '../store/site-store'

/**
 * Starter content for `1c new`. Since the framework pivot (REQ-79/REQ-84) layout
 * is owned by the L1 substrate and the catalog holds only behavior modules —
 * there are no header/hero/footer layout modules to seed a starter with.
 *
 * REQ-102 — so the starter seeds a **minimal valid L1 document** instead. The
 * page previously scaffolded as `{ modules: [] }` with no `l1` block at all,
 * which made authoring begin by hand-writing the whole document from nothing:
 * the width ladder, the background, the root container. Every authored site paid
 * that, and every author had to know the ladder convention by heart or copy it
 * out of an unrelated site.
 *
 * There is no flag and no second shape. L1 is *the* way to author a page, so a
 * `--l1` opt-in would be exactly the mode detection `CLAUDE.md` forbids.
 *
 * REQ-300 — and the same starter is what `add_page` seeds, because the hole REQ-102
 * closed for site creation was still open for every page added afterwards. So the
 * document is named ({@link starterDocument}) rather than inlined in the page
 * below: one definition, reached by both ways a page comes into existence.
 */

/**
 * The viewport ladder a scaffolded document is authored against — derived from
 * the capture ladder rather than restated, so an authored site and a reproduced
 * one keyframe at the same widths by construction.
 */
export const STARTER_WIDTHS: readonly number[] = RESPONSIVE_VIEWPORTS.map((v) => v.width)

/**
 * @param name What the site calls itself — the `<title>` suffix every rendered
 *   page carries. Defaults to the slug, which is what `1c new` wants: an
 *   authored site is named by its author, so the slug IS the name. [[REQ-190]]'s
 *   provisioning passes its own for the same reason {@link starterHomePage}
 *   takes a heading — a site nobody has named yet should say so, rather than
 *   assert a name derived from a placeholder.
 */
export function starterSiteJson(slug: string, name: string = slug): Record<string, unknown> {
  return {
    id: slug,
    config: {
      businessName: name,
      tagline: `${name} — built with 1st Contact`,
    },
    theme: defaultTokens,
    // REQ-350 — type a new site starts from: named styles, `body` the default.
    textStyles: defaultTextStyles,
    textDefault: defaultTextStyle,
    nav: { pattern: 'top-tabs', entries: [] },
  }
}

/**
 * REQ-114 — a scaffolded page's colours are hex literals, not token roles. The
 * literal is always a valid colour (DOC-23 §5), so a starter page needs no
 * palette; `1c colors --assign` derives one from whatever the author paints.
 */
const STARTER_BACKGROUND = '#ffffff'
const STARTER_TEXT = '#111827'

/**
 * The document a page starts life with — the width ladder, the page paint and a
 * root frame carrying one line of copy.
 *
 * ONE DEFINITION, REACHED BY BOTH WAYS A PAGE COMES INTO EXISTENCE ([[REQ-300]]).
 * It was inlined in {@link starterHomePage} and therefore reachable only by site
 * creation, which is exactly how `add_page` came to produce a page with no
 * document at all: every operation that could put content on a page replaces
 * something already there, so a page born without a root had no address to write
 * to and no way to acquire one — it could be created, renamed, re-pathed and
 * deleted, and nothing else. Named here, the same starter seeds the page a site
 * is born with and the page added on day ten, so the two cannot drift apart and a
 * page added later keyframes at the same widths as the one before it.
 *
 * @param heading The one true thing on the page — a site's name when the site is
 *   being created, a page's title when a page is being added.
 */
export function starterDocument(heading: string): Record<string, unknown> {
  return {
    widths: [...STARTER_WIDTHS],
    background: STARTER_BACKGROUND,
    textColor: STARTER_TEXT,
    // A flowed root — no geometry track. A scaffolded page has nothing to pin
    // to: keyframes are what a *capture* folds to, and inventing a set here
    // would hand the author six absolute boxes to unpick before their first
    // edit. Flow centres itself at every width instead, so the skeleton is
    // responsive before anyone touches it.
    root: {
      kind: 'container',
      id: 'root',
      layout: 'stack',
      align: 'center',
      distribution: 'center',
      padding: { topPx: 96, rightPx: 24, bottomPx: 96, leftPx: 24 },
      children: [
        {
          kind: 'text',
          id: 'placeholder',
          text: heading,
          axes: {
            color: STARTER_TEXT,
            fontSizePx: 48,
            fontWeight: 700,
            lineHeightPx: 56,
            textAlign: 'center',
          },
        },
      ],
    },
  }
}

/** [[REQ-422]] — what a site's header and footer start as; see {@link starterPartDocument}. */
export interface StarterPartOptions {
  /** The business name, set as the wordmark that links home. */
  name: string
  /** The wordmark's size at phone and desktop width (`layout-check.json`'s `brand.wordmarkPx`). */
  wordmarkPx: { phone: number; desktop: number }
  /** A named text style the wordmark takes its face from, when the site has one for headings. */
  textStyle?: string
}

/**
 * [[REQ-422]] — the document a site's shared HEADER or FOOTER starts life with.
 *
 * A HEADER IS THE BUSINESS AND THE WAY AROUND THE SITE: its name, linking home,
 * at a size that reads as the business on a phone and on a desktop — never
 * smaller than the page's headings, which is what builders kept getting wrong —
 * and the site's navigation beside it, folding behind a menu button on a phone.
 * A FOOTER is the name again and the same navigation, centred and never folded.
 *
 * Both are ordinary L1, written with the same operations as any page, so this is
 * a starting point and not a template: everything here is the builder's to
 * restyle. The navigation's ITEMS are not here — they are the site's pages.
 */
export function starterPartDocument(part: 'header' | 'footer', opts: StarterPartOptions): Record<string, unknown> {
  const phone = STARTER_WIDTHS.find((w) => w >= 375) ?? STARTER_WIDTHS[0]
  const desktop = STARTER_WIDTHS.find((w) => w >= 1280) ?? STARTER_WIDTHS[STARTER_WIDTHS.length - 1]
  const header = part === 'header'
  const nameSize = header ? opts.wordmarkPx : { phone: 18, desktop: 18 }
  const wordmark = {
    kind: 'text',
    id: `${part}-name`,
    text: opts.name,
    link: { href: '/' },
    axes: {
      color: STARTER_TEXT,
      ...(opts.textStyle ? { textStyle: opts.textStyle } : {}),
      fontSizePx: nameSize.desktop,
      fontWeight: 700,
      lineHeightPx: Math.round(nameSize.desktop * 1.2),
    },
    ...(nameSize.phone !== nameSize.desktop
      ? {
          responsive: {
            fontSizePx: {
              keyframes: [
                { at: phone, value: nameSize.phone },
                { at: desktop, value: nameSize.desktop },
              ],
            },
            lineHeightPx: {
              keyframes: [
                { at: phone, value: Math.round(nameSize.phone * 1.2) },
                { at: desktop, value: Math.round(nameSize.desktop * 1.2) },
              ],
            },
          },
        }
      : {}),
  }
  const nav = {
    kind: 'nav',
    id: `${part}-nav`,
    ...(header ? {} : { align: 'center', collapseBelowPx: 0, gapPx: 16 }),
    item: {
      kind: 'text',
      text: 'Page',
      axes: { color: STARTER_TEXT, fontSizePx: header ? 16 : 14, fontWeight: header ? 500 : 400, lineHeightPx: header ? 24 : 20 },
    },
  }
  return {
    widths: [...STARTER_WIDTHS],
    background: STARTER_BACKGROUND,
    textColor: STARTER_TEXT,
    root: header
      ? {
          kind: 'container',
          id: 'site-header',
          layout: 'row',
          wrap: true,
          align: 'center',
          distribution: 'between',
          gapPx: 24,
          padding: { topPx: 16, rightPx: 24, bottomPx: 16, leftPx: 24 },
          children: [wordmark, nav],
        }
      : {
          kind: 'container',
          id: 'site-footer',
          layout: 'stack',
          align: 'center',
          gapPx: 12,
          padding: { topPx: 32, rightPx: 24, bottomPx: 32, leftPx: 24 },
          children: [wordmark, nav],
        },
  }
}

/**
 * [[BUG-215]] — what an account's starter page says: the line the preview has
 * always shown before anything is built, now ON the page rather than in place of
 * it.
 *
 * ONE BLANK PAGE, NOT A TEMPLATE AND NOT AN IMPORT ([[REQ-170]]). The point is
 * that a business opened for the first time has a site to edit rather than an
 * empty tenant — and that what the client sees of it is not mistaken for their
 * site. [[REQ-403]] used to swap the starter for a grey panel while the change
 * counter stood at zero, and the first upload moved the counter and put the
 * starter's "Your 1st Contact site" heading in front of the client thirteen
 * minutes before anything had been built. The starter IS the grey page now, so
 * there is nothing for a counter to reveal.
 */
export const STARTER_PLACEHOLDER = "Your site will appear here as it's created."

/**
 * [[BUG-215]] — the id of the starter page's one node: how {@link nothingBuilt}
 * recognises the starter. A fixed marker and not the page's words, so the words
 * can change without the recognition moving with them.
 */
export const STARTER_MARKER = 'starter-placeholder'

/** The grey panel's paint — the colours REQ-403's preview placeholder used. */
const PLACEHOLDER_BACKGROUND = '#e5e7eb'
const PLACEHOLDER_TEXT = '#4b5563'

/**
 * [[BUG-215]] — the document an account's starter page holds: a grey page with
 * one centred line, {@link STARTER_PLACEHOLDER}. No heading, no navigation —
 * nothing a client could take for their site. It renders through the ordinary
 * renderer like any page, so restyling it before building simply restyles it.
 */
export function placeholderDocument(): Record<string, unknown> {
  return {
    widths: [...STARTER_WIDTHS],
    background: PLACEHOLDER_BACKGROUND,
    textColor: PLACEHOLDER_TEXT,
    root: {
      kind: 'container',
      id: 'root',
      layout: 'stack',
      align: 'center',
      distribution: 'center',
      padding: { topPx: 160, rightPx: 24, bottomPx: 160, leftPx: 24 },
      children: [
        {
          kind: 'text',
          id: STARTER_MARKER,
          text: STARTER_PLACEHOLDER,
          axes: {
            color: PLACEHOLDER_TEXT,
            fontSizePx: 16,
            fontWeight: 400,
            lineHeightPx: 24,
            textAlign: 'center',
          },
        },
      ],
    },
  }
}

/**
 * [[BUG-215]] — the home page an account is provisioned with: {@link starterHomePage}'s
 * page, holding {@link placeholderDocument}.
 */
export function placeholderHomePage(name: string): Record<string, unknown> {
  return { ...starterHomePage(name), l1: placeholderDocument() }
}

/** Whether a page is the untouched starter: its root holds the marker and nothing else. */
function isStarterPage(page: unknown): boolean {
  const p = page as { modules?: unknown[]; l1?: { root?: { children?: Array<{ id?: unknown }> } } }
  const children = p?.l1?.root?.children
  return (p?.modules ?? []).length === 0 && children?.length === 1 && children[0]?.id === STARTER_MARKER
}

/**
 * [[REQ-403]], [[BUG-215]] — whether a site still holds only the starter page it
 * was seeded with: one page, and it is the untouched starter.
 *
 * A publish is refused while this holds, so the starter never goes live.
 *
 * THE PAGE AND NOTHING ELSE. REQ-403 also asked the change counter, which moves
 * on an upload, a palette colour or a font — none of which builds anything — so
 * a business that uploaded a photo first was treated as built. What the page
 * holds is the only honest answer to "has anything been built".
 */
export async function nothingBuilt(store: Pick<SiteStore, 'readPages'>, site: string): Promise<boolean> {
  const pages = await store.readPages(site)
  return pages.length === 1 && isStarterPage(pages[0].page)
}

/**
 * @param heading What the page says. Defaults to the slug, which is what `1c new`
 *   wants — an authored site is named by its author, so the slug IS the first
 *   true thing on the page. REQ-167's invite passes its own, because an account
 *   provisioned for someone else is named by an opaque account id ([[DOC-40]] §2)
 *   and a starter page reading `acct_9f3a…` would be a worse welcome than a blank
 *   one.
 */
export function starterHomePage(slug: string, heading: string = slug): Record<string, unknown> {
  return {
    id: 'home',
    slug: 'home',
    title: 'Home',
    seoMeta: {
      title: `${slug} — Home`,
      description: `Welcome to ${slug}.`,
    },
    modules: [],
    l1: starterDocument(heading),
  }
}

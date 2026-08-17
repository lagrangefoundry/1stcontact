// The Astro-free entry (REQ-143): the scaffolder is reachable from a Worker, and
// the barrel would drag two `.astro` components in for the sake of a token table.
import { defaultTokens } from '@1stcontact/framework/worker'
import { RESPONSIVE_VIEWPORTS } from './capture/values-diff'

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
 */

/**
 * The viewport ladder a scaffolded document is authored against — derived from
 * the capture ladder rather than restated, so an authored site and a reproduced
 * one keyframe at the same widths by construction.
 */
export const STARTER_WIDTHS: readonly number[] = RESPONSIVE_VIEWPORTS.map((v) => v.width)

export function starterSiteJson(slug: string): Record<string, unknown> {
  return {
    id: slug,
    config: {
      businessName: slug,
      tagline: `${slug} — built with 1st Contact`,
    },
    theme: defaultTokens,
    nav: { pattern: 'top-tabs', entries: [] },
    assets: [],
  }
}

/**
 * REQ-114 — a scaffolded page's colours are hex literals, not token roles. The
 * literal is always a valid colour (DOC-23 §5), so a starter page needs no
 * palette; `1c colors --assign` derives one from whatever the author paints.
 */
const STARTER_BACKGROUND = '#ffffff'
const STARTER_TEXT = '#111827'

export function starterHomePage(slug: string): Record<string, unknown> {
  return {
    id: 'home',
    slug: 'home',
    title: 'Home',
    seoMeta: {
      title: `${slug} — Home`,
      description: `Welcome to ${slug}.`,
    },
    modules: [],
    l1: {
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
            text: slug,
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
    },
  }
}

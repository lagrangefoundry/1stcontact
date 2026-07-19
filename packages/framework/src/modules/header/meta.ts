import type { ModuleMeta } from '../types'
import { ALIGN_DIAL, LOGO_CARD_DIAL, LOGO_SIZE_DIAL, NAV_COLLAPSE_DIAL, SPACING_DIAL, SURFACE_DIAL } from '../dials'

/**
 * `header` — top navigation chrome (DOC-7 §5 `top-tabs`-style nav).
 *
 * REQ-50: a text wordmark is a flat styled run (`wordmark`) — its family/size/
 * weight/colour/tracking/gradient (the old gold/gradient treatments) collapse
 * onto the run's `color`/`gradient`. An image logo stays an `asset-ref` (`logo`);
 * `logoSize` sizes that image only. The nav links share one style-only `navStyle`
 * run. Only structural dials remain.
 */
export const headerMeta = {
  id: 'header',
  version: 2,
  // `overlay` (REQ-25) renders transparent chrome the render pipeline floats
  // over the following section's band, so header + hero share one image band.
  variants: ['top-nav', 'overlay'],
  dials: {
    spacingTop: SPACING_DIAL,
    spacingBottom: SPACING_DIAL,
    surface: SURFACE_DIAL,
    // Horizontal placement of the wordmark/nav within the header band (REQ-29).
    align: ALIGN_DIAL,
    // Image-logo height (REQ-20 import; REQ-36) — sizes an `asset-ref` logo only;
    // a text wordmark's size lives on the `wordmark` run's `fontSizePx`.
    logoSize: LOGO_SIZE_DIAL,
    // Logo backdrop (REQ-36) — `card`/`shadow`/`frame` set the logo on a plate /
    // drop-shadow / bordered frame; `none` (default) renders it bare.
    logoCard: LOGO_CARD_DIAL,
    // Nav collapse breakpoint (REQ-61) — the width below which the nav folds to a
    // hamburger (`sm`/`md`/`lg`/`xl`), or `none` to never collapse. Default `md`.
    navCollapse: NAV_COLLAPSE_DIAL,
  },
  contentSchema: {
    // Image logo (REQ-50) — an AssetRef. Rendered when present.
    logo: { type: 'asset-ref', required: false },
    // Text wordmark (REQ-50) — a styled run; its `color`/`gradient` express the
    // former gold/gradient treatments. Rendered when `logo` is absent.
    wordmark: { type: 'styled-text', required: false },
    // List of NavEntry ({ label, target }).
    entries: { type: 'list', required: true },
    // Shared style-only run (REQ-50) applied to every nav link.
    navStyle: { type: 'styled-text', required: false },
  },
} as const satisfies ModuleMeta

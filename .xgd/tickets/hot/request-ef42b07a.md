---
uid: request-ef42b07a
id: REQ-24
type: request
title: Display-font slot + @font-face emission (Cinzel wordmark)
created_by: xgd
created_at: '2026-07-02T18:37:29.811477+00:00'
updated_at: '2026-07-09T21:42:36.782396+00:00'
completed_at: '2026-07-09T21:42:36.782396+00:00'
last_field_updated: status
status: free_and_reconciled
fields:
  priority: medium
  story_points: 3
  auto_merge_back: true
  needs_review: false
  commits:
  - 492684e3de712b9477e37c63962a42eccdc3414f
  version: 0.0.16
  bundled_in: bundle-f39884d2
---

## Scope — module capability

Emit `@font-face` for site-supplied display fonts and expose a **display-font slot** so a module (starting with `header`) can render a wordmark in a bespoke font (not just the theme's `heading`/`body` families).

Driven by the **gigabytealchemy.ai** import (REQ-20): the reference header is the wordmark **"GIGABYTE ALCHEMY" in gold Cinzel serif**, centered. The font (`cinzel.woff2`) is already mirrored into the site's `assets/`; nothing currently emitted an `@font-face` rule for it, and `header` had no way to select it.

## Acceptance criteria

- Framework emits a valid `@font-face` (into the per-site stylesheet) for a site-declared display font, referencing the mirrored `.woff2` asset. No raw CSS in the site definition.
- `header` (and ideally any heading-bearing module) can select the display family via a dial or theme typography slot.
- gigabytealchemy header renders "GIGABYTE ALCHEMY" in Cinzel — correct family, weight, and the gold/amber treatment — matching the captured values.

## What was implemented (free-coded — commit 492684e)

**Structured font declaration (site-schema).** New optional `theme.fonts[]` array — each entry `{ family, src, weight?, style?, display? }`, where `src` is an asset-relative path (same shape as `AssetRef.src`). New optional `theme.typography.family.display` third family slot. Both structured data validated by the schema; no raw `@font-face` CSS is expressible in the site definition (`FontFace` type exported).

**@font-face + display token emission (framework `generateThemeCss`).** Each `theme.fonts` entry becomes one `@font-face` rule emitted ahead of `:root`, with a `format(...)` hint derived from the asset extension and `font-display` defaulting to `swap`. A new `--font-family-display` custom property is always emitted (falls back to the heading family when no display family is declared), so **any** heading-bearing module can reach the display face, not just header.

**Header wordmark dials.** `header` gains two dials:
- `logoFont` (`heading` | `body` | `display`) — selects the wordmark family; `display` binds to `--font-family-display`.
- `logoTreatment` (`plain` | `gold`) — `gold` fills the wordmark glyphs with a metallic-gold gradient (`background-clip: text`) keyed to the site's `--color-accent`.
Both apply only to a text wordmark, not an image logo.

**Gold-gradient treatment decision.** The ticket flagged the gold treatment as possibly needing its own primitive. It rides this ticket cleanly as the structured `logoTreatment` dial (a per-instance colour treatment on the header wordmark) — no separate gradient-text primitive was required. If gradient text is later wanted on other modules, generalise `logoTreatment` into a shared text-treatment dial.

## Test plan

`tests/req24-display-font.test.ts` — UATs covering:
- schema accepts a structured font declaration; rejects a malformed one (missing `src`);
- `generateThemeCss` emits a well-formed `@font-face` (family, asset url, woff2 format hint, `font-display`), carries optional weight/style, emits `--font-family-display` (declared value + heading fallback), and omits `@font-face` when no fonts are declared;
- `header` meta exposes the `logoFont`/`logoTreatment` dials; the header renders the wordmark span with the display-font + gold classes, and defaults to heading/plain;
- **end-to-end render pipeline** (`1c` `cmdNew` → inject font → `cmdRender`): theme.css carries the `@font-face`, `--font-family-display`, and the gold wordmark CSS; index.html shows the wordmark with both hook classes; the font asset is copied through.

`tests/framework-tokens.test.ts` updated: token-surface count 55 → 56 (the new `--font-family-display`).

Verified in the real render: `1c render gigabytealchemy` produces the valid `@font-face` for Cinzel and the header wordmark; `1c shot` confirms "GIGABYTE ALCHEMY" in gold Cinzel serif on the dark header, matching the capture. (The gigabytealchemy site itself is REQ-20's untracked fixture and is not part of this commit; its `site.json`/`home.json` were updated to use the new capability and will land with REQ-20.)

## Notes

- Font declaration lives in the theme/site model (`theme.fonts` + `typography.family.display`), not per-module raw props.
- Unblocks REQ-20 fidelity gap #1.
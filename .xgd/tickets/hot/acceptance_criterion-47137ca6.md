---
uid: acceptance_criterion-47137ca6
id: AC-499
type: acceptance_criterion
title: Theme CSS emits an @font-face per declared display font and always emits a
  --font-family-display property
created_by: xgd
created_at: '2026-07-09T21:09:38.349153+00:00'
updated_at: '2026-07-09T21:09:38.349153+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-a224111f
  kind: behavior
  regression_only: false
---

## Criterion
When the site's theme declares one or more structured display fonts (each a `{ family, src, ... }` record with an optional `weight`, `style`, and `display`), the generated theme CSS emits one well-formed `@font-face` rule per font ahead of the `:root` block: the `font-family` is the declared family, `src` is `url(<asset src>)` with a `format(...)` hint derived from the asset extension (e.g. `woff2` → `format("woff2")`, `ttf` → `format("truetype")`), any declared weight/style are included, and `font-display` defaults to `swap`. The output always declares a `--font-family-display` custom property — the declared display family when one is given, otherwise the heading family as fallback. When no fonts are declared, no `@font-face` rule is emitted, but `--font-family-display` is still present.

## Verification
Generate theme CSS with a declared display font (e.g. a `.woff2`) and assert the output contains a matching `@font-face` (family, asset url, `format("woff2")` hint, `font-display`) preceding `:root`, plus a `--font-family-display` equal to the declared family. Generate again with no fonts declared and assert no `@font-face` is emitted while `--font-family-display` falls back to the heading family.

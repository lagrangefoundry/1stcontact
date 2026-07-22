---
uid: acceptance_criterion-e5f10690
id: AC-669
type: acceptance_criterion
title: Per-breakpoint content-width cap varies per width and can drop the cap
created_by: xgd
created_at: '2026-07-19T03:21:05.590738+00:00'
updated_at: '2026-07-19T03:31:26.897361+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-3569e1a4
  kind: behavior
  regression_only: false
---

## Criterion
When the content-width dial is a per-breakpoint object, the content container's maximum width is capped per viewport width following the same override-and-up cascade. An entry may declare "no cap" (bleed) at a given breakpoint, in which case the content is uncapped at that width. A per-breakpoint cap requires a base cap: if there is no base cap, no cap is applied at any width regardless of overrides.

## Verification
Render a module with `contentWidth` as `{ base: X, lg: Y }` and observe the container max-width at narrow vs ≥1024px widths; render with a per-breakpoint bleed override and confirm the content is uncapped at that width; render with per-breakpoint overrides but no base cap and confirm no cap is applied.
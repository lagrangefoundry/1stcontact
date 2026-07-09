---
uid: acceptance_criterion-727326da
id: AC-520
type: acceptance_criterion
title: Layer soft-mask image child carries a feather control
created_by: xgd
created_at: '2026-07-09T22:36:19.637219+00:00'
updated_at: '2026-07-09T22:36:19.637219+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-4f50c054
  kind: behavior
  regression_only: false
---

## Criterion
A layer image child with a soft-mask edge may carry a `feather` step (`sm`|`md`|`lg`) that tunes how far the radial mask stays opaque before feathering out — a crisper edge at `sm`, the softest at `lg`. The framework emits it as a `--fc-feather` custom property that the soft-mask CSS reads for its opaque radial stop. When `feather` is absent the prior fixed default stop is preserved, so existing soft-mask behaviour is unchanged. `feather` is only meaningful with a soft-mask edge (a no-op otherwise).

## Verification
Render a soft-mask image child with `feather: sm` and confirm the produced `<img>` carries a `--fc-feather` custom property set to the crisp stop, and that the soft-mask rule consumes `var(--fc-feather, <default>)`. Render a soft-mask child with no `feather` and confirm no `--fc-feather` is emitted and the default stop applies. A raw feather value outside the enum fails validation.

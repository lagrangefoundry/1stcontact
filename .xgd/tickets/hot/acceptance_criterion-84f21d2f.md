---
uid: acceptance_criterion-84f21d2f
id: AC-566
type: acceptance_criterion
title: contact-form subheadSize/captionSize dials and caption slot size the intro
  and fine print independently
created_by: xgd
created_at: '2026-07-10T01:12:20.281659+00:00'
updated_at: '2026-07-10T01:12:20.281659+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-903e3e3a
  kind: behavior
  regression_only: false
---

## Criterion
contact-form accepts `subheadSize` and `captionSize` dials (`sm`/`md`/`lg`) that size the intro subhead and a small caption independently — `md` (default) preserves the prior size, `sm`/`lg` step it down/up — and an optional `caption` markdown content field rendered as fine print below the form. A form omitting the caption and the dials renders as before.

## Verification
Render a contact-form with a `caption`, `subheadSize: lg`, and `captionSize: sm`; observe via the published markup/stylesheet that the subhead carries the large size treatment and the caption renders below the form at the small size; render omitting all three and observe an unchanged form with no caption.

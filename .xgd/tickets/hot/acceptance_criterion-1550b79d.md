---
uid: acceptance_criterion-1550b79d
id: AC-504
type: acceptance_criterion
title: Header exposes align, logoSize, an xl top-spacing step, and a display-wordmark
  treatment
created_by: xgd
created_at: '2026-07-09T21:57:29.378291+00:00'
updated_at: '2026-07-09T21:57:29.378291+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-a224111f
  kind: behavior
  regression_only: false
---

## Criterion
The `header` module exposes an `align` dial (`left` | `center`, default `left`) placing the wordmark/nav within the band, a `logoSize` dial (`sm` | `md` | `lg` | `xl`, default `md`) sizing the text wordmark independently of its font/treatment where `xl` reads at display/hero scale, and an `xl` step on the vertical spacing dial giving an `xl`-spaced header generous top breathing room. When the wordmark uses the `display` font, it is rendered with tight tracking (a slightly negative letter-spacing) and the display face's own true weight (its semibold), rather than forcing a bold that would make the browser synthesise a distorted faux-bold.

## Verification
Render headers exercising `align`, `logoSize`, and `xl` spacing and assert the band markup carries the corresponding placement/size/spacing hooks. Render a `display`-font wordmark and assert it carries the tight-tracking, true-weight (semibold) styling rather than an inherited bold. Assert defaults (`left` / `md`) are applied when the dials are omitted.

---
uid: acceptance_criterion-ce02493a
id: AC-518
type: acceptance_criterion
title: Layer text child titled block flows as one positioned block with a fixed gap
created_by: xgd
created_at: '2026-07-09T22:35:58.196051+00:00'
updated_at: '2026-07-09T22:35:58.196051+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-4f50c054
  kind: behavior
  regression_only: false
---

## Criterion
A layer text child may carry `lines: [{ text, typography? }, …]` as an alternative to a single `text` run (the two are **mutually exclusive** — exactly one must be present, enforced at validation). The `lines` form renders as one positioned flow block whose lines follow normal document order, each keeping its own token-backed typography, so the inter-line gap between them (e.g. a wordmark and its tagline) is content-based and stays fixed regardless of the band's viewport height — unlike two separately percentage-positioned children whose gap scales with the band height.

## Verification
Render a layer text child with two `lines` (e.g. a `5xl`/`black` wordmark line and a smaller subline) and confirm both lines render inside a single positioned block, each carrying its own typography declarations, with a fixed content-based gap between them. Render the same content across viewport heights (e.g. 800 / 1000 / 1080) and confirm the wordmark→subline gap does not change. A text child declaring both `text` and `lines`, or neither, fails validation with a path-pointed error.

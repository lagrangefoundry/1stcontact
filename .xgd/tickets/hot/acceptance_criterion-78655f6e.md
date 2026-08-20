---
uid: acceptance_criterion-78655f6e
id: AC-1313
type: acceptance_criterion
title: Section band vertical padding is captured but no longer compared; textAlign
  and element padding are unaffected
created_by: xgd
created_at: '2026-08-20T04:36:09.436537+00:00'
updated_at: '2026-08-20T06:58:49.518098+00:00'
completed_at: null
last_field_updated: uat_coverage
status: pending
fields:
  story_uid: story-d5de22a5
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
A section band's `paddingTopPx` and `paddingBottomPx` are still **captured but no longer compared**. Band vertical padding is one *component* of the emergent gap (`gap = base + padding`), and the two sides distribute the same visual spacing across different contributors — the reference through margins, the reproduction through padding — so a band-padding delta is padding-vs-margin noise fighting the visual it is supposed to protect. The sum is the coordinate both sides agree on, and the adjacent-gap axis measures it.

The retirement is scoped exactly to the section band's vertical padding: the band's `textAlign` comparison is unaffected, and per-element padding comparison (a card's own internal padding) is unaffected.

## Verification
Diff a reference against a reproduction whose section bands carry the same visual spacing distributed as padding rather than margin; assert the band's `paddingTopPx`/`paddingBottomPx` appear in the captured value set on both sides but that **no** band-padding delta is emitted. Diff a pair whose band `textAlign` differs and assert the `textAlign` delta is still emitted. Diff a pair whose element-level padding differs and assert that delta is still emitted.
---
uid: acceptance_criterion-9f1e7baf
id: AC-932
type: acceptance_criterion
title: A retrofitted site's palette is materially smaller than its distinct colour
  count, with no colour lost
created_by: xgd
created_at: '2026-08-06T20:37:54.856029+00:00'
updated_at: '2026-08-16T22:25:28.117579+00:00'
completed_at: null
last_field_updated: body
status: active
fields:
  story_uid: story-5e7eb0c5
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

Converting an existing site's colour literals to palette references yields a
**palette rather than a colour list**: the number of entries is materially smaller
than the number of distinct colours the site used, because colours sharing an RGB
at different opacities collapse to one entry and colours forming a reachable ramp
collapse to one entry plus a shade on each reference.

The conversion is colour-lossless in the sense that matters for the palette's
shape: every colour the site painted before the conversion is still painted after
it — within the bound the conversion is gated on — and no new colour appears.

As built, the two stored sites carrying L1 pages land at **7 entries** and
**15 entries**, neither carrying a single step. Those palettes are legitimately
larger than the 6 and 8 the named-step model produced, because the colours a
shade cannot reach — the ones more saturated than their family's base — are split
out as their own exact entries rather than approximated into a family they do not
belong to. They remain materially smaller than the sites' distinct colour counts.
Sites with no L1 colour axes carry no palette at all and remain valid.

## Verification

For a retrofitted site, compare the declared palette size against the count of
distinct colours in the pre-conversion definition and confirm it is materially
smaller; assert no entry carries a step; compare the colours actually painted
before and after in document order and confirm the number of slots is unchanged
and every colour is accounted for. For a site with no colour axes, assert the
definition carries no palette and still validates.

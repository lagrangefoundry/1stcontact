---
uid: acceptance_criterion-9f1e7baf
id: AC-932
type: acceptance_criterion
title: A retrofitted site's palette is materially smaller than its distinct colour
  count, with no colour lost
created_by: xgd
created_at: '2026-08-06T20:37:54.856029+00:00'
updated_at: '2026-08-10T08:15:58.582352+00:00'
completed_at: null
last_field_updated: uat_coverage
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
than the number of distinct colours the site used, because colours sharing an RGB at
different opacities collapse to one entry and colours forming a ramp become steps of
one entry.

The conversion is colour-lossless: every colour the site painted before the
conversion is still painted after it, and no new colour appears. As built, the two
stored sites carrying L1 pages landed at 6 entries from 16 distinct RGB and 8 entries
from 30. Sites with no L1 colour axes carry no palette at all and remain valid.

## Verification

For a retrofitted site, compare the declared palette size against the count of
distinct colours in the pre-conversion definition and confirm it is materially
smaller; compare the multiset of colours actually painted before and after and
confirm nothing is lost or introduced.
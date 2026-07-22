---
uid: acceptance_criterion-18356eea
id: AC-688
type: acceptance_criterion
title: The spike renders equivalently across chromium, webkit, and firefox
created_by: xgd
created_at: '2026-07-22T19:32:40.672749+00:00'
updated_at: '2026-07-22T19:38:51.049859+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-d0a8cfad
  kind: behavior
  regression_only: false
---

## Criterion
The same L1 document rendered and captured across three browser engines
(chromium, webkit, firefox) produces equivalent layout: every engine yields a
projection (none hangs or crashes), the authored content is present on all
engines, the CSS-pinned position and width agree across engines within the
calibrated cross-browser tolerance, and authored axes (e.g. font-size) are
identical across engines.

## Verification
Capture the hero spike across all three engines at representative widths and
assert: a projection from each engine, the wordmark present on all three,
per-engine left/width spread within the calibrated position/size tolerance, and
one identical rounded font-size across engines. Runs only when all three engines
are installed; skips cleanly otherwise.
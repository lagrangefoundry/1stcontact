---
uid: acceptance_criterion-24fae61d
id: AC-1058
type: acceptance_criterion
title: 'The assistant is offered only granted site operations: no filesystem operation,
  and no operation that names a site'
created_by: xgd
created_at: '2026-08-10T08:36:02.679145+00:00'
updated_at: '2026-08-10T08:36:02.679145+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-a58a0974
  kind: behavior
  regression_only: false
---

## Criterion
The operations the assistant is offered are exactly those its grant allows.
None of them reads or writes files, and none of them accepts a site as a
parameter — so acting on a site other than the one its conversation was opened
for is not a mistake available to it. Its priming names the site it is working on
and is assembled from the operations it was actually granted, including a stated
account of what deliberately has no operation, so it can answer for an absent
capability rather than discover it by failing.

## Verification
Run a turn and inspect what the assistant was given: the offered operations
include the site-changing and site-reading ones, include no file-reading,
file-writing or file-searching operation, and none declares a site parameter. Its
priming names the site under work, describes what it can do, and carries a stated
"not available" section.

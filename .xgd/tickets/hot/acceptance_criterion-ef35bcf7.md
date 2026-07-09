---
uid: acceptance_criterion-ef35bcf7
id: AC-491
type: acceptance_criterion
title: The scroll-reveal script is shipped once per page and only when the page contains
  scroll motion
created_by: xgd
created_at: '2026-07-09T20:52:07.418917+00:00'
updated_at: '2026-07-09T20:52:07.418917+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-b13e15c5
  kind: behavior
  regression_only: false
---

## Criterion
When a rendered page contains at least one scroll-triggered motion (on a module or a layer child), the page includes exactly one self-contained viewport-observer script that reveals each scroll-triggered element as it enters the viewport, and scroll-triggered elements carry a marker the script can select. When a page contains no scroll motion, no such script is present.

## Verification
Render one page with a scroll motion and assert a single reveal script is injected and the scroll element carries the reveal marker. Render a second page with only load/hover motion (or none) and assert no reveal script is present.

---
uid: acceptance_criterion-86d9e15d
id: AC-975
type: acceptance_criterion
title: The displayed site fills the browser window and follows a live resize, and
  the workspace page itself never scrolls
created_by: xgd
created_at: '2026-08-07T01:44:58.913298+00:00'
updated_at: '2026-08-07T21:19:46.599200+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-e674c60a
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

At any browser window height, the area displaying the site occupies the space
available below the toolbar rather than collapsing to a small fixed height, and
it grows and shrinks as the window is resized while the workspace is open. The
workspace page itself never gains a scrollbar — the displayed site scrolls
internally.

## Verification

In a real browser (a layout-less environment cannot distinguish a filled pane
from a collapsed one), measure the displayed area's height at several window
heights and assert each is close to the available space and far above an
iframe's default intrinsic height. Resize the window while open and assert the
measurement follows. Assert the workspace document's scroll height does not
exceed its viewport height. Where no browser can be launched the measurement
must report loudly rather than skip silently.
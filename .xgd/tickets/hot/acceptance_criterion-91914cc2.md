---
uid: acceptance_criterion-91914cc2
id: AC-971
type: acceptance_criterion
title: '"Open in a new tab" always targets the exact document the pane is displaying'
created_by: xgd
created_at: '2026-08-07T01:44:41.216429+00:00'
updated_at: '2026-08-07T21:19:42.831774+00:00'
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

The target of the open-in-a-new-tab control is, at every moment, identical to
the URL of the document the pane is currently displaying. It stays identical
after a mode change and after a site change, with no ordering in which the two
can disagree.

## Verification

Mount the workspace and assert the control's target equals the displayed
document's URL. Change mode and re-assert; change site and re-assert; change
mode again and re-assert. Compare the two values directly rather than
reconstructing an expected URL, so a shared formatting mistake cannot make the
assertion pass falsely.
---
uid: acceptance_criterion-99f7c64d
id: AC-982
type: acceptance_criterion
title: Saving new words updates the draft and the rendered page shows them, with no
  further manual step
created_by: xgd
created_at: '2026-08-07T02:02:13.232194+00:00'
updated_at: '2026-08-10T07:40:17.204967+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-37a3921b
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

Submitting a change map of new values for a region's fields updates the copy in
the site's draft definition, and the page is re-rendered as part of the same
operation, so the rendered output on disk contains the new words and no longer
contains the old ones. The result reports which fields changed and where the
re-rendered output was written. Submitting values identical to the current ones
succeeds and reports that nothing changed.

## Verification

Save new text for a known copy region, then read the rendered page produced by
the operation: assert it contains the new string and not the previous one, and
that the draft definition holds the new string. Re-submit the identical value and
assert success with an explicit "no change" outcome.
---
uid: acceptance_criterion-0e3243d4
id: AC-1474
type: acceptance_criterion
title: The capture shows the draft as it stands now — the same state the preview surface
  serves at that moment
created_by: xgd
created_at: '2026-08-31T23:21:40.637229+00:00'
updated_at: '2026-08-31T23:30:56.826533+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-7fa314f5
  kind: behavior
  regression_only: false
---

## Criterion

A capture of a draft reflects the **current** state of that draft — the same
state the preview surface would serve for the same site, channel and path at the
same moment.

In particular, a capture taken after an edit shows the edited draft. A capture
never answers from an older state of the site than the one the operator is
looking at.

## Verification

1. Capture a draft, and assert the captured document equals what the preview
   surface serves for that site, channel and path.
2. Change the site's draft content.
3. Capture again, and assert the captured document contains the change and again
   equals what the preview surface now serves.

Step 3 is what distinguishes this criterion from the authored-page criterion: a
capture drawing on a separately produced rendering could pass step 1 and fail
step 3, and would do so silently — the operator would receive a confident,
correctly-rendered picture of a draft that no longer exists.
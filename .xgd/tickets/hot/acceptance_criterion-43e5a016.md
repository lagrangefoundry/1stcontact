---
uid: acceptance_criterion-43e5a016
id: AC-1000
type: acceptance_criterion
title: Closing a form in which nothing was changed writes nothing and re-renders nothing
created_by: xgd
created_at: '2026-08-07T02:16:47.041598+00:00'
updated_at: '2026-08-16T04:18:56.934668+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-3bf94bd4
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

An operator who opens a form and changes nothing can confirm or cancel it and
the result is the same: the form closes, no change is sent, the draft is
untouched and the page is not re-rendered. Opening a form to look is not an
edit.

This spans **every control the dialog holds**, not only its form. A dialog whose
only control is the thumbnail grid — a region that exposes nothing but which
image it carries — is still not an edit when it is opened and confirmed with no
tile chosen, and neither is a dialog holding both a grid and a form in which
neither was touched. "Nothing changed" is the answer both controls have to give
before the dialog closes silently.

## Verification

Open a form over a region, alter nothing, confirm it. Assert no change request
was issued, the draft's modification state is unchanged, and the displayed page
was not reloaded. Repeat over a region whose dialog is all thumbnails and no form
at all, and assert the same: confirming it untouched issues no change request.
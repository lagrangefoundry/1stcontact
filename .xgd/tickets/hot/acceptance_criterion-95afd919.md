---
uid: acceptance_criterion-95afd919
id: AC-981
type: acceptance_criterion
title: A region that exposes nothing answers with an empty field list and succeeds,
  rather than failing
created_by: xgd
created_at: '2026-08-07T02:02:08.300539+00:00'
updated_at: '2026-08-07T19:40:36.383862+00:00'
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

Requesting the editable fields of a region that exposes nothing — a layout
container, a behavior-module instance — **succeeds** and returns an empty field
list, with a human-readable statement that the region has nothing to edit. It is
not reported as a failure, a missing region, or an error of any kind. Which
regions these are is decided by the surface's own derivation, not by the caller:
an image region is not one of them, because it exposes which image goes there
and its alt text.

## Verification

Address a container region and a module-instance region in a seeded site. Assert
each request succeeds (success outcome, zero exit status) and that the returned
field list is empty. Contrast with a copy region of the same page, which returns
one field, and an image region, which returns two.
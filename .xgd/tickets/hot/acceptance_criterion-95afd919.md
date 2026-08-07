---
uid: acceptance_criterion-95afd919
id: AC-981
type: acceptance_criterion
title: A region with nothing editable answers with an empty field list and succeeds,
  rather than failing
created_by: xgd
created_at: '2026-08-07T02:02:08.300539+00:00'
updated_at: '2026-08-07T02:12:07.131727+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-37a3921b
  kind: behavior
  regression_only: false
---

## Criterion

Requesting the editable fields of a region that is not copy — a layout container,
a behavior-module instance — **succeeds** and returns an empty field list, with a
human-readable statement that the region has no editable copy. It is not
reported as a failure, a missing region, or an error of any kind.

## Verification

Address a container region and a module-instance region in a seeded site. Assert
each request succeeds (success outcome, zero exit status) and that the returned
field list is empty. Contrast with the copy region of the same page, which
returns one field.
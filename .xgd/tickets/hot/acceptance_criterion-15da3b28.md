---
uid: acceptance_criterion-15da3b28
id: AC-866
type: acceptance_criterion
title: A font a page serves resolves to its record regardless of how the reference
  is written — leading path, query string, fragment or absolute URL
created_by: xgd
created_at: '2026-08-06T03:31:02.833266+00:00'
updated_at: '2026-08-07T18:45:03.841954+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-8685be2d
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
The join between what a page serves and what the record covers is on the file
itself, so the form of the reference cannot make an accounted-for font look
unaccounted-for. A reference written with a leading path, without one, carrying a
cache-busting query, carrying a fragment, or given as a full absolute URL all
resolve to the same file key the record lists — and a page serving a recorded font
by any of those forms raises no violation.

## Verification
For each reference form, assert it reduces to the same file key the record
records. Then build a project whose site serves a recorded font using a
query-bearing reference and assert the check passes with no unregistered-file
violation.
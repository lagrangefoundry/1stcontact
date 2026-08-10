---
uid: acceptance_criterion-e817ae96
id: AC-980
type: acceptance_criterion
title: Asking a copy region what it exposes returns one plain-text field carrying
  the words currently in the draft
created_by: xgd
created_at: '2026-08-07T02:02:03.774970+00:00'
updated_at: '2026-08-10T07:40:15.082052+00:00'
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

Requesting the editable fields of a region that holds a run of copy succeeds and
returns exactly one field: a plain-string field, with a human label, whose
current value is the run's exact text as it stands in the draft. A value that is
long or contains a line break additionally asks for a multi-line control; a
short single-line value does not.

## Verification

Address a known run of copy in a seeded site and request its fields. Assert one
field, of plain-string type, whose value equals the copy in the draft
character-for-character. Repeat for a long/multi-line run and assert the
multi-line control is requested, and for a short one and assert it is not.
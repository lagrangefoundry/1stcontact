---
uid: acceptance_criterion-e817ae96
id: AC-980
type: acceptance_criterion
title: Asking a copy region what it exposes leads with a plain-text field carrying
  the words currently in the draft
created_by: xgd
created_at: '2026-08-07T02:02:03.774970+00:00'
updated_at: '2026-08-16T06:55:24.803445+00:00'
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

Requesting the editable fields of a region that holds a run of copy succeeds, and
the **first** field it answers with is a plain-string field: one with a human
label, whose current value is the run's exact text as it stands in the draft,
character for character.

Being first is the load-bearing part of the claim rather than an incidental
ordering. A client opening a copy region has to land in the words, and it finds
them by where they sit in the answer — not by their being the only thing in it,
which they no longer are now that a run also exposes how it is set. What the
rest of the answer holds is a separate criterion's business; this one is about
the words being present, exact, and in front.

A value that is long or contains a line break additionally asks for a multi-line
control; a short single-line value does not.

## Verification

Address a known run of copy in a seeded site and request its fields. Assert the
first field is of plain-string type and that its value equals the copy in the
draft character-for-character. Repeat for a long/multi-line run and assert the
multi-line control is requested, and for a short one and assert it is not.
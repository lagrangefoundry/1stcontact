---
uid: acceptance_criterion-6abc5669
id: AC-1236
type: acceptance_criterion
title: The count reported before a rename, the count the rename reports rewriting,
  and the references actually rewritten are one number
created_by: xgd
created_at: '2026-08-20T01:20:28.709340+00:00'
updated_at: '2026-08-20T01:50:35.258311+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-ee073693
  kind: behavior
  regression_only: false
---

## Criterion

The usage count reported for an entry **before** a rename and the number of references the
rename reports having rewritten are the same number, on a site whose references sit at several
different positions within the entry's colour family — and that number equals the number of
references actually present in the files afterwards.

## Verification

Seed a site whose references to one entry sit at three different positions in its family (the
case where two independently maintained traversals would disagree). Read the palette and record
the entry's count. Rename the entry and record the count the rename reports. Then count the
references to the new name in the written files. Assert all three numbers are equal.
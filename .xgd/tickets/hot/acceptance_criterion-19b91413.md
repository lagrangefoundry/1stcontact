---
uid: acceptance_criterion-19b91413
id: AC-1245
type: acceptance_criterion
title: 'Moving the position control while managing the palette writes nothing: the
  stored site is byte-unchanged'
created_by: xgd
created_at: '2026-08-20T01:59:03.391364+00:00'
updated_at: '2026-08-20T02:20:59.856024+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-4300366a
  kind: behavior
  regression_only: false
---

## Criterion

Opened to manage rather than to supply a value, the position control is a preview of the entry's
family and writes nothing: selecting an entry, moving the position anywhere in its range and closing
the surface leaves the site's stored definition byte-unchanged, and the surface answers its opener
with no value.

## Verification

Record the site's stored definition. Open the surface to manage, select an entry, move the position
control to each end of its range and to an intermediate point, then close. Compare the stored
definition against the recording — it must be byte-identical — and observe the opener receiving no
selection.
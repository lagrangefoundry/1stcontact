---
uid: acceptance_criterion-a14cb18c
id: AC-1264
type: acceptance_criterion
title: The change-reading operation is in the manual of a session granted the site-reading
  group, and absent from one that is not
created_by: xgd
created_at: '2026-08-20T02:27:36.063265+00:00'
updated_at: '2026-08-20T02:27:36.063265+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-6cd17452
  kind: behavior
  regression_only: false
---

## Criterion

The operation that reads the change log is projected into the manual of a session granted the site-reading group — described as seeing what changed on the site and who changed it, and taking an optional baseline — and is **absent** from the manual of a session that is not granted that group.

A session that is not granted it cannot invoke it.

## Verification

Open a session granted the site-reading group and assert the projected manual names the change-reading operation, describes its optional baseline parameter, and places it in that group.

Open a session granted a different group only, assert the operation is absent from its manual, and assert an attempt to invoke it is refused rather than executed.

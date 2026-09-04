---
uid: acceptance_criterion-99fd4b55
id: AC-1563
type: acceptance_criterion
title: A corrected description is kept, and is what the client sees when they come
  back to it
created_by: xgd
created_at: '2026-09-04T04:27:06.991975+00:00'
updated_at: '2026-09-04T04:27:06.991975+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-f775289b
  kind: behavior
  regression_only: false
---

## Criterion

Editing the description of a selected material and committing the edit stores the client's text as
that material's description, without any further confirmation step.

Re-selecting the same material — including after re-reading the account's material from scratch —
shows the client's text and not the one the system originally wrote.

## Verification

Select a material with a system-written description, replace the description with distinct text, and
commit. Assert the stored record for that material now carries the client's text. Re-open the
Library from a fresh read of the account and select the same material; assert the detail area shows
the client's text.

---
uid: acceptance_criterion-7e6ce01d
id: AC-1266
type: acceptance_criterion
title: A session whose site moved between turns is told so in its reminder; one whose
  site did not, is not
created_by: xgd
created_at: '2026-08-20T02:27:46.252656+00:00'
updated_at: '2026-08-20T02:27:46.252656+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-6cd17452
  kind: behavior
  regression_only: false
---

## Criterion

A session whose site changed between two of its turns is told so at the start of the next turn, without making any call: the reminder it is given carries how many changes landed and the baseline to ask from, and directs it to look at what changed before writing.

A session whose site did **not** change between turns receives no such line. The assistant's own writes during a turn are absorbed and are never reported back to it as somebody else's work.

## Verification

Drive a real session through a turn. Between that turn and the next, make an edit from a different caller. Assert the reminder in effect for the second turn contains the change signal, names the correct number of changes, and names a baseline that returns exactly those changes.

Drive a turn in which the assistant itself writes and nobody else does; assert the following turn's reminder carries no change signal.

Drive two turns with no intervening edit at all and assert the reminder is the plain one, with no change signal.

---
uid: acceptance_criterion-6e64a161
id: AC-1277
type: acceptance_criterion
title: The command line's field listing marks an unavailable field with its reason,
  and leaves an ordinary field unmarked
created_by: xgd
created_at: '2026-08-20T02:58:18.272003+00:00'
updated_at: '2026-08-20T02:58:18.272003+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-37a3921b
  kind: behavior
  regression_only: false
---

## Criterion

The command line's human-readable listing of a region's fields **marks an
unavailable field, and prints its reason**, beside the field's name and current
value.

This is not cosmetic. That listing is what a reader at the terminal and the AI
both work from, and a field printed exactly like every other one is a field they
will try to set and be refused for, with no way to have known. The reason printed
is the same sentence the field carries and the same sentence the refusal returns.

An ordinary field is printed unmarked, with nothing added — there is nothing to
explain about a control that works.

## Verification

Ask the command line for the fields of the run whose colour is unavailable and
assert its line carries the field name, the value it holds and the field's reason
marked as such; assert the neighbouring fields on the same region are printed
without any such marking. Assert the reason printed is character-for-character
the one the machine-readable answer carries for that field.

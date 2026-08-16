---
uid: acceptance_criterion-670113cb
id: AC-1142
type: acceptance_criterion
title: The declaration carries named worked sequences whose steps are declared operations
  in order, and no sequence shown to a consumer names an operation it was not granted
created_by: xgd
created_at: '2026-08-16T03:06:04.662988+00:00'
updated_at: '2026-08-16T03:39:10.114495+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-93905de4
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

The declaration carries worked sequences by name — the short orders of operations
that get a real job done — as data alongside the operations themselves, not as
prose maintained beside them. Each sequence names its steps in order, every step
is a declared operation, and each carries the note saying why that order is the
order: an element is read before it is replaced, because a replacement is the
whole element; an address is taken from a page's map before it is used; adding or
removing something goes the same read-then-write way, there being no separate
insert or delete. Because the sequences are part of the declaration, they cannot
name an operation the surface does not have — and no sequence put in front of a
consumer names an operation that consumer was not granted.

## Verification

Read the declared sequences from the declaration directly rather than through the
format check, which an empty list would satisfy unchanged. Assert the list is
non-empty and that each entry names itself, lists at least two steps in order, and
carries its note. Assert every step is the tool name of a declared operation.
Assert the sequence for changing something on a page reads before it replaces —
the read of an element precedes the write of it — and that the sequence for adding
or taking something away follows the same shape rather than naming an insert or
delete operation, because none is declared. Then build the builder's assistant
surface and assert that no sequence it is shown names an operation outside the set
of operations it is offered; publishing, whose capability group it is not granted,
is today's instance.
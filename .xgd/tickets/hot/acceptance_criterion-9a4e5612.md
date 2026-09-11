---
uid: acceptance_criterion-9a4e5612
id: AC-1642
type: acceptance_criterion
title: A harvested definition appears only against the shape it was written for
created_by: martin-github@westhead.me
created_at: '2026-09-11T02:36:17.502588+00:00'
updated_at: '2026-09-11T02:36:17.502588+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-5836022a
  kind: behavior
  regression_only: false
---

## Criterion

A definition harvested from a source appears only against the shape it was
written for. Where the same field name occurs on several shapes and is defined on
only one of them, the other shapes list the field with its type and requiredness
and carry no definition — they never inherit the definition written elsewhere.

A shape that composes another shape's fields does own those fields' definitions,
because that composition is what the source means by sharing them.

Where a field name is defined inconsistently within one shape, no definition is
carried rather than an arbitrary one. A definition that cannot be stated without
qualifying it, or that runs past the length a definition has, is omitted: the
reference loses a sentence and never gains a wrong one.

## Verification

Pick a field name that the source defines on exactly one shape and leaves
undefined on others — a colour field defined once for one specific treatment is
the canonical case. In the layout reference, the shape that declares the
definition carries it; every other shape that has a field of the same name lists
the field and does not carry that definition anywhere in its own section. Then
confirm a shape composed from a shared group of fields does carry that group's
definitions.

---
uid: acceptance_criterion-fd0089b8
id: AC-2393
type: acceptance_criterion
title: Drawing anchors are a closed set of 17 names in four families, each with an
  inferred axis; a misspelt anchor is refused
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T07:16:45.667734+00:00'
updated_at: '2026-11-08T10:12:20.099285+00:00'
completed_at: null
last_field_updated: title
status: active
fields:
  story_uid: story-d2bee21c
  kind: behavior
  regression_only: false
---

## Criterion
An anchor reference is `<node>.<anchor>`. The accepted anchor names are exactly: box `left`, `right`, `top`, `bottom`, `centre-x`, `centre-y`; ink `ink-left`, `ink-right`, `ink-top`, `ink-bottom`; font `baseline`, `cap-top`, `x-top`, `ascender`, `descender`; advance `advance-start`, `advance-end`. Each name carries a fixed axis, never passed by the caller: `left`/`right`/`centre-x`/`ink-left`/`ink-right`/`advance-start`/`advance-end` are x, and the rest are y.

A name outside the set is refused, never answered with a number:
- Resolving it directly against a node's geometry (`anchorValue`) refuses with a message that lists all the valid names.
- Through `relate` and `solve`, the reference parse rejects it first. The refusal is the generic reference-shape message: `'<ref>' is not an anchor reference. Write it as <node>.<anchor>, e.g. '#wordmark.cap-top' — the node as measure_drawing reports it, then one of the anchor names it lists.` It does not itself enumerate the names (see the story's Reconciliation Decision).
- In a `write_image` `assert` entry, the relation is reported with a `why` saying it is not a relation and giving the `<node>.<anchor> = <node>.<anchor>` form, with no `holds`.

Ink, font and advance anchors asked of a node that has no text are refused with a message pointing to the box anchors.

## Verification
Assert `ANCHOR_NAMES` is exactly the 17. Resolve every anchor against a measured text node through `relate` and check its reported axis. Resolve `cap-tip` with `anchorValue` and assert the refusal contains every valid name. Through `ops.relate`, `ops.solve` and `write_image` `assert`, use a `cap-tip` reference and assert each returns the generic message quoted above (the reference, "Write it as <node>.<anchor>", and for assert "this is not a relation"). Ask ink, font and advance anchors of a `<rect>` and assert the refusal lists the box anchors.
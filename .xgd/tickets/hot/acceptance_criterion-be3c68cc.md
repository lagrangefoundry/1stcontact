---
uid: acceptance_criterion-be3c68cc
id: AC-581
type: acceptance_criterion
title: Machine-readable report carries the object cards and unpaired list
created_by: xgd
created_at: '2026-07-13T19:51:34.567307+00:00'
updated_at: '2026-07-13T19:57:11.269062+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-74050e88
  kind: behavior
  regression_only: false
---

## Criterion
In addition to the human-readable rendering, the comparison exposes a
machine-readable report that carries the object-grouped projection: a collection
of object cards (each with its kind, identity, parameter rows including box and
their matched/mismatched verdicts, mismatch count, and an ordering severity) and
a separate collection of reproduction-only unpaired objects. The structured
report contains the same object grouping and loud-unpaired information the text
rendering presents, so a consumer can read and diff a reproduction object by
object without parsing formatted text.

## Verification
Request the machine-readable comparison report for a pair with mismatched,
clean, and unpaired objects. Assert the report contains a per-object collection
whose entries carry parameter rows (including a box row) with per-row
mismatch flags and a mismatch count, and a distinct collection listing the
reproduction-only object that matched nothing.
---
uid: acceptance_criterion-c6534e1a
id: AC-639
type: acceptance_criterion
title: values-diff --size compares at the selected viewport width (reference from
  ladder, actual rendered there)
created_by: xgd
created_at: '2026-07-19T02:37:04.031386+00:00'
updated_at: '2026-07-19T02:37:04.031386+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-16f2793c
  kind: behavior
  regression_only: false
---

## Criterion
Running the values-diff command with `--size mobile`, `--size tablet`, or `--size desktop` against a reference bundle that carries a persisted viewport ladder produces a per-element value comparison in which the reference values are those captured at the selected size's width and the reproduction is rendered at that same viewport. A `%`-vs-fixed reflow that is only present at the narrow width therefore appears as a value delta at that size, whereas the same comparison at desktop reports it clean.

## Verification
Run values-diff at `--size mobile` against a fixture bundle whose ladder holds a node with a width-dependent value, and against a reproduction that only matches at desktop; assert the report at `--size mobile` flags that node's delta while the same run at `--size desktop` reports it clean. Confirm the reference values used are the ladder's values at the mobile width.

---
uid: acceptance_criterion-03b2a3ca
id: AC-1396
type: acceptance_criterion
title: The structured editing surface completes inside the Workers runtime against
  real bindings, with no filesystem on its path
created_by: xgd
created_at: '2026-08-31T09:48:04.235806+00:00'
updated_at: '2026-08-31T10:04:12.969052+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-fde7370b
  kind: behavior
  regression_only: false
---

## Criterion

The whole structured editing surface completes **inside the Workers runtime**, driving the cloud
store against real database and object-store bindings, with no filesystem reachable anywhere on
the path.

Editing a copy segment and adding a page, executed in that runtime, both succeed: afterwards the
site holds both pages under their store keys, in load order, and the change count reflects both
edits. Refusals in that runtime carry the same envelope — a code, the path the refusal concerns,
and a hint — as they do on the operator's machine.

This is a claim about *where* it runs, not only that it runs: the editing surface must be loadable
in a runtime that has no build transform, so nothing on its import path may require one.

## Verification

Execute the editing operations from a test running in the Workers runtime, with the real database
and object-store bindings supplied by that runtime, and confirm the resulting pages, their order
and the change count. Confirm the environment is genuinely that runtime rather than the host one.
A regression in what the editing surface imports shows up as this failing to load at all, which is
the point — the alternative is discovering it at deploy time.
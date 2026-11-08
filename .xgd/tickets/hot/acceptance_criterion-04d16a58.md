---
uid: acceptance_criterion-04d16a58
id: AC-2456
type: acceptance_criterion
title: A copy field that addresses no run is refused, naming the field, with no partial
  write
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T13:28:33.562063+00:00'
updated_at: '2026-11-08T13:28:33.562063+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-1e340c9a
  kind: behavior
  regression_only: false
---

## Criterion
An edit whose field name addresses no run of the target node — `text9` on a three-run node, or `text` on a multi-run node (and likewise `text1` on a plain-string node) — is refused with an error that names the field. The document is left unchanged, including any other fields submitted in the same edit.

## Verification
Submit edits with `text9` to a three-run node and `text` to a multi-run node (each alongside a valid field); assert each is refused with the field name in the error and the stored node is unchanged.

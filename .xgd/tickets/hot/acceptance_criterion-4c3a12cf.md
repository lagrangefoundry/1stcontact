---
uid: acceptance_criterion-4c3a12cf
id: AC-2041
type: acceptance_criterion
title: The reference side is read at the viewport the actual picture asked for
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-10-27T20:47:01.059178+00:00'
updated_at: '2026-10-27T20:47:01.059178+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-47fb84e6
  kind: behavior
  regression_only: false
---

## Criterion
A captured reference is read at the viewport the actual picture asked for. When `check_fidelity` judges a mobile actual picture, the reference side is the bundle's mobile ladder screenshot, not its desktop or full-page shot. A reference picture requested at a named viewport resolves to that viewport's ladder member, and its label names the viewport.

## Verification
Seed a bundle with a full-page shot, a mobile ladder member and a desktop ladder member, each a different solid colour. Resolve the reference at `mobile` and at `desktop`. Assert each returns its own ladder member's pixels, not the full-page shot, and that the mobile picture's label contains "mobile".

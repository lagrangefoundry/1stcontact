---
uid: acceptance_criterion-16a01f0f
id: AC-2526
type: acceptance_criterion
title: The draft channel builds no ladder, and a publish with no Images binding (including
  the command line) builds none and is otherwise unchanged
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-09T06:20:50.081652+00:00'
updated_at: '2026-11-09T06:20:50.081652+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-5349d01f
  kind: behavior
  regression_only: false
---

## Criterion

Only a publish builds a ladder. The builder's draft and edit channels never
receive renditions: a draft page renders each picture from its working bytes, as
it did before the ladder existed.

Where the deployment has no Images binding, and when publishing from the
command line against the operator's disk, the publish builds no ladder and is
otherwise unchanged. It mints the same revision with the same rendered bytes it
did before the ladder existed, and it is never refused because no ladder could be
built. This is the one stated divergence between the builder's publish and the
command line's (REQ-222).

## Verification

Render a site holding a wide picture through the draft channel and assert the
page names no `assets/d/` path. Publish the same site with no ladder supplied
(as the command line and an unbound deployment do) and assert the publish
succeeds, writes no `assets/d/` entry, and produces the same rendered pages as a
publish made before the ladder existed.

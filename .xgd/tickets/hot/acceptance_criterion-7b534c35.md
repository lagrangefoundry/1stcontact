---
uid: acceptance_criterion-7b534c35
id: AC-788
type: acceptance_criterion
title: Several instances of one behaviour mount on a page independently, each identified
  and styled per instance
created_by: xgd
created_at: '2026-08-03T03:21:12.414818+00:00'
updated_at: '2026-08-03T03:33:07.557362+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-02f21b8a
  kind: behavior
  regression_only: false
---

## Criterion

A page binding two instances of the same behaviour to two different seams renders
both, each inside its own seam's box, each carrying its own instance identity in
the published markup, and each with styling scoped to its instance so the two do
not collide. Each instance renders the content derived for its own form only —
one instance's fields never appear inside the other's seam.

## Verification

Render a reproduction of a page with two forms and assert: markup for both
instances is present, each stamped with its own instance identifier; each seam's
box contains exactly its own instance's markup; and each instance's controls
match the fields of the form it was bound to.
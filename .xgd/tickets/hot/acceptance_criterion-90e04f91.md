---
uid: acceptance_criterion-90e04f91
id: AC-949
type: acceptance_criterion
title: Copy that a visitor's scrolling would reveal renders visible and editable in
  the edit render
created_by: xgd
created_at: '2026-08-06T21:25:53.547527+00:00'
updated_at: '2026-08-07T18:00:47.647960+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-af36c2cb
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

Copy that the preview render holds in a hidden pre-state until the visitor
scrolls it into view is rendered in its **settled** state by the edit channel:
fully visible, with neither the hidden pre-state nor the marker that a reveal is
pending. Suppressing only the code that performs the reveal is insufficient —
the pre-state alone would hold the copy invisible, and a region nobody can see
is a region nobody can click.

The same copy is a stamped, outlined editable region in the edit render, so it
is not merely present but actually available to edit.

## Verification

Seed a page with copy configured to be revealed on scroll. Render the preview
channel and assert it carries both the hidden pre-state and the reveal marker.
Render the edit channel of the same definition and assert neither appears, that
no fully-transparent pre-state is applied to that copy, and that the copy is
carried by an element stamped as an editable copy region.
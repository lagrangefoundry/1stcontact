---
uid: acceptance_criterion-736a7c58
id: AC-2492
type: acceptance_criterion
title: Applying a state to an edit document sets the markers, opening exactly the
  named panels as overlays and closing the rest
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T23:48:24.023298+00:00'
updated_at: '2026-11-09T00:07:50.005325+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-e214a00d
  kind: behavior
  regression_only: false
---

## Criterion
Applying a state to an edit document *tells* the document; it runs nothing.
1. The scroll offset is applied first, and only if the page is not already at it, so a lock set afterwards cannot swallow it.
2. The ready marker is set on the document.
3. The open marker is set on exactly the shells whose ids are named and removed from every other shell.
4. The scroll lock marker is set while at least one named panel is open and removed otherwise.

The overlay stylesheet's gated rules then lay the named panels out as covering overlays (placement and scrim as in the draft render) and hide the rest. Applying a state with no panel named still sets the ready marker. So every panel is shown closed, as in View, rather than in the settled in-flow form.

Applying a state adds no script, no listener and no acting attribute to the document. A click there still means "edit this". Names that match no panel are ignored.

## Verification
In a DOM environment, load the edit render of a document with two panels. Apply a state naming the first. Then assert:
- The ready marker is present, the first shell is open, the second is not, and the lock marker is present.
- The first panel computes as a fixed covering overlay.
- No `<script>` and no opens/closes attribute exist in the document.

Apply the empty state and assert that both shells are closed, the lock is gone and the ready marker remains.
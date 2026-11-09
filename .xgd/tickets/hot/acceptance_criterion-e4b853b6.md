---
uid: acceptance_criterion-e4b853b6
id: AC-2547
type: acceptance_criterion
title: The image surface (SeeImageEdits read, EditImages write) is offered only where
  the deployment can render, and its prose sets delivery and description expectations
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-09T18:25:56.383449+00:00'
updated_at: '2026-11-09T18:39:14.614372+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-ed976856
  kind: behavior
  regression_only: false
---

## Criterion
A session on a deployment that can render pictures offers an `image` control surface with exactly two groups:
- `SeeImageEdits` (read-only), containing `list_image_edits`;
- `EditImages` (write), containing `edit_image`.

The grant travels with the surface.

The surface's prose states that:
- delivery sizes for the web are produced automatically at publish, so `resize` is not for saving bandwidth;
- a picture's written description describes the original, not the edited picture.

A deployment with no Images binding, or with one that cannot transform, offers no `image` surface: neither operation appears in the session's manual or toolbox.

## Verification
1. Compose a session with an Images binding double that can transform. Assert the manual lists both groups with their effects, and that the overview contains the publish-sizing and description-describes-the-original statements.
2. Compose a session with no binding, and one with a conversion-only binding. Assert neither `edit_image` nor `list_image_edits` is present.
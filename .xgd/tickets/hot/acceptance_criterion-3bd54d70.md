---
uid: acceptance_criterion-3bd54d70
id: AC-2407
type: acceptance_criterion
title: write_image's description gives the three drawing-authoring rules
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T07:16:55.988995+00:00'
updated_at: '2026-11-08T07:26:19.459544+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-d2bee21c
  kind: behavior
  regression_only: false
---

## Criterion
The description of `write_image` that the consultant receives states: (1) a run of styled text is one `<text>` with `<tspan>` children, not several absolutely positioned `<text>` elements; (2) a mark names a real registered font, and `system-ui`, `-apple-system` and bare `sans-serif` are not to be used in a generated drawing; (3) a node meant to be positioned precisely is given an `id`. It also tells the consultant about `assert` and that a render happens only when `assert` is present.

## Verification
Read the `write_image` operation description from the declared surface the consultant is given. Assert it mentions `<tspan>`, names `system-ui` as not to be used, instructs giving positioned nodes an `id`, and describes `assert`.
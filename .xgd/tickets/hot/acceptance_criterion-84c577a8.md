---
uid: acceptance_criterion-84c577a8
id: AC-2568
type: acceptance_criterion
title: Where the host offers nowhere to show a picture, a generated picture's result
  carries no display line and generation still succeeds
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-09T22:39:48.211452+00:00'
updated_at: '2026-11-09T22:48:33.537168+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-39c992d3
  kind: behavior
  regression_only: false
---

## Criterion
If the deployment that assembles the image tool supplies no way to address a piece of material, `create_image` still generates the picture and stores it as material, exactly as it does otherwise. Its result has no `display` field at all (the field is missing, not an empty or placeholder line), and the tool's manual describes no display field. The material's id is all the model can pass on.

## Verification
Assemble the image surface with no material-URL factory and generate a picture. Assert that the generation succeeds and a material is created, that the result has no `display` key, and that the declared manual does not mention `display`.
---
uid: acceptance_criterion-23a7433e
id: AC-2571
type: acceptance_criterion
title: On a host with nowhere to show a picture (the 1c CLI) a drawing is written
  with no display line
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-09T22:39:53.036946+00:00'
updated_at: '2026-11-10T00:54:50.012401+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-b3de4571
  kind: behavior
  regression_only: false
---

## Criterion
On a host that supplies no way to address a site asset, such as the `1c` command-line conversation, `write_image` still writes the drawing exactly as it does otherwise. Its result has no `display` field at all, so the model is offered no line and invents none. It says what it drew in words.

## Verification
Run `write_image` through the toolbox with no asset-URL factory (the CLI host's configuration). Assert that the drawing is written and that the result has no `display` key.
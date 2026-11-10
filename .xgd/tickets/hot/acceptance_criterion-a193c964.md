---
uid: acceptance_criterion-a193c964
id: AC-2570
type: acceptance_criterion
title: The surface (version 9) tells the model to paste a drawing's line verbatim,
  so the picture is part of the turn and survives reload
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-09T22:39:51.459979+00:00'
updated_at: '2026-11-10T00:54:48.950231+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-b3de4571
  kind: behavior
  regression_only: false
---

## Criterion
The served l1 surface declaration is `surface_version` 9, and it tells the model to put a drawing's line into its own reply unchanged:
- the image result shape describes `display` as a line to paste into the reply exactly as written, where the sentence wants the picture, and says it is absent when the deployment has nowhere to show a picture;
- `write_image`'s description tells the model to paste the line word for word. It must not retype it, rename the file in it, or describe the picture instead of including it;
- the surface's `absences` include "Showing a picture any way but pasting the line", which says a tool result is never shown to the user and that only the model's own reply reaches them.

Because the picture is part of the assistant's turn text and not of the tool result, reloading the conversation shows it again. Replaying the transcript replays the picture, and the chat's replay path needs no change for that.

## Verification
Read the declaration the toolbox serves. Assert that `surface_version` is 9, that the image shape's `display` text and `write_image`'s description carry the paste-verbatim instruction, and that the named absence is present. Store an assistant turn whose markdown contains a display line, reload the conversation's transcript, and assert that the replayed turn still contains the line, which renders as an `<img>`.
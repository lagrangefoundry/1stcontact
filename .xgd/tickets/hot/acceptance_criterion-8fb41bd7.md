---
uid: acceptance_criterion-8fb41bd7
id: AC-2031
type: acceptance_criterion
title: A screenshot reaches the model as an image content block inside the same tool
  loop on both hosts, while the call is still validated, gated and audited by the
  Toolbox
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-10-27T19:42:16.975757+00:00'
updated_at: '2026-11-08T04:36:15.001152+00:00'
completed_at: null
last_field_updated: title
status: active
fields:
  story_uid: story-58b2cec4
  kind: behavior
  regression_only: false
  title: A screenshot reaches the model as an image content block inside the same
    tool loop on both hosts, while the call is still validated, gated and audited
    by the Toolbox
---

## Criterion
`screenshot` returns two content blocks:
- a text block naming the picture and its pixel size (e.g. '<label> — W×H');
- an image block carrying the PNG as base64.

When the model calls `screenshot` during a turn, the next request the backend receives in that same turn carries a tool result that contains that image block. It is not a key, path or URL standing in for the image, and it is not a JSON text document with the base64 inside it.

This holds on **both hosts**: the Worker-hosted builder and the `1c` CLI.

The call still runs through the Toolbox like every other tool:
- its input is validated;
- the capability gate applies;
- declared refusals come back as text;
- an audit record of the call is written.

The image is recovered from the Toolbox's rendered result at the host edge. Only a result that holds an array of content blocks carrying an image is converted. Every other tool's result reaches the model unchanged.

## Verification
On each host, drive a consultant turn with the shared model double scripted to call `screenshot` and then answer. Capture the requests the backend received. Assert:
- the second request's tool_result content holds a text block with the size and an `image` block with base64 PNG data;
- no text block in it contains that base64;
- the call appears in the Toolbox audit record.

Also call a non-picture tool in the same session and assert that its result is passed through as text, unchanged.
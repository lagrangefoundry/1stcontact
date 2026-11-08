---
uid: acceptance_criterion-8fb41bd7
id: AC-2031
type: acceptance_criterion
title: A screenshot reaches the model as an image content block inside the same tool
  loop on both hosts, while the call is still validated, gated and audited by the
  Toolbox
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-10-27T19:42:16.975757+00:00'
updated_at: '2026-11-08T10:14:42.660084+00:00'
completed_at: null
last_field_updated: body
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

When the model calls `screenshot` during a turn, the next request the backend receives in that same turn carries a tool result that contains that image block. It is not a key, path or URL standing in for the image, and it is not a JSON text document with the base64 inside it. No text block of that tool result contains the base64.

This holds on **both hosts**: the Worker-hosted builder and the `1c` CLI.

The call still runs through the Toolbox like every other tool:
- its input is validated, and an invalid argument (e.g. an unknown key in the picture) is refused as text before any browser is leased;
- the capability gate applies;
- declared refusals come back as text;
- an audit record of the call is written (on the Worker, flushed to R2 under `audit/<tenant>/<session>/`).

The image is recovered from the Toolbox's rendered result at the host edge. Only a result that holds an array of content blocks carrying an image is converted. Every other tool's result (e.g. `list_pages`) reaches the model unchanged, as a string.

## Verification
On each host, drive a consultant turn with the shared model double scripted to call `screenshot` of the draft, then `list_pages`, then `screenshot` with an invalid argument (`of: {kind: 'draft', colour: 'red'}`), then answer. Capture the requests the backend received.
- **Node** (`tests/reconciliation-assistant-looking-surface.test.ts`): `test_UAT_AC2031_the_backend_receives_the_image_block_in_the_same_turn` and `test_UAT_AC2031_no_text_carries_the_base64_the_toolbox_audits_and_validates_and_other_results_stay_text`, through the real Node host (`openSession` / `streamPrompt`) with the host's audit sink observed.
- **Worker** (`tests/reconciliation-assistant-looking-surface-worker.workers.test.ts`): `test_UAT_AC2031_worker_the_backend_receives_the_image_block_and_the_toolbox_still_validates_and_audits`, inside workerd through the Worker's own `route()` chat routes with real D1/R2 and an injected browser launcher.

On both, assert:
- the second request's tool_result content is an array holding a text block with the size (`60×40` on Node, `32×24` on the Worker) and an `image` block with `source.type` `base64`, `media_type` `image/png`, and PNG data;
- no text block in it contains that base64 or the PNG base64 signature;
- a Toolbox audit record exists for `screenshot` with effect `read`, and one for `list_pages` (on the Worker, read back from R2 for the session);
- the `list_pages` tool result is a string, containing the site's `home` page and no image block;
- the invalid-argument `screenshot` result is a string that names the offending key `colour` and carries no image data, and only one browser was leased in the turn (the invalid call leased none).

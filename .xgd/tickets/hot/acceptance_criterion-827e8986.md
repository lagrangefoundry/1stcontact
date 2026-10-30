---
uid: acceptance_criterion-827e8986
id: AC-2067
type: acceptance_criterion
title: 'A picture from an untrusted-provenance operation reaches the model inside
  the untrusted-content frame: the frame opens before the image and closes after it'
created_by: workflow:fix_reconciliation_review/builder
created_at: '2026-10-30T20:06:12.272134+00:00'
updated_at: '2026-10-30T20:44:50.149792+00:00'
completed_at: null
last_field_updated: title
status: active
fields:
  story_uid: story-58b2cec4
  kind: behavior
  regression_only: false
---

## Criterion
An operation declared `provenance: untrusted` (for example `screenshot`) is rendered by the Toolbox inside the untrusted-content frame (`<<<untrusted>>>` … `<<</untrusted>>>`). When the result is a picture, the host recovers the content-block array from that rendering **and keeps the frame**: the text before the array opens the first block, and the text after it closes the last. The model therefore receives the picture strictly inside the same frame as every other untrusted result, never bare.

- If the first recovered block is text, the opening frame text prefixes it. Otherwise, for example an image first, the opening frame text becomes its own leading text block.
- If the last recovered block is text, the closing frame text suffixes it. Otherwise it becomes its own trailing text block.
- An unframed payload comes back as exactly the blocks it is, with nothing added. A refusal is not a picture and comes back as `null`.

Source: REQ-157 (request-3f8737f2), Grant and safety: "a captured page's text must never be able to read as an instruction". This fixes BUG-316 (bug-d9778adf). Review report-b5be9c7c (F1) directs this rewrite, which replaces the earlier known-gap alignment.

## Verification
**On the wire.**
1. Drive a consultant turn through the real Node host, with the looking surface composed and the shared model double scripted to call `screenshot` and then answer.
2. Capture the request the backend receives next.
3. Assert:
   - the `tool_result` content is an array of at least three blocks;
   - the first block is text and starts with `<<<untrusted>>>\n`;
   - the last block is text and ends with `\n<<</untrusted>>>`;
   - the PNG `image` block lies strictly between them;
   - each marker occurs exactly once;
   - the picture's description (its size) is still in the first block.

**Directly.**
- Run `screenshot` through the composed Toolbox and assert that the rendered text carries the frame. Then assert that `contentBlocksFrom` on that rendering returns `[text(frame-open + description), image, text("\n" + frame-close)]`.
- For a framed payload whose first block is an image, assert a leading frame-open text block, then the image, then the trailing text block with frame-close appended.
- Assert that an unframed payload comes back unchanged, and that a refusal comes back as `null`.

UATs: `test_UAT_AC2067_a_screenshot_reaches_the_model_inside_the_untrusted_frame` and `test_UAT_AC2067_content_blocks_recovered_from_a_framed_rendering_keep_the_frame` (tests/reconciliation-assistant-looking-surface.test.ts).

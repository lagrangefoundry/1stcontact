---
uid: acceptance_criterion-827e8986
id: AC-2067
type: acceptance_criterion
title: A picture from an untrusted-provenance operation reaches the model inside the
  untrusted-content frame
created_by: workflow:fix_reconciliation_review/builder
created_at: '2026-10-30T20:06:12.272134+00:00'
updated_at: '2026-10-30T20:06:12.272134+00:00'
completed_at: null
last_field_updated: created_at
status: active
fields:
  story_uid: story-58b2cec4
  kind: behavior
  regression_only: false
---

## Criterion
A picture handed back to the model from an operation whose result is declared `provenance: untrusted` (for example `screenshot`) arrives inside the same untrusted-content frame as every other untrusted result. Recovering the image as content blocks does not strip the marking.

- **Opening marker:** the frame opens before the first block. The first block is text that begins with `<<<untrusted>>>`.
- **Closing marker:** the frame closes after the image. The last block is text that ends with `<<</untrusted>>>`.
- **Image:** the image block lies between the two markers.

When the frame is carried onto the recovered blocks, each marker joins the block nearest it:
- If the first block is text, the opening marker is prefixed to it. Otherwise the marker is inserted as a new text block in front of it.
- If the last block is text, the closing marker is appended to it. Otherwise the marker is added as a new trailing text block.

## Verification
**On the wire.** Drive a consultant turn through the real Node host, with the looking surface composed and the shared model double scripted to call `screenshot` and then answer. Capture the request the backend receives next. Assert:
- the `tool_result` content is a block array;
- its first block is text that starts with `<<<untrusted>>>`;
- its last block is text that ends with `<<</untrusted>>>`;
- the `image` block sits strictly between them.

**Directly.**
- Run `screenshot` through the composed Toolbox and assert the rendered text carries the frame. Then assert that `contentBlocksFrom` on that rendering returns blocks that still carry it.
- Call `contentBlocksFrom` on a framed payload whose first block is an image. Assert the marker is inserted as its own leading text block.
- Assert that an unframed payload's blocks come back unchanged, and that a refusal comes back as `null`.

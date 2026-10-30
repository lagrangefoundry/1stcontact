---
uid: acceptance_criterion-827e8986
id: AC-2067
type: acceptance_criterion
title: A picture from an untrusted-provenance operation reaches the model as the bare
  recovered blocks, without the untrusted-content frame (known gap, BUG-316)
created_by: workflow:fix_reconciliation_review/builder
created_at: '2026-10-30T20:06:12.272134+00:00'
updated_at: '2026-10-30T20:31:02.643055+00:00'
completed_at: null
last_field_updated: title
status: active
fields:
  story_uid: story-58b2cec4
  kind: behavior
  regression_only: false
---

## Criterion
An operation declared `provenance: untrusted` (for example `screenshot`) is rendered by the Toolbox inside the untrusted-content frame (`<<<untrusted>>>` … `<<</untrusted>>>`). When the result is a picture, the host recovers the content-block array from that rendering, and the model receives **exactly the inner array**: the picture's description text block, then the image block. The frame text around the array is not carried onto the blocks.

This is a **known gap against REQ-157's intent**: "a captured page's text must never be able to read as an instruction". It is aligned to the running code under the review ruling in report-84f2f9bc (F1), because carrying the frame was never granted in this reconcile run. It is tracked as **BUG-316 (bug-d9778adf)**, whose fix rewrites this criterion.

## Verification
**On the wire.**
1. Drive a consultant turn through the real Node host, with the looking surface composed and the shared model double scripted to call `screenshot` and then answer.
2. Capture the request the backend receives next.
3. Assert:
   - the `tool_result` content is a two-block array: a text block naming the picture's size, then a PNG `image` block;
   - no text block contains either frame marker.

**Directly.**
- Run `screenshot` through the composed Toolbox and assert that the rendered text carries the frame. Then assert that `contentBlocksFrom` on that rendering returns exactly the inner array.
- Assert the same for a framed payload whose first block is an image.
- Assert that an unframed payload comes back unchanged, and that a refusal comes back as `null`.

---
uid: comment-9f172bdc
id: COMMENT-4650
type: comment
title: Comment on bug BUG-175
created_by: xgd
created_at: '2026-10-02T04:17:03.314890+00:00'
updated_at: '2026-10-02T04:29:28.788452+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-b8477697
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "8d78a534-4651-44b4-bf17-613d260aea16",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="a6675090-cb5e-40c7-bed7-aef0be2dd4a4-user" -->

<!-- xgd-chat role="user" ts="2026-10-02T04:15:10.859687+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="a6675090-cb5e-40c7-bed7-aef0be2dd4a4-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-02T04:29:26.247356+00:00" -->
#### Claude
Now look at the existing BUG-161 test for the testing idiom.

Fix is applied; I'm writing the UATs now.

Found a browser-free way to build faelan's real reference manifest for the real-bundle leg; checking its shape.

Writing the test file.

Known worktree artifact (control-app `generated/` is gitignored); copying it from the main checkout.

Synthetic legs pass; the faelan leg skips in the worktree (bundle gitignored). Confirming RED without the fix, then running the real-bundle leg in the main checkout.

Faelan leg reproduces the exact `offset is out of bounds` before the fix and passes after; main checkout restored. Running the other `extractRect` callers' suites.

All 30 adjacent suites pass. Checking lint/typecheck and the version-bump mechanism.

No lint script in this repo. Committing the work, then updating the ticket's test plan to reflect the real-bundle leg as built.

Now the merge-back + version bump + free_coded gate (retry loop, per the known tip race).

I've fixed BUG-175. The ticket is now `free_coded` with commits `2d6974ad28` (the fix) and `2f80b6ba89` (version bump to 0.2.436), and the branch is merged into `xgd-working` and cleaned up.

**What was wrong:** `extractRect` assumed whole-pixel boxes. Faelan's image is 205.7px tall, so the buffer was allocated slightly too small and writing the last row ran past its end. That error killed the whole gate.

**What I changed** (`tools/generate/src/cli/perceptual-core.ts`):
- **`extractRect` now rounds boxes outward to whole pixels** (start rounded down, end rounded up) before clamping, so the crop covers every pixel the box touches. Whole-pixel boxes behave exactly as before. Fixing it here also covers its other three callers.
- **`unpaintedImages` now skips boxes with a non-finite, zero or negative size.** One bad record no longer takes down the gate.

**Tests** (`tests/test_UAT_FC_BUG-175_fractional_image_box.test.ts`):
- Four synthetic tests: a fractional crop, a byte-for-byte check that whole-pixel crops haven't changed, a fractional image box going through `unpaintedImages`, and bad boxes being skipped while a good one beside them is still reported.
- One test on the real faelan reference. It only runs in the main checkout, because the reference files aren't in git and are absent from branch worktrees.
- Without the fix, four of the five fail with the same `offset is out of bounds` error from the bug report; with it, all five pass. The 30 neighbouring test files (240 tests covering the crop callers, the gate and the perceptual diff) also pass.

**One change from the ticket's test plan:** the real-faelan test doesn't run `1c gate`. The gate's render step needs Chromium, which the sandbox blocks. Instead it runs `cmdDiff`, the step that crashed, on faelan's real reference data, with the reference screenshot standing in for the reproduction. I've updated the test plan in the ticket to say so.

**Still to do (yours):** restart the consoles and press **[recapture]** on faelan and joyful. Both should now finish with a verdict. Joyful rendering 1700px wide at a 1280 viewport is a separate, older problem and still needs its own ticket.

<!-- xgd-chat-end -->
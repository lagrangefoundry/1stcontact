---
uid: comment-98288b14
id: COMMENT-5793
type: comment
title: Comment on bug BUG-305
created_by: xgd
created_at: '2026-10-28T00:06:53.975812+00:00'
updated_at: '2026-10-28T00:43:49.207738+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-15014772
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "f66908b6-30fe-4958-ac98-39193f161bc7",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-cli-session ts="2026-10-28T00:06:48Z" model="claude-opus-5-5" continued_from="new" -->
*Captured by CLI Claude — paraphrased reconstruction from session memory, not raw capture.*

<!-- xgd-chat role="user" ts="2026-10-28T00:06:48Z" -->
#### You
Issues: 1. a flash between the videos, something has inserted a blank frame. 2. coloured text boxes have no margins, text hard against their edges. 3. I keep saying this - I wish it would make the logo bigger.

<!-- xgd-chat role="assistant" ts="2026-10-28T00:06:48Z" -->
#### Claude
1: the REQ-470 handover swaps src on one video element, showing the poster (the pre-pepper first frame) while the loop loads; fix with a preloaded second element and a seamless cut. 2: filled containers with no padding are valid and unchecked; default inner padding plus a layout-check flag. 3: each test site is a fresh copy; the starting size for a detailed emblem is too modest; give a 96-120px desktop / 64-72px phone starting range.

<!-- xgd-chat role="user" ts="2026-10-28T00:06:48Z" -->
#### You
Yes please

<!-- xgd-turn id="7a5b9e43-8b6e-4454-b07f-bcacb0874eab-user" -->

<!-- xgd-chat role="user" ts="2026-10-28T00:19:50.134444+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="7a5b9e43-8b6e-4454-b07f-bcacb0874eab-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-28T00:43:46.060521+00:00" -->
#### Claude
Ticket is at `free_coding` and the branch is cut. Now I'm reading the renderer's clip script, the padding/fill code, and the layout check.

Writing the new handover in the clip script: a preloaded second `<video>` that takes over at `ended`.

Video handover is in and the existing jsdom suites pass. Next I'm writing the Chromium UAT, which generates two WebM clips in the browser and checks every frame across the join.

Passes. Checking it fails against the old single-element swap:

Old code fails at frame 87 (readyState 0, the poster flash), new code passes. Committing part 1, then on to the padding.

Now looking at how the design seeds its space scale, so the default inner padding can be a step from it.

Now the inner padding: adding a resolve step after components that gives any filled or bordered box/container with no padding the design's `md` step.

Now reading the layout check's existing checks so the new "text against a filled edge" check matches them.

Padding default is in. Now adding the layout check that flags text against a filled box's edge.

Fixing the test's colour value to a valid hex, then running the padding and layout UATs.

Both pass. Now a regression sweep over the design-resolve and layout suites:

Same five failures with identical finding counts before and after, so nothing new from my change. Committing part 2, then running the workers suites that resolve designs.

Part 3: the emblem logo's starting size. Reading the seed's logo sizing.

Changing the seeded emblem size to the new range (72px phone, 120px computer, sized by height), and adding the range to the `brand` tool text.

Now updating the REQ-462 and BUG-289 tests that pinned the old 1.5× scale, and writing the emblem UAT.

Checking whether the BUG-48 failure is pre-existing, and why only two files ran:

Pre-existing on clean working. A quick typecheck of the changed packages:

No type errors in the changed files. Committing part 3, then updating DOC-75.

All three parts are done and tested. Updating the ticket body with what landed, then merging back.

Now the merge-back sequence: lock, merge working into the branch, bump the version, merge, promote.

All three fixes are merged into `xgd-working` and BUG-305 is at `free_coded`: four commits, version 0.2.687, 5 story points. You'll only see them on the dev site after a `bin/deploy --env dev`.

**1. Flash between the videos.** The old handover changed the source on the one video element. That emptied it while the loop loaded, so the poster (the plate before the pepper) showed. Now, once the intro starts, the loop loads in a hidden copy of the clip laid over it. When the intro ends it holds its last frame until the loop is ready to play. Then the loop starts, takes the intro's place, and the intro element is removed, all in one step. Reduced motion, the pause button, the repeat-visit shortcut and pages without script behave as before. A new Chromium test with real clips fails on the old code at the join (a frame where the poster would show) and passes on the new.

**2. Text against the edges of coloured boxes.** A box or container with a visible fill, gradient or border and no padding of its own now gets the design's `md` space step on every side: 16px on a phone, 24px on a computer in the seeded scale. Padding that is set explicitly, including zero, is kept. The layout check has a new finding, `tight_box`, for text within 6px of a filled box's inner edge. It names the box (e.g. `'hero-text'`) and tells the builder to pad it.
- Two exclusions I chose: plain text runs and buttons are left to their components, and boxes copied exactly from a captured site keep their original spacing.
- Sites whose design has no `md` step get no default padding.

**3. Logo size.** A detailed emblem now starts at 120px tall on a computer and 72px on a phone, the top of the range, always sized by height. The old seed was 126px / 65px, a scale-up from the plain-mark size. The 96–120px / 64–72px range is now in the `set_design` tool text and in the design guide (DOC-75). A plain wordmark still starts smaller, sized by width. This only affects new designs: the seed fills in a logo size only where none is set, so Dina's Diner 7 keeps its 72px until it's changed or the site is recreated.

**Tests:** the four BUG-305 UATs pass, along with the design, layout, brand, video and priming suites I ran around them. I updated the REQ-470, REQ-471, REQ-462 and BUG-289 tests to the new behaviour. The REQ-462 test is still named "half as large again"; I left the rename for reconcile. Six tests fail, all of them already failing without these changes:
- BUG-237, BUG-276 (one test), REQ-415 (clean page) and REQ-418 (two tests), with the same number of findings before and after my changes.
- BUG-48 (`every_stated_rule`), which also fails on the main checkout.

<!-- xgd-chat-end -->
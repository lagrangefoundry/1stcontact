---
uid: comment-a4954bf8
id: COMMENT-5582
type: comment
title: Comment on request REQ-440
created_by: xgd
created_at: '2026-10-23T23:48:22.154933+00:00'
updated_at: '2026-10-24T00:07:51.077184+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-7d8f2fac
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "853ed2c1-252d-4ea5-b9e4-f3e16e53c393",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="aaabb2fa-9e7f-465b-8773-6513e1e3f27b-user" -->

<!-- xgd-chat role="user" ts="2026-10-23T23:46:55.694839+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="aaabb2fa-9e7f-465b-8773-6513e1e3f27b-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-24T00:07:48.855467+00:00" -->
#### Claude
Reading the L1 schema, renderer and layout-check framework before I scope the change.

Found the root cause of the fake outline (renderer emits 4-length `text-shadow`, which browsers drop entirely). Now reading the rest of the layout-check runner.

Looking at how the builder's priming text and L1 vocabulary are generated, so the outline guidance lands in the right place.

Now writing the UAT file.

Still a validation error in my fixture; printing it to see which field.

Checking the outlined screenshot to see what Chromium actually painted.

Adding a capture → fold round-trip leg; finding the fold's public entry point.

Now adding the capture → fold round-trip leg to the UAT.

Both failures also occur on clean xgd-working, so they were there before my change. Next I'm checking the builder priming budget tests.

BUG-129 fails with exactly the same figure (200262) on clean xgd-working, so it was already failing and my builder text doesn't change it. Running the builder vocabulary suite next.

Updating the ticket body (appending, preserving the existing spec) before committing.

The append wrote a literal "-". I'll rewrite the body as the original content plus my section.

Ticket body updated. Now committing on the branch.

The merge back and `free_coded` promotion went through on the first attempt. Cleaning up the branch.

REQ-440 is done: it's merged into xgd-working, the ticket is at `free_coded` with commit `a617ecc` and the version bump `def7ece` (0.2.604), and the branch is cleaned up. I didn't need to ask you anything first.

**The fake outline painted nothing at all, not even a blur.** The renderer wrote the `spreadPx` as a fourth length (`text-shadow: 0px 0px 1px 1px #000`). Browsers reject that whole declaration, so it showed nothing. The same was true of every text shadow with a spread, including `spreadPx: 0`. I fixed the renderer to drop spread and inset on text shadows. An older REQ-91 test had locked in the broken output, so I updated it to expect the valid CSS.

**What changed**
- **New L1 axis `textOutline: { color, widthPx }`.** The colour is a hex or palette colour, and the width must be between 0.5 and 4. `widthPx` is the ring you see outside the letters. The stroke is drawn underneath the letter fill, so the letters keep their full weight.
- **Capture round trip.** Capture now records the outline, and the fold turns it back into `textOutline`. I bumped the capture schema to 23. The fidelity diff doesn't score it, just as it doesn't score `textShadow`.
- **New layout check, `over_image`.** It reports text drawn over a picture with nothing between them, unless the text has an outline that contrasts with the letters. A semi-opaque fill or the hero's `overlay` scrim counts as something between. An outline too close to the letter colour gets its own message. It works through the existing check framework, so it holds the build like any other layout fault. Its thresholds are in `layout-check.json`.
- **Builder instructions.** Both versions of the builder's instructions now get one paragraph: text over a picture gets a thin `textOutline` (about 1px, dark round light letters and light round dark) from the start, never a `textShadow`.

**Tests:** all 6 new tests in `tests/test_UAT_FC_REQ-440_text_over_images_is_legible.test.ts` pass, including the ones in a real Chromium. These cover:
- pixel sampling, which shows the ring on the white half and that over 97% of the letter pixels on the dark half are kept;
- the capture round trip;
- the layout check: bare text is reported, outlined or scrimmed text is not, a pale outline is reported, and text over a plain fill is not.

The 52 related test files (REQ-82, every layout-check suite, capture and fold) pass except two tests that fail the same way on clean xgd-working: AC694 and REQ-308's placeholder test. The consultant priming-size test from BUG-129 also already fails on clean xgd-working with the same number (200262, limit 200000). My priming text is builder-only, so it doesn't move it.

**Decision for you:** in Chromium a 1px outline comes out anti-aliased, a fine grey-to-black ring that is visible but light. If you want it stronger, change "about 1px" to "about 1.5px" in the builder paragraph; no code change is needed.

<!-- xgd-chat-end -->
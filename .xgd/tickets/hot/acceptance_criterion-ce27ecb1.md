---
uid: acceptance_criterion-ce27ecb1
id: AC-2572
type: acceptance_criterion
title: An image in a chat message is bounded to the pane's width and a fixed maximum
  height
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-09T22:39:54.540618+00:00'
updated_at: '2026-11-11T02:24:36.497451+00:00'
completed_at: null
last_field_updated: body
status: active
fields:
  story_uid: story-b3de4571
  kind: behavior
  regression_only: false
---

## Criterion
In the builder's chat pane, an image inside a message is laid out as a block that never exceeds the pane's width (`max-width: 100%`) and is at most 260px tall. It keeps its aspect ratio (`width`/`height: auto`), so a tall picture does not push the sentence that introduced it out of view. The full image bytes are still fetched; nothing is made smaller on the wire.

## Verification
Render it, do not read the stylesheet. In a real Chromium, load the builder's own chrome document (`chromeHtml()`, so the same stylesheets in the same order, `builder.css` included) against the assets `1c assets` emitted. Swap only the entry module for a harness that mounts the real assistant pane (`createChatPanel`) in a column the width of the builder's chat pane, then replays assistant turns whose markdown is a 3000×2000 picture and a 1000×4000 picture. Wait until both have loaded, then measure the laid-out boxes. Each picture is rendered with a non-zero size. Neither is wider than the message it sits in or the pane, and neither is taller than 260px. Each keeps its intrinsic aspect ratio. The wide picture is held by the width bound and the tall one by the 260px height bound. Where no Chromium can be launched, the case skips visibly with the reason, as AC-2421's browser case does.

## UATs
- `tests/reconciliation-assistant-picture-in-the-turn-browser.test.ts` — `test_UAT_AC2572_an_image_in_a_chat_message_is_bounded_by_the_pane`: real pane, real builder stylesheets, real browser layout. It asserts the rendered width is no more than the message and pane width, the rendered height is no more than 260px, the aspect ratio is preserved, and both bounds come into play.

## Reconciliation decisions
- The earlier UAT string-matched `builder.css` (reconciliation review G2, report-4f7fbff8). It is replaced by the rendered measurement above, because a source check passes when a more specific rule overrides the bound, when the chat component's classes change, or when the builder page stops loading the stylesheet.

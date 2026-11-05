---
uid: comment-b91b28b5
id: COMMENT-5720
type: comment
title: Comment on request REQ-464
created_by: xgd
created_at: '2026-10-26T00:02:13.922617+00:00'
updated_at: '2026-10-26T00:08:04.199615+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-5fddbe0d
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "c14770c4-27b0-4bf7-b9a8-38f7e18bfa82",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="a531892e-ae78-4ce1-9c32-3e2fbce3e456-user" -->

<!-- xgd-chat role="user" ts="2026-10-26T00:01:42.370170+00:00" -->
#### You
The attachment icon, '+' sign is too far right.

It should be placed so that the distance from its leftmost edge to the edge of the text box is the same as the distance from its top to the top of the text box and its bottom to the bottom of the text box

<!-- xgd-turn id="a531892e-ae78-4ce1-9c32-3e2fbce3e456-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-26T00:07:57.505422+00:00" -->
#### Claude
Found the "+" — it's the framework's composer leading action (webui-chat). Now locating its CSS.

The "+" button's styling lives in lagrange-framework's chat CSS; reading its geometry to work out the correct inset.

Geometry worked out (the "+" sits 18px from the left while the vertical gap is 14px). Studying an existing Chromium layout test to model the UAT on.

Branch cut. Adding the CSS rule and the Chromium UAT.

Checking which webui-chat version the builder actually ships, since the "+" may be typed text rather than the drawn icon.

The new UAT passes with the fix and fails without it (off by 4px). The two neighbouring failures also fail on the unchanged code, so they were already broken. Committing and merging back now.

The "+" now sits the same distance from the text box's left edge as from its top and bottom: 14px on all three sides, where the left side used to be 18px.

**What was wrong:** the text box is 64px tall when empty and the "+" button is 36px, centred top to bottom, which leaves 14px above and below. The chat component placed it 18px from the left, so it sat 4px too far right. The plus is drawn in the middle of its button, so moving the button 4px left lines the visible "+" up the same way.

**Change:** one CSS rule in `apps/control-app/src/builder/builder.css:152` that sets the button 14px from the left. I left the send button (▶) alone. It is still 18px from the right edge, so the two ends of the text box are no longer mirror images.

**Test:** `tests/test_UAT_FC_REQ-464_attach_plus_inset_matches_vertical_gap.test.ts` loads the real builder, lays out the text box in a real Chromium and measures where the "+" lands. It passes with the fix and fails on the old code ("expected 4 to be less than 0.5").

Two neighbouring tests fail, and they fail the same way on the unchanged code, so the CSS rule isn't the cause:
- **BUG-244 test:** it expects the button's text to be "+", but the framework now draws the plus as an image, so the text is empty.
- **REQ-408 "weakest point":** the text it looks for in the site plan output is missing.

The fix is merged into xgd-working, and REQ-464 is at `free_coded` with both commits recorded (version 0.2.652). Promoting it to reconcile is your call.

You won't see the change on the dev site until it's redeployed (`bin/deploy --env dev`).

The 18px left position comes from lagrange-framework's chat component, so other apps using it will have the same misalignment. If you want it fixed for all of them, I can file a ticket there; this fix only changes the builder.

<!-- xgd-chat-end -->
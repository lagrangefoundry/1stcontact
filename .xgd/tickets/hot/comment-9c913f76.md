---
uid: comment-9c913f76
id: COMMENT-5550
type: comment
title: Comment on request REQ-423
created_by: xgd
created_at: '2026-10-21T21:15:13.741062+00:00'
updated_at: '2026-10-21T21:19:14.598453+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-0ca14af3
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "e1ef6189-adad-4058-a323-0d4dc291cf31",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="aef09b81-0bb7-4df6-aa0c-082d1098cd92-user" -->

<!-- xgd-chat role="user" ts="2026-10-21T21:14:30.906115+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="aef09b81-0bb7-4df6-aa0c-082d1098cd92-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-21T21:19:13.685062+00:00" -->
#### Claude
Reading the surfaces and grant code to understand who holds what before scoping the change.

Still mapping the code: now looking at how a drawing becomes a Library item (REQ-404) on the Worker side, and what surfaces builders get.

Still investigating — now checking how generated pictures become Library items (to reuse that path for drawings) and how `screenshot` looks at a Library item.

Design is coming together (drawing becomes a `draw_image` op on the Library surface, reusing the generated-image material path). Checking the `screenshot` side for Library SVGs.

I've read the ticket and traced the code it touches. Two things in the ticket don't match the code as it stands, and how I resolve them changes the design. I'd like your call on both before I write anything.

**1. Builders can't place Library images today.** The ticket assumes builders "still place images (`place_on_site`)". They don't: since REQ-387 a builder gets the Library read-only, so it can read items but not place, re-role or delete them (`host-core.ts`, `readOnlyLibrary`). The consultant does keep `place_on_site` while it's commissioning, because the Library's grant travels with that surface and isn't narrowed.
- **(A), my recommendation:** the consultant draws, looks, places the drawing itself, and then briefs the builder with the `/assets/…` handle. No grant changes, and it's the same way every other Library picture reaches a builder now.
- **(B):** give builders the `PlaceOnSite` group. That reverses part of REQ-387's reasoning, because placing writes `placed_on` onto the client's material record.

**2. What happens to `write_image`.** Once builders lose it and the consultant draws into the Library, nothing needs `write_image` (which writes straight onto the site).
- **(A), my recommendation:** remove it from the L1 surface entirely, along with its group, its sequence and its talker entry. Add `draw_image` to the Library surface. It would:
  - run the same `validateSvg` check;
  - store the drawing through the same code path generated pictures use, so it gets a label (IMAGE-n), a description and indexing;
  - hand back a display line so the client sees the drawing.

  Every draw makes a new Library item. The ticket store can't swap a file on an existing item, so there's no in-place redraw.

  The cost: the existing tests that use `write_image` get ported or retargeted (security, display line, REQ-404's "every picture has a Library item", and the grant tests). We also lose REQ-209's `assert` (relation checks on write). `measure_drawing`, `relate` and `solve` still work on a drawing once it's placed on the site. I'd write the loss of `assert` into the ticket body as an explicit supersession of that REQ-209 acceptance criterion.
- **(B):** keep `write_image` declared but granted to nobody. That's dead code and a second way to draw, so I don't recommend it.

The rest I'll decide as I go:
- **"Look before using":** `screenshot` with `of.image` already shows a stored SVG whole. For "at header size" the consultant looks at the page after the drawing is placed.
- **Priming:** wordmark first, image generation for illustrated marks, hand-drawn SVG only for simple geometric marks.
- **Builder refusal:** a builder asked to draw refuses and points back to the consultant.
- **Talker:** `draw_image` goes on its withhold list.

If you're happy with 1A and 2A, say so and I'll scope the ticket and start.

<!-- xgd-chat-end -->
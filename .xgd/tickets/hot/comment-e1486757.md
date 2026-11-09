---
uid: comment-e1486757
id: COMMENT-8152
type: comment
title: Comment on bug BUG-412
created_by: xgd
created_at: '2026-11-09T20:29:28.493645+00:00'
updated_at: '2026-11-09T20:30:11.821627+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-1c0aef3f
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "e3f3b7e4-7a14-40a0-895f-194bf400cd32",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="654d0d0e-6243-43bc-88a6-36412ee4b222-user" -->

<!-- xgd-chat role="user" ts="2026-11-09T20:27:43.586831+00:00" -->
#### You
Is this covered by BUG-410?

<!-- xgd-turn id="654d0d0e-6243-43bc-88a6-36412ee4b222-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-09T20:30:06.494335+00:00" -->
#### Claude
Yes. BUG-412 is already closed as `wont_fix`, as a duplicate of BUG-410. Both came from the same review of the same rebuild, and comment-b26f984b on BUG-412 records which part of BUG-410 covers each item:

| BUG-412 item | Covered by BUG-410 |
|---|---|
| 1, 2, 4, 5, 7: price and total placement, photo, cut-off prompt, held payment space, labelled summary and order number | §B–D (one shared order-summary block with labels, 72px thumbnails, prompt fits on a phone, minimum height for the payment form) |
| 3: terms line font and position | §C.6 (directly under the payment form, in the site's small type, and the page can place it with `terms`) |
| 6: huge line photos, page wider than the screen | §B |
| 8: Return to checkout | §E |
| 9: inset slot | §G |
| 10: reference and guidance contradict each other | §A and §G (adding the component with no presentation creates the `page` slot; the reference drops `complete`/Continue; DOC-47 describes each mode's default) |

That comment doesn't mention item 10, but BUG-410 covers it.

There are some small differences, none of which needs this ticket reopened:
- **Label wording:** BUG-412 expected "Delivery". BUG-410 uses "Shipping" by default (your call on 2026-11-09), and a site can change the wording.
- **Test coverage:** two of BUG-412's planned checks have no matching UAT in BUG-410's test plan. One is that the page height doesn't change when the payment form loads; the other is that the region prompt is uncut at 375px. BUG-410 requires both behaviours but doesn't test them directly. It may be worth adding those two checks to BUG-410's test plan.
- **Sold piece on the cancelled page:** BUG-410 only says "Return to checkout" appears while the item is still available. It doesn't spell out that a sold piece gets only "Back to the shop", which BUG-412 did.

<!-- xgd-chat-end -->
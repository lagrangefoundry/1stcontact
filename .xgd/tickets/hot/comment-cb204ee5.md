---
uid: comment-cb204ee5
id: COMMENT-7883
type: comment
title: Comment on bug BUG-364
created_by: xgd
created_at: '2026-11-05T23:10:56.383320+00:00'
updated_at: '2026-11-05T23:30:57.310265+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-07767738
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "7f1bb83d-7bf5-4f66-bc75-e204f2a2d53e",
  "role": "chat2",
  "backend": "claude_code+km",
  "filter_tool_use": false,
  "backend_ref": "96b9515a-9c09-47c8-9f8b-545817a4992d",
  "chat_ticket_uid": "bug-07767738"
}
-->

<!-- xgd-turn id="5f57de65dc8841a5abc48e87e05dea1b-user" -->

<!-- xgd-chat role="user" ts="2026-11-05T23:13:52.577451+00:00" -->
#### You
Triggered by: martin-github@westhead.me

Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

<!-- xgd-turn id="5f57de65dc8841a5abc48e87e05dea1b-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-05T23:14:46.994160+00:00" -->
#### Claude
Starting fresh on BUG-364 — summary is empty. Looking up the free-coding protocol and then the overlay renderer.

Reading the L1 renderer's overlay-composition code.

I found the cause, and there's one question to settle before I start a branch.

**Cause:** commit `3fea82eeee` (the BUG-355 fix, landed today at 12:14) changed how an `overlay` section draws a video. The video and its scrim became layers that fill the section (`packages/site-schema/src/l1/design.ts`, the `overlay` case of `composeSection`). That code strips the video's own `sizing`, so the stored `height: fixed 720` is dropped. Once the video is a layer it no longer gives the section any height. This hero's text group is also placed `absolute`, so nothing left in the flow holds the section open. The section shrinks to roughly its padding, about 270px, and the text box and its gradient spill below it. The page data is unchanged; the code change caused it. The scrim is now stretched over the whole shrunken hero too, which adds to the darkness.

**Question: this is the same bug as BUG-365.** Another chat session filed BUG-365 ("Overlay hero with a clip: halved in height and darker since BUG-355's fill layers"). It's still a draft and has no branch cut. It has the same diagnosis and a fuller fix spec:
- the section keeps the picture's stated height or aspect as a minimum height;
- the scrim and the gradient cover what they covered before;
- existing heroes render as they did.

To keep the ticket count down, one ticket should carry the fix and the other should close as a duplicate. Which do you want?
1. **Fix under BUG-364** (this ticket). I'd fold in BUG-365's spec and you close BUG-365.
2. **Fix under BUG-365**, and this ticket closes as a duplicate. Note that BUG-365 belongs to another session, which may be about to pick it up.

Unless you say otherwise, I'll go with option 1. The fix is that when the video states a height or aspect, the composed section gets it as a minimum height at every width, and the scrim stays a fill layer over that box. The tests will reproduce this hero: a fixed 720px video plus an absolutely placed text group, rendered at 1280px, with the section expected to be 720px tall.

<!-- xgd-turn id="681250fb36eb4d0587b6876872dccd3f-user" -->

<!-- xgd-chat role="user" ts="2026-11-05T23:29:31.604457+00:00" -->
#### You
please close as won't fix with an explanation

<!-- xgd-turn id="681250fb36eb4d0587b6876872dccd3f-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-05T23:30:21.398258+00:00" -->
#### Claude
The status change went through, but the body is now frozen, so I'll attach the explanation as a comment instead.

BUG-364 is now closed as **won't fix**.

I couldn't put the explanation in the ticket body: once a ticket reaches a closed status like `wont_fix`, its body is locked. It's attached as a note on the ticket instead (COMMENT-7887). The note says:

- **Cause:** commit `3fea82eeee` (the BUG-355 fix) now draws a video in an `overlay` section as a layer that fills the section, and it discards the video's own stored size. The hero therefore no longer gets its 720px height from the video. Its text group is also placed absolutely, so nothing else holds the section open. It shrinks to about 270px, and the text and gradient spill below it. The page data is unchanged.
- **Why it's closed:** BUG-365 reports the same regression with the same diagnosis and a fuller fix spec, so the fix is tracked there.

No code was changed and no branch was cut. BUG-365 is still a draft, so the fix is still to be done there.

<!-- xgd-chat-end -->
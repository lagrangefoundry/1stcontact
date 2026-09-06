---
uid: comment-5165b19e
id: COMMENT-2291
type: comment
title: Comment on request REQ-193
created_by: xgd
created_at: '2026-09-06T18:10:30.394776+00:00'
updated_at: '2026-09-06T18:40:58.441581+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-bce2b6f9
  kind: chat_transcript
---

<!-- xgd-turn id="0111e3d6-a5e4-453b-80d7-222cded4f6fe-user" -->

<!-- xgd-chat role="user" ts="2026-09-06T18:10:01.868265+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="0111e3d6-a5e4-453b-80d7-222cded4f6fe-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-06T18:40:57.308389+00:00" -->
#### Claude
Now let me look at the builder UI for people (the Users tab) and the identity read of `display_name`.

Ticket is clear and prescriptive. Let me start the free-coding flow.

Now the schema. Editing REQ-190's baseline in place, as its header instructs.

Now the shared name vocabulary module — one definition reachable from both sides of the seam.

Now `people.ts` — the read path through the name table.

Now `setPersonRecord` — the curation surface.

Now the browser panel.

Now the detail pane: the name section plus the explicit name-change dialog.

Now the name-change dialog — the deliberate act.

Now the transport layer.

Now CSS for the new elements.

Now the BUG-54 panel and workers tests, which still assume the flat shape.

Now the workers-side tests that read `users.display_name` directly.

Now the new UATs for REQ-193 — first the model, in workerd against real D1.

Now the REQ-193 workers UAT.

All 23 pass. Now the browser-side UAT for the tab.

REQ-191 landed on `xgd-working` while I was working and touches the same files. Let me commit and merge it in now, while I have full context.

Now the remaining conflicted files.

<!-- xgd-chat-end -->
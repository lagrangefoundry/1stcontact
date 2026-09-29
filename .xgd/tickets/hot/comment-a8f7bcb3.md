---
uid: comment-a8f7bcb3
id: COMMENT-4488
type: comment
title: Comment on epic EPIC-22
created_by: xgd
created_at: '2026-09-29T22:27:11.672057+00:00'
updated_at: '2026-09-29T22:27:11.672057+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: epic-82afdac9
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "68c9c1c2-42fc-4ec0-b707-f3bb6832c652",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="fe88be8d-0bb2-46aa-97bb-c802a1c1bd1e-user" -->

<!-- xgd-chat role="user" ts="2026-09-29T22:26:28.159661+00:00" -->
#### You
Hi, I need you to create a debug tab - for now this can be globally visible but eventually we will want to hide it for normal users.

The tab will have three things:
1) Configuration parameters for the network. Today this is:
 - switch on/off delegate tool calls (see EPIC-20)
 - switch on/off group chat (see EPIC 19)

2) If group chat is on the debug tab should show chat windows for Alice and Bob (their individual windows - not the group window)

Please take a look at the references these are big feature switches, once you have context we should discuss.

Note the Group chat is still very much in-flight so it cannot be switched on today but the frame and the delegate switch can be built as a v1

<!-- xgd-chat-end -->
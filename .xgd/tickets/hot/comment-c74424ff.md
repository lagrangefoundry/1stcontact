---
uid: comment-c74424ff
id: COMMENT-1014
type: comment
title: Comment on chat CHAT-23
created_by: xgd
created_at: '2026-08-15T01:15:33.799432+00:00'
updated_at: '2026-08-15T01:15:33.799432+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: chat-06d47a5c
  kind: chat_transcript
---

<!-- xgd-turn id="d29cc14d-2295-40a1-9cca-7c8094bb7907-user" -->

<!-- xgd-chat role="user" ts="2026-08-15T01:15:28.249394+00:00" -->
#### You
I would like to discuss the creation of a login module. This should be created for inclusion in 1stcontact sites but also used by the 1stcontact application itself.

I believe we had a design. The proposal for v1 was passwordless login by email magic link. So sign-up and sign-in are almost identical the difference is just that sign-up requires T&C acceptance.

Note as part of this we will need to create an account object. lets discuss the right data model (account/user/email etc) bearing in mind that CRM-lite is our next feature (I expect). Please review the existing docs on this and consult the chat about email capture

<!-- xgd-chat-end -->
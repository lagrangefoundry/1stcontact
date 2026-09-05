---
uid: comment-761b2db1
id: COMMENT-2283
type: comment
title: Comment on chat CHAT-38
created_by: xgd
created_at: '2026-09-05T21:21:03.349099+00:00'
updated_at: '2026-09-05T21:21:03.349099+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: chat-8529c537
  kind: chat_transcript
---

<!-- xgd-turn id="eb39b545-a64a-4ac1-ad36-7c86c51bc230-user" -->

<!-- xgd-chat role="user" ts="2026-09-05T21:20:53.464054+00:00" -->
#### You
The product is called 1st contact our representation of contacts is CRITICAL. Right now our schema is very amateur. Lets take a moment to discuss.

I just proposed some changes to the representation of email see the last turn or two on the "Login" chat.

Lets talk about Name we will also need addresses and phone numbers - not short term but lets think ahead

Immediate converstion:

Representation of names I know this is a super complicated topic when you get into the full internationalization and all the variance. I have read some very interesting blog posts about the corner cases and representing names. However, I want to hit a happy medium I do not want to over design this. I think we should at least have first name and last name, we should probably have title and suffix (title is not used much in the US but it is common in the UK were some of our customers are, we need titles like Dr, Cpt, Rev etc). For the US we need suffixed (Jnr, Snr - do we need 2nd, 3rd, 4th?). Do we need middle initial too? 

People's names change, the data model needs to accommodate - we should store old and new - so name is a table like email

<!-- xgd-chat-end -->
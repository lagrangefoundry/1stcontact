---
uid: comment-2f0ecec4
id: COMMENT-1145
type: comment
title: Comment on chat CHAT-27
created_by: xgd
created_at: '2026-08-18T17:40:16.676796+00:00'
updated_at: '2026-08-18T17:40:16.676796+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: chat-e700744f
  kind: chat_transcript
---

<!-- xgd-turn id="2ff3d666-40bc-4d4d-882e-a364b3179aad-user" -->

<!-- xgd-chat role="user" ts="2026-08-18T17:40:12.340857+00:00" -->
#### You
As you can see we are going through the process of taking the fledgling site builder system and porting it to Cloudflare... this was always the design of course. I am keen to do this now so that we don't inadvertently create local dependencies and are application is configured for cloud from this early stage. However, I wanted to have a conversation about where this leaves us in terms of our (my) work flows.

The most critical workflow is the creation of the first contact application itself. This creation obviously needs to happen locally on my laptop and I need to be able to test and demonstrate that it works before uploading to the cloud. Can you clarify what this build compile deploy cycle looks like. Are we building the tools that are needed? Are there any gaps?

The second workflow that I am curious about is website creation. The next couple of websites that I create I will probably do in the cloud just to prove to myself that the tool is usable in that context. However I expect that we need to develop a number of example sites – maybe a couple of dozen for example? This may involve some automation as well as my oversight. I imagine that this will actually take place on my laptop and the finish sites will get uploaded. So setting aside the questions of how the sites would actually be created because that is an engineering problem in its own right, I wanted to check that once a site was created locally that it could be uploaded to the cloud painlessly.

<!-- xgd-chat-end -->
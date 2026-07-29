---
uid: comment-cbcad23e
id: COMMENT-588
type: comment
title: Comment on chat CHAT-11
created_by: xgd
created_at: '2026-07-29T19:29:56.387350+00:00'
updated_at: '2026-07-29T19:29:56.387350+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: chat-66d44613
  kind: chat_transcript
---

<!-- xgd-turn id="d2dbd500-5b10-4a43-bcb5-097b9a627e50-user" -->

<!-- xgd-chat role="user" ts="2026-07-29T19:29:54.374093+00:00" -->
#### You
We have a couple of sites now GigabyteAlchemy and xgd that are getting close to being ready to publish. I want to discuss the migration of the sites to Cloudflare

I want to keep moving us progressively towards the 1stcontact application so when we design the solution for this ticket it is intended to be a step towards that NOT a throw-away exercise. Please read the design documents to get oriented.

We are still creating sites locally on my laptop. I would like to continue to use this mechanism for site creating and modification, for now, but I would like to explore exposing the draft site on Cloudflare. I expect draft sites to appear under the 1stcontact.io domain something like https://1stcontact.io/site/gigabytealchemy_ai/draft/<SHA> the SHA is to make the URL hard to guess so people really need the link the "gigabytealchemy_ai/draft/" is possibly unnecessary but makes the link readable.

I am thinking that to move the sites in a way that is not throwaway we probably want to move the canonical store. Although maybe that is a second step - phase 1 we could copy them there - what do you think?

<!-- xgd-chat-end -->
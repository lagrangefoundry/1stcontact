---
uid: comment-be13ecf2
id: COMMENT-2288
type: comment
title: Comment on chat CHAT-40
created_by: xgd
created_at: '2026-09-06T18:07:08.297924+00:00'
updated_at: '2026-09-06T18:07:08.297924+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: chat-e6435d6a
  kind: chat_transcript
---

<!-- xgd-turn id="f33fa294-5f40-4e99-9682-c7d3f5c3a26c-user" -->

<!-- xgd-chat role="user" ts="2026-09-06T18:06:56.406958+00:00" -->
#### You
Let's talk about site addressing. That is "What are the url[s] that can take someone to the site?"

I think there are various forms:
1) We need a "logged-in only" access to the draft site - this is what happens when you hit "Open in new Tab" on the site tab.
2) We probably need a short domain for people who don't (yet) have a domain e.g. alicesplumbing.1stc.site or alicesplumbing.1stc.io (both these second level domains are available)
3) Fully publish to their own domain - xgd.dev, alicesplumbing.com

I just had conversations on REQ-190 about slugs and uniqueness (please read the transcript) I want to have a conversation here to put all this in perspective.

I THINK the only situation we need unique slugs for is 1 and we can use the hash for that.

Obviously 2 requires global uniqueness but that's ok the user can choose that if they need it. We might buy a couple of 2nd tier domains for this purpose

<!-- xgd-chat-end -->
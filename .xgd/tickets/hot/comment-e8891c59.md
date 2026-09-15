---
uid: comment-e8891c59
id: COMMENT-3001
type: comment
title: Comment on epic EPIC-5
created_by: xgd
created_at: '2026-09-15T00:39:51.674778+00:00'
updated_at: '2026-09-15T00:39:51.674778+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: epic-c5175c8f
  kind: chat_transcript
---

<!-- xgd-turn id="e75729eb-a1aa-4793-8a34-64ecab6869c6-user" -->

<!-- xgd-chat role="user" ts="2026-09-15T00:39:24.117178+00:00" -->
#### You
ok lets start to discuss the product specs for this ticket.

I want to start by expanding the scope slighty - there is a related requirement to choose the 1stc.site hostname. That's a user experinence that we need to design, and the first piece of this epic that I would like to take on - but before we dive into those details lets talk about the broader questions

I believe we have basically the following scenarios:
1. User has no domain - they use domain.1stc.site that is the first experience we will build - I think the only thing here is a UX to choose a unique name
2. User bought a domain through us - domain registra functionality is a whole separate epic with a lot of details to handle BUT we have multiple sites today where I own the domain (on my cloudflare account) and I would like to publish those sites and I think that is the same situation as if the user bought the domain from us
3. User owns a domain through some provider. I believe this is (a) we need a flow to move their DNS to us and then (b) this becomes the same as 2.

A special case of 3 is where the users domain's registra is Cloudflare but I don't actually a separate case, I think its the same based on what we discussed earlier. We will need to provide detailed instructions with screenshots of how to do the change.

So (1) is just a UX experience
(3)a is its own flow, copy the current state, document how to change, let the AI guide the user - tools for checking success etc.
(3)b is 2 (please confirm)

So I would like to discuss (2) what management do we need to expose to the user? I think would like the answer to be just a selector - here is the list of domains that we control the DNS for you. please select which one this site should be published on...

Interestingly (1) the list as at an account level not a business level (2) we need to manage exclusivity - one site per domain

As we configure web, we should also configure email send to go through out resend system.

How you should respond:
 - do you agree with the framing? Any big categories of functionality I missed
 - can we discuss first what config is needed for 2

<!-- xgd-chat-end -->
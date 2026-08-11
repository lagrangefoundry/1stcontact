---
uid: comment-2c16318b
id: COMMENT-915
type: comment
title: Comment on chat CHAT-21
created_by: xgd
created_at: '2026-08-11T21:32:20.668310+00:00'
updated_at: '2026-08-11T21:32:20.668310+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: chat-2aaa79f4
  kind: chat_transcript
---

<!-- xgd-turn id="2a98ebbc-a997-4268-9cbe-7a49521d8b5e-user" -->

<!-- xgd-chat role="user" ts="2026-08-11T21:32:16.623723+00:00" -->
#### You
Please read DOCs 31 and 32 and CHAT-20.

In this chat we are going to design a playbook for the core interaction that our AI builder will have with a client. We will create the playbook as a system document to be included in the system build and we will build it into the knowledge base of the product (see REQ-123).

We need to anticipate mutiple different starting points for the conversation:
 - User has an existing site - provide the URL use messaging and assets and look and feel as a starting point - aim is to improve it
 - User has some content, documents, pictures, a logo etc 
 - User has a brand and positioning
 - User is really starting from scratch - we assume that the at least have a product - but don't even have branding.

We want to create a template to get the AI to guide the user through the decision making process of creating a site. As the user makes decisions the AI adds them to the draft site that they can both see - the user can watch this grow over time.

AI resources are costly so the conversation needs to be bounded - my guess is that we have a LOT of headroom - I am thinking we could reasonably charge $200 for a 4-5 hour session that would create a site - I think the cost of that session's tokens would be >$20. Obviously these figures need to be explored - I may be charging too much and I may be underestimating costs.

I imaging the conversation goes through stages like:

1. Agree on the purpose of the site - customer acquisition? Email capture? Lead generation?
2. Agree on the product concept and key differentiation
3. Agree on brand philosophy and high level messaging
4. Initial content creation - brand messaging
5. refinenment
6. Design and layout
7. refinement
8. Special effects

?

<!-- xgd-chat-end -->
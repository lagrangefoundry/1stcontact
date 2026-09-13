---
uid: comment-cd9c1549
id: COMMENT-2884
type: comment
title: Comment on epic EPIC-10
created_by: xgd
created_at: '2026-09-13T00:19:33.278873+00:00'
updated_at: '2026-09-13T00:19:33.278873+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: epic-d6d7ea63
  kind: chat_transcript
---

<!-- xgd-turn id="c5228fc5-11c5-4c8f-9c8b-19e873a2ed2f-user" -->

<!-- xgd-chat role="user" ts="2026-09-13T00:19:19.642309+00:00" -->
#### You
Ok lets discuss the email capture functionality. There are some things live but lets put aside implementation for a second and discuss requirements.

I want to be able to configure business-specific settings to be associated with a contact - all businesses need t_and_c_accepted, privacy_policy_accepted for first contact I need: beta_asked for xgd I need newsletter, whitepapers - all of these are recording requests or acceptances of the user. Each one means that a user clicked a button and/or checked a box.

Lets call these T/F properties user acceptances - lets start with system defined ones that the business can use or not. We may choose to add custom per-business acceptances later. 

In time these will generalize beyond T/F values to real onboarding surveys.

Each checkbox going to T is an event in the contact event log.

Then the email capture module needs to do the following:

1. Capture the email entered in the box and add it to the contact list
2. Based on configuration of the module set one or more user acceptance to T (acceptances implied in jut hitting the button)
3. Based on checkboxes that the user checks set one or more user acceptance to T (addition optional opt ins)
4. Send a configurable email to the users account this email can contain:
 - a difficult to guess link to a "hidden" page with capture content (e.g. whitepapers)
 - a sign in link
 - just a welcome message

Please investigate the state of the implementation and then lets discuss the product then the design

<!-- xgd-chat-end -->
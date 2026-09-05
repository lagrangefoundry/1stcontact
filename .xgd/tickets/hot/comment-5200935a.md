---
uid: comment-5200935a
id: COMMENT-2286
type: comment
title: Comment on chat CHAT-39
created_by: xgd
created_at: '2026-09-05T22:42:15.049823+00:00'
updated_at: '2026-09-05T22:42:15.049823+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: chat-998e7ab3
  kind: chat_transcript
---

<!-- xgd-turn id="5877f09b-712a-476c-a9f7-2ccbb8d1d95e-user" -->

<!-- xgd-chat role="user" ts="2026-09-05T22:42:05.719812+00:00" -->
#### You
OK, so we have most of the infrastructure that we now need in order to start seriously discussing how to create the basic on boarding flows I need for my early beta trials.

The flow must start in my view of users in the 1stcontact app.

I think "Invite" is the wrong action - the first and more fundamental is add - so I need a "+" CTA that pops up a model to add a Contact (important naming - the general term here is no People, Users, Customers it is "Contact" - I hope our table has that name)

Next once I have them I need to "Invite" them. I am not sure that this is a general action beyond the beta flow but lets assume it will be for now. So each row in the item list needs a check box, I check N and click the "Invite" button (which should be disabled unless there is at least one box checked). Invite pops up a modal which is an email form, With a From, Subject a To-List that lists the email addresses (note this will be sent as N emails hence To-List: not To: - I'd like a mouse hover on the To-List that explains this - basically we do not want to give contact emails to each other), and a body - the body must come from a new ticket type "template" we will manually create a ticket for this for now. Critically it needs to contain a welcome message and a CTA with an button and a "cut and paste this link if that doesn't work"

The link will take them to a sign-up page - agree to the T&C (we do not have text right now - leave that until later - use Ipsum Lorem or some  place holder text - make sure it DOES NOT look like T&C) and then they should get through to the app.

Secondary flow: we also need a similar flow for when their login expires

We need a placeholder 1c site page it can say nothing for now (stealth mode ;-) ) but it should have top right a Sign In link - clicking Sign In -> modal Enter your email -> Please check your email for a sign in link. Sign in template used - clicking the link signs the user in.

Signed in user on 1stcontact.io should see the stealth mode home page with links at the top right "My Businesses", "User Portal Icon"

<!-- xgd-chat-end -->
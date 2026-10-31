---
uid: comment-933c60e2
id: COMMENT-5791
type: comment
title: Comment on epic EPIC-28
created_by: xgd
created_at: '2026-10-27T23:10:47.170745+00:00'
updated_at: '2026-10-28T00:09:18.986050+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: epic-7c85d456
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "6442bc55-a1f9-4cdb-ab47-f0ee0702ef51",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="6c829bc6-1859-44ea-9be7-f91e2c70994d-user" -->

<!-- xgd-chat role="user" ts="2026-10-27T23:09:17.001842+00:00" -->
#### You
Lets talk about this feature - do you have any questions?

<!-- xgd-turn id="6c829bc6-1859-44ea-9be7-f91e2c70994d-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-27T23:13:29.740098+00:00" -->
#### Claude
Reading the related tickets so my questions are informed rather than generic. One more lookup, then the questions.

I've read EPIC-28 and the tickets around it. One thing has changed since the epic was written, then my questions. Each has a recommendation so you can just say yes or no.

**Already settled:** First ticket #5 calls the Access / one-login question open. REQ-475 has since answered it, and is at `ready_to_reconcile`: testers sign in through 1st Contact's own magic link, and Cloudflare Access stays on operator paths only. So #5 is now only the consent notice plus how a tester gets invited.

**Questions**

1. **How does a tester become a contact?** For feedback to land on the tester's contact page, their platform account has to be linked to a contact record in the 1st Contact business. Does that link exist anywhere today? If not, should every sign-up create a contact there automatically, or only accounts you flag as testers? I'd recommend auto-creating one at sign-up and linking it by verified email. That link is the foundation for parts 1–3, so it might deserve its own first ticket.

2. **Do we mark who is a tester?** Should the account carry a beta-tester flag, or is everyone a tester for now? The flag decides who gets the consent notice, who sees the Feedback button, and whose sessions get the timeline. I'd add the flag, so that when real clients arrive the review machinery doesn't silently cover them too.

3. **What counts as a "session"?** The timeline needs a boundary. Is it one sign-in, one site from start to finish, or a stretch of activity ended by an idle gap (say 30 minutes)? I'd suggest the site is the unit and sessions inside it are split by idle gaps. Abandon points then fall out naturally.

4. **Waiting versus active needs data we don't collect yet.** Server-side records show when the consultant or builder was busy. They can't tell "reading the reply" from "walked away". Telling them apart needs browser signals: tab visibility, focus, typing. That is new collection, so the consent notice has to mention it. Shall I include it? I'd say yes, but only coarse signals: visible/hidden and typing yes/no, never what was typed.

5. **Which chat areas get the button?** The builder has the Site consultant plus other assistants (Settings and so on). Should Feedback sit in every chat panel and record which assistant it was, or only in the consultant's? I'd put it in every panel.

6. **Should feedback include a preview screenshot?** "Something looks broken" and "doesn't look the way I wanted" are hard to review without seeing what the tester saw. Should a submission also capture a screenshot of the preview, or the page/mode reference alone? I'd capture it; renders are cheap.

7. **What does "review with Claude" look like?** I have two options in mind. Which do you prefer?
   - **(a)** A CLI export (`1c session export <tester>`) that writes one Markdown or NDJSON file. You then open it in a Claude Code session.
   - **(b)** A view inside the operator side of the product.

   I'd recommend (a) first: it's cheaper and fits how you already work, and (b) can come later. Either way, the export has to be written to a file rather than piped, because `1c --json` truncates piped output at 64 KB.

8. **Consent: once, or with each review?** I'm assuming the consent notice is a beta clause added to the terms the tester accepts at sign-up, under the existing terms-acceptance flow. Testers are told once that their sessions are reviewed, including with AI tools; there is no per-review prompt. That matches DOC-5 principle 26 (disclose the design, not each tool call). Is that the footing you want, and should testers also be able to export or delete their session themselves at this stage?

A small one: does the cost per session in the timeline include builder spend? Builder turns have no `turn_spend` row, so it would have to come from the per-request spend rows. I'm assuming yes, and that cost is shown to you only, never the tester.

Once you've answered, I'll update the epic body and cut the first child tickets. Children do the building; this session doesn't write code.

<!-- xgd-turn id="fd57aa80-32eb-4793-830d-c38a12921a1d-user" -->

<!-- xgd-chat role="user" ts="2026-10-27T23:58:37.490185+00:00" -->
#### You
**How does a tester become a contact?** For them to be invited to the site and be able to log in they need to be a contact

2. Everyone is a tester now

**What counts as a "session"?** Why does that matter are you thinking of the cost? In that context it is the current cost of the site all the time that has gone into creating it.

4. Our set up at this point is extremely compolicated there is a worker with delegates and a talker - MANY concurrent sessions - I am noit sure why we are proposing to worry about wait time AND we need to be carefuyl to define exactly what we mean - lets discuss this one please
5. All chats
6. OK
7. out of scope for now

1. Consent will be part of the T&C

I'm actually unsure why we want to capture cost I suggest we drop it.

Understanding session length might be useful though - did the user just sit down or were they working for hours before they hit their issue

<!-- xgd-turn id="fd57aa80-32eb-4793-830d-c38a12921a1d-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-28T00:01:05.283887+00:00" -->
#### Claude
Now I'll write the settled answers into the epic, leaving #4 marked open.

I've written your answers into EPIC-28. Changes:

- Cost is dropped from the epic.
- Session review is marked out of scope for now.
- Everyone is a tester.
- Testers are contacts before they can sign in.
- Consent goes in the T&C.
- Feedback goes in every chat panel and includes a preview screenshot.
- The child-ticket list is down to four: the Feedback button, feedback on the contact page, the timeline, and the T&C clause.
- Waiting vs active is marked open.

**Why "session" mattered:** it was never about cost. Your session-length question is exactly why the boundary matters. "Had they been working for hours?" needs a rule for where a session starts. I'd say a session is a run of tester activity, and a gap of about 30 minutes with no message or click from the tester ends it. Each feedback entry would then record two numbers: minutes into this session, and total time on the site so far. Both can come from timestamps we already store, so this adds no new data collection.

**On #4, waiting vs active.** You're right that "waiting" isn't defined, and I think that's because I mixed two different things:

1. **System activity.** The talker, the worker and its delegates are often all busy at once. "Waiting on builders" isn't a state the tester is in: the consultant can keep talking while builders work. Measuring this is about how the system behaves, and it belongs to EPIC-19/EPIC-20 instrumentation, not here.
2. **What the tester experiences.** From their side there is really only one blocking wait: they've sent a message and nothing has come back yet. That is well defined: the time from the tester's message to the first visible reply text in the same panel. One number per message, per panel. It doesn't care how many sessions run behind it.

The other half, "reading vs walked away", can't be told apart without browser signals, and I don't think we need it. The idle gap that ends a session already catches walk-aways well enough.

**My proposal:**
- Drop "waiting vs active" as a deliverable.
- In its place, have the timeline show **reply time** per tester message: the time until the first visible reply in that panel.
- Leave the "This is taking too long" option in the feedback form to say when a wait actually hurt.
- Collect no browser activity signals.

Does reply time mean what you'd want "waiting" to mean? Or were you after something else, like how long until a requested change actually appears in the preview? That second one is the other well-defined wait. It's harder to measure because builders finish out of order.

One check on testers as contacts: I've assumed a contact signs in with the email on their contact record, and that this is what ties their feedback to them. I'll confirm that against the invite code when I cut the first child ticket.

<!-- xgd-turn id="523eea20-34da-4e71-91b5-df0ac8276fd6-user" -->

<!-- xgd-chat role="user" ts="2026-10-28T00:03:54.153948+00:00" -->
#### You
Sounds good

<!-- xgd-turn id="523eea20-34da-4e71-91b5-df0ac8276fd6-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-28T00:05:21.872694+00:00" -->
#### Claude
Now the check I promised: how an invited contact maps to a signed-in account.I've added reply time to EPIC-28. The epic now says:

- **Measured:** stage durations, session length, reply time, idle gaps and abandon points.
- **Not measured:** waiting vs active. The epic records why.
- **No browser activity signals** are collected.

Reply time means: for each tester message, the time until the first visible reply in that chat panel.

**Testers as contacts: checked in the code, and it works the way we need.**
- Inviting someone starts from their contact record.
- When they sign in, the session belongs to that same contact.
- On any signed-in request, the app already knows which contact it is.
- Contact history entries are already written for that contact. Feedback entries can go in the same way, so the contact link needs no ticket of its own.

One limit: this only holds for contacts in the 1st Contact business itself, because sign-in always looks people up there. Invites sent from other businesses take a different route that I haven't followed. That doesn't matter for testers.

The epic's child-ticket list is now four:
1. The Feedback button in every chat panel. Pressing it records where the tester is, a preview screenshot and session time, and shows the multi-select form.
2. Feedback entries on the contact page in Contacts.
3. The per-tester timeline.
4. The T&C clause on reviewing beta sessions.

Shall I create those four tickets now? Or would you rather fold some together? For example, 1 and 2 could be one ticket, since feedback isn't useful until you can read it.

<!-- xgd-turn id="e5412970-e71b-47cc-9d5e-1c4af1421490-user" -->

<!-- xgd-chat role="user" ts="2026-10-28T00:08:19.207762+00:00" -->
#### You
Can you create the smallest reasonable number of tickets please?

<!-- xgd-turn id="e5412970-e71b-47cc-9d5e-1c4af1421490-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-28T00:09:16.647651+00:00" -->
#### Claude
I've created two tickets, both children of EPIC-28 and both at `draft`:

- **REQ-479, the Feedback button.** It goes in every chat panel and opens the multi-select form. Each submission records where the tester was, a screenshot of the preview, and their time in the session and on the site. Submissions show up in the tester's history on their contact page. The beta clause in the T&C is part of this ticket, because it has to ship before any feedback is collected. Estimated at 8 points.
- **REQ-480, the session timeline.** It shows on the contact page: sessions and their length, time in each stage, reply time per message, idle gaps and the abandon point, and how often each assistant was used. It explicitly leaves out cost, waiting vs active, and browser signals. Estimated at 5 points.

The timeline stays separate because it needs no change to the chat panels and can be built in parallel. Both tickets use the same session rule, a 30-minute idle gap.

Decision for you: the terms text is still placeholder text. The feedback ticket adds the beta clause and changes the terms version, so every existing user is asked to accept the terms again on their next visit. That's correct for consent, but it means the real terms don't exist yet beyond that one clause. Say if you want the real text written before testers arrive.

EPIC-28 now lists both children. Nothing has been promoted beyond `draft`.

<!-- xgd-chat-end -->
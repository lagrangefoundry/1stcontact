---
uid: bug-bdfc3dd0
id: BUG-240
type: bug
title: Worker dives into work without answering the client's question; open a talker
  on the same message, and don't repeat it at hand-back
created_by: EPIC-19
created_at: '2026-10-21T00:47:40.966334+00:00'
updated_at: '2026-10-21T00:47:40.966334+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  severity: medium
  priority: high
  story_points: 5
  epic_parent: epic-95bc3b15
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-73624890
---

## Symptom (Bob's Salon 3, 2026-10-21 00:38)

The client wrote: "The movement is good we could have a little more, like with
the top photo - what's next". The consultant's round issued a builder
(`Delegate`) as its first act and showed only the status note ("Adding a gentle
opening movement…"). The question went unanswered; the client had to ask "What's
next?" again, which opened a talker (REQ-416) that answered well. When the worker
finished it answered "Next: colours and fonts" again, repeating the talker.

Two defects: the worker **dives into work without answering** the conversational
part of a mixed message, and its **hand-back repeats** what the talker already
said.

## Operator direction (2026-10-21)

> Can we tell when the AI dives into work mode? could we resend the prompt in
> talker mode? … it feels like there is an opportunity.

## What changes

1. **Detect the dive.** The host marks a round as having gone to work without
   replying when its first tool withheld from the talker (REQ-416's list:
   `Delegate`, site writes, looks, images, publish, `set_stage`) is issued before
   any client-visible text other than the status note.
2. **Open a cued talker on the same message** (needs lagrange-framework
   **REQ-215**). At the dive, the host opens a talker round with a hidden cue:
   the worker has taken the building part of the client's last message (quote
   the status note); answer anything else the client asked; if nothing else was
   asked, acknowledge in a line and ask one story question; if there is nothing
   useful to say, pass. The client gets a reply within seconds, and the
   build-time conversation always starts — the story interview no longer waits
   for the client to speak again.
3. **The worker's hand-back doesn't repeat the talker.** Priming for the worker's
   final result: anything the talker already told the client in this round
   (delivered to you as the observed brief) is not said again; refer to it at most
   ("as I said, next is colours and fonts").
4. **Interim priming rule, landing with this ticket:** when a client's message both
   asks something and asks for work, answer the question in a line or two first,
   then start the work. (Kept after item 2 lands: it covers rounds without a
   talker, e.g. group chat.)
5. Mixed messages are common; this must not fire a talker when the round replied
   to the client before its first withheld tool, and must not fire more than once
   per worker round.

## Test plan
- A scripted round whose first act is `Delegate` with no prior text triggers one
  cued talker round; a round that writes a reply first does not.
- The cued talker answers a question in the triggering message; on a pure build
  request it may pass, and nothing is shown.
- The cue never appears in the transcript or chat.
- The worker's final result priming contains the no-repeat rule; the consultant
  priming contains the answer-first rule.
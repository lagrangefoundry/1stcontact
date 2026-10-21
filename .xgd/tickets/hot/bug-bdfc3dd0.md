---
uid: bug-bdfc3dd0
id: BUG-240
type: bug
title: Worker dives into work without answering the client's question; open a talker
  on the same message, and don't repeat it at hand-back
created_by: EPIC-19
created_at: '2026-10-21T00:47:40.966334+00:00'
updated_at: '2026-10-21T01:31:56.624513+00:00'
completed_at: null
last_field_updated: body
status: free_coding
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

## As built

- **Detecting the dive** (`cadence-core.ts`, `keepClientOriented`): in a worker
  (non-talker) round, the first `tool_issue` for a tool on `talker.json`'s
  `withhold` list, issued before the model has streamed any non-blank text,
  calls a new `dived(note)` hook with the status note that call put up (the
  `Delegate` note or slow-tool line, else `''`). At most once per round; a
  round that wrote a reply first never fires it. The host's own lines (the
  Delegate announcement) don't count as a reply.
- **Once per client message** (`host-core.ts`): the hook keeps a cue for the
  site; a continuation round (REQ-409) on the same message does not get a
  second one. A cue left over from an earlier round is dropped when the next
  round starts.
- **Opening the cued talker** (`host-core.ts`, `talkerDesk`): on its next poll
  (not the slower inbox cadence) the desk calls `manager.cueTalker(sessionId,
  talkerCue(note))` if the worker is still forkable, sharing the same
  open/meter path as a message-opened talker (talker-round count for the
  talker reminder, frames, its own spend row). If the worker has already
  closed, or the round finished before a poll, nothing opens.
- **The cue's words** (`priming.json` templates `talker-cue`,
  `talker-cue-taken`, `talker-cue-taken-unnamed`; `roles.ts` `talkerCue`):
  "[The host, not your client: the build now running has taken the building
  part of your client's last message (the status beside the chat reads
  "<note>"). Answer anything else they asked in that message, in a line or two.
  If they asked nothing else, acknowledge the request in a line and ask one
  question about their story. If there is nothing useful to say, pass.]" The
  framework's talker reminder says how to pass (`[nothing to add]`). The cue is
  recorded nowhere (REQ-215): not in the transcript, the chat, or the worker's
  brief.
- **On the wire** (`progress-core.ts`, `TalkerFrames`): a talker `start` frame
  carries `cued: true` for a cued round, and `done` carries `passed: true` for
  a round that passed.
- **In the panel** (`chat.js`, `talkDesk`): a cued round answers no waiting
  message, so its reply is collected and, when the round ends, drawn once as
  the consultant's next message (no user bubble). A round that passed, or said
  nothing, draws nothing. On reload the reply comes from the transcript like
  any talker turn.
- **Priming** (`priming.json`, `conduct`, both consultant tiers): new
  "## Answer before you build": answer a question in a line or two before
  starting the work, since the status beside the chat is not a reply; and when
  handing back, don't say again anything the talker already told the client,
  refer to it at most ("as I said, next is colours and fonts").
- Not done: the framework's optional "first withheld tool before any text"
  stream event (REQ-215 didn't build it); the host infers the dive itself.

## UATs

- `tests/test_UAT_FC_BUG-240_talker_on_a_dive.workers.test.ts` (real router,
  junction DO, D1; scripted model):
  - a round whose first two acts are `set_stage` with no text opens exactly one
    cued talker; its reply rides the work's stream (`cued: true`); the talker's
    request carries the client's message and the cue; the cue is in none of the
    worker's requests nor the reloaded transcript; the worker's next call gets
    the reply as the talker brief; the client's message appears once
  - a round that writes a reply before its work tool opens no talker
  - a cued talker that replies `[nothing to add]` streams no text, its `done`
    carries `passed: true`, and nothing of it or the cue is in the chat
  - the consultant's priming carries the answer-first and no-repeat rules
- `tests/test_UAT_FC_BUG-240_cued_reply_in_the_panel.test.ts` (real panel,
  jsdom):
  - a cued reply is drawn once as an assistant message after the client's
    message, with no extra user bubble and nothing sent to the origin
  - a cued round that passed draws nothing

---
uid: comment-aba7cf65
id: COMMENT-4722
type: comment
title: Comment on request REQ-360
created_by: xgd
created_at: '2026-10-02T22:35:08.650429+00:00'
updated_at: '2026-10-03T00:23:28.453518+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-6baecee7
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "0794bb3e-4abc-4c26-87d1-0837d0321c38",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="bc221453-0c99-422d-b12f-d30cc9f10a5f-user" -->

<!-- xgd-chat role="user" ts="2026-10-02T22:33:54.217986+00:00" -->
#### You
Please investigate this. I think we need 1 and 2.

The correct model for 1 IMO is to generalize the tool that we have for writing to a group chat so that it can also write to a 1-1 chat. That is something we would add upstream in lagrange framework. If that is the correct approach please create a tool there.

<!-- xgd-turn id="bc221453-0c99-422d-b12f-d30cc9f10a5f-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-02T22:47:09.729310+00:00" -->
#### Claude
Investigating how the consultant's 1-1 chat delivers turns versus the existing group-room tool, to judge where an interim-notice tool belongs.I don't think generalising `GroupSay` to 1-1 chats is the right approach, so I haven't built anything upstream. I've added the investigation to REQ-360's body; the ticket is still at `draft`.

**The ticket is partly wrong about the cause.** In a 1-1 session, the consultant's words are not held back until the turn ends. Each piece of text is sent to the client's panel as it's written. What blocks the client's view is a tool call: while a `Delegate` build runs, the client receives nothing, for up to the 30-minute turn limit (`api_tools.js:1145`). On top of that, the panel shows no "working" indicator during a tool call; the tool activity event only fires after the tool finishes.

**What that means for 1:** in a 1-1 chat, "announce, then delegate in the same turn" already works. The consultant just didn't know it would. The cheap fix is a line in 1stcontact's priming telling it so. The real gap is in group rooms. There, only `GroupSay` reaches the other participants, and a successful post ends that member's round (REQ-197), so a room member can't announce and then keep working.

**Why `GroupSay` doesn't fit 1-1:**
- **It would fail.** It posts by claiming the session's turn lock, which the consultant's own running turn already holds. A call from inside that turn would wait 60 seconds and then error (`manager.js:1622`).
- **It would corrupt the record.** Even with the lock, it records a complete separate turn inside the open one, which is what the lock exists to prevent.
- **The client wouldn't see it live.** It writes to the stored session log, not to the stream the client is watching, so the message would only appear after a page reload.
- **The surface rules it out.** The group tool's own description treats posting into a private session as an error (`not_a_room`).

**What I'd build instead, upstream in lagrange-framework:** a "notice" channel attached to the turn that is currently running.
- **Mechanism:** a new `manager.notify(sessionId, …)` call. It sends a notice into the live stream the client is watching, and also logs it so a reload replays it. Notices stay out of the reply text and the archive.
- **Option 2, the automatic indicator:** the delegation tool already runs a 100 ms timer for the whole of a build (`delegation_toolbox.js:919`). It can send an "still working, N minutes" heartbeat on a fixed cadence, with no cooperation from the model.
- **Option 1, the explicit notice:** an optional `Notify(text)` tool on the same channel. It matters mostly in rooms, where the model's own prose isn't the output.
- **Client panel:** the chat UI shows a notice as a single status line, with each heartbeat replacing the last.
- **1stcontact side:** grant the new tool and add the priming line. The route that forwards events to the client needs no change.

Decision for you: should I file a ticket in lagrange-framework for the notice channel and heartbeat? The 1stcontact priming line can go in directly, since it's a prompt change and needs no ticket.

<!-- xgd-turn id="3d7c1eb3-c38a-442d-a59b-b8a1a1614396-user" -->

<!-- xgd-chat role="user" ts="2026-10-02T23:23:13.700504+00:00" -->
#### You
**Why **`GroupSay`** doesn't fit 1-1:** - **It would fail.** It posts by claiming the session's turn lock, which the consultant's own running turn already holds. A call from inside that turn would wait 60 seconds and then error (`manager.js:1622`). - **It would corrupt the record.** Even with the lock, it records a complete separate turn inside the open one, which is what the lock exists to prevent. - **The client wouldn't see it live.** It writes to the stored session log, not to the stream the client is watching, so the message would only appear after a page reload. - **The surface rules it out.** The group tool's own description treats posting into a private session as an error (`not_a_room`). <-- interesting, but take a look at EPIC-7 in LF - all of those issues with contention in a room we need to solve.

<!-- xgd-turn id="3d7c1eb3-c38a-442d-a59b-b8a1a1614396-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-02T23:25:35.839356+00:00" -->
#### Claude
Now recording the revised assessment and the cross-reference on REQ-360.

You're right, and I've changed my assessment. All four of my objections are problems EPIC-7 has to solve for interposition anyway, and its decisions settle them:

- **Lease contention and the separate turn:** EPIC-7 stores a mid-round message as a record *inside* the open round, where it happened, not as a new turn (§16, REQ-200). The consultant's own round already holds the turn lock, so there's no wait and no second turn wedged in.
- **Not reaching the live stream:** the post can be sent to the client as soon as the `GroupSay` call returns, before the next call. So the client sees it before a long `Delegate` starts. The split-round display in REQ-201 then draws it where it happened.
- **`not_a_room`:** this is narrowed to "someone else's 1:1 chat". Posting into your own conversation becomes allowed.

Seen this way, the interim notice is interposition in the other direction, AI to user. It also gives one `GroupSay` that behaves the same in a room or a DM, which is what §13.3(a)'s "no role named anywhere" asks for.

As before, I filed this as a ticket in lagrange-framework rather than writing code from here: **REQ-205** (`request-4fee9d24`), at `draft`. It covers both of the options you wanted:

- **A (option 1):** `GroupSay` can target the caller's own 1:1 chat mid-round. It also gets a flag that keeps the round open in a room, because REQ-197 currently ends a member's round when it posts.
- **B (option 2):** while a delegated build runs, the system sends a "still working, N min" heartbeat, with no model cooperation. It reuses the timer the delegation tool already runs. The heartbeat is temporary: never archived, and each one replaces the last in the UI. This is outbound only, so it doesn't conflict with §13.1, which only rules out sending messages *into* a blocked delegation.

REQ-205 depends on REQ-200 and REQ-201, both still `draft`. I've added the revised assessment and the cross-reference to REQ-360. It stays at `draft` with no code until REQ-205 lands; after that, the work here is granting the tool, a priming line, and styling the heartbeat.

One thing works today: in a 1:1 chat, text the consultant writes before calling `Delegate` already reaches the client live. Should I add a priming line telling it so now? It's a prompt-only change, so it doesn't need a ticket.

<!-- xgd-turn id="9dbd7ed5-6cd4-4b30-99ca-e0c54a93b225-user" -->

<!-- xgd-chat role="user" ts="2026-10-03T00:18:26.831473+00:00" -->
#### You
I suspect the correct approach is to add this to EPIC-7? Could you write an addendum to EPIC-7's ticket explaining the requirement and the current issues? Perhaps you hold on to the 1c side of the work when EPIC-7 delivers the incrastructure?

<!-- xgd-turn id="9dbd7ed5-6cd4-4b30-99ca-e0c54a93b225-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-03T00:19:47.271291+00:00" -->
#### Claude
I've added the addendum to EPIC-7 as a new **§17, "the outbound direction"**, and REQ-360 now holds only the 1st Contact side until EPIC-7 delivers.

**What §17 says:**
- **Requirement (17.1):** the two silences seen in the real session (ten minutes, then over half an hour) and the consultant's two asks. One is a one-line notice mid-round that doesn't end the round. The other is an automatic working indicator during a delegated build.
- **Where things fall short today (17.2):**
  - In a 1:1 chat, text written before `Delegate` already reaches the client live. The silence comes from the blocking tool call, and the UI shows nothing while it runs.
  - In a room the notice can't be done at all, because a successful `GroupSay` ends the member's round (REQ-197). That makes §13.2's Alice unable to say "back in twenty minutes" and then go and build.
  - Nothing works the same in both a room and a DM, which conflicts with §13.3(a).
- **The approach (17.3):** a table pairing each problem with generalising `GroupSay` today (turn lock, a separate turn inside the open one, not reaching the live stream, `not_a_room`, round ends on post) against the decision EPIC-7 has already made that solves it. The interim notice is the outbound mirror of interposition: a record stored inside the open round, sent live, and drawn with the split-round display. One question is left open there: whether a post that keeps the round open counts against `max_contributions`.
- **Heartbeat (17.4):** temporary and never archived, built on the delegation tool's existing timer. It explains why this doesn't conflict with §13.1, and notes it needs a side channel into the live stream.
- **Build order (17.5):** this is step 4 of §16, after REQ-200 and REQ-201. The heartbeat half depends on neither and could be built earlier.

**Ticket housekeeping:**
- **REQ-360 (1st Contact):** parked at `draft`. What remains for it is granting the tool to the consultant, the "say it, then carry on" priming line, and styling the heartbeat line.
- **REQ-205 (lagrange-framework):** I'd filed this last round as the build ticket, and §17 refers to it. I've added a note pointing it back to §17.

Decision for you: §13.3 says no tickets are filed until a stage is about to be built, and REQ-205 is ahead of that. If you'd rather keep this in the epic only, I'll remove REQ-205 and drop the references to it. The other option is to keep it as the place to start the heartbeat early.

<!-- xgd-turn id="fe372e04-f876-470c-9b0d-dfe242d3bffd-user" -->

<!-- xgd-chat role="user" ts="2026-10-03T00:23:27.839224+00:00" -->
#### You
And 360 is dependent on the upstream work?

§13.3 says no tickets are filed until a stage is about to be built <-- that is an exageration but it captures the intent that a large feature backlog is unhelpful - we should create the tickets as we need them. This is where we are.

<!-- xgd-chat-end -->
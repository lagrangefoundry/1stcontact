---
uid: comment-c8aa9411
id: COMMENT-5547
type: comment
title: Comment on bug BUG-247
created_by: xgd
created_at: '2026-10-21T20:09:14.405495+00:00'
updated_at: '2026-10-21T20:17:55.704234+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-828186c9
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "078d2a14-0307-432a-a642-5d6b8745ad9b",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="fbabed16-aa05-4e94-a8a5-fe07da47c9e4-user" -->

<!-- xgd-chat role="user" ts="2026-10-21T20:08:22.796091+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="fbabed16-aa05-4e94-a8a5-fe07da47c9e4-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-21T20:17:55.187549+00:00" -->
#### Claude
I'm tracing how the chat panel handles a turn that answers first and then starts working. That will show me where talk mode and the status widget get lost.

Still tracing — I'm checking which chat elements are styled italic, to find out which path drew the working notes.

I'm reading the chat widget's send loop. I want to see how it handles a progress frame that arrives after reply text in the same round.

I haven't found the fault by reading the code. Next I'll look for the session log the epic session used, so I can see what actually reached the browser.

Possible lead: a lost stream triggers a repaint and reattach. I'm checking whether that path carries talk mode and progress frames.

Found a lead. A reattach that fails is drawn as an italic line in the chat. I'm checking how the server's reattach route sends `progress` records.

Progress: the server side looks correct. Next I'll reproduce the turn in the existing jsdom chat tests: answer first, then progress, then check the composer and the widget.

The 17:32:41 message carried an attachment (DOC-1). I'm checking whether attached messages go through a separate send path.

Hypothesis 2 is ruled out: the status slot is created once and never rebuilt. Next I'll record the diagnosis on the ticket, cut the branch, and write a failing test.

Now I'll update the ticket with the diagnosis, set it to free_coding, and cut the branch.

Now I'll write the failing test in the worktree, modelled on the BUG-239 suite.

The test reproduces the bug: no widget. Now the fix in `talkDesk`:

Now the panel side. I'll share BUG-245's wait-for-a-free-panel loop between `cue` and the new `runTurn`:

The widget now shows. Two failures remain: my bubble assertion, and REQ-416's timing expectation. I'll look at both.

A 500 ms poll delay before the message runs is a needless cost. The talker bubble and the ending turn both close within the same task, so I'll make the first attempt on the next tick:

The text is there but not yet painted: `webui-chat` renders on a requestAnimationFrame. I'll give the frame time to run, and remove the debug line.

All four pass. Next, the wider regression scope: every suite that mounts the builder chat panel.

Four failures and one file that didn't load. To check whether they predate my change, I'll run the same files in the main checkout, which doesn't have it.

The same four fail without my change, so they predate it. REQ-309 loads in the main checkout but not in the worktree, so I'll check why.

That's the known missing `generated/` artifact in a fresh worktree, not related. Next: commit. First I'll check my notes on this repo's version-bump gate.

The plan: commit on the branch, take the merge lock, merge into xgd-working, then run `move-to-free-coded` without `--version` so it bumps the version itself.

It fast-forwarded. The rematerialize check found nothing to change. Now I'll move the ticket to free_coded and let the gate bump the version:

BUG-247 is fixed and merged into xgd-working. The ticket is at `free_coded` (version 0.2.573), and the new test passes.

**Cause.** None of the ticket's three hypotheses was it. Talk mode was on, and the status widget's box under the progress banner is created once and never rebuilt. What actually happened:

1. You sent the 17:32:41 message while the previous turn was still finishing. In talk mode that sends it to a talker, so the chat drew your message plus an empty talker reply bubble under it.
2. That turn ended before any talker picked the message up. As designed, the chat then sent it as the next prompt; the server ran it as an ordinary turn, which is why the log shows no talker.
3. The bug: the chat drew that whole turn, including the build, inside the talker reply bubble. That bubble ignores progress updates, so the status widget never appeared. And because a talker reply counted as being written for the whole build, the composer showed ■ Stop the entire time.
4. Typing still reached a talker, because a turn was still running. A reload gave a clean chat, which is why it recovered.

This explains why it looked tied to answering first: it depends on whether you wrote while the previous turn was still running, not on how the consultant began.

**Fix** (`apps/control-app/src/builder/chat.js`):
- When the previous turn ends before a talker takes the message, the empty talker bubble is closed and the message runs as an ordinary turn.
- So the consultant's reply is a normal message, its progress goes to the widget with the note, timer and Stop building, and the composer shows Send.
- It runs on the next tick, falling back to a 500 ms re-check only if the chat is still busy.
- It reuses the "wait until the chat is free" code from BUG-245's comp-board Skip message, now shared by both.

**Tests**
- New UAT `tests/test_UAT_FC_BUG-247_message_the_work_ended_before_taking_runs_as_a_turn.test.ts` replays your sequence and checks the widget, the composer's Send, the reply bubble and Stop building. It failed on the old code (no widget) and passes now.
- The other talk-mode suites (REQ-416, BUG-239, 240, 244, 245, 236) all pass. One REQ-416 test needed the next-tick start to keep passing.
- In the wider chat-panel run, four tests fail: BUG-64, REQ-127, AC1065 and AC1070. They fail the same way on xgd-working without this change.
- One more file (REQ-309) wouldn't load in the branch worktree because it lacks a generated logging file. It passes in the main checkout.

To see it on dev it needs `bin/deploy --env dev`. The repeat test is: write while a turn is finishing, and the next build should show Send and the widget.

<!-- xgd-chat-end -->
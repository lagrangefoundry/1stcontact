---
uid: comment-af9b2d35
id: COMMENT-7869
type: comment
title: Comment on bug BUG-357
created_by: xgd
created_at: '2026-11-05T21:15:40.059866+00:00'
updated_at: '2026-11-05T21:28:14.762372+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-1535e1ef
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "af2d2d33-28c1-4a9a-8add-1fef57f9059f",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="df1ed29e-7322-49b6-a468-bfb5ca0e6bc0-user" -->

<!-- xgd-chat role="user" ts="2026-11-05T21:14:46.767430+00:00" -->
#### You
Triggered by: martin-github@westhead.me

Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

<!-- xgd-turn id="df1ed29e-7322-49b6-a468-bfb5ca0e6bc0-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-05T21:28:12.076454+00:00" -->
#### Claude
Reading the two code paths now; plan: drag-leave tracking in `attachments.js`, and drop host-refused Delegate calls from the round summary in `cadence-core.ts`.

Still in investigation: working out how a pre-run Delegate refusal is told apart from a builder that failed mid-run, in the tool output string.

I'll use the unbranched fast path with the session lock (two surgical edits plus two UAT files, done this turn). Moving the ticket to `free_coding` and taking the lock.

Lock held. Editing `attachments.js`.

Now `cadence-core.ts`.

The later "oldest out hand-off came back" block would otherwise mark a *different* hand-off as failed for the same activity — guarding it.

Writing the scripted-consultant UAT (workers suite, real routes) now; I'll probe whether a bogus builder backend yields `worker_failed` for the "started but didn't come back" case.

Two harness problems: the loose check wasn't refused, and some outputs are objects. Dumping the actual Delegate outputs to see.

The loose check I picked parses as a valid section check; I'll use a quoted-text one (`The headline reads 'Fresh pie daily'`). Now making `failed()` read content-block arrays.

Writing the node-side UAT for the started-but-failed hand-off.

Now the drag-outline UAT (jsdom, real chat panel + tray, as BUG-236 does).

All 19 pass. Confirming the drag UAT actually catches the bug against the old `attachments.js`.

Old code fails all three; restored. Now a regression sweep over the cadence suites and a typecheck.

Typecheck: 2 errors, both pre-existing `ArrayBuffer` typings, none in `cadence-core`. Running the delegation/cadence workers suites.

9 failures in 4 files — baselining those 4 against the unchanged `cadence-core.ts`.

All 9 failures are identical on the unchanged code (pre-existing red), so no regressions. Updating the ticket body to the converged design before committing.

Ticket updated. Bumping the version and committing.

Both BUG-357 fixes are committed on xgd-working (`202d619cda`, version 0.2.787). The ticket is at `free_coded`; I haven't promoted it to `ready_to_reconcile`.

**1. The upload outline now clears whenever the drag is over.** In `attachments.js`, the outline is removed when the pointer goes anywhere outside the conversation, including through the composer. It's also removed when the pointer leaves the window or the drag is cancelled with Esc, and on any drop or drag end anywhere in the window.

**2. Refused hand-offs no longer show as stopped builds.** In `cadence-core.ts`, a Delegate call the host refused before anything ran is dropped from the round's summary. That covers `unsettled_check`, `plan_first` and every other coded refusal except `worker_failed`. The consultant still sees the refusal. A hand-off that actually started and failed still gets "Stopped before the build was finished".

There was a second bug behind the second symptom. Some refusals arrive as a list of text blocks (the error, then a playbook section the host adds), not as a single string. The old failure check only looked at strings, so a refused call was being summed up as a finished build ("Built your home page first draft…"). The check now reads the first text block.

**One test removed.** The ticket's intent conflicts directly with a REQ-459 test, `a_hand_off_that_did_not_come_back_is_summed_up_as_stopped`. It expected a `plan_first` refusal to show "Stopped before the build was finished". It was already failing on xgd-working, because of the text-block problem above. I deleted it and noted this under "Supersedes" in the ticket body. Its cases are covered by the new BUG-357 tests.

**Tests:**
- **Drag:** three new tests use the real chat pane and attachment tray in a simulated DOM (jsdom). They pass, and all three fail against the old code. The browser's own drag handling isn't covered; that would need a real browser, which can't launch in this sandbox.
- **Builds:** three new tests go through the real routes with a scripted consultant (refused then accepted; only refusals; refused for its plan). Two more cover a builder that started and failed with `worker_failed`. Those two drive the host's cadence wrapper directly over a stub stream, because a `worker_failed` setup is rejected at start-up and can't be reached through the routes.
- **Regression:** the nearby attachment, upload-overlay, delegation and cadence suites pass, apart from 9 tests in REQ-295, BUG-284, BUG-225 and REQ-354. Those fail the same way with my change reverted, so they were already broken. The typecheck has 2 errors, both unrelated `ArrayBuffer` typings.

The ticket body has the final design, the supersession note and the test list. I also saved a memory note that a tool's output can be a list of text blocks rather than a string.

<!-- xgd-chat-end -->
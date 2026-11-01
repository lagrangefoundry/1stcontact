---
uid: comment-2f03f25e
id: COMMENT-6225
type: comment
title: Comment on request REQ-623
created_by: xgd
created_at: '2026-11-01T16:16:40.247146+00:00'
updated_at: '2026-11-01T16:31:11.931082+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-3407f797
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "63ab5dfc-a0ea-4264-91cf-41a6e3295477",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="e029a860-e3e4-4da8-b80d-fdc7918dcfb2-user" -->

<!-- xgd-chat role="user" ts="2026-11-01T16:15:49.931176+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

<!-- xgd-turn id="e029a860-e3e4-4da8-b80d-fdc7918dcfb2-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-01T16:31:08.999953+00:00" -->
#### Claude
Body is truncated; let me get the full body.

I'm reading the critic and plan code to see where reviews get scheduled and where the hand-over waits, before I cut a branch.

Still investigating: checking whether every host runs a critic, since that decides how the "draft seen" gate can work.

I'm settling the design and moving on to the round-scoped layout checks (point 4) before cutting the branch.

Next: finding an existing workers test that drives a builder round with layout findings, to reuse its setup for the round-scoping UAT.

Design settled. Checking where the contradicting "When they lead: this is where they try things" line actually lives before cutting the branch.

Enough read. Moving the ticket to `free_coding` and cutting the branch.

Worktree ready. Implementing the critic scheduling changes first (`critic-core.ts`).

Critic core done. Now checking how a layout finding names its section, to scope a refinement round's findings to the sections it touched.

Host-side scoping done. Now the colours-and-fonts stage guide entry and the critique result's note about client decisions.

Code changes in place. Typechecking.

Typecheck is clean for the touched files. Running the existing critic, stage-guide and layout suites to see what the change moves.

Now writing the UATs. Checking how an existing node suite drives the plan tools with a critic stub.

Writing the node UAT file now.

Three harness issues, not behaviour: `show_client` needs `how`, and the rules come from the `consultantRules()` provider. Fixing.

All 6 node UATs pass. Checking they fail without the source change (so they aren't vacuous).

Node UATs are non-vacuous (5 of 6 fail on the old code; the hand-over hold already existed via REQ-458 and is pinned here). Now the workers UAT for round-scoped layout findings.

Passes, but 355 ms is fast — checking it actually fails against the old host-core.

Both UAT files are non-vacuous. Running the neighbouring node and workers suites for regressions.

Baseline check: does that REQ-458 test also fail without my change?

The REQ-458 failure is pre-existing (fails identically on the old code). Now the commit; checking the version-bump convention for this repo first.

Committing the work on the branch.

Now updating the ticket body with what landed, before the merge-back (preserving the existing text and appending).

`--append-body -` appended a literal "-". Fixing by appending from a file and removing the stray dash.

Ticket body is current. Now the lock → merge → version bump → merge-back sequence.

Fast-forwarded onto `xgd-working`. Moving the ticket to `free_coded`.

I've implemented REQ-623 and merged it into `xgd-working`. The ticket is at `free_coded` (commits `14fdb79c` and `eaaa2d01`, version 0.2.725, 8 story points), and its body now has a "What landed" section.

**What changed**
- **No critic reviews during refinement.** Refinement here means the client has seen and answered the first draft and hasn't opened Publish. In that window no review falls due: no first-pass run, none for offered looks, no re-check after a fixed finding, and none after a large revision or design change. The "review still owed" cue, the `Review:` line in the plan reminder and the hold at the end of a turn are gone too. Opening Publish still makes the pre-publish review due.
- **Hand-over after review.** This already worked (REQ-458): the draft can't be shown until its review has run and every finding is answered, re-check included. I added a test that pins it.
- **A round is checked where it changed.** During refinement, the check after a builder pass only reports layout faults in the sections that build changed. A page changed without a section address, or shown because a shared part or the whole site changed, is still checked whole.
- **Colours and fonts guide.** It is now sent once when that stage starts. The stage list had no entry for it, so it was never sent.
- **The critic never overrides a client decision.** Its brief now says a fix that would undo a client decision is only a low-severity perspective. The `critique` result tells the consultant such a finding is never fixed: it goes to the client, or is dismissed.
- **Consultant priming.** Rule 2 used to say "go ahead with the improvements you judge worthwhile". It now applies only until the first draft is handed over. After that, anything the client didn't ask for is a suggestion, built only if they say yes. The "this is where they try things" line is only in DOC-73, which is a draft and isn't sent to the consultant, so nothing live needed changing for it.

**Design decision.** If the client writes with the draft on screen while its first review is still running, that still counts as seeing it, so refinement starts and that review is dropped. I didn't block "seen" on the review because the plan can't tell whether a site has a critic. On sites without one, the review stays marked as due forever, so they would never count as seen. The existing hand-over holds are what keep the review ahead of the hand-over. Say if you'd rather handle this differently.

**Tests**
- I added 7 tests across `tests/test_UAT_FC_REQ-623_refinement_is_client_sourced.test.ts` and `tests/test_UAT_FC_REQ-623_round_checks_only_what_changed.workers.test.ts`.
- Run against the old code, 6 of the 7 fail. The one that passes is the hand-over hold, which already worked.
- 17 nearby node suites pass. Of 12 nearby workers suites, 11 pass. The exception is `test_UAT_FC_REQ-458_with_a_builder_holding_the_pages_the_draft_is_not_announced_and_the_running_build_is_named`, which fails the same way without my change.

The changes reach production on the next deploy.

<!-- xgd-chat-end -->
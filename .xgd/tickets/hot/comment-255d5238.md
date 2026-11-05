---
uid: comment-255d5238
id: COMMENT-5968
type: comment
title: Comment on request REQ-621
created_by: xgd
created_at: '2026-10-31T23:17:26.259272+00:00'
updated_at: '2026-10-31T23:55:20.883073+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-13321a85
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "3be15b87-035b-4359-aafb-e6db21db327b",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="bd980348-1d70-4f68-ad2a-4baaf571a0d4-user" -->

<!-- xgd-chat role="user" ts="2026-10-31T23:16:26.886001+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

<!-- xgd-turn id="bd980348-1d70-4f68-ad2a-4baaf571a0d4-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-31T23:55:17.578507+00:00" -->
#### Claude
Reading the ticket and locating the consultant's Input/focus code before cutting the branch.

Still mapping where the client's plan view (badges, "How you can help") is built.

Design settled; setting the ticket to free_coding and cutting the branch.

Worktree ready. Now looking at the client-side badges and Input board.

Writing the core in plan-core.ts next; checking the tool wrappers that announce new Input first.

Now writing the code. First the plan-core core block.

Inserting the input-order block after `focusReminderLine`.

Wiring the mask into `panelView`, the agenda, `start_focus` and `show_client`.

Host gating is wired and typechecks. Now the priming rule, then tests.

Budget test passes at baseline; measuring headroom before editing rule 5.

Plenty of headroom (73,980 + 50,000 margin < 200,000). Editing rule 5.

Now checking no other route serves the story board or comps to the client unmasked.

Masking is via the single plan-view projection. Running the related existing suites to see what the new order breaks.

Those two are pre-existing (fail on clean working). Looking at how the 28 others build their plans.

Adding a shared test helper that marks Questions found, then pointing the affected fixtures at it.

Worse — the helper itself must be failing validation. Checking the error.

Down to 3. Looking at each.

REQ-398 fails on clean working too (pre-existing). Fixing the other two fixtures.

Node suites green apart from the three pre-existing failures. Running the 20 affected workers suites.

Baselining the same workers suites on clean working before attributing failures.

9 of the 30 fail on clean working too; 21 are mine. Checking how those workers suites seed their plans.

I'll add a store-side helper that records a skipped question on a seeded site, and call it from each affected workers suite's site setup.

Workers results now match the clean baseline exactly (the same 9 pre-existing failures). Writing the REQ-621 UATs next; checking the client-side answer/skip functions they'll drive.

Writing the REQ-621 UAT file now.

The refusal works, but its code isn't shown because `PLACE_HIDDEN` isn't declared on the plan surface. Checking how codes are declared there.

All 5 REQ-621 UATs pass. Running a wider sweep over every suite that imports the plan, story, show, roles or priming modules, and baselining the failures against clean working.

While the sweeps run, checking the version bump script and drafting the ticket update.

Sweeps still running. Updating the ticket body now, keeping the existing sections and adding what landed.

`--append-body -` appended a literal "-". Rebuilding the body: the existing sections exactly as they were, plus the new ones, written with `--body-file`.

Ticket body is right now. Checking the sweeps.

Waiting for the two node sweeps (branch and clean baseline) to finish.

Three failures appear only on the branch; rerunning those alone to tell timing flakes (both sweeps ran together) from real breaks.

All three pass alone, so they were timing flakes from running both sweeps at once. Now the wider workers set on the branch, then I'll baseline only what fails.

Nine of these match the earlier baseline. Running the other eleven on clean working.

Unsplit zsh variable (a known trap). Rerunning with the paths split.

All pre-existing except one: `BUG-322_next_stage_starts_when_one_ticks_done` (workers) passes on clean working. Looking at it.

Tracking down why the refinement guide drops on the branch only. First isolating which change does it: reverting the rule-5 priming edit for one run.

Not the priming. Dumping the plan's `guides_sent` after the second turn to see what changed.

`guides_sent` is never written on the branch. Running the same dump on clean working to compare.

Clean working hands the guide over; the branch hands nothing over at all. Checking whether that's my plan-core change or the worktree: reverting plan-core/story-core for one run.

Committed. Now the merge-back: lock, bring xgd-working in, bump the version on the branch, fast-forward xgd-working.

Merged cleanly; xgd-working brought in REQ-619 (Input layout) and BUG-324. Rerunning my UAT, the touched node suites and those new suites on the merged result.

All 73 pass post-merge. Bumping the version on the branch and fast-forwarding xgd-working.

The ticket is now free_coded. Cleaning up the branch.

Updating two memories that turned out stale or missing.

That quirk is already recorded (I should have checked first). Updating only the stale priming-budget memory.

REQ-621 is implemented and merged into xgd-working, and the ticket is at **free_coded** (commits `97ff4cc` and `cbf36fa`, version 0.2.720, 8 story points). I didn't need to ask anything first, but I made one judgment call you should check (below).

**What the client sees now**
- **The places open in order.** Stories (the story board) is hidden until the client answers or skips one question. Comparison sites stay hidden until they act on the story board once. A place stays hidden until the one before it has been used.
- **Nothing shows for a hidden place.** There's no badge, no "N new" and no line under "How you can help". All of this is driven by the one plan view the builder draws from, so no surface can disagree. When a place opens, everything the consultant gathered for it appears at once.
- **Sites already further along don't lose anything.** If a later place has already been used, the places before it count as found too.

**What the consultant gets**
- **It can still gather while a place is hidden.** It can pin notes and add sites, but the tool replies drop their links and tell it to say nothing yet. So the host doesn't append a "New on the story board" line either.
- **Hidden places are refused.** A `show_client` link or `start_focus` task on a hidden place is refused with a reason naming what comes first, e.g. "The story board isn't in front of your client yet: Questions come first."
- **Its per-turn plan entry stays in step.** It only mentions places the client can see, and carries a line saying which place is next until all three are found. After that the line goes and nothing is refused.
- **The one-action rule applies from the first turn.** I added it to rule 5 of the rules that are in every turn's priming: one question or one place per message, recap in a line at most, introduce the places in order, and loosen once all three are found. The stage guide (DOC-75) is unchanged.

**Decision for you to check:** the order is strict even when no question has been posted yet. In that case the consultant is told to start with a question. I rejected the alternative (only gate when the earlier place has something in it) because notes would vanish from view as soon as a first question arrived. The other choices are recorded in the ticket body under the original Why/What.

**Tests**
- 5 new UATs in `tests/test_UAT_FC_REQ-621_input_one_place_at_a_time.test.ts` all pass, covering each point in the ticket's test plan, run through the real plan tools.
- 21 existing suites built their story-board or comparison fixtures with no question answered, so the new order hid their content. I changed those fixtures to start with the earlier places already found, using two new helpers in `tests/support/`. Their assertions are unchanged, except one in REQ-403: it now checks for no open questions instead of no questions at all, because the helper adds a skipped one.
- **Wider sweep:** I ran 115 node and 115 workers suites that touch this code and compared failures against clean xgd-working.
  - **Pre-existing:** all remaining failures also fail on clean xgd-working, e.g. REQ-398, REQ-416, REQ-424, REQ-295, REQ-342, REQ-473.
  - **Load flakes:** three node failures came from running two sweeps at once and pass when run alone.
  - **Worktree only:** the BUG-322 workers test "next stage starts when one ticks done" fails in the branch worktree even with all my source changes reverted, but passes in the main checkout. I didn't rerun it in the main checkout after the merge, so that's the one to confirm.
- After merging in the latest xgd-working (which brought in REQ-619's Input changes), my UATs, the REQ-619 suite and the fixture suites all pass (73 tests).

I also updated a stale memory about the priming size limit. The test now allows the priming plus a 50,000-character margin under 200,000; about 74,000 is used, so there's plenty of room.

<!-- xgd-chat-end -->
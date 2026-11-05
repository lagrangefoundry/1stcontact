---
uid: comment-28cbfc8c
id: COMMENT-6227
type: comment
title: Comment on request REQ-625
created_by: xgd
created_at: '2026-11-01T16:59:11.583095+00:00'
updated_at: '2026-11-01T17:54:03.550891+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-64b87f8a
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "d61545ed-1811-4fa4-96fe-97c61d26a010",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="72973f1f-b1fb-4e37-8a52-6ca4e49b3bf4-user" -->

<!-- xgd-chat role="user" ts="2026-11-01T16:57:46.395221+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

<!-- xgd-turn id="72973f1f-b1fb-4e37-8a52-6ca4e49b3bf4-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-01T17:10:25.356058+00:00" -->
#### Claude
Reading the ticket and the current estimate code (`cadence-core.ts`, `slow-tools.json`) before scoping the analysis.

Checking which run data is reachable (local dev D1 with the tool transcripts) so I can do the analysis this ticket asks for before any code.

Dev and production share one remote D1. Trying a read-only count against it.

Now the transcript bodies (about 7 MB, fetched one at a time).

Writing the analysis script.

Analysis is done. Recording it on the ticket now (appending, existing body kept), with the script as a comment so it can be rerun.

I put a critic-pass row in that table without having measured it. Computing it properly before saving.

I've done the analysis and saved it on REQ-625, but I haven't written any code: I need your answers to the questions below first, because the progress line depends on something that doesn't exist yet. The ticket is still at `draft`. The analysis script is on the ticket as comment COMMENT-6230, so it can be rerun.

## What the past runs show
I measured 137 builder passes (from 2026-10-25 on, the current builder model) and the consultant's slow tool calls. Lost turns, repeated hand-offs and stopped passes are left out of the estimates.

| step | median | p80 | estimate today |
|---|---|---|---|
| builder pass, one page | 1.4 min | 2.6 | the consultant's own guess |
| builder pass, 2–3 pages | 3.1 min | 4.4 | |
| builder pass, 4+ pages | 5.0 min | 5.2 | |
| revision of the same scope | 1.3 min | 2.3 | |
| consultant's own time between passes | 1.6 min | 3.0 | |
| screenshot | 4 s | 8 s | 1 min |
| compare | 4 s | 4 s | 1 min |
| capture_site | 53 s | 76 s (worst 3 min) | 5 min |
| CreateImage / EditImage | ~60–70 s | 79 s | 1 min |
| AnimateImage | 2.3 min | 3.8 (worst 7) | 5 min |
| critique | 1.3 min | 1.6 | not listed |

- **First draft:** about 4 builder passes, and 12–18 minutes from the first pass to the hand-over (8 sites).
- **What predicts a pass's length:** the number of pages in scope, and whether it's a first pass or a revision. Brief length helps a little; the number of checks barely does.
- **Lost work:** 11 passes lost to kills (about 30 builder-minutes) and 12 repeated hand-offs (about 45 minutes).
- **Refinement:** hand-offs outnumber client messages about 3 to 1. On Ariel's site on 10-31 a third of them came from host cues, not the client.

So a builder step almost never takes the "15 minutes" the client keeps hearing. The problem is guesses restated round after round, not slow work.

## Questions before I code
1. **There's no job queue yet.** Today the consultant hands off one pass at a time, so nothing knows "6 steps" in advance. REQ-624 (durable jobs) would create that list, but it's still a draft. **My suggestion:** the consultant declares the planned steps up front (each page or section and its kind). The host holds that list, counts "2 of 6 done" as passes return, and works out "about N minutes left" from the table. REQ-624's job would later take the list over. Do you want that, or should this wait for REQ-624?
2. **The estimate rule.** I'd use the sum of the remaining steps' medians plus about 1.5 minutes of consultant time per step, rounded to the nearest 5 minutes. Adding up p80s would overstate it. OK?
3. **The 1/5/30-minute rule.** `slow-tools.json` only allows estimates of 1, 5 or 30 minutes, and a line like "about 25 minutes left" breaks that. I'd replace it with rounded measured values and note where they came from.
4. **Screenshot and compare** finish in about 4 seconds, which is inside the file's own 20-second threshold. Taking them out means no status line for them, and the speak-first gate stops refusing them. I'd also add critique (about 1.5 minutes). Agree?

<!-- xgd-turn id="ee6653c2-67be-4d9b-8d1d-cd8b8f9201be-user" -->

<!-- xgd-chat role="user" ts="2026-11-01T17:26:23.377623+00:00" -->
#### You
Your ticket has been updated to answer the questions that you asked. Please reread it and determine if you are ready to code

<!-- xgd-turn id="ee6653c2-67be-4d9b-8d1d-cd8b8f9201be-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-01T17:54:02.180759+00:00" -->
#### Claude
The operator answered all four questions, so I'm ready to code. Next I'll trace how the working note reaches the status line and where per-site host state lives, then cut the branch.

Plan settled. Before cutting the branch, checking which tests pin the priming phrases and slow-tools values I'm about to change.

The operator's decisions settle every open point. Setting the ticket to `free_coding` and cutting the branch.

Worktree ready. Checking the `critique` tool's input so its status line reads naturally.

Writing the measured table into `slow-tools.json`, replacing the guessed 1/5/30 values.

Now the estimate module itself.

Wiring the queue into `cadence-core.ts`: the `steps` parameter, the note text without a time, and the progress carried on each working note.

Now the stream loop: start, finish and progress for each step.

Name clash with the existing `shown`; renaming mine.

Now the host side in `host-core.ts`: one queue per site, the status line from `workingLine`, the per-request estimate notice, and clearing on a new client message.

Typechecking.

Running the existing suites that touch slow tools, the working line and the speak-first gate, to see what my change breaks.

Nine failures. Some may already fail on clean `xgd-working` (the REQ-386 "20-second rule" text looked stale before I started), so I'm baselining in the main checkout.

One pre-existing failure (REQ-386's 20-second-rule text); the other eight are from my change. Reading each to tell intended behaviour changes from regressions.

Updating the REQ-390, REQ-459 and BUG-298 expectations to the new line: the note's words plus the host's "… left" figure, and an ETA computed from the measured table.

Now REQ-386: the measured ETA, and removing its 1/5/30 test, which REQ-625 explicitly replaces.

Now my own UATs. Reading the REQ-459 test's harness to reuse its real-entry-point setup.

Writing the two REQ-625 UATs against the real `/api/ai/prompt` route. The only fake is the model client.

Both new UATs pass. Rerunning the suites that failed earlier.

Only the known pre-existing failure is left. Now a wider regression run, since `critique` became a slow tool (gated on cued rounds) and the priming text changed.

28 failures across both batches; many are in the known pre-existing list. Baselining exactly those files on clean `xgd-working`.

Four failures are mine (BUG-257, BUG-269, two in BUG-290); the other 24 fail on clean `xgd-working` too. Looking at the four.

BUG-290 passes with the swap, and BUG-269 passes on rerun. Checking BUG-269 once more on its own, then BUG-257.

BUG-257 passes. Now the non-Workers tests that read the touched files.

REQ-358 fails only on my branch. Running it alone there.

Passes alone, so that was a load flake. Checking lint and types on the changed files.

No ESLint in this repo; rerunning `tsc` after all edits, then reading my notes on the `free_coded` gate before committing.

Ticket updated. Committing on the branch.

Committed. Taking the merge lock and merging `xgd-working` into the branch first, so the merge back is a fast-forward.

Conflict in rule 8: `xgd-working` added a notify_client sentence where I changed the time. Keeping both: their version, with my estimate wording in place of "30–45 minutes. Say so."

Conflict resolved: only my two passages differ from `xgd-working`. Committing the merge and rerunning my suites on the merged code.

Only the known pre-existing failure. Checking whether the newly merged tests rely on screenshot being slow or on the old estimates.

Merged code is clean. Merging back into `xgd-working` with the sparse-safe `xgd-merge`.

Merged and verified in `xgd-working`. Moving the ticket to `free_coded` with the full code SHA, omitting `--version` so the gate does the bump itself.

Ticket is at `free_coded` (version 0.2.728). Cleaning up the branch and worktree as its own call.

REQ-625 is built and merged into `xgd-working`, and the ticket is at `free_coded`. The client's status line now reads like "The consultant is building your home page now — 1 of 3 done, about 5 minutes left", with times from the measured runs instead of the consultant's guesses. The two new tests pass. Every suite I touched passes except one test that already fails on a clean `xgd-working`.

**How it works**
- **Measured times:** `slow-tools.json` now holds the measured medians and run counts, with a note saying where they came from:
  - a builder pass on one page takes 1.4 min, two or three pages 3.1, four or more 5.0, and a revision 1.3;
  - slow tools: capture_site 0.9 min, critique 1.3, CreateImage 1.0, EditImage 1.2, AnimateImage 2.3;
  - the 1/5/30-minute rule is gone. Screenshot and compare are no longer slow tools, and critique now is.
- **The consultant declares the steps:** `Delegate` takes an optional `steps` list, one `kind: what` per line. Giving it again replaces the steps not yet done. A pass nobody planned is still counted, sized from the pages in its scope.
- **The host counts them:** the list lives in a new `estimate-core.ts`, one per site, so it survives across rounds and requests. A new client message starts the count afresh. It's the single list REQ-624's durable job can take over later.
- **Time left:** the sum of the remaining steps' medians plus 1.5 minutes each of the consultant's own checking, rounded to the nearest 5. Under 5 reads "a few minutes". The line only changes when a step finishes or the plan changes.
- **What the consultant is told:** each of its requests carries the host's figure, with an instruction to quote it and not repeat an unchanged estimate. The `note` no longer carries a time. Priming rule 8 now says a first draft takes 15–20 minutes once building starts, replacing the guessed 30–45.

**Tests**
- New: `tests/test_UAT_FC_REQ-625_measured_estimates_and_step_progress.workers.test.ts`, run through the real `/api/ai/prompt` route with only the model client faked.
- Changed, following your decisions 3 and 4:
  - the speak-first gate tests (BUG-262, BUG-290, BUG-292, BUG-298) now use `capture_site` as their slow call instead of screenshot;
  - REQ-386, REQ-390 and BUG-257 now expect the measured ETAs;
  - REQ-390, REQ-459 and BUG-298 now expect the "… left" figure on the line.
- Deleted: REQ-386's 1/5/30 test. The ticket body records all of these as superseded.
- Still failing: REQ-386's `the_consultant_is_told_the_20_second_rule_every_turn`. It fails on a clean `xgd-working` too, and it also checks the retired 1/5/30 wording, so I left it alone.
- The 24 other failures in the wider run also fail on a clean `xgd-working`.

**Merge note:** priming rule 8 conflicted with a notify_client sentence that landed meanwhile. I kept that sentence with my new wording in front of it. The resolution sits in the merge commit, not in the recorded commit, so reconcile will meet the same conflict when it moves this to `main`.

The ticket has commits `87100759d3` and the version auto-bump, 5 story points, and a body covering the analysis, your decisions, the design and the test changes. It's ready for you to promote to `ready_to_reconcile` when you are.

<!-- xgd-chat-end -->
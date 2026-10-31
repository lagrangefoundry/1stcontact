---
uid: comment-4ef6c6e5
id: COMMENT-5824
type: comment
title: Comment on bug BUG-313
created_by: xgd
created_at: '2026-10-28T22:19:45.597309+00:00'
updated_at: '2026-10-29T16:09:11.870175+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-f1331d2e
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "46b47ca4-81cb-4e6e-90e7-6cc2ad892a5d",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-cli-session ts="2026-10-28T22:19:39Z" model="claude-opus-5-5" continued_from="new" -->
*Captured by CLI Claude — paraphrased reconstruction from session memory, not raw capture.*

<!-- xgd-chat role="user" ts="2026-10-28T22:19:39Z" -->
#### You
Something is going on with 1c: the consultant repeats the same message listing flagged items I chose to keep and asks again about upgrading the sign-in control. Is this just the CPU timeouts or something else?

<!-- xgd-chat role="assistant" ts="2026-10-28T22:19:39Z" -->
#### Claude
Not CPU: the layout review ignores recorded keeps, so each hand-back re-raises them and cues another empty round; plus a false positive on a distribution:end single-control row.

<!-- xgd-turn id="ccbeef88-4ac0-4bed-8853-5040f49a060b-user" -->

<!-- xgd-chat role="user" ts="2026-10-29T15:48:34.605006+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="ccbeef88-4ac0-4bed-8853-5040f49a060b-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-29T16:09:08.810558+00:00" -->
#### Claude
Ticket is at free_coding and the branch `free-BUG-313` is cut. Next I'm reading the layout review and decision ledger code.

Still in investigation: the layout hold re-cues the consultant with owed findings after a hand-back that changed nothing. Now checking the finding identity and the grid check.

Now examining how the grid ("edges") check measures a section's content box, to fix the `distribution: end` false positive.

Writing a probe test that renders a real L1 page with a `distribution: end` row holding one button and runs the real layout check.

The simple fixture doesn't reproduce it; trying the variant where the button is a container wrapping its label (block child), which makes the frame descent enter the button.

Now looking at the BUG-297 workers UAT as the model for the hold tests.

Implementing. First the layout-check changes: a shared measurement comparison, `keptFinding`, and the placed-by-its-row rule in the grid check.

That second half came out convoluted; rewriting it plainly.

Now the grid check change.

Grid false positive gone. Now the plan side: the `layout_kept` decision recorded through `set_decision`.

Now the surface: a `findings` parameter on `set_decision`, and `client_said` extended to cover the keep.

Now filtering kept findings in `siteLayoutChecker`, so the host look and the builder's page map both leave them out.

Now telling the consultant how to record a keep, in the look's report and the layout cue.

Recording a keep mid-message must also release the hold already owed for that line (as BUG-297 does for the structure). Adding a line-level matcher and the round-end release.

Typecheck clean. Writing the UATs, starting with the grid one (real renderer + real Chromium), turned from the probe.

Passes. Confirming it fails without the fix by disabling the walk-up temporarily.

Grid UAT is real evidence (red without the fix, green with it). Now the workers UATs for the keep and the hold.

Four consultant requests instead of two — some other hold fired. Checking which cues opened them.

The extra rounds are the critic's review falling due for a first pass — unrelated to layout. Making the test site established (past its first draft), as BUG-297's test does.

Both green. Now confirming they're red without the host-side fix.

Red without the fix, green with it. Now running the regression scope: layout-check, plan-surface/priming and the hold suites.

Six failures. Baseline them against the unchanged layout check before blaming the diff.

The baseline run printed nothing; rerunning it step by step.

All six are red on the unchanged code too (pre-existing). Restoring my changes and confirming the failure details match.

Layout failures are identical with and without my change (only REQ-358's unrelated KB detail differs). Now the workers suites around the hold and `set_decision`.

Hit the known "long filter finds nothing" quirk; passing short ID filters instead.

zsh doesn't word-split `$T`; rerunning with `${=T}`.

All three are red on HEAD too. Checking whether my surface text makes the budget overage worse.

My additions grow the consultant's authored prompt by ~430 bytes on a budget that's already over on HEAD (205,134 vs 205,000). Trimming my surface text to the minimum.

Now +222 bytes on a budget already red on HEAD; I'll record that. Re-running my workers UATs after the text change.

Reviewing the full diff before committing.

Diff looks right. Reading my notes on this project's free_coded gate before committing.

Committing the code on the branch first.

Now the merge-back sequence: lock, merge xgd-working into the branch, bump, commit.

Nothing in code came in with the merge. Committing the version bump and merging back.

Merged as a fast-forward. Now syncing the ticket body to what landed (keeping the existing sections), then moving it to free_coded.

Done and merged. One note worth keeping for later sessions: a "No test files found" from vitest here was zsh not word-splitting `$VAR`, not the long-filter quirk.

BUG-313 is fixed and merged into xgd-working. The ticket is at `free_coded` with both commits (`c2e5547d33` for the fix, `627f9cb3e5` for the version bump to 0.2.699) and 3 story points, and the branch is cleaned up. Nothing is deployed yet, so production still repeats the message until you deploy.

**What changed**

1. **Keeps are recorded.** When the client chooses to keep something a look flagged, the consultant records it with `set_decision` on a new `layout_kept` decision. It passes the flagged lines in `findings`, copied as the look wrote them, and the client's words in `client_said`; both are required. It uses the existing decision ledger: the decision is marked chosen and a decision-log entry is written in the client's words. The critic reads it along with the other decisions.
2. **A kept finding isn't raised again.** The layout checker leaves it out of both the host's look and the builder's page map, so a builder isn't told to "fix" it either. It comes back if that part of the page changes, or if its measurement moves more than 2px from what was kept. Each screen width is a separate line, so a keep has to be recorded per width.
3. **No empty rounds.** A keep recorded in the reply to a look releases that finding's hold straight away. A hand-back whose remaining findings are all kept doesn't trigger another round, which is what caused the two near-identical messages. The look's report and the follow-up prompt now tell the consultant to record a keep instead of repeating it to the client.
4. **Grid false positive fixed.** A row that places its one control at its end or centre (like Sign in) counts as on the grid. A lone control placed at the start is still measured as before.

**Tests:** three new tests, all passing now. I checked that each one fails with its part of the fix disabled.
- `test_UAT_FC_BUG-313_kept_finding_is_not_re_raised`: a recorded keep stops the finding, and moving Sign in from 15px to 12px brings it back.
- `test_UAT_FC_BUG-313_all_kept_hand_back_starts_no_round`: a hand-back with only kept findings gets one reply and no extra round.
- `test_UAT_FC_BUG-313_end_distributed_single_control_on_grid`: uses the real renderer and Chromium. Before the fix it reported "content from 1097px to 1200px, off this site's grid".

**Failing tests that already failed before this change:** BUG-237 (contact form), BUG-276 (logo), REQ-358 (map), REQ-415 (clean page), REQ-418 (two table tests), REQ-436 (ceiling), and the REQ-466 and REQ-473 prompt-budget tests. The six layout ones fail identically with and without my change.

**Decision for you:** the consultant's prompt budget test was already over its limit (205,134 of 205,000 bytes), and the new `findings` parameter adds 222 bytes, taking it to 205,356. I cut the wording to the minimum. Making room for it would need trimming elsewhere, which I didn't do.

<!-- xgd-chat-end -->
---
uid: comment-83296f6b
id: COMMENT-7903
type: comment
title: Comment on bug BUG-371
created_by: xgd
created_at: '2026-11-06T16:52:31.439310+00:00'
updated_at: '2026-11-06T17:05:20.972715+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-01080809
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "22dc64fc-a656-404d-bfe8-e696f789e840",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="2a7fecef-e056-4ed9-a08b-07cca201a80e-user" -->

<!-- xgd-chat role="user" ts="2026-11-06T16:51:49.642075+00:00" -->
#### You
Triggered by: martin-github@westhead.me

Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
If this bug is a dupe, please close it as wont_fix with an explanation in its body referencing the duplicate

<!-- xgd-turn id="2a7fecef-e056-4ed9-a08b-07cca201a80e-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-06T17:05:19.502789+00:00" -->
#### Claude
Not a duplicate (BUG-360 is the related estimate-survey ticket, already landed). Starting the free-coding flow: marking `free_coding`, cutting the branch, then investigating the code.

Not a dupe. Reading the survey tool, the `configure_component` declaration, and the method/playbook text next.

Playbook is DOC-75 (a system-KB doc ticket); I'll add the settings/verbatim/clear-to-default lines to its refinement section at merge time. Reading it and the commissioning prose now.

Writing the estimate changes now (`slow-tools.json`, `estimate-core.ts`, cadence's slow-tool figure, survey).

Now `estimate-core.ts`.

Now the survey: classify declared `settings` passes, and report per-kind drift from `estimate_outcomes`.

Now the grant change.

Now the commissioning framing in `priming.json`.

Typechecking and running the affected suites.

Six failures, all pinning the rules this ticket supersedes. Updating them, starting with REQ-343.

Existing suites green. Writing the BUG-371 UATs now — checking how the BUG-360 survey test drives the CLI first.

Node UAT green. Now the scripted-consultant workers UAT (delegating deployment, checkout prompt changed then cleared).

Passes. Confirming it isn't vacuous by temporarily removing the grant:

My sed broke the JSON; redoing the negative check properly.

Negative check fails as expected; restored. Running typecheck and the wider regression scope.

Only pre-existing type errors in files I didn't touch. Now the regression suites:

Memory says REQ-416 ×3 and REQ-342 "method rides every turn" are red on clean xgd-working. Checking the messages, then baselining in the main checkout.

Identical 6 failures on clean xgd-working — pre-existing. Now node suites around the prompt and grant.

Baseline these two in the main checkout for comparison:

Updating the ticket body first, so every UAT is motivated by its text (keeping the operator's content, recording the one design decision).

Committed. Now the merge-back loop (lock → merge working in → bump → fast-forward → `move-to-free-coded`).

Landed and `free_coded`. Now story points, the DOC-75 playbook line, and branch cleanup.

I've implemented BUG-371. It isn't a duplicate: BUG-360 is the earlier estimate work this ticket replaces. The changes are merged into xgd-working and the ticket is at `free_coded` (2 commits, version 0.2.800, 5 story points). The new tests pass, and so do the existing ones I touched.

**1. The consultant now changes a component's settings itself.**
- In the delegating deployment it can now use `configure_component` (what a form's button says, a prompt, where enquiries go). This required one entry in `instances.json`.
- It still can't add or remove components or touch layout; those still go to a builder.
- Its standing instructions now say: change settings directly, with no builder and no estimate; setting a value to `null` brings back the framework default; layout and look are still handed to a builder.
- I added one line to the playbook (DOC-75, refinement section): use the client's exact wording, and if it matches the default, clear the setting instead of copying it. That is a knowledge-base doc, so it ships with the next deploy.

**2. Estimates are tighter.**
- **Typical time, not the slow end:** each kind of step is quoted at its typical (median) measured time instead of the 80th percentile.
- **Wording-only changes have their own kind**, `settings`. Its starting figure (2.5 minutes) comes from the one run you saw; the survey will replace it once there's real data. The checkout prompt change is now quoted at "about 3 minutes".
- **No fix rounds added up front:** one is added only when the layout check actually finds a fault.
- **Rounding follows the size of the job:** to the minute under 10 minutes, to the next 5 above.
- **The time left adjusts as steps finish:** a job running fast shows less time left, and one running slow shows more.
- `1c estimates survey` now shows, per kind, the share of jobs whose quote was more than twice or under half the actual time.

**Tests**
- There are two new test files. One drives a scripted consultant in the delegating deployment: it changes the checkout's delivery prompt, the draft shows the new wording, no builder runs and no estimate appears. Setting it to `null` brings back "Please select a region for delivery". The other covers the permission change, the instructions, the estimate rules and the survey report.
- I checked the consultant test isn't passing by accident: with the permission removed, it fails.
- Three existing test files that checked the old rules (no settings edits while delegating, slow-end estimates, up-front fix rounds) are updated to the new ones.

**Things to know**
- **Fix 2 and fix 4 in the ticket conflict.** Fix 2 kept up-front fix rounds for layout steps; fix 4 drops them for every step. I followed fix 4 and recorded that in the ticket.
- **The consultant's prompt is a bit bigger:** about 1,800 characters more (198,060 → 199,839), mostly because the newly allowed tool's description is now included. It was already over its budget of 191,200 before this change, so that test was already failing.
- **Eight other tests fail without my change too.** They fail identically on a clean xgd-working: REQ-416 ×3, REQ-342 "method rides every turn" ×3, REQ-386's 20-second rule, and the prompt budget.
- **`xgd branch clean BUG-371` didn't run** because BUG-370 holds the merge lock. The branch is fully merged; `xgd branch clean --stale` will tidy it up later.

<!-- xgd-chat-end -->
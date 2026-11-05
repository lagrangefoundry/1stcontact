---
uid: comment-51e983ea
id: COMMENT-4861
type: comment
title: Comment on bug BUG-186
created_by: xgd
created_at: '2026-10-03T22:32:54.228502+00:00'
updated_at: '2026-10-03T22:48:17.019807+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-7f1578c8
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "13d9a9c9-4f4e-4105-8c25-fda8c437df95",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="ddc839eb-be1d-4a4d-bf6a-4c5d00f1b3fc-user" -->

<!-- xgd-chat role="user" ts="2026-10-03T22:31:06.701846+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="ddc839eb-be1d-4a4d-bf6a-4c5d00f1b3fc-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-03T22:48:15.261219+00:00" -->
#### Claude
Branch cut; reading the probe code (`probes.ts`) for items 1 and 2 now.

Still investigating — looking for where the reference's sections get coalesced (item 3).

Checking whether a later iteration's values-diff already shows item 3 resolved (BUG-179 landed after this ticket was filed).

Now the edits. First, `EnvelopeReport` and `envelopeAt`:

Now item 2 — geometric pairing for non-text leaves in `sampleFidelityProbe`:

Now thread the oracle through `repro.ts` so its printed counts match the gate:

Typecheck clean. Measuring on the real bundle — running the branch's `1c` against the main checkout's storage:

Item 2: 36 `(generic)` residuals → 0. Item 1: 100 overlaps + 14 buried set aside as reference-identical. Checking that the 11 still reported are real reproduction differences:

The 11 kept are real: each has a leaf displaced 11–15px or grown 19→43px versus the reference. Now the second bundle (joyfulculinarycreations.com):

Item 2 also collapses joyful's fidelity residuals 74 → 8. But 9 of the 16 overlaps are still kept, though the ticket says all 16 are reference-identical. Looking at why:

Joyful: 16/16 overlaps now set aside, which is the ticket's "Fixed" state. On hearingzone only the 11 real displacements remain. Next, the UATs — looking at an existing box-element fixture:

Without `measured` the evaluator estimates heights, so the pair doesn't collide. The real gate always passes `measuredTextHeights(oracle)`, so the test should too:

Now confirming tests 1 and 3 fail on the old probe code (so they're real evidence):

Both fail on the old code; the guard rail passes either way, as intended. Now the regression scope — every suite touching the probes or the gate:

All pass; 6 tests skip because the reference bundles are gitignored and missing from the worktree. Identifying them:

Two of those (BUG-180 real bundles, REQ-255 real CLI) exercise the gate on real references. Running them in the main checkout with my two files applied temporarily, then reverting:

Both pass, and the main checkout is reverted and clean. Next, the version bump and commit. Checking how this repo bumps:

The append didn't land. Checking the flag:

Ticket updated. Committing on the branch:

Committed. Now locking and merging into xgd-working:

Merged cleanly. Moving to `free_coded`, letting the gate do the version bump:

BUG-186 is fixed and merged into xgd-working, and the ticket is at `free_coded`. The ticket records two commits: the fix (`208a2af8bc`) and the gate's version bump (0.2.459), and story points are set to 3. The branch and worktree have been cleaned up.

**Item 1: overlaps the reference itself paints are no longer findings.** The on-sample probe now gets the reference. If both colliding elements match same-size elements in the reference that overlap by the same amount (within 2px), the reference paints that collision too. Those findings move to a new `inReference` list rather than being deleted, and no longer fail the probe. This works for every pair kind, not just pictures.

I made one change to what the ticket proposed: the pair may be shifted, as long as both elements moved by the same amount. On joyfulculinarycreations.com, 9 of the 16 overlaps were at viewport heights the reference wasn't captured at. There the hero moves both lines together, so the overlap is the reference's, just lower on the page. An element that grew or moved on its own is still reported.

**Item 2: textless boxes are paired with the reference by position.** Each box is matched to the reference box it overlaps most, one-to-one; document order now only breaks ties and pairs boxes that overlap nothing. Each band is no longer graded against the next band's box.

**Item 3: already fixed, so I made no change.** BUG-179 landed after this ticket was filed. Iteration 2's values-diff for this site has no unpaired reproduction sections; iteration 1 had the one at §4.

Results from running `1c l1-gate` on both sandbox sites, before → after:

| | hearingzone510.com | joyfulculinarycreations.com |
|---|---|---|
| `(generic)` residuals | 36 → **0** | 18 → **0** |
| all fidelity residuals | 135 → 87 | 74 → 8 |
| on-sample overlap | 105 → **5** | 16 → **0** |
| on-sample buried | 20 → **6** | – |

Both sites still fail the gate. joyfulculinarycreations.com still has 10 clip and 23 escape findings, and hearingzone510.com has 141 escapes. The 11 collisions left on hearingzone510.com are real reproduction problems. At 320px, "Learn to train your brain…" sits 11px below where the reference has it, and "SCHEDULE AN APPOINTMENT" and the logo are 11–15px off. "Monday & Wednesday" is 43px tall where the reference has 19px. These look like they come from the REQ-370 changes since this ticket was filed.

**Tests:** three new tests in `tests/test_UAT_FC_BUG-186_probes_compare_against_the_reference.test.ts`:
- An overlap the reference also has is set aside.
- An overlap the reproduction made bigger is still reported.
- Boxes emitted out of order still pair correctly.

The first and third fail on the old code. The 50 test files that touch the probes or the gate pass. Two of them (BUG-180 and REQ-255) need the real reference bundles, which aren't in the worktree, so I ran them in the main checkout with my two files swapped in, then reverted; they passed.

I've added a "What changed" section and test plan below the existing ticket text. The ticket is waiting for you to promote it to `ready_to_reconcile`.

<!-- xgd-chat-end -->
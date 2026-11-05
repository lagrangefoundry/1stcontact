---
uid: comment-9b245eb4
id: COMMENT-3053
type: comment
title: Comment on bug BUG-113
created_by: xgd
created_at: '2026-09-18T03:34:36.321967+00:00'
updated_at: '2026-09-18T05:11:16.084266+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-54eee0e0
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "bca2b01d-af2a-4ed4-b1bf-d7d2c9257d4d",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="d7a060c8-8e48-4471-9552-4af15bf7bafe-user" -->

<!-- xgd-chat role="user" ts="2026-09-18T03:33:42.083762+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="d7a060c8-8e48-4471-9552-4af15bf7bafe-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-18T04:05:52.638119+00:00" -->
#### Claude
Evidence gathered. Let me record the decision on the ticket before coding.

Ticket recorded. Cutting the branch now.

Now the measured-heights table itself:

Now the gate itself — grading the served document rather than the recovered one:

Now the fold's per-window reflow hold:

Now `cmdRepro` — record the choice and report the trade:

Now the body of `cmdRepro` — the served-document decision and its measurement:

Now typecheck:

Now verify the real behaviour against the retained bundles, using the branch's code:

Now gate-core.ts:

Now the three conflicted test files:

⚠️ Chat generation failed: Claude Code CLI streaming timeout (>1800s)

<!-- xgd-turn id="9d53d768-8819-480e-874c-b6ee68e68da1-user" -->

<!-- xgd-chat role="user" ts="2026-09-18T05:00:54.973735+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="9d53d768-8819-480e-874c-b6ee68e68da1-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-18T05:11:16.032001+00:00" -->
#### Claude
I'll start by reading the ticket and checking what state the prior session left things in.

The branch exists from the prior session. Let me read the full ticket body and see what already landed.

Prior session landed a commit but left an uncommitted change. Let me assess what's done and what remains.

Implementation is substantially in place. Let me verify the merged state typechecks and that the UATs pass.

`onSample` is in the report and already part of `pass`. Let me typecheck and run the UATs.

UATs pass. Now the regression scope — the suites the commit touched plus adjacent L1/gate areas.

Let me verify the ticket's central real-bundle claim against the final merged code.

Real-bundle behaviour confirms the ticket's claims. Let me verify `1c repro` also prints the recovery price, as the body states.

`1c repro` reports `off-sample 500:3` while `l1-gate` reports 0 off-sample findings on the same bundle. Let me find why they disagree.

The two paths use the same probe and widths, so the difference is in the document. Let me isolate it.

`repro` serves the bundle's retained `l1.json`; the gate re-folds from the oracle. Since this ticket changed the fold, that's likely the gap. Let me verify on a copy rather than mutating the shared bundle.

Confirmed and important: after `1c refold`, off-sample goes `500:3 → 0`. The gate re-folds from the oracle, but `repro` serves the bundle's **retained** `l1.json`. When the fold changes, those diverge — which is this ticket's exact defect one level out. Let me check the read helpers.

The gate grades a fresh fold; `repro` serves the retained `l1.json`. Let me record this decision on the ticket, then close it.

Now let me record the decision on the ticket before coding.

I edited the ticket file directly — let me redo that through the CLI, which is the supported path.

Ticket recorded. Now the implementation — the gate must grade the served artifact.

Now the implementation:

Now surface `staleFold` in the CLI report, alongside the on-sample line:

Now verify the real behaviour — the gate should now agree with `repro` and flag the stale bundle:

The gate now agrees with `repro` (3 findings, was 0) and names the staleness. Now the refolded bundle:

`staleFold` false-positives on a freshly refolded bundle. Let me find what differs.

`cmdRefold` folds with `fonts:`; the gate's fold doesn't — so it's not a like-for-like comparison. Let me align them.

`capture.ts` pulls Playwright via `./pipeline`, which gate-core must avoid. `fontResourcesFromTheme` is pure — let me move it to the pure `theme.ts` beside `primaryFamily`.

Precise. Now the UAT for this behaviour — let me match the existing file's fixture style.

`readCapture` throws when a bundle has no `capture.json` — the gate must not start requiring it. Let me degrade gracefully.

Now the UAT for the new behaviour:

The stale doc's form subtree lives in `forms.json`, which I didn't unhold. Let me check its shape.

6 pass, and non-vacuous — the same capture's fresh fold is asserted clean, so the FAIL can only come from grading the retained artifact. Typecheck and full regression scope:

I moved `fontResourcesFromTheme` between modules — let me widen the regression to the capture/font suites.

All green. Let me clean up the scratch artifacts I created.

Now the merge-back sequence: lock, merge working, bump, fast-forward, claim.

Merged cleanly. Re-verifying post-merge before bumping:

Now bump, commit, and fast-forward in one shot to avoid the version-gate race:

Fast-forwarded. Claiming `free_coded` now, before any ticket auto-commit can land:

BUG-113 is `free_coded` at 0.2.263, three commits on `xgd-working`, branch cleaned up.

## What the prior session had left

Most of the ticket was already implemented and committed: the served document is composed and graded, recovery is priced rather than applied, text-leaf envelope heights come from the oracle's measurements, and a ladder window carrying any reflow holds for every node. I verified that work on the merged tree — typecheck clean, 5 UATs and the 5 adjacent suites green — and finished the one uncommitted edit (printing BUG-112's on-sample probe, which can turn the verdict FAIL and so belongs on the report).

## The gap I found, and closed

Checking the ticket's central claim against the real bundles, `1c l1-gate` and `1c repro` disagreed about the same page:

```
l1-gate:  off-sample  PASS  (0 findings)
repro:    off-sample  500:3  900:0
```

The cause is this ticket's own defect one level out. `1c repro` serves the bundle's **retained** `l1.json`; `l1-gate` was **re-folding** `multistate.json` and grading that. They agree only until the folder changes — and point 4 above changed it, so the gate was certifying a document the operator would never be handed. Refolding a copy confirmed it: `500:3 → 0`.

So the gate now reads the retained `l1.json` + `forms.json` and grades those. The fresh fold is still computed, because `foldResiduals` is a folder-power question that only today's folder can answer, and it's folded the way `1c refold` folds — fonts included — so the two are comparable. Where they differ the gate says so and names the remedy:

```
off-sample          FAIL  (3 envelope finding(s))
⚠ stale fold: … run `1c refold --ref <bundle>` to re-derive it
```

Staleness doesn't move `pass` — the retained document *is* what gets served, so grading it is correct however old it is.

Two supporting decisions: `fontResourcesFromTheme` moved to the pure `capture/theme` module (taking it from `capture.ts` would have put Playwright back into the Worker's graph, which REQ-154 removed), with a re-export so no caller moved; and `capture.json` is read softly, since the gate has never required it and shouldn't start for an advisory comparison.

A sixth UAT pins this, and it's non-vacuous by construction: the same capture's fresh fold is asserted clean, so the FAIL can only come from grading the retained artifact.

## Verification

Typecheck clean; 42 tests across 7 suites pass post-merge. Both real-bundle behaviours confirmed by hand — stale bundle flags and fails, refolded bundle is silent and passes. Ticket body updated with the new behaviour as point 5 plus its test-plan bullet, before the code was committed.

One thing to flag: `content-robustness` still FAILs on the served base (287 findings). That is the ticket's deliberate outcome-(b) position — an absolutely-positioned page is fragile by construction, and the only recovery available costs 318 fidelity residuals at maxΔ 1426px. It's now reported *about the served page* with the recovery's price beside it, rather than answered by a document nobody serves. Closing it needs a flow recovery that preserves horizontal geometry, which this ticket explicitly scopes out.

<!-- xgd-chat-end -->
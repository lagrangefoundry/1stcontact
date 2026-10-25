---
uid: comment-1f10286b
id: COMMENT-4900
type: comment
title: Comment on bug BUG-201
created_by: xgd
created_at: '2026-10-04T18:39:08.752631+00:00'
updated_at: '2026-10-04T18:48:33.721046+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-b6ec83c7
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "befff42e-e8f9-4fea-9861-b4a40bb8e75d",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="4bae3460-fbea-410a-b8ed-deac0837f97e-user" -->

<!-- xgd-chat role="user" ts="2026-10-04T18:38:01.224146+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="4bae3460-fbea-410a-b8ed-deac0837f97e-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-04T18:48:33.297666+00:00" -->
#### Claude
Reading the gate reconciliation code now — the ticket is fully specified, so I'm implementing directly on branch `free-BUG-201`.

Found the consumer side: `tools/repro-console/src/unmeasured.ts` computes the round's unmeasured count. Reading it next.

Now checking how `gate.ts` and the `l1-gate` CLI pass the L1 result through, then I'll edit.

Implementing the gate-core changes now.

Now the edits — types first.

Now item 2 — the recovery's own findings and residuals in `l1-gate --json`.

I'll keep that existing CLI wording (it's pinned by a BUG-112 UAT and not in scope) and revert it.

Now the console side: fold `sampleFidelity.unmatched` into the `populations` part of the unmeasured set.

Now the UATs. Looking at how the BUG-112 and BUG-139 tests build real documents/oracles and write `gate.json`.

Writing the UAT file.

Ordering bug in my console edit — moving the `notDrawn` block ahead of `populations`.

All 4 pass. Running the regression scope (every suite that touches `reconcileGates`, `cmdL1Gate`, or the unmeasured set) plus a typecheck.

Both typecheck clean. Now the regression suites.

Checking whether those 4 failures are mine or pre-existing.

Those fixtures hand-build a stale-shaped `sampleFidelity` (no `unmatched`/`residuals` arrays). I'll make the reader tolerate absent lists rather than editing four other tickets' UATs.

26 files / 233 tests green, typecheck clean. Running the repro-console suites and the workerd fidelity suite too.

Verifying against the real joyfulculinarycreations bundle (lives in the main checkout; reading only).

Green. Before committing, reading my notes on this project's version-bump/promotion mechanics.

Plan: commit on the branch, then lock → merge working into the branch → fast-forward working → `move-to-free-coded` without `--version` (it bumps itself, avoiding the race) → clean.

Committed. Now updating the ticket body — appending the implementation record below the existing filed content.

Landed on `xgd-working`. Now the gate (no `--version`, so it bumps itself), then story points and teardown.

BUG-201 is done and parked at `free_coded`, on `xgd-working` but not yet reconciled. Both changes the ticket asked for are in.

**1. `gate.json` now reports the sample-fidelity probe**
- Runs the reference shows but the page doesn't draw now appear in `layout.findings` as `missing-at-width`. Runs drawn more than the tolerance away from the reference appear as `displaced-at-width`. Both come first, ahead of overlaps and escapes, sorted narrowest width first.
- The diagnosis opens with one clause per width ("6 run(s) the reference paints at width 320px are not drawn; …"). The next step now starts with "Draw each missing run at the width named…".
- `gate.json` also carries the probe's full results in a `sampleFidelity` block.
- The repro console now counts those undrawn runs in the "populations" part of its unmeasured total. Older reports without the `sampleFidelity` block keep the totals they had before.

**2. `l1-gate --json` explains the recovery**
The `recovery` block now lists its `findings`, `residuals` and `unmatched` runs alongside the existing counts.

**Checked on the real joyfulculinarycreations bundle:**
- `l1-gate --json` gives 1642 recovery findings, 35 residuals and 23 unmatched runs, matching the ticket's numbers.
- Feeding that result into the gate logic gives 23 `missing-at-width` (12 at 320/375, leading the diagnosis), 8 `displaced-at-width`, then the original 92 escapes. The headline reads `unmeasured 23`.

**Not run:** the full `1c gate` re-gate from the ticket's "How to see it", because it needs Chromium. So the diagnosis above came from running the gate logic on the real `l1-gate` result, not from an actual `gate.json` file.

**Tests:** 4 new UATs in `tests/test_UAT_FC_BUG-201_missing_at_width_reaches_gate_json.test.ts` pass. All suites that touch the gate or the unmeasured count pass (25 files), as do all 30 repro-console suites and the workerd fidelity suite. Typecheck is clean for both tools.

**Two decisions you might want to revisit:**
- **The new UATs and four existing ones:** existing UATs (BUG-153/161/174) pass a `sampleFidelity` object without the `unmatched`/`residuals` lists. The gate treats missing lists as empty rather than crashing, so I didn't touch those tests.
- **Diagnosis wording:** it now covers all widths, not just phones. On this bundle it also names 2–5 missing runs at each of 768–1440px.

The ticket body has an implementation record and test plan appended below your original text. It records the fix commit `fb10ac1b2f` plus the automatic version-bump commit `ec47de1ac8`, with 3 story points. Promoting to `ready_to_reconcile` is your call.

<!-- xgd-chat-end -->
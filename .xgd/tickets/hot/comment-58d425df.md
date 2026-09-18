---
uid: comment-58d425df
id: COMMENT-3044
type: comment
title: Comment on bug BUG-106
created_by: xgd
created_at: '2026-09-18T00:42:24.309167+00:00'
updated_at: '2026-09-18T00:55:08.653928+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-05944381
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "d7dd6492-8e0c-4ea3-946b-70c91dc78767",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="4555b52b-411c-49ac-a5ff-005e0fd5d63b-user" -->

<!-- xgd-chat role="user" ts="2026-09-18T00:41:12.525925+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="4555b52b-411c-49ac-a5ff-005e0fd5d63b-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-18T00:55:07.785083+00:00" -->
#### Claude
I'll start by reading the ticket to understand what's being asked.

Ticket is well-specified. Let me scope it and start.

Now cutting the branch.

Now the pass rung and assembly:

Now the human output in `gate.ts`:

Now the fidelity surface declaration:

Now merge back to `xgd-working` under the lock.

Now clean up the branch and release the lock.

Done. BUG-106 is `free_coded` on `xgd-working` at version 0.2.252.

## What changed

**`GateReport.values` now carries what the counts are worth** (`tools/generate/src/cli/gate-core.ts`). The old `Pick<ValuesDiffReport, 'deltas'|'matched'|'unmatched'>` was the whole defect — it made two facts impossible to carry:

- `unpairedActual` — the repro-side mirror of `unmatched` (which counts unpaired *expected* objects only), now a required input following the `perceptual.regions` precedent of asking only for something countable, so it can never be structurally excluded again.
- `sectionsNotComparable` — BUG-102's reason, optional because it is optional upstream; absent genuinely means "the sections *were* comparable".

**The pass rung enumerates what the run is carrying.** "Nothing outstanding from this gate." was set from the delta count alone; on the gigabytealchemy run it was false three ways at once. It now names outstanding deltas, unpaired repro objects, not-comparable sections and coverage findings — each pointing at where its detail already sits in the same report rather than quoting it — and falls back to the original sentence only when it has earned it. **No rung moved and no run changes verdict.**

**The human report prints both** — the unpaired count on the `values-diff` line, and a wrapped `⚠ section values NOT comparable: …` row beneath it.

**`check_fidelity` hands the model the same block**, so `fidelity-surface.json` names the two new keys (with an explicit "read this before you trust a delta count of zero") and `surface_version` moves 4 → 5.

## Evidence

`tests/test_UAT_FC_BUG-106_gate_reports_what_it_measured.test.ts` — 6 UATs driving the real `cmdGate` through BUG-100's offline seams (synthetic bundle, pre-shot PNG, pre-extracted manifest; no browser, nothing we own mocked): the not-comparable reason on a pass, the unpaired count where `unmatched` reads 0, a coverage finding named rather than contradicted, a genuinely silent pass still saying so, the human output carrying both, and the verdict ladder unchanged under a breaching eye.

Regression scope green: BUG-100, BUG-102, BUG-103 ×2, BUG-99, req94 / reconciliation cross-gate, 3-probe gate ×2, bug15 flat-DOM, req63, REQ-156 (workerd), REQ-157, REQ-254 console, req86/req88 repro, and the seven surface-declaration suites. `tsc --noEmit` clean across `tools/generate` and `tests`.

One existing test changed: `test_UAT_FC_REQ-157_fidelity_surface.test.ts` hand-builds `ReconcileInput.values`, so its two fixtures now declare `unpairedActual: []` — which is exactly the point of making the field required.

Two notes on the landing: another session was merging concurrently, so the version-claim gate lost three races before winning at 0.2.252 (intermediate bump commits are recorded on `fields.commits` alongside the fix). The ticket body carries a "Decisions taken in implementation" section covering the behaviour beyond the literal proposal — chiefly that the pass rung names *everything* outstanding, not only the coverage finding.

<!-- xgd-chat-end -->
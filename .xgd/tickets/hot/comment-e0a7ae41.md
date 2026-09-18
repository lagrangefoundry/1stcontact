---
uid: comment-e0a7ae41
id: COMMENT-3056
type: comment
title: Comment on bug BUG-111
created_by: xgd
created_at: '2026-09-18T03:35:13.045174+00:00'
updated_at: '2026-09-18T03:47:08.556821+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-edb865dc
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "fe70673f-3fba-4e71-8a80-32ff92c2a87d",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="1a6c11ef-c5ec-476e-a62f-302a2fe20c96-user" -->

<!-- xgd-chat role="user" ts="2026-09-18T03:34:32.488581+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="1a6c11ef-c5ec-476e-a62f-302a2fe20c96-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-18T03:47:08.332333+00:00" -->
#### Claude
I'll start by reading the ticket to understand what's being asked.

The ticket is thoroughly specified. Let me examine the code.

Now the gate side.

The ticket is complete and unambiguous. One design call I'll make and report: the fix will change what a reproduction manifest carrying *no* bands at all reports, which touches one BUG-106 fixture. Starting.

Good, node_modules exists. Now let me implement the values-diff changes.

Now the type additions in `values-diff.ts`:

Now the computation and the report construction:

Now export the type and update `formatReport` to read the field:

Good — `export *` covers it. Now `formatReport` in `fidelity.ts`:

Now `gate-core.ts` — the input type, the report type, the rung, and the return:

Now the human-readable gate report line in `gate.ts`:

Now the AI surface doc, then typecheck:

Clean. Now update the existing test fixtures that construct these types, and check the tests typecheck:

Now the UAT file for BUG-111:

All 11 pass. Now the regression scope — the suites that touch these types:

Clean (the `generated/` copy is gitignored). Now updating the ticket body with what landed, including the two consequences beyond the ticket's three numbered items:

Now commit on the branch, bump version, merge back:

Done. BUG-111 is at `free_coded` with both commits landed on `xgd-working`.

**What the fix does.** A reference band with no reproduction counterpart now reaches the gate as a number instead of dying inside `values-diff.json`'s `sectionPairing`:

- `ValuesDiffReport` gains `unpairedSections` and `unpairedActualSections` (entries are `{ label, box? }` — the ticket's item 3). Both are derived from the same pairing pass that builds `sectionPairing`, so a count cannot disagree with the rows it summarises, and both are empty under BUG-102's flat-L1 verdict, which already stands in for the whole per-section pass.
- `GateReport.values` carries both counts; `ReconcileInput.values` requires them, for the same reason BUG-106 made `unpairedActual` required.
- The pass rung gains **one** rung covering both sides, naming `values.unpairedSections` and ending with what the gap costs: those bands' overlay/contentAnchor/textAlign are UNMEASURED rather than clean. The verdict ladder is untouched — counted, never escalated, as the ticket scopes.

**Three things I decided myself and wrote into the ticket body:**

1. The operator report (`formatGateReport`) prints a row for it. Every count on its `values-diff` line is about *elements*; a band with no counterpart is invisible in all of them.
2. `formatReport` (`1c values-diff`) already printed the reference side, recomputed inline. It now reads the report's fields — one definition site — and names the repro side, which nothing ever did.
3. `ai/fidelity-surface.json` documents both keys, since `check_fidelity` returns `report.values` verbatim to a model.

**One existing test needed a fixture repair, and it's worth flagging.** BUG-106's `actualManifest(…, flat: false)` emitted *no* repro bands at all, so under the new definition every reference band is unpaired — which meant its `a_genuinely_silent_pass_still_says_nothing_outstanding` UAT had been asserting a silence its own fixture never earned. The helper now mirrors the reference's bands one for one, so the section pass is genuinely clean and the AC is pinned by a fixture that actually meets it. BUG-106's intent is unchanged; only its fixture was wrong.

**Evidence.** 11 new UATs in `tests/test_UAT_FC_BUG-111_unpaired_section_reaches_the_gate.test.ts` — six at `diffManifests` on the real gigabytealchemy geometry, five driving the real `cmdGate` through the offline seam (no browser, nothing we own mocked) over a reproduction that segments into two bands where the reference has three. All pass. Regression scope of 20 values-diff/gate/fidelity/surface suites green, and `tsc --noEmit -p tools/generate/tsconfig.json` clean.

I did not re-run `1c gate` against the live gigabytealchemy bundle to confirm the before/after in the ticket's "how to know it is fixed" section — that needs Chromium, which this session can't launch. The synthetic fixture reproduces the same shape.

<!-- xgd-chat-end -->
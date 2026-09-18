---
uid: comment-bfb31b12
id: COMMENT-3052
type: comment
title: Comment on bug BUG-110
created_by: xgd
created_at: '2026-09-18T03:33:01.838577+00:00'
updated_at: '2026-09-18T03:58:16.316607+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-8fef172e
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "a4e6c704-41c8-4b84-b8f9-54adc354e089",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="a2797291-5c23-49c8-9ddc-72dca2180a87-user" -->

<!-- xgd-chat role="user" ts="2026-09-18T03:32:02.098168+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="a2797291-5c23-49c8-9ddc-72dca2180a87-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-18T03:58:15.291221+00:00" -->
#### Claude
Now let me set up the branch and start.

Now the core change in `gate-core.ts`:

Now the floor type and report shape:

Now the reconciliation itself:

Now the ladder itself:

Now `gate.ts` — the type re-export, options, and the operator read:

Now `index.ts` exports and the CLI flag:

Now typecheck:

Now run the affected suites to see exactly what breaks:

Now let me patch the two test files:

Now the REQ-157 fidelity surface test:

Now lock, merge back, bump, and fast-forward:

BUG-110 is implemented and landed. No blocking questions came up — the ticket's diagnosis and proposed change were precise enough to build from, and I made the open calls myself.

## What landed

The value gate now has **a floor of its own**, held and echoed exactly as the perceptual floor is.

- **`VALUES_TIER_FLOOR`** (`gate-core.ts`) — the worst `SeverityTier` a passing run may carry, default `MEDIUM`. I widened the ticket's suggested `tier !== 'HIGH'` into a **ceiling**, because that cut leaves `CRITICAL` (absent content, changed text) passing — the same defect one tier up. The line sits where the tier table already draws it: LOW is tone, MEDIUM is treatment, HIGH+ is structure. So REQ-94's reason for the gate survives — it does not become a second `1c values-diff`.
- Ordering reads the now-exported `TIER_RANK` rather than a second copy of the taxonomy. An unclassifiable tier ranks 0 and cannot breach.
- **Ladder**: `pass` needs both floors. `capture-incomplete` is now explicitly gated on the *perceptual* breach — its whole diagnosis is "the value gates are BLIND", which would be false about the very deltas that failed the run. Under a breaching eye, BUG-100's coverage-before-deltas ordering is untouched. `reproduction-wrong` gained a values-only prose variant naming the tier and the bound.
- **Report**: `floor.valuesTier`, `valuesBreach`, `values.worstTier`. `PerceptualFloor` → `GateFloor` (it carries a non-perceptual bound now). The operator read prints the value bound on its own line.
- **Dial**: `1c gate --values-tier <CRITICAL|HIGH|MEDIUM|LOW|none>`; `none` is the pre-BUG-110 behaviour, and a typo'd tier is refused by name.
- `fidelity-surface.json` 5 → 6: `check_fidelity` now says what `pass` means.

## One thing to flag

**AC-856 is narrowed, and I've recorded that as explicit supersession on the ticket.** Its criterion said the delta count "never enters the verdict". The count still doesn't — forty tonal deltas still pass — but its worst *severity* now does. Four neighbouring UATs (AC-852/855/856, REQ-94's) reached the pass rung through an **empty** reproduction manifest, which is a CRITICAL `presence` delta; they now carry the reference's run with one sub-floor axis drifted, which is the case those ACs are actually about.

## Evidence

11 new UATs in `tests/test_UAT_FC_BUG-110_gate_weighs_value_severity.test.ts`, driving real `cmdGate` and `cli.run(['gate',…])` offline. The first reproduces the ticket's own run — 11 headings + 2 links as `generic`, byte-identical screenshots — and reads the 13 HIGH deltas back off `values-diff.json` the way the ticket's `jq` line does. I verified they are real evidence: with the bound disabled, 9 of the 11 fail.

Full suite on the merged tree: **5004 tests, 10 failures across 5 files, none touching the gate** — 4 reproduce on a clean checkout, 6 are the known worktree-location artifact (builder origin 503s outside the main checkout).

Merge-back hit a real conflict: **BUG-111** had landed in the same two files while I worked. Both hunks were additive and I kept both sides — `values` now carries `worstTier` *and* `unpairedSections`/`unpairedActualSections`.

`0.2.260`, commits `db4402de04` + `0d322e88de`, ticket at **`free_coded`**, story points 3. I also updated DOC-53's verdict-ladder section, since a stale ladder table there would mislead the very loop that filed this.

<!-- xgd-chat-end -->
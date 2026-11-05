---
uid: comment-a5c00505
id: COMMENT-3150
type: comment
title: Comment on request REQ-278
created_by: xgd
created_at: '2026-09-18T23:42:33.279743+00:00'
updated_at: '2026-09-19T01:04:10.065315+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-5ce26a94
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "b500cead-37ce-429f-a468-9809bfb8c783",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="624f1446-abb4-4626-ac42-8c1a18ee0813-user" -->

<!-- xgd-chat role="user" ts="2026-09-18T23:41:46.240764+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="624f1446-abb4-4626-ac42-8c1a18ee0813-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-19T00:14:03.395625+00:00" -->
#### Claude
I'll start by reading the ticket to understand the scope.

The ticket is well-specified. Let me start the free-coding flow and set up a measurement harness.

Now I'll implement. Starting with the L1 substrate — the new placement axis:

Now the renderer — the flow emission branch:

Now the analytic evaluator:

Now the recovery itself — the heart of the ticket:

The y-ordering breaks the fidelity probe's document-order pairing. Let me test the document-order variant:

The model is now exact at rest; the residuals are pairing artifacts from reordering. Let me preserve document order everywhere:

The remaining failures are 2-D grids flattened to 1-D bands. Let me add column-cell detection (an XY decomposition):

Now rewire the emission to use cells:

Cells over-merge. Let me restrict them to genuine responsive grids:

The recovery is now fidelity-free. Let me wire the serving decision:

Now `1c repro` — serve the winner:

⚠️ Chat generation failed: Claude Code CLI streaming timeout (>1800s)

<!-- xgd-turn id="798dae42-f009-47bd-a974-386b4611d795-user" -->

<!-- xgd-chat role="user" ts="2026-09-19T00:15:26.620819+00:00" -->
#### You
please complete the free-coding of this ticket

Project note (additive — does not override the above):
Please be aware that in this current chat environment, background jobs die. Please be sure to run any tests in the foreground.

<!-- xgd-turn id="798dae42-f009-47bd-a974-386b4611d795-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-19T00:46:04.809120+00:00" -->
#### Claude
I'll pick up where the prior session left off. Let me first establish the current state.

Now let me review the core of the work — `chooseRecovery` and the rewritten `promoteToFlow`.

Now let me wire `repro` to serve the winner.

Now restructure `cmdRepro` so the oracle is read before the page is assembled and the winner is what gets written.

Now the CLI output for `repro`:

Now let's measure on the three references. First, build the CLI.

The recovery now costs zero fidelity, but it regresses on-sample/off-sample from PASS to FAIL. Let me refold first and then look at those findings.

Now the evaluator: an absolute node must resolve against its nearest in-flow ancestor.

Now add `origin` to `Ctx` and its construction sites.

Now compute the discontinuous segments in `rewrite` and thread them through.

Now fold `backwards` into the discontinuity set and rewrite the stale doc comment.

Now set the serving rule in `chooseRecovery` to be per-dimension and explicit.

Now measure all three references, as the ticket requires.

Now verify `1c repro` serves the winner end-to-end.

Now the regression suite.

Now the rest of the affected suites.

Stale-fold test repaired. Now the "never served" test, which REQ-278 supersedes directly.

Now the two pre-existing BUG-112 failures (red at HEAD too, in the area I'm changing).

Now write the REQ-278 UATs, then run the full suite.

All eight pass, including the real-reference leg. Now the full suite.

While that runs, let me update the ticket body with the measured results.

⚠️ Chat generation failed: Claude Code CLI streaming timeout (>1800s)

<!-- xgd-turn id="eaca4d44-7f74-464b-b467-4e2a165a6123-user" -->

<!-- xgd-chat role="user" ts="2026-09-19T00:46:28.481616+00:00" -->
#### You
please complete the free-coding of this ticket

Project note (additive — does not override the above):
Please be aware that in this current chat environment, background jobs die. Please be sure to run any tests in the foreground.

<!-- xgd-turn id="eaca4d44-7f74-464b-b467-4e2a165a6123-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-19T01:04:09.805111+00:00" -->
#### Claude
I'll re-establish the current state before doing anything.

The implementation and UATs are in place from the prior session. Let me verify by running the tests.

All three references are present, so the real-reference leg genuinely ran. Now let me produce the measured table for the ticket body.

Now let me measure both candidates on all three references, in BUG-113's units, for the ticket table.

Clean numbers. Now let me clean up scratch artifacts and run the affected suites.

All green. Now the full suite.

Two of the seven are mine to answer for. Let me restore and investigate.

Now I'll add the two provocation cases the new rules require.

BUG-48 green. Now lint and typecheck.

Now let me update the ticket body with the measured results before committing.

Clean. Committing the code.

Now the merge lock and merge-back.

Merge is clean. Re-verifying my suites against the merged tree before bumping.

Now fast-forward xgd-working.

Fast-forwarded. Now claiming `free_coded`.

Branch landed and cleaned. Final verification on `xgd-working`:

REQ-278 is complete and at `free_coded`.

## What landed

**A new L1 axis, `geometry.place`.** `'absolute'` (the default, so every pre-existing document is untouched) reads a keyframe's `x`/`y` as `left`/`top`. `'flow'` reads the *same* `x`/`y` as leading offsets from the flow cursor — `margin-left`/`margin-top` on a box that stays in the flow, emitted `position: relative` so it also remains the containing block for absolute descendants. The validator refuses an in-flow track that also carries a column anchor or a `viewportResponse.yFactor`; both would emit two rules for one axis.

**The recovery keeps geometry instead of dropping it.** `promoteToFlow` groups colliding pinned siblings into bands, keeps members side by side in a `row` where they're horizontally disjoint and stacks them per-width where they aren't, and places each with the same keyframes read as offsets from the previous sibling's captured bottom — which reproduces the capture exactly at every sampled width.

**One decision, shared by both verbs.** `chooseRecovery` prices both candidates for `1c repro` (writes the winner) and `1c l1-gate` (grades the winner), so BUG-113's invariant holds in the new direction. The rule binds in order: fidelity isn't for sale, neither are the captured widths, and only then must the envelope strictly improve.

## Measured — it wins on all three references

| reference | regions | on-sample | envelope | maxΔ px | residuals | unmatched |
|---|---|---|---|---|---|---|
| `gigabytealchemy.ai` | 5 | 0 → 0 | **287 → 118** | 0.89 → 0.89 | 0 → 0 | 0 → 0 |
| `faelan.com` | 1 | 38 → 38 | **105 → 21** | 0.95 → 0.95 | 0 → 0 | 0 → 0 |
| `joyfulculinarycreations.com` | 4 | 11 → 11 | **490 → 95** | 0.98 → 0.98 | 0 → 0 | 0 → 0 |

Against BUG-113's cost column on `gigabytealchemy.ai`: **maxΔ 1426px → 0.89px, 318 residuals → 0, 12 unmatched → 0**. The recovery gives up nothing against the oracle, and is served on all three.

Two things I want to flag rather than bury, both written into the ticket body:

- **Content-robustness is not clear.** 116 findings remain on the epic's reference. This raised the ceiling; it didn't reach it.
- **Off-sample trades slightly upward on two references** (gigabyte 0→2, joyful 18→25) in exchange for the large robustness drop. That's rule 3 working as designed — the envelope is scored as one number. What's protected separately is on-sample, and that doesn't move anywhere.

## Tests

8 UATs in `test_UAT_FC_REQ-278_flow_recovery_preserves_geometry.test.ts`, all through real entry points; the eighth is the leg that produced the table above. Full suite: **5011 passing, 7 failing**. Five of those seven are red on the same branch with my changes stashed (I verified by stashing), and the sixth (`req115-builder-shell`) passes in isolation and fails only under full-suite parallel load. The seventh, `BUG-48`, *was* mine — adding two structural rules broke its reference-covers-its-source contract, so I added provocations for both; it's green.

Ticket is at `free_coded` with both SHAs recorded and confirmed as ancestors of `xgd-working`. Promotion to `ready_to_reconcile` is your call.

<!-- xgd-chat-end -->
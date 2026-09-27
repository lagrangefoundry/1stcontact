---
uid: comment-5edf4fa3
id: COMMENT-4087
type: comment
title: Comment on bug BUG-158
created_by: xgd
created_at: '2026-09-27T20:00:46.230614+00:00'
updated_at: '2026-09-27T20:11:04.808552+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-5297b021
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "33132f40-98ed-47fd-a413-71938f0a0a4c",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="f4501218-8a90-42df-8cb7-1f3fad07f211-user" -->

<!-- xgd-chat role="user" ts="2026-09-27T19:59:33.220414+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="f4501218-8a90-42df-8cb7-1f3fad07f211-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-27T20:11:04.670317+00:00" -->
#### Claude
I'll start by reading the ticket to understand the scope.

The ticket is thoroughly specified. Let me verify the code state.

The ticket is fully specified and the boundary is exactly as described. No blocking questions — the change is a one-field passthrough at the report boundary, and `gate.json` is literally `JSON.stringify(reconcileGates(...))`, so a UAT on the reconciled report *is* a UAT on the artifact.

Starting the free-coding flow.

Now the change. First the interface:

Now the `EvalBox` type import:

Now the UAT:

Now run the tests:

Three tests fail without the fix; the two rails correctly still pass. Now the regression scope:

A genuine collision with BUG-112's pinned key-set. Let me read it:

All 105 pass. Now typecheck and lint:

All green. Now let me add the ticket language covering behaviour I implemented that the body doesn't yet state:

Clean tree — no stray artifacts. Committing:

Now lock and merge back:

Fast-forward, so the version-bearing commit is the tip. Now the gate:

I mistyped the SHA tail.

Ticket auto-commits from other sessions keep landing in the gap. Retrying with bump and claim in one chain:

Adding the intermediate bump commit so nothing of mine is stranded:

Now verify the tests pass on merged `xgd-working`, then tear the branch down:

Done. BUG-158 is at `free_coded`.

## What landed

`gate.json`'s `layout.findings` now carry the geometry their `detail` asserts.

**The fix** (`tools/generate/src/cli/gate-core.ts`) — `LayoutCollision` gains `boxes?: EvalBox[]`, and `layoutCollisions` copies it through when the probe finding carries one. Three decisions I made beyond the ticket's literal text, all now stated in the ticket body:

- **`EvalBox` imported from the probes module, not redeclared.** The boxes a collision carries *are* the probe's own, so a structurally-identical local copy would let the two drift and read to a caller as two different facts.
- **Copied rect by rect, not aliased** — for the same reason `paths` is already copied: a collision list outlives the report it was flattened from.
- **Omitted, not emptied,** when a finding has no geometry. `boxes: []` would read as "measured, and there were none" — a different and false claim.

`check_fidelity` passes `report.layout` through whole, so the same record reaches the AI tool surface too; no change needed there.

**The evidence** — `tests/test_UAT_FC_BUG-158_gate_json_carries_collision_geometry.test.ts`, five tests. Every assertion is on a `reconcileGates` report put through `JSON.parse(JSON.stringify(…))`, which is `gate.json` exactly (`1c gate` writes `JSON.stringify(report, null, 2)` and adds nothing). That choice is the ticket's central point: BUG-153's own UAT asserts on what the probe returns and passed throughout, because the probe was never the layer that dropped them. The escape leg closes the arithmetic — `run.y + run.height − (surface.y + surface.height)` — and asserts the result appears verbatim in the `detail`.

Verified RED: with the production change reverted, 3 of 5 fail and the two rails pass, which is the correct split.

**One adjacent test changed.** `test_UAT_FC_BUG-112_verdict_names_the_colliding_leaves_and_widths` pinned the collision record's key set exactly; it moves from five keys to six, with the reason noted inline.

Regression: 105 tests across the ten gate/layout/fidelity suites, plus the surface and CLI-hygiene structural suites — all green. `tsc --noEmit -p tools/generate/tsconfig.json` clean.

## Two things worth flagging

**Three commits, not one.** The `move-to-free-coded` version gate requires the version-bearing commit to be the tip of `xgd-working`, and another session's ticket auto-commits landed in the gap twice, invalidating 0.2.391 and 0.2.392 in turn. The third attempt won at 0.2.393. All three SHAs are recorded on `fields.commits` — including the superseded `5121b68e72`, which is reachable and carries my `[FREE-CODED]` marker, so leaving it unclaimed would have stranded it.

**The worktree needed `apps/control-app/src/generated/` copied in** from the main checkout — it's gitignored build output, and without it `test_UAT_FC_BUG-112` dies at import on a missing module, which looks like a regression and isn't. It never entered the commit.

The ticket is at `free_coded` with the body updated to describe what actually landed. Promotion to `ready_to_reconcile` is yours.

<!-- xgd-chat-end -->
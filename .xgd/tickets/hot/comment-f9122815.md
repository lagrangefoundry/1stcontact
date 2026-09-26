---
uid: comment-f9122815
id: COMMENT-3958
type: comment
title: Comment on request REQ-328
created_by: xgd
created_at: '2026-09-26T19:01:50.825348+00:00'
updated_at: '2026-09-26T19:54:58.977228+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-8c91555c
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "894a4478-98ee-48ec-90e2-68ff85be2402",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="587c204e-b49f-4026-8a6f-5943fe32bd5a-user" -->

<!-- xgd-chat role="user" ts="2026-09-26T19:00:50.973895+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="587c204e-b49f-4026-8a6f-5943fe32bd5a-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-26T19:32:48.589489+00:00" -->
#### Claude
I'll start by reading the ticket to understand the scope.

Confirmed the gap. Let me check the vocabulary reference and envelope machinery before designing.

Now updating the ticket with the finding and implementation scope.

Now setting status and cutting the branch.

The worktree is functional. Now the schema change.

Now the renderer.

Now extend the two standing axis-group sweeps and write the UATs.

Now the UAT file.

Two assertions need tightening — AC4's second half is vacuous and AC5's construction is clumsy.

Now the regression scope: the L1 suites, sweeps, reference projection, and email refusals.

Now a broad sweep of the L1 / render surface.

⚠️ Chat generation failed: Claude Code CLI streaming timeout (>1800s)

<!-- xgd-turn id="c65d8ab5-7835-4a17-94b9-a02519e5e315-user" -->

<!-- xgd-chat role="user" ts="2026-09-26T19:45:55.082731+00:00" -->
#### You
please complete the free-coding of this ticket

Project note (additive — does not override the above):
Please be aware that in this current chat environment, background jobs die. Please be sure to run any tests in the foreground.

<!-- xgd-turn id="c65d8ab5-7835-4a17-94b9-a02519e5e315-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-26T19:54:57.824494+00:00" -->
#### Claude
I'll pick up where the prior session left off. Let me check the current state first.

The implementation is complete from the prior session. Now the test runs — these need the foreground.

All 5 UATs pass. Now the regression scope — the two swept sweeps, the L1 suites, and the reference projection.

Now a broad sweep of the L1 / render surface to catch anything else the schema change touches.

All green — 5 UATs, 11 sweep tests, 54 envelope/reference tests, 94 substrate tests, and both packages typecheck clean. Committing now.

Now the lock, merge, and version bump.

Now fast-forward `xgd-working` to the branch tip.

`free_coded` with 3 commits. Now story points and branch teardown.

Free-coding complete. REQ-328 is at `free_coded`.

## What landed

`sticky.lift` — the one item REQ-325 left open: **paint order against siblings that pass beneath a pin**.

The gap was that the answer was never the document's to give. L1 emits no `z-index`, so paint order falls to the CSS painting algorithm, and there it turns on the *sibling's element kind*: an in-flow `box`/`container` takes `position: relative` and a `transform` promotes a node into the positioned layer, so either one following a pin covers it — while a bare `text`/`image` leaf passes behind. Wrapping a masthead in a box to give it a background silently moved it from behind the held hero to over the top of it, with nothing in the document saying so.

- **`packages/site-schema/src/l1/schema.ts`** — `lift: z.literal(true).optional()` on `l1StickySchema`. `true`-or-absent on the `stacked` precedent: `false` would be a second spelling of absent, and absent has to keep meaning *"the document has not chosen"* — which for a pin is document-order paint, a real editorial composition in its own right. The field is documented on the schema, so `REF-l1` carries it with no second copy.
- **`packages/framework/src/l1/render.ts`** — `z-index: 1` (named `STICKY_LIFT_Z_INDEX`, next to the vastly-larger `DIALOG_Z_INDEX`) pushed into the pin's *own* declaration list, so a width-gated pin lifts inside its `min-width` block and not below it. Absent `lift` emits no `z-index` anywhere.
- **Both standing axis-group sweeps** now carry `lift: true` in the `sticky` sample, so every node kind is swept admitting a pin that names its paint level.

No new structural rule and no new envelope bound — a lifted pin is still refused on an absolute `geometry` track (`stickyIsInFlow`) and on an email page, by name.

## Evidence

5 UATs in `tests/test_UAT_FC_REQ-328_sticky_paint_order.test.ts`, emitter as the observation point on REQ-325's terms. AC4 is the tight one: the lifted rendering must equal the unlifted one with exactly `top: 40px` → `top: 40px; z-index: 1` substituted — so the field adds what it claims and nothing else.

All green in the foreground: 5 UATs · 11 sweep tests · 54 envelope/reference/motion tests · 94 substrate/fold tests (5 pre-existing skips) · both packages `tsc --noEmit` clean.

## Housekeeping

Two snags worth noting, both known races rather than defects in the work: the `--version 0.2.374` claim was rejected because a ticket auto-commit landed on the tip between the bump and the claim, and the gate's own retry hit a transient exit-128 on its auto-bump commit. Omitting `--version` and letting the gate allocate under its own lock resolved it — final version `0.2.377`, 3 commits recorded, branch merged and torn down.

<!-- xgd-chat-end -->
---
uid: comment-027b6e4c
id: COMMENT-3391
type: comment
title: Comment on request REQ-288
created_by: xgd
created_at: '2026-09-20T23:52:11.169735+00:00'
updated_at: '2026-09-21T00:14:35.917019+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-f7321dfb
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "7033eb35-25d5-49f2-b372-6e4600c16739",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="87162774-26b3-47d4-a40d-a53e760b5259-user" -->

<!-- xgd-chat role="user" ts="2026-09-20T23:51:20.172677+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="87162774-26b3-47d4-a40d-a53e760b5259-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-21T00:14:35.054586+00:00" -->
#### Claude
I've read the ticket and the surrounding code. Let me set up the branch.

Now the schema change:

Good — edits are landing on the branch worktree. Now the envelope validator:

Now the UAT file:

Set the documented sandbox flag and run the browser UAT for real:

Now commit:

Now lock and merge back into `xgd-working`:

Done — REQ-288 is landed on `xgd-working` at `free_coded`.

## What shipped

**The axis** (`packages/site-schema/src/l1/schema.ts:571`) — `transform` gains `translateXPct` / `translateYPct` (a share of the node's *own* rendered box) and `translateXPx` / `translateYPx`. I included the px pair rather than deferring it: once the percent path exists it's two fields, and "half my own height, minus a 2px optical correction" otherwise has no spelling. Both compose on one axis.

**Emission** (`packages/framework/src/l1/render.ts:437`) — `translate(<x>, <y>) rotate(…) scale(…)`, translate first so the node is moved in its parent's frame and *then* spun about its own centre. The percentage is emitted as a percentage (the renderer doesn't know the node's width at any viewport; the browser does at all of them); two components compose as `calc(50% - 4px)`. Identity emits nothing.

**A state's `motion` offsets now add to the static translate** instead of replacing it — CSS `transform` replaces rather than accumulates, so a hover would otherwise snap the plaque back into the middle of the picture. Rotate/scale keep their override semantics.

**Envelope** — percentages bounded ±1000, px on the existing effect-length bound, `.strict()` still refusing any freeform `translate` spelling.

## The two things you asked to settle

- **Paint order** is document order (no `z-index` anywhere), and a translated node carries a transform, so it promotes into the positioned paint layer — *the node that moved is the node on top of what it moved over*, which is the right default for the plaque.
- **Nothing clips it** — L1 emits no `overflow`, so the half hanging past the parent's edge paints and stays hit-testable. Both are now proven in a browser rather than assumed.

## Two consequences worth flagging

The analytic layout model (`probes.ts`) had to learn the axis, or the geometry envelope would report overlaps that aren't there and miss ones that are: it now moves a translated node's painted box *and its subtree* while leaving the flow advance untouched. And `stacked: true` now covers the subtree the node carries — the node that *is* the composition is routinely a container, which pushes no leaf of its own, so before this a plaque's own declaration exempted nothing.

## Evidence

`tests/test_UAT_FC_REQ-288_transform_translate.test.ts` — 5 UATs: CSS derivation, envelope rejection, motion composition, the geometry model, and an end-to-end browser run of your actual case (four plates in a wrapping column whose width *jumps* between 360px and 1280px; one value, correct at both). The browser one ran for real here under `CHROMIUM_LAUNCH_ARGS=--single-process` and passes. Full node suite: 4027 passed; the 21 failures are identical with and without the change (missing browser driver factory / component store / stale KB in a fresh worktree) — verified by baselining the same files against a stashed tree.

Ticket body carries the full implementation record and rationale; it's parked at `free_coded` (commit `7fb4337`, v0.2.300) for you to validate before promoting to `ready_to_reconcile`.

<!-- xgd-chat-end -->
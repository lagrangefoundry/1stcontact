---
uid: comment-c2e3d5af
id: COMMENT-3951
type: comment
title: Comment on request REQ-326
created_by: xgd
created_at: '2026-09-25T23:51:16.519971+00:00'
updated_at: '2026-09-26T07:08:24.791755+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-da2bf042
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "d5d010e6-c848-4639-87a7-1e6b8984f088",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="0b1d61fe-9b14-4882-be27-35d038e72771-user" -->

<!-- xgd-chat role="user" ts="2026-09-25T23:50:03.106799+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="0b1d61fe-9b14-4882-be27-35d038e72771-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-26T00:23:29.125121+00:00" -->
#### Claude
Now let me record the implementation shape on the ticket and mark it as being worked.

Now cutting the branch.

Now the schema union.

Now types.ts and the l1 index exports.

Now the validator: envelope bound, structural rules, and the per-behaviour checks.

Now the renderer.

Now the BUG-48 provocation map must gain the two new rules.

Now let me write the UATs.

⚠️ Chat generation failed: Claude Code CLI streaming timeout (>1800s)

<!-- xgd-turn id="a4fcdb96-5f6c-4df2-8e5b-123e113d28cb-user" -->

<!-- xgd-chat role="user" ts="2026-09-26T06:50:22.665127+00:00" -->
#### You
please complete the free-coding of this ticket

Project note (additive — does not override the above):
Please be aware that in this current chat environment, background jobs die. Please be sure to run any tests in the foreground.

<!-- xgd-turn id="a4fcdb96-5f6c-4df2-8e5b-123e113d28cb-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-26T07:08:24.728020+00:00" -->
#### Claude
Now lock and merge back into `xgd-working`.

Now promote the ticket to `free_coded`.

Now release the lock and tear down the branch.

Free-coding of REQ-326 is complete and landed on `xgd-working`.

## What shipped

`reveal` — L1's entrance primitive — now takes **one behaviour object or a list of two or more**. Each behaviour carries its own `yPx` / `fromOpacity` / `durationMs` / `delayMs` / `easing`, and the renderer emits one pre-state declaration and one transition *per property* with that property's own timing. Previously one `durationMs` was broadcast across both properties, so "fade quickly, rise slowly" had no spelling at all.

Composition rules, as the ticket asked them to be settled:
- **Same property in two behaviours → document refused**, naming the property and the behaviour that already claimed it (not last-one-wins — the dropped half moves no pixel and says nothing about why).
- **Different properties → compose.**
- **List order is the emission order**, so composition order is authorable.
- **A one-element list is refused** — a deliberate departure from the ticket's "treated as a one-item list", on the same grounds `l1TextContentSchema` uses `min(2)` for REQ-211's `text`: two legal spellings of one thing is drift.

The "which properties does this behaviour move" reading lives once, in `packages/site-schema/src/l1/motion.ts`, read by both the validator that refuses a contest and the renderer that emits the result.

**One thing I had to fix that composition didn't ask for**: turning the field into a union broke union error localisation for the *single* form. A mistyped `easing` was reported as `"expected array, received object"` at `/root/reveal` — telling an author their entrance should have been an array. `chooseBranch` now scopes both its survivor tests to branches that didn't fail on *shape* at the union's own position. Stated on shape, so every shape-discriminated union benefits. I appended a section to the ticket body covering this, and it's pinned by AC9.

## Evidence

`tests/test_UAT_FC_REQ-326_composed_entrance.test.ts` — 9 UATs, all passing. Regression scope: 91 validation/render suites, plus a clean `tsc --noEmit` across all six packages.

Two failures surfaced in the wide run and are **pre-existing, not mine** — I verified by reverting my six source files to the pre-merge `HEAD` in the same checkout and re-running: `bug20-chip-self-surface` (card accent bars) and `req96-control-composition` (submit width 122.75 vs 123) fail identically without my change. They only execute in the main checkout because they need the gitignored reference bundles. A third, `reconciliation-l1-navigation`, is a jsdom hash-navigation flake under parallel load — passes in isolation and doesn't touch `reveal`.

## Ticket state

- `status=free_coded`, `story_points=3`, `version=0.2.372`
- `fields.commits`: `cc0990b74a` (the change) + `a5c36c82b1` (version bump)
- Merged into `xgd-working` as `cc5b28afe0`; branch and worktree cleaned up, lock released.

The merge hit one conflict — REQ-327 landed `zoomOrLink` in the BUG-48 provocation map while I was adding two entries to the same map. Additive on both sides; I kept both.

<!-- xgd-chat-end -->
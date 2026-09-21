---
uid: comment-bdf19b46
id: COMMENT-3420
type: comment
title: Comment on bug BUG-133
created_by: xgd
created_at: '2026-09-21T01:11:09.687969+00:00'
updated_at: '2026-09-21T18:42:17.389421+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-86689c73
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "9624f636-bf9b-4896-8599-99512723cfb7",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="4977e780-1857-40f3-bbc8-ff43e06f35b8-user" -->

<!-- xgd-chat role="user" ts="2026-09-21T01:10:10.301532+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="4977e780-1857-40f3-bbc8-ff43e06f35b8-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-21T01:12:24.195462+00:00" -->
#### Claude
⚠️ Chat generation failed: Claude Code CLI error (exit code 1)
Error: You've hit your session limit · resets 8:50pm (America/Los_Angeles)

<!-- xgd-turn id="f20e5432-edfe-40b8-b18b-40e4f8e7d740-user" -->

<!-- xgd-chat role="user" ts="2026-09-21T18:30:30.928422+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="f20e5432-edfe-40b8-b18b-40e4f8e7d740-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-21T18:42:16.841553+00:00" -->
#### Claude
I'll start by reading the ticket to understand what's being asked.

Now let me understand the codebase — the L1 renderer and how sizing/align are handled.

I have a clear picture. Let me scope the ticket and start the free-coding flow.

Ticket scoped. Now cutting the branch.

Now let me implement the renderer change.

Now update the six `axisSizingCss` call sites and the container's child walk.

Now push the responsive media rules. Let me add that next to the visibility emission.

Now let me write the UAT.

Now the regression scope — all L1 render-adjacent suites.

All renderer suites pass. Let me document the axis semantics at the schema, which is where the authoring side reads them.

Clean. Bumping version and committing.

Now merge back to `xgd-working` under the lock.

Done. BUG-133 is at `free_coded`.

## What the bug was

One line of the emitter. `sizingCss` compiled `mode: "fluid"` to `100%` on whichever axis it was handed — and that's correct for a width and inert for a height. A block's containing width is definite, so `width: 100%` resolves; a flex row's height is indefinite until its own content has been laid out, so `height: 100%` on a child resolves to `auto` and the node falls back to natural size. For an `<img>` that's the picture's proportions — exactly the reported symptom.

It was worse than a no-op: because the *computed* value was a percentage rather than `auto`, it also disqualified the node from the flex `stretch` step. The declaration was actively suppressing the fill the row would have given it for free — which is why the image didn't stretch even though the row said `align: "stretch"`.

## The fix

Chose the ticket's first option (honour it). A parent now hands its children the flow it lays them out in, and a fluid height reads it:

- **`row` / `grid`** (height is the cross/block axis) → `height: auto` + `align-self: stretch`
- **`stack` / `box`** (height is the main axis, or no flex at all) → `height: 100%`, unchanged

`align-self` sits on the child, so a fluid height fills even in a row aligned `center` — per-node sizing is the more specific statement than the container's default. Where REQ-104's `responsiveLayout` flips which axis height *is*, the spelling is restated whole at each flipping breakpoint (including the `align-self: auto` reset), on `layoutDecls`' own self-sufficiency rule. Widths untouched everywhere.

The ticket's own reproduction now emits:
```
.l1-1 { object-fit: cover; width: 182px; height: auto; align-self: stretch; display: block }
.l1-0 { display: flex; flex-direction: row; gap: 24px; align-items: stretch; position: relative }
```

I also documented the per-axis meaning on `l1SizingSchema` — an author reading `{ mode: "fluid" }` alone can't tell which of the two they wrote, and that ambiguity is half of what made this expensive to diagnose.

## Verification

`tests/test_UAT_FC_BUG-133_fluid_height_stretch.test.ts` — 10 UATs through `renderL1Document`: the reproduction, a `center`-aligned row, a grid parent, stack and box parents, fluid widths under all three layouts, min/max on both branches, the responsive flip, a track that never crosses the boundary (emits nothing extra), and a byte-identical floor.

All 64 renderer suites pass (568 tests), plus the L1 surface validator.

**One limitation, stated plainly:** Chromium is unavailable in this sandbox (`chromiumAvailable()` → false), so the evidence is at the emitted-CSS level, not a real layout measurement. That's the level every other renderer suite in this repo asserts at, but it means "the image visibly ends level with the text" is reasoned from the CSS rather than measured. Worth a glance at the draft screenshot when you next have a browser.

Commits `ba4b6842` + the gate's own version bump `226b3f72`, version 0.2.305, merged to `xgd-working`, branch cleaned. Parked at `free_coded` — promotion to `ready_to_reconcile` is yours.

<!-- xgd-chat-end -->
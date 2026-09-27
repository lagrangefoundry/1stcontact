---
uid: comment-5365b5a4
id: COMMENT-4086
type: comment
title: Comment on request REQ-336
created_by: xgd
created_at: '2026-09-27T20:00:18.980252+00:00'
updated_at: '2026-09-27T20:50:37.159872+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-2635d442
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "765066e2-5535-439a-a9b5-d29bdcb9859f",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="2ffef517-50b2-466f-89df-fb7f922f1a09-user" -->

<!-- xgd-chat role="user" ts="2026-09-27T19:58:43.182693+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="2ffef517-50b2-466f-89df-fb7f922f1a09-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-27T20:32:23.870783+00:00" -->
#### Claude
I'll start by reading the ticket.

Now the residual machinery and the leaf branches:

Now the box/surface branch:

Now the color-values helpers and fold's border paths:

The ticket is unusually prescriptive and I have everything I need. No blocking questions. Starting the free-coding flow.

Now let me write the `foldTransform` helper:

Good, `L1Transform` is exported. Now implementing issue 1 in the worktree:

Now the `foldTransform` helper, placed beside `foldBackdropBlur`:

Now issue 3 — the dropped-axis residual. First the typed axis union:

Now `axisCarriedBy` and `droppedAxesOf`, appended after `capturedAxesOf`:

Now wire the residual emission at the three leaf sites, beside `signal`:

Now typecheck and probe against the real bundle:

Clean. Now probe against the real bundle using the worktree's source:

Now the fold half — `foldBorder` / `foldBorderLeftAxis`:

Now the image card's `border` param:

Now let me write the UAT file:

Let me verify the tests actually discriminate — temporarily disable the fix and confirm they go red:

Now the regression scope — the fold, capture, values-diff and gate suites:

⚠️ Chat generation failed: Claude Code CLI streaming timeout (>1800s)

<!-- xgd-turn id="fe605d49-cc78-4090-adce-1a5ea8cba262-user" -->

<!-- xgd-chat role="user" ts="2026-09-27T20:39:45.491593+00:00" -->
#### You
please complete the free-coding of this ticket

Project note (additive — does not override the above):
Please be aware that in this current chat environment, background jobs die. Please be sure to run any tests in the foreground.

<!-- xgd-turn id="fe605d49-cc78-4090-adce-1a5ea8cba262-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-27T20:50:36.253919+00:00" -->
#### Claude
Now let me append the implementation record to the ticket body.

Now lock, merge working into the branch, and fast-forward back.

Landed as a fast-forward. Now the free_coded gate, letting it bump the version itself.

Now tear down the branch and release the lock.

REQ-336 is free-coded and landed on `xgd-working`.

**What shipped** — all three issues in one commit, `c21c24e18f`:

**Issue 1 — the rotation.** New `foldTransform` in `tools/generate/src/l1/fold.ts`, read at all three leaf branches (text, image, box) because `transform` is a node field, not an image axis. Three decisions the filing left open: the identity (`rotate(0deg)`/`scale(1)`) is not emitted, an out-of-envelope value is **dropped rather than clamped** (`validateL1` would refuse the whole document over one absurd node) and both terms are rounded to 2dp. The filing's "will not create new layout findings" is pinned as a measurement: a turned photograph and an untouched one fold to identical geometry keyframes.

One pre-existing expectation inverted — AC-732's `rotated.transform` was `toBeUndefined()` on the premise that the captured `box` was post-transform. REQ-333 moved `box` to the layout box with the rotated rect in `clip`, so that premise no longer holds. The **mask** half of the same assertion is unchanged, but is now audible: the fold files a `maskEdge` residual on that leaf.

**Issue 2 — the alpha.** Four stages, none of which shows alone: `rgbToHexA` in `EXTRACT_SCRIPT` (border, left-accent chain, outline, run colour); `colorToHexAlpha` in `foldBorder`/`foldBorderLeftAxis` — `colorToHex` would have *re-flattened* the literal the capture now writes; the comparator compares alpha **beside** ΔEOK on the `border` and `color` axes, because `colorDistance` reads `#ffffff4d` and `#ffffff` as the same colour; and `border` becomes a **fixed** row on the image card, so a reader sees the ring even when both sides agree. The fold's text-colour path needed no change — `el.color` passes straight through. An opaque colour is still six digits, so no bundle needs re-capturing to keep comparing clean.

**Issue 3 — the instrument.** `signalDropped` reports the axes an *emitted* leaf does not carry. `axisCarriedBy` is three-valued — `undefined` where the axis has no destination on the node, so a run's card treatments aren't claimed as drops — and `CapturedAxis` is a named union making an unjudged new axis a compile error. Both directions pinned: a dropped axis is named, and the collage issue 1 fixes reports `[]`.

**Evidence:** 15 UATs in `tests/test_UAT_FC_REQ-336_a_turned_photograph_and_a_translucent_ring.test.ts`, capture leg driven through the real `EXTRACT_SCRIPT` under jsdom. Regression scope green in the foreground — 48 files / 367 tests across fold, capture, values-diff, gate, L1-surface/envelope and residual-consumer suites, plus `tsc --noEmit` clean.

Ticket is at `free_coded`, `story_points: 5`, `commits` = the work SHA plus the auto-bump `8b24780239` (version `0.2.394`), branch merged fast-forward and torn down.

**Two things still need you:** issue 2 needs a **[recapture]** before this bundle's evidence moves — `1c refold` re-derives from an oracle whose alpha was already lost. Issue 1 needs only a `1c refold`. Promotion to `ready_to_reconcile` is your call.

<!-- xgd-chat-end -->
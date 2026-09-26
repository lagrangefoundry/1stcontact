---
uid: comment-d74728d8
id: COMMENT-3950
type: comment
title: Comment on request REQ-325
created_by: xgd
created_at: '2026-09-25T23:51:14.326765+00:00'
updated_at: '2026-09-26T07:20:37.954846+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-6db99075
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "c8c9e000-3207-4bec-9fb7-1c912c50c45e",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="9c1e2538-faf8-4bde-a31c-392fedec86fe-user" -->

<!-- xgd-chat role="user" ts="2026-09-25T23:49:59.928601+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="9c1e2538-faf8-4bde-a31c-392fedec86fe-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-26T00:23:28.209912+00:00" -->
#### Claude
Design is clear. Let me record the implementation scope on the ticket, then cut a branch.

Now the schema additions:

Now wire them into the shared node axis groups:

Now the envelope validator:

Now the renderer. First the emitters:

Now the `Rule`/`KeyframesRule` plumbing and serializer:

Now wire the axes into `emitNode` and the render state:

Now the UAT file:

Now the BUG-48 rule-provocation table:

⚠️ Chat generation failed: Claude Code CLI streaming timeout (>1800s)

<!-- xgd-turn id="2cc110bb-ede1-415c-b431-40ecd638ed01-user" -->

<!-- xgd-chat role="user" ts="2026-09-26T06:50:17.823020+00:00" -->
#### You
please complete the free-coding of this ticket

Project note (additive — does not override the above):
Please be aware that in this current chat environment, background jobs die. Please be sure to run any tests in the foreground.

<!-- xgd-turn id="2cc110bb-ede1-415c-b431-40ecd638ed01-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-26T07:20:37.375568+00:00" -->
#### Claude
I'll start by reading the ticket and checking the current state of the work.

The branch exists from the prior session. Let me check its state.

Ticket body is complete; the code is uncommitted in the worktree. Let me review what's there.

Work looks complete. Let me verify the worktree install and run the tests in the foreground.

All 10 pass. Now the adjacent regression scope.

`serializeRules` changed for every page, so I need the full L1 render/envelope scope.

One real regression — REQ-105's exhaustiveness assertion needs the two new groups. Let me look at it.

The test is a shape-level exhaustiveness sweep — the two new groups belong in its sample. Adding them:

Now a wider sweep — every suite that renders or validates L1.

All 769 pass. Now typecheck/lint, and a check for any other place that enumerates node axes.

No central axis list outside the schema and email refusal list. Now typecheck and lint.

Both packages typecheck clean. Let me check whether tests are typechecked too.

Let me run the full suite to catch anything outside the L1 scope.

Let me get the full failure list and confirm these are pre-existing.

One failing file does render. Let me inspect it specifically.

Passes in isolation — a parallel-load artifact. Let me run all 10 together, isolated from the rest.

9 fail genuinely; none of them import the L1 renderer. Let me confirm against a clean baseline in the main checkout.

Same 9 fail on clean xgd-working (18 vs my 17) — all pre-existing and unrelated. Now the workers-pool L1 suites:

Regression is clean — only the 9 pre-existing failures. One gap: `renderL1Fragment` carries keyframes but no UAT covers it. Let me check how fragments are tested.

Adding a fragment leg to AC4 — a mounted module's track must carry its own keyframes:

11 pass. Now let me record the added test coverage on the ticket before committing.

Body reads well. Now the version bump and commit.

Branch is level with xgd-working. Let me bump the version and commit.

The Bash cwd persisted from the baseline run — I bumped the main checkout's `package.json` by mistake. Let me revert that and verify my worktree is intact.

Reverted cleanly. Now back to the worktree — I'll use explicit paths from here.

Other sessions landed real code in the same directories. Let me commit first, then merge under the lock.

Every source file I touched has moved upstream. Committing first, then merging.

Now the merge lock, then merge xgd-working into the branch.

Four additive collisions. Let me resolve each — both sides should survive.

REQ-326 landed an `entrance` axis upstream. Let me resolve types.ts (both sides), then examine what REQ-326 did before resolving the substantive ones.

Purely additive. Keeping both, with REQ-326's entrance right after `l1RevealSchema`:

The substantive one: upstream factored the inline reveal check into `checkEntrance`. I need upstream's refactor plus my two new blocks.

Interleaved additions to one object literal. Let me write the combined region.

All conflicts resolved. Let me typecheck before completing the merge.

A leftover fragment in my BUG-48 resolution. Let me look.

Three duplicated closer lines — my `combined` already emitted them. Removing:

All 38 pass. Let me verify the render.ts merge around the reveal emitter, since REQ-326 reshaped it.

Merge is clean. Let me add the composed-entrance leg — REQ-326's list form must be refused beside a track too.

Now the full L1 regression scope on the merged tree.

All 815 pass, including the three new upstream suites. Committing the merge:

Fast-forward is clean. Now the version bump as the tip commit.

Now fast-forward xgd-working, still holding the lock.

Landed as a fast-forward. Now the `free_coded` gate:

Now story points, then tear down the branch and release the lock.

Let me record the merge resolution on the ticket body before tearing down.

REQ-325 is free-coded and landed on `xgd-working`.

## What shipped

Two new node-level axis groups, both typed value bags with the renderer as sole emitter:

**`sticky: { topPx?, fromPx? }`** — where a box *is*. Compiles to `position: sticky; top: <topPx>px` into the node's own base declaration list, so it overrides the `position: relative` an in-flow node otherwise takes. Release boundary is CSS's own (the containing block), so it isn't a field. `fromPx` confines the pin to a `min-width` band — a pin is a desktop affordance, and the alternative is authoring the subtree twice under paired `visibility` gates.

**`scrollTrack: { range?, stops[] }`** — what a box *looks like* on the way past. `opacity`/`translateYPct`/`scale` keyframed over progress 0..1 across one of the four CSS named view-progress ranges. Compiles to a renderer-named `@keyframes` block plus `animation-timeline: view()` — the browser's own timeline drives it, so no scroll listener enters the substrate.

It fails visible: the animation declarations sit inside **both** `@supports (animation-timeline: view())` and `not (prefers-reduced-motion: reduce)`, so a browser without the feature and a visitor who asked for no motion each get the node's authored opacity, offset and scale. Nothing hidden in CSS waiting to be revealed. Since the capture driver emulates reduced motion, that same gate keeps the L1 round-trip honest.

Four structural refusals, plus bounds reusing `translatePct`/`transformScale` rather than adding a second answer to the same question. Both axes refused by name on an email page, withheld from the edit channel and from a `dialog` panel.

## Verification

- `tests/test_UAT_FC_REQ-325_scroll_position_state.test.ts` — 11 tests, all pass.
- Three standing sweeps extended: `reconciliation-l1-shared-axis-groups`, `req105-node-axis-groups`, and BUG-48's rule-provocation table.
- Full L1 scope (93 files, 815 tests) passes. Five packages typecheck clean.
- Full suite: 9 files fail — I baselined them on clean `xgd-working` and they fail identically there (builder/webui/assistant/env/filing suites, none touching the L1 renderer). One further file failed only under parallel load and passes in isolation.

## Two things worth flagging

**REQ-326 landed mid-build.** It changed `reveal` to `l1EntranceSchema` (one behaviour or a list) and factored REQ-100's inline bounds check into `checkEntrance`. The merge had four conflicts; I took REQ-326's refactor and dropped this branch's stale inline copy. `oneMotionDriver` was already correct under the union (it tests presence), but I added explicit coverage that a *composed* entrance is refused beside a track too — the reason is the cascade, not the arity.

**I bumped the wrong `package.json` at one point.** The Bash working directory had persisted from the baseline run, so `xgd_version_bump` hit the main checkout instead of the worktree. Caught it immediately and reverted with `git checkout -- package.json`; the diff was the version line alone, and nothing was committed. All subsequent git work used explicit `-C` paths.

The ticket is at `free_coded` with all three SHAs confirmed as ancestors of `xgd-working`, version `0.2.373`, 5 story points. Promotion to `ready_to_reconcile` is yours.

<!-- xgd-chat-end -->
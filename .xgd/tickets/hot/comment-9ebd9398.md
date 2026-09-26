---
uid: comment-9ebd9398
id: COMMENT-3959
type: comment
title: Comment on request REQ-329
created_by: xgd
created_at: '2026-09-26T19:02:06.592176+00:00'
updated_at: '2026-09-26T20:10:25.581347+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-9f377353
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "0ab0626a-2f10-4e6e-985d-bed5a8540c11",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="cb43bcf5-4e18-4ce7-a517-96d45256f3b6-user" -->

<!-- xgd-chat role="user" ts="2026-09-26T19:01:17.052373+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="cb43bcf5-4e18-4ce7-a517-96d45256f3b6-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-26T19:32:53.049214+00:00" -->
#### Claude
Now let me write the unified claim projection in `motion.ts`.

Now the schema — the scroll-motion union:

Now update the `l1` index to export the new projection helpers:

Now the validator: replace `oneMotionDriver` with the per-property exclusivity rule, and handle a list of tracks.

Now the walk body — replace the scroll-track block:

Now add the two new checker functions next to `checkEntrance`:

Now the renderer — make `scrollTrackRules` handle a list of tracks.

Now update the tests that encode the superseded rule.

Now the shared-axis-group sweep, where `scrollTrack` was an alternative:

Now fix the stale prose in `req105` and write the REQ-329 UAT suite.

Now the REQ-329 UAT suite:

⚠️ Chat generation failed: Claude Code CLI streaming timeout (>1800s)

<!-- xgd-turn id="e9751c85-fd40-4777-ada7-ff4d3051b20d-user" -->

<!-- xgd-chat role="user" ts="2026-09-26T19:45:57.954450+00:00" -->
#### You
please complete the free-coding of this ticket

Project note (additive — does not override the above):
Please be aware that in this current chat environment, background jobs die. Please be sure to run any tests in the foreground.

<!-- xgd-turn id="e9751c85-fd40-4777-ada7-ff4d3051b20d-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-26T20:10:25.110872+00:00" -->
#### Claude
I'll start by reading the ticket and assessing the current state of the work.

The branch worktree exists. Let me read the full ticket body and check the worktree state.

Ticket body is fully populated and the implementation is written but uncommitted. Let me review the diff and then run the tests.

Install is present. Let me run the new UAT suite.

All 7 UATs pass. Now the regression scope named in the ticket.

Now the full node project. This takes a while — running in the foreground.

8 files failed. Let me get the full failure list and confirm none relate to REQ-329.

None touch L1/motion. Let me confirm they're pre-existing by running the same 8 files in the main checkout (the branch base, without my changes).

Same 9 test failures pre-exist in the main checkout. One file differs at the *file* level — let me identify it.

Identical 9 failures in both. Let me confirm BUG-134 (the one file-level difference) on the branch.

BUG-134 is a worktree artifact (`.xgd/tmp/` absent) — passes in the main checkout. All failures are pre-existing. Let me check whether the workerd project touches L1 render.

No workerd suite touches L1 render. Now let me review the implementation diff before committing.

Implementation is coherent. Let me typecheck and review the new UAT suite.

Both packages typecheck clean. Let me review the UAT suite.

Strong UATs. Let me verify the supersession edits to the existing suites.

Work is complete and verified. Now the commit sequence. Let me check the version-bump mechanism for this project.

Now the commit sequence. Taking the merge lock first (per the memory that the version-carrying commit must be the tip).

xgd-working has advanced and touches the same files. Let me commit my work first, then merge.

Now merge the advanced xgd-working into the branch so the version bump lands on top.

Two conflicts. Let me examine them.

A combine-both hunk: my comment update plus REQ-328's `lift`. Resolving:

Now checking whether the clean auto-merges escaped my single-object → union conversion.

No escaped call sites. Let me typecheck and test the merged state before committing.

BUG-48 now fails — the merge brought new rules. Let me see all 4 failures.

All 4 failures name `zoomGroupChromeAgrees` — a REQ-330 rule from the merge, not mine. Confirming it's pre-existing on xgd-working:

Confirmed pre-existing on xgd-working. Let me verify one failure isn't partly about my rename.

My rename is correctly reflected (`animatedPropertyIsExclusive` present in both sets); the 3 uncovered rules are all from other tickets. Committing the merge resolution:

Now the full node project on the merged state, to compare against the xgd-working baseline.

13 failures = the 9 pre-existing + BUG-48's 4 (REQ-330's gap). No new failures. Now the version bump.

xgd-working advanced again. Merging my branch into it (I hold the lock):

Merged cleanly. Now the gated transition to `free_coded`.

Moved to `free_coded`. Now recording story points and tearing down the branch.

Now let me verify the final state and confirm the ticket body still matches what landed.

All in place. Last free-coding requirement: the body must account for every file that landed. Let me check the body's "Files" list against the actual diff.

The Files list is complete for production code, but the Supersession section says "Two other suites" while three test suites beyond REQ-325's were touched — `req105` isn't named. Let me make that surgical addition.

Free-coding of REQ-329 is complete.

## What landed

Three changes in the L1 substrate, all under `free_coded` on `xgd-working`:

1. **`oneMotionDriver` → `animatedPropertyIsExclusive`.** REQ-325 refused `reveal` beside `scrollTrack` outright. Its reason was true of a *property* — a CSS animation wins the properties it names against any transition — but the rule covered the whole *pairing*, so it refused the headline composition this ticket was filed for (fade in on entry, drift on scroll), which has no contest in it. The new rule spans every motion on a node (entrance, tracks, hover, focus): they may all coexist, they may not both move the same CSS property. Refused naming the property and both claimants rather than resolved by later-wins — the ticket offered later-wins; the deliberate departure follows REQ-326's existing answer to the same question.

2. **`scrollTrack` takes a list**, mirroring `reveal`'s union, bounded `{min: 2, max: 3}`. The renderer emits one `@keyframes` block and one entry per `animation-*` longhand per track. A single object renders byte-identically (`…-sc`, single-valued longhands), so migration is by construction.

3. **`l1MotionClaims(node)`** — one projection read by both the validator that refuses and the renderer that emits, so the two cannot come apart.

Transform needed no merge: the renderer had already chosen the independent `translate`/`scale` over `transform`, so a hover's lift *adds* to wherever a track has the node.

## Verification

- 7 new UATs in `tests/test_UAT_FC_REQ-329_composed_motion.test.ts` — all pass.
- Both touched packages typecheck clean.
- Full node project: **13 failures, all pre-existing.** I baselined each one against the main checkout: 9 are unrelated pre-existing failures (builder env files, account discovery, business vocabulary, etc.), and 4 in `BUG-48` come from REQ-330's `zoomGroupChromeAgrees` arriving via the merge with no reference definition — I confirmed those 4 fail identically on `xgd-working` without my changes. I also verified my own rename is properly covered in that map, so the gap is REQ-330's, not mine.

Two merge conflicts with REQ-328's `sticky.lift` (which landed on `xgd-working` mid-session) were resolved by combining both sides.

## Ticket state

`status=free_coded`, `version=0.2.379`, `story_points=5`, `commits=[a8fc4f256c…, 531a16c186…]` — both verified as ancestors of `xgd-working`. Branch merged and torn down; lock released.

I made one additive body edit: the Supersession section said "two other suites" but three were touched — `req105-node-axis-groups.test.ts` also carried the old rule in its prose. The body now names all three and says what changed in each. Title and every other section preserved.

Two things worth your attention: **REQ-330's `zoomGroupChromeAgrees` has no reference definition**, so `BUG-48` is red on `xgd-working` independent of this work. And `apps/public-site/src/index.ts` showed up modified in the working tree during this session — not mine, likely a concurrent session.

<!-- xgd-chat-end -->
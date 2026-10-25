---
uid: comment-7ed87692
id: COMMENT-4479
type: comment
title: Comment on request REQ-347
created_by: xgd
created_at: '2026-09-29T20:32:10.418781+00:00'
updated_at: '2026-09-29T22:10:43.067441+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-922b1e4e
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "1f38905f-2828-4a8a-9fbc-20e12bb8658d",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="c4fe49aa-b9dd-4142-8638-a518f2abc8f1-user" -->

<!-- xgd-chat role="user" ts="2026-09-29T20:31:21.955050+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="c4fe49aa-b9dd-4142-8638-a518f2abc8f1-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-29T21:04:02.538242+00:00" -->
#### Claude
Now let me look at `accTransformOf` (the ancestor-walking pattern to reuse) and `frameOf`.

Now let me cut the branch.

Now the `frameOf` change:

Now the L1 schema — add the `paintOrder` axis:

Now the envelope bound and validator check:

Now the renderer:

Now the fold — `foldPaintOrder` plus the three leaf sites and the residual vocabulary:

Now wire it into the three leaf branches:

Now let me run the broader suite of directly-related tests to see what else moved:

⚠️ Chat generation failed: Claude Code CLI streaming timeout (>1800s)

<!-- xgd-turn id="5d797aca-2810-46c7-835c-0681184cdcba-user" -->

<!-- xgd-chat role="user" ts="2026-09-29T21:46:04.811886+00:00" -->
#### You
please complete the free-coding of this ticket

Project note (additive — does not override the above):
Please be aware that in this current chat environment, background jobs die. Please be sure to run any tests in the foreground.

<!-- xgd-turn id="5d797aca-2810-46c7-835c-0681184cdcba-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-29T22:10:42.421848+00:00" -->
#### Claude
I'll pick up where the prior session left off. Let me check the current state.

Now lock and merge back into `xgd-working`.

Done. REQ-347 is free-coded and landed on `xgd-working`.

## What was completed

The prior session's uncommitted work on `free-REQ-347` was finished, verified, merged and recorded.

**Capture (`extract.ts`)**
- `zIndexOf` now takes the *element* and walks the ancestor chain like `accTransformOf` does — stopping at the first box `z-index` actually applies to (positioned, or a flex/grid item), and sealing a subtree at `0` when an ancestor is a stacking context that declares no level. Two new helpers, `zIndexApplies` and `establishesStackingContext`.
- `frameOf(el, box)` → `frameOf(el)`: returns the frame's **own** border box (un-inflated through the frame's own accumulated transform), so a 224px ringed wrapper is recorded as 224 with radius 112, not 216/108. `clip` is read at the frame too — it has to move or `nestClipRegions` reads the leaf as escaping a region that contains it.
- `CAPTURE_SCHEMA` 8 → 9, both entries `present: () => false` (neither is provable from a bundle; the version gate decides alone).

**L1**
- New node-level `paintOrder` integer on `nodeAxisGroupsShape` — bounded ±1000 in `L1_ENVELOPE`, checked in `validate.ts`, with `0` refused as a second spelling of absent.
- Renderer emits `z-index`; on a pinned node `stickyDecls` emits it instead, so there is one declaration and never two.
- `foldPaintOrder` clamps at the bound rather than dropping (order-preserving; dropping would silently restore document order — the defect itself), reads at all three leaf branches, and `zIndex` joins the `CapturedAxis` union. Notably **not** written onto a backdrop — that would let a hero wrapper's `z-index: 10` hide its own copy, reintroducing the bug from the other side.

## Verification (all foreground)

- `tests/test_UAT_FC_REQ-347_the_paint_order_a_page_declares.test.ts` — **12/12 pass** over the real `EXTRACT_SCRIPT` (jsdom), the real `foldToL1` and the real `renderL1Document`.
- The 3 modified existing test files (incl. REQ-333's superseded box assertions) — 19 pass, 2 skipped.
- Full `--project node` suite: 4833 pass, 25 fail across 15 files. I baselined all 15 on `xgd-working`: 13 fail identically there. The 2 extra are not mine — `reconciliation-system-knowledge-base` passes in isolation on the branch (full-suite interference), and `BUG-134` fails because `.xgd/tmp/` doesn't exist in a fresh branch worktree (`bin/copy-to-cloud` writes its backup there). **No regressions.**
- `tsc --noEmit` clean on all three changed packages; `pnpm -r build` clean. No lint script in this repo.

## Bookkeeping

Two commits — the feature commit, plus a version re-bump after `move-to-free-coded` refused `0.2.410` (BUG-169 had claimed it first). Merged to `xgd-working`, `status=free_coded`, `fields.commits` set to both SHAs, `version=0.2.411`, `story_points=8`, branch cleaned and lock released.

One thing still outstanding, already stated in §5 step 3 and §6.10 of the ticket body: **`storage/references/faelan.com/index` needs a recapture.** Both capture fixes are invisible to `1c refold` — until that bundle is re-captured it keeps its eleven zeroes and its 216px ring. After the recapture, `values-diff`'s existing `zIndex` axis will start firing on it; that's the instrument sharpening, not a regression.

<!-- xgd-chat-end -->
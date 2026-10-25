---
uid: comment-386c6971
id: COMMENT-4871
type: comment
title: Comment on bug BUG-190
created_by: xgd
created_at: '2026-10-03T23:28:13.159885+00:00'
updated_at: '2026-10-03T23:37:10.845743+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-378e5ec0
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "11019bf7-b5ea-4d9c-83fa-cd2d6ad897ab",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="5ce16c3d-1c4a-4806-9674-cfd0d0554ff9-user" -->

<!-- xgd-chat role="user" ts="2026-10-03T23:27:02.503892+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="5ce16c3d-1c4a-4806-9674-cfd0d0554ff9-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-03T23:37:10.066616+00:00" -->
#### Claude
Scope is clear and specific. Marking `free_coding`, cutting the branch.

Ticket is clear; I've inspected the iteration-7 manifests. Now tracing how the manifest's `renderedTextBox` is produced for pseudo-glyph hosts.

Mapping each glyph's ref host box against our glyph box. Now reading the comparator's text-run size/position block.

Design settled (details in the ticket update later). Reading the delta-property tables.

Writing the three code changes now.

Code done; writing the UAT file using the iteration-7 manifest values as fixtures.

All 9 pass. Now re-running the diff on the real iteration-7 manifests to check the ticket's "Fixed" predictions.

Fresh projection: 56 → 22 deltas. Glyph rows drop to 2 `a11yRole` + 3 host-size rows; Item 2 fires on 11 elements (ticket predicted 5). Checking those 11 are genuine.

Exactly the 5 nav links are new; the other 6 surfaceFill rows already existed. Removing the probe and running the values-diff regression scope.

Those suite-level failures look like the known fresh-worktree missing `control-app/generated` artifact. Checking.

Location artifact. I'll copy the gitignored build artifact in from the main checkout so the suites can actually run.

Looks unrelated (an image card's `border` param). Confirming it fails on clean xgd-working too.

Pre-existing on clean working, not mine. Typechecking the touched module.

Typecheck clean. Reading my notes on this project's version-bump/merge sequence before committing.

Commit first, then ticket body, then lock/merge/promote (letting the gate auto-bump the version).

Merged. Promoting via the gate, without `--version` so it auto-bumps.

I've fixed all three BUG-190 items and merged them into xgd-working. BUG-190 is at `free_coded`, with the fix commit `73be4dd5` and the gate's version-bump commit `0ed7fc53` recorded on it. I haven't promoted it to `ready_to_reconcile`; that's your call.

**What changed** (in `values-diff.ts`, plus one new field the diff reads but doesn't compare, in `value-axes.ts`):

1. **Icon glyphs drawn by `::before`/`::after`.** The diff now knows when a reference glyph was measured by its host element's box rather than by the glyph itself. For those runs it compares the reference's host box against our host box, as `size`. It skips the glyph-size and glyph-position checks, because the reference has no glyph measurement to compare. It also no longer reports `pseudo before → none` when we draw the same character as ordinary text.
2. **Plate we paint that the reference doesn't.** When the reference text sits on a parent's background and ours paints its own background over less than half that area, the diff now reports `surface band 1280×800 → own plate 142×46` under `surfaceFill`. The existing BUG-22 handling, which covers the opposite case, is unchanged.
3. **Repeated-drift summary row.** Small repeated differences are now grouped by property instead of by category. The old `filter … ×17` headline becomes a `pseudo ×16` summary, or disappears once Item 1 removes those rows.

**Re-running iteration 7:** I rebuilt the reference side from the bundle, because the stored `expected-manifest.json` predates the new field and gives the old result. Deltas went from **56 to 22**.
- **Icon rows** dropped from 30 to 5: the 2 real `a11yRole` rows plus 3 `size` rows. The ticket expected only the 2 `a11yRole` rows. The 3 `size` rows are real differences in the host box, not noise: our icon container grows to fit the glyph (`40×40 → 50×40`, and `→ 45×40` twice) where the reference keeps a fixed width with the glyph centred. One of them, U+F109, is REQ-372 issue 2's displaced glyph, so that row now points at the real defect.
- **Header nav links:** the 5 links now produce one new row each, as the ticket predicted.

**Why host-box comparison:** I took the ticket's first option. Measuring the glyph itself would mean changing the capture, bumping `CAPTURE_SCHEMA` and recapturing, and even then the reference still couldn't measure where the ink falls. I also reused the existing `size` and `surfaceFill` properties instead of adding a new `surface` one, following BUG-22's precedent.

**Tests:** 9 new tests in `tests/test_UAT_FC_BUG-190_values_diff_pseudo_glyph_surface_aggregate.test.ts`, all passing, using iteration-7 values as fixtures. I also ran all 88 test files that touch the diff; everything passes except one test in `req51-object-grouped-report` (an image card's `border` param), which fails the same way on clean xgd-working. Typecheck is clean. To run those suites in the new worktree I had to copy in the gitignored `apps/control-app/src/generated` build output.

The ticket body has a new "What changed / Design decisions / Measured on iteration 7 / Test plan" section added after the original text, which I left as it was.

<!-- xgd-chat-end -->
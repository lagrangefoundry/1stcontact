---
uid: comment-dcf8bf3a
id: COMMENT-5580
type: comment
title: Comment on bug BUG-259
created_by: xgd
created_at: '2026-10-23T23:00:58.449617+00:00'
updated_at: '2026-10-23T23:11:29.495090+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-c3fab439
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "d025e6ca-c31f-40c5-8671-9e9efa1e6b5b",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="9ad23baf-9df7-4e7e-a89a-ca4130f18566-user" -->

<!-- xgd-chat role="user" ts="2026-10-23T22:59:25.756579+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="9ad23baf-9df7-4e7e-a89a-ca4130f18566-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-23T23:11:27.998450+00:00" -->
#### Claude
The ticket is fully scoped; I've set it to `free_coding` and cut `free-BUG-259`. Now reading the renderer's inlined-drawing path.

Still reading: I'm checking how image nodes get their height, so the fit fix can't collapse an auto-height drawing.

I'm locating a real-Chromium test pattern to copy for the UAT; next I'll write the renderer change.

Writing the renderer change now: the drawing's wrapper becomes a size container and the inlined SVG gets an object-fit-exact size and offset.

Now the edits.

Playwright lives under `tools/generate/node_modules`; checking that the worktree has it.

Chromium launches from the main checkout. The worktree's `tools/generate/node_modules` lacks playwright, so I'll symlink the main checkout's copy (node_modules is untracked).

The sandbox needs `--single-process` for Chromium; re-running the UAT with `CHROMIUM_LAUNCH_ARGS` set.

`--single-process` Chromium can't open a second context, so I'll launch one browser per page, as REQ-371 does.

Passes. Confirming it's red without the renderer fix:

Red before (cover cases off by ~11px), green after; `contain` already matched since the old default was a centred contain. Now the regression scope.

Known fresh-worktree gap (missing `control-app` generated files); copying them from the main checkout and re-running.

Regression scope green (164 tests). Typecheck next.

Typecheck clean. Checking the version-bump convention for this project before committing.

I'll update the ticket body with what landed, then commit and run the merge-back sequence.

Committed `49bfbc7d`. Now the lock → merge → bump → merge-back → `free_coded` loop.

BUG-259 is fixed and merged into `xgd-working`, and the ticket is at `free_coded` (commits `49bfbc7d` for the fix and `6edf357c` for the version bump to 0.2.601). I didn't need to ask you anything first: the ticket already set out the cause, the fix and the tests.

**The fix** (`packages/framework/src/l1/render.ts`, new `drawingFit()`): when a `parts` drawing's node sets an `objectFit` other than `fill`, the renderer now places the drawing exactly where the browser would place it as an ordinary image.
- The wrapper `<span>` now clips anything outside the box and acts as the reference size for the drawing.
- The `<svg>` is sized against that box (`cover` takes the larger fit, `contain` the smaller, and `scale-down` and `none` work as for an image), then shifted by `objectPosition`. Any `xPct`/`yPct` works, not just 0, 50 or 100.
- The drawing's size comes from the same `readDrawingIntrinsics` helper in `marked-points.ts` that reads clicks back into the drawing, so rendering and click-reading use the same numbers.
- The wrapper also gets the drawing's aspect ratio. Without it, a node whose height came from its picture would collapse to nothing. Where the box has a set size, this has no effect.
- A drawing with no fit (or `fill`) produces exactly the same output as before.
- Everything written into the CSS is a formatted number, so no instance text reaches the stylesheet.

**One extra fix in shared code:** `readDrawingIntrinsics` used to read `width="100%"` as a natural width of 100px, which would have treated many drawings as square. It now accepts only plain lengths, so the click-reading code benefits too. This is recorded in the ticket.

**Tests:** the new real-Chromium UAT `tests/test_UAT_FC_BUG-259_inlined_drawing_follows_object_fit.test.ts` passes. It renders a generated 1536×1024 PNG with coloured dots next to a `parts` drawing that has a named part at each dot. Every part lands within 1px of its dot at 1280×680, 768×600 and 375×520, for `cover {50,8}`, `contain` and `cover {20,80}`. A fourth check confirms a drawing with no fit still fills its box. Without the fix, the two `cover` checks are about 11px out at 1280×680. `contain` already passed before the fix, because the old behaviour happened to be a centred contain.

The REQ-335, REQ-82 security/robustness, marked-points (REQ-210, BUG-72), REQ-136, REQ-209, REQ-222 and authoring-envelope suites all pass (164 tests), and the framework package typechecks.

**Two things to know:**
- These browser tests only run here with `CHROMIUM_LAUNCH_ARGS=--single-process`; without it Chromium can't start in this sandbox and the tests skip instead.
- The existing browser test in `test_UAT_FC_REQ-371_reveal_root_margin_pill_height.test.ts` imports `playwright` in a way that can't load from `tests/`. It skipped in this session even from the main checkout, so it isn't being exercised here. I left it alone because it's outside this ticket.

The ticket is ready for you to promote to `ready_to_reconcile` whenever you choose.

<!-- xgd-chat-end -->
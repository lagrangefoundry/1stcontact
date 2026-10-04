---
uid: comment-ef2bc33a
id: COMMENT-4895
type: comment
title: Comment on request REQ-384
created_by: xgd
created_at: '2026-10-04T17:09:30.881717+00:00'
updated_at: '2026-10-04T17:29:02.277803+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-cb651734
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "88eea3eb-d18e-4678-b9d1-0e99729d04ed",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="6753a90f-a206-4168-a1a3-e6b208d22e46-user" -->

<!-- xgd-chat role="user" ts="2026-10-04T17:08:26.614389+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="6753a90f-a206-4168-a1a3-e6b208d22e46-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-04T17:29:02.084721+00:00" -->
#### Claude
Reading the capture code for where the text-decoration is read; next I'll check other capture paths and existing tests.

Plan: implement Issue 1 (propagated underline in capture). Checking whether Chromium can launch here, which decides whether Issue 2's separating test is runnable.

Chromium launches with `--single-process`, so browser UATs can run. Setting ticket scope and status, then cutting the branch.

Now the code change in the worktree.

Code wired in; now updating the field docs, bumping the capture schema to 22, and writing the UAT.

Now the schema bump.

Copying the ignored build artifact into the worktree so the REQ-365 suite can load, then re-running.

Fix proven (fails without, passes with). Running the broader capture regression scope and typecheck.

Checking whether these 4 failures pre-exist on clean xgd-working.

All 4 pre-existing. Now typecheck.

Issue 1 is done and typechecks clean. Now attempting Issue 2's separating test, since Chromium runs here.

Fixing `lineBoxOf` to floor the half-leading the way Blink does, then looking for tests that pin the exact value.

`lineBoxOf` now floors. The REQ-265 suites still pass. Writing a browser UAT for Issue 2 that compares the captured line top against a known one.

Passes. Confirming it fails without the floor.

Fails without the floor (99.8 vs 100), passes with it. Adding Issue 2 to the schema-22 history and stale axes.

Re-running the capture regression batches with both fixes in place.

Same 4 pre-existing failures only. Checking the remaining real-capture suites that the first grep missed.

No regressions: every failure in the wider sweep also fails on clean xgd-working. Updating the ticket body, then committing.

Committing the code on the branch.

Now the merge-back sequence: lock, merge working into the branch, bump, fast-forward, then promote.

Updating the Chromium memory: it's out of date, because browser UATs do run here with `--single-process`.

I've fixed both issues in REQ-384, and both turned out to be in the capture. The fix is merged into xgd-working and the ticket is at `free_coded` (commits `173091e0` + `5183da70`, version 0.2.486). **Nothing changes on hearingzone510.com until its reference bundle is re-captured.** I raised the capture schema from 21 to 22, so older bundles are now flagged as stale for both fixes.

**Issue 1 — underline inherited from a `<u>` wrapper was dropped.** Fixed as the ticket proposed. A run's `textDecoration` now takes the nearest ancestor's decoration line when the run has none of its own. That covers `<u><a style="text-decoration:none">` and decorations set on a block. The lookup stops at inline-blocks, floats and absolutely or fixed positioned boxes, because the line doesn't carry into those. The underline offset is read from whichever element declares the line.

**Issue 2 — text sitting 0.5–0.7px high. The cause is in the capture, so the renderer needs no change.** The reference's text runs are inline `<span>`s. For inline runs, the capture works out the line's top edge from the text's own box using the exact half-leading, `(lineHeight − textHeight) / 2`. Chromium rounds that value down to a whole pixel. So the recorded top sat above where the page actually laid the line out. That accounts for every row in the ticket's table:

| line height | exact half-leading | Chromium |
|---|---|---|
| 18px / 23.39 | 0.695 | 0 |
| 18px / 27 | 2.5 | 2 |
| Prata 24 / 31.21 | −0.895 | −1 |

This is also why every local Chromium setup "floored": the browser always rounds down, and only the capture's arithmetic didn't. The fix rounds down the same way. Block-level runs are unaffected. The separating test the ticket proposed wasn't needed.

**Tests:** `tests/test_UAT_FC_REQ-384_propagated_decoration.test.ts` runs in a real browser on two new HTML fixtures, plus a check that pre-22 bundles are flagged stale. Both browser checks fail without the change and pass with it. I also ran the 95 test files that touch the capture, the fold or the gate. Thirteen tests fail, and the same 13 fail on a clean xgd-working. Types check clean.

**Left alone on purpose:** two places in `fold.ts` (`selfSurfaceLines`, `withChipInset`) centre text inside buttons and chips using the same exact half-leading. They weren't in this ticket's evidence, and REQ-383 pins their current output, so I didn't touch them. They're noted in the ticket as the first place to look if a button label shows up half a pixel off.

**Run after a re-capture:** the ticket's two `python3` snippets. The four `<u>` runs should read `'underline'`. The "We match…" run should read an offset of `[0.0]` on both sides, and "Adjustments" / "Lakeshore" `[2.0]`.

The browser tests run in this sandbox if you set `CHROMIUM_LAUNCH_ARGS=--single-process`. I've updated my notes, which previously said they couldn't run here.

<!-- xgd-chat-end -->
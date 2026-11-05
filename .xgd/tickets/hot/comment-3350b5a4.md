---
uid: comment-3350b5a4
id: COMMENT-4863
type: comment
title: Comment on request REQ-372
created_by: xgd
created_at: '2026-10-03T22:34:44.709039+00:00'
updated_at: '2026-10-03T22:51:59.980270+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-ba41ef76
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "d0cda0e0-81e9-4be2-9b58-135a3963b983",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="e90010f7-38db-47b2-90c9-e0589fdccd6b-user" -->

<!-- xgd-chat role="user" ts="2026-10-03T22:32:53.955893+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="e90010f7-38db-47b2-90c9-e0589fdccd6b-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-03T22:44:44.583568+00:00" -->
#### Claude
Implementing issue 1 in fold.ts now (the guard on `surface.self`), then issue 2 in the renderer.

Issue 1 confirmed offline: refold now emits no nav-run fills and no replacement card plates. Writing its UAT next.

Both code changes are in; writing the two UAT files now.

Regression scope is clean apart from one failure that also fails on clean xgd-working. Next: update the ticket, bump the version, commit and merge.

Now commit on the branch and merge back.

I've fixed both issues in REQ-372, merged them into xgd-working, and the ticket is now at `free_coded` (version 0.2.457, story points 3). The fold fix is checked against the real page; the renderer fix is not yet, because Chromium can't launch here.

**Issue 1 – nav links painted as black plates (fold).** The check that treats a padded run as a self-painting button (`isPaddedControlRun` in `tools/generate/src/l1/fold.ts`) now also requires the fill to be the run's own. If the capture says the fill came from an ancestor (`surface.self: false`), the run gets no fill of its own. Captures with no surface record behave as before, and real buttons (BUG-21's) keep their fill and rounded corners.
- **Checked on the real page:** I re-folded a copy of the joyfulculinarycreations bundle offline. The five nav-link fills are gone, and no black plates appear at the link positions instead. The only black boxes left are the full-width hero layers, which were there before.
- **Not checked yet:** the pixel check with `1c gate`.

**Issue 2 – centred run grows from its left edge (renderer).** In `packages/framework/src/l1/render.ts`, a centred run that is allowed to grow past its captured width now keeps the centre of its captured box fixed. A right-aligned run keeps its right edge fixed. It works by moving `left` to the centre (or right edge) and pulling the box back with `translate`. Left-aligned runs produce exactly the same CSS as before. The CSS-level test passes. The browser test that measures the drawn position was skipped, so the "glyph now draws at 250" result isn't proven yet.

**One limitation:** if the same element also has an entrance or scroll animation that moves it with `translate`, the centring is lost while the animation plays. It returns to the right place when the animation ends.

**Tests:** four UATs in `tests/test_UAT_FC_REQ-372_padded_run_ancestor_fill_and_centred_relaxed_run.test.ts`. The fold test fails if the fix is removed. I also ran every test file that drives the fold or the renderer (121 files): all pass except one AC931 font-family test in `reconciliation-colour-palette-overlay`, which fails the same way on clean xgd-working.

I added a "What landed" section and the test plan to the ticket body and left the original report as it was. When you're happy, you can promote it to `ready_to_reconcile`.

To confirm on the real page, run these where Chromium can launch:
- **Issue 1:** the `1c gate` command in the ticket. The black region at x 640, y 64 should be gone.
- **Issue 2:** the `1c render` + `1c gate` commands in the ticket. The FAQ icon glyph's `renderedTextBox` should start at x 250.

<!-- xgd-turn id="f650c06c-b755-42de-a111-ecf5aa499b7a-user" -->

<!-- xgd-chat role="user" ts="2026-10-03T22:51:34.896083+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="f650c06c-b755-42de-a111-ecf5aa499b7a-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-03T22:51:58.188697+00:00" -->
#### Claude
REQ-372 is already implemented, and nothing has changed since the last turn, so I haven't redone any of it.

- **Status:** the ticket is at `free_coded`, version 0.2.457.
- **Commits:** the code commit (`f3a5eb11`) and the version-bump commit (`6509681f`) are both recorded on the ticket and both are on xgd-working.
- **Ticket body:** your original report is unchanged. Below it are the "What landed" section and the test plan, and every UAT there traces back to wording in the body.
- **Issue 1 (fold):** a padded run whose fill came from an ancestor (`surface.self: false`) no longer gets that fill as its own background. Re-folding the joyfulculinarycreations bundle offline confirmed the five black nav plates are gone.
- **Issue 2 (renderer):** a centred run that grows past its captured width now keeps its captured centre fixed, and a right-aligned run keeps its right edge. The CSS-level test passes. The browser test that measures where the run actually draws was skipped because Chromium can't launch in this sandbox.

Two checks still need a machine where Chromium runs:
- **Issue 1:** the pixel check with `1c gate`, using the command in the ticket. The black region at x 640, y 64 should be gone.
- **Issue 2:** the `1c render` + `1c gate` commands in the ticket. The FAQ icon's `renderedTextBox` should start at x 250.

When you're happy, promote the ticket to `ready_to_reconcile`. If you meant a follow-up change, tell me what it is and I'll add it to this same ticket.

<!-- xgd-chat-end -->
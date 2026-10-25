---
uid: comment-6258ff98
id: COMMENT-3360
type: comment
title: Comment on request REQ-286
created_by: xgd
created_at: '2026-09-20T21:16:13.736966+00:00'
updated_at: '2026-09-20T21:36:30.427596+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-6a3e269d
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "8c6f9930-78d6-41fd-8c72-46f697ca8bdd",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="bf19ac65-f7cd-40b8-9c40-c3baeb2840ce-user" -->

<!-- xgd-chat role="user" ts="2026-09-20T21:15:22.412756+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="bf19ac65-f7cd-40b8-9c40-c3baeb2840ce-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-20T21:21:22.827750+00:00" -->
#### Claude
Ticket is fully specified — no blocking questions. Starting the free-coding protocol.

Now the edits. First `shot.ts`:

Now the surface JSON prose for `capture_site`:

Now the tests — delete the two REQ-206 budget UATs and add the new REQ-286 UAT.

Now delete the two superseded REQ-206 UATs:

Now typecheck and run the regression scope:

⚠️ Chat generation failed: Claude Code CLI error (exit code 1)
Error: You've hit your session limit · resets 3:50pm (America/Los_Angeles)

<!-- xgd-turn id="59844c74-2a9e-4326-ae9a-5f044d80ef33-user" -->

<!-- xgd-chat role="user" ts="2026-09-20T21:31:22.646000+00:00" -->
#### You
PLease continue

<!-- xgd-turn id="59844c74-2a9e-4326-ae9a-5f044d80ef33-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-20T21:36:29.610766+00:00" -->
#### Claude
Now lock and merge back.

Done — REQ-286 is landed and at `free_coded`.

## What shipped

**`apps/control-app/src/shot.ts`** — the quota is gone, not raised: `SESSION_BROWSER_BUDGET`, `BrowserBudgetSpentError`, the `BrowserBudget` interface and `browserBudget()`, `ShotDeps.budget`, and the `budget.meter(...)` wrap in `fidelityDeps`. The launcher is the launcher again. The prose that documented the ceiling as the answer to a question is replaced by a paragraph recording that it was removed on purpose and what took over — authorisation is still answered by there being no route, spend is answered in tokens at the point of call.

**`apps/control-app/src/router.ts`** — `sessionFidelity`'s doc no longer mints or describes a budget.

**`tools/generate/src/cli/ai/fidelity-surface.json`** — `capture_site` now says what a capture actually costs (a name and some counts, not pictures), which is the opposite steer from the one the quota gave. `surface_version` 6 → 7.

**Tests** — REQ-206's two budget UATs deleted; the one assertion in them that was never about the budget (reading an already-captured reference asks for no browser) is carried forward into the new `test_UAT_FC_REQ-286_a_conversation_can_look_as_often_as_the_work_needs`, which drives 48 looks — six responsive ladders, comfortably past the old forty rather than one past it — through the production `sessionFidelity` assembly and asserts every one leases and returns a picture. Chosen that way so it can tell "ceiling gone" from "ceiling raised".

## Verification

- `tsc --noEmit` on control-app: clean (needed `./bin/1c assets` first — `src/generated/` is gitignored and this worktree had none).
- REQ-286 + REQ-206 scope: 6 passed.
- Adjacent fidelity-surface tests (REQ-154, REQ-219, REQ-228): 68 passed.
- No residual `browserBudget` / `SESSION_BROWSER_BUDGET` references outside the new UAT's doc-comment, which names the old constant deliberately since there is nothing left to import.

## Ticket

Body was already accurate; I made three surgical additions rather than rewriting it — the rescued assertion now names the REQ-286 UAT as its home, the REQ-206 file's module doc-comment change is recorded (its *assertions* are untouched, its claim list isn't), and the `surface_version` bump is stated as the consequence of changing the manual.

`fields.commits: [196ebdbea5]`, version `0.2.295`, `story_points: 2`. Merged to `xgd-working`, branch cleaned, lock released. Promotion to `ready_to_reconcile` is yours.

<!-- xgd-chat-end -->
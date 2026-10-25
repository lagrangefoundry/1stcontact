---
uid: comment-fac69ac1
id: COMMENT-4317
type: comment
title: Comment on bug BUG-166
created_by: xgd
created_at: '2026-09-29T04:23:01.314997+00:00'
updated_at: '2026-09-29T04:49:46.536302+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-916e3faf
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "e904d1aa-1be0-4e11-b89c-b6c8585f0026",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="8b7c8beb-bbac-4992-adbf-f6140d4c4d98-user" -->

<!-- xgd-chat role="user" ts="2026-09-29T04:22:35.461611+00:00" -->
#### You
On the new Operating Console for 1c the costs need a little work:
The Business Cost needs to be a total of "Own Spend" and "Delegate Spend"
Own spend should be "Principal Spend"
In the turns I see a cost column, but no costs the are all "-", I would like to see a Principal cost and a Delegate cost

<!-- xgd-turn id="8b7c8beb-bbac-4992-adbf-f6140d4c4d98-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-29T04:49:44.863472+00:00" -->
#### Claude
Now I have the full picture. Let me write the scope ticket.

Worktree is ready with deps. Starting with the join fix in `host-core.ts`.

Now the router: pass the ledger's id through `streamTurn`.

Now the routes in `router.ts`.

Now the turns route.

Now the client: labels in `config.js`.

Now `tenant-cost.js` headline figures.

Now the turn table columns.

Now update the existing REQ-320 UATs and the REQ-298 fixture to the new wire shape.

Now the REQ-320 workers UAT.

Now the REQ-298 console-panes fixture, which must carry the route's new `total`.

Now the new UATs. First, the join through the real prompt route.

Now writing the new UATs.

Confirmed the UAT catches the defect. Now the route-figures UAT.

Now the surface UAT for the console pane.

Now the regression scope: the adjacent console/spend/turn suites.

Now updating the ticket body to cover the league/list consequence.

Now the merge back to `xgd-working`.

Now releasing the lock and tearing down the branch.

Done. All three cost problems are fixed and landed on `xgd-working`; BUG-166 is at `free_coded`.

**What changed**

1. **Business cost is now the whole bill.** `/api/admin/spend` returns a settled `total` — principal + delegated, plus that total over the report's own engaged hours — and the pane's headline renders it. The labelled pair below is untouched and still never summed there. *Cost / hour* moved to the same total so the two figures on that row divide into each other correctly.

2. **"Own spend" → "Principal spend"**, matching what the route, the `data-half` attribute and the module's own prose already called it.

3. **The turn costs were all dashes because the join could never match.** `turn_log.turn_id` was minted by `openTurn` in the route; `turn_spend.turn_id` was minted independently inside `streamPrompt`. Two ids for one turn, so REQ-320's lookup found nothing on every row since the column shipped. `streamPrompt` now accepts the caller's turn id and `/api/ai/prompt` passes the ledger's — one turn, one id. The CLI, which has no ledger, still mints its own.

4. **Each turn now carries a Principal cost and a Delegated cost**, two columns instead of one summed cell, each absent independently (a delegation that can't be priced no longer erases the caller's own measured spend) and each a dash rather than `$0.00` when there's nothing to report.

Consequence I also fixed: the console's **list** column now carries and ranks by the same total — otherwise the list would have shown $24 next to a pane headline of $30 for one business over one period.

**Evidence** — three new UAT files (`test_UAT_FC_BUG-166_*`): a real turn through `POST /api/ai/prompt` in workerd proving the ledger and meter rows land under one id (verified to fail against the unfixed router), the spend/league route figures, and the two console surfaces. REQ-320's two UATs and REQ-298's fixtures were updated to the new wire shape. Everything in the touched area passes.

**Note on the wider suite:** a full sweep in the branch worktree showed ~36 failures across unrelated suites (component-origin serving, font provenance, delegation, dev processes). I confirmed these are environment artifacts, not regressions — REQ-295/296 and BUG-64 fail identically with my changes stashed, and the REQ-180 vocabulary guard and BUG-64 also fail on your unmodified `xgd-working` checkout. Those last two are pre-existing failures on your working branch, worth a look separately.

The ticket body records the full scope including the supersession of REQ-320's single-column decision. It's parked at `free_coded` — promotion to `ready_to_reconcile` is yours when you've validated it.

<!-- xgd-chat-end -->
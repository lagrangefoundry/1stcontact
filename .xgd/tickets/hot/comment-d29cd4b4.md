---
uid: comment-d29cd4b4
id: COMMENT-3612
type: comment
title: Comment on request REQ-293
created_by: xgd
created_at: '2026-09-21T21:39:40.910401+00:00'
updated_at: '2026-09-21T21:54:14.702019+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-17c6805c
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "d55da437-4d67-4b68-b717-d60a1defcd5b",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="042f0560-57a1-444e-9f8b-28c80feb7242-user" -->

<!-- xgd-chat role="user" ts="2026-09-21T21:38:48.301506+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="042f0560-57a1-444e-9f8b-28c80feb7242-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-21T21:54:13.746964+00:00" -->
#### Claude
I'll start by reading the ticket to understand the scope.

Now writing the core report module.

Now the admin route.

Now the workers-side UAT against real D1 and the real route.

Now merging back into `xgd-working` under the shared lock.

Implemented and landed. REQ-293 is at `free_coded`, merged into `xgd-working`.

## What shipped

**`tools/generate/src/cli/ai/spend-report-core.ts`** — the arithmetic, importing nothing.
- `ENGAGED_GAP_CAP_MS` = 5 min, with the measurement (median 4.2 min inter-turn gap) recorded as the reason.
- `engagedMs(boundaries)` — takes `(startedAt, endedAt)` pairs as an *argument*, not a table, so the same call answers from the meter and from the audit ledger. Sorts internally, returns aligned to input.
- `spendReport(turns)` — groups by session, computes each turn's interval once and spends it three times (total, role, model), so the splits partition the total by construction.

**`apps/control-app/src/spend.ts`** — `tenantSpendTurns` / `tenantSpendReport`, in the same module as the writer (one table, one column list). Half-open period, either end optional; selects five columns, not the four counters.

**`apps/control-app/src/router.ts`** — `GET /api/admin/spend?business=…&from=…&to=…` behind `ownsPlatformBusiness`, 404 on refusal, 400 on a missing business or an unparseable stamp.

**10 UATs** (6 node + 4 workerd against real D1 and the real `route()`), all passing, plus the REQ-292 suites re-run green.

## The one judgement call worth your eye

Condition 3 says *"a session's first turn contributes only its own duration."* The definition above it — and the source analysis in `metrics.md` — say the gap is credited **forward** ("plus the gap until the **next** turn"), which puts the boundary on a session's **last** turn, not its first. I implemented forward, because that gap is the client reading what the turn produced, and the model split is only truthful attributed that way. **The total is identical either way** — only the split moves. I left conditions 1–5 untouched and recorded the reading, with the reasoning, under a new `## Implementation decisions` section. If you want it credited backward instead, it's a two-line change in `engagedMs` plus the split expectations.

Two other things I decided and wrote into the ticket body: a partially-unpriced period reports the priced sum with an `unpricedTurns` count beside it (a floor, labelled as one) rather than a silent total; and the report is an operator surface for now, since a customer-facing number is a bill and a bill needs the cap that EPIC-20 puts in a later ticket.

Promotion to `ready_to_reconcile` is yours when you're happy with it.

<!-- xgd-chat-end -->
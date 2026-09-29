---
uid: bug-916e3faf
id: BUG-166
type: bug
title: 'Operating console: business cost omits delegation, and turn costs never join'
created_by: martin-github@westhead.me
created_at: '2026-09-29T04:15:51.480962+00:00'
updated_at: '2026-09-29T04:28:26.130620+00:00'
completed_at: null
last_field_updated: status
status: free_coding
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-fac69ac1
  severity: medium
---

## Symptom

Three faults on the operating console's cost surfaces, reported together.

1. **The headline "Cost" under *Business cost* is only half the bill.** It renders
   `report.costMicros` — the business's OWN turns — while the *Delegated spend*
   figure sits below it, unadded. A reader takes the headline for the period's
   total, so every delegating turn is under-reported in the flattering direction.
2. **"Own spend" is the wrong word for that half.** It should read
   *Principal spend*, which is what the route, the `data-half` attribute and the
   module's own prose already call it.
3. **Every cost in the recent-turns table is a dash.** Not "often" — *always*.
   `turn_log.turn_id` is minted by `openTurn` in the route; `turn_spend.turn_id`
   is minted independently inside `streamPrompt` ("the framework's own turn id
   never leaves the junction"). The two ids can never be equal, so REQ-320's
   join on `turn_id` matches nothing and the column has been empty since it
   shipped. And when it does carry a figure, the operator wants the turn's two
   halves — **principal** and **delegated** — rather than one summed cell.

## Root cause

- (1) is a deliberate REQ-297 decision ("the two figures are never one") applied
  to a cell an operator reads as the total. The two halves must still be labelled
  separately below; what changes is that the *headline* is the sum.
- (3) is the id mismatch above. Nothing joins, so nothing renders.

## Fix

**One turn, one id.** `streamPrompt` takes the turn id as an optional argument
and mints one only when it is not given. `/api/ai/prompt` passes the ledger row's
id, so `turn_log` and `turn_spend` are two records of one turn under one key and
the join REQ-320 built actually lands. A caller with no ledger (the `1c` CLI)
keeps minting, unchanged.

**The turn's cost travels as two figures, not one.** `tenantTurnCosts` reports
`{principalMicros, delegatedMicros}` per turn — the row's own `cost_micros` and
the sum of its priced `attributed` entries. The table renders two columns,
*Principal* and *Delegated*, replacing the single *Cost* column REQ-320 added.
Absent stays a dash and never `$0.00`: a turn that delegated nothing has no
delegated figure, exactly as the cost pane's delegated half has none.

**The period's total is computed once, on the route.** `/api/admin/spend` gains
`total: {costMicros, costPerEngagedHourMicros}` — principal plus delegated, and
that same total over the report's own engaged hours. The console renders it in
the headline; the two halves below are unchanged and still never added there.
The client does no arithmetic, which keeps `tenant-cost.js`'s no-second-opinion
rule intact.

*Cost / hour moves with it as a technical consequence*: a headline that showed a
total beside a rate derived from the principal half alone would let an operator
divide the two figures on screen and get a third number. Both come from `total`.

**The label.** `TENANT_COST_PRINCIPAL` becomes `Principal spend`.

### Supersedes

- REQ-320's decision that the turn table carries ONE cost column holding the
  turn's total. The column becomes two, principal and delegated. The route's
  `turns[].costMicros` is replaced by `principalMicros` / `delegatedMicros`;
  REQ-320's own UATs are updated to the two-figure shape rather than deleted —
  the join they prove is the same join, now reported in halves.
- REQ-297's decision that no surface adds the two halves, *for the headline cell
  only*. The labelled pair below it is untouched and is still never summed there.

## Test plan

UATs named `test_UAT_FC_BUG-166_*`:

- **workers, real route**: a real turn through `POST /api/ai/prompt` writes a
  `turn_spend` row whose `turn_id` is the `turn_log` row's id, and
  `GET /api/admin/turns` reports a principal cost for it rather than a dash.
- **workers**: `/api/admin/turns` reports principal and delegated separately —
  a delegating turn shows both, a turn that delegated nothing shows a principal
  figure and no delegated one, an unpriced turn shows neither.
- **workers**: `/api/admin/spend` returns `total.costMicros` = principal +
  delegated; equal to principal where nothing was delegated; `null` where
  neither half was measured; and `total.costPerEngagedHourMicros` derived from
  that total.
- **surface**: the *Business cost* headline renders the route's total, the
  principal half is labelled *Principal spend*, and the two halves below still
  render separately.
- **surface**: the turn table has *Principal* and *Delegated* columns, each a
  dash where the figure is absent and never `$0.00`.

Updated: REQ-320's two UAT files, and REQ-298's console-panes fixture, to the
new wire shape.
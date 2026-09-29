---
uid: bug-916e3faf
id: BUG-166
type: bug
title: 'Operating console: business cost omits delegation, and turn costs never join'
created_by: martin-github@westhead.me
created_at: '2026-09-29T04:15:51.480962+00:00'
updated_at: '2026-09-29T04:42:00.668570+00:00'
completed_at: null
last_field_updated: body
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
delegated figure, exactly as the cost pane's delegated half has none. The halves
are absent *independently* — a delegation this reader cannot price no longer
erases the caller's own measured spend, which one summed cell did.

**The period's total is computed once, on the route.** `/api/admin/spend` gains
`total: {costMicros, costPerEngagedHourMicros}` — principal plus delegated, and
that same total over the report's own engaged hours. The console renders it in
the headline; the two halves below are unchanged and still never added there.
The client does no arithmetic, which keeps `tenant-cost.js`'s no-second-opinion
rule intact. `null` only where neither half was measured — nothing, never zero.

*Cost / hour moves with it as a technical consequence*: a headline that showed a
total beside a rate derived from the principal half alone would let an operator
divide the two figures on screen and get a third number. Both come from `total`.

**The console's LIST carries the same total, and ranks by it** — also a technical
consequence, not a separate request. The list and the detail pane are one
question asked of many businesses and of one; a list column showing the principal
half beside a headline showing the total would put two different figures for the
same business over the same period on one screen. So `/api/admin/spend/businesses`
returns `total` per business, orders by it, and `platform-sites.js` prints it.
Ranking by the total is also the more honest answer to *which tenant is costing
us money*: a business whose spend went to its workers is costing us that money.
The per-business `report` stays on the wire — it is what the pane's decomposition
decomposes.

**The label.** `TENANT_COST_PRINCIPAL` becomes `Principal spend`.

### Supersedes

- REQ-320's decision that the turn table carries ONE cost column holding the
  turn's total. The column becomes two, principal and delegated. The route's
  `turns[].costMicros` is replaced by `principalMicros` / `delegatedMicros`;
  REQ-320's own UATs are updated to the two-figure shape rather than deleted —
  the join they prove is the same join, now reported in halves.
- REQ-297's decision that no surface adds the two halves, *for the headline cell
  and the list column only*. The labelled pair in the decomposition is untouched
  and is still never summed there.

## Test plan

UATs named `test_UAT_FC_BUG-166_*`:

- **workers, real route** (`one_turn_one_id`): a real turn through
  `POST /api/ai/prompt` writes a `turn_spend` row whose `turn_id` is the
  `turn_log` row's id, and `GET /api/admin/turns` reports a principal cost for it
  rather than a dash. Verified to fail against the unfixed router.
- **workers** (`the_business_cost_is_the_whole_bill`): `/api/admin/spend` returns
  `total.costMicros` = principal + delegated; equal to principal where nothing was
  delegated; `null` where neither half was measured; `total.costPerEngagedHourMicros`
  derived from that total over the same engaged hours; and
  `/api/admin/spend/businesses` prints and ranks by the total where the two
  orderings disagree.
- **surface** (`the_console_reads_the_whole_bill`): the *Business cost* headline
  renders the route's total, the principal half is labelled *Principal spend*,
  the decomposition still shows two figures, the pane computes nothing of its own,
  and the turn table has *Principal* and *Delegated* columns — each a dash where
  the figure is absent and never `$0.00`.

Updated: REQ-320's two UAT files, and REQ-298's console-panes fixtures, to the
new wire shape.

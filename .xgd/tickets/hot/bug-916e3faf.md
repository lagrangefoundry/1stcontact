---
uid: bug-916e3faf
id: BUG-166
type: bug
title: 'Operating console: the turns pane can never price a turn, and "Business cost"
  leaves out everything that was delegated'
created_by: martin-github@westhead.me
created_at: '2026-09-29T04:15:51.480962+00:00'
updated_at: '2026-09-29T04:48:49.514014+00:00'
completed_at: null
last_field_updated: status
status: free_coded
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-fac69ac1
  severity: medium
  epic_parent: epic-0923bb64
  story_points: 5
  commits:
  - working_sha: 79b55a0d02f0f3f7c2066053cbe1311f3bfd371b
    reconcile_sha: null
    main_sha: null
  - working_sha: b08480e323ce2c9d16b6d8e857fd2686de8b09c4
    reconcile_sha: null
    main_sha: null
  - working_sha: b988e35f71906ff1f58e56cd295c44c9f13bfc93
    reconcile_sha: null
    main_sha: null
  version: 0.2.408
---

## What is wrong

Three things about money on the operating console's cost surfaces, from using it
(2026-09-29). Two are labelling and arithmetic decisions; the third is a defect with
a single cause and it is the one that makes the pane unusable.

## 1 · The turns pane's cost column is a dash for every turn, always

`tenant-cost.js` renders an absent figure as `—` on a deliberate rule — *nothing,
never zero* — and the turns route repeats it:

> ABSENT AND NOT ZERO, all the way to the wire. A turn in flight, a turn that died,
> and a turn that failed before its terminal meta arrived have no meter row at all,
> and `null` is what the surface renders as a dash.

That reasoning is sound and it is currently hiding a total miss. **`turn_log` and
`turn_spend` mint different ids for the same turn**, so the join that prices a turn
can never hit.

`ADMIN_TURNS_PATH` (`router.ts`) takes the ids from `turnHealth(tenantTurns(...))` —
which are `turn_log.turn_id` — and looks them up with `tenantTurnCosts`, which
selects `WHERE turn_id IN (…)` from `turn_spend`. Measured on the dev store:

- 36 rows in `turn_log`, 34 in `turn_spend`, and **zero shared `turn_id` between
  them** across the entire database.
- They are unmistakably the same turns. For the Gigabyte Alchemy session every row
  pairs on `started_at` to within 9–21ms and agrees on `outcome`:

| | turn_log | turn_spend | started_at | outcome |
|---|---|---|---|---|
| 1 | `turn_d7a610d3…` | `turn_0c12192e…` | 03:37:20.294 / .303 | error |
| 2 | `turn_7a6e5124…` | `turn_96253dcf…` | 03:56:18.400 / .415 | complete |
| 3 | `turn_103e4be1…` | `turn_91cd7949…` | 04:03:19.377 / .392 | complete |
| 4 | `turn_74fda83e…` | `turn_44750130…` | 04:10:26.724 / .734 | error |
| 5 | `turn_b8875a4e…` | `turn_95471d66…` | 04:26:12.015 / .036 | error |

So `costs[turn.turn]` is `undefined` for every row, `?? null` makes it a dash, and
the dash rule explains it away. The fix is one identity, not a formatting change:
the two records have to name the turn the same way — and where they cannot, the
pairing has to be something both sides actually share rather than an id only one of
them mints.

**A dash that means "not priced" and a dash that means "never found" must not look
the same.** That is what let this sit unnoticed behind a correct-sounding comment.

## 2 · A turn needs a principal cost and a delegate cost, not one total

`tenantTurnCosts` answers one number per turn, via `totalOf(own, attributed)` — the
caller's own cost plus every delegated entry's. It returns `null` if **any** part of
that sum is unknown, which is the right call for a single cell and the wrong shape
for the question: one unpriced worker erases the caller's own cost, which was known.

Two columns — **principal** and **delegate** — make each absence local. A turn whose
own spend is priced and whose worker is not then reads as exactly that, instead of
disappearing.

This also needs the two halves to stay distinguishable on the wire, so the split has
to reach the surface rather than be derived in the pane, which
`tenant-cost.js`'s standing rule already requires: *it formats; it does not divide,
sum or average.*

## 3 · "Business cost" should be principal plus delegate

`TENANT_COST_LABEL` is `'Business cost'` and the figure under it is own spend only —
the report reads `cost_micros` per row (`REPORT_COLUMNS`), and the delegated half
arrives separately through `tenantDelegatedSpend`. So the headline answering *what
did this business cost us* leaves out everything the business handed to a worker.

On the session that prompted this, that is the difference between a believable number
and a misleading one: the two turns that completed priced at **$0.84**, while the
workers those turns drove read over 6M cache tokens between them.

Rename **`TENANT_COST_PRINCIPAL` from `'Own spend'` to `'Principal spend'`**, which
also aligns the words on screen with the vocabulary the code has used all along.

### This reverses a recorded decision, deliberately

`config.js` and `tenant-cost.js` both state the opposite rule today:

> the two figures must be labelled and **must never be added into one**, because a
> caller's true total is its own spend PLUS what it handed off, and a reader taking
> the first alone [under-reports]

The concern is right and the remedy chosen was wrong-headed in one direction: a
reader taking the headline alone under-reports *today*, because the headline is the
first figure. Summing satisfies the worry rather than defeating it — **provided both
components stay labelled and visible underneath**, which is the part that must not be
lost. The delegated half keeps naming the model each figure was incurred on, since
that is how *did construction actually move to the cheap model* is answered by
looking.

So: headline is the total, principal and delegate both still shown, and the comments
in `config.js` and `tenant-cost.js` are updated to say the new rule and why —
not left standing in contradiction of the code.

## Out of scope

Why the underlying rows are so often unpriced or zero is a separate matter, filed
upstream: a turn killed by the tool-loop timeout records no spend of its own
(lagrange-framework BUG-73), and attributed worker entries count turns rather than
requests (BUG-74). Three of this session's five finished turns died that way — all
three `tool loop timeout after 600s`. This ticket is about what the console does with
the rows it has.
---
uid: request-53a5a5f4
id: REQ-320
type: request
title: 'Turn table: local timestamps, drop the identifier columns, show what each
  turn cost'
created_by: EPIC-20
created_at: '2026-09-25T03:57:13.366235+00:00'
updated_at: '2026-09-25T03:57:13.366235+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  epic_parent: epic-0923bb64
  auto_merge_back: true
  needs_review: false
  priority: medium
---

## Why

REQ-306 put a *Most recent turns* table at the foot of the console's detail pane
so that a failing site could be seen without going and finding a platform tail
entry. It succeeds at the alarm and fails at the ledger: **for an operator
reading it, the rows carry nothing useful.** Two of the four columns are
identifiers nobody reads, the timestamp is in a zone the reader has to convert,
and the one figure EPIC-20 cares about — what the turn cost — is absent.

Observed on the dev console, 2026-09-24.

## What changes

`TURN_HEALTH_COLUMNS` (`apps/control-app/src/builder/config.js`) and the row
builder `recentOf` (`apps/control-app/src/builder/turn-health.js`).

### 1. The timestamp reads in the reader's own zone

`started` currently renders `turn.startedAt` verbatim, which is ISO-8601 in UTC
— `2026-09-25T02:05:53.123Z` for a turn the operator watched happen at 19:05
their time. **It must render in the reader's local zone**, because the only
question this column ever answers is *was this recently* and a reader who has to
do arithmetic to answer it does not ask.

Local is the browser's own zone, not a configured one: this pane is browser
JavaScript, the reader is present, and `toLocaleString` already knows. Date and
time both, and **to the second** — the rows routinely sit seconds apart and a
minute-resolution stamp makes two distinct turns look like one.

The format choice belongs in `config.js` beside the labels, under this file's
existing rule that a user-visible string has one definition site.

### 2. Two columns go

**`session` ("Conversation") and `turn` ("Turn") are removed.** They are a
`site-<key>` string that is identical on every row of a per-business pane, and an
opaque turn id. Neither has ever answered an operator's question.

The REQ-306 commentary in `turn-health.js` currently *argues for* the
conversation id — *"the string on screen is the string an operator pastes
somewhere else, rather than one they have to translate back first"*. That
argument must be **revised rather than deleted**: the ticket that added it was
right that an operator sometimes needs the identifier, and the answer is that
the pane is already scoped to one business and the id belongs wherever a
correlation is actually performed, not repeated down every row. A file left
arguing for a column it no longer renders is worse than either state.

Keep the `data-column` ids on the cells. UATs address `[data-column="…"]` rather
than a position, and that should stay true of the narrower table.

### 3. The cost of the turn arrives

A new **`cost`** column, rightmost.

**It is not on this wire yet.** The table is fed by `turnHealth(tenantTurns(…))`
(`ADMIN_BUSINESS_TURNS_PATH`, `router.ts`), which reads `turn_log` — and
`turn_log` has no cost. The figure lives in `turn_spend.cost_micros`, keyed by
the same `turn_id` under the same tenant. So the route joins the two and the
payload's `turns` entries carry the figure.

**Reuse `dollars(micros)` from `builder/tenant-cost.js`.** It already formats
micros to the quoted unit and, more importantly, it already renders `null` as the
dash and never as `$0.00` — which is the exact rule this column needs and a
second money formatter in a second file would be free to get wrong.

**Absence is ordinary here and will be common.** A turn that is in flight, that
died, or that failed before its terminal meta arrived has no `turn_spend` row at
all. Those rows show the dash. A turn that cost nothing and a turn whose cost was
never measured are different facts and the column must not merge them.

**The figure is the turn's total — its own spend plus anything it handed off.**
A turn that delegated 27 site writes to a worker cost more than its own
`cost_micros`, and a ledger that showed only the caller's half would make the
expensive turns look cheap in exactly the cases EPIC-20 is trying to read.
REQ-297's `attributedSpend` already prices an `attributed` entry at its own
backend's rates; this column sums the two.

That summation is only as good as the `attributed` list, so this depends on
**BUG-145** — without it, a delegating turn that failed contributes a dash here
rather than the largest figure on the pane.

## How it will be known to work

The pane shows three columns — when the turn started in the reader's zone to the
second, how it ended, and what it cost including delegated work — and no
conversation or turn identifier. A turn with no spend row shows the dash rather
than `$0.00`. The failure sentence beneath a failed row is unchanged: it is the
part of REQ-306 that already works.

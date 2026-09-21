---
uid: request-17c6805c
id: REQ-293
type: request
title: A tenant's spend, in engaged hours and in dollars
created_by: EPIC-20
created_at: '2026-09-21T20:00:44.197313+00:00'
updated_at: '2026-09-21T21:52:28.589492+00:00'
completed_at: null
last_field_updated: body
status: free_coding
fields:
  epic_parent: epic-0923bb64
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-d29cd4b4
---


## Why

Token cost is not sellable. Consulting hours are. Clients will not learn what a
cached prefix is, but they understand "four hours of AI consulting a month", and
that is the unit this product will be priced and capped in (EPIC-20).

The sibling REQ writes one `turn_spend` row per turn. This ticket turns those
rows into the two numbers a person can act on: **how long they were engaged, and
what it cost.**

## What this ticket does

A tenant's spend for a period, in both units, derived from `turn_spend`.

### Engaged time, and why it is computed rather than stored

A turn's engaged time is its own duration — the client's message to the last
thing the turn did — plus the gap until the **next** turn, capped at **five
minutes**. The clock pauses after five minutes of silence and resumes when they
come back.

**It is computed at read, from the two timestamps the row already holds.** The
next turn does not exist when the current one ends, so storing engaged time
would mean a retroactive update on every turn; deriving it cannot drift and
costs nothing.

Five minutes is chosen from measurement rather than taste. On the heaviest
measured day of the Lagrange Foundry build — 38 turns over 6.68 hours elapsed —
the median inter-turn gap was 4.2 minutes. A two-minute cap stops the clock
during ordinary thinking and undercounts real work; ten minutes bills
multitasking as consulting. The same day reads as 1.58 h of machine time only,
2.67 h at a two-minute cap, **3.69 h at five**, 4.64 h at ten.

It is also measurable server-side with no assumption about the client, and
cannot be gamed by typing slowly.

### What the report answers

Per tenant, per period: **engaged hours, settled cost, and cost per engaged
hour** — and each of those split **by role and by model**.

The split is the load-bearing part, not a nicety. It is what makes a delegation
experiment readable — whether moving construction to a cheaper model actually
moved the money, rather than moving it to the other side of the same bill — and
what makes a second provider comparable when one arrives.

### What the numbers are expected to show

Cost per engaged hour is **not stable**. On the measured day it varied
twenty-fold within one evening — $2/engaged-hour at noon, $42 by late afternoon
— climbing as context grew. A turn with no tool calls averaged $0.57; a turn
with fifteen or more averaged $2.77; the most expensive single turn was $8.90.

The report must make that visible rather than average it away, because it is the
finding that shapes the product: **hours are the right meter and the wrong cap.**
A client doing an afternoon of heavy construction can exhaust a month's budget
in one hour while another spends the same hour talking and costs nothing.

## What must be true when this is done

1. For a tenant and a period, the report gives engaged hours, settled cost and
   cost per engaged hour, each also split by role and by model.
2. Engaged time is derived from `turn_spend` timestamps alone, with the
   inter-turn gap capped at five minutes, and no row is written or updated to
   produce it.
3. A gap longer than the cap contributes exactly the cap; a session's first turn
   contributes only its own duration.
4. A period containing no measured turns reports no hours and no cost, rather
   than zero — the same "nothing, never zero" rule the record itself keeps.
5. Two turns of the same session on different models are attributed to their own
   models in the split, and their hours are not double-counted in the total.

## Not in scope

**The cap.** Enforcing a limit needs a dollar ceiling underneath the hours, a
hot-path rollup so a check does not scan a month of rows (`counters` is the
right structure for that), and a decision about what happens when a client
reaches it — degrade, refuse, or charge overage. None of that can be set
sensibly before a week of real records exists. It is a separate ticket, and
EPIC-20 says so.

Also out: any customer-facing billing, and the replay harness that would let
stored counters be compared truthfully against another provider.


## Engaged hours are recoverable for sessions that predate the meter

Unlike the counters, turn boundaries survive. The R2 audit ledger carries a
timestamp, session and role on every tool call — 1,100 records spanning
2026-09-08 to 09-21 — so engaged time is computable **exactly** for every
session already run:

| tenant | tool calls | engaged hours (5-min cap) |
|---|---|---|
| Lagrange Foundry | 768 | 7.37 |
| 1st Contact | 193 | 2.02 |
| XGD | 139 | 0.89 |
| **total** | **1,100** | **10.28** |

Against the account's **$166.50** over the same period, that is **$16.20 per
engaged hour measured top-down, with no modelling at all** — and it corroborates
the $20/hour the bottom-up model gives for the heaviest single day, which is the
first independent check any figure in EPIC-20 has had.

**So the engaged-time calculation is a pure function of `(started_at, ended_at)`
pairs**, taking turn boundaries as an argument rather than reading `turn_spend`
itself. That is what lets the same code answer for a historical session from the
audit and for a live one from the meter, with no second implementation to drift.

It does **not** mean backfilling `turn_spend`. That table holds measured rows
only — its own ticket says why — so a retrospective is an analysis run over the
audit, never rows written into the meter.

## Implementation decisions

Recorded here because three of them narrow a condition above, and one of them
reads a condition in the only way the definition allows.

### The gap is credited FORWARD, so the boundary falls on a session's last turn

Condition 3's second half — *a session's first turn contributes only its own
duration* — is implemented as **a turn with no turn after it contributes only
its own duration**, which in a session is the LAST one, not the first.

The definition above forces it: a turn's engaged time is its own duration *plus
the gap until the next turn*, so the gap is an interval the earlier turn owns.
It is also the honest attribution — that gap is the client reading what the turn
produced and deciding what to ask next, so it belongs to the turn whose answer
they were reading, and the model split is only truthful if it is attributed that
way.

**The total is identical either way**; only the attribution differs, which is
why this is a decision about the split rather than about the bill. And the first
turn still gains nothing from what precedes it: silence before somebody starts
talking is not engagement, so the clock begins at the first message and never at
the moment a tab was opened.

### The clock never runs between two conversations

The gap is measured **within a session**, never across one. Two sessions are two
engagements — possibly two people, possibly the same person on two days — and a
clock that ran from the end of one into the start of the next would bill the
interval between two conversations as though somebody had sat through it. It
would also make one tenant's arithmetic depend on which other conversations
happened to fall in the same report.

### A turn the price table does not name is counted, not absorbed

`turn_spend` writes a measured row with a **null** cost where `prices.json` has
no entry for its `(backend, model)` — measured but not priced (REQ-292). A
report that silently summed the rest would present a **floor** as a total. So
every level of the report carries `unpricedTurns` beside its figure, and where
*nothing* in a slice was priced the cost is null rather than zero — the same
rule as the empty period. The count is also the alarm that says `prices.json`
has fallen behind `backends.json`.

### Both the exact milliseconds and the rounded hours

Hours are quoted to two decimals because that is how they will be sold, and
`engagedMs` is carried beside them unrounded because a caller adding slices
together, or comparing a month against a cap, must not accumulate two decimal
places of rounding error per row. Cost per engaged hour is in **micros per
hour**, for the reason the settled cost is in micros: floating-point money is
not money.

### Where it lives, and what is deliberately not imported

- `tools/generate/src/cli/ai/spend-report-core.ts` — `ENGAGED_GAP_CAP_MS`,
  `engagedMs(boundaries)` and `spendReport(turns)`. It **imports nothing**: a
  report is assembled from stored rows that are already priced, and re-deriving
  a cost here would be a second answer to a question the meter settled at write
  time. `spend-core.ts` owns what a turn *is*; this owns what a period of them
  adds up to.
- `apps/control-app/src/spend.ts` — `tenantSpendTurns` / `tenantSpendReport`,
  in the same module as the write because there is one table and one shape of
  row; a reader that lived elsewhere would restate the column names a second
  time and could disagree with the writer about them silently. It selects five
  columns and **not** the four counters: this report is in hours and dollars,
  and the counters answer a different question that needs a replay harness.

### The period is half-open, and either end may be absent

`started_at >= from AND started_at < to`, so adjacent periods tile: a turn that
begins exactly on a boundary is in the later period and in that one only, or a
year does not add up to the sum of its months. A turn belongs to the period it
**began** in, so a conversation crossing midnight is counted on the day somebody
sat down. An absent end means unbounded — the meter is retained rather than
pruned, so *everything this tenant has ever spent* is a question it can answer,
and the first person to read it has no period in mind yet.

### The report is reachable: `GET /api/admin/spend`

A report nothing can ask for is unprovable, so the read has an entry point:
`GET /api/admin/spend?business=…&from=…&to=…`, behind `ownsPlatformBusiness`
and refusing with **404** rather than 403 on every other `/api/admin/` route's
reasoning — a caller asking whether an administrative surface exists is owed
nothing, and what this one would hand over is a profile of somebody else's
spending.

It is an operator surface rather than a customer one, and that is temporary
rather than permanent: a client will be shown their hours, but what they are
shown is a bill, and a bill needs a plan, a cap and a decision about overage —
none of which exist yet. Customer-facing billing stays out of scope.

Two refusals: a missing `business` is a 400, and an **unreadable timestamp is a
400 rather than an ignored bound** — dropping a `from` nobody could parse would
answer a wider question with no sign that it had, and the reader would take the
total for the month they asked about.

### The retrospective is an analysis run, not product code

The pure-function property is what ships and what is pinned by a UAT: the same
call answers over the meter's ISO stamps and over boundaries shaped from the
audit ledger's epoch `timestamp` + `durationMs`, and the two must agree. An R2
reader that listed a fortnight of audit objects is a one-off analysis, as this
ticket already says, and is not built here.

### Rows the database does not forbid but the arithmetic must survive

An `ended_at` before its `started_at`, two turns of one session that overlap,
and an unparseable stamp all clamp to a zero contribution rather than a negative
one. A negative interval would **subtract** from a bill.

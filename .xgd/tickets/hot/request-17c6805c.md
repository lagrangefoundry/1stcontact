---
uid: request-17c6805c
id: REQ-293
type: request
title: A tenant's spend, in engaged hours and in dollars
created_by: EPIC-20
created_at: '2026-09-21T20:00:44.197313+00:00'
updated_at: '2026-09-21T20:00:44.197313+00:00'
completed_at: null
last_field_updated: created_at
status: draft
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
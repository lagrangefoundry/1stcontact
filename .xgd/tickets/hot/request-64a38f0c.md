---
uid: request-64a38f0c
id: REQ-297
type: request
title: An operator console for tenant cost
created_by: EPIC-20
created_at: '2026-09-21T23:44:45.407051+00:00'
updated_at: '2026-09-21T23:44:45.407051+00:00'
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

REQ-292 records what every turn cost; REQ-293 turns those rows into engaged
hours and dollars. Neither is visible to anybody. The cost read-out that
informed EPIC-20 was a script run against a local `.wrangler` SQLite file and
written to a scratch file in a worktree — it cannot exist in production, and no
amount of tidying makes it into one.

Nobody can answer "which tenant is costing us money this month" without a
surface. That question decides pricing, caps and whether delegation worked.

## The gate: not "level 0", and this matters

The obvious implementation is forbidden here, in writing.
`identity.ts` says of `platform_operator`: *"`scope.ts` is its only reader; no
control, page or route is gated on it, and none may be — a surface that appears
'because you are an admin' is DOC-40 §2.1 rule 1's failure mode."*

So this console is **not** gated on an admin level, a seniority flag or a user
tier. It is gated on **`ownsPlatformBusiness(env, admission)`** — owning the
1st Contact business — which is the condition DOC-42 §7 actually describes, and
which exists because 1st Contact *hosts* the other businesses rather than
because anyone is senior. The distinction is not pedantry: it is the difference
between a surface that is part of the access model and one that is an exception
to it.

A caller who does not own the platform business gets the same answer they get
for any other business they hold nothing on — not a hidden control, and not a
different-looking refusal that tells them the console exists.

## What this ticket does

### The list

One row per tenant, **ordered by cost over the last 30 days, most expensive
first**. Each row carries the tenant, its settled cost, its engaged hours, and
cost per engaged hour — the three numbers from REQ-293, and no new arithmetic.

A tenant with no measured turns in the window is absent rather than zero, the
same rule the record itself keeps: nothing, never zero.

### The expansion

Clicking a row opens that tenant's detail:

- **by day** across the window — cost and engaged hours per day, which is what
  makes a spike attributable to a session rather than to a month;
- **principal against delegate** — the caller's own spend beside the spend
  attributed to its workers, never summed into one figure.

That second split is the reason this console is worth building now rather than
after REQ-295. **A caller's true total is `usage + sum(attributed)`**, and a
reader taking `usage` alone under-reports every delegating turn — silently, and
in the flattering direction. A console that showed one number would make a
delegation that moved no work look like a delegation that worked. Both numbers,
labelled, always.

Where a worker ran on a different model, the split names it, so "did
construction actually move to the cheap model" is answered by looking rather
than by inference.

### The window

Last 30 days, as a default rather than a constant. The period is a parameter
from the start — a billing question will want a calendar month and an
investigation will want a day, and retrofitting that later means rewriting every
query.

## What must be true when this is done

1. A caller owning the platform business sees the console; every other caller
   gets the ordinary answer for a business they hold nothing on, with no
   evidence the console exists.
2. The list is one row per tenant with measured turns in the window, ordered by
   settled cost descending, showing cost, engaged hours and cost per hour.
3. A row expands to per-day cost and hours across the window.
4. The expansion shows principal and delegated spend as **two figures**, never
   one, and names the model each was incurred on.
5. A tenant that delegated shows a delegated figure that is non-zero; a tenant
   that did not shows the split with delegated absent rather than zero.
6. The period is a parameter; the default is 30 days.
7. The numbers match what REQ-293 reports for the same tenant and period — this
   console renders that report and does not compute a second opinion.

## Not in scope

Caps and enforcement — this console reads. Customer-facing billing or any
surface a tenant sees. Charts: a sorted table answers the question, and the
question is "who is costing us money", not "what is the trend". Exporting.
Anything about a tenant other than its spend.

## Depends on

REQ-292 and REQ-293. There is nothing to render until both are reconciled and a
period of records exists.

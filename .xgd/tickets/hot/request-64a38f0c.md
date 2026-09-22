---
uid: request-64a38f0c
id: REQ-297
type: request
title: An operator console for tenant cost
created_by: EPIC-20
created_at: '2026-09-21T23:44:45.407051+00:00'
updated_at: '2026-09-22T20:12:26.113298+00:00'
completed_at: null
last_field_updated: body
status: free_coded
fields:
  epic_parent: epic-0923bb64
  auto_merge_back: true
  needs_review: false
  priority: medium
  chat_comment: comment-a084f4bb
  commits:
  - working_sha: be385cd90f335147321557585d1142008508691c
    reconcile_sha: null
    main_sha: null
    working_sha_history: []
  - working_sha: ccf726422052fab1e74b5f26ce744094d2575683
    reconcile_sha: null
    main_sha: null
  - working_sha: 3ee35c4e05d9b4562c357317f569f679b193303c
    reconcile_sha: null
    main_sha: null
  version: 0.2.320
  story_points: 8
---


## Why

REQ-292 records what every turn cost; REQ-293 turns those rows into engaged
hours and dollars. Neither is visible to anybody. The cost read-out that
informed EPIC-20 was a script run against a local `.wrangler` SQLite file and
written to a scratch file in a worktree — it cannot exist in production, and no
amount of tidying makes it into one.

Nobody can answer "which tenant is costing us money this month" without a
surface. That question decides pricing, caps and whether delegation worked.

## Two things, and the first has no content of its own

This ticket builds **an operator console** and **its first control**, and they
are deliberately two artefacts rather than one:

1. **The console** — chrome and a registry, and nothing else. It knows how to be
   opened, how to be gated, and how to mount a list of named controls. It knows
   nothing about spend, or about any other subject a later control will have. A
   console with no controls registered renders as an empty console rather than
   as a broken one, and that state is asserted: it is what "no content of its
   own" means in a form the next hand cannot accidentally undo.
2. **Tenant cost** — the first of many controls, in its own module, registered
   with the console. Everything below about lists, expansions and periods is
   this control's, not the console's.

**It is not a tab.** The tab strip is uniformly business-scoped ([[REQ-179]]) —
that uniformity is what lets the business switcher sit above it with no
exception to explain — and this console is about every tenant at once. So it
lives where the other non-business-scoped surface lives: an action in the
shell header's trailing slot, beside the account avatar, opening a dialog. The
account surface's own reasoning applies unchanged, and is the reason a tab is
refused rather than merely not chosen.

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

**The chrome is told, and being untold is not the gate.** `/api/businesses`
already answers facts about the session, and it gains one: whether this session
owns the platform business. The header action renders on it. Every route the
console reads asks `ownsPlatformBusiness` again for itself, because a control
that is merely unrendered is refused to nobody who can type a URL — the same
two-layer shape `canFulfil` and `/api/admin/businesses` already have.

## What this ticket does

### The list

One row per tenant, **ordered by cost over the last 30 days, most expensive
first**. Each row carries the tenant, its settled cost, its engaged hours, and
cost per engaged hour — the three numbers from REQ-293, and no new arithmetic.

A tenant with no measured turns in the window is absent rather than zero, the
same rule the record itself keeps: nothing, never zero.

A tenant whose turns are all **unpriced** has no cost, which is not a cost of
zero, so it cannot take a position in a descending order of money. It sorts
after every tenant that has one, and its unpriced count is what says the blank
is a gap in `prices.json` rather than a free month.

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

## How it is built

### Where the default lives, and why not on the route

`/api/admin/spend`'s contract is REQ-293's and is not superseded here: both ends
of the period are optional and **absent means unbounded**, because the meter is
retained rather than pruned and "everything this tenant has ever spent" is a
question it must still be able to answer. A 30-day default on the route would
quietly change that answer for a caller who asked for everything.

So the default is the **console's**, and it is a declared constant beside the
console's other chrome. The control names the window it wants in the request it
makes, and the operator can change it on the surface — a number of days, which
is the form a `from`/`to` pair takes when a person is asking "how much lately".
A calendar month remains expressible on the wire without the control growing a
date picker.

### The per-day figures are REQ-293's report, once per day

Each day's row is `spendReport` over the turns that BEGAN that day — which is
byte-for-byte the answer `/api/admin/spend?business=…&from=<day>&to=<day+1>`
gives, because that is the same function over the same rows. It is computed
from one range read of the window rather than one read per day, and the
bucketing is by `started_at`, so a turn belongs to the day somebody sat down —
the same rule the period itself keeps, and the only one under which adjacent
days neither double-count a turn nor drop one.

A day with no measured turns is **absent from the list**, not a zero row.

### The league is a fan-out of scoped reads, not one unscoped sweep

`idx_turn_spend_tenant` leads with `tenant_id` and says why: *"every legitimate
read of a meter is scoped to whose meter it is — an unscoped total is not a
question anybody asks and not one this product should make cheap."* This
console's question is still per tenant; what is new is that it asks it of every
tenant and sorts the answers. So it enumerates the tenants with rows in the
window and then reads each one's period through the same `tenantSpendReport`
every other caller uses — which is both what the index is shaped for and what
makes condition 7 true by construction rather than by comparison.

### What a delegated entry costs, and which model it ran on

A stored `attributed` entry carries `{session, role, backend, usage}` and the
worker's session id — it does **not** carry a model, because the framework's
delegation surface does not put one there. The price key is
`(backend, model)`, so the model has to come from somewhere, and the only
truthful source is the document that decides it: `backends.json`, which is what
binds `claude_builder` to `claude-haiku-4-5` and is the same document
`delegation.ts` resolves a worker's backend against.

It is resolved at READ and the caveat is stated rather than hidden: this names
the model the deployment CONFIGURES that backend with today, which is not
necessarily what ran months ago. The turn's own model is stored on the row and
is never inferred this way. Pricing itself is `costMicros` — spend-core's own
function, the same one that settled the turn — so a delegated entry is priced
against its own rates and never at the caller's, which is the whole reason the
price key has two levels.

A tenant that delegated nothing in the window has **no delegated figure**,
absent rather than zero — because this deployment ships delegation off, and
"asked and found none" is a different claim from "there is no such thing here".

### The two routes, and why the expansion is not a third

The league needs a route of its own — `/api/admin/spend/businesses`, taking the
same period and answering one row per tenant ordered by cost. It is a second
path rather than an optional `business` on `/api/admin/spend`, because an
optional parameter would give one route two answers of different shapes decided
by whether a query string was present, and would relax the *business is
required* refusal that keeps an unscoped read from being one omission away. It
is `/businesses` and not `/tenants` ([[REQ-180]] §3): a path is a string a
reader meets, and the operator is the reader most likely to be handed our data
model by accident. It carries the same `ownsPlatformBusiness` gate and the same
404, because a profile of every customer's spending at once is strictly more
than the per-tenant route already declines to hand over.

The expansion asks no new route. `/api/admin/spend` is widened rather than
duplicated: alongside REQ-293's `report` — the principal half, unchanged — it
answers `days` and `delegated` for the same period, in one round trip, because a
decomposition and the report it decomposes must describe the same window. The
two money figures are never summed on the wire, and `delegated` is absent rather
than zeroed for a tenant that handed nothing off.

Both routes share one period parser, so a league window and an expansion opened
out of it cannot come to mean subtly different things. An unreadable `from` or
`to` is a refusal rather than an ignored bound — dropping it would answer a
wider question with no sign that it had, and the reader would take the total for
the period they asked about.

### A tenant's name is a left join

The league's rows come from the meter, and a meter row whose tenant has no
`tenants` record is still money that was spent. Such a row is present with no
name rather than dropped: an inner join would stop reporting spend for the one
reason it must not.

### The control's figures are formatted in one place

Money and the window are rendered by two pure functions the control owns, so
every figure on the surface passes through the same pair. A measured sub-cent
cost reads as `$0.00` and an absent one reads as the nothing mark — which is
what keeps *nothing, never zero* visible on screen rather than merely intended
in the data.

### A control that fails does not close the console

The console mounts each registered control into a section of its own, and a
control that throws while mounting is reported inside that section while the
rest of the console still renders. The console's value is being the one place
several unrelated things are looked at, so one of them failing must not hide the
others.

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
8. The console is chrome and a registry: with no controls registered it renders
   as an empty console, and it names no subject of its own. Tenant cost is one
   registered control and the console does not know what it is about.
9. The console is not a tab, and the tab strip remains uniformly
   business-scoped.

## Not in scope

Caps and enforcement — this console reads. Customer-facing billing or any
surface a tenant sees. Charts: a sorted table answers the question, and the
question is "who is costing us money", not "what is the trend". Exporting.
Anything about a tenant other than its spend.

## Depends on

REQ-292 and REQ-293. There is nothing to render until both are reconciled and a
period of records exists.

## Test plan

- `tests/test_UAT_FC_REQ-297_operator_console.test.ts` (jsdom) — the console's
  own emptiness, the control registry, the header action's presence and absence,
  the rendered list and its order, the expansion's day rows and its two
  labelled figures, and the 30-day default being a parameter that moves.
- `tests/test_UAT_FC_REQ-297_tenant_cost.workers.test.ts` — the two routes
  against a real D1 in workerd, through `route()` with a real admission: the
  gate answering 404, the order, the absent-not-zero rules, the per-day figures
  equalling `tenantSpendReport` for the same day period, and a delegated split
  priced against the worker's own backend.


## The flag has to arrive, not merely be answered

`/api/businesses` reporting `ownsPlatformBusiness` is half of "the chrome is
told"; the other half is that the builder's own reader of that endpoint
**carries the field through to the mount**. It did not. `fetchBusinesses`
rebuilds its result from a named list of fields — `person` and `businesses` —
so a third fact the endpoint answers was dropped on the floor between the wire
and `mountBuilder`. The server said `true`, the gate function was correct, the
shell renders every action it is given, and the operator still had no Console:
every part worked and the value never crossed the seam between them.

So the reader carries the whole session fact, and the absence of the action is
a statement about the session rather than an artefact of which fields a client
function happened to name. Its two refusal paths — a non-OK response and a
caught failure — say `false` explicitly for the same reason the mount defaults
to `false`: a session we could not ask about does not own the platform
business, and the failure mode of a dropped field must stay "no console"
rather than becoming "an offered one".

This is asserted end to end and not at the gate alone. The existing cases call
`consoleActions` directly with the flag already in hand, which is why a reader
that never passed it on was invisible to all of them: the assertion that
matters is that a response carrying `ownsPlatformBusiness: true` reaches
`mountBuilder` as `true`, over the same function the browser calls.


## Superseded in part by [[REQ-298]]

The console's **container** and its **content** are replaced. Its place in the
information architecture is not.

**Condition 9 stands.** The console is not a tab, and the tab strip remains
uniformly business-scoped. The operator accepted that argument; what they
rejected is the overlay it was used to justify. REQ-298 keeps the header action
in the trailing slot and makes it open a **full-surface view** that fills the
shell's content region instead of a modal panel over a scrim.

Withdrawn, and not to reach the capability matrix:

- **The dialog** — *"an action in the shell header's trailing slot, beside the
  account avatar, opening a dialog"*, and `modal.js` as the console's chrome.
- **Conditions 2 and 3** — the league of tenants and the in-place row expansion.
  The list is one row per site across every business; the detail is a pane and
  carries the owning account and a link to the published site as well as spend.
- **Condition 8**, only insofar as it binds the registry to the console. The
  registry survives on the detail pane.

Everything else here stands and REQ-298 reuses it rather than rebuilding it: the
`ownsPlatformBusiness` gate at both layers, `/api/admin/spend`,
`/api/admin/spend/businesses`, the shared period parser, the spend arithmetic
including the principal/delegated split and *nothing, never zero*, and
`/api/businesses` carrying `ownsPlatformBusiness` through to `mountBuilder`.

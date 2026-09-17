---
uid: request-8ef68c26
id: REQ-235
type: request
title: 'The activity log: a raw server-side event store, and session summaries on
  the contact timeline'
created_by: EPIC-10
created_at: '2026-09-13T21:15:53.631580+00:00'
updated_at: '2026-09-17T22:01:56.357025+00:00'
completed_at: null
last_field_updated: depends_on
status: draft
fields:
  priority: medium
  epic_parent: epic-0aefcf91
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-08a450b2
  depends_on:
  - request-042df82b
---

# The activity log

Every server-side event is recorded in a store built for the volume, and a contact's
timeline gains one readable row per session summarising what that person actually did —
when they were here, on which surfaces, and for how long.

## 0. Where this sits — revised 2026-09-17 against lf:[[EPIC-1]]

This ticket was drafted 2026-09-13, one day after framework [[EPIC-1]] and before it had
been read. [[EPIC-1]] is now at revision 8 and its JS peer is built and installed. §1–§3
below are revised accordingly; §4–§6 stand as drafted.

**The contact activity log is not a view of the system log and not a tier of it.** It is
one of the log's *aggregation outputs*. [[EPIC-1]] says this twice, on two grounds:

- §7 puts business events outside the logging lanes entirely — *"`contact_events`,
  `site_changes`, `ticket_changes`, `ledger.ts` … It is not a logging problem, so it
  stays out of scope. **It is a metrics source.**"*
- §42 makes it structural rather than policy — *"`actor` never leaves the raw tier …
  member behaviour lives in `contact_events` — which means **no permanent tier carries a
  person, as a structural property rather than a policy one**."*

And §34's definition of aggregation names this ticket's output in so many words: *"a
different kind of thing — a number, a chart, **a `contact_events` row**."*

**They cannot be merged, and the reasons are properties of the data.** The log is pruned
by `(kind, level)` and rolled up lossily and irreversibly (§34); the spine is permanent
and refuses `UPDATE` at the database. The log's grain is one record per invocation; the
spine's is one row per milestone. The log is read by an operator and the AI; the spine is
read by the *customer*, about a person. And erasure ([[DOC-37]]) must reach the spine —
which is why `DELETE` is deliberately left reachable there — while the log's answer to a
person's data is expiry. A design that put a named, erasable person into a pipeline whose
permanent tiers are aggregates would be unable to honour either half.

**They meet at one seam, and [[EPIC-1]] §41.5 already specifies it in full:**

> *Member behaviour. Aggregation into `contact_events` — REQ-235's session inference. Its
> only demand on this design is that raw records carry `actor`/`contact_id` and a
> `trace_id` for session linkage, and that the raw window outlives the inference
> schedule.*

Three obligations, and this ticket states them as its interface rather than re-deriving
anything:

1. Raw records carry `actor` and `trace_id`. Both are already in the package's exported
   `DIMENSIONS`.
2. The raw `info` horizon (30d) must exceed the inference schedule. With §3's cron the gap
   is hours, so this holds with wide margin.
3. **The durable artifact is the `contact_events` row, not the raw rows.** Which is this
   ticket's answer to [[EPIC-1]]'s open Q14.1 — for this reader the diagnostic horizon is
   *hours*, not days or months, and that is materially cheaper than R2-for-months.

**The other reader is [[EPIC-8]], and it is not this one.** [[EPIC-8]]'s site metrics are
anonymous traffic — visitors, pages, sources, a chart about a site. This is identified
behaviour — a row about a person. They share the raw layer and they do not share a
surface.

## 1. What is true today

Verified 2026-09-13, re-verified and corrected 2026-09-17.

**Nothing records what a contact does.** `contact_events` holds nine kinds
(`builder/contact-events.js`) and all but `form.submitted`, `member.signed_up` and
`email.received` are something the business did *to* a contact. A business reading a
history sees every message it sent and cannot see whether the person ever came back.

**There is no raw event store.** Six modules already write structured JSON into the
invocation log — `identity.ts`, `sign-in.ts`, `email-webhook.ts`, `lead.ts`, `router.ts`
(×3), `index.ts`, about eleven call sites — but those expire on Cloudflare's schedule and
cannot be joined to a contact row.

**Observability is configured in one Worker, not two.** `apps/control-app/wrangler.toml`
has `[observability]` at `head_sampling_rate = 1`; `apps/public-site/wrangler.toml` has no
`[observability]` block at all. So the Worker that actually serves visitors retains no
per-invocation logs, and has no interim fallback while this is built. (The earlier claim
that both ran at rate 1 was wrong, and [[EPIC-11]] inherits the same error.)

**There is a periodic job, and it predates this ticket.**
`apps/control-app/wrangler.toml:87` has `crons = ["17 4 * * *"]`, repeated at `:436` for
production, and `index.ts:562` exports `scheduled` — the session purge, [[REQ-231]],
landed 2026-09-12. Anything that has to happen on a timer is therefore **a new caller of
existing machinery**, not new machinery. (The earlier claim that neither Worker had one
was wrong, and it was the main argument for §3's lazy alternative.)

**There is no surface signal.** The builder makes requests as an operator works, but a
quiet tab makes none. The one accident is the Contacts pane, which polls every two seconds
while open (`CONTACT_CHANGE_POLL_MS = 2000`) — a heartbeat for exactly one pane, and not a
statement of which tab anyone is on.

## 2. The raw layer

**Every server-side event, whether or not a contact is behind it.** Most requests are
anonymous, and those are exactly the ones a `contact_id NOT NULL` column cannot hold. So
this is not `contact_events` and must not be made into it.

**The record is [[EPIC-1]]'s and is not invented here.** `@lagrangefoundry/logging` is
built and already resolvable in the shared store at `../node_modules/@lagrangefoundry/logging`;
nothing in 1c imports it yet, so this ticket is its first consumer. It exports `KINDS`,
`DIMENSIONS`, `RECORD_FIELDS` and `MEASURES` as data precisely so a store can be built
against the dimension set without re-deriving it. [[EPIC-1]] §15's resolution is adopted
verbatim: *"REQ-235's raw layer IS this epic's sink. EPIC-1 owns the record; REQ-235 owns
the store and its retention; EPIC-8 and REQ-235 own their own readers."* Inventing a row
shape here is what [[BUG-87]] already declined to do.

**The store is D1, and Analytics Engine is rejected for three verified reasons**
([[EPIC-1]] §8.3, §16):

- **AE is adaptively sampled at volume.** Session boundaries inferred from a sampled
  stream are a guess — and §4 below refuses to *"present a floor as a fact"*, which
  sampling does one layer down. This is the disqualifying one for this reader
  specifically.
- **AE's retention is three months and is not configurable**, so it cannot hold the
  warn/error band at 180 days.
- **Reads cost 4× writes** ($1.00/M against $0.25/M), and this layer's whole purpose is
  being read on a schedule.

AE remains available for [[EPIC-8]]'s live counters, which is the reader it suits. R2 is
the archive if and when the rollup ladder lands. The rejection and its reasons are
recorded in the code.

**Retention is a band, not a scalar** ([[EPIC-1]] §40): `horizon(kind, level)` — debug 7d,
info 30d, warn/error 180d. This is one policy table and one extra predicate in the
`DELETE`; the pruned-through floor below is unchanged by it.

**It carries a retention limit from the first commit.** A log that accumulates without
bound is a cost that arrives silently and later. The ticket store's change log already
solves the same problem with a pruned-through floor (`ticket_change_floor`) so a consumer
whose cursor predates the window is told `reset` rather than served a partial history it
cannot distinguish from a complete one.

**What the rows carry is a redaction question, and it has an answer already in the repo.**
A store of every server-side request holds URLs, headers and IPs. [[EPIC-1]] §2 warns
specifically against *"tenant PII sitting in a short-retention platform log"*, §10 requires
redaction before records reach the model, and the package implements it (B5: sensitive key
names replaced at any depth, case- and separator-insensitively). `redact.ts` exists in 1c
for the credential register ([[REQ-146]] AC4). No secret, credential or bearer token
reaches this store, and that is enforced by the sink rather than by call sites.

**Synthetic traffic writes raw rows, and [[DOC-54]] does not yet name this store.** §2.4
covers four tables plus message tickets — written before a raw log existed. A [[EPIC-15]]
probe produces invocations like any other, so without a position here [[EPIC-8]]'s traffic
aggregates count synthetic hits as visitors: [[DOC-54]] §3's named failure, *"the number is
wrong in the flattering direction"*, in the one store the contract was never applied to.
The raw record therefore carries the mark, and every customer-visible aggregate over it
excludes it by default.

## 3. The session model

**A session is an inferred interval, not a thing anybody declares.** It opens on the first
event from an identified actor and closes after an inactivity timeout. Both the timeout and
the rule are stated once, in one module, because a second answer to "is this the same
session" is a second answer to every number on the timeline.

**Closing is on a cron, and it is a new caller of the existing one.** The argument for
closing lazily on read was that a `scheduled` handler would be the first periodic job in
the system; §1 shows it would not be. What remains is a scheduling question rather than an
architectural one: **`17 4 * * *` is daily, so a session ending at 10am is not summarised
until the following morning.** A timeline that is eighteen hours behind is not the feature
that was asked for, so this needs a second, sub-daily expression rather than a new
mechanism. Which expression, and the inactivity timeout it implies, is recorded with the
code.

## 4. The rollup onto the timeline

**One row per session, written once, at close.** `contact_events` forbids `UPDATE` at the
database — an event edited in place leaves a timeline that reads perfectly and is untrue —
so a summary is never opened live and revised. It is written after the fact, which is what
`occurred_at` and `recorded_at` being separate columns is for: the session happened then,
we learned of it now.

**Its `detail` carries the breakdown**: the surfaces visited and the interval on each, in
the order they happened, so a reader gets `Site tab 13 min, Marketing tab 23 min` from one
row rather than from four hundred.

**Elapsed time is derived on read and never stored as a measurement.** A closed laptop
sends nothing, so every interval is a lower bound. Storing a `duration_ms` would present a
floor as a fact.

**A new kind, and no migration.** `kind` is an unconstrained dotted string precisely so
this costs a constant and a label in `builder/contact-events.js`.

**No derived judgement about a person goes in `detail`** ([[CHAT-53]]): no churn score, no
"struggling" flag, no engagement grade. The row records what happened, and a conclusion
about somebody is not a fact about them.

### Open, and blocking AC-5

[[CHAT-53]] draws a line this section is on the wrong side of — *"did they get stuck is
about your product and Alice should see it; when were they there is about Bob and mostly
isn't Alice's business"* — and argues that *"we hold it but hide it isn't a privacy
posture, it's obscurity with the same legal surface."* Per-surface minutes is the duration
axis, and it is [[EPIC-11]]'s originating quote verbatim. **[[CHAT-53]] therefore
contradicts the original ask, and which wins is the operator's call, not this ticket's.**
Until it is answered, §4's third paragraph and AC-5 are provisional.

The harder case, worth deciding with it: `contact_events` is a per-business surface, so
the same rows put a **solo trader** in Alice's chair looking at a member they may meet
socially. The schema is symmetric, so whatever rule is chosen has to hold there.

## 5. The surface signal

The one client-side piece, and the smallest thing that closes the gap: the builder says
which surface it is on. Without it, "which tab, for how long" is not inferable — a tab that
makes no requests is indistinguishable from a tab nobody opened.

It is a signal and not a beacon protocol: no heartbeats, no timers, no duration computed in
the browser. The server already timestamps what it receives.

A client's own timestamp and tenant claim are never trusted into a record: the signal is
`kind=client`, posted to an ingress route and **re-stamped server-side** ([[EPIC-1]] §41.1).

## 6. What this deliberately does not do

**It does not tie anonymous browsing to a known contact.** Token-bearing pages and
signed-in surfaces identify themselves for free. Recognising an unidentified visitor on a
published site as somebody we know needs a cookie or a pixel, is materially larger, and is
where the privacy cost stops being incidental. Out of scope, and a later ticket if it is
ever wanted.

**It does not fold the timeline.** Rendering a session row readably, and collapsing runs of
low-value kinds, is presentation and is [[EPIC-11]] scope item 5.

**It does not build the Tail Worker access log.** [[EPIC-1]] §41.1 gets `kind=access` from
a Tail Worker at zero call-site cost, including invocations that threw — richer than
anything this ticket needs, and [[EPIC-8]]'s reader rather than this one's. Session
inference needs only identified-actor `kind=app` records from call sites.

**It does not build the rollup ladder.** Blocked on [[EPIC-1]] §43 Q1, and this ticket's
raw tier is complete without it.

**It does not convert the existing 92 `console.*` call sites.** Wiring the package's
server-side resolution and a per-request `child({ business, trace_id, actor })` at the
Worker entry is in scope, because a record cannot be emitted without it; rewriting every
existing call site is not.

## 7. Dependencies

**[[REQ-267]] — inbound mail, end to end — lands two things this ticket needs**, and it is
sequenced first for that reason:

1. **Migration `0013`** ([[DOC-54]] §2.4): `synthetic` and the run id on `users`,
   `contact_events`, `user_acceptances` and `asset_grants`, derived through `recordEvent`'s
   existing `SELECT … FROM users` rather than supplied. [[EPIC-11]] is explicit that this
   must land **before** anything reads the spine — a column added now is an additive
   migration nobody notices, and the same column added after the timeline, the rollups and
   the detail pane exist is the retrofit [[DOC-54]] §0 exists to prevent. [[REQ-267]] keeps
   it as its own migration, separate from its other tables, so this dependency stays narrow.
2. **Paging the contact timeline.** `eventsOf` caps at `TIMELINE_LIMIT = 100` with no
   cursor, on the stated assumption *"data nobody has enough of"* — which [[REQ-267]]
   falsifies by putting every message in both directions on the spine. Session summaries
   land on the same timeline, so this ticket inherits the fix rather than needing its own.

**The rollup is the read [[DOC-54]] warns will be missed**, and it is this ticket's alone:
a rollup that *counts* events is not obviously a read, and a synthetic event inflates it
silently.

## 8. Acceptance criteria

1. A server-side event is written to the raw store, and is readable back, for a request
   with no contact behind it at all.
2. The raw store enforces a retention limit, and a read whose window has been pruned is
   told so rather than served a partial history.
3. Retention is a function of `(kind, level)` and not one number: a `debug` record and a
   `warn` record written at the same instant are pruned on different days.
4. The raw record is the package's — the fields written are `RECORD_FIELDS` as exported by
   `@lagrangefoundry/logging`, and a dimension added there needs no edit here to be
   carried.
5. A value at a sensitive key name does not reach the store, at any nesting depth, and
   whether it was spelled `X-Api-Key`, `api_key` or `apiKey`.
6. Two events from one actor inside the timeout are one session; two separated by more than
   the timeout are two. Asserted at both edges of the boundary.
7. Closing a session writes exactly one `contact_events` row, whose `occurred_at` is when
   the session began and whose `recorded_at` is when the summary was written. A test
   asserts the two differ.
8. The summary's `detail` carries per-surface intervals, in order, and a reader reconstructs
   `Site tab 13 min, Marketing tab 23 min` from that one row. *(Provisional — see §4's open
   question.)*
9. No second row is ever written for a closed session, and no `UPDATE` is attempted against
   one. The database trigger is the witness.
10. The builder's surface signal reaches the raw store, and a session spanning two tabs is
    summarised as two intervals rather than one. A client-supplied timestamp or tenant claim
    is not what the stored record carries.
11. A synthetic invocation's raw records are marked, and a customer-visible aggregate over
    the raw store excludes them without the caller asking.
12. Nothing in this ticket identifies an anonymous visitor. Asserted by there being no code
    path from a request without a token or a session to a `contact_id`.
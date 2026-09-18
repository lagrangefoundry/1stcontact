---
uid: request-8ef68c26
id: REQ-235
type: request
title: 'The activity log: a raw server-side event store, and session summaries on
  the contact timeline'
created_by: EPIC-10
created_at: '2026-09-13T21:15:53.631580+00:00'
updated_at: '2026-09-18T02:24:38.482536+00:00'
completed_at: null
last_field_updated: story_points
status: free_coded
fields:
  priority: medium
  epic_parent: epic-0aefcf91
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-08a450b2
  depends_on:
  - request-042df82b
  commits:
  - working_sha: 36f33e2b47c64823a85965c57e3212526ff31d14
    reconcile_sha: null
    main_sha: null
  - working_sha: 64a47dd620b3d44a212b38bc91f558078f1fd722
    reconcile_sha: null
    main_sha: null
  - working_sha: 8cc50f29d38109f7d4563b248c9dec7469306cab
    reconcile_sha: null
    main_sha: null
  version: 0.2.253
  story_points: 13
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
excludes it by default. The mark rides the request rather than any call site ([[DOC-54]]
R2's rule is *no call site supplies the flag*), so a probe's records are marked without a
single `logger.info(...)` growing a parameter — and the reader reaches the exclusion
through `Scope`, which is the field every other read in this system already takes.

**Two sinks, and the console one is not a fallback.** Workers Logs reads severity off the
console channel and it is the channel the deployment already has enabled, so that record is
what an operator reads while the store is being built and what they still read when the
store is down. The package's `fanout` guarantees a sink that throws neither reaches the
caller nor stops the one after it, which is what "logging cannot fail a request" requires
of two sinks rather than one. A store that is unavailable therefore costs the invocation
nothing at all.

**Buffered per invocation, with a ceiling.** A sink's `write` is synchronous by contract
and a D1 write is not, so records are held and drained in one batch through
`ctx.waitUntil`. The buffer has a ceiling; what is dropped is the tail, and the drop is
itself recorded as a `warn`, because a silently truncated log is worse than a short one.

**Two readers ship with it, and neither is a surface.** `readRecords` pages forward on
`seq` and tells a caller whose cursor predates the floor to `reset`; `countEvents` is the
aggregate [[DOC-54]] §3 names as the one that gets forgotten, written now so that it cannot
be. Neither is wired to a screen — [[EPIC-8]] owns that — but a store with no reader is a
store whose exclusion rule has never been exercised.

**It is wired into `control-app` and not into `public-site`.** That is where identity,
scope, the database and the builder are, so every claim here is provable there; the second
Worker has its own bindings and its own (absent) observability and is deliberately left for
whoever gives it a store. Marked lead submissions already traverse `control-app` through
the service binding, so the gutter claim is unaffected.

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
mechanism.

**The expression is `*/10 * * * *` and the timeout is thirty minutes.** Both are declared
once — the cron in `wrangler.toml` (both blocks) and as `ACTIVITY_CRON` in `index.ts`,
which the `scheduled` handler branches on; the timeout as `SESSION_TIMEOUT_MS` in
`activity.ts`. A UAT pins the cron to the constant, because a literal that had drifted from
the deployment would mean either three table sweeps every ten minutes or a timeline that
never updates, and neither fails anything visibly.

Half an hour rather than something tighter because [[EPIC-11]]'s own originating example
is the measure of it: *"16:23-17:28 … Site tab (13 mins) Marketing tab (23 mins)"* is one
person on one tab through twenty-three minutes of silence, and any timeout below that
reports it as two visits. What it costs is lag — a session appears on the timeline between
thirty and forty minutes after it ends — which is the whole distance between a timeline
worth acting on and the eighteen hours a daily sweep would have given.

**The closer runs on every tick and the daily sweeps do not.** The handler tests for the
frequent expression rather than for the daily one, so an invocation carrying neither does
the *more* complete thing: a sweep that ran needlessly costs a scan, and one that silently
stopped looks exactly like a system with no garbage.

## 4. The rollup onto the timeline

**One row per session, written once, at close.** `contact_events` forbids `UPDATE` at the
database — an event edited in place leaves a timeline that reads perfectly and is untrue —
so a summary is never opened live and revised. It is written after the fact, which is what
`occurred_at` and `recorded_at` being separate columns is for: the session happened then,
we learned of it now.

**Its `detail` carries the breakdown**: the surfaces visited and the interval on each, in
the order they happened, so a reader gets `Site tab 13 min, Marketing tab 23 min` from one
row rather than from four hundred. `detail` holds `endedAt`, `events` and `surfaces`, and
nothing else.

**A stretch runs until the next one begins**, not until its own last signal — which is the
moment it *opened*. This is the whole reason §5's signal is posted on a change rather than
on a timer: the only thing that says how long somebody was on a tab is when they left it.
Without the rule, thirteen minutes reads as zero.

**A run of one surface is one stretch, and returning to it is a second.** *Site, Library,
Site* is three, because collapsing by surface would report a person who kept switching back
as having sat on two tabs.

**Surface attribution comes from `kind=client` records only.** A server route is a URL an
API call happened to use, so folding those in would report `/api/sites` as a surface
somebody sat on. A session with no client records is summarised honestly — its span, and no
breakdown — which is true where a guess drawn from server routes would not be.

**Elapsed time is derived on read and never stored as a measurement.** A closed laptop
sends nothing, so every interval is a lower bound. Storing a `duration_ms` would present a
floor as a fact.

**A new kind, and no migration.** `kind` is an unconstrained dotted string precisely so
this costs a constant and a label in `builder/contact-events.js`.

**No derived judgement about a person goes in `detail`** ([[CHAT-53]]): no churn score, no
"struggling" flag, no engagement grade. The row records what happened, and a conclusion
about somebody is not a fact about them.

### The duration question, and how it was resolved

[[CHAT-53]] draws a line this section was on the wrong side of — *"did they get stuck is
about your product and Alice should see it; when were they there is about Bob and mostly
isn't Alice's business"* — and argues that *"we hold it but hide it isn't a privacy
posture, it's obscurity with the same legal surface."* Per-surface minutes is the duration
axis, and it is [[EPIC-11]]'s originating quote verbatim.

**Built as originally asked, and the reasoning is CHAT-53's own.** Its objection to holding
a fact and hiding it is exactly right, and it cuts both ways: coarsening the *presentation*
while the stamps sit in the row buys nothing legally and costs the feature its point. So
the choice is the whole thing or none of it, and none of it deletes the row's only reason
to exist — a business reading a history can see every message it sent and still cannot see
whether the person came back.

**What the row does NOT carry is the part CHAT-53 actually closes.** No conclusion about
the person: no churn score, no "struggling" flag, no engagement grade. That is the line
between a record of what happened and a judgement about somebody, and it is the one worth
defending.

**The remaining exposure is bounded by three properties already in the design.** The
summary is on `contact_events`, which erasure reaches ([[DOC-37]]) — `DELETE` is
deliberately left reachable there. The raw rows behind it expire on a horizon measured in
days. And the person can subject-access the row whichever way this went.

**The solo-trader case is where this is hardest, and the schema is symmetric so the answer
has to hold there.** It does: an operator is a contact of 1st Contact and not of the
business they are working in — *"the site owner is not a contact of her own site"* — so the
summary lands on the timeline the person actually belongs to. A solo trader reading their
own business's contacts does not find their own session rows there.

**This remains reversible in one edit** — stop writing `surfaces` into `detail` — and the
operator should say so if CHAT-53's reading is meant to win outright. AC-8 is no longer
provisional; it is built.

## 5. The surface signal

The one client-side piece, and the smallest thing that closes the gap: the builder says
which surface it is on. Without it, "which tab, for how long" is not inferable — a tab that
makes no requests is indistinguishable from a tab nobody opened.

It is a signal and not a beacon protocol: no heartbeats, no timers, no duration computed in
the browser. The server already timestamps what it receives.

A client's own timestamp and tenant claim are never trusted into a record: the signal is
`kind=client`, posted to an ingress route and **re-stamped server-side** ([[EPIC-1]] §41.1).
The route is `POST /api/activity/surface`; a body naming a timestamp, a business or an
actor is simply ignored rather than rejected, because there is then no branch to get wrong.
A body naming no surface is refused, and the route answers `204` — nothing is returned,
nothing is read back, and a body would invite a client to depend on one. The surface name
is bounded in length, because it lands in a group-by key.

**Posted on a change, and once on the surface the session opens with.** The shell activates
its first tab before wiring its change hook, deliberately — so the tab somebody is looking
at when the builder opens is the one surface that would otherwise never be recorded. It is
the tab *id* and not its label: a label is provisional chrome and is declared in one place
so it can be changed in one line, and a dimension built from it would silently split one
surface into two the day somebody did.

**It fails silently.** A telemetry signal that could interrupt an operator changing tabs
would be worse than no signal: there is nothing the person could do about it, and a session
lapse is already announced by the next call that needs an answer. It goes through the
builder client's one `fetch`, which is what keeps *the client notices a 401* mechanical
rather than a convention.

## 6. What this deliberately does not do

**It does not tie anonymous browsing to a known contact.** Token-bearing pages and
signed-in surfaces identify themselves for free. Recognising an unidentified visitor on a
published site as somebody we know needs a cookie or a pixel, is materially larger, and is
where the privacy cost stops being incidental. Out of scope, and a later ticket if it is
ever wanted.

**It does not fold the timeline.** Collapsing runs of low-value kinds is presentation and
is [[EPIC-11]] scope item 5. What it does do is render the one row it adds: a summary whose
breakdown were not drawn would have thrown away the thing it was written for. The
arithmetic is on read, in `builder/contact-events.js`, beside the constant — minutes
rounded, and a stretch under one reading `<1 min` rather than `0 min`, because a precision
the signal does not have is a lie told in a smaller font. The branch on kind lives in
`describeEvent` so the History section keeps rendering a kind it has never seen.

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

That wiring costs three things and they are named so reconciliation can find them. The
build emits a re-export shim for `@lagrangefoundry/logging` under `src/generated/`, exactly
as every other shared component already has one — a bare specifier resolves by walking up
from the importing file, which finds the out-of-repo store from the main checkout and
nothing from a linked worktree. The Worker's `fetch` becomes a wrapper around the handler,
so that one record per invocation is written whichever way the request leaves — the 403s,
the terms interstitial and the outer `catch` included, which are the exits somebody adding
a line per return would forget. And the business and the actor are *bound* onto the log
where they are resolved rather than passed at call sites, which is the whole of REQ-157 B2.

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
   `Site tab 13 min, Marketing tab 23 min` from that one row. The intervals are stamps and
   never a stored duration, and the minutes are computed on read — including in the timeline
   row the builder draws.
9. No second row is ever written for a closed session, and no `UPDATE` is attempted against
   one. The database trigger is the witness.
10. The builder's surface signal reaches the raw store, and a session spanning two tabs is
    summarised as two intervals rather than one. A client-supplied timestamp or tenant claim
    is not what the stored record carries.
11. A synthetic invocation's raw records are marked, and a customer-visible aggregate over
    the raw store excludes them without the caller asking.
12. Nothing in this ticket identifies an anonymous visitor. Asserted by there being no code
    path from a request without a token or a session to a `contact_id`.
13. Surface attribution comes from the browser's own signal and never from a server route,
    and a stretch on a surface runs until the next one begins. A session with no client
    signal reports its span and no breakdown.
14. The closer's schedule is declared once and the handler agrees with it: the frequent
    expression is in both `wrangler.toml` blocks and is the constant `index.ts` branches on,
    and the daily sweeps do not move onto it.
15. The package reaches the Worker through a generated re-export shim, as every other shared
    component does, and the exported dimension set is named in the shim's export list so an
    upstream change to it fails the typecheck rather than silently dropping a column.
16. The raw store has a reader: a page with a cursor, and an aggregate. Neither is wired to
    a screen, and both exclude manufactured traffic without the caller asking.


## 9. What the implementation added, and why

Recorded here so reconciliation finds it in the spec rather than in the diff. None
of it is a second design — each is the mechanical consequence of a rule above that
had to be answered somewhere.

**The floor is the last summary the actor already has, read off the spine.**
AC-9's *"no second row is ever written for a closed session"* needs a boundary,
and the obvious one — a cursor table beside the log — is a second place the truth
can live. The spine is permanent and refuses `UPDATE`, so the closer asks it
directly: the most recent `session.recorded` row for this actor, and its
`detail.endedAt`. That makes the no-duplicate property a consequence of where the
floor comes from rather than a rule a second table has to stay consistent with.
It is read off `detail.endedAt` and not `occurred_at`, because `occurred_at` is
when the session *began* — using it would re-read the session just summarised.

**The trailing session is left open.** A stretch whose last record is inside the
timeout may still be running. A row written for it would be a summary of half an
afternoon that can never be corrected, because the spine forbids `UPDATE` — so
the closer skips it and picks it up on a later tick.

**The closer's scan is bounded, and the bound is on cost and not on
correctness.** A lookback (7 days), an actor cap and a per-actor record cap exist
so one missed cron run — or a deployment that was down for a day — does not turn
the next tick into a full-table walk. The lookback sits comfortably inside the
`info` horizon (30 days), which is the constraint [[EPIC-1]] §41.5 actually
imposes on this seam: *"the raw window outlives the inference schedule"*.

**The summary carries the mark, and it is a floor there too** ([[DOC-54]]). A
session made entirely of manufactured records is a manufactured session. The
insert takes `MAX` of that and the contact's own mark, so a real contact's
session can be marked by its traffic and a synthetic contact's session never
reads as real.

**The signal's route is probed like every other route the origin declares.** The
builder-origin criterion checks both directions — declared-but-unprobed is the
hole it was written to close — so a new route is a new probe or it is a failing
build. It is probed in its refusal shape: the success answer is `204` by design,
and the probe's success branch pins `200`.
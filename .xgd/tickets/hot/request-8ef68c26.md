---
uid: request-8ef68c26
id: REQ-235
type: request
title: 'The activity log: a raw server-side event store, and session summaries on
  the contact timeline'
created_by: EPIC-10
created_at: '2026-09-13T21:15:53.631580+00:00'
updated_at: '2026-09-13T21:15:53.631580+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  priority: medium
  epic_parent: epic-0aefcf91
  auto_merge_back: true
  needs_review: false
---

# The activity log

Every server-side event is recorded in a store built for the volume, and a contact's
timeline gains one readable row per session summarising what that person actually did —
when they were here, on which surfaces, and for how long.

## 1. What is true today

Verified 2026-09-13 against the code.

**Nothing records what a contact does.** `contact_events` holds nine kinds
(`builder/contact-events.js`) and all but `form.submitted` and `member.signed_up` are
something the business did *to* a contact. A business reading a history sees every message
it sent and cannot see whether the person ever came back.

**There is no raw event store.** `observability` runs at `head_sampling_rate = 1` in both
Workers and four modules already write structured JSON into the invocation log, but those
expire on Cloudflare's schedule and cannot be joined to a contact row.

**There is no periodic job.** Neither `wrangler.toml` declares a `[triggers]` block and
neither Worker exports `scheduled`. Anything that has to happen on a timer is new
machinery, not a new caller of existing machinery.

**There is no surface signal.** The builder makes requests as an operator works, but a
quiet tab makes none. The one accident is the Contacts pane, which polls every two seconds
while open (`CONTACT_CHANGE_POLL_MS = 2000`) — a heartbeat for exactly one pane, and not a
statement of which tab anyone is on.

## 2. The raw layer

**Every server-side event, whether or not a contact is behind it.** Most requests are
anonymous, and those are exactly the ones a `contact_id NOT NULL` column cannot hold. So
this is not `contact_events` and must not be made into it.

**The store is decided in this ticket.** Workers Analytics Engine is built for the
write-heavy high-cardinality shape this is, keeps the rows out of D1's budget, and has a
SQL read API; a D1 table is the alternative and wins if joining to contact rows turns out
to matter more than write volume. Whichever is chosen, the reason is recorded in the code
and the other is named as what was rejected.

**It carries a retention limit from the first commit.** A log that accumulates without
bound is a cost that arrives silently and later. The ticket store's change log already
solves the same problem with a pruned-through floor (`ticket_change_floor`) so a consumer
whose cursor predates the window is told `reset` rather than served a partial history it
cannot distinguish from a complete one.

## 3. The session model

**A session is an inferred interval, not a thing anybody declares.** It opens on the first
event from an identified actor and closes after an inactivity timeout. Both the timeout and
the rule are stated once, in one module, because a second answer to "is this the same
session" is a second answer to every number on the timeline.

**Closing is either a cron or a lazy read, and this ticket picks one.** A `scheduled`
handler is the first periodic job in the system and makes summaries appear on their own;
closing lazily on next read avoids the new machinery at the cost of summaries that do not
exist until somebody looks. Record which, and why.

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

## 5. The surface signal

The one client-side piece, and the smallest thing that closes the gap: the builder says
which surface it is on. Without it, "which tab, for how long" is not inferable — a tab that
makes no requests is indistinguishable from a tab nobody opened.

It is a signal and not a beacon protocol: no heartbeats, no timers, no duration computed in
the browser. The server already timestamps what it receives.

## 6. What this deliberately does not do

**It does not tie anonymous browsing to a known contact.** Token-bearing pages and
signed-in surfaces identify themselves for free. Recognising an unidentified visitor on a
published site as somebody we know needs a cookie or a pixel, is materially larger, and is
where the privacy cost stops being incidental. Out of scope, and a later ticket if it is
ever wanted.

**It does not fold the timeline.** Rendering a session row readably, and collapsing runs of
low-value kinds, is presentation and is its own ticket.

## 7. Acceptance criteria

1. A server-side event is written to the raw store, and is readable back, for a request
   with no contact behind it at all.
2. The raw store enforces a retention limit, and a read whose window has been pruned is
   told so rather than served a partial history.
3. Two events from one actor inside the timeout are one session; two separated by more than
   the timeout are two. Asserted at both edges of the boundary.
4. Closing a session writes exactly one `contact_events` row, whose `occurred_at` is when
   the session began and whose `recorded_at` is when the summary was written. A test
   asserts the two differ.
5. The summary's `detail` carries per-surface intervals, in order, and a reader reconstructs
   `Site tab 13 min, Marketing tab 23 min` from that one row.
6. No second row is ever written for a closed session, and no `UPDATE` is attempted against
   one. The database trigger is the witness.
7. The builder's surface signal reaches the raw store, and a session spanning two tabs is
   summarised as two intervals rather than one.
8. Nothing in this ticket identifies an anonymous visitor. Asserted by there being no code
   path from a request without a token or a session to a `contact_id`.

---
uid: epic-0aefcf91
id: EPIC-11
type: epic
title: 'Contact activity log: every server-side event, and the session rollup on the
  timeline'
created_by: EPIC-10
created_at: '2026-09-13T21:15:16.835381+00:00'
updated_at: '2026-09-22T01:18:39.951622+00:00'
completed_at: null
last_field_updated: status
status: underway
fields:
  priority: medium
  epic_children:
  - request-8ef68c26
---

## What the client asked for

> "1. I want a log that captures every serverside (and possibly some client side) events 2. I want the contact log to capture a high level abstraction of this e.g.: 5/32/2025 16:23-17:28 user session Site tab (13mins) Marketing tab (23 mins) — When, what is the user doing? How are they spending their time?"

Raised during the EPIC-10 email-capture discussion on 2026-09-13 and split out here, because it is plainly larger than that epic and because the first thing EPIC-10 records about a contact's own behaviour — a whitepaper page opened, a paper downloaded — is the first instance of the general pattern.

## The principle

**What a contact does is a fact about the relationship, and the timeline is where facts about the relationship live.**

The spine today records what we did _to_ a contact: added, invited, mailed, delivered, bounced. It records almost nothing about what the contact _did_. That asymmetry is the gap. A business reading a contact's history can see every message it sent and cannot see whether the person ever came back.

## What exists today

**The spine, and nine kinds on it.** `contact_events` ([[REQ-195]], [[DOC-44]] §4.1) — immutable with an `ABORT` trigger on `UPDATE`, `kind` an unconstrained dotted string so the set can grow without a migration, indexed by `(business_id, contact_id, occurred_at)` and `(business_id, kind, occurred_at)`. Every kind on it is a milestone, and all but `form.submitted` and `member.signed_up` are something the business did rather than something the contact did.

**Half a raw layer, by accident.** `observability` runs at `head_sampling_rate = 1` in both Workers, so every invocation is logged, and `lead.ts`, `identity.ts`, `router.ts` and `email-webhook.ts` already write structured JSON into it — `lead.ts` says why: _"so these can be queried out of the invocation logs rather than grepped out of prose."_ What is missing is that those expire on Cloudflare's schedule and cannot be joined to a contact.

**Nothing else.** No `scheduled` handler in either Worker. No Analytics Engine binding. No retention policy on `contact_events`. No client-side signal of which surface anyone is on — with one accident: the Contacts pane polls every two seconds while it is open (`CONTACT_CHANGE_POLL_MS`), which is a heartbeat for exactly one pane.

## The shape: two layers, and they must stay two

**The raw layer** is every server-side event. High volume, includes unauthenticated traffic with no contact behind it at all, includes system and operator activity, and needs a retention limit.

It cannot be `contact_events`. That table's `contact_id` is `NOT NULL` under a foreign key, so it structurally cannot hold a request by someone we have not identified — which is most of them. The raw layer is a separate store.

**The contact layer** gets the rollup: one row per session, not per request. `Site tab 13 min, Marketing tab 23 min` is one event. That is what keeps the timeline readable and keeps the spine what it already is — milestones, not noise.

## The constraint that shapes it

**A session summary cannot be amended, so it is written once, at close.**`contact_events` forbids `UPDATE` at the database, deliberately: an event edited in place leaves a timeline that reads perfectly and is untrue. A session is not complete until it ends, so its summary is written after the fact rather than opened live and revised.

The schema already anticipates exactly this. `occurred_at` and `recorded_at` are separate columns and the comment justifies the pair on this case: the event happened then, we learned of it now.

**Which means something has to decide a session has closed**, on an inactivity timeout. That is either the first periodic job in this system — there is no `scheduled` handler anywhere today — or it is done lazily on next read, which avoids the cron at the cost of summaries that do not exist until somebody looks.

## Boundaries

**Against [[EPIC-8]] (Monitoring tab).** That epic's site metrics are _anonymous traffic_: visitors, pages, sources, for a business reading its own website's performance. This epic is _identified behaviour_: what a known contact did, on their timeline. Adjacent, and not the same — one is a chart about a site, the other is a row about a person. They may well share the raw layer; they do not share a surface.

**Against [[EPIC-10]] (Email capture).** EPIC-10 records `page.accessed` and `asset.downloaded` directly into `contact_events`, because they are milestones and there are a handful per contact. That is a deliberate simplification and it does not foreclose this epic: when the raw layer arrives those keep working, and the rollup handles the noisy kinds it was built for.

## Scope

1. **The raw event log** — a store, a writer, and a retention policy. Every server-side event, whether or not a contact is behind it.

2. **The session model** — what starts a session, what closes one, and the inactivity timeout that decides it.

3. **The rollup** — session summaries written once into `contact_events`, at close, with `occurred_at` and `recorded_at` carrying their different meanings.

4. **The surface signal** — the one client-side piece: a lightweight _which surface am I on_ beacon, without which "which tab, for how long" is not inferable from requests alone, because a quiet tab makes none.

5. **The timeline presentation** — folding a session summary into a readable row, and folding runs of low-value kinds.

6. **Retention on **`contact_events` — the first thing to accumulate without bound.

## Decisions taken, and why

**One spine, not two.** Session summaries go into `contact_events` beside the milestones rather than into a table of their own. `kind` is unconstrained precisely so the set can grow, and a second timeline table would be two answers to "what happened to this person". Readability is a presentation problem, solved by folding.

**The raw layer is not D1 by default.** Workers Analytics Engine is built for the write-heavy, high-cardinality shape this is, keeps it out of D1's row budget, and has a SQL read API. A D1 table is the alternative and is the fallback if joins to contact rows turn out to matter more than write volume. To be settled in the first requirement.

**Duration is derived, never stored as a measurement.** A closed laptop sends nothing, so any elapsed time is a lower bound. Store the events; compute the interval on read. The spine's instinct already — facts in, derivation out.

## Open questions

- Analytics Engine or a D1 table for the raw layer.

- Cron or lazy-on-read for session close.

- How far "all user accesses" reaches: token-bearing pages and signed-in surfaces are identified for free; tying _anonymous_ browsing on a published site back to a known contact needs a cookie or pixel, is a materially larger thing, and is the point at which the privacy cost stops being incidental. Not assumed in scope.

## The test gutter — this epic's share ([[DOC-54]])

[[EPIC-15]] manufactures traffic to prove the product's flows still work, and [[DOC-54]] is the contract that keeps that traffic out of what a business sees. **This epic is the most time-critical consumer of it**, for a reason that is about timing rather than difficulty.

`contact_events` is **already written** — the capture path calls `recordEvent` today — and **nothing customer-facing reads it yet**, because [[REQ-235]] is still draft. That is the cheapest moment this contract will ever have. A column added now is an additive migration nobody notices; the same column added after the timeline, the rollups and the detail pane exist is the retrofit [[DOC-54]] §0 exists to prevent, with every read written in between defaulting to unfiltered.

**What this epic owns:**

- **The **`synthetic`** and **`run_id`** columns on **`contact_events`, landing before [[REQ-235]] builds anything that reads them. `NOT NULL DEFAULT 0` — a nullable flag makes an unstamped row ambiguous under three-valued logic, and ambiguity in the collector's delete predicate is how a real contact gets taken.

- **Derivation, never supply.** `recordEvent` already inserts `SELECT ?, u.id, u.tenant_id, … FROM users u`, which the baseline schema justifies as the reason _"an event cannot be filed under a business its contact does not belong to."_ `synthetic` rides that same `SELECT` as `u.synthetic`. This is [[DOC-54]] R2's hardest case — an async continuation with no request context, such as a delivery webhook arriving thirty seconds later — answered by a pattern this epic's table already has.

- **Every read of the spine filters by default**, through the scoped path rather than by each call site remembering.

**The one that will be missed, and it is this epic's alone: the session rollup.** The timeline is an obvious read and will get filtered. A rollup that _counts_ events is not obviously a read, and a synthetic event inflates it silently — the number is wrong in the flattering direction, which is the hardest kind of wrong to notice. [[DOC-54]] §3 states the general rule; this is the concrete instance.

**Not this epic's:** the marker and its signing, the collector and the sweep, the probes. [[EPIC-15]] and [[DOC-54]].
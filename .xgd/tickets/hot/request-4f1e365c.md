---
uid: request-4f1e365c
id: REQ-201
type: request
title: 'User tab: live updates for the contacts list via a change subscription'
created_by: CHAT-27
created_at: '2026-09-06T17:46:48.225001+00:00'
updated_at: '2026-09-06T17:46:48.225001+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  priority: high
  auto_merge_back: true
  needs_review: false
---

**Design ref:** DOC-24 `Ticket Change Notification` in lagrange-framework (`doc-5eb8c6fb`).
**Depends on:** REQ-136 in lagrange-framework (`request-5ceb02d3`), which builds the mechanism.
**Scoping conversation:** CHAT-27 in lagrange-framework (`chat-218e14fe`).

## Summary

The User tab redraws only when it is the one that wrote. `refresh()`
(`apps/control-app/src/builder/people.js:781`) re-reads `/api/people` in full and is called after
this panel's own actions and on a business switch. Nothing else moves it.

The clearest case is one this file already claims to handle. On the invite, `people.js` says of a
person accepting the terms:

> Only the person themselves does that, by accepting the terms, and **the tab reflects it with no
> operator action at all.**

It does not. Acceptance is `POST /api/terms/accept`, made by that person in their own session —
another request, another process, quite possibly another day. The operator's open tab keeps
showing *Invited* until something unrelated causes a full re-read. The comment describes the
behaviour we want; this ticket is what makes it true.

The same gap covers every other write from outside the panel: a second operator on the same
business, a `bin/publish` run from a laptop, and any future automated pipeline movement.

Give the tab a subscription instead, per DOC-24.

## The decision this ticket has to make first

**DOC-24's mechanism is specified on the ticket store, and this tab is not backed by tickets.**
`people.ts` reads `users WHERE tenant_id = ?` — a plain D1 table in this product's own schema.
DOC-24 §4.3 says in as many words that the mechanism is "not a general pub/sub bus — it carries
ticket changes and nothing else". So one of two things has to happen, and the ticket should not
be started before it is chosen:

**(a) Widen the framework mechanism to any tenant-scoped table in the store — recommended.**
The change log, the `seq`, the `enter`/`exit`/`update` vocabulary and the delivery contract are
all properties of a tenant-partitioned D1 store, not of ticket-ness. `users` lives in the same
database under the same `tenant_id` scoping, and this app already vendors the framework store
(`src/generated/ticketing` — `MultiTenantTicketStore`, `Accessor`). Cost: an amendment to
DOC-24 §4.3 and a table-registration surface in REQ-136's work.

**(b) Reimplement the same shape locally for `users`.** Cheaper to start and worse to live with:
two implementations of one delivery contract, diverging on exactly the edge cases DOC-24 §7
exists to pin down, and no shared conformance corpus to hold them together.

Recommend (a). Raise it against REQ-136 in lagrange-framework before that ticket's schema work
lands, because the table-registration seam is much cheaper to design in than to retrofit.

## Scope

Assuming (a):

1. **Subscribe on mount**, replacing the "refresh only when we wrote" model.
   `watch({filter: {table: 'users', tenant: <scope>}})`, taking the cursor from the initial
   `/api/people` read so no change between load and subscribe is lost.

2. **Apply events to the existing render path.** `list-detail`'s `setItems` contract does not
   change. `enter` adds a person, `exit` removes one, `update` patches a row. The panel keeps
   `refresh()` for the `reset` path and for a business switch, where re-reading is correct
   anyway (`clear()` already treats that as a different list, not a redraw).

3. **Field-scope the subscription** to what the tab draws — `termsAcceptedAt`, `pipelineStage`,
   `status`, `displayName`, and the membership/entitlement joins the two axes read. Per DOC-24
   §5, `enter`/`exit` must arrive whatever field caused them: a `tenant_id` correction moves a
   person out of this business's list without touching any watched field, and suppressing that
   would strand a row belonging to another business on screen.

4. **Transport.** SSE from the control-app Worker, carrying the event; the client holds its
   cursor and presents it on reconnect.

5. **Scope enforcement.** The subscription is tenant-scoped by the same `Scope` the read is —
   DOC-8 §6.6, a scoped handle is terminal. A subscription is a read, and every argument in
   `people.ts`'s "THE READ NEVER LEAVES THE TENANT" applies to it unchanged. This is the
   security-relevant part of the ticket: a change feed that leaked across tenants would be the
   platform-only-reading failure `DOC-40` §2.1 rule 1 names, arriving through a new door.

## Out of scope

- The Library and other `list-detail` panels. One tab proves the mechanism.
- The product ticket store in `tickets.ts`, which gets the mechanism for free from REQ-136 and
  needs no work here.
- Cross-business subscriptions. An operator watching two businesses at once is not a thing the
  tab does today.

## Acceptance criteria

- A person accepting the terms in their own session flips the operator's already-open User tab
  from Invited to Member with no operator action — the behaviour `people.js` currently claims.
- A person invited by a second operator on the same business appears in the first operator's
  open list.
- A person moved out of this business no longer appears, even though no watched field changed.
- Both axes stay independently correct under incoming events: an invite moves pipeline and
  leaves access alone; an acceptance moves access and leaves pipeline where it was.
- A `list-detail` selection and an open detail pane survive an incoming event for a different
  person.
- **A subscription raised under one business's scope never observes another business's people.**
  Asserted directly, with a second tenant present.
- Business switch still clears rather than redraws, and re-subscribes under the new scope; the
  old subscription is closed.
- After a disconnect and reconnect the list converges via a catch-up read, not a full reload.
- A `reset` falls back to the existing `refresh()`.

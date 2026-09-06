---
uid: request-4f1e365c
id: REQ-201
type: request
title: 'Library tab: live updates for the material list via a change subscription'
created_by: CHAT-27
created_at: '2026-09-06T17:46:48.225001+00:00'
updated_at: '2026-09-06T18:58:50.855290+00:00'
completed_at: null
last_field_updated: title
status: draft
fields:
  priority: high
  auto_merge_back: true
  needs_review: false
---

**Design ref:** DOC-24 `Ticket Change Notification` in lagrange-framework (`doc-5eb8c6fb`).
**Depends on:** REQ-136 in lagrange-framework (`request-5ceb02d3`), which builds the mechanism.
**Scoping conversation:** CHAT-27 in lagrange-framework (`chat-218e14fe`).

**Supersedes this ticket's first draft**, which targeted the User tab. That tab draws from a
`users` table rather than from the ticket store, so it is not a consumer of this mechanism and
the mechanism is not being widened to reach it — DOC-24 §4.3 stands: the log carries ticket
changes and nothing else. The Library is the ticket-backed list in this app, and it has the same
gap for the same reason.

## Summary

The Library tab redraws only when it is the one that wrote. `refresh()`
(`apps/control-app/src/builder/library.js:603`) re-reads the whole material list through
`transport.list()`, and is called after this panel's own actions and on a business switch.
Nothing else moves it.

That matters more here than on a panel whose writes are all human, because **the Library's most
interesting writes are not made by the Library.** Every material is "a ticket with an AI-written
body" (`library.js:1`), and the body arrives from `describeCapture` after the upload has already
returned — plus, as `capture-material.ts:30` notes, from a background re-describe pass. So the
common sequence is: the operator uploads, the row appears with no description, the AI writes one
seconds later, and the tab shows the empty version until something unrelated forces a full
re-read.

Subscribe it, per DOC-24.

## Scope

1. **Subscribe on mount**, replacing "refresh only when we wrote".
   `watch({filter: …})` over the material tickets this business's scope resolves to, taking the
   cursor from the initial `transport.list()` read so nothing between load and subscribe is lost.

2. **Apply events to the existing render path.** The component contract does not change — the
   host still calls `listDetail.setItems(visible())` (`library.js:340`). What changes is that it
   knows which material moved: `enter` adds a row, `exit` removes one, `update` patches in place.

3. **Field-scope the subscription** to what the tab draws and filters on — the body, the rights
   fields the detail renders, and `placed_on`. Per DOC-24 §5, `enter`/`exit` must still arrive
   whatever field caused them.

4. **Transport.** SSE from the control-app Worker, carrying the event. The client holds its
   cursor and presents it on reconnect.

5. **Business switch stays a clear-and-re-read, not a patch.** `library.js` is explicit that a
   switch is "a DIFFERENT LIST rather than the same list redrawn". The subscription is closed and
   a new one opened under the new scope; `refresh()` is kept for that path and for `reset`.

6. **Scope enforcement.** The subscription is tenant-scoped exactly as the read is — DOC-8 §6.6,
   a scoped handle is terminal. A subscription is a read, and a change feed that crossed
   businesses would be a scope leak through a new door.

## Out of scope

- The User tab and anything else backed by the `users` table — not tickets, not reachable by
  this mechanism, and deliberately not being made reachable.
- The image picker (REQ-132), which is a field editor over one site's assets rather than a
  library.
- Cross-business subscriptions.

## Acceptance criteria

- A material whose AI description is written **after** upload returns shows that description on
  the already-open Library tab, with no operator action and no full re-read. This is the case
  the tab cannot handle today.
- A material written by the background re-describe pass updates in place on an open tab.
- A material created outside this panel appears in the list, with `cause` distinguishing a newly
  created ticket from one that changed into scope.
- A material archived elsewhere is removed from the list — behaviour the tab has no current path
  to learn.
- A `list-detail` selection, the collapse-to-rail state, and the detail pane's persisted scroll
  all survive an incoming event for a different material.
- An event for a material excluded by the active filter does not disturb the visible list.
- **A subscription raised under one business's scope never observes another business's
  materials.** Asserted directly, with a second tenant present.
- A business switch closes the old subscription and opens one under the new scope; no event from
  the previous business is applied after the switch.
- After a disconnect and reconnect the list converges via a catch-up read, not a full reload.
- A `reset` falls back to the existing `refresh()`.

---
uid: request-4f1e365c
id: REQ-201
type: request
title: 'Library tab: live updates for the material list via a change subscription'
created_by: CHAT-27
created_at: '2026-09-06T17:46:48.225001+00:00'
updated_at: '2026-09-06T20:22:49.278498+00:00'
completed_at: null
last_field_updated: body
status: draft
fields:
  priority: high
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-c12372db
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


## Scoping decisions (settled before implementation)

These fix the parts §Scope leaves to the implementer, and every UAT below traces
to one of them.

### 7. The transport is `EventSource`, and the cursor is the SSE `id:` field

`GET /api/material/changes` answers `text/event-stream` and writes `id: <seq>`
on every frame, in the framing `streamTurn`/`streamTail` already established
(`data: {json}` + a blank line). That makes the browser hold the cursor: an
`EventSource` re-presents the last `id:` it saw as `Last-Event-ID` on reconnect,
and the route reads that header when the query string carries no `since`. §4's
"the client holds its cursor and presents it on reconnect" is therefore
satisfied by a browser primitive rather than by a hand-rolled reconnect loop
with its own backoff — reconnect is the one part of a subscription nobody should
be writing twice.

### 8. `/api/material` returns the cursor it read at

The list read grows one field: `{material, seq}`. §1 requires the subscription
to start from the initial read's cursor so nothing between load and subscribe is
lost, and the only place that cursor can honestly come from is the read itself.
A client that took the head *after* listing would have a window; one that took
it before would replay.

### 9. A frame carries a rendered row, not a raw ticket

The change event's after-image carries `{uid, type, title, fields, links,
version, created_at, updated_at}` — which is every input `rowOf()` reads. So the
route projects it through the same `rowOf` the list read uses and ships a
finished `MaterialRow`, with no second D1 read per event and no second row shape
for the pane to learn. `enter` and `update` carry the row; `exit` carries the
uid alone, because there is nothing left to draw.

### 10. The tailer polls at 2s in this deployment, not the component's 50ms

The component defaults `changePollMs` to 50 because its own suite drives it. An
open Library tab at that cadence is twenty D1 reads a second for as long as the
tab is open. The description this whole ticket exists to deliver arrives
"seconds later", so two seconds of latency is inside the behaviour and twenty
reads a second is not — the store handle opened for a subscription passes
`changePollMs` explicitly, and the number is stated at the call site rather than
inherited.

### 11. A body change is a signal to re-read, not a payload

DOC-24 lists `body` in `UNLOGGED_PATHS`: the log records **that** a body moved
and never what it now says, because a log carrying bodies would be larger than
the store. The Library's description *is* that body.

So the two halves of a description landing are served differently, and both are
in scope:

- The **row** needs nothing extra. `description_status` and
  `description_model` are fields, so they travel in the event in full and the
  list redraws from the payload alone.
- The **text** requires a re-read. When an `update` names `body` for the
  material whose detail is currently open, the pane re-fetches that one item
  through the existing `transport.item()` path and repaints. It is one request,
  for one material, only when a detail is open on it, and only when the body
  actually changed — and it is the honest reading of the mechanism rather than a
  gap in it. Forcing the request is also the safer of the two options: the pane
  renders what the store holds rather than what an event implied.

A detail that is not open re-reads nothing; the row it would have shown is
already correct.

### 12. The change log's tables join the baseline migration

`ticket_changes` and `ticket_change_floor` are the component's own DDL and
`SCHEMA_STATEMENTS` now carries them, so `0001_baseline.sql` gains them too —
edited in place, on the grounds its own header states for its siblings. There is
no separate migration, because the database has been wiped rather than migrated
and a baseline that has never been applied is not re-based by editing it.

## Acceptance criteria (added by the decisions above)

- The list read hands back the cursor it read at, and the subscription opens
  from that cursor rather than from the head at subscribe time.
- Every frame carries its `seq` as the SSE `id:`, and a reconnect presenting
  `Last-Event-ID` resumes from it without the query string naming a cursor.
- An event's payload is a material row of the same shape the list read returns,
  built without a second read of the store.
- An `update` naming `body` for the material whose detail is open causes exactly
  one re-read of that item, and the detail repaints with what the store now
  holds. The same event for a material whose detail is not open causes no read.
- A `description_status` change redraws the row from the event alone.


### 13. The re-read never overwrites an open editor

§11 forces a request when a body change lands on the open detail. That request
has a cost §11 did not name: the detail's description is an *editable* field, and
repainting it while the client is halfway through correcting it would take their
half-written sentence off the screen and put ours there instead. The background
re-describe pass is exactly the write that does this, and it is one of the two
writes this ticket exists to deliver — so the two behaviours meet on the same
field, on purpose.

**An open editor wins.** The re-read is skipped entirely — not performed and
discarded — so a client who is typing pays nothing and loses nothing. Their own
commit is about to overwrite that text anyway, and losing what somebody typed is
a worse failure than showing a description one save behind.

The signal is the component's own **control cell**, not `isDirty()`. This field
is `commit: 'auto'`, which writes straight through and stages nothing, so
`isDirty()` reads false for the entire time somebody is typing into it — it
describes the *buffered* commit mode. What the component actually does on entering
edit mode is replace its read cell with a control cell, and that is where the fact
lives.

## Acceptance criteria (added by §13)

- A body change arriving while the description editor is open leaves what the
  operator has typed exactly as it is, and does not spend a read discovering that
  it must.
- The same event arriving on a detail nobody is editing repaints the description
  with what the store now holds.

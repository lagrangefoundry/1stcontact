---
uid: request-ddd47be3
id: REQ-195
type: request
title: 'Contact events: the immutable spine every interaction hangs off'
created_by: xgd
created_at: '2026-09-05T23:30:16.329301+00:00'
updated_at: '2026-09-05T23:45:12.001349+00:00'
completed_at: null
last_field_updated: body
status: draft
fields:
  priority: high
  story_points: 3
  auto_merge_back: true
  needs_review: false
---

# Contact events: the immutable spine every interaction hangs off

Part of the rebaseline. [[REQ-190]] owns the keys and the single baseline;
[[REQ-191]] addresses, [[REQ-193]] names, [[REQ-194]] the account. This owns
history. [[DOC-44]] §4.1 is the argument.

## Why a table and not a column

[[DOC-44]] §4.1 settled that the *stage* over-claims unless we record where a
contact came from. The obvious cheap answer is a `source` column, and it fails on
the example that motivated it: someone who **joined the mailing list** and *later*
**booked a consultation** has two entry facts, and a column keeps one.

They are both **events**. Store the events and provenance is the earliest row,
every later signal survives, and the pipeline stage becomes something a rule can
derive rather than something a hand must remember to set.

This is also what a CRM is, and this product is a front office ([[DOC-42]] §1).
The Contacts tab showing a contact's history is the same query as the timeline the
assistant will eventually read.

## Immutable, and that is the whole discipline

An event says *this happened, at this time*. It is never updated and never
deleted. Anything that changes is **state**, and state lives elsewhere.

The distinction earns its keep immediately on email. A message's delivery outcome
moves — queued, sent, delivered, bounced — so the message is a record with
mutable state, and the events are `email.sent`, `email.delivered`,
`email.bounced`: three immutable rows, not one row rewritten three times. Get this
backwards and the timeline silently loses the bounce the moment a retry succeeds.

**Falsifier:** an `UPDATE` or `DELETE` against the events table outside a
correction; or a `status` column on an event.

## Shape

```
contact_events
  id          TEXT PRIMARY KEY   -- opaque random ([[REQ-190]])
  contact_id  -> contacts(id)
  business_id -- the tenant that owns the event, for isolation
  kind        TEXT NOT NULL      -- 'email.sent', 'list.joined', 'consultation.booked', …
  occurred_at TEXT NOT NULL      -- when it HAPPENED
  recorded_at TEXT NOT NULL      -- when we learned of it
  ref         TEXT               -- opaque key of the detail record, when there is one
  detail      TEXT NOT NULL DEFAULT '{}'
```

**`occurred_at` and `recorded_at` are both needed.** An imported contact's
mailing-list signup happened before we knew about it, and a bounce webhook arrives
after the bounce. One column would make an import look like a flood of activity
today, which is the reading the timeline is there to prevent.

**`kind` is a dotted string, not an enum.** [[DOC-44]] §4 says the state model will
grow; a constraint that has to be migrated for every new kind of thing that can
happen is a constraint that will be worked around.

**`ref` points at a detail record where one exists**, and is null where the event
is the whole fact. `list.joined` needs no detail row; `email.sent` does.

## Email is the first detail record

[[CHAT-39]] wants every outgoing message stored against the contact it went to,
starting with the invite, and shown on the Contacts tab.

**Per [[CHAT-39]], a message is a ticket of a new `email` type**, not a table —
which puts it beside the chat transcripts and uploaded material the ticket store
already holds ([[REQ-160]], [[REQ-162]]), and gives it a body, a version and the
store's own history for free. The event's `ref` is then the ticket uid.

Recorded here as the leaning rather than the decision, because it has one real
cost: delivery state on a ticket is a field rather than a column, so "every
message that bounced this week" is a scan rather than an index. If that query
matters, the message wants a table. **Needs a decision before this is built.**

**Inbound messages are events too**, symmetrically — the user's framing, and it is
right. A reply is `email.received` and the timeline is one sequence rather than
two lists a reader has to interleave by eye.

## What this enables and does not build

- **Provenance** — the earliest event for a contact. No separate column.
- **The Contacts tab timeline** — [[REQ-189]] owns how it looks.
- **Pipeline stage derivation** — possible once events exist; [[REQ-188]] keeps the
  stage a stored value for now, and nothing here changes that. Deriving it is a
  later decision that this ticket makes reachable.
- **No event emission beyond email.** `list.joined` and `consultation.booked` are
  named here to shape `kind`; nothing emits them until the capability exists.

## Not in scope

- **Retention and erasure.** [[DOC-37]] erasure must reach these rows, and the
  event spine is exactly where a "we deleted them but kept the history" mistake
  would hide. The tenant prefix and delete path are [[REQ-190]]'s; what an erasure
  does to an immutable log needs its own answer.
- **The email sender.** [[CHAT-39]]'s ESP decision; this ticket records messages,
  it does not send them.

## Acceptance

- an event is written once and never updated or deleted
- a contact's events are readable as one time-ordered sequence, inbound and
  outbound together
- provenance is the earliest event, with no column duplicating it
- a contact with two entry events keeps both
- `occurred_at` and `recorded_at` differ for an imported event and both are kept
- an outgoing message is recorded against the contact it was sent to, and appears
  on the Contacts tab
- a delivery outcome that changes produces additional events, never a rewritten one
- events are scoped to a business and no query can read across the barrier


## An email is a ticket — decided, 2026-09-05

[[CHAT-23]] settles the fork above: a message is a ticket of a new `email` type,
beside the chat transcripts and uploaded material the ticket store already holds
([[REQ-160]], [[REQ-162]]). It inherits a body, a version and the store's history,
and the event's `ref` is the ticket uid.

The cost stands and is accepted: delivery state is a field rather than a column,
so "every message that bounced this week" is a scan. At beta volumes that is
nothing, and the events table carries the delivery *transitions* anyway — so the
question is answerable from `contact_events` by `kind`, which is indexed, rather
than from the messages themselves. That is the better query shape regardless of
where the message body lives.
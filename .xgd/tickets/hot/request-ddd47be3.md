---
uid: request-ddd47be3
id: REQ-195
type: request
title: 'Contact events: the immutable spine every interaction hangs off'
created_by: xgd
created_at: '2026-09-05T23:30:16.329301+00:00'
updated_at: '2026-09-06T18:59:46.243326+00:00'
completed_at: null
last_field_updated: body
status: free_coding
fields:
  priority: high
  story_points: 3
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-ac5dfe98
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


## What was built, 2026-09-06

The spine, the write path, the emitters that have an act to emit from today, and
the history on the tab. Recorded here because several of these were decisions
taken while building rather than restatements of the above.

### Immutability is the schema's, not the application's

`events.ts` exports no update and no delete, and the table does not rely on that:
a `BEFORE UPDATE` trigger — `contact_events_are_immutable` — refuses an `UPDATE`
outright. An invariant the code maintains is an invariant that eventually is not
maintained ([[DOC-45]] §7), and this one fails silently when it fails: an event
edited in place leaves a timeline that reads perfectly and is untrue.

**`DELETE` is deliberately left reachable.** Erasure is a person's right over
their own data ([[DOC-37]]) and has to reach these rows; a trigger forbidding
`DELETE` would break the `ON DELETE CASCADE` from the contact and make the event
spine the one place a "we deleted them but kept the history" mistake could hide.
What is forbidden is REWRITING a fact.

This narrows the falsifier above rather than contradicting it: **a correction is
an appended event that supersedes, never an edit of the row that was wrong.** An
append-only log that permits in-place corrections is not one.

*Technical consequence:* a trigger body is a compound statement carrying its own
semicolons, so the test harness's migration splitter now tracks `BEGIN`/`END`
depth. `wrangler d1 migrations apply` — the path that runs the baseline in every
real environment — already does; without the fix the harness would refuse a
migration production accepts.

### `business_id` is derived from the contact and never supplied

Every insert is `INSERT ... SELECT ... FROM users`, so an event cannot be filed
under a business its contact does not belong to — the isolation is a property of
the statement rather than of every caller remembering to pass the right value.
Supplying a business narrows it further to a refusal: a write against a contact
in another business writes nothing and raises `UnknownContactError`, which is
what a contact that never existed raises.

### What emits today, and why it is more than "email"

The section above says *no event emission beyond email*. That was written against
`list.joined` and `consultation.booked` — capabilities that do not exist. Three
acts that DO exist emit, and the first is load-bearing for this ticket's own
acceptance: **provenance is unanswerable unless something records a contact
coming into existence.**

| Act | Event | Where |
| --- | --- | --- |
| an invite that creates somebody | `contact.created`, `detail: {via: 'invite'}` | `invitePerson` |
| an invite, every press | `contact.invited` | `invitePerson` |
| a seeded operator being created | `contact.created`, `detail: {via: 'platform_admins'}` | `ensurePlatformOperator` |
| accepting the terms | `member.signed_up`, `detail: {version}` | `acceptTerms` |

**Two events on a fresh invite, because two things happened.** `contact.created`
is the provenance row and `contact.invited` is the pipeline transition, which will
happen again. Collapsed into one, a contact added by a surface that does not
invite ([[REQ-199]]'s `addContact`) would have no provenance at all.

**A second invite is a second event even though no column moves.** `invited_at`
records when we FIRST asked and is not restamped, so without the event a second
press is invisible everywhere — and "have we chased them?" is exactly the question
a history is for.

**Signing up is recorded because it is the contact's own act.** Every other event
is something the business did; the access axis ([[DOC-44]] §3) is theirs, and the
event carries the terms version, which the single mutable column forgets the next
time terms change.

**`email.*` has no emitter here, and that is honest.** There is no sender
([[REQ-196]]) and no `email` ticket type ([[REQ-198]]), so the delivery events are
proved through `recordEvent` — the shipped write path those capabilities will
call — with the message named by `ref`. This ticket builds the spine; it does not
invent the emitters that do not exist.

### The history on the Contacts tab

It rides on `/api/people/detail` rather than a route of its own: the pane draws it
in the same paint as the record and the businesses, so a second endpoint would be
a second round trip for a pane that cannot render without both, and a second
surface to scope.

- **One sequence, newest first**, ordered by `occurred_at` — inbound and outbound
  interleaved, never a list per kind.
- **A kind with no label renders as the dotted string itself.** The set grows and
  the schema carries no constraint on it, so a panel that branched on kinds would
  have to be found and edited the day a capability recorded something new — and
  would draw a blank row until somebody did, which reads as a broken timeline.
- **`Origin:` is the earliest event, from its own server-side query.** The list is
  capped (`TIMELINE_LIMIT`); provenance read off its tail would be quietly wrong
  for exactly the contacts with the longest histories.
- **The `recorded_at` stamp is drawn only when it differs from `occurred_at`.**
  They are equal for everything this system does itself, so printing both every
  time would train the eye to skip the region where an import or a late webhook
  actually shows up.
- **The section is drawn even when empty**, unlike `Other addresses`: "we have no
  record of this person" is a fact about them, and is what every contact created
  before this table existed truthfully shows.
- **Placed under `Businesses`.** Everything above it is the current answer; this
  is how it came to be that answer.

### Also touched

`test_UAT_FC_REQ-190_the_schema_carries_no_composite_key_made_of_data` enumerates
the schema's keys deliberately rather than loosely, so `contact_events` is named
in it. Its key is an opaque id and not the natural-looking
`(contact_id, kind, occurred_at)` composite — which would make two identical facts
in the same millisecond unrepresentable, and pressing Invite twice in a second is
two presses.

### Still not in scope

Retention and erasure (unchanged from above — the `DELETE` path is left open for
it, and what an erasure should DO to an immutable log still needs its own answer),
the sender, the `email` ticket type, and deriving the pipeline stage from events.

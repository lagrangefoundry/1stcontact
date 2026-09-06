---
uid: request-9bfe910a
id: REQ-198
type: request
title: 'The email ticket type: every outgoing message is a record on the contact'
created_by: xgd
created_at: '2026-09-05T23:44:42.099725+00:00'
updated_at: '2026-09-06T19:46:38.561239+00:00'
completed_at: null
last_field_updated: status
status: free_coded
fields:
  priority: high
  story_points: 2
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-b6d07352
  commits:
  - working_sha: 5360036587e3ed413b6b48e2ce1f339eaccba4ce
    reconcile_sha: null
    main_sha: null
  - working_sha: 3c6d47d1a4959a135fc44d3992a07696dd0c8ba6
    reconcile_sha: null
    main_sha: null
  - working_sha: 39bd0f6a3c90d2c3df3ce0169bce056c25dc6968
    reconcile_sha: null
    main_sha: null
  - working_sha: 2700bf90b5490f3b02db26196f3b863358eb5fb4
    reconcile_sha: null
    main_sha: null
  - working_sha: eec028deaeece091b678984390640f171a58b327
    reconcile_sha: null
    main_sha: null
  - working_sha: 1ff5b509bfc8ae150fb09697b149737d99e7560f
    reconcile_sha: null
    main_sha: null
  version: 0.2.117
---

**Design ref:** [[CHAT-39]]. Depends on [[REQ-196]] and [[REQ-197]].

## Every outgoing message becomes a ticket

One `email` ticket per message sent, in the tenant's store, joined to the contact
it went to. The Contacts detail pane reads them, so an operator looking at a person
can see what we have said to them and whether it arrived.

## The type

```
type: email
fields:
  contact_id     the person
  address_id     the address it was sent to
  template_key   which template it rendered from
  subject        as sent
  from / to      as sent
  status         'queued' | 'sent' | 'delivered' | 'bounced' | 'failed'
  provider_id    the ESP's message id
  queued_at / sent_at
body:            the RENDERED body, as sent
```

**`contact_id` *and* `address_id`, not just the contact.** A bounce is a fact about
an **address**, not about a person — [[REQ-191]] gives a contact several addresses,
and a record that only named the person could not say which of them is bad. This
is the reason the type is designed against the post-rebaseline schema rather than
today's single `email` column.

**The body is the rendered message, not a reference to the template.** The template
changes; what we sent does not. The question this record has to answer months later
is *what did this person actually receive*, and a template reference answers a
different question badly. It is the same reasoning that makes `TERMS_VERSION` a
date rather than `v3`.

## Queue first, then send, then update

The record is written `queued` **before** the send is attempted, and updated
after. Not written afterwards from what came back.

It costs about five lines and it buys the difference between a failed send that
left evidence and one that vanished. A crash between "operator pressed Invite" and
"provider accepted the message" is otherwise indistinguishable from never having
pressed the button — and the person it was for is sitting waiting for mail that
nobody knows was lost.

**Falsifier:** a send path where a failure produces no row.

## Bounces come back and land on the record

The provider posts delivery and bounce events to a webhook. The record is found by
`provider_id` and its `status` moves to `delivered` or `bounced`.

This is most of the value of the whole ticket. In a beta the single most useful
signal available is *which addresses are wrong*, and without it the operator's
first evidence is somebody never showing up.

The webhook must verify the provider's signature before it believes anything;
it is an unauthenticated public endpoint and its whole job is mutating records
based on what it is told.

## What this does not do

- no retry, automatic or otherwise; a failed message is visible and re-sending is
  the operator pressing the button again
- no open or click tracking — it is not wanted and it is a privacy cost with no
  beta value
- no inbound mail
- no aggregate reporting surface beyond the per-contact list

## Acceptance

- an `email` ticket type exists with the fields above and is registered in
  `productTypePack()`
- sending writes the record as `queued` before the provider is called
- a successful send updates the record to `sent` and stores `provider_id`
- a failed send leaves a record with `status = 'failed'` and the reason
- the stored body is the rendered text as sent, and re-rendering the template later
  does not change it
- a delivery webhook moves a record to `delivered`; a bounce webhook moves it to
  `bounced` and identifies the address
- the webhook rejects a request whose provider signature does not verify
- the Contacts detail pane lists a contact's messages, most recent first, showing
  subject, when, and status
- a contact with a bounced address is distinguishable in the Contacts list
## Implementation decisions

Recorded here because each is a consequence of the shape above rather than a
free choice, and because the two tickets this one depends on are being built
alongside it.

### The record is written around a `sendEmail`-shaped port that is passed in

[[REQ-196]] owns the port and its Resend and local adapters. This ticket owns
the *recording* half — queue, call, update — and takes the port as an argument
rather than importing an adapter. So the seam is
`sendRecordedEmail(store, spec, send)`: the recorder never chooses a provider,
never holds an API key, and the suite drives it with a stub that captures.
That is also what satisfies [[REQ-196]]'s falsifier — *a code path where running
the tests can send mail* — from this side of the seam.

`template_key` is a plain string on the record. Rendering is [[REQ-197]]'s, and
the record only has to say which template the body came from.

### The type registers `contact_id` and `address_id` as strings, not `uid`

A `uid` field in the type pack is a *reference to another ticket*, and the store
refuses a create whose reference does not resolve. A contact is a `users` row and
an address is a `user_emails` row; neither is a ticket, so declaring them `uid`
would make every send fail validation. They are opaque keys into the identity
schema and are typed as what they are.

### The webhook is unauthenticated by necessity, and therefore verified first

It is mounted ahead of the Access gate — a provider cannot present an Access
token, so a webhook behind the gate is a webhook that never fires. Everything the
gate would have done is replaced by the signature: the body is read, the
provider's signature over it is verified against a shared secret, and a request
that fails verification is refused before anything is looked up, let alone
written. The signed content includes the provider's timestamp, and a timestamp
outside a few minutes is refused too, so a captured request cannot be replayed.

### Finding the record means listing tenants, not reading across them

The provider knows a message id and nothing about businesses, so the lookup has
no tenant to start from. The ticket store has no unscoped read and must not grow
one: the sanctioned shape is to hold the base handle, `listTenants()`, and take
one ordinary scoped handle per tenant until the record is found — pointers, then
an ordinary read ([[DOC-40]] §7). It costs one indexed query per registered
business per event, which is the honest price of a beta with a handful of them;
what it buys is that no new cross-tenant read surface exists.

### The bounce reaches the list without a schema change

`/api/people` reports, alongside the people, the contacts that hold a bounced
message — one scoped query over the tenant's own `email` records. The list marks
those rows. A column on `user_emails` would be a second home for a fact the
record already carries, and the two would be free to disagree.

### What the operator sees

- the detail pane gains a **Messages** section listing that contact's messages,
  most recent first, showing subject, when it was queued, and status
- a message that failed says why, on the row, because the reason is the only
  thing that tells the operator whether pressing Invite again will help
- a contact with a bounced address carries a marker in the list itself

### There is no call site in this ticket

Nothing in the product sends mail yet, and this ticket does not add the first
thing that does. It adds the record, the webhook and the two reads the Contacts
tab makes; the surface that composes *render a template, send it, record it* is
the invite modal in [[REQ-199]], over [[REQ-196]]'s adapter and [[REQ-197]]'s
templates. That is why the acceptance below is stated against `sendRecordedEmail`
rather than against pressing a button.

The signing secret is `EMAIL_WEBHOOK_SECRET`, pushed with `wrangler secret` and
never committed. Absent, the endpoint refuses everything rather than accepting
unverified events — which is the right failure, and is why it is not a deploy
blocker before the provider is configured.

### The record names both the template key and the template ticket

[[REQ-197]] landed while this was being built, and its `RenderedMessage` carries
a `templateUid` *"so [[REQ-198]]'s record can name the exact copy"*. So the
record stores both: the key says WHICH template this was, the uid says WHICH
VERSION of it. Replacing a template writes a new ticket rather than editing the
live one, so without the uid a record made last month points at whatever the key
resolves to today. It is optional and is not `uid`-typed — a reference field must
resolve at create, and a template superseded and archived since must not make the
record of a message it really did send unwritable.

`SendEmail` is imported from [[REQ-196]]'s `mail.ts` rather than re-declared
here. The seam is unchanged — the recorder still takes the sender as an argument
and imports no adapter — but there is one definition of the port's shape instead
of two that can drift.

### Contact events are deliberately not written here

[[REQ-195]]'s spine names `email.sent` / `email.delivered` / `email.bounced` as
events this work produces. It landed with no writers at all — not even the invite
writes one — so wiring producers is a step of its own per producer, and doing it
from inside the recorder would mean widening both `sendRecordedEmail` and
`applyDeliveryEvent` to carry a database and a business they otherwise do not
need. It belongs with the call site ([[REQ-199]]), where both are already in
hand.

## Acceptance (added by implementation)

- the webhook refuses a request whose timestamp is far outside now, so a captured
  request cannot be replayed
- the webhook refuses a body that verifies but names no message we sent, without
  writing anything
- `sendRecordedEmail` takes the sending port as an argument and imports no adapter
- a failed send's reason is stored on the record and shown on the row
- the record names the template ticket as well as the template key
---
uid: request-9bfe910a
id: REQ-198
type: request
title: 'The email ticket type: every outgoing message is a record on the contact'
created_by: xgd
created_at: '2026-09-05T23:44:42.099725+00:00'
updated_at: '2026-09-05T23:44:42.099725+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  priority: high
  story_points: 2
  auto_merge_back: true
  needs_review: false
---

**Design ref:** [[CHAT-39]]. Depends on [[REQ-134-sender]] and [[REQ-135]].

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

---
uid: request-37ac28bf
id: REQ-245
type: request
title: The portal shows and changes a contact's preferences
created_by: EPIC-10
created_at: '2026-09-13T22:03:11.191085+00:00'
updated_at: '2026-09-14T02:40:42.094087+00:00'
completed_at: null
last_field_updated: status
status: free_coding
fields:
  priority: medium
  depends_on:
  - request-a4186018
  epic_parent: epic-d6d7ea63
  auto_merge_back: true
  needs_review: false
---

# The portal shows and changes a contact's preferences

A signed-in contact sees which preferences they hold and changes the ones that are theirs
to change.

## 1. What is true today

**`account-portal` is read-only by contract, deliberately.** Its config declares exactly
one endpoint, its client issues `GET` and nothing else, and its header says why:
*"There is no config field naming a destructive endpoint and no verb in `client.js` other
than a `GET`, so 'the button does not delete the account' is a property of the contract
rather than of a branch someone could flip."*

**Nothing about acceptances is shown anywhere a contact can see.**

## 2. Opening the contract, and how far

This ticket opens that contract **deliberately and narrowly**: the portal gains the ability
to write, for exactly one class of thing.

The original reasoning is not discarded — it is the reason the opening is bounded. What
`account-portal` must still never do is grant itself access, escalate an entitlement, or
delete anything; [[DOC-37]] remains the deletion design and is not the tail of this module.
What it may now do is set and unset a **type 2** acceptance ([[REQ-240]]), which is the
contact's own preference and is theirs by definition.

**Type 1 and type 3 are not editable here.** A document acceptance is not revocable, and a
request is a statement about something that happened. Both are shown; neither offers a
control. This is a property of the acceptance's type rather than of the portal's markup, so
a new key of either type acquires the correct behaviour without this module being edited.

## 3. The preferences appear on their own

A business turns on a type 2 acceptance and it shows up, labelled by its definition's
wording. There is no second place listing which preferences the portal renders — a list
here would be a second answer to which acceptances a business holds, free to drift from the
registry that is the first.

## 4. What this is not

**It is not an unsubscribe link.** There is no mailing list yet and therefore no mail
carrying a footer to put one in. When there is, the link is the primary surface — a
captured contact is a `lead`, cannot sign in, and can never reach this page — and this
portal remains the convenience for members. Out of scope here, and named so the shape is
not forgotten.

**It is not an operator surface.** Changing a contact's preference on their behalf is not
in this round; every writer here is the contact's own act.

## 5. Acceptance criteria

1. A signed-in contact sees every acceptance their business has turned on, labelled by the
   definition's wording.
2. A type 2 acceptance can be set and unset from the portal, and each change appends a
   `contact_events` row recording which way it went.
3. A type 1 acceptance is shown with no control, and no request the client can make
   changes one. Asserted by attempting it.
4. A type 3 request is shown as history and offers no control.
5. Turning on a new type 2 acceptance in a business makes it appear in the portal with no
   change to the module.
6. The portal still cannot grant access, alter an entitlement, or delete anything — the
   contract holds everywhere except the one opening this ticket names.
7. A contact sees only their own acceptances, and a request naming another contact is
   refused.
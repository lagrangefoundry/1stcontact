---
uid: request-609054e3
id: REQ-203
type: request
title: An accepted invitee gets a business, a starter site, and lands on the Site
  tab
created_by: CHAT-39
created_at: '2026-09-06T23:26:46.818016+00:00'
updated_at: '2026-09-06T23:26:46.818016+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  priority: high
  story_points: 3
  auto_merge_back: true
  needs_review: false
---

**Design ref:** [[CHAT-39]]. Depends on [[REQ-202]] for the invitee being able to
authenticate at all. Closes [[DOC-42]] §10.1's admitted-but-unentitled gap, which
[[REQ-188]] named and deferred.

## What happens today

An invited contact who reaches the front door is refused. They hold a `users` row and
an address; `invitePerson` deliberately writes neither a membership nor an entitlement
([[DOC-42]] §5), so `admit` answers `no_membership` and they are shown
`DENIED_MESSAGE` — *"Your access to 1st Contact has ended"* — five minutes after being
invited. Nothing ended. They never had access, and the sentence is false in the one
case it is most often read.

Every beta invitee travels this path. It is the last thing between an invite and a
working onboarding.

## A person who signs up gets a business

1st Contact is a site builder. An invitee who signs in and owns no business has nothing
to be signed in *to* — no site, no builder, no reason to have come. So signing up
provisions one. This is not a convenience or a shortcut around billing; it is what the
product is.

`provisionBusiness` already does the whole of it: the `tenants` row, an `owner`
membership for **every person on the owning account**, an entitlement, and a starter
site via `createStarterSite`. It returns `{ businessId, name, siteSlug }`.

**The account already exists and must not be created again.** `addContact` mints an
`accounts` row alongside every contact — including a Lead nobody will ever bill —
precisely so there is no row that names none. So this passes `users.account_id` to
`provisionBusiness` and creates nothing. Minting a second account here would give one
person two, and would put the payer somewhere no reader expects.

**Falsifier:** an `INSERT INTO accounts` on this path.

## It happens on terms acceptance

Not on redemption, and not on first admission.

Acceptance is the person's own act and the fact that makes them a Member
([[REQ-188]]): `tos_accepted_at` is what separates somebody we asked from somebody who
came. `guardTerms` already blocks everything until it happens, so provisioning any
earlier would build a business, a site and a grant for a person who then closes the tab
without agreeing.

## It must be idempotent, and the reason is not hypothetical

`needsAcceptance` compares `tos_version` against `TERMS_VERSION`. **The day the terms
change, every existing member re-accepts** — and a naive implementation would provision
each of them a second business, with a second starter site, on a document revision.

So the guard is a condition and not a comment: provision only when this account owns no
business. `tenants.owner_account_id` is the column that answers it.

**Falsifier:** a second acceptance producing a second business.

## What the business is called

They have not been asked yet, because the flow that asks does not exist. So: the
contact's display name where they have one, otherwise a neutral placeholder — and it
must read as obviously provisional, because the operator will see it in the Contacts
tab before the invitee ever renames it.

`tenants.name` is an attribute and may change ([[REQ-190]]), so this costs nothing to
get approximately right and would cost something to leave blank.

## The grant is open-ended for the beta

`provisionBusiness` takes a `plan` and writes the entitlement. A beta invitee gets an
open-ended grant: a dated one would expire somebody out of their own business at a
wall-clock time nobody chose, in the middle of the trial they were invited to — the
same reasoning `0005` used for the operator's own grant.

## Where they land

**The Site tab of the builder.** `SITE_TAB` is already first in `TABS`, so the
requirement is that acceptance returns them to the builder root and the default tab
stands — not that a new destination is invented.

They arrive at a starter site they can immediately edit, which is the shortest path
from "I was invited" to "I am using it".

## This is a placeholder for an onboarding flow

Stated so it is not mistaken for a finished design. A real flow asks what the business
is called and what it is for, and probably picks a starting point from that. None of
that exists, and until it does the invitee is dropped straight into the builder. When
the onboarding flow lands it takes this ticket's place at the same hook.

## What this does not do

- no onboarding flow, no questions asked, no template chosen
- no payment, no plan selection, no trial expiry
- no second person on an account — that is a `users` row carrying an existing
  `account_id` and nothing here writes one
- no change to what an operator sees; provisioning from the Contacts tab still works
  and is still how a business gets made by hand

## Acceptance

- accepting the terms provisions a business for the accepting contact when their
  account owns none
- the business is created through `provisionBusiness`, passing the contact's existing
  `users.account_id`
- no `accounts` row is written on this path
- accepting a second time — including after `TERMS_VERSION` changes — provisions
  nothing further, and the check is on `tenants.owner_account_id`
- the provisioned business carries an `owner` membership for the contact and an
  open-ended active entitlement
- a starter site exists and is servable immediately
- the contact is no longer refused: `admit` returns `ok` and the business is selectable
- after accepting, the contact lands in the builder with the **Site** tab active
- an invitee who was never invited — a Lead who somehow reaches the terms page — is
  treated identically; nothing here branches on pipeline stage

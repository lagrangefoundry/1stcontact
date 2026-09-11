---
uid: capability-e5939ceb
id: CAP-114
type: capability
title: 'Accounts, Membership & Entitlement: Who Exists, What They Own, And When Access
  Ends'
created_by: martin-github@westhead.me
created_at: '2026-09-11T06:25:49.431659+00:00'
updated_at: '2026-09-11T06:25:49.431659+00:00'
completed_at: null
last_field_updated: created_at
status: active
fields:
  name: accounts_membership_entitlement
---

# Capability: Accounts, Membership & Entitlement — Who Exists, What They Own, And When Access Ends

**A verified email address is not permission. This capability owns the records
that decide whether the person behind a proven identity may be here at all: who
exists, which account they may operate, and the grant whose window their access
lives inside.**

The access gate (CAP-103) proves who a caller is. Its policy is identity-only —
anyone who can receive an email can pass it — so passing it says nothing about
entitlement. This capability is where that boundary moved to. It holds three
nouns and the rule that joins them:

- **A person** exists because somebody invited them, never because they arrived.
  Provisioning and login are deliberately asymmetric: the invite creates the
  whole set — the person, the account they own, the membership that joins them,
  the grant that admits them, and something to edit when they get there — and
  login creates nothing at all. A verified address with no record behind it is
  refused, not signed up.

- **An account is a unit of isolation with a permanent identifier.** The
  identifier appears in storage keys and therefore outlives every human name it
  might have been derived from, so it is opaque by construction and the human
  label lives where it can change.

- **Access is a grant of a plan for a period, not a flag.** An account
  accumulates grants over its life and effective access is the best active grant
  covering now, so admission is a selection rather than a read. A grant given a
  bounded date must actually end on it: an expiry that is never evaluated is
  worse than an open-ended grant, because it was promised as bounded.

Two properties define the refusal side, and both are structural:

- **Every refusal looks the same to the caller and different to the operator.**
  "No such person" and "expired grant" need different fixes and would be more
  helpful stated apart — and stating them apart turns the surface into an
  account-existence oracle for anyone who can pass a one-time PIN. The
  distinction is recorded where the operator is.

- **The decision runs where the gate runs** — before a storage handle exists and
  before a path is examined — so no route can be reached by someone who was
  merely able to receive an email.

Scope: the identity, account, membership and entitlement records, their
provisioning, and the admission rule. Proving who a caller is belongs to CAP-103.
Self-signup, trials, subscriptions, billing states and time-boxed support
memberships are later branches that land on this model without changing its
shape.

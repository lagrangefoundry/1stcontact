---
uid: story-e7871ed7
id: STORY-136
type: story
title: The invitation provisions the account, and every login binds a verified email
  to a grant that is still live
created_by: xgd
created_at: '2026-09-04T05:50:56.737635+00:00'
updated_at: '2026-09-04T06:00:20.832433+00:00'
completed_at: null
last_field_updated: status
status: completed
fields:
  intent_uid: bundle-203b1dc2
  capability_uid: capability-07f08dcf
  story_kind: feature
  story_points: 3
---

## Story

**As a** platform operator onboarding a business owner onto 1st Contact,
**I want** an invitation to create that person, their own account, their ownership of it
and a grant of access with a start and an end — and every subsequent login to bind their
verified email to a grant that is still live, or turn them away —
**so that** only people I deliberately let in can reach the builder, access I gave for a
period actually stops when that period ends, and nobody outside can learn from the refusal
whether a given email has an account here.

## Description

Before this, verifying a caller's identity *was* admission: whoever passed the hostname
gate was served the builder, into the single tenant the Worker was configured with. There
was no record that a person existed, no account they owned, and no rule about who may
enter. Since the identity check is an emailed one-time PIN — available to anyone with an
email address — the authorisation boundary had to move off the edge and into the
application. This story is that boundary.

It provides two deliberately asymmetric operations.

**The invitation provisions.** One operation creates the person (recorded as invited and
not yet seen), an account of their own, an ownership joining them to it, an active grant
of a plan for a period, and one starter site so that arriving for the first time finds
something to edit rather than an empty account and a create-site flow that does not exist
yet. The account's identifier is opaque and derived from nothing a human chose, because it
appears in storage keys and is therefore permanent — a readable one becomes a lie the first
time someone renames their company. Inviting an email that is already known reports the
person and account that already exist rather than failing on a storage constraint or
quietly creating a second account.

**The login binds, and creates nothing.** A verified email with no record behind it is
refused, not signed up: the absence of self-signup is the feature, and until it lands the
only way into this system is to have been invited into it. Admission resolves the person,
then the account they may operate, then the best grant covering right now, and refuses at
any step. Access is a *grant*, not a flag on an account — an account accumulates grants
over its life and effective access is the best active one covering now — so a bounded grant
whose expiry is never evaluated is worse than an open-ended one, because it was promised as
bounded.

**Every refusal is the same refusal.** The visitor is told their access has ended and to
get in touch, whatever the actual reason; distinguishing "no such person" from "expired
grant" on the wire is an account-existence oracle to anyone who can pass a one-time PIN.
The distinction is real and an operator debugging a customer's "it says no" needs it, so it
goes to the operator's log and not to the wire.

**In scope**: the identity, account, ownership and grant records; provisioning from an
invitation; admission on login; the grant window and its withdrawal; the single refusal;
the starter site created with the account.

**Out of scope** (later branches that land on this model without changing it): self-signup,
trials, subscriptions, discounts, a warning period before expiry, read-only access after
expiry, and time-boxed support access for platform administrators. Also out of scope: how
the caller's identity is verified in the first place, and what the store's tenant scope
becomes once an account is resolved.

## Technical Context

- Sits behind the Operator Access Gate capability (CAP-103 / STORY-120), which verifies the
  caller's token and yields a verified email. That gate's own verdict — and the narrowing of
  its "a valid token yields a served response" criteria — is documented separately; this
  story owns everything that happens *after* the email is known, including the end-to-end
  admitted path.
- The account, once provisioned, is a registered tenant in the same registry the site store
  already uses, so an ownership record can never point at an account the registry has never
  heard of.
- The identity records are declared beside the tenant registry in the control-plane
  database. The grant's plan and status are deliberately unconstrained values, and an
  account deliberately has no single-grant restriction: adding a trial or a warning state
  later must be a code change, not a storage migration.
- The starter site's content is owned by the starter-site intent; this story owns only that
  exactly one site exists for a newly provisioned account and that its address cannot
  collide with another account's, since a published address is claimed globally.

## Reconciliation Decisions

- **Email is matched case-insensitively** (decided at reconciliation, 2026-09-03): REQ-167
  is silent on letter case — it says identity is decided by the unique index on
  (tenant, email) and stops there. The landed code casefolds on the way in, because the
  index itself is byte-exact, so `Sarah@example.com` and `sarah@example.com` would otherwise
  be two people and two accounts, and the second would be created by an invite that appeared
  to succeed. Formalised as AC-1594.

- **The arrival is recorded even when the visit is refused** (decided at reconciliation,
  2026-09-03): REQ-167 places the arrival stamp at step 2, ahead of the account and grant
  checks, but never states the consequence. The consequence is the point — an operator
  asking "did the customer whose grant expired ever try to get in?" is asking about a
  refused visit. Formalised as part of AC-1597.

- **An unconfigured platform tenant refuses rather than guesses** (decided at
  reconciliation, 2026-09-03): REQ-167 does not mention configuration failure. The landed
  code refuses both operations with an actionable message naming what to set and where,
  rather than defaulting to some tenant — guessing here would file real people into the
  wrong tenant, which the unique index would then make permanent. Formalised as AC-1595.

- **"Best grant" means the one that keeps access longest** (decided at reconciliation,
  2026-09-03): REQ-167 says "the best grant for that account" without defining best. The
  landed code orders open-ended grants ahead of bounded ones and later ends ahead of earlier
  ones. There is no plan ranking because there is one plan; this is the definition that will
  need revisiting when billing introduces several. Formalised as AC-1600, so the ordering is
  a stated promise rather than an artefact of a query.

- **A withdrawn ownership and a suspended person refuse too** (decided at reconciliation,
  2026-09-03): REQ-167 states that revocation refuses independently of dates only for the
  grant. The landed code applies the same rule to the ownership record and additionally
  refuses a suspended person. Checking only the grant would make the other two decorative.
  Formalised into AC-1599.

- **The refusal is not cacheable and not indexable** (decided at reconciliation,
  2026-09-03): REQ-167 specifies what the deny page says, not how it is transported. One
  cached refusal would become everybody's answer, including the entitled, and an indexed one
  would publish the existence of the surface. Formalised into AC-1602.

- **The starter site's address is the account's own identifier** (decided at reconciliation,
  2026-09-03): REQ-167 defers the starter site's content and is silent on its address. A
  published address is claimed globally, so a starter site called `home` for everybody would
  work until the second account published and then be refused for a reason its owner could
  do nothing about. Formalised into AC-1592 as a collision property, stated without naming
  the scheme.

No contradiction between REQ-167 and the landed code was found: every behaviour the ticket
names — the three record types, provisioning as one operation, login as pure lookup, the
grant window evaluated from both sides, revocation independent of dates, one refusal
message with the reason logged — is implemented as stated.

## Dependencies

None. (The gate-verdict narrowing that follows from this story is documented separately and
depends on it.)

## Story Points

3
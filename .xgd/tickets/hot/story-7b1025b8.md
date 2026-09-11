---
uid: story-7b1025b8
id: STORY-146
type: story
title: 'Identity: the invite provisions the account, login binds it'
created_by: martin-github@westhead.me
created_at: '2026-09-11T06:26:38.441768+00:00'
updated_at: '2026-09-11T06:26:38.441768+00:00'
completed_at: null
last_field_updated: created_at
status: unplanned
fields:
  intent_uid: bundle-87be4669
  capability_uid: capability-e5939ceb
  story_kind: feature
  story_points: 3
---

## Story

**As** the operator onboarding a client onto the platform, **I want** an invite to
create the person, their account and the grant that admits them — and a login to
bind a proven identity to that record without creating anything — **so that** only
people I have actually invited can reach the builder, and the access I promised
for a period actually ends when that period does.

## Description

Before this story, a proven email address was the whole of admission: the
platform verified an identity on every request and did nothing with it, so
whoever could pass the identity gate reached the builder, inside a single tenant.
This story is the record behind the address and the rule that reads it.

**Two operations, deliberately asymmetric.**

*The invite provisions.* One operation creates the whole set: a person marked as
invited and not yet seen, an account whose identifier is opaque, an owner
membership joining them, an active grant of a plan for a period, and the
account's starter site so a person arriving for the first time finds something to
edit. Re-inviting an address already known reports the person and the account
they already own rather than failing on a uniqueness constraint, and an address
differing only in case or surrounding whitespace is the same person.

*Login binds and provisions nothing.* Every step is a lookup except the one
arrival stamp. A proven address with no person behind it is refused, not signed
up — self-signup is a later branch, and its absence here is the point: admission
would otherwise be unbounded, because the identity policy admits anyone who can
receive an email. A person's own record must be active, they must hold an active
membership, and their account must hold a grant that is active, has started, and
has not ended. Where several grants cover the moment, the one preserving access
longest is chosen, so an account whose trial lapsed while its subscription ran is
not locked out by its own history.

*One refusal, many reasons.* Every refused visitor is told the same thing in the
same way; which check failed is recorded for the operator rather than returned to
the caller, because naming the failed check is an account-existence oracle to
anyone who can pass a one-time PIN — which is anyone with an email address. The
decision runs where the identity gate runs, before any storage handle exists and
before any path is examined, so no route is reachable by someone merely able to
receive an email.

**In scope**: the person / account / membership / grant records, provisioning at
invite, the admission rule, the arrival stamps, and the shape of the refusal.

**Out of scope**: proving who the caller is, and the shape of the verdict the
identity gate hands onward — both belong to CAP-103; self-signup, trials, subscriptions,
discounts, a warning period, read-only access on expiry, and time-boxed support
memberships — all later branches that land on this model without changing it; and
any operator console or CLI for issuing invites, which this story does not add.

## Technical Context

- Builds directly on **CAP-103 (Operator Access Gate)**, which proves the
  caller's identity and, per REQ-167, now reports that verified identity onward
  rather than a yes/no — so the proven address is not recovered by verifying the
  same token a second time. Admission is the second of the two checks and is this
  story's; the gate's own verdict is not.
- The account is a tenant, which is the existing unit of storage isolation
  (CAP-101, CAP-81). An account identifier therefore appears in storage keys and
  is permanent, which is why it must not be derived from anything a human chose.
  The human label is held separately, where it can change.
- The starter site is created through the ordinary site-storage port rather than
  by raw writes, so the account is a registered tenant that the store will serve
  before any membership points at it.
- **Access and money are separate.** A grant records a plan, a source, a status
  and a window; it records no pricing. A comped grant is a grant with no
  subscription behind it. Collapsing the two would force the admission check to
  understand pricing.
- **The grant model is deliberately open.** The store places no value constraint
  on a grant's plan or status and does not assume one grant per account, so
  adding a plan, a billing state or a second concurrent grant later is a code
  change rather than a data migration. This is an intentional absence; a
  constraint added later "for tidiness" would cost exactly that.
- **Deploy ordering, recorded rather than solved.** Once admission is enforced,
  anyone without a person record is refused — including the operator. Issuing the
  first invites is a direct database operation until an invite surface lands. No
  console or CLI is added here.
- **Forward note on revocation.** The grant record carries a status but no
  separate revocation timestamp; a revoked status alone refuses, whatever the
  dates say. A later intent that expects a revocation timestamp will need to add
  the column. This is a boundary, not a defect: nothing in REQ-167 asks for it,
  and the refusal it would drive is already proven by the status.
- **Forward note on the account/business split.** REQ-167 landed the model in
  which an account is a tenant. DOC-40 §2 has since split those levels — an
  account is the payer and may own several businesses, each a tenant — and
  REQ-178 makes the resolved account a set rather than one. The criteria below
  are written as "an account the person may operate, resolved deterministically",
  which stays true on both sides of that change; the records this story creates
  are unchanged by it.

## Reconciliation Decisions

- **A person's own status gates admission** (decided at reconciliation,
  2026-09-10): REQ-167's login sequence lists four checks — person exists, stamp,
  membership, grant — and is silent on the person record's own status, although
  the record carries one. The landed code refuses a person whose record is not
  active, before their account is even resolved, because suspending one person
  must not require touching the account other people are living on. Formalized as
  an acceptance criterion; this is reconciliation completing the sequence the
  intent describes, not a new operator request.

- **The refusal is a forbidden, non-cacheable, non-indexable response** (decided
  at reconciliation, 2026-09-10): REQ-167 specifies what the deny page *says* and
  that it does not distinguish reasons, and is silent on its status and its cache
  behaviour. The landed code refuses as forbidden rather than unauthenticated —
  sending an already-proven caller back round the login loop would produce the
  same token and the same refusal forever — and marks the refusal as neither
  storable nor indexable, because one cached refusal would become everybody's
  answer including the entitled. Formalized as an acceptance criterion.

- **Provisioning refuses when the platform tenant is unconfigured** (decided at
  reconciliation, 2026-09-10): REQ-167 says people are created "in the platform
  tenant" and is silent on what happens when no platform tenant is configured.
  The landed code refuses, naming the missing configuration and where to set it,
  rather than defaulting — a defaulted value would write people into whichever
  account happened to carry that name. Formalized as an acceptance criterion,
  matching the refusal the site store already makes for the same reason.

- **The starter site's address is unique by construction** (decided at
  reconciliation, 2026-09-10): REQ-167 says the invite creates the account's
  starter site and leaves its address unstated; the implementation dialogue on
  the ticket flags the choice explicitly as open. Published addresses are claimed
  globally, so a shared starter address would work until the second account
  published and then be refused for a reason its owner could do nothing about.
  The criterion below states the property (no two accounts can collide) rather
  than the naming scheme, so a readable per-account address can replace it
  without falsifying the criterion.

## Dependencies

None. (Item 17 of this reconciliation — the access gate's verdict — depends on
this story, not the other way round.)

## Story Points

3

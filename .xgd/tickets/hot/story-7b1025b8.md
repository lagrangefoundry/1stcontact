---
uid: story-7b1025b8
id: STORY-146
type: story
title: 'Identity: the invite provisions the account, login binds it'
created_by: martin-github@westhead.me
created_at: '2026-09-11T06:26:38.441768+00:00'
updated_at: '2026-11-01T01:34:28.997823+00:00'
completed_at: null
last_field_updated: status
status: updated
fields:
  intent_uid: bundle-87be4669
  capability_uid: capability-e5939ceb
  story_kind: upgrade
  story_points: 3
---

## Story

**As** the operator onboarding a client onto the platform, **I want** an invite to
create the person, their first business and the grant that admits them to it — and
a login to bind a proven identity to that record, returning every business the
person operates, without creating anything — **so that** only people I have
actually invited can reach the builder, the access I promised for a period actually
ends when that period does, and one lapsed business never locks a person out of the
others they run.

## Description

Before this story, a proven email address was the whole of admission: the
platform verified an identity on every request and did nothing with it, so
whoever could pass the identity gate reached the builder, inside a single tenant.
This story is the record behind the address and the rule that reads it.

**An account operates several businesses, not one** (DOC-40 §2, REQ-178). The
*account* is the payer — the person. A *business* is the tenant, the unit of
storage isolation. A person may hold memberships in several businesses, and each
business carries its own grant.

**Two operations, deliberately asymmetric.**

*The invite provisions.* One operation creates the whole set: a person marked as
invited and not yet seen, then — through the same business-provisioning operation
any later business is created with — a business whose identifier is opaque, an
owner membership joining the person to it, an active grant of a plan for a period,
and the business's starter site so a person arriving for the first time finds
something to edit. The person is written first and on their own; the membership
and grant are written together, so no business ever exists that nobody may
operate or that carries no access. Re-inviting an address already known reports
the person and the first business they hold rather than failing on a uniqueness
constraint; an address differing only in case or surrounding whitespace is the
same person. A person whose record exists but who holds no live business — the
one partial state the two-step write can leave — is visibly refused at login, and
re-inviting them provisions a business for them without creating a second person.

*A second business is the same rows minus the person.* Provisioning a business
for an existing account writes a registered tenant carrying the business's name,
an owner membership, an active grant and a starter site — exactly the shape an
invite writes, because the invite goes through the same operation. A business
with no owning account or no name is refused before anything is written.

*Login binds and provisions nothing.* Every step is a lookup except the one
arrival stamp. A proven address with no person behind it is refused, not signed
up — self-signup is a later branch, and its absence here is the point. The
person-level checks come first and in order: an address must be present, a person
must exist behind it, and that person's own record must be active. Only then are
businesses looked at. Admission returns the deterministic, stably ordered set of
businesses the person holds a live membership in — each with its name and its own
effective grant (an active grant that has started and not ended; where several
cover the moment, the one preserving access longest). A business whose grant has
lapsed, not started or been revoked stays in the set, marked unselectable, so
"your grant expired" is never indistinguishable from "this business was deleted".
A business whose membership is withdrawn or expired is absent entirely, so a
former member is not told which businesses they used to reach. Being admitted is
a property of the person: they are refused only when no live membership remains
(no membership) or when none of their businesses holds an admitting grant (no
entitlement).

*One refusal, many reasons.* Every refused visitor is told the same thing in the
same way; which check failed is recorded for the operator rather than returned to
the caller, because naming the failed check is an account-existence oracle to
anyone who can pass a one-time PIN. The decision runs where the identity gate
runs, before any storage handle exists and before any path is examined.

**In scope**: the person / business / membership / grant records, provisioning at
invite and of an additional business for an existing account, the admission rule
and the set of businesses it returns, the arrival stamps, and the shape of the
refusal.

**Out of scope**: proving who the caller is, and the shape of the verdict the
identity gate hands onward — both belong to CAP-103; which business is selected
and where a returning operator lands (REQ-168); the endpoint that lists businesses
for the switcher (REQ-180) and the switcher itself (REQ-179); self-signup, trials,
subscriptions, discounts, a warning period, read-only access on expiry, and
time-boxed support memberships; and any operator console or CLI for issuing
invites or creating businesses.

## Technical Context

- Builds directly on **CAP-103 (Operator Access Gate)**, which proves the
  caller's identity and reports that verified identity onward. Admission is the
  second of the two checks and is this story's.
- A business is a tenant, the existing unit of storage isolation (CAP-101,
  CAP-81). Its identifier appears in storage keys and is permanent, which is why
  it must not be derived from anything a human chose. The human label is held
  separately as the tenant's name, where it can change, and is what admission
  reports for each business.
- **Admission carries no singular account or grant.** A successful admission
  carries the person and the list of businesses; there is no top-level account or
  entitlement beside it, so a caller cannot silently serve the first business to
  a person who selected the second. Which business is being operated is REQ-168's.
- **Invite results stay singular, deliberately.** An invite provisions one
  business, so it reports one business id; admission answers "which businesses
  may be operated", where a singular answer would be a guess.
- The starter site is created through the ordinary site-storage port, and the
  business's tenant is registered before its membership is written, so the store
  will serve it. A membership pointing at a business the registry does not know is
  dropped from admission rather than surfaced as an entry that fails when picked.
- **Access and money are separate.** A grant records a plan, a source, a status
  and a window; it records no pricing.
- **The grant model is deliberately open.** The store places no value constraint
  on a grant's plan or status and does not assume one grant per business.
- **Deploy ordering, recorded rather than solved.** Once admission is enforced,
  anyone without a person record is refused — including the operator. Issuing the
  first invites is a direct database operation until an invite surface lands.
- **Forward note on revocation.** The grant record carries a status but no
  separate revocation timestamp; a revoked status alone makes it non-admitting,
  whatever the dates say.
- **Vocabulary.** Earlier text calls the tenant people are held against the
  "platform tenant"; DOC-42 §2 names it the 1st Contact business. The behaviour is
  unchanged; `TENANT_ID` remains deployment configuration.

## Reconciliation Decisions

- **A person's own status gates admission** (decided at reconciliation,
  2026-09-10): the landed code refuses a person whose record is not active,
  before any business is looked at. Formalized as an acceptance criterion.

- **The refusal is a forbidden, non-cacheable, non-indexable response** (decided
  at reconciliation, 2026-09-10). Formalized as an acceptance criterion.

- **Provisioning refuses when the platform tenant is unconfigured** (decided at
  reconciliation, 2026-09-10). Formalized as an acceptance criterion.

- **The starter site's address is unique by construction** (decided at
  reconciliation, 2026-09-10). The criterion states the property, not the naming
  scheme.

- **Business provisioning refuses an empty owner or name before writing**
  (decided at reconciliation, 2026-10-31, BUNDLE-34): REQ-178 records these two
  refusals in its implementation notes but not in its acceptance list. Neither
  row can be repaired from outside once written, so refusing up front is folded
  into the shared-provisioning criterion.

- **The `no_entitlement` refusal is captured as landed in this bundle, and is
  known to be superseded later** (decided at reconciliation, 2026-10-31,
  BUNDLE-34): REQ-178's body carries a later amendment ("Reopened 2026-09-04",
  DOC-42) under which `no_entitlement` stops being a refusal — a person whose
  every business has lapsed is admitted with nothing selectable, and the refusal
  moves to business-scoped routes (a 403 with its own message). That amendment
  states that it lands as a *delta on top of* the REQ-178 commits, in later
  commits (the lapsed-session resolver/router work and a REQ-184 UAT move) that
  are **not** among BUNDLE-34's commits; this bundle carries only the original
  REQ-178 change (b1cafc80b7). AC-1750 therefore states the pre-amendment
  account-level refusal that the bundled code and UATs implement. When the
  amendment's commits reconcile, AC-1750 must be upgraded to "admitted, nothing
  selectable" and the every-lapsed UAT inverted. This is not flagged as a
  code-issue for this bundle, because satisfying it here would need resolver and
  router behaviour (REQ-180 / REQ-183 surface) that belongs to the amendment's own
  commits.

## Dependencies

None.

## Story Points

3
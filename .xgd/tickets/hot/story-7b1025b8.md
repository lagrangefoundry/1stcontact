---
uid: story-7b1025b8
id: STORY-146
type: story
title: 'Identity: the invite provisions the account, login binds it'
created_by: martin-github@westhead.me
created_at: '2026-09-11T06:26:38.441768+00:00'
updated_at: '2026-11-01T10:22:20.425175+00:00'
completed_at: null
last_field_updated: status
status: updated
fields:
  intent_uid: bundle-87be4669
  capability_uid: capability-e5939ceb
  story_kind: upgrade
  story_points: 3
  updated_by: bundle-94dbe947
---

## Story

**As** the operator onboarding a client onto the platform, **I want** an invite to
create the person, their first business and the grant that admits them to it — and
a login to bind a proven identity to that record, returning every business the
person operates, each saying whether it may be entered and, if not, why, without
creating anything — **so that** only people I have actually invited can reach the
builder, the access I promised for a period actually ends when that period does,
and a lapsed business never locks a person out of the others they run or out of
the explanation of what lapsed.

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
effective grant (an active per-business grant that has started and not ended;
where several cover the moment, the one preserving access longest). A business
whose membership is withdrawn or expired is absent entirely, so a former member
is not told which businesses they used to reach.

*Membership admits; entitlement does not* (DOC-42 §4–§5, REQ-178 reopen). The
person is refused only when no live membership remains. A business whose grant
has lapsed, not started or been revoked stays in the set, marked unselectable —
and a person whose **every** business has lapsed is still admitted, with nothing
selectable. Refusing them would remove the remedy with the access: they could not
see what lapsed, reach the page where they would pay, or reach their own data.
Refusing entry into a lapsed business is the business-scope gate's job, not the
door's.

*A lapse explains itself* (REQ-180 D4). Each unselectable business carries why:
`expired` (a grant covered it and has ended — with the date access ended, the
latest end where a grant was renewed), `revoked` (the grant was withdrawn),
`not_yet` (a grant is written and has not started), or `never_granted` (no grant
was ever made). A grant that has not started outranks one that has ended, because
that business's access is coming back. Selectability and the lapse come from one
answer, so a business is never unselectable without a reason or selectable with
one. The reason is computed only for businesses the person holds a live
membership on, so it is a fact about their own business and discloses nothing
about anybody else's.

*An entitlement has a subject and an object* (DOC-42 §6, REQ-184). Every grant
names the business it is against (the object) and may name an account (the
subject). Grants written by invite and by business provisioning name no account:
they are per-business capacity grants — "this business holds a plan" — so the
plan belongs to the business and not personally to whoever was invited first.
Only capacity grants decide whether a business may be entered; a grant naming an
account against a business does not make that business selectable for its
members, and such a business reports `never_granted`.

*One refusal, many reasons.* Every refused visitor is told the same thing in the
same way; which check failed is recorded for the operator rather than returned to
the caller, because naming the failed check is an account-existence oracle to
anyone who can pass a one-time PIN. The decision runs where the identity gate
runs, before any storage handle exists and before any path is examined. An
admitted person reaches the builder once they have also accepted the current
terms (REQ-169, the next check in the same place).

**In scope**: the person / business / membership / grant records (including the
grant's subject and object), provisioning at invite and of an additional business
for an existing account, the admission rule, the set of businesses it returns with
each one's selectability and lapse reason, the arrival stamps, and the shape of
the refusal.

**Out of scope**: proving who the caller is, and the shape of the verdict the
identity gate hands onward — both belong to CAP-103; which business is selected,
where a returning operator lands, and refusing a business-scoped request into a
lapsed business (REQ-168); the endpoint that lists businesses for the switcher and
the account surface that renders lapse reasons in words (REQ-180) and the switcher
itself (REQ-179); the terms interstitial and its gate (REQ-169); self-signup,
trials, subscriptions, discounts, a warning period, read-only access on expiry,
time-boxed support memberships, per-account grants as a product feature, and
anything that writes grants automatically; and any operator console or CLI for
issuing invites or creating businesses.

## Technical Context

- Builds directly on **CAP-103 (Operator Access Gate)**, which proves the
  caller's identity and reports that verified identity onward. Admission is the
  second of the checks and is this story's; terms acceptance (REQ-169) is the
  third, and business scope (REQ-168) follows.
- A business is a tenant, the existing unit of storage isolation (CAP-101,
  CAP-81). Its identifier appears in storage keys and is permanent, which is why
  it must not be derived from anything a human chose. The human label is held
  separately as the tenant's name, where it can change, and is what admission
  reports for each business.
- **Admission carries no singular account or grant.** A successful admission
  carries the person and the list of businesses; there is no top-level account or
  entitlement beside it, so a caller cannot silently serve the first business to
  a person who selected the second. A successful admission may hold no selectable
  business; callers must read each business's selectability rather than treat
  admission as a promise of access.
- **Invite results stay singular, deliberately.** An invite provisions one
  business, so it reports one business id; admission answers "which businesses
  may be operated", where a singular answer would be a guess.
- The starter site is created through the ordinary site-storage port, and the
  business's tenant is registered before its membership is written, so the store
  will serve it. A membership pointing at a business the registry does not know,
  or at a deactivated business, is dropped from admission rather than surfaced as
  an entry that fails when picked.
- **Access and money are separate.** A grant records a plan, a source, a status
  and a window; it records no pricing.
- **The grant model is deliberately open.** The store places no value constraint
  on a grant's plan or status and does not assume one grant per business.
- **Grant columns (REQ-184, migration 0006).** The entitlement's business column
  holds the object (a tenant id) and a nullable account column holds the subject;
  the membership's business column was renamed in the same migration so the two
  adjacent tables do not carry one name with opposite meanings. Existing grants
  migrated with no subject. The subject column is unindexed until something reads
  it.
- **The lapse reason is recovered, not recorded.** It is derived by re-reading the
  business's capacity grants without the covering filters, so a grant written by
  any path is explained and nothing must be kept in step at write time.
- **Deploy ordering, recorded rather than solved.** Once admission is enforced,
  anyone without a person record is refused — including the operator. Issuing the
  first invites is a direct database operation until an invite surface lands.
- **Forward note on revocation.** The grant record carries a status but no
  separate revocation timestamp; a revoked status alone makes it non-admitting,
  whatever the dates say, and a `revoked` lapse therefore carries no date.
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

- **The account-level `no_entitlement` refusal is superseded** (decided at
  reconciliation, 2026-11-01, BUNDLE-35). BUNDLE-34 captured it as landed and
  recorded that REQ-178's DOC-42 amendment would retract it in later commits.
  Those commits (REQ-224/REQ-225: fa0b857, cd6002e, merge a9f1021) are in this
  bundle and the amendment is restated by REQ-180 A2. AC-1750 is marked
  superseded by this bundle; its expiry-from-both-sides evidence is carried into
  the criterion that replaces it. `no_entitlement` remains an operator log reason
  when the business-scope resolver finds nothing to open; it never refuses
  admission.

- **The lapse order is not_yet, then expired, then revoked** (decided at
  reconciliation, 2026-11-01): REQ-180 D4 names the four reasons but not which
  wins when a business holds grants in several states. The code reports a pending
  grant over an ended one (access is coming back) and reports `revoked` only when
  no active grant explains the state. Formalized because it is the observable
  answer for a renewed-then-withdrawn history.

- **The platform-admin bypass is not covered by the membership-only lapse
  criterion** (decided at reconciliation, 2026-11-01): an administrator entering
  a business without a membership reads the same selectability and lapse as its
  owner, by design (REQ-180, DOC-40 §6). That bypass belongs to business scope
  (REQ-168), so this story's criterion is stated for the membership path.

## Dependencies

None.

## Story Points

3
---
uid: story-7b1025b8
id: STORY-146
type: story
title: 'Identity: the invite provisions the account, login binds it'
created_by: martin-github@westhead.me
created_at: '2026-09-11T06:26:38.441768+00:00'
updated_at: '2026-11-04T17:09:57.057073+00:00'
completed_at: null
last_field_updated: story_kind
status: updated
fields:
  intent_uid: bundle-87be4669
  capability_uid: capability-e5939ceb
  story_kind: upgrade
  story_points: 3
  updated_by: bundle-5052a63c
---

## Story

**As** the owner of a business on the platform, **I want** an invite to mark an
address as invited in the business I own — promoting a contact I already hold
rather than duplicating them, and writing no business, membership or grant — with
provisioning a business as a separate act that gives a person something to run,
and a login to bind a proven identity to that record, returning every business the
person operates, each saying whether it may be entered and, if not, why, without
creating anything — **so that** only people who have actually been invited can
reach the builder, the access promised for a period actually ends when that period
does, and a lapsed business never locks a person out of the others they run or out
of the explanation of what lapsed.

## Description

Before this story, a proven email address was the whole of admission: the
platform verified an identity on every request and did nothing with it, so
whoever could pass the identity gate reached the builder, inside a single tenant.
This story is the record behind the address and the rule that reads it.

**An account operates several businesses, not one** (DOC-40 §2, REQ-178). The
*account* is the payer and the owner of businesses, and since REQ-194 it is a
record of its own, distinct from the person. A *business* is the tenant, the unit
of storage isolation. A person may hold memberships in several businesses, and
each business carries its own grant.

**The account is a record, and people belong to it** (REQ-194, DOC-42 §6). Every
person names the account they belong to, and the storage refuses a person who
names none or names one that does not exist, so no reader has a missing case to
handle. Every path that makes a person makes an account alongside them: the
invite, and the break-glass operator seed. An account's key is opaque and reads
`acct_`. That prefix names accounts only: business keys read `biz_`. An account
may hold several people without any schema change. v1 creates exactly one person
per account and nothing adds a second, but when the two-person shape is built,
provisioning gives every person on the account an owner membership on the new
business, so all of them operate it. `memberships (person, business, role)` stays
as it was. It is the relation saying who may operate which of the account's
businesses, not ownership. Access restrictions are punted: the only role value
written is `owner`, and no access check tells people apart by role.

**A person's addresses are a table, not a column** (REQ-191). The person record
carries no address. A person holds as many addresses as they have, each stored
casefolded and trimmed, with one of them primary; the storage refuses a second
primary for the same person and refuses an address that is not in casefolded
form. Within a business an address reaches exactly one person; the same address
held by two businesses is two unrelated people, and nothing tells one business
that another knows it. Every surface that shows one address for a person shows
the primary. A person and their first address are written together, so no person
exists that no address can find.

**Three operations, deliberately asymmetric** (REQ-186, DOC-42 §9).

*The invite is a transition, not a creation.* Contacts and members are one
population, and the invite is the verb that moves a row across. An owner invites
an address into **the business they are in**: if that business already holds a
person at that address — a captured contact, or someone already invited — that
same row is marked invited; only when there is no such row is one inserted, active,
marked invited and not yet seen. The address is casefolded and trimmed on the way
in, so a differently-cased address is the same person. The invite matches a
person by **any** of the addresses the business holds for them, not only the
primary — inviting someone at their second address reaches the person their first
one reaches, creates no second person and adds no address. A newly inserted
person's address becomes their primary. A re-invite does not restamp when the
person was invited, and a name typed at the invite gives a person with no current
name their first one but never supersedes a name they already have. The result reports the person and
whether a row was **created** (inserted) rather than promoted, and the dialog says
which. Inviting from the 1st Contact business and inviting from a customer's
business are the same control writing the same row shape, differing only in the
business the row is held against; there is no level to branch on (DOC-42 §3).

*The invite writes no membership and no grant* (DOC-42 §4–§5). Membership is the
right to run a business, and the app is something a business provides; the
invite confers neither. An invited person who holds no business is therefore
refused at the door as having no membership — a visible, nameable state, not a
gap. **No mail is sent**: there is no sender, the person is admitted the next time
they pass the front door, and the invite dialog states that no message is sent.

*Who may invite.* Only an owner of the business the caller is scoped to (DOC-42 §7
condition 1 alone) — uniform, so a customer may invite into their own business.
It is **not** the fulfilment gate: being an owner of the 1st Contact business is
not required, and holding the platform-operator capability (entry without
membership) does not make anyone an owner and does not admit an invite. A
non-owner is refused 403; the dev-open loopback path, which carries no admission,
is refused; an invite with no address is a 400. The people list reports two
separate flags — may this caller invite, and may this caller provision businesses
— and each route asks its own question again for itself.

*Provisioning a business is the other half.* Provisioning a business for an
existing account (named by its account key) writes, together, a registered tenant
that carries the business's name and names the account that owns it, an owner
membership for every person on that account, and an active administrator-source
grant naming no account. This ensures no business exists that nobody may operate
or that carries no access. It also writes the business's starter site, `unnamed`.
Provisioning refuses an empty account key, an empty name, an account that does
not exist, and an account with nobody on it, all before anything is written. Invite **plus** provisioning is how a person gets the
app: the DOC-42 §1 sequence — invite Alice, provision her a business, Alice signs
in and reaches only her business and her own `/account` — runs end to end.

*Login binds and provisions nothing.* Every step is a lookup except the one
arrival stamp. Admission first requires the 1st Contact business's tenant to be
configured, refusing with a configuration error that names what is missing rather
than guessing. A proven address with no person behind it is refused, not signed
up — self-signup is a later branch, and its absence here is the point. The
person-level checks come first and in order: an address must be present, a person
must exist behind it — found through any of their addresses, with the admission
then carrying the person's primary address whichever one was presented — and that person's own record must be active. Only then are
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
subject). A subject, when present, is an account key (REQ-194), never a person's
id or an address. Grants written by business provisioning name no account: they are
per-business capacity grants — "this business holds a plan" — so the plan belongs
to the business and not personally to whoever was invited first. The invite writes
no grant at all. Only capacity grants decide whether a business may be entered; a
grant naming an account against a business does not make that business selectable
for its members, and such a business reports `never_granted`.

*One refusal, many reasons.* Every refused visitor is told the same thing in the
same way; which check failed is recorded for the operator rather than returned to
the caller, because naming the failed check is an account-existence oracle to
anyone who can pass a one-time PIN. The decision runs where the identity gate
runs, before any storage handle exists and before any path is examined. An
admitted person reaches the builder once they have also accepted the current
terms (REQ-169, the next check in the same place).

**In scope**: the account / person / business / membership / grant records
(including the person's account, the business's owning account, and the grant's
subject and object); the invite as an owner-gated, idempotent
contact→invited transition on one row, its route, its refusals and the invite
dialog's statement that no message is sent; the people list's separate
may-invite and may-provision flags; provisioning a business for an existing
account; the composition of the two in the DOC-42 §1 sequence; the admission rule
(including its refusal when the platform tenant is unconfigured), the set of
businesses it returns with each one's selectability and lapse reason, the arrival
stamps, and the shape of the refusal.

**Out of scope**: proving who the caller is, and the shape of the verdict the
identity gate hands onward — both belong to CAP-103; which business is selected,
where a returning operator lands, and refusing a business-scoped request into a
lapsed business (REQ-168); the endpoint that lists businesses for the switcher and
the account surface that renders lapse reasons in words (REQ-180) and the switcher
itself (REQ-179); the terms interstitial and its gate (REQ-169); the pipeline and
access axes of a contact and how the tab labels them (REQ-188); editing a person's
name or address (REQ-183 §5, BUG-54); sign-in for a member of a customer's
business (level-2 login — a separate change, REQ-186 *Not in scope*); delivering
an invitation by mail; phone-only contacts; self-signup, trials, subscriptions,
discounts, a warning period, read-only access on expiry, time-boxed support
memberships, per-account grants as a product feature, and anything that writes
grants automatically; and any CLI for issuing invites or creating businesses.

## Technical Context

- Builds directly on **CAP-103 (Operator Access Gate)**, which proves the
  caller's identity and reports that verified identity onward. Admission is the
  second of the checks and is this story's; terms acceptance (REQ-169) is the
  third, and business scope (REQ-168) follows.
- A business is a tenant, the existing unit of storage isolation (CAP-101,
  CAP-81). Its identifier appears in storage keys and is permanent, which is why
  it must not be derived from anything a human chose. Business keys are minted
  `biz_`; `acct_` is reserved for accounts (REQ-194). The human label is held
  separately as the tenant's name, where it can change, and is what admission
  reports for each business.
- **Admission carries no singular account or grant.** A successful admission
  carries the person and the list of businesses; there is no top-level account or
  entitlement beside it, so a caller cannot silently serve the first business to
  a person who selected the second. A successful admission may hold no selectable
  business; callers must read each business's selectability rather than treat
  admission as a promise of access.
- **The invite reports a person and `created`; business provisioning reports one
  business.** The two are separate calls and separate results; neither reports
  the other's rows.
- **Identity is decided by the address table (REQ-191).** `users` has no address
  column; `user_emails` holds `(tenant_id, email)` unique, casefolding enforced by
  a check constraint, and at most one `is_primary` row per person enforced by a
  partial unique index. The person key is opaque and global; the address is unique
  only within a business. The invite and admission resolve the person through any
  `user_emails` row in the business, read that person's row and update it in place
  (same id); the invite inserts the person and their primary address in one batch
  only when no row matches. Invite and login both casefold and trim before
  comparing. The primary shown is the flagged row, falling back to the oldest
  address when none is flagged. An entitlement names its subject by key, never by
  address, so an address change has one place to land.
- **The invite and provisioning are composed only by the operator.** The
  composite "invite provisions a business" operation no longer exists in
  production; tests compose the two shipped calls through a fixture.
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
  adjacent tables do not carry one name with opposite meanings. Since REQ-194 a
  non-null subject is an `accounts` key, and the subject column is indexed because
  the people detail pane now reads every grant naming one account.
- **The account record (REQ-194).** `accounts (id, tenant_id, name, status,
  created_at, updated_at, fields)` is scoped to the business it is an account
  *of*, like every identity row. `name` is the billing label: the invite seeds it
  from the display name typed at the invite, and it may be null.
  `users.account_id` is `NOT NULL` with a foreign key to `accounts`.
  `tenants.owner_account_id` names the owner and is null only for the platform
  business. That pair has no foreign key, because the two tables reference each
  other. The operator's add-a-business lookup resolves an address to the account
  that person belongs to, not to the person.
- **The lapse reason is recovered, not recorded.** It is derived by re-reading the
  business's capacity grants without the covering filters, so a grant written by
  any path is explained and nothing must be kept in step at write time.
- **Deploy ordering, recorded rather than solved.** Once admission is enforced,
  anyone without a person record is refused. The invite surface exists but
  requires an owner of the business, so it cannot bootstrap the first owner of
  the 1st Contact business; that bootstrap is outside this story.
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

- **The unconfigured-platform-tenant refusal lives at admission** (decided at
  reconciliation, 2026-09-10; moved 2026-11-01, BUNDLE-36). It was captured as a
  provisioning refusal; REQ-186 moves it onto admission explicitly, because the
  invite is scoped by its caller's business and needs no platform tenant of its
  own. AC-1745 restated accordingly.

- **The starter site's address is unique by construction** (decided at
  reconciliation, 2026-09-10). The criterion states the property, not the naming
  scheme.

- **Business provisioning refuses an empty owner or name before writing**
  (decided at reconciliation, 2026-10-31, BUNDLE-34): REQ-178 records these two
  refusals in its implementation notes but not in its acceptance list. Neither
  row can be repaired from outside once written, so refusing up front is folded
  into the business-provisioning criterion (now AC-1742, since AC-2078, which
  held it, is superseded — see below).

- **The composite invite is superseded by REQ-186** (decided at reconciliation,
  2026-11-01, BUNDLE-36). REQ-186 states that the invite-that-provisions is
  decomposed into the invite and *Provision a business* and that the composite
  is deleted from production. AC-1740 (invite creates person + business +
  membership + grant), AC-2078 (invite and additional-business provisioning go
  through one operation) and AC-2079 (re-inviting a person with no business
  provisions one) are marked superseded by this bundle. Their surviving evidence
  is carried forward: the business-provisioning shape and its empty owner/name
  refusals into AC-1742; the `no_membership` refusal of a person holding no
  business into the criterion that the invite writes no membership or grant.

- **The invite's 200 response carries the outcome itself** (decided at
  reconciliation, 2026-11-01, BUNDLE-36): REQ-186 says the result reports
  `created` and the dialog says which branch ran, but not the response shape.
  The route answers with the person and the `created` flag, and the dialog
  reports a newly added person differently from one already known. Formalized in
  the promotion and dialog criteria.

- **The dev-open loopback refusal is a 403** (decided at reconciliation,
  2026-11-01, BUNDLE-36): REQ-186 requires the loopback path to be refused
  without naming a status. The landed route refuses any caller who is not an
  owner of the scoped business — a loopback caller carries no admission and so
  owns nothing — with the same 403. Formalized in the who-may-invite criterion.

- **The pipeline stage the invite writes is not restated here** (decided at
  reconciliation, 2026-11-01, BUNDLE-36): the landed invite also assigns the
  contact's pipeline stage `invited` (REQ-188), and the invite dialog's wording
  about becoming a member on signing up is REQ-188's. Those belong to the contact
  axes criteria; this story asserts only the transition on one row, the
  invitation stamp, and that no message is sent.

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

- **Addresses are a table** (decided at reconciliation, 2026-11-04, BUNDLE-37).
  REQ-191 replaces the address column with `user_emails`. AC-1744 is sharpened to
  say the schema, not a convention, stores the casefolded form; two new criteria
  pin the table's shape and resolution through any address (including an invite
  at a secondary address). AC-2171 is restated in terms of name rows (REQ-193):
  the invite never supersedes an existing current name.

- **"Exactly one primary" is enforced as "at most one"** (decided at
  reconciliation, 2026-11-04). REQ-191's acceptance says exactly one primary
  enforced by a constraint; its *What landed* section records that the partial
  unique index enforces at most one, because a contact holding no address (the
  phone-only shape) has zero, and that a person with addresses but no flagged
  primary shows the oldest. Formalized that way: the constraint refuses a second
  primary, and every writer in the product writes a person's first address as
  primary.

- **Admission presents the primary address** (decided at reconciliation,
  2026-11-04). REQ-191 *What landed*: resolution matches any address and the
  admission carries the primary, so a person sees one identity whichever address
  they typed. Formalized in the resolution criterion.

- **A person and their first address are one write** (decided at reconciliation,
  2026-11-04). REQ-191 *What landed*: the invite writes the person and their first
  address in one batch, so a person no address can find is never left behind.
  Formalized in the address-table criterion.

- **The account is a table** (decided at reconciliation, 2026-11-04, BUNDLE-37).
  REQ-194 adds `accounts`, and the landed code matches its acceptance list. AC-1741
  now says a business key is distinct from its owning account's key. AC-2115 now
  says a non-null subject is an account key, while the capacity grant keeps its
  null subject. AC-1742 now says the business names its owning account and is
  addressed by its own key. Three new criteria cover: the invite minting an
  account, with the schema refusing a person with none; several people on one
  account all operating its businesses; and no permission check reading role.

- **"No permission check reads role" means no check beyond the one ownership
  question** (decided at reconciliation, 2026-11-04). REQ-194's acceptance says
  "no permission check anywhere reads `role`", but its body scopes this to *access
  restrictions*: "no role vocabulary beyond the `'owner'` the `role` column already
  holds, no RBAC". REQ-185/REQ-186's ownership question ("is this person an owner
  of this business"), which gates the invite and fulfilment, predates REQ-194, and
  REQ-194 keeps it. The landed code has exactly one reader of the role, that
  ownership predicate, and writes no value but `owner`. Formalized that way. This
  is not flagged as a contradiction, because REQ-194 explicitly keeps `owner` as
  the foothold.

- **The invite seeds the account's billing name from the display name** (decided
  at reconciliation, 2026-11-04). REQ-194 is silent on how `accounts.name` is
  filled. The code copies the display name typed at the invite and leaves it null
  otherwise. Nothing reads it yet. This is recorded here and is not a separate
  criterion.

- **The starter site is `unnamed`, not `home`** (decided at reconciliation,
  2026-11-04). REQ-190's *What landed* names the starter slug `unnamed`, the code
  agrees, and the criterion says so.

## Dependencies

None.

## Story Points

3
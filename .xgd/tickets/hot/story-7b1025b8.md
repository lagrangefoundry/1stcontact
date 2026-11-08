---
uid: story-7b1025b8
id: STORY-146
type: story
title: 'Identity: add records a Lead, the invite mails a selection, provisioning gives
  a business, login binds it'
created_by: martin-github@westhead.me
created_at: '2026-09-11T06:26:38.441768+00:00'
updated_at: '2026-11-08T01:42:26.856682+00:00'
completed_at: null
last_field_updated: story_kind
status: updated
fields:
  intent_uid: bundle-87be4669
  capability_uid: capability-e5939ceb
  story_kind: upgrade
  story_points: 3
  updated_by: bundle-7988e925
---

## Story

**As** the owner of a business on the platform, **I want** to add a contact as a
Lead without anybody being told — finding the person I already hold rather than
duplicating them — and, as a separate act, to invite a selection of my contacts by
mail, each receiving their own message at their primary address, with the invite
moving them to Invited and writing no business, membership or grant; with
provisioning a business as a separate act that gives a person something to run,
and a login to bind a proven identity to that record, returning every business the
person operates, each saying whether it may be entered and, if not, why, without
creating anything — **so that** recording somebody never emails them, inviting
never discloses one contact's address to another, only people who have actually
been invited can reach the builder, the access promised for a period actually ends
when that period does, and a lapsed business never locks a person out of the
others they run or out of the explanation of what lapsed.

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
handle. Every path that makes a person makes an account alongside them: the add,
and the break-glass operator seed. An account's key is opaque and reads `acct_`.
That prefix names accounts only: business keys read `biz_`. An account may hold
several people without any schema change. v1 creates exactly one person per
account and nothing adds a second, but when the two-person shape is built,
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

**Four operations, deliberately asymmetric** (REQ-186, REQ-199, DOC-42 §9).

*Add is the fundamental act, and it sends nothing* (REQ-199). Most contacts are
never invited at all, so recording somebody is its own act. The Contacts tab's `+`
control opens a dialog taking an address and an optional name, which states that
nothing is sent and that the contact is recorded as a lead. An owner adds an
address into **the business they are in**: if that business already holds a
person at that address — through **any** of the addresses it holds for them, not
only the primary — that person is reported and nothing is written (no second
person, no added address, no event); only when there is no such row is one
inserted, active, at pipeline stage **Lead**, with no invitation stamp, its
address as primary, and an account minted alongside it. The address is casefolded
and trimmed on the way in, so a differently-cased address is the same person. A
name typed at the add gives a person with no current name their first one but
never supersedes a name they already have. The result reports the person and
whether a row was **created**, and the dialog says which and stays open for the
next add. Adding a contact never hands anything to the mail port.

*The invite is a transition on existing contacts, and it sends mail* (REQ-199,
superseding REQ-186's "no mail is sent"). Every row of the Contacts tab carries a
checkbox, and **Invite** acts on the checked set: it is disabled — not hidden —
while nothing is checked. Adding and inviting are two routes and neither takes a
flag selecting the other's behaviour. The invite takes contact ids, never an
address, and cannot create anybody; an id naming nobody in the scoped business is
answered 404, the same whether it does not exist or belongs to another business,
and an empty selection is refused 400. The invite modal is laid out as a message:
**From** is the deployment's sending address shown as text and not editable (a
`from` in the request is ignored, because an arbitrary sender fails DKIM);
**Subject** and **Body** are prefilled from the business's `invite` template —
seeded with the default when the business has never had one — and editable for
this send only, never written back to the template; **To-List** lists the selected
addresses one per line, labelled `To-List:` with a hover explaining that each
contact receives their own message and nobody is shown anybody else's address; and
the button reads `Send N`. An edited body is held to the template's declared
tokens, so one that has dropped `{{cta_url}}` is refused and nothing is sent. The
send is one message per contact, each with exactly one recipient, sent one after
another. Each goes to the contact's **primary** address only; a contact with no
primary address is refused by name and nothing is attempted for them, while the
rest of the selection still sends. The response carries one result per contact —
`sent`, `failed` (the provider refused it), or `refused` — and the modal shows a
line for each. A sent or failed invite moves the contact's pipeline Lead → Invited
(REQ-188, STORY-165); a re-invite does not restamp when the person was invited.
Inviting from the 1st Contact business and inviting from a customer's business are
the same control writing the same row shape, differing only in the business the
row is held against; there is no level to branch on (DOC-42 §3).

*Neither the add nor the invite writes a membership or a grant* (DOC-42 §4–§5).
Membership is the right to run a business, and the app is something a business
provides; neither act confers either. An invited person therefore holds no
business, and their admitted set is **empty** (REQ-203, superseding REQ-186's
"invited and no more is `no_membership`"): they are admitted to the terms gate,
which opens nothing else, and accepting the terms is what provisions their first
business (STORY-161).

*Who may add and invite.* Only an owner of the business the caller is scoped to
(DOC-42 §7 condition 1 alone) — uniform, so a customer may add and invite into
their own business. The same gate covers the add, the invite draft and the invite
send. It is **not** the fulfilment gate: being an owner of the 1st Contact
business is not required, and holding the platform-operator capability (entry
without membership) does not make anyone an owner. A non-owner is refused 403; the
dev-open loopback path, which carries no admission, is refused; an add with no
address is a 400. The `+` and Invite controls are shown only when the people list
reports the caller may invite. The people list reports two separate flags — may
this caller invite, and may this caller provision businesses — and each route asks
its own question again for itself.

*Provisioning a business is the other half.* Provisioning a business for an
existing account (named by its account key) writes, together, a registered tenant
that carries the business's name and names the account that owns it, an owner
membership for every person on that account, and an active administrator-source
grant naming no account. This ensures no business exists that nobody may operate
or that carries no access. It also writes the business's starter site, `unnamed`.
Provisioning refuses an empty account key, an empty name, an account that does
not exist, and an account with nobody on it, all before anything is written.
Invite **plus** provisioning is how a person gets the app: the DOC-42 §1 sequence
— invite Alice, provision her a business, Alice signs in and reaches only her
business and her own `/account` — runs end to end.

*Login binds and provisions nothing.* Every step is a lookup except the one
arrival stamp. Admission first requires the 1st Contact business's tenant to be
configured, refusing with a configuration error that names what is missing rather
than guessing. A proven address with no person behind it is refused, not signed
up — self-signup is a later branch, and its absence here is the point. The
person-level checks come first and in order: an address must be present, a person
must exist behind it — found through any of their addresses, with the admission
then carrying the person's primary address whichever one was presented — and that
person's own record must be active. Only then are businesses looked at. Admission
returns the deterministic, stably ordered set of businesses the person holds a
live membership in — each with its name and its own effective grant (an active
per-business grant that has started and not ended; where several cover the
moment, the one preserving access longest). A business whose membership is
withdrawn or expired is absent entirely, so a former member is not told which
businesses they used to reach.

*Signing up is admitted* (REQ-203). A person holding no live membership is
nonetheless admitted, with no businesses, when **both** hold: they have not signed
up (no terms acceptance is recorded — the access axis, not the pipeline stage, so
a Lead nobody invited is treated identically) **and** their account owns no
business. This admission opens no route: the terms gate runs next and refuses an
unaccepted session everything but the interstitial and the accept route, and
admission is still bounded by there being a person record at all, so self-signup
stays absent. The second condition is what keeps every refusal that should survive:
a person whose membership was withdrawn or expired, or whose membership rows were
lost, has an account that already owns a business and is refused `no_membership`
exactly as before; so is a person who has accepted the terms and still holds
nothing. Re-inviting remains the repair. The ownership question is one shared
definition, asked both here and by the provisioning hook on acceptance, so the door
opens exactly when acceptance has something to give.

*Membership admits; entitlement does not* (DOC-42 §4–§5, REQ-178 reopen). Apart
from signing up, the person is refused only when no live membership remains. A business whose grant
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
subject). REQ-194 intends a subject, when present, to be an account key, never a
person's id or an address. Grants are read back by account key, so a subject that
is not one is never found under anybody's account; the write path does not yet
refuse such a subject (see the CODE-ISSUE under Reconciliation Decisions). Grants
written by business provisioning name no account: they are per-business capacity
grants — "this business holds a plan" — so the plan belongs to the business and
not personally to whoever was invited first. Neither the add nor the invite writes
a grant. Only capacity grants decide whether a business may be entered; a grant
naming an account against a business does not make that business selectable for
its members, and such a business reports `never_granted`.

*One refusal, many reasons* (BUG-62). Every refused visitor is told the same thing
in the same way — *"1st Contact cannot open this for you at the moment. Please get
in touch and we will sort it out."* — a sentence true of every reason that claims
nothing ended and names no check, and that is also true of the scope refusal of an
admitted caller naming a business that is not theirs, so the two stay
byte-identical. Which check failed is recorded for the operator rather than
returned to the caller, because naming the failed check is an account-existence
oracle to anyone who can pass a one-time PIN. Admission writes that record itself,
once, as a structured `admission_denied` line carrying the reason, the attempted
address, and whether this deployment's break-glass operator list names that address
(`platformAdminSeed`), so a misconfigured operator list is diagnosable from the
Worker's output alone; the code rendering the refusal only renders it. The decision runs where the identity gate
runs, before any storage handle exists and before any path is examined. An
admitted person reaches the builder once they have also accepted the current
terms (REQ-169, the next check in the same place).

**In scope**: the account / person / business / membership / grant records
(including the person's account, the business's owning account, and the grant's
subject and object); the add as an owner-gated, idempotent creation of a Lead that
sends nothing, its route, its refusals and its dialog; the invite as an
owner-gated act on a checked selection of existing contacts — its draft, its
modal, one message per contact to the primary address, per-send copy held to the
template's declared tokens, per-contact refusals and outcomes, and its routes; the
people list's separate may-invite and may-provision flags; provisioning a business
for an existing account; the composition of the invite and provisioning in the
DOC-42 §1 sequence; the admission rule (including its refusal when the platform
tenant is unconfigured, and its admission of a contact who is signing up), the set of businesses it returns with each one's
selectability and lapse reason, the arrival stamps, and the shape of the refusal.

**Out of scope**: proving who the caller is, and the shape of the verdict the
identity gate hands onward — both belong to CAP-103; which business is selected,
where a returning operator lands, and refusing a business-scoped request into a
lapsed business (REQ-168); the endpoint that lists businesses for the switcher and
the account surface that renders lapse reasons in words (REQ-180) and the switcher
itself (REQ-179); the terms interstitial and its gate (REQ-169), and the business
provisioned when the terms are accepted (REQ-203, STORY-161); the pipeline and
access axes of a contact and how the tab labels them (REQ-188, STORY-165); the
template store and its token declarations (REQ-197); the mail port (REQ-196); the
message record, the detail pane's message list and the bounced-address marker
(REQ-198); what the invite's `{{cta_url}}` link is and how it is redeemed
(REQ-202); editing a person's name or address (REQ-183 §5, BUG-54); sign-in for a
member of a customer's business (level-2 login — a separate change, REQ-186 *Not
in scope*); address management UI, template editing, per-recipient
personalisation beyond the template's own tokens, a re-send control, and import,
CSV or bulk add (REQ-199 *What this does not do*); phone-only contacts;
self-signup, trials, subscriptions, discounts, a warning period, read-only access
on expiry, time-boxed support memberships, per-account grants as a product
feature, and anything that writes grants automatically; and any CLI for issuing
invites or creating businesses.

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
- **The routes (REQ-199).** `POST /api/people/add` takes an address and an
  optional display name and answers the person and `created`.
  `GET /api/people/invite` answers the modal's draft: from, subject, body, the
  template's declared tokens and the template's key and uid. `POST
  /api/people/invite` takes `ids` and optionally `subject` and `body` (the edited
  copy is used only when both are present) and answers `{results}`, one per id in
  order, each with the contact id, who (display name, else address, else id), the
  address it went to, status, reason, the message record and the moved person.
  Provisioning reports one business. Each is a separate call and none reports
  another's rows.
- **The invite composition has one home.** The template copy, the mail port, the
  message record (REQ-198) and the pipeline transition meet in one module, and the
  mail port is passed in and never imported, which keeps REQ-196's falsifier — a
  code path where running the tests can send mail — closed. The add imports
  nothing that can send. The copy is resolved once per send, before the loop.
- **Error mapping.** An empty add address and a refused template are 400; an id
  naming nobody in the business is 404; an undeliverable deployment (no sending
  address, no session cookie configured) is 503. Because the send is sequential,
  an unknown id after a known one stops the send at that point with 404, after the
  earlier contacts have already been sent to.
- **Identity is decided by the address table (REQ-191).** `users` has no address
  column; `user_emails` holds `(tenant_id, email)` unique, casefolding enforced by
  a check constraint, and at most one `is_primary` row per person enforced by a
  partial unique index. The person key is opaque and global; the address is unique
  only within a business. The add and admission resolve the person through any
  `user_emails` row in the business; the add inserts the person, their account,
  their primary address and the `contact.created` (`via: 'add'`) event in one batch
  only when no row matches. Add and login both casefold and trim before comparing.
  The primary shown is the flagged row, falling back to the oldest address when
  none is flagged — but the invite sends only to the flagged row and never falls
  back. An entitlement names its subject by key, never by address, so an address
  change has one place to land.
- **The invite and provisioning are composed only by the operator.** The
  composite "invite provisions a business" operation no longer exists in
  production; tests compose the shipped calls through a fixture, which adds rather
  than invites.
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
  adjacent tables do not carry one name with opposite meanings. Since REQ-194 the
  subject is meant to be an `accounts` key and is read back as one; the column has
  no foreign key and `openGrant` writes whatever subject it is given. The subject
  column is indexed because the people detail pane reads every grant naming one
  account.
- **The account record (REQ-194).** `accounts (id, tenant_id, name, status,
  created_at, updated_at, fields)` is scoped to the business it is an account
  *of*, like every identity row. `name` is the billing label: the add seeds it
  from the display name typed there, and it may be null. `users.account_id` is
  `NOT NULL` with a foreign key to `accounts`. `tenants.owner_account_id` names the
  owner and is null only for the platform business. That pair has no foreign key,
  because the two tables reference each other. The operator's add-a-business
  lookup resolves an address to the account that person belongs to, not to the
  person.
- **The lapse reason is recovered, not recorded.** It is derived by re-reading the
  business's capacity grants without the covering filters, so a grant written by
  any path is explained and nothing must be kept in step at write time.
- **The denial log lives in admission (BUG-62).** Each refusing return in `admit`
  goes through one helper that writes
  `console.warn(JSON.stringify({ event: 'admission_denied', reason, email,
  platformAdminSeed }))` and returns the refusal; `index.ts`'s `denied()` takes no
  admission and only builds the 403, so a second caller of admission, or a new
  refusal reason, cannot be silent and one refusal is never two lines.
  `no_entitlement` no longer refuses admission, so it is logged by `index.ts` as
  `no_business` where its consequence is, not as a denial.
- **The signing-up predicate (REQ-203).** `admit` evaluates it only when the
  resolved business set is empty: `tos_accepted_at` null (the cheap half, already in
  hand) and `accountOwnsBusiness(users.account_id)` false — `tenants` filtered on
  `owner_account_id`, whose null for the platform business matches nobody. The same
  exported function is the guard in `onboarding.ts`.
- **Deploy ordering, recorded rather than solved.** Once admission is enforced,
  anyone without a person record is refused. The add and invite surfaces exist but
  require an owner of the business, so they cannot bootstrap the first owner of
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
  Since REQ-199 (below) that `created` report belongs to the add.

- **The dev-open loopback refusal is a 403** (decided at reconciliation,
  2026-11-01, BUNDLE-36): REQ-186 requires the loopback path to be refused
  without naming a status. The landed route refuses any caller who is not an
  owner of the scoped business — a loopback caller carries no admission and so
  owns nothing — with the same 403. Formalized in the who-may-invite criterion,
  which since REQ-199 covers the add and the invite draft as well.

- **The pipeline stage the invite writes is not restated here** (decided at
  reconciliation, 2026-11-01, BUNDLE-36): the invite's effect on the pipeline and
  access axes (REQ-188) belongs to STORY-165's criteria; this story asserts only
  the act on existing rows, the invitation stamp, and the add's Lead.

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
  pin the table's shape and resolution through any address. AC-2171 is restated in
  terms of name rows (REQ-193): a name typed at creation never supersedes an
  existing current name.

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
  2026-11-04). REQ-191 *What landed*. Since REQ-199 the writer is the add.
  Formalized in the address-table criterion.

- **The account is a table** (decided at reconciliation, 2026-11-04, BUNDLE-37).
  REQ-194 adds `accounts`, and the landed code matches its acceptance list. AC-1741
  now says a business key is distinct from its owning account's key. AC-2115 now
  says grants are read back by account key, while the capacity grant keeps its
  null subject (restated again below, under the CODE-ISSUE). AC-1742 now says the
  business names its owning account and is addressed by its own key. Three new
  criteria cover: the creation of a person minting an account, with the schema
  refusing a person with none; several people on one account all operating its
  businesses; and no permission check reading role.

- **"No permission check reads role" means no check beyond the one ownership
  question** (decided at reconciliation, 2026-11-04). REQ-194's acceptance says
  "no permission check anywhere reads `role`", but its body scopes this to *access
  restrictions*: "no role vocabulary beyond the `'owner'` the `role` column already
  holds, no RBAC". REQ-185/REQ-186's ownership question ("is this person an owner
  of this business"), which gates the add, the invite and fulfilment, predates
  REQ-194, and REQ-194 keeps it. The landed code has exactly one reader of the
  role, that ownership predicate, and writes no value but `owner`. Formalized that
  way. This is not flagged as a contradiction, because REQ-194 explicitly keeps
  `owner` as the foothold.

- **The add seeds the account's billing name from the display name** (decided at
  reconciliation, 2026-11-04; moved from the invite 2026-11-06). REQ-194 is silent
  on how `accounts.name` is filled. The code copies the display name typed at the
  add and leaves it null otherwise. Nothing reads it yet. This is recorded here and
  is not a separate criterion.

- **The starter site is `unnamed`, not `home`** (decided at reconciliation,
  2026-11-04). REQ-190's *What landed* names the starter slug `unnamed`, the code
  agrees, and the criterion says so.

- **CODE-ISSUE — a grant's subject is not checked to be a real account** (raised at
  reconciliation review, BUNDLE-37, 2026-11-04). REQ-194 says "`entitlements.account_id`
  names a real account". Nothing enforces it. The column has no foreign key in
  `0001_baseline.sql`, `openGrant` (`apps/control-app/src/people.ts`) writes
  `spec.accountId` without looking it up, and `POST /api/grants` forwards any string.
  A grant whose subject is a person's id, or any other string, is stored without
  complaint. The intent is unmet on the write side, and this is recorded as an intent
  gap against REQ-194 rather than presented as behaviour. What the code does guarantee
  is the read side: grants are listed by account key, so a mis-subjected grant is
  never found under any person's account and confers nothing through it. AC-2115 is
  restated to claim exactly that and no more. The fix, when it is taken, is a lookup
  (or foreign key) before the write and a refusal for an unknown account. It is not
  made here, because reconciliation documents behaviour and does not change it.

- **Add and invite are two acts; the invite sends mail** (decided at
  reconciliation, 2026-11-06, BUNDLE-38). REQ-199 explicitly replaces REQ-186's
  insert-or-update invite that sent nothing. AC-2175 (the invite dialog takes an
  address and states that no message is sent) is marked superseded by this bundle;
  its owner-only visibility and created-vs-known reporting are carried into the
  add criterion (AC-2336). AC-2169 now says the invite acts only on existing
  contacts by id. AC-2172's owner gate now covers the add and both invite routes.
  The find-or-insert properties that used to be the invite's — known address
  creates nothing (AC-1743), casefolding (AC-1744), any-address resolution
  (AC-2248), fill-in-never-overwrite naming (AC-2171) and minting an account
  (AC-2253) — are restated against the add, which is where the code now does them
  and where REQ-199 puts creation. Four new criteria cover the add act, the
  selection-driven invite modal, per-send copy held to declared tokens, and
  primary-only addressing with per-contact outcomes.

- **An id naming nobody in the business is 404, not a per-contact refusal**
  (decided at reconciliation, 2026-11-06). REQ-199 is silent on it. The route
  answers 404 with one sentence whether the id does not exist or belongs to
  another business, which keeps the route from being an existence oracle.
  Formalized in AC-2169. Because the send is sequential, contacts before the
  unknown id have already been sent to; recorded here and not as a criterion.

- **An edited copy is used only when both Subject and Body arrive** (decided at
  reconciliation, 2026-11-06). REQ-199 is silent on a half-sent form. The code
  falls back to the template's own copy rather than mixing the operator's half
  with the template's. Formalized in AC-2338.

- **Out-of-plan intent kept elsewhere** (decided at reconciliation, 2026-11-06).
  REQ-199's detail-pane message list, bounced-address marker and change-journal
  row belong to the message record (REQ-198); its `{{cta_url}}`-as-origin wording
  is superseded within this bundle by REQ-202's per-contact redeemable link, and
  the refusal of a contact who cannot sign in is REQ-202's. None is restated here.

- **CODE-ISSUE — the selection is cleared even when nothing was sent** (raised at
  reconciliation, 2026-11-06, BUNDLE-38). REQ-199 *What the shape forced*: "the
  selection clears only once something was sent", and *Further acceptance*: "the
  selection survives a send in which nothing was sent". The Contacts panel clears
  the selection after every answered send, including one in which every result is
  `refused`, so an operator whose whole selection was refused has to re-tick it.
  AC-2339 states the intent (the selection survives); `fix_uat_coverage` should
  make the panel clear the selection only when at least one result is `sent`.

- **An invitee holding nothing is admitted, not refused** (decided at
  reconciliation, 2026-11-07, BUNDLE-38). REQ-203 names and overturns REQ-186's
  "invited and no more is `no_membership`". AC-2173, which carried that claim
  (and had been rewritten mid-cycle to the new behaviour), is marked superseded by
  this bundle; its surviving half — the invite writes no membership or grant, so
  the admitted set is empty — is restated in the new admission criterion
  (AC-2340) together with the refusals that survive. AC-2079 stays superseded.
- **The refusal is truthful and logged where decided** (decided at reconciliation,
  2026-11-07, BUNDLE-38). BUG-62 rewords the single message and moves its log line
  into admission. AC-1758 now pins the sentence, that it claims no ending and names
  no reason, and that the scope refusal shares it. AC-1759 now pins one structured
  line per refusal at the point of decision with `platformAdminSeed`, and four
  admission reasons rather than five (no eligible grant is logged separately and
  does not refuse admission).
- **`platformAdminSeed` is in the log line** (decided at reconciliation,
  2026-11-07). BUG-62's acceptance asks that a misconfigured `PLATFORM_ADMINS` be
  diagnosable from the Worker's output alone; its *Additions to scope* adds the
  boolean as the consequence. Formalized in AC-1759.
- **An emailless identity is refused only when nothing maps it to a person**
  (recorded at reconciliation, 2026-11-07, BUNDLE-39). BUG-59 gives a service
  token a person to be: the gate's branch resolves its machine name through the
  deployment's `SERVICE_TOKEN_IDENTITIES` to that person's address *before*
  admission is asked, so admission still answers only "may this address in" and
  has no second question about tokens. AC-1755 is narrowed accordingly — the
  `no_email` refusal now covers an emailless identity with no mapping (unmapped,
  or the mapping empty), which is the same refusal from the same place as
  before. A mapped token reaches admission as an ordinary address and meets
  every rule here unchanged, including `no_user` for an address with no person.
  The mapping and its rules are STORY-120's (AC-2358 to AC-2360).

## Dependencies

None.

## Story Points

3
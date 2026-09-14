---
uid: request-37ac28bf
id: REQ-245
type: request
title: The portal shows and changes a contact's preferences
created_by: EPIC-10
created_at: '2026-09-13T22:03:11.191085+00:00'
updated_at: '2026-09-14T03:16:47.964667+00:00'
completed_at: null
last_field_updated: status
status: free_coded
fields:
  priority: medium
  depends_on:
  - request-a4186018
  epic_parent: epic-d6d7ea63
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-ab815b3d
  commits:
  - working_sha: 37c4036bc7a7601348477bffd2a45e6de7022321
    reconcile_sha: null
    main_sha: null
  - working_sha: 0382acab5e52f5102904d331c767d16f66dd0e90
    reconcile_sha: null
    main_sha: null
  - working_sha: b735ee465a2008d52d781078411f9d3c809ec157
    reconcile_sha: null
    main_sha: null
  version: 0.2.195
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

## 6. What was built

### 6.1 Turning an acceptance on IS writing its definition

§3 says there is no second list. So there is none: `definitionsFor` reads every
`acceptance` ticket in the business's own store, keeps the newest per key
([[REQ-240]] §3's rule applied to the whole set rather than one key at a time), and that
set — in registry order — is what the portal shows. A business turns a preference on by
authoring its definition and off by not having one; there is no enabled-keys table, no
config roster and no default.

The ticket's **title** is what the contact sees the acceptance called, and its **body** is
the wording — the sentence beside the control. `acceptanceLabel` is the OPERATOR's phrase
for a key, one per platform; this is the business's own words, changeable without a deploy,
which is the whole reason [[REQ-240]] made the definition a ticket.

**Nothing is seeded.** [[REQ-240]] seeds the two document keys because the first sign-up
must not fail for want of copy nobody knew they had to write; a preference has no such
moment. Seeding one would turn a mailing-list question on for every business that never
asked for it, which is the opposite of "a business turns it on".

A definition carrying a key the registry does not declare is dropped rather than drawn: the
store's own enum refuses to author one, so that case is a registry that shrank under a
ticket which outlived it, and such a row has no honest control state to be in.

### 6.2 The payload says `editable` and `historic`, never a type name

Each row carries `key`, `label`, `wording`, `editable`, `historic`, `granted`, `since` and
`outstanding`. Two of those are the whole of §2's "property of the type rather than of the
markup":

- **`editable`** is `isRevocable(key)` — true of a preference and of nothing else. It is
  what decides whether a row carries a control, computed by the acceptance layer and read
  by the surface.
- **`historic`** is `holdsState(key)` inverted — true of a request and of nothing else. It
  is what decides the tense.

The module therefore names no key and no type. A key added to the registry tomorrow, or a
business's own custom key later, is drawn correctly with nothing in the module edited — and
a UAT asserts that neither the module's contract nor its client contains any registry key
or type name at all.

`wording` is sent only for editable rows, because that is the only place the contact is
being asked something. A document's body is the document, and a portal is not where
somebody reads their terms.

`granted` is nullable and null is its own fact: nobody put the question, which is not a
refusal and is not drawn as one. `outstanding` is [[REQ-240]]'s `documentOutstanding` —
they agreed, and the business has published a newer document since — so the surface can
avoid saying "Agreed" about somebody who now owes a fresh one.

### 6.3 One endpoint, two verbs, and what each refuses

`GET/POST /api/acceptances`. It answers about the business the caller is a **contact of**
(`admission.user.tenant_id`) rather than the one they are operating, which is the same
expression the portal page itself uses — so a wholly lapsed account reaches it, and no
second implementation is needed when the portal moves origins. It requires an admission and
not a scope: there is no contact on the dev-open path, so that answers 404.

The write is `setPreference`, and its refusals are facts about the model rather than
validation preferences:

- **a key whose type is not a preference** — refused in both directions, so a document
  cannot be withdrawn (which is not a state this system can represent) and cannot be
  granted from here (which would be an acceptance naming no document);
- **a key nobody declares** — nothing branches on a key nobody designed;
- **a preference the business has not turned on** — there is no wording, so the transition
  could never be evidenced;
- **an absent direction** — both ways are facts, so neither is the default a missing value
  falls back to; guessing would record a withdrawal nobody asked for as readily as a grant;
- **a body naming another contact** — refused rather than ignored, because somebody who
  believed they had written to another person must be told they did not.

**The wording is read from the definition at the moment of the write, never from the
caller.** A client supplying its own evidence of what somebody was shown is the one field on
this wire worth forging.

The router reaches `setPreference` and never `recordAcceptance`: the general write takes any
key and either direction, and a route holding it would make §2's bound a convention rather
than a contract.

### 6.4 The surface

The module gains a second `url` config field (`acceptances`) and a `preferencesLabel` string
— behavioural copy on `revealLabel`'s grounds, naming a region whose very presence the module
owns. It gains one invariant element: a `<ul>` whose rows are one per acceptance the endpoint
returned. It is invariant because both its content and its *membership* are fetched, so there
is no author-time roster for an L1 subtree to bind against; `contact-form`'s per-item control
shape does not reach here because that resolves against a config list, and a config list is
what §3 forbids.

**It is rendered hidden**, which is the opposite direction to the erasure explanation and
consistent with it. The rule both follow is that every degraded state shows only what is
true: the explanation is prose and is true before any fetch, so script may only subtract it;
the agreements list is true of nobody before the fetch, and a "Your preferences" heading over
an empty list on a page whose script failed would say this person has no preferences.

An editable row is a real `<input type="checkbox">` inside its own `<label>`, so the wording
recorded as evidence and the control's accessible name are the same words. A non-editable row
has **no control at all** — not a disabled one, which would say "you could change this, but
not now". A refused write puts the box back and says so, because the checkbox is the reader's
belief about what is recorded.

Status lines: `Not asked yet`, `On since <date>` / `Off since <date>`, `Asked <date>`,
`Agreed <date>`, `Agreed to an earlier version`.

### 6.5 What moved elsewhere, as a consequence

- **[[REQ-183]]'s "no verb that could destroy anything" UAT** asserted that `client.js`
  contained exactly one method literal and that the contract had exactly one `url` field.
  Both were the read-only contract stated mechanically, and §2 opens it. The assertion
  changed shape rather than weakening: the client's methods are now exactly `GET` and
  `POST`, `DELETE`/`PUT`/`PATCH` are still absent, and the url fields are exactly `account`
  and `acceptances`.
- **[[REQ-240]]'s "a service, not a route" UAT** asserted the router imported nothing from
  `acceptances.ts`. §6 of that ticket asks for *callable without a route* — which its own
  workers suite proves by calling the write with a database and nothing else — not for *no
  route to exist*. The surviving property is asserted instead: the router may not reach the
  general write.
- **`portalHomePage` / `portalFallbackStore`** take the second endpoint, and the fallback
  store is memoised on both — keyed on one, a deployment that moved only the second would be
  served the page built for the first.
- **`documentOutstanding`** is narrowed from `Ticket` to `{ uid }`, which is what it reads.
- **`L1ControlTag` gains `ul`.** The invariant element is a list and had no honest tag to
  declare itself with; `span` beside an emitter writing `<ul>` is exactly the defect BUG-76
  named. Nothing binds an L1 `control` node to it — `resolveControlNames` skips every
  invariant element — so it is declarable and not bindable.

### 6.6 Test plan

- `tests/test_UAT_FC_REQ-245_portal_preferences.workers.test.ts` — the endpoint, driving the
  deployed Worker's own `fetch` with a real RS256 Access token against real D1: the list is
  the business's own definitions in its own words; turning a new one on makes it appear; the
  newest definition is in force; a preference goes both ways and all three transitions
  survive as distinct event rows; the event carries the definition's wording and not the
  caller's; every refusal above; the account, its memberships, its grants and the operator
  flag are unchanged after a successful write; a contact reads only their own, and a body
  naming another is refused with nothing written to either.
- `tests/test_UAT_FC_REQ-245_portal_preferences.test.ts` — the surface, through the real
  renderer and the vetted client in JSDOM: the module names no key and no type; the region is
  rendered hidden and names the instance's endpoint; nothing turned on shows no section; rows
  are drawn in the endpoint's order; only editable rows carry a control and the decision
  follows the flag rather than the key; the control is named by the wording; every status
  phrasing; a toggle posts a key and a direction and nothing else; a refusal restores the box;
  an unreachable endpoint costs the section and nothing else.
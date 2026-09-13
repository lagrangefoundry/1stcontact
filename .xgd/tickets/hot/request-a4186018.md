---
uid: request-a4186018
id: REQ-240
type: request
title: 'User acceptances: the registry, the state, and the events'
created_by: EPIC-10
created_at: '2026-09-13T22:01:10.006557+00:00'
updated_at: '2026-09-13T22:12:20.521097+00:00'
completed_at: null
last_field_updated: depends_on
status: draft
fields:
  priority: high
  epic_parent: epic-d6d7ea63
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-f55f0a3e
  depends_on: []
---

# User acceptances: the registry, the state, and the events

A business records what a contact has agreed to, asked for, and been shown — as
queryable state, as an immutable history, and with the wording that evidences it.

## 1. What is true today

Verified 2026-09-13 against the code.

**There is no acceptance concept.** The nearest thing is one hardcoded pair of columns:
`users.tos_version` and `users.tos_accepted_at`, written by `terms.ts::acceptTerms`, which
also appends `member.signed_up`. It works, and it serves exactly one document.

**The document behind it is platform-only.** `TERMS_VERSION` is a constant and
`TERMS_TEXT` is hardcoded lorem ipsum in `terms.ts`. A customer's own sign-up would need
that customer's own terms, and there is nowhere to put them.

**Consent from a form is evidence, not state.** `provenanceOfSubmission`
(`apps/control-app/src/lead.ts`) writes `consent: [{field, wording, answer}]` into the
`form.submitted` event's `detail` JSON. Nothing reads it back. You cannot ask "who in this
business is on the newsletter", cannot segment on it, cannot show it on the contact, and
cannot record a withdrawal.

## 2. Three types, because they behave differently

**Type 1 — document.** `t_and_c_accepted`, `privacy_policy_accepted`. Acceptance of a
written document. Not revocable by the contact. **Versioned**: when the document changes,
everyone owes a fresh acceptance.

The boolean is DERIVED and is not the stored truth. `terms.ts` already records why:
*"`tos_version IS NULL` would answer 'has this person ever accepted anything', which is
the same question only until the first time the terms change — and then it is silently the
wrong one for everybody who accepted the old document."* Storing a bare boolean here
reintroduces a bug this codebase has already fixed once.

**Type 2 — preference.** `newsletter`, `beta_requested`. Revocable, by the contact, at
will. Both directions are facts and both are recorded; an untouched box today is not the
same fact as a withdrawal last week, and only an event log can tell them apart.

`beta_requested` AND NOT `beta_inclusion`. They asked to be in the beta; whether they are
IN it is the business's decision and lives in entitlements. A label reading "Beta: on"
would be read as "I am in the beta", which may be false.

**Type 3 — request.** `whitepapers`. No state at all, because there is nothing to revoke:
"they asked for the papers" is a statement about something that happened. It is recorded
as an event and nothing else, and it may still be driven by a checkbox.

## 3. The document is a ticket

An acceptance definition lives in the business's own ticket store, exactly as a message
template does (`templates.ts`), and for the reason that file gives: copy that must change
without a deploy belongs in the tenant's store, and *"the newest ticket carrying the key
wins, and the record of what was sent last month still points at the ticket that said
it."*

**An acceptance record therefore names the ticket uid it accepted**, not a version string.
"What did they agree to" resolves to immutable stored text rather than to a number
somebody has to map back to a document later. `templates.ts` has already proved the
pattern: every message record carries `templateUid` for precisely this.

It also closes §1's platform-only gap in one move — a customer's terms are a ticket in the
customer's store, reached by the same code with no second path and no platform branch
([[DOC-40]] §2.1 rule 1).

## 4. The state is a table

**Not `users.fields`.** That bag is the documented escape valve for a per-user fact not
worth a column, and it is the wrong home here: *"everyone in this business with
`newsletter` true"* is the query that eventually sends a newsletter, and D1 cannot index
into a JSON column. A per-business acceptance set is open-ended, so it cannot be columns
either.

One row per (contact, acceptance key), carrying the current value, when it was set, and —
for type 1 — which document ticket was accepted. Type 3 keys have no row at all.

## 5. The events

Every change appends to `contact_events`. `kind` is an unconstrained dotted string
precisely so this costs a constant and a label in `builder/contact-events.js` and no
migration.

Granting and withdrawing are separate kinds, not one kind with a payload, on the spine's
own reasoning: an event is a fact that has already happened, and a timeline that records
"changed" and makes the reader open the detail to find out which way has lost the thing it
was for.

**The wording shown is on the event.** A checkbox's is its form label, an implied
acceptance's is in the form's config, a type 1's is the document ticket. Wording
reconstructed later cannot evidence what was on the page that day.

## 6. It is a service, with no flow baked into it

Sign-up may ask about the mailing list; sign-in may ask for a fresh acceptance after a
version bump; a capture form sets type 2 and 3. The acceptance layer is consumed by all of
them and belongs to none.

**So the write path is a function, not a route.** If recording an acceptance is reachable
only from inside the builder's authenticated `guardTerms` path, a public self-serve
sign-up can never call it — and self-serve sign-up is explicitly out of scope for this
round and explicitly must not be precluded. A UAT asserts the write is callable with no
builder session.

Nothing else has to be undone later: membership is `tos_accepted_at` and not "an operator
pressed invite", and `people-axes.js` already states that all four combinations occur,
including *"a member who was never invited"*.

## 7. Out of scope, deliberately

- **Custom per-business acceptance keys.** The system-defined set only. Custom keys slot
  into the same registry later without redesigning it.
- **Unsubscribe links.** There is no mailing list yet; the surface that would carry one
  does not exist.
- **Operator-initiated changes.** Every writer in this round is the contact's own act, via
  a form or the portal, so there is no actor to attribute and `contact_events` needs no
  actor column yet.
- **Migrating existing `consent[]` blobs.** Handled in the capture-form ticket, where the
  writer changes.

## 8. Acceptance criteria

1. The system-defined keys are declared in ONE module with no imports, readable from both
   the Worker and a browser panel, on `contact-events.js`'s precedent.
2. A type 1 acceptance records which document ticket was accepted. Bumping the document —
   writing a newer ticket under the same key — makes every prior acceptance read as
   outstanding, without any row being rewritten.
3. A type 2 acceptance can be granted, withdrawn and granted again; the state reads the
   latest, and all three transitions survive in the event log as distinct rows.
4. A type 3 key has no state row and cannot be given one. Asserted by attempting it.
5. "Every contact in this business with `newsletter` true" is answered by an indexed query,
   not a scan of a JSON column.
6. Every transition appends a `contact_events` row carrying the wording the contact was
   shown, and no transition rewrites an existing row — the append-only trigger is the
   witness.
7. The acceptance write is callable without a builder session and without an HTTP route,
   proving a later self-serve sign-up is not precluded.
8. A business's acceptance definitions are read from ITS OWN ticket store; two businesses
   with the same key resolve to their own documents, with no platform-only branch.
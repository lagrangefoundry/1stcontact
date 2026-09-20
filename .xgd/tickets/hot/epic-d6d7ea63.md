---
uid: epic-d6d7ea63
id: EPIC-10
type: epic
title: 'Forms: capture, acceptances, and onboarding'
created_by: martin-github@westhead.me
created_at: '2026-09-12T23:46:56.989430+00:00'
updated_at: '2026-09-20T18:30:55.568823+00:00'
completed_at: null
last_field_updated: status
status: done
fields:
  priority: medium
  chat_comment: comment-cd9c1549
  epic_children:
  - request-a4186018
  - request-41a9dc90
  - request-921ba107
  - request-a0910456
  - request-7c513b4a
  - request-37ac28bf
---

## What the client asked for

> "Ok lets discuss the email capture functionality. There are some things live but lets put aside implementation for a second and discuss requirements.

I want to be able to configure business-specific settings to be associated with a contact — all businesses need `t_and_c_accepted`, `privacy_policy_accepted`; for first contact I need `beta_asked`; for xgd I need `newsletter`, `whitepapers` — all of these are recording requests or acceptances of the user. Each one means that a user clicked a button and/or checked a box.

Lets call these T/F properties **user acceptances** — lets start with system defined ones that the business can use or not. We may choose to add custom per-business acceptances later. In time these will generalize beyond T/F values to real onboarding surveys.

Each checkbox going to T is an event in the contact event log.

Then the email capture module needs to do the following:

1. Capture the email entered in the box and add it to the contact list

2. Based on configuration of the module set one or more user acceptance to T (acceptances implied in just hitting the button)

3. Based on checkboxes that the user checks set one or more user acceptance to T (additional optional opt-ins)

4. Send a configurable email to the user's account; this email can contain: a difficult-to-guess link to a "hidden" page with capture content (e.g. whitepapers), a sign-in link, or just a welcome message"

And, in the design conversation that followed:

> "There is a third event — perhaps the most important — `whitepapers_accessed`. The link we send is to a page they have to go to and download the papers — we need to track that."

"On the portal, we disagree. The portal cannot be read only, that makes no sense. It is created to allow these things."

## The principle

**What a contact has agreed to, asked for, and been shown is state the business can query, history it can read, and evidence it can produce — and the form that collected it is the thing that says so.**

Every child is one clause of that. The epic is not "make the email capture module better"; it is that a press of a button on a public page becomes a durable, evidenced fact about a person, and that every surface which should know about that fact does.

## What was true before, verified

- **There was no acceptance concept.** The nearest thing was one hardcoded pair of columns — `users.tos_version` / `users.tos_accepted_at`, written by `terms.ts::acceptTerms`. It worked, and it served exactly one document, whose text was a `TERMS_TEXT` constant of lorem ipsum in the source. A customer's own terms had nowhere to live.

- **Consent from a form was evidence and not state.** `provenanceOfSubmission` wrote `consent: [{field, wording, answer}]` into the `form.submitted` event's `detail`. Nothing read it back — you could not ask who in a business was on the newsletter, could not segment on it, and could not record a withdrawal.

- **A form could promise exactly one artifact**, as three sibling strings (`asset` / `assetName` / `assetUrl`) because `config` had no object type. The XGD whitepapers page promises _both papers_ and could only be told about one.

- **A form sent one hardcoded message, and only if it gated a download.**`captureLead` rendered `ASSET_TEMPLATE` and rendered it only when both an asset key and a URL were declared — so this product's own beta form, whose entire deliverable is a place on a list, mailed nobody.

- **Nothing recorded what a contact did with what was sent.** `asset.sent` said we sent it; whether anyone opened it, or took one paper and not the other, was recorded nowhere.

- `account-portal`** was read-only by contract** — one declared endpoint, `GET` and no other verb — and showed nothing about acceptances at all.

## The design

### Three types, because they behave differently

The type is what every caller branches on; the key never is. Declared once in `builder/acceptances.js`, a module with no imports, on `contact-events.js`'s and `people-axes.js`'s precedent — the definition has to be reachable from the browser panel and from the worker, and a key spelt at both ends is two answers free to drift by one character.

Type

Meaning

State

Revocable by the contact

`document`

acceptance of a written document

which document, as a ticket uid

no

`preference`

a standing choice

current value, both directions recorded

yes

`request`

a thing they asked for once

**none** — an event and nothing else

nothing to revoke

System keys shipped: `t_and_c_accepted`, `privacy_policy_accepted` (document); `newsletter`, `beta_requested` (preference); `whitepapers` (request).

`beta_requested`**, not **`beta_inclusion`**.** They asked to be in the beta; whether they _are_ is the business's decision and lives in entitlements. A portal label reading "Beta: on" would be read as "I am in", which may be false.

**A **`request`** deliberately holds no row.** Giving it one would invent a state the rest of the system then has to have an opinion about, and it would read `true` forever — not a fact anybody asked for.

### The document is a ticket, not a version string

A document acceptance names the **ticket uid** it accepted, so "what did they agree to" resolves to immutable stored text rather than to a number somebody has to map back to a document months later. It follows `templates.ts`'s precedent exactly — every message record already carries `templateUid` for this reason — and it fixes the platform-only gap in one move: a customer's own terms live in that customer's ticket store, with no second code path.

Bumping the copy therefore leaves every prior acceptance outstanding without a row being rewritten, which is the behaviour `terms.ts` already had to learn: _"_`tos_version IS NULL`_ would answer 'has this person ever accepted anything', which is the same question only until the first time the terms change."_

### State and history are both kept, and they are not the same thing

`user_acceptances` holds one row per (contact, key) carrying the current value — this is the thing that changes, and it is a table rather than `users.fields` because "everyone in this business with `newsletter` true" is the query that eventually sends a newsletter, and D1 cannot index into a JSON column. `contact_events` is append-only and holds every change: `acceptance.granted`, `acceptance.withdrawn`, `acceptance.requested`.

`business_id` is derived from the contact and never supplied — every write is `INSERT … SELECT … FROM users` — so a row cannot be filed under a business its contact does not belong to.

### The acceptance layer belongs to no flow

The write is a service function with **no route and no flow baked into it**, so a self-serve sign-up can call it later without the layer being rebuilt. Nothing in this epic requires that sign-up to exist; nothing in it precludes one.

### A form says what it collects, what it promises, and what it sends

Three config changes to `contact-form`, each carried by a declared migration (BUG-85's rule: a version with no step reaching it is refused):

- **v5 → v6** — `asset`/`assetName`/`assetUrl` become `assets`, a list of `{key, name, url}`. The triple becomes a one-item list verbatim, because the key is what the at-most-once ledger remembers a delivery by. Per-item both-or-neither: a half-declared item is absent and its neighbours are not.

- **v6 → v7** — `config.template` names the message the form sends, and absence means _send nothing_. The step names `asset` for any instance carrying assets, so no existing gated download goes quiet.

- **acceptances** — a field gains `acceptance` (a key it maps to; its label stays the wording), and the form gains `accepts: [{key, wording}]` for what pressing the button asserts. **An implied acceptance's wording is not optional** — "pressing the button means you accepted the terms" is only true if the page said so beside the button — so a wordless one is refused at validation rather than recorded as though it meant something.

**A capture form cannot make a member.** That is structural, not a flag: `invite` and `signin` are refused outright as template names, at publish and again at the send, because both mint redeemable credentials and a public form a stranger can post to has no business sending either.

**The closed template set opens and the check moves.** `templates.ts`'s argument for a closed vocabulary — _"the failure of a closed set is a refusal at authoring time; the failure of an open one is a send that finds nothing at the moment somebody is waiting for mail"_ — is conceded rather than overturned: no literal in this repository can enumerate copy a business wrote for itself, so `templateKeysOf` answers what the business actually holds and `publishSite` refuses a form naming anything else. Still authoring time, now sourced from the truth.

### The link is per contact, and that is the point

A single unguessable URL cannot say _who_ followed it — everyone who gets the mail gets the same link. So a grant is minted per (contact, site, form), and the attribution is the reason for it rather than a side benefit.

**It does not expire, and it is not a credential.** Delivery is at-most-once ever and REQ-223 deliberately refuses a public re-send path, so an expired link is a dead end at exactly the thing the contact came for; what the token protects is a whitepaper, and the tracking is worth more than the secrecy. A sign-up link is the opposite kind of thing — it creates a member, so it expires and is single-use, which is what `login_tokens` already does. Two tables, deliberately, rather than one with a `purpose` column: one column is all it takes for somebody to make the rules the same.

Arriving writes `page.accessed`; taking each paper writes `asset.downloaded`. Every refusal is the ordinary 404, one spelling, so a gate path is not distinguishable from an unknown one.

### The portal writes, narrowly

`account-portal`'s read-only contract opens for exactly one class of thing: a **preference**, which is the contact's own and theirs by definition. Document and request acceptances are shown and offer no control — and that is a property of the acceptance's _type_, not of the portal's markup, so a new key of either kind acquires the right behaviour without this module being edited. What the portal still must never do is grant itself access, escalate an entitlement, or delete anything; DOC-37 remains the deletion design.

## The children

Ticket

What it landed

Depends on

[[REQ-240]]

the registry, `user_acceptances`, the three event kinds, the document-as-ticket rule, the operator's agreements pane

—

[[REQ-241]]

`config.assets` as a set; per-item delivery and per-item ledger entries

—

[[REQ-242]]

checkbox→key mapping and `accepts: [{key, wording}]`; acceptances recorded on submit

REQ-240

[[REQ-243]]

`config.template`; the open vocabulary and the publish-time gate; `invite`/`signin` refused

REQ-241

[[REQ-244]]

`asset_grants`, the `AssetGate` entrypoint, `GET /api/download/<token>[/<assetKey>]`, `page.accessed` / `asset.downloaded`

REQ-241, REQ-243

[[REQ-245]]

the portal shows every acceptance and changes the preferences

REQ-240

## What shipped

**Schema** — `db/migrations/0004_user_acceptances.sql`, `db/migrations/0006_asset_grants.sql`, both mirrored into `0001_baseline.sql` with `IF NOT EXISTS`, because editing the baseline reaches nothing already deployed.

**Contract** — `contact-form` v5 → v7, with declared migrations for both steps; `account-portal` gains a write.

**Endpoints** — `GET/POST /api/acceptances` (control-app, the portal's own); `GET /api/download/<token>` and `…/<assetKey>` (public-site, matched before the edge cache, GET only — `HEAD` is not an arrival).

**Surfaces** — an agreements pane on the operator's contact view; the portal's preferences list; six new labelled event kinds in the contact timeline.

## What an existing site needs, to pick this up

Deliberately recorded here because it is the thing that surprises: **a published revision is frozen and nothing upgrades it in place.** `upgradePageModules` is called from exactly one place — `1c module upgrade <slug> --write` — and it rewrites the **draft**. The lead receiver reads the _published_ snapshot for a live submission, on purpose: reading consent wording from a draft would evidence a sentence that was never on the page.

So a site published before this work keeps capturing leads exactly as it did, and sends no mail and delivers no asset, until its draft is upgraded, configured and **republished**. That is the intended behaviour and not a regression — but it is invisible, so it is written down.

## Out of scope, named rather than forgotten

- **Self-serve sign-up** — not built. The acceptance write is deliberately callable without a builder session so that it can be, later.

- **The sign-in flow re-asking on a document version bump** — the mechanism exists (`needsAcceptance`, `guardTerms`); wiring it to the registry is not in this epic.

- **Unsubscribe**, and **operator-initiated** acceptance changes — both wait on a mailing list and a support channel to motivate them.

- **Custom per-business acceptance keys** — the registry is the table they slot into; nothing else is needed first.

- **Enquiry forms**, as distinct from capture forms.

- **Onboarding surveys** — the generalisation past T/F the ask anticipates.

## Verification

**Automated.** All 13 UAT files for this epic pass: `test_UAT_FC_REQ-240_{acceptance_registry,acceptances.workers,agreements_pane}`, `REQ-241_{asset_migration,asset_set.workers}`, `REQ-242_{form_acceptance_contract,form_acceptances.workers}`, `REQ-243_{form_template.workers,publish_template_gate.workers,template_migration}`, `REQ-244_gated_page.workers`, `REQ-245_{portal_preferences,portal_preferences.workers}`. The workers suites run through the real `captureLead`, the real `/api/publish` and the real gate routes against D1/R2 in workerd — not against a mock.

Full-suite run at 0.2.196: 4043 passed, 12 failed, none in this epic's files. The 12 are environment, not code — a `node_modules`/lockfile mismatch fails the `1c` preflight in five of them, and the other four trip over untracked local detritus (a stray `.claude/` directory inside `account-portal/`, an untracked `.md` at the repo root).

**Manual, for an existing site.** In order, because each step is what makes the next one visible:

1. `POST /api/modules/upgrade {site, write: true}` (or `1c module upgrade <slug> --write` for a file-backed site) — carries `contact-form` to v7.

2. Set `config.template` on the form, and `config.assets` / `config.accepts` if it gates artifacts or asserts acceptances. A form with no template still captures and still mails nobody, which is the intended reading.

3. Author the template in the business's ticket store if the key is not one of the seeded system keys. `publishSite` refuses a form naming a key the store does not hold, and refuses `invite` and `signin` outright.

4. **Publish.** Until this, the live site serves the old frozen revision and the receiver reads the form definition from it.

5. Submit. Expect, in the contact's timeline: `form.submitted`, then `acceptance.granted` / `acceptance.requested` per key, then `asset.sent` per item. Following the mail's link writes `page.accessed`; each download writes `asset.downloaded`.

**Schema.** `bin/deploy` runs `bin/deploy.d/migrate/10-d1-site-store` before uploading, so a production deploy applies `0004` and `0006` itself. A local store needs `wrangler d1 migrations apply DB --local` once.

**The repo's own fixture sites are not configured for any of this.** `xgd` (home, whitepapers) and `gigabytealchemy` (form-0, form-1) are all at v7 with `assets: []`, no `template` and no `accepts` — they capture and do nothing else. The whitepapers page in particular still says "Send me both papers" and promises none, which is the configuration this epic makes expressible and does not itself perform.

## The test gutter — this epic's share ([[DOC-54]])

**This epic's surfaces are where the gutter first lands, and the requirement belongs to [[EPIC-15]] rather than here** — epics own requirements, not files. Recorded so the change arrives expected rather than as a surprise in reconciliation.

The capture chain is the only end-to-end write path in production, which makes it both the client's worked example (_"we want to test the whitepaper sign-up flow"_) and the entire live surface of [[DOC-54]]. The changes touching this epic's code:

- `public-site/src/lead.ts` — the marker joins `RESERVED_FIELDS`, and it belongs there on this epic's own stated reasoning: those are wire-level machine artefacts stripped before the record, because storing them _"would put three machine artefacts in a contact's provenance beside the words a person typed."_ The marker is exactly that kind of artefact. What is new is the signature check, not the plumbing.

- **The **`captureLead`** RPC seam** gains one field. [[REQ-223]] §3.2 made this an entrypoint no URL reaches, so the mark cannot be injected past the boundary that verifies it.

- `addContact`**, **`recordAcceptance`**, **`grantFor` stamp or derive; no call site supplies a flag.

- **A rejected marker does not reject the submission.** It degrades to ordinary traffic and the record is written **real**. Refusing instead would turn a signing bug into lost customer data, and the attack worth closing runs the other way — marking real traffic as test would let a caller make a competitor's leads vanish from their own dashboard.

**The sequencing constraint, which is the client's and is about evidence:** the gutter does not go in until this epic is **working and tested**. It landed recently and is unverified; a failure after the gutter is threaded through it would be ambiguous between the two. The baseline is what makes the gutter's assertions mean anything, because only then is it known that the records _would_ have appeared.

**Also arriving on this epic's surface, from [[DOC-54]] R5: delete contact.** Pulled forward because it is what replaces being clever about a _"test my contact form"_ feature — let a test lead be an ordinary lead and let the business remove it. It is a feature customers need regardless, it is the same statement as [[EPIC-15]]'s collector (the cascade takes the whole chain), and a collector exercised by hand daily is one that works when the scheduler needs it.

**The existing UAT harness is the standard to extend**, not replace: `test_UAT_FC_REQ-223_lead_endpoint.workers.test.ts` already drives `worker.fetch` inside workerd against real D1 and R2 with the **real** `captureLead` behind the binding. The marker's edge verification can only be proven there — calling `captureLead` directly with the mark already set proves nothing about forgery.
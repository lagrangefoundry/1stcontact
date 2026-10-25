---
uid: request-41a9dc90
id: REQ-241
type: request
title: The asset a capture form promises becomes a set
created_by: EPIC-10
created_at: '2026-09-13T22:01:33.766551+00:00'
updated_at: '2026-09-13T22:37:09.981342+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  priority: medium
  epic_parent: epic-d6d7ea63
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-dec7ed9a
  depends_on: []
  commits:
  - working_sha: 815c0883b082e3627be05f95fc5a0968cfd0db71
    reconcile_sha: null
    main_sha: null
  - working_sha: 5dabe99c918a9af5f680e7bcf8684bddd538aa77
    reconcile_sha: null
    main_sha: null
  version: 0.2.186
  story_points: 5
---

# The asset a form promises becomes a set

A capture form can gate more than one artifact, each separately named, separately
delivered and separately recorded — because "did they take both papers or one of them" is
a question the current shape cannot express.

## 1. What is true today

`contact-form`'s config carries exactly one asset, as three sibling strings because
`config` has no object type:

```
asset:     { type: 'string' }   // the stable ledger key
assetName: { type: 'string' }   // what the mail calls it
assetUrl:  { type: 'url' }      // where the artifact lives
```

`formDefinitionOf` reads them under a both-or-neither rule — *"a key with no URL is an
asset nothing can deliver, and a URL with no key is a delivery nothing can remember having
made"* — and `deliverAsset` sends one message carrying one link.

**The XGD whitepapers page promises "both papers" and can only be told about one.** That
is the concrete failure: two artifacts, one key, one URL, one ledger entry, and no way to
know which one anybody took.

## 2. The change

`asset`, `assetName` and `assetUrl` are replaced by a **list** whose items carry a key, a
name and a URL. The both-or-neither rule becomes per item: an item missing either half is
read as absent rather than as a best effort, for the reason it already is.

**The at-most-once ledger becomes per asset**, which is most of the way there already —
`deliveryState(store, contactId, asset)` keys on the asset's key today, and
`messagesFor` finds a prior send by it. What changes is that the form asks the question
once per item instead of once per form.

**The mail names a page, not a file.** With one asset the message could link straight at
the artifact; with a set it links at the gated page that lists them. That page is the
next ticket's work — this one leaves the copy naming a set and hands the link over.

## 3. The module id does not change

`contact-form` keeps its id, and this is settled rather than open.

`upgradeInstance` (`packages/framework/src/modules/upgrade.ts`) carries `type` through
unchanged — the migration machinery moves versions WITHIN a module id and has no
expression for renaming one. Worse, `site_revisions` rows are immutable by design and
`formDefinitionOf` reads module instances straight out of those frozen R2 snapshots to
resolve what a submitter was actually served. A rename would either break every historical
revision referencing `contact-form`, or require the registry to keep answering to the old
name — which is the legacy-alias mode CLAUDE.md forbids outright.

The generalization this epic is about is capability, not spelling.

## 4. The migration

A version bump with a declared step, per [[BUG-85]]: `migrationsFrom` and a `migrations`
entry, because *a declared step is the precondition for a bump, not a courtesy*.

The step is not an identity function this time — it has real work: an instance carrying
`asset`/`assetName`/`assetUrl` becomes an instance carrying a one-item list, and an
instance carrying none becomes one carrying an empty list. Both directions are exercised,
because both exist in the stores.

## 5. Acceptance criteria

1. A form declaring two assets delivers both, as two separately identified artifacts.
2. The at-most-once rule is per asset: a contact who has had paper A and not paper B is
   sent B and is not sent A again.
3. An item missing its key or its URL is read as absent, and the other items on the same
   form are unaffected.
4. A form declaring no assets behaves exactly as one does today — capture, no delivery.
5. A stored v5 instance carrying the old triple upgrades to a one-item list with the same
   key, name and URL; a stored v5 instance carrying none upgrades to an empty list.
6. The module's id is unchanged, and a published revision written before this ticket still
   resolves through `formDefinitionOf`.
7. Suppression still applies across the whole set: an address that bounced or complained is
   sent none of the assets.
## 6. What the implementation settled

These are decisions the change required and the ticket did not name. They are here
because they are behaviour, and behaviour with no language in the ticket is behaviour
reconciliation cannot attach to anything.

**One message per asset, never one mail listing the set.** The ledger is the message
record and a record carries one asset key, so a single mail covering two artifacts would
be one entry again — exactly the shape §1 is about. Each message names its own artifact
and links at its own URL; the mail template is untouched.

**The receiver's outcome is a list, not a summary.** `LeadOutcome.assetSent` /
`assetSkipped` are replaced by `assets: Array<{ key, sent, skipped? }>`, one entry per
promised asset in declaration order. The `not_offered` skip reason is retired with them: a
form that promises nothing now reports an empty list, which says the same thing without a
reason code for the ordinary case.

**The skip log names the asset.** `lead_asset_not_sent` gains an `asset` field, because a
form promising a set can deliver one artifact and skip another on the same submission, and
a line that did not say which one would be unreadable exactly where it matters.

**The submission's provenance records which artifacts it was gated on** — `assets: [key…]`
in the `form.submitted` event, replacing the single `asset`. It is a fact about the page
they were served, and no `asset.sent` row can supply it for an asset that was promised and
skipped.

**Suppression is evaluated once per submission, not once per item.** The history is read
once and passed in. A bounce arrives from a webhook and never from the middle of the
delivery loop, so re-reading every message the contact holds per item would be the same
scan N times for an answer that cannot have changed.

**A form naming one key twice delivers it once.** Keys already delivered within the same
loop join the ones already in the ledger, so the second item is `already_sent` for the same
reason a second submission is.

**The migration carries a half-declared triple rather than discarding it.** A key with no
URL was read as no asset under v5 and is read as no asset under v6 — the rule moved from
the form to the item and did not change — so carrying it preserves the behaviour exactly
and leaves the author's half-finished intent where they left it. Discarding it would be
the migration deciding something the contract already decides, silently.

**`assets` allows at most eight items**, the ceiling `fields` already carries. A form
gating more than eight artifacts is a library and wants a page.

**Nothing in an item is `required`.** The both-or-neither rule is a *reading* and not a
refusal, so a half-finished item must not fail validation — a validation error would turn
one malformed line into a dead page.

## 7. What a frozen published revision does now

`site_revisions` rows are immutable and `formDefinitionOf` reads module instances straight
out of those snapshots, so v5 instances carrying the old triple exist and will keep
existing. Such a revision **still resolves**: the form captures, the contact lands, the
provenance names the page. What it no longer does is **deliver**, because the triple is not
the v6 contract and teaching the receiver to read both would be the legacy-alias mode
`CLAUDE.md` forbids outright. The remedy is the one the migration exists for — upgrade the
draft and publish it again.

The blast radius of that is nil today: no published `contact-form` instance in either store
carries an asset triple. The four in the repo's own fixtures (`xgd` home and whitepapers,
`gigabytealchemy` ×2) promise nothing, and they were carried to v6 with
`1c module upgrade <slug> --write` — the real tool, not an edit — landing `assets: []` on
each.

**The cloud store is the operator's step.** `1c module upgrade <slug> --write` has to be
run against it too; until it is, any instance there still pinned at v5 is a catalog miss.

## 8. Not in scope

**The XGD whitepapers form is not configured with its two assets here.** The artifacts do
not exist yet and the gated page they would link at is the next ticket's work
([[REQ-241]] §2). This ticket makes the set expressible; filling it in is content.

## 9. Test plan

`tests/test_UAT_FC_REQ-241_asset_set.workers.test.ts` — six UATs through the real
`captureLead` inside workerd against real D1 and R2, reusing [[REQ-223]]'s `seedFormSite`
and `applySchema` rather than founding a second fixture: two assets both delivered as
separately identified artifacts (AC-1), the at-most-once rule asked per item (AC-2), a
half-declared item absent with its neighbours unaffected (AC-3), an empty set capturing and
sending nothing (AC-4), a bounced address sent none of the set (AC-7), and a pre-ticket v5
published revision still resolving (AC-6, second half).

`tests/test_UAT_FC_REQ-241_asset_migration.test.ts` — four UATs over `upgradeInstance`:
the triple becoming a one-item list with the same key, name and URL (AC-5), an instance
promising nothing becoming an empty list (AC-5), a half-declared triple carried rather than
discarded, and the module id unchanged with the bump shipping its step (AC-6, first half).

Regression scope: the lead and asset suites (`REQ-223` ×2, `BUG-87`, `BUG-78`), the module
and behaviour guardrails (`BUG-85`, `BUG-86`, `req85-conformance`,
`reconciliation-behavior-modules`, the two config-key gates), and a full `vitest run`.
Every test that pinned `contact-form` at v5 now pins v6; `BUG-86`'s was de-pinned from a
fixed number to "above v4", because what it exists to prove is the step out of v4 and not
whatever the catalog's tip happens to be.
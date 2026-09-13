---
uid: request-41a9dc90
id: REQ-241
type: request
title: The asset a capture form promises becomes a set
created_by: EPIC-10
created_at: '2026-09-13T22:01:33.766551+00:00'
updated_at: '2026-09-13T22:01:33.766551+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  priority: medium
  epic_parent: epic-d6d7ea63
  auto_merge_back: true
  needs_review: false
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

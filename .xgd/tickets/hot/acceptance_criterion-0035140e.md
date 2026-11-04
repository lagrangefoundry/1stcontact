---
uid: acceptance_criterion-0035140e
id: AC-2239
type: acceptance_criterion
title: 'Every primary key is an opaque random id from one minter: identical inputs
  yield unrelated keys, and the prefix is only a reading aid'
created_by: xgd
created_at: '2026-11-04T16:01:03.436303+00:00'
updated_at: '2026-11-04T21:41:13.128187+00:00'
completed_at: null
last_field_updated: body
status: active
fields:
  story_uid: story-fde7370b
  kind: behavior
  regression_only: false
---

## Criterion

Every key this repository mints for a row (a business, a site, a person, a membership and every other identity-bearing table whose key this repository's code assigns) is an **opaque random identifier**: a short lowercase prefix, an underscore, and 32 hexadecimal characters (128 random bits). It is never a value a human typed or chose, and never a digest of the row's own data. Creating two sites from identical inputs yields two unrelated keys, and changing a row's attributes never changes its key.

The prefix only says which table a value came from. **No behaviour depends on it**: a business whose key differs from another's only in its prefix is handled identically by the store, and sharing the random part relates nothing. So two ids sharing a prefix are not related, and ids with different prefixes are not ordered.

All such keys come from **a single minter**. Keys assigned by the shared ticket-store component (`tickets.uid`), which lives outside this repository, are out of scope. This is a structural claim about the source, with no runtime observable (see the story's Reconciliation Decisions), and is evidenced by a source scan.

## Verification

Create two same-slug sites in two businesses (and two businesses with identical names) and assert each key is opaque-shaped and the keys share nothing beyond the prefix. Register two businesses whose keys share the same random part and differ only in prefix (the business prefix, and one the product never uses). Drive both through the same store calls (create a site, write it, read its key, enumerate its keys) and assert the outcomes are identical, that each handle sees only its own site, and that the two site keys differ. Scan the baseline schema and assert no primary key is a chosen attribute (no slug, name or email key). Structurally: scan the platform's authored source (skipping dot-directories and build output) and assert exactly one file calls `crypto.getRandomValues` (the minter), and that the only callers of `crypto.randomUUID` are the two that make non-key values (a model session name in `ai.ts`, the local mail adapter's stand-in provider message id in `mail.ts`), neither of which assigns an `id` or calls `newId`.

## Reconciliation Decisions
- (review report-0cfddba5) Scoped to keys this repository mints: `tickets.uid` is minted by the external shared ticket-store component and is not covered by this criterion.

---
uid: acceptance_criterion-0035140e
id: AC-2239
type: acceptance_criterion
title: 'Every primary key is an opaque random id from one minter: identical inputs
  yield unrelated keys, and the prefix is only a reading aid'
created_by: xgd
created_at: '2026-11-04T16:01:03.436303+00:00'
updated_at: '2026-11-04T16:01:03.436303+00:00'
completed_at: null
last_field_updated: created_at
status: active
fields:
  story_uid: story-fde7370b
  kind: behavior
  regression_only: false
---

## Criterion

Every key the system mints for a row (a business, a site, a person, a membership and every other identity-bearing table) is an **opaque random identifier**: a short lowercase prefix, an underscore, and 32 hexadecimal characters (128 random bits). It is never a value a human typed or chose, and never a digest of the row's own data. Creating two sites from identical inputs yields two unrelated keys, and changing a row's attributes never changes its key.

All such keys come from **a single minter**; no other code path mints a key. The prefix only says which table a value came from: no behaviour depends on it, so two ids sharing a prefix are not related and ids with different prefixes are not ordered.

## Verification

Create two same-slug sites in two businesses (and two businesses with identical names) and assert each key is opaque-shaped and the keys share nothing beyond the prefix. Scan the platform's source (skipping dot-directories and build output) and assert there is exactly one key minter and that no source branches on a key prefix. Scan the baseline schema and assert no primary key is a chosen attribute (no slug, name or email key).
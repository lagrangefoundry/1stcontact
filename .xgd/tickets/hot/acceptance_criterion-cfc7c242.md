---
uid: acceptance_criterion-cfc7c242
id: AC-1589
type: acceptance_criterion
title: A material records the name it arrived under, how its description went and
  what produced it, so undescribed material is selectable by predicate
created_by: xgd
created_at: '2026-09-04T05:07:51.925445+00:00'
updated_at: '2026-09-04T05:07:51.925445+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-e07c589b
  kind: behavior
  regression_only: false
---

## Criterion

A material's body is the readable shadow of what its file *says*, and it is not always a real
description — a scanned brand book yields no text, a file sort exists that nothing can read, and an
attempt to write one can be made and fail. So the record states in its own fields, rather than
leaving it to be guessed from the body:

- **How the description went** — one of a closed set of six answers: that the description is a real
  one, or which of five ways it is not — nothing was available to write one, the file carried no
  extractable text, the file's sort is one nothing here can read, the file was too large to be
  looked at, or an attempt was made and failed. An answer outside those six is refused with a
  validation error and no record is stored.
- **What produced it** — recorded as free text rather than a closed set, because the value names a
  describer as that describer names itself, and a closed set would turn every new describer into a
  change to the vocabulary.
- **The name the file arrived under** — carried on the record itself and not only on the stored
  bytes it names, so a listing of the account's material can show a name for every entry without a
  second lookup per entry, and so there is a handle the client recognises for material whose
  description is degraded.

All three are optional. A record whose description has not been attempted — a capture bundle at the
moment it lands — states none of them and is a valid record, as is one that arrived without a name.

The consequence, which is why these are part of the declared vocabulary rather than fields the store
merely tolerates: material whose description is not a real one is **selectable by a predicate over
these answers**. The account's material can be listed and the degraded entries picked out from the
listing itself, without opening any record's body or fetching any stored bytes — so revisiting them
later is a query rather than a sweep over every record.

## Verification

Through an account-scoped store, create material recording each of the six description outcomes,
each with what produced it and the name the file arrived under, and confirm each reads all three
back unchanged. Create one stating none of the three and confirm it is accepted. Attempt to create
one recording an outcome outside the six and confirm it fails as a validation error with no record
stored. Then list the account's material and confirm every entry carries its outcome, its describer
and its filename, so the entries whose description is not a real one are identified from the listing
alone without reading any body or any stored bytes.

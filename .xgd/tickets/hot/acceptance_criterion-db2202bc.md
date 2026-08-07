---
uid: acceptance_criterion-db2202bc
id: AC-857
type: acceptance_criterion
title: Every recorded font family states its origin, its licence terms and the files
  it covers, and a record missing or misshaping any of those is rejected naming the
  offending entry and field
created_by: xgd
created_at: '2026-08-06T03:29:27.952196+00:00'
updated_at: '2026-08-07T18:44:55.046455+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-8685be2d
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
The font provenance record is a stated contract, not free-form notes. Each
recorded family carries, all required:

- the family name exactly as a page names it when it asks for that face
- the foundry
- the source it was obtained from, as a URL
- the date it was obtained, as a calendar date
- licence terms: the licence name, the licence URL, and three separate
  permission answers — may it be used commercially, may it be self-hosted, and
  may it be redistributed as part of the product
- outstanding licence work, as a list (empty when there is none)
- the list of files the record covers, with at least one file

A record that omits a required field, gives one the wrong shape, or carries a
field the contract does not define is rejected, and the rejection names which
field of which entry is at fault. The date reads identically whether it was
written as a bare calendar value or as a quoted one, so the record does not
depend on a human remembering to quote it.

## Verification
Validate the shipped provenance record and assert every entry carries every
required field with the right shape. Then validate deliberately damaged
candidates — a missing licence URL, a permission answer of the wrong type, an
undeclared extra field, an entry with no files — and assert each is rejected with
an error path identifying the entry and the field. Assert a bare and a quoted date
both normalise to the same calendar-date value.
---
uid: acceptance_criterion-8b6792de
id: AC-1024
type: acceptance_criterion
title: Asking an image region what it exposes returns which image goes there — a closed
  list of the site's images — alongside its alt text
created_by: xgd
created_at: '2026-08-07T04:40:50.004278+00:00'
updated_at: '2026-08-07T19:40:48.080352+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-37a3921b
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

Requesting the editable fields of a region that holds an image succeeds — through
the *same* "what does this region expose" operation that answers for a run of
copy, not a separate one — and returns exactly two fields:

- **which image goes here**: a field that must hold a value and whose choices are
  a **closed list**, carried with the field itself, of the handles the site's
  images can be referenced by; and
- **its alt text**: a plain-text field, asking for a multi-line control under the
  same rule copy does.

The list is narrowed to images. A font file or a stylesheet the site also holds
is a real asset but is nothing an image region can point at, so it is not
offered. The choices are free of duplicates and in a stable order.

## Verification

Address a known image region in a seeded site whose asset store holds several
images alongside at least one font file and one stylesheet. Request its fields
and assert two are returned; that the image field is a closed-list field marked
as requiring a value, whose options are exactly the site's image handles (each
appearing once, in a stable order) and include no font or stylesheet; and that
the alt-text field is a plain-text field. Assert the returned current values are
the handle and alt text as they stand in the draft. Assert the same answer is
returned when the region is read through the builder origin.
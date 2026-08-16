---
uid: acceptance_criterion-285dd8d6
id: AC-1111
type: acceptance_criterion
title: Asking a region what it exposes declares that an image field's options are
  images, without changing which of them may be chosen
created_by: xgd
created_at: '2026-08-12T16:04:12.775992+00:00'
updated_at: '2026-08-16T06:55:51.670283+00:00'
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

Asking a region what it exposes says not only that a field's choices are a
**closed list**, but **what those choices are**, whenever knowing that changes
how they should be shown. A field whose options are the site's images is
declared as holding images, and that declaration travels with the field itself —
so every client reading the same answer learns the same thing, whether it reads
it from the command line or over the builder's origin.

The declaration is attached by **kind of field, not kind of region**: an image
region's *which image goes here* and a painted panel's *which image sits behind
it* both carry it, and the alt text beside the former does not, nor does a run
of copy's words.

It is a **hint about presentation and never a constraint**. The closed list is
unchanged — the same options, the same narrowing to what an image can point at,
the same inclusion of the handle the region holds now, the same order — and
membership is still enforced against that list and nothing else. A value outside
the list is refused exactly as before, whether or not the caller paid the
declaration any attention; and a caller that ignores it is offered no wider set
of values than one that honours it.

## Verification

In a seeded site whose asset store holds several images, ask an image region
what it exposes and assert the image field is a closed-list field that declares
its options are images, while its alt-text field carries no such declaration.
Ask the same of a painted panel carrying a background image and assert its one
field declares the same thing; ask it of a run of copy and assert its field
declares nothing of the kind.

Assert the option lists themselves are unchanged by the declaration: the same
handles, each once, in the same stable order, still including the handle the
region currently holds. Submit a well-formed handle that is not among a
region's options and assert it is still refused at the field with the draft
unchanged, and that a handle that *is* among them is still accepted. Assert the
declaration is present in the answer read through the builder origin as well as
from the command line.
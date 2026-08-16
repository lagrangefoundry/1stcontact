---
uid: acceptance_criterion-3dc77086
id: AC-1146
type: acceptance_criterion
title: A colour the shade axis cannot reach becomes its own exact entry rather than
  being approximated into a family
created_by: xgd
created_at: '2026-08-16T22:26:19.022903+00:00'
updated_at: '2026-08-16T22:26:19.022903+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-5e7eb0c5
  kind: behavior
  regression_only: false
---

## Criterion

A colour the shade axis cannot reach is not approximated into a family it does
not belong to: it becomes its own palette entry and stays a byte-exact literal.

The whole of that population is colours **more saturated than their family's
base**. Mixing toward black or white drives chroma to zero and never raises it,
so a shade can only produce a *less* saturated colour than the entry it is a
shade of — a more saturated sibling is not a shade of anything, and the
derivation files it honestly as its own entry rather than widening the tolerance
to keep the family nominally intact.

The consequence is visible in the retrofitted sites: seven colours split out this
way, and the resulting palettes are larger than the named-step model produced
while every one of those seven still resolves to exactly the colour it always
was.

## Verification

Derive a palette from a family containing a member more saturated than every
candidate base and assert that member resolves to its own entry, that its
reference carries no shade, and that resolving it yields the original literal
byte for byte. Assert the same colour is not reported as accepted drift, since it
was never approximated. Over a retrofitted stored site, assert every reference
carrying no shade resolves byte-exactly to the literal that occupied its position
before the conversion.

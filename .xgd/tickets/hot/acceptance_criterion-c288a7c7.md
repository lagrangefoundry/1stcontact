---
uid: acceptance_criterion-c288a7c7
id: AC-1145
type: acceptance_criterion
title: 'The entry stays the unit of colour change: a shade only removes chroma, and
  every reference counts against its entry'
created_by: xgd
created_at: '2026-08-16T22:15:46.795414+00:00'
updated_at: '2026-08-20T10:08:57.604995+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-c490f1cf
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

Generating the family instead of storing it is what keeps the **entry the unit of
colour change**, and two observable properties are what that rests on:

- **A shade only ever removes chroma.** Both targets the mix moves toward — black and
  white — are achromatic, so no shade of an entry is more saturated than the entry
  itself. The consequence is a real boundary on the model rather than a curiosity: a
  colour more saturated than a candidate base is *not* a shade of it, so it cannot be
  filed under it and must stand as its own entry.
- **A reference counts against its entry whatever shade it carries.** There is no
  per-position tally, because a shade is a position within the entry's own family
  rather than a sibling of it. So the usage count surfaced for an entry ("primary,
  used 40 times") is the whole truth about what editing that entry will move —
  changing the entry repaints every reference to it, at every shade and every
  opacity, which is exactly what stored steps failed to do.

## Verification

Across several base colours spanning hue and saturation, sample the shade axis end to
end and confirm no sampled result is more saturated than its base. Then take a page
whose colour axes reference one entry three ways — plain, at a shade, and at a shade
with an alpha — and confirm all three are counted against that single entry, with the
tally showing three uses of it and no other entry invented for the shaded ones.
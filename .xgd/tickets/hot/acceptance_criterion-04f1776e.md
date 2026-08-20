---
uid: acceptance_criterion-04f1776e
id: AC-1271
type: acceptance_criterion
title: A colour the site's palette does not hold, a free colour value, an unrecognised
  part or a part out of range is refused server-side at the field
created_by: xgd
created_at: '2026-08-20T02:56:50.312940+00:00'
updated_at: '2026-08-20T03:25:23.928354+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-37a3921b
  kind: behavior
  regression_only: false
---

## Criterion

A colour submitted for a colour field is checked **server-side**, at the field,
before the shared whole-definition validator runs, and refused naming the field
with the draft left byte-for-byte unchanged. Four things are refused:

- **An entry the site's palette does not hold.** The message names the entry that
  was asked for and the entries that exist, because the realistic cause is an
  entry renamed or removed while a form was open and "which entry, and what is
  there instead" is the whole of what the caller needs. On a site with no palette
  at all the message says so instead, since that is the fact that actually
  explains it.
- **A free colour value**, even though it is a perfectly valid colour. That is
  the point rather than an oversight: the picker offers entries, so a free value
  arriving on the wire came from something other than the picker, and honouring
  it would put an off-system colour on the page by the one route the design
  closes.
- **An unrecognised part** on the value — refused rather than quietly dropped,
  so that anything this check admits is something the shared validator will admit
  too.
- **A part outside its stated range**: the position on an entry's light↔dark
  range, and the opacity.

The check is made here rather than left to the shared validator for the reason
every membership check on this surface is: the validator would refuse an unsafe
value but cannot refuse a *safe* one the site simply does not have, and it could
not say which field was at fault if it did.

## Verification

Seed a site with a palette of known entries and a run whose colour is a free
literal. Submit, in turn, a reference to an entry the palette does not hold, a
free colour value, a value carrying an unrecognised part, a position beyond the
range, and an opacity beyond the range. Assert each is refused with the fault
path naming the colour field; that the unknown-entry message names both the entry
asked for and the entries available; and that after all of them the stored draft
is byte-identical to what it was before the first. Repeat the unknown-entry
submission against a site whose definition declares no palette and assert the
message says the site has no palette yet.
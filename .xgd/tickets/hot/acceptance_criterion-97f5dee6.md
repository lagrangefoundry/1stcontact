---
uid: acceptance_criterion-97f5dee6
id: AC-988
type: acceptance_criterion
title: A change map naming a field the region does not have, a value of the wrong
  shape for that field, a choice the region never offered, or a field it offered read-only,
  is refused rather than ignored
created_by: xgd
created_at: '2026-08-07T02:02:40.679901+00:00'
updated_at: '2026-08-16T06:55:34.522821+00:00'
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

Every entry in a change map is checked before any is applied. Four kinds of entry
are refused — never silently dropped — each naming the offending field, and in
every case nothing is written:

- An entry naming a field the addressed region does not expose, because such a
  map means the caller resolved against a different region than it is writing to.
- An entry whose value is not of the shape **that field** declared. The test is
  per-field rather than blanket: the region says of each field whether it holds
  text, one of a closed list, a whole number or a yes/no, and the value is
  measured against that. A bit posted for a number, a number posted for a string
  and a fractional value posted for a whole number are each refused at the field
  that declared otherwise.
- An entry for a field that offers a **closed list of choices**, whose value is
  not one of those choices. This refusal is made at the field, before the shared
  whole-definition validator runs, because it is one the validator structurally
  cannot make: a handle to an asset the site does not have — or a weight the site
  serves no face for — is a perfectly well-formed, safe value, so validation would
  accept it and the page would then render a broken image, or a synthetic face,
  with no error at all. A caller holding a stale idea of what the site has is the
  realistic source.
- An entry for a field the region offered **read-only**. The widget draws such a
  field unchangeable, so a value for it can only have come from a caller that
  ignored what the region said about itself, and the reason it is read-only is a
  fact about the site that a submission cannot alter.

## Verification

Submit a change map with an unknown field name and assert it is refused with the
field named in the fault, and the draft unchanged. Submit, for each shape of
field a region exposes, a value of a different shape — a list or an object where
text is expected, a fractional or non-numeric value where a whole number is
expected, a non-boolean where a yes/no is expected — and assert each is refused
naming that field. Submit, for an image region, a handle that is safe and
well-formed but names no asset the site has, and assert it is refused naming the
field, with the draft unchanged and the region still pointing at its previous
image. Submit a value for a field the region offered read-only and assert the
same. Confirm the region's existing values are intact afterwards in every case.
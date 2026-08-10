---
uid: acceptance_criterion-97f5dee6
id: AC-988
type: acceptance_criterion
title: A change map naming a field the region does not have, a value that is not text,
  or a choice the region never offered, is refused rather than ignored
created_by: xgd
created_at: '2026-08-07T02:02:40.679901+00:00'
updated_at: '2026-08-10T07:40:24.558685+00:00'
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

Every entry in a change map is checked before any is applied. Three kinds of
entry are refused — never silently dropped — each naming the offending field,
and in every case nothing is written:

- An entry naming a field the addressed region does not expose, because such a
  map means the caller resolved against a different region than it is writing to.
- An entry whose value is not text.
- An entry for a field that offers a **closed list of choices**, whose value is
  not one of those choices. This refusal is made at the field, before the shared
  whole-definition validator runs, because it is one the validator structurally
  cannot make: a handle to an asset the site does not have is a perfectly
  well-formed, safe value, so validation would accept it and the page would then
  render a broken image with no error at all. A caller holding a stale list of
  the site's assets is the realistic source.

## Verification

Submit a change map with an unknown field name and assert it is refused with the
field named in the fault, and the draft unchanged. Submit a map whose value is a
number, a list or an object and assert the same. Submit, for an image region, a
handle that is safe and well-formed but names no asset the site has, and assert
it is refused naming the field, with the draft unchanged and the region still
pointing at its previous image. Confirm the region's existing values are intact
afterwards in every case.
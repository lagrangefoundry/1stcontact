---
uid: acceptance_criterion-db9faa7b
id: AC-1121
type: acceptance_criterion
title: 'A bounded control''s range binds a change and never the status quo: an unchanged
  out-of-range value survives a re-save, while a new out-of-range value is refused
  rather than clamped'
created_by: xgd
created_at: '2026-08-12T18:08:23.057371+00:00'
updated_at: '2026-08-12T21:28:33.200969+00:00'
completed_at: null
last_field_updated: title
status: active
fields:
  story_uid: story-37a3921b
  kind: behavior
  regression_only: false
---

## Criterion

A bounded control's range binds a **change** and never the status quo. This holds
of every bounded control this surface offers — a run's size, and equally a
picture's pan, corner rounding, turn, scale and every colour adjustment.

A value equal to the one the region just reported is accepted whatever it is,
including a value outside the range. This is not leniency. A saved form carries
every field the region exposed, not only the ones that were touched, so a run the
page was captured with at 160px would otherwise be refused — or worse, quietly
resized — because someone opened it to fix a typo. A picture folded from a
capture as a fully-round avatar carries a corner rounding far outside anything
the control offers, and would otherwise be unopenable and unsavable for the same
reason. A range is a statement about what may newly be asked for, not a claim
that every page already complies.

A **new** value outside the range is refused at the field, in a message naming
the bound and the value asked for, with nothing written and the region's stored
parameters untouched. It is never clamped to the nearest permitted value: quietly
reshaping a page nobody edited is the worse failure of the two, and it is
invisible.

## Verification

Seed a run whose size is outside the control's range and assert the region
reports that size as its current value. Save that run with new words and its size
unchanged, and assert the save succeeds, reports only the words as changed, and
leaves the stored size untouched. Then ask for a size above the maximum and one
below the minimum, and assert each is refused with a message naming the bound,
with the stored size still untouched in both cases and no value clamped into the
range. Repeat both halves on an image: seed a picture whose corner rounding is
outside the control's range, assert the region reports it, and assert re-saving
it alongside a new alt text succeeds and reports only the alt text as changed;
then ask for a colour adjustment, a pan and a scale outside their ranges and
assert each is refused naming its bound, with the stored draft byte-for-byte
unchanged after every refusal.

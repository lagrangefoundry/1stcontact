---
uid: acceptance_criterion-97dc16b1
id: AC-1272
type: acceptance_criterion
title: A colour equal to the one the region reported is not a change, is not converted,
  and a reference is stored in its canonical form
created_by: xgd
created_at: '2026-08-20T02:56:56.023819+00:00'
updated_at: '2026-08-20T02:56:56.023819+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-37a3921b
  kind: behavior
  regression_only: false
---

## Criterion

A colour equal to the one the region just reported is **not a change**: it
passes every check whatever shape it is in, is absent from the list of fields the
save reports as changed, and leaves the region's colour exactly as it found it.

This is what makes the rest of colour usable at all. A saved form carries every
field the region exposed, not only the ones that were touched, and every region
of every folded site holds a free colour literal — which a new value would be
refused for. Without the carve-out, colour's arrival would have made the *words*
of every run on every folded site uneditable.

Nor is the unchanged literal quietly "helped" into a reference. A save that
rewrote the words of a run holding a literal colour leaves that literal exactly
as it was: a conversion nobody asked for is still an edit nobody asked for.

The same rule read from the other side is that a reference is stored in its
**canonical** form. The position and the opacity a resolver treats as absent are
pruned before the write, so a picker that always sends its slider position writes
the reference the document means rather than a fatter one that resolves
identically — and a colour that did not move can never appear as a diff.

## Verification

Seed a run whose colour is a free literal and rewrite only its words, re-posting
the literal alongside them. Assert the save succeeds, that the changed-field list
names the words alone, that the stored run still carries the literal unchanged,
and that the words landed. Separately, write a reference carrying a position and
an opacity at the values the resolver treats as absent, and assert the stored
reference carries neither. Re-post that stored reference unchanged and assert the
save reports nothing changed and leaves the draft byte-identical.

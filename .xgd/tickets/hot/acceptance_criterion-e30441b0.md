---
uid: acceptance_criterion-e30441b0
id: AC-1246
type: acceptance_criterion
title: Confirming a pick resolves to a palette reference — the entry, and a position
  only when it is not the colour itself — never a typed colour
created_by: xgd
created_at: '2026-08-20T01:59:09.682180+00:00'
updated_at: '2026-08-20T01:59:09.682180+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-4300366a
  kind: behavior
  regression_only: false
---

## Criterion

Opened to supply a value, confirming a selection resolves to a **palette reference** and closes: the
chosen entry's name, plus the chosen position when that position is not the colour itself. At the
colour itself the reference carries the name alone, with no position key at all — so a reference
produced here is byte-identical to the reference a plain literal converts to.

The resolved value is never a typed colour and never carries transparency, and confirming is
unavailable until an entry has been chosen.

## Verification

Open the surface to supply a value, select an entry, move the position off-centre and confirm;
observe the opener receive exactly the entry name and that position, and nothing else. Repeat
leaving the position at the colour itself; observe the opener receive the entry name with no
position key present (not a position of zero). Inspect the resolved value in both cases and confirm
it contains no colour string and no transparency. Confirm with no entry selected and observe the
surface stays open and resolves nothing.

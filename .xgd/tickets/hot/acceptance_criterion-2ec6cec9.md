---
uid: acceptance_criterion-2ec6cec9
id: AC-1281
type: acceptance_criterion
title: A site with an empty palette still offers the colour row, and it opens the
  palette in its no-colours-yet state rather than an empty or broken control
created_by: xgd
created_at: '2026-08-20T03:38:54.574222+00:00'
updated_at: '2026-08-20T03:38:54.574222+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-3bf94bd4
  kind: behavior
  regression_only: false
---

## Criterion

A site whose palette is empty — or which has no palette at all — still gets the
colour row on every region that exposes a colour, and activating it opens the
palette surface in its **"no colours yet, add one"** state, naming the site, with
the way to add the first entry present. It is not an empty control, not a broken
one, and not a control that has been withdrawn.

This is the ordinary first state rather than an edge case: a site folded from an
existing design holds raw colours and no palette, so the picker opening onto
nothing is what most sites do the first time someone reaches for a colour.
Withdrawing the field there would make the palette unreachable from the one
surface that wants one — the picker is also where the first entry gets added, so
the recovery from "no colours yet" is one gesture inside the surface the operator
already opened, not a trip to another screen.

Until an entry exists there is nothing to choose, so a colour cannot be committed
from that state; adding one and choosing it is a single continuous gesture that
ends with the region painted.

## Verification

Open the dialog over a run of copy on a site with no palette entries. Assert the
colour row is still offered. Activate it and assert the palette surface opens
showing its empty state — naming the site, saying there are no colours yet, and
offering to add one — rather than an empty list or a control that does not open.
Add an entry there, choose it, Save, and assert the region is painted with it.

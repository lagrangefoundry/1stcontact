---
uid: acceptance_criterion-d6db5412
id: AC-1129
type: acceptance_criterion
title: Panning a picture writes a typed percentage pair — both components or neither
  — and returning it to centre removes the pair rather than recording the browser's
  own value
created_by: xgd
created_at: '2026-08-12T21:28:48.818297+00:00'
updated_at: '2026-08-12T21:28:48.818297+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-37a3921b
  kind: behavior
  regression_only: false
---

## Criterion

Choosing which part of a picture its box shows writes a **typed pair of
percentages** — how far across and how far down — onto the region, and the
rendered page positions the picture accordingly.

**Both components or neither.** A position that named only one of the two would
be completed silently by the browser at dead centre, which is a value the page
never said. So the pair is written whole whenever either half moves, seeded from
whatever the region currently reports.

**Centre removes it.** Returning both halves to dead centre removes the pair
from the region rather than recording the browser's own default, so a picture put
back where it started is byte-identical to one that was never moved.

Only one of the two components may be named in a change map; the other keeps the
value the region reported.

## Verification

Address an image region that declares no position at all and assert it reports
dead centre for both components. Save a new value for the down component alone
and assert the save succeeds, reports only that field as changed, and the stored
region carries both components — the untouched one at centre, the changed one at
the new value. Assert the rendered page positions the picture at that pair. Save
the down component back to centre and assert the pair is absent from the stored
region entirely.

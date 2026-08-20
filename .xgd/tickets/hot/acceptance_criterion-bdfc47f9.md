---
uid: acceptance_criterion-bdfc47f9
id: AC-1274
type: acceptance_criterion
title: A run whose glyphs are painted by a gradient has its colour offered unavailable
  with a reason, still in position, while the same control on an ordinary run is untouched
created_by: xgd
created_at: '2026-08-20T02:57:26.639515+00:00'
updated_at: '2026-08-20T03:25:22.956140+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-37a3921b
  kind: behavior
  regression_only: false
---

## Criterion

A run of copy whose glyphs are painted by a **gradient** has its colour field
offered **unavailable**, with a reason naming the gradient and the way round it.

The cause is that the control would be *inert*: painting glyphs with a gradient
requires the run's flat colour to be transparent, so the parameter the picker
writes is still there, still valid, and paints nothing. The operator would pick a
colour, save, and the words would not move — which is the worst failure available
to this surface, because it looks like the editor lost the edit. It is *lossy* in
the same breath: a gradient is several stops and an angle, and one colour field
can only flatten that.

The field is **still offered**, **still in the same position** in the answer, and
**still reports what the run holds** — a measured example carries a real,
editable, meaningless colour underneath its gradient, and that is exactly the row
worth marking rather than hiding. Withdrawing it would say the editor has no
colour control at all, which is a different and wrong claim.

And the identical control on an ordinary run beside it is **untouched**: live, no
reason, freely settable. Unavailability is a statement about one element, not
about the build.

## Verification

Seed a page with two runs side by side, one carrying a gradient over its glyphs
and a flat colour underneath, the other carrying only a flat colour. Assert the
first run's colour field is present, in the same position as the second's, marked
unavailable, reporting the flat colour it holds, and carrying a reason that names
the gradient and the route to getting it changed. Assert the second run's colour
field is present, not marked unavailable, carries no reason, and accepts a new
palette entry that the re-rendered page paints.
---
uid: acceptance_criterion-1e5570ac
id: AC-1626
type: acceptance_criterion
title: A captured element's per-side padding folds onto its leaf and insets content
  inside the pinned border box
created_by: martin-github@westhead.me
created_at: '2026-09-10T14:09:32.991780+00:00'
updated_at: '2026-09-10T14:09:32.991780+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-8acc338d
  kind: behavior
  regression_only: false
---

## Criterion
A captured element's per-side padding folds onto the leaf it becomes — a text, image
or box leaf — as the typed `padding` axis, carrying top, right, bottom and left
independently.

Because the capture measures a **border box**, the pad is already inside the geometry
the fold pins. Folding it therefore **insets the leaf's content** within that pinned
box rather than inflating the box: a badge or a control keeps its shape and its click
target while its outer geometry stays exactly where the capture found it. A side that
is zero, absent, or outside the envelope's range is dropped, and an element with no
positive padding on any side emits no `padding` axis at all.

## Verification
Fold a capture containing an element with asymmetric non-zero padding on all four
sides and an element with none. Assert the first leaf carries a `padding` axis whose
four sides equal the captured per-side values (within integer rounding) and that its
geometry keyframes are unchanged by the fold of the padding — the pinned box still
equals the captured border box. Assert the second leaf carries no `padding` axis, and
that a captured element with only zero-valued sides likewise emits none. Assert the
folded document validates against the L1 envelope, and render it to confirm the
padded leaf's content is inset inside its pinned box rather than the box being grown.

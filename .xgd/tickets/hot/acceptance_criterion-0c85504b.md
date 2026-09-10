---
uid: acceptance_criterion-0c85504b
id: AC-1117
type: acceptance_criterion
title: Asking a copy region what it exposes returns how the run is set beside its
  words — size, weight, italic and capitalisation, each closed or bounded and derived
  from the document's declared faces
created_by: xgd
created_at: '2026-08-12T18:08:03.837269+00:00'
updated_at: '2026-09-10T18:29:52.277460+00:00'
completed_at: null
last_field_updated: body
status: active
fields:
  story_uid: story-37a3921b
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

A region that holds a run of copy answers with its words first and **how the run
is set** beside them:

- **Size** — a whole number of pixels carrying its inclusive bounds. Offered only
  where the run declares a size of its own: a run that inherits its size has no
  honest number to show, because the value it renders at lives in the browser
  rather than in the page's definition, and a fabricated number is worse than an
  absent control.
- **Weight** — a pick from a closed list. Offered only where that list holds more
  than one option, because a chooser holding the only value it offers is a label
  wearing a control's clothes.
- **Italic** — a yes/no. Always offered.
- **Capitalisation** — a pick from the closed keyword list the parameter itself
  admits. Always offered.

These follow the run's colour, which sits between the words and the first of
them; what that field reports and what it writes are not this criterion's
business.

The values reported are the run's own as they stand in the draft — for size the
run's **representative (widest)** value rather than any one viewport's keyframe,
and for weight the run's own where it declares one, **seeded from the lowest
declared face** where it does not. That seed is the one reported value not read
from the node: a chooser has to show something selected, where a size control is
withheld instead, and it is why echoing the seed straight back is not a change.

What the weight list holds, and whether italic can be changed at all, are decided
by the **faces the document declares** — the served glyphs the page actually
ships. Those are a property of the document rather than of the region, and they
reach the derivation exactly as the site's image listing does: passed in, so the
answer stays a pure function of the page and never reads a directory. This holds
for a run inside a behavior module's presentation slot too, and there the faces
are the **page's own**, because a served face is declared once per rendered
document — taking them from anywhere else would offer a weight the rendered page
cannot serve.

Nothing else about the run is exposed. Not its family, and nothing geometric.

## Verification

In a seeded site whose page declares several font faces, address a run of copy
and request its fields. Assert the fields are the words, then the colour, then
size, weight, italic and capitalisation, in that order; that size is a
whole-number field carrying its inclusive bounds; that weight and capitalisation
are closed lists; and that italic is a yes/no. Assert the reported values are the
run's own — the representative size for a run whose size varies by viewport, and
the weight it is actually set in. Then address a run on the same page that
declares **no** weight of its own and assert the reported weight is the lowest
face the document declares; re-post that reported value alongside new words and
assert the save succeeds and reports the words alone as changed. Assert no family
field is offered.

Assert every field offered is one of the five control shapes this surface can
produce, and that every closed list is non-empty.

Assert a run declaring no size of its own is offered no size field, and that a
run whose family yields fewer than two weight options is offered no weight field.
Address a run inside a behavior module's presentation slot and assert its weight
options are those the page's own document declares.

---
uid: acceptance_criterion-0c85504b
id: AC-1117
type: acceptance_criterion
title: Asking a copy region what it exposes returns how the run is set beside its
  words — size, weight, italic and capitalisation, each closed or bounded and derived
  from the document's declared faces
created_by: xgd
created_at: '2026-08-12T18:08:03.837269+00:00'
updated_at: '2026-08-12T18:08:03.837269+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-37a3921b
  kind: behavior
  regression_only: false
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

The values reported are the run's own as they stand in the draft, and for size
that is the run's **representative (widest)** value rather than any one
viewport's keyframe.

What the weight list holds, and whether italic can be changed at all, are decided
by the **faces the document declares** — the served glyphs the page actually
ships. Those are a property of the document rather than of the region, and they
reach the derivation exactly as the site's image listing does: passed in, so the
answer stays a pure function of the page and never reads a directory. This holds
for a run inside a behavior module's presentation slot too, and there the faces
are the **page's own**, because a served face is declared once per rendered
document — taking them from anywhere else would offer a weight the rendered page
cannot serve.

Nothing else about the run is exposed. Not its colour, not its family, and
nothing geometric.

## Verification

In a seeded site whose page declares several font faces, address a run of copy
and request its fields. Assert the fields are the words followed by size, weight,
italic and capitalisation; that size is a whole-number field carrying its
inclusive bounds; that weight and capitalisation are closed lists; and that
italic is a yes/no. Assert the reported values are the run's own — the
representative size for a run whose size varies by viewport, and the weight it is
actually set in. Assert no colour and no family field is offered.

Assert every field offered is one of the four control shapes this surface can
produce, and that every closed list is non-empty.

Assert a run declaring no size of its own is offered no size field, and that a
run whose family yields fewer than two weight options is offered no weight field.
Address a run inside a behavior module's presentation slot and assert its weight
options are those the page's own document declares.

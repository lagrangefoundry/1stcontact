---
uid: acceptance_criterion-15ea0e87
id: AC-1040
type: acceptance_criterion
title: The editing box reproduces the copy's typography and the paint actually under
  it, in the page's own paint order
created_by: xgd
created_at: '2026-08-10T07:47:28.663591+00:00'
updated_at: '2026-08-16T04:19:18.360691+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-3bf94bd4
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

For a run of copy, the editing box reproduces that region's own presentation as
the page renders it: family, weight, style, letter-spacing and colour, together
with the stack of paint behind it. Every value is read off the rendering the
operator is looking at, not derived from the stored definition — a run inherits
most of its presentation from around it, so the definition describes only what
that run overrode, and the rendered answer is the truthful one.

What is behind the words is decided by **what is painted under them**, in the
order the page paints it — not by walking outward through containing regions. A
backdrop that is a neighbouring layer rather than a containing one is therefore
still the backdrop the operator sees: a light run over a dark photograph must
never preview as that run over a pale wrapper further out, which is exactly the
misreport an outward walk produces on a page whose layers are positioned rather
than nested. The stack is taken down to the first opaque fill and no further, so
a translucent scrim stays composited over what it dims, and it is bounded so a
pathological page cannot pile up layers in the dialog.

Each layer is drawn at its **own source region's** dimensions, offset by the
edited region's position within it and clipped by the box — so a covering
photograph's crop and a gradient's stops resolve against the dimensions they
resolved against on the page, and what shows through the box is precisely the
region of background that sits behind the copy. No contrast is substituted or
corrected: if the copy is readable on the page it is readable in the box, which
is the whole argument for mirroring rather than choosing.

This dressing applies to words on the page only. A field that is metadata
*about* the page — an image region's handle or its alt text — is not dressed as
page copy, because rendering an alt string in the surrounding headline's display
face would assert something false about where that text ends up.

## Verification

On a rendering whose copy carries a distinctive family, weight and colour and
sits over a painted backdrop that is a sibling layer rather than an ancestor,
open the form over that copy. Assert the box's resolved family, weight, style,
letter-spacing and colour are the ones the page computes for that run, and that
the backdrop reproduced is the sibling layer's paint — not the paint of the
nearest containing region. Assert a translucent layer over an opaque one yields
both, bottom-most first, each carrying its own source region's dimensions and an
offset placing the edited region correctly within it, and that nothing below the
opaque fill is included. Then open the form over an image region and assert none
of the copy presentation is applied to its fields.
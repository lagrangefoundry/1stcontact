---
uid: acceptance_criterion-170a171f
id: AC-1050
type: acceptance_criterion
title: Clicking a painted panel opens its background — the image where there is one
  and the colour always — over the same transport, with refusals field-scoped
created_by: xgd
created_at: '2026-08-10T08:23:33.410053+00:00'
updated_at: '2026-08-20T03:37:10.717194+00:00'
completed_at: null
last_field_updated: title
status: active
fields:
  story_uid: story-3bf94bd4
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

The gesture is kind-agnostic a second time over: a click that resolves to a
**painted panel** opens the same single form dialog a copy region and an image
region open, built from whatever that region exposes — over the same transport,
with the same click resolution, the same form, and the same Save-is-one-change
rule. Nothing about the gesture differs for this region kind. A panel that once
answered "nothing to edit here" now opens the form purely because the region
started answering with a field.

A panel **carrying a background image** exposes a closed picker of the site's own
images, drawn as the **same grid of thumbnails** an image region's own picker is
drawn as, over the same listing, pre-filled with the handle the panel paints now
and always including it among the options as the one selected. What a panel can
sit in front of and what it can sit behind are one question asked twice, so they
are answered by one control.

Every painted panel — with a background image or without one — also exposes the
**colour it is painted**, drawn as the same colour row a run's own colour is drawn
as and writing a palette reference the same way. So a panel that paints only a
radius, or only an image, is no longer a dead end: it can be given a background
colour it did not have. A panel painting nothing at all is a different thing
entirely — it is not a region, carries no address and cannot be clicked — so
there is no gesture that reaches it and no empty form to open.

Because such a panel exposes **no text at all**, the dialog builds no
text-editing box: it is the picker where there is one, the colour row, the
footer, and nothing else. An empty box would frame a void under the thumbnails.

A choice the surface refuses comes back as a **field-scoped refusal** over that
same transport: the form stays open holding what the operator chose, showing the
reason, with the page they are looking at and their draft unchanged.

## Verification

Over an editable rendering served by the workspace origin, resolve a click
landing on a painted panel carrying a background and assert it resolves to that
region. Assert the dialog opened for it carries one closed-option field presented
as the same thumbnail grid, offering the same images an image region is offered,
with the handle the panel paints now the selected tile — and no text-editing box.
Save a different choice and assert the page the operator is looking at repaints
with it, that the panel's other paint is unchanged, and that it stays editable.
Submit a handle the site does not offer and assert the refusal returns
field-scoped over the same transport, the form remains open with the reason
shown, and the page and draft are unchanged.

Then click a painted panel that carries **no** background image and assert the
dialog opens offering its background colour rather than the nothing-to-edit
message, and that a colour chosen there lands on that panel. Assert a box or
container that paints nothing at all is not offered as a region at all.

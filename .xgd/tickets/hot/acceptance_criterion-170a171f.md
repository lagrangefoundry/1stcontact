---
uid: acceptance_criterion-170a171f
id: AC-1050
type: acceptance_criterion
title: Clicking a painted panel opens the background picker over the same transport
  as a copy or image edit, and a rejected choice comes back field-scoped
created_by: xgd
created_at: '2026-08-10T08:23:33.410053+00:00'
updated_at: '2026-08-16T04:19:25.030037+00:00'
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

The gesture is kind-agnostic a second time over: a click that resolves to a
**painted panel already carrying a background image** opens the same single form
dialog a copy region and an image region open, built from whatever that region
exposes — here one closed picker of the site's own images, drawn as the **same
grid of thumbnails** an image region's own picker is drawn as, over the same
listing, pre-filled with the handle the panel paints now and always including it
among the options as the one selected. What a panel can sit in front of and what
it can sit behind are one question asked twice, so they are answered by one
control.

Nothing about the gesture differs for this region kind: the same click
resolution, the same form, the same transport, the same Save-is-one-change rule.
A panel that previously answered "nothing to edit here" now opens the form
purely because the region started answering with a field.

Because such a panel exposes **no text at all**, the dialog builds no
text-editing box: it is the grid, and the footer, and nothing else. An empty box
would frame a void under the thumbnails.

A choice the surface refuses comes back as a **field-scoped refusal** over that
same transport: the form stays open holding what the operator chose, showing the
reason, with the page they are looking at and their draft unchanged.

A panel carrying paint but no background image remains an honest dead end — it
says there is nothing to edit there rather than opening an empty form or
offering to add a background.

## Verification

Over an editable rendering served by the workspace origin, resolve a click
landing on a painted panel carrying a background and assert it resolves to that
region. Assert the dialog opened for it carries one closed-option field presented
as the same thumbnail grid, offering the same images an image region is offered,
with the handle the panel paints now the selected tile, and no other control —
specifically no text-editing box. Save a different choice and assert the page the
operator is looking at repaints with it, that the panel's other paint is
unchanged, and that it stays editable. Submit a handle the site does not offer
and assert the refusal returns field-scoped over the same transport, the form
remains open with the reason shown, and the page and draft are unchanged. Click a
painted panel with no background and assert the nothing-to-edit message appears
instead of a form.
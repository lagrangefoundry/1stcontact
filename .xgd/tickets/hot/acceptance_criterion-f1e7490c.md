---
uid: acceptance_criterion-f1e7490c
id: AC-1084
type: acceptance_criterion
title: A map entry's label identifies the element without reproducing it, and no styling
  information appears in the map
created_by: xgd
created_at: '2026-08-10T09:19:44.009928+00:00'
updated_at: '2026-08-16T02:37:23.682749+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-189fc1ac
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

Each map entry carries a short label sufficient to recognise the element among its
siblings and no more: a text run is labelled by its own words (whitespace collapsed, and
truncated with an ellipsis beyond a short bound); an image by its alt text, or its file
when it has no alt text; a control by the control's name; a component seam by its slot
name (and its behaviour kind when it names one); a box or row by its layout and how many
children it has.

No styling information reaches the map at any entry — none of the typed appearance
properties an element carries appear in it, whatever the element. Consequently, the map's
size follows the number of elements on the page and is unaffected by how richly those
elements are styled.

## Verification

Map a page whose elements carry substantial styling and whose text runs include one
longer than the label bound. Assert each label against the rule for its kind (long text
truncated with an ellipsis; a container labelled with its layout and child count). Assert
that the serialised map contains none of the styling property names present in the seeded
definition. Compare the size of the map for a lightly styled page against the same tree
heavily styled: it does not grow.
---
uid: acceptance_criterion-88abd570
id: AC-1509
type: acceptance_criterion
title: The layout reference names every element kind, its fields and permitted values,
  and the limits a page is held to
created_by: xgd
created_at: '2026-09-04T02:27:09.714392+00:00'
updated_at: '2026-09-04T02:41:24.844762+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-0d7d3aad
  kind: behavior
  regression_only: false
---

## Criterion

The layout reference names every kind of element a page may contain, and for each kind lists the fields it accepts, each field's permitted values or numeric bounds, and whether it may be omitted. Shapes that several kinds share are described once and referred to by name wherever they are used rather than repeated. It also states the limits every page is held to, and that a page outside them is refused whole rather than quietly clamped.

The value sets and bounds a reader is told about are the ones the page vocabulary actually enforces — the failure this exists to prevent is a document offering a value the vocabulary stopped accepting three releases ago.

## Verification

Read the generated layout reference and assert every element kind the page vocabulary permits is named, with the fields it declares. For an element kind with a closed value set, assert the document lists that set and nothing outside it; for a bounded number, assert the bound stated matches the one enforced. Assert the document names the whole-page limits and states that a page outside them is refused rather than clamped. Assert a shape used by several kinds appears as one named description rather than repeated per use.
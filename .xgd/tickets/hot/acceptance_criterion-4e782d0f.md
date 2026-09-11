---
uid: acceptance_criterion-4e782d0f
id: AC-1640
type: acceptance_criterion
title: The component reference describes no component the catalogue does not carry
created_by: martin-github@westhead.me
created_at: '2026-09-11T02:36:04.542747+00:00'
updated_at: '2026-09-11T02:51:26.794819+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-5836022a
  kind: behavior
  regression_only: false
---

## Criterion

The component reference describes the components the catalogue carries and no
others: the set of components it documents is exactly the catalogue's set, so a
component the framework does not ship is nowhere in the document.

An assistant told about a component that does not exist invents capability, which
is worse for the person asking than saying nothing — and a document that can
only ever say what its source says is the property that makes a generated
reference trustworthy at all.

## Verification

Extract the set of components the reference documents and compare it, as a set,
with the catalogue's own set of components: they are equal — no extra entries and
no missing ones. Removing a component from the catalogue and regenerating removes
it from the document.
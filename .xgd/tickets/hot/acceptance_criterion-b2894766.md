---
uid: acceptance_criterion-b2894766
id: AC-1639
type: acceptance_criterion
title: The component reference describes every component in the catalogue with its
  settings, value sets, page parts and obligations
created_by: martin-github@westhead.me
created_at: '2026-09-11T02:35:57.561350+00:00'
updated_at: '2026-09-11T02:35:57.561350+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-5836022a
  kind: behavior
  regression_only: false
---

## Criterion

The component reference describes every component the framework's catalogue
carries, and for each one: its name and version, every setting it accepts with
that setting's type and its closed set of permitted values where it has one, every
part of a page it holds, and the obligations it is declared to satisfy. Each
component's facts arrive under that component's own heading, so a retrieved
passage always says which component it is about.

The reference is regenerated from the catalogue, so changing a component's
settings changes the document on the next build with no document edited by hand.

## Verification

Read the component reference and check it against the live catalogue rather than
against a fixture: for every component the catalogue carries, the document names
the component and its version, names each setting and each permitted value of
each closed-value setting, names each part of the page it holds, and names each
declared obligation. Then change a setting's permitted values in the catalogue,
regenerate, and observe the document now states the new values — with no hand
edit.

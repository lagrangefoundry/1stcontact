---
uid: acceptance_criterion-9f74c90f
id: AC-2573
type: acceptance_criterion
title: account-chrome v2 labelMode gives the address field a visible prompt; the invariant
  label is a clipped <label> that every reference surface describes truthfully
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-09T22:52:20.812768+00:00'
updated_at: '2026-11-09T22:52:20.812768+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-179b8c06
  kind: behavior
  regression_only: false
---

## Criterion
**account-chrome's address prompt has a visible route, and its invariant label
is described truthfully everywhere.**

- `account-chrome@2` declares `config.labelMode` with the values `visible` and
  `placeholder` (default `visible`), the same two answers `contact-form` gives.
- With `labelMode: 'placeholder'` the rendered address field carries the
  configured `emailLabel` text as its `placeholder`, so a panel authored purely
  from config (no L1 text run for the prompt) shows a visible prompt.
- With `labelMode: 'visible'` the field has no `placeholder` from the label; the
  visible prompt is left to an L1 text run the author places beside the control.
- Under both modes the published page carries a `<label>` for the field holding
  the configured `emailLabel` text, marked `data-fc-invariant`, associated with
  the field by `for`, and clipped by the module stylesheet to 1×1px so it does
  not paint.
- The control is declared with element `label`, matching what the page emits.
- The edit catalogue does not offer the invariant label as a bindable control.
  The published behavior reference (REF-behaviors) lists it, says it **cannot be
  bound from L1**, and states its pinned presentation in the words the
  declaration gives (visually hidden, clipped to 1×1px). It does not describe the
  label as visible.

## Observable at
The published HTML and stylesheet of a page mounting account-chrome under each
`labelMode`; the behavior catalogue an edit verb lists; the generated behaviors
reference document.

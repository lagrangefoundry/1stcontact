---
uid: acceptance_criterion-4a753cde
id: AC-1278
type: acceptance_criterion
title: Asking a run what it exposes also answers with the nearest painted panel behind
  it and the colour that panel is filled with, read-only
created_by: xgd
created_at: '2026-08-20T02:58:23.988415+00:00'
updated_at: '2026-08-20T02:58:23.988415+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-37a3921b
  kind: behavior
  regression_only: false
---

## Criterion

Asking a run of copy what it exposes also answers with **the panel behind it**:
that panel's own address, and the colour it is filled with, **read-only**.

It is the **nearest** painted ancestor, not the outermost — the panel a person
means by "behind this text" is the one immediately behind the words, not the page
section three levels up — and "painted" is asked by the same test that decides
whether a region is addressable at all, so the address handed back always
resolves to a region that really does expose a fill. An escalation that opened an
empty form would be the symptom of answering that question twice.

It exists because background colour belongs to the panel and not to the words: a
folded run's box is glyph-tight, so a fill written there paints a tight rectangle
behind the words. The panel is already a region in its own right — what was
missing was a way to *reach* it, since innermost-wins addressing means clicking
the words opens the run, and a container fully occluded by its own lone run was
measured on a real page, so "click just outside the words" is not always
available.

It is **absent** when the run sits on nothing painted, which is honest: there is
no panel behind this text to edit. And a painted panel carries no such answer of
its own, because a panel is what a run escalates *to*.

Only the answer is claimed here. What the surface that drives this one does with
it — where the swatch is drawn, and how the operator gets there — belongs to that
capability.

## Verification

Seed a page whose root paints, containing a painted panel, containing a run — so
the nearest painted ancestor and the outermost differ. Assert the nested run's
answer names the panel's address and the panel's fill, not the root's; that a run
sitting directly in the root names the root; that a run on nothing painted
carries no such answer; and that a painted panel's own answer carries none.
Assert the address handed back, when addressed in turn, resolves to a region
whose fields include a fill.

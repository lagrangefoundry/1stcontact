---
uid: request-4732258a
id: REQ-314
type: request
title: 'A 1,941-family dropdown is unusable: curated shortlist for the editor font
  control'
created_by: EPIC-21
created_at: '2026-09-23T03:19:38.760798+00:00'
updated_at: '2026-09-23T03:19:38.760798+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  priority: low
  epic_parent: epic-b9b27697
  auto_merge_back: true
  needs_review: false
---

## The gap

[[REQ-312]] mirrors 1,941 families. A `<select>` listing all of them is unusable for a
person — scrolling a list that long is not choosing, and a human editor has none of the
recall that makes the full corpus tractable for the assistant.

## Operator direction (2026-09-22)

> "Ship everything for the AI — for the human drop down in the editor we choose a curated
> list of <100."

## Wanted

A curated shortlist of **under 100 families** for the editor's font control.

**It is a UI affordance, not a gate.** It never narrows what the assistant may choose, and
the assistant does not read it. Two front doors onto one mirror.

The editor must still be able to reach the full mirror for a family outside the shortlist —
by search or by typing a name — so the shortlist is the default view rather than the
boundary. A human who knows they want a specific family should not be told it does not
exist.

## Selection

Cover the range a small-business site actually needs rather than the most popular 100,
which skews heavily to a handful of sans faces:

- text faces that set long copy well, serif and sans
- display faces with enough weight range to carry a wordmark
- at least one credible monospace
- enough stylistic spread that two sites built from the shortlist do not look alike

Every entry comes from the mirror, so nothing here needs its own licence decision.

## Behaviour

- The editor's font control lists under 100 families by default.
- A family outside the shortlist is still reachable from the editor.
- Choosing a shortlist family binds it by the same path `use_font` uses — one binding
  mechanism, not two.
- The shortlist has no effect on what the assistant may choose.

## Priority

Lower than [[REQ-311]], [[REQ-312]] and [[REQ-313]]. Those three unblock the assistant,
which is what the Lagrange Foundry site and the beta need. This one improves a human
surface that has no fonts to show until the mirror exists.

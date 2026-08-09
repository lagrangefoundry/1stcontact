---
uid: acceptance_criterion-1663c20c
id: AC-928
type: acceptance_criterion
title: A site declares an arbitrary-size palette of named colour entries, and every
  colour axis accepts a literal or a reference
created_by: xgd
created_at: '2026-08-06T20:37:37.249492+00:00'
updated_at: '2026-08-09T05:41:38.299459+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-c490f1cf
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

A site definition may declare a **palette**: an arbitrary-size map of free-form
kebab-case entry names (`primary`, `brand-teal`, `surface-accent`) to entries. An
entry carries an **opaque** hex value (`#rgb` / `#rrggbb`) and, optionally, named
kebab-case steps each carrying an opaque hex — so a ramp belongs to its role rather
than being spread across sibling role names.

The vocabulary is a starting set, not a constraint: any kebab-case name is accepted
and the palette has no fixed size or fixed slots.

Every colour axis in the layout substrate — gradient stops, shadows, borders,
textures, link states, surface fills and the rest — accepts **either** a hex literal
**or** a reference to a palette entry, optionally naming one of its steps. Both forms
paint the same value.

An entry value carrying alpha (an 8-digit hex) is rejected: entries are opaque by
construction, because translucency is an axis of the reference.

## Verification

Declare a site palette with several free-form kebab-case entries, one of them
carrying named steps, and author a page whose colour axes mix hex literals with
references to those entries and steps; confirm the site validates and renders, that
the same acceptance holds across the different colour axes rather than one favoured
one, and that a palette entry whose value carries an alpha byte is rejected.
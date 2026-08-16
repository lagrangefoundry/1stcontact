---
uid: acceptance_criterion-1663c20c
id: AC-928
type: acceptance_criterion
title: A site declares an arbitrary-size palette of single-colour entries, and every
  colour axis accepts a literal or a reference
created_by: xgd
created_at: '2026-08-06T20:37:37.249492+00:00'
updated_at: '2026-08-16T22:14:52.145029+00:00'
completed_at: null
last_field_updated: title
status: active
fields:
  story_uid: story-c490f1cf
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion

A site definition may declare a **palette**: an arbitrary-size map of free-form
kebab-case entry names (`primary`, `brand-teal`, `surface-accent`) to entries.

**An entry is exactly one colour**: an **opaque** hex value (`#rgb` / `#rrggbb`)
and nothing else. It carries no ramp and no named steps — a light↔dark family is
generated from the entry rather than stored beside it. The entry object is closed,
so a definition carrying a step is *rejected* rather than read-and-ignored: there
is no legacy reader and no dual path, and the failure is loud at the point the
document is validated.

The vocabulary is a starting set, not a constraint: any kebab-case name is accepted
and the palette has no fixed size or fixed slots.

Every colour axis in the layout substrate — gradient stops, shadows, borders,
textures, link states, surface fills and the rest — accepts **either** a hex literal
**or** a reference to a palette entry. A reference names an entry and may carry the
entry's two variation axes, `shade` and `alpha`, and nothing else; it can no longer
name a step. Both forms paint the same value.

An entry value carrying alpha (an 8-digit hex) is rejected: entries are opaque by
construction, because translucency is a reference axis.

The claim holds of the store, not only of the schema: no site definition on disk
declares an entry carrying anything beyond its value, and no page reference names a
step.

## Verification

Declare a site palette with several free-form kebab-case entries and author a page
whose colour axes mix hex literals with references to those entries; confirm the
site validates and renders, and that the same acceptance holds across the different
colour axes rather than one favoured one. Confirm an entry carrying a step is
rejected rather than accepted-and-stripped, and that a palette entry whose value
carries an alpha byte is rejected.

Then walk every stored site and assert the same of what is actually on disk: each
declared entry carries a value and nothing else, and every page reference carries
only an entry name plus optionally a shade and an alpha. Enumerate the store by
directory so a stray non-site file cannot make the walk fail, and assert the walk
actually examined the stored entries — an empty store satisfies a
"nothing-violates-this" claim for free, so the count is part of the assertion.

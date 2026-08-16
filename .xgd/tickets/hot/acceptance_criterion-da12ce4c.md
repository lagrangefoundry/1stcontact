---
uid: acceptance_criterion-da12ce4c
id: AC-1083
type: acceptance_criterion
title: Mapping a page returns every element on it, including the boxes and rows that
  expose no editable field
created_by: xgd
created_at: '2026-08-10T09:19:39.092839+00:00'
updated_at: '2026-08-16T02:37:22.216032+00:00'
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

Asking the control surface to map a page returns an entry for **every** element in that
page's tree, in document order — not only the ones a person can click and type into. A
box or row that holds other elements and exposes no editable field of its own appears in
the map exactly as a text run does.

Each entry carries:
- the **address** that reaches that element, in the same form the read and replace
  operations take;
- the **kind** of element it is;
- a short **label** (see the separate criterion);
- the **component instance and slot** the address is scoped to, present together and only
  when the element sits inside a component instance.

Elements inside a component instance's slots are mapped as well as the page's own tree.

## Verification

Seed a page whose tree contains layout containers as well as text and image elements,
then ask for the map through the surface. Count and compare the returned entries against
an independent walk of the seeded definition — the comparison must not be against the
mapping implementation's own idea of which elements are interesting. Every element in the
independent walk has exactly one entry, at the address the independent walk computes for
it. Confirm an element inside a component instance's slot appears with its instance and
slot named, and one in the page's own tree appears without them.
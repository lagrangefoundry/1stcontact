---
uid: acceptance_criterion-aa3322ea
id: AC-1085
type: acceptance_criterion
title: Reading an address returns that element and everything inside it exactly as
  stored, unresolved
created_by: xgd
created_at: '2026-08-10T09:19:48.622496+00:00'
updated_at: '2026-08-10T09:29:37.747147+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-189fc1ac
  kind: behavior
  regression_only: false
---

## Criterion

Reading the address of an element returns that element together with everything nested
inside it, byte-for-byte as the site stores it. Nothing is resolved, substituted or tidied
on the way out: a reference to a site-level value comes back as that reference and not as
the value it points at; a per-width variation comes back as the variation and not as one
resolved width; link roles, typed appearance properties and children all come back as
stored.

The reply also states the page, address and component scope the element was read from.

## Verification

Seed an element that carries both a site-level value reference and a per-width variation,
plus nested children. Read its address through the surface and compare the returned
element with the stored definition subtree as a structural equality — the reference is
still a reference and the variation is still a variation. Assert the returned target names
the page and address asked for.
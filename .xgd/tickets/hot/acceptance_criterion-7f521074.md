---
uid: acceptance_criterion-7f521074
id: AC-1395
type: acceptance_criterion
title: A real site copied into the cloud store assembles and renders identically to
  the store it came from
created_by: xgd
created_at: '2026-08-31T09:48:00.109291+00:00'
updated_at: '2026-08-31T09:48:00.109291+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-fde7370b
  kind: behavior
  regression_only: false
---

## Criterion

A real site copied into the cloud store is indistinguishable, downstream, from the same site in the
store it came from.

- **Assembled definition**: the cloud store assembles and validates the site to the same result as
  the source store — the whole assembled, palette-resolved definition compares equal, modulo only
  the descriptive label naming which store served it, which nothing reads when answering a
  request.
- **Rendered output**: rendering from the two stores produces byte-identical output for every
  emitted file, not only the pages — the generated stylesheet and script are where a dropped asset
  or a reordered page would surface.

This holds for the operator's actual sites, not for a hand-written fixture.

## Verification

Take the real site definitions the operator builds with. Load each through a store with nothing
behind it, copy each into the cloud store, and compare the assembled, validated definitions for
equality with the store-identifying label excluded. Separately, render the same definition from
two stores and compare every emitted file byte-for-byte. The two halves meet at the assembled
definition, which is the only input the renderer reads — so equality there plus equality of the
render for equal input is the whole claim.

---
uid: acceptance_criterion-c976d2eb
id: AC-1394
type: acceptance_criterion
title: A site's whole draft copies between any two stores as one whole change, and
  a destination that does not hold the site is refused
created_by: xgd
created_at: '2026-08-31T09:47:56.005033+00:00'
updated_at: '2026-08-31T09:47:56.005033+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-fde7370b
  kind: behavior
  regression_only: false
---

## Criterion

One site's whole draft can be copied from any store into any other, in either direction, without
either end knowing which kind of store the other is.

- What crosses is the definition, every page and every asset's bytes; the copy reports which of
  those it moved (whether a definition was present, the page names in load order, the asset names
  sorted).
- **It crosses as one whole change**, so against the transactional store the copy lands whole or
  not at all: a copy that failed part-way leaves the destination with no pages from it at all
  rather than some of them.
- A destination that does not already hold the site is **refused**, naming that as the reason. The
  copy does not create sites; making a site exist is the store's own administrative operation, and
  a copy that invented sites could resurrect one that was deliberately dropped.
- A source that holds no draft for the site is refused, naming that as the reason, and the
  destination is untouched.
- A source that lists an asset but cannot produce its bytes is refused rather than copied as an
  empty asset, which would bake the source's inconsistency into the destination as real content.

## Verification

Copy a site between two filesystem-free stores and confirm the destination holds the same
definition, page names and asset bytes, and that the summary names them. Copy the same site into
the cloud store and confirm the same. Attempt a copy into a destination that does not hold the
site and observe the refusal with the destination named, and the destination still holding
nothing. Attempt a copy from a source with no draft and observe the refusal. Finally, copy a
multi-page site and confirm every page arrived, none partially.

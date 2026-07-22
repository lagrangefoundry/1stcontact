---
uid: request-2ca9551c
id: REQ-75
type: request
title: 'Overlay wordmark: anchor positioned wordmark to the content column (track
  hero left edge across widths)'
created_by: xgd
created_at: '2026-07-18T22:43:47.221961+00:00'
updated_at: '2026-07-19T01:04:51.519200+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  priority: high
  auto_merge_back: true
  needs_review: false
  commits:
  - working_sha: 0b533d55ee310f3a4e1ad2c2054c1f077dc6a520
    reconcile_sha: null
    main_sha: null
  version: 0.0.151
---

## Goal

A positioned overlay-header wordmark placed by `--fc-x` uses a VIEWPORT-band percentage, so its left edge drifts on viewport width (6.9% -> 53/88/99px at 768/1280/1440) while section content is anchored to the centered content column (hero left = 24/88/168). At wide widths the wordmark hangs LEFT of the hero body (69px at 1440) — reads as unintentional/amateurish.

## Fix

Add `Position.anchor: 'band' | 'column'` (default 'band' = current behavior). When 'column', horizontal placement anchors to the centered content column:
`left: calc(max(0px, (100% - var(--container-6xl)) / 2) + var(--fc-inset, inset))`
which reproduces the hero's container-relative left edge (24/88/168) at EVERY width, so the wordmark tracks the hero. Vertical (`--fc-y`) and z stay band-relative. `inset` reuses the hero's contentInset token scale (sm/md/lg -> space-4/6/8) so the wordmark locks to the hero's gutter.

## Why (empirical)

Measured: header__inner and hero__inner are IDENTICAL containers (maxWidth 1152, margin 64@1280/144@1440). The ONLY divergence is the wordmark being lifted out via absolute `left: 6.9%` (viewport). Anchoring it to the same column it already lives in makes it track — a general capability (any positioned layer child can anchor to the column), not a bespoke tweak.

REQ-52 (positioned wordmark) generalization.
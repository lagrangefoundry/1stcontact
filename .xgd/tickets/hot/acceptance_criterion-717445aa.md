---
uid: acceptance_criterion-717445aa
id: AC-881
type: acceptance_criterion
title: A texture whose colour is fully transparent paints nothing at rest and is drawn
  only under the cursor, so a band can carry a texture that exists only where the
  reader is pointing
created_by: xgd
created_at: '2026-08-06T18:09:20.935714+00:00'
updated_at: '2026-08-09T05:41:27.728170+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-d2b5cb1c
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
A node whose texture is declared in a fully transparent colour presents a flat
surface at rest — sampling the node with no pointer on the page finds no trace of
the texture anywhere — while the same node, under a pointer, presents that
texture drawn in the accent colour inside the region around the cursor.

The texture therefore exists only where the reader is pointing. This follows from
the accent substituting the texture's colour and keeping its geometry, and is a
behaviour a published page depends on: a page presenting a plain band that grows a
texture under the cursor must keep doing so.

## Verification
Render a page whose node carries a fully transparent texture plus a pointer
accent. With no pointer, sample the node across its area and assert every sample
matches its flat fill. Drive a pointer over it and assert accent-coloured texture
is presented in a bounded region around the cursor. Assert the same page with the
accent removed presents nothing under a pointer either, confirming the texture
itself is genuinely invisible.
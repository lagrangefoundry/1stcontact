---
uid: acceptance_criterion-a2c7925e
id: AC-702
type: acceptance_criterion
title: Capability client behaviour ships as one page-referenced asset
created_by: xgd
created_at: '2026-07-22T19:54:48.716204+00:00'
updated_at: '2026-07-22T20:04:00.315829+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-179b8c06
  kind: behavior
  regression_only: false
---

## Criterion
When a generated site includes at least one capability that ships client
behaviour, the build emits a single client-behaviour asset that folds every such
capability's vetted client code, and each rendered page references it exactly
once as a module script — so the carousel autoplay/loop and the contact-form
JSON-fetch enhancement actually run in the browser (the earlier dev-path island
scripts that silently 404'd are gone). When no capability in the build ships
client behaviour, neither the asset nor the script reference is emitted.

## Verification
Generate a site containing the survivor capabilities and assert exactly one
client-behaviour asset is written, containing both capabilities' client code, and
that each page head references it once as a `type="module"` script. Generate a
build whose catalog ships no client behaviour and assert no asset and no script
reference are produced. Confirm the contact-form enhancement and carousel
autoplay behaviours are present in the shipped asset (not lost to a 404).
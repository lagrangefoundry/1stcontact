---
uid: acceptance_criterion-a2c7925e
id: AC-702
type: acceptance_criterion
title: Behavior client behaviour ships as one page-referenced asset
created_by: xgd
created_at: '2026-07-22T19:54:48.716204+00:00'
updated_at: '2026-08-09T05:40:29.492578+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-179b8c06
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
When a generated site includes at least one behavior module that ships client
behaviour, the build emits a single client-behaviour asset that folds every such
behavior's vetted client code, and each rendered page references it exactly
once as a module script — so the carousel autoplay/loop and the contact-form
JSON-fetch enhancement actually run in the browser (the earlier dev-path island
scripts that silently 404'd are gone). When no behavior module in the build ships
client behaviour, neither the asset nor the script reference is emitted.

**The emitted asset is named `capabilities.js` and the page reference is
`./capabilities.js` — deliberately unchanged by the REQ-87 rename.** It is a
plural bundle-output filename, not the renamed type or its discriminant, and
renaming it would break the page reference. A later reader must not treat this
filename as missed rename residue.

## Verification
Generate a site containing the survivor behavior modules and assert exactly one
client-behaviour asset is written, containing both behaviors' client code, and
that each page head references it once as a `type="module"` script. Assert the
emitted filename and the page reference are both `capabilities.js` / 
`./capabilities.js`. Generate a build whose catalog ships no client behaviour and
assert no asset and no script reference are produced. Confirm the contact-form
enhancement and carousel autoplay behaviours are present in the shipped asset
(not lost to a 404).
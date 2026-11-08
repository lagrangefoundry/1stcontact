---
uid: acceptance_criterion-a2c7925e
id: AC-702
type: acceptance_criterion
title: Behavior client behaviour ships as one page-referenced asset that parses as
  an ES module
created_by: xgd
created_at: '2026-07-22T19:54:48.716204+00:00'
updated_at: '2026-11-08T21:32:27.977449+00:00'
completed_at: null
last_field_updated: title
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

**The shipped asset is a valid ES module, with every behavior scoped apart from
the others (BUG-75).** The asset as shipped parses and loads as an ES module.
This is shown by actually loading it as a module, not by matching patterns in its
text. Inside the asset, each behavior's client code sits in its own block, in
catalog order. Its `export` keywords are stripped, because `export` is not legal
inside a block and nothing imports the asset: every behavior wires itself up when
the DOM is ready. Each block is preceded by that behavior's
`/* behavior: <id> */` marker, so the asset stays readable and each part can be
traced to its behavior. A check that the asset is fresh (its bytes match its
sources) is not enough: the asset must also be valid.

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

For validity: load the shipped asset as an ES module and fail if it does not
parse. Assert that every behavior contributing client code shows up as a
`/* behavior: <id> */` marker followed by its own block, in catalog order, and
that the composed asset contains no statement-leading `export`.

**On the no-client-behaviour arm.** The shipped render path takes its catalog
from a static import and accepts no catalog or resolver injection, so the only
way to reach the empty-catalog branch is to **substitute the framework catalog
module** for that arm — `getModuleClientJs` returning `''` behind the same
`@1stcontact/framework/worker` entry point `render.ts` imports. That substitution
is the arm's premise, not a shortcut around the code under test: the render
pipeline, the CLI commands, and the filesystem are all real, and the positive arm
guards against vacuity by asserting the real catalog does ship client behaviour.
Should the render path ever gain a catalog/resolver seam of the shape
`assertModuleConforms` uses, this arm should be rewritten to drive it and the
substitution dropped.

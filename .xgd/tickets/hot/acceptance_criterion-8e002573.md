---
uid: acceptance_criterion-8e002573
id: AC-888
type: acceptance_criterion
title: 'A rendered snapshot is relocatable: asset references are emitted document-relative'
created_by: xgd
created_at: '2026-08-06T18:27:07.370627+00:00'
updated_at: '2026-08-08T00:43:50.708067+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-d0a8cfad
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
A rendered snapshot is **relocatable**: the same bytes serve correctly from a host
root and from any path prefix, so where a site is served is not baked into what
was rendered.

Every root-relative reference a site declares is emitted **document-relative** —
relative to the snapshot the page sits in, not to the serving host's root — and the
rule is the same one at every place a URL reaches the browser: the `url()` values
in the stylesheet (fonts, background images, texture masks), an image's source, and
a link's target. The referenced assets ship inside the snapshot alongside the pages
that reference them.

**The authored face does not change.** A site definition keeps declaring its assets
root-relatively (`/assets/…`); only the emitted bytes are relative. The renderer
takes no base-path or host configuration — a configured base would put the serving
location back into the artifact, which is exactly what relocatability removes.

The rewrite happens **after** the safety checks at each sink, so it can reshape a
value already judged safe but can never admit one that was not.

## Verification
Render a real multi-asset site to a directory and inspect the emitted output: the
font faces and grid images appear as `assets/…`, and neither the page nor the
stylesheet carries a root-absolute `url()`, `src` or `href`; the referenced assets
exist in the rendered directory. Then serve that directory over HTTP from a deep
path prefix (not the host root), resolve every non-fragment, non-remote reference
the way a browser would — against the URL of the document carrying it — and fetch
each one, asserting 200 for all of them and that a non-trivial number were checked.
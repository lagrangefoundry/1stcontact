---
uid: acceptance_criterion-364de809
id: AC-1607
type: acceptance_criterion
title: Offline re-extract resolves the document's font references to the bundle's
  mirrored faces
created_by: martin-github@westhead.me
created_at: '2026-09-09T23:47:58.689041+00:00'
updated_at: '2026-09-10T00:56:51.802603+00:00'
completed_at: null
last_field_updated: uat_coverage
status: pending
fields:
  story_uid: story-d5de22a5
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
Re-extracting a captured bundle **offline** — served from the bundle's own mirrored
`rendered.html` with no access to the live site — rewrites every absolute subresource
URL whose basename the bundle mirrored to the bundle's own copy, so the intended
`@font-face` files load from the mirror rather than being fetched from an origin the
loopback server cannot reach.

This is the capture-side precondition for the text axes being about the reference's
typography at all. Without the rewrite no intended face loads: every glyph metric in
the re-extract is measured against the **fallback** face and `fontLoaded:false` is
persisted across the manifest. That is not a slow-font artifact but a wrong
measurement of every text axis at once — the rendered-text extent, the typography
treatment axes, and the fontLoad signal AC-715 reads are all taken off the wrong
face.

## Verification
Re-extract, with the network unavailable, a bundle whose `rendered.html` references a
webfont by absolute cross-origin URL and which mirrors that font file under its own
assets. Assert the runs report `fontLoaded: true`; assert the captured font family is
the intended face rather than the fallback; and assert the glyph extents match those
of the same page's online extract within the rendered-text-extent ratio tolerance.
Assert a bundle that mirrors no matching asset is served unchanged (no rewrite
fabricated for a path the bundle does not carry).